export class AppError extends Error {
  public statusCode: number
  public code: string
  public isOperational: boolean

  constructor(statusCode: number, message: string, code = '') {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class ValidationError extends AppError {
  public errors: Array<{ field: string; messageCode: string; message: string }>

  constructor(
    errors: Array<{ field: string; messageCode: string; message: string }> = [],
    message = 'Dữ liệu không hợp lệ.'
  ) {
    super(400, message, 'MSG_ERR_VALIDATION')
    this.errors = errors
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.') {
    super(401, message, 'MSG_ERR_COM_00902')
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Bạn không có quyền thực hiện thao tác này.') {
    super(403, message, 'MSG_ERR_COM_00903')
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Tài nguyên yêu cầu không tồn tại.') {
    super(404, message, 'MSG_ERR_COM_00904')
  }
}

export class TimeoutError extends AppError {
  constructor(message = 'Yêu cầu đã hết thời gian chờ.') {
    super(408, message, 'MSG_ERR_COM_00905')
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Dữ liệu đã được cập nhật bởi người khác. Vui lòng tải lại trang.') {
    super(409, message, 'MSG_ERR_COM_00906')
  }
}

export class MaintenanceError extends AppError {
  constructor(message = 'Hệ thống đang bảo trì. Vui lòng quay lại sau.') {
    super(503, message, 'MSG_ERR_COM_00907')
  }
}
