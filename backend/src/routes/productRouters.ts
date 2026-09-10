import express from 'express'
import productController from '../controllers/productController'
import { authenticateJWT, authorize } from '../middlewares/authMiddleware'

const router = express.Router()

// All authenticated roles can view & search products for POS and Product catalog
router.get('/', authenticateJWT, authorize('admin', 'manager', 'staff', 'viewer'), productController.getProducts)
router.post('/search', authenticateJWT, authorize('admin', 'manager', 'staff', 'viewer'), productController.getProducts)
router.get('/:id', authenticateJWT, authorize('admin', 'manager', 'staff', 'viewer'), productController.getProductById)

// Mutation actions reserved for admin & manager
router.post('/', authenticateJWT, authorize('admin', 'manager'), productController.createProduct)
router.put('/:id', authenticateJWT, authorize('admin', 'manager'), productController.updateProduct)
router.delete('/:id', authenticateJWT, authorize('admin', 'manager'), productController.deleteProduct)

export default router
