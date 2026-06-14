import db from '../db'
import type { HomeConfig, Banner } from '../../shared/types'
import PromptRepository from './PromptRepository'

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

  async rejectPrompt(promptId: number): Promise<boolean> {
    const result = db.runQuery(
      "UPDATE prompts SET status = 'rejected' WHERE id = ?",
      [promptId]
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
  }
}

export default AdminRepository
