import { Router } from 'express'
import CommentController from '../controllers/CommentController'
import authMiddleware from '../middleware/auth'

const router = Router()

router.get('/:promptId', CommentController.getComments)
router.post('/', authMiddleware, CommentController.createComment)
router.post('/:id/like', authMiddleware, CommentController.likeComment)

export default router
