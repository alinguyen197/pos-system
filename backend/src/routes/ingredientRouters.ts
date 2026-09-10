import express from 'express'
import ingredientController from '../controllers/ingredientController'
import { authenticateJWT, authorize } from '../middlewares/authMiddleware'

const router = express.Router()

router.get('/', authenticateJWT, authorize('admin', 'manager'), ingredientController.getIngredients)
router.post('/search', authenticateJWT, authorize('admin', 'manager'), ingredientController.getIngredients)
router.get('/:id', authenticateJWT, authorize('admin', 'manager'), ingredientController.getIngredientById)
router.post('/', authenticateJWT, authorize('admin', 'manager'), ingredientController.createIngredient)
router.put('/:id', authenticateJWT, authorize('admin', 'manager'), ingredientController.updateIngredient)
router.delete('/:id', authenticateJWT, authorize('admin', 'manager'), ingredientController.deleteIngredient)

export default router
