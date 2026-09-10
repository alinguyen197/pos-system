import { ref, reactive } from 'vue'

export interface SortCondition {
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export interface PaginationState {
  page: number
  pageSize: number
  totalRecords: number
  totalPages: number
}

export function useListQuery<T = any>(
  apiFn: (params: any) => Promise<any>,
  defaultSort: SortCondition = { sortBy: 'id', sortOrder: 'asc' },
  defaultPageSize: number = 10
) {
  const items = ref<T[]>([])
  const pagination = reactive<PaginationState>({
    page: 1,
    pageSize: defaultPageSize,
    totalRecords: 0,
    totalPages: 1,
  })
  const sortConditions = ref<SortCondition[]>(defaultSort ? [defaultSort] : [])
  const loading = ref(false)

  const summary = ref<any>(null)

  const fetchList = async (searchConditions: any = {}, silent: boolean = false) => {
    loading.value = true
    try {
      const res = await apiFn({
        searchConditions,
        sortConditions: sortConditions.value,
        pagination: {
          page: pagination.page,
          pageSize: pagination.pageSize,
        },
        page: pagination.page,
        pageSize: pagination.pageSize,
        category: searchConditions.category,
        keyword: searchConditions.keyword,
        silent,
      })

      if (res && res.items) {
        items.value = res.items
        if (res.pagination) {
          Object.assign(pagination, res.pagination)
        }
        if (res.summary) {
          summary.value = res.summary
        }
      } else if (Array.isArray(res)) {
        // Fallback for array response
        items.value = res as unknown as T[]
        pagination.totalRecords = res.length
        pagination.totalPages = Math.ceil(res.length / pagination.pageSize) || 1
      }
    } catch (error) {
      console.error('Error fetching list query:', error)
      items.value = []
    } finally {
      loading.value = false
    }
  }

  const handleSort = (sortBy: string, searchConditions: any = {}) => {
    const current = sortConditions.value[0]
    let newOrder: 'asc' | 'desc' = 'asc'
    if (current && current.sortBy === sortBy) {
      newOrder = current.sortOrder === 'asc' ? 'desc' : 'asc'
    }
    sortConditions.value = [{ sortBy, sortOrder: newOrder }]
    pagination.page = 1 // Reset page on sort
    return fetchList(searchConditions)
  }

  const handlePageChange = (newPage: number, searchConditions: any = {}) => {
    pagination.page = newPage
    return fetchList(searchConditions)
  }

  const handlePageSizeChange = (newSize: number, searchConditions: any = {}) => {
    pagination.pageSize = newSize
    pagination.page = 1 // Reset page on pageSize change
    return fetchList(searchConditions)
  }

  return {
    items,
    pagination,
    summary,
    sortConditions,
    loading,
    fetchList,
    handleSort,
    handlePageChange,
    handlePageSizeChange,
  }
}
