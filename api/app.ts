import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import morgan from 'morgan'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import errorHandler, { notFoundHandler } from './middleware/errorHandler.js'

import authRoutes from './routes/auth.js'
import usersRoutes from './routes/users.js'
import promptsRoutes from './routes/prompts.js'
import tagsRoutes from './routes/tags.js'
import favoritesRoutes from './routes/favorites.js'
import commentsRoutes from './routes/comments.js'
import followRoutes from './routes/follow.js'
import reportsRoutes from './routes/reports.js'
import adminRoutes from './routes/admin.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(morgan('combined'))

app.use('/api/auth', authRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/prompts', promptsRoutes)
app.use('/api/tags', tagsRoutes)
app.use('/api/favorites', favoritesRoutes)
app.use('/api/comments', commentsRoutes)
app.use('/api/follow', followRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/admin', adminRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

app.use(errorHandler)
app.use(notFoundHandler)

export default app
