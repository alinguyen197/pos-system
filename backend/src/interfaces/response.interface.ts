export interface ApiResponse<T = any> {
  success: boolean
  statusCode: number
  code?: string
  message: string
  data?: T | null
  errors?: any
  meta?: Meta | null
}

export interface Error {
  type: string
  details?: any
}

export interface Meta {
  total?: number
  page?: number
  limit?: number
  [key: string]: any
}
