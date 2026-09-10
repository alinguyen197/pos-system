import { Request, Response, NextFunction } from 'express'
import dashboardService from '../services/dashboardService'
import { ApiResponder } from '../utils'

const getSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await dashboardService.getSummaryMetrics()
    return ApiResponder.success(
      res,
      summary,
      'Lấy tổng quan KPI Dashboard thành công'
    )
  } catch (error: any) {
    next(error)
  }
}

const getRevenueChart = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { period, from, to } = req.query
    const chartData = await dashboardService.getRevenueChart(
      period as string,
      from as string,
      to as string
    )
    return ApiResponder.success(
      res,
      chartData,
      'Lấy dữ liệu biểu đồ doanh thu thành công'
    )
  } catch (error: any) {
    next(error)
  }
}

const getCategoryRevenue = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categoryData = await dashboardService.getCategoryRevenue()
    return ApiResponder.success(
      res,
      categoryData,
      'Lấy doanh thu theo danh mục thành công'
    )
  } catch (error: any) {
    next(error)
  }
}

const getTopProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 5
    const topProducts = await dashboardService.getTopProducts(limit)
    return ApiResponder.success(
      res,
      topProducts,
      'Lấy top sản phẩm bán chạy thành công'
    )
  } catch (error: any) {
    next(error)
  }
}

const getLowStockAlerts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const alerts = await dashboardService.getLowStockAlerts()
    return ApiResponder.success(
      res,
      alerts,
      'Lấy danh sách cảnh báo tồn kho thành công'
    )
  } catch (error: any) {
    next(error)
  }
}

export default {
  getSummary,
  getRevenueChart,
  getCategoryRevenue,
  getTopProducts,
  getLowStockAlerts,
}
