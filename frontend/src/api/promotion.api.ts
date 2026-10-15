import http from './http'

export interface Promotion {
  id: number
  code: string
  name: string
  description?: string
  discountType: 'PERCENT' | 'FIXED_AMOUNT'
  discountValue: number
  minOrderAmount: number
  maxDiscountAmount?: number | null
  startDate: string
  endDate: string
  usageLimit?: number | null
  usedCount: number
  status: 'active' | 'inactive' | 'expired'
  createdBy?: number
  creator?: {
    id: number
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

export interface CreatePromotionPayload {
  code: string
  name: string
  description?: string
  discountType: 'PERCENT' | 'FIXED_AMOUNT'
  discountValue: number
  minOrderAmount?: number
  maxDiscountAmount?: number | null
  startDate: string
  endDate: string
  usageLimit?: number | null
  status?: 'active' | 'inactive'
}

export interface ValidatePromotionPayload {
  code: string
  subtotal: number
}

export interface ValidatePromotionResult {
  valid: boolean
  promotionId: number
  code: string
  name: string
  description?: string
  discountType: 'PERCENT' | 'FIXED_AMOUNT'
  discountValue: number
  minOrderAmount: number
  maxDiscountAmount?: number | null
  discountAmount: number
  finalAmount: number
  message: string
}

export interface PromotionListResponse {
  items: Promotion[]
  pagination: {
    page: number
    pageSize: number
    totalRecords: number
    totalPages: number
  }
  kpi: {
    totalActive: number
    totalUpcoming: number
    totalExpired: number
    totalCampaigns: number
    totalDiscountProvided: number
  }
}

export const fetchPromotions = async (
  params?: any,
): Promise<PromotionListResponse> => {
  try {
    const response = await http.get('/api/promotions', { params })
    if (response.data && response.data.success && response.data.data) {
      return {
        items: response.data.data.items || [],
        pagination: response.data.data.pagination || {
          page: 1,
          pageSize: 10,
          totalRecords: 0,
          totalPages: 1,
        },
        kpi: response.data.data.kpi || {
          totalActive: 0,
          totalUpcoming: 0,
          totalExpired: 0,
          totalCampaigns: 0,
          totalDiscountProvided: 0,
        },
      }
    }
    return {
      items: [],
      pagination: { page: 1, pageSize: 10, totalRecords: 0, totalPages: 1 },
      kpi: {
        totalActive: 0,
        totalUpcoming: 0,
        totalExpired: 0,
        totalCampaigns: 0,
        totalDiscountProvided: 0,
      },
    }
  } catch (error) {
    console.error('Error fetching promotions:', error)
    return {
      items: [],
      pagination: { page: 1, pageSize: 10, totalRecords: 0, totalPages: 1 },
      kpi: {
        totalActive: 0,
        totalUpcoming: 0,
        totalExpired: 0,
        totalCampaigns: 0,
        totalDiscountProvided: 0,
      },
    }
  }
}

export const fetchPromotionById = async (
  id: number | string,
): Promise<Promotion | null> => {
  try {
    const response = await http.get(`/api/promotions/${id}`)
    if (response.data && response.data.success) {
      return response.data.data
    }
    return null
  } catch (error) {
    console.error('Error fetching promotion by id:', error)
    return null
  }
}

export const createPromotion = async (
  payload: CreatePromotionPayload,
): Promise<any> => {
  const response = await http.post('/api/promotions', payload)
  return response.data
}

export const updatePromotion = async (
  id: number | string,
  payload: Partial<CreatePromotionPayload>,
): Promise<any> => {
  const response = await http.put(`/api/promotions/${id}`, payload)
  return response.data
}

export const togglePromotionStatus = async (
  id: number | string,
): Promise<any> => {
  const response = await http.patch(`/api/promotions/${id}/status`)
  return response.data
}

export const deletePromotion = async (id: number | string): Promise<any> => {
  const response = await http.delete(`/api/promotions/${id}`)
  return response.data
}

export const fetchActivePromotions = async (): Promise<Promotion[]> => {
  try {
    const response = await http.get('/api/promotions/active-list')
    if (response.data && response.data.success && response.data.data) {
      return response.data.data
    }
    return []
  } catch (error) {
    console.error('Error fetching active promotions:', error)
    return []
  }
}

export const validatePromotion = async (
  payload: ValidatePromotionPayload,
): Promise<ValidatePromotionResult> => {
  const response = await http.post('/api/promotions/validate', payload)
  if (response.data && response.data.success && response.data.data) {
    return response.data.data
  }
  throw new Error(response.data?.message || 'Mã giảm giá không hợp lệ')
}
