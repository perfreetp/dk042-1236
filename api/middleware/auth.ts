import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import UserRepository from '../repositories/UserRepository'
import type { User } from '../../shared/types'

const JWT_SECRET = process.env.JWT_SECRET || 'promptshare-secret-key'

export interface AuthRequest extends Request {
  user?: User
}

interface JwtPayload {
  userId: number
  email: string
  role: string
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: '未授权访问，请先登录'
    })
    return
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload

    UserRepository.findById(decoded.userId).then(user => {
      if (!user) {
        res.status(401).json({
          success: false,
          error: '用户不存在，请重新登录'
        })
        return
      }

      req.user = user
      next()
    }).catch(() => {
      res.status(401).json({
        success: false,
        error: '无效的令牌，请重新登录'
      })
    })
  } catch (error) {
    res.status(401).json({
      success: false,
      error: '无效的令牌，请重新登录'
    })
  }
}

export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: '未授权访问，请先登录'
    })
    return
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: '需要管理员权限'
    })
    return
  }

  next()
}

export default authMiddleware
