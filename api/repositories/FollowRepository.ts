import db from '../db'
import type { User } from '../../shared/types'
import UserRepository from './UserRepository'

interface FollowRow {
  follower_id: number
  following_id: number
  created_at: string
}

export const FollowRepository = {
  async follow(followerId: number, followingId: number): Promise<boolean> {
    if (followerId === followingId) {
      return false
    }

    try {
      db.runQuery(
        'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)',
        [followerId, followingId]
      )
      return true
    } catch (error) {
      return false
    }
  },

  async unfollow(followerId: number, followingId: number): Promise<boolean> {
    const result = db.runQuery(
      'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
      [followerId, followingId]
    )
    return (result.changes as number) > 0
  },

  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const result = db.getOne(
      'SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?',
      [followerId, followingId]
    )
    return !!result
  },

  async getFollowing(userId: number): Promise<User[]> {
    const sql = `
      SELECT f.following_id as id FROM follows f
      WHERE f.follower_id = ?
      ORDER BY f.created_at DESC
    `
    const rows = db.getMany<{ id: number }>(sql, [userId])
    const users = await Promise.all(rows.map(row => UserRepository.findById(row.id)))
    return users.filter((u): u is User => u !== null)
  },

  async getFollowers(userId: number): Promise<User[]> {
    const sql = `
      SELECT f.follower_id as id FROM follows f
      WHERE f.following_id = ?
      ORDER BY f.created_at DESC
    `
    const rows = db.getMany<{ id: number }>(sql, [userId])
    const users = await Promise.all(rows.map(row => UserRepository.findById(row.id)))
    return users.filter((u): u is User => u !== null)
  }
}

export default FollowRepository
