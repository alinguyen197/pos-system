import User from '../models/user.model'
import db from '../models'
import { parseError } from '../utils'
import { hashPassword } from '../utils/utils.common'

const getUsers = async (params: {
  page?: number
  limit?: number
  search?: string
  role?: string
}) => {
  try {
    const page = Math.max(Number(params.page) || 1, 1)
    const limit = Math.max(Number(params.limit) || 10, 1)
    const offset = (page - 1) * limit
    const Op = db.Op

    const where: any = {}

    if (params.role && params.role !== 'all' && params.role !== 'Tất cả') {
      where.role = params.role
    }

    if (params.search && params.search.trim() !== '') {
      const keyword = `%${params.search.trim().toLowerCase()}%`
      where[Op.or] = [
        db.Sequelize.where(
          db.Sequelize.fn('LOWER', db.Sequelize.col('name')),
          'LIKE',
          keyword
        ),
        db.Sequelize.where(
          db.Sequelize.fn('LOWER', db.Sequelize.col('email')),
          'LIKE',
          keyword
        ),
      ]
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: ['id', 'name', 'email', 'role', 'status', 'avatarUrl', 'createdAt', 'updatedAt'],
      order: [['id', 'ASC']],
      limit,
      offset,
    })

    return {
      items: rows,
      meta: {
        totalItems: count,
        itemCount: rows.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
      },
    }
  } catch (error) {
    throw parseError(error)
  }
}

const getUserById = async (id: number) => {
  try {
    const user = await User.findByPk(id, {
      attributes: ['id', 'name', 'email', 'role', 'status', 'avatarUrl', 'createdAt', 'updatedAt'],
    })
    if (!user) {
      throw {
        type: 'NotFoundError',
        message: `Không tìm thấy người dùng với ID ${id}`,
      }
    }
    return user
  } catch (error) {
    throw parseError(error)
  }
}

const createUser = async (payload: {
  name: string
  email: string
  password?: string
  role?: string
  status?: string
  avatarUrl?: string
}) => {
  try {
    if (!payload.name || !payload.name.trim()) {
      throw {
        type: 'ValidationError',
        message: 'Họ tên người dùng là bắt buộc',
      }
    }

    if (!payload.email || !payload.email.trim()) {
      throw {
        type: 'ValidationError',
        message: 'Email là bắt buộc',
      }
    }

    const existingUser = await User.findOne({
      where: { email: payload.email.trim() },
    })

    if (existingUser) {
      throw {
        type: 'ValidationError',
        message: 'Email này đã tồn tại trong hệ thống',
      }
    }

    const passwordRaw = payload.password || '123123'
    const passwordHash = await hashPassword(passwordRaw)

    const newUser = await User.create({
      name: payload.name.trim(),
      email: payload.email.trim(),
      password: passwordRaw, // Note: Store plain/hashed according to system auth comparison pattern
      role: payload.role || 'staff',
      status: payload.status || 'active',
      avatarUrl: payload.avatarUrl || null,
      otpEnabled: false,
      otpVerified: false,
    })

    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
      avatarUrl: newUser.avatarUrl,
      createdAt: newUser.createdAt,
    }
  } catch (error) {
    throw parseError(error)
  }
}

const updateUser = async (
  id: number,
  payload: {
    name?: string
    email?: string
    password?: string
    role?: string
    status?: string
    avatarUrl?: string
  }
) => {
  try {
    const user = await User.findByPk(id)
    if (!user) {
      throw {
        type: 'NotFoundError',
        message: `Không tìm thấy người dùng với ID ${id}`,
      }
    }

    if (payload.email && payload.email.trim() !== user.email) {
      const existingUser = await User.findOne({
        where: { email: payload.email.trim() },
      })
      if (existingUser) {
        throw {
          type: 'ValidationError',
          message: 'Email mới đã tồn tại trên hệ thống',
        }
      }
      user.email = payload.email.trim()
    }

    if (payload.name && payload.name.trim()) {
      user.name = payload.name.trim()
    }

    if (payload.role) {
      user.role = payload.role
    }

    if (payload.status) {
      user.status = payload.status
    }

    if (payload.avatarUrl !== undefined) {
      user.avatarUrl = payload.avatarUrl
    }

    if (payload.password && payload.password.trim()) {
      user.password = payload.password.trim()
    }

    await user.save()

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatarUrl,
      updatedAt: user.updatedAt,
    }
  } catch (error) {
    throw parseError(error)
  }
}

const deleteUser = async (id: number) => {
  try {
    const user = await User.findByPk(id)
    if (!user) {
      throw {
        type: 'NotFoundError',
        message: `Không tìm thấy người dùng với ID ${id}`,
      }
    }

    await user.destroy()
    return { success: true, message: `Đã xóa người dùng #${id} thành công` }
  } catch (error) {
    throw parseError(error)
  }
}

const toggleUserStatus = async (id: number) => {
  try {
    const user = await User.findByPk(id)
    if (!user) {
      throw {
        type: 'NotFoundError',
        message: `Không tìm thấy người dùng với ID ${id}`,
      }
    }

    user.status = user.status === 'active' || user.status === 'Hoạt động' ? 'disabled' : 'active'
    await user.save()

    return {
      id: user.id,
      name: user.name,
      status: user.status,
    }
  } catch (error) {
    throw parseError(error)
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
