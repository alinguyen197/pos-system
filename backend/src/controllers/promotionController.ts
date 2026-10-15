import { Request, Response, NextFunction } from 'express'
import promotionService from '../services/promotionService'
import { ApiResponder } from '../utils'
import { EHttpStatuses } from '../utils/constants'

const getPromotions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const queryParams = { ...req.query, ...req.body }
    const result = await promotionService.getPromotions(queryParams)
    return ApiResponder.success(
      res,
      result,
      'Lấy danh sách khuyến mãi thành công',
      EHttpStatuses.OK
    )
  } catch (error: any) {
    next(error)
  }
}

const getPromotionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const result = await promotionService.getPromotionById(id)
    return ApiResponder.success(
      res,
      result,
      'Lấy thông tin chi tiết khuyến mãi thành công',
      EHttpStatuses.OK
    )
  } catch (error: any) {
    next(error)
  }
}

const createPromotion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = {
      ...req.body,
      createdBy: (req as any).user?.id,
    }
    const result = await promotionService.createPromotion(payload)
    return ApiResponder.success(
      res,
      result,
      'Tạo chiến dịch khuyến mãi thành công',
      EHttpStatuses.OK
    )
  } catch (error: any) {
    next(error)
  }
}

const updatePromotion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const result = await promotionService.updatePromotion(id, req.body)
    return ApiResponder.success(
      res,
      result,
      'Cập nhật chiến dịch khuyến mãi thành công',
      EHttpStatuses.OK
    )
  } catch (error: any) {
    next(error)
  }
}

const togglePromotionStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const result = await promotionService.togglePromotionStatus(id)
    return ApiResponder.success(
      res,
      result,
      `Đã chuyển trạng thái khuyến mãi sang: ${result.status}`,
      EHttpStatuses.OK
    )
  } catch (error: any) {
    next(error)
  }
}

const deletePromotion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const result = await promotionService.deletePromotion(id)
    return ApiResponder.success(
      res,
      result,
      'Xóa chiến dịch khuyến mãi thành công',
      EHttpStatuses.OK
    )
  } catch (error: any) {
    next(error)
  }
}

const getActivePromotions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await promotionService.getActivePromotions()
    return ApiResponder.success(
      res,
      result,
      'Lấy danh sách khuyến mãi khả dụng thành công',
      EHttpStatuses.OK
    )
  } catch (error: any) {
    next(error)
  }
}

const validatePromotion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, subtotal } = req.body
    const result = await promotionService.validatePromotion(code, subtotal)
    return ApiResponder.success(
      res,
      result,
      result.message,
      EHttpStatuses.OK
    )
  } catch (error: any) {
    next(error)
  }
}

export default {
  getPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  togglePromotionStatus,
  deletePromotion,
  getActivePromotions,
  validatePromotion,
}
