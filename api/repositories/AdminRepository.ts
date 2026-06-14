import db from '../db'
import type { HomeConfig, Banner } from '../../shared/types'

interface HomeConfigRow {
  id: number
  featured_prompts: string
  banners: string
  sort_rules: string
  updated_at: string
}

function mapHomeConfigRow(row: HomeConfigRow): HomeConfig {
  return {
    featuredPrompts: JSON.parse(row.featured_prompts || '[]'),
    banners: JSON.parse(row.banners || '[]'),
    sortRules: JSON.parse(row.sort_rules || '{}')
  }
}

export const AdminRepository = {
  async approvePrompt(promptId: number): Promise<boolean> {
    const result = db.runQuery(
      "UPDATE prompts SET status = 'approved' WHERE id = ?",
      [promptId]
    )
    return (result.changes as number) > 0
  },

  async rejectPrompt(promptId: number, reason?: string): Promise<boolean> {
    const result = db.runQuery(
      "UPDATE prompts SET status = 'rejected', reject_reason = ? WHERE id = ?",
      [reason || null, promptId]
    )
    return (result.changes as number) > 0
  },

  async getHomeConfig(): Promise<HomeConfig | null> {
    const sql = 'SELECT * FROM home_config ORDER BY id DESC LIMIT 1'
    const row = db.getOne<HomeConfigRow>(sql)
    return row ? mapHomeConfigRow(row) : null
  },

  async updateHomeConfig(config: Partial<HomeConfig>): Promise<HomeConfig> {
    const existing = await AdminRepository.getHomeConfig()
    const merged: HomeConfig = {
      featuredPrompts: config.featuredPrompts ?? existing?.featuredPrompts ?? [],
      banners: config.banners ?? existing?.banners ?? [],
      sortRules: config.sortRules ?? existing?.sortRules ?? { defaultSort: 'createdAt', featuredWeight: 2 }
    }

    if (existing) {
      db.runQuery(
        `UPDATE home_config SET featured_prompts = ?, banners = ?, sort_rules = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = (SELECT MAX(id) FROM home_config)`,
        [
          JSON.stringify(merged.featuredPrompts),
          JSON.stringify(merged.banners),
          JSON.stringify(merged.sortRules)
        ]
      )
    } else {
      db.runQuery(
        `INSERT INTO home_config (featured_prompts, banners, sort_rules) VALUES (?, ?, ?)`,
        [
          JSON.stringify(merged.featuredPrompts),
          JSON.stringify(merged.banners),
          JSON.stringify(merged.sortRules)
        ]
      )
    }

    return (await AdminRepository.getHomeConfig())!
  },

  async getPendingPromptsCount(): Promise<number> {
    const result = db.getOne<{ count: number }>("SELECT COUNT(*) as count FROM prompts WHERE status = 'pending'")
    return result?.count || 0
  },

  async getReportsCount(): Promise<number> {
    const result = db.getOne<{ count: number }>("SELECT COUNT(*) as count FROM reports WHERE status = 'pending'")
    return result?.count || 0
  },

  async getUsersCount(): Promise<number> {
    const result = db.getOne<{ count: number }>('SELECT COUNT(*) as count FROM users')
    return result?.count || 0
  },

  async getPromptsCount(): Promise<number> {
    const result = db.getOne<{ count: number }>('SELECT COUNT(*) as count FROM prompts')
    return result?.count || 0
  },

  async getBanners(): Promise<Banner[]> {
    const config = await AdminRepository.getHomeConfig()
    return config?.banners || []
  },

  async createBanner(banner: Omit<Banner, 'id'>): Promise<Banner> {
    const config = await AdminRepository.getHomeConfig()
    const banners = config?.banners || []
    const newId = banners.length > 0 ? Math.max(...banners.map(b => b.id)) + 1 : 1
    const newBanner: Banner = { ...banner, id: newId }
    banners.push(newBanner)
    await AdminRepository.updateHomeConfig({ banners })
    return newBanner
  },

  async updateBanner(id: number, bannerData: Partial<Omit<Banner, 'id'>>): Promise<Banner | null> {
    const config = await AdminRepository.getHomeConfig()
    const banners = config?.banners || []
    const index = banners.findIndex(b => b.id === id)
    if (index === -1) return null
    banners[index] = { ...banners[index], ...bannerData }
    await AdminRepository.updateHomeConfig({ banners })
    return banners[index]
  },

  async deleteBanner(id: number): Promise<boolean> {
    const config = await AdminRepository.getHomeConfig()
    const banners = config?.banners || []
    const filtered = banners.filter(b => b.id !== id)
    if (filtered.length === banners.length) return false
    await AdminRepository.updateHomeConfig({ banners: filtered })
    return true
  },

  async removePrompt(promptId: number): Promise<boolean> {
    const result = db.runQuery(
      "UPDATE prompts SET status = 'removed' WHERE id = ?",
      [promptId]
    )
    return (result.changes as number) > 0
  },

  async updatePromptAdmin(promptId: number, data: { isFeatured?: boolean }): Promise<boolean> {
    const fields: string[] = []
    const params: (string | number | null)[] = []

    if (data.isFeatured !== undefined) {
      fields.push('is_featured = ?')
      params.push(data.isFeatured ? 1 : 0)
    }

    if (fields.length === 0) return true

    params.push(promptId)
    const result = db.runQuery(`UPDATE prompts SET ${fields.join(', ')} WHERE id = ?`, params)
    return (result.changes as number) > 0
  }
}

export default AdminRepository
