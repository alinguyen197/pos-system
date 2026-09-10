<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Select from 'primevue/select'
import { fetchMasterCodes } from '@/api/masterCode.api'
import { fetchIngredients } from '@/api/ingredient.api'
import { createProduct } from '@/api/product.api'
import { uploadImage } from '@/api/upload.api'
import { useAppToast } from '@/composables/useAppToast'
import { getUnitConversionFactor, COMMON_UNITS } from '@/utils/unitConversion'

const router = useRouter()
const { showSuccess, showWarning } = useAppToast()

const productName = ref('')
const productCode = ref('')
const sellingPrice = ref(35000)
const category = ref<string>('Cà phê')
const unit = ref('ly')
const isActiveStatus = ref(true)
const isCustomCategory = ref(false)
const isSubmitting = ref(false)
const formError = ref('')

// Image Upload State
const fileInputRef = ref<HTMLInputElement | null>(null)
const previewImageUrl = ref('')
const selectedFileName = ref('')

const triggerFileSelect = () => {
  fileInputRef.value?.click()
}

const onFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    if (file.size > 5 * 1024 * 1024) {
      showWarning('Dung lượng tệp vượt quá 5MB')
      return
    }
    selectedFileName.value = file.name
    const reader = new FileReader()
    reader.onload = (e) => {
      previewImageUrl.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const removeImage = () => {
  previewImageUrl.value = ''
  selectedFileName.value = ''
  if (fileInputRef.value) fileInputRef.value.value = ''
}

const categoryOptions = ref<{ code: string; label: string }[]>([
  { code: 'Cà phê', label: 'Cà phê' },
  { code: 'Trà', label: 'Trà' },
  { code: 'Bánh ngọt', label: 'Bánh ngọt' },
])

const categoryStringList = computed(() => {
  return categoryOptions.value.map((c) => c.label)
})

const availableIngredients = ref<{ id: string; dbId?: number; name: string; unitCost: number; unit: string }[]>([])

const loadData = async () => {
  try {
    const [categoriesData, ingredientsData] = await Promise.all([
      fetchMasterCodes('PRODUCT_CATEGORY'),
      fetchIngredients({ pageSize: 1000 }),
    ])

    if (categoriesData.length > 0) {
      categoryOptions.value = categoriesData.map((item) => ({
        code: item.label,
        label: item.label,
      }))
    }

    const ingredientsList = ingredientsData.items || []
    if (ingredientsList.length > 0) {
      availableIngredients.value = ingredientsList.map((ing) => ({
        id: ing.id,
        dbId: ing.dbId,
        name: ing.name,
        unitCost: ing.rawCost || 0,
        unit: ing.unit,
      }))
      if (availableIngredients.value.length > 0) {
        selectedIngId.value = availableIngredients.value[0].id
      }
    }
  } catch (error) {
    console.error('Error loading product creation master data:', error)
  }
}

onMounted(() => {
  loadData()
})

const recipeItems = ref<
  Array<{
    ingredient: { id: string; dbId?: number; name: string; unitCost: number; unit: string }
    amount: number
    recipeUnit: string
  }>
>([])
const selectedIngId = ref('')
const addAmount = ref(1)

const addRecipeItem = () => {
  const ing = availableIngredients.value.find((i) => i.id === selectedIngId.value)
  if (!ing) return
  const existing = recipeItems.value.find((r) => r.ingredient.id === ing.id)
  if (existing) {
    existing.amount += addAmount.value
  } else {
    recipeItems.value.push({ ingredient: ing, amount: addAmount.value, recipeUnit: ing.unit })
  }
}

const removeRecipeItem = (index: number) => {
  recipeItems.value.splice(index, 1)
}

const getItemUnitCost = (item: { ingredient: { unitCost: number; unit: string }; recipeUnit: string }) => {
  const factor = getUnitConversionFactor(item.ingredient.unit, item.recipeUnit || item.ingredient.unit)
  return (item.ingredient.unitCost || 0) * factor
}

const getItemCost = (item: { ingredient: { unitCost: number; unit: string }; amount: number; recipeUnit: string }) => {
  return (item.amount || 0) * getItemUnitCost(item)
}

const totalCost = computed(() => {
  return recipeItems.value.reduce((sum, item) => {
    return sum + getItemCost(item)
  }, 0)
})

const estimatedProfit = computed(() => {
  return (sellingPrice.value || 0) - totalCost.value
})

const profitMargin = computed(() => {
  if (!sellingPrice.value || sellingPrice.value <= 0) return '0%'
  return ((estimatedProfit.value / sellingPrice.value) * 100).toFixed(1) + '%'
})

const formatCurrency = (val: number) => {
  return Math.round(val).toLocaleString('vi-VN') + ' ₫'
}

const saveProduct = async () => {
  if (!productName.value.trim()) {
    formError.value = 'Vui lòng nhập tên sản phẩm'
    return
  }
  if (!category.value.trim()) {
    formError.value = 'Vui lòng chọn hoặc nhập phân loại sản phẩm'
    return
  }
  if (sellingPrice.value <= 0) {
    formError.value = 'Vui lòng nhập giá bán sản phẩm lớn hơn 0'
    return
  }
  if (!recipeItems.value || recipeItems.value.length === 0) {
    formError.value = 'Vui lòng thêm ít nhất 1 nguyên liệu trong công thức BOM sản phẩm'
    return
  }
  for (const item of recipeItems.value) {
    if (!item.amount || item.amount <= 0) {
      formError.value = `Định lượng nguyên liệu "${item.ingredient?.name || 'đã chọn'}" phải lớn hơn 0`
      return
    }
  }

  try {
    isSubmitting.value = true
    formError.value = ''

    let finalImageUrl = previewImageUrl.value
    if (previewImageUrl.value.startsWith('data:image')) {
      finalImageUrl = await uploadImage({
        image: previewImageUrl.value,
        fileName: selectedFileName.value,
      })
    }

    const formattedRecipeItems = recipeItems.value.map((item) => {
      // Gửi amount gốc + unit gốc người dùng nhập — Backend sẽ tự quy đổi về đơn vị kho
      return {
        stockItemId: item.ingredient.dbId || item.ingredient.id,
        amount: item.amount,
        unit: item.recipeUnit || item.ingredient.unit,
      }
    })

    const statusStr = isActiveStatus.value ? 'Đang kinh doanh' : 'Tạm ngừng'
    const payload = {
      code: productCode.value.trim() || undefined,
      name: productName.value.trim(),
      category: category.value.trim(),
      sellingPrice: sellingPrice.value,
      costPrice: totalCost.value,
      unit: unit.value,
      status: statusStr,
      imageUrl: finalImageUrl || undefined,
      recipeItems: formattedRecipeItems,
    }

    await createProduct(payload)
    showSuccess(`Đã tạo sản phẩm "${productName.value.trim()}" thành công!`)
    router.push('/products')
  } catch (error: any) {
    console.error('Error creating product:', error)
    if (error && error.errors && Array.isArray(error.errors)) {
      error.errors.forEach((e: any) => {
        if (e.message) formError.value = e.message
      })
    } else {
      const msg = error?.message || error?.response?.data?.message || 'Lỗi khi tạo sản phẩm'
      formError.value = msg
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="product-create-page flex-1 min-h-0 overflow-y-auto pr-2 flex flex-col gap-6">
    <!-- Action Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#e9e0e0]">
      <div>
        <h1 class="text-2xl font-bold font-display text-[#1e1b1b]">Thêm sản phẩm & Tính Cost 3D</h1>
        <p class="text-xs text-[#42493d] mt-1 font-medium">Khai báo thông tin món và cấu hình định mức nguyên liệu (BOM)</p>
      </div>
      <div class="flex items-center gap-3">
        <button
          @click="router.back()"
          type="button"
          class="h-10 px-4 bg-[#f5eceb] hover:bg-[#efe6e6] text-[#42493d] font-semibold text-xs rounded-xl border border-[#c1c9b9]/60 transition cursor-pointer"
        >
          Hủy bỏ
        </button>
        <button
          @click="saveProduct"
          :disabled="isSubmitting"
          type="button"
          class="h-10 px-5 bg-[#8d6749] hover:bg-[#6e4e34] text-white font-semibold text-xs rounded-xl shadow transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <span v-if="isSubmitting" class="material-symbols-outlined text-lg animate-spin">refresh</span>
          <span v-else class="material-symbols-outlined text-lg">check</span>
          <span>{{ isSubmitting ? 'Đang lưu...' : 'Lưu sản phẩm' }}</span>
        </button>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="formError" class="p-3 bg-[#ffdad6] text-[#ba1a1a] rounded-xl text-xs font-semibold">
      {{ formError }}
    </div>

    <!-- Bento Grid Section 1: Basic Details & Image Upload -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Upload Card -->
      <div
        @click="triggerFileSelect"
        class="bg-white rounded-2xl p-6 border border-[#e9e0e0] shadow-sm flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#8d6749] transition group relative overflow-hidden min-h-[220px]"
      >
        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          @change="onFileSelected"
          class="hidden"
        />

        <template v-if="previewImageUrl">
          <img :src="previewImageUrl" alt="Preview sản phẩm" class="w-full h-44 object-cover rounded-xl mb-2" />
          <div class="flex items-center gap-2 mt-1">
            <span class="text-xs text-[#8d6749] font-bold">Đổi ảnh khác</span>
            <button
              @click.stop="removeImage"
              type="button"
              class="text-xs text-[#ba1a1a] hover:underline font-bold"
            >
              Xóa ảnh
            </button>
          </div>
        </template>

        <template v-else>
          <div class="w-16 h-16 rounded-2xl bg-[#f5eceb] text-[#8d6749] flex items-center justify-center mb-3 group-hover:scale-110 transition">
            <span class="material-symbols-outlined text-3xl">add_a_photo</span>
          </div>
          <h3 class="text-sm font-bold text-[#1e1b1b]">Tải ảnh sản phẩm</h3>
          <p class="text-xs text-[#72796c] mt-1">Nhấp hoặc kéo thả tệp hình ảnh (PNG, JPG max 5MB)</p>
        </template>
      </div>

      <!-- General Info Form Card -->
      <div class="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#e9e0e0] shadow-sm flex flex-col gap-4">
        <h2 class="text-base font-bold font-display text-[#1e1b1b] border-b border-[#e9e0e0] pb-3">Thông tin cơ bản</h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-[#1e1b1b] uppercase tracking-wider mb-1.5">Tên sản phẩm *</label>
            <input
              v-model="productName"
              type="text"
              class="w-full h-10 px-3.5 bg-white border border-[#c1c9b9]/70 rounded-xl text-xs font-medium text-[#1e1b1b] outline-none focus:border-[#8d6749] focus:ring-2 focus:ring-[#8d6749]/20"
              placeholder="VD: Cà phê Sữa Đá"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-[#1e1b1b] uppercase tracking-wider mb-1.5">Giá bán (VNĐ) *</label>
            <input
              v-model.number="sellingPrice"
              type="number"
              class="w-full h-10 px-3.5 bg-white border border-[#c1c9b9]/70 rounded-xl text-xs font-medium text-[#1e1b1b] outline-none focus:border-[#8d6749] focus:ring-2 focus:ring-[#8d6749]/20"
            />
          </div>

          <!-- Category (Searchable Dropdown with Custom Input Toggle) -->
          <div>
            <div class="flex justify-between items-center mb-1.5">
              <label class="block text-xs font-semibold text-[#1e1b1b] uppercase tracking-wider">Danh mục *</label>
              <button
                type="button"
                @click="isCustomCategory = !isCustomCategory"
                class="text-[10px] text-[#8d6749] underline font-semibold cursor-pointer"
              >
                {{ isCustomCategory ? '← Chọn từ danh sách' : '+ Nhập danh mục mới' }}
              </button>
            </div>
            <input
              v-if="isCustomCategory"
              v-model="category"
              type="text"
              placeholder="Nhập tên danh mục mới..."
              class="w-full h-10 px-3.5 bg-white border border-[#8d6749] rounded-xl text-xs font-medium text-[#1e1b1b] outline-none focus:ring-2 focus:ring-[#8d6749]/20"
            />
            <Select
              v-else
              v-model="category"
              :options="categoryStringList"
              editable
              filter
              placeholder="Tìm & chọn danh mục..."
              class="w-full h-10 text-xs font-medium"
            />
          </div>

          <div class="sm:col-span-2 flex items-center justify-between pt-2 border-t border-[#e9e0e0]">
            <span class="text-xs font-bold text-[#1e1b1b]">Trạng thái kinh doanh:</span>
            <button
              type="button"
              @click="isActiveStatus = !isActiveStatus"
              class="h-9 px-3.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center"
              :class="isActiveStatus ? 'bg-[#c9edb5]/60 text-[#326824]' : 'bg-[#ffdad6] text-[#ba1a1a]'"
            >
              {{ isActiveStatus ? '✓ Đang kinh doanh' : '✕ Tạm ngừng' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Bento Grid Section 2: BOM Costing & 3D Visual Simulation -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- BOM Costing Form -->
      <div class="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#e9e0e0] shadow-sm flex flex-col gap-4">
        <div class="flex justify-between items-center border-b border-[#e9e0e0] pb-3">
          <h2 class="text-base font-bold font-display text-[#1e1b1b]">Định mức nguyên liệu (BOM)</h2>
          <span class="text-xs font-semibold text-[#326824] bg-[#c9edb5]/40 px-3 py-1 rounded-lg">Tính Cost tự động</span>
        </div>

        <!-- Add Ingredient Row (Searchable Select) -->
        <div class="flex flex-col sm:flex-row gap-3">
          <Select
            v-model="selectedIngId"
            :options="availableIngredients"
            optionLabel="name"
            optionValue="id"
            filter
            placeholder="Tìm & chọn nguyên liệu từ kho..."
            class="flex-1 h-10 text-xs font-medium"
          />
          <input
            v-model.number="addAmount"
            type="number"
            placeholder="Số lượng"
            class="w-full sm:w-28 h-10 px-3.5 bg-white border border-[#c1c9b9]/70 rounded-xl text-xs font-medium text-[#1e1b1b] outline-none focus:border-[#8d6749] focus:ring-2 focus:ring-[#8d6749]/20"
          />
          <button
            @click="addRecipeItem"
            type="button"
            class="h-10 px-4 bg-[#8d6749] hover:bg-[#6e4e34] text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1 shrink-0 cursor-pointer shadow-sm"
          >
            <span class="material-symbols-outlined text-base">add</span>
            <span>Thêm NL</span>
          </button>
        </div>

        <!-- Recipe Items Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-[#1e1b1b]">
            <thead class="bg-[#fbf1f1] text-[#42493d] font-semibold uppercase tracking-wider border-b border-[#e9e0e0]">
              <tr>
                <th class="py-3 px-4">Tên nguyên liệu</th>
                <th class="py-3 px-4 text-center">Định lượng</th>
                <th class="py-3 px-4 text-center">ĐVT BOM</th>
                <th class="py-3 px-4 text-center">Đơn giá quy đổi</th>
                <th class="py-3 px-4 text-right">Thành tiền</th>
                <th class="py-3 px-4 text-center">Xóa</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#f5eceb]">
              <tr v-for="(item, idx) in recipeItems" :key="idx" class="hover:bg-[#fbf1f1]/50 transition">
                <td class="py-3 px-4 font-semibold text-[#1e1b1b]">
                  <div>{{ item.ingredient.name }}</div>
                  <div class="text-[10px] text-[#72796c] font-medium">Kho: {{ formatCurrency(item.ingredient.unitCost) }} / {{ item.ingredient.unit }}</div>
                </td>
                <td class="py-3 px-4 text-center">
                  <input
                    v-model.number="item.amount"
                    type="number"
                    min="0"
                    step="any"
                    class="w-20 px-2 py-1 border border-[#c1c9b9]/70 rounded-lg text-center font-bold text-xs outline-none focus:border-[#8d6749]"
                  />
                </td>
                <td class="py-3 px-4 text-center">
                  <Select
                    v-model="item.recipeUnit"
                    :options="COMMON_UNITS"
                    editable
                    filter
                    class="w-24 text-xs font-semibold"
                  />
                </td>
                <td class="py-3 px-4 text-center font-mono text-[11px] text-[#72796c]">
                  {{ formatCurrency(getItemUnitCost(item)) }} / {{ item.recipeUnit }}
                </td>
                <td class="py-3 px-4 text-right font-bold text-[#1e1b1b]">{{ formatCurrency(getItemCost(item)) }}</td>
                <td class="py-3 px-4 text-center">
                  <button @click="removeRecipeItem(idx)" type="button" class="p-1 text-[#ba1a1a] hover:bg-[#ffdad6] rounded-md transition">
                    <span class="material-symbols-outlined text-base">delete</span>
                  </button>
                </td>
              </tr>
              <tr v-if="recipeItems.length === 0">
                <td colspan="6" class="py-4 text-center text-[#72796c] italic">Chưa có nguyên liệu nào trong định mức BOM</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Cost & Margin Footer -->
        <div class="mt-2 p-4 bg-[#f5eceb] rounded-xl flex justify-between items-center border border-[#e9e0e0]">
          <div>
            <span class="text-[11px] text-[#72796c] uppercase font-bold tracking-wider block">Tổng giá vốn (Cost NVL)</span>
            <span class="text-xl font-bold font-display text-[#326824]">{{ formatCurrency(totalCost) }}</span>
          </div>
          <div class="text-right">
            <span class="text-[11px] text-[#72796c] uppercase font-bold tracking-wider block">Biên lợi nhuận gộp</span>
            <span class="text-xl font-bold font-display text-[#326824]">{{ profitMargin }}</span>
          </div>
        </div>
      </div>

      <!-- 3D Simulation Card -->
      <div class="bg-gradient-to-b from-[#8d6749]/10 to-[#326824]/10 rounded-2xl p-6 border border-[#e9e0e0] shadow-sm flex flex-col justify-between">
        <div class="flex items-center gap-2 mb-4">
          <span class="material-symbols-outlined text-[#8d6749] text-xl animate-spin">sync</span>
          <h3 class="text-base font-bold font-display text-[#1e1b1b]">Mô phỏng 3D Ly đồ uống</h3>
        </div>

        <!-- Simulated Cup Layer Stack -->
        <div class="flex-1 flex flex-col items-center justify-center my-6">
          <div class="w-36 h-52 border-4 border-white/80 bg-white/40 backdrop-blur-md rounded-b-3xl shadow-xl p-2 flex flex-col justify-end overflow-hidden relative">
            <div class="w-full h-10 bg-[#326824]/80 text-white text-[10px] font-bold flex items-center justify-center">Lớp Kem/Bọt</div>
            <div class="w-full h-24 bg-[#8d6749] text-white text-[10px] font-bold flex items-center justify-center">Cà phê (Robusta)</div>
            <div class="w-full h-12 bg-amber-100 text-[#8d6749] text-[10px] font-bold flex items-center justify-center border-t border-white/40">Sữa đặc</div>
          </div>
        </div>

        <!-- Info Badges -->
        <div class="grid grid-cols-2 gap-3 text-center">
          <div class="p-3 bg-white rounded-xl border border-[#e9e0e0] shadow-sm">
            <span class="text-[10px] text-[#72796c] uppercase font-bold block">Thể tích ly</span>
            <span class="text-sm font-bold text-[#1e1b1b]">350 ml</span>
          </div>
          <div class="p-3 bg-white rounded-xl border border-[#e9e0e0] shadow-sm">
            <span class="text-[10px] text-[#72796c] uppercase font-bold block">Độ ngọt</span>
            <span class="text-sm font-bold text-[#1e1b1b]">Tiêu chuẩn</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./ProductCreate.scss"></style>
