import http from './http'

export const get = async <T>(url: string, params?: any): Promise<T> => {
  const response = await http.get<T>(url, { params })
  return response.data
}

export const post = async <T>(url: string, body?: any): Promise<T> => {
  const response = await http.post<T>(url, body)
  return response.data
}

export const put = async <T>(url: string, body?: any): Promise<T> => {
  const response = await http.put<T>(url, body)
  return response.data
}

export const del = async <T>(url: string, params?: any): Promise<T> => {
  const response = await http.delete<T>(url, { params })
  return response.data
}

export * from './dashboard.api'
export * from './report.api'

