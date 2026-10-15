import express from 'express'
import promotionController from '../controllers/promotionController'
import { authenticateJWT, authorize } from '../middlewares/authMiddleware'

const router = express.Router()

// Endpoint cho POS: Lấy danh sách voucher đang active & còn hiệu lực
router.get(
  '/active-list',
  authenticateJWT,
  authorize('admin', 'manager', 'staff'),
  promotionController.getActivePromotions
)

// Endpoint cho POS: Kiểm tra mã giảm giá & tính toán số tiền giảm
router.post(
  '/validate',
  authenticateJWT,
  authorize('admin', 'manager', 'staff'),
  promotionController.validatePromotion
)

// Endpoints Quản lý Khuyến mãi (CRUD)
router.get(
  '/',
  authenticateJWT,
  authorize('admin', 'manager'),
  promotionController.getPromotions
)

router.post(
  '/search',
  authenticateJWT,
  authorize('admin', 'manager'),
  promotionController.getPromotions
)

router.post(
  '/',
  authenticateJWT,
  authorize('admin', 'manager'),
  promotionController.createPromotion
)

router.get(
  '/:id',
  authenticateJWT,
  authorize('admin', 'manager'),
  promotionController.getPromotionById
)

router.put(
  '/:id',
  authenticateJWT,
  authorize('admin', 'manager'),
  promotionController.updatePromotion
)

router.patch(
  '/:id/status',
  authenticateJWT,
  authorize('admin', 'manager'),
  promotionController.togglePromotionStatus
)

router.delete(
  '/:id',
  authenticateJWT,
  authorize('admin'),
  promotionController.deletePromotion
)

export default router
