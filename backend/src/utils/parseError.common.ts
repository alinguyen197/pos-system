import { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken'
import {
  DatabaseError,
  UniqueConstraintError,
  ValidationError,
} from 'sequelize'

/**
 *
 * Hàm parseError() có nhiệm vụ:
 * 1. "Làm sạch" và chuẩn hóa các lỗi phức tạp từ Sequelize ORM & JWT token thành cấu trúc { type, message, details }.
 * 2. Bảo mật: Ẩn các câu truy vấn raw SQL hoặc connection pool nhạy cảm của PostgreSQL trước khi trả ra ngoài.
 * 3. Gắn nhãn `type` (UniqueConstraintError, ValidationError...) để middleware `errorHandler` ở server.ts
 *    dễ dàng nhận diện và map đúng mã HTTP status (400, 401, 409, 500...).
 */
export const parseError = (error: any) => {
  if (!error)
    return { type: 'UnknownError', message: 'Unknown error', details: null }

  // 1. Lỗi Validation của Sequelize (ví dụ: dữ liệu không khớp kiểu, null check...) -> HTTP 400
  if (
    error instanceof ValidationError ||
    error.name === 'SequelizeValidationError'
  ) {
    return {
      type: 'ValidationError',
      message: error.message,
      details: error.errors.map((e: any) => ({
        path: e.path,
        message: e.message,
        value: e.value,
      })),
    }
  }

  // 2. Lỗi Trùng lặp dữ liệu Unique (ví dụ: trùng email, trùng mã code...) -> HTTP 409 Conflict
  if (
    error instanceof UniqueConstraintError ||
    error.name === 'SequelizeUniqueConstraintError'
  ) {
    return {
      type: 'UniqueConstraintError',
      message: error.message,
      details: error.errors.map((e: any) => ({
        path: e.path,
        message: e.message,
        value: e.value,
      })),
    }
  }

  // 3. Lỗi thao tác Database chung (cú pháp query, foreign key, deadlock...) -> HTTP 500
  if (
    error instanceof DatabaseError ||
    error.name === 'SequelizeDatabaseError'
  ) {
    return {
      type: 'DatabaseError',
      message: error.message,
      details: error.parent,
    }
  }

  // 4. Lỗi Token JWT đã hết hạn -> HTTP 401 Unauthorized
  if (
    error instanceof TokenExpiredError ||
    error.name === 'TokenExpiredError'
  ) {
    return {
      type: 'TokenExpiredError',
      message: error.message,
      expiredAt: error.expiredAt,
    }
  }

  // 5. Lỗi Token JWT không hợp lệ (sai chữ ký, token giả mạo...) -> HTTP 401 Unauthorized
  if (
    error instanceof JsonWebTokenError ||
    error.name === 'JsonWebTokenError'
  ) {
    return {
      type: 'JsonWebTokenError',
      message: error.message,
      details: null,
    }
  }

  // 6. Lỗi Javascript thông thường (new Error('...'))
  if (error instanceof Error) {
    return { type: 'Error', message: error.message, details: null }
  }

  // 7. Trường hợp lỗi ngoại lệ khác
  return { type: 'UnknownError', message: String(error), details: error }
}
