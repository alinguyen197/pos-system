import http from './http'

export interface StockImportItemPayload {
  ingredientId?: string | number
  dbId?: number
  id?: string | number
  ingredientName?: string
  name?: string
  category?: string
  unit?: string
  qty: number
  unitPrice: number
  totalAmount?: number
  note?: string
  isPackMode?: boolean
  packSize?: number
  packCount?: number
  packUnit?: string
}

export interface StockImportPayload {
  supplier?: string
  warehouse?: string
  importDate?: string
  note?: string
  items: StockImportItemPayload[]
}

export interface StockImportRecord {
  id: number
  importCode: string
  supplier: string
  warehouse: string
  importDate: string
  totalAmount: number
  totalAmountFormatted: string
  itemCount: number
  note?: string
  items?: StockImportItemPayload[]
  createdAt?: string
}

export interface StockImportSummaryData {
  totalImports: number
  totalSpend: number
  totalItemsImported: number
}

export interface FetchStockImportsResponse {
  items: StockImportRecord[]
  pagination: {
    page: number
    pageSize: number
    totalRecords: number
    totalPages: number
  }
  summary?: StockImportSummaryData
}

export const fetchStockImports = async (params?: any): Promise<FetchStockImportsResponse> => {
  try {
    const isSilent = params?.silent || false
    const response = await http.post('/api/stock-imports/search', params || {}, {
      headers: isSilent ? { 'x-silent-loading': 'true' } : {},
    })
    if (response.data && response.data.success && response.data.data) {
      const data = response.data.data
      if (Array.isArray(data)) {
        return {
          items: data,
          pagination: { page: 1, pageSize: data.length, totalRecords: data.length, totalPages: 1 },
        }
      }
      return {
        items: data.items || [],
        pagination: data.pagination || { page: 1, pageSize: 10, totalRecords: (data.items || []).length, totalPages: 1 },
        summary: data.summary,
      }
    }
    return { items: [], pagination: { page: 1, pageSize: 10, totalRecords: 0, totalPages: 1 } }
  } catch (error) {
    console.error('Failed to fetch stock imports from API:', error)
    return { items: [], pagination: { page: 1, pageSize: 10, totalRecords: 0, totalPages: 1 } }
  }
}

export const fetchStockImportById = async (id: string | number): Promise<any> => {
  const response = await http.get(`/api/stock-imports/${id}`)
  return response.data
}

export const createStockImport = async (payload: StockImportPayload): Promise<any> => {
  const response = await http.post('/api/stock-imports', payload)
  return response.data
}
