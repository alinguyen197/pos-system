<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Chart from 'primevue/chart'
import {
  reportApi,
  SalesReportSummary,
  DateSalesItem,
  PaymentMethodSalesItem,
  CategorySalesItem,
  ProductSalesItem,
  StaffSalesItem,
} from '@/api/report.api'

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

const activeTab = ref<'date' | 'category' | 'product' | 'payment' | 'staff' | 'cashflow'>('date')
const isLoading = ref(false)
const isExporting = ref(false)
const productSearchKeyword = ref('')

const summary = ref<SalesReportSummary>({
  period: 'this_month',
  fromDate: '',
  toDate: '',
  orderCount: 0,
  totalItemsCount: 0,
  totalRevenue: 0,
  totalDiscount: 0,
  totalCost: 0,
  grossProfit: 0,
  marginPercent: 0,
  avgOrderValue: 0,
})

const dateSales = ref<DateSalesItem[]>([])
const paymentSales = ref<PaymentMethodSalesItem[]>([])
const categorySales = ref<CategorySalesItem[]>([])
const productSales = ref<ProductSalesItem[]>([])
const staffSales = ref<StaffSalesItem[]>([])

// State cho Tab "Dòng tiền & Lợi nhuận Ròng"
const cashflowReport = ref<any>({
  totalRevenue: 0,
  totalStockCost: 0,
  totalOtherExpenses: 0,
  totalExpenditures: 0,
  netProfit: 0,
  isProfitable: true,
  profitMargin: 0,
  categoryBreakdown: [],
  dailyCashflow: [],
})

const cashflowChartData = ref({
  labels: [] as string[],
  datasets: [
    {
      label: 'Doanh thu (Thu)',
      data: [] as number[],
      backgroundColor: '#326824',
      borderRadius: 6,
    },
    {
      label: 'Tổng Chi phí (Chi)',
      data: [] as number[],
      backgroundColor: '#ba1a1a',
      borderRadius: 6,
    },
    {
      label: 'Tiền lời ròng',
      data: [] as number[],
      backgroundColor: '#0284c7',
      borderRadius: 6,
    },
  ],
})

const cashflowChartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 10, font: { family: 'Inter', size: 12 } } },
  },
  scales: {
    y: {
      grid: { color: 'rgba(0, 0, 0, 0.05)' },
      ticks: { callback: (val: any) => `${Number(val).toLocaleString('vi-VN')} ₫` },
    },
    x: { grid: { display: false } },
  },
})

// Chart data cho Tab "Chi tiết theo Ngày"
const dateChartData = ref({
  labels: [] as string[],
  datasets: [
    {
      label: 'Doanh thu theo ngày (VNĐ)',
      data: [] as number[],
      fill: true,
      borderColor: '#8E3E2F',
      backgroundColor: 'rgba(141, 103, 73, 0.12)',
      tension: 0.35,
      borderWidth: 3,
    },
  ],
})

const dateChartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: {
      grid: { color: 'rgba(0, 0, 0, 0.05)' },
      ticks: { callback: (val: any) => `${Number(val).toLocaleString('vi-VN')} ₫` },
    },
    x: { grid: { display: false } },
  },
})

// Chart data cho Tab "Phương thức thanh toán"
const paymentChartData = ref({
  labels: [] as string[],
  datasets: [
    {
      data: [] as number[],
      backgroundColor: ['#326824', '#8E3E2F', '#0284c7', '#d97706'],
      borderWidth: 2,
      borderColor: '#ffffff',
    },
  ],
})

const paymentChartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'right', labels: { usePointStyle: true, boxWidth: 10, font: { family: 'Inter', size: 12 } } },
  },
})

const fetchReportData = async () => {
  isLoading.value = true
  try {
    const params: { period?: string; from?: string; to?: string } = { period: selectedPeriod.value }
    if (selectedPeriod.value === 'custom') {
      params.from = customFromDate.value
      params.to = customToDate.value
    }

    const [summaryRes, dateRes, paymentRes, categoryRes, productRes, staffRes, cashflowRes] = await Promise.all([
      reportApi.getSalesSummary(params),
      reportApi.getSalesByDate(params),
      reportApi.getSalesByPaymentMethod(params),
      reportApi.getSalesByCategory(params),
      reportApi.getSalesByProduct(params),
      reportApi.getSalesByStaff(params),
      reportApi.getCashflowReport(params),
    ])

    if (summaryRes) summary.value = summaryRes
    if (cashflowRes) {
      cashflowReport.value = cashflowRes
      if (cashflowRes.dailyCashflow && cashflowRes.dailyCashflow.length > 0) {
        const sortedChrono = [...cashflowRes.dailyCashflow].sort((a, b) => a.date.localeCompare(b.date))
        const labels = sortedChrono.map((item: any) => {
          const parts = item.date.split('-')
          return `${parts[2]}/${parts[1]}`
        })
        cashflowChartData.value = {
          labels,
          datasets: [
            {
              label: 'Doanh thu (Thu)',
              data: sortedChrono.map((i: any) => i.revenue),
              backgroundColor: '#326824',
              borderRadius: 6,
            },
            {
              label: 'Tổng Chi phí (Chi)',
              data: sortedChrono.map((i: any) => i.totalCost),
              backgroundColor: '#ba1a1a',
              borderRadius: 6,
            },
            {
              label: 'Tiền lời ròng',
              data: sortedChrono.map((i: any) => i.netProfit),
              backgroundColor: '#0284c7',
              borderRadius: 6,
            },
          ],
        }
      }
    }
    if (dateRes) {
      dateSales.value = dateRes
      // Update date chart (vẽ theo thời gian từ cũ tới mới)
      const sortedChrono = [...dateRes].sort((a, b) => a.date.localeCompare(b.date))
      const labels = sortedChrono.map((item) => {
        const parts = item.date.split('-')
        return `${parts[2]}/${parts[1]}`
      })
      const values = sortedChrono.map((item) => item.revenue)
      dateChartData.value = {
        labels,
        datasets: [
          {
            label: 'Doanh thu theo ngày (VNĐ)',
            data: values,
            fill: true,
            borderColor: '#8E3E2F',
            backgroundColor: 'rgba(141, 103, 73, 0.12)',
            tension: 0.35,
            borderWidth: 3,
          },
        ],
      }
    }
    if (paymentRes) {
      paymentSales.value = paymentRes
      paymentChartData.value = {
        labels: paymentRes.map((item) => item.methodName),
        datasets: [
          {
            data: paymentRes.map((item) => item.revenue),
            backgroundColor: ['#326824', '#8E3E2F', '#0284c7', '#d97706'].slice(0, paymentRes.length),
            borderWidth: 2,
            borderColor: '#ffffff',
          },
        ],
      }
    }
    if (categoryRes) categorySales.value = categoryRes
    if (productRes) productSales.value = productRes
    if (staffRes) staffSales.value = staffRes
  } catch (error) {
    console.error('Lỗi khi tải báo cáo bán hàng:', error)
  } finally {
    isLoading.value = false
  }
}

const handleExport = async () => {
  isExporting.value = true
  try {
    const params: { period?: string; from?: string; to?: string } = { period: selectedPeriod.value }
    if (selectedPeriod.value === 'custom') {
      params.from = customFromDate.value
      params.to = customToDate.value
    }
    const blob = await reportApi.exportSalesReport(params)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `bao_cao_doanh_so_${selectedPeriod.value}_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Lỗi khi xuất file báo cáo:', error)
  } finally {
    isExporting.value = false
  }
}

const handleExportCashflow = async () => {
  isExporting.value = true
  try {
    const params: { period?: string; from?: string; to?: string } = { period: selectedPeriod.value }
    if (selectedPeriod.value === 'custom') {
      params.from = customFromDate.value
      params.to = customToDate.value
    }
    const blob = await reportApi.exportCashflowReport(params)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `bao_cao_dong_tien_${selectedPeriod.value}_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Lỗi khi xuất file báo cáo dòng tiền:', error)
  } finally {
    isExporting.value = false
  }
}

const filteredProducts = () => {
  if (!productSearchKeyword.value.trim()) return productSales.value
  const kw = productSearchKeyword.value.toLowerCase()
  return productSales.value.filter((p) => p.name.toLowerCase().includes(kw) || p.code.toLowerCase().includes(kw) || p.category.toLowerCase().includes(kw))
}

watch(selectedPeriod, (val) => {
  if (val === 'custom') {
    isCustomMode.value = true
    const today = new Date().toISOString().split('T')[0]
    if (!customFromDate.value) customFromDate.value = today
    if (!customToDate.value) customToDate.value = today
  } else {
    isCustomMode.value = false
    fetchReportData()
  }
})

onMounted(() => {
  fetchReportData()
})
</script>

<template>
  <div class="sales-report-page flex flex-col gap-6">
    <!-- Action Header Banner -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-[#E2D7CC]">
      <div>
        <h1 class="text-2xl font-bold font-display text-[#1e1b1b]">Báo cáo Bán hàng & Doanh số</h1>
        <p class="text-xs text-[#42493d] mt-1 font-medium">Phân tích chi tiết doanh thu theo ngày, danh mục, sản phẩm, và hình thức thanh toán</p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <button
          @click="fetchReportData"
          class="w-10 h-10 bg-white hover:bg-[#F2ECE4] border border-[#c1c9b9]/60 rounded-xl transition text-[#5D4037] flex items-center justify-center cursor-pointer shadow-sm"
          title="Tải lại báo cáo"
        >
          <span class="material-symbols-outlined text-lg" :class="{ 'animate-spin': isLoading }">refresh</span>
        </button>

        <!-- Quick Period Selection Pills -->
        <div class="flex items-center bg-[#F2ECE4] h-10 px-1 rounded-xl border border-[#c1c9b9]/40 gap-1">
          <button
            v-for="p in periods"
            :key="p.value"
            @click="selectedPeriod = p.value"
            class="h-8 px-3.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center"
            :class="selectedPeriod === p.value ? 'bg-[#8E3E2F] text-white shadow-sm' : 'text-[#42493d] hover:bg-white/60'"
          >
            {{ p.label }}
          </button>
        </div>

        <!-- Custom Date Range Inputs -->
        <div v-if="isCustomMode" class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <input
            type="date"
            v-model="customFromDate"
            class="h-10 px-3 text-xs bg-white border border-[#c1c9b9]/70 rounded-xl outline-none font-medium text-[#1e1b1b] focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20"
          />
          <span class="text-xs text-[#72796c] font-semibold">đến</span>
          <input
            type="date"
            v-model="customToDate"
            class="h-10 px-3 text-xs bg-white border border-[#c1c9b9]/70 rounded-xl outline-none font-medium text-[#1e1b1b] focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20"
          />
          <button
            @click="fetchReportData"
            class="h-10 px-4 bg-[#8E3E2F] hover:bg-[#6E281C] text-white text-xs font-semibold rounded-xl transition cursor-pointer flex items-center justify-center shadow-sm"
          >
            Áp dụng
          </button>
        </div>

        <button
          @click="handleExport"
          :disabled="isExporting"
          class="h-10 px-4 bg-[#8E3E2F] hover:bg-[#6E281C] text-white font-semibold text-xs rounded-xl shadow transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <span class="material-symbols-outlined text-lg" :class="{ 'animate-spin': isExporting }">download</span>
          <span>{{ isExporting ? 'Đang xuất...' : 'Xuất báo cáo CSV' }}</span>
        </button>
      </div>
    </div>

    <!-- Enhanced KPI Cards Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Card 1: Total Revenue -->
      <div class="bg-white rounded-2xl p-5 border border-[#E2D7CC] shadow-sm flex flex-col justify-between">
        <div class="flex justify-between items-center">
          <span class="text-xs font-semibold text-[#72796c] uppercase tracking-wider">Tổng Doanh thu</span>
          <span class="material-symbols-outlined text-[#8E3E2F] text-xl">payments</span>
        </div>
        <div class="text-2xl font-bold font-display text-[#1e1b1b] mt-2">{{ summary.totalRevenue.toLocaleString('vi-VN') }} ₫</div>
        <span class="text-[11px] text-[#326824] font-bold mt-1">Tổng {{ summary.orderCount }} đơn hàng hoàn thành</span>
      </div>

      <!-- Card 2: Average Order Value (AOV) -->
      <div class="bg-white rounded-2xl p-5 border border-[#E2D7CC] shadow-sm flex flex-col justify-between">
        <div class="flex justify-between items-center">
          <span class="text-xs font-semibold text-[#72796c] uppercase tracking-wider">Giá trị đơn TB (AOV)</span>
          <span class="material-symbols-outlined text-[#0284c7] text-xl">shopping_cart</span>
        </div>
        <div class="text-2xl font-bold font-display text-[#0284c7] mt-2">{{ summary.avgOrderValue.toLocaleString('vi-VN') }} ₫</div>
        <span class="text-[11px] text-[#0284c7] font-bold mt-1">Tổng {{ summary.totalItemsCount.toLocaleString('vi-VN') }} phần bán ra</span>
      </div>

      <!-- Card 3: Ingredient BOM Cost -->
      <div class="bg-white rounded-2xl p-5 border border-[#E2D7CC] shadow-sm flex flex-col justify-between">
        <div class="flex justify-between items-center">
          <span class="text-xs font-semibold text-[#72796c] uppercase tracking-wider">Chi phí Nguyên liệu (BOM)</span>
          <span class="material-symbols-outlined text-[#ba1a1a] text-xl">inventory_2</span>
        </div>
        <div class="text-2xl font-bold font-display text-[#ba1a1a] mt-2">{{ summary.totalCost.toLocaleString('vi-VN') }} ₫</div>
        <span class="text-[11px] text-[#72796c] font-medium mt-1">Ước tính theo định lượng công thức (BOM)</span>
      </div>

      <!-- Card 4: Gross Profit & Margin -->
      <div class="bg-white rounded-2xl p-5 border border-[#E2D7CC] shadow-sm flex flex-col justify-between">
        <div class="flex justify-between items-center">
          <span class="text-xs font-semibold text-[#72796c] uppercase tracking-wider">Tổng Lợi nhuận gộp</span>
          <span class="material-symbols-outlined text-[#326824] text-xl">trending_up</span>
        </div>
        <div class="text-2xl font-bold font-display text-[#326824] mt-2">{{ summary.grossProfit.toLocaleString('vi-VN') }} ₫</div>
        <span class="text-[11px] text-[#326824] font-bold mt-1">Tỷ lệ lãi gộp: {{ summary.marginPercent }}%</span>
      </div>
    </div>

    <!-- Main Content Container with Tabs -->
    <div class="bg-white rounded-2xl border border-[#E2D7CC] shadow-sm overflow-hidden flex flex-col">
      <!-- Tabs Bar -->
      <div class="p-4 border-b border-[#E2D7CC] flex flex-wrap items-center justify-between gap-3 bg-[#F9F6F0]">
        <div class="flex flex-wrap items-center gap-2">
          <button
            @click="activeTab = 'date'"
            class="px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            :class="activeTab === 'date' ? 'bg-[#8E3E2F] text-white shadow' : 'bg-white text-[#42493d] border border-[#E2D7CC] hover:bg-[#F2ECE4]'"
          >
            <span class="material-symbols-outlined text-base">calendar_month</span>
            <span>📅 Chi tiết theo Ngày</span>
          </button>
          <button
            @click="activeTab = 'category'"
            class="px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            :class="activeTab === 'category' ? 'bg-[#8E3E2F] text-white shadow' : 'bg-white text-[#42493d] border border-[#E2D7CC] hover:bg-[#F2ECE4]'"
          >
            <span class="material-symbols-outlined text-base">lunch_dining</span>
            <span>🍱 Theo Danh mục</span>
          </button>
          <button
            @click="activeTab = 'product'"
            class="px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            :class="activeTab === 'product' ? 'bg-[#8E3E2F] text-white shadow' : 'bg-white text-[#42493d] border border-[#E2D7CC] hover:bg-[#F2ECE4]'"
          >
            <span class="material-symbols-outlined text-base">ramen_dining</span>
            <span>🍜 Theo Món ăn</span>
          </button>
          <button
            @click="activeTab = 'payment'"
            class="px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            :class="activeTab === 'payment' ? 'bg-[#8E3E2F] text-white shadow' : 'bg-white text-[#42493d] border border-[#E2D7CC] hover:bg-[#F2ECE4]'"
          >
            <span class="material-symbols-outlined text-base">credit_card</span>
            <span>💳 PTTT</span>
          </button>
          <button
            @click="activeTab = 'staff'"
            class="px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            :class="activeTab === 'staff' ? 'bg-[#8E3E2F] text-white shadow' : 'bg-white text-[#42493d] border border-[#E2D7CC] hover:bg-[#F2ECE4]'"
          >
            <span class="material-symbols-outlined text-base">badge</span>
            <span>👤 Theo Nhân viên</span>
          </button>
          <button
            @click="activeTab = 'cashflow'"
            class="px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            :class="activeTab === 'cashflow' ? 'bg-[#8E3E2F] text-white shadow' : 'bg-white text-[#42493d] border border-[#E2D7CC] hover:bg-[#F2ECE4]'"
          >
            <span class="material-symbols-outlined text-base">account_balance_wallet</span>
            <span>💸 Dòng tiền & Lợi nhuận Ròng</span>
          </button>
        </div>

        <div class="flex items-center gap-2">
          <button
            v-if="activeTab === 'cashflow'"
            @click="handleExportCashflow"
            :disabled="isExporting"
            class="h-8 px-3 bg-[#326824] hover:bg-[#25521a] text-white font-semibold text-xs rounded-lg shadow transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <span class="material-symbols-outlined text-base">download</span>
            <span>Xuất Dòng tiền CSV</span>
          </button>
          <span class="text-xs font-semibold text-[#326824] bg-[#c9edb5]/40 px-3 py-1 rounded-lg">
            Kỳ: {{ summary.fromDate }} đến {{ summary.toDate }}
          </span>
        </div>
      </div>

      <!-- TAB 1: Chi tiết theo Ngày (Bảng + Biểu đồ xu hướng) -->
      <div v-if="activeTab === 'date'" class="p-6 flex flex-col gap-6">
        <!-- Revenue Trend Line Chart -->
        <div class="p-4 bg-[#F5EFE8]/40 border border-[#E2D7CC] rounded-xl flex flex-col">
          <div class="flex justify-between items-center mb-3">
            <h3 class="text-sm font-bold font-display text-[#1e1b1b] flex items-center gap-2">
              <span class="material-symbols-outlined text-[#8E3E2F] text-lg">show_chart</span>
              <span>Biểu đồ xu hướng doanh thu theo ngày</span>
            </h3>
            <span class="text-xs font-semibold text-gray-500">{{ dateSales.length }} ngày ghi nhận</span>
          </div>
          <div class="h-56 relative w-full flex items-center justify-center">
            <Chart v-if="dateSales.length > 0" type="line" :data="dateChartData" :options="dateChartOptions" class="h-full w-full" />
            <div v-else class="text-xs text-gray-400">Chưa có dữ liệu bán hàng trong khoảng thời gian này</div>
          </div>
        </div>

        <!-- DataTable by Date -->
        <DataTable
          :value="dateSales"
          tableStyle="min-width: 50rem"
          responsiveLayout="scroll"
          paginator
          :rows="10"
          :rowsPerPageOptions="[10, 20, 31]"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Hiển thị {first} đến {last} trong tổng số {totalRecords} ngày"
        >
          <Column field="date" header="Ngày bán" sortable>
            <template #body="slotProps">
              <div class="flex flex-col">
                <span class="font-bold text-[#1e1b1b]">{{ slotProps.data.date }}</span>
                <span class="text-[11px] text-gray-500 font-semibold">{{ slotProps.data.dayOfWeek }}</span>
              </div>
            </template>
          </Column>

          <Column field="orderCount" header="Số đơn" bodyClass="text-center" headerClass="text-center" sortable>
            <template #body="slotProps">
              <span class="font-semibold text-gray-700">{{ slotProps.data.orderCount }} đơn</span>
            </template>
          </Column>

          <Column field="itemsCount" header="Số phần bán" bodyClass="text-center" headerClass="text-center" sortable>
            <template #body="slotProps">
              <span class="font-bold text-[#326824]">{{ slotProps.data.itemsCount }} phần</span>
            </template>
          </Column>

          <Column field="revenue" header="Doanh thu" bodyClass="text-right" headerClass="text-right" sortable>
            <template #body="slotProps">
              <span class="font-bold text-[#1e1b1b]">{{ slotProps.data.revenue.toLocaleString('vi-VN') }} ₫</span>
            </template>
          </Column>

          <Column field="cost" header="Chi phí vốn (BOM)" bodyClass="text-right" headerClass="text-right" sortable>
            <template #body="slotProps">
              <span class="text-[#ba1a1a] font-semibold">{{ slotProps.data.cost.toLocaleString('vi-VN') }} ₫</span>
            </template>
          </Column>

          <Column field="profit" header="Lợi nhuận gộp" bodyClass="text-right" headerClass="text-right" sortable>
            <template #body="slotProps">
              <span class="font-bold text-[#326824]">{{ slotProps.data.profit.toLocaleString('vi-VN') }} ₫</span>
            </template>
          </Column>

          <Column field="margin" header="% Lãi gộp" bodyClass="text-center" headerClass="text-center" sortable>
            <template #body="slotProps">
              <span class="px-2.5 py-1 rounded-md bg-[#c9edb5]/60 text-[#326824] font-bold text-[11px] inline-block">
                {{ slotProps.data.margin }}
              </span>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- TAB 2: Theo Danh mục -->
      <div v-else-if="activeTab === 'category'" class="p-6 flex flex-col gap-6">
        <DataTable
          :value="categorySales"
          tableStyle="min-width: 50rem"
          responsiveLayout="scroll"
          paginator
          :rows="10"
          :rowsPerPageOptions="[5, 10, 20]"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Hiển thị {first} đến {last} trong tổng số {totalRecords} danh mục"
        >
          <Column field="category" header="Danh mục sản phẩm" sortable>
            <template #body="slotProps">
              <span class="font-bold text-[#1e1b1b]">{{ slotProps.data.category }}</span>
            </template>
          </Column>

          <Column field="quantity" header="Số lượng bán" bodyClass="text-center" headerClass="text-center" sortable>
            <template #body="slotProps">
              <span class="font-bold text-[#326824]">{{ slotProps.data.quantity.toLocaleString('vi-VN') }} phần</span>
            </template>
          </Column>

          <Column field="revenue" header="Tổng doanh thu" bodyClass="text-right" headerClass="text-right" sortable>
            <template #body="slotProps">
              <span class="font-bold text-[#1e1b1b]">{{ slotProps.data.revenue.toLocaleString('vi-VN') }} ₫</span>
            </template>
          </Column>

          <Column field="cost" header="Chi phí giá vốn" bodyClass="text-right" headerClass="text-right" sortable>
            <template #body="slotProps">
              <span class="text-[#ba1a1a] font-semibold">{{ slotProps.data.cost.toLocaleString('vi-VN') }} ₫</span>
            </template>
          </Column>

          <Column field="profit" header="Lợi nhuận gộp" bodyClass="text-right" headerClass="text-right" sortable>
            <template #body="slotProps">
              <span class="font-bold text-[#326824]">{{ slotProps.data.profit.toLocaleString('vi-VN') }} ₫</span>
            </template>
          </Column>

          <Column field="margin" header="% Lãi gộp" bodyClass="text-center" headerClass="text-center" sortable>
            <template #body="slotProps">
              <span class="px-2.5 py-1 rounded-md bg-[#c9edb5]/60 text-[#326824] font-bold text-[11px] inline-block">
                {{ slotProps.data.margin }}
              </span>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- TAB 3: Theo Sản phẩm (kèm ô tìm kiếm) -->
      <div v-else-if="activeTab === 'product'" class="p-6 flex flex-col gap-4">
        <div class="flex items-center justify-between gap-4 pb-2">
          <div class="relative max-w-xs w-full">
            <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#72796c] text-xl">search</span>
            <input
              type="text"
              v-model="productSearchKeyword"
              placeholder="Tìm kiếm sản phẩm theo tên, mã..."
              class="w-full h-10 pl-11 pr-4 text-xs bg-white border border-[#c1c9b9]/70 rounded-xl outline-none focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20 transition font-medium text-[#1e1b1b]"
            />
          </div>
          <span class="text-xs text-gray-500 font-semibold">Tìm thấy {{ filteredProducts().length }} món</span>
        </div>

        <DataTable
          :value="filteredProducts()"
          tableStyle="min-width: 50rem"
          responsiveLayout="scroll"
          paginator
          :rows="10"
          :rowsPerPageOptions="[10, 20, 50]"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Hiển thị {first} đến {last} trong tổng số {totalRecords} sản phẩm"
        >
          <Column field="code" header="Mã SP" bodyClass="font-mono text-xs" sortable>
            <template #body="slotProps">
              <span class="font-bold text-[#8E3E2F]">{{ slotProps.data.code }}</span>
            </template>
          </Column>

          <Column field="name" header="Tên sản phẩm" sortable>
            <template #body="slotProps">
              <span class="font-semibold text-[#1e1b1b]">{{ slotProps.data.name }}</span>
            </template>
          </Column>

          <Column field="category" header="Danh mục" sortable>
            <template #body="slotProps">
              <span class="text-xs text-gray-600 font-medium">{{ slotProps.data.category }}</span>
            </template>
          </Column>

          <Column field="quantity" header="Số lượng bán" bodyClass="text-center" headerClass="text-center" sortable>
            <template #body="slotProps">
              <span class="font-bold text-[#326824]">{{ slotProps.data.quantity.toLocaleString('vi-VN') }} {{ slotProps.data.unit }}</span>
            </template>
          </Column>

          <Column field="revenue" header="Doanh thu" bodyClass="text-right" headerClass="text-right" sortable>
            <template #body="slotProps">
              <span class="font-bold text-[#1e1b1b]">{{ slotProps.data.revenue.toLocaleString('vi-VN') }} ₫</span>
            </template>
          </Column>

          <Column field="cost" header="Chi phí vốn" bodyClass="text-right" headerClass="text-right" sortable>
            <template #body="slotProps">
              <span class="text-[#ba1a1a] font-semibold">{{ slotProps.data.cost.toLocaleString('vi-VN') }} ₫</span>
            </template>
          </Column>

          <Column field="profit" header="Lợi nhuận" bodyClass="text-right" headerClass="text-right" sortable>
            <template #body="slotProps">
              <span class="font-bold text-[#326824]">{{ slotProps.data.profit.toLocaleString('vi-VN') }} ₫</span>
            </template>
          </Column>

          <Column field="margin" header="% Lãi gộp" bodyClass="text-center" headerClass="text-center" sortable>
            <template #body="slotProps">
              <span class="px-2.5 py-1 rounded-md bg-[#c9edb5]/60 text-[#326824] font-bold text-[11px] inline-block">
                {{ slotProps.data.margin }}
              </span>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- TAB 4: Phương thức Thanh toán -->
      <div v-else-if="activeTab === 'payment'" class="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="p-5 border border-[#E2D7CC] rounded-xl flex flex-col justify-between">
          <h3 class="text-sm font-bold font-display text-[#1e1b1b] mb-4">Tỷ trọng doanh thu theo Phương thức thanh toán</h3>
          <div class="h-64 relative w-full flex items-center justify-center">
            <Chart v-if="paymentSales.length > 0" type="doughnut" :data="paymentChartData" :options="paymentChartOptions" class="h-full w-full" />
            <div v-else class="text-xs text-gray-400">Chưa có dữ liệu thanh toán</div>
          </div>
        </div>

        <div class="flex flex-col">
          <DataTable :value="paymentSales" tableStyle="min-width: 25rem" responsiveLayout="scroll">
            <Column field="methodName" header="Hình thức thanh toán">
              <template #body="slotProps">
                <span class="font-bold text-[#1e1b1b]">{{ slotProps.data.methodName }}</span>
              </template>
            </Column>
            <Column field="orderCount" header="Số đơn" bodyClass="text-center" headerClass="text-center">
              <template #body="slotProps">
                <span class="font-semibold text-gray-700">{{ slotProps.data.orderCount }} đơn</span>
              </template>
            </Column>
            <Column field="revenue" header="Doanh thu" bodyClass="text-right" headerClass="text-right">
              <template #body="slotProps">
                <span class="font-bold text-[#326824]">{{ slotProps.data.revenue.toLocaleString('vi-VN') }} ₫</span>
              </template>
            </Column>
            <Column field="percentage" header="Tỷ trọng %" bodyClass="text-center" headerClass="text-center">
              <template #body="slotProps">
                <span class="px-2 py-0.5 rounded bg-[#F2ECE4] text-[#5D4037] font-bold text-xs">
                  {{ slotProps.data.percentage }}%
                </span>
              </template>
            </Column>
          </DataTable>
        </div>
      </div>

      <!-- TAB 5: Theo Nhân viên -->
      <div v-else-if="activeTab === 'staff'" class="p-6 flex flex-col gap-6">
        <DataTable
          :value="staffSales"
          tableStyle="min-width: 40rem"
          responsiveLayout="scroll"
          paginator
          :rows="10"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
          currentPageReportTemplate="Hiển thị {first} đến {last} trong tổng số {totalRecords} nhân viên"
        >
          <Column field="staffName" header="Họ tên nhân viên" sortable>
            <template #body="slotProps">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[#8E3E2F]">account_circle</span>
                <span class="font-bold text-[#1e1b1b]">{{ slotProps.data.staffName }}</span>
              </div>
            </template>
          </Column>

          <Column field="role" header="Vai trò" bodyClass="text-center" headerClass="text-center">
            <template #body="slotProps">
              <span class="px-2.5 py-1 rounded-md bg-[#F2ECE4] text-[#5D4037] font-semibold text-xs uppercase">
                {{ slotProps.data.role }}
              </span>
            </template>
          </Column>

          <Column field="orderCount" header="Số đơn hàng tạo" bodyClass="text-center" headerClass="text-center" sortable>
            <template #body="slotProps">
              <span class="font-bold text-[#326824]">{{ slotProps.data.orderCount }} đơn</span>
            </template>
          </Column>

          <Column field="revenue" header="Tổng doanh thu tạo" bodyClass="text-right" headerClass="text-right" sortable>
            <template #body="slotProps">
              <span class="font-bold text-[#1e1b1b]">{{ slotProps.data.revenue.toLocaleString('vi-VN') }} ₫</span>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- TAB 6: Dòng tiền & Lợi nhuận Ròng Thực tế -->
      <div v-else-if="activeTab === 'cashflow'" class="p-6 flex flex-col gap-6">
        <!-- Cashflow Financial Overview Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div class="p-4 bg-[#F5EFE8]/40 border border-[#E2D7CC] rounded-xl flex flex-col justify-between">
            <span class="text-[11px] font-semibold text-[#72796c] uppercase">Tổng Thu Bán Hàng</span>
            <span class="text-xl font-bold font-display text-[#326824] mt-1">{{ (cashflowReport.totalRevenue || 0).toLocaleString('vi-VN') }} ₫</span>
            <span class="text-[10px] text-[#326824] font-medium mt-1">Doanh thu POS</span>
          </div>

          <div class="p-4 bg-[#F5EFE8]/40 border border-[#E2D7CC] rounded-xl flex flex-col justify-between">
            <span class="text-[11px] font-semibold text-[#72796c] uppercase">Chi Nhập Kho NVL</span>
            <span class="text-xl font-bold font-display text-[#8E3E2F] mt-1">{{ (cashflowReport.totalStockCost || 0).toLocaleString('vi-VN') }} ₫</span>
            <span class="text-[10px] text-[#72796c] font-medium mt-1">Chi phí nguyên vật liệu</span>
          </div>

          <div class="p-4 bg-[#F5EFE8]/40 border border-[#E2D7CC] rounded-xl flex flex-col justify-between">
            <span class="text-[11px] font-semibold text-[#72796c] uppercase">Chi Phí Vận Hành & CSVC</span>
            <span class="text-xl font-bold font-display text-[#ba1a1a] mt-1">{{ (cashflowReport.totalOtherExpenses || 0).toLocaleString('vi-VN') }} ₫</span>
            <span class="text-[10px] text-[#ba1a1a] font-medium mt-1">Tái đầu tư, điện, nước, lương...</span>
          </div>

          <div
            class="p-4 border rounded-xl flex flex-col justify-between"
            :class="cashflowReport.isProfitable ? 'bg-[#f0fdf4] border-[#c9edb5]' : 'bg-[#fff1f2] border-[#ffdad6]'"
          >
            <span class="text-[11px] font-bold text-[#1e1b1b] uppercase">Tiền Lời Ròng (Còn lại)</span>
            <span
              class="text-xl font-black font-display mt-1"
              :class="cashflowReport.isProfitable ? 'text-[#326824]' : 'text-[#ba1a1a]'"
            >
              {{ (cashflowReport.netProfit || 0).toLocaleString('vi-VN') }} ₫
            </span>
            <span class="text-[10px] font-bold" :class="cashflowReport.isProfitable ? 'text-[#326824]' : 'text-[#ba1a1a]'">
              {{ cashflowReport.isProfitable ? '🟢 DÒNG TIỀN DƯ' : '🔴 THÂM HỤT' }}
            </span>
          </div>

          <div class="p-4 bg-[#F5EFE8]/40 border border-[#E2D7CC] rounded-xl flex flex-col justify-between">
            <span class="text-[11px] font-semibold text-[#72796c] uppercase">Tỷ Suất Lợi Nhuận</span>
            <span class="text-xl font-bold font-display text-[#0284c7] mt-1">{{ cashflowReport.profitMargin || 0 }}%</span>
            <span class="text-[10px] text-[#72796c] font-medium mt-1">Tổng Chi: {{ (cashflowReport.totalExpenditures || 0).toLocaleString('vi-VN') }} ₫</span>
          </div>
        </div>

        <!-- Cashflow Comparison Chart -->
        <div class="p-4 bg-[#F5EFE8]/40 border border-[#E2D7CC] rounded-xl flex flex-col">
          <div class="flex justify-between items-center mb-3">
            <h3 class="text-sm font-bold font-display text-[#1e1b1b] flex items-center gap-2">
              <span class="material-symbols-outlined text-[#326824] text-lg">compare_arrows</span>
              <span>So sánh Dòng tiền Thu vs Chi vs Tiền lời ròng</span>
            </h3>
            <span class="text-xs font-semibold text-gray-500">{{ (cashflowReport.dailyCashflow || []).length }} ngày ghi nhận</span>
          </div>
          <div class="h-64 relative w-full flex items-center justify-center">
            <Chart
              v-if="cashflowReport.dailyCashflow && cashflowReport.dailyCashflow.length > 0"
              type="bar"
              :data="cashflowChartData"
              :options="cashflowChartOptions"
              class="h-full w-full"
            />
            <div v-else class="text-xs text-gray-400">Chưa có dữ liệu dòng tiền trong khoảng thời gian này</div>
          </div>
        </div>

        <!-- Category Expenses Breakdown -->
        <div v-if="cashflowReport.categoryBreakdown && cashflowReport.categoryBreakdown.length > 0" class="p-4 border border-[#E2D7CC] rounded-xl bg-white">
          <h3 class="text-sm font-bold font-display text-[#1e1b1b] mb-3 flex items-center gap-2">
            <span class="material-symbols-outlined text-[#8E3E2F]">pie_chart</span>
            <span>Cơ cấu các nhóm chi phí phát sinh</span>
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <div
              v-for="cat in cashflowReport.categoryBreakdown"
              :key="cat.category"
              class="p-3 rounded-lg border border-[#E2D7CC] bg-[#F9F6F0] flex flex-col justify-between"
            >
              <div class="flex justify-between items-center text-xs">
                <span class="font-bold text-[#1e1b1b]">{{ cat.categoryName }}</span>
                <span class="font-bold text-[#8E3E2F]">{{ cat.percentage }}%</span>
              </div>
              <div class="text-sm font-bold text-[#ba1a1a] mt-1">{{ (cat.amount || 0).toLocaleString('vi-VN') }} ₫</div>
            </div>
          </div>
        </div>

        <!-- Daily Cashflow DataTable -->
        <DataTable
          :value="cashflowReport.dailyCashflow || []"
          tableStyle="min-width: 50rem"
          responsiveLayout="scroll"
          paginator
          :rows="10"
          :rowsPerPageOptions="[10, 20, 31]"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Hiển thị {first} đến {last} trong tổng số {totalRecords} ngày"
        >
          <Column field="date" header="Ngày" sortable>
            <template #body="slotProps">
              <div class="flex flex-col">
                <span class="font-bold text-[#1e1b1b]">{{ slotProps.data.date }}</span>
                <span class="text-[11px] text-gray-500 font-semibold">{{ slotProps.data.dayOfWeek }}</span>
              </div>
            </template>
          </Column>

          <Column field="revenue" header="Doanh thu (Thu)" bodyClass="text-right" headerClass="text-right" sortable>
            <template #body="slotProps">
              <span class="font-bold text-[#326824]">{{ (slotProps.data.revenue || 0).toLocaleString('vi-VN') }} ₫</span>
            </template>
          </Column>

          <Column field="stockCost" header="Chi Nhập Kho" bodyClass="text-right" headerClass="text-right" sortable>
            <template #body="slotProps">
              <span class="font-semibold text-[#8E3E2F]">{{ (slotProps.data.stockCost || 0).toLocaleString('vi-VN') }} ₫</span>
            </template>
          </Column>

          <Column field="otherExpenses" header="Chi Phí Khác" bodyClass="text-right" headerClass="text-right" sortable>
            <template #body="slotProps">
              <span class="font-semibold text-[#ba1a1a]">{{ (slotProps.data.otherExpenses || 0).toLocaleString('vi-VN') }} ₫</span>
            </template>
          </Column>

          <Column field="totalCost" header="Tổng Chi" bodyClass="text-right" headerClass="text-right" sortable>
            <template #body="slotProps">
              <span class="font-bold text-[#ba1a1a]">{{ (slotProps.data.totalCost || 0).toLocaleString('vi-VN') }} ₫</span>
            </template>
          </Column>

          <Column field="netProfit" header="Tiền Lời Ròng" bodyClass="text-right" headerClass="text-right" sortable>
            <template #body="slotProps">
              <span
                class="font-bold font-mono"
                :class="slotProps.data.netProfit >= 0 ? 'text-[#326824]' : 'text-[#ba1a1a]'"
              >
                {{ (slotProps.data.netProfit || 0).toLocaleString('vi-VN') }} ₫
              </span>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./SalesReport.scss"></style>
