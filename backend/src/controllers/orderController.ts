import { Request, Response, NextFunction } from 'express'
import orderService from '../services/orderService'
import { ApiResponder } from '../utils'
import { EHttpStatuses } from '../utils/constants'
import { NotFoundError } from '../exceptions'

const getOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = { ...req.query, ...req.body }
    const result = await orderService.getOrders(payload)
    return ApiResponder.success(
      res,
      result,
      'Lấy danh sách đơn hàng thành công'
    )
  } catch (error: any) {
    next(error)
  }
}

const getOrderById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const order = await orderService.getOrderById(id)
    if (!order) {
      throw new NotFoundError('Không tìm thấy đơn hàng')
    }
    return ApiResponder.success(res, order, 'Lấy chi tiết đơn hàng thành công')
  } catch (error: any) {
    next(error)
  }
}

const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newOrder = await orderService.createOrder(req.body)
    return ApiResponder.success(
      res,
      newOrder,
      'Tạo đơn hàng thành công và đã trừ tồn kho',
      EHttpStatuses.OK
    )
  } catch (error: any) {
    next(error)
  }
}

const updateOrderStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const { status } = req.body
    const updatedOrder = await orderService.updateOrderStatus(id, status)
    return ApiResponder.success(
      res,
      updatedOrder,
      'Cập nhật trạng thái đơn hàng thành công'
    )
  } catch (error: any) {
    next(error)
  }
}

const deleteOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const result = await orderService.deleteOrder(id)
    return ApiResponder.success(res, result, 'Xóa đơn hàng thành công')
  } catch (error: any) {
    next(error)
  }
}

const getShiftSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const afterTime =
      (req.query.afterTime as string) || (req.query.after_time as string)
    const createdBy =
      (req.query.createdBy as string) || (req.query.created_by as string)
    const summary = await orderService.getShiftSummary(afterTime, createdBy)
    return ApiResponder.success(res, summary, 'Lấy báo cáo ca thành công')
  } catch (error: any) {
    next(error)
  }
}

const getOrderQr = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const qrData = await orderService.getOrderQr(id)
    return ApiResponder.success(res, qrData, 'Tạo mã QR thanh toán thành công')
  } catch (error: any) {
    next(error)
  }
}

export default {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder,
  getShiftSummary,
  getOrderQr,
}
