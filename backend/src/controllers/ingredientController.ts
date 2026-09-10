import { Request, Response, NextFunction } from 'express'
import ingredientService from '../services/ingredientService'
import { ApiResponder } from '../utils'
import { EHttpStatuses } from '../utils/constants'
import { NotFoundError } from '../exceptions'

const getIngredients = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const payload = { ...req.query, ...req.body }
    const result = await ingredientService.getIngredients(payload)
    return ApiResponder.success(
      res,
      result,
      'Lấy danh sách nguyên liệu thành công'
    )
  } catch (error: any) {
    next(error)
  }
}

const getIngredientById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const ingredient = await ingredientService.getIngredientById(id)
    if (!ingredient) {
      throw new NotFoundError('Không tìm thấy nguyên liệu')
    }
    return ApiResponder.success(
      res,
      ingredient,
      'Lấy chi tiết nguyên liệu thành công'
    )
  } catch (error: any) {
    next(error)
  }
}

const createIngredient = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const newIngredient = await ingredientService.createIngredient(req.body)
    return ApiResponder.success(
      res,
      newIngredient,
      'Tạo nguyên liệu mới thành công',
      EHttpStatuses.OK
    )
  } catch (error: any) {
    next(error)
  }
}

const updateIngredient = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const updatedIngredient = await ingredientService.updateIngredient(
      id,
      req.body
    )
    return ApiResponder.success(
      res,
      updatedIngredient,
      'Cập nhật nguyên liệu thành công'
    )
  } catch (error: any) {
    next(error)
  }
}

const deleteIngredient = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const result = await ingredientService.deleteIngredient(id)
    return ApiResponder.success(res, result, 'Xóa nguyên liệu thành công')
  } catch (error: any) {
    next(error)
  }
}

export default {
  getIngredients,
  getIngredientById,
  createIngredient,
  updateIngredient,
  deleteIngredient,
}
