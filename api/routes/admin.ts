import { Router } from 'express'
import AdminController from '../controllers/AdminController'
import authMiddleware, { adminMiddleware } from '../middleware/auth'

const router = Router()

router.use(authMiddleware, adminMiddleware)

router.get('/prompts/pending', AdminController.getPendingPrompts)
router.get('/pending/count', AdminController.getPendingPromptsCount)
router.post('/prompts/:id/approve', AdminController.approvePrompt)
router.post('/prompts/:id/reject', AdminController.rejectPrompt)
router.post('/prompts/:id/remove', AdminController.removePrompt)
router.put('/prompts/:id', AdminController.updatePromptAdmin)

router.get('/reports', AdminController.getReports)
router.get('/reports/count', AdminController.getReportsCount)
router.put('/reports/:id', AdminController.updateReportStatus)
router.post('/reports/:id/:action', AdminController.resolveReport)

router.get('/users/count', AdminController.getUsersCount)
router.get('/prompts/count', AdminController.getPromptsCount)

router.post('/tags', AdminController.createTag)
router.put('/tags/:id', AdminController.updateTag)
router.delete('/tags/:id', AdminController.deleteTag)

router.get('/home-config', AdminController.getHomeConfig)
router.put('/home-config', AdminController.updateHomeConfig)

router.get('/banners', AdminController.getBanners)
router.post('/banners', AdminController.createBanner)
router.put('/banners/:id', AdminController.updateBanner)
router.delete('/banners/:id', AdminController.deleteBanner)

export default router
