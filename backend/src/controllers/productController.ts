import { Request, Response, NextFunction } from 'express'
import productService from '../services/productService'
import { ApiResponder } from '../utils'
import { EHttpStatuses } from '../utils/constants'
import { NotFoundError } from '../exceptions'

const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = { ...req.query, ...req.body }
    const result = await productService.getProducts(payload)
    return ApiResponder.success(
      res,
      result,
      'Lấy danh sách sản phẩm thành công'
    )
  } catch (error: any) {
    next(error)
  }
}

const getProductById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const product = await productService.getProductById(id)
    if (!product) {
      throw new NotFoundError('Không tìm thấy sản phẩm')
    }
    return ApiResponder.success(
      res,
      product,
      'Lấy chi tiết sản phẩm thành công'
    )
  } catch (error: any) {
    next(error)
  }
}

const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const newProduct = await productService.createProduct(req.body)
    return ApiResponder.success(
      res,
      newProduct,
      'Tạo sản phẩm mới thành công',
      EHttpStatuses.OK
    )
  } catch (error: any) {
    next(error)
  }
}

const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const updatedProduct = await productService.updateProduct(id, req.body)
    return ApiResponder.success(
      res,
      updatedProduct,
      'Cập nhật sản phẩm thành công'
    )
  } catch (error: any) {
    next(error)
  }
}

const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const result = await productService.deleteProduct(id)
    return ApiResponder.success(res, result, 'Xóa sản phẩm thành công')
  } catch (error: any) {
    next(error)
  }
}

export default {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
}
