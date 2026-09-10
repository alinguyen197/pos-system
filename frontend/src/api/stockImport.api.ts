import http from './http'

export interface StockImportItemPayload {
  ingredientId?: string | number
  dbId?: number
  id?: string | number
  unit?: string
  qty: number
  unitPrice: number
  totalAmount?: number
  note?: string
}

export interface StockImportPayload {
  supplier?: string
  warehouse?: string
  importDate?: string
  note?: string
  items: StockImportItemPayload[]
}

export const createStockImport = async (payload: StockImportPayload): Promise<any> => {
  const response = await http.post('/api/stock-imports', payload)
  return response.data
}
