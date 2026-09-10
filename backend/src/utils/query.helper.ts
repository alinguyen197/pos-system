export interface SortCondition {
  sortBy: string
  sortOrder: 'asc' | 'desc' | 'ASC' | 'DESC'
}

export interface PaginationParams {
  page?: number
  pageSize?: number
}

export interface ListQueryParams {
  searchConditions?: any
  sortConditions?: SortCondition[]
  pagination?: PaginationParams
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: string
}

/**
 * Xây dựng options cho Sequelize findAndCountAll (offset, limit, order)
 */
export const buildListQuery = (params: ListQueryParams, defaultSortBy: string = 'id', defaultSortOrder: string = 'ASC') => {
  const page = Number(params.pagination?.page || params.page) || 1
  const pageSize = Number(params.pagination?.pageSize || params.pageSize) || 10

  const queryOptions: { offset: number; limit: number; order: Array<[string, string]> } = {
    offset: (page - 1) * pageSize,
    limit: pageSize,
    order: [],
  }

  // Sort conditions handling
  if (params.sortConditions && Array.isArray(params.sortConditions) && params.sortConditions.length > 0) {
    queryOptions.order = params.sortConditions.map((s) => [
      s.sortBy,
      (s.sortOrder || 'asc').toUpperCase(),
    ])
  } else if (params.sortBy) {
    queryOptions.order = [[params.sortBy, (params.sortOrder || 'asc').toUpperCase()]]
  } else {
    queryOptions.order = [[defaultSortBy, defaultSortOrder.toUpperCase()]]
  }

  return {
    queryOptions,
    page,
    pageSize,
  }
}

/**
 * Xây dựng response pagination envelope
 */
export const buildPaginationResponse = (totalRecords: number, page: number, pageSize: number) => {
  const totalPages = Math.ceil(totalRecords / pageSize) || 1
  return {
    page,
    pageSize,
    totalRecords,
    totalPages,
  }
}
