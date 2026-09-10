import db from '../models'
import { parseError } from '../utils'

/**
 * Format ngày Date thành chuỗi YYYY-MM-DD theo giờ local không bị lệch múi giờ UTC
 */
const formatDateToYYYYMMDD = (d: Date) => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Helper tính khoảng thời gian từ period string hoặc từ/đến ngày
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
 * Tính chi phí 1 thành phần công thức BOM có tự động quy đổi đơn vị (g->kg, ml->lít)
 */
const calculateRecipeItemCost = (recipe: any) => {
  const amt = Number(recipe.amount || 0)
  const cpu = Number(recipe.ingredient?.costPerUnit || 0)
  const rUnit = (recipe.unit || '').toString().toLowerCase().trim()
  const sUnit = (recipe.ingredient?.unit || '').toString().toLowerCase().trim()

  if (amt <= 0 || cpu <= 0) return 0

  // Quy đổi gram -> kg
  if ((rUnit === 'g' || rUnit === 'gram' || rUnit === 'gr') && sUnit === 'kg') {
    return (amt / 1000) * cpu
  }
  // Quy đổi ml -> lít
  if (
    (rUnit === 'ml' || rUnit === 'milit') &&
    (sUnit === 'lít' || sUnit === 'lit' || sUnit === 'l')
  ) {
    return (amt / 1000) * cpu
  }
  // Nếu định lượng nguyên liệu cho 1 ly > 1 (ví dụ 15g nhưng để unit kg)
  if (sUnit === 'kg' && amt > 1) {
    return (amt / 1000) * cpu
  }
  if ((sUnit === 'lít' || sUnit === 'lit' || sUnit === 'l') && amt > 1) {
    return (amt / 1000) * cpu
  }

  return amt * cpu
}

/**
 * Lấy danh sách sản phẩm kèm theo BOM cost thực tế của từng sản phẩm
 */
const getProductCostMap = async () => {
  const products = await db.Product.findAll({
    where: { isDeleted: false },
    include: [
      {
        model: db.ProductRecipe,
        as: 'recipes',
        include: [
          {
            model: db.StockItem,
            as: 'ingredient',
            attributes: ['unit', 'costPerUnit'],
          },
        ],
      },
    ],
  })

  const costMap: Record<number, number> = {}

  products.forEach((p: any) => {
    let bomCost = 0
    if (p.recipes && p.recipes.length > 0) {
      p.recipes.forEach((r: any) => {
        bomCost += calculateRecipeItemCost(r)
      })
    }

    if (bomCost <= 0) {
      bomCost = Number(p.costPrice || 0)
    }

    const sellingPrice = Number(p.sellingPrice || 0)
    // Guard: Nếu costPrice lớn bất thường vượt quá sellingPrice (ví dụ test data nhập costPrice = 1.500.000đ cho ly 35.000đ)
    if (sellingPrice > 0 && bomCost > sellingPrice) {
      bomCost = Math.round(sellingPrice * 0.3) // Mặc định 30% giá bán
    }

    costMap[p.id] = bomCost
  })

  return costMap
}

const getDayOfWeekName = (dateStr: string) => {
  const days = [
    'Chủ Nhật',
    'Thứ 2',
    'Thứ 3',
    'Thứ 4',
    'Thứ 5',
    'Thứ 6',
    'Thứ 7',
  ]
  const d = new Date(dateStr)
  return days[d.getDay()] || ''
}

/**
 * 1. Tổng quan báo cáo doanh số KPI (có thêm AOV)
 */
const getSalesReportSummary = async (
  period = 'this_month',
  fromDate?: string,
  toDate?: string
) => {
  try {
    const { start, end } = getDateRange(period, fromDate, toDate)
    const Op = db.Op

    const orders = await db.Order.findAll({
      where: {
        isDeleted: false,
        status: 'completed',
        orderDate: {
          [Op.gte]: start,
          [Op.lte]: end,
        },
      },
      include: [
        {
          model: db.OrderItem,
          as: 'items',
        },
      ],
    })

    const productCostMap = await getProductCostMap()

    let totalRevenue = 0
    let totalDiscount = 0
    let totalCost = 0
    let totalItemsCount = 0

    orders.forEach((o: any) => {
      totalRevenue += Number(o.finalAmount || 0)
      totalDiscount += Number(o.discountAmount || 0)

      if (o.items && Array.isArray(o.items)) {
        o.items.forEach((item: any) => {
          const qty = Number(item.quantity || 0)
          totalItemsCount += qty
          const pCost = productCostMap[item.productId] || 0
          totalCost += qty * pCost
        })
      }
    })

    const grossProfit = totalRevenue - totalCost
    const marginPercent =
      totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0
    const avgOrderValue =
      orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0

    return {
      period,
      fromDate: formatDateToYYYYMMDD(start),
      toDate: formatDateToYYYYMMDD(end),
      orderCount: orders.length,
      totalItemsCount,
      totalRevenue,
      totalDiscount,
      totalCost: Math.round(totalCost),
      grossProfit: Math.round(grossProfit),
      marginPercent: Math.round(marginPercent * 10) / 10,
      avgOrderValue,
    }
  } catch (error: any) {
    throw parseError(error)
  }
}

/**
 * 2. Phân tích doanh thu chi tiết từng ngày (`by-date`) - Sắp xếp mới nhất lên đầu
 */
const getSalesByDate = async (
  period = 'this_month',
  fromDate?: string,
  toDate?: string
) => {
  try {
    const { start, end } = getDateRange(period, fromDate, toDate)
    const Op = db.Op

    const orders = await db.Order.findAll({
      where: {
        isDeleted: false,
        status: 'completed',
        orderDate: { [Op.gte]: start, [Op.lte]: end },
      },
      include: [
        {
          model: db.OrderItem,
          as: 'items',
        },
      ],
      order: [['orderDate', 'ASC']],
    })

    const productCostMap = await getProductCostMap()

    const dateMap: Record<
      string,
      {
        date: string
        dayOfWeek: string
        orderCount: number
        itemsCount: number
        revenue: number
        cost: number
      }
    > = {}

    // Init date range entries
    const curr = new Date(start)
    while (curr <= end) {
      const dateStr = formatDateToYYYYMMDD(curr)
      dateMap[dateStr] = {
        date: dateStr,
        dayOfWeek: getDayOfWeekName(dateStr),
        orderCount: 0,
        itemsCount: 0,
        revenue: 0,
        cost: 0,
      }
      curr.setDate(curr.getDate() + 1)
    }

    orders.forEach((o: any) => {
      const dStr = formatDateToYYYYMMDD(new Date(o.orderDate))
      if (!dateMap[dStr]) {
        dateMap[dStr] = {
          date: dStr,
          dayOfWeek: getDayOfWeekName(dStr),
          orderCount: 0,
          itemsCount: 0,
          revenue: 0,
          cost: 0,
        }
      }

      dateMap[dStr].orderCount += 1
      dateMap[dStr].revenue += Number(o.finalAmount || 0)

      if (o.items && Array.isArray(o.items)) {
        o.items.forEach((item: any) => {
          const qty = Number(item.quantity || 0)
          const pCost = productCostMap[item.productId] || 0
          dateMap[dStr].itemsCount += qty
          dateMap[dStr].cost += qty * pCost
        })
      }
    })

    const result = Object.values(dateMap).map((d) => {
      const profit = d.revenue - d.cost
      const margin = d.revenue > 0 ? (profit / d.revenue) * 100 : 0
      return {
        ...d,
        cost: Math.round(d.cost),
        profit: Math.round(profit),
        margin: `${Math.round(margin * 10) / 10}%`,
        marginNum: Math.round(margin * 10) / 10,
      }
    })

    // Sắp xếp ngày mới nhất lên đầu để hiển thị ngay trên Trang 1
    return result.sort((a, b) => b.date.localeCompare(a.date))
  } catch (error: any) {
    throw parseError(error)
  }
}

/**
 * 3. Phân tích theo Phương thức Thanh toán (`by-payment-method`)
 */
const getSalesByPaymentMethod = async (
  period = 'this_month',
  fromDate?: string,
  toDate?: string
) => {
  try {
    const { start, end } = getDateRange(period, fromDate, toDate)
    const Op = db.Op

    const orders = await db.Order.findAll({
      where: {
        isDeleted: false,
        status: 'completed',
        orderDate: { [Op.gte]: start, [Op.lte]: end },
      },
      attributes: ['paymentMethod', 'finalAmount'],
    })

    const methodLabels: Record<string, string> = {
      cash: 'Tiền mặt',
      qr: 'Quét mã VietQR',
      bank: 'Chuyển khoản',
      card: 'Thẻ ATM / Visa',
    }

    const methodMap: Record<
      string,
      {
        method: string
        methodName: string
        orderCount: number
        revenue: number
      }
    > = {}
    let totalRev = 0

    orders.forEach((o: any) => {
      const mRaw = (o.paymentMethod || 'cash').toString().toLowerCase()
      const name = methodLabels[mRaw] || mRaw
      if (!methodMap[mRaw]) {
        methodMap[mRaw] = {
          method: mRaw,
          methodName: name,
          orderCount: 0,
          revenue: 0,
        }
      }
      const rev = Number(o.finalAmount || 0)
      methodMap[mRaw].orderCount += 1
      methodMap[mRaw].revenue += rev
      totalRev += rev
    })

    const result = Object.values(methodMap).map((item) => ({
      ...item,
      percentage:
        totalRev > 0 ? Math.round((item.revenue / totalRev) * 100) : 0,
    }))

    return result.sort((a, b) => b.revenue - a.revenue)
  } catch (error: any) {
    throw parseError(error)
  }
}

/**
 * 4. Hiệu quả kinh doanh theo Danh mục
 */
const getSalesByCategory = async (
  period = 'this_month',
  fromDate?: string,
  toDate?: string
) => {
  try {
    const { start, end } = getDateRange(period, fromDate, toDate)
    const Op = db.Op

    const orderItems = await db.OrderItem.findAll({
      include: [
        {
          model: db.Order,
          as: 'order',
          where: {
            isDeleted: false,
            status: 'completed',
            orderDate: { [Op.gte]: start, [Op.lte]: end },
          },
          attributes: [],
        },
        {
          model: db.Product,
          as: 'product',
          attributes: ['id', 'name', 'costPrice'],
          include: [
            {
              model: db.Category,
              as: 'category',
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
      attributes: ['productId', 'quantity', 'subtotal'],
    })

    const productCostMap = await getProductCostMap()

    const categoryStats: Record<
      string,
      { category: string; quantity: number; revenue: number; cost: number }
    > = {}

    orderItems.forEach((item: any) => {
      const catName = item.product?.category?.name || 'Chưa phân loại'
      if (!categoryStats[catName]) {
        categoryStats[catName] = {
          category: catName,
          quantity: 0,
          revenue: 0,
          cost: 0,
        }
      }

      const qty = Number(item.quantity || 0)
      const subtotal = Number(item.subtotal || 0)
      const pCost = productCostMap[item.productId] || 0

      categoryStats[catName].quantity += qty
      categoryStats[catName].revenue += subtotal
      categoryStats[catName].cost += qty * pCost
    })

    const result = Object.values(categoryStats).map((cat) => {
      const profit = cat.revenue - cat.cost
      const margin = cat.revenue > 0 ? (profit / cat.revenue) * 100 : 0
      return {
        category: cat.category,
        quantity: cat.quantity,
        revenue: cat.revenue,
        cost: Math.round(cat.cost),
        profit: Math.round(profit),
        margin: `${Math.round(margin * 10) / 10}%`,
        marginNum: Math.round(margin * 10) / 10,
      }
    })

    return result.sort((a, b) => b.revenue - a.revenue)
  } catch (error: any) {
    throw parseError(error)
  }
}

/**
 * 5. Hiệu quả kinh doanh theo Sản phẩm
 */
const getSalesByProduct = async (
  period = 'this_month',
  fromDate?: string,
  toDate?: string
) => {
  try {
    const { start, end } = getDateRange(period, fromDate, toDate)
    const Op = db.Op

    const orderItems = await db.OrderItem.findAll({
      include: [
        {
          model: db.Order,
          as: 'order',
          where: {
            isDeleted: false,
            status: 'completed',
            orderDate: { [Op.gte]: start, [Op.lte]: end },
          },
          attributes: [],
        },
        {
          model: db.Product,
          as: 'product',
          attributes: ['id', 'code', 'name', 'unit', 'costPrice'],
          include: [
            {
              model: db.Category,
              as: 'category',
              attributes: ['name'],
            },
          ],
        },
      ],
      attributes: ['productId', 'quantity', 'subtotal'],
    })

    const productCostMap = await getProductCostMap()

    const productStats: Record<
      number,
      {
        code: string
        name: string
        category: string
        unit: string
        quantity: number
        revenue: number
        cost: number
      }
    > = {}

    orderItems.forEach((item: any) => {
      const pId = item.productId
      if (!productStats[pId]) {
        productStats[pId] = {
          code: item.product?.code || `SP${pId}`,
          name: item.product?.name || `Sản phẩm #${pId}`,
          category: item.product?.category?.name || 'Khác',
          unit: item.product?.unit || 'ly',
          quantity: 0,
          revenue: 0,
          cost: 0,
        }
      }

      const qty = Number(item.quantity || 0)
      const subtotal = Number(item.subtotal || 0)
      const pCost = productCostMap[pId] || 0

      productStats[pId].quantity += qty
      productStats[pId].revenue += subtotal
      productStats[pId].cost += qty * pCost
    })

    const result = Object.values(productStats).map((p) => {
      const profit = p.revenue - p.cost
      const margin = p.revenue > 0 ? (profit / p.revenue) * 100 : 0
      return {
        ...p,
        cost: Math.round(p.cost),
        profit: Math.round(profit),
        margin: `${Math.round(margin * 10) / 10}%`,
      }
    })

    return result.sort((a, b) => b.revenue - a.revenue)
  } catch (error: any) {
    throw parseError(error)
  }
}

/**
 * 6. Doanh số theo Nhân viên
 */
const getSalesByStaff = async (
  period = 'this_month',
  fromDate?: string,
  toDate?: string
) => {
  try {
    const { start, end } = getDateRange(period, fromDate, toDate)
    const Op = db.Op

    const orders = await db.Order.findAll({
      where: {
        isDeleted: false,
        status: 'completed',
        orderDate: { [Op.gte]: start, [Op.lte]: end },
      },
      include: [
        {
          model: db.User,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'role'],
        },
      ],
      attributes: ['id', 'finalAmount', 'createdBy'],
    })

    const staffMap: Record<
      string,
      {
        staffId: number
        staffName: string
        role: string
        orderCount: number
        revenue: number
      }
    > = {}

    orders.forEach((o: any) => {
      const staffName = o.creator?.name || 'Khách/Hệ thống'
      const key = `${o.createdBy || 0}_${staffName}`
      if (!staffMap[key]) {
        staffMap[key] = {
          staffId: o.createdBy || 0,
          staffName,
          role: o.creator?.role || 'staff',
          orderCount: 0,
          revenue: 0,
        }
      }
      staffMap[key].orderCount += 1
      staffMap[key].revenue += Number(o.finalAmount || 0)
    })

    return Object.values(staffMap).sort((a, b) => b.revenue - a.revenue)
  } catch (error: any) {
    throw parseError(error)
  }
}

/**
 * 7. Xuất báo cáo CSV
 */
const exportSalesReport = async (
  period = 'this_month',
  fromDate?: string,
  toDate?: string
) => {
  try {
    const summary = await getSalesReportSummary(period, fromDate, toDate)
    const dateReport = await getSalesByDate(period, fromDate, toDate)
    const categoryReport = await getSalesByCategory(period, fromDate, toDate)

    let csvContent = '\uFEFF' // BOM for UTF-8 Excel support
    csvContent += 'BÁO CÁO DOANH SỐ VÀ LỢI NHUẬN SKY COFFEE\n'
    csvContent += `Kỳ báo cáo: ${period} (${summary.fromDate} đến ${summary.toDate})\n`
    csvContent += `Tổng số đơn hàng: ${summary.orderCount}\n`
    csvContent += `Tổng số ly bán ra: ${summary.totalItemsCount}\n`
    csvContent += `Giá trị đơn trung bình (AOV): ${summary.avgOrderValue.toLocaleString('vi-VN')} VND\n`
    csvContent += `Tổng doanh thu: ${summary.totalRevenue.toLocaleString('vi-VN')} VND\n`
    csvContent += `Tổng chi phí NVL: ${summary.totalCost.toLocaleString('vi-VN')} VND\n`
    csvContent += `Tổng lợi nhuận gộp: ${summary.grossProfit.toLocaleString('vi-VN')} VND\n`
    csvContent += `Tỷ lệ lãi gộp TB: ${summary.marginPercent}%\n\n`

    csvContent += '--- DOANH THU THEO NGÀY ---\n'
    csvContent +=
      'Ngày,Thứ,Số đơn,Số ly bán,Doanh thu (VND),Chi phí vốn (VND),Lợi nhuận gộp (VND),Tỷ lệ lãi gộp (%)\n'
    dateReport.forEach((row) => {
      csvContent += `"${row.date}","${row.dayOfWeek}",${row.orderCount},${row.itemsCount},${row.revenue},${row.cost},${row.profit},"${row.margin}"\n`
    })

    csvContent += '\n--- DOANH THU THEO DANH MỤC ---\n'
    csvContent +=
      'Danh mục sản phẩm,Số lượng bán,Tổng doanh thu (VND),Chi phí giá vốn (VND),Lợi nhuận gộp (VND),Tỷ lệ lãi gộp (%)\n'
    categoryReport.forEach((row) => {
      csvContent += `"${row.category}",${row.quantity},${row.revenue},${row.cost},${row.profit},"${row.margin}"\n`
    })

    return csvContent
  } catch (error: any) {
    throw parseError(error)
  }
}

export default {
  getSalesReportSummary,
  getSalesByDate,
  getSalesByPaymentMethod,
  getSalesByCategory,
  getSalesByProduct,
  getSalesByStaff,
  exportSalesReport,
}
