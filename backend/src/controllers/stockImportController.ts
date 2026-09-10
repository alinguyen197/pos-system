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
    const result = await stockImportService.createStockImport(req.body)
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

export default {
  createStockImport,
}
