import express from 'express'
import orderController from '../controllers/orderController'
import { authenticateJWT, authorize } from '../middlewares/authMiddleware'

const router = express.Router()

router.get('/', authenticateJWT, authorize('admin', 'manager', 'staff'), orderController.getOrders)
router.get('/summary', authenticateJWT, authorize('admin', 'manager', 'staff'), orderController.getShiftSummary)
router.get('/:id/qr', authenticateJWT, authorize('admin', 'manager', 'staff'), orderController.getOrderQr)
router.get('/:id', authenticateJWT, authorize('admin', 'manager', 'staff'), orderController.getOrderById)
router.post('/', authenticateJWT, authorize('admin', 'manager', 'staff'), orderController.createOrder)
router.put('/:id', authenticateJWT, authorize('admin', 'manager', 'staff'), orderController.updateOrderStatus)
router.delete('/:id', authenticateJWT, authorize('admin', 'manager', 'staff'), orderController.deleteOrder)

export default router
