import { Request, Response, NextFunction } from 'express'
import {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} from '../exceptions'
import {
  DatabaseError,
  UniqueConstraintError,
  ValidationError as SequelizeValidationError,
} from 'sequelize'
import {
  TokenExpiredError,
  JsonWebTokenError,
  NotBeforeError,
} from 'jsonwebtoken'
import { parseError } from '../utils/parseError.common'

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error ra server log
  console.error(
    `[API Error] ${req.method} ${req.originalUrl}:`,
    err.message || err
  )

  // 1. Lỗi Xác thực (401 Unauthorized) -> MSG_ERR_COM_00902
  if (
    err instanceof UnauthorizedError ||
    err instanceof TokenExpiredError ||
    err instanceof JsonWebTokenError ||
    err instanceof NotBeforeError ||
    err.name === 'TokenExpiredError' ||
    err.name === 'JsonWebTokenError' ||
    err.name === 'NotBeforeError' ||
    err.type === 'TokenExpiredError' ||
    err.type === 'UnauthorizedError' ||
    err.type === 'JsonWebTokenError' ||
    err.message === 'jwt expired' ||
    err.message === 'No token provided'
  ) {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      code: 'MSG_ERR_COM_00902',
      message:
        err.message || 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.',
    })
  }

  // 2. Lỗi Phân quyền (403 Forbidden) -> MSG_ERR_COM_00903
  if (err instanceof ForbiddenError || err.type === 'ForbiddenError') {
    return res.status(403).json({
      success: false,
      statusCode: 403,
      code: 'MSG_ERR_COM_00903',
      message: err.message || 'Bạn không có quyền thực hiện thao tác này.',
    })
  }

  // 3. Lỗi Không tìm thấy tài nguyên (404 Not Found) -> MSG_ERR_COM_00904
  if (err instanceof NotFoundError || err.type === 'NotFoundError') {
    return res.status(404).json({
      success: false,
      statusCode: 404,
      code: 'MSG_ERR_COM_00904',
      message: err.message || 'Tài nguyên yêu cầu không tồn tại.',
    })
  }

  // 4. Lỗi Xung đột dữ liệu / Trùng lặp (409 Conflict) -> MSG_ERR_COM_00906
  if (
    err instanceof ConflictError ||
    err.type === 'ConflictError' ||
    err.type === 'UniqueConstraintError' ||
    err instanceof UniqueConstraintError ||
    err.name === 'SequelizeUniqueConstraintError'
  ) {
    return res.status(409).json({
      success: false,
      statusCode: 409,
      code: 'MSG_ERR_COM_00906',
      message:
        err.message ||
        'Dữ liệu đã được cập nhật bởi người khác hoặc bị trùng lặp.',
    })
  }

  // 5. Lỗi Validation (400 Bad Request) -> MSG_ERR_VALIDATION
  if (
    err instanceof ValidationError ||
    err.type === 'ValidationError' ||
    err.isJoi ||
    err instanceof SequelizeValidationError ||
    err.name === 'SequelizeValidationError'
  ) {
    let errorsList: any[] = []
    if (err.errors && Array.isArray(err.errors)) {
      errorsList = err.errors
    } else if (err.details && Array.isArray(err.details)) {
      errorsList = err.details.map((d: any) => ({
        field: d.path?.join('.') || d.path || '',
        message: d.message,
      }))
    } else if (err.message) {
      errorsList = [{ field: 'form', message: err.message }]
    }

    return res.status(400).json({
      success: false,
      statusCode: 400,
      code: err.code || 'MSG_ERR_VALIDATION',
      message: err.message || 'Dữ liệu không hợp lệ.',
      errors: errorsList,
    })
  }

  // 6. Lỗi nghiệp vụ AppError đã định nghĩa -> trả status code tương ứng
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      code: err.code || 'MSG_ERR_APP',
      message: err.message || 'Lỗi xử lý yêu cầu.',
    })
  }

  // 7. Nếu có statusCode tùy chỉnh từ middleware khác
  if (err.statusCode && typeof err.statusCode === 'number') {
    return res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      code:
        err.code ||
        (err.statusCode === 404 ? 'MSG_ERR_COM_00904' : 'MSG_ERR_CUSTOM'),
      message: err.message || 'Đã xảy ra lỗi.',
    })
  }

  // 8. Nếu là Error thông thường có thông điệp validation/not found
  if (err instanceof Error) {
    const lowerMsg = (err.message || '').toLowerCase()
    if (lowerMsg.includes('không tìm thấy') || lowerMsg.includes('not found')) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        code: 'MSG_ERR_COM_00904',
        message: err.message,
      })
    }
    if (
      lowerMsg.includes('vui lòng') ||
      lowerMsg.includes('bắt buộc') ||
      lowerMsg.includes('hợp lệ')
    ) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        code: 'MSG_ERR_VALIDATION',
        message: err.message,
        errors: [{ field: 'form', message: err.message }],
      })
    }
  }

  // 9. Lỗi không xác định / Server Error -> 500 kèm JSON thông báo chuẩn MSG_ERR_COM_00901
  const isDev = process.env.NODE_ENV !== 'production'
  return res.status(500).json({
    success: false,
    statusCode: 500,
    code: 'MSG_ERR_COM_00901',
    message: isDev
      ? err.message || 'Lỗi hệ thống máy chủ.'
      : 'Lỗi hệ thống máy chủ. Vui lòng liên hệ quản trị viên.',
    stack: isDev ? err.stack : undefined,
  })
}
