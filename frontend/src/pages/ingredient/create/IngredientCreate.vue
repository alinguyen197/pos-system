<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Select from 'primevue/select'
import { fetchMasterCodes } from '@/api/masterCode.api'
import { createIngredient, fetchIngredients } from '@/api/ingredient.api'
import { useAppToast } from '@/composables/useAppToast'

const router = useRouter()
const { showSuccess, showError } = useAppToast()

const name = ref('')
const category = ref<string>('Cà phê hạt')
const isCustomCategory = ref(false)
const purchaseUnit = ref('kg')
const minStock = ref(5)
const initialStock = ref(0)

const isSubmitting = ref(false)
const errorMessage = ref('')
const fieldErrors = ref<Record<string, string>>({})

const categoryOptions = ref<string[]>([
  'Cà phê hạt',
  'Sữa & Kem',
  'Siro & Đường',
  'Đóng gói',
  'Gia vị',
  'Trái cây',
])

const purchaseUnits = ref(['kg', 'g', 'lít', 'ml', 'hộp', 'lon', 'chai', 'gói', 'thùng', 'bình', 'bịch', 'ly', 'cái', 'phần', 'cốc'])

const loadCategories = async () => {
  try {
    const [masterCodes, unitCodes, resIngredients] = await Promise.all([
      fetchMasterCodes('INGREDIENT_CATEGORY'),
      fetchMasterCodes('UNIT'),
      fetchIngredients(),
    ])

    if (unitCodes && unitCodes.length > 0) {
      const setUnits = new Set([...purchaseUnits.value, ...unitCodes.map((u) => u.label)])
      purchaseUnits.value = Array.from(setUnits)
    }

    const existingIngredients = resIngredients.items || []

    const set = new Set<string>([
      'Cà phê hạt',
      'Sữa & Kem',
      'Siro & Đường',
      'Đóng gói',
      'Gia vị',
      'Trái cây',
    ])

    if (masterCodes && masterCodes.length > 0) {
      masterCodes.forEach((m) => {
        if (m.label) set.add(m.label)
      })
    }

    if (existingIngredients && existingIngredients.length > 0) {
      existingIngredients.forEach((i) => {
        if (i.category) set.add(i.category)
      })
    }

    categoryOptions.value = Array.from(set)
  } catch (error) {
    console.error('Failed to load ingredient category master codes:', error)
  }
}

onMounted(() => {
  loadCategories()
})

const handleSubmit = async () => {
  fieldErrors.value = {}
  if (!name.value || !name.value.trim()) {
    errorMessage.value = 'Vui lòng nhập tên nguyên liệu'
    fieldErrors.value.name = 'Vui lòng nhập tên nguyên liệu'
    return
  }
  if (!category.value || !category.value.trim()) {
    errorMessage.value = 'Vui lòng chọn hoặc nhập phân loại kho'
    fieldErrors.value.category = 'Vui lòng chọn hoặc nhập phân loại kho'
    return
  }
  if (!purchaseUnit.value || !purchaseUnit.value.trim()) {
    errorMessage.value = 'Vui lòng chọn hoặc nhập đơn vị tính'
    fieldErrors.value.unit = 'Vui lòng chọn hoặc nhập đơn vị tính'
    return
  }
  if (minStock.value === undefined || minStock.value === null || minStock.value < 0) {
    errorMessage.value = 'Mức tồn tối thiểu phải lớn hơn hoặc bằng 0'
    fieldErrors.value.minStock = 'Mức tồn tối thiểu phải lớn hơn hoặc bằng 0'
    return
  }

  try {
    isSubmitting.value = true
    errorMessage.value = ''

    const pUnit = purchaseUnit.value.trim()

    await createIngredient({
      name: name.value.trim(),
      category: category.value.trim(),
      unit: pUnit,
      costPrice: 0,
      minStock: Number(minStock.value) || 0,
      initialStock: Number(initialStock.value) || 0,
    })

    showSuccess(`Đã thêm nguyên liệu "${name.value.trim()}" thành công!`)
    router.push('/ingredients')
  } catch (error: any) {
    console.error('Lỗi khi tạo nguyên liệu:', error)
    if (error && error.errors && Array.isArray(error.errors)) {
      error.errors.forEach((e: any) => {
        if (e.field) fieldErrors.value[e.field] = e.message
      })
    }
    const msg = error?.message || error?.response?.data?.message || 'Dữ liệu không hợp lệ.'
    errorMessage.value = msg
    showError(msg)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="ingredient-create-page flex-1 min-h-0 overflow-y-auto pr-2 flex flex-col gap-6 max-w-4xl mx-auto pb-10">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#e9e0e0]">
      <div>
        <h1 class="text-2xl font-bold font-display text-[#1e1b1b]">Thêm Nguyên liệu mới</h1>
        <p class="text-xs text-[#42493d] mt-1 font-medium">Khai báo danh mục nguyên liệu đầu vào, phân loại, đơn vị tính và định mức tồn kho</p>
      </div>
      <div class="flex items-center gap-3">
        <button
          type="button"
          @click="router.back()"
          :disabled="isSubmitting"
          class="h-10 px-4 bg-[#f5eceb] hover:bg-[#efe6e6] text-[#42493d] font-semibold text-xs rounded-xl border border-[#c1c9b9]/60 transition disabled:opacity-50 cursor-pointer"
        >
          Hủy bỏ
        </button>
        <button
          type="button"
          @click="handleSubmit"
          :disabled="isSubmitting"
          class="h-10 px-5 bg-[#8d6749] hover:bg-[#6e4e34] text-white font-semibold text-xs rounded-xl shadow transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <span v-if="!isSubmitting" class="material-symbols-outlined text-lg">check</span>
          <span v-else class="material-symbols-outlined text-lg animate-spin">refresh</span>
          <span>{{ isSubmitting ? 'Đang lưu...' : 'Lưu nguyên liệu' }}</span>
        </button>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="errorMessage" class="p-4 bg-[#ffdad6] border border-[#ba1a1a]/30 rounded-xl text-xs font-semibold text-[#ba1a1a] flex items-center gap-2">
      <span class="material-symbols-outlined text-lg">error</span>
      <span>{{ errorMessage }}</span>
    </div>

    <!-- Form Container Card -->
    <div class="bg-white rounded-2xl border border-[#e9e0e0] shadow-sm p-6 sm:p-8">
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div class="border-b border-[#e9e0e0] pb-4 flex items-center justify-between">
          <div>
            <h2 class="text-base font-bold font-display text-[#1e1b1b]">Thông tin nguyên liệu</h2>
            <p class="text-xs text-[#72796c] mt-0.5">Khai báo thông số nhận diện và đơn vị tính lưu kho</p>
          </div>
          <span class="text-[11px] font-semibold text-[#8d6749] bg-[#f5eceb] px-3 py-1 rounded-lg">Khai báo danh mục</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <!-- Name -->
          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-[#1e1b1b] uppercase tracking-wider mb-2">Tên nguyên liệu *</label>
            <input
              v-model="name"
              type="text"
              required
              placeholder="Ví dụ: Tương cà Cholimex, Sữa tươi tiệt trùng, Cà phê Robusta..."
              class="w-full h-10 px-3.5 bg-white border border-[#c1c9b9]/70 rounded-xl text-xs font-medium text-[#1e1b1b] outline-none focus:border-[#8d6749] focus:ring-2 focus:ring-[#8d6749]/20"
            />
          </div>

          <!-- Category -->
          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="block text-xs font-semibold text-[#1e1b1b] uppercase tracking-wider">Phân loại kho *</label>
              <button
                type="button"
                @click="isCustomCategory = !isCustomCategory"
                class="text-[11px] text-[#8d6749] underline hover:text-[#6e4e34] font-semibold cursor-pointer"
              >
                {{ isCustomCategory ? '← Chọn từ danh sách' : '+ Nhập phân loại mới' }}
              </button>
            </div>

            <input
              v-if="isCustomCategory"
              v-model="category"
              type="text"
              required
              placeholder="Nhập tên phân loại mới (Ví dụ: Gia vị, Trái cây, Bánh...)"
              class="w-full h-10 px-3.5 bg-white border border-[#8d6749] rounded-xl text-xs font-medium text-[#1e1b1b] outline-none focus:ring-2 focus:ring-[#8d6749]/20"
            />
            <Select
              v-else
              v-model="category"
              :options="categoryOptions"
              editable
              filter
              placeholder="Chọn hoặc gõ phân loại..."
              class="w-full h-10 text-xs font-medium"
            />
          </div>

          <!-- Purchase Unit / Base Unit -->
          <div>
            <label class="block text-xs font-semibold text-[#1e1b1b] uppercase tracking-wider mb-2">Đơn vị tính lưu kho (ĐVT) *</label>
            <Select
              v-model="purchaseUnit"
              :options="purchaseUnits"
              editable
              filter
              placeholder="Ví dụ: kg, lít, lon, chai, hộp, gói, bình, bịch..."
              class="w-full h-10 text-xs font-medium"
            />
          </div>

          <!-- Min Stock Warning -->
          <div>
            <label class="block text-xs font-semibold text-[#1e1b1b] uppercase tracking-wider mb-2">Mức tồn tối thiểu (Ngưỡng Min) *</label>
            <input
              v-model.number="minStock"
              type="number"
              step="any"
              min="0"
              required
              placeholder="5"
              class="w-full h-10 px-3.5 bg-white border border-[#c1c9b9]/70 rounded-xl text-xs font-medium text-[#1e1b1b] outline-none focus:border-[#8d6749] focus:ring-2 focus:ring-[#8d6749]/20"
            />
            <span class="text-[11px] text-[#72796c] mt-1 block">Hệ thống sẽ phát cảnh báo khi tồn kho xuống dưới mức này</span>
          </div>

          <!-- Initial Stock -->
          <div>
            <label class="block text-xs font-semibold text-[#1e1b1b] uppercase tracking-wider mb-2">Tồn kho ban đầu</label>
            <input
              v-model.number="initialStock"
              type="number"
              step="any"
              min="0"
              placeholder="0"
              class="w-full h-10 px-3.5 bg-white border border-[#c1c9b9]/70 rounded-xl text-xs font-medium text-[#1e1b1b] outline-none focus:border-[#8d6749] focus:ring-2 focus:ring-[#8d6749]/20"
            />
            <span class="text-[11px] text-[#72796c] mt-1 block">Số lượng hiện có sẵn trong kho (nếu có)</span>
          </div>
        </div>

        <!-- Info Note Card -->
        <div class="p-4 bg-[#fff8f7] rounded-xl border border-[#e9e0e0] flex items-start gap-3 text-xs text-[#42493d]">
          <span class="material-symbols-outlined text-[#8d6749] text-xl shrink-0 mt-0.5">lightbulb</span>
          <div class="space-y-1">
            <p class="font-bold text-[#1e1b1b]">Đơn giá vốn được xác định khi nhập kho:</p>
            <p>
              Bạn không cần nhập đơn giá vốn cố định tại đây. Khi nhập hàng thực tế ngoài thị trường (ví dụ: mua 1 bình tương cà 2.1 kg giá 57.000 ₫), bạn chỉ cần tạo <strong>Phiếu nhập kho</strong>, hệ thống sẽ tự động ghi nhận số lượng, ĐVT và tính toán chính xác đơn giá vốn vào kho.
            </p>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./IngredientCreate.scss"></style>
