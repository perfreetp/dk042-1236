import { Response, NextFunction } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../middleware/auth'
import PromptService from '../services/PromptService'
import type { ApiResponse, Prompt, PaginatedResponse, CreatePromptRequest, PromptVersion } from '../../shared/types'

const createPromptSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题最多 200 个字符'),
  content: z.string().min(1, '内容不能为空'),
  description: z.string().max(1000, '描述最多 1000 个字符').optional(),
  tagIds: z.array(z.number()).min(1, '至少选择一个标签'),
  purpose: z.string().min(1, '用途不能为空'),
  model: z.string().min(1, '模型不能为空'),
  language: z.string().min(1, '语言不能为空'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  inputExample: z.string().optional(),
  outputExample: z.string().optional(),
  useCases: z.array(z.string()).optional(),
  changelog: z.string().optional()
})

const updatePromptSchema = createPromptSchema.partial()

const rateSchema = z.object({
  rating: z.number().min(1, '评分至少 1 分').max(5, '评分最多 5 分')
})

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  purpose: z.string().optional(),
  model: z.string().optional(),
  language: z.string().optional(),
  difficulty: z.string().optional(),
  search: z.string().optional(),
  status: z.string().default('approved'),
  isFeatured: z.enum(['true', 'false']).optional().transform(v => v === 'true'),
  sortBy: z.enum(['createdAt', 'rating', 'copyCount', 'favoriteCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

export const PromptController = {
  async getPrompts(
    req: AuthRequest,
    res: Response<ApiResponse<PaginatedResponse<Prompt>>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = querySchema.parse(req.query)
      const result = await PromptService.getPrompts(
        {
          purpose: query.purpose,
          model: query.model,
          language: query.language,
          difficulty: query.difficulty,
          search: query.search,
          status: query.status,
          isFeatured: query.isFeatured
        },
        { field: query.sortBy, order: query.sortOrder },
        query.page,
        query.pageSize
      )
      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      next(error)
    }
  },

  async getPromptById(
    req: AuthRequest,
    res: Response<ApiResponse<Prompt>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = parseInt(req.params.id)
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: '无效的提示词 ID'
        })
        return
      }
      const prompt = await PromptService.getPromptById(id)
      res.json({
        success: true,
        data: prompt
      })
    } catch (error) {
      next(error)
    }
  },

  async createPrompt(
    req: AuthRequest,
    res: Response<ApiResponse<Prompt>>,
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
      const data = createPromptSchema.parse(req.body) as CreatePromptRequest
      const prompt = await PromptService.createPrompt(req.user.id, data)
      res.status(201).json({
        success: true,
        data: prompt,
        message: '提示词创建成功，等待审核'
      })
    } catch (error) {
      next(error)
    }
  },

  async updatePrompt(
    req: AuthRequest,
    res: Response<ApiResponse<Prompt>>,
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
          error: '无效的提示词 ID'
        })
        return
      }
      const data = updatePromptSchema.parse(req.body)
      const prompt = await PromptService.updatePrompt(id, req.user.id, data)
      res.json({
        success: true,
        data: prompt,
        message: '提示词更新成功'
      })
    } catch (error) {
      next(error)
    }
  },

  async deletePrompt(
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
      const id = parseInt(req.params.id)
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: '无效的提示词 ID'
        })
        return
      }
      await PromptService.deletePrompt(id, req.user.id)
      res.json({
        success: true,
        message: '提示词删除成功'
      })
    } catch (error) {
      next(error)
    }
  },

  async copyPrompt(
    req: AuthRequest,
    res: Response<ApiResponse<null>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = parseInt(req.params.id)
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: '无效的提示词 ID'
        })
        return
      }
      await PromptService.incrementCopyCount(id)
      res.json({
        success: true,
        message: '复制成功'
      })
    } catch (error) {
      next(error)
    }
  },

  async forkPrompt(
    req: AuthRequest,
    res: Response<ApiResponse<Prompt>>,
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
          error: '无效的提示词 ID'
        })
        return
      }
      const prompt = await PromptService.forkPrompt(id, req.user.id)
      res.json({
        success: true,
        data: prompt,
        message: 'Fork 成功'
      })
    } catch (error) {
      next(error)
    }
  },

  async ratePrompt(
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
      const id = parseInt(req.params.id)
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: '无效的提示词 ID'
        })
        return
      }
      const { rating } = rateSchema.parse(req.body)
      await PromptService.ratePrompt(id, req.user.id, rating)
      res.json({
        success: true,
        message: '评分成功'
      })
    } catch (error) {
      next(error)
    }
  },

  async getVersions(
    req: AuthRequest,
    res: Response<ApiResponse<PromptVersion[]>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = parseInt(req.params.id)
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: '无效的提示词 ID'
        })
        return
      }
      const versions = await PromptService.getVersions(id)
      res.json({
        success: true,
        data: versions
      })
    } catch (error) {
      next(error)
    }
  },

  async viewPrompt(
    req: AuthRequest,
    res: Response<ApiResponse<null>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = parseInt(req.params.id)
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: '无效的提示词 ID'
        })
        return
      }
      await PromptService.incrementViewCount(id)
      res.json({
        success: true
      })
    } catch (error) {
      next(error)
    }
  }
}

export default PromptController
