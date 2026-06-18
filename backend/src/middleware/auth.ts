import { Request, Response, NextFunction } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'bookmark-manager-secret-key-change-in-production'

export interface AuthRequest extends Request {
  userId?: string
  username?: string
}

export function generateToken(userId: string, username: string): string {
  return jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '30d' })
}

export function verifyToken(token: string): { userId: string; username: string } {
  const payload = jwt.verify(token, JWT_SECRET) as JwtPayload & {
    userId?: string
    id?: string
    username?: string
  }
  const userId = payload.userId || payload.id || payload.sub
  if (!userId || typeof userId !== 'string') {
    throw new Error('Token is missing user id')
  }
  return {
    userId,
    username: payload.username || '',
  }
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const token = authHeader.slice(7)
  try {
    const payload = verifyToken(token)
    req.userId = payload.userId
    req.username = payload.username
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}
