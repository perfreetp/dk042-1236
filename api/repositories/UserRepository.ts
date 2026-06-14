import db from '../db'
import type { User } from '../../shared/types'

interface UserRow {
  id: number
  email: string
  username: string
  password_hash: string
  avatar: string | null
  bio: string | null
  role: string
  created_at: string
}

export interface UserWithPassword extends Omit<User, 'followerCount' | 'followingCount'> {
  passwordHash: string
}

function mapUserRow(row: UserRow & { follower_count?: number; following_count?: number }): User {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    avatar: row.avatar || '',
    bio: row.bio || '',
    role: row.role as 'user' | 'author' | 'admin',
    createdAt: row.created_at,
    followerCount: row.follower_count || 0,
    followingCount: row.following_count || 0
  }
}

function mapUserWithPassword(row: UserRow): UserWithPassword {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    avatar: row.avatar || '',
    bio: row.bio || '',
    role: row.role as 'user' | 'author' | 'admin',
    createdAt: row.created_at,
    passwordHash: row.password_hash
  }
}

export const UserRepository = {
  async findByEmail(email: string): Promise<UserWithPassword | null> {
    const sql = `
      SELECT * FROM users WHERE email = ?
    `
    const row = db.getOne<UserRow>(sql, [email])
    return row ? mapUserWithPassword(row) : null
  },

  async findById(id: number): Promise<User | null> {
    const sql = `
      SELECT u.*,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as follower_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following_count
      FROM users u
      WHERE u.id = ?
    `
    const row = db.getOne<UserRow & { follower_count: number; following_count: number }>(sql, [id])
    return row ? mapUserRow(row) : null
  },

  async create(data: { email: string; username: string; passwordHash: string }): Promise<User> {
    const result = db.runQuery(
      'INSERT INTO users (email, username, password_hash, avatar, bio) VALUES (?, ?, ?, ?, ?)',
      [data.email, data.username, data.passwordHash, '', '']
    )
    const userId = result.lastInsertRowid as number
    return (await UserRepository.findById(userId))!
  },

  async update(id: number, data: Partial<{ username: string; avatar: string; bio: string; role: string }>): Promise<User | null> {
    const fields: string[] = []
    const params: any[] = []

    if (data.username !== undefined) {
      fields.push('username = ?')
      params.push(data.username)
    }
    if (data.avatar !== undefined) {
      fields.push('avatar = ?')
      params.push(data.avatar)
    }
    if (data.bio !== undefined) {
      fields.push('bio = ?')
      params.push(data.bio)
    }
    if (data.role !== undefined) {
      fields.push('role = ?')
      params.push(data.role)
    }

    if (fields.length === 0) return UserRepository.findById(id)

    params.push(id)
    db.runQuery(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params)
    return UserRepository.findById(id)
  },

  async getFollowCounts(userId: number): Promise<{ followers: number; following: number }> {
    const sql = `
      SELECT
        (SELECT COUNT(*) FROM follows WHERE following_id = ?) as followers,
        (SELECT COUNT(*) FROM follows WHERE follower_id = ?) as following
    `
    const result = db.getOne<{ followers: number; following: number }>(sql, [userId, userId])
    return result || { followers: 0, following: 0 }
  }
}

export default UserRepository
