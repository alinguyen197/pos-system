import http from './http'

export interface SalesReportSummary {
  period: string
  fromDate: string
  toDate: string
  orderCount: number
  totalItemsCount: number
  totalRevenue: number
  totalDiscount: number
  totalCost: number
  grossProfit: number
  marginPercent: number
  avgOrderValue: number
}

export interface DateSalesItem {
  date: string
  dayOfWeek: string
  orderCount: number
  itemsCount: number
  revenue: number
  cost: number
  profit: number
  margin: string
  marginNum: number
}

export interface PaymentMethodSalesItem {
  method: string
  methodName: string
  orderCount: number
  revenue: number
  percentage: number
}

export interface CategorySalesItem {
  category: string
  quantity: number
  revenue: number
  cost: number
  profit: number
  margin: string
  marginNum: number
}

export interface ProductSalesItem {
  code: string
  name: string
  category: string
  unit: string
  quantity: number
  revenue: number
  cost: number
  profit: number
  margin: string
}

export interface StaffSalesItem {
  staffId: number
  staffName: string
  role: string
  orderCount: number
  revenue: number
}

export const reportApi = {
  getSalesSummary: async (params?: { period?: string; from?: string; to?: string }): Promise<SalesReportSummary> => {
    const res = await http.get('/api/reports/sales', { params })
    return res.data?.data
  },

  getSalesByDate: async (params?: { period?: string; from?: string; to?: string }): Promise<DateSalesItem[]> => {
    const res = await http.get('/api/reports/sales/by-date', { params })
    return res.data?.data || []
  },

  getSalesByPaymentMethod: async (params?: { period?: string; from?: string; to?: string }): Promise<PaymentMethodSalesItem[]> => {
    const res = await http.get('/api/reports/sales/by-payment-method', { params })
    return res.data?.data || []
  },

  getSalesByCategory: async (params?: { period?: string; from?: string; to?: string }): Promise<CategorySalesItem[]> => {
    const res = await http.get('/api/reports/sales/by-category', { params })
    return res.data?.data || []
  },

  getSalesByProduct: async (params?: { period?: string; from?: string; to?: string }): Promise<ProductSalesItem[]> => {
    const res = await http.get('/api/reports/sales/by-product', { params })
    return res.data?.data || []
  },

  getSalesByStaff: async (params?: { period?: string; from?: string; to?: string }): Promise<StaffSalesItem[]> => {
    const res = await http.get('/api/reports/sales/by-staff', { params })
    return res.data?.data || []
  },

  exportSalesReport: async (params?: { period?: string; from?: string; to?: string }): Promise<Blob> => {
    const res = await http.get('/api/reports/sales/export', {
      params,
      responseType: 'blob',
    })
    return res.data
  },
}
