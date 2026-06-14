import { Router } from 'express'
import FavoriteController from '../controllers/FavoriteController'
import authMiddleware from '../middleware/auth'

const router = Router()

router.get('/', authMiddleware, FavoriteController.getFavorites)
router.post('/', authMiddleware, FavoriteController.addFavorite)
router.delete('/:id', authMiddleware, FavoriteController.removeFavorite)
router.get('/groups', authMiddleware, FavoriteController.getGroups)
router.post('/groups', authMiddleware, FavoriteController.createGroup)

export default router
