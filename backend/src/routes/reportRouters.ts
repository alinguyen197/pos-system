import express from 'express'
import reportController from '../controllers/reportController'
import { authenticateJWT, authorize } from '../middlewares/authMiddleware'

const router = express.Router()

router.get('/sales', authenticateJWT, authorize('admin', 'manager', 'staff', 'viewer'), reportController.getSalesReportSummary)
router.get('/sales/by-date', authenticateJWT, authorize('admin', 'manager', 'staff', 'viewer'), reportController.getSalesByDate)
router.get('/sales/by-payment-method', authenticateJWT, authorize('admin', 'manager', 'staff', 'viewer'), reportController.getSalesByPaymentMethod)
router.get('/sales/by-category', authenticateJWT, authorize('admin', 'manager', 'staff', 'viewer'), reportController.getSalesByCategory)
router.get('/sales/by-product', authenticateJWT, authorize('admin', 'manager', 'staff', 'viewer'), reportController.getSalesByProduct)
router.get('/sales/by-staff', authenticateJWT, authorize('admin', 'manager', 'staff', 'viewer'), reportController.getSalesByStaff)
router.get('/sales/export', authenticateJWT, authorize('admin', 'manager', 'staff', 'viewer'), reportController.exportSalesReport)
router.get('/cashflow', authenticateJWT, authorize('admin', 'manager', 'staff', 'viewer'), reportController.getCashflowReport)
router.get('/cashflow/export', authenticateJWT, authorize('admin', 'manager', 'staff', 'viewer'), reportController.exportCashflowReport)

export default router
