import http from './http'

export interface RecipeItem {
  id?: number
  stockItemId: number | string
  ingredientName?: string
  amount: number
  unitCost?: number
  unit?: string
}

export interface ProductItem {
  id: string
  dbId: number
  name: string
  category: string
  categoryCode?: string
  price: string
  cost: string
  rawPrice: number
  rawCost: number
  margin: string
  status: string
  statusCode?: string
  img?: string
  unit?: string
  recipeItems?: RecipeItem[]
}

export interface FetchProductsResponse {
  items: ProductItem[]
  pagination: {
    page: number
    pageSize: number
    totalRecords: number
    totalPages: number
  }
}

export const fetchProducts = async (params?: any): Promise<FetchProductsResponse> => {
  try {
    const isSilent = params?.silent || false
    const response = await http.post('/api/products/search', params || {}, {
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
      }
    }
    return { items: [], pagination: { page: 1, pageSize: 10, totalRecords: 0, totalPages: 1 } }
  } catch (error) {
    console.error('Failed to fetch products from API:', error)
    return { items: [], pagination: { page: 1, pageSize: 10, totalRecords: 0, totalPages: 1 } }
  }
}

export const createProduct = async (payload: {
  code?: string
  name: string
  category: string
  sellingPrice: number
  costPrice?: number
  unit?: string
  status?: string
  imageUrl?: string
  recipeItems?: RecipeItem[]
}): Promise<any> => {
  const response = await http.post('/api/products', payload)
  return response.data
}

export const updateProduct = async (
  id: string | number,
  payload: {
    name?: string
    category?: string
    sellingPrice?: number
    costPrice?: number
    unit?: string
    status?: string
    imageUrl?: string
    recipeItems?: RecipeItem[]
  }
): Promise<any> => {
  const response = await http.put(`/api/products/${id}`, payload)
  return response.data
}

export const deleteProduct = async (id: string | number): Promise<any> => {
  const response = await http.delete(`/api/products/${id}`)
  return response.data
}
