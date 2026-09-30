<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import Select from 'primevue/select'
import UnsavedChangesDialog from '@/components/common/UnsavedChangesDialog.vue'
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
const category = ref<string>('Mì trộn')
const unit = ref('phần')
const isActiveStatus = ref(true)
const isCustomCategory = ref(false)
const isSubmitting = ref(false)
const formError = ref('')

const showLeaveConfirmDialog = ref(false)
let leaveNext: any = null

onBeforeRouteLeave((to, from, next) => {
  const isDirty =
    productName.value.trim() !== '' || productCode.value.trim() !== ''
  if (isDirty) {
    showLeaveConfirmDialog.value = true
    leaveNext = next
  } else {
    next()
  }
})

const confirmLeave = () => {
  showLeaveConfirmDialog.value = false
  if (leaveNext) {
    leaveNext(true)
    leaveNext = null
  }
}

const cancelLeave = () => {
  showLeaveConfirmDialog.value = false
  if (leaveNext) {
    leaveNext(false)
    leaveNext = null
  }
}

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

const availableIngredients = ref<
  { id: string; dbId?: number; name: string; unitCost: number; unit: string }[]
>([])

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

    // Check for clone data
    const cloneDataStr = sessionStorage.getItem('cloneProduct')
    if (cloneDataStr) {
      try {
        const cloneData = JSON.parse(cloneDataStr)
        productName.value = cloneData.name + ' - Copy'
        sellingPrice.value = cloneData.rawPrice || 0
        category.value = cloneData.category || 'Mì trộn'
        unit.value = cloneData.unit || 'phần'
        isActiveStatus.value = cloneData.status === 'Đang kinh doanh'
        previewImageUrl.value = cloneData.img || ''

        if (cloneData.recipeItems && Array.isArray(cloneData.recipeItems)) {
          recipeItems.value = cloneData.recipeItems.map((r: any) => {
            const stockIng = availableIngredients.value.find(
              (ing) =>
                String(ing.id) === String(r.stockItemId) ||
                String(ing.dbId) === String(r.stockItemId),
            )
            return {
              ingredient: stockIng || {
                id: r.stockItemId,
                dbId: r.stockItemId,
                name: r.ingredientName || 'Unknown Ingredient',
                unitCost: r.unitCost || 0,
                unit: r.stockUnit || r.unit || 'g',
              },
              amount: r.amount,
              recipeUnit: r.unit || r.stockUnit || 'g',
            }
          })
        }
      } catch (e) {
        console.error('Error parsing clone data', e)
      } finally {
        sessionStorage.removeItem('cloneProduct')
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
    ingredient: {
      id: string
      dbId?: number
      name: string
      unitCost: number
      unit: string
    }
    amount: number
    recipeUnit: string
  }>
>([])
const selectedIngId = ref('')
const addAmount = ref(1)

const addRecipeItem = () => {
  const ing = availableIngredients.value.find(
    (i) => String(i.id) === String(selectedIngId.value),
  )
  if (!ing) return
  const existing = recipeItems.value.find(
    (r) => String(r.ingredient.id) === String(ing.id),
  )
  if (existing) {
    existing.amount += addAmount.value
  } else {
    recipeItems.value.push({
      ingredient: ing,
      amount: addAmount.value,
      recipeUnit: ing.unit,
    })
  }
}

const removeRecipeItem = (index: number) => {
  recipeItems.value.splice(index, 1)
}

const getItemUnitCost = (item: {
  ingredient: { unitCost: number; unit: string }
  recipeUnit: string
}) => {
  const factor = getUnitConversionFactor(
    item.ingredient.unit,
    item.recipeUnit || item.ingredient.unit,
  )
  return (item.ingredient.unitCost || 0) * factor
}

const getItemCost = (item: {
  ingredient: { unitCost: number; unit: string }
  amount: number
  recipeUnit: string
}) => {
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
  return Math.round(val || 0).toLocaleString('vi-VN') + ' ₫'
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
    formError.value =
      'Vui lòng thêm ít nhất 1 nguyên liệu trong công thức BOM sản phẩm'
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
      const msg =
        error?.message ||
        error?.response?.data?.message ||
        'Lỗi khi tạo sản phẩm'
      formError.value = msg
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="product-create-page flex w-full flex-col gap-6 pb-16">
    <!-- Action Header -->
    <div
      class="flex flex-col justify-between gap-4 border-b border-[#E2D7CC] pb-2 sm:flex-row sm:items-center"
    >
      <div>
        <h1 class="font-display text-2xl font-bold text-[#1e1b1b]">
          Thêm sản phẩm & Tính Cost 3D
        </h1>
        <p class="mt-1 text-xs font-medium text-[#42493d]">
          Khai báo thông tin món và cấu hình định mức nguyên liệu (BOM)
        </p>
      </div>
      <div class="flex items-center gap-3">
        <button
          @click="router.back()"
          type="button"
          class="h-10 cursor-pointer rounded-xl border border-[#c1c9b9]/60 bg-[#F2ECE4] px-4 text-xs font-semibold text-[#42493d] transition hover:bg-[#E8DFD5]"
        >
          Hủy bỏ
        </button>
        <button
          @click="saveProduct"
          :disabled="isSubmitting"
          type="button"
          class="flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-[#8E3E2F] px-5 text-xs font-semibold text-white shadow transition hover:bg-[#6E281C] disabled:opacity-50"
        >
          <span
            v-if="isSubmitting"
            class="material-symbols-outlined animate-spin text-lg"
            >refresh</span
          >
          <span v-else class="material-symbols-outlined text-lg">check</span>
          <span>{{ isSubmitting ? 'Đang lưu...' : 'Lưu sản phẩm' }}</span>
        </button>
      </div>
    </div>

    <!-- Error Alert -->
    <div
      v-if="formError"
      class="rounded-xl bg-[#ffdad6] p-3 text-xs font-semibold text-[#ba1a1a]"
    >
      {{ formError }}
    </div>

    <!-- Bento Grid Section 1: Basic Details & Image Upload -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- Upload Card -->
      <div
        @click="triggerFileSelect"
        class="group relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-[#E2D7CC] bg-white p-6 text-center shadow-sm transition hover:border-[#8E3E2F]"
      >
        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          @change="onFileSelected"
          class="hidden"
        />

        <template v-if="previewImageUrl">
          <img
            :src="previewImageUrl"
            alt="Preview sản phẩm"
            class="mb-2 h-44 w-full rounded-xl object-cover"
          />
          <div class="mt-1 flex items-center gap-2">
            <span class="text-xs font-bold text-[#8E3E2F]">Đổi ảnh khác</span>
            <button
              @click.stop="removeImage"
              type="button"
              class="text-xs font-bold text-[#ba1a1a] hover:underline"
            >
              Xóa ảnh
            </button>
          </div>
        </template>

        <template v-else>
          <div
            class="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F2ECE4] text-[#8E3E2F] transition group-hover:scale-110"
          >
            <span class="material-symbols-outlined text-3xl">add_a_photo</span>
          </div>
          <h3 class="text-sm font-bold text-[#1e1b1b]">Tải ảnh sản phẩm</h3>
          <p class="mt-1 text-xs text-[#72796c]">
            Nhấp hoặc kéo thả tệp hình ảnh (PNG, JPG max 5MB)
          </p>
        </template>
      </div>

      <!-- General Info Form Card -->
      <div
        class="flex flex-col gap-4 rounded-2xl border border-[#E2D7CC] bg-white p-6 shadow-sm lg:col-span-2"
      >
        <h2
          class="font-display border-b border-[#E2D7CC] pb-3 text-base font-bold text-[#1e1b1b]"
        >
          Thông tin cơ bản
        </h2>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="sm:col-span-2">
            <label
              class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#1e1b1b]"
              >Tên sản phẩm *</label
            >
            <input
              v-model="productName"
              type="text"
              class="h-10 w-full rounded-xl border border-[#c1c9b9]/70 bg-white px-3.5 text-xs font-medium text-[#1e1b1b] outline-none focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20"
              placeholder="VD: Mì Trộn Sa Tế Đặc Biệt"
            />
          </div>

          <div>
            <label
              class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#1e1b1b]"
              >Giá bán (VNĐ) *</label
            >
            <input
              v-model.number="sellingPrice"
              type="number"
              class="h-10 w-full rounded-xl border border-[#c1c9b9]/70 bg-white px-3.5 text-xs font-medium text-[#1e1b1b] outline-none focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20"
            />
          </div>

          <!-- Category (Searchable Dropdown with Custom Input Toggle) -->
          <div>
            <div class="mb-1.5 flex items-center justify-between">
              <label
                class="block text-xs font-semibold uppercase tracking-wider text-[#1e1b1b]"
                >Danh mục *</label
              >
              <button
                type="button"
                @click="isCustomCategory = !isCustomCategory"
                class="cursor-pointer text-[10px] font-semibold text-[#8E3E2F] underline"
              >
                {{
                  isCustomCategory
                    ? '← Chọn từ danh sách'
                    : '+ Nhập danh mục mới'
                }}
              </button>
            </div>
            <input
              v-if="isCustomCategory"
              v-model="category"
              type="text"
              placeholder="Nhập tên danh mục mới..."
              class="h-10 w-full rounded-xl border border-[#8E3E2F] bg-white px-3.5 text-xs font-medium text-[#1e1b1b] outline-none focus:ring-2 focus:ring-[#8E3E2F]/20"
            />
            <Select
              v-else
              v-model="category"
              :options="categoryStringList"
              editable
              filter
              placeholder="Tìm & chọn danh mục..."
              class="h-10 w-full text-xs font-medium"
            />
          </div>

          <div
            class="flex items-center justify-between border-t border-[#E2D7CC] pt-2 sm:col-span-2"
          >
            <span class="text-xs font-bold text-[#1e1b1b]"
              >Trạng thái kinh doanh:</span
            >
            <button
              type="button"
              @click="isActiveStatus = !isActiveStatus"
              class="flex h-9 cursor-pointer items-center rounded-xl px-3.5 text-xs font-bold transition"
              :class="
                isActiveStatus
                  ? 'bg-[#c9edb5]/60 text-[#326824]'
                  : 'bg-[#ffdad6] text-[#ba1a1a]'
              "
            >
              {{ isActiveStatus ? '✓ Đang kinh doanh' : '✕ Tạm ngừng' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Bento Grid Section 2: BOM Costing & 3D Visual Simulation -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- BOM Costing Form -->
      <div
        class="flex flex-col gap-4 rounded-2xl border border-[#E2D7CC] bg-white p-6 shadow-sm lg:col-span-2"
      >
        <div
          class="flex items-center justify-between border-b border-[#E2D7CC] pb-3"
        >
          <h2 class="font-display text-base font-bold text-[#1e1b1b]">
            Định mức nguyên liệu (BOM)
          </h2>
          <span
            class="rounded-lg bg-[#c9edb5]/40 px-3 py-1 text-xs font-semibold text-[#326824]"
            >Tính Cost tự động</span
          >
        </div>

        <!-- Add Ingredient Row (Searchable Select) -->
        <div class="flex flex-col gap-3 sm:flex-row">
          <Select
            v-model="selectedIngId"
            :options="availableIngredients"
            optionLabel="name"
            optionValue="id"
            filter
            placeholder="Tìm & chọn nguyên liệu từ kho..."
            class="h-10 flex-1 text-xs font-medium"
          />
          <input
            v-model.number="addAmount"
            type="number"
            placeholder="Số lượng"
            class="h-10 w-full rounded-xl border border-[#c1c9b9]/70 bg-white px-3.5 text-xs font-medium text-[#1e1b1b] outline-none focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20 sm:w-28"
          />
          <button
            @click="addRecipeItem"
            type="button"
            class="flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-xl bg-[#8E3E2F] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#6E281C]"
          >
            <span class="material-symbols-outlined text-base">add</span>
            <span>Thêm NL</span>
          </button>
        </div>

        <!-- Recipe Items Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-[#1e1b1b]">
            <thead
              class="border-b border-[#E2D7CC] bg-[#F5EFE8] font-semibold uppercase tracking-wider text-[#42493d]"
            >
              <tr>
                <th class="px-4 py-3">Tên nguyên liệu</th>
                <th class="px-4 py-3 text-center">Định lượng</th>
                <th class="px-4 py-3 text-center">ĐVT BOM</th>
                <th class="px-4 py-3 text-center">Đơn giá quy đổi</th>
                <th class="px-4 py-3 text-right">Thành tiền</th>
                <th class="px-4 py-3 text-center">Xóa</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#F2ECE4]">
              <tr
                v-for="(item, idx) in recipeItems"
                :key="idx"
                class="transition hover:bg-[#F5EFE8]/50"
              >
                <td class="px-4 py-3 font-semibold text-[#1e1b1b]">
                  <div>{{ item.ingredient.name }}</div>
                  <div class="text-[10px] font-medium text-[#72796c]">
                    Kho: {{ formatCurrency(item.ingredient.unitCost) }} /
                    {{ item.ingredient.unit }}
                  </div>
                </td>
                <td class="px-4 py-3 text-center">
                  <input
                    v-model.number="item.amount"
                    type="number"
                    min="0"
                    step="any"
                    class="w-20 rounded-lg border border-[#c1c9b9]/70 px-2 py-1 text-center text-xs font-bold outline-none focus:border-[#8E3E2F]"
                  />
                </td>
                <td class="px-4 py-3 text-center">
                  <Select
                    v-model="item.recipeUnit"
                    :options="COMMON_UNITS"
                    editable
                    filter
                    class="w-24 text-xs font-semibold"
                  />
                </td>
                <td
                  class="px-4 py-3 text-center font-mono text-[11px] text-[#72796c]"
                >
                  {{ formatCurrency(getItemUnitCost(item)) }} /
                  {{ item.recipeUnit }}
                </td>
                <td class="px-4 py-3 text-right font-bold text-[#1e1b1b]">
                  {{ formatCurrency(getItemCost(item)) }}
                </td>
                <td class="px-4 py-3 text-center">
                  <button
                    @click="removeRecipeItem(idx)"
                    type="button"
                    class="rounded-md p-1 text-[#ba1a1a] transition hover:bg-[#ffdad6]"
                  >
                    <span class="material-symbols-outlined text-base"
                      >delete</span
                    >
                  </button>
                </td>
              </tr>
              <tr v-if="recipeItems.length === 0">
                <td colspan="6" class="py-4 text-center italic text-[#72796c]">
                  Chưa có nguyên liệu nào trong định mức BOM
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Cost & Margin Footer -->
        <div
          class="mt-2 flex items-center justify-between rounded-xl border border-[#E2D7CC] bg-[#F2ECE4] p-4"
        >
          <div>
            <span
              class="block text-[11px] font-bold uppercase tracking-wider text-[#72796c]"
              >Tổng giá vốn (Cost NVL)</span
            >
            <span class="font-display text-xl font-bold text-[#326824]">{{
              formatCurrency(totalCost)
            }}</span>
          </div>
          <div class="text-right">
            <span
              class="block text-[11px] font-bold uppercase tracking-wider text-[#72796c]"
              >Biên lợi nhuận gộp</span
            >
            <span class="font-display text-xl font-bold text-[#326824]">{{
              profitMargin
            }}</span>
          </div>
        </div>
      </div>

      <!-- 3D Simulation Card -->
      <div
        class="flex flex-col justify-between rounded-2xl border border-[#E2D7CC] bg-gradient-to-b from-[#8E3E2F]/10 to-[#C46D28]/10 p-6 shadow-sm"
      >
        <div class="mb-4 flex items-center gap-2">
          <span class="material-symbols-outlined text-xl text-[#8E3E2F]"
            >ramen_dining</span
          >
          <h3 class="font-display text-base font-bold text-[#1e1b1b]">
            Mô phỏng Đĩa Mì Trộn / Topping
          </h3>
        </div>

        <!-- Simulated Noodle Plate Layer Stack -->
        <div class="my-6 flex flex-1 flex-col items-center justify-center">
          <div
            class="relative flex h-44 w-48 flex-col justify-end overflow-hidden rounded-2xl border-4 border-b-8 border-white/80 border-b-[#8E3E2F]/40 bg-white/60 p-3 shadow-xl backdrop-blur-md"
          >
            <div
              class="flex h-10 w-full items-center justify-center rounded-t-lg border-b border-white/50 bg-amber-100 text-[10px] font-bold text-[#8E3E2F]"
            >
              🍳 Trứng ốp la & Hành hoa
            </div>
            <div
              class="flex h-16 w-full items-center justify-center bg-[#8E3E2F] text-[10px] font-bold text-white"
            >
              🍜 Mì trộn sốt sa tế Cô Xi
            </div>
            <div
              class="flex h-10 w-full items-center justify-center rounded-b-lg border-t border-white/30 bg-[#326824] text-[10px] font-bold text-white"
            >
              🥬 Rau cải & Topping thịt
            </div>
          </div>
        </div>

        <!-- Info Badges -->
        <div class="grid grid-cols-2 gap-3 text-center">
          <div
            class="rounded-xl border border-[#E2D7CC] bg-white p-3 shadow-sm"
          >
            <span class="block text-[10px] font-bold uppercase text-[#72796c]"
              >Khẩu phần</span
            >
            <span class="text-sm font-bold text-[#1e1b1b]">1 Phần chuẩn</span>
          </div>
          <div
            class="rounded-xl border border-[#E2D7CC] bg-white p-3 shadow-sm"
          >
            <span class="block text-[10px] font-bold uppercase text-[#72796c]"
              >Độ cay</span
            >
            <span class="text-sm font-bold text-[#1e1b1b]">Vừa / Tùy chọn</span>
          </div>
        </div>
      </div>
    </div>
    <!-- Unsaved Changes Confirm Dialog -->
    <UnsavedChangesDialog
      :visible="showLeaveConfirmDialog"
      @confirm="confirmLeave"
      @cancel="cancelLeave"
    />
  </div>
</template>

<style scoped lang="scss" src="./ProductCreate.scss"></style>
