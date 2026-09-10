<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import { fetchIngredients, updateIngredient, deleteIngredient, IngredientItem } from '@/api/ingredient.api'
import { fetchMasterCodes } from '@/api/masterCode.api'
import { MASTER_CODES, INGREDIENT_CATEGORY_OPTIONS, STOCK_STATUS_MAP } from '@/constants/masterCodes'
import { useAppToast } from '@/composables/useAppToast'
import { useListQuery } from '@/composables/useListQuery'

const router = useRouter()
const { showSuccess, showError } = useAppToast()

const searchKeyword = ref('')
const selectedCategoryCode = ref<string>(MASTER_CODES.FILTER.ALL)

const {
  items,
  pagination,
  summary,
  loading,
  fetchList,
  handleSort,
  handlePageChange,
  handlePageSizeChange,
} = useListQuery(fetchIngredients, { sortBy: 'id', sortOrder: 'asc' }, 10)

const categoryOptions = ref<{ code: string; label: string }[]>(INGREDIENT_CATEGORY_OPTIONS)

// Edit Modal State
const showEditModal = ref(false)
const isEditCustomCategory = ref(false)
const isSavingEdit = ref(false)
const editError = ref('')
const editForm = ref({
  id: '' as string | number,
  name: '',
  category: '',
  unit: '',
  costPrice: 0,
  minStock: 0,
  stock: 0,
})

const categoryStringList = computed(() => {
  return categoryOptions.value.map((c) => c.label).filter((l) => l !== 'Tất cả')
})

// Delete Modal State
const showDeleteModal = ref(false)
const isDeleting = ref(false)
const deleteTarget = ref<IngredientItem | null>(null)

const units = ref(['kg', 'g', 'lít', 'ml', 'bình', 'bịch', 'chai', 'lon', 'hộp', 'gói', 'thùng', 'ly', 'cái', 'phần', 'cốc'])

const formatNumber = (val: number | string | undefined | null) => {
  if (val === undefined || val === null || val === '') return '0'
  const num = Number(val)
  if (isNaN(num)) return '0'
  const rounded = Math.round(num * 100) / 100
  return rounded.toLocaleString('vi-VN', { maximumFractionDigits: 2 })
}

const formatCurrency = (val: number | string | undefined | null) => {
  return `${formatNumber(val)} ₫`
}

const totalIngredientCount = computed(() => {
  return summary.value?.total ?? (pagination.totalRecords || items.value.length)
})

const totalStockValue = computed(() => {
  if (summary.value && typeof summary.value.totalValue === 'number') {
    return Math.round(summary.value.totalValue * 100) / 100
  }
  const sum = items.value.reduce((acc, item) => {
    const cost = Number(item.rawCost) || 0
    const stock = Number(item.stock) || 0
    return acc + (cost * stock)
  }, 0)
  return Math.round(sum * 100) / 100
})

const formattedTotalStockValue = computed(() => {
  return formatCurrency(totalStockValue.value)
})

const safeStockCount = computed(() => {
  if (summary.value && typeof summary.value.safe === 'number') {
    return summary.value.safe
  }
  return items.value.filter(
    (item) =>
      item.statusCode === MASTER_CODES.STOCK_STATUS.SAFE ||
      (item.stock >= item.minStock && item.statusCode !== MASTER_CODES.STOCK_STATUS.OUT_OF_STOCK)
  ).length
})

const needImportStockCount = computed(() => {
  if (summary.value && typeof summary.value.needImport === 'number') {
    return summary.value.needImport
  }
  return items.value.filter(
    (item) =>
      item.statusCode === MASTER_CODES.STOCK_STATUS.NEED_IMPORT ||
      item.statusCode === MASTER_CODES.STOCK_STATUS.NEAR_EMPTY ||
      item.statusCode === MASTER_CODES.STOCK_STATUS.VERY_LOW ||
      (item.stock < item.minStock && item.stock > 0)
  ).length
})

const outOfStockCount = computed(() => {
  if (summary.value && typeof summary.value.outOfStock === 'number') {
    return summary.value.outOfStock
  }
  return items.value.filter(
    (item) =>
      item.statusCode === MASTER_CODES.STOCK_STATUS.OUT_OF_STOCK || item.stock <= 0
  ).length
})

const loadData = async () => {
  const [masterCodeData, filterCodeData, unitCodes] = await Promise.all([
    fetchMasterCodes('INGREDIENT_CATEGORY'),
    fetchMasterCodes('COMMON_FILTER'),
    fetchMasterCodes('UNIT'),
  ])

  if (unitCodes && unitCodes.length > 0) {
    const setUnits = new Set([...units.value, ...unitCodes.map((u) => u.label)])
    units.value = Array.from(setUnits)
  }

  await fetchList({ category: selectedCategoryCode.value, keyword: searchKeyword.value })

  const catMap = new Map<string, string>()
  const allFilter = filterCodeData.find((f) => f.code === 'all') || { code: 'all', label: 'Tất cả' }
  catMap.set(allFilter.code, allFilter.label)

  if (masterCodeData.length > 0) {
    masterCodeData.forEach((m) => catMap.set(m.code, m.label))
  }

  items.value.forEach((ing) => {
    if (ing.category && !Array.from(catMap.values()).includes(ing.category)) {
      catMap.set(ing.category, ing.category)
    }
  })

  categoryOptions.value = Array.from(catMap.entries()).map(([code, label]) => ({
    code,
    label,
  }))
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

// Handle Open Edit Modal
const openEdit = (item: IngredientItem) => {
  editForm.value = {
    id: item.dbId || item.id,
    name: item.name,
    category: item.category,
    unit: item.unit,
    costPrice: Math.round((Number(item.rawCost) || 0) * 100) / 100,
    minStock: Math.round((Number(item.minStock) || 0) * 100) / 100,
    stock: Math.round((Number(item.stock) || 0) * 100) / 100,
  }
  editError.value = ''
  showEditModal.value = true
}

// Submit Edit
const handleSaveEdit = async () => {
  if (!editForm.value.name.trim()) {
    editError.value = 'Vui lòng nhập tên nguyên liệu'
    return
  }
  try {
    isSavingEdit.value = true
    editError.value = ''
    await updateIngredient(editForm.value.id, {
      name: editForm.value.name,
      category: editForm.value.category,
      unit: editForm.value.unit,
      costPrice: editForm.value.costPrice,
      minStock: editForm.value.minStock,
      stock: editForm.value.stock,
    })
    showSuccess(`Đã cập nhật nguyên liệu "${editForm.value.name}" thành công!`)
    showEditModal.value = false
    await fetchList({ category: selectedCategoryCode.value, keyword: searchKeyword.value }, true)
  } catch (error: any) {
    console.error('Error updating ingredient:', error)
    const msg = error?.response?.data?.message || error?.message || 'Lỗi khi cập nhật nguyên liệu'
    editError.value = msg
    showError(msg)
  } finally {
    isSavingEdit.value = false
  }
}

// Handle Open Delete Modal
const openDelete = (item: IngredientItem) => {
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
    await deleteIngredient(targetId)
    showSuccess(`Đã xóa nguyên liệu "${deletedName}" thành công!`)
    showDeleteModal.value = false
    deleteTarget.value = null
    await fetchList({ category: selectedCategoryCode.value, keyword: searchKeyword.value }, true)
  } catch (error: any) {
    console.error('Error deleting ingredient:', error)
    showError(error?.message || 'Lỗi khi xóa nguyên liệu')
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <div class="ingredient-list-page h-full flex flex-col gap-4 overflow-hidden">
    <!-- Header Title & Action -->
    <div class="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2D7CC]">
      <div>
        <h1 class="text-2xl font-bold font-display text-[#1e1b1b]">Quản lý Kho Nguyên liệu</h1>
        <p class="text-xs text-[#42493d] mt-1 font-medium">Theo dõi tồn kho thực tế, định mức cảnh báo và đơn giá vốn</p>
      </div>
      <div class="flex items-center gap-3">
        <button
          @click="router.push('/stock-imports/create')"
          class="h-10 px-4 bg-[#F2ECE4] hover:bg-[#E8DFD5] text-[#326824] font-semibold text-xs rounded-xl border border-[#c1c9b9]/60 transition flex items-center gap-2 cursor-pointer"
        >
          <span class="material-symbols-outlined text-lg">add_circle</span>
          <span>Tạo phiếu nhập kho</span>
        </button>
        <button
          @click="router.push('/ingredients/create')"
          class="h-10 px-4 bg-[#8E3E2F] hover:bg-[#6E281C] text-white font-semibold text-xs rounded-xl shadow transition flex items-center gap-2 cursor-pointer"
        >
          <span class="material-symbols-outlined text-lg">add</span>
          <span>Thêm nguyên liệu mới</span>
        </button>
      </div>
    </div>

    <!-- Summary Cards Row (5 Stock Status Cards) -->
    <div class="shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <!-- Card 1: Total Ingredients -->
      <div class="bg-white rounded-2xl p-4 border border-[#E2D7CC] shadow-sm flex items-center gap-3.5">
        <div class="w-11 h-11 rounded-xl bg-[#F2ECE4] text-[#8E3E2F] flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-2xl">inventory_2</span>
        </div>
        <div>
          <span class="text-[11px] font-bold text-[#72796c] uppercase block">Tổng nguyên liệu</span>
          <span class="text-xl font-bold font-display text-[#1e1b1b]">{{ totalIngredientCount }} loại</span>
        </div>
      </div>

      <!-- Card 2: Total Inventory Value -->
      <div class="bg-white rounded-2xl p-4 border border-[#E2D7CC] shadow-sm flex items-center gap-3.5">
        <div class="w-11 h-11 rounded-xl bg-[#efebe9] text-[#8E3E2F] flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-2xl">account_balance_wallet</span>
        </div>
        <div>
          <span class="text-[11px] font-bold text-[#72796c] uppercase block">Tổng giá trị kho</span>
          <span class="text-xl font-bold font-display text-[#8E3E2F]">{{ formattedTotalStockValue }}</span>
        </div>
      </div>

      <!-- Card 3: Safe Stock -->
      <div class="bg-white rounded-2xl p-4 border border-[#E2D7CC] shadow-sm flex items-center gap-3.5">
        <div class="w-11 h-11 rounded-xl bg-[#c9edb5]/60 text-[#326824] flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-2xl">check_circle</span>
        </div>
        <div>
          <span class="text-[11px] font-bold text-[#72796c] uppercase block">An toàn</span>
          <span class="text-xl font-bold font-display text-[#326824]">{{ safeStockCount }} loại</span>
        </div>
      </div>

      <!-- Card 4: Need Import / Low Stock -->
      <div class="bg-white rounded-2xl p-4 border border-[#E2D7CC] shadow-sm flex items-center gap-3.5">
        <div class="w-11 h-11 rounded-xl bg-[#fff7ed] text-[#8c6b00] flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-2xl">warning</span>
        </div>
        <div>
          <span class="text-[11px] font-bold text-[#72796c] uppercase block">Cần nhập / Sắp hết</span>
          <span class="text-xl font-bold font-display text-[#8c6b00]">{{ needImportStockCount }} loại</span>
        </div>
      </div>

      <!-- Card 5: Out of Stock -->
      <div class="bg-white rounded-2xl p-4 border border-[#E2D7CC] shadow-sm flex items-center gap-3.5">
        <div class="w-11 h-11 rounded-xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-2xl">error</span>
        </div>
        <div>
          <span class="text-[11px] font-bold text-[#72796c] uppercase block">Đã hết hàng</span>
          <span class="text-xl font-bold font-display text-[#ba1a1a]">{{ outOfStockCount }} loại</span>
        </div>
      </div>
    </div>

    <!-- Main Card -->
    <div class="flex-1 min-h-0 bg-white rounded-2xl border border-[#E2D7CC] shadow-sm overflow-hidden flex flex-col">
      <!-- Search & Filters -->
      <div class="shrink-0 p-4 border-b border-[#E2D7CC] bg-[#F9F6F0]">
        <!-- Form Search with Category Select Dropdown, Search and Reset buttons -->
        <form @submit.prevent="handleSearch" class="flex flex-col sm:flex-row items-end gap-3 w-full">
          <div class="w-full sm:w-64">
            <label class="block text-[11px] font-bold text-[#42493d] uppercase mb-1">Từ khóa tìm kiếm</label>
            <div class="relative">
              <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#72796c] text-xl">search</span>
              <input
                v-model="searchKeyword"
                type="text"
                placeholder="Tìm tên nguyên liệu, mã NL..."
                class="w-full h-10 pl-11 pr-4 bg-white border border-[#c1c9b9]/70 rounded-xl focus:outline-none focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20 text-xs font-medium text-[#1e1b1b]"
              />
            </div>
          </div>

          <!-- Filterable Category Select Dropdown inside Search Form -->
          <div class="w-full sm:w-56">
            <label class="block text-[11px] font-bold text-[#42493d] uppercase mb-1">Phân loại kho</label>
            <Select
              v-model="selectedCategoryCode"
              :options="categoryOptions"
              optionLabel="label"
              optionValue="code"
              filter
              placeholder="Tất cả phân loại"
              class="w-full h-10 text-xs"
            />
          </div>

          <div class="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="submit"
              class="h-10 px-4 bg-[#8E3E2F] hover:bg-[#6E281C] text-white font-semibold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5 whitespace-nowrap flex-1 sm:flex-none cursor-pointer"
            >
              <span class="material-symbols-outlined text-base">search</span>
              <span>Tìm kiếm</span>
            </button>
            <button
              type="button"
              @click="onResetSearch"
              class="h-10 px-3.5 bg-[#F2ECE4] hover:bg-[#E8DFD5] text-[#42493d] font-semibold text-xs rounded-xl border border-[#c1c9b9]/60 transition flex items-center justify-center gap-1.5 whitespace-nowrap flex-1 sm:flex-none cursor-pointer"
              title="Đặt lại bộ lọc"
            >
              <span class="material-symbols-outlined text-base">refresh</span>
              <span>Đặt lại</span>
            </button>
          </div>
        </form>
      </div>

      <!-- PrimeVue DataTable with Server-Side Pagination & Sorting -->
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
        currentPageReportTemplate="Hiển thị {first} đến {last} trong tổng số {totalRecords} nguyên liệu"
      >
        <template #empty>
          <div class="py-12 text-center text-[#72796c] flex flex-col items-center justify-center gap-2">
            <span class="material-symbols-outlined text-4xl text-[#c1c9b9]">inventory_2</span>
            <span class="text-xs font-bold text-[#1e1b1b]">Không tìm thấy nguyên liệu nào trong kho</span>
            <span class="text-[11px] text-[#72796c]">Vui lòng kiểm tra lại từ khóa tìm kiếm hoặc bộ lọc phân loại</span>
          </div>
        </template>

        <Column field="id" header="Mã NL" sortable>
          <template #body="slotProps">
            <span class="font-mono font-bold text-[#72796c]">{{ slotProps.data.id }}</span>
          </template>
        </Column>

        <Column field="name" header="Tên nguyên liệu" sortable>
          <template #body="slotProps">
            <span class="font-bold text-[#1e1b1b]">{{ slotProps.data.name }}</span>
          </template>
        </Column>

        <Column field="category" header="Phân loại">
          <template #body="slotProps">
            <span class="px-2.5 py-1 rounded-md bg-[#F2ECE4] text-[#42493d] font-semibold text-[11px] inline-block">
              {{ slotProps.data.category }}
            </span>
          </template>
        </Column>

        <Column header="Tồn kho / Ngưỡng min" bodyClass="text-center" headerClass="text-center">
          <template #body="slotProps">
            <div class="flex flex-col items-center gap-1">
              <div class="flex items-center justify-center gap-1 font-mono">
                <span
                  class="font-bold text-xs"
                  :class="
                    slotProps.data.statusCode === MASTER_CODES.STOCK_STATUS.OUT_OF_STOCK || slotProps.data.statusCode === MASTER_CODES.STOCK_STATUS.VERY_LOW
                      ? 'text-[#ba1a1a]'
                      : slotProps.data.stock < slotProps.data.minStock
                      ? 'text-[#8c6b00]'
                      : 'text-[#326824]'
                  "
                >
                  {{ formatNumber(slotProps.data.stock) }}
                </span>
                <span class="text-[#72796c] text-[11px]">/ {{ formatNumber(slotProps.data.minStock) }}</span>
              </div>
              <div class="w-20 bg-[#E2D7CC] h-1.5 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-300"
                  :class="
                    slotProps.data.statusCode === MASTER_CODES.STOCK_STATUS.OUT_OF_STOCK || slotProps.data.statusCode === MASTER_CODES.STOCK_STATUS.VERY_LOW
                      ? 'bg-[#ba1a1a]'
                      : slotProps.data.stock < slotProps.data.minStock
                      ? 'bg-[#8c6b00]'
                      : 'bg-[#326824]'
                  "
                  :style="{ width: `${Math.min(100, Math.max(slotProps.data.stock > 0 ? 8 : 0, (slotProps.data.stock / (slotProps.data.minStock || 1)) * 100))}%` }"
                ></div>
              </div>
            </div>
          </template>
        </Column>

        <Column field="unit" header="ĐVT lưu kho" bodyClass="text-center" headerClass="text-center">
          <template #body="slotProps">
            <span class="px-2 py-0.5 rounded bg-[#F2ECE4] text-[#42493d] font-semibold text-[11px]">{{ slotProps.data.unit }}</span>
          </template>
        </Column>

        <Column field="unitPrice" header="Đơn giá vốn" bodyClass="text-right" headerClass="text-right">
          <template #body="slotProps">
            <span v-if="slotProps.data.rawCost > 0" class="font-bold text-[#1e1b1b]">{{ formatCurrency(slotProps.data.rawCost) }}</span>
            <span v-else class="text-[11px] text-[#72796c] italic bg-[#faf5f4] px-2 py-0.5 rounded">Chưa nhập giá</span>
          </template>
        </Column>

        <Column header="Tổng giá trị tồn" bodyClass="text-right" headerClass="text-right">
          <template #body="slotProps">
            <span class="font-bold text-[#8E3E2F]">
              {{ formatCurrency((slotProps.data.stock || 0) * (slotProps.data.rawCost || 0)) }}
            </span>
          </template>
        </Column>

        <Column header="Trạng thái kho" bodyClass="text-center" headerClass="text-center">
          <template #body="slotProps">
            <span
              class="px-2.5 py-1 rounded-md font-bold text-[11px] inline-block"
              :class="STOCK_STATUS_MAP[slotProps.data.statusCode]?.class || 'bg-[#c9edb5]/60 text-[#326824]'"
            >
              {{ STOCK_STATUS_MAP[slotProps.data.statusCode]?.label || slotProps.data.status }}
            </span>
          </template>
        </Column>

        <Column header="Thao tác" bodyClass="text-center" headerClass="text-center">
          <template #body="slotProps">
            <div class="flex items-center justify-center gap-1">
              <button
                @click="openEdit(slotProps.data)"
                class="p-1.5 text-[#8E3E2F] hover:bg-[#F2ECE4] rounded-lg transition"
                title="Sửa nguyên liệu"
              >
                <span class="material-symbols-outlined text-lg">edit</span>
              </button>
              <button
                @click="openDelete(slotProps.data)"
                class="p-1.5 text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg transition"
                title="Xóa nguyên liệu"
              >
                <span class="material-symbols-outlined text-lg">delete</span>
              </button>
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Edit Modal Dialog -->
    <Dialog v-model:visible="showEditModal" header="Chỉnh sửa Nguyên liệu" modal class="w-full max-w-lg p-0">
      <div class="p-5 flex flex-col gap-4">
        <div v-if="editError" class="p-3 bg-[#ffdad6] text-[#ba1a1a] rounded-lg text-xs font-semibold">
          {{ editError }}
        </div>

        <div>
          <label class="block text-xs font-semibold text-[#1e1b1b] uppercase mb-1">Tên nguyên liệu *</label>
          <input
            v-model="editForm.name"
            type="text"
            placeholder="Tên nguyên liệu..."
            class="w-full h-10 px-3.5 border border-[#c1c9b9]/70 rounded-xl text-xs bg-white outline-none focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20 font-medium"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <div class="flex justify-between items-center mb-1">
              <label class="block text-xs font-semibold text-[#1e1b1b] uppercase">Phân loại kho *</label>
              <button
                type="button"
                @click="isEditCustomCategory = !isEditCustomCategory"
                class="text-[10px] text-[#8E3E2F] underline font-semibold cursor-pointer"
              >
                {{ isEditCustomCategory ? '← Chọn từ list' : '+ Nhập mới' }}
              </button>
            </div>
            <input
              v-if="isEditCustomCategory"
              v-model="editForm.category"
              type="text"
              placeholder="Tên phân loại..."
              class="w-full h-10 px-3.5 border border-[#8E3E2F] rounded-xl text-xs bg-white outline-none focus:ring-2 focus:ring-[#8E3E2F]/20 font-medium"
            />
            <Select
              v-else
              v-model="editForm.category"
              :options="categoryStringList"
              editable
              filter
              class="w-full h-10 text-xs font-medium"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-[#1e1b1b] uppercase mb-1">ĐVT lưu kho *</label>
            <Select
              v-model="editForm.unit"
              :options="units"
              editable
              filter
              placeholder="Ví dụ: kg, lít, lon, bình..."
              class="w-full h-10 text-xs font-medium"
            />
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-semibold text-[#1e1b1b] uppercase mb-1">Tồn kho hiện tại</label>
            <input
              v-model.number="editForm.stock"
              type="number"
              step="any"
              min="0"
              placeholder="0"
              class="w-full h-10 px-3.5 border border-[#c1c9b9]/70 rounded-xl text-xs bg-white outline-none focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20 font-medium"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-[#1e1b1b] uppercase mb-1">Tồn tối thiểu</label>
            <input
              v-model.number="editForm.minStock"
              type="number"
              step="any"
              min="0"
              placeholder="0"
              class="w-full h-10 px-3.5 border border-[#c1c9b9]/70 rounded-xl text-xs bg-white outline-none focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20 font-medium"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-[#1e1b1b] uppercase mb-1">Đơn giá vốn (₫)</label>
            <input
              v-model.number="editForm.costPrice"
              type="number"
              step="any"
              min="0"
              placeholder="0"
              class="w-full h-10 px-3.5 border border-[#c1c9b9]/70 rounded-xl text-xs bg-white outline-none focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20 font-medium"
            />
          </div>
        </div>

        <div class="text-[11px] text-[#72796c] bg-[#faf5f4] p-2.5 rounded-lg border border-[#E2D7CC]">
          💡 <strong>Đơn giá vốn:</strong> Giá cơ sở trên 1 ĐVT lưu kho (sẽ tự động tính lại khi nhập hàng mới).
        </div>

        <div class="flex justify-end gap-2 mt-2 pt-3 border-t border-[#E2D7CC]">
          <button
            @click="showEditModal = false"
            type="button"
            class="h-10 px-4 bg-[#F2ECE4] text-[#42493d] font-semibold text-xs rounded-xl hover:bg-[#E8DFD5] transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            @click="handleSaveEdit"
            :disabled="isSavingEdit"
            type="button"
            class="h-10 px-4 bg-[#8E3E2F] text-white font-semibold text-xs rounded-xl hover:bg-[#6E281C] transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <span v-if="isSavingEdit" class="material-symbols-outlined text-sm animate-spin">refresh</span>
            <span>{{ isSavingEdit ? 'Đang lưu...' : 'Lưu thay đổi' }}</span>
          </button>
        </div>
      </div>
    </Dialog>

    <!-- Delete Confirmation Modal Dialog -->
    <Dialog v-model:visible="showDeleteModal" header="Xác nhận Xóa Nguyên liệu" modal class="w-full max-w-md p-0">
      <div class="p-5 flex flex-col gap-4">
        <p class="text-xs font-medium text-[#42493d]">
          Bạn có chắc chắn muốn xóa nguyên liệu <strong class="text-[#1e1b1b]">{{ deleteTarget?.name }}</strong> (Mã: {{ deleteTarget?.id }})?
        </p>
        <div class="p-3 bg-[#F9F6F0] rounded-xl border border-[#E2D7CC] text-[11px] text-[#8E3E2F]">
          Lưu ý: Nguyên liệu này sẽ bị loại khỏi danh sách quản lý tồn kho và BOM món ăn liên quan.
        </div>

        <div class="flex justify-end gap-2 mt-2 pt-3 border-t border-[#E2D7CC]">
          <button
            @click="showDeleteModal = false"
            type="button"
            class="h-10 px-4 bg-[#F2ECE4] text-[#42493d] font-semibold text-xs rounded-xl hover:bg-[#E8DFD5] transition cursor-pointer"
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

<style scoped lang="scss" src="./IngredientList.scss"></style>
