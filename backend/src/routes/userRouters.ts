import express from 'express'
import userController from '../controllers/userController'
import { authenticateJWT, authorize } from '../middlewares/authMiddleware'

const router = express.Router()

// Admin ONLY can manage or view users list (Manager is restricted from user screen)
router.get('/', authenticateJWT, authorize('admin'), userController.getUsers)
router.get('/get-all-users', authenticateJWT, authorize('admin'), userController.getUsers)
router.get('/:id', authenticateJWT, authorize('admin'), userController.getUserById)

// Admin only actions
router.post('/', authenticateJWT, authorize('admin'), userController.createUser)
router.put('/:id', authenticateJWT, authorize('admin'), userController.updateUser)
router.delete('/:id', authenticateJWT, authorize('admin'), userController.deleteUser)
router.patch('/:id/status', authenticateJWT, authorize('admin'), userController.toggleUserStatus)

export default router
