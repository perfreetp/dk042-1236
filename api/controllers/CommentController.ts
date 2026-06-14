import { Response, NextFunction } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../middleware/auth'
import CommentRepository from '../repositories/CommentRepository'
import PromptRepository from '../repositories/PromptRepository'
import { AppError } from '../middleware/errorHandler'
import type { ApiResponse, Comment } from '../../shared/types'

const createCommentSchema = z.object({
  promptId: z.number(),
  content: z.string().min(1, '评论内容不能为空').max(1000, '评论最多 1000 个字符'),
  parentId: z.number().optional().nullable()
})

export const CommentController = {
  async getComments(
    req: AuthRequest,
    res: Response<ApiResponse<Comment[]>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const promptId = parseInt(req.params.promptId)
      if (isNaN(promptId)) {
        res.status(400).json({
          success: false,
          error: '无效的提示词 ID'
        })
        return
      }
      const currentUserId = req.user?.id
      const comments = await CommentRepository.findByPrompt(promptId, currentUserId)
      res.json({
        success: true,
        data: comments
      })
    } catch (error) {
      next(error)
    }
  },

  async createComment(
    req: AuthRequest,
    res: Response<ApiResponse<Comment>>,
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
      const data = createCommentSchema.parse(req.body)

      const prompt = await PromptRepository.findById(data.promptId)
      if (!prompt) {
        throw new AppError('提示词不存在', 404)
      }

      const comment = await CommentRepository.create({
        promptId: data.promptId,
        userId: req.user.id,
        content: data.content,
        parentId: data.parentId || null
      })

      res.status(201).json({
        success: true,
        data: comment,
        message: '评论发布成功'
      })
    } catch (error) {
      next(error)
    }
  },

  async likeComment(
    req: AuthRequest,
    res: Response<ApiResponse<{ liked: boolean }>>,
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
      const commentId = parseInt(req.params.id)
      if (isNaN(commentId)) {
        res.status(400).json({
          success: false,
          error: '无效的评论 ID'
        })
        return
      }

      const comment = await CommentRepository.findById(commentId)
      if (!comment) {
        throw new AppError('评论不存在', 404)
      }

      const liked = await CommentRepository.like(commentId, req.user.id)

      res.json({
        success: true,
        data: { liked },
        message: liked ? '点赞成功' : '取消点赞成功'
      })
    } catch (error) {
      next(error)
    }
  }
}

export default CommentController
