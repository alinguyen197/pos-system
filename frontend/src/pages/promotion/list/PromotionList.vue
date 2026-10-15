<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import ActionConfirmDialog from '@/components/common/ActionConfirmDialog.vue'
import {
  fetchPromotions,
  createPromotion,
  updatePromotion,
  togglePromotionStatus,
  deletePromotion,
  Promotion,
  CreatePromotionPayload,
} from '@/api/promotion.api'
import { useAppToast } from '@/composables/useAppToast'
import { useAuth } from '@/composables/useAuth'

const { showSuccess, showError, showWarning } = useAppToast()
const { role } = useAuth()
const canEdit = computed(() => ['admin', 'manager'].includes(role.value || ''))

// --- Filters & Query State ---
const searchKeyword = ref('')
const selectedStatus = ref('all')
const selectedDiscountType = ref('all')
const loading = ref(false)

const statusOptions = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'active', label: '🟢 Đang hoạt động' },
  { value: 'upcoming', label: '🟡 Sắp diễn ra' },
  { value: 'inactive', label: '⚪ Đang tạm dừng' },
  { value: 'expired', label: '🔴 Đã hết hạn' },
]

const discountTypeOptions = [
  { value: 'all', label: 'Tất cả hình thức' },
  { value: 'PERCENT', label: '📊 Giảm theo phần trăm (%)' },
  { value: 'FIXED_AMOUNT', label: '💵 Giảm số tiền cố định (₫)' },
]

// --- Data & KPI State ---
const promotions = ref<Promotion[]>([])
const pagination = reactive({
  page: 1,
  pageSize: 10,
  totalRecords: 0,
  totalPages: 1,
})

const kpi = reactive({
  totalActive: 0,
  totalUpcoming: 0,
  totalExpired: 0,
  totalCampaigns: 0,
  totalDiscountProvided: 0,
})

// --- Form & Modal State ---
const showModal = ref(false)
const isEditing = ref(false)
const isSubmitting = ref(false)
const editingId = ref<number | null>(null)

const defaultForm = (): CreatePromotionPayload & {
  isUnlimitedUsage: boolean
} => {
  const now = new Date()
  const defaultEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  return {
    code: '',
    name: '',
    description: '',
    discountType: 'PERCENT',
    discountValue: 10,
    minOrderAmount: 50000,
    maxDiscountAmount: 25000,
    startDate: now.toISOString().slice(0, 16),
    endDate: defaultEndDate.toISOString().slice(0, 16),
    usageLimit: 100,
    isUnlimitedUsage: false,
    status: 'active',
  }
}

const form = reactive(defaultForm())

// --- Delete Dialog State ---
const showDeleteDialog = ref(false)
const itemToDelete = ref<Promotion | null>(null)

// --- Helper Formatters ---
const formatCurrency = (val: number | undefined | null) => {
  if (val === undefined || val === null) return '0 ₫'
  return `${Number(val).toLocaleString('vi-VN')} ₫`
}

const formatDate = (isoString: string) => {
  if (!isoString) return ''
  const d = new Date(isoString)
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const isPromotionExpired = (p: Promotion) => {
  return new Date() > new Date(p.endDate) || p.status === 'expired'
}

const isPromotionUpcoming = (p: Promotion) => {
  return new Date() < new Date(p.startDate) && p.status === 'active'
}

// --- Fetch Data ---
const loadData = async () => {
  loading.value = true
  try {
    const res = await fetchPromotions({
      page: pagination.page,
      limit: pagination.pageSize,
      search: searchKeyword.value,
      status: selectedStatus.value,
      discountType: selectedDiscountType.value,
    })

    promotions.value = res.items
    pagination.totalRecords = res.pagination.totalRecords
    pagination.totalPages = res.pagination.totalPages

    Object.assign(kpi, res.kpi)
  } catch (err: any) {
    showError(err?.message || 'Không thể tải danh sách khuyến mãi')
  } finally {
    loading.value = false
  }
}

const onPageChange = (event: any) => {
  pagination.page = event.page + 1
  pagination.pageSize = event.rows
  loadData()
}

const resetFilter = () => {
  searchKeyword.value = ''
  selectedStatus.value = 'all'
  selectedDiscountType.value = 'all'
  pagination.page = 1
  loadData()
}

// --- Code Generator Helper ---
const generateRandomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = 'SKY'
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  form.code = result
}

// --- Modal Handlers ---
const openCreateModal = () => {
  isEditing.value = false
  editingId.value = null
  Object.assign(form, defaultForm())
  showModal.value = true
}

const openEditModal = (p: Promotion) => {
  isEditing.value = true
  editingId.value = p.id
  Object.assign(form, {
    code: p.code,
    name: p.name,
    description: p.description || '',
    discountType: p.discountType,
    discountValue: p.discountValue,
    minOrderAmount: p.minOrderAmount || 0,
    maxDiscountAmount: p.maxDiscountAmount || null,
    startDate: new Date(p.startDate).toISOString().slice(0, 16),
    endDate: new Date(p.endDate).toISOString().slice(0, 16),
    usageLimit: p.usageLimit || null,
    isUnlimitedUsage: p.usageLimit === null || p.usageLimit === undefined,
    status: p.status,
  })
  showModal.value = true
}

const submitForm = async () => {
  if (!form.code.trim()) {
    showWarning('Vui lòng nhập mã khuyến mãi')
    return
  }
  if (!form.name.trim()) {
    showWarning('Vui lòng nhập tên chiến dịch')
    return
  }
  if (form.discountValue <= 0) {
    showWarning('Mức giảm giá phải lớn hơn 0')
    return
  }
  if (form.discountType === 'PERCENT' && form.discountValue > 100) {
    showWarning('Mức giảm theo % không được vượt quá 100%')
    return
  }
  if (new Date(form.endDate) <= new Date(form.startDate)) {
    showWarning('Thời gian kết thúc phải lớn hơn thời gian bắt đầu')
    return
  }

  isSubmitting.value = true
  try {
    const payload: CreatePromotionPayload = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      description: form.description?.trim(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minOrderAmount: Number(form.minOrderAmount) || 0,
      maxDiscountAmount:
        form.discountType === 'PERCENT' && form.maxDiscountAmount
          ? Number(form.maxDiscountAmount)
          : null,
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
      usageLimit: form.isUnlimitedUsage
        ? null
        : Number(form.usageLimit) || null,
      status: form.status,
    }

    if (isEditing.value && editingId.value) {
      await updatePromotion(editingId.value, payload)
      showSuccess(`Đã cập nhật chiến dịch "${payload.name}"!`)
    } else {
      await createPromotion(payload)
      showSuccess(`Tạo thành công chiến dịch "${payload.name}"!`)
    }

    showModal.value = false
    loadData()
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra'
    showError(msg)
  } finally {
    isSubmitting.value = false
  }
}

// --- Status Toggle & Delete ---
const handleToggleStatus = async (p: Promotion) => {
  try {
    await togglePromotionStatus(p.id)
    showSuccess(`Đã chuyển trạng thái mã "${p.code}"!`)
    loadData()
  } catch (err: any) {
    showError(err?.message || 'Không thể đổi trạng thái')
  }
}

const confirmDelete = (p: Promotion) => {
  itemToDelete.value = p
  showDeleteDialog.value = true
}

const handleDelete = async () => {
  if (!itemToDelete.value) return
  try {
    await deletePromotion(itemToDelete.value.id)
    showSuccess(`Đã xóa chiến dịch "${itemToDelete.value.name}"`)
    showDeleteDialog.value = false
    loadData()
  } catch (err: any) {
    showError(err?.message || 'Không thể xóa chiến dịch')
  }
}

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
  showSuccess(`Đã sao chép mã: ${text}`)
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="flex h-full flex-col space-y-4">
    <!-- Header Title & Action Bar -->
    <div
      class="flex flex-col justify-between gap-4 border-b border-[#E2D7CC] pb-3 lg:flex-row lg:items-center"
    >
      <div>
        <div class="flex items-center gap-2">
          <span class="text-2xl">🎟️</span>
          <h1 class="font-display text-2xl font-bold text-[#1e1b1b]">
            Quản lý Khuyến mãi & Chiến dịch
          </h1>
        </div>
        <p class="mt-1 text-xs font-medium text-[#42493d]">
          Thiết lập mã voucher ưu đãi, quản lý sự kiện khuyến mãi và theo dõi số
          lượt sử dụng thời gian thực
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2.5">
        <button
          @click="loadData"
          class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-[#c1c9b9]/60 bg-white text-[#5D4037] shadow-sm transition hover:bg-[#F2ECE4]"
          title="Tải lại dữ liệu"
        >
          <span
            class="material-symbols-outlined text-lg"
            :class="{ 'animate-spin': loading }"
            >refresh</span
          >
        </button>

        <button
          v-if="canEdit"
          @click="openCreateModal"
          class="flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-[#8E3E2F] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#6E281C] active:scale-[0.98]"
        >
          <span class="material-symbols-outlined text-lg">add_circle</span>
          <span>Tạo chiến dịch mới</span>
        </button>
      </div>
    </div>

    <!-- Realtime Promotion KPI Summary Cards -->
    <div class="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
      <!-- Card 1: Active Campaigns -->
      <div
        class="flex flex-col justify-between rounded-2xl border border-[#E2D7CC] bg-white p-4 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <span
            class="text-[11px] font-semibold uppercase tracking-wider text-[#72796c]"
            >Đang áp dụng</span
          >
          <span
            class="flex h-8 w-8 items-center justify-center rounded-xl bg-[#326824]/10 text-[#326824]"
          >
            <span class="material-symbols-outlined text-lg">verified</span>
          </span>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="font-display text-2xl font-bold text-[#326824]">{{
            kpi.totalActive
          }}</span>
          <span class="text-xs text-[#72796c]">chiến dịch</span>
        </div>
      </div>

      <!-- Card 2: Upcoming Campaigns -->
      <div
        class="flex flex-col justify-between rounded-2xl border border-[#E2D7CC] bg-white p-4 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <span
            class="text-[11px] font-semibold uppercase tracking-wider text-[#72796c]"
            >Sắp diễn ra</span
          >
          <span
            class="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FF9800]/10 text-[#FF9800]"
          >
            <span class="material-symbols-outlined text-lg">schedule</span>
          </span>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="font-display text-2xl font-bold text-[#E65100]">{{
            kpi.totalUpcoming
          }}</span>
          <span class="text-xs text-[#72796c]">đã lên lịch</span>
        </div>
      </div>

      <!-- Card 3: Expired Campaigns -->
      <div
        class="flex flex-col justify-between rounded-2xl border border-[#E2D7CC] bg-white p-4 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <span
            class="text-[11px] font-semibold uppercase tracking-wider text-[#72796c]"
            >Đã kết thúc</span
          >
          <span
            class="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-500"
          >
            <span class="material-symbols-outlined text-lg">history</span>
          </span>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="font-display text-2xl font-bold text-gray-600">{{
            kpi.totalExpired
          }}</span>
          <span class="text-xs text-[#72796c]">hết hạn</span>
        </div>
      </div>

      <!-- Card 4: Total Discount Provided -->
      <div
        class="flex flex-col justify-between rounded-2xl border border-[#E2D7CC] bg-white p-4 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <span
            class="text-[11px] font-semibold uppercase tracking-wider text-[#72796c]"
            >Tổng tiền đã ưu đãi</span
          >
          <span
            class="flex h-8 w-8 items-center justify-center rounded-xl bg-[#8E3E2F]/10 text-[#8E3E2F]"
          >
            <span class="material-symbols-outlined text-lg">savings</span>
          </span>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="font-display text-2xl font-bold text-[#8E3E2F]">{{
            formatCurrency(kpi.totalDiscountProvided)
          }}</span>
        </div>
      </div>
    </div>

    <!-- Filter & Search Bar -->
    <div
      class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E2D7CC] bg-white p-3 shadow-sm"
    >
      <div class="flex min-w-[280px] flex-1 flex-wrap items-center gap-2.5">
        <!-- Search Input -->
        <div class="relative min-w-[200px] flex-1">
          <span
            class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#72796c]"
          >
            search
          </span>
          <input
            v-model="searchKeyword"
            @keyup.enter="loadData"
            type="text"
            placeholder="Tìm theo mã voucher, tên sự kiện..."
            class="h-9 w-full rounded-xl border border-[#c1c9b9]/60 bg-[#F9F6F0] pl-8 pr-3 text-xs text-[#1e1b1b] outline-none focus:border-[#8E3E2F] focus:ring-1 focus:ring-[#8E3E2F]/30"
          />
        </div>

        <!-- Status Filter Select -->
        <select
          v-model="selectedStatus"
          @change="loadData"
          class="h-9 rounded-xl border border-[#c1c9b9]/60 bg-[#F9F6F0] px-3 text-xs font-medium text-[#1e1b1b] outline-none focus:border-[#8E3E2F]"
        >
          <option
            v-for="opt in statusOptions"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </option>
        </select>

        <!-- Discount Type Filter Select -->
        <select
          v-model="selectedDiscountType"
          @change="loadData"
          class="h-9 rounded-xl border border-[#c1c9b9]/60 bg-[#F9F6F0] px-3 text-xs font-medium text-[#1e1b1b] outline-none focus:border-[#8E3E2F]"
        >
          <option
            v-for="opt in discountTypeOptions"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </option>
        </select>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="loadData"
          class="flex h-9 cursor-pointer items-center gap-1.5 rounded-xl bg-[#8E3E2F] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#6E281C]"
        >
          <span class="material-symbols-outlined text-sm">filter_alt</span>
          <span>Lọc</span>
        </button>
        <button
          @click="resetFilter"
          class="flex h-9 cursor-pointer items-center gap-1 rounded-xl border border-[#c1c9b9]/60 bg-white px-3 text-xs font-medium text-[#42493d] transition hover:bg-[#F2ECE4]"
        >
          <span class="material-symbols-outlined text-sm">restart_alt</span>
          <span>Đặt lại</span>
        </button>
      </div>
    </div>

    <!-- DataTable Container (Single-Screen Scrollable) -->
    <div
      class="min-h-0 flex-1 overflow-hidden rounded-2xl border border-[#E2D7CC] bg-white shadow-sm"
    >
      <DataTable
        :value="promotions"
        :loading="loading"
        paginator
        :rows="pagination.pageSize"
        :totalRecords="pagination.totalRecords"
        lazy
        @page="onPageChange"
        responsiveLayout="scroll"
        scrollable
        scrollHeight="flex"
        class="p-datatable-sm w-full text-xs"
      >
        <template #empty>
          <div class="py-12 text-center text-xs font-medium text-[#72796c]">
            <span
              class="material-symbols-outlined mb-2 block text-4xl text-[#c1c9b9]"
              >loyalty</span
            >
            Không tìm thấy chiến dịch khuyến mãi nào phù hợp
          </div>
        </template>

        <!-- Column 1: Voucher Code Badge -->
        <Column header="Mã Voucher" style="min-width: 150px">
          <template #body="{ data }">
            <div
              @click="copyToClipboard(data.code)"
              class="group inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-[#8E3E2F]/60 bg-[#8E3E2F]/10 px-2.5 py-1 transition hover:bg-[#8E3E2F]/20"
              title="Click để sao chép mã"
            >
              <span class="material-symbols-outlined text-xs text-[#8E3E2F]"
                >local_activity</span
              >
              <span class="font-mono font-bold text-[#8E3E2F]">{{
                data.code
              }}</span>
              <span
                class="material-symbols-outlined text-[11px] text-[#8E3E2F] opacity-0 transition group-hover:opacity-100"
              >
                content_copy
              </span>
            </div>
          </template>
        </Column>

        <!-- Column 2: Campaign Name & Description -->
        <Column header="Tên chiến dịch" style="min-width: 220px">
          <template #body="{ data }">
            <div>
              <p class="font-bold text-[#1e1b1b]">{{ data.name }}</p>
              <p
                v-if="data.description"
                class="mt-0.5 line-clamp-1 text-[11px] text-[#72796c]"
              >
                {{ data.description }}
              </p>
            </div>
          </template>
        </Column>

        <!-- Column 3: Discount Type & Value -->
        <Column header="Mức giảm" style="min-width: 160px">
          <template #body="{ data }">
            <div class="space-y-0.5">
              <span
                v-if="data.discountType === 'PERCENT'"
                class="inline-flex items-center rounded-md bg-[#326824]/10 px-2 py-0.5 text-xs font-bold text-[#326824]"
              >
                Giảm {{ data.discountValue }}%
              </span>
              <span
                v-else
                class="inline-flex items-center rounded-md bg-[#8E3E2F]/10 px-2 py-0.5 text-xs font-bold text-[#8E3E2F]"
              >
                Giảm {{ formatCurrency(data.discountValue) }}
              </span>
              <p
                v-if="data.discountType === 'PERCENT' && data.maxDiscountAmount"
                class="text-[10px] text-[#72796c]"
              >
                Tối đa: {{ formatCurrency(data.maxDiscountAmount) }}
              </p>
            </div>
          </template>
        </Column>

        <!-- Column 4: Min Order Amount -->
        <Column header="Đơn tối thiểu" style="min-width: 120px">
          <template #body="{ data }">
            <span class="font-medium text-[#1e1b1b]">
              {{
                data.minOrderAmount > 0
                  ? formatCurrency(data.minOrderAmount)
                  : 'Không yêu cầu'
              }}
            </span>
          </template>
        </Column>

        <!-- Column 5: Validity Period -->
        <Column header="Thời gian hiệu lực" style="min-width: 180px">
          <template #body="{ data }">
            <div class="text-[11px] text-[#42493d]">
              <p class="font-medium text-[#1e1b1b]">
                Từ: {{ formatDate(data.startDate) }}
              </p>
              <p class="mt-0.5">Đến: {{ formatDate(data.endDate) }}</p>
            </div>
          </template>
        </Column>

        <!-- Column 6: Usage Progress -->
        <Column header="Lượt dùng" style="min-width: 130px">
          <template #body="{ data }">
            <div class="w-full space-y-1">
              <div class="flex justify-between text-[11px] font-semibold">
                <span class="text-[#1e1b1b]">{{ data.usedCount }}</span>
                <span class="text-[#72796c]">{{
                  data.usageLimit ? `/ ${data.usageLimit}` : '(Không giới hạn)'
                }}</span>
              </div>
              <div
                v-if="data.usageLimit"
                class="h-1.5 w-full overflow-hidden rounded-full bg-[#E2D7CC]"
              >
                <div
                  class="h-full rounded-full transition-all"
                  :class="
                    data.usedCount >= data.usageLimit
                      ? 'bg-[#ba1a1a]'
                      : 'bg-[#326824]'
                  "
                  :style="{
                    width: `${Math.min(100, (data.usedCount / data.usageLimit) * 100)}%`,
                  }"
                ></div>
              </div>
            </div>
          </template>
        </Column>

        <!-- Column 7: Status & Quick Switch -->
        <Column header="Trạng thái" style="min-width: 140px">
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <span
                v-if="isPromotionExpired(data)"
                class="rounded-lg bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-500"
              >
                Hết hạn
              </span>
              <span
                v-else-if="isPromotionUpcoming(data)"
                class="rounded-lg bg-[#FF9800]/15 px-2 py-0.5 text-[11px] font-bold text-[#E65100]"
              >
                Sắp diễn ra
              </span>
              <span
                v-else-if="data.status === 'active'"
                class="rounded-lg bg-[#326824]/15 px-2 py-0.5 text-[11px] font-bold text-[#326824]"
              >
                Đang chạy
              </span>
              <span
                v-else
                class="rounded-lg bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-500"
              >
                Tạm dừng
              </span>

              <!-- Quick Status Toggle -->
              <button
                v-if="canEdit && !isPromotionExpired(data)"
                @click="handleToggleStatus(data)"
                class="flex h-5 w-9 cursor-pointer items-center rounded-full p-0.5 transition"
                :class="
                  data.status === 'active' ? 'bg-[#326824]' : 'bg-gray-300'
                "
                :title="
                  data.status === 'active'
                    ? 'Bấm để tạm dừng'
                    : 'Bấm để kích hoạt'
                "
              >
                <div
                  class="h-4 w-4 rounded-full bg-white shadow-sm transition-transform"
                  :class="{ 'translate-x-4': data.status === 'active' }"
                ></div>
              </button>
            </div>
          </template>
        </Column>

        <!-- Column 8: Actions -->
        <Column
          header="Thao tác"
          alignFrozen="right"
          frozen
          style="min-width: 90px"
        >
          <template #body="{ data }">
            <div class="flex items-center gap-1">
              <button
                v-if="canEdit"
                @click="openEditModal(data)"
                class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-[#5D4037] transition hover:bg-[#F2ECE4]"
                title="Chỉnh sửa chiến dịch"
              >
                <span class="material-symbols-outlined text-base">edit</span>
              </button>
              <button
                v-if="role === 'admin'"
                @click="confirmDelete(data)"
                class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-[#ba1a1a] transition hover:bg-[#ffdad6]"
                title="Xóa chiến dịch"
              >
                <span class="material-symbols-outlined text-base">delete</span>
              </button>
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Create / Edit Promotion Modal Dialog -->
    <Dialog
      v-model:visible="showModal"
      modal
      :header="
        isEditing
          ? 'Cập nhật Chiến dịch Khuyến mãi'
          : 'Tạo Chiến dịch Khuyến mãi Mới'
      "
      :style="{ width: '880px', maxWidth: '95vw' }"
    >
      <div class="grid grid-cols-1 gap-6 py-2 text-xs md:grid-cols-12">
        <!-- Left Column: Form Inputs (7 Cols) -->
        <div class="space-y-3.5 md:col-span-7">
          <!-- Promo Code -->
          <div>
            <label class="mb-1 block font-bold text-[#1e1b1b]"
              >Mã Khuyến Mãi <span class="text-red-500">*</span></label
            >
            <div class="flex gap-2">
              <input
                v-model="form.code"
                type="text"
                placeholder="VD: CHAOHAN2026"
                class="h-9 flex-1 rounded-xl border border-[#c1c9b9]/70 bg-white px-3 font-mono font-bold uppercase text-[#1e1b1b] outline-none focus:border-[#8E3E2F] focus:ring-1 focus:ring-[#8E3E2F]/20"
              />
              <button
                type="button"
                @click="generateRandomCode"
                class="flex h-9 cursor-pointer items-center gap-1 rounded-xl border border-[#c1c9b9]/70 bg-[#F2ECE4] px-3 font-semibold text-[#8E3E2F] transition hover:bg-[#E8DFD5]"
                title="Sinh mã ngẫu nhiên"
              >
                <span class="material-symbols-outlined text-sm">casino</span>
                <span>Tạo ngẫu nhiên</span>
              </button>
            </div>
          </div>

          <!-- Campaign Name -->
          <div>
            <label class="mb-1 block font-bold text-[#1e1b1b]"
              >Tên Chiến Dịch / Sự Kiện
              <span class="text-red-500">*</span></label
            >
            <input
              v-model="form.name"
              type="text"
              placeholder="VD: Mừng Khai Trương 2026 - Giảm 20%"
              class="h-9 w-full rounded-xl border border-[#c1c9b9]/70 bg-white px-3 font-medium text-[#1e1b1b] outline-none focus:border-[#8E3E2F] focus:ring-1 focus:ring-[#8E3E2F]/20"
            />
          </div>

          <!-- Discount Type Radio Selector -->
          <div>
            <label class="mb-1 block font-bold text-[#1e1b1b]"
              >Hình Thức Giảm Giá</label
            >
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                @click="form.discountType = 'PERCENT'"
                class="flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-xl border text-xs font-semibold transition"
                :class="
                  form.discountType === 'PERCENT'
                    ? 'border-[#8E3E2F] bg-[#8E3E2F]/10 text-[#8E3E2F]'
                    : 'border-[#c1c9b9]/60 bg-white text-[#42493d]'
                "
              >
                <span class="material-symbols-outlined text-sm">percent</span>
                <span>Theo phần trăm (%)</span>
              </button>
              <button
                type="button"
                @click="form.discountType = 'FIXED_AMOUNT'"
                class="flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-xl border text-xs font-semibold transition"
                :class="
                  form.discountType === 'FIXED_AMOUNT'
                    ? 'border-[#8E3E2F] bg-[#8E3E2F]/10 text-[#8E3E2F]'
                    : 'border-[#c1c9b9]/60 bg-white text-[#42493d]'
                "
              >
                <span class="material-symbols-outlined text-sm">payments</span>
                <span>Số tiền cố định (₫)</span>
              </button>
            </div>
          </div>

          <!-- Discount Value & Max Discount -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block font-bold text-[#1e1b1b]">
                {{
                  form.discountType === 'PERCENT'
                    ? 'Mức giảm (%)'
                    : 'Số tiền giảm (₫)'
                }}
                <span class="text-red-500">*</span>
              </label>
              <input
                v-model.number="form.discountValue"
                type="number"
                min="1"
                :max="form.discountType === 'PERCENT' ? 100 : undefined"
                class="h-9 w-full rounded-xl border border-[#c1c9b9]/70 bg-white px-3 font-bold text-[#1e1b1b] outline-none focus:border-[#8E3E2F]"
              />
            </div>
            <div v-if="form.discountType === 'PERCENT'">
              <label class="mb-1 block font-bold text-[#1e1b1b]"
                >Giảm tối đa (₫)</label
              >
              <input
                v-model.number="form.maxDiscountAmount"
                type="number"
                placeholder="Để trống nếu không giới hạn"
                class="h-9 w-full rounded-xl border border-[#c1c9b9]/70 bg-white px-3 font-medium text-[#1e1b1b] outline-none focus:border-[#8E3E2F]"
              />
            </div>
            <div v-else>
              <label class="mb-1 block font-bold text-[#1e1b1b]"
                >Đơn tối thiểu (₫)</label
              >
              <input
                v-model.number="form.minOrderAmount"
                type="number"
                placeholder="0 = Không yêu cầu"
                class="h-9 w-full rounded-xl border border-[#c1c9b9]/70 bg-white px-3 font-medium text-[#1e1b1b] outline-none focus:border-[#8E3E2F]"
              />
            </div>
          </div>

          <!-- If PERCENT: show Min Order Amount here -->
          <div v-if="form.discountType === 'PERCENT'">
            <label class="mb-1 block font-bold text-[#1e1b1b]"
              >Giá trị đơn hàng tối thiểu (₫)</label
            >
            <input
              v-model.number="form.minOrderAmount"
              type="number"
              placeholder="VD: 50000"
              class="h-9 w-full rounded-xl border border-[#c1c9b9]/70 bg-white px-3 font-medium text-[#1e1b1b] outline-none focus:border-[#8E3E2F]"
            />
          </div>

          <!-- Date Range -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block font-bold text-[#1e1b1b]"
                >Bắt đầu áp dụng</label
              >
              <input
                v-model="form.startDate"
                type="datetime-local"
                class="h-9 w-full rounded-xl border border-[#c1c9b9]/70 bg-white px-3 text-xs font-medium text-[#1e1b1b] outline-none focus:border-[#8E3E2F]"
              />
            </div>
            <div>
              <label class="mb-1 block font-bold text-[#1e1b1b]"
                >Kết thúc sự kiện</label
              >
              <input
                v-model="form.endDate"
                type="datetime-local"
                class="h-9 w-full rounded-xl border border-[#c1c9b9]/70 bg-white px-3 text-xs font-medium text-[#1e1b1b] outline-none focus:border-[#8E3E2F]"
              />
            </div>
          </div>

          <!-- Usage Limit & Status -->
          <div class="grid grid-cols-2 items-end gap-3">
            <div>
              <div class="mb-1 flex items-center justify-between">
                <label class="font-bold text-[#1e1b1b]"
                  >Số lượt dùng tối đa</label
                >
                <label
                  class="flex cursor-pointer items-center gap-1 text-[11px] text-[#72796c]"
                >
                  <input
                    type="checkbox"
                    v-model="form.isUnlimitedUsage"
                    class="rounded"
                  />
                  <span>Không giới hạn</span>
                </label>
              </div>
              <input
                v-if="!form.isUnlimitedUsage"
                v-model.number="form.usageLimit"
                type="number"
                min="1"
                placeholder="VD: 100"
                class="h-9 w-full rounded-xl border border-[#c1c9b9]/70 bg-white px-3 font-medium text-[#1e1b1b] outline-none focus:border-[#8E3E2F]"
              />
              <div
                v-else
                class="flex h-9 items-center rounded-xl bg-gray-100 px-3 text-xs font-semibold text-gray-500"
              >
                Vô hạn (Không giới hạn)
              </div>
            </div>

            <div>
              <label class="mb-1 block font-bold text-[#1e1b1b]"
                >Trạng thái ban đầu</label
              >
              <select
                v-model="form.status"
                class="h-9 w-full rounded-xl border border-[#c1c9b9]/70 bg-white px-3 text-xs font-medium text-[#1e1b1b] outline-none focus:border-[#8E3E2F]"
              >
                <option value="active">🟢 Kích hoạt ngay</option>
                <option value="inactive">⚪ Lưu tạm dừng</option>
              </select>
            </div>
          </div>

          <!-- Description -->
          <div>
            <label class="mb-1 block font-bold text-[#1e1b1b]"
              >Mô tả / Thể Lệ Áp Dụng</label
            >
            <textarea
              v-model="form.description"
              rows="2"
              placeholder="VD: Áp dụng cho toàn bộ đồ uống, không áp dụng chung với combo..."
              class="w-full rounded-xl border border-[#c1c9b9]/70 bg-white p-2.5 text-xs text-[#1e1b1b] outline-none focus:border-[#8E3E2F]"
            ></textarea>
          </div>
        </div>

        <!-- Right Column: Live Graphic Voucher Preview Card (5 Cols) -->
        <div
          class="flex flex-col justify-center rounded-2xl border border-dashed border-[#E2D7CC] bg-[#F9F6F0] p-4 md:col-span-5"
        >
          <p
            class="mb-2 text-center text-[11px] font-bold uppercase tracking-wider text-[#72796c]"
          >
            Mô phỏng Thẻ Khuyến Mãi Thời Gian Thực
          </p>

          <!-- Authentic Graphic Coupon Card -->
          <div
            class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#8E3E2F] to-[#5D1E14] p-4 text-white shadow-lg"
          >
            <!-- Cutout Circles for Coupon Effect -->
            <div
              class="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[#F9F6F0]"
            ></div>
            <div
              class="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[#F9F6F0]"
            ></div>

            <div
              class="flex items-center justify-between border-b border-white/20 pb-2.5"
            >
              <div class="flex items-center gap-1.5">
                <span class="text-base">🍜</span>
                <span class="text-xs font-bold uppercase tracking-wider"
                  >Mì Trộn Cô Xi • Sky Coffee</span
                >
              </div>
              <span
                class="rounded bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase"
                >Voucher</span
              >
            </div>

            <div class="my-3 text-center">
              <p class="text-[11px] font-medium text-white/80">
                {{ form.name || 'Tên chương trình khuyến mãi' }}
              </p>
              <div
                class="font-display my-1 text-3xl font-extrabold text-[#FFE082]"
              >
                <span v-if="form.discountType === 'PERCENT'"
                  >-{{ form.discountValue || 0 }}%</span
                >
                <span v-else>-{{ formatCurrency(form.discountValue) }}</span>
              </div>
              <p
                v-if="form.discountType === 'PERCENT' && form.maxDiscountAmount"
                class="text-[10px] text-white/70"
              >
                (Giảm tối đa {{ formatCurrency(form.maxDiscountAmount) }})
              </p>
            </div>

            <div
              class="rounded-xl border border-dashed border-white/30 bg-black/15 p-2 text-center"
            >
              <p class="text-[9px] uppercase tracking-wider text-white/70">
                Mã Áp Dụng
              </p>
              <p
                class="font-mono text-base font-extrabold tracking-widest text-white"
              >
                {{ form.code.trim().toUpperCase() || 'MAKHUYENMAI' }}
              </p>
            </div>

            <div
              class="mt-3 flex items-center justify-between text-[10px] text-white/80"
            >
              <span
                >Đơn tối thiểu: {{ formatCurrency(form.minOrderAmount) }}</span
              >
              <span
                >HSD:
                {{
                  form.endDate
                    ? new Date(form.endDate).toLocaleDateString('vi-VN')
                    : '...'
                }}</span
              >
            </div>
          </div>

          <p class="mt-3 text-center text-[10px] text-[#72796c]">
            Voucher này sẽ xuất hiện tự động trên màn hình POS của thu ngân khi
            hợp lệ.
          </p>
        </div>
      </div>

      <template #footer>
        <div
          class="flex items-center justify-end gap-2 border-t border-[#E2D7CC] pt-2"
        >
          <button
            type="button"
            @click="showModal = false"
            class="flex h-9 cursor-pointer items-center rounded-xl border border-[#c1c9b9]/60 bg-white px-4 text-xs font-semibold text-[#42493d] transition hover:bg-[#F2ECE4]"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            @click="submitForm"
            :disabled="isSubmitting"
            class="flex h-9 cursor-pointer items-center gap-1.5 rounded-xl bg-[#8E3E2F] px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#6E281C] disabled:opacity-50"
          >
            <span
              v-if="isSubmitting"
              class="material-symbols-outlined animate-spin text-sm"
              >refresh</span
            >
            <span>{{
              isEditing ? 'Lưu cập nhật' : 'Kích hoạt chiến dịch'
            }}</span>
          </button>
        </div>
      </template>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <ActionConfirmDialog
      v-model:visible="showDeleteDialog"
      title="Xác nhận xóa chiến dịch khuyến mãi"
      :message="`Bạn có chắc chắn muốn xóa chiến dịch '${itemToDelete?.name}' (Mã: ${itemToDelete?.code})? Dữ liệu lịch sử các đơn hàng cũ sẽ không bị ảnh hưởng.`"
      confirmLabel="Xóa chiến dịch"
      cancelLabel="Giữ lại"
      severity="danger"
      @confirm="handleDelete"
    />
  </div>
</template>

<style scoped>
:deep(.p-datatable .p-datatable-thead > tr > th) {
  background-color: #f9f6f0;
  color: #1e1b1b;
  font-weight: 700;
  font-size: 11px;
  text-transform: uppercase;
  border-bottom: 1px solid #e2d7cc;
  padding: 10px 12px;
}

:deep(.p-datatable .p-datatable-tbody > tr) {
  border-bottom: 1px solid #f2ece4;
  transition: background-color 0.15s;
}

:deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background-color: #fdfbf7;
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 10px 12px;
}
</style>
