import { Router } from 'express'
import FavoriteController from '../controllers/FavoriteController'
import authMiddleware from '../middleware/auth'

const router = Router()

router.get('/', authMiddleware, FavoriteController.getFavorites)
router.get('/check/:promptId', authMiddleware, FavoriteController.checkFavorite)
router.post('/', authMiddleware, FavoriteController.addFavorite)
router.delete('/:id', authMiddleware, FavoriteController.removeFavorite)
router.put('/:id', authMiddleware, FavoriteController.updateFavoriteGroup)
router.get('/groups', authMiddleware, FavoriteController.getGroups)
router.post('/groups', authMiddleware, FavoriteController.createGroup)
router.delete('/groups/:id', authMiddleware, FavoriteController.deleteGroup)

export default router
