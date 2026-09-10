import db from '../models'
import { parseError, buildPaginationResponse, MASTER_CODES } from '../utils'

export interface CreateOrderItemPayload {
  productId?: number | string
  code?: string
  quantity: number
  unitPrice?: number
  note?: string
}

export interface CreateOrderPayload {
  items: CreateOrderItemPayload[]
  paymentMethod?: string
  discountAmount?: number
  note?: string
  createdBy?: number
}

const syncSequences = async () => {
  if (db.sequelize.getDialect() === 'postgres') {
    try {
      await db.sequelize.query(`SELECT setval('orders_id_seq', (SELECT COALESCE(MAX(id), 1) FROM orders));`)
      await db.sequelize.query(`SELECT setval('order_items_id_seq', (SELECT COALESCE(MAX(id), 1) FROM order_items));`)
    } catch (e) {
      // Ignore sequence errors if sequences don't exist
    }
  }
}

/**
 * Helper quy đổi đơn vị định lượng BOM sản phẩm về đơn vị quản lý kho (kg, lít, cái...)
 * Trả về số lượng cần trừ tính theo đơn vị kho
 */
const calculateRecipeDeduction = (recipeAmount: number, recipeUnit: string, stockUnit: string): number => {
  const amt = Number(recipeAmount) || 0
  if (amt <= 0) return 0

  const rUnit = (recipeUnit || '').toString().toLowerCase().trim()
  const sUnit = (stockUnit || '').toString().toLowerCase().trim()

  // Cùng đơn vị → trừ trực tiếp
  if (rUnit === sUnit) return amt

  // Quy đổi gram -> kg
  if ((rUnit === 'g' || rUnit === 'gram' || rUnit === 'gr') && (sUnit === 'kg' || sUnit === 'kilogram')) {
    return amt / 1000
  }
  // Quy đổi kg -> gram
  if ((rUnit === 'kg' || rUnit === 'kilogram') && (sUnit === 'g' || sUnit === 'gram' || sUnit === 'gr')) {
    return amt * 1000
  }
  // Quy đổi ml -> lít
  if ((rUnit === 'ml' || rUnit === 'milliliter' || rUnit === 'cc') && (sUnit === 'lít' || sUnit === 'lit' || sUnit === 'l')) {
    return amt / 1000
  }
  // Quy đổi lít -> ml
  if ((rUnit === 'lít' || rUnit === 'lit' || rUnit === 'l') && (sUnit === 'ml' || sUnit === 'milliliter' || sUnit === 'cc')) {
    return amt * 1000
  }

  // Không tìm thấy rule quy đổi → dùng nguyên giá trị (cùng đơn vị khác nhau tên: lon, hộp,...)
  return amt
}


const createOrder = async (payload: CreateOrderPayload) => {
  const transaction = await db.sequelize.transaction()
  try {
    await syncSequences()

    const { items, paymentMethod = 'cash', discountAmount = 0, note, createdBy } = payload
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Danh sách món trong đơn hàng không được rỗng')
    }

    // Generate Order Number: DH + YYYYMMDD + -XXX
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const orderCountToday = await db.Order.count({
      where: {
        orderDate: {
          [db.Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    })
    const orderNumber = `DH${todayStr}-${String(orderCountToday + 1).padStart(3, '0')}`

    let totalAmount = 0
    const processedItems: Array<{
      product: any
      quantity: number
      unitPrice: number
      subtotal: number
      note?: string
    }> = []

    for (const item of items) {
      const qty = Number(item.quantity) || 1
      if (qty <= 0) continue

      let product = null
      if (item.productId) {
        product = await db.Product.findByPk(item.productId)
      }
      if (!product && item.code) {
        product = await db.Product.findOne({ where: { code: item.code, isDeleted: false } })
      }
      if (!product && typeof item.productId === 'string') {
        product = await db.Product.findOne({ where: { code: item.productId, isDeleted: false } })
      }

      if (!product) {
        throw new Error(`Không tìm thấy sản phẩm mã/ID: ${item.productId || item.code}`)
      }

      if (
        product.status === 'Tạm ngừng' ||
        product.status === MASTER_CODES.PRODUCT_STATUS.SUSPENDED ||
        product.isActive === false
      ) {
        throw new Error(`Sản phẩm "${product.name}" đang tạm ngưng kinh doanh, không thể tạo đơn hàng`)
      }

      const unitPrice = item.unitPrice !== undefined ? Number(item.unitPrice) : (product.sellingPrice || 0)
      const subtotal = unitPrice * qty
      totalAmount += subtotal

      processedItems.push({
        product,
        quantity: qty,
        unitPrice,
        subtotal,
        note: item.note,
      })
    }

    const finalDiscount = Number(discountAmount) || 0
    const finalAmount = Math.max(0, totalAmount - finalDiscount)

    // Create Order Header
    const newOrder = await db.Order.create(
      {
        orderNumber,
        orderDate: new Date(),
        status: 'completed',
        totalAmount,
        discountAmount: finalDiscount,
        finalAmount,
        paymentMethod,
        note,
        createdBy: createdBy || null,
        isDeleted: false,
      },
      { transaction }
    )

    // Create Order Items & Deduct Stock Items via BOM Recipes
    for (const pItem of processedItems) {
      await db.OrderItem.create(
        {
          orderId: newOrder.id,
          productId: pItem.product.id,
          quantity: pItem.quantity,
          unitPrice: pItem.unitPrice,
          subtotal: pItem.subtotal,
          note: pItem.note,
        },
        { transaction }
      )

      // Automatic Stock Deduction (BOM Recipes)
      const recipes = await db.ProductRecipe.findAll({
        where: { productId: pItem.product.id },
      })

      for (const recipe of recipes) {
        const stockItem = await db.StockItem.findByPk(recipe.stockItemId)
        if (stockItem) {
          const perCupDeduction = calculateRecipeDeduction(recipe.amount, recipe.unit, stockItem.unit)
          const totalDeduction = perCupDeduction * pItem.quantity
          const newQty = Math.max(0, Number(stockItem.quantity) - totalDeduction)
          await stockItem.update({ quantity: newQty }, { transaction })
        }
      }
    }

    await transaction.commit()

    // Fetch newly created order with items
    const createdOrder = await getOrderById(newOrder.id)
    return createdOrder
  } catch (error) {
    await transaction.rollback()
    console.error('Error creating order:', error)
    throw parseError(error)
  }
}

const getOrders = async (queryParams: any = {}) => {
  try {
    const page = Number(queryParams.page) || 1
    const limit = Number(queryParams.limit || queryParams.pageSize) || 20
    const offset = (page - 1) * limit
    const { status, keyword, date, fromDate, toDate } = queryParams

    const where: any = { isDeleted: false }
    if (status && status !== 'all') {
      where.status = status
    }
    if (keyword) {
      where.orderNumber = { [db.Op.iLike || db.Op.like]: `%${keyword}%` }
    }

    if (date) {
      const targetDate = new Date(date)
      if (!isNaN(targetDate.getTime())) {
        const start = new Date(targetDate)
        start.setHours(0, 0, 0, 0)
        const end = new Date(targetDate)
        end.setHours(23, 59, 59, 999)
        where.orderDate = { [db.Op.between]: [start, end] }
      }
    } else if (fromDate || toDate) {
      const start = fromDate ? new Date(new Date(fromDate).setHours(0, 0, 0, 0)) : new Date(0)
      const end = toDate ? new Date(new Date(toDate).setHours(23, 59, 59, 999)) : new Date()
      where.orderDate = { [db.Op.between]: [start, end] }
    }

    const { count, rows } = await db.Order.findAndCountAll({
      where,
      include: [
        {
          model: db.OrderItem,
          as: 'items',
          include: [{ model: db.Product, as: 'product', attributes: ['id', 'code', 'name', 'imageUrl'] }],
        },
      ],
      order: [['id', 'DESC']],
      offset,
      limit,
      distinct: true,
    })

    return {
      items: rows,
      pagination: buildPaginationResponse(count, page, limit),
    }
  } catch (error) {
    throw parseError(error)
  }
}

const getOrderById = async (id: string | number) => {
  try {
    let order = null
    if (typeof id === 'number' || !isNaN(Number(id))) {
      order = await db.Order.findByPk(id, {
        include: [
          {
            model: db.OrderItem,
            as: 'items',
            include: [{ model: db.Product, as: 'product', attributes: ['id', 'code', 'name', 'imageUrl'] }],
          },
        ],
      })
    }
    if (!order) {
      order = await db.Order.findOne({
        where: { orderNumber: String(id), isDeleted: false },
        include: [
          {
            model: db.OrderItem,
            as: 'items',
            include: [{ model: db.Product, as: 'product', attributes: ['id', 'code', 'name', 'imageUrl'] }],
          },
        ],
      })
    }
    return order
  } catch (error) {
    throw parseError(error)
  }
}

const updateOrderStatus = async (id: string | number, status: string) => {
  const transaction = await db.sequelize.transaction()
  try {
    const order = await getOrderById(id)
    if (!order) throw new Error('Không tìm thấy đơn hàng')

    const oldStatus = order.status
    if (oldStatus === status) {
      await transaction.rollback()
      return order
    }

    // Business Rule: Completed orders CANNOT be cancelled
    if (oldStatus === 'completed' && status === 'cancelled') {
      await transaction.rollback()
      throw new Error('Đơn hàng đã hoàn thành không thể hủy!')
    }

    await order.update({ status }, { transaction })
    await transaction.commit()
    return await getOrderById(id)
  } catch (error) {
    await transaction.rollback()
    throw parseError(error)
  }
}

const deleteOrder = async (id: string | number) => {
  try {
    const order = await getOrderById(id)
    if (!order) throw new Error('Không tìm thấy đơn hàng')
    await order.update({ isDeleted: true })
    return { success: true }
  } catch (error) {
    throw parseError(error)
  }
}

const getShiftSummary = async (afterTime?: string, createdBy?: number | string) => {
  try {
    const now = new Date()
    const currentHour = now.getHours()

    let shiftCode = 'morning'
    let shiftName = 'Ca sáng (06:00 - 14:00)'
    let startTime = new Date(now)
    let endTime = new Date(now)

    if (currentHour >= 6 && currentHour < 14) {
      shiftCode = 'morning'
      shiftName = 'Ca sáng (06:00 - 14:00)'
      startTime.setHours(6, 0, 0, 0)
      endTime.setHours(14, 0, 0, 0)
    } else if (currentHour >= 14 && currentHour < 22) {
      shiftCode = 'afternoon'
      shiftName = 'Ca chiều (14:00 - 22:00)'
      startTime.setHours(14, 0, 0, 0)
      endTime.setHours(22, 0, 0, 0)
    } else {
      shiftCode = 'night'
      shiftName = 'Ca tối/đêm (22:00 - 06:00)'
      if (currentHour >= 22) {
        startTime.setHours(22, 0, 0, 0)
        endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000)
        endTime.setHours(6, 0, 0, 0)
      } else {
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        startTime.setHours(22, 0, 0, 0)
        endTime.setHours(6, 0, 0, 0)
      }
    }

    if (afterTime && !isNaN(Date.parse(afterTime))) {
      const parsedAfter = new Date(afterTime)
      if (parsedAfter > startTime) {
        startTime = parsedAfter
      }
    }

    const where: any = {
      orderDate: {
        [db.Op.between]: [startTime, endTime],
      },
      status: 'completed',
      isDeleted: false,
    }

    if (createdBy) {
      where.createdBy = createdBy
    }

    const orders = await db.Order.findAll({
      where,
      include: [{ model: db.OrderItem, as: 'items' }],
    })

    let shiftRevenue = 0
    let totalCupsSold = 0
    let cashRevenue = 0
    let transferRevenue = 0
    let cardRevenue = 0
    let totalDiscount = 0

    for (const order of orders) {
      const o = order as any
      const finalAmt = Number(o.finalAmount) || 0
      const discountAmt = Number(o.discountAmount) || 0
      const method = String(o.paymentMethod || 'cash').toLowerCase()

      shiftRevenue += finalAmt
      totalDiscount += discountAmt

      if (method === 'cash') {
        cashRevenue += finalAmt
      } else if (method === 'qr' || method === 'bank' || method === 'transfer') {
        transferRevenue += finalAmt
      } else if (method === 'card') {
        cardRevenue += finalAmt
      } else {
        cashRevenue += finalAmt
      }

      for (const item of o.items || []) {
        totalCupsSold += Number(item.quantity) || 0
      }
    }

    return {
      shiftCode,
      shiftName,
      startTime,
      endTime,
      shiftRevenue,
      totalOrders: orders.length,
      totalCupsSold,
      cashRevenue,
      transferRevenue,
      cardRevenue,
      totalDiscount,
    }
  } catch (error) {
    throw parseError(error)
  }
}

const getOrderQr = async (id: string | number) => {
  try {
    const order = await getOrderById(id)
    if (!order) throw new Error('Không tìm thấy đơn hàng')

    const bankId = 'MB' // MBBank default
    const accountNo = '0399888999'
    const accountName = 'SKY COFFEE MANAGEMENT'
    const amount = order.finalAmount
    const addInfo = `SKY ${order.orderNumber}`

    const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(addInfo)}&accountName=${encodeURIComponent(accountName)}`

    return {
      orderNumber: order.orderNumber,
      amount: order.finalAmount,
      bankId,
      accountNo,
      accountName,
      addInfo,
      qrUrl,
    }
  } catch (error) {
    throw parseError(error)
  }
}

export default {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  getShiftSummary,
  getOrderQr,
}
