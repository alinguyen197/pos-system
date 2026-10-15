<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import DatePicker from 'primevue/datepicker'
import { fetchProducts, ProductItem } from '@/api/product.api'
import {
  createOrder,
  fetchOrders,
  fetchShiftSummary,
  Order,
  ShiftSummary,
} from '@/api/order.api'
import { useAppToast } from '@/composables/useAppToast'

interface CartItem {
  product: ProductItem
  quantity: number
  note?: string
}

interface OrderTab {
  id: string
  name: string
  tableNo: string
  cart: CartItem[]
  promoCode: string
  discountAmount: number
  paymentMethod: string
  note: string
}

const router = useRouter()
const { showSuccess, showError, showWarning } = useAppToast()

// Logged in Staff Name
const currentStaffName = ref(
  localStorage.getItem('fullName') ||
    localStorage.getItem('userName') ||
    localStorage.getItem('email') ||
    'Nguyễn Văn A (Thu ngân)',
)

// Data States
const products = ref<ProductItem[]>([])
const loadingProducts = ref(false)
const searchQuery = ref('')
const selectedCategory = ref('Tất cả')

// Missing Ingredients Modal State
const showMissingIngredientsModal = ref(false)
const selectedMissingProduct = ref<ProductItem | null>(null)

const handleProductClick = (product: ProductItem) => {
  if (isProductSuspended(product)) return
  if (product.isOutOfStock) {
    selectedMissingProduct.value = product
    showMissingIngredientsModal.value = true
    return
  }
  addToCart(product)
}

// Shift Summary State
const shiftSummary = ref<ShiftSummary>({
  shiftCode: 'morning',
  shiftName: 'Ca sáng (06:00 - 14:00)',
  shiftRevenue: 0,
  totalOrders: 0,
  totalCupsSold: 0,
  cashRevenue: 0,
  transferRevenue: 0,
  cardRevenue: 0,
  totalDiscount: 0,
})

// Categories
const categories = computed(() => {
  const cats = new Set<string>()
  cats.add('Tất cả')
  products.value.forEach((p) => {
    if (p.category) cats.add(p.category)
  })
  return Array.from(cats)
})

// Order Tabs State
const nextTabNum = ref(1042)
const orderTabs = ref<OrderTab[]>([
  {
    id: '1042',
    name: '1042',
    tableNo: 'Bàn 04',
    cart: [],
    promoCode: '',
    discountAmount: 0,
    paymentMethod: 'cash',
    note: '',
  },
])
const activeTabId = ref('1042')

const activeTab = computed(() => {
  const found = orderTabs.value.find((t) => t.id === activeTabId.value)
  if (found) return found
  return orderTabs.value[0]
})

// Helper remove Vietnamese accents for flexible searching (e.g. 'ca phe' -> 'Cà phê')
const removeVietnameseTones = (str: string) => {
  if (!str) return ''
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
}

// Filtered products based on search & category tab
const filteredProducts = computed(() => {
  const rawQ = searchQuery.value.trim()

  return products.value.filter((p) => {
    const matchCat =
      selectedCategory.value === 'Tất cả' ||
      p.category === selectedCategory.value
    if (!rawQ) return matchCat

    const qLower = rawQ.toLowerCase()
    const qNoAccent = removeVietnameseTones(qLower)

    const nameStr = String(p.name || '').toLowerCase()
    const nameNoAccent = removeVietnameseTones(nameStr)
    const idStr = String(p.id || '').toLowerCase()
    const dbIdStr = String(p.dbId || '').toLowerCase()

    const matchSearch =
      nameStr.includes(qLower) ||
      nameNoAccent.includes(qNoAccent) ||
      idStr.includes(qLower) ||
      dbIdStr.includes(qLower)

    return matchCat && matchSearch
  })
})

// Tab Management
const addTab = () => {
  nextTabNum.value++
  const newTabId = nextTabNum.value.toString()
  orderTabs.value.push({
    id: newTabId,
    name: newTabId,
    tableNo: `Bàn 0${(orderTabs.value.length % 9) + 1}`,
    cart: [],
    promoCode: '',
    discountAmount: 0,
    paymentMethod: 'cash',
    note: '',
  })
  activeTabId.value = newTabId
}

const closeTab = (tabId: string) => {
  if (orderTabs.value.length === 1) {
    // Reset the last tab if closed
    orderTabs.value[0].cart = []
    orderTabs.value[0].promoCode = ''
    orderTabs.value[0].discountAmount = 0
    return
  }
  const idx = orderTabs.value.findIndex((t) => t.id === tabId)
  if (idx !== -1) {
    orderTabs.value.splice(idx, 1)
    if (activeTabId.value === tabId) {
      activeTabId.value = orderTabs.value[Math.max(0, idx - 1)].id
    }
  }
}

// Helper check suspended product
const isProductSuspended = (product: ProductItem) => {
  return product.status === 'Tạm ngừng' || product.statusCode === 'suspended'
}

// Cart Operations
const addToCart = (product: ProductItem) => {
  if (isProductSuspended(product) || product.isOutOfStock) return
  const currentCart = activeTab.value.cart
  const existing = currentCart.find((item) => item.product.id === product.id)
  if (existing) {
    existing.quantity++
  } else {
    currentCart.push({ product, quantity: 1, note: '' })
  }
}

const updateQty = (index: number, delta: number) => {
  const currentCart = activeTab.value.cart
  const item = currentCart[index]
  if (!item) return
  item.quantity += delta
  if (item.quantity <= 0) {
    currentCart.splice(index, 1)
  }
}

const clearCart = () => {
  activeTab.value.cart = []
  activeTab.value.promoCode = ''
  activeTab.value.discountAmount = 0
}

const setQty = (index: number, value: string | number) => {
  const currentCart = activeTab.value.cart
  const item = currentCart[index]
  if (!item) return
  const qty = parseInt(String(value), 10)
  if (isNaN(qty) || qty <= 0) {
    currentCart.splice(index, 1)
  } else {
    item.quantity = qty
  }
}

// Mobile Navigation Tab State
const mobileTab = ref<'menu' | 'cart'>('menu')
const totalCartItemsCount = computed(() => {
  return activeTab.value.cart.reduce((sum, item) => sum + item.quantity, 0)
})

// Discount & Calculation
const subtotalPrice = computed(() => {
  return activeTab.value.cart.reduce(
    (sum, item) => sum + item.product.rawPrice * item.quantity,
    0,
  )
})

const finalPrice = computed(() => {
  return Math.max(0, subtotalPrice.value - activeTab.value.discountAmount)
})


const applySuggestedPromoCode = (code: string) => {
  activeTab.value.promoCode = code
  applyPromoCode()
}

const applyPromoCode = () => {
  const code = activeTab.value.promoCode.trim().toUpperCase()
  if (!code) {
    activeTab.value.discountAmount = 0
    return
  }
  if (code === 'GIAM10K') {
    activeTab.value.discountAmount = 10000
    showSuccess('Áp dụng mã GIAM10K: Giảm 10,000 ₫')
  } else if (code === 'FREESHIP') {
    activeTab.value.discountAmount = 15000
    showSuccess('Áp dụng mã FREESHIP: Giảm 15,000 ₫')
  } else if (
    code.startsWith('GIAM') &&
    !isNaN(Number(code.replace('GIAM', '')))
  ) {
    const amount = Number(code.replace('GIAM', ''))
    activeTab.value.discountAmount = amount
    showSuccess(`Áp dụng mã giảm ${amount.toLocaleString('vi-VN')} ₫`)
  } else {
    showWarning('Mã giảm giá không hợp lệ')
  }
}

// Payment & VietQR Dialog State
const showQrModal = ref(false)
const isSubmittingPayment = ref(false)
const qrData = ref({
  qrUrl: '',
  bankId: 'MB',
  accountNo: '0399888999',
  accountName: 'SKY COFFEE MANAGEMENT',
  amount: 0,
  addInfo: '',
})

const handlePaymentClick = () => {
  if (activeTab.value.cart.length === 0) {
    showWarning('Vui lòng chọn sản phẩm vào giỏ hàng trước khi thanh toán!')
    return
  }

  const method = activeTab.value.paymentMethod
  if (method === 'qr' || method === 'bank') {
    qrData.value.amount = finalPrice.value
    qrData.value.addInfo = `SKY DH${activeTab.value.name}`
    qrData.value.qrUrl = `https://img.vietqr.io/image/MB-0399888999-compact2.png?amount=${finalPrice.value}&addInfo=SKY%20DH${activeTab.value.name}&accountName=SKY%20COFFEE%20MANAGEMENT`
    showQrModal.value = true
  } else {
    processSubmitOrder()
  }
}

const confirmPaymentDone = () => {
  showQrModal.value = false
  processSubmitOrder()
}

const processSubmitOrder = async () => {
  if (activeTab.value.cart.length === 0) return

  isSubmittingPayment.value = true
  try {
    const itemsPayload = activeTab.value.cart.map((item) => ({
      productId: item.product.dbId,
      code: item.product.id,
      quantity: item.quantity,
      unitPrice: item.product.rawPrice,
      note: item.note,
    }))

    const payload = {
      items: itemsPayload,
      paymentMethod: activeTab.value.paymentMethod,
      discountAmount: activeTab.value.discountAmount,
      note: activeTab.value.note || `Đơn POS ${activeTab.value.tableNo}`,
    }

    const res = await createOrder(payload)
    if (res && res.success) {
      const orderData = res.data
      showSuccess(`Tạo đơn hàng #${orderData.orderNumber} thành công!`)
      // Refresh shift summary and product stock
      loadShiftSummary()
      loadProducts()
      // Print Bill option or reset cart
      printReceipt(orderData)
      clearCart()
      closeTab(activeTabId.value)
    } else {
      showError(res?.message || 'Không thể tạo đơn hàng')
    }
  } catch (err: any) {
    showError(err?.message || 'Lỗi kết nối máy chủ khi tạo đơn hàng')
  } finally {
    isSubmittingPayment.value = false
  }
}

// Order History Modal State & Date Filter
const showHistoryModal = ref(false)
const orderHistory = ref<Order[]>([])
const loadingHistory = ref(false)
const historyDateRange = ref<Date[] | null>(null)
const historyPagination = ref({
  page: 1,
  pageSize: 20,
  totalRecords: 0,
  totalPages: 1,
})

const formatYmd = (d: Date) => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Order Detail Modal State
const showOrderDetailModal = ref(false)
const selectedOrderDetail = ref<Order | null>(null)

// Shift Handover Modal State
const showShiftEndModal = ref(false)

const openShiftEndModal = () => {
  showShiftEndModal.value = true
}

const initShiftSession = () => {
  if (!localStorage.getItem('shiftStartedAt')) {
    localStorage.setItem('shiftStartedAt', new Date().toISOString())
  }
}

const confirmShiftEndAndLogout = () => {
  showSuccess('Đã xác nhận kết ca thành công!')
  const nowIso = new Date().toISOString()
  localStorage.setItem('lastShiftEndedAt', nowIso)
  localStorage.setItem('shiftStartedAt', nowIso)
  localStorage.removeItem('token')
  localStorage.removeItem('role')
  router.push('/login')
}

const openOrderHistory = async (page = 1) => {
  showHistoryModal.value = true
  loadingHistory.value = true
  try {
    const params: any = { limit: 20, page }
    if (
      historyDateRange.value &&
      Array.isArray(historyDateRange.value) &&
      historyDateRange.value.length > 0
    ) {
      if (historyDateRange.value[0]) {
        params.fromDate = formatYmd(historyDateRange.value[0])
      }
      if (historyDateRange.value[1]) {
        params.toDate = formatYmd(historyDateRange.value[1])
      } else if (historyDateRange.value[0]) {
        params.toDate = formatYmd(historyDateRange.value[0])
      }
    }
    const res = await fetchOrders(params)
    orderHistory.value = res.items || []
    historyPagination.value = res.pagination || {
      page: 1,
      pageSize: 20,
      totalRecords: (res.items || []).length,
      totalPages: 1,
    }
  } catch (err: any) {
    console.error('Fetch orders error:', err)
    showError('Không thể tải lịch sử đơn hàng')
  } finally {
    loadingHistory.value = false
  }
}

const setHistoryDateToday = () => {
  const today = new Date()
  historyDateRange.value = [today, today]
  openOrderHistory(1)
}

const clearHistoryDateFilter = () => {
  historyDateRange.value = null
  openOrderHistory(1)
}

const viewOrderDetail = (order: Order) => {
  selectedOrderDetail.value = order
  showOrderDetailModal.value = true
}

// Print Bill Helper
const selectedPrintOrder = ref<Order | null>(null)
const showPrintModal = ref(false)

const printReceipt = (orderData: Order) => {
  selectedPrintOrder.value = orderData
  showPrintModal.value = true
}

const triggerBrowserPrint = () => {
  window.print()
}

// Data Fetching
const loadProducts = async () => {
  loadingProducts.value = true
  try {
    const res = await fetchProducts({ pageSize: 1000 })
    products.value = res.items || []
  } catch (err: any) {
    console.error('Fetch products error:', err)
    showError('Lỗi tải danh sách sản phẩm')
  } finally {
    loadingProducts.value = false
  }
}

const loadShiftSummary = async () => {
  try {
    initShiftSession()
    const shiftStartedAt =
      localStorage.getItem('shiftStartedAt') ||
      localStorage.getItem('lastShiftEndedAt') ||
      undefined
    const res = await fetchShiftSummary(true, shiftStartedAt)
    shiftSummary.value = res
  } catch (err) {
    console.error('Shift summary fetch error:', err)
  }
}

const formatCurrency = (val: number | undefined) => {
  const rounded = Math.round((val || 0) * 100) / 100
  return rounded.toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + ' ₫'
}

const formatQuantity = (val: number | undefined) => {
  if (val === undefined || isNaN(val)) return '0'
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(
    val,
  )
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return (
    d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) +
    ' ' +
    d.toLocaleDateString('vi-VN')
  )
}

onMounted(() => {
  loadProducts()
  loadShiftSummary()
})
</script>

<template>
  <div
    class="pos-layout flex h-full min-h-[calc(100dvh-130px)] lg:h-[calc(100vh-80px)] flex-col overflow-hidden rounded-2xl border border-[#E2D7CC] bg-[#F9F6F0] shadow-sm lg:flex-row relative"
  >
    <!-- Mobile Segmented View Switcher (Visible only on < lg screens) -->
    <div class="pos-mobile-nav flex lg:hidden items-center justify-between border-b border-[#E2D7CC] bg-white p-2 gap-2 shrink-0">
      <button
        type="button"
        @click="mobileTab = 'menu'"
        class="flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
        :class="mobileTab === 'menu' ? 'bg-[#8E3E2F] text-white shadow-sm' : 'bg-[#F2ECE4] text-[#42493d]'"
      >
        <span class="material-symbols-outlined text-base">restaurant_menu</span>
        <span>Thực đơn món</span>
      </button>
      <button
        type="button"
        @click="mobileTab = 'cart'"
        class="flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 relative"
        :class="mobileTab === 'cart' ? 'bg-[#8E3E2F] text-white shadow-sm' : 'bg-[#F2ECE4] text-[#42493d]'"
      >
        <span class="material-symbols-outlined text-base">shopping_cart</span>
        <span>Giỏ hàng</span>
        <span
          v-if="totalCartItemsCount > 0"
          class="ml-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-[#326824] text-white shadow"
        >
          {{ totalCartItemsCount }}
        </span>
      </button>
    </div>

    <!-- Left Section: Products (60% on desktop, 100% on mobile when mobileTab === 'menu') -->
    <section
      class="h-full flex-col gap-3 sm:gap-4 overflow-hidden border-r border-[#E2D7CC] bg-white p-3 sm:p-5 lg:w-[60%]"
      :class="[mobileTab === 'menu' ? 'flex flex-1' : 'hidden lg:flex']"
    >
      <!-- Stitch 2.0 Shift Summary Bar (With Shift & Staff Info) -->
      <div
        class="flex shrink-0 flex-col items-start justify-between gap-3 rounded-xl border border-[#E2D7CC] bg-white p-3 shadow-sm sm:flex-row sm:items-center"
      >
        <div class="flex flex-col gap-1 w-full sm:w-auto">
          <div class="flex items-center gap-2">
            <span
              class="rounded-lg bg-[#326824]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#326824]"
            >
              {{ shiftSummary.shiftName || 'Ca sáng (06:00 - 14:00)' }}
            </span>
            <span
              class="flex items-center gap-1 text-[11px] font-semibold text-gray-700"
            >
              <span class="material-symbols-outlined text-xs text-[#8E3E2F]"
                >person</span
              >
              {{ currentStaffName }}
            </span>
          </div>

          <div class="mt-1 flex items-center gap-3 sm:gap-4 overflow-x-auto pb-1 sm:pb-0">
            <div class="flex flex-col shrink-0">
              <span
                class="text-[10px] font-bold uppercase tracking-wider text-[#72796c]"
                >Doanh thu ca</span
              >
              <span class="font-display text-sm sm:text-base font-bold text-[#326824]">{{
                formatCurrency(shiftSummary.shiftRevenue)
              }}</span>
            </div>
            <div class="h-6 w-px bg-[#E2D7CC] shrink-0"></div>
            <div class="flex flex-col shrink-0">
              <span
                class="text-[10px] font-bold uppercase tracking-wider text-[#72796c]"
                >Đơn hàng</span
              >
              <span class="text-xs sm:text-sm font-bold text-[#1e1b1b]">{{
                shiftSummary.totalOrders
              }}</span>
            </div>
            <div class="h-6 w-px bg-[#E2D7CC] shrink-0"></div>
            <div class="flex flex-col shrink-0">
              <span
                class="text-[10px] font-bold uppercase tracking-wider text-[#72796c]"
                >Số phần</span
              >
              <span class="text-xs sm:text-sm font-bold text-[#1e1b1b]">{{
                shiftSummary.totalCupsSold
              }}</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            @click="openShiftEndModal"
            class="flex-1 sm:flex-none flex h-9 sm:h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#8E3E2F] px-3 sm:px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#6E281C]"
            title="Bàn giao ca làm việc & Đăng xuất"
          >
            <span class="material-symbols-outlined text-base">output</span>
            <span>Kết ca</span>
          </button>

          <button
            @click="router.push('/reports/sales')"
            class="flex-1 sm:flex-none flex h-9 sm:h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#c1c9b9]/60 bg-[#F2ECE4] px-3 sm:px-4 text-xs font-semibold text-[#42493d] transition hover:bg-[#E8DFD5]"
          >
            <span class="material-symbols-outlined text-base">bar_chart</span>
            <span>Xem báo cáo</span>
          </button>
        </div>
      </div>

      <!-- Search & Header Controls -->
      <div class="flex flex-col items-center justify-between gap-2.5 sm:gap-3 sm:flex-row">
        <div class="relative w-full flex-1">
          <span
            class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-xl text-[#72796c]"
            >search</span
          >
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Tìm kiếm sản phẩm theo tên hoặc mã SP..."
            class="h-10 w-full rounded-xl border border-[#c1c9b9]/70 bg-white pl-11 pr-4 text-xs font-medium text-[#1e1b1b] focus:border-[#8E3E2F] focus:outline-none focus:ring-2 focus:ring-[#8E3E2F]/20"
          />
        </div>

        <button
          @click="openOrderHistory(1)"
          class="w-full sm:w-auto flex h-10 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-[#c1c9b9]/60 bg-[#F2ECE4] px-4 text-xs font-semibold text-[#5D4037] transition hover:bg-[#E8DFD5]"
        >
          <span class="material-symbols-outlined text-base">history</span>
          <span>Lịch sử đơn</span>
        </button>
      </div>

      <!-- Category Filter Pills -->
      <div class="scrollbar-none flex shrink-0 gap-2 overflow-x-auto pb-1">
        <button
          v-for="cat in categories"
          :key="cat"
          @click="selectedCategory = cat"
          class="flex h-9 cursor-pointer items-center whitespace-nowrap rounded-xl px-4 text-xs font-semibold transition"
          :class="
            selectedCategory === cat
              ? 'bg-[#8E3E2F] text-white shadow-sm'
              : 'bg-[#F2ECE4] text-[#42493d] hover:bg-[#E8DFD5]'
          "
        >
          {{ cat }}
        </button>
      </div>

      <!-- Stitch 2.0 Product Cards Grid -->
      <div class="flex-1 overflow-y-auto pr-1">
        <div
          v-if="loadingProducts"
          class="flex items-center justify-center py-20 text-xs text-[#72796c]"
        >
          <span class="material-symbols-outlined mr-2 animate-spin"
            >refresh</span
          >
          Đang tải danh sách sản phẩm...
        </div>

        <div
          v-else-if="filteredProducts.length === 0"
          class="py-16 text-center text-xs font-medium text-[#72796c]"
        >
          Không tìm thấy sản phẩm phù hợp
        </div>

        <div
          v-else
          class="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 xl:grid-cols-4 pb-20 lg:pb-0"
        >
          <div
            v-for="p in filteredProducts"
            :key="p.id"
            @click="handleProductClick(p)"
            class="group relative flex flex-col overflow-hidden rounded-xl border border-[#E2D7CC] bg-white shadow-sm transition"
            :class="[
              isProductSuspended(p)
                ? 'pointer-events-none cursor-not-allowed select-none bg-[#f9f9f9] opacity-50'
                : p.isOutOfStock
                  ? 'cursor-pointer select-none border-[#fecaca] bg-[#fef2f2] opacity-60 transition-all hover:border-[#ef4444] hover:opacity-80 hover:shadow-md'
                  : 'cursor-pointer hover:border-[#8E3E2F] hover:shadow-md',
            ]"
          >
            <span
              class="absolute left-2 top-2 z-10 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm"
            >
              {{ p.category }}
            </span>

            <button
              v-if="!isProductSuspended(p) && !p.isOutOfStock"
              @click.stop="handleProductClick(p)"
              class="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-[#326824] text-white shadow-md transition hover:scale-110 hover:bg-[#4a813a]"
              title="Thêm vào đơn hàng"
            >
              <span class="material-symbols-outlined text-base">add</span>
            </button>
            <div
              v-else-if="isProductSuspended(p)"
              class="absolute right-2 top-2 z-10 flex h-7 w-7 cursor-not-allowed items-center justify-center rounded-full bg-gray-400 text-white shadow-sm"
              title="Tạm ngừng kinh doanh"
            >
              <span class="material-symbols-outlined text-base">block</span>
            </div>
            <div
              v-else-if="p.isOutOfStock"
              class="absolute right-2 top-2 z-10 flex h-7 w-7 cursor-not-allowed items-center justify-center rounded-full bg-orange-500 text-white shadow-sm"
              :title="
                'Hết nguyên liệu: ' +
                (p.outOfStockIngredients?.join(', ') || '')
              "
            >
              <span class="material-symbols-outlined text-base"
                >inventory_2</span
              >
            </div>

            <div
              class="relative flex h-28 sm:h-32 w-full items-center justify-center overflow-hidden bg-[#F2ECE4]"
            >
              <img
                v-if="p.img"
                :src="p.img"
                :alt="p.name"
                class="h-full w-full object-cover transition duration-300"
                :class="
                  isProductSuspended(p) || p.isOutOfStock
                    ? 'contrast-75 grayscale'
                    : 'group-hover:scale-105'
                "
              />
              <div
                v-else
                class="flex h-full w-full flex-col items-center justify-center bg-[#F9F6F0] text-[#8E3E2F]/60"
              >
                <span class="material-symbols-outlined text-3xl sm:text-4xl"
                  >ramen_dining</span
                >
                <span class="mt-1 text-[10px] font-medium text-[#72796c]"
                  >Chưa có ảnh</span
                >
              </div>
              <div
                v-if="isProductSuspended(p)"
                class="absolute inset-0 z-10 flex items-center justify-center bg-black/25"
              >
                <span
                  class="flex items-center gap-1 rounded-md bg-red-600/95 px-2.5 py-1 text-[11px] font-bold text-white shadow-md"
                >
                  <span class="material-symbols-outlined text-sm">block</span>
                  Tạm ngừng
                </span>
              </div>
              <div
                v-else-if="p.isOutOfStock"
                class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/30 p-2 text-center transition-all hover:bg-black/40"
              >
                <span
                  class="mb-1 flex items-center gap-1 rounded-md bg-red-600/95 px-2.5 py-1 text-[11px] font-bold text-white shadow-md"
                >
                  <span class="material-symbols-outlined text-sm"
                    >inventory_2</span
                  >
                  Hết nguyên liệu
                </span>
                <span
                  class="max-w-full cursor-pointer truncate rounded bg-black/60 px-1.5 py-0.5 text-[9px] text-white/95 shadow-sm hover:underline"
                >
                  Nhấn để xem chi tiết
                </span>
              </div>
            </div>
            <div class="flex flex-1 flex-col justify-between gap-1 p-2.5 sm:p-3">
              <h3
                class="line-clamp-2 text-xs font-bold"
                :class="
                  isProductSuspended(p) || p.isOutOfStock
                    ? 'text-gray-500'
                    : 'text-[#1e1b1b]'
                "
              >
                {{ p.name }}
              </h3>
              <p
                class="mt-1 text-xs font-bold"
                :class="
                  isProductSuspended(p) || p.isOutOfStock
                    ? 'text-gray-400'
                    : 'text-[#326824]'
                "
              >
                {{ formatCurrency(p.rawPrice) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Right Section: Cart & Order (40% on desktop, 100% on mobile when mobileTab === 'cart') -->
    <section
      class="z-10 h-full flex-col bg-white shadow-lg lg:w-[40%]"
      :class="[mobileTab === 'cart' ? 'flex flex-1' : 'hidden lg:flex']"
    >
      <!-- Mobile Back to Menu Header -->
      <div class="lg:hidden flex items-center justify-between border-b border-[#E2D7CC] bg-[#F9F6F0] px-3.5 py-2">
        <button
          @click="mobileTab = 'menu'"
          type="button"
          class="flex items-center gap-1 text-xs font-bold text-[#8E3E2F] hover:underline"
        >
          <span class="material-symbols-outlined text-base">arrow_back</span>
          <span>Tiếp tục chọn món</span>
        </button>
        <span class="text-xs font-bold text-[#1e1b1b]">Đơn #{{ activeTab.name }} ({{ activeTab.tableNo }})</span>
      </div>

      <!-- Order Tabs Header -->
      <div
        class="scrollbar-none flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-[#E2D7CC] bg-white px-4 pt-3"
      >
        <div
          v-for="tab in orderTabs"
          :key="tab.id"
          @click="activeTabId = tab.id"
          class="flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-t-xl border-x border-t border-[#E2D7CC] px-3 py-1.5 text-xs font-bold transition"
          :class="
            activeTabId === tab.id
              ? 'border-[#8E3E2F] bg-[#8E3E2F] text-white'
              : 'bg-[#F2ECE4] text-[#42493d] hover:bg-[#E8DFD5]'
          "
        >
          <span>Đơn #{{ tab.name }}</span>
          <button
            @click.stop="closeTab(tab.id)"
            class="flex items-center justify-center rounded p-0.5 text-[10px] hover:bg-black/20"
          >
            <span class="material-symbols-outlined text-xs">close</span>
          </button>
        </div>

        <button
          @click="addTab"
          class="flex items-center justify-center rounded-lg p-1 font-bold text-[#8E3E2F] transition hover:bg-[#F2ECE4]"
          title="Tạo đơn hàng mới"
        >
          <span class="material-symbols-outlined text-lg">add</span>
        </button>
      </div>

      <!-- Active Order Info Header -->
      <div
        class="flex shrink-0 items-center justify-between border-b border-[#E2D7CC] bg-[#F9F6F0] p-3 px-4"
      >
        <div>
          <h2 class="font-display text-xs font-bold text-[#1e1b1b]">
            Đơn hàng #{{ activeTab.name }}
          </h2>
          <p class="text-[11px] font-medium text-[#72796c]">
            Khách lẻ - {{ activeTab.tableNo }}
          </p>
        </div>
        <button
          @click="clearCart"
          class="rounded-xl p-1.5 text-[#ba1a1a] transition hover:bg-[#ffdad6]"
          title="Xóa tất cả sản phẩm"
        >
          <span class="material-symbols-outlined text-lg">delete</span>
        </button>
      </div>


      <!-- Scrollable Cart Content -->
      <div class="flex-1 space-y-3 overflow-y-auto p-4">
        <!-- Promo Code Input -->
        <div class="space-y-1.5">
          <div class="flex gap-2">
            <input
              v-model="activeTab.promoCode"
              type="text"
              placeholder="Nhập mã giảm giá (VD: GIAM10K)"
              class="h-10 flex-1 rounded-xl border border-[#c1c9b9]/70 bg-white px-3.5 text-xs text-[#1e1b1b] outline-none focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20"
            />
            <button
              @click="applyPromoCode"
              class="flex h-10 cursor-pointer items-center justify-center rounded-xl bg-[#8E3E2F] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#6E281C]"
            >
              Áp dụng
            </button>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="text-[10px] font-semibold text-[#72796c]">Gợi ý:</span>
            <button
              @click="applySuggestedPromoCode('GIAM10K')"
              class="flex h-6 cursor-pointer items-center rounded-lg border border-[#c1c9b9]/60 bg-[#F2ECE4] px-2.5 text-[10px] font-bold text-[#8E3E2F] transition hover:bg-[#E8DFD5]"
            >
              GIAM10K
            </button>
            <button
              @click="applySuggestedPromoCode('FREESHIP')"
              class="flex h-6 cursor-pointer items-center rounded-lg border border-[#c1c9b9]/60 bg-[#F2ECE4] px-2.5 text-[10px] font-bold text-[#8E3E2F] transition hover:bg-[#E8DFD5]"
            >
              FREESHIP
            </button>
          </div>
        </div>

        <!-- Cart Empty State -->
        <div
          v-if="activeTab.cart.length === 0"
          class="py-12 text-center text-xs font-medium text-[#72796c]"
        >
          <span
            class="material-symbols-outlined mb-1 block text-3xl text-[#c1c9b9]"
            >shopping_cart</span
          >
          Chưa chọn sản phẩm nào vào đơn hàng
        </div>

        <!-- Cart Items List with Animation -->
        <TransitionGroup name="cart-item" tag="div" class="space-y-3">
          <div
            v-for="(item, idx) in activeTab.cart"
            :key="item.product.id"
            class="flex flex-col gap-1 border-b border-dashed border-[#E2D7CC] pb-3"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1">
                <h4 class="text-xs font-bold text-[#1e1b1b]">
                  {{ item.product.name }}
                </h4>
                <p class="text-[10px] text-[#72796c]">
                  {{ formatCurrency(item.product.rawPrice) }}
                </p>
              </div>

              <div
                class="flex items-center gap-1 rounded-xl bg-[#F2ECE4] p-0.5"
              >
                <button
                  @click="updateQty(idx, -1)"
                  class="flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg bg-white text-[#1e1b1b] shadow-sm hover:bg-[#E8DFD5]"
                >
                  <span class="material-symbols-outlined text-xs">remove</span>
                </button>
                <input
                  type="number"
                  :value="item.quantity"
                  min="1"
                  @change="
                    setQty(idx, ($event.target as HTMLInputElement).value)
                  "
                  @keydown.enter="($event.target as HTMLInputElement).blur()"
                  @focus="($event.target as HTMLInputElement).select()"
                  class="h-6 w-16 rounded-lg border border-[#c1c9b9]/60 bg-white text-center text-xs font-bold text-[#1e1b1b] [appearance:textfield] focus:border-[#8E3E2F] focus:outline-none focus:ring-1 focus:ring-[#8E3E2F]/30 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <button
                  @click="updateQty(idx, 1)"
                  class="flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg bg-white text-[#1e1b1b] shadow-sm hover:bg-[#E8DFD5]"
                >
                  <span class="material-symbols-outlined text-xs">add</span>
                </button>
              </div>

              <div class="min-w-[70px] text-right">
                <p class="text-xs font-bold text-[#1e1b1b]">
                  {{ formatCurrency(item.product.rawPrice * item.quantity) }}
                </p>
              </div>
            </div>

            <!-- Note Input for Cart Item -->
            <input
              v-model="item.note"
              type="text"
              placeholder="Ghi chú món (VD: ít cay, thêm nước tương...)"
              class="h-8 w-full rounded-lg border border-[#c1c9b9]/70 bg-white px-2.5 py-1 text-xs text-[#1e1b1b] outline-none focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20"
            />
          </div>
        </TransitionGroup>
      </div>

      <!-- Checkout & Payment Section Footer -->
      <div
        class="shrink-0 space-y-3 border-t border-[#E2D7CC] bg-[#F9F6F0] p-4"
      >
        <div class="space-y-1 text-xs text-[#42493d]">
          <div class="flex justify-between">
            <span
              >Tạm tính ({{
                activeTab.cart.reduce((s, i) => s + i.quantity, 0)
              }}
              món)</span
            >
            <span class="font-semibold text-[#1e1b1b]">{{
              formatCurrency(subtotalPrice)
            }}</span>
          </div>
          <div class="flex justify-between" v-if="activeTab.discountAmount > 0">
            <span>Giảm giá</span>
            <span class="font-semibold text-[#326824]"
              >-{{ formatCurrency(activeTab.discountAmount) }}</span
            >
          </div>
          <div
            class="flex justify-between border-t border-[#E2D7CC] pt-1.5 text-base font-bold text-[#1e1b1b]"
          >
            <span>Tổng cộng thanh toán</span>
            <span class="font-display text-lg text-[#326824]">{{
              formatCurrency(finalPrice)
            }}</span>
          </div>
        </div>

        <!-- Payment Methods Selector -->
        <div class="grid grid-cols-4 gap-2 pt-1">
          <button
            v-for="method in [
              { id: 'cash', label: 'Tiền mặt', icon: 'payments' },
              { id: 'qr', label: 'Quét QR', icon: 'qr_code_2' },
              { id: 'bank', label: 'Chuyển khoản', icon: 'account_balance' },
              { id: 'card', label: 'Thẻ', icon: 'credit_card' },
            ]"
            :key="method.id"
            @click="activeTab.paymentMethod = method.id"
            class="flex flex-col items-center gap-0.5 rounded-xl border p-1.5 text-[10px] font-semibold transition"
            :class="
              activeTab.paymentMethod === method.id
                ? 'border-[#8E3E2F] bg-[#8E3E2F]/10 text-[#8E3E2F]'
                : 'border-[#c1c9b9]/60 bg-white text-[#42493d] hover:bg-[#F2ECE4]'
            "
          >
            <span class="material-symbols-outlined text-base">{{
              method.icon
            }}</span>
            <span class="w-full truncate text-center">{{ method.label }}</span>
          </button>
        </div>

        <!-- Checkout Button -->
        <button
          @click="handlePaymentClick"
          :disabled="activeTab.cart.length === 0 || isSubmittingPayment"
          class="flex w-full items-center justify-center gap-2 rounded-xl bg-[#326824] py-3 text-sm font-bold text-white shadow transition hover:bg-[#4a813a] active:scale-[0.99] disabled:opacity-50"
        >
          <span
            v-if="isSubmittingPayment"
            class="material-symbols-outlined animate-spin text-lg"
            >refresh</span
          >
          <span>THANH TOÁN {{ formatCurrency(finalPrice) }}</span>
          <span
            v-if="!isSubmittingPayment"
            class="material-symbols-outlined text-lg"
            >arrow_forward</span
          >
        </button>
      </div>
    </section>

    <!-- Sticky Floating Cart Bar on Mobile when browsing menu -->
    <div
      v-if="mobileTab === 'menu' && totalCartItemsCount > 0"
      class="lg:hidden fixed bottom-3 left-3 right-3 z-30 bg-[#326824] text-white p-3 rounded-2xl shadow-2xl flex items-center justify-between cursor-pointer animate-fade-in-up border border-[#4a813a]"
      @click="mobileTab = 'cart'"
    >
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
          {{ totalCartItemsCount }}
        </div>
        <div class="flex flex-col text-left">
          <span class="text-[11px] font-semibold text-white/90">Đơn #{{ activeTab.name }} • {{ activeTab.tableNo }}</span>
          <span class="text-sm font-black">{{ formatCurrency(finalPrice) }}</span>
        </div>
      </div>
      <div class="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl text-xs font-bold">
        <span>Xem giỏ & Thanh toán</span>
        <span class="material-symbols-outlined text-sm">arrow_forward</span>
      </div>
    </div>

    <!-- Shift End / Handover Modal -->
    <Dialog
      v-model:visible="showShiftEndModal"
      modal
      header="Báo cáo Bàn giao Ca làm việc (Kết Ca)"
      :style="{ width: '520px' }"
    >
      <div class="space-y-4 py-1 text-xs">
        <div
          class="space-y-1.5 rounded-xl border border-[#E2D7CC] bg-[#fdfbf7] p-3.5"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm font-bold text-[#326824]">{{
              shiftSummary.shiftName || 'Ca sáng (06:00 - 14:00)'
            }}</span>
            <Tag value="Đang trực ca" severity="success" />
          </div>
          <p class="text-gray-700">
            Nhân viên trực ca:
            <strong class="text-gray-900">{{ currentStaffName }}</strong>
          </p>
          <p class="text-[11px] text-gray-500">
            Thời điểm bàn giao: {{ formatDate(new Date().toISOString()) }}
          </p>
        </div>

        <!-- Detailed Breakdown -->
        <div
          class="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200"
        >
          <div
            class="flex items-center justify-between bg-gray-50 p-3 font-bold text-gray-800"
          >
            <span>Hạng mục kết ca</span>
            <span>Giá trị</span>
          </div>

          <div class="flex items-center justify-between p-3">
            <span class="text-gray-700">1. Doanh thu Tiền mặt (Cash)</span>
            <span class="font-bold text-gray-900">{{
              formatCurrency(shiftSummary.cashRevenue)
            }}</span>
          </div>

          <div class="flex items-center justify-between p-3">
            <span class="text-gray-700"
              >2. Doanh thu Quét QR / Chuyển khoản</span
            >
            <span class="font-bold text-gray-900">{{
              formatCurrency(shiftSummary.transferRevenue)
            }}</span>
          </div>

          <div class="flex items-center justify-between p-3">
            <span class="text-gray-700">3. Doanh thu Thẻ (Card)</span>
            <span class="font-bold text-gray-900">{{
              formatCurrency(shiftSummary.cardRevenue)
            }}</span>
          </div>

          <div class="flex items-center justify-between p-3 text-[#326824]">
            <span>4. Tổng tiền giảm giá (KM/Discount)</span>
            <span class="font-semibold"
              >-{{ formatCurrency(shiftSummary.totalDiscount) }}</span
            >
          </div>

          <div
            class="flex items-center justify-between bg-[#F2ECE4]/60 p-3 text-sm font-bold text-[#326824]"
          >
            <span>TỔNG DOANH THU CA</span>
            <span class="font-display text-base">{{
              formatCurrency(shiftSummary.shiftRevenue)
            }}</span>
          </div>

          <div
            class="flex items-center justify-between p-3 text-[11px] text-gray-600"
          >
            <span
              >Tổng số đơn bán trong ca:
              <strong>{{ shiftSummary.totalOrders }} đơn</strong></span
            >
            <span
              >Tổng số phần bán ra:
              <strong>{{ shiftSummary.totalCupsSold }} phần</strong></span
            >
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex w-full gap-2">
          <Button
            label="In phiếu kết ca"
            icon="pi pi-print"
            severity="info"
            outlined
            class="flex-1"
            @click="triggerBrowserPrint"
          />
          <Button
            label="Xác nhận Kết ca & Đăng xuất"
            icon="pi pi-sign-out"
            severity="danger"
            class="flex-1"
            @click="confirmShiftEndAndLogout"
          />
        </div>
      </template>
    </Dialog>

    <!-- VietQR Payment Dialog -->
    <Dialog
      v-model:visible="showQrModal"
      modal
      header="Thanh toán VietQR / Chuyển khoản"
      :style="{ width: '420px' }"
    >
      <div class="space-y-3 py-2 text-center">
        <p class="text-xs font-medium text-[#42493d]">
          Quét mã QR qua ứng dụng Ngân hàng để thanh toán:
        </p>
        <div
          class="inline-block rounded-2xl border-2 border-[#8E3E2F] bg-white p-3 shadow-md"
        >
          <img
            :src="qrData.qrUrl"
            alt="VietQR Code"
            class="h-52 w-52 object-contain"
          />
        </div>
        <div class="space-y-1">
          <div class="font-display text-2xl font-bold text-[#326824]">
            {{ formatCurrency(qrData.amount) }}
          </div>
          <p class="text-xs font-semibold text-[#72796c]">
            Nội dung CK:
            <span class="font-bold text-[#8E3E2F]">{{ qrData.addInfo }}</span>
          </p>
          <p class="text-[11px] text-gray-500">
            Chủ tài khoản: {{ qrData.accountName }}
          </p>
        </div>
      </div>
      <template #footer>
        <div class="flex w-full gap-2">
          <Button
            label="Hủy bỏ"
            severity="secondary"
            outlined
            class="flex-1"
            @click="showQrModal = false"
          />
          <Button
            label="Xác nhận Đã thu tiền"
            icon="pi pi-check"
            severity="success"
            class="flex-1"
            @click="confirmPaymentDone"
          />
        </div>
      </template>
    </Dialog>

    <!-- Order History Modal -->
    <Dialog
      v-model:visible="showHistoryModal"
      modal
      header="Lịch sử đơn hàng"
      :style="{ width: '850px' }"
    >
      <div class="space-y-3 py-2">
        <!-- Date Filter & Record Count Header Bar -->
        <div
          class="flex flex-col items-start justify-between gap-3 rounded-xl border border-[#E2D7CC] bg-[#fdfbf7] p-3 sm:flex-row sm:items-center"
        >
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs font-bold text-gray-700">Lọc ngày:</span>
            <DatePicker
              v-model="historyDateRange"
              selectionMode="range"
              dateFormat="dd/mm/yy"
              showIcon
              placeholder="Từ ngày - Đến ngày"
              class="text-xs font-medium"
              style="max-width: 250px"
            />
            <button
              @click="openOrderHistory(1)"
              class="flex h-10 cursor-pointer items-center gap-1.5 rounded-xl bg-[#8E3E2F] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#6E281C]"
            >
              <span class="material-symbols-outlined text-base">search</span>
              <span>Tìm kiếm</span>
            </button>
            <button
              @click="setHistoryDateToday"
              class="h-10 cursor-pointer rounded-xl border border-[#c1c9b9]/60 bg-[#F2ECE4] px-3.5 text-xs font-semibold text-[#8E3E2F] transition hover:bg-[#E8DFD5]"
            >
              Hôm nay
            </button>
            <button
              v-if="historyDateRange && historyDateRange.length > 0"
              @click="clearHistoryDateFilter"
              class="h-10 cursor-pointer rounded-xl border border-[#c1c9b9]/60 bg-[#F2ECE4] px-3.5 text-xs font-semibold text-[#42493d] transition hover:bg-[#E8DFD5]"
            >
              Tất cả ngày
            </button>
          </div>

          <div class="flex items-center gap-2">
            <Tag
              :value="`Tổng cộng: ${historyPagination.totalRecords || orderHistory.length} đơn hàng`"
              severity="info"
              class="px-3 py-1 text-xs font-bold"
            />
          </div>
        </div>

        <div
          v-if="loadingHistory"
          class="py-8 text-center text-xs text-gray-500"
        >
          <span class="material-symbols-outlined mr-1 animate-spin"
            >refresh</span
          >
          Đang tải lịch sử đơn hàng...
        </div>

        <DataTable
          v-else
          :value="orderHistory"
          paginator
          :rows="5"
          responsiveLayout="scroll"
          class="p-datatable-sm"
        >
          <Column field="orderNumber" header="Mã đơn" sortable>
            <template #body="slotProps">
              <span class="text-xs font-bold text-[#8E3E2F]">{{
                slotProps.data.orderNumber
              }}</span>
            </template>
          </Column>
          <Column field="orderDate" header="Thời gian">
            <template #body="slotProps">
              <span class="text-xs text-gray-600">{{
                formatDate(slotProps.data.orderDate)
              }}</span>
            </template>
          </Column>
          <Column field="finalAmount" header="Tổng tiền" sortable>
            <template #body="slotProps">
              <span class="text-xs font-bold text-[#326824]">{{
                formatCurrency(slotProps.data.finalAmount)
              }}</span>
            </template>
          </Column>
          <Column field="paymentMethod" header="PTTT">
            <template #body="slotProps">
              <span class="text-xs font-semibold uppercase text-gray-700">{{
                slotProps.data.paymentMethod
              }}</span>
            </template>
          </Column>
          <Column field="status" header="Trạng thái">
            <template #body="slotProps">
              <Tag
                :value="
                  slotProps.data.status === 'completed'
                    ? 'Hoàn thành'
                    : 'Đã hủy'
                "
                :severity="
                  slotProps.data.status === 'completed' ? 'success' : 'danger'
                "
              />
            </template>
          </Column>
          <Column header="Thao tác">
            <template #body="slotProps">
              <div class="flex gap-1">
                <Button
                  icon="pi pi-eye"
                  severity="secondary"
                  text
                  size="small"
                  title="Xem chi tiết đơn"
                  @click="viewOrderDetail(slotProps.data)"
                />
                <Button
                  icon="pi pi-print"
                  severity="info"
                  text
                  size="small"
                  title="In lại bill"
                  @click="printReceipt(slotProps.data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </Dialog>

    <!-- Order Detail Dialog -->
    <Dialog
      v-model:visible="showOrderDetailModal"
      modal
      :header="`Chi tiết đơn hàng #${selectedOrderDetail?.orderNumber}`"
      :style="{ width: '550px' }"
    >
      <div v-if="selectedOrderDetail" class="space-y-4 py-1 text-xs">
        <!-- Summary Header Card -->
        <div
          class="flex items-center justify-between rounded-xl border border-[#E2D7CC] bg-[#fdfbf7] p-3.5"
        >
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="text-sm font-bold text-[#8E3E2F]"
                >#{{ selectedOrderDetail.orderNumber }}</span
              >
              <Tag
                :value="
                  selectedOrderDetail.status === 'completed'
                    ? 'Hoàn thành'
                    : 'Đã hủy'
                "
                :severity="
                  selectedOrderDetail.status === 'completed'
                    ? 'success'
                    : 'danger'
                "
              />
            </div>
            <p class="text-[11px] text-gray-500">
              Thời gian: {{ formatDate(selectedOrderDetail.orderDate) }}
            </p>
            <p class="text-[11px] text-gray-600">
              Phương thức TT:
              <strong class="uppercase text-gray-800">{{
                selectedOrderDetail.paymentMethod
              }}</strong>
            </p>
          </div>
          <div class="text-right">
            <span class="block text-[11px] text-gray-500">Tổng tiền đơn</span>
            <span class="font-display text-lg font-bold text-[#326824]">{{
              formatCurrency(selectedOrderDetail.finalAmount)
            }}</span>
          </div>
        </div>

        <!-- Products List -->
        <div>
          <h4
            class="mb-2 flex items-center gap-1.5 text-xs font-bold text-gray-800"
          >
            <span class="material-symbols-outlined text-base text-[#8E3E2F]"
              >format_list_bulleted</span
            >
            Danh sách sản phẩm bán ra ({{
              selectedOrderDetail.items?.length || 0
            }}
            món):
          </h4>

          <div
            class="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200"
          >
            <div
              v-for="item in selectedOrderDetail.items"
              :key="item.id"
              class="flex items-center justify-between gap-3 p-3 hover:bg-gray-50"
            >
              <div class="flex items-center gap-3">
                <img
                  :src="
                    item.product?.imageUrl ||
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuB5s3vZRGHW-l9un_Pku9yhvejdxLJD-OPfHm88Lc0T2AN7J6Os0hUMTGwyEIsYWrXV2BRsx0QeEy1vBfkKG4Mx8WSlQ00T_yhtFDukz-1LSmzY566Oum2kVS2Hl0b_ZQ_kOW0NbJx7c0MfdZkoGMZKdnW_Hsxp3GolG21jiq5uOA8-hVgLYaoRT3O1xtw1gEFUY3yB1jxBkPXnzvI-CFwBu3Ngx7OT8_SKrA4yzA_cYxiBBS5DM9aV'
                  "
                  class="h-10 w-10 rounded-lg border border-gray-200 object-cover"
                />
                <div>
                  <h5 class="text-xs font-bold text-gray-800">
                    {{ item.product?.name || 'Sản phẩm' }}
                  </h5>
                  <p class="text-[11px] text-gray-500">
                    {{ item.quantity }} x {{ formatCurrency(item.unitPrice) }}
                  </p>
                  <p v-if="item.note" class="text-[10px] italic text-[#8E3E2F]">
                    Ghi chú: {{ item.note }}
                  </p>
                </div>
              </div>
              <div class="text-right">
                <span class="text-xs font-bold text-gray-900">{{
                  formatCurrency(item.subtotal)
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Calculations -->
        <div class="space-y-1.5 rounded-xl bg-gray-50 p-3 text-gray-700">
          <div class="flex justify-between">
            <span>Tạm tính tiền hàng:</span>
            <span class="font-semibold">{{
              formatCurrency(selectedOrderDetail.totalAmount)
            }}</span>
          </div>
          <div
            class="flex justify-between text-[#326824]"
            v-if="selectedOrderDetail.discountAmount > 0"
          >
            <span>Mã giảm giá:</span>
            <span class="font-semibold"
              >-{{ formatCurrency(selectedOrderDetail.discountAmount) }}</span
            >
          </div>
          <div
            class="flex justify-between border-t border-gray-200 pt-1 text-sm font-bold text-gray-900"
          >
            <span>Tổng thanh toán thực tế:</span>
            <span class="text-[#326824]">{{
              formatCurrency(selectedOrderDetail.finalAmount)
            }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex w-full gap-2">
          <Button
            label="In hóa đơn"
            icon="pi pi-print"
            severity="info"
            outlined
            class="flex-1"
            @click="printReceipt(selectedOrderDetail!)"
          />
          <Button
            label="Đóng"
            severity="secondary"
            class="flex-1"
            @click="showOrderDetailModal = false"
          />
        </div>
      </template>
    </Dialog>

    <!-- Print Bill Modal -->
    <Dialog
      v-model:visible="showPrintModal"
      modal
      header="Hóa đơn thanh toán (Bill Preview)"
      :style="{ width: '380px' }"
    >
      <div
        v-if="selectedPrintOrder"
        id="printable-receipt"
        class="space-y-3 rounded-lg border border-gray-200 bg-white p-4 font-mono text-xs text-gray-800"
      >
        <div class="space-y-1 text-center">
          <h2
            class="text-base font-bold uppercase tracking-wider text-[#5D4037]"
          >
            SKY COFFEE
          </h2>
          <p class="text-[11px] text-gray-500">ĐC: 123 Đường Cà Phê, TP. HCM</p>
          <p class="text-[11px] text-gray-500">Hotline: 0901.234.567</p>
          <div class="my-2 border-b border-dashed border-gray-400"></div>
          <h3 class="text-sm font-bold">HÓA ĐƠN BÁN HÀNG</h3>
          <p class="text-[11px]">
            Mã đơn: <strong>{{ selectedPrintOrder.orderNumber }}</strong>
          </p>
          <p class="text-[10px] text-gray-500">
            {{ formatDate(selectedPrintOrder.orderDate) }}
          </p>
        </div>

        <div class="my-2 border-b border-dashed border-gray-400"></div>

        <div class="space-y-1.5">
          <div
            v-for="item in selectedPrintOrder.items"
            :key="item.id"
            class="flex items-start justify-between text-[11px]"
          >
            <div>
              <p class="font-bold">{{ item.product?.name || 'Sản phẩm' }}</p>
              <p class="text-[10px] text-gray-500">
                {{ item.quantity }} x {{ formatCurrency(item.unitPrice) }}
              </p>
              <p v-if="item.note" class="text-[10px] italic text-gray-400">
                Ghi chú: {{ item.note }}
              </p>
            </div>
            <span class="font-bold">{{ formatCurrency(item.subtotal) }}</span>
          </div>
        </div>

        <div class="my-2 border-b border-dashed border-gray-400"></div>

        <div class="space-y-1 text-[11px]">
          <div class="flex justify-between">
            <span>Tạm tính:</span>
            <span>{{ formatCurrency(selectedPrintOrder.totalAmount) }}</span>
          </div>
          <div
            class="flex justify-between"
            v-if="selectedPrintOrder.discountAmount > 0"
          >
            <span>Giảm giá:</span>
            <span
              >-{{ formatCurrency(selectedPrintOrder.discountAmount) }}</span
            >
          </div>
          <div
            class="flex justify-between border-t border-gray-300 pt-1 text-xs font-bold"
          >
            <span>TỔNG CỘNG:</span>
            <span>{{ formatCurrency(selectedPrintOrder.finalAmount) }}</span>
          </div>
          <div class="flex justify-between text-[10px] text-gray-500">
            <span>Hình thức TT:</span>
            <span class="uppercase">{{
              selectedPrintOrder.paymentMethod
            }}</span>
          </div>
        </div>

        <div class="my-2 border-b border-dashed border-gray-400"></div>

        <div class="space-y-0.5 text-center text-[10px] text-gray-500">
          <p>Cảm ơn quý khách và hẹn gặp lại!</p>
          <p>Wifi: SkyCoffee / Pass: skycoffee2026</p>
        </div>
      </div>

      <template #footer>
        <div class="flex w-full gap-2">
          <Button
            label="Đóng"
            severity="secondary"
            class="flex-1"
            @click="showPrintModal = false"
          />
          <Button
            label="In hóa đơn"
            icon="pi pi-print"
            severity="primary"
            class="flex-1"
            @click="triggerBrowserPrint"
          />
        </div>
      </template>
    </Dialog>

    <!-- Missing Ingredients Modal -->
    <Dialog
      v-model:visible="showMissingIngredientsModal"
      modal
      header="Sản phẩm tạm hết hàng"
      :style="{ width: '450px' }"
    >
      <div v-if="selectedMissingProduct" class="space-y-4 py-2">
        <div
          class="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-3"
        >
          <span class="material-symbols-outlined text-3xl text-red-500"
            >inventory_2</span
          >
          <div>
            <h3 class="font-bold text-red-900">
              {{ selectedMissingProduct.name }}
            </h3>
            <p class="text-xs text-red-700">
              Món này hiện không thể phục vụ do thiếu nguyên liệu trong kho.
            </p>
          </div>
        </div>

        <div
          class="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200"
        >
          <div
            class="flex justify-between bg-gray-50 p-3 text-xs font-bold text-gray-700"
          >
            <span>Nguyên liệu định mức</span>
            <span class="text-right">Kho hiện tại</span>
          </div>
          <template
            v-for="recipe in selectedMissingProduct.recipeItems"
            :key="recipe.id"
          >
            <div
              v-if="
                selectedMissingProduct.outOfStockIngredients?.includes(
                  recipe.ingredientName || '',
                )
              "
              class="flex items-center justify-between p-3 text-sm"
            >
              <span class="font-bold font-medium text-red-600">
                {{ recipe.ingredientName }}
              </span>
              <div class="flex flex-col items-end gap-1">
                <span class="text-xs text-gray-500"
                  >Cần: {{ formatQuantity(recipe.amount) }}
                  {{ recipe.unit }}</span
                >
                <span class="text-xs font-semibold text-red-600">
                  Tồn: {{ formatQuantity(recipe.currentStock) }}
                  {{ recipe.stockUnit }}
                </span>
              </div>
            </div>
          </template>
        </div>
      </div>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <Button
            label="Đã hiểu"
            severity="secondary"
            @click="showMissingIngredientsModal = false"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<style scoped lang="scss" src="./Pos.scss"></style>
