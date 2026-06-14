import { Router } from 'express'
import AdminController from '../controllers/AdminController'
import authMiddleware, { adminMiddleware } from '../middleware/auth'

const router = Router()

router.use(authMiddleware, adminMiddleware)

router.get('/prompts/pending', AdminController.getPendingPrompts)
router.put('/prompts/:id/approve', AdminController.approvePrompt)
router.put('/prompts/:id/reject', AdminController.rejectPrompt)

router.get('/reports', AdminController.getReports)
router.put('/reports/:id', AdminController.updateReportStatus)

router.post('/tags', AdminController.createTag)
router.put('/tags/:id', AdminController.updateTag)
router.delete('/tags/:id', AdminController.deleteTag)

router.get('/home-config', AdminController.getHomeConfig)
router.put('/home-config', AdminController.updateHomeConfig)

export default router
