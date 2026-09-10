import { Request, Response, NextFunction } from 'express'
import jwt, { TokenExpiredError } from 'jsonwebtoken'
import { UnauthorizedError, ForbiddenError } from '../exceptions'

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'your_secret_key'

// Extend Request để có user
interface AuthRequest extends Request {
  user?: any
}

export const authenticateJWT = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Không tìm thấy token xác thực'))
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, JWT_SECRET_KEY)
    req.user = decoded // attach payload vào req.user
    next()
  } catch (err: any) {
    if (err instanceof TokenExpiredError || err?.name === 'TokenExpiredError') {
      return next(
        new UnauthorizedError(
          'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.'
        )
      )
    }
    return next(
      new UnauthorizedError('Token không hợp lệ hoặc đã bị thay đổi.')
    )
  }
}

export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(
        new UnauthorizedError('Chưa đăng nhập hoặc token không hợp lệ')
      )
    }

    const userRole = req.user.role || 'staff'
    if (!allowedRoles.includes(userRole)) {
      return next(
        new ForbiddenError('Bạn không có quyền thực hiện thao tác này')
      )
    }

    next()
  }
}
