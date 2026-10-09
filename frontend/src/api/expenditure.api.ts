import http from './http'

export interface ExpenditurePayload {
  category: string
  title: string
  amount: number
  expenseDate?: string
  paymentMethod?: string
  recipient?: string
  imageUrl?: string
  note?: string
}

export interface ExpenditureRecord {
  id: number
  expenseCode: string
  category: string
  title: string
  amount: number
  expenseDate: string
  paymentMethod: string
  recipient?: string
  imageUrl?: string
  note?: string
  createdBy?: number
  creator?: {
    id: number
    name: string
    email: string
    role: string
  }
  createdAt?: string
  updatedAt?: string
}

export interface ExpenditureSummaryData {
  period: string
  fromDate: string
  toDate: string
  totalRevenue: number
  totalStockImportCost: number
  totalOtherExpenses: number
  totalExpenditures: number
  netProfit: number
  isProfitable: boolean
  expenseToRevenueRatio: number
  expenditureCount: number
  categoryBreakdown: Array<{
    category: string
    categoryName: string
    amount: number
    percentage: number
  }>
}

export interface FetchExpendituresResponse {
  items: ExpenditureRecord[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export const fetchExpenditures = async (
  params?: any,
): Promise<FetchExpendituresResponse> => {
  try {
    const isSilent = params?.silent || false
    const response = await http.post(
      '/api/expenditures/search',
      params || {},
      {
        headers: isSilent ? { 'x-silent-loading': 'true' } : {},
      },
    )
    if (response.data && response.data.success && response.data.data) {
      const data = response.data.data
      return {
        items: data.items || [],
        pagination: data.pagination || {
          page: 1,
          limit: 20,
          total: (data.items || []).length,
          totalPages: 1,
        },
      }
    }
    return {
      items: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
    }
  } catch (error) {
    console.error('Failed to fetch expenditures from API:', error)
    return {
      items: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
    }
  }
}

export const fetchExpenditureSummary = async (
  params?: any,
): Promise<ExpenditureSummaryData> => {
  const response = await http.get('/api/expenditures/summary', { params })
  return response.data?.data
}

export const fetchExpenditureById = async (
  id: string | number,
): Promise<ExpenditureRecord> => {
  const response = await http.get(`/api/expenditures/${id}`)
  return response.data?.data
}

export const createExpenditure = async (
  payload: ExpenditurePayload,
): Promise<any> => {
  const response = await http.post('/api/expenditures', payload)
  return response.data
}

export const updateExpenditure = async (
  id: string | number,
  payload: Partial<ExpenditurePayload>,
): Promise<any> => {
  const response = await http.put(`/api/expenditures/${id}`, payload)
  return response.data
}

export const deleteExpenditure = async (id: string | number): Promise<any> => {
  const response = await http.delete(`/api/expenditures/${id}`)
  return response.data
}
