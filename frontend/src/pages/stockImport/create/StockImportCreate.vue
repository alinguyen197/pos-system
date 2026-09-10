<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import Select from 'primevue/select'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import { fetchIngredients } from '@/api/ingredient.api'
import { fetchMasterCodes } from '@/api/masterCode.api'
import { createStockImport, fetchStockImports, StockImportRecord } from '@/api/stockImport.api'
import { useAppToast } from '@/composables/useAppToast'
import { useListQuery } from '@/composables/useListQuery'

const router = useRouter()
const { showSuccess, showError, showWarning } = useAppToast()

// --- Form State: Tạo đơn nhập kho mới ---
const supplier = ref('')
const warehouse = ref('Kho tổng')
const note = ref('')
const importDate = ref(new Date().toISOString().slice(0, 16))

const isSubmitting = ref(false)
const errorMessage = ref('')

interface AvailableIngredient {
  id: string
  dbId?: number
  name: string
  category: string
  unit: string
  defaultCost: number
}

const availableIngredients = ref<AvailableIngredient[]>([])
const unitOptions = ref<string[]>(['kg', 'g', 'lít', 'ml', 'bình', 'chai', 'lon', 'hộp', 'gói', 'bịch', 'thùng', 'ly', 'cái', 'phần', 'cốc'])

// Add Item Form State
const selectedIngId = ref('')
const addUnit = ref('kg')
const addQty = ref<number>(1)
const addUnitPrice = ref<number>(0)
const addTotalPrice = ref<number>(0)
const priceInputMode = ref<'unit' | 'total'>('total')

// --- Pack Mode (Nhập theo quy cách đóng gói) ---
const isPackMode = ref(false)
const packSize = ref<number>(1)
const packCount = ref<number>(1)
const packUnit = ref('bình')
const packUnitOptions = ['bình', 'hộp', 'lon', 'gói', 'thùng', 'chai', 'bịch', 'túi', 'bao', 'cái', 'kg', 'lít']

const packTotalQty = computed(() => {
  const s = Number(packSize.value) || 0
  const c = Number(packCount.value) || 0
  return Math.round(s * c * 1000) / 1000
})

watch([packSize, packCount], () => {
  if (isPackMode.value) {
    addQty.value = packTotalQty.value
    if (priceInputMode.value === 'total') {
      if (addTotalPrice.value > 0 && addQty.value > 0) {
        addUnitPrice.value = Math.round((addTotalPrice.value / addQty.value) * 100) / 100
      }
    } else {
      if (addUnitPrice.value > 0) {
        addTotalPrice.value = Math.round(addQty.value * addUnitPrice.value)
      }
    }
  }
})

const togglePackMode = () => {
  isPackMode.value = !isPackMode.value
  if (isPackMode.value) {
    addQty.value = packTotalQty.value
  }
}

interface ImportRow {
  ingredient: AvailableIngredient
  unit: string
  qty: number
  unitPrice: number
  totalPrice: number
  packInfo?: string
  isPackMode?: boolean
  packSize?: number
  packCount?: number
  packUnit?: string
}

const importItems = ref<ImportRow[]>([])

// --- Lịch sử các lần nhập hàng (History List & Search State) ---
const searchKeyword = ref('')
const searchWarehouse = ref('all')
const searchFromDate = ref('')
const searchToDate = ref('')

const warehouseOptions = ref([
  { label: 'Tất cả kho', value: 'all' },
  { label: 'Kho tổng', value: 'Kho tổng' },
  { label: 'Kho phụ - Q3', value: 'Kho phụ - Q3' },
  { label: 'Bếp trung tâm', value: 'Bếp trung tâm' },
])

const {
  items: historyImports,
  pagination,
  summary: historySummary,
  loading: loadingHistory,
  fetchList: fetchHistoryList,
  handleSort: handleHistorySort,
  handlePageChange: handleHistoryPageChange,
  handlePageSizeChange: handleHistoryPageSizeChange,
} = useListQuery<StockImportRecord>(fetchStockImports, { sortBy: 'id', sortOrder: 'desc' }, 10)

// Detail Modal State
const showDetailModal = ref(false)
const selectedImport = ref<StockImportRecord | null>(null)

const openDetailModal = (item: StockImportRecord) => {
  selectedImport.value = item
  showDetailModal.value = true
}

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

const formatDateTime = (dateStr?: string | Date) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return String(dateStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const loadData = async () => {
  try {
    const [res, unitCodes] = await Promise.all([
      fetchIngredients({ pageSize: 1000 }),
      fetchMasterCodes('UNIT'),
    ])

    if (unitCodes && unitCodes.length > 0) {
      const setUnits = new Set([...unitOptions.value, ...unitCodes.map((u) => u.label)])
      unitOptions.value = Array.from(setUnits)
    }

    const ingredientsData = res.items || []
    if (ingredientsData.length > 0) {
      availableIngredients.value = ingredientsData.map((ing) => ({
        id: ing.id,
        dbId: ing.dbId,
        name: ing.name,
        category: ing.category,
        unit: ing.unit || 'kg',
        defaultCost: ing.rawCost || 0,
      }))
      if (availableIngredients.value.length > 0 && !selectedIngId.value) {
        selectedIngId.value = availableIngredients.value[0].id
        onSelectIngredient(availableIngredients.value[0].id)
      }
    }

    await loadHistory()
  } catch (error) {
    console.error('Error loading stock import data:', error)
  }
}

const getHistorySearchParams = () => {
  return {
    keyword: searchKeyword.value.trim(),
    warehouse: searchWarehouse.value,
    fromDate: searchFromDate.value || undefined,
    toDate: searchToDate.value || undefined,
  }
}

const loadHistory = async (silent: boolean = false) => {
  await fetchHistoryList(getHistorySearchParams(), silent)
}

const onSearchHistory = () => {
  pagination.page = 1
  loadHistory()
}

const onResetSearchHistory = () => {
  searchKeyword.value = ''
  searchWarehouse.value = 'all'
  searchFromDate.value = ''
  searchToDate.value = ''
  pagination.page = 1
  loadHistory()
}

const onHistoryPage = (event: any) => {
  const newPageSize = event.rows
  const newPage = event.page + 1
  if (newPageSize !== pagination.pageSize) {
    handleHistoryPageSizeChange(newPageSize, getHistorySearchParams())
  } else {
    handleHistoryPageChange(newPage, getHistorySearchParams())
  }
}

const onHistorySort = (event: any) => {
  if (event.sortField) {
    handleHistorySort(event.sortField, getHistorySearchParams())
  }
}

onMounted(() => {
  loadData()
})

const onSelectIngredient = (ingId: string) => {
  const ing = availableIngredients.value.find((i) => i.id === ingId)
  if (!ing) return
  addUnit.value = ing.unit || 'kg'
  if (ing.defaultCost > 0) {
    addUnitPrice.value = ing.defaultCost
    const qty = isPackMode.value ? packTotalQty.value : (addQty.value || 1)
    addTotalPrice.value = Math.round(qty * ing.defaultCost)
  } else {
    addUnitPrice.value = 0
    addTotalPrice.value = 0
  }
}

watch(selectedIngId, (newId) => {
  if (newId) onSelectIngredient(newId)
})

const onQtyChange = () => {
  if (isPackMode.value) return
  const qty = Number(addQty.value) || 0
  if (qty <= 0) return

  if (priceInputMode.value === 'total') {
    if (addTotalPrice.value > 0) {
      addUnitPrice.value = Math.round((addTotalPrice.value / qty) * 100) / 100
    }
  } else {
    if (addUnitPrice.value > 0) {
      addTotalPrice.value = Math.round(qty * addUnitPrice.value)
    }
  }
}

const onUnitPriceInput = () => {
  priceInputMode.value = 'unit'
  const qty = isPackMode.value ? packTotalQty.value : (Number(addQty.value) || 1)
  const price = Number(addUnitPrice.value) || 0
  addTotalPrice.value = Math.round(qty * price)
}

const onTotalPriceInput = () => {
  priceInputMode.value = 'total'
  const qty = isPackMode.value ? packTotalQty.value : (Number(addQty.value) || 1)
  const total = Number(addTotalPrice.value) || 0
  if (qty > 0) {
    addUnitPrice.value = Math.round((total / qty) * 100) / 100
  }
}

const addImportItem = () => {
  const ing = availableIngredients.value.find((i) => i.id === selectedIngId.value)
  if (!ing) {
    showWarning('Vui lòng chọn nguyên liệu')
    return
  }

  const qty = isPackMode.value ? packTotalQty.value : Number(addQty.value)
  if (!qty || qty <= 0) {
    showWarning('Vui lòng nhập số lượng nhập hợp lệ (> 0)')
    return
  }

  const total = Number(addTotalPrice.value) || 0
  const unitP = Number(addUnitPrice.value) || (qty > 0 ? total / qty : 0)

  if (total <= 0 && unitP <= 0) {
    showWarning('Vui lòng nhập đơn giá hoặc tổng tiền hàng')
    return
  }

  const finalUnitPrice = unitP > 0 ? unitP : Math.round((total / qty) * 100) / 100
  const finalTotalPrice = total > 0 ? total : Math.round(qty * finalUnitPrice)

  let packInfo: string | undefined = undefined
  if (isPackMode.value) {
    packInfo = `${packCount.value} ${packUnit.value} × ${packSize.value} ${addUnit.value}`
  }

  importItems.value.push({
    ingredient: ing,
    unit: addUnit.value || ing.unit,
    qty,
    unitPrice: finalUnitPrice,
    totalPrice: finalTotalPrice,
    packInfo,
    isPackMode: isPackMode.value,
    packSize: isPackMode.value ? packSize.value : undefined,
    packCount: isPackMode.value ? packCount.value : undefined,
    packUnit: isPackMode.value ? packUnit.value : undefined,
  })

  // Reset inputs
  if (isPackMode.value) {
    packCount.value = 1
    packSize.value = 1
  } else {
    addQty.value = 1
  }
  addTotalPrice.value = 0
  addUnitPrice.value = 0
}

const updateRowQty = (row: ImportRow) => {
  const q = Number(row.qty) || 0
  if (q > 0) {
    row.totalPrice = Math.round(q * (row.unitPrice || 0))
  }
}

const updateRowUnitPrice = (row: ImportRow) => {
  const p = Number(row.unitPrice) || 0
  const q = Number(row.qty) || 0
  row.totalPrice = Math.round(q * p)
}

const updateRowTotalPrice = (row: ImportRow) => {
  const t = Number(row.totalPrice) || 0
  const q = Number(row.qty) || 0
  if (q > 0) {
    row.unitPrice = Math.round((t / q) * 100) / 100
  }
}

const removeItem = (idx: number) => {
  importItems.value.splice(idx, 1)
}

const totalAmount = computed(() => {
  return importItems.value.reduce((sum, item) => sum + (Number(item.totalPrice) || (item.qty * item.unitPrice)), 0)
})

const previewQty = computed(() => {
  return isPackMode.value ? packTotalQty.value : (Number(addQty.value) || 0)
})

const handleSave = async () => {
  if (importItems.value.length === 0) {
    const msg = 'Vui lòng thêm ít nhất 1 nguyên liệu vào đơn nhập'
    errorMessage.value = msg
    showWarning(msg)
    return
  }

  try {
    isSubmitting.value = true
    errorMessage.value = ''

    const res = await createStockImport({
      supplier: supplier.value.trim() || 'Nhà cung cấp lẻ',
      warehouse: warehouse.value.trim() || 'Kho tổng',
      importDate: importDate.value,
      note: note.value,
      items: importItems.value.map((i) => ({
        ingredientId: i.ingredient.id,
        dbId: i.ingredient.dbId,
        ingredientName: i.ingredient.name,
        unit: i.unit,
        qty: Number(i.qty) || 0,
        unitPrice: Number(i.unitPrice) || 0,
        totalAmount: Number(i.totalPrice) || 0,
        isPackMode: i.isPackMode,
        packSize: i.packSize,
        packCount: i.packCount,
        packUnit: i.packUnit,
      })),
    })

    const code = res?.importCode || 'mới'
    showSuccess(`Đã tạo phiếu nhập kho #${code} và cập nhật tồn kho thành công!`)

    // Reset Form
    importItems.value = []
    supplier.value = ''
    note.value = ''
    importDate.value = new Date().toISOString().slice(0, 16)

    // Reload History & Ingredients
    await Promise.all([
      loadHistory(true),
      loadData(),
    ])
  } catch (error: any) {
    console.error('Error saving stock import:', error)
    const msg = error?.response?.data?.message || error?.message || 'Lỗi khi lưu phiếu nhập kho'
    errorMessage.value = msg
    showError(msg)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="stock-import-create-page w-full flex flex-col gap-6 max-w-7xl mx-auto pb-16">
    <!-- Header Title & Action Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2D7CC]">
      <div>
        <h1 class="text-2xl font-bold font-display text-[#1e1b1b]">Quản lý & Nhập hàng kho</h1>
        <p class="text-xs text-[#42493d] mt-1 font-medium">Lập phiếu nhập kho nguyên liệu, tính toán quy cách đóng gói và theo dõi lịch sử các lần nhập hàng</p>
      </div>
      <div class="flex items-center gap-3">
        <button
          @click="router.push('/ingredients')"
          type="button"
          class="h-10 px-4 bg-[#F2ECE4] hover:bg-[#E8DFD5] text-[#42493d] font-semibold text-xs rounded-xl border border-[#c1c9b9]/60 transition cursor-pointer flex items-center gap-1.5"
        >
          <span class="material-symbols-outlined text-base">arrow_back</span>
          <span>Về kho nguyên liệu</span>
        </button>
        <button
          @click="handleSave"
          :disabled="isSubmitting"
          class="h-10 px-5 bg-[#8E3E2F] hover:bg-[#6E281C] text-white font-semibold text-xs rounded-xl shadow transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <span v-if="!isSubmitting" class="material-symbols-outlined text-lg">check</span>
          <span v-else class="material-symbols-outlined text-lg animate-spin">refresh</span>
          <span>{{ isSubmitting ? 'Đang lưu...' : 'Lưu đơn nhập' }}</span>
        </button>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="errorMessage" class="p-4 bg-[#ffdad6] border border-[#ba1a1a]/30 rounded-xl text-xs font-semibold text-[#ba1a1a] flex items-center gap-2">
      <span class="material-symbols-outlined text-lg">error</span>
      <span>{{ errorMessage }}</span>
    </div>

    <!-- PHẦN 1: BENTO GRID TẠO ĐƠN NHẬP KHO MỚI -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- General Info Card -->
      <div class="bg-white rounded-2xl p-6 border border-[#E2D7CC] shadow-sm flex flex-col gap-4">
        <h2 class="text-base font-bold font-display text-[#1e1b1b] border-b border-[#E2D7CC] pb-3 flex items-center gap-2">
          <span class="material-symbols-outlined text-[#8E3E2F]">post_add</span>
          <span>Thông tin phiếu nhập</span>
        </h2>

        <div class="space-y-4">
          <!-- Supplier (Text Input) -->
          <div>
            <label class="block text-xs font-semibold text-[#1e1b1b] uppercase tracking-wider mb-1.5">Nhà cung cấp</label>
            <input
              v-model="supplier"
              type="text"
              placeholder="Ví dụ: NCC Cholimex, Vinamilk, Siêu thị Metro..."
              class="w-full h-10 px-3.5 bg-white border border-[#c1c9b9]/70 rounded-xl text-xs font-medium text-[#1e1b1b] outline-none focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20 transition"
            />
          </div>

          <!-- Warehouse (Text Input) -->
          <div>
            <label class="block text-xs font-semibold text-[#1e1b1b] uppercase tracking-wider mb-1.5">Kho nhập</label>
            <input
              v-model="warehouse"
              type="text"
              placeholder="Ví dụ: Kho tổng, Kho Phụ - Q3, Bếp chính..."
              class="w-full h-10 px-3.5 bg-white border border-[#c1c9b9]/70 rounded-xl text-xs font-medium text-[#1e1b1b] outline-none focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20 transition"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-[#1e1b1b] uppercase tracking-wider mb-1.5">Thời gian nhập *</label>
            <input
              v-model="importDate"
              type="datetime-local"
              class="w-full h-10 px-3.5 bg-white border border-[#c1c9b9]/70 rounded-xl text-xs font-medium text-[#1e1b1b] outline-none focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-[#1e1b1b] uppercase tracking-wider mb-1.5">Ghi chú phiếu nhập</label>
            <textarea
              v-model="note"
              rows="3"
              placeholder="Nhập ghi chú thêm (ví dụ: Số hoá đơn VAT, ghi chú giao hàng...)"
              class="w-full px-3.5 py-2.5 bg-white border border-[#c1c9b9]/70 rounded-xl text-xs font-medium text-[#1e1b1b] outline-none focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20"
            ></textarea>
          </div>
        </div>

        <!-- Total Cost Summary Badge -->
        <div class="mt-auto p-4 bg-[#F9F6F0] rounded-xl border border-[#E2D7CC] flex justify-between items-center">
          <span class="text-xs font-bold text-[#42493d]">Tổng tiền đơn nhập:</span>
          <span class="text-xl font-bold font-display text-[#326824]">{{ formatCurrency(totalAmount) }}</span>
        </div>
      </div>

      <!-- Ingredient Items List Table Card -->
      <div class="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#E2D7CC] shadow-sm flex flex-col gap-4">
        <div class="flex justify-between items-center border-b border-[#E2D7CC] pb-3">
          <div>
            <h2 class="text-base font-bold font-display text-[#1e1b1b] flex items-center gap-2">
              <span class="material-symbols-outlined text-[#8E3E2F]">add_shopping_cart</span>
              <span>Thêm nguyên liệu vào đơn</span>
            </h2>
            <p class="text-[11px] text-[#72796c] mt-0.5">Nhập số lượng & tổng tiền mua để hệ thống tự động tính đơn giá vốn</p>
          </div>
          <span class="text-xs font-semibold text-[#8E3E2F] bg-[#F2ECE4] px-3 py-1 rounded-lg">Đã chọn: {{ importItems.length }} mục</span>
        </div>

        <!-- Add Item Selector & Calculator Box -->
        <div class="p-4 bg-[#faf5f4] rounded-xl border border-[#E2D7CC] space-y-3">

          <!-- Pack Mode Toggle Banner -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-sm text-[#8E3E2F]">inventory_2</span>
              <span class="text-[11px] font-bold text-[#42493d] uppercase tracking-wide">Chế độ nhập</span>
            </div>
            <button
              type="button"
              @click="togglePackMode"
              class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer"
              :class="isPackMode
                ? 'bg-[#8E3E2F] text-white shadow-sm'
                : 'bg-white border border-[#c1c9b9]/70 text-[#42493d] hover:border-[#8E3E2F]/50'"
            >
              <span class="material-symbols-outlined text-sm">{{ isPackMode ? 'package_2' : 'straighten' }}</span>
              <span>{{ isPackMode ? 'Nhập theo quy cách đóng gói' : 'Nhập trực tiếp số lượng' }}</span>
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <!-- Select Ingredient -->
            <div class="sm:col-span-6">
              <label class="block text-[11px] font-bold text-[#42493d] uppercase mb-1">Nguyên liệu *</label>
              <Select
                v-model="selectedIngId"
                :options="availableIngredients"
                optionLabel="name"
                optionValue="id"
                filter
                placeholder="Tìm & chọn nguyên liệu..."
                class="w-full h-10 text-xs font-medium"
              />
            </div>

            <!-- Import Unit -->
            <div class="sm:col-span-3">
              <label class="block text-[11px] font-bold text-[#42493d] uppercase mb-1">ĐVT kho</label>
              <Select
                v-model="addUnit"
                :options="unitOptions"
                editable
                filter
                placeholder="ĐVT"
                class="w-full h-10 text-xs font-medium"
              />
            </div>

            <!-- Direct Qty (when NOT pack mode) -->
            <div v-if="!isPackMode" class="sm:col-span-3">
              <label class="block text-[11px] font-bold text-[#42493d] uppercase mb-1">Số lượng *</label>
              <input
                v-model.number="addQty"
                @input="onQtyChange"
                type="number"
                step="any"
                min="0.001"
                placeholder="Ví dụ: 4.2"
                class="w-full h-10 px-3 bg-white border border-[#c1c9b9]/70 rounded-xl text-xs font-bold text-[#1e1b1b] outline-none focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20"
              />
            </div>
          </div>

          <!-- Pack Mode: quy cách đóng gói row -->
          <div v-if="isPackMode" class="p-3 bg-[#fff8e1] rounded-xl border border-[#ffe082] space-y-2">
            <div class="flex items-center gap-1.5 mb-1">
              <span class="material-symbols-outlined text-sm text-[#f57f17]">package_2</span>
              <span class="text-[11px] font-bold text-[#f57f17] uppercase tracking-wide">Quy cách đóng gói</span>
              <span class="text-[10px] text-[#a68a00] ml-1">— Nhập số đơn vị mua và dung tích/cân nặng mỗi đơn vị, hệ thống tự tính tổng vào kho</span>
            </div>
            <div class="grid grid-cols-3 gap-3">
              <!-- Pack count: số lượng mua -->
              <div>
                <label class="block text-[11px] font-bold text-[#42493d] uppercase mb-1">Số lượng mua *</label>
                <input
                  v-model.number="packCount"
                  type="number"
                  step="1"
                  min="1"
                  placeholder="Ví dụ: 2"
                  class="w-full h-10 px-3 bg-white border border-[#ffe082] rounded-xl text-xs font-bold text-[#1e1b1b] outline-none focus:border-[#f57f17] focus:ring-2 focus:ring-[#f57f17]/20"
                />
              </div>

              <!-- Pack unit: loại đóng gói -->
              <div>
                <label class="block text-[11px] font-bold text-[#42493d] uppercase mb-1">Loại đóng gói</label>
                <Select
                  v-model="packUnit"
                  :options="packUnitOptions"
                  editable
                  placeholder="bình, hộp, lon..."
                  class="w-full h-10 text-xs font-medium"
                />
              </div>

              <!-- Pack size: dung tích/cân nặng mỗi đơn vị -->
              <div>
                <label class="block text-[11px] font-bold text-[#42493d] uppercase mb-1">Quy cách ({{ addUnit }}/{{ packUnit }})</label>
                <input
                  v-model.number="packSize"
                  type="number"
                  step="any"
                  min="0.001"
                  :placeholder="`Ví dụ: 2.1`"
                  class="w-full h-10 px-3 bg-white border border-[#ffe082] rounded-xl text-xs font-bold text-[#1e1b1b] outline-none focus:border-[#f57f17] focus:ring-2 focus:ring-[#f57f17]/20"
                />
              </div>
            </div>

            <!-- Pack calculation result -->
            <div class="flex items-center gap-2 mt-1 p-2 bg-white rounded-lg border border-[#ffe082]">
              <span class="material-symbols-outlined text-sm text-[#f57f17]">calculate</span>
              <span class="text-[11px] text-[#42493d]">
                <strong class="text-[#1e1b1b]">{{ packCount }} {{ packUnit }}</strong>
                × <strong class="text-[#1e1b1b]">{{ packSize }} {{ addUnit }}/{{ packUnit }}</strong>
                =
                <strong class="text-[#326824] text-sm">{{ packTotalQty }} {{ addUnit }}</strong>
                <span class="text-[#72796c] ml-1">(sẽ được nhập vào kho)</span>
              </span>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <!-- Total Price / Thành tiền -->
            <div class="sm:col-span-5">
              <label class="block text-[11px] font-bold text-[#42493d] uppercase mb-1">
                Tổng tiền mua (VNĐ) <span class="text-[#8E3E2F] font-normal lowercase">(ví dụ 57.000)</span>
              </label>
              <input
                v-model.number="addTotalPrice"
                @input="onTotalPriceInput"
                type="number"
                min="0"
                placeholder="57,000"
                class="w-full h-10 px-3 bg-white border border-[#c1c9b9]/70 rounded-xl text-xs font-bold text-[#326824] outline-none focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20"
              />
            </div>

            <!-- Unit Price / Đơn giá tính ra -->
            <div class="sm:col-span-4">
              <label class="block text-[11px] font-bold text-[#42493d] uppercase mb-1">
                Đơn giá tính ra (₫/{{ addUnit }})
              </label>
              <input
                v-model.number="addUnitPrice"
                @input="onUnitPriceInput"
                type="number"
                min="0"
                placeholder="27,143"
                class="w-full h-10 px-3 bg-white border border-[#c1c9b9]/70 rounded-xl text-xs font-semibold text-[#1e1b1b] outline-none focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20"
              />
            </div>

            <!-- Add Button -->
            <div class="sm:col-span-3">
              <button
                @click="addImportItem"
                type="button"
                class="w-full h-10 px-4 bg-[#8E3E2F] hover:bg-[#6E281C] text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer shadow-sm"
              >
                <span class="material-symbols-outlined text-base">add</span>
                <span>Thêm vào đơn</span>
              </button>
            </div>
          </div>

          <!-- Formula Preview Chip -->
          <div v-if="previewQty > 0 && (addTotalPrice > 0 || addUnitPrice > 0)" class="flex items-center gap-2 text-[11px] text-[#72796c] bg-white px-3 py-1.5 rounded-lg border border-[#E2D7CC]">
            <span class="material-symbols-outlined text-sm text-[#8E3E2F]">calculate</span>
            <span>
              Quy cách tính:
              <strong>{{ previewQty }} {{ addUnit }}</strong>
              × <strong>{{ formatCurrency(addUnitPrice) }}</strong>
              = <strong class="text-[#326824]">{{ formatCurrency(addTotalPrice) }}</strong>
            </span>
          </div>
        </div>

        <!-- Table of Import Items -->
        <div class="overflow-x-auto border border-[#E2D7CC] rounded-xl">
          <table class="w-full text-left text-xs text-[#1e1b1b]">
            <thead class="bg-[#F5EFE8] text-[#42493d] font-semibold uppercase tracking-wider border-b border-[#E2D7CC]">
              <tr>
                <th class="py-3 px-3 w-10 text-center">STT</th>
                <th class="py-3 px-3">Tên nguyên liệu</th>
                <th class="py-3 px-3 w-28 text-center">ĐVT kho</th>
                <th class="py-3 px-3 w-28 text-center">Số lượng</th>
                <th class="py-3 px-3 w-32 text-right">Đơn giá vốn (₫)</th>
                <th class="py-3 px-3 w-36 text-right">Thành tiền (₫)</th>
                <th class="py-3 px-2 w-12 text-center">Xóa</th>
              </tr>
            </thead>
            <tbody v-if="importItems.length > 0" class="divide-y divide-[#F2ECE4]">
              <tr v-for="(item, idx) in importItems" :key="idx" class="hover:bg-[#F5EFE8]/50 transition">
                <td class="py-3 px-3 text-center font-bold text-[#72796c]">{{ idx + 1 }}</td>
                <td class="py-3 px-3">
                  <div class="font-bold text-[#1e1b1b]">{{ item.ingredient.name }}</div>
                  <div class="text-[10px] text-[#72796c]">{{ item.ingredient.id }} • {{ item.ingredient.category }}</div>
                  <div v-if="item.packInfo" class="mt-0.5 inline-flex items-center gap-1 text-[10px] text-[#a68a00] bg-[#fff8e1] px-1.5 py-0.5 rounded-md border border-[#ffe082]">
                    <span class="material-symbols-outlined text-xs">package_2</span>
                    {{ item.packInfo }}
                  </div>
                </td>
                <td class="py-3 px-3 text-center">
                  <input
                    v-model="item.unit"
                    type="text"
                    class="w-20 px-2 py-1 bg-white border border-[#c1c9b9]/70 rounded-lg text-center font-semibold text-xs outline-none focus:border-[#8E3E2F]"
                  />
                </td>
                <td class="py-3 px-3 text-center">
                  <input
                    v-model.number="item.qty"
                    @input="updateRowQty(item)"
                    type="number"
                    step="any"
                    min="0.001"
                    class="w-20 px-2 py-1 bg-white border border-[#c1c9b9]/70 rounded-lg text-center font-bold text-xs outline-none focus:border-[#8E3E2F]"
                  />
                </td>
                <td class="py-3 px-3 text-right">
                  <input
                    v-model.number="item.unitPrice"
                    @input="updateRowUnitPrice(item)"
                    type="number"
                    step="any"
                    min="0"
                    class="w-24 px-2 py-1 bg-white border border-[#c1c9b9]/70 rounded-lg text-right font-medium text-xs outline-none focus:border-[#8E3E2F]"
                  />
                </td>
                <td class="py-3 px-3 text-right">
                  <input
                    v-model.number="item.totalPrice"
                    @input="updateRowTotalPrice(item)"
                    type="number"
                    step="any"
                    min="0"
                    class="w-28 px-2 py-1 bg-white border border-[#c1c9b9]/70 rounded-lg text-right font-bold text-xs text-[#326824] outline-none focus:border-[#8E3E2F]"
                  />
                </td>
                <td class="py-3 px-2 text-center">
                  <button @click="removeItem(idx)" type="button" class="p-1 text-[#ba1a1a] hover:bg-[#ffdad6] rounded-md transition cursor-pointer" title="Xóa dòng này">
                    <span class="material-symbols-outlined text-base">delete</span>
                  </button>
                </td>
              </tr>
            </tbody>
            <tbody v-else>
              <tr>
                <td colspan="7" class="py-8 text-center text-[#72796c]">
                  <span class="material-symbols-outlined text-3xl text-[#c1c9b9] block mb-1">add_shopping_cart</span>
                  <span class="text-xs font-semibold">Chưa có nguyên liệu nào trong đơn nhập</span>
                  <p class="text-[11px] text-[#72796c] mt-0.5">Vui lòng chọn nguyên liệu và bấm "+ Thêm vào đơn" ở phía trên</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- =========================================================
         PHẦN 2: BẢNG DỮ LIỆU CÁC LẦN NHẬP HÀNG (HISTORY & MANAGEMENT)
         ========================================================= -->
    <div class="bg-white rounded-2xl border border-[#E2D7CC] shadow-sm overflow-hidden flex flex-col">
      <!-- Section Header with Stats -->
      <div class="p-5 border-b border-[#E2D7CC] bg-[#F9F6F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-lg font-bold font-display text-[#1e1b1b] flex items-center gap-2">
            <span class="material-symbols-outlined text-[#8E3E2F]">history</span>
            <span>Lịch sử các lần nhập hàng</span>
          </h2>
          <p class="text-xs text-[#42493d] mt-0.5 font-medium">Theo dõi danh sách các phiếu nhập kho, nhà cung cấp và tổng chi phí nhập hàng</p>
        </div>

        <div class="flex items-center gap-3">
          <div class="px-3.5 py-2 bg-white rounded-xl border border-[#E2D7CC] flex items-center gap-2">
            <span class="text-[11px] text-[#72796c] font-bold uppercase">Tổng phiếu:</span>
            <span class="text-xs font-bold text-[#8E3E2F]">{{ historySummary?.totalImports ?? pagination.totalRecords }} phiếu</span>
          </div>
          <div class="px-3.5 py-2 bg-white rounded-xl border border-[#E2D7CC] flex items-center gap-2">
            <span class="text-[11px] text-[#72796c] font-bold uppercase">Tổng chi phí:</span>
            <span class="text-xs font-bold text-[#326824]">{{ formatCurrency(historySummary?.totalSpend || 0) }}</span>
          </div>
        </div>
      </div>

      <!-- 1. Form Tìm kiếm & Bộ lọc (Search Form) -->
      <div class="p-4 border-b border-[#E2D7CC] bg-white">
        <form @submit.prevent="onSearchHistory" class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <!-- Keyword Input -->
          <div class="sm:col-span-4">
            <label class="block text-[11px] font-bold text-[#42493d] uppercase mb-1">Từ khóa tìm kiếm</label>
            <div class="relative">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#72796c] text-lg">search</span>
              <input
                v-model="searchKeyword"
                type="text"
                placeholder="Mã phiếu (PNK-...), NCC, ghi chú..."
                class="w-full h-10 pl-9 pr-3 bg-white border border-[#c1c9b9]/70 rounded-xl text-xs font-medium text-[#1e1b1b] outline-none focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20"
              />
            </div>
          </div>

          <!-- Warehouse Select -->
          <div class="sm:col-span-3">
            <label class="block text-[11px] font-bold text-[#42493d] uppercase mb-1">Kho nhập</label>
            <Select
              v-model="searchWarehouse"
              :options="warehouseOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full h-10 text-xs font-medium"
            />
          </div>

          <!-- Date Range: From -->
          <div class="sm:col-span-2">
            <label class="block text-[11px] font-bold text-[#42493d] uppercase mb-1">Từ ngày</label>
            <input
              v-model="searchFromDate"
              type="date"
              class="w-full h-10 px-3 bg-white border border-[#c1c9b9]/70 rounded-xl text-xs font-medium text-[#1e1b1b] outline-none focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20"
            />
          </div>

          <!-- Date Range: To -->
          <div class="sm:col-span-2">
            <label class="block text-[11px] font-bold text-[#42493d] uppercase mb-1">Đến ngày</label>
            <input
              v-model="searchToDate"
              type="date"
              class="w-full h-10 px-3 bg-white border border-[#c1c9b9]/70 rounded-xl text-xs font-medium text-[#1e1b1b] outline-none focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20"
            />
          </div>

          <!-- Search Actions -->
          <div class="sm:col-span-1 flex items-center gap-1.5">
            <button
              type="submit"
              class="w-full h-10 bg-[#8E3E2F] hover:bg-[#6E281C] text-white rounded-xl flex items-center justify-center transition cursor-pointer shadow-sm"
              title="Tìm kiếm phiếu nhập"
            >
              <span class="material-symbols-outlined text-lg">search</span>
            </button>
            <button
              type="button"
              @click="onResetSearchHistory"
              class="w-full h-10 bg-[#F2ECE4] hover:bg-[#E8DFD5] text-[#42493d] rounded-xl flex items-center justify-center border border-[#c1c9b9]/60 transition cursor-pointer"
              title="Đặt lại bộ lọc"
            >
              <span class="material-symbols-outlined text-lg">refresh</span>
            </button>
          </div>
        </form>
      </div>

      <!-- 2. PrimeVue DataTable: Danh sách Phiếu nhập kho -->
      <DataTable
        :value="historyImports"
        :loading="loadingHistory"
        lazy
        paginator
        class="flex-1"
        :rows="pagination.pageSize"
        :totalRecords="pagination.totalRecords"
        :first="(pagination.page - 1) * pagination.pageSize"
        :rowsPerPageOptions="[5, 10, 20]"
        @page="onHistoryPage"
        @sort="onHistorySort"
        tableStyle="min-width: 50rem"
        responsiveLayout="scroll"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Hiển thị {first} đến {last} trong tổng số {totalRecords} phiếu nhập"
      >
        <template #empty>
          <div class="py-10 text-center text-[#72796c] flex flex-col items-center justify-center gap-2">
            <span class="material-symbols-outlined text-4xl text-[#c1c9b9]">inventory</span>
            <span class="text-xs font-bold text-[#1e1b1b]">Chưa có lịch sử nhập hàng nào</span>
            <span class="text-[11px] text-[#72796c]">Các phiếu nhập kho sau khi tạo sẽ hiển thị tại đây</span>
          </div>
        </template>

        <Column field="importCode" header="Mã phiếu" sortable>
          <template #body="slotProps">
            <span class="font-mono font-bold text-[#8E3E2F] bg-[#F9F6F0] px-2.5 py-1 rounded-lg border border-[#E2D7CC]">
              {{ slotProps.data.importCode }}
            </span>
          </template>
        </Column>

        <Column field="importDate" header="Thời gian nhập" sortable>
          <template #body="slotProps">
            <div class="flex items-center gap-1.5 text-xs text-[#1e1b1b] font-medium">
              <span class="material-symbols-outlined text-[#72796c] text-sm">schedule</span>
              <span>{{ formatDateTime(slotProps.data.importDate) }}</span>
            </div>
          </template>
        </Column>

        <Column field="supplier" header="Nhà cung cấp" sortable>
          <template #body="slotProps">
            <div class="flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[#8E3E2F] text-sm">storefront</span>
              <span class="font-bold text-[#1e1b1b] text-xs">{{ slotProps.data.supplier || 'Nhà cung cấp lẻ' }}</span>
            </div>
          </template>
        </Column>

        <Column field="warehouse" header="Kho nhập">
          <template #body="slotProps">
            <span class="px-2.5 py-1 rounded-md bg-[#F2ECE4] text-[#42493d] font-semibold text-[11px] inline-block">
              {{ slotProps.data.warehouse || 'Kho tổng' }}
            </span>
          </template>
        </Column>

        <Column field="itemCount" header="Số mặt hàng" bodyClass="text-center" headerClass="text-center">
          <template #body="slotProps">
            <span class="font-bold text-xs text-[#42493d]">{{ slotProps.data.itemCount }} loại</span>
          </template>
        </Column>

        <Column field="totalAmount" header="Tổng tiền phiếu" sortable bodyClass="text-right" headerClass="text-right">
          <template #body="slotProps">
            <span class="font-bold font-display text-sm text-[#326824]">
              {{ formatCurrency(slotProps.data.totalAmount) }}
            </span>
          </template>
        </Column>

        <Column field="note" header="Ghi chú">
          <template #body="slotProps">
            <span class="text-xs text-[#72796c] line-clamp-1" :title="slotProps.data.note">
              {{ slotProps.data.note || '—' }}
            </span>
          </template>
        </Column>

        <Column header="Thao tác" bodyClass="text-center" headerClass="text-center">
          <template #body="slotProps">
            <button
              @click="openDetailModal(slotProps.data)"
              class="h-8 px-3 bg-[#F2ECE4] hover:bg-[#8E3E2F] text-[#8E3E2F] hover:text-white rounded-lg font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer mx-auto"
              title="Xem chi tiết phiếu nhập"
            >
              <span class="material-symbols-outlined text-sm">visibility</span>
              <span>Chi tiết</span>
            </button>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- =========================================================
         MODAL: XEM CHI TIẾT PHIẾU NHẬP KHO
         ========================================================= -->
    <Dialog
      v-model:visible="showDetailModal"
      :header="`Chi tiết Phiếu nhập kho #${selectedImport?.importCode || ''}`"
      modal
      class="w-full max-w-2xl p-0"
    >
      <div v-if="selectedImport" class="p-5 flex flex-col gap-4">
        <!-- Receipt Meta Info Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="p-3 bg-[#F9F6F0] rounded-xl border border-[#E2D7CC]">
            <span class="text-[10px] font-bold text-[#72796c] uppercase block">Mã phiếu</span>
            <span class="text-sm font-bold font-mono text-[#8E3E2F]">{{ selectedImport.importCode }}</span>
          </div>
          <div class="p-3 bg-[#F9F6F0] rounded-xl border border-[#E2D7CC]">
            <span class="text-[10px] font-bold text-[#72796c] uppercase block">Ngày nhập</span>
            <span class="text-xs font-bold text-[#1e1b1b]">{{ formatDateTime(selectedImport.importDate) }}</span>
          </div>
          <div class="p-3 bg-[#F9F6F0] rounded-xl border border-[#E2D7CC]">
            <span class="text-[10px] font-bold text-[#72796c] uppercase block">Nhà cung cấp</span>
            <span class="text-xs font-bold text-[#1e1b1b] truncate block" :title="selectedImport.supplier">{{ selectedImport.supplier }}</span>
          </div>
          <div class="p-3 bg-[#F9F6F0] rounded-xl border border-[#E2D7CC]">
            <span class="text-[10px] font-bold text-[#72796c] uppercase block">Kho nhập</span>
            <span class="text-xs font-bold text-[#1e1b1b] truncate block">{{ selectedImport.warehouse }}</span>
          </div>
        </div>

        <div v-if="selectedImport.note" class="p-3 bg-[#faf5f4] rounded-xl border border-[#E2D7CC] text-xs text-[#42493d]">
          <strong class="text-[#1e1b1b]">Ghi chú:</strong> {{ selectedImport.note }}
        </div>

        <!-- Items Table inside Modal -->
        <div class="border border-[#E2D7CC] rounded-xl overflow-hidden">
          <table class="w-full text-left text-xs text-[#1e1b1b]">
            <thead class="bg-[#F5EFE8] text-[#42493d] font-semibold uppercase tracking-wider border-b border-[#E2D7CC]">
              <tr>
                <th class="py-2.5 px-3 w-10 text-center">STT</th>
                <th class="py-2.5 px-3">Tên nguyên liệu</th>
                <th class="py-2.5 px-3 text-center">Số lượng nhập</th>
                <th class="py-2.5 px-3 text-right">Đơn giá vốn</th>
                <th class="py-2.5 px-3 text-right">Thành tiền</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#F2ECE4]">
              <tr v-for="(item, idx) in selectedImport.items || []" :key="idx" class="hover:bg-[#F9F6F0]">
                <td class="py-2.5 px-3 text-center font-bold text-[#72796c]">{{ idx + 1 }}</td>
                <td class="py-2.5 px-3">
                  <div class="font-bold text-[#1e1b1b]">{{ item.ingredientName || item.name || 'Nguyên liệu' }}</div>
                  <div v-if="item.isPackMode && item.packCount && item.packSize" class="mt-0.5 inline-flex items-center gap-1 text-[10px] text-[#a68a00] bg-[#fff8e1] px-1.5 py-0.5 rounded border border-[#ffe082]">
                    <span class="material-symbols-outlined text-xs">package_2</span>
                    {{ item.packCount }} {{ item.packUnit }} × {{ item.packSize }} {{ item.unit }}
                  </div>
                  <div v-else-if="item.note" class="text-[10px] text-[#72796c] italic">{{ item.note }}</div>
                </td>
                <td class="py-2.5 px-3 text-center font-bold font-mono">
                  {{ formatNumber(item.qty) }} {{ item.unit }}
                </td>
                <td class="py-2.5 px-3 text-right font-medium">
                  {{ formatCurrency(item.unitPrice) }}
                </td>
                <td class="py-2.5 px-3 text-right font-bold text-[#326824]">
                  {{ formatCurrency(item.totalAmount) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Total Receipt Footer -->
        <div class="p-3.5 bg-[#F9F6F0] rounded-xl border border-[#E2D7CC] flex justify-between items-center">
          <span class="text-xs font-bold text-[#42493d]">Tổng giá trị phiếu nhập kho:</span>
          <span class="text-lg font-bold font-display text-[#326824]">{{ formatCurrency(selectedImport.totalAmount) }}</span>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end p-3">
          <button
            type="button"
            @click="showDetailModal = false"
            class="h-9 px-4 bg-[#8E3E2F] hover:bg-[#6E281C] text-white font-semibold text-xs rounded-xl transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<style scoped lang="scss" src="./StockImportCreate.scss"></style>
