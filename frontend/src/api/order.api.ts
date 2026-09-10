import http from './http'

export interface CreateOrderItemPayload {
  productId?: number | string
  code?: string
  quantity: number
  unitPrice?: number
  note?: string
}

export interface CreateOrderPayload {
  items: CreateOrderItemPayload[]
  paymentMethod?: string
  discountAmount?: number
  note?: string
  createdBy?: number
}

export interface OrderItem {
  id: number
  orderId: number
  productId: number
  quantity: number
  unitPrice: number
  subtotal: number
  note?: string
  product?: {
    id: number
    code: string
    name: string
    imageUrl?: string
  }
}

export interface Order {
  id: number
  orderNumber: string
  orderDate: string
  status: string
  totalAmount: number
  discountAmount: number
  finalAmount: number
  paymentMethod: string
  note?: string
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

export interface ShiftSummary {
  shiftCode?: string
  shiftName?: string
  startTime?: string
  endTime?: string
  shiftRevenue: number
  totalOrders: number
  totalCupsSold: number
  cashRevenue?: number
  transferRevenue?: number
  cardRevenue?: number
  totalDiscount?: number
}

export const fetchOrders = async (params?: any): Promise<{ items: Order[]; pagination: any }> => {
  try {
    const response = await http.get('/api/orders', { params })
    if (response.data && response.data.success && response.data.data) {
      return {
        items: response.data.data.items || [],
        pagination: response.data.data.pagination || { page: 1, pageSize: 20, totalRecords: 0, totalPages: 1 },
      }
    }
    return { items: [], pagination: { page: 1, pageSize: 20, totalRecords: 0, totalPages: 1 } }
  } catch (error) {
    console.error('Error fetching orders:', error)
    return { items: [], pagination: { page: 1, pageSize: 20, totalRecords: 0, totalPages: 1 } }
  }
}

export const fetchOrderById = async (id: number | string): Promise<Order | null> => {
  try {
    const response = await http.get(`/api/orders/${id}`)
    if (response.data && response.data.success) {
      return response.data.data
    }
    return null
  } catch (error) {
    console.error('Error fetching order by id:', error)
    return null
  }
}

export const createOrder = async (payload: CreateOrderPayload): Promise<any> => {
  const response = await http.post('/api/orders', payload)
  return response.data
}

export const updateOrderStatus = async (id: number | string, status: string): Promise<any> => {
  const response = await http.put(`/api/orders/${id}`, { status })
  return response.data
}

export const deleteOrder = async (id: number | string): Promise<any> => {
  const response = await http.delete(`/api/orders/${id}`)
  return response.data
}

export const fetchShiftSummary = async (isSilent = false, afterTime?: string, createdBy?: number | string): Promise<ShiftSummary> => {
  try {
    const params: any = {}
    if (afterTime) params.afterTime = afterTime
    if (createdBy) params.createdBy = createdBy
    const response = await http.get('/api/orders/summary', {
      params,
      headers: isSilent ? { 'x-silent-loading': 'true' } : {},
    })
    if (response.data && response.data.success && response.data.data) {
      return response.data.data
    }
    return { shiftRevenue: 0, totalOrders: 0, totalCupsSold: 0 }
  } catch (error) {
    console.error('Error fetching shift summary:', error)
    return { shiftRevenue: 0, totalOrders: 0, totalCupsSold: 0 }
  }
}

export const getOrderQr = async (id: number | string): Promise<any> => {
  try {
    const response = await http.get(`/api/orders/${id}/qr`)
    if (response.data && response.data.success) {
      return response.data.data
    }
    return null
  } catch (error) {
    console.error('Error fetching order QR:', error)
    return null
  }
}
