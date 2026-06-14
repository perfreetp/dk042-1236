import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import UserRepository from '../repositories/UserRepository'
import { AppError } from '../middleware/errorHandler'
import type { AuthResponse, User, RegisterRequest, LoginRequest } from '../../shared/types'

const JWT_SECRET = process.env.JWT_SECRET || 'promptshare-secret-key'
const TOKEN_EXPIRES_IN = '7d'
const SALT_ROUNDS = 10

export const AuthService = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const existingUser = await UserRepository.findByEmail(data.email)
    if (existingUser) {
      throw new AppError('该邮箱已被注册', 400)
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS)

    const user = await UserRepository.create({
      email: data.email,
      username: data.username,
      passwordHash
    })

    const token = AuthService.generateToken(user)

    return { token, user }
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const userWithPassword = await UserRepository.findByEmail(data.email)
    if (!userWithPassword) {
      throw new AppError('邮箱或密码错误', 401)
    }

    const isValidPassword = await bcrypt.compare(data.password, userWithPassword.passwordHash)
    if (!isValidPassword) {
      throw new AppError('邮箱或密码错误', 401)
    }

    const user = await UserRepository.findById(userWithPassword.id)
    if (!user) {
      throw new AppError('用户不存在', 404)
    }

    const token = AuthService.generateToken(user)

    return { token, user }
  },

  async getProfile(userId: number): Promise<User> {
    const user = await UserRepository.findById(userId)
    if (!user) {
      throw new AppError('用户不存在', 404)
    }
    return user
  },

  async updateProfile(userId: number, data: Partial<{ username: string; avatar: string; bio: string }>): Promise<User> {
    const user = await UserRepository.update(userId, data)
    if (!user) {
      throw new AppError('用户不存在', 404)
    }
    return user
  },

  generateToken(user: User): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRES_IN }
    )
  },

  verifyToken(token: string): { userId: number; email: string; role: string } | null {
    try {
      return jwt.verify(token, JWT_SECRET) as { userId: number; email: string; role: string }
    } catch (error) {
      return null
    }
  }
}

export default AuthService
