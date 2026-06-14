import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import type { ApiResponse } from '../../shared/types'

export class AppError extends Error {
  statusCode: number
  errorCode?: string

  constructor(message: string, statusCode: number = 400, errorCode?: string) {
    super(message)
    this.statusCode = statusCode
    this.errorCode = errorCode
    this.name = 'AppError'
  }
}

export function errorHandler(
  error: Error,
  req: Request,
  res: Response<ApiResponse<null>>,
  next: NextFunction
): void {
  console.error('Error:', error)

  if (error instanceof ZodError) {
    const errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
    res.status(400).json({
      success: false,
      error: `请求参数错误: ${errors}`
    })
    return
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message
    })
    return
  }

  res.status(500).json({
    success: false,
    error: '服务器内部错误'
  })
}

export function notFoundHandler(req: Request, res: Response<ApiResponse<null>>): void {
  res.status(404).json({
    success: false,
    error: 'API 不存在'
  })
}

export default errorHandler
