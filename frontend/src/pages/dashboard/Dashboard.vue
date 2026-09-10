<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Chart from 'primevue/chart'
import { useRouter } from 'vue-router'
import { dashboardApi, LowStockAlertItem, TopProductItem } from '@/api/dashboard.api'

const router = useRouter()
const isLoading = ref(true)

const metrics = ref([
  { title: 'Doanh thu hôm nay', value: '0 ₫', trend: '0% so với hôm qua', icon: 'payments', isDanger: false, rawVal: 0 },
  { title: 'Số đơn hàng', value: '0', trend: '0 so với hôm qua', icon: 'receipt_long', isDanger: false, rawVal: 0 },
  { title: 'Số ly đã bán', value: '0', trend: 'Hôm nay', icon: 'local_cafe', isDanger: false, rawVal: 0 },
  { title: 'Tồn kho thấp', value: '0', trend: 'Nguyên liệu cần nhập', icon: 'warning', isDanger: false, rawVal: 0 },
])

const lineChartData = ref({
  labels: [] as string[],
  datasets: [
    {
      label: 'Doanh thu (VNĐ)',
      data: [] as number[],
      fill: true,
      borderColor: '#326824',
      backgroundColor: 'rgba(50, 104, 36, 0.12)',
      tension: 0.4,
      borderWidth: 3,
    },
  ],
})

const lineChartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: {
      grid: { color: 'rgba(0, 0, 0, 0.05)' },
      ticks: {
        callback: (value: any) => `${Number(value).toLocaleString('vi-VN')} ₫`,
      },
    },
    x: { grid: { display: false } },
  },
})

const doughnutData = ref({
  labels: [] as string[],
  datasets: [
    {
      data: [] as number[],
      backgroundColor: ['#8E3E2F', '#326824', '#d97706', '#72796c', '#0284c7', '#9333ea'],
      borderWidth: 2,
      borderColor: '#ffffff',
    },
  ],
})

const doughnutOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, font: { family: 'Inter', size: 12 } } },
  },
})

const topProducts = ref<TopProductItem[]>([])
const alertStockItems = ref<LowStockAlertItem[]>([])

const fetchDashboardData = async () => {
  isLoading.value = true
  try {
    const [summary, chart, category, top, alerts] = await Promise.all([
      dashboardApi.getSummary(),
      dashboardApi.getRevenueChart(),
      dashboardApi.getCategoryRevenue(),
      dashboardApi.getTopProducts(5),
      dashboardApi.getLowStockAlerts(),
    ])

    if (summary) {
      metrics.value[0].value = `${summary.todayRevenue.toLocaleString('vi-VN')} ₫`
      metrics.value[0].trend = summary.revenueTrendText
      metrics.value[0].isDanger = summary.revenueTrendText.includes('-')

      metrics.value[1].value = `${summary.todayOrderCount}`
      metrics.value[1].trend = summary.orderTrendText

      metrics.value[2].value = `${summary.todayCupsSold}`
      metrics.value[2].trend = 'Tổng số ly bán ra hôm nay'

      metrics.value[3].value = `${summary.lowStockCount}`
      metrics.value[3].isDanger = summary.lowStockCount > 0
      metrics.value[3].trend = summary.lowStockCount > 0 ? 'Cần bổ sung kho ngay' : 'Tồn kho ổn định'
    }

    if (chart && chart.labels) {
      lineChartData.value = {
        labels: chart.labels,
        datasets: [
          {
            label: 'Doanh thu (VNĐ)',
            data: chart.values,
            fill: true,
            borderColor: '#326824',
            backgroundColor: 'rgba(50, 104, 36, 0.12)',
            tension: 0.4,
            borderWidth: 3,
          },
        ],
      }
    }

    if (category && category.labels && category.labels.length > 0) {
      doughnutData.value = {
        labels: category.labels,
        datasets: [
          {
            data: category.values,
            backgroundColor: ['#8E3E2F', '#326824', '#d97706', '#72796c', '#0284c7', '#9333ea'].slice(0, category.labels.length),
            borderWidth: 2,
            borderColor: '#ffffff',
          },
        ],
      }
    }

    if (top) topProducts.value = top
    if (alerts) alertStockItems.value = alerts
  } catch (error) {
    console.error('Lỗi khi tải dữ liệu Dashboard:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<template>
  <div class="dashboard-page flex flex-col gap-6 pb-10">
    <!-- Header Banner -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2D7CC]">
      <div>
        <h1 class="text-2xl font-bold font-display text-[#1e1b1b]">Tổng quan cửa hàng</h1>
        <p class="text-xs text-[#42493d] mt-1 font-medium">Báo cáo tình hình kinh doanh & tồn kho thời gian thực</p>
      </div>
      <div class="flex items-center gap-3">
        <button
          @click="fetchDashboardData"
          class="w-10 h-10 bg-white hover:bg-[#F2ECE4] border border-[#c1c9b9]/60 rounded-xl transition text-[#5D4037] flex items-center justify-center cursor-pointer shadow-sm"
          title="Tải lại dữ liệu"
        >
          <span class="material-symbols-outlined text-lg" :class="{ 'animate-spin': isLoading }">refresh</span>
        </button>
        <button
          @click="router.push('/pos')"
          class="h-10 px-4 bg-[#8E3E2F] hover:bg-[#6E281C] text-white font-semibold text-xs rounded-xl shadow transition flex items-center gap-2 cursor-pointer"
        >
          <span class="material-symbols-outlined text-lg">point_of_sale</span>
          <span>Vào màn hình POS</span>
        </button>
        <button
          @click="router.push('/stock-imports/create')"
          class="h-10 px-4 bg-[#F2ECE4] hover:bg-[#E8DFD5] text-[#326824] font-semibold text-xs rounded-xl border border-[#c1c9b9]/60 transition flex items-center gap-2 cursor-pointer"
        >
          <span class="material-symbols-outlined text-lg">add_circle</span>
          <span>Tạo phiếu nhập kho</span>
        </button>
      </div>
    </div>

    <!-- Summary KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="(m, idx) in metrics"
        :key="idx"
        class="bg-white rounded-2xl p-5 border shadow-sm transition hover:shadow-md relative overflow-hidden group"
        :class="m.isDanger ? 'border-[#ffdad6] bg-[#F9F6F0]' : 'border-[#E2D7CC]'"
      >
        <div class="flex justify-between items-start mb-3">
          <span class="text-xs font-semibold uppercase tracking-wider text-[#42493d]">{{ m.title }}</span>
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center"
            :class="m.isDanger ? 'bg-[#ffdad6] text-[#ba1a1a]' : 'bg-[#c9edb5]/50 text-[#326824]'"
          >
            <span class="material-symbols-outlined text-xl">{{ m.icon }}</span>
          </div>
        </div>
        <div class="text-2xl font-bold font-display text-[#1e1b1b] mb-1.5">{{ m.value }}</div>
        <div
          class="text-xs font-semibold flex items-center gap-1"
          :class="m.isDanger ? 'text-[#ba1a1a]' : 'text-[#326824]'"
        >
          <span class="material-symbols-outlined text-sm">{{ m.isDanger ? 'error' : 'trending_up' }}</span>
          <span>{{ m.trend }}</span>
        </div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Line Chart -->
      <div class="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#E2D7CC] shadow-sm flex flex-col">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-base font-bold font-display text-[#1e1b1b]">Doanh thu 30 ngày gần nhất</h2>
          <span class="text-xs font-semibold text-[#8E3E2F] bg-[#F2ECE4] px-3 py-1 rounded-lg">Thời gian thực</span>
        </div>
        <div class="h-64 relative w-full flex items-center justify-center">
          <Chart v-if="lineChartData.labels.length > 0" type="line" :data="lineChartData" :options="lineChartOptions" class="h-full w-full" />
          <div v-else class="text-xs text-gray-400">Chưa có dữ liệu biểu đồ</div>
        </div>
      </div>

      <!-- Doughnut Chart -->
      <div class="bg-white rounded-2xl p-6 border border-[#E2D7CC] shadow-sm flex flex-col">
        <h2 class="text-base font-bold font-display text-[#1e1b1b] mb-4">Doanh thu theo danh mục</h2>
        <div class="h-64 relative w-full flex items-center justify-center">
          <Chart v-if="doughnutData.labels.length > 0" type="doughnut" :data="doughnutData" :options="doughnutOptions" class="h-full w-full" />
          <div v-else class="text-xs text-gray-400">Chưa có dữ liệu danh mục</div>
        </div>
      </div>
    </div>

    <!-- Tables Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Top Products -->
      <div class="bg-white rounded-2xl border border-[#E2D7CC] shadow-sm overflow-hidden flex flex-col">
        <div class="p-5 border-b border-[#E2D7CC] flex justify-between items-center bg-[#F2ECE4]/40">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[#8E3E2F] text-xl">star</span>
            <h2 class="text-base font-bold font-display text-[#1e1b1b]">Top sản phẩm bán chạy</h2>
          </div>
          <button @click="router.push('/products')" class="text-xs font-bold text-[#8E3E2F] hover:underline">Xem tất cả</button>
        </div>
        <div class="overflow-x-auto overflow-y-auto max-h-[380px]">
          <table class="w-full text-left text-xs text-[#1e1b1b]">
            <thead class="bg-[#F5EFE8] text-[#42493d] font-semibold uppercase tracking-wider border-b border-[#E2D7CC]">
              <tr>
                <th class="py-3 px-4 w-12 text-center">#</th>
                <th class="py-3 px-4">Tên sản phẩm</th>
                <th class="py-3 px-4 text-center">Số ly bán</th>
                <th class="py-3 px-4 text-right">Doanh thu</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#F2ECE4]">
              <tr v-for="item in topProducts" :key="item.rank" class="hover:bg-[#F5EFE8]/50 transition">
                <td class="py-3.5 px-4 font-bold text-center">
                  <span
                    class="w-6 h-6 rounded-full inline-flex items-center justify-center text-xs"
                    :class="item.rank === 1 ? 'bg-[#8E3E2F] text-white' : 'bg-[#E2D7CC] text-[#42493d]'"
                  >{{ item.rank }}</span>
                </td>
                <td class="py-3.5 px-4 font-semibold text-[#1e1b1b]">{{ item.name }}</td>
                <td class="py-3.5 px-4 text-center font-semibold text-[#326824]">{{ item.qty }} ly</td>
                <td class="py-3.5 px-4 text-right font-bold text-[#1e1b1b]">{{ item.revenue.toLocaleString('vi-VN') }} ₫</td>
              </tr>
              <tr v-if="topProducts.length === 0">
                <td colspan="4" class="py-6 text-center text-gray-400">Chưa có đơn hàng hoàn thành</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Low Stock Alerts -->
      <div class="bg-white rounded-2xl border border-[#ffdad6] shadow-sm overflow-hidden flex flex-col">
        <div class="p-5 border-b border-[#ffdad6] flex justify-between items-center bg-[#ffdad6]/20">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[#ba1a1a] text-xl">warning</span>
            <h2 class="text-base font-bold font-display text-[#ba1a1a]">⚠️ Cảnh báo tồn kho</h2>
          </div>
          <button @click="router.push('/stock-imports/create')" class="text-xs font-bold text-[#ba1a1a] hover:underline">Nhập kho ngay</button>
        </div>
        <div class="overflow-x-auto overflow-y-auto max-h-[380px]">
          <table class="w-full text-left text-xs text-[#1e1b1b]">
            <thead class="bg-[#ffdad6]/30 text-[#ba1a1a] font-semibold uppercase tracking-wider border-b border-[#ffdad6]">
              <tr>
                <th class="py-3 px-4">Tên nguyên liệu</th>
                <th class="py-3 px-4 text-center">Tồn hiện tại</th>
                <th class="py-3 px-4 text-center">Định mức min</th>
                <th class="py-3 px-4 text-right">Trạng thái</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#F2ECE4]">
              <tr v-for="(ing, i) in alertStockItems" :key="i" class="hover:bg-[#ffdad6]/10 transition">
                <td class="py-3.5 px-4 font-semibold text-[#1e1b1b]">{{ ing.name }}</td>
                <td class="py-3.5 px-4 text-center font-bold text-[#ba1a1a]">{{ ing.stock }}</td>
                <td class="py-3.5 px-4 text-center text-[#72796c]">{{ ing.min }}</td>
                <td class="py-3.5 px-4 text-right">
                  <span class="px-2.5 py-1 rounded-md bg-[#ffdad6] text-[#ba1a1a] font-bold text-[11px] inline-block">
                    {{ ing.status }}
                  </span>
                </td>
              </tr>
              <tr v-if="alertStockItems.length === 0">
                <td colspan="4" class="py-6 text-center text-emerald-600 font-semibold">Tất cả nguyên liệu kho đều an toàn 🟢</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./Dashboard.scss"></style>
