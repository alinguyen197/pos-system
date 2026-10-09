import { Request, Response, NextFunction } from 'express'
import expenditureService from '../services/expenditureService'
import { ApiResponder } from '../utils'
import { EHttpStatuses } from '../utils/constants'

const createExpenditure = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const payload = {
      ...req.body,
      createdBy: (req as any).user?.id,
    }
    const result = await expenditureService.createExpenditure(payload)
    return ApiResponder.success(
      res,
      result,
      'Tạo phiếu chi thành công',
      EHttpStatuses.OK
    )
  } catch (error: any) {
    next(error)
  }
}

const getExpenditures = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const queryParams = {
      ...req.query,
      ...req.body,
    }
    const result = await expenditureService.getExpenditures(queryParams)
    return ApiResponder.success(
      res,
      result,
      'Lấy danh sách phiếu chi thành công',
      EHttpStatuses.OK
    )
  } catch (error: any) {
    next(error)
  }
}

const getExpenditureById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const result = await expenditureService.getExpenditureById(id)
    return ApiResponder.success(
      res,
      result,
      'Lấy thông tin chi tiết phiếu chi thành công',
      EHttpStatuses.OK
    )
  } catch (error: any) {
    next(error)
  }
}

const updateExpenditure = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const payload = {
      ...req.body,
    }
    const result = await expenditureService.updateExpenditure(id, payload)
    return ApiResponder.success(
      res,
      result,
      'Cập nhật phiếu chi thành công',
      EHttpStatuses.OK
    )
  } catch (error: any) {
    next(error)
  }
}

const deleteExpenditure = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const result = await expenditureService.deleteExpenditure(id)
    return ApiResponder.success(
      res,
      result,
      'Xóa phiếu chi thành công',
      EHttpStatuses.OK
    )
  } catch (error: any) {
    next(error)
  }
}

const getExpenditureSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const queryParams = {
      ...req.query,
      ...req.body,
    }
    const result = await expenditureService.getExpenditureSummary(queryParams)
    return ApiResponder.success(
      res,
      result,
      'Lấy tổng quan dòng tiền thu chi thành công',
      EHttpStatuses.OK
    )
  } catch (error: any) {
    next(error)
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
