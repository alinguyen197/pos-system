import http from './http'

export const uploadFile = async <T>(
  url: string,
  file: File,
  extraData?: any,
): Promise<T> => {
  const formData = new FormData()
  formData.append('file', file)
  if (extraData) {
    Object.keys(extraData).forEach((key) =>
      formData.append(key, extraData[key]),
    )
  }

  const response = await http.post<T>(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}
