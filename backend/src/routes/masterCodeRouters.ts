import express from 'express'
import masterCodeController from '../controllers/masterCodeController'

const router = express.Router()

router.get('/', masterCodeController.getMasterCodes)

export default router
