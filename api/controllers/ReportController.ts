import { Response, NextFunction } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../middleware/auth'
import ReportRepository from '../repositories/ReportRepository'
import PromptRepository from '../repositories/PromptRepository'
import { AppError } from '../middleware/errorHandler'
import type { ApiResponse, Report } from '../../shared/types'

const createReportSchema = z.object({
  promptId: z.number(),
  reason: z.string().min(1, '举报原因不能为空').max(100, '举报原因最多 100 个字符'),
  description: z.string().max(1000, '描述最多 1000 个字符').optional()
})

export const ReportController = {
  async createReport(
    req: AuthRequest,
    res: Response<ApiResponse<Report>>,
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
      const data = createReportSchema.parse(req.body)

      const prompt = await PromptRepository.findById(data.promptId)
      if (!prompt) {
        throw new AppError('提示词不存在', 404)
      }

      const report = await ReportRepository.create({
        promptId: data.promptId,
        reporterId: req.user.id,
        reason: data.reason,
        description: data.description || ''
      })

      res.status(201).json({
        success: true,
        data: report,
        message: '举报提交成功'
      })
    } catch (error) {
      next(error)
    }
  }
}

export default ReportController
