import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db'
import { AuthRequest } from '../middleware/auth'

const router = Router()

function flattenCategories(rows: any[]): any[] {
  const byParent = new Map<string, any[]>()
  const topLevel: any[] = []

  for (const row of rows) {
    if (row.parent_id) {
      if (!byParent.has(row.parent_id)) byParent.set(row.parent_id, [])
      byParent.get(row.parent_id)!.push(row)
    } else {
      topLevel.push(row)
    }
  }

  const build = (row: any): any => ({
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    count: 0,
    order: row.sort_order,
    children: (byParent.get(row.id) || [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(build),
  })

  return topLevel.sort((a, b) => a.sort_order - b.sort_order).map(build)
}

router.get('/', (req: AuthRequest, res) => {
  try {
    const rows = db.prepare('SELECT * FROM categories WHERE user_id = ? ORDER BY sort_order').all(req.userId)
    res.json(flattenCategories(rows))
  } catch (err) {
    console.error('Failed to list categories:', err)
    res.status(500).json({ error: 'Failed to list categories' })
  }
})

router.post('/', (req: AuthRequest, res) => {
  const schema = z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    icon: z.string().default('FolderIcon'),
    color: z.string().optional(),
    parent_id: z.string().optional(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.format() })
    return
  }

  const { id, name, icon, color, parent_id } = parsed.data
  const categoryId = id || `cat-${Date.now()}`
  const userId = req.userId!

  const maxOrder = db
    .prepare(
      parent_id
        ? 'SELECT COALESCE(MAX(sort_order), -1) as max_order FROM categories WHERE parent_id = ? AND user_id = ?'
        : 'SELECT COALESCE(MAX(sort_order), -1) as max_order FROM categories WHERE parent_id IS NULL AND user_id = ?'
    )
    .get(parent_id ? [parent_id, userId] : [userId]) as { max_order: number }

  db.prepare(
    `INSERT INTO categories (id, name, icon, color, parent_id, sort_order, user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(categoryId, name, icon, color || null, parent_id || null, maxOrder.max_order + 1, userId)

  res.status(201).json({ id: categoryId, name, icon, color, parent_id, sort_order: maxOrder.max_order + 1 })
})

router.put('/reorder', (req: AuthRequest, res) => {
  const schema = z.array(
    z.object({
      id: z.string(),
      sort_order: z.number().int(),
    })
  )
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.format() })
    return
  }

  const update = db.prepare('UPDATE categories SET sort_order = ? WHERE id = ? AND user_id = ?')
  const reorder = db.transaction((items: { id: string; sort_order: number }[]) => {
    for (const item of items) {
      update.run(item.sort_order, item.id, req.userId)
    }
  })
  reorder(parsed.data)
  res.status(204).send()
})

router.put('/:id', (req: AuthRequest, res) => {
  const schema = z.object({
    name: z.string().min(1).optional(),
    icon: z.string().optional(),
    color: z.string().optional().nullable(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.format() })
    return
  }

  const existing = db.prepare('SELECT * FROM categories WHERE id = ? AND user_id = ?').get(req.params.id, req.userId)
  if (!existing) {
    res.status(404).json({ error: 'Category not found' })
    return
  }

  const { name, icon, color } = parsed.data
  const sets: string[] = []
  const params: any[] = []

  if (name !== undefined) {
    sets.push('name = ?')
    params.push(name)
  }
  if (icon !== undefined) {
    sets.push('icon = ?')
    params.push(icon)
  }
  if (color !== undefined) {
    sets.push('color = ?')
    params.push(color)
  }

  if (sets.length > 0) {
    params.push(req.params.id)
    db.prepare(`UPDATE categories SET ${sets.join(', ')} WHERE id = ?`).run(...params)
  }

  const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id)
  res.json(row)
})

router.delete('/:id', (req: AuthRequest, res) => {
  const result = db.prepare('DELETE FROM categories WHERE id = ? AND user_id = ?').run(req.params.id, req.userId)
  if (result.changes === 0) {
    res.status(404).json({ error: 'Category not found' })
    return
  }
  res.status(204).send()
})

export default router
