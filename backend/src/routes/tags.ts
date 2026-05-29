import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db'
import { AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/', (req: AuthRequest, res) => {
  const rows = db.prepare('SELECT * FROM tags WHERE user_id = ? ORDER BY name').all(req.userId)
  res.json(rows)
})

router.post('/', (req: AuthRequest, res) => {
  const schema = z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    color: z.string().default('#6b7280'),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.format() })
    return
  }

  const { id, name, color } = parsed.data
  const tagId = id || `tag-${Date.now()}`
  const userId = req.userId!

  try {
    db.prepare('INSERT INTO tags (id, name, color, user_id) VALUES (?, ?, ?, ?)').run(tagId, name, color, userId)
    const row = db.prepare('SELECT * FROM tags WHERE id = ?').get(tagId)
    res.status(201).json(row)
  } catch (err: any) {
    if (err.message?.includes('UNIQUE constraint failed')) {
      res.status(409).json({ error: 'Tag name already exists' })
      return
    }
    throw err
  }
})

router.put('/:id', (req: AuthRequest, res) => {
  const schema = z.object({
    name: z.string().min(1).optional(),
    color: z.string().optional(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.format() })
    return
  }

  const existing = db.prepare('SELECT * FROM tags WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as
    | { name: string }
    | undefined
  if (!existing) {
    res.status(404).json({ error: 'Tag not found' })
    return
  }

  const { name, color } = parsed.data

  const sets: string[] = []
  const params: any[] = []

  if (name !== undefined) {
    sets.push('name = ?')
    params.push(name)
  }
  if (color !== undefined) {
    sets.push('color = ?')
    params.push(color)
  }

  if (sets.length > 0) {
    params.push(req.params.id)
    db.prepare(`UPDATE tags SET ${sets.join(', ')} WHERE id = ?`).run(...params)
  }

  const row = db.prepare('SELECT * FROM tags WHERE id = ?').get(req.params.id)
  res.json(row)
})

router.delete('/:id', (req: AuthRequest, res) => {
  const result = db.prepare('DELETE FROM tags WHERE id = ? AND user_id = ?').run(req.params.id, req.userId)
  if (result.changes === 0) {
    res.status(404).json({ error: 'Tag not found' })
    return
  }
  res.status(204).send()
})

router.post('/merge', (req: AuthRequest, res) => {
  const schema = z.object({
    source_id: z.string(),
    target_id: z.string(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.format() })
    return
  }

  const { source_id, target_id } = parsed.data
  const userId = req.userId!

  if (source_id === target_id) {
    res.status(400).json({ error: 'Cannot merge tag into itself' })
    return
  }

  const source = db.prepare('SELECT * FROM tags WHERE id = ? AND user_id = ?').get(source_id, userId)
  const target = db.prepare('SELECT * FROM tags WHERE id = ? AND user_id = ?').get(target_id, userId)
  if (!source || !target) {
    res.status(404).json({ error: 'Tag not found' })
    return
  }

  // Replace source tag with target tag in all bookmarks
  const bookmarkIds = db
    .prepare('SELECT bookmark_id FROM bookmark_tags WHERE tag_id = ?')
    .all(source_id) as { bookmark_id: string }[]

  const insertStmt = db.prepare('INSERT OR IGNORE INTO bookmark_tags (bookmark_id, tag_id) VALUES (?, ?)')
  const deleteStmt = db.prepare('DELETE FROM bookmark_tags WHERE bookmark_id = ? AND tag_id = ?')

  const merge = db.transaction(() => {
    for (const { bookmark_id } of bookmarkIds) {
      deleteStmt.run(bookmark_id, source_id)
      insertStmt.run(bookmark_id, target_id)
    }
    db.prepare('DELETE FROM tags WHERE id = ?').run(source_id)
  })

  merge()
  res.status(204).send()
})

export default router
