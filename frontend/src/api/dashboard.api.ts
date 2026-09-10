import http from './http'

export interface DashboardSummary {
  todayRevenue: number
  yesterdayRevenue: number
  revenueTrendText: string
  todayOrderCount: number
  orderTrendText: string
  todayCupsSold: number
  lowStockCount: number
}

export interface RevenueChartData {
  labels: string[]
  values: number[]
}

export interface CategoryRevenueData {
  labels: string[]
  values: number[]
  percentages: number[]
  totalRevenue: number
}

export interface TopProductItem {
  rank: number
  name: string
  category: string
  qty: number
  revenue: number
}

export interface LowStockAlertItem {
  id: number
  name: string
  stock: string
  min: string
  status: string
}

export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    const res = await http.get('/api/dashboard/summary', {
      headers: { 'x-silent-loading': 'true' },
    })
    return res.data?.data
  },

  getRevenueChart: async (params?: { period?: string; from?: string; to?: string }): Promise<RevenueChartData> => {
    const res = await http.get('/api/dashboard/revenue-chart', {
      params,
      headers: { 'x-silent-loading': 'true' },
    })
    return res.data?.data
  },

  getCategoryRevenue: async (): Promise<CategoryRevenueData> => {
    const res = await http.get('/api/dashboard/category-revenue', {
      headers: { 'x-silent-loading': 'true' },
    })
    return res.data?.data
  },

  getTopProducts: async (limit = 5): Promise<TopProductItem[]> => {
    const res = await http.get('/api/dashboard/top-products', {
      params: { limit },
      headers: { 'x-silent-loading': 'true' },
    })
    return res.data?.data || []
  },

  getLowStockAlerts: async (): Promise<LowStockAlertItem[]> => {
    const res = await http.get('/api/dashboard/low-stock-alerts', {
      headers: { 'x-silent-loading': 'true' },
    })
    return res.data?.data || []
  },
}
