<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import { fetchProducts, updateProduct, deleteProduct, ProductItem } from '@/api/product.api'
import { uploadImage } from '@/api/upload.api'
import { fetchMasterCodes } from '@/api/masterCode.api'
import { fetchIngredients } from '@/api/ingredient.api'
import { MASTER_CODES, PRODUCT_CATEGORY_OPTIONS } from '@/constants/masterCodes'
import { useListQuery } from '@/composables/useListQuery'
import { useAppToast } from '@/composables/useAppToast'
import { getUnitConversionFactor, COMMON_UNITS } from '@/utils/unitConversion'

const router = useRouter()
const { showSuccess, showError, showWarning } = useAppToast()

const searchKeyword = ref('')
const selectedCategoryCode = ref<string>(MASTER_CODES.FILTER.ALL)

const {
  items,
  pagination,
  loading,
  fetchList,
  handleSort,
  handlePageChange,
  handlePageSizeChange,
} = useListQuery(fetchProducts, { sortBy: 'id', sortOrder: 'asc' }, 10)

const categoryOptions = ref<{ code: string; label: string }[]>(PRODUCT_CATEGORY_OPTIONS)

// Edit Modal State
const showEditModal = ref(false)
const isSavingEdit = ref(false)
const editError = ref('')
const editForm = ref({
  id: '' as string | number,
  name: '',
  category: '',
  unit: 'ly',
  sellingPrice: 0,
  costPrice: 0,
  status: 'Đang kinh doanh',
  imageUrl: '',
})

// Edit Image State
const editFileInputRef = ref<HTMLInputElement | null>(null)
const editPreviewImage = ref('')
const editSelectedFileName = ref('')

const triggerEditFileSelect = () => {
  editFileInputRef.value?.click()
}

const onEditFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    if (file.size > 5 * 1024 * 1024) {
      showWarning('Dung lượng tệp vượt quá 5MB')
      return
    }
    editSelectedFileName.value = file.name
    const reader = new FileReader()
    reader.onload = (e) => {
      editPreviewImage.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const removeEditImage = () => {
  editPreviewImage.value = ''
  editSelectedFileName.value = ''
  if (editFileInputRef.value) editFileInputRef.value.value = ''
}

const categoryStringList = computed(() => {
  return categoryOptions.value.map((c) => c.label).filter((l) => l !== 'Tất cả')
})

const units = ref(['ly', 'cốc', 'chai', 'lon', 'bánh', 'gói', 'dĩa', 'phần'])

// Delete Modal State
const showDeleteModal = ref(false)
const isDeleting = ref(false)
const deleteTarget = ref<ProductItem | null>(null)

// BOM Recipe Editor inside Modal
const availableIngredients = ref<{ id: string; dbId?: number; name: string; unitCost: number; unit: string }[]>([])
const editRecipeItems = ref<
  Array<{
    stockItemId: string | number
    ingredientName: string
    amount: number
    stockUnit: string
    recipeUnit: string
    unitCost: number
  }>
>([])
const selectedEditIngId = ref('')
const addEditAmount = ref(1)

const getEditItemUnitCost = (item: { stockUnit: string; recipeUnit: string; unitCost: number }) => {
  const factor = getUnitConversionFactor(item.stockUnit, item.recipeUnit || item.stockUnit)
  return (item.unitCost || 0) * factor
}

const getEditItemCost = (item: { stockUnit: string; recipeUnit: string; unitCost: number; amount: number }) => {
  return (item.amount || 0) * getEditItemUnitCost(item)
}

const addEditRecipeItem = () => {
  const ing = availableIngredients.value.find((i) => String(i.id) === String(selectedEditIngId.value))
  if (!ing) return
  const existing = editRecipeItems.value.find((r) => String(r.stockItemId) === String(ing.id) || String(r.stockItemId) === String(ing.dbId))
  if (existing) {
    existing.amount += addEditAmount.value
  } else {
    editRecipeItems.value.push({
      stockItemId: ing.dbId || ing.id,
      ingredientName: ing.name,
      amount: addEditAmount.value,
      stockUnit: ing.unit,
      recipeUnit: ing.unit,
      unitCost: ing.unitCost || 0,
    })
  }
}

const removeEditRecipeItem = (index: number) => {
  editRecipeItems.value.splice(index, 1)
}

const formatCurrency = (val: number) => {
  return Math.round(val).toLocaleString('vi-VN') + ' ₫'
}

const loadData = async () => {
  const [masterCodeData, filterCodeData, ingredientsData] = await Promise.all([
    fetchMasterCodes('PRODUCT_CATEGORY'),
    fetchMasterCodes('COMMON_FILTER'),
    fetchIngredients({ pageSize: 1000 }),
  ])

  await fetchList({ category: selectedCategoryCode.value, keyword: searchKeyword.value })

  const catMap = new Map<string, string>()
  const allFilter = filterCodeData.find((f) => f.code === 'all') || { code: 'all', label: 'Tất cả' }
  catMap.set(allFilter.code, allFilter.label)

  if (masterCodeData.length > 0) {
    masterCodeData.forEach((m) => catMap.set(m.code, m.label))
  }

  items.value.forEach((prod) => {
    if (prod.category && !Array.from(catMap.values()).includes(prod.category)) {
      catMap.set(prod.category, prod.category)
    }
  })

  categoryOptions.value = Array.from(catMap.entries()).map(([code, label]) => ({
    code,
    label,
  }))

  if (ingredientsData.items && ingredientsData.items.length > 0) {
    availableIngredients.value = ingredientsData.items.map((ing) => ({
      id: ing.id,
      dbId: ing.dbId,
      name: ing.name,
      unitCost: ing.rawCost || 0,
      unit: ing.unit,
    }))
  }
}

onMounted(() => {
  loadData()
})

const handleSearch = () => {
  pagination.page = 1
  fetchList({ category: selectedCategoryCode.value, keyword: searchKeyword.value })
}

const onResetSearch = () => {
  searchKeyword.value = ''
  selectedCategoryCode.value = MASTER_CODES.FILTER.ALL
}

const onPage = (event: any) => {
  const newPageSize = event.rows
  const newPage = event.page + 1
  if (newPageSize !== pagination.pageSize) {
    handlePageSizeChange(newPageSize, { category: selectedCategoryCode.value, keyword: searchKeyword.value })
  } else {
    handlePageChange(newPage, { category: selectedCategoryCode.value, keyword: searchKeyword.value })
  }
}

const onSort = (event: any) => {
  if (event.sortField) {
    handleSort(event.sortField, { category: selectedCategoryCode.value, keyword: searchKeyword.value })
  }
}

// Open Edit Dialog
const openEdit = (item: ProductItem) => {
  editForm.value = {
    id: item.dbId || item.id,
    name: item.name,
    category: item.category,
    unit: item.unit || 'ly',
    sellingPrice: item.rawPrice || 0,
    costPrice: item.rawCost || 0,
    status: item.status || 'Đang kinh doanh',
    imageUrl: item.img || '',
  }
  editPreviewImage.value = item.img || ''
  editSelectedFileName.value = ''
  editError.value = ''

  // Load existing BOM recipe items
  editRecipeItems.value = (item.recipeItems || []).map((r) => {
    const stockIng = availableIngredients.value.find((ing) => String(ing.id) === String(r.stockItemId) || String(ing.dbId) === String(r.stockItemId))
    // Ưu tiên dùng stockUnit từ BE response, fallback sang ingredient lookup
    const stockUnit = (r as any).stockUnit || (stockIng ? stockIng.unit : (r.unit || 'g'))
    const unitCost = stockIng ? stockIng.unitCost : (r.unitCost || 0)
    return {
      stockItemId: r.stockItemId,
      ingredientName: r.ingredientName || (stockIng ? stockIng.name : ''),
      amount: r.amount,
      stockUnit,
      recipeUnit: r.unit || stockUnit,  // r.unit = recipeUnit (đơn vị người dùng nhập, ví dụ 'g')
      unitCost,
    }
  })

  showEditModal.value = true
}

// Submit Edit
const handleSaveEdit = async () => {
  if (!editForm.value.name.trim()) {
    editError.value = 'Vui lòng nhập tên sản phẩm'
    return
  }
  if (editForm.value.sellingPrice <= 0) {
    editError.value = 'Giá bán sản phẩm phải lớn hơn 0'
    return
  }

  try {
    isSavingEdit.value = true
    editError.value = ''

    let finalImageUrl = editPreviewImage.value
    if (editPreviewImage.value.startsWith('data:image')) {
      finalImageUrl = await uploadImage({
        image: editPreviewImage.value,
        fileName: editSelectedFileName.value,
      })
    }

    const formattedRecipeItems = editRecipeItems.value.map((r) => {
      // Gửi amount gốc + unit gốc người dùng nhập — Backend sẽ tự quy đổi về đơn vị kho
      return {
        stockItemId: r.stockItemId,
        amount: r.amount,
        unit: r.recipeUnit || r.stockUnit,
      }
    })

    await updateProduct(editForm.value.id, {
      name: editForm.value.name,
      category: editForm.value.category,
      unit: editForm.value.unit,
      sellingPrice: editForm.value.sellingPrice,
      status: editForm.value.status,
      imageUrl: finalImageUrl || undefined,
      recipeItems: formattedRecipeItems,
    })
    showSuccess(`Đã cập nhật công thức & giá vốn sản phẩm "${editForm.value.name}" thành công!`)
    showEditModal.value = false
    await fetchList({ category: selectedCategoryCode.value, keyword: searchKeyword.value }, true)
  } catch (error: any) {
    console.error('Error updating product:', error)
    const msg = error?.response?.data?.message || error?.message || 'Lỗi khi cập nhật sản phẩm'
    editError.value = msg
    showError(msg)
  } finally {
    isSavingEdit.value = false
  }
}

// Open Delete Dialog
const openDelete = (item: ProductItem) => {
  deleteTarget.value = item
  showDeleteModal.value = true
}

// Confirm Delete
const handleConfirmDelete = async () => {
  if (!deleteTarget.value) return
  const deletedName = deleteTarget.value.name
  try {
    isDeleting.value = true
    const targetId = deleteTarget.value.dbId || deleteTarget.value.id
    await deleteProduct(targetId)
    showSuccess(`Đã xóa sản phẩm "${deletedName}" thành công!`)
    showDeleteModal.value = false
    deleteTarget.value = null
    await fetchList({ category: selectedCategoryCode.value, keyword: searchKeyword.value }, true)
  } catch (error: any) {
    console.error('Error deleting product:', error)
    showError(error?.message || 'Lỗi khi xóa sản phẩm')
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <div class="product-list-page h-full flex flex-col gap-4 overflow-hidden">
    <!-- Header Title & Action -->
    <div class="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#e9e0e0]">
      <div>
        <h1 class="text-2xl font-bold font-display text-[#1e1b1b]">Quản lý Sản phẩm</h1>
        <p class="text-xs text-[#42493d] mt-1 font-medium">Danh sách thực đơn, định mức nguyên liệu BOM và trừ kho POS</p>
      </div>
      <button
        @click="router.push('/products/create')"
        class="h-10 px-4 bg-[#8d6749] hover:bg-[#6e4e34] text-white font-semibold text-xs rounded-xl shadow transition flex items-center gap-2 cursor-pointer"
      >
        <span class="material-symbols-outlined text-lg">add</span>
        <span>Thêm sản phẩm mới</span>
      </button>
    </div>

    <!-- Main Card -->
    <div class="flex-1 min-h-0 bg-white rounded-2xl border border-[#e9e0e0] shadow-sm overflow-hidden flex flex-col">
      <!-- Search & Filters -->
      <div class="shrink-0 p-4 border-b border-[#e9e0e0] bg-[#fff8f7]">
        <!-- Form Search with Category Select Dropdown, Search and Reset buttons -->
        <form @submit.prevent="handleSearch" class="flex flex-col sm:flex-row items-end gap-3 w-full">
          <div class="w-full sm:w-64">
            <label class="block text-[11px] font-bold text-[#42493d] uppercase mb-1">Từ khóa tìm kiếm</label>
            <div class="relative">
              <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#72796c] text-xl">search</span>
              <input
                v-model="searchKeyword"
                type="text"
                placeholder="Tìm tên sản phẩm, mã SP..."
                class="w-full h-10 pl-11 pr-4 bg-white border border-[#c1c9b9]/70 rounded-xl focus:outline-none focus:border-[#8d6749] focus:ring-2 focus:ring-[#8d6749]/20 text-xs font-medium text-[#1e1b1b]"
              />
            </div>
          </div>

          <!-- Filterable Category Select Dropdown -->
          <div class="w-full sm:w-56">
            <label class="block text-[11px] font-bold text-[#42493d] uppercase mb-1">Danh mục sản phẩm</label>
            <Select
              v-model="selectedCategoryCode"
              :options="categoryOptions"
              optionLabel="label"
              optionValue="code"
              filter
              placeholder="Tất cả danh mục"
              class="w-full h-10 text-xs"
            />
          </div>

          <div class="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="submit"
              class="h-10 px-4 bg-[#8d6749] hover:bg-[#6e4e34] text-white font-semibold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5 whitespace-nowrap flex-1 sm:flex-none cursor-pointer"
            >
              <span class="material-symbols-outlined text-base">search</span>
              <span>Tìm kiếm</span>
            </button>
            <button
              type="button"
              @click="onResetSearch"
              class="h-10 px-3.5 bg-[#f5eceb] hover:bg-[#efe6e6] text-[#42493d] font-semibold text-xs rounded-xl border border-[#c1c9b9]/60 transition flex items-center justify-center gap-1.5 whitespace-nowrap flex-1 sm:flex-none cursor-pointer"
              title="Đặt lại bộ lọc"
            >
              <span class="material-symbols-outlined text-base">refresh</span>
              <span>Đặt lại</span>
            </button>
          </div>
        </form>
      </div>

      <!-- PrimeVue DataTable -->
      <DataTable
        :value="items"
        :loading="loading"
        lazy
        paginator
        scrollable
        scrollHeight="flex"
        class="flex-1 min-h-0 flex flex-col"
        :rows="pagination.pageSize"
        :totalRecords="pagination.totalRecords"
        :first="(pagination.page - 1) * pagination.pageSize"
        :rowsPerPageOptions="[10, 20, 50]"
        @page="onPage"
        @sort="onSort"
        tableStyle="min-width: 50rem"
        responsiveLayout="scroll"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Hiển thị {first} đến {last} trong tổng số {totalRecords} sản phẩm"
      >
        <template #empty>
          <div class="py-12 text-center text-[#72796c] flex flex-col items-center justify-center gap-2">
            <span class="material-symbols-outlined text-4xl text-[#c1c9b9]">search_off</span>
            <span class="text-xs font-bold text-[#1e1b1b]">Không tìm thấy sản phẩm phù hợp</span>
            <span class="text-[11px] text-[#72796c]">Vui lòng thử từ khóa tìm kiếm hoặc chọn bộ lọc danh mục khác</span>
          </div>
        </template>

        <Column field="id" header="Mã SP" sortable>
          <template #body="slotProps">
            <span class="font-mono font-bold text-[#72796c]">{{ slotProps.data.id }}</span>
          </template>
        </Column>

        <Column field="name" header="Sản phẩm" sortable>
          <template #body="slotProps">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-[#f5eceb] overflow-hidden shrink-0 border border-[#e9e0e0] flex items-center justify-center">
                <img v-if="slotProps.data.img" :src="slotProps.data.img" :alt="slotProps.data.name" class="w-full h-full object-cover" />
                <span v-else class="material-symbols-outlined text-[#8d6749] text-xl">local_cafe</span>
              </div>
              <div class="flex flex-col">
                <span class="font-bold text-[#1e1b1b]">{{ slotProps.data.name }}</span>
                <span class="text-[11px] text-[#72796c] font-medium">{{ slotProps.data.category }}</span>
              </div>
            </div>
          </template>
        </Column>

        <Column field="price" header="Giá bán" sortable bodyClass="text-right" headerClass="text-right">
          <template #body="slotProps">
            <span class="font-bold text-[#1e1b1b]">{{ slotProps.data.price }}</span>
          </template>
        </Column>

        <Column field="cost" header="Giá vốn (Cost)" bodyClass="text-right" headerClass="text-right">
          <template #body="slotProps">
            <span class="font-bold text-[#326824]">{{ slotProps.data.cost }}</span>
          </template>
        </Column>

        <Column field="margin" header="Lợi nhuận gộp" bodyClass="text-center" headerClass="text-center">
          <template #body="slotProps">
            <span class="px-2.5 py-1 rounded-md bg-[#c9edb5]/60 text-[#326824] font-bold text-[11px] inline-block">
              {{ slotProps.data.margin }}
            </span>
          </template>
        </Column>

        <Column header="Công thức BOM" bodyClass="text-center" headerClass="text-center">
          <template #body="slotProps">
            <span class="px-2 py-0.5 rounded bg-[#f5eceb] text-[#8d6749] font-mono text-[11px] font-semibold">
              {{ (slotProps.data.recipeItems || []).length }} nguyên liệu
            </span>
          </template>
        </Column>

        <Column header="Trạng thái" bodyClass="text-center" headerClass="text-center">
          <template #body="slotProps">
            <span
              class="px-2.5 py-1 rounded-md font-bold text-[11px] inline-block"
              :class="slotProps.data.status === 'Đang kinh doanh' ? 'bg-[#c9edb5]/60 text-[#326824]' : 'bg-[#ffdad6] text-[#ba1a1a]'"
            >
              {{ slotProps.data.status }}
            </span>
          </template>
        </Column>

        <Column header="Thao tác" bodyClass="text-center" headerClass="text-center">
          <template #body="slotProps">
            <div class="flex items-center justify-center gap-1">
              <button
                @click="openEdit(slotProps.data)"
                class="p-1.5 text-[#8d6749] hover:bg-[#f5eceb] rounded-lg transition"
                title="Sửa sản phẩm"
              >
                <span class="material-symbols-outlined text-lg">edit</span>
              </button>
              <button
                @click="openDelete(slotProps.data)"
                class="p-1.5 text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg transition"
                title="Xóa sản phẩm"
              >
                <span class="material-symbols-outlined text-lg">delete</span>
              </button>
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Edit Modal Dialog -->
    <Dialog v-model:visible="showEditModal" header="Chỉnh sửa Sản phẩm & Công thức BOM" modal class="w-full max-w-xl p-0">
      <div class="p-5 flex flex-col gap-4">
        <div v-if="editError" class="p-3 bg-[#ffdad6] text-[#ba1a1a] rounded-lg text-xs font-semibold">
          {{ editError }}
        </div>

        <!-- Image Uploader in Edit Modal -->
        <div>
          <label class="block text-xs font-semibold text-[#1e1b1b] uppercase mb-1.5">Hình ảnh sản phẩm</label>
          <input
            ref="editFileInputRef"
            type="file"
            accept="image/*"
            @change="onEditFileSelected"
            class="hidden"
          />
          <div class="flex items-center gap-3">
            <div class="w-16 h-16 rounded-xl border border-[#e9e0e0] bg-[#f5eceb] overflow-hidden shrink-0 flex items-center justify-center">
              <img v-if="editPreviewImage" :src="editPreviewImage" class="w-full h-full object-cover" />
              <span v-else class="material-symbols-outlined text-2xl text-[#8d6749]">add_a_photo</span>
            </div>
            <div class="flex flex-col gap-1.5">
              <button
                type="button"
                @click="triggerEditFileSelect"
                class="px-3 py-1.5 bg-[#8d6749] text-white text-xs font-semibold rounded-lg hover:bg-[#6e4e34] transition"
              >
                Tải ảnh mới
              </button>
              <button
                v-if="editPreviewImage"
                type="button"
                @click="removeEditImage"
                class="text-xs text-[#ba1a1a] hover:underline font-semibold text-left"
              >
                Xóa ảnh
              </button>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-[#1e1b1b] uppercase mb-1">Tên sản phẩm *</label>
          <input
            v-model="editForm.name"
            type="text"
            class="w-full h-10 px-3.5 border border-[#c1c9b9]/70 rounded-xl text-xs bg-white outline-none focus:border-[#8d6749] focus:ring-2 focus:ring-[#8d6749]/20 font-medium"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-[#1e1b1b] uppercase mb-1">Danh mục *</label>
            <Select
              v-model="editForm.category"
              :options="categoryStringList"
              editable
              filter
              class="w-full h-10 text-xs font-medium"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-[#1e1b1b] uppercase mb-1">Đơn vị bán *</label>
            <Select
              v-model="editForm.unit"
              :options="units"
              editable
              filter
              class="w-full h-10 text-xs font-medium"
            />
          </div>
        </div>

        <!-- BOM Section -->
        <div class="border-t border-[#e9e0e0] pt-4">
          <div class="flex justify-between items-center mb-3">
            <h3 class="text-xs font-bold uppercase tracking-wider text-[#1e1b1b]">Định mức công thức (BOM)</h3>
          </div>

          <!-- Add Ingredient Row -->
          <div class="flex flex-col sm:flex-row gap-2.5 mb-3">
            <Select
              v-model="selectedEditIngId"
              :options="availableIngredients"
              optionLabel="name"
              optionValue="id"
              filter
              placeholder="Chọn nguyên liệu..."
              class="flex-1 h-10 text-xs font-medium"
            />
            <input
              v-model.number="addEditAmount"
              type="number"
              placeholder="Định lượng"
              class="w-full sm:w-28 h-10 px-3.5 border border-[#c1c9b9]/70 rounded-xl text-xs font-medium bg-white outline-none focus:border-[#8d6749] focus:ring-2 focus:ring-[#8d6749]/20"
            />
            <button
              @click="addEditRecipeItem"
              type="button"
              class="h-10 px-4 bg-[#8d6749] hover:bg-[#6e4e34] text-white text-xs font-semibold rounded-xl transition cursor-pointer flex items-center justify-center gap-1 shrink-0"
            >
              <span class="material-symbols-outlined text-base">add</span>
              <span>Thêm</span>
            </button>
          </div>

          <!-- BOM Ingredients Table -->
          <div class="overflow-x-auto border border-[#e9e0e0] rounded-xl">
            <table class="w-full text-left text-xs text-[#1e1b1b]">
              <thead class="bg-[#fbf1f1] text-[#42493d] font-semibold uppercase tracking-wider border-b border-[#e9e0e0]">
                <tr>
                  <th class="py-2.5 px-3">Tên nguyên liệu</th>
                  <th class="py-2.5 px-3 text-center">Định lượng</th>
                  <th class="py-2.5 px-3 text-center">ĐVT BOM</th>
                  <th class="py-2.5 px-3 text-center">Đơn giá quy đổi</th>
                  <th class="py-2.5 px-3 text-right">Thành tiền</th>
                  <th class="py-2.5 px-3 text-center">Xóa</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#f5eceb]">
                <tr v-for="(item, idx) in editRecipeItems" :key="idx" class="hover:bg-[#fbf1f1]/50 transition">
                  <td class="py-2 px-3 font-semibold text-[#1e1b1b]">
                    <div>{{ item.ingredientName }}</div>
                    <div class="text-[10px] text-[#72796c] font-medium">Kho: {{ formatCurrency(item.unitCost) }} / {{ item.stockUnit }}</div>
                  </td>
                  <td class="py-2 px-3 text-center">
                    <input
                      v-model.number="item.amount"
                      type="number"
                      min="0"
                      step="any"
                      class="w-16 px-2 py-0.5 border border-[#c1c9b9]/70 rounded text-center font-bold text-xs"
                    />
                  </td>
                  <td class="py-2 px-3 text-center">
                    <Select
                      v-model="item.recipeUnit"
                      :options="COMMON_UNITS"
                      editable
                      filter
                      class="w-20 text-xs font-semibold"
                    />
                  </td>
                  <td class="py-2 px-3 text-center font-mono text-[11px] text-[#72796c]">
                    {{ formatCurrency(getEditItemUnitCost(item)) }} / {{ item.recipeUnit }}
                  </td>
                  <td class="py-2 px-3 text-right font-bold text-[#1e1b1b]">{{ formatCurrency(getEditItemCost(item)) }}</td>
                  <td class="py-2 px-3 text-center">
                    <button @click="removeEditRecipeItem(idx)" type="button" class="p-1 text-[#ba1a1a] hover:bg-[#ffdad6] rounded transition">
                      <span class="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </td>
                </tr>
                <tr v-if="editRecipeItems.length === 0">
                  <td colspan="6" class="py-3 text-center text-[#72796c] italic">Chưa có nguyên liệu nào trong định mức công thức</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-4 pt-3 border-t border-[#e9e0e0]">
          <button
            @click="showEditModal = false"
            type="button"
            class="h-10 px-4 bg-[#f5eceb] text-[#42493d] font-semibold text-xs rounded-xl hover:bg-[#efe6e6] transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            @click="handleSaveEdit"
            :disabled="isSavingEdit"
            type="button"
            class="h-10 px-4 bg-[#8d6749] text-white font-semibold text-xs rounded-xl hover:bg-[#6e4e34] transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <span v-if="isSavingEdit" class="material-symbols-outlined text-sm animate-spin">refresh</span>
            <span>{{ isSavingEdit ? 'Đang lưu...' : 'Lưu thay đổi' }}</span>
          </button>
        </div>
      </div>
    </Dialog>

    <!-- Delete Product Confirmation Modal Dialog -->
    <Dialog v-model:visible="showDeleteModal" header="Xác nhận Xóa Sản phẩm" modal class="w-full max-w-md p-0">
      <div class="p-5 flex flex-col gap-4">
        <p class="text-xs font-medium text-[#42493d]">
          Bạn có chắc chắn muốn xóa sản phẩm <strong class="text-[#1e1b1b]">{{ deleteTarget?.name }}</strong> (Mã: {{ deleteTarget?.id }})?
        </p>

        <div class="flex justify-end gap-2 mt-2 pt-3 border-t border-[#e9e0e0]">
          <button
            @click="showDeleteModal = false"
            type="button"
            class="h-10 px-4 bg-[#f5eceb] text-[#42493d] font-semibold text-xs rounded-xl hover:bg-[#efe6e6] transition cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            @click="handleConfirmDelete"
            :disabled="isDeleting"
            type="button"
            class="h-10 px-4 bg-[#ba1a1a] text-white font-semibold text-xs rounded-xl hover:bg-[#93000a] transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <span v-if="isDeleting" class="material-symbols-outlined text-sm animate-spin">refresh</span>
            <span>{{ isDeleting ? 'Đang xóa...' : 'Đồng ý Xóa' }}</span>
          </button>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<style scoped lang="scss" src="./ProductList.scss"></style>
