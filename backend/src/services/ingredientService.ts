import db from '../models'
import {
  parseError,
  MASTER_CODES,
  buildListQuery,
  buildPaginationResponse,
} from '../utils'

const initialIngredients = [
  {
    code: 'NL-001',
    name: 'Cà phê Robusta Hạt',
    categoryCode: MASTER_CODES.INGREDIENT_CATEGORY.COFFEE_BEANS,
    categoryName: 'Cà phê hạt',
    quantity: 15.5,
    minQuantity: 5,
    unit: 'kg',
    costPerUnit: 180000,
  },
  {
    code: 'NL-002',
    name: 'Cà phê Arabica Hạt',
    categoryCode: MASTER_CODES.INGREDIENT_CATEGORY.COFFEE_BEANS,
    categoryName: 'Cà phê hạt',
    quantity: 1.5,
    minQuantity: 5,
    unit: 'kg',
    costPerUnit: 260000,
  },
  {
    code: 'NL-003',
    name: 'Sữa tươi thanh trùng 1L',
    categoryCode: MASTER_CODES.INGREDIENT_CATEGORY.MILK_CREAM,
    categoryName: 'Sữa & Kem',
    quantity: 2,
    minQuantity: 10,
    unit: 'lít',
    costPerUnit: 34000,
  },
  {
    code: 'NL-004',
    name: 'Sữa đặc Ngôi Sao',
    categoryCode: MASTER_CODES.INGREDIENT_CATEGORY.MILK_CREAM,
    categoryName: 'Sữa & Kem',
    quantity: 24,
    minQuantity: 12,
    unit: 'lon',
    costPerUnit: 22000,
  },
  {
    code: 'NL-005',
    name: 'Siro Đào Monin 700ml',
    categoryCode: MASTER_CODES.INGREDIENT_CATEGORY.SYRUP_SUGAR,
    categoryName: 'Siro & Đường',
    quantity: 0.4,
    minQuantity: 2,
    unit: 'lít',
    costPerUnit: 210000,
  },
]

const getStockStatusCode = (quantity: number, minQuantity: number): string => {
  if (quantity <= 0) return MASTER_CODES.STOCK_STATUS.OUT_OF_STOCK
  if (quantity < minQuantity * 0.3) return MASTER_CODES.STOCK_STATUS.VERY_LOW
  if (quantity < minQuantity * 0.6) return MASTER_CODES.STOCK_STATUS.NEAR_EMPTY
  if (quantity < minQuantity) return MASTER_CODES.STOCK_STATUS.NEED_IMPORT
  return MASTER_CODES.STOCK_STATUS.SAFE
}

const seedInitialIngredients = async () => {
  try {
    const count = await db.StockItem.count()
    if (count === 0) {
      for (const item of initialIngredients) {
        await db.StockItem.create({
          code: item.code,
          name: item.name,
          category: item.categoryName,
          unit: item.unit,
          quantity: item.quantity,
          minQuantity: item.minQuantity,
          costPerUnit: item.costPerUnit,
          isDeleted: false,
        })
      }
    }
  } catch (error) {
    console.error('Error seeding initial ingredient data:', error)
  }
}

const getIngredients = async (queryParamsOrBody: any = {}) => {
  try {
    await seedInitialIngredients()

    const searchConditions = queryParamsOrBody.searchConditions || {
      category: queryParamsOrBody.category,
      keyword: queryParamsOrBody.keyword,
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
        sortBy: queryParamsOrBody.sortBy,
        sortOrder: queryParamsOrBody.sortOrder,
      },
      'id',
      'ASC'
    )

    const whereCondition: any = { isDeleted: false }

    const categoryFilter = searchConditions.category
    if (categoryFilter && categoryFilter !== MASTER_CODES.FILTER.ALL) {
      const categoryMap: Record<string, string> = {
        [MASTER_CODES.INGREDIENT_CATEGORY.COFFEE_BEANS]: 'Cà phê hạt',
        [MASTER_CODES.INGREDIENT_CATEGORY.MILK_CREAM]: 'Sữa & Kem',
        [MASTER_CODES.INGREDIENT_CATEGORY.SYRUP_SUGAR]: 'Siro & Đường',
        [MASTER_CODES.INGREDIENT_CATEGORY.PACKAGING]: 'Đóng gói',
      }
      const matchName = categoryMap[categoryFilter] || categoryFilter
      whereCondition.category = matchName
    }

    const rawKeyword =
      searchConditions.keyword ||
      queryParamsOrBody.keyword ||
      queryParamsOrBody.search ||
      queryParamsOrBody.q ||
      ''
    const keyword = String(rawKeyword).trim()
    if (keyword) {
      const searchPattern = `%${keyword}%`
      whereCondition[db.Op.or] = [
        { name: { [db.Op.iLike || db.Op.like]: searchPattern } },
        { code: { [db.Op.iLike || db.Op.like]: searchPattern } },
      ]
    }

    const { count, rows } = await db.StockItem.findAndCountAll({
      where: whereCondition,
      ...queryOptions,
    })

    const formatted = rows.map((item: any) => {
      const quantity = Math.round(Number(item.quantity || 0) * 100) / 100
      const minQuantity = Math.round(Number(item.minQuantity || 0) * 100) / 100
      const costPerUnit = Math.round(Number(item.costPerUnit || 0) * 100) / 100
      const statusCode = getStockStatusCode(quantity, minQuantity)

      const categoryCodeMap: Record<string, string> = {
        'Cà phê hạt': MASTER_CODES.INGREDIENT_CATEGORY.COFFEE_BEANS,
        'Sữa & Kem': MASTER_CODES.INGREDIENT_CATEGORY.MILK_CREAM,
        'Siro & Đường': MASTER_CODES.INGREDIENT_CATEGORY.SYRUP_SUGAR,
        'Đóng gói': MASTER_CODES.INGREDIENT_CATEGORY.PACKAGING,
      }

      return {
        id: item.code || `NL-${item.id}`,
        dbId: item.id,
        name: item.name,
        category: item.category,
        categoryCode: categoryCodeMap[item.category] || item.category,
        stock: quantity,
        minStock: minQuantity,
        unit: item.unit,
        unitPrice: `${costPerUnit.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} ₫`,
        rawCost: costPerUnit,
        statusCode,
      }
    })

    const allStockItems = await db.StockItem.findAll({
      where: { isDeleted: false },
    })
    const totalValue = allStockItems.reduce((sum: number, i: any) => {
      const qty = Math.round(Number(i.quantity || 0) * 100) / 100
      const cost = Math.round(Number(i.costPerUnit || 0) * 100) / 100
      return sum + qty * cost
    }, 0)

    const roundedTotalValue = Math.round(totalValue * 100) / 100

    const summary = {
      total: allStockItems.length,
      totalValue: roundedTotalValue,
      safe: allStockItems.filter(
        (i: any) =>
          getStockStatusCode(i.quantity, i.minQuantity) ===
          MASTER_CODES.STOCK_STATUS.SAFE
      ).length,
      needImport: allStockItems.filter((i: any) => {
        const status = getStockStatusCode(i.quantity, i.minQuantity)
        return (
          status === MASTER_CODES.STOCK_STATUS.NEED_IMPORT ||
          status === MASTER_CODES.STOCK_STATUS.NEAR_EMPTY ||
          status === MASTER_CODES.STOCK_STATUS.VERY_LOW
        )
      }).length,
      outOfStock: allStockItems.filter(
        (i: any) =>
          getStockStatusCode(i.quantity, i.minQuantity) ===
          MASTER_CODES.STOCK_STATUS.OUT_OF_STOCK
      ).length,
    }

    return {
      items: formatted,
      pagination: buildPaginationResponse(count, page, pageSize),
      summary,
    }
  } catch (error) {
    console.warn('⚠️ DB query failed, returning fallback:', error)
    const page =
      Number(queryParamsOrBody.page || queryParamsOrBody.pagination?.page) || 1
    const pageSize =
      Number(
        queryParamsOrBody.pageSize || queryParamsOrBody.pagination?.pageSize
      ) || 10

    const items = initialIngredients.map((item: any, idx: number) => ({
      id: item.code,
      dbId: idx + 1,
      name: item.name,
      category: item.categoryName,
      categoryCode: item.categoryCode,
      stock: item.quantity,
      minStock: item.minQuantity,
      unit: item.unit,
      unitPrice: `${Number(item.costPerUnit).toLocaleString('vi-VN')} ₫`,
      rawCost: item.costPerUnit,
      statusCode: getStockStatusCode(item.quantity, item.minQuantity),
    }))

    return {
      items,
      pagination: buildPaginationResponse(
        initialIngredients.length,
        page,
        pageSize
      ),
    }
  }
}

const getIngredientById = async (id: string | number) => {
  try {
    let item = await db.StockItem.findOne({
      where: { id: Number(id) || 0, isDeleted: false },
    })
    if (!item && typeof id === 'string') {
      item = await db.StockItem.findOne({
        where: { code: id, isDeleted: false },
      })
    }
    return item
  } catch (error) {
    throw parseError(error)
  }
}

const createIngredient = async (data: any) => {
  try {
    if (db.sequelize.getDialect() === 'postgres') {
      try {
        await db.sequelize.query(
          `SELECT setval('stock_items_id_seq', (SELECT COALESCE(MAX(id), 1) FROM stock_items));`
        )
      } catch (seqErr) {
        // Ignore sequence error
      }
    }

    let code = data.code
    if (!code) {
      const maxIdItem = await db.StockItem.findOne({ order: [['id', 'DESC']] })
      const nextNum = (maxIdItem ? maxIdItem.id : 0) + 1
      code = `NL-${String(nextNum).padStart(3, '0')}`
    }

    const categoryMap: Record<string, string> = {
      [MASTER_CODES.INGREDIENT_CATEGORY.COFFEE_BEANS]: 'Cà phê hạt',
      [MASTER_CODES.INGREDIENT_CATEGORY.MILK_CREAM]: 'Sữa & Kem',
      [MASTER_CODES.INGREDIENT_CATEGORY.SYRUP_SUGAR]: 'Siro & Đường',
      [MASTER_CODES.INGREDIENT_CATEGORY.PACKAGING]: 'Đóng gói',
    }
    const category = categoryMap[data.category] || data.category || 'Khác'

    const quantity =
      data.quantity !== undefined
        ? Number(data.quantity)
        : data.initialStock !== undefined
          ? Number(data.initialStock)
          : 0
    const minQuantity =
      data.minQuantity !== undefined
        ? Number(data.minQuantity)
        : data.minStock !== undefined
          ? Number(data.minStock)
          : 0
    const costPerUnit =
      data.costPerUnit !== undefined
        ? Number(data.costPerUnit)
        : data.costPrice !== undefined
          ? Number(data.costPrice)
          : 0

    const newItem = await db.StockItem.create({
      code,
      name: data.name,
      category,
      unit: data.unit || 'g',
      quantity,
      minQuantity,
      costPerUnit,
      isDeleted: false,
    })
    return newItem
  } catch (error) {
    throw parseError(error)
  }
}

const updateIngredient = async (id: string | number, data: any) => {
  try {
    let item = await db.StockItem.findOne({
      where: { id: Number(id) || 0, isDeleted: false },
    })
    if (!item && typeof id === 'string') {
      item = await db.StockItem.findOne({
        where: { code: id, isDeleted: false },
      })
    }
    if (!item) throw new Error('Ingredient not found')

    const categoryMap: Record<string, string> = {
      [MASTER_CODES.INGREDIENT_CATEGORY.COFFEE_BEANS]: 'Cà phê hạt',
      [MASTER_CODES.INGREDIENT_CATEGORY.MILK_CREAM]: 'Sữa & Kem',
      [MASTER_CODES.INGREDIENT_CATEGORY.SYRUP_SUGAR]: 'Siro & Đường',
      [MASTER_CODES.INGREDIENT_CATEGORY.PACKAGING]: 'Đóng gói',
    }

    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.category !== undefined)
      updateData.category = categoryMap[data.category] || data.category
    if (data.unit !== undefined) updateData.unit = data.unit
    if (data.quantity !== undefined) updateData.quantity = Number(data.quantity)
    else if (data.stock !== undefined) updateData.quantity = Number(data.stock)
    if (data.minQuantity !== undefined)
      updateData.minQuantity = Number(data.minQuantity)
    else if (data.minStock !== undefined)
      updateData.minQuantity = Number(data.minStock)
    if (data.costPerUnit !== undefined)
      updateData.costPerUnit = Number(data.costPerUnit)
    else if (data.costPrice !== undefined)
      updateData.costPerUnit = Number(data.costPrice)

    await item.update(updateData)
    return item
  } catch (error) {
    throw parseError(error)
  }
}

const deleteIngredient = async (id: string | number) => {
  try {
    let item = await db.StockItem.findOne({
      where: { id: Number(id) || 0, isDeleted: false },
    })
    if (!item && typeof id === 'string') {
      item = await db.StockItem.findOne({
        where: { code: id, isDeleted: false },
      })
    }
    if (!item) throw new Error('Ingredient not found')

    await item.update({ isDeleted: true })
    return { success: true }
  } catch (error) {
    throw parseError(error)
  }
}

export default {
  getIngredients,
  getIngredientById,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  seedInitialIngredients,
}
