import { Router } from 'express'
import ReportController from '../controllers/ReportController'
import authMiddleware from '../middleware/auth'

const router = Router()

router.post('/', authMiddleware, ReportController.createReport)

export default router
