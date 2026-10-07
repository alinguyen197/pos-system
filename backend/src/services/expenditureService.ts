import db from '../models'
import { parseError } from '../utils'

/**
 * Format ngày Date thành chuỗi YYYY-MM-DD
 */
const formatDateToYYYYMMDD = (d: Date) => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Helper tính khoảng thời gian từ period string hoặc from/to date
 */
const getDateRange = (
  period = 'this_month',
  fromDate?: string,
  toDate?: string
) => {
  let start = new Date()
  let end = new Date()
  end.setHours(23, 59, 59, 999)

  if (fromDate && toDate) {
    start = new Date(fromDate)
    start.setHours(0, 0, 0, 0)
    end = new Date(toDate)
    end.setHours(23, 59, 59, 999)
    return { start, end }
  }

  start.setHours(0, 0, 0, 0)

  switch (period) {
    case 'today':
    case 'Hôm nay':
      break
    case '7days':
    case '7 ngày qua':
      start.setDate(start.getDate() - 6)
      break
    case 'this_month':
    case 'Tháng này':
      start.setDate(1)
      break
    case 'this_quarter':
    case 'Quý này': {
      const currentMonth = start.getMonth()
      const quarterStartMonth = Math.floor(currentMonth / 3) * 3
      start.setMonth(quarterStartMonth, 1)
      break
    }
    default:
      start.setDate(1)
      break
  }

  return { start, end }
}

/**
 * Tự động tạo mã phiếu chi duy nhất theo định dạng PC-YYYYMMDD-XXX
 */
const generateExpenseCode = async () => {
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
  const prefix = `PC-${dateStr}-`

  const countToday = await db.Expenditure.count({
    where: {
      expenseCode: {
        [db.Op.like]: `${prefix}%`,
      },
    },
  })

  const seq = String(countToday + 1).padStart(3, '0')
  return `${prefix}${seq}`
}

/**
 * 1. Tạo phiếu chi mới
 */
const createExpenditure = async (payload: any) => {
  try {
    const {
      category = 'other',
      title,
      amount,
      expenseDate,
      paymentMethod = 'cash',
      recipient,
      imageUrl,
      note,
      createdBy,
    } = payload

    if (!title || title.trim() === '') {
      throw { statusCode: 400, message: 'Vui lòng nhập tên/nội dung khoản chi' }
    }

    const numAmount = Number(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      throw { statusCode: 400, message: 'Số tiền chi phải lớn hơn 0' }
    }

    const expenseCode = payload.expenseCode || (await generateExpenseCode())

    const record = await db.Expenditure.create({
      expenseCode,
      category,
      title: title.trim(),
      amount: numAmount,
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      paymentMethod,
      recipient: recipient ? recipient.trim() : null,
      imageUrl: imageUrl || null,
      note: note ? note.trim() : null,
      createdBy: createdBy || null,
      isDeleted: false,
    })

    return record
  } catch (error: any) {
    throw parseError(error)
  }
}

/**
 * 2. Lấy danh sách phiếu chi có phân trang & bộ lọc
 */
const getExpenditures = async (queryParams: any) => {
  try {
    const page = parseInt(queryParams.page) || 1
    const limit = parseInt(queryParams.limit) || parseInt(queryParams.pageSize) || 20
    const offset = (page - 1) * limit

    const {
      keyword,
      category,
      paymentMethod,
      period,
      fromDate,
      toDate,
      sortBy = 'expenseDate',
      sortOrder = 'DESC',
    } = queryParams

    const whereConditions: any = {
      isDeleted: false,
    }

    // Lọc theo từ khóa tìm kiếm
    if (keyword && keyword.trim() !== '') {
      const kw = `%${keyword.trim()}%`
      whereConditions[db.Op.or] = [
        { expenseCode: { [db.Op.iLike]: kw } },
        { title: { [db.Op.iLike]: kw } },
        { recipient: { [db.Op.iLike]: kw } },
        { note: { [db.Op.iLike]: kw } },
      ]
    }

    // Lọc theo danh mục
    if (category && category !== 'all') {
      whereConditions.category = category
    }

    // Lọc theo phương thức thanh toán
    if (paymentMethod && paymentMethod !== 'all') {
      whereConditions.paymentMethod = paymentMethod
    }

    // Lọc theo thời gian
    if (fromDate || toDate || period) {
      const { start, end } = getDateRange(period, fromDate, toDate)
      whereConditions.expenseDate = {
        [db.Op.gte]: start,
        [db.Op.lte]: end,
      }
    }

    const { count, rows } = await db.Expenditure.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: db.User,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'role'],
        },
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit,
      offset,
    })

    return {
      items: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    }
  } catch (error: any) {
    throw parseError(error)
  }
}

/**
 * 3. Lấy thông tin chi tiết một phiếu chi
 */
const getExpenditureById = async (id: string | number) => {
  try {
    const record = await db.Expenditure.findOne({
      where: { id, isDeleted: false },
      include: [
        {
          model: db.User,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'role'],
        },
      ],
    })

    if (!record) {
      throw { statusCode: 404, message: 'Không tìm thấy phiếu chi' }
    }

    return record
  } catch (error: any) {
    throw parseError(error)
  }
}

/**
 * 4. Cập nhật phiếu chi
 */
const updateExpenditure = async (id: string | number, payload: any) => {
  try {
    const record = await db.Expenditure.findOne({
      where: { id, isDeleted: false },
    })

    if (!record) {
      throw { statusCode: 404, message: 'Không tìm thấy phiếu chi' }
    }

    const {
      category,
      title,
      amount,
      expenseDate,
      paymentMethod,
      recipient,
      imageUrl,
      note,
    } = payload

    if (title !== undefined && title.trim() === '') {
      throw { statusCode: 400, message: 'Vui lòng nhập tên/nội dung khoản chi' }
    }

    if (amount !== undefined) {
      const numAmount = Number(amount)
      if (isNaN(numAmount) || numAmount <= 0) {
        throw { statusCode: 400, message: 'Số tiền chi phải lớn hơn 0' }
      }
      record.amount = numAmount
    }

    if (category !== undefined) record.category = category
    if (title !== undefined) record.title = title.trim()
    if (expenseDate !== undefined) record.expenseDate = new Date(expenseDate)
    if (paymentMethod !== undefined) record.paymentMethod = paymentMethod
    if (recipient !== undefined) record.recipient = recipient ? recipient.trim() : null
    if (imageUrl !== undefined) record.imageUrl = imageUrl || null
    if (note !== undefined) record.note = note ? note.trim() : null

    await record.save()
    return record
  } catch (error: any) {
    throw parseError(error)
  }
}

/**
 * 5. Xóa mềm phiếu chi
 */
const deleteExpenditure = async (id: string | number) => {
  try {
    const record = await db.Expenditure.findOne({
      where: { id, isDeleted: false },
    })

    if (!record) {
      throw { statusCode: 404, message: 'Không tìm thấy phiếu chi' }
    }

    record.isDeleted = true
    await record.save()
    return { success: true, message: 'Xóa phiếu chi thành công' }
  } catch (error: any) {
    throw parseError(error)
  }
}

/**
 * 6. Thống kê KPI Dòng tiền (Thu, Chi kho, Chi khác, Lợi nhuận ròng, Tỷ lệ)
 */
const getExpenditureSummary = async (queryParams: any) => {
  try {
    const { period = 'this_month', fromDate, toDate } = queryParams
    const { start, end } = getDateRange(period, fromDate, toDate)
    const Op = db.Op

    // 1. Tổng doanh thu bán hàng (Thu)
    const completedOrders = await db.Order.findAll({
      where: {
        isDeleted: false,
        status: 'completed',
        orderDate: { [Op.gte]: start, [Op.lte]: end },
      },
      attributes: ['finalAmount'],
    })
    const totalRevenue = completedOrders.reduce(
      (sum: number, o: any) => sum + (Number(o.finalAmount) || 0),
      0
    )

    // 2. Chi nhập kho nguyên liệu (COGS)
    const stockImports = await db.StockImport.findAll({
      where: {
        isDeleted: false,
        importDate: { [Op.gte]: start, [Op.lte]: end },
      },
      attributes: ['totalAmount'],
    })
    const totalStockImportCost = stockImports.reduce(
      (sum: number, i: any) => sum + (Number(i.totalAmount) || 0),
      0
    )

    // 3. Chi phí vận hành & tái đầu tư (Expenditures)
    const expenditures = await db.Expenditure.findAll({
      where: {
        isDeleted: false,
        expenseDate: { [Op.gte]: start, [Op.lte]: end },
      },
      attributes: ['category', 'amount'],
    })

    const categoryLabels: Record<string, string> = {
      reinvestment: 'Tái đầu tư & CSVC',
      equipment: 'Thiết bị & Dụng cụ',
      operation: 'Chi phí vận hành (Điện, nước...)',
      utilities: 'Điện, Nước, Internet',
      premises: 'Mặt bằng',
      salary: 'Lương & Thưởng',
      marketing: 'Marketing',
      repair: 'Sửa chữa & Bảo trì',
      other: 'Chi phí khác',
    }

    const categoryMap: Record<string, number> = {}
    let totalOtherExpenses = 0

    expenditures.forEach((e: any) => {
      const cat = e.category || 'other'
      const amt = Number(e.amount) || 0
      categoryMap[cat] = (categoryMap[cat] || 0) + amt
      totalOtherExpenses += amt
    })

    // 4. Tổng chi phí toàn diện = Chi kho + Chi khác
    const totalExpenditures = totalStockImportCost + totalOtherExpenses

    // 5. Tiền lời ròng thực tế (Net Realized Profit) = Tổng Thu - Tổng Chi
    const netProfit = totalRevenue - totalExpenditures

    // 6. Tỷ lệ Chi phí trên Doanh thu (%)
    const expenseToRevenueRatio =
      totalRevenue > 0
        ? Math.round((totalExpenditures / totalRevenue) * 1000) / 10
        : 0

    // 7. Cơ cấu chi phí theo danh mục (cho Donut Chart)
    const categoryBreakdown = Object.keys(categoryMap).map((catKey) => ({
      category: catKey,
      categoryName: categoryLabels[catKey] || catKey,
      amount: categoryMap[catKey],
      percentage:
        totalOtherExpenses > 0
          ? Math.round((categoryMap[catKey] / totalOtherExpenses) * 100)
          : 0,
    }))

    return {
      period,
      fromDate: formatDateToYYYYMMDD(start),
      toDate: formatDateToYYYYMMDD(end),
      totalRevenue,
      totalStockImportCost,
      totalOtherExpenses,
      totalExpenditures,
      netProfit,
      isProfitable: netProfit >= 0,
      expenseToRevenueRatio,
      expenditureCount: expenditures.length,
      categoryBreakdown,
    }
  } catch (error: any) {
    throw parseError(error)
  }
}

export default {
  createExpenditure,
  getExpenditures,
  getExpenditureById,
  updateExpenditure,
  deleteExpenditure,
  getExpenditureSummary,
}
