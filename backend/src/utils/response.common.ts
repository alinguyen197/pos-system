import { Response } from 'express'
import { ApiResponse } from '../interfaces/response.interface'
import { EHttpStatuses } from './constants'

export class ApiResponder {
  static success<T>(
    res: Response,
    data?: T,
    message = 'Success',
    statusCode = EHttpStatuses.OK,
    meta?: ApiResponse['meta'],
    code = 'MSG_SUC_001'
  ) {
    const response: ApiResponse<T> = {
      success: true,
      statusCode,
      code,
      message,
      data,
      meta: meta || null,
    }
    return res.status(statusCode).json(response)
  }

  static error(
    res: Response,
    error: any,
    message = 'Error',
    statusCode = EHttpStatuses.InternalServerError,
    code?: string
  ) {
    const isDev = process.env.NODE_ENV !== 'production'

    // Tự động map mã code chuẩn theo HTTP Status nếu không truyền
    const defaultCodes: Record<number, string> = {
      400: 'MSG_ERR_VALIDATION',
      401: 'MSG_ERR_COM_00902',
      403: 'MSG_ERR_COM_00903',
      404: 'MSG_ERR_COM_00904',
      408: 'MSG_ERR_COM_00905',
      409: 'MSG_ERR_COM_00906',
      500: 'MSG_ERR_COM_00901',
      503: 'MSG_ERR_COM_00907',
    }

    const resolvedCode = code || defaultCodes[statusCode] || 'MSG_ERR_COM_00901'

    const response: ApiResponse = {
      success: false,
      statusCode,
      code: resolvedCode,
      message,
      data: null,
      errors: isDev ? error : undefined,
    }

    return res.status(statusCode).json(response)
  }

  static validationError(
    res: Response,
    details: any,
    message = 'Dữ liệu không hợp lệ.'
  ) {
    const errorsList = Array.isArray(details)
      ? details
      : details?.errors && Array.isArray(details.errors)
        ? details.errors
        : details
          ? [details]
          : []

    const response: ApiResponse = {
      success: false,
      statusCode: EHttpStatuses.BadRequest,
      code: 'MSG_ERR_VALIDATION',
      message,
      data: null,
      errors: errorsList,
    }

    return res.status(EHttpStatuses.BadRequest).json(response)
  }

  static notFound(
    res: Response,
    message = 'Tài nguyên yêu cầu không tồn tại.'
  ) {
    return this.error(
      res,
      null,
      message,
      EHttpStatuses.NotFound,
      'MSG_ERR_COM_00904'
    )
  }

  static unauthorized(
    res: Response,
    message = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.'
  ) {
    return this.error(
      res,
      null,
      message,
      EHttpStatuses.Unauthorized,
      'MSG_ERR_COM_00902'
    )
  }

  static forbidden(
    res: Response,
    message = 'Bạn không có quyền thực hiện thao tác này.'
  ) {
    return this.error(
      res,
      null,
      message,
      EHttpStatuses.Forbidden,
      'MSG_ERR_COM_00903'
    )
  }

  static conflict(
    res: Response,
    message = 'Dữ liệu đã được cập nhật bởi người khác. Vui lòng tải lại trang.'
  ) {
    return this.error(
      res,
      null,
      message,
      EHttpStatuses.Conflict,
      'MSG_ERR_COM_00906'
    )
  }

  static dbError(res: Response, error: any) {
    return this.error(
      res,
      error,
      'Lỗi cơ sở dữ liệu hệ thống.',
      EHttpStatuses.InternalServerError,
      'MSG_ERR_COM_00901'
    )
  }

  static pagination<T>(
    res: Response,
    data: T,
    page: number,
    limit: number,
    total: number,
    message = 'Success'
  ) {
    return this.success(res, data, message, EHttpStatuses.OK, {
      page,
      limit,
      total,
    })
  }
}
