import { Router } from 'express'
import FollowController from '../controllers/FollowController'
import authMiddleware from '../middleware/auth'

const router = Router()

router.post('/', authMiddleware, FollowController.follow)
router.delete('/:userId', authMiddleware, FollowController.unfollow)
router.get('/following', authMiddleware, FollowController.getFollowing)
router.get('/followers', authMiddleware, FollowController.getFollowers)
router.get('/check/:userId', authMiddleware, FollowController.checkFollowing)

export default router
