import db from '../models'
import { parseError } from '../utils'

export interface StockImportItemPayload {
  ingredientId?: string | number
  dbId?: number
  id?: string | number
  unit?: string
  qty: number
  unitPrice?: number
  totalAmount?: number
  note?: string
}

export interface StockImportPayload {
  supplier?: string
  warehouse?: string
  importDate?: string
  note?: string
  items: StockImportItemPayload[]
}

const createStockImport = async (payload: StockImportPayload) => {
  try {
    const { items } = payload
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Danh sách nguyên liệu nhập không được rỗng')
    }

    const updatedItems = []

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

      if (stockItem) {
        const addQty = Number(item.qty) || 0
        const newQuantity =
          Math.round((Number(stockItem.quantity || 0) + addQty) * 100) / 100
        const updateFields: any = { quantity: newQuantity }

        if (item.unitPrice && Number(item.unitPrice) > 0) {
          updateFields.costPerUnit =
            Math.round(Number(item.unitPrice) * 100) / 100
        }

        await stockItem.update(updateFields)
        updatedItems.push(stockItem)
      }
    }

    return {
      success: true,
      updatedCount: updatedItems.length,
      supplier: payload.supplier,
      importDate: payload.importDate,
    }
  } catch (error) {
    throw parseError(error)
  }
}

export default {
  createStockImport,
}
