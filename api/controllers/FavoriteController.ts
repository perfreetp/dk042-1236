import { Response, NextFunction } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../middleware/auth'
import FavoriteRepository from '../repositories/FavoriteRepository'
import PromptService from '../services/PromptService'
import { AppError } from '../middleware/errorHandler'
import type { ApiResponse, Favorite, FavoriteGroup } from '../../shared/types'

const addFavoriteSchema = z.object({
  promptId: z.number(),
  groupId: z.number().optional().nullable()
})

const createGroupSchema = z.object({
  name: z.string().min(1, '分组名称不能为空').max(50, '分组名称最多 50 个字符')
})

const updateGroupSchema = z.object({
  groupId: z.number().nullable()
})

const querySchema = z.object({
  groupId: z.coerce.number().optional()
})

export const FavoriteController = {
  async getFavorites(
    req: AuthRequest,
    res: Response<ApiResponse<Favorite[]>>,
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
      const query = querySchema.parse(req.query)
      const favorites = await FavoriteRepository.findByUser(req.user.id, query.groupId)
      res.json({
        success: true,
        data: favorites
      })
    } catch (error) {
      next(error)
    }
  },

  async addFavorite(
    req: AuthRequest,
    res: Response<ApiResponse<{ favorited: boolean }>>,
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
      const { promptId, groupId } = addFavoriteSchema.parse(req.body)
      const result = await PromptService.toggleFavorite(promptId, req.user.id, groupId)
      res.json({
        success: true,
        data: result,
        message: result.favorited ? '收藏成功' : '取消收藏成功'
      })
    } catch (error) {
      next(error)
    }
  },

  async removeFavorite(
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
      const promptId = parseInt(req.params.id)
      if (isNaN(promptId)) {
        res.status(400).json({
          success: false,
          error: '无效的提示词 ID'
        })
        return
      }
      const result = await FavoriteRepository.remove(req.user.id, promptId)
      if (!result) {
        throw new AppError('取消收藏失败', 400)
      }
      res.json({
        success: true,
        message: '取消收藏成功'
      })
    } catch (error) {
      next(error)
    }
  },

  async getGroups(
    req: AuthRequest,
    res: Response<ApiResponse<FavoriteGroup[]>>,
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
      const groups = await FavoriteRepository.getGroups(req.user.id)
      res.json({
        success: true,
        data: groups
      })
    } catch (error) {
      next(error)
    }
  },

  async createGroup(
    req: AuthRequest,
    res: Response<ApiResponse<FavoriteGroup>>,
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
      const { name } = createGroupSchema.parse(req.body)
      const group = await FavoriteRepository.createGroup(req.user.id, name)
      res.status(201).json({
        success: true,
        data: group,
        message: '分组创建成功'
      })
    } catch (error) {
      next(error)
    }
  },

  async updateFavoriteGroup(
    req: AuthRequest,
    res: Response<ApiResponse<Favorite>>,
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
      const id = parseInt(req.params.id)
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: '无效的收藏 ID'
        })
        return
      }
      const { groupId } = updateGroupSchema.parse(req.body)
      const favorite = await FavoriteRepository.updateFavoriteGroup(id, req.user.id, groupId)
      if (!favorite) {
        throw new AppError('收藏不存在或无权限修改', 404)
      }
      res.json({
        success: true,
        data: favorite,
        message: '移动成功'
      })
    } catch (error) {
      next(error)
    }
  },

  async deleteGroup(
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
      const groupId = parseInt(req.params.id)
      if (isNaN(groupId)) {
        res.status(400).json({
          success: false,
          error: '无效的分组 ID'
        })
        return
      }
      const result = await FavoriteRepository.deleteGroup(groupId, req.user.id)
      if (!result) {
        throw new AppError('分组不存在或无权限删除', 404)
      }
      res.json({
        success: true,
        message: '分组删除成功'
      })
    } catch (error) {
      next(error)
    }
  }
}

export default FavoriteController
