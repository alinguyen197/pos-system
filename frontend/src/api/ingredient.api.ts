import http from './http'

export interface IngredientItem {
  id: string
  dbId: number
  name: string
  category: string
  categoryCode?: string
  stock: number
  minStock: number
  unit: string
  unitPrice: string
  rawCost: number
  status: string
  statusCode?: string
}

export interface PaginationData {
  page: number
  pageSize: number
  totalRecords: number
  totalPages: number
}

export interface StockSummaryData {
  total: number
  totalValue?: number
  safe: number
  needImport: number
  outOfStock: number
}

export interface FetchIngredientsResponse {
  items: IngredientItem[]
  pagination: PaginationData
  summary?: StockSummaryData
}

export const fetchIngredients = async (params?: any): Promise<FetchIngredientsResponse> => {
  try {
    const isSilent = params?.silent || false
    const response = await http.post('/api/ingredients/search', params || {}, {
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
    console.error('Failed to fetch ingredients from API:', error)
    return { items: [], pagination: { page: 1, pageSize: 10, totalRecords: 0, totalPages: 1 } }
  }
}

export const createIngredient = async (payload: {
  name: string
  category: string
  unit: string
  costPrice?: number
  minStock: number
  initialStock?: number
}): Promise<any> => {
  const response = await http.post('/api/ingredients', payload)
  return response.data
}

export const updateIngredient = async (
  id: string | number,
  payload: {
    name?: string
    category?: string
    unit?: string
    costPrice?: number
    minStock?: number
    stock?: number
  }
): Promise<any> => {
  const response = await http.put(`/api/ingredients/${id}`, payload)
  return response.data
}

export const deleteIngredient = async (id: string | number): Promise<any> => {
  const response = await http.delete(`/api/ingredients/${id}`)
  return response.data
}
