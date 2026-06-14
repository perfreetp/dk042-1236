import { Response, NextFunction } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../middleware/auth'
import FollowRepository from '../repositories/FollowRepository'
import UserRepository from '../repositories/UserRepository'
import { AppError } from '../middleware/errorHandler'
import type { ApiResponse, User } from '../../shared/types'

const followSchema = z.object({
  userId: z.number()
})

export const FollowController = {
  async follow(
    req: AuthRequest,
    res: Response<ApiResponse<null>>,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '未授权访问'
        })
        return
      }
      const { userId } = followSchema.parse(req.body)

      if (userId === req.user.id) {
        throw new AppError('不能关注自己', 400)
      }

      const user = await UserRepository.findById(userId)
      if (!user) {
        throw new AppError('用户不存在', 404)
      }

      const success = await FollowRepository.follow(req.user.id, userId)
      if (!success) {
        throw new AppError('已关注该用户', 400)
      }

      res.json({
        success: true,
        message: '关注成功'
      })
    } catch (error) {
      next(error)
    }
  },

  async unfollow(
    req: AuthRequest,
    res: Response<ApiResponse<null>>,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '未授权访问'
        })
        return
      }
      const userId = parseInt(req.params.userId)
      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          error: '无效的用户 ID'
        })
        return
      }

      const success = await FollowRepository.unfollow(req.user.id, userId)
      if (!success) {
        throw new AppError('未关注该用户', 400)
      }

      res.json({
        success: true,
        message: '取消关注成功'
      })
    } catch (error) {
      next(error)
    }
  },

  async getFollowing(
    req: AuthRequest,
    res: Response<ApiResponse<User[]>>,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '未授权访问'
        })
        return
      }
      const users = await FollowRepository.getFollowing(req.user.id)
      res.json({
        success: true,
        data: users
      })
    } catch (error) {
      next(error)
    }
  },

  async getFollowers(
    req: AuthRequest,
    res: Response<ApiResponse<User[]>>,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '未授权访问'
        })
        return
      }
      const users = await FollowRepository.getFollowers(req.user.id)
      res.json({
        success: true,
        data: users
      })
    } catch (error) {
      next(error)
    }
  }
}

export default FollowController
