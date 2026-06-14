import { Response, NextFunction } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../middleware/auth'
import AdminRepository from '../repositories/AdminRepository'
import ReportRepository from '../repositories/ReportRepository'
import TagService from '../services/TagService'
import PromptService from '../services/PromptService'
import { AppError } from '../middleware/errorHandler'
import type { ApiResponse, Prompt, Report, Tag, HomeConfig, PaginatedResponse, Banner } from '../../shared/types'

const updateReportSchema = z.object({
  status: z.enum(['resolved', 'rejected'])
})

const homeConfigSchema = z.object({
  featuredPrompts: z.array(z.number()).optional(),
  banners: z.array(z.object({
    id: z.number(),
    title: z.string(),
    description: z.string(),
    imageUrl: z.string(),
    linkUrl: z.string()
  })).optional(),
  sortRules: z.object({
    defaultSort: z.string(),
    featuredWeight: z.number()
  }).optional()
})

const createBannerSchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  description: z.string().optional().default(''),
  imageUrl: z.string().min(1, '图片地址不能为空'),
  linkUrl: z.string().optional().default('')
})

const updateBannerSchema = createBannerSchema.partial()

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  status: z.string().optional()
})

export const AdminController = {
  async getPendingPrompts(
    req: AuthRequest,
    res: Response<ApiResponse<PaginatedResponse<Prompt>>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = querySchema.parse(req.query)
      const result = await PromptService.getPending(query.page, query.pageSize)
      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      next(error)
    }
  },

  async approvePrompt(
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
      const success = await AdminRepository.approvePrompt(id)
      if (!success) {
        throw new AppError('提示词不存在', 404)
      }
      res.json({
        success: true,
        message: '审核通过'
      })
    } catch (error) {
      next(error)
    }
  },

  async rejectPrompt(
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
      const { reason } = req.body || {}
      const success = await AdminRepository.rejectPrompt(id, reason)
      if (!success) {
        throw new AppError('提示词不存在', 404)
      }
      res.json({
        success: true,
        message: '审核驳回'
      })
    } catch (error) {
      next(error)
    }
  },

  async getReports(
    req: AuthRequest,
    res: Response<ApiResponse<PaginatedResponse<Report>>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = querySchema.parse(req.query)
      const result = await ReportRepository.findAll(query.status, query.page, query.pageSize)
      const totalPages = Math.ceil(result.total / query.pageSize)
      res.json({
        success: true,
        data: {
          items: result.items,
          total: result.total,
          page: query.page,
          pageSize: query.pageSize,
          totalPages
        }
      })
    } catch (error) {
      next(error)
    }
  },

  async updateReportStatus(
    req: AuthRequest,
    res: Response<ApiResponse<Report>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = parseInt(req.params.id)
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: '无效的举报 ID'
        })
        return
      }
      const { status } = updateReportSchema.parse(req.body)
      const report = await ReportRepository.updateStatus(id, status)
      if (!report) {
        throw new AppError('举报不存在', 404)
      }
      res.json({
        success: true,
        data: report,
        message: '举报处理成功'
      })
    } catch (error) {
      next(error)
    }
  },

  async createTag(
    req: AuthRequest,
    res: Response<ApiResponse<Tag>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = req.body
      const tag = await TagService.createTag(data)
      res.status(201).json({
        success: true,
        data: tag,
        message: '标签创建成功'
      })
    } catch (error) {
      next(error)
    }
  },

  async updateTag(
    req: AuthRequest,
    res: Response<ApiResponse<Tag>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = parseInt(req.params.id)
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: '无效的标签 ID'
        })
        return
      }
      const data = req.body
      const tag = await TagService.updateTag(id, data)
      res.json({
        success: true,
        data: tag,
        message: '标签更新成功'
      })
    } catch (error) {
      next(error)
    }
  },

  async deleteTag(
    req: AuthRequest,
    res: Response<ApiResponse<null>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = parseInt(req.params.id)
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: '无效的标签 ID'
        })
        return
      }
      await TagService.deleteTag(id)
      res.json({
        success: true,
        message: '标签删除成功'
      })
    } catch (error) {
      next(error)
    }
  },

  async getHomeConfig(
    req: AuthRequest,
    res: Response<ApiResponse<HomeConfig>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const config = await AdminRepository.getHomeConfig()
      if (!config) {
        throw new AppError('首页配置不存在', 404)
      }
      res.json({
        success: true,
        data: config
      })
    } catch (error) {
      next(error)
    }
  },

  async updateHomeConfig(
    req: AuthRequest,
    res: Response<ApiResponse<HomeConfig>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = homeConfigSchema.parse(req.body) as Partial<HomeConfig>
      const config = await AdminRepository.updateHomeConfig(data)
      res.json({
        success: true,
        data: config,
        message: '首页配置更新成功'
      })
    } catch (error) {
      next(error)
    }
  },

  async getPendingPromptsCount(
    req: AuthRequest,
    res: Response<ApiResponse<{ count: number }>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const count = await AdminRepository.getPendingPromptsCount()
      res.json({
        success: true,
        data: { count }
      })
    } catch (error) {
      next(error)
    }
  },

  async getReportsCount(
    req: AuthRequest,
    res: Response<ApiResponse<{ count: number }>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const count = await AdminRepository.getReportsCount()
      res.json({
        success: true,
        data: { count }
      })
    } catch (error) {
      next(error)
    }
  },

  async getUsersCount(
    req: AuthRequest,
    res: Response<ApiResponse<{ count: number }>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const count = await AdminRepository.getUsersCount()
      res.json({
        success: true,
        data: { count }
      })
    } catch (error) {
      next(error)
    }
  },

  async getPromptsCount(
    req: AuthRequest,
    res: Response<ApiResponse<{ count: number }>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const count = await AdminRepository.getPromptsCount()
      res.json({
        success: true,
        data: { count }
      })
    } catch (error) {
      next(error)
    }
  },

  async getBanners(
    req: AuthRequest,
    res: Response<ApiResponse<Banner[]>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const banners = await AdminRepository.getBanners()
      res.json({
        success: true,
        data: banners
      })
    } catch (error) {
      next(error)
    }
  },

  async createBanner(
    req: AuthRequest,
    res: Response<ApiResponse<Banner>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = createBannerSchema.parse(req.body) as Omit<Banner, 'id'>
      const banner = await AdminRepository.createBanner(data)
      res.status(201).json({
        success: true,
        data: banner,
        message: 'Banner 创建成功'
      })
    } catch (error) {
      next(error)
    }
  },

  async updateBanner(
    req: AuthRequest,
    res: Response<ApiResponse<Banner>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = parseInt(req.params.id)
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: '无效的 Banner ID'
        })
        return
      }
      const data = updateBannerSchema.parse(req.body)
      const banner = await AdminRepository.updateBanner(id, data)
      if (!banner) {
        throw new AppError('Banner 不存在', 404)
      }
      res.json({
        success: true,
        data: banner,
        message: 'Banner 更新成功'
      })
    } catch (error) {
      next(error)
    }
  },

  async deleteBanner(
    req: AuthRequest,
    res: Response<ApiResponse<null>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = parseInt(req.params.id)
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: '无效的 Banner ID'
        })
        return
      }
      const success = await AdminRepository.deleteBanner(id)
      if (!success) {
        throw new AppError('Banner 不存在', 404)
      }
      res.json({
        success: true,
        message: 'Banner 删除成功'
      })
    } catch (error) {
      next(error)
    }
  },

  async resolveReport(
    req: AuthRequest,
    res: Response<ApiResponse<Report>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = parseInt(req.params.id)
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: '无效的举报 ID'
        })
        return
      }
      const action = req.params.action
      const status = action === 'resolve' ? 'resolved' : action === 'reject' ? 'rejected' : null
      if (!status) {
        res.status(400).json({
          success: false,
          error: '无效的操作'
        })
        return
      }
      const report = await ReportRepository.updateStatus(id, status)
      if (!report) {
        throw new AppError('举报不存在', 404)
      }
      res.json({
        success: true,
        data: report,
        message: status === 'resolved' ? '举报已处理' : '举报已驳回'
      })
    } catch (error) {
      next(error)
    }
  },

  async removePrompt(
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
      const success = await AdminRepository.removePrompt(id)
      if (!success) {
        throw new AppError('提示词不存在', 404)
      }
      res.json({
        success: true,
        message: '内容已下架'
      })
    } catch (error) {
      next(error)
    }
  },

  async updatePromptAdmin(
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
      const success = await AdminRepository.updatePromptAdmin(id, req.body)
      if (!success) {
        throw new AppError('提示词不存在', 404)
      }
      res.json({
        success: true,
        message: '提示词更新成功'
      })
    } catch (error) {
      next(error)
    }
  }
}

export default AdminController
