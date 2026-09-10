import express from 'express'
import stockImportController from '../controllers/stockImportController'
import { authenticateJWT, authorize } from '../middlewares/authMiddleware'

const router = express.Router()

router.post('/', authenticateJWT, authorize('admin', 'manager'), stockImportController.createStockImport)

export default router
