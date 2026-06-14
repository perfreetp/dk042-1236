import db from '../db'
import type { Prompt, PromptVersion, Tag, User } from '../../shared/types'
import TagRepository from './TagRepository'
import UserRepository from './UserRepository'

interface PromptRow {
  id: number
  title: string
  content: string
  description: string
  author_id: number
  purpose: string
  model: string
  language: string
  difficulty: string
  input_example: string
  output_example: string
  use_cases: string
  version: string
  status: string
  rating: number
  rating_count: number
  copy_count: number
  fork_count: number
  favorite_count: number
  view_count: number
  is_featured: number
  created_at: string
  updated_at: string
}

interface PromptVersionRow {
  id: number
  prompt_id: number
  version: string
  content: string
  description: string
  changelog: string
  created_at: string
}

function mapPromptVersionRow(row: PromptVersionRow): PromptVersion {
  return {
    id: row.id,
    promptId: row.prompt_id,
    version: row.version,
    content: row.content,
    description: row.description || '',
    changelog: row.changelog || '',
    createdAt: row.created_at
  }
}

async function mapPromptRow(row: PromptRow): Promise<Prompt> {
  const author = await UserRepository.findById(row.author_id)
  const tags = await getPromptTags(row.id)
  const versionHistory = await getPromptVersions(row.id)

  return {
    id: row.id,
    title: row.title,
    content: row.content,
    description: row.description || '',
    authorId: row.author_id,
    author: author!,
    tags,
    purpose: row.purpose || '',
    model: row.model || '',
    language: row.language || '',
    difficulty: row.difficulty as 'beginner' | 'intermediate' | 'advanced',
    inputExample: row.input_example || '',
    outputExample: row.output_example || '',
    useCases: row.use_cases ? JSON.parse(row.use_cases) : [],
    version: row.version,
    versionHistory,
    status: row.status as 'pending' | 'approved' | 'rejected' | 'removed',
    rating: row.rating || 0,
    ratingCount: row.rating_count || 0,
    copyCount: row.copy_count || 0,
    forkCount: row.fork_count || 0,
    favoriteCount: row.favorite_count || 0,
    viewCount: row.view_count || 0,
    isFeatured: row.is_featured === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

async function getPromptTags(promptId: number): Promise<Tag[]> {
  const sql = `
    SELECT t.* FROM tags t
    INNER JOIN prompt_tags pt ON pt.tag_id = t.id
    WHERE pt.prompt_id = ?
  `
  const rows = db.getMany<{ id: number; name: string; category: string; color: string }>(sql, [promptId])
  return Promise.all(rows.map(row => TagRepository.findById(row.id))).then(results =>
    results.filter((t): t is Tag => t !== null)
  )
}

async function getPromptVersions(promptId: number): Promise<PromptVersion[]> {
  const sql = `
    SELECT * FROM prompt_versions
    WHERE prompt_id = ?
    ORDER BY created_at DESC
  `
  const rows = db.getMany<PromptVersionRow>(sql, [promptId])
  return rows.map(mapPromptVersionRow)
}

export interface PromptFilters {
  purpose?: string
  model?: string
  language?: string
  difficulty?: string
  search?: string
  status?: string
  authorId?: number
  isFeatured?: boolean
}

export interface PromptSort {
  field: 'createdAt' | 'rating' | 'copyCount' | 'favoriteCount'
  order: 'asc' | 'desc'
}

export const PromptRepository = {
  async findAll(
    filters: PromptFilters = {},
    sort: PromptSort = { field: 'createdAt', order: 'desc' },
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ items: Prompt[]; total: number }> {
    const whereClauses: string[] = []
    const params: any[] = []

    if (filters.purpose) {
      whereClauses.push('p.purpose = ?')
      params.push(filters.purpose)
    }
    if (filters.model) {
      whereClauses.push('p.model = ?')
      params.push(filters.model)
    }
    if (filters.language) {
      whereClauses.push('p.language = ?')
      params.push(filters.language)
    }
    if (filters.difficulty) {
      whereClauses.push('p.difficulty = ?')
      params.push(filters.difficulty)
    }
    if (filters.search) {
      whereClauses.push('(p.title LIKE ? OR p.description LIKE ? OR p.content LIKE ?)')
      const searchTerm = `%${filters.search}%`
      params.push(searchTerm, searchTerm, searchTerm)
    }
    if (filters.status) {
      whereClauses.push('p.status = ?')
      params.push(filters.status)
    }
    if (filters.authorId) {
      whereClauses.push('p.author_id = ?')
      params.push(filters.authorId)
    }
    if (filters.isFeatured !== undefined) {
      whereClauses.push('p.is_featured = ?')
      params.push(filters.isFeatured ? 1 : 0)
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const sortMap: Record<string, string> = {
      createdAt: 'p.created_at',
      rating: 'p.rating',
      copyCount: 'p.copy_count',
      favoriteCount: 'p.favorite_count'
    }
    const orderSql = `ORDER BY ${sortMap[sort.field] || 'p.created_at'} ${sort.order.toUpperCase()}`

    const countSql = `
      SELECT COUNT(*) as total FROM prompts p
      ${whereSql}
    `
    const countResult = db.getOne<{ total: number }>(countSql, params)
    const total = countResult?.total || 0

    const offset = (page - 1) * pageSize
    const dataSql = `
      SELECT p.* FROM prompts p
      ${whereSql}
      ${orderSql}
      LIMIT ? OFFSET ?
    `
    const dataParams = [...params, pageSize, offset]
    const rows = db.getMany<PromptRow>(dataSql, dataParams)

    const items = await Promise.all(rows.map(mapPromptRow))
    return { items, total }
  },

  async findById(id: number): Promise<Prompt | null> {
    const sql = 'SELECT * FROM prompts WHERE id = ?'
    const row = db.getOne<PromptRow>(sql, [id])
    return row ? mapPromptRow(row) : null
  },

  async create(data: {
    title: string
    content: string
    description: string
    authorId: number
    purpose: string
    model: string
    language: string
    difficulty: string
    inputExample: string
    outputExample: string
    useCases: string[]
    tagIds: number[]
    version: string
    changelog: string
  }): Promise<Prompt> {
    const result = db.runQuery(
      `INSERT INTO prompts (title, content, description, author_id, purpose, model, language, difficulty,
        input_example, output_example, use_cases, version, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        data.title,
        data.content,
        data.description,
        data.authorId,
        data.purpose,
        data.model,
        data.language,
        data.difficulty,
        data.inputExample,
        data.outputExample,
        JSON.stringify(data.useCases),
        data.version
      ]
    )
    const promptId = result.lastInsertRowid as number

    for (const tagId of data.tagIds) {
      db.runQuery('INSERT OR IGNORE INTO prompt_tags (prompt_id, tag_id) VALUES (?, ?)', [promptId, tagId])
    }

    db.runQuery(
      `INSERT INTO prompt_versions (prompt_id, version, content, description, changelog)
       VALUES (?, ?, ?, ?, ?)`,
      [promptId, data.version, data.content, data.description, data.changelog]
    )

    return (await PromptRepository.findById(promptId))!
  },

  async update(id: number, data: Partial<{
    title: string
    content: string
    description: string
    purpose: string
    model: string
    language: string
    difficulty: string
    inputExample: string
    outputExample: string
    useCases: string[]
    tagIds: number[]
    version: string
    changelog: string
    status: string
    isFeatured: boolean
  }>): Promise<Prompt | null> {
    const fields: string[] = []
    const params: any[] = []

    if (data.title !== undefined) {
      fields.push('title = ?')
      params.push(data.title)
    }
    if (data.content !== undefined) {
      fields.push('content = ?')
      params.push(data.content)
    }
    if (data.description !== undefined) {
      fields.push('description = ?')
      params.push(data.description)
    }
    if (data.purpose !== undefined) {
      fields.push('purpose = ?')
      params.push(data.purpose)
    }
    if (data.model !== undefined) {
      fields.push('model = ?')
      params.push(data.model)
    }
    if (data.language !== undefined) {
      fields.push('language = ?')
      params.push(data.language)
    }
    if (data.difficulty !== undefined) {
      fields.push('difficulty = ?')
      params.push(data.difficulty)
    }
    if (data.inputExample !== undefined) {
      fields.push('input_example = ?')
      params.push(data.inputExample)
    }
    if (data.outputExample !== undefined) {
      fields.push('output_example = ?')
      params.push(data.outputExample)
    }
    if (data.useCases !== undefined) {
      fields.push('use_cases = ?')
      params.push(JSON.stringify(data.useCases))
    }
    if (data.version !== undefined) {
      fields.push('version = ?')
      params.push(data.version)
    }
    if (data.status !== undefined) {
      fields.push('status = ?')
      params.push(data.status)
    }
    if (data.isFeatured !== undefined) {
      fields.push('is_featured = ?')
      params.push(data.isFeatured ? 1 : 0)
    }

    fields.push('updated_at = CURRENT_TIMESTAMP')
    params.push(id)

    if (fields.length > 1) {
      db.runQuery(`UPDATE prompts SET ${fields.join(', ')} WHERE id = ?`, params)
    }

    if (data.tagIds !== undefined) {
      db.runQuery('DELETE FROM prompt_tags WHERE prompt_id = ?', [id])
      for (const tagId of data.tagIds) {
        db.runQuery('INSERT OR IGNORE INTO prompt_tags (prompt_id, tag_id) VALUES (?, ?)', [id, tagId])
      }
    }

    if (data.version && data.content && data.changelog !== undefined) {
      db.runQuery(
        `INSERT INTO prompt_versions (prompt_id, version, content, description, changelog)
         VALUES (?, ?, ?, ?, ?)`,
        [id, data.version, data.content, data.description || '', data.changelog]
      )
    }

    return PromptRepository.findById(id)
  },

  async delete(id: number): Promise<boolean> {
    db.runQuery('DELETE FROM prompt_tags WHERE prompt_id = ?', [id])
    db.runQuery('DELETE FROM prompt_versions WHERE prompt_id = ?', [id])
    db.runQuery('DELETE FROM favorites WHERE prompt_id = ?', [id])
    db.runQuery('DELETE FROM comments WHERE prompt_id = ?', [id])
    db.runQuery('DELETE FROM reports WHERE prompt_id = ?', [id])
    const result = db.runQuery('DELETE FROM prompts WHERE id = ?', [id])
    return (result.changes as number) > 0
  },

  async incrementCopyCount(id: number): Promise<boolean> {
    const result = db.runQuery('UPDATE prompts SET copy_count = copy_count + 1 WHERE id = ?', [id])
    return (result.changes as number) > 0
  },

  async incrementForkCount(id: number): Promise<boolean> {
    const result = db.runQuery('UPDATE prompts SET fork_count = fork_count + 1 WHERE id = ?', [id])
    return (result.changes as number) > 0
  },

  async incrementViewCount(id: number): Promise<boolean> {
    const result = db.runQuery('UPDATE prompts SET view_count = view_count + 1 WHERE id = ?', [id])
    return (result.changes as number) > 0
  },

  async rate(promptId: number, userId: number, rating: number): Promise<boolean> {
    const existing = db.getOne<{ rating: number }>(
      'SELECT rating FROM ratings WHERE user_id = ? AND prompt_id = ?',
      [userId, promptId]
    )

    if (existing) {
      db.runQuery(
        'UPDATE ratings SET rating = ?, created_at = CURRENT_TIMESTAMP WHERE user_id = ? AND prompt_id = ?',
        [rating, userId, promptId]
      )
    } else {
      db.runQuery(
        'INSERT INTO ratings (user_id, prompt_id, rating) VALUES (?, ?, ?)',
        [userId, promptId, rating]
      )
    }

    const stats = db.getOne<{ avg_rating: number; count: number }>(
      `SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM ratings WHERE prompt_id = ?`,
      [promptId]
    )

    db.runQuery(
      'UPDATE prompts SET rating = ?, rating_count = ? WHERE id = ?',
      [stats?.avg_rating || 0, stats?.count || 0, promptId]
    )

    return true
  },

  async getVersions(promptId: number): Promise<PromptVersion[]> {
    return getPromptVersions(promptId)
  },

  async getPending(page: number = 1, pageSize: number = 20): Promise<{ items: Prompt[]; total: number }> {
    return PromptRepository.findAll(
      { status: 'pending' },
      { field: 'createdAt', order: 'asc' },
      page,
      pageSize
    )
  }
}

export default PromptRepository
