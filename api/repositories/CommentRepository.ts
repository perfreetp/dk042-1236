import db from '../db'
import type { Comment, User } from '../../shared/types'
import UserRepository from './UserRepository'

interface CommentRow {
  id: number
  prompt_id: number
  user_id: number
  content: string
  parent_id: number | null
  like_count: number
  created_at: string
}

async function mapCommentRow(row: CommentRow, currentUserId?: number): Promise<Comment> {
  const user = await UserRepository.findById(row.user_id)
  let isLiked = false

  if (currentUserId) {
    const liked = db.getOne(
      'SELECT 1 FROM comment_likes WHERE user_id = ? AND comment_id = ?',
      [currentUserId, row.id]
    )
    isLiked = !!liked
  }

  return {
    id: row.id,
    promptId: row.prompt_id,
    userId: row.user_id,
    user: user as User,
    content: row.content,
    parentId: row.parent_id,
    likeCount: row.like_count || 0,
    isLiked,
    createdAt: row.created_at
  }
}

export const CommentRepository = {
  async findByPrompt(promptId: number, currentUserId?: number): Promise<Comment[]> {
    const sql = `
      SELECT * FROM comments
      WHERE prompt_id = ?
      ORDER BY created_at DESC
    `
    const rows = db.getMany<CommentRow>(sql, [promptId])
    return Promise.all(rows.map(row => mapCommentRow(row, currentUserId)))
  },

  async findById(id: number, currentUserId?: number): Promise<Comment | null> {
    const sql = 'SELECT * FROM comments WHERE id = ?'
    const row = db.getOne<CommentRow>(sql, [id])
    return row ? mapCommentRow(row, currentUserId) : null
  },

  async create(data: {
    promptId: number
    userId: number
    content: string
    parentId?: number | null
  }): Promise<Comment> {
    const result = db.runQuery(
      'INSERT INTO comments (prompt_id, user_id, content, parent_id) VALUES (?, ?, ?, ?)',
      [data.promptId, data.userId, data.content, data.parentId || null]
    )
    const commentId = result.lastInsertRowid as number
    return (await CommentRepository.findById(commentId, data.userId))!
  },

  async like(commentId: number, userId: number): Promise<boolean> {
    const existing = db.getOne(
      'SELECT 1 FROM comment_likes WHERE user_id = ? AND comment_id = ?',
      [userId, commentId]
    )

    if (existing) {
      db.runQuery(
        'DELETE FROM comment_likes WHERE user_id = ? AND comment_id = ?',
        [userId, commentId]
      )
      db.runQuery(
        'UPDATE comments SET like_count = like_count - 1 WHERE id = ? AND like_count > 0',
        [commentId]
      )
      return false
    } else {
      db.runQuery(
        'INSERT INTO comment_likes (user_id, comment_id) VALUES (?, ?)',
        [userId, commentId]
      )
      db.runQuery(
        'UPDATE comments SET like_count = like_count + 1 WHERE id = ?',
        [commentId]
      )
      return true
    }
  }
}

export default CommentRepository
