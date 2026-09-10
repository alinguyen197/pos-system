import http from './http'

export const uploadImage = async (imagePayload: { image: string; fileName?: string }): Promise<string> => {
  try {
    const response = await http.post('/api/upload', imagePayload)
    if (response.data && response.data.success && response.data.data?.url) {
      return response.data.data.url
    }
    return imagePayload.image
  } catch (error) {
    console.error('Error uploading image to server:', error)
    return imagePayload.image
  }
}
