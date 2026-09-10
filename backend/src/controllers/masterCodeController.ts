import { Request, Response, NextFunction } from 'express'
import masterCodeService from '../services/masterCodeService'
import { ApiResponder } from '../utils'

const getMasterCodes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { category, groupCategory } = req.query
    const categoryParam = (category || groupCategory) as string
    const masterCodes = await masterCodeService.getMasterCodes(categoryParam)
    return ApiResponder.success(
      res,
      masterCodes,
      'Lấy danh sách Master Codes thành công'
    )
  } catch (error: any) {
    next(error)
  }
}

export default {
  getMasterCodes,
}
