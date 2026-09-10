import express from 'express'
import stockImportController from '../controllers/stockImportController'
import { authenticateJWT, authorize } from '../middlewares/authMiddleware'

const router = express.Router()

router.post(
  '/',
  authenticateJWT,
  authorize('admin', 'manager'),
  stockImportController.createStockImport
)
router.get(
  '/',
  authenticateJWT,
  authorize('admin', 'manager'),
  stockImportController.getStockImports
)
router.post(
  '/search',
  authenticateJWT,
  authorize('admin', 'manager'),
  stockImportController.getStockImports
)
router.get(
  '/:id',
  authenticateJWT,
  authorize('admin', 'manager'),
  stockImportController.getStockImportById
)

export default router
