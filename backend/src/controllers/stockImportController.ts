import { Request, Response, NextFunction } from 'express'
import stockImportService from '../services/stockImportService'
import { ApiResponder } from '../utils'
import { EHttpStatuses } from '../utils/constants'

const createStockImport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const payload = {
      ...req.body,
      createdBy: (req as any).user?.id,
    }
    const result = await stockImportService.createStockImport(payload)
    return ApiResponder.success(
      res,
      result,
      'Tạo phiếu nhập kho và cập nhật tồn kho thành công',
      EHttpStatuses.OK
    )
  } catch (error: any) {
    next(error)
  }
}

const getStockImports = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const queryParams = {
      ...req.query,
      ...req.body,
    }
    const result = await stockImportService.getStockImports(queryParams)
    return ApiResponder.success(
      res,
      result,
      'Lấy danh sách phiếu nhập kho thành công',
      EHttpStatuses.OK
    )
  } catch (error: any) {
    next(error)
  }
}

const getStockImportById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const result = await stockImportService.getStockImportById(id)
    return ApiResponder.success(
      res,
      result,
      'Lấy thông tin chi tiết phiếu nhập kho thành công',
      EHttpStatuses.OK
    )
  } catch (error: any) {
    next(error)
  }
}

export default {
  createStockImport,
  getStockImports,
  getStockImportById,
}
