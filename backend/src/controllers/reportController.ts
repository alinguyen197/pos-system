import { Request, Response, NextFunction } from 'express'
import reportService from '../services/reportService'
import { ApiResponder } from '../utils'

const getSalesReportSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { period, from, to } = req.query
    const summary = await reportService.getSalesReportSummary(
      period as string,
      from as string,
      to as string
    )
    return ApiResponder.success(
      res,
      summary,
      'Lấy báo cáo doanh số tổng hợp thành công'
    )
  } catch (error: any) {
    next(error)
  }
}

const getSalesByDate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { period, from, to } = req.query
    const data = await reportService.getSalesByDate(
      period as string,
      from as string,
      to as string
    )
    return ApiResponder.success(
      res,
      data,
      'Lấy báo cáo doanh số theo ngày thành công'
    )
  } catch (error: any) {
    next(error)
  }
}

const getSalesByPaymentMethod = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { period, from, to } = req.query
    const data = await reportService.getSalesByPaymentMethod(
      period as string,
      from as string,
      to as string
    )
    return ApiResponder.success(
      res,
      data,
      'Lấy báo cáo theo phương thức thanh toán thành công'
    )
  } catch (error: any) {
    next(error)
  }
}

const getSalesByCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { period, from, to } = req.query
    const data = await reportService.getSalesByCategory(
      period as string,
      from as string,
      to as string
    )
    return ApiResponder.success(
      res,
      data,
      'Lấy báo cáo doanh số theo danh mục thành công'
    )
  } catch (error: any) {
    next(error)
  }
}

const getSalesByProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { period, from, to } = req.query
    const data = await reportService.getSalesByProduct(
      period as string,
      from as string,
      to as string
    )
    return ApiResponder.success(
      res,
      data,
      'Lấy báo cáo doanh số theo sản phẩm thành công'
    )
  } catch (error: any) {
    next(error)
  }
}

const getSalesByStaff = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { period, from, to } = req.query
    const data = await reportService.getSalesByStaff(
      period as string,
      from as string,
      to as string
    )
    return ApiResponder.success(
      res,
      data,
      'Lấy báo cáo doanh số theo nhân viên thành công'
    )
  } catch (error: any) {
    next(error)
  }
}

const exportSalesReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { period, from, to } = req.query
    const csvContent = await reportService.exportSalesReport(
      period as string,
      from as string,
      to as string
    )

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=bao_cao_doanh_so_${Date.now()}.csv`
    )
    return res.status(200).send(csvContent)
  } catch (error: any) {
    next(error)
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
