import db from '../models'
import { parseError, buildListQuery, buildPaginationResponse } from '../utils'

export interface StockImportItemPayload {
  ingredientId?: string | number
  dbId?: number
  id?: string | number
  ingredientName?: string
  name?: string
  category?: string
  unit?: string
  qty: number
  unitPrice?: number
  totalAmount?: number
  note?: string
  // Pack mode info if used
  isPackMode?: boolean
  packSize?: number
  packCount?: number
  packUnit?: string
}

export interface StockImportPayload {
  supplier?: string
  warehouse?: string
  importDate?: string
  note?: string
  items: StockImportItemPayload[]
  createdBy?: number
}

const ensureStockImportTable = async () => {
  try {
    await db.StockImport.sync()
  } catch (err) {
    console.warn('⚠️ Error ensuring stock_imports table:', err)
  }
}

const createStockImport = async (payload: StockImportPayload) => {
  try {
    await ensureStockImportTable()

    const { items } = payload
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Danh sách nguyên liệu nhập không được rỗng')
    }

    const updatedItems = []
    const detailedItemsData: any[] = []
    let totalImportAmount = 0

    for (const item of items) {
      const targetId = item.dbId || item.ingredientId || item.id
      let stockItem = null

      if (targetId) {
        stockItem = await db.StockItem.findOne({
          where: { id: Number(targetId) || 0, isDeleted: false },
        })
        if (!stockItem && typeof targetId === 'string') {
          stockItem = await db.StockItem.findOne({
            where: { code: targetId, isDeleted: false },
          })
        }
      }

      const ingName =
        item.ingredientName ||
        item.name ||
        (stockItem ? stockItem.name : 'Nguyên liệu')
      const ingUnit = item.unit || (stockItem ? stockItem.unit : 'kg')
      const addQty = Math.round((Number(item.qty) || 0) * 100) / 100
      const unitPrice =
        Math.round(
          (Number(item.unitPrice) ||
            (stockItem ? stockItem.costPerUnit : 0) ||
            0) * 100
        ) / 100
      const lineTotal = item.totalAmount
        ? Math.round(Number(item.totalAmount) * 100) / 100
        : Math.round(addQty * unitPrice * 100) / 100
      totalImportAmount += lineTotal

      detailedItemsData.push({
        ingredientId: stockItem ? stockItem.id : targetId,
        ingredientCode: stockItem ? stockItem.code : undefined,
        ingredientName: ingName,
        category: stockItem ? stockItem.category : item.category,
        qty: addQty,
        unit: ingUnit,
        unitPrice,
        totalAmount: lineTotal,
        note: item.note || '',
        isPackMode: item.isPackMode || false,
        packSize: item.packSize,
        packCount: item.packCount,
        packUnit: item.packUnit,
      })

      if (stockItem) {
        const newQuantity =
          Math.round((Number(stockItem.quantity || 0) + addQty) * 100) / 100
        const updateFields: any = { quantity: newQuantity }

        if (unitPrice > 0) {
          updateFields.costPerUnit = unitPrice
        }

        await stockItem.update(updateFields)
        updatedItems.push(stockItem)
      }
    }

    // Generate Import Code (e.g. PNK-003)
    const maxImport = await db.StockImport.findOne({ order: [['id', 'DESC']] })
    const nextNum = (maxImport ? maxImport.id : 0) + 1
    const importCode = `PNK-${String(nextNum).padStart(3, '0')}`

    const newStockImport = await db.StockImport.create({
      importCode,
      supplier: payload.supplier?.trim() || 'Nhà cung cấp lẻ',
      warehouse: payload.warehouse?.trim() || 'Kho tổng',
      importDate: payload.importDate
        ? new Date(payload.importDate)
        : new Date(),
      totalAmount: Math.round(totalImportAmount * 100) / 100,
      itemCount: detailedItemsData.length,
      note: payload.note || '',
      createdBy: payload.createdBy || null,
      itemsData: detailedItemsData,
      isDeleted: false,
    })

    return {
      success: true,
      importRecord: newStockImport,
      importCode,
      updatedCount: updatedItems.length,
      totalAmount: totalImportAmount,
      supplier: payload.supplier,
      importDate: payload.importDate,
    }
  } catch (error) {
    throw parseError(error)
  }
}

const getStockImports = async (queryParamsOrBody: any = {}) => {
  try {
    await ensureStockImportTable()

    const searchConditions = queryParamsOrBody.searchConditions || {
      keyword:
        queryParamsOrBody.keyword ||
        queryParamsOrBody.search ||
        queryParamsOrBody.q,
      warehouse: queryParamsOrBody.warehouse,
      supplier: queryParamsOrBody.supplier,
      fromDate: queryParamsOrBody.fromDate,
      toDate: queryParamsOrBody.toDate,
    }

    const sortConditions = queryParamsOrBody.sortConditions || []
    const pagination = queryParamsOrBody.pagination || {
      page: queryParamsOrBody.page,
      pageSize: queryParamsOrBody.pageSize,
    }

    const { queryOptions, page, pageSize } = buildListQuery(
      {
        sortConditions,
        pagination,
        sortBy: queryParamsOrBody.sortBy || 'id',
        sortOrder: queryParamsOrBody.sortOrder || 'DESC',
      },
      'id',
      'DESC'
    )

    const whereCondition: any = { isDeleted: false }

    const rawKeyword = searchConditions.keyword || ''
    const keyword = String(rawKeyword).trim()
    if (keyword) {
      const searchPattern = `%${keyword}%`
      whereCondition[db.Op.or] = [
        { importCode: { [db.Op.iLike || db.Op.like]: searchPattern } },
        { supplier: { [db.Op.iLike || db.Op.like]: searchPattern } },
        { warehouse: { [db.Op.iLike || db.Op.like]: searchPattern } },
        { note: { [db.Op.iLike || db.Op.like]: searchPattern } },
      ]
    }

    if (
      searchConditions.warehouse &&
      searchConditions.warehouse !== 'all' &&
      searchConditions.warehouse !== 'Tất cả'
    ) {
      whereCondition.warehouse = searchConditions.warehouse
    }

    if (searchConditions.fromDate || searchConditions.toDate) {
      whereCondition.importDate = {}
      if (searchConditions.fromDate) {
        whereCondition.importDate[db.Op.gte] = new Date(
          searchConditions.fromDate
        )
      }
      if (searchConditions.toDate) {
        const endDay = new Date(searchConditions.toDate)
        endDay.setHours(23, 59, 59, 999)
        whereCondition.importDate[db.Op.lte] = endDay
      }
    }

    const { count, rows } = await db.StockImport.findAndCountAll({
      where: whereCondition,
      ...queryOptions,
    })

    const formattedRows = rows.map((row: any) => ({
      id: row.id,
      importCode: row.importCode,
      supplier: row.supplier,
      warehouse: row.warehouse,
      importDate: row.importDate,
      totalAmount: Math.round(Number(row.totalAmount || 0) * 100) / 100,
      totalAmountFormatted: `${(Math.round(Number(row.totalAmount || 0) * 100) / 100).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} ₫`,
      itemCount: row.itemCount || (row.itemsData ? row.itemsData.length : 0),
      note: row.note,
      items: row.itemsData || [],
      createdAt: row.createdAt,
    }))

    const allImports = await db.StockImport.findAll({
      where: { isDeleted: false },
    })
    const summary = {
      totalImports: allImports.length,
      totalSpend: allImports.reduce(
        (s: number, i: any) => s + (Number(i.totalAmount) || 0),
        0
      ),
      totalItemsImported: allImports.reduce(
        (s: number, i: any) =>
          s + (Number(i.itemCount) || (i.itemsData ? i.itemsData.length : 0)),
        0
      ),
    }

    return {
      items: formattedRows,
      pagination: buildPaginationResponse(count, page, pageSize),
      summary,
    }
  } catch (error) {
    console.error('Error getting stock imports:', error)
    throw parseError(error)
  }
}

const getStockImportById = async (id: string | number) => {
  try {
    await ensureStockImportTable()

    let record = null
    if (typeof id === 'number' || (!isNaN(Number(id)) && Number(id) > 0)) {
      record = await db.StockImport.findOne({
        where: { id: Number(id), isDeleted: false },
      })
    }
    if (!record) {
      record = await db.StockImport.findOne({
        where: { importCode: String(id), isDeleted: false },
      })
    }
    if (!record) {
      throw new Error('Không tìm thấy phiếu nhập kho')
    }

    return {
      id: record.id,
      importCode: record.importCode,
      supplier: record.supplier,
      warehouse: record.warehouse,
      importDate: record.importDate,
      totalAmount: Math.round(Number(record.totalAmount || 0) * 100) / 100,
      itemCount: record.itemCount,
      note: record.note,
      items: record.itemsData || [],
      createdAt: record.createdAt,
    }
  } catch (error) {
    throw parseError(error)
  }
}

export default {
  createStockImport,
  getStockImports,
  getStockImportById,
}
