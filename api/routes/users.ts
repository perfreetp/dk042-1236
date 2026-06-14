import { Router } from 'express'
import AuthController from '../controllers/AuthController'

const router = Router()

router.get('/:id', AuthController.getUserById)

export default router
