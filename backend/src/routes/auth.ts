import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { db } from '../db'
import { generateToken } from '../middleware/auth'
import crypto from 'crypto'

const router = Router()

const registerSchema = z.object({
  username: z.string().min(3).max(30),
  password: z.string().min(6).max(100),
})

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

router.post('/register', (req, res) => {
  const result = registerSchema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({ error: 'Invalid input', details: result.error.flatten() })
    return
  }

  const { username, password } = result.data
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
  if (existing) {
    res.status(409).json({ error: 'Username already exists' })
    return
  }

  const id = crypto.randomUUID()
  const passwordHash = bcrypt.hashSync(password, 10)

  db.prepare('INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)')
    .run(id, username, passwordHash)

  // Create default categories for new user
  const defaultCategories = [
    { id: `cat-${Date.now()}-1`, name: 'AI资源', icon: 'LightbulbIcon', color: '#a855f7', parent_id: null, sort_order: 0 },
    { id: `cat-${Date.now()}-2`, name: 'AI工具', icon: 'WrenchIcon', color: '#3b82f6', parent_id: null, sort_order: 1 },
    { id: `cat-${Date.now()}-3`, name: '开发文档', icon: 'FileTextIcon', color: '#22c55e', parent_id: null, sort_order: 2 },
    { id: `cat-${Date.now()}-4`, name: '效率工具', icon: 'ZapIcon', color: '#f97316', parent_id: null, sort_order: 3 },
    { id: `cat-${Date.now()}-5`, name: '阅读收藏', icon: 'BookOpenIcon', color: '#ec4899', parent_id: null, sort_order: 4 },
  ]
  const insertCat = db.prepare(
    'INSERT INTO categories (id, name, icon, color, parent_id, sort_order, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
  for (const c of defaultCategories) {
    insertCat.run(c.id, c.name, c.icon, c.color, c.parent_id, c.sort_order, id)
  }

  const token = generateToken(id, username)
  res.json({ token, user: { id, username } })
})

router.post('/login', (req, res) => {
  const result = loginSchema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({ error: 'Invalid input' })
    return
  }

  const { username, password } = result.data
  const user = db.prepare('SELECT id, username, password_hash FROM users WHERE username = ?').get(username) as
    | { id: string; username: string; password_hash: string }
    | undefined

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid username or password' })
    return
  }

  const token = generateToken(user.id, user.username)
  res.json({ token, user: { id: user.id, username: user.username } })
})

export default router
