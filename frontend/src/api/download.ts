import http from './http'

export const downloadFile = async (
  url: string,
  params?: any,
  filename?: string,
) => {
  const response = await http.get<Blob>(url, {
    params,
    responseType: 'blob',
  })

  // tạo link download
  const blob = new Blob([response.data])
  const link = document.createElement('a')
  link.href = window.URL.createObjectURL(blob)
  link.download = filename || 'file'
  link.click()
  window.URL.revokeObjectURL(link.href)
}
