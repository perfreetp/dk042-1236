import { Response, NextFunction } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../middleware/auth'
import TagService from '../services/TagService'
import type { ApiResponse, Tag } from '../../shared/types'

const createTagSchema = z.object({
  name: z.string().min(1, '标签名称不能为空').max(50, '标签名称最多 50 个字符'),
  category: z.enum(['purpose', 'model', 'language', 'difficulty']),
  color: z.string().min(1, '颜色不能为空')
})

const updateTagSchema = createTagSchema.partial()

export const TagController = {
  async getTags(
    req: AuthRequest,
    res: Response<ApiResponse<Tag[]>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const { category } = req.query
      let tags: Tag[]
      if (category && typeof category === 'string') {
        tags = await TagService.getTagsByCategory(category)
      } else {
        tags = await TagService.getAllTags()
      }
      res.json({
        success: true,
        data: tags
      })
    } catch (error) {
      next(error)
    }
  },

  async getTagById(
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
      const tag = await TagService.getTagById(id)
      res.json({
        success: true,
        data: tag
      })
    } catch (error) {
      next(error)
    }
  }
}

export default TagController
