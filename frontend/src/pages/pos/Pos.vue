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
import { createOrder, fetchOrders, fetchShiftSummary, Order, ShiftSummary } from '@/api/order.api'
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
  localStorage.getItem('fullName') || localStorage.getItem('userName') || localStorage.getItem('email') || 'Nguyễn Văn A (Thu ngân)'
)

// Data States
const products = ref<ProductItem[]>([])
const loadingProducts = ref(false)
const searchQuery = ref('')
const selectedCategory = ref('Tất cả')

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
    const matchCat = selectedCategory.value === 'Tất cả' || p.category === selectedCategory.value
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
  if (isProductSuspended(product)) return
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

// Discount & Calculation
const subtotalPrice = computed(() => {
  return activeTab.value.cart.reduce((sum, item) => sum + item.product.rawPrice * item.quantity, 0)
})

const finalPrice = computed(() => {
  return Math.max(0, subtotalPrice.value - activeTab.value.discountAmount)
})

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
  } else if (code.startsWith('GIAM') && !isNaN(Number(code.replace('GIAM', '')))) {
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
      // Refresh shift summary
      loadShiftSummary()
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
const historyPagination = ref({ page: 1, pageSize: 20, totalRecords: 0, totalPages: 1 })

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
    if (historyDateRange.value && Array.isArray(historyDateRange.value) && historyDateRange.value.length > 0) {
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
    historyPagination.value = res.pagination || { page: 1, pageSize: 20, totalRecords: (res.items || []).length, totalPages: 1 }
  } catch (err) {
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
  } catch (err) {
    showError('Lỗi tải danh sách sản phẩm')
  } finally {
    loadingProducts.value = false
  }
}

const loadShiftSummary = async () => {
  try {
    initShiftSession()
    const shiftStartedAt = localStorage.getItem('shiftStartedAt') || localStorage.getItem('lastShiftEndedAt') || undefined
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

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString('vi-VN')
}

onMounted(() => {
  loadProducts()
  loadShiftSummary()
})
</script>

<template>
  <div class="pos-layout flex flex-col lg:flex-row h-[calc(100vh-80px)] overflow-hidden bg-[#F9F6F0] rounded-2xl border border-[#E2D7CC] shadow-sm">
    <!-- Left Section: Products (60%) -->
    <section class="lg:w-[60%] flex flex-col h-full border-r border-[#E2D7CC] bg-white p-5 gap-4 overflow-hidden">
      <!-- Stitch 2.0 Shift Summary Bar (With Shift & Staff Info) -->
      <div class="bg-white border border-[#E2D7CC] rounded-xl p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0 shadow-sm">
        <div class="flex flex-col gap-1">
          <div class="flex items-center gap-2">
            <span class="bg-[#326824]/10 text-[#326824] px-2.5 py-0.5 rounded-lg text-[11px] font-bold">
              {{ shiftSummary.shiftName || 'Ca sáng (06:00 - 14:00)' }}
            </span>
            <span class="text-[11px] text-gray-700 font-semibold flex items-center gap-1">
              <span class="material-symbols-outlined text-xs text-[#8E3E2F]">person</span>
              {{ currentStaffName }}
            </span>
          </div>

          <div class="flex items-center gap-4 mt-1">
            <div class="flex flex-col">
              <span class="text-[10px] font-bold text-[#72796c] uppercase tracking-wider">Doanh thu ca</span>
              <span class="text-base font-bold text-[#326824] font-display">{{ formatCurrency(shiftSummary.shiftRevenue) }}</span>
            </div>
            <div class="h-6 w-px bg-[#E2D7CC]"></div>
            <div class="flex flex-col">
              <span class="text-[10px] font-bold text-[#72796c] uppercase tracking-wider">Đơn hàng</span>
              <span class="text-sm font-bold text-[#1e1b1b]">{{ shiftSummary.totalOrders }}</span>
            </div>
            <div class="h-6 w-px bg-[#E2D7CC]"></div>
            <div class="flex flex-col">
              <span class="text-[10px] font-bold text-[#72796c] uppercase tracking-wider">Số ly</span>
              <span class="text-sm font-bold text-[#1e1b1b]">{{ shiftSummary.totalCupsSold }}</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2 self-end sm:self-center">
          <button
            @click="openShiftEndModal"
            class="h-10 flex items-center gap-1.5 px-4 bg-[#8E3E2F] hover:bg-[#6E281C] text-white rounded-xl transition text-xs font-semibold shadow-sm cursor-pointer"
            title="Bàn giao ca làm việc & Đăng xuất"
          >
            <span class="material-symbols-outlined text-base">output</span>
            <span>Kết ca</span>
          </button>

          <button
            @click="router.push('/reports/sales')"
            class="h-10 flex items-center gap-1.5 px-4 bg-[#F2ECE4] hover:bg-[#E8DFD5] text-[#42493d] border border-[#c1c9b9]/60 rounded-xl transition text-xs font-semibold cursor-pointer"
          >
            <span class="material-symbols-outlined text-base">bar_chart</span>
            <span>Xem báo cáo</span>
          </button>
        </div>
      </div>

      <!-- Search & Header Controls -->
      <div class="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div class="relative flex-1 w-full">
          <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#72796c] text-xl">search</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Tìm kiếm sản phẩm theo tên hoặc mã SP..."
            class="w-full h-10 pl-11 pr-4 bg-white border border-[#c1c9b9]/70 rounded-xl focus:outline-none focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20 text-xs font-medium text-[#1e1b1b]"
          />
        </div>

        <button
          @click="openOrderHistory(1)"
          class="h-10 flex items-center gap-1.5 px-4 bg-[#F2ECE4] text-[#5D4037] border border-[#c1c9b9]/60 rounded-xl hover:bg-[#E8DFD5] text-xs font-semibold transition whitespace-nowrap cursor-pointer"
        >
          <span class="material-symbols-outlined text-base">history</span>
          <span>Lịch sử đơn</span>
        </button>
      </div>

      <!-- Category Filter Pills -->
      <div class="flex gap-2 overflow-x-auto pb-1 shrink-0 scrollbar-none">
        <button
          v-for="cat in categories"
          :key="cat"
          @click="selectedCategory = cat"
          class="h-9 px-4 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center cursor-pointer"
          :class="selectedCategory === cat ? 'bg-[#8E3E2F] text-white shadow-sm' : 'bg-[#F2ECE4] text-[#42493d] hover:bg-[#E8DFD5]'"
        >
          {{ cat }}
        </button>
      </div>

      <!-- Stitch 2.0 Product Cards Grid -->
      <div class="flex-1 overflow-y-auto pr-1">
        <div v-if="loadingProducts" class="flex justify-center items-center py-20 text-[#72796c] text-xs">
          <span class="material-symbols-outlined animate-spin mr-2">refresh</span> Đang tải danh sách sản phẩm...
        </div>

        <div v-else-if="filteredProducts.length === 0" class="text-center py-16 text-[#72796c] text-xs font-medium">
          Không tìm thấy sản phẩm phù hợp
        </div>

        <div v-else class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          <div
            v-for="p in filteredProducts"
            :key="p.id"
            @click="!isProductSuspended(p) && addToCart(p)"
            class="bg-white rounded-xl border border-[#E2D7CC] shadow-sm overflow-hidden flex flex-col transition group relative"
            :class="[
              isProductSuspended(p)
                ? 'opacity-50 bg-[#f9f9f9] cursor-not-allowed select-none pointer-events-none'
                : 'cursor-pointer hover:shadow-md hover:border-[#8E3E2F]'
            ]"
          >
            <span class="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-md backdrop-blur-sm z-10 font-bold">
              {{ p.category }}
            </span>

            <button
              v-if="!isProductSuspended(p)"
              @click.stop="addToCart(p)"
              class="absolute top-2 right-2 bg-[#326824] hover:bg-[#4a813a] text-white w-7 h-7 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition z-10"
              title="Thêm vào đơn hàng"
            >
              <span class="material-symbols-outlined text-base">add</span>
            </button>
            <div
              v-else
              class="absolute top-2 right-2 bg-gray-400 text-white w-7 h-7 rounded-full flex items-center justify-center shadow-sm cursor-not-allowed z-10"
              title="Tạm ngừng kinh doanh"
            >
              <span class="material-symbols-outlined text-base">block</span>
            </div>

            <div class="h-32 w-full bg-[#F2ECE4] relative overflow-hidden">
              <img
                :src="
                  p.img ||
                  'https://lh3.googleusercontent.com/aida-public/AB6AXuB5s3vZRGHW-l9un_Pku9yhvejdxLJD-OPfHm88Lc0T2AN7J6Os0hUMTGwyEIsYWrXV2BRsx0QeEy1vBfkKG4Mx8WSlQ00T_yhtFDukz-1LSmzY566Oum2kVS2Hl0b_ZQ_kOW0NbJx7c0MfdZkoGMZKdnW_Hsxp3GolG21jiq5uOA8-hVgLYaoRT3O1xtw1gEFUY3yB1jxBkPXnzvI-CFwBu3Ngx7OT8_SKrA4yzA_cYxiBBS5DM9aV'
                "
                :alt="p.name"
                class="w-full h-full object-cover transition duration-300"
                :class="isProductSuspended(p) ? 'grayscale contrast-75' : 'group-hover:scale-105'"
              />
              <div v-if="isProductSuspended(p)" class="absolute inset-0 bg-black/25 flex items-center justify-center z-10">
                <span class="bg-red-600/95 text-white text-[11px] px-2.5 py-1 rounded-md font-bold shadow-md flex items-center gap-1">
                  <span class="material-symbols-outlined text-sm">block</span>
                  Tạm ngừng
                </span>
              </div>
            </div>
            <div class="p-3 flex flex-col flex-1 justify-between gap-1">
              <h3 class="text-xs font-bold line-clamp-2" :class="isProductSuspended(p) ? 'text-gray-500' : 'text-[#1e1b1b]'">{{ p.name }}</h3>
              <p class="text-xs font-bold mt-1" :class="isProductSuspended(p) ? 'text-gray-400' : 'text-[#326824]'">{{ formatCurrency(p.rawPrice) }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Right Section: Cart & Order (40%) -->
    <section class="lg:w-[40%] bg-white flex flex-col h-full z-10 shadow-lg">
      <!-- Order Tabs Header -->
      <div class="flex items-center gap-1.5 px-4 pt-3 bg-white shrink-0 overflow-x-auto border-b border-[#E2D7CC] scrollbar-none">
        <div
          v-for="tab in orderTabs"
          :key="tab.id"
          @click="activeTabId = tab.id"
          class="flex items-center gap-1 px-3 py-1.5 rounded-t-xl text-xs font-bold whitespace-nowrap cursor-pointer transition border-t border-x border-[#E2D7CC]"
          :class="activeTabId === tab.id ? 'bg-[#8E3E2F] text-white border-[#8E3E2F]' : 'bg-[#F2ECE4] text-[#42493d] hover:bg-[#E8DFD5]'"
        >
          <span>Đơn #{{ tab.name }}</span>
          <button @click.stop="closeTab(tab.id)" class="hover:bg-black/20 p-0.5 rounded text-[10px] flex items-center justify-center">
            <span class="material-symbols-outlined text-xs">close</span>
          </button>
        </div>

        <button
          @click="addTab"
          class="p-1 rounded-lg text-[#8E3E2F] hover:bg-[#F2ECE4] transition flex items-center justify-center font-bold"
          title="Tạo đơn hàng mới"
        >
          <span class="material-symbols-outlined text-lg">add</span>
        </button>
      </div>

      <!-- Active Order Info Header -->
      <div class="p-3 px-4 border-b border-[#E2D7CC] flex justify-between items-center bg-[#F9F6F0] shrink-0">
        <div>
          <h2 class="text-xs font-bold font-display text-[#1e1b1b]">Đơn hàng #{{ activeTab.name }}</h2>
          <p class="text-[11px] text-[#72796c] font-medium">Khách lẻ - {{ activeTab.tableNo }}</p>
        </div>
        <button @click="clearCart" class="text-[#ba1a1a] hover:bg-[#ffdad6] p-1.5 rounded-xl transition" title="Xóa tất cả sản phẩm">
          <span class="material-symbols-outlined text-lg">delete</span>
        </button>
      </div>

      <!-- Scrollable Cart Content -->
      <div class="flex-1 overflow-y-auto p-4 space-y-3">
        <!-- Promo Code Input -->
        <div class="space-y-1.5">
          <div class="flex gap-2">
            <input
              v-model="activeTab.promoCode"
              type="text"
              placeholder="Nhập mã giảm giá (VD: GIAM10K)"
              class="flex-1 h-10 px-3.5 bg-white border border-[#c1c9b9]/70 rounded-xl text-xs text-[#1e1b1b] outline-none focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20"
            />
            <button
              @click="applyPromoCode"
              class="h-10 px-4 bg-[#8E3E2F] text-white rounded-xl text-xs font-semibold hover:bg-[#6E281C] transition flex items-center justify-center cursor-pointer shadow-sm"
            >
              Áp dụng
            </button>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="text-[10px] text-[#72796c] font-semibold">Gợi ý:</span>
            <button
              @click="
                activeTab.promoCode = 'GIAM10K';
                applyPromoCode()
              "
              class="h-6 px-2.5 bg-[#F2ECE4] border border-[#c1c9b9]/60 text-[#8E3E2F] rounded-lg text-[10px] font-bold hover:bg-[#E8DFD5] transition flex items-center cursor-pointer"
            >
              GIAM10K
            </button>
            <button
              @click="
                activeTab.promoCode = 'FREESHIP';
                applyPromoCode()
              "
              class="h-6 px-2.5 bg-[#F2ECE4] border border-[#c1c9b9]/60 text-[#8E3E2F] rounded-lg text-[10px] font-bold hover:bg-[#E8DFD5] transition flex items-center cursor-pointer"
            >
              FREESHIP
            </button>
          </div>
        </div>

        <!-- Cart Empty State -->
        <div v-if="activeTab.cart.length === 0" class="text-center text-[#72796c] py-12 text-xs font-medium">
          <span class="material-symbols-outlined text-3xl text-[#c1c9b9] block mb-1">shopping_cart</span>
          Chưa chọn sản phẩm nào vào đơn hàng
        </div>

        <!-- Cart Items List -->
        <div v-for="(item, idx) in activeTab.cart" :key="item.product.id" class="flex flex-col gap-1 pb-3 border-b border-dashed border-[#E2D7CC]">
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1">
              <h4 class="text-xs font-bold text-[#1e1b1b]">{{ item.product.name }}</h4>
              <p class="text-[10px] text-[#72796c]">{{ formatCurrency(item.product.rawPrice) }}</p>
            </div>

            <div class="flex items-center gap-1 bg-[#F2ECE4] p-0.5 rounded-xl">
              <button @click="updateQty(idx, -1)" class="w-6 h-6 flex items-center justify-center rounded-lg bg-white text-[#1e1b1b] shadow-sm hover:bg-[#E8DFD5] cursor-pointer">
                <span class="material-symbols-outlined text-xs">remove</span>
              </button>
              <input
                type="number"
                :value="item.quantity"
                min="1"
                @change="setQty(idx, ($event.target as HTMLInputElement).value)"
                @keydown.enter="($event.target as HTMLInputElement).blur()"
                @focus="($event.target as HTMLInputElement).select()"
                class="w-16 h-6 text-center text-xs font-bold text-[#1e1b1b] bg-white rounded-lg border border-[#c1c9b9]/60 focus:outline-none focus:border-[#8E3E2F] focus:ring-1 focus:ring-[#8E3E2F]/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button @click="updateQty(idx, 1)" class="w-6 h-6 flex items-center justify-center rounded-lg bg-white text-[#1e1b1b] shadow-sm hover:bg-[#E8DFD5] cursor-pointer">
                <span class="material-symbols-outlined text-xs">add</span>
              </button>
            </div>

            <div class="text-right min-w-[70px]">
              <p class="text-xs font-bold text-[#1e1b1b]">{{ formatCurrency(item.product.rawPrice * item.quantity) }}</p>
            </div>
          </div>

          <!-- Note Input for Cart Item -->
          <input
            v-model="item.note"
            type="text"
            placeholder="Ghi chú món (VD: ít đường, đá riêng...)"
            class="w-full h-8 px-2.5 py-1 bg-white border border-[#c1c9b9]/70 rounded-lg text-xs text-[#1e1b1b] outline-none focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20"
          />
        </div>
      </div>

      <!-- Checkout & Payment Section Footer -->
      <div class="p-4 bg-[#F9F6F0] border-t border-[#E2D7CC] space-y-3 shrink-0">
        <div class="space-y-1 text-xs text-[#42493d]">
          <div class="flex justify-between">
            <span>Tạm tính ({{ activeTab.cart.reduce((s, i) => s + i.quantity, 0) }} món)</span>
            <span class="font-semibold text-[#1e1b1b]">{{ formatCurrency(subtotalPrice) }}</span>
          </div>
          <div class="flex justify-between" v-if="activeTab.discountAmount > 0">
            <span>Giảm giá</span>
            <span class="font-semibold text-[#326824]">-{{ formatCurrency(activeTab.discountAmount) }}</span>
          </div>
          <div class="flex justify-between text-base font-bold text-[#1e1b1b] pt-1.5 border-t border-[#E2D7CC]">
            <span>Tổng cộng thanh toán</span>
            <span class="text-[#326824] text-lg font-display">{{ formatCurrency(finalPrice) }}</span>
          </div>
        </div>

        <!-- Payment Methods Selector -->
        <div class="grid grid-cols-4 gap-2 pt-1">
          <button
            v-for="method in [
              { id: 'cash', label: 'Tiền mặt', icon: 'payments' },
              { id: 'qr', label: 'Quét QR', icon: 'qr_code_2' },
              { id: 'bank', label: 'Chuyển khoản', icon: 'account_balance' },
              { id: 'card', label: 'Thẻ', icon: 'credit_card' }
            ]"
            :key="method.id"
            @click="activeTab.paymentMethod = method.id"
            class="p-1.5 rounded-xl border flex flex-col items-center gap-0.5 text-[10px] font-semibold transition"
            :class="activeTab.paymentMethod === method.id ? 'border-[#8E3E2F] bg-[#8E3E2F]/10 text-[#8E3E2F]' : 'border-[#c1c9b9]/60 bg-white text-[#42493d] hover:bg-[#F2ECE4]'"
          >
            <span class="material-symbols-outlined text-base">{{ method.icon }}</span>
            <span class="truncate w-full text-center">{{ method.label }}</span>
          </button>
        </div>

        <!-- Checkout Button -->
        <button
          @click="handlePaymentClick"
          :disabled="activeTab.cart.length === 0 || isSubmittingPayment"
          class="w-full py-3 bg-[#326824] hover:bg-[#4a813a] active:scale-[0.99] disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow transition flex items-center justify-center gap-2"
        >
          <span v-if="isSubmittingPayment" class="material-symbols-outlined animate-spin text-lg">refresh</span>
          <span>THANH TOÁN {{ formatCurrency(finalPrice) }}</span>
          <span v-if="!isSubmittingPayment" class="material-symbols-outlined text-lg">arrow_forward</span>
        </button>
      </div>
    </section>

    <!-- Shift End / Handover Modal -->
    <Dialog v-model:visible="showShiftEndModal" modal header="Báo cáo Bàn giao Ca làm việc (Kết Ca)" :style="{ width: '520px' }">
      <div class="space-y-4 py-1 text-xs">
        <div class="p-3.5 bg-[#fdfbf7] border border-[#E2D7CC] rounded-xl space-y-1.5">
          <div class="flex justify-between items-center">
            <span class="font-bold text-sm text-[#326824]">{{ shiftSummary.shiftName || 'Ca sáng (06:00 - 14:00)' }}</span>
            <Tag value="Đang trực ca" severity="success" />
          </div>
          <p class="text-gray-700">Nhân viên trực ca: <strong class="text-gray-900">{{ currentStaffName }}</strong></p>
          <p class="text-gray-500 text-[11px]">Thời điểm bàn giao: {{ formatDate(new Date().toISOString()) }}</p>
        </div>

        <!-- Detailed Breakdown -->
        <div class="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
          <div class="p-3 flex justify-between items-center bg-gray-50 font-bold text-gray-800">
            <span>Hạng mục kết ca</span>
            <span>Giá trị</span>
          </div>

          <div class="p-3 flex justify-between items-center">
            <span class="text-gray-700">1. Doanh thu Tiền mặt (Cash)</span>
            <span class="font-bold text-gray-900">{{ formatCurrency(shiftSummary.cashRevenue) }}</span>
          </div>

          <div class="p-3 flex justify-between items-center">
            <span class="text-gray-700">2. Doanh thu Quét QR / Chuyển khoản</span>
            <span class="font-bold text-gray-900">{{ formatCurrency(shiftSummary.transferRevenue) }}</span>
          </div>

          <div class="p-3 flex justify-between items-center">
            <span class="text-gray-700">3. Doanh thu Thẻ (Card)</span>
            <span class="font-bold text-gray-900">{{ formatCurrency(shiftSummary.cardRevenue) }}</span>
          </div>

          <div class="p-3 flex justify-between items-center text-[#326824]">
            <span>4. Tổng tiền giảm giá (KM/Discount)</span>
            <span class="font-semibold">-{{ formatCurrency(shiftSummary.totalDiscount) }}</span>
          </div>

          <div class="p-3 flex justify-between items-center bg-[#F2ECE4]/60 text-sm font-bold text-[#326824]">
            <span>TỔNG DOANH THU CA</span>
            <span class="text-base font-display">{{ formatCurrency(shiftSummary.shiftRevenue) }}</span>
          </div>

          <div class="p-3 flex justify-between items-center text-gray-600 text-[11px]">
            <span>Tổng số đơn bán trong ca: <strong>{{ shiftSummary.totalOrders }} đơn</strong></span>
            <span>Tổng số ly bán ra: <strong>{{ shiftSummary.totalCupsSold }} ly</strong></span>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex gap-2 w-full">
          <Button label="In phiếu kết ca" icon="pi pi-print" severity="info" outlined class="flex-1" @click="triggerBrowserPrint" />
          <Button label="Xác nhận Kết ca & Đăng xuất" icon="pi pi-sign-out" severity="danger" class="flex-1" @click="confirmShiftEndAndLogout" />
        </div>
      </template>
    </Dialog>

    <!-- VietQR Payment Dialog -->
    <Dialog v-model:visible="showQrModal" modal header="Thanh toán VietQR / Chuyển khoản" :style="{ width: '420px' }">
      <div class="text-center py-2 space-y-3">
        <p class="text-xs text-[#42493d] font-medium">Quét mã QR qua ứng dụng Ngân hàng để thanh toán:</p>
        <div class="p-3 border-2 border-[#8E3E2F] rounded-2xl inline-block bg-white shadow-md">
          <img :src="qrData.qrUrl" alt="VietQR Code" class="w-52 h-52 object-contain" />
        </div>
        <div class="space-y-1">
          <div class="text-2xl font-bold font-display text-[#326824]">{{ formatCurrency(qrData.amount) }}</div>
          <p class="text-xs text-[#72796c] font-semibold">Nội dung CK: <span class="text-[#8E3E2F] font-bold">{{ qrData.addInfo }}</span></p>
          <p class="text-[11px] text-gray-500">Chủ tài khoản: {{ qrData.accountName }}</p>
        </div>
      </div>
      <template #footer>
        <div class="flex gap-2 w-full">
          <Button label="Hủy bỏ" severity="secondary" outlined class="flex-1" @click="showQrModal = false" />
          <Button label="Xác nhận Đã thu tiền" icon="pi pi-check" severity="success" class="flex-1" @click="confirmPaymentDone" />
        </div>
      </template>
    </Dialog>

    <!-- Order History Modal -->
    <Dialog v-model:visible="showHistoryModal" modal header="Lịch sử đơn hàng" :style="{ width: '850px' }">
      <div class="py-2 space-y-3">
        <!-- Date Filter & Record Count Header Bar -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 bg-[#fdfbf7] border border-[#E2D7CC] rounded-xl">
          <div class="flex items-center gap-2 flex-wrap">
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
              class="h-10 flex items-center gap-1.5 px-4 bg-[#8E3E2F] hover:bg-[#6E281C] text-white rounded-xl text-xs font-semibold transition shadow-sm cursor-pointer"
            >
              <span class="material-symbols-outlined text-base">search</span>
              <span>Tìm kiếm</span>
            </button>
            <button
              @click="setHistoryDateToday"
              class="h-10 px-3.5 bg-[#F2ECE4] text-[#8E3E2F] border border-[#c1c9b9]/60 rounded-xl text-xs font-semibold hover:bg-[#E8DFD5] transition cursor-pointer"
            >
              Hôm nay
            </button>
            <button
              v-if="historyDateRange && historyDateRange.length > 0"
              @click="clearHistoryDateFilter"
              class="h-10 px-3.5 bg-[#F2ECE4] text-[#42493d] border border-[#c1c9b9]/60 rounded-xl text-xs font-semibold hover:bg-[#E8DFD5] transition cursor-pointer"
            >
              Tất cả ngày
            </button>
          </div>

          <div class="flex items-center gap-2">
            <Tag
              :value="`Tổng cộng: ${historyPagination.totalRecords || orderHistory.length} đơn hàng`"
              severity="info"
              class="text-xs font-bold px-3 py-1"
            />
          </div>
        </div>

        <div v-if="loadingHistory" class="text-center py-8 text-xs text-gray-500">
          <span class="material-symbols-outlined animate-spin mr-1">refresh</span> Đang tải lịch sử đơn hàng...
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
              <span class="font-bold text-xs text-[#8E3E2F]">{{ slotProps.data.orderNumber }}</span>
            </template>
          </Column>
          <Column field="orderDate" header="Thời gian">
            <template #body="slotProps">
              <span class="text-xs text-gray-600">{{ formatDate(slotProps.data.orderDate) }}</span>
            </template>
          </Column>
          <Column field="finalAmount" header="Tổng tiền" sortable>
            <template #body="slotProps">
              <span class="font-bold text-xs text-[#326824]">{{ formatCurrency(slotProps.data.finalAmount) }}</span>
            </template>
          </Column>
          <Column field="paymentMethod" header="PTTT">
            <template #body="slotProps">
              <span class="text-xs uppercase font-semibold text-gray-700">{{ slotProps.data.paymentMethod }}</span>
            </template>
          </Column>
          <Column field="status" header="Trạng thái">
            <template #body="slotProps">
              <Tag :value="slotProps.data.status === 'completed' ? 'Hoàn thành' : 'Đã hủy'" :severity="slotProps.data.status === 'completed' ? 'success' : 'danger'" />
            </template>
          </Column>
          <Column header="Thao tác">
            <template #body="slotProps">
              <div class="flex gap-1">
                <Button icon="pi pi-eye" severity="secondary" text size="small" title="Xem chi tiết đơn" @click="viewOrderDetail(slotProps.data)" />
                <Button icon="pi pi-print" severity="info" text size="small" title="In lại bill" @click="printReceipt(slotProps.data)" />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </Dialog>

    <!-- Order Detail Dialog -->
    <Dialog v-model:visible="showOrderDetailModal" modal :header="`Chi tiết đơn hàng #${selectedOrderDetail?.orderNumber}`" :style="{ width: '550px' }">
      <div v-if="selectedOrderDetail" class="space-y-4 py-1 text-xs">
        <!-- Summary Header Card -->
        <div class="p-3.5 bg-[#fdfbf7] border border-[#E2D7CC] rounded-xl flex justify-between items-center">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="font-bold text-sm text-[#8E3E2F]">#{{ selectedOrderDetail.orderNumber }}</span>
              <Tag
                :value="selectedOrderDetail.status === 'completed' ? 'Hoàn thành' : 'Đã hủy'"
                :severity="selectedOrderDetail.status === 'completed' ? 'success' : 'danger'"
              />
            </div>
            <p class="text-gray-500 text-[11px]">Thời gian: {{ formatDate(selectedOrderDetail.orderDate) }}</p>
            <p class="text-gray-600 text-[11px]">Phương thức TT: <strong class="uppercase text-gray-800">{{ selectedOrderDetail.paymentMethod }}</strong></p>
          </div>
          <div class="text-right">
            <span class="text-gray-500 text-[11px] block">Tổng tiền đơn</span>
            <span class="text-lg font-bold text-[#326824] font-display">{{ formatCurrency(selectedOrderDetail.finalAmount) }}</span>
          </div>
        </div>

        <!-- Products List -->
        <div>
          <h4 class="font-bold text-gray-800 text-xs mb-2 flex items-center gap-1.5">
            <span class="material-symbols-outlined text-base text-[#8E3E2F]">format_list_bulleted</span>
            Danh sách sản phẩm bán ra ({{ selectedOrderDetail.items?.length || 0 }} món):
          </h4>

          <div class="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
            <div v-for="item in selectedOrderDetail.items" :key="item.id" class="p-3 flex items-center justify-between gap-3 hover:bg-gray-50">
              <div class="flex items-center gap-3">
                <img
                  :src="
                    item.product?.imageUrl ||
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuB5s3vZRGHW-l9un_Pku9yhvejdxLJD-OPfHm88Lc0T2AN7J6Os0hUMTGwyEIsYWrXV2BRsx0QeEy1vBfkKG4Mx8WSlQ00T_yhtFDukz-1LSmzY566Oum2kVS2Hl0b_ZQ_kOW0NbJx7c0MfdZkoGMZKdnW_Hsxp3GolG21jiq5uOA8-hVgLYaoRT3O1xtw1gEFUY3yB1jxBkPXnzvI-CFwBu3Ngx7OT8_SKrA4yzA_cYxiBBS5DM9aV'
                  "
                  class="w-10 h-10 object-cover rounded-lg border border-gray-200"
                />
                <div>
                  <h5 class="font-bold text-gray-800 text-xs">{{ item.product?.name || 'Sản phẩm' }}</h5>
                  <p class="text-[11px] text-gray-500">{{ item.quantity }} x {{ formatCurrency(item.unitPrice) }}</p>
                  <p v-if="item.note" class="text-[10px] text-[#8E3E2F] italic">Ghi chú: {{ item.note }}</p>
                </div>
              </div>
              <div class="text-right">
                <span class="font-bold text-gray-900 text-xs">{{ formatCurrency(item.subtotal) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Calculations -->
        <div class="p-3 bg-gray-50 rounded-xl space-y-1.5 text-gray-700">
          <div class="flex justify-between">
            <span>Tạm tính tiền hàng:</span>
            <span class="font-semibold">{{ formatCurrency(selectedOrderDetail.totalAmount) }}</span>
          </div>
          <div class="flex justify-between text-[#326824]" v-if="selectedOrderDetail.discountAmount > 0">
            <span>Mã giảm giá:</span>
            <span class="font-semibold">-{{ formatCurrency(selectedOrderDetail.discountAmount) }}</span>
          </div>
          <div class="flex justify-between font-bold text-sm text-gray-900 pt-1 border-t border-gray-200">
            <span>Tổng thanh toán thực tế:</span>
            <span class="text-[#326824]">{{ formatCurrency(selectedOrderDetail.finalAmount) }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex gap-2 w-full">
          <Button label="In hóa đơn" icon="pi pi-print" severity="info" outlined class="flex-1" @click="printReceipt(selectedOrderDetail!)" />
          <Button label="Đóng" severity="secondary" class="flex-1" @click="showOrderDetailModal = false" />
        </div>
      </template>
    </Dialog>

    <!-- Print Bill Modal -->
    <Dialog v-model:visible="showPrintModal" modal header="Hóa đơn thanh toán (Bill Preview)" :style="{ width: '380px' }">
      <div v-if="selectedPrintOrder" id="printable-receipt" class="p-4 bg-white border border-gray-200 rounded-lg text-xs space-y-3 font-mono text-gray-800">
        <div class="text-center space-y-1">
          <h2 class="text-base font-bold uppercase tracking-wider text-[#5D4037]">SKY COFFEE</h2>
          <p class="text-[11px] text-gray-500">ĐC: 123 Đường Cà Phê, TP. HCM</p>
          <p class="text-[11px] text-gray-500">Hotline: 0901.234.567</p>
          <div class="border-b border-dashed border-gray-400 my-2"></div>
          <h3 class="font-bold text-sm">HÓA ĐƠN BÁN HÀNG</h3>
          <p class="text-[11px]">Mã đơn: <strong>{{ selectedPrintOrder.orderNumber }}</strong></p>
          <p class="text-[10px] text-gray-500">{{ formatDate(selectedPrintOrder.orderDate) }}</p>
        </div>

        <div class="border-b border-dashed border-gray-400 my-2"></div>

        <div class="space-y-1.5">
          <div v-for="item in selectedPrintOrder.items" :key="item.id" class="flex justify-between items-start text-[11px]">
            <div>
              <p class="font-bold">{{ item.product?.name || 'Sản phẩm' }}</p>
              <p class="text-[10px] text-gray-500">{{ item.quantity }} x {{ formatCurrency(item.unitPrice) }}</p>
              <p v-if="item.note" class="text-[10px] italic text-gray-400">Ghi chú: {{ item.note }}</p>
            </div>
            <span class="font-bold">{{ formatCurrency(item.subtotal) }}</span>
          </div>
        </div>

        <div class="border-b border-dashed border-gray-400 my-2"></div>

        <div class="space-y-1 text-[11px]">
          <div class="flex justify-between">
            <span>Tạm tính:</span>
            <span>{{ formatCurrency(selectedPrintOrder.totalAmount) }}</span>
          </div>
          <div class="flex justify-between" v-if="selectedPrintOrder.discountAmount > 0">
            <span>Giảm giá:</span>
            <span>-{{ formatCurrency(selectedPrintOrder.discountAmount) }}</span>
          </div>
          <div class="flex justify-between font-bold text-xs pt-1 border-t border-gray-300">
            <span>TỔNG CỘNG:</span>
            <span>{{ formatCurrency(selectedPrintOrder.finalAmount) }}</span>
          </div>
          <div class="flex justify-between text-[10px] text-gray-500">
            <span>Hình thức TT:</span>
            <span class="uppercase">{{ selectedPrintOrder.paymentMethod }}</span>
          </div>
        </div>

        <div class="border-b border-dashed border-gray-400 my-2"></div>

        <div class="text-center text-[10px] text-gray-500 space-y-0.5">
          <p>Cảm ơn quý khách và hẹn gặp lại!</p>
          <p>Wifi: SkyCoffee / Pass: skycoffee2026</p>
        </div>
      </div>

      <template #footer>
        <div class="flex gap-2 w-full">
          <Button label="Đóng" severity="secondary" class="flex-1" @click="showPrintModal = false" />
          <Button label="In hóa đơn" icon="pi pi-print" severity="primary" class="flex-1" @click="triggerBrowserPrint" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<style scoped lang="scss" src="./Pos.scss"></style>
