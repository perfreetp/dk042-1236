import PromptRepository, { PromptFilters, PromptSort } from '../repositories/PromptRepository'
import FavoriteRepository from '../repositories/FavoriteRepository'
import { AppError } from '../middleware/errorHandler'
import type { Prompt, CreatePromptRequest, PromptVersion, PaginatedResponse } from '../../shared/types'

export const PromptService = {
  async getPrompts(
    filters: PromptFilters = {},
    sort: PromptSort = { field: 'createdAt', order: 'desc' },
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<Prompt>> {
    const { items, total } = await PromptRepository.findAll(filters, sort, page, pageSize)
    const totalPages = Math.ceil(total / pageSize)

    return {
      items,
      total,
      page,
      pageSize,
      totalPages
    }
  },

  async getPromptById(id: number): Promise<Prompt> {
    const prompt = await PromptRepository.findById(id)
    if (!prompt) {
      throw new AppError('提示词不存在', 404)
    }
    return prompt
  },

  async createPrompt(authorId: number, data: CreatePromptRequest): Promise<Prompt> {
    return PromptRepository.create({
      ...data,
      authorId,
      version: '1.0.0'
    })
  },

  async updatePrompt(promptId: number, userId: number, data: Partial<CreatePromptRequest> & { changelog?: string }): Promise<Prompt> {
    const prompt = await PromptRepository.findById(promptId)
    if (!prompt) {
      throw new AppError('提示词不存在', 404)
    }

    if (prompt.authorId !== userId) {
      throw new AppError('无权限修改此提示词', 403)
    }

    const versionParts = prompt.version.split('.').map(Number)
    versionParts[2]++
    const newVersion = versionParts.join('.')

    return PromptRepository.update(promptId, {
      ...data,
      version: newVersion,
      status: 'pending',
      changelog: data.changelog || ''
    }).then(p => p!)
  },

  async deletePrompt(promptId: number, userId: number): Promise<boolean> {
    const prompt = await PromptRepository.findById(promptId)
    if (!prompt) {
      throw new AppError('提示词不存在', 404)
    }

    if (prompt.authorId !== userId) {
      throw new AppError('无权限删除此提示词', 403)
    }

    return PromptRepository.delete(promptId)
  },

  async incrementCopyCount(promptId: number): Promise<boolean> {
    const prompt = await PromptRepository.findById(promptId)
    if (!prompt) {
      throw new AppError('提示词不存在', 404)
    }
    return PromptRepository.incrementCopyCount(promptId)
  },

  async incrementViewCount(promptId: number): Promise<boolean> {
    return PromptRepository.incrementViewCount(promptId)
  },

  async forkPrompt(promptId: number, userId: number): Promise<Prompt> {
    const originalPrompt = await PromptRepository.findById(promptId)
    if (!originalPrompt) {
      throw new AppError('提示词不存在', 404)
    }

    await PromptRepository.incrementForkCount(promptId)

    const newPrompt = await PromptRepository.create({
      title: `${originalPrompt.title} (派生)`,
      content: originalPrompt.content,
      description: originalPrompt.description,
      authorId: userId,
      purpose: originalPrompt.purpose,
      model: originalPrompt.model,
      language: originalPrompt.language,
      difficulty: originalPrompt.difficulty,
      inputExample: originalPrompt.inputExample,
      outputExample: originalPrompt.outputExample,
      useCases: originalPrompt.useCases,
      tagIds: originalPrompt.tags.map(t => t.id),
      version: '1.0.0',
      changelog: `从提示词 #${promptId} 派生`
    })

    return newPrompt
  },

  async ratePrompt(promptId: number, userId: number, rating: number): Promise<boolean> {
    if (rating < 1 || rating > 5) {
      throw new AppError('评分必须在 1-5 之间', 400)
    }

    const prompt = await PromptRepository.findById(promptId)
    if (!prompt) {
      throw new AppError('提示词不存在', 404)
    }

    return PromptRepository.rate(promptId, userId, rating)
  },

  async getVersions(promptId: number): Promise<PromptVersion[]> {
    const prompt = await PromptRepository.findById(promptId)
    if (!prompt) {
      throw new AppError('提示词不存在', 404)
    }
    return PromptRepository.getVersions(promptId)
  },

  async getPending(page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<Prompt>> {
    const { items, total } = await PromptRepository.getPending(page, pageSize)
    const totalPages = Math.ceil(total / pageSize)

    return {
      items,
      total,
      page,
      pageSize,
      totalPages
    }
  },

  async toggleFavorite(promptId: number, userId: number, groupId?: number | null): Promise<{ favorited: boolean }> {
    const prompt = await PromptRepository.findById(promptId)
    if (!prompt) {
      throw new AppError('提示词不存在', 404)
    }

    const existing = await FavoriteRepository.findByUserAndPrompt(userId, promptId)

    if (existing) {
      await FavoriteRepository.remove(userId, promptId)
      return { favorited: false }
    } else {
      await FavoriteRepository.add(userId, promptId, groupId)
      return { favorited: true }
    }
  }
}

export default PromptService
