import { Response, NextFunction } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../middleware/auth'
import AuthService from '../services/AuthService'
import UserRepository from '../repositories/UserRepository'
import { AppError } from '../middleware/errorHandler'
import type { ApiResponse, AuthResponse, User, RegisterRequest, LoginRequest } from '../../shared/types'

const registerSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  username: z.string().min(2, '用户名至少 2 个字符').max(50, '用户名最多 50 个字符'),
  password: z.string().min(6, '密码至少 6 个字符')
})

const loginSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(1, '密码不能为空')
})

const updateProfileSchema = z.object({
  username: z.string().min(2, '用户名至少 2 个字符').max(50, '用户名最多 50 个字符').optional(),
  avatar: z.string().optional(),
  bio: z.string().max(500, '简介最多 500 个字符').optional()
})

export const AuthController = {
  async register(
    req: AuthRequest,
    res: Response<ApiResponse<AuthResponse>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = registerSchema.parse(req.body) as RegisterRequest
      const result = await AuthService.register(data)
      res.status(201).json({
        success: true,
        data: result,
        message: '注册成功'
      })
    } catch (error) {
      next(error)
    }
  },

  async login(
    req: AuthRequest,
    res: Response<ApiResponse<AuthResponse>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = loginSchema.parse(req.body) as LoginRequest
      const result = await AuthService.login(data)
      res.json({
        success: true,
        data: result,
        message: '登录成功'
      })
    } catch (error) {
      next(error)
    }
  },

  async getProfile(
    req: AuthRequest,
    res: Response<ApiResponse<User>>,
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
      const user = await AuthService.getProfile(req.user.id)
      res.json({
        success: true,
        data: user
      })
    } catch (error) {
      next(error)
    }
  },

  async updateProfile(
    req: AuthRequest,
    res: Response<ApiResponse<User>>,
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
      const data = updateProfileSchema.parse(req.body)
      const user = await AuthService.updateProfile(req.user.id, data)
      res.json({
        success: true,
        data: user,
        message: '资料更新成功'
      })
    } catch (error) {
      next(error)
    }
  },

  async getUserById(
    req: AuthRequest,
    res: Response<ApiResponse<User>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = parseInt(req.params.id)
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: '无效的用户 ID'
        })
        return
      }
      const user = await UserRepository.findById(id)
      if (!user) {
        throw new AppError('用户不存在', 404)
      }
      res.json({
        success: true,
        data: user
      })
    } catch (error) {
      next(error)
    }
  }
}

export default AuthController
