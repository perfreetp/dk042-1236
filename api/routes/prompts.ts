import { Router } from 'express'
import PromptController from '../controllers/PromptController'
import CommentController from '../controllers/CommentController'
import authMiddleware from '../middleware/auth'

const router = Router()

router.get('/', PromptController.getPrompts)
router.get('/:id', PromptController.getPromptById)
router.post('/', authMiddleware, PromptController.createPrompt)
router.put('/:id', authMiddleware, PromptController.updatePrompt)
router.delete('/:id', authMiddleware, PromptController.deletePrompt)
router.post('/:id/copy', PromptController.copyPrompt)
router.post('/:id/fork', authMiddleware, PromptController.forkPrompt)
router.post('/:id/rate', authMiddleware, PromptController.ratePrompt)
router.get('/:id/versions', PromptController.getVersions)
router.get('/:id/comments', CommentController.getComments)
router.post('/:id/view', PromptController.viewPrompt)

export default router
