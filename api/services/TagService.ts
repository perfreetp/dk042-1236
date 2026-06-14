import TagRepository from '../repositories/TagRepository'
import { AppError } from '../middleware/errorHandler'
import type { Tag } from '../../shared/types'

export const TagService = {
  async getAllTags(): Promise<Tag[]> {
    return TagRepository.findAll()
  },

  async getTagsByCategory(category: string): Promise<Tag[]> {
    const validCategories = ['purpose', 'model', 'language', 'difficulty']
    if (!validCategories.includes(category)) {
      throw new AppError('无效的标签分类', 400)
    }
    return TagRepository.findByCategory(category)
  },

  async getTagById(id: number): Promise<Tag> {
    const tag = await TagRepository.findById(id)
    if (!tag) {
      throw new AppError('标签不存在', 404)
    }
    return tag
  },

  async createTag(data: { name: string; category: string; color: string }): Promise<Tag> {
    const validCategories = ['purpose', 'model', 'language', 'difficulty']
    if (!validCategories.includes(data.category)) {
      throw new AppError('无效的标签分类', 400)
    }

    const allTags = await TagRepository.findAll()
    const existing = allTags.find(t => t.name.toLowerCase() === data.name.toLowerCase())
    if (existing) {
      throw new AppError('标签名称已存在', 400)
    }

    return TagRepository.create(data)
  },

  async updateTag(id: number, data: Partial<{ name: string; category: string; color: string }>): Promise<Tag> {
    const tag = await TagRepository.findById(id)
    if (!tag) {
      throw new AppError('标签不存在', 404)
    }

    if (data.category) {
      const validCategories = ['purpose', 'model', 'language', 'difficulty']
      if (!validCategories.includes(data.category)) {
        throw new AppError('无效的标签分类', 400)
      }
    }

    const updated = await TagRepository.update(id, data)
    if (!updated) {
      throw new AppError('更新标签失败', 500)
    }
    return updated
  },

  async deleteTag(id: number): Promise<boolean> {
    const tag = await TagRepository.findById(id)
    if (!tag) {
      throw new AppError('标签不存在', 404)
    }

    return TagRepository.delete(id)
  }
}

export default TagService
