<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import ActionConfirmDialog from '@/components/common/ActionConfirmDialog.vue'
import {
  fetchExpenditures,
  fetchExpenditureSummary,
  createExpenditure,
  updateExpenditure,
  deleteExpenditure,
  ExpenditureRecord,
  ExpenditurePayload,
  ExpenditureSummaryData,
} from '@/api/expenditure.api'
import { fetchMasterCodes } from '@/api/masterCode.api'
import { useAppToast } from '@/composables/useAppToast'
import { useAuth } from '@/composables/useAuth'

const { showSuccess, showError, showWarning } = useAppToast()
const { role } = useAuth()

const canEdit = computed(() => ['admin', 'manager'].includes(role.value || ''))

// --- Filter State ---
const periods = [
  { label: 'Hôm nay', value: 'today' },
  { label: '7 ngày qua', value: '7days' },
  { label: 'Tháng này', value: 'this_month' },
  { label: 'Quý này', value: 'this_quarter' },
  { label: 'Tùy chọn', value: 'custom' },
]

const selectedPeriod = ref('this_month')
const customFromDate = ref('')
const customToDate = ref('')
const isCustomMode = ref(false)

const searchKeyword = ref('')
const searchCategory = ref('all')
const searchPaymentMethod = ref('all')

const categoryOptions = ref([
  { code: 'all', label: 'Tất cả phân loại', emoji: '✨' },
  { code: 'reinvestment', label: 'Tái đầu tư & CSVC', emoji: '🏗️' },
  { code: 'operation', label: 'Chi phí vận hành', emoji: '⚡' },
  { code: 'premises', label: 'Thuê mặt bằng', emoji: '🏢' },
  { code: 'salary', label: 'Lương & Thưởng', emoji: '👨‍🍳' },
  { code: 'marketing', label: 'Quảng cáo & Marketing', emoji: '📢' },
  { code: 'repair', label: 'Sửa chữa & Bảo trì', emoji: '🔧' },
  { code: 'other', label: 'Chi phí khác', emoji: '📦' },
])

const paymentMethodOptions = [
  { value: 'all', label: 'Tất cả phương thức' },
  { value: 'cash', label: '💵 Tiền mặt' },
  { value: 'bank_transfer', label: '🏦 Chuyển khoản' },
  { value: 'card', label: '💳 Thẻ ATM / Visa' },
]

// --- Summary & List State ---
const summaryData = ref<ExpenditureSummaryData>({
  period: 'this_month',
  fromDate: '',
  toDate: '',
  totalRevenue: 0,
  totalStockImportCost: 0,
  totalOtherExpenses: 0,
  totalExpenditures: 0,
  netProfit: 0,
  isProfitable: true,
  expenseToRevenueRatio: 0,
  expenditureCount: 0,
  categoryBreakdown: [],
})

const items = ref<ExpenditureRecord[]>([])
const loading = ref(false)
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
})

// --- Form & Modal State ---
const showCreateEditModal = ref(false)
const isEditing = ref(false)
const editingId = ref<number | null>(null)
const isSubmitting = ref(false)
const formErrors = reactive<Record<string, string>>({})

const form = reactive<ExpenditurePayload>({
  category: 'reinvestment',
  title: '',
  amount: 0,
  expenseDate: new Date().toISOString().slice(0, 16),
  paymentMethod: 'cash',
  recipient: '',
  imageUrl: '',
  note: '',
})

// Raw input amount for formatted typing
const rawAmountStr = ref('')

watch(rawAmountStr, (newVal) => {
  const cleanVal = newVal.replace(/\D/g, '')
  form.amount = cleanVal ? parseInt(cleanVal, 10) : 0
})

// Detail & Delete Modal State
const showDetailModal = ref(false)
const selectedItem = ref<ExpenditureRecord | null>(null)
const showDeleteConfirmDialog = ref(false)
const itemToDelete = ref<ExpenditureRecord | null>(null)
const previewImageSrc = ref<string | null>(null)
const showImageModal = ref(false)

// --- Helper Functions ---
const formatCurrency = (val: number | string | undefined | null) => {
  if (val === undefined || val === null || val === '') return '0 ₫'
  const num = Number(val)
  if (isNaN(num)) return '0 ₫'
  return `${Math.round(num).toLocaleString('vi-VN')} ₫`
}

const formatDateTime = (dateStr?: string | Date) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return String(dateStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const getCategoryBadge = (catKey: string) => {
  switch (catKey) {
    case 'reinvestment':
      return {
        label: 'Tái đầu tư CSVC',
        emoji: '🏗️',
        class: 'bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe]',
      }
    case 'operation':
      return {
        label: 'Vận hành (Điện, nước)',
        emoji: '⚡',
        class: 'bg-[#fef3c7] text-[#92400e] border-[#fde68a]',
      }
    case 'premises':
      return {
        label: 'Mặt bằng',
        emoji: '🏢',
        class: 'bg-[#f3e8ff] text-[#6b21a8] border-[#e9d5ff]',
      }
    case 'salary':
      return {
        label: 'Lương nhân viên',
        emoji: '👨‍🍳',
        class: 'bg-[#ecfdf5] text-[#065f46] border-[#a7f3d0]',
      }
    case 'marketing':
      return {
        label: 'Marketing',
        emoji: '📢',
        class: 'bg-[#ffedd5] text-[#9a3412] border-[#fed7aa]',
      }
    case 'repair':
      return {
        label: 'Sửa chữa',
        emoji: '🔧',
        class: 'bg-[#e0e7ff] text-[#3730a3] border-[#c7d2fe]',
      }
    default:
      return {
        label: 'Chi phí khác',
        emoji: '📦',
        class: 'bg-[#F2ECE4] text-[#5D4037] border-[#E2D7CC]',
      }
  }
}

const getPaymentMethodLabel = (method: string) => {
  switch (method) {
    case 'bank_transfer':
    case 'bank':
      return '🏦 Chuyển khoản'
    case 'card':
      return '💳 Quẹt thẻ'
    default:
      return '💵 Tiền mặt'
  }
}

// --- Data Fetching ---
const getSearchParams = () => {
  const params: any = {
    page: pagination.page,
    limit: pagination.limit,
    period: selectedPeriod.value,
    category: searchCategory.value !== 'all' ? searchCategory.value : undefined,
    paymentMethod:
      searchPaymentMethod.value !== 'all'
        ? searchPaymentMethod.value
        : undefined,
    keyword: searchKeyword.value.trim() || undefined,
  }

  if (selectedPeriod.value === 'custom') {
    params.fromDate = customFromDate.value || undefined
    params.toDate = customToDate.value || undefined
  }

  return params
}

const loadData = async () => {
  loading.value = true
  try {
    const params = getSearchParams()
    const [summaryRes, listRes] = await Promise.all([
      fetchExpenditureSummary(params),
      fetchExpenditures(params),
    ])

    if (summaryRes) {
      summaryData.value = summaryRes
    }

    if (listRes) {
      items.value = listRes.items
      pagination.total = listRes.pagination.total
      pagination.totalPages = listRes.pagination.totalPages
    }
  } catch (error) {
    console.error('Lỗi khi tải dữ liệu chi tiêu:', error)
  } finally {
    loading.value = false
  }
}

const onSearch = () => {
  pagination.page = 1
  loadData()
}

const onResetFilters = () => {
  searchKeyword.value = ''
  searchCategory.value = 'all'
  searchPaymentMethod.value = 'all'
  selectedPeriod.value = 'this_month'
  customFromDate.value = ''
  customToDate.value = ''
  pagination.page = 1
  loadData()
}

const onPageChange = (event: any) => {
  pagination.page = event.page + 1
  pagination.limit = event.rows
  loadData()
}

// --- Form Operations ---
const openCreateModal = () => {
  isEditing.value = false
  editingId.value = null
  Object.keys(formErrors).forEach((key) => delete formErrors[key])

  form.category = 'reinvestment'
  form.title = ''
  form.amount = 0
  form.expenseDate = new Date().toISOString().slice(0, 16)
  form.paymentMethod = 'cash'
  form.recipient = ''
  form.imageUrl = ''
  form.note = ''
  rawAmountStr.value = ''

  showCreateEditModal.value = true
}

const openEditModal = (item: ExpenditureRecord) => {
  isEditing.value = true
  editingId.value = item.id
  Object.keys(formErrors).forEach((key) => delete formErrors[key])

  form.category = item.category || 'other'
  form.title = item.title
  form.amount = item.amount
  form.expenseDate = new Date(item.expenseDate || Date.now())
    .toISOString()
    .slice(0, 16)
  form.paymentMethod = item.paymentMethod || 'cash'
  form.recipient = item.recipient || ''
  form.imageUrl = item.imageUrl || ''
  form.note = item.note || ''
  rawAmountStr.value = item.amount ? item.amount.toLocaleString('vi-VN') : ''

  showCreateEditModal.value = true
}

const validateForm = () => {
  Object.keys(formErrors).forEach((key) => delete formErrors[key])
  let isValid = true

  if (!form.title || form.title.trim() === '') {
    formErrors.title = 'Vui lòng nhập tên / nội dung khoản chi'
    isValid = false
  }

  if (!form.amount || form.amount <= 0) {
    formErrors.amount = 'Số tiền chi phải lớn hơn 0 ₫'
    isValid = false
  }

  if (!form.expenseDate) {
    formErrors.expenseDate = 'Vui lòng chọn ngày giờ chi'
    isValid = false
  }

  return isValid
}

const handleSubmitForm = async () => {
  if (!validateForm()) {
    showWarning('Vui lòng kiểm tra lại các trường thông tin bắt buộc')
    return
  }

  isSubmitting.value = true
  try {
    if (isEditing.value && editingId.value) {
      await updateExpenditure(editingId.value, form)
      showSuccess('Đã cập nhật phiếu chi thành công!')
    } else {
      await createExpenditure(form)
      showSuccess('Đã lập phiếu chi mới thành công!')
    }

    showCreateEditModal.value = false
    loadData()
  } catch (error: any) {
    console.error('Lỗi khi lưu phiếu chi:', error)
    const msg =
      error?.response?.data?.message ||
      error?.message ||
      'Không thể lưu phiếu chi'
    showError(msg)
  } finally {
    isSubmitting.value = false
  }
}

// --- Detail & Delete Operations ---
const openDetail = (item: ExpenditureRecord) => {
  selectedItem.value = item
  showDetailModal.value = true
}

const confirmDelete = (item: ExpenditureRecord) => {
  itemToDelete.value = item
  showDeleteConfirmDialog.value = true
}

const handleDelete = async () => {
  if (!itemToDelete.value) return
  showDeleteConfirmDialog.value = false

  try {
    await deleteExpenditure(itemToDelete.value.id)
    showSuccess(`Đã xóa phiếu chi #${itemToDelete.value.expenseCode}!`)
    loadData()
  } catch (error: any) {
    console.error('Lỗi khi xóa phiếu chi:', error)
    const msg =
      error?.response?.data?.message ||
      error?.message ||
      'Không thể xóa phiếu chi'
    showError(msg)
  }
}

const openImagePreview = (url?: string) => {
  if (!url) return
  previewImageSrc.value = url
  showImageModal.value = true
}

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      form.imageUrl = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

watch(selectedPeriod, (val) => {
  if (val === 'custom') {
    isCustomMode.value = true
    const today = new Date().toISOString().split('T')[0]
    if (!customFromDate.value) customFromDate.value = today
    if (!customToDate.value) customToDate.value = today
  } else {
    isCustomMode.value = false
    pagination.page = 1
    loadData()
  }
})

onMounted(async () => {
  try {
    const masterCodes = await fetchMasterCodes('EXPENSE_CATEGORY')
    if (masterCodes && masterCodes.length > 0) {
      const mapped = masterCodes.map((m) => ({
        code: m.code,
        label: m.label,
        emoji:
          m.code === 'reinvestment'
            ? '🏗️'
            : m.code === 'operation'
              ? '⚡'
              : m.code === 'premises'
                ? '🏢'
                : m.code === 'salary'
                  ? '👨‍🍳'
                  : m.code === 'marketing'
                    ? '📢'
                    : m.code === 'repair'
                      ? '🔧'
                      : '📦',
      }))
      categoryOptions.value = [
        { code: 'all', label: 'Tất cả phân loại', emoji: '✨' },
        ...mapped,
      ]
    }
  } catch (e) {}
  loadData()
})
</script>

<template>
  <div class="expenditure-list-page mx-auto flex w-full max-w-7xl flex-col gap-6 pb-16">
    <!-- Header Title & Action Bar -->
    <div class="flex flex-col justify-between gap-4 border-b border-[#E2D7CC] pb-2 lg:flex-row lg:items-center">
      <div>
        <h1 class="font-display text-2xl font-bold text-[#1e1b1b]">Quản lý Chi tiêu & Dòng tiền</h1>
        <p class="mt-1 text-xs font-medium text-[#42493d]">
          Kiểm soát chi phí vận hành, tái cấu trúc mua sắm thiết bị và theo dõi tiền lời ròng thực tế
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2 sm:gap-3">
        <!-- Quick Period Selection Pills -->
        <div class="flex h-10 items-center gap-1 rounded-xl border border-[#c1c9b9]/40 bg-[#F2ECE4] px-1 overflow-x-auto scrollbar-none max-w-full">
          <button
            v-for="p in periods"
            :key="p.value"
            @click="selectedPeriod = p.value"
            class="flex h-8 cursor-pointer items-center rounded-lg px-2.5 sm:px-3 text-xs font-semibold transition whitespace-nowrap"
            :class="selectedPeriod === p.value ? 'bg-[#8E3E2F] text-white shadow-sm' : 'text-[#42493d] hover:bg-white/60'"
          >
            {{ p.label }}
          </button>
        </div>

        <!-- Custom Date Range Inputs -->
        <div v-if="isCustomMode" class="flex flex-wrap items-center gap-2 sm:flex-nowrap">
          <input
            type="date"
            v-model="customFromDate"
            class="h-10 rounded-xl border border-[#c1c9b9]/70 bg-white px-3 text-xs font-medium text-[#1e1b1b] outline-none focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20"
          />
          <span class="text-xs font-semibold text-[#72796c]">đến</span>
          <input
            type="date"
            v-model="customToDate"
            class="h-10 rounded-xl border border-[#c1c9b9]/70 bg-white px-3 text-xs font-medium text-[#1e1b1b] outline-none focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20"
          />
          <button
            @click="loadData"
            class="flex h-10 cursor-pointer items-center justify-center rounded-xl bg-[#8E3E2F] px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#6E281C]"
          >
            Áp dụng
          </button>
        </div>

        <button
          @click="loadData"
          class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-[#c1c9b9]/60 bg-white text-[#5D4037] shadow-sm transition hover:bg-[#F2ECE4] shrink-0"
          title="Tải lại dữ liệu"
        >
          <span class="material-symbols-outlined text-lg" :class="{ 'animate-spin': loading }">refresh</span>
        </button>

        <button
          @click="openCreateModal"
          class="flex-1 sm:flex-none flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#8E3E2F] px-3.5 sm:px-4 text-xs font-semibold text-white shadow transition hover:bg-[#6E281C] whitespace-nowrap"
        >
          <span class="material-symbols-outlined text-lg">add_circle</span>
          <span>Lập phiếu chi mới</span>
        </button>
      </div>
    </div>

    <!-- Realtime Cashflow Financial KPI Cards -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <!-- Card 1: Total Revenue -->
      <div class="flex flex-col justify-between rounded-2xl border border-[#E2D7CC] bg-white p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-semibold uppercase tracking-wider text-[#72796c]">1. Tổng Thu Bán Hàng</span>
          <span class="material-symbols-outlined text-xl text-[#326824]">trending_up</span>
        </div>
        <div class="font-display mt-2 text-xl font-bold text-[#1e1b1b]">
          {{ formatCurrency(summaryData.totalRevenue) }}
        </div>
        <span class="mt-1 text-[11px] font-medium text-[#326824]">Doanh thu POS hoàn thành</span>
      </div>

      <!-- Card 2: Stock Import Cost -->
      <div class="flex flex-col justify-between rounded-2xl border border-[#E2D7CC] bg-white p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-semibold uppercase tracking-wider text-[#72796c]">2. Chi Nhập Kho NVL</span>
          <span class="material-symbols-outlined text-xl text-[#8E3E2F]">inventory_2</span>
        </div>
        <div class="font-display mt-2 text-xl font-bold text-[#8E3E2F]">
          {{ formatCurrency(summaryData.totalStockImportCost) }}
        </div>
        <span class="mt-1 text-[11px] font-medium text-[#72796c]">Nguyên liệu thịt, mì, rau...</span>
      </div>

      <!-- Card 3: Other Operating & Reinvestment Cost -->
      <div class="flex flex-col justify-between rounded-2xl border border-[#E2D7CC] bg-white p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-semibold uppercase tracking-wider text-[#72796c]">3. Chi Phí Vận Hành & CSVC</span>
          <span class="material-symbols-outlined text-xl text-[#ba1a1a]">receipt_long</span>
        </div>
        <div class="font-display mt-2 text-xl font-bold text-[#ba1a1a]">
          {{ formatCurrency(summaryData.totalOtherExpenses) }}
        </div>
        <span class="mt-1 text-[11px] font-medium text-[#ba1a1a]">
          {{ summaryData.expenditureCount }} phiếu chi ghi nhận
        </span>
      </div>

      <!-- Card 4: Net Profit (Tiền Lời Ròng Thực Tế) -->
      <div
        class="flex flex-col justify-between rounded-2xl border p-4 shadow-sm"
        :class="summaryData.isProfitable ? 'border-[#c9edb5] bg-[#f0fdf4]' : 'border-[#ffdad6] bg-[#fff1f2]'"
      >
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-bold uppercase tracking-wider text-[#1e1b1b]">4. Tiền Lời Ròng (Còn lại)</span>
          <span
            class="material-symbols-outlined text-xl font-bold"
            :class="summaryData.isProfitable ? 'text-[#326824]' : 'text-[#ba1a1a]'"
          >
            account_balance_wallet
          </span>
        </div>
        <div
          class="font-display mt-2 text-2xl font-black"
          :class="summaryData.isProfitable ? 'text-[#326824]' : 'text-[#ba1a1a]'"
        >
          {{ formatCurrency(summaryData.netProfit) }}
        </div>
        <div class="mt-1 flex items-center gap-1.5 text-[11px] font-bold">
          <span
            class="rounded px-1.5 py-0.5"
            :class="summaryData.isProfitable ? 'bg-[#c9edb5] text-[#326824]' : 'bg-[#ffdad6] text-[#ba1a1a]'"
          >
            {{ summaryData.isProfitable ? '🟢 LÃI DÒNG TIỀN' : '🔴 THÂM HỤT' }}
          </span>
          <span class="text-[#72796c]">= Thu - Tổng Chi</span>
        </div>
      </div>

      <!-- Card 5: Expense/Revenue Ratio -->
      <div class="flex flex-col justify-between rounded-2xl border border-[#E2D7CC] bg-white p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-semibold uppercase tracking-wider text-[#72796c]">5. Tỷ lệ Chi/Thu</span>
          <span class="material-symbols-outlined text-xl text-[#0284c7]">pie_chart</span>
        </div>
        <div class="font-display mt-2 text-xl font-bold text-[#0284c7]">
          {{ summaryData.expenseToRevenueRatio }}%
        </div>
        <span class="mt-1 text-[11px] font-medium text-[#72796c]">
          Tổng Chi: {{ formatCurrency(summaryData.totalExpenditures) }}
        </span>
      </div>
    </div>

    <!-- Filter & Search Toolbar -->
    <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E2D7CC] bg-white p-4 shadow-sm">
      <div class="flex flex-1 flex-wrap items-center gap-3">
        <!-- Search Input -->
        <div class="relative w-full sm:max-w-xs">
          <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-[#72796c]">search</span>
          <input
            type="text"
            v-model="searchKeyword"
            @keyup.enter="onSearch"
            placeholder="Tìm theo mã PC, nội dung, người nhận..."
            class="h-10 w-full rounded-xl border border-[#c1c9b9]/70 bg-white pl-10 pr-3.5 text-xs font-medium text-[#1e1b1b] outline-none transition focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20"
          />
        </div>

        <!-- Category Dropdown -->
        <select
          v-model="searchCategory"
          @change="onSearch"
          class="h-10 rounded-xl border border-[#c1c9b9]/70 bg-white px-3 text-xs font-semibold text-[#1e1b1b] outline-none focus:border-[#8E3E2F]"
        >
          <option v-for="opt in categoryOptions" :key="opt.code" :value="opt.code">
            {{ opt.emoji }} {{ opt.label }}
          </option>
        </select>

        <!-- Payment Method Dropdown -->
        <select
          v-model="searchPaymentMethod"
          @change="onSearch"
          class="h-10 rounded-xl border border-[#c1c9b9]/70 bg-white px-3 text-xs font-semibold text-[#1e1b1b] outline-none focus:border-[#8E3E2F]"
        >
          <option v-for="opt in paymentMethodOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="onSearch"
          class="flex h-10 cursor-pointer items-center gap-1.5 rounded-xl bg-[#8E3E2F] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#6E281C]"
        >
          <span class="material-symbols-outlined text-base">filter_list</span>
          <span>Lọc dữ liệu</span>
        </button>
        <button
          @click="onResetFilters"
          class="flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-[#c1c9b9]/60 bg-[#F2ECE4] px-3.5 text-xs font-semibold text-[#42493d] transition hover:bg-[#E8DFD5]"
        >
          <span class="material-symbols-outlined text-base">restart_alt</span>
          <span>Đặt lại</span>
        </button>
      </div>
    </div>

    <!-- Expenditures DataTable -->
    <div class="overflow-hidden rounded-2xl border border-[#E2D7CC] bg-white shadow-sm">
      <DataTable
        :value="items"
        :loading="loading"
        lazy
        paginator
        :rows="pagination.limit"
        :totalRecords="pagination.total"
        :rowsPerPageOptions="[10, 20, 50]"
        @page="onPageChange"
        tableStyle="min-width: 60rem"
        responsiveLayout="scroll"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Hiển thị {first} đến {last} trong tổng số {totalRecords} phiếu chi"
      >
        <!-- Code Column -->
        <Column field="expenseCode" header="Mã Phiếu Chi" sortable>
          <template #body="slotProps">
            <span
              @click="openDetail(slotProps.data)"
              class="cursor-pointer font-mono text-xs font-bold text-[#8E3E2F] hover:underline"
            >
              #{{ slotProps.data.expenseCode }}
            </span>
          </template>
        </Column>

        <!-- Date Column -->
        <Column field="expenseDate" header="Thời Gian Chi" sortable>
          <template #body="slotProps">
            <span class="text-xs font-semibold text-[#1e1b1b]">
              {{ formatDateTime(slotProps.data.expenseDate) }}
            </span>
          </template>
        </Column>

        <!-- Title & Note Column -->
        <Column field="title" header="Nội Dung Khoản Chi">
          <template #body="slotProps">
            <div class="flex flex-col gap-0.5">
              <span class="font-bold text-[#1e1b1b]">{{ slotProps.data.title }}</span>
              <span v-if="slotProps.data.note" class="text-[11px] text-[#72796c] line-clamp-1 italic">
                {{ slotProps.data.note }}
              </span>
            </div>
          </template>
        </Column>

        <!-- Category Badge Column -->
        <Column field="category" header="Phân Loại Chi">
          <template #body="slotProps">
            <span
              class="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold"
              :class="getCategoryBadge(slotProps.data.category).class"
            >
              <span>{{ getCategoryBadge(slotProps.data.category).emoji }}</span>
              <span>{{ getCategoryBadge(slotProps.data.category).label }}</span>
            </span>
          </template>
        </Column>

        <!-- Amount Column -->
        <Column field="amount" header="Số Tiền Chi" bodyClass="text-right" headerClass="text-right" sortable>
          <template #body="slotProps">
            <span class="font-mono text-sm font-bold text-[#ba1a1a]">
              {{ formatCurrency(slotProps.data.amount) }}
            </span>
          </template>
        </Column>

        <!-- Payment Method Column -->
        <Column field="paymentMethod" header="Hình Thức">
          <template #body="slotProps">
            <span class="text-xs font-semibold text-[#42493d]">
              {{ getPaymentMethodLabel(slotProps.data.paymentMethod) }}
            </span>
          </template>
        </Column>

        <!-- Recipient Column -->
        <Column field="recipient" header="Người Nhận / NCC">
          <template #body="slotProps">
            <span class="text-xs text-[#1e1b1b]">
              {{ slotProps.data.recipient || '-' }}
            </span>
          </template>
        </Column>

        <!-- Receipt Image Preview Thumbnail -->
        <Column header="Chứng Từ" bodyClass="text-center" headerClass="text-center">
          <template #body="slotProps">
            <button
              v-if="slotProps.data.imageUrl"
              @click="openImagePreview(slotProps.data.imageUrl)"
              type="button"
              class="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#c1c9b9]/60 bg-[#F9F6F0] text-[#8E3E2F] transition hover:bg-[#F2ECE4]"
              title="Xem hóa đơn/chứng từ"
            >
              <span class="material-symbols-outlined text-base">image</span>
            </button>
            <span v-else class="text-xs text-[#c1c9b9]">-</span>
          </template>
        </Column>

        <!-- Actions Column -->
        <Column header="Thao Tác" bodyClass="text-center" headerClass="text-center">
          <template #body="slotProps">
            <div class="flex items-center justify-center gap-1.5">
              <button
                @click="openDetail(slotProps.data)"
                class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#c1c9b9]/60 bg-white text-[#42493d] transition hover:bg-[#F2ECE4]"
                title="Chi tiết phiếu chi"
              >
                <span class="material-symbols-outlined text-base">visibility</span>
              </button>
              <button
                v-if="canEdit"
                @click="openEditModal(slotProps.data)"
                class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#c1c9b9]/60 bg-white text-[#8E3E2F] transition hover:bg-[#F2ECE4]"
                title="Chỉnh sửa phiếu chi"
              >
                <span class="material-symbols-outlined text-base">edit</span>
              </button>
              <button
                v-if="canEdit"
                @click="confirmDelete(slotProps.data)"
                class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#c1c9b9]/60 bg-white text-[#ba1a1a] transition hover:bg-[#ffdad6]"
                title="Xóa phiếu chi"
              >
                <span class="material-symbols-outlined text-base">delete</span>
              </button>
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- DIALOG: LẬP & SỬA PHIẾU CHI -->
    <Dialog
      v-model:visible="showCreateEditModal"
      modal
      :header="isEditing ? 'Chỉnh sửa Phiếu Chi' : 'Lập Phiếu Chi Tiền Mới'"
      :style="{ width: '560px', maxWidth: '95vw' }"
      class="expenditure-modal"
    >
      <form @submit.prevent="handleSubmitForm" class="flex flex-col gap-4 py-2">
        <!-- Category Selection -->
        <div>
          <label class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#1e1b1b]">
            Phân loại chi tiêu *
          </label>
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <button
              v-for="opt in categoryOptions.filter((c) => c.code !== 'all')"
              :key="opt.code"
              type="button"
              @click="form.category = opt.code"
              class="flex cursor-pointer items-center gap-1.5 rounded-xl border p-2.5 text-xs font-semibold transition"
              :class="
                form.category === opt.code
                  ? 'border-[#8E3E2F] bg-[#F2ECE4] text-[#8E3E2F] shadow-sm ring-1 ring-[#8E3E2F]'
                  : 'border-[#E2D7CC] bg-white text-[#42493d] hover:bg-[#F9F6F0]'
              "
            >
              <span class="text-sm">{{ opt.emoji }}</span>
              <span class="line-clamp-1 text-left">{{ opt.label }}</span>
            </button>
          </div>
        </div>

        <!-- Title -->
        <div>
          <label class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#1e1b1b]">
            Tên / Nội dung khoản chi *
          </label>
          <input
            v-model="form.title"
            type="text"
            placeholder="Ví dụ: Mua 50 tô sứ và 100 đôi đũa mới, Tiền điện tháng 10..."
            class="h-10 w-full rounded-xl border border-[#c1c9b9]/70 bg-white px-3.5 text-xs font-medium text-[#1e1b1b] outline-none transition focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20"
            :class="{ 'border-[#ba1a1a]': formErrors.title }"
          />
          <small v-if="formErrors.title" class="mt-1 block text-xs font-semibold text-[#ba1a1a]">
            {{ formErrors.title }}
          </small>
        </div>

        <!-- Amount & Payment Method Grid -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <!-- Amount -->
          <div>
            <label class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#1e1b1b]">
              Số tiền chi (VNĐ) *
            </label>
            <div class="relative">
              <input
                v-model="rawAmountStr"
                type="text"
                placeholder="0"
                class="h-10 w-full rounded-xl border border-[#c1c9b9]/70 bg-white pr-9 pl-3.5 font-mono text-sm font-bold text-[#ba1a1a] outline-none transition focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20"
                :class="{ 'border-[#ba1a1a]': formErrors.amount }"
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#72796c]">₫</span>
            </div>
            <small v-if="formErrors.amount" class="mt-1 block text-xs font-semibold text-[#ba1a1a]">
              {{ formErrors.amount }}
            </small>
          </div>

          <!-- Payment Method -->
          <div>
            <label class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#1e1b1b]">
              Hình thức thanh toán
            </label>
            <select
              v-model="form.paymentMethod"
              class="h-10 w-full rounded-xl border border-[#c1c9b9]/70 bg-white px-3 text-xs font-semibold text-[#1e1b1b] outline-none focus:border-[#8E3E2F]"
            >
              <option value="cash">💵 Tiền mặt</option>
              <option value="bank_transfer">🏦 Chuyển khoản ngân hàng</option>
              <option value="card">💳 Quẹt thẻ</option>
            </select>
          </div>
        </div>

        <!-- Date & Recipient Grid -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <!-- Date -->
          <div>
            <label class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#1e1b1b]">
              Ngày giờ chi *
            </label>
            <input
              v-model="form.expenseDate"
              type="datetime-local"
              class="h-10 w-full rounded-xl border border-[#c1c9b9]/70 bg-white px-3 text-xs font-medium text-[#1e1b1b] outline-none focus:border-[#8E3E2F]"
            />
          </div>

          <!-- Recipient -->
          <div>
            <label class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#1e1b1b]">
              Người nhận / Đơn vị cung cấp
            </label>
            <input
              v-model="form.recipient"
              type="text"
              placeholder="Ví dụ: Cửa hàng gốm Bát Tràng, EVN HCM..."
              class="h-10 w-full rounded-xl border border-[#c1c9b9]/70 bg-white px-3 text-xs font-medium text-[#1e1b1b] outline-none focus:border-[#8E3E2F]"
            />
          </div>
        </div>

        <!-- Image Receipt Upload / URL -->
        <div>
          <label class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#1e1b1b]">
            Ảnh hóa đơn / Biên lai thanh toán (Tùy chọn)
          </label>
          <div class="flex items-center gap-3">
            <input
              v-model="form.imageUrl"
              type="text"
              placeholder="Dán link ảnh hoặc tải tệp lên bên cạnh..."
              class="h-10 flex-1 rounded-xl border border-[#c1c9b9]/70 bg-white px-3 text-xs font-medium text-[#1e1b1b] outline-none focus:border-[#8E3E2F]"
            />
            <label class="flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-[#c1c9b9]/70 bg-[#F2ECE4] px-3 text-xs font-semibold text-[#42493d] hover:bg-[#E8DFD5]">
              <span class="material-symbols-outlined text-base">upload</span>
              <span>Tải ảnh</span>
              <input type="file" accept="image/*" class="hidden" @change="handleFileUpload" />
            </label>
          </div>
          <div v-if="form.imageUrl" class="mt-2 flex items-center gap-2">
            <img :src="form.imageUrl" alt="Hóa đơn" class="h-12 w-12 rounded-lg border object-cover shadow-sm" />
            <span class="text-xs text-green-700 font-semibold">Đã tải ảnh chứng từ</span>
            <button
              type="button"
              @click="form.imageUrl = ''"
              class="text-xs text-red-600 underline cursor-pointer ml-2"
            >
              Gỡ ảnh
            </button>
          </div>
        </div>

        <!-- Note -->
        <div>
          <label class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#1e1b1b]">
            Ghi chú chi tiết
          </label>
          <textarea
            v-model="form.note"
            rows="2"
            placeholder="Nhập ghi chú thêm nếu có..."
            class="w-full rounded-xl border border-[#c1c9b9]/70 bg-white p-3 text-xs font-medium text-[#1e1b1b] outline-none focus:border-[#8E3E2F]"
          ></textarea>
        </div>

        <!-- Form Actions -->
        <div class="mt-3 flex items-center justify-end gap-3 border-t border-[#E2D7CC] pt-4">
          <button
            type="button"
            @click="showCreateEditModal = false"
            class="h-10 cursor-pointer rounded-xl border border-[#c1c9b9]/70 bg-[#F2ECE4] px-4 text-xs font-semibold text-[#42493d] hover:bg-[#E8DFD5]"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-[#8E3E2F] px-5 text-xs font-semibold text-white shadow transition hover:bg-[#6E281C] disabled:opacity-50"
          >
            <span v-if="!isSubmitting" class="material-symbols-outlined text-base">check</span>
            <span v-else class="material-symbols-outlined animate-spin text-base">refresh</span>
            <span>{{ isSubmitting ? 'Đang lưu...' : isEditing ? 'Lưu cập nhật' : 'Xác nhận tạo phiếu' }}</span>
          </button>
        </div>
      </form>
    </Dialog>

    <!-- DIALOG: CHI TIẾT PHIẾU CHI -->
    <Dialog
      v-model:visible="showDetailModal"
      modal
      header="Thông tin Chi tiết Phiếu Chi"
      :style="{ width: '480px', maxWidth: '95vw' }"
    >
      <div v-if="selectedItem" class="flex flex-col gap-4 py-2">
        <div class="flex items-center justify-between rounded-xl bg-[#F9F6F0] p-4 border border-[#E2D7CC]">
          <div>
            <span class="text-xs text-[#72796c] block">Mã phiếu chi</span>
            <span class="font-mono text-base font-bold text-[#8E3E2F]">#{{ selectedItem.expenseCode }}</span>
          </div>
          <div class="text-right">
            <span class="text-xs text-[#72796c] block">Số tiền</span>
            <span class="font-mono text-lg font-bold text-[#ba1a1a]">{{ formatCurrency(selectedItem.amount) }}</span>
          </div>
        </div>

        <div class="space-y-2.5 text-xs">
          <div class="flex justify-between border-b pb-2">
            <span class="text-[#72796c]">Khoản chi:</span>
            <span class="font-bold text-[#1e1b1b] text-right">{{ selectedItem.title }}</span>
          </div>
          <div class="flex justify-between border-b pb-2">
            <span class="text-[#72796c]">Phân loại:</span>
            <span class="font-semibold text-[#1e1b1b]">
              {{ getCategoryBadge(selectedItem.category).emoji }} {{ getCategoryBadge(selectedItem.category).label }}
            </span>
          </div>
          <div class="flex justify-between border-b pb-2">
            <span class="text-[#72796c]">Thời gian chi:</span>
            <span class="font-medium text-[#1e1b1b]">{{ formatDateTime(selectedItem.expenseDate) }}</span>
          </div>
          <div class="flex justify-between border-b pb-2">
            <span class="text-[#72796c]">Hình thức thanh toán:</span>
            <span class="font-semibold text-[#1e1b1b]">{{ getPaymentMethodLabel(selectedItem.paymentMethod) }}</span>
          </div>
          <div class="flex justify-between border-b pb-2">
            <span class="text-[#72796c]">Người nhận / NCC:</span>
            <span class="font-medium text-[#1e1b1b]">{{ selectedItem.recipient || '-' }}</span>
          </div>
          <div class="flex justify-between border-b pb-2">
            <span class="text-[#72796c]">Người lập phiếu:</span>
            <span class="font-medium text-[#1e1b1b]">{{ selectedItem.creator?.name || 'Quản lý' }}</span>
          </div>
          <div v-if="selectedItem.note" class="flex flex-col gap-1 border-b pb-2">
            <span class="text-[#72796c]">Ghi chú:</span>
            <span class="italic text-[#1e1b1b]">{{ selectedItem.note }}</span>
          </div>
        </div>

        <!-- Receipt Image Preview -->
        <div v-if="selectedItem.imageUrl" class="mt-2">
          <span class="text-xs font-bold text-[#1e1b1b] block mb-1">Ảnh hóa đơn chứng từ:</span>
          <img
            :src="selectedItem.imageUrl"
            alt="Chứng từ"
            @click="openImagePreview(selectedItem.imageUrl)"
            class="h-40 w-full rounded-xl border object-contain bg-black/5 cursor-pointer hover:opacity-90 transition"
          />
        </div>

        <div class="mt-3 flex justify-end">
          <button
            @click="showDetailModal = false"
            class="h-9 px-4 rounded-xl bg-[#8E3E2F] text-white text-xs font-semibold hover:bg-[#6E281C] cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </Dialog>

    <!-- DIALOG: XEM ẢNH PHÓNG TO -->
    <Dialog v-model:visible="showImageModal" modal header="Hóa đơn & Chứng từ thanh toán" :style="{ width: '600px', maxWidth: '95vw' }">
      <div class="flex justify-center p-2">
        <img :src="previewImageSrc || ''" alt="Hóa đơn phóng to" class="max-h-[75vh] w-auto rounded-xl object-contain shadow" />
      </div>
    </Dialog>

    <!-- DELETE CONFIRM DIALOG -->
    <ActionConfirmDialog
      v-model:visible="showDeleteConfirmDialog"
      title="Xác nhận xóa phiếu chi"
      :message="`Bạn có chắc chắn muốn xóa phiếu chi #${itemToDelete?.expenseCode} (${formatCurrency(itemToDelete?.amount)}) không?`"
      confirmLabel="Xóa phiếu"
      cancelLabel="Hủy"
      severity="danger"
      @confirm="handleDelete"
    />
  </div>
</template>

<style scoped lang="scss" src="./ExpenditureList.scss"></style>
