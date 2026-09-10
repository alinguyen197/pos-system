import express from 'express'
import dashboardController from '../controllers/dashboardController'
import { authenticateJWT, authorize } from '../middlewares/authMiddleware'

const router = express.Router()

router.get('/summary', authenticateJWT, authorize('admin', 'manager', 'staff', 'viewer'), dashboardController.getSummary)
router.get('/revenue-chart', authenticateJWT, authorize('admin', 'manager', 'staff', 'viewer'), dashboardController.getRevenueChart)
router.get('/category-revenue', authenticateJWT, authorize('admin', 'manager', 'staff', 'viewer'), dashboardController.getCategoryRevenue)
router.get('/top-products', authenticateJWT, authorize('admin', 'manager', 'staff', 'viewer'), dashboardController.getTopProducts)
router.get('/low-stock-alerts', authenticateJWT, authorize('admin', 'manager', 'staff', 'viewer'), dashboardController.getLowStockAlerts)

export default router
