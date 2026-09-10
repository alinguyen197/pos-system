import http from './http'

export interface MasterCodeItem {
  id: number
  groupCategory: string
  code: string
  label: string
  sortOrder: number
}

export const fetchMasterCodes = async (groupCategory?: string): Promise<MasterCodeItem[]> => {
  try {
    const response = await http.get('/api/master-codes', {
      params: { category: groupCategory },
    })
    if (response.data && response.data.success) {
      return response.data.data
    }
    return []
  } catch (error) {
    console.error('Failed to fetch master codes from API:', error)
    return []
  }
}
