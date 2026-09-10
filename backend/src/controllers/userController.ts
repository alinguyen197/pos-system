import { NextFunction, Request, Response } from 'express'
import userService from '../services/userService'
import { ApiResponder } from '../utils'
import { EHttpStatuses } from '../utils/constants'

const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, search, role } = req.query
    const result = await userService.getUsers({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      search: search as string,
      role: role as string,
    })

    return ApiResponder.success(res, result.items, 'Lấy danh sách người dùng thành công', 200, result.meta)
  } catch (error) {
    next(error)
  }
}

const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id)
    const user = await userService.getUserById(id)
    return ApiResponder.success(res, user, 'Lấy chi tiết người dùng thành công')
  } catch (error) {
    next(error)
  }
}

const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newUser = await userService.createUser(req.body)
    return ApiResponder.success(res, newUser, 'Tạo người dùng thành công', EHttpStatuses.Created)
  } catch (error) {
    next(error)
  }
}

const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id)
    const updatedUser = await userService.updateUser(id, req.body)
    return ApiResponder.success(res, updatedUser, 'Cập nhật người dùng thành công')
  } catch (error) {
    next(error)
  }
}

const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id)
    const result = await userService.deleteUser(id)
    return ApiResponder.success(res, result, 'Xóa người dùng thành công')
  } catch (error) {
    next(error)
  }
}

const toggleUserStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id)
    const result = await userService.toggleUserStatus(id)
    return ApiResponder.success(res, result, 'Đổi trạng thái người dùng thành công')
  } catch (error) {
    next(error)
  }
}

export default {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
}
