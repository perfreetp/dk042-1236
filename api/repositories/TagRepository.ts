import db from '../db'
import type { Tag } from '../../shared/types'

interface TagRow {
  id: number
  name: string
  category: string
  color: string
  prompt_count: number
}

function mapTagRow(row: TagRow): Tag {
  return {
    id: row.id,
    name: row.name,
    category: row.category as 'purpose' | 'model' | 'language' | 'difficulty',
    color: row.color,
    promptCount: row.prompt_count || 0
  }
}

export const TagRepository = {
  async findAll(): Promise<Tag[]> {
    const sql = `
      SELECT t.*,
        (SELECT COUNT(*) FROM prompt_tags pt WHERE pt.tag_id = t.id) as prompt_count
      FROM tags t
      ORDER BY t.category, t.name
    `
    const rows = db.getMany<TagRow>(sql)
    return rows.map(mapTagRow)
  },

  async findByCategory(category: string): Promise<Tag[]> {
    const sql = `
      SELECT t.*,
        (SELECT COUNT(*) FROM prompt_tags pt WHERE pt.tag_id = t.id) as prompt_count
      FROM tags t
      WHERE t.category = ?
      ORDER BY t.name
    `
    const rows = db.getMany<TagRow>(sql, [category])
    return rows.map(mapTagRow)
  },

  async findById(id: number): Promise<Tag | null> {
    const sql = `
      SELECT t.*,
        (SELECT COUNT(*) FROM prompt_tags pt WHERE pt.tag_id = t.id) as prompt_count
      FROM tags t
      WHERE t.id = ?
    `
    const row = db.getOne<TagRow>(sql, [id])
    return row ? mapTagRow(row) : null
  },

  async create(data: { name: string; category: string; color: string }): Promise<Tag> {
    const result = db.runQuery(
      'INSERT INTO tags (name, category, color) VALUES (?, ?, ?)',
      [data.name, data.category, data.color]
    )
    const tagId = result.lastInsertRowid as number
    return (await TagRepository.findById(tagId))!
  },

  async update(id: number, data: Partial<{ name: string; category: string; color: string }>): Promise<Tag | null> {
    const fields: string[] = []
    const params: any[] = []

    if (data.name !== undefined) {
      fields.push('name = ?')
      params.push(data.name)
    }
    if (data.category !== undefined) {
      fields.push('category = ?')
      params.push(data.category)
    }
    if (data.color !== undefined) {
      fields.push('color = ?')
      params.push(data.color)
    }

    if (fields.length === 0) return TagRepository.findById(id)

    params.push(id)
    db.runQuery(`UPDATE tags SET ${fields.join(', ')} WHERE id = ?`, params)
    return TagRepository.findById(id)
  },

  async delete(id: number): Promise<boolean> {
    db.runQuery('DELETE FROM prompt_tags WHERE tag_id = ?', [id])
    const result = db.runQuery('DELETE FROM tags WHERE id = ?', [id])
    return (result.changes as number) > 0
  }
}

export default TagRepository
