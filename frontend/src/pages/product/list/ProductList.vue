<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import {
  fetchProducts,
  updateProduct,
  deleteProduct,
  ProductItem,
} from '@/api/product.api'
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

const categoryOptions = ref<{ code: string; label: string }[]>(
  PRODUCT_CATEGORY_OPTIONS,
)

// Edit Modal State
const showEditModal = ref(false)
const isSavingEdit = ref(false)
const editError = ref('')
const editForm = ref({
  id: '' as string | number,
  name: '',
  category: '',
  unit: 'phần',
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
const availableIngredients = ref<
  { id: string; dbId?: number; name: string; unitCost: number; unit: string }[]
>([])
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

const getEditItemUnitCost = (item: {
  ingredientName?: string
  stockUnit: string
  recipeUnit: string
  unitCost: number
}) => {
  const factor = getUnitConversionFactor(
    item.stockUnit,
    item.recipeUnit || item.stockUnit,
    item.ingredientName
  )
  return (item.unitCost || 0) * factor
}

const getEditItemCost = (item: {
  stockUnit: string
  recipeUnit: string
  unitCost: number
  amount: number
}) => {
  return (item.amount || 0) * getEditItemUnitCost(item)
}

const addEditRecipeItem = () => {
  const ing = availableIngredients.value.find(
    (i) => String(i.id) === String(selectedEditIngId.value),
  )
  if (!ing) return
  const existing = editRecipeItems.value.find(
    (r) =>
      String(r.stockItemId) === String(ing.id) ||
      String(r.stockItemId) === String(ing.dbId),
  )
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
  return Math.round(val || 0).toLocaleString('vi-VN') + ' ₫'
}

const editTotalCost = computed(() => {
  return editRecipeItems.value.reduce(
    (sum, item) => sum + getEditItemCost(item),
    0,
  )
})

const editProfitMargin = computed(() => {
  if (!editForm.value.sellingPrice || editForm.value.sellingPrice <= 0)
    return '0%'
  const profit = editForm.value.sellingPrice - editTotalCost.value
  return ((profit / editForm.value.sellingPrice) * 100).toFixed(1) + '%'
})

const loadData = async () => {
  const [masterCodeData, filterCodeData, ingredientsData] = await Promise.all([
    fetchMasterCodes('PRODUCT_CATEGORY'),
    fetchMasterCodes('COMMON_FILTER'),
    fetchIngredients({ pageSize: 1000 }),
  ])

  await fetchList({
    category: selectedCategoryCode.value,
    keyword: searchKeyword.value,
  })

  const catMap = new Map<string, string>()
  const allFilter = filterCodeData.find((f) => f.code === 'all') || {
    code: 'all',
    label: 'Tất cả',
  }
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
  fetchList({
    category: selectedCategoryCode.value,
    keyword: searchKeyword.value,
  })
}

const onResetSearch = () => {
  searchKeyword.value = ''
  selectedCategoryCode.value = MASTER_CODES.FILTER.ALL
}

const onPage = (event: any) => {
  const newPageSize = event.rows
  const newPage = event.page + 1
  if (newPageSize !== pagination.pageSize) {
    handlePageSizeChange(newPageSize, {
      category: selectedCategoryCode.value,
      keyword: searchKeyword.value,
    })
  } else {
    handlePageChange(newPage, {
      category: selectedCategoryCode.value,
      keyword: searchKeyword.value,
    })
  }
}

const onSort = (event: any) => {
  if (event.sortField) {
    handleSort(event.sortField, {
      category: selectedCategoryCode.value,
      keyword: searchKeyword.value,
    })
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
    const stockIng = availableIngredients.value.find(
      (ing) =>
        String(ing.id) === String(r.stockItemId) ||
        String(ing.dbId) === String(r.stockItemId),
    )
    // Ưu tiên dùng stockUnit từ BE response, fallback sang ingredient lookup
    const stockUnit =
      (r as any).stockUnit || (stockIng ? stockIng.unit : r.unit || 'g')
    const unitCost = stockIng ? stockIng.unitCost : r.unitCost || 0
    return {
      stockItemId: r.stockItemId,
      ingredientName: r.ingredientName || (stockIng ? stockIng.name : ''),
      amount: r.amount,
      stockUnit,
      recipeUnit: r.unit || stockUnit, // r.unit = recipeUnit (đơn vị người dùng nhập, ví dụ 'g')
      unitCost,
    }
  })

  showEditModal.value = true
}

// Clone Product
const openClone = (item: ProductItem) => {
  sessionStorage.setItem('cloneProduct', JSON.stringify(item))
  router.push('/products/create')
}

// Submit Edit
const handleSaveEdit = async () => {
  if (!editForm.value.name.trim()) {
    editError.value = 'Vui lòng nhập tên sản phẩm'
    return
  }
  if (!editForm.value.sellingPrice || editForm.value.sellingPrice <= 0) {
    editError.value = 'Giá bán sản phẩm phải lớn hơn 0'
    return
  }
  if (!editRecipeItems.value || editRecipeItems.value.length === 0) {
    editError.value =
      'Vui lòng thêm ít nhất 1 nguyên liệu trong công thức BOM sản phẩm'
    return
  }
  for (const item of editRecipeItems.value) {
    if (!item.amount || item.amount <= 0) {
      editError.value = `Định lượng nguyên liệu "${item.ingredientName}" phải lớn hơn 0`
      return
    }
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
    showSuccess(
      `Đã cập nhật công thức & giá vốn sản phẩm "${editForm.value.name}" thành công!`,
    )
    showEditModal.value = false
    await fetchList(
      { category: selectedCategoryCode.value, keyword: searchKeyword.value },
      true,
    )
  } catch (error: any) {
    console.error('Error updating product:', error)
    const msg =
      error?.response?.data?.message ||
      error?.message ||
      'Lỗi khi cập nhật sản phẩm'
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
    await fetchList(
      { category: selectedCategoryCode.value, keyword: searchKeyword.value },
      true,
    )
  } catch (error: any) {
    console.error('Error deleting product:', error)
    showError(error?.message || 'Lỗi khi xóa sản phẩm')
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <div class="product-list-page flex h-full flex-col gap-4 overflow-hidden">
    <!-- Header Title & Action -->
    <div
      class="flex shrink-0 flex-col justify-between gap-4 border-b border-[#E2D7CC] pb-2 sm:flex-row sm:items-center"
    >
      <div>
        <h1 class="font-display text-2xl font-bold text-[#1e1b1b]">
          Quản lý Sản phẩm
        </h1>
        <p class="mt-1 text-xs font-medium text-[#42493d]">
          Danh sách thực đơn, định mức nguyên liệu BOM và trừ kho POS
        </p>
      </div>
      <button
        @click="router.push('/products/create')"
        class="flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-[#8E3E2F] px-4 text-xs font-semibold text-white shadow transition hover:bg-[#6E281C]"
      >
        <span class="material-symbols-outlined text-lg">add</span>
        <span>Thêm sản phẩm mới</span>
      </button>
    </div>

    <!-- Main Card -->
    <div
      class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#E2D7CC] bg-white shadow-sm"
    >
      <!-- Search & Filters -->
      <div class="shrink-0 border-b border-[#E2D7CC] bg-[#F9F6F0] p-3.5 sm:p-4">
        <!-- Form Search with Category Select Dropdown, Search and Reset buttons -->
        <form
          @submit.prevent="handleSearch"
          class="flex w-full flex-col items-stretch sm:items-end gap-3 sm:flex-row"
        >
          <div class="w-full sm:w-64">
            <label
              class="mb-1 block text-[11px] font-bold uppercase text-[#42493d]"
              >Từ khóa tìm kiếm</label
            >
            <div class="relative">
              <span
                class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-xl text-[#72796c]"
                >search</span
              >
              <input
                v-model="searchKeyword"
                type="text"
                placeholder="Tìm tên sản phẩm, mã SP..."
                class="h-10 w-full rounded-xl border border-[#c1c9b9]/70 bg-white pl-11 pr-4 text-xs font-medium text-[#1e1b1b] focus:border-[#8E3E2F] focus:outline-none focus:ring-2 focus:ring-[#8E3E2F]/20"
              />
            </div>
          </div>

          <!-- Filterable Category Select Dropdown -->
          <div class="w-full sm:w-56">
            <label
              class="mb-1 block text-[11px] font-bold uppercase text-[#42493d]"
              >Danh mục sản phẩm</label
            >
            <Select
              v-model="selectedCategoryCode"
              :options="categoryOptions"
              optionLabel="label"
              optionValue="code"
              filter
              placeholder="Tất cả danh mục"
              class="h-10 w-full text-xs"
            />
          </div>

          <div class="flex w-full items-center gap-2 sm:w-auto">
            <button
              type="submit"
              class="flex h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-[#8E3E2F] px-4 text-xs font-semibold text-white shadow transition hover:bg-[#6E281C] sm:flex-none"
            >
              <span class="material-symbols-outlined text-base">search</span>
              <span>Tìm kiếm</span>
            </button>
            <button
              type="button"
              @click="onResetSearch"
              class="flex h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-[#c1c9b9]/60 bg-[#F2ECE4] px-3.5 text-xs font-semibold text-[#42493d] transition hover:bg-[#E8DFD5] sm:flex-none"
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
        class="flex min-h-0 flex-1 flex-col"
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
          <div
            class="flex flex-col items-center justify-center gap-2 py-12 text-center text-[#72796c]"
          >
            <span class="material-symbols-outlined text-4xl text-[#c1c9b9]"
              >search_off</span
            >
            <span class="text-xs font-bold text-[#1e1b1b]"
              >Không tìm thấy sản phẩm phù hợp</span
            >
            <span class="text-[11px] text-[#72796c]"
              >Vui lòng thử từ khóa tìm kiếm hoặc chọn bộ lọc danh mục
              khác</span
            >
          </div>
        </template>

        <Column field="id" header="Mã SP" sortable>
          <template #body="slotProps">
            <span class="font-mono font-bold text-[#72796c]">{{
              slotProps.data.id
            }}</span>
          </template>
        </Column>

        <Column field="name" header="Sản phẩm" sortable>
          <template #body="slotProps">
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#E2D7CC] bg-[#F2ECE4]"
              >
                <img
                  v-if="slotProps.data.img"
                  :src="slotProps.data.img"
                  :alt="slotProps.data.name"
                  class="h-full w-full object-cover"
                />
                <span
                  v-else
                  class="material-symbols-outlined text-xl text-[#8E3E2F]"
                  >ramen_dining</span
                >
              </div>
              <div class="flex flex-col">
                <span class="font-bold text-[#1e1b1b]">{{
                  slotProps.data.name
                }}</span>
                <span class="text-[11px] font-medium text-[#72796c]">{{
                  slotProps.data.category
                }}</span>
              </div>
            </div>
          </template>
        </Column>

        <Column
          field="price"
          header="Giá bán"
          sortable
          bodyClass="text-right"
          headerClass="text-right"
        >
          <template #body="slotProps">
            <span class="font-bold text-[#1e1b1b]">{{
              slotProps.data.price
            }}</span>
          </template>
        </Column>

        <Column
          field="cost"
          header="Giá vốn (Cost)"
          bodyClass="text-right"
          headerClass="text-right"
        >
          <template #body="slotProps">
            <span class="font-bold text-[#326824]">{{
              slotProps.data.cost
            }}</span>
          </template>
        </Column>

        <Column
          field="margin"
          header="Lợi nhuận gộp"
          bodyClass="text-center"
          headerClass="text-center"
        >
          <template #body="slotProps">
            <span
              class="inline-block rounded-md bg-[#c9edb5]/60 px-2.5 py-1 text-[11px] font-bold text-[#326824]"
            >
              {{ slotProps.data.margin }}
            </span>
          </template>
        </Column>

        <Column
          header="Công thức BOM"
          bodyClass="text-center"
          headerClass="text-center"
        >
          <template #body="slotProps">
            <span
              class="rounded bg-[#F2ECE4] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#8E3E2F]"
            >
              {{ (slotProps.data.recipeItems || []).length }} nguyên liệu
            </span>
          </template>
        </Column>

        <Column
          header="Trạng thái"
          bodyClass="text-center"
          headerClass="text-center"
        >
          <template #body="slotProps">
            <span
              class="inline-block rounded-md px-2.5 py-1 text-[11px] font-bold"
              :class="
                slotProps.data.status === 'Đang kinh doanh'
                  ? 'bg-[#c9edb5]/60 text-[#326824]'
                  : 'bg-[#ffdad6] text-[#ba1a1a]'
              "
            >
              {{ slotProps.data.status }}
            </span>
          </template>
        </Column>

        <Column
          header="Thao tác"
          bodyClass="text-center"
          headerClass="text-center"
        >
          <template #body="slotProps">
            <div class="flex items-center justify-center gap-1">
              <button
                @click="openEdit(slotProps.data)"
                class="rounded-lg p-1.5 text-[#8E3E2F] transition hover:bg-[#F2ECE4]"
                title="Sửa sản phẩm"
              >
                <span class="material-symbols-outlined text-lg">edit</span>
              </button>
              <button
                @click="openClone(slotProps.data)"
                class="rounded-lg p-1.5 text-[#326824] transition hover:bg-[#c9edb5]/60"
                title="Nhân bản sản phẩm"
              >
                <span class="material-symbols-outlined text-lg"
                  >content_copy</span
                >
              </button>
              <button
                @click="openDelete(slotProps.data)"
                class="rounded-lg p-1.5 text-[#ba1a1a] transition hover:bg-[#ffdad6]"
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
    <Dialog
      v-model:visible="showEditModal"
      header="Chỉnh sửa Sản phẩm & Công thức BOM"
      modal
      class="w-full max-w-7xl p-0"
    >
      <div class="flex flex-col gap-4 p-5">
        <div
          v-if="editError"
          class="rounded-lg bg-[#ffdad6] p-3 text-xs font-semibold text-[#ba1a1a]"
        >
          {{ editError }}
        </div>

        <!-- Image Uploader in Edit Modal -->
        <div>
          <label
            class="mb-1.5 block text-xs font-semibold uppercase text-[#1e1b1b]"
            >Hình ảnh sản phẩm</label
          >
          <input
            ref="editFileInputRef"
            type="file"
            accept="image/*"
            @change="onEditFileSelected"
            class="hidden"
          />
          <div class="flex items-center gap-3">
            <div
              class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#E2D7CC] bg-[#F2ECE4]"
            >
              <img
                v-if="editPreviewImage"
                :src="editPreviewImage"
                class="h-full w-full object-cover"
              />
              <span
                v-else
                class="material-symbols-outlined text-2xl text-[#8E3E2F]"
                >add_a_photo</span
              >
            </div>
            <div class="flex flex-col gap-1.5">
              <button
                type="button"
                @click="triggerEditFileSelect"
                class="rounded-lg bg-[#8E3E2F] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#6E281C]"
              >
                Tải ảnh mới
              </button>
              <button
                v-if="editPreviewImage"
                type="button"
                @click="removeEditImage"
                class="text-left text-xs font-semibold text-[#ba1a1a] hover:underline"
              >
                Xóa ảnh
              </button>
            </div>
          </div>
        </div>

        <div>
          <label
            class="mb-1 block text-xs font-semibold uppercase text-[#1e1b1b]"
            >Tên sản phẩm *</label
          >
          <input
            v-model="editForm.name"
            type="text"
            placeholder="VD: Mì Trộn Sa Tế Đặc Biệt"
            class="h-10 w-full rounded-xl border border-[#c1c9b9]/70 bg-white px-3.5 text-xs font-medium text-[#1e1b1b] outline-none focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20"
          />
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label
              class="mb-1 block text-xs font-semibold uppercase text-[#1e1b1b]"
              >Giá bán (VNĐ) *</label
            >
            <input
              v-model.number="editForm.sellingPrice"
              type="number"
              min="0"
              step="1000"
              placeholder="VD: 35000"
              class="h-10 w-full rounded-xl border border-[#c1c9b9]/70 bg-white px-3.5 text-xs font-medium text-[#1e1b1b] outline-none focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20"
            />
          </div>
          <div>
            <label
              class="mb-1 block text-xs font-semibold uppercase text-[#1e1b1b]"
              >Danh mục *</label
            >
            <Select
              v-model="editForm.category"
              :options="categoryStringList"
              editable
              filter
              placeholder="Chọn hoặc nhập danh mục"
              class="h-10 w-full text-xs font-medium"
            />
          </div>
          <div>
            <label
              class="mb-1 block text-xs font-semibold uppercase text-[#1e1b1b]"
              >Đơn vị bán *</label
            >
            <Select
              v-model="editForm.unit"
              :options="units"
              editable
              filter
              placeholder="Chọn hoặc nhập đơn vị"
              class="h-10 w-full text-xs font-medium"
            />
          </div>
          <div>
            <label
              class="mb-1 block text-xs font-semibold uppercase text-[#1e1b1b]"
              >Trạng thái kinh doanh</label
            >
            <Select
              v-model="editForm.status"
              :options="['Đang kinh doanh', 'Tạm ngừng']"
              class="h-10 w-full text-xs font-medium"
            />
          </div>
        </div>

        <!-- BOM Section -->
        <div class="border-t border-[#E2D7CC] pt-4">
          <div class="mb-3 flex items-center justify-between">
            <h3
              class="text-xs font-bold uppercase tracking-wider text-[#1e1b1b]"
            >
              Định mức công thức (BOM)
            </h3>
            <span
              class="rounded-md bg-[#c9edb5]/40 px-2.5 py-0.5 text-[11px] font-semibold text-[#326824]"
              >Tính Cost tự động</span
            >
          </div>

          <!-- Add Ingredient Row -->
          <div class="mb-3 flex flex-col gap-2.5 sm:flex-row">
            <Select
              v-model="selectedEditIngId"
              :options="availableIngredients"
              optionLabel="name"
              optionValue="id"
              filter
              placeholder="Chọn nguyên liệu..."
              class="h-10 flex-1 text-xs font-medium"
            />
            <input
              v-model.number="addEditAmount"
              type="number"
              placeholder="Định lượng"
              class="h-10 w-full rounded-xl border border-[#c1c9b9]/70 bg-white px-3.5 text-xs font-medium text-[#1e1b1b] outline-none focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20 sm:w-28"
            />
            <button
              @click="addEditRecipeItem"
              type="button"
              class="flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-xl bg-[#8E3E2F] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#6E281C]"
            >
              <span class="material-symbols-outlined text-base">add</span>
              <span>Thêm</span>
            </button>
          </div>

          <!-- BOM Ingredients Table -->
          <div class="overflow-x-auto rounded-xl border border-[#E2D7CC]">
            <table class="w-full text-left text-xs text-[#1e1b1b]">
              <thead
                class="border-b border-[#E2D7CC] bg-[#F5EFE8] font-semibold uppercase tracking-wider text-[#42493d]"
              >
                <tr>
                  <th class="px-3 py-2.5">Tên nguyên liệu</th>
                  <th class="px-3 py-2.5 text-center">Định lượng</th>
                  <th class="px-3 py-2.5 text-center">ĐVT BOM</th>
                  <th class="px-3 py-2.5 text-center">Đơn giá quy đổi</th>
                  <th class="px-3 py-2.5 text-right">Thành tiền</th>
                  <th class="px-3 py-2.5 text-center">Xóa</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#F2ECE4]">
                <tr
                  v-for="(item, idx) in editRecipeItems"
                  :key="idx"
                  class="transition hover:bg-[#F5EFE8]/50"
                >
                  <td class="px-3 py-2 font-semibold text-[#1e1b1b]">
                    <div>{{ item.ingredientName }}</div>
                    <div class="text-[10px] font-medium text-[#72796c]">
                      Kho: {{ formatCurrency(item.unitCost) }} /
                      {{ item.stockUnit }}
                    </div>
                  </td>
                  <td class="px-3 py-2 text-center">
                    <input
                      v-model.number="item.amount"
                      type="number"
                      min="0"
                      step="any"
                      class="w-16 rounded border border-[#c1c9b9]/70 px-2 py-0.5 text-center text-xs font-bold outline-none focus:border-[#8E3E2F]"
                    />
                  </td>
                  <td class="px-3 py-2 text-center">
                    <Select
                      v-model="item.recipeUnit"
                      :options="COMMON_UNITS"
                      editable
                      filter
                      class="w-20 text-xs font-semibold"
                    />
                  </td>
                  <td
                    class="px-3 py-2 text-center font-mono text-[11px] text-[#72796c]"
                  >
                    {{ formatCurrency(getEditItemUnitCost(item)) }} /
                    {{ item.recipeUnit }}
                  </td>
                  <td class="px-3 py-2 text-right font-bold text-[#1e1b1b]">
                    {{ formatCurrency(getEditItemCost(item)) }}
                  </td>
                  <td class="px-3 py-2 text-center">
                    <button
                      @click="removeEditRecipeItem(idx)"
                      type="button"
                      class="rounded p-1 text-[#ba1a1a] transition hover:bg-[#ffdad6]"
                    >
                      <span class="material-symbols-outlined text-sm"
                        >delete</span
                      >
                    </button>
                  </td>
                </tr>
                <tr v-if="editRecipeItems.length === 0">
                  <td
                    colspan="6"
                    class="py-3 text-center italic text-[#72796c]"
                  >
                    Chưa có nguyên liệu nào trong định mức công thức
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Cost & Margin Summary inside Edit Modal -->
          <div
            class="mt-3 flex items-center justify-between rounded-xl border border-[#E2D7CC] bg-[#F2ECE4] p-3"
          >
            <div>
              <span
                class="block text-[10px] font-bold uppercase tracking-wider text-[#72796c]"
                >Tổng giá vốn (Cost NVL)</span
              >
              <span class="font-display text-base font-bold text-[#326824]">{{
                formatCurrency(editTotalCost)
              }}</span>
            </div>
            <div class="text-right">
              <span
                class="block text-[10px] font-bold uppercase tracking-wider text-[#72796c]"
                >Biên lợi nhuận gộp</span
              >
              <span class="font-display text-base font-bold text-[#326824]">{{
                editProfitMargin
              }}</span>
            </div>
          </div>
        </div>

        <div class="mt-4 flex justify-end gap-2 border-t border-[#E2D7CC] pt-3">
          <button
            @click="showEditModal = false"
            type="button"
            class="h-10 cursor-pointer rounded-xl bg-[#F2ECE4] px-4 text-xs font-semibold text-[#42493d] transition hover:bg-[#E8DFD5]"
          >
            Hủy
          </button>
          <button
            @click="handleSaveEdit"
            :disabled="isSavingEdit"
            type="button"
            class="flex h-10 cursor-pointer items-center gap-1.5 rounded-xl bg-[#8E3E2F] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#6E281C] disabled:opacity-50"
          >
            <span
              v-if="isSavingEdit"
              class="material-symbols-outlined animate-spin text-sm"
              >refresh</span
            >
            <span>{{ isSavingEdit ? 'Đang lưu...' : 'Lưu thay đổi' }}</span>
          </button>
        </div>
      </div>
    </Dialog>

    <!-- Delete Product Confirmation Modal Dialog -->
    <Dialog
      v-model:visible="showDeleteModal"
      header="Xác nhận Xóa Sản phẩm"
      modal
      class="w-full max-w-md p-0"
    >
      <div class="flex flex-col gap-4 p-5">
        <p class="text-xs font-medium text-[#42493d]">
          Bạn có chắc chắn muốn xóa sản phẩm
          <strong class="text-[#1e1b1b]">{{ deleteTarget?.name }}</strong> (Mã:
          {{ deleteTarget?.id }})?
        </p>

        <div class="mt-2 flex justify-end gap-2 border-t border-[#E2D7CC] pt-3">
          <button
            @click="showDeleteModal = false"
            type="button"
            class="h-10 cursor-pointer rounded-xl bg-[#F2ECE4] px-4 text-xs font-semibold text-[#42493d] transition hover:bg-[#E8DFD5]"
          >
            Hủy bỏ
          </button>
          <button
            @click="handleConfirmDelete"
            :disabled="isDeleting"
            type="button"
            class="flex h-10 cursor-pointer items-center gap-1.5 rounded-xl bg-[#ba1a1a] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#93000a] disabled:opacity-50"
          >
            <span
              v-if="isDeleting"
              class="material-symbols-outlined animate-spin text-sm"
              >refresh</span
            >
            <span>{{ isDeleting ? 'Đang xóa...' : 'Đồng ý Xóa' }}</span>
          </button>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<style scoped lang="scss" src="./ProductList.scss"></style>
