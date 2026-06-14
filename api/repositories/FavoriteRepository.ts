import db from '../db'
import type { Favorite, FavoriteGroup, Prompt } from '../../shared/types'
import PromptRepository from './PromptRepository'

interface FavoriteRow {
  id: number
  user_id: number
  prompt_id: number
  group_id: number | null
  created_at: string
}

interface FavoriteGroupRow {
  id: number
  user_id: number
  name: string
  created_at: string
}

async function mapFavoriteRow(row: FavoriteRow): Promise<Favorite> {
  const prompt = await PromptRepository.findById(row.prompt_id)
  return {
    id: row.id,
    userId: row.user_id,
    promptId: row.prompt_id,
    prompt: prompt as Prompt,
    groupId: row.group_id,
    createdAt: row.created_at
  }
}

function mapFavoriteGroupRow(row: FavoriteGroupRow & { prompt_count?: number }): FavoriteGroup {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    promptCount: row.prompt_count || 0
  }
}

export const FavoriteRepository = {
  async findByUser(userId: number, groupId?: number | null): Promise<Favorite[]> {
    let sql = `
      SELECT * FROM favorites
      WHERE user_id = ?
    `
    const params: any[] = [userId]

    if (groupId !== undefined) {
      if (groupId === null) {
        sql += ' AND group_id IS NULL'
      } else {
        sql += ' AND group_id = ?'
        params.push(groupId)
      }
    }

    sql += ' ORDER BY created_at DESC'

    const rows = db.getMany<FavoriteRow>(sql, params)
    return Promise.all(rows.map(mapFavoriteRow))
  },

  async findByUserAndPrompt(userId: number, promptId: number): Promise<Favorite | null> {
    const sql = 'SELECT * FROM favorites WHERE user_id = ? AND prompt_id = ?'
    const row = db.getOne<FavoriteRow>(sql, [userId, promptId])
    return row ? mapFavoriteRow(row) : null
  },

  async checkFavorite(userId: number, promptId: number): Promise<boolean> {
    const sql = 'SELECT 1 FROM favorites WHERE user_id = ? AND prompt_id = ?'
    const row = db.getOne<{ '1': number }>(sql, [userId, promptId])
    return !!row
  },

  async add(userId: number, promptId: number, groupId?: number | null): Promise<Favorite> {
    const params: any[] = [userId, promptId]
    let columns = 'user_id, prompt_id'
    let values = '?, ?'

    if (groupId !== undefined) {
      columns += ', group_id'
      values += ', ?'
      params.push(groupId)
    }

    const result = db.runQuery(
      `INSERT INTO favorites (${columns}) VALUES (${values})`,
      params
    )

    db.runQuery(
      'UPDATE prompts SET favorite_count = favorite_count + 1 WHERE id = ?',
      [promptId]
    )

    const favoriteId = result.lastInsertRowid as number
    const sql = 'SELECT * FROM favorites WHERE id = ?'
    const row = db.getOne<FavoriteRow>(sql, [favoriteId])
    return mapFavoriteRow(row!)
  },

  async remove(userId: number, promptId: number): Promise<boolean> {
    const result = db.runQuery(
      'DELETE FROM favorites WHERE user_id = ? AND prompt_id = ?',
      [userId, promptId]
    )

    if ((result.changes as number) > 0) {
      db.runQuery(
        'UPDATE prompts SET favorite_count = favorite_count - 1 WHERE id = ? AND favorite_count > 0',
        [promptId]
      )
      return true
    }
    return false
  },

  async createGroup(userId: number, name: string): Promise<FavoriteGroup> {
    const result = db.runQuery(
      'INSERT INTO favorite_groups (user_id, name) VALUES (?, ?)',
      [userId, name]
    )
    const groupId = result.lastInsertRowid as number
    return (await FavoriteRepository.getGroupById(groupId))!
  },

  async getGroups(userId: number): Promise<FavoriteGroup[]> {
    const sql = `
      SELECT fg.*,
        (SELECT COUNT(*) FROM favorites f WHERE f.group_id = fg.id) as prompt_count
      FROM favorite_groups fg
      WHERE fg.user_id = ?
      ORDER BY fg.created_at DESC
    `
    const rows = db.getMany<FavoriteGroupRow & { prompt_count: number }>(sql, [userId])
    return rows.map(mapFavoriteGroupRow)
  },

  async getGroupById(id: number): Promise<FavoriteGroup | null> {
    const sql = `
      SELECT fg.*,
        (SELECT COUNT(*) FROM favorites f WHERE f.group_id = fg.id) as prompt_count
      FROM favorite_groups fg
      WHERE fg.id = ?
    `
    const row = db.getOne<FavoriteGroupRow & { prompt_count: number }>(sql, [id])
    return row ? mapFavoriteGroupRow(row) : null
  },

  async updateFavoriteGroup(favoriteId: number, userId: number, groupId: number | null): Promise<Favorite | null> {
    const sql = 'UPDATE favorites SET group_id = ? WHERE id = ? AND user_id = ?'
    const params: any[] = [groupId, favoriteId, userId]
    const result = db.runQuery(sql, params)
    if ((result.changes as number) === 0) {
      return null
    }
    const selectSql = 'SELECT * FROM favorites WHERE id = ?'
    const row = db.getOne<FavoriteRow>(selectSql, [favoriteId])
    return row ? mapFavoriteRow(row) : null
  },

  async deleteGroup(groupId: number, userId: number): Promise<boolean> {
    db.runQuery('UPDATE favorites SET group_id = NULL WHERE group_id = ? AND user_id = ?', [groupId, userId])
    const result = db.runQuery('DELETE FROM favorite_groups WHERE id = ? AND user_id = ?', [groupId, userId])
    return (result.changes as number) > 0
  }
}

export default FavoriteRepository
