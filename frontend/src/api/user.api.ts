import { http } from './http'

export interface UserItem {
  id: number
  name: string
  email: string
  role: string
  status: string
  avatarUrl?: string
  createdAt?: string
  updatedAt?: string
}

export interface UserListParams {
  page?: number
  limit?: number
  search?: string
  role?: string
}

export interface UserListResponse {
  items: UserItem[]
  meta?: {
    totalItems: number
    itemCount: number
    itemsPerPage: number
    totalPages: number
    currentPage: number
  }
}

export const userApi = {
  getUsers: async (params?: UserListParams): Promise<UserListResponse> => {
    const res: any = await http.get('/api/user', { params })
    const responseData = res?.data || res || {}
    const items = Array.isArray(responseData.data)
      ? responseData.data
      : Array.isArray(responseData)
      ? responseData
      : []
    const meta = responseData.meta || {
      totalItems: items.length,
      itemCount: items.length,
      itemsPerPage: 10,
      totalPages: 1,
      currentPage: 1,
    }

    return { items, meta }
  },

  getUserById: async (id: number): Promise<UserItem> => {
    const res: any = await http.get(`/api/user/${id}`)
    const data = res?.data?.data || res?.data || res
    return data
  },

  createUser: async (payload: {
    name: string
    email: string
    password?: string
    role?: string
    status?: string
    avatarUrl?: string
  }): Promise<UserItem> => {
    const res: any = await http.post('/api/user', payload)
    const data = res?.data?.data || res?.data || res
    return data
  },

  updateUser: async (
    id: number,
    payload: {
      name?: string
      email?: string
      password?: string
      role?: string
      status?: string
      avatarUrl?: string
    }
  ): Promise<UserItem> => {
    const res: any = await http.put(`/api/user/${id}`, payload)
    const data = res?.data?.data || res?.data || res
    return data
  },

  deleteUser: async (id: number): Promise<void> => {
    await http.delete(`/api/user/${id}`)
  },

  toggleUserStatus: async (id: number): Promise<{ id: number; status: string }> => {
    const res: any = await http.patch(`/api/user/${id}/status`)
    const data = res?.data?.data || res?.data || res
    return data
  },
}
