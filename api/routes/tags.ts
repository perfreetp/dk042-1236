import { Router } from 'express'
import TagController from '../controllers/TagController'

const router = Router()

router.get('/', TagController.getTags)
router.get('/:id', TagController.getTagById)

export default router
