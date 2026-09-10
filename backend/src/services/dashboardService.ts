import db from '../models'
import { parseError } from '../utils'

/**
 * 💡 DÀNH CHO FRESHER:
 * Tại sao ở tầng Service luôn dùng `try ... catch { throw parseError(error) }`?
 * 1. Khi truy vấn Database bằng Sequelize, nếu có lỗi (sai câu lệnh, mất kết nối DB, vi phạm ràng buộc unique...),
 *    Sequelize sẽ ném ra Object lỗi rất cồng kềnh chứa cả câu lệnh raw SQL, connection pool.
 * 2. Hàm `parseError()` giúp bóc tách, làm sạch (loại bỏ thông tin nhạy cảm của DB) và chuẩn hóa thành Object:
 *    { type: '...', message: '...', details: ... }
 * 3. Lỗi này sau đó được ném ngược về Controller -> Controller gọi `next(error)` -> chuyển tiếp tới `errorHandler` middleware.
 */

/**
 * 📊 Lấy các chỉ số KPI tổng quan hôm nay cho Dashboard (Thẻ KPI đầu trang)
 * Bao gồm: Doanh thu hôm nay, so sánh hôm qua, số đơn hàng, số ly nước bán ra, cảnh báo kho.
 */
const getSummaryMetrics = async () => {
  try {
    // Bước 1: Xác định mốc thời gian bắt đầu của ngày hôm nay (00:00:00) và hôm qua
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const yesterdayStart = new Date(todayStart)
    yesterdayStart.setDate(yesterdayStart.getDate() - 1)

    const Op = db.Op

    // Bước 2: Tính tổng doanh thu các đơn hàng thành công trong ngày hôm nay
    const todayOrders = await db.Order.findAll({
      where: {
        isDeleted: false,
        status: 'completed',
        orderDate: { [Op.gte]: todayStart }, // orderDate >= 00:00:00 hôm nay
      },
      attributes: ['id', 'finalAmount'],
    })
    const todayRevenue = todayOrders.reduce(
      (sum: number, o: any) => sum + (Number(o.finalAmount) || 0),
      0
    )

    // Bước 3: Tính tổng doanh thu của ngày hôm qua (từ 00:00:00 hôm qua đến trước 00:00:00 hôm nay)
    const yesterdayOrders = await db.Order.findAll({
      where: {
        isDeleted: false,
        status: 'completed',
        orderDate: {
          [Op.gte]: yesterdayStart,
          [Op.lt]: todayStart,
        },
      },
      attributes: ['id', 'finalAmount'],
    })
    const yesterdayRevenue = yesterdayOrders.reduce(
      (sum: number, o: any) => sum + (Number(o.finalAmount) || 0),
      0
    )

    // Bước 4: Tính tỷ lệ tăng trưởng doanh thu so với hôm qua (%)
    let revenueTrendPercent = 0
    if (yesterdayRevenue > 0) {
      revenueTrendPercent = Math.round(
        ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
      )
    } else if (todayRevenue > 0) {
      revenueTrendPercent = 100 // Hôm qua không có doanh thu nhưng hôm nay có -> tăng 100%
    }

    // Bước 5: Đếm số lượng đơn hàng hôm nay và chênh lệch so với hôm qua
    const todayOrderCount = todayOrders.length
    const yesterdayOrderCount = yesterdayOrders.length
    const orderTrendDiff = todayOrderCount - yesterdayOrderCount

    // Bước 6: Tính tổng số ly nước đã bán trong ngày (cộng dồn `quantity` trong bảng OrderItem)
    const todayOrderIds = todayOrders.map((o: any) => o.id)
    let todayCupsSold = 0
    if (todayOrderIds.length > 0) {
      const items = await db.OrderItem.findAll({
        where: {
          orderId: { [Op.in]: todayOrderIds },
        },
        attributes: ['quantity'],
      })
      todayCupsSold = items.reduce(
        (sum: number, i: any) => sum + (Number(i.quantity) || 0),
        0
      )
    }

    // Bước 7: Kiểm tra cảnh báo nguyên liệu tồn kho thấp (số lượng <= ngưỡng tối thiểu minQuantity)
    const stockItems = await db.StockItem.findAll({
      where: { isDeleted: false },
    })
    const lowStockCount = stockItems.filter(
      (item: any) => Number(item.quantity) <= Number(item.minQuantity)
    ).length

    // Bước 8: Trả về kết quả hoàn chỉnh cho Controller
    return {
      todayRevenue,
      yesterdayRevenue,
      revenueTrendText: `${revenueTrendPercent >= 0 ? '+' : ''}${revenueTrendPercent}% so với hôm qua`,
      todayOrderCount,
      orderTrendText: `${orderTrendDiff >= 0 ? '+' : ''}${orderTrendDiff} so với hôm qua`,
      todayCupsSold,
      lowStockCount,
    }
  } catch (error: any) {
    // Fresher Note: Bọc lỗi qua parseError để chuẩn hoá trước khi ném về Controller
    throw parseError(error)
  }
}

/**
 * 📈 Lấy dữ liệu biểu đồ doanh thu theo chuỗi thời gian (Biểu đồ đường Line/Bar chart)
 * @param period Khoảng thời gian ('day' | 'week' | 'month')
 * @param fromDate Ngày bắt đầu tùy chọn (YYYY-MM-DD)
 * @param toDate Ngày kết thúc tùy chọn (YYYY-MM-DD)
 */
const getRevenueChart = async (
  period = 'month',
  fromDate?: string,
  toDate?: string
) => {
  try {
    const Op = db.Op
    // Mặc định lấy trong khoảng 30 ngày gần nhất nếu người dùng không chọn ngày
    let startDate = new Date()
    startDate.setDate(startDate.getDate() - 29)
    startDate.setHours(0, 0, 0, 0)
    let endDate = new Date()
    endDate.setHours(23, 59, 59, 999)

    if (fromDate) startDate = new Date(fromDate)
    if (toDate) endDate = new Date(toDate)

    // Bước 1: Lấy danh sách các đơn hàng hoàn tất trong khoảng thời gian đã chọn
    const orders = await db.Order.findAll({
      where: {
        isDeleted: false,
        status: 'completed',
        orderDate: {
          [Op.gte]: startDate,
          [Op.lte]: endDate,
        },
      },
      attributes: ['orderDate', 'finalAmount'],
      order: [['orderDate', 'ASC']],
    })

    // Bước 2: Tạo map lưu doanh thu theo từng ngày định dạng DD/MM
    const dateMap: Record<string, number> = {}

    // Fresher Note: Khởi tạo trước tất cả các ngày với giá trị 0
    // Điều này đảm bảo biểu đồ không bị "lủng/đứt đoạn" vào những ngày không có đơn hàng nào
    const curr = new Date(startDate)
    while (curr <= endDate) {
      const dayStr = `${String(curr.getDate()).padStart(2, '0')}/${String(curr.getMonth() + 1).padStart(2, '0')}`
      dateMap[dayStr] = 0
      curr.setDate(curr.getDate() + 1)
    }

    // Bước 3: Duyệt qua các đơn hàng và cộng dồn doanh thu vào ngày tương ứng
    orders.forEach((o: any) => {
      const d = new Date(o.orderDate)
      const dayStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
      if (dateMap[dayStr] !== undefined) {
        dateMap[dayStr] += Number(o.finalAmount) || 0
      }
    })

    // Bước 4: Tách mảng nhãn (trục X: các ngày) và mảng giá trị (trục Y: số tiền)
    const labels = Object.keys(dateMap)
    const values = Object.values(dateMap)

    return {
      labels,
      values,
    }
  } catch (error: any) {
    throw parseError(error)
  }
}

/**
 * 🍩 Lấy cơ cấu doanh thu theo danh mục sản phẩm (Cho biểu đồ tròn Doughnut chart)
 * Ví dụ: Cà phê (55%), Trà (30%), Bánh ngọt (15%)
 */
const getCategoryRevenue = async () => {
  try {
    // Bước 1: Dùng Eager Loading (JOIN) liên kết: OrderItem -> Order, Product -> Category
    const orderItems = await db.OrderItem.findAll({
      include: [
        {
          model: db.Order,
          as: 'order',
          where: { isDeleted: false, status: 'completed' },
          attributes: [], // Chỉ filter theo order completed, không cần lấy dữ liệu order
        },
        {
          model: db.Product,
          as: 'product',
          attributes: ['id', 'name'],
          include: [
            {
              model: db.Category,
              as: 'category',
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
      attributes: ['subtotal', 'quantity'],
    })

    // Bước 2: Gom nhóm doanh thu theo tên danh mục
    const categoryMap: Record<string, number> = {}
    let totalRevenue = 0

    orderItems.forEach((item: any) => {
      const catName = item.product?.category?.name || 'Khác'
      const amount = Number(item.subtotal) || 0
      categoryMap[catName] = (categoryMap[catName] || 0) + amount
      totalRevenue += amount
    })

    const labels = Object.keys(categoryMap)
    const values = Object.values(categoryMap)

    // Bước 3: Tính phần trăm đóng góp của từng danh mục trên tổng doanh thu
    const percentages = values.map((val) =>
      totalRevenue > 0 ? Math.round((val / totalRevenue) * 100) : 0
    )

    return {
      labels,
      values,
      percentages,
      totalRevenue,
    }
  } catch (error: any) {
    throw parseError(error)
  }
}

/**
 * 🏆 Lấy danh sách Top các sản phẩm bán chạy nhất
 * @param limit Số lượng sản phẩm muốn lấy (mặc định lấy top 5)
 */
const getTopProducts = async (limit = 5) => {
  try {
    // Bước 1: Lấy các món đã bán trong các đơn hàng thành công
    const orderItems = await db.OrderItem.findAll({
      include: [
        {
          model: db.Order,
          as: 'order',
          where: { isDeleted: false, status: 'completed' },
          attributes: [],
        },
        {
          model: db.Product,
          as: 'product',
          attributes: ['id', 'name', 'code', 'sellingPrice'],
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

    // Bước 2: Gom nhóm số lượng (qty) và doanh thu (revenue) theo từng productId
    const productStats: Record<
      number,
      { name: string; category: string; qty: number; revenue: number }
    > = {}

    orderItems.forEach((item: any) => {
      const pId = item.productId
      if (!productStats[pId]) {
        productStats[pId] = {
          name: item.product?.name || `Sản phẩm #${pId}`,
          category: item.product?.category?.name || 'Khác',
          qty: 0,
          revenue: 0,
        }
      }
      productStats[pId].qty += Number(item.quantity) || 0
      productStats[pId].revenue += Number(item.subtotal) || 0
    })

    // Bước 3: Sắp xếp giảm dần theo số lượng bán (b.qty - a.qty), lấy top `limit` và gán thứ hạng (rank)
    const sorted = Object.values(productStats)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, limit)
      .map((item, index) => ({
        rank: index + 1,
        ...item,
      }))

    return sorted
  } catch (error: any) {
    throw parseError(error)
  }
}

/**
 * ⚠️ Lấy danh sách nguyên vật liệu có lượng tồn kho thấp hoặc hết hàng
 * Dùng để hiển thị bảng cảnh báo nhập hàng trên Dashboard
 */
const getLowStockAlerts = async () => {
  try {
    // Bước 1: Lấy danh sách nguyên vật liệu, sắp xếp tăng dần theo số lượng (ít nhất lên trước)
    const items = await db.StockItem.findAll({
      where: { isDeleted: false },
      order: [['quantity', 'ASC']],
    })

    // Bước 2: Lọc các nguyên liệu có số lượng tồn kho <= mức tối thiểu (minQuantity)
    const lowStockItems = items
      .filter((item: any) => Number(item.quantity) <= Number(item.minQuantity))
      .map((item: any) => {
        const qty = Number(item.quantity)
        const min = Number(item.minQuantity)

        // Phân loại mức độ cảnh báo để hiển thị màu badge tương ứng trên UI
        let status = 'Sắp hết'
        if (qty <= 0) status = 'Hết hàng'
        else if (qty <= min * 0.5) status = 'Rất thấp'

        return {
          id: item.id,
          name: item.name,
          stock: `${qty} ${item.unit}`,
          min: `${min} ${item.unit}`,
          status,
        }
      })

    return lowStockItems
  } catch (error: any) {
    throw parseError(error)
  }
}

export default {
  getSummaryMetrics,
  getRevenueChart,
  getCategoryRevenue,
  getTopProducts,
  getLowStockAlerts,
}
