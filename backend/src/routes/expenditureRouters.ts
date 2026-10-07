import express from 'express'
import expenditureController from '../controllers/expenditureController'
import { authenticateJWT, authorize } from '../middlewares/authMiddleware'

const router = express.Router()

router.get(
  '/summary',
  authenticateJWT,
  authorize('admin', 'manager', 'staff', 'viewer'),
  expenditureController.getExpenditureSummary
)

router.post(
  '/',
  authenticateJWT,
  authorize('admin', 'manager', 'staff'),
  expenditureController.createExpenditure
)

router.get(
  '/',
  authenticateJWT,
  authorize('admin', 'manager', 'staff', 'viewer'),
  expenditureController.getExpenditures
)

router.post(
  '/search',
  authenticateJWT,
  authorize('admin', 'manager', 'staff', 'viewer'),
  expenditureController.getExpenditures
)

router.get(
  '/:id',
  authenticateJWT,
  authorize('admin', 'manager', 'staff', 'viewer'),
  expenditureController.getExpenditureById
)

router.put(
  '/:id',
  authenticateJWT,
  authorize('admin', 'manager'),
  expenditureController.updateExpenditure
)

router.delete(
  '/:id',
  authenticateJWT,
  authorize('admin', 'manager'),
  expenditureController.deleteExpenditure
)

export default router
