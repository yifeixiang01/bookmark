import { Router } from 'express'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { db } from '../db'
import { AuthRequest } from '../middleware/auth'

const router = Router()

const bookmarkSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  description: z.string().optional(),
  category_id: z.string().optional(),
  tags: z.array(z.string()).default([]),
  favicon: z.string().optional(),
})

const updateBookmarkSchema = z.object({
  title: z.string().min(1).optional(),
  url: z.string().url().optional(),
  description: z.string().optional(),
  category_id: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  visits: z.number().int().min(0).optional(),
  favicon: z.string().optional().nullable(),
})

const importBookmarkSchema = z.object({
  bookmarks: z.array(z.object({
    title: z.string().min(1),
    url: z.string().url(),
    description: z.string().optional(),
    favicon: z.string().optional(),
  })).min(1),
})

function rowToBookmark(row: any) {
  const tagRows = db
    .prepare(
      `SELECT t.id, t.name, t.color
       FROM tags t
       JOIN bookmark_tags bt ON bt.tag_id = t.id
       WHERE bt.bookmark_id = ?`
    )
    .all(row.id) as { id: string; name: string; color: string }[]

  return {
    id: row.id,
    title: row.title,
    url: row.url,
    description: row.description,
    category: row.category_id || 'all',
    tags: tagRows.map((t) => t.name),
    tagIds: tagRows.map((t) => t.id),
    visits: row.visits,
    favicon: row.favicon,
    sortOrder: row.sort_order ?? 0,
    createdAt: new Date(row.created_at * 1000),
  }
}

router.get('/', (req: AuthRequest, res) => {
  try {
    const {
      q,
      category,
      tags,
      sort = 'visits',
      order = 'desc',
    } = req.query as {
      q?: string
      category?: string
      tags?: string
      sort?: string
      order?: string
    }

    const userId = req.userId!
    let sql = `SELECT b.* FROM bookmarks b`
    const conditions: string[] = ['b.user_id = ?']
    const params: any[] = [userId]

    if (tags) {
      const tagList = tags.split(',').filter(Boolean)
      if (tagList.length > 0) {
        sql += ` JOIN bookmark_tags bt ON bt.bookmark_id = b.id JOIN tags t ON t.id = bt.tag_id`
        conditions.push(`t.name IN (${tagList.map(() => '?').join(',')})`)
        params.push(...tagList)
      }
    }

    if (category && category !== 'all') {
      conditions.push(`(b.category_id = ? OR b.category_id LIKE ?)`)
      params.push(category, `${category}-%`)
    }

    if (q) {
      conditions.push(`(b.title LIKE ? OR b.url LIKE ? OR b.description LIKE ?)`)
      const like = `%${q}%`
      params.push(like, like, like)
    }

    sql += ` WHERE ` + conditions.join(' AND ')

    if (tags && tags.split(',').filter(Boolean).length > 0) {
      sql += ` GROUP BY b.id`
    }

    let sortCol: string
    let sortDir: string
    if (sort === 'custom') {
      sortCol = 'b.sort_order'
      sortDir = 'ASC'
    } else {
      sortCol =
        sort === 'recent'
          ? 'b.created_at'
          : sort === 'alpha'
            ? 'b.title'
            : 'b.visits'
      sortDir = order === 'asc' ? 'ASC' : 'DESC'
    }
    sql += ` ORDER BY ${sortCol} ${sortDir}`

    const rows = db.prepare(sql).all(...params)
    res.json(rows.map(rowToBookmark))
  } catch (err) {
    console.error('Failed to list bookmarks:', err)
    res.status(500).json({ error: 'Failed to list bookmarks' })
  }
})

router.get('/:id', (req: AuthRequest, res) => {
  const row = db.prepare('SELECT * FROM bookmarks WHERE id = ? AND user_id = ?').get(req.params.id, req.userId)
  if (!row) {
    res.status(404).json({ error: 'Bookmark not found' })
    return
  }
  res.json(rowToBookmark(row))
})

router.post('/', (req: AuthRequest, res) => {
  const parsed = bookmarkSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.format() })
    return
  }

  const { title, url, description, category_id, tags, favicon } = parsed.data
  const id = `bookmark-${Date.now()}`
  const userId = req.userId!

  // Get max sort_order for this user
  const maxSort = db.prepare(
    `SELECT COALESCE(MAX(sort_order), 0) as max_sort FROM bookmarks WHERE user_id = ?`
  ).get(userId) as { max_sort: number }
  const sortOrder = (maxSort?.max_sort ?? 0) + 1

  db.prepare(
    `INSERT INTO bookmarks (id, title, url, description, category_id, favicon, visits, sort_order, user_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`
  ).run(id, title, url, description || null, category_id || null, favicon || null, sortOrder, userId, Math.floor(Date.now() / 1000))

  if (tags.length > 0) {
    const insertTag = db.prepare('INSERT OR IGNORE INTO bookmark_tags (bookmark_id, tag_id) VALUES (?, ?)')
    for (const tagName of tags) {
      const tag = db.prepare('SELECT id FROM tags WHERE name = ? AND user_id = ?').get(tagName, userId) as { id: string } | undefined
      if (tag) {
        insertTag.run(id, tag.id)
      }
    }
  }

  const row = db.prepare('SELECT * FROM bookmarks WHERE id = ?').get(id)
  res.status(201).json(rowToBookmark(row))
})

router.post('/import', (req: AuthRequest, res) => {
  const parsed = importBookmarkSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.format() })
    return
  }

  const userId = req.userId!
  const now = Math.floor(Date.now() / 1000)

  const importMany = db.transaction((items: z.infer<typeof importBookmarkSchema>['bookmarks']) => {
    let pendingCategory = db
      .prepare('SELECT * FROM categories WHERE name = ? AND user_id = ? LIMIT 1')
      .get('待处理', userId) as { id: string } | undefined

    if (!pendingCategory) {
      const maxOrder = db
        .prepare('SELECT COALESCE(MAX(sort_order), -1) as max_order FROM categories WHERE parent_id IS NULL AND user_id = ?')
        .get(userId) as { max_order: number }
      const categoryId = `cat-${randomUUID()}`
      db.prepare(
        `INSERT INTO categories (id, name, icon, color, parent_id, sort_order, user_id, created_at)
         VALUES (?, ?, ?, ?, NULL, ?, ?, ?)`
      ).run(categoryId, '待处理', 'ArchiveIcon', '#f59e0b', maxOrder.max_order + 1, userId, now)
      pendingCategory = { id: categoryId }
    }

    const existingUrls = new Set(
      (db.prepare('SELECT url FROM bookmarks WHERE user_id = ?').all(userId) as { url: string }[])
        .map((row) => row.url)
    )

    const maxSort = db.prepare(
      `SELECT COALESCE(MAX(sort_order), 0) as max_sort FROM bookmarks WHERE user_id = ?`
    ).get(userId) as { max_sort: number }

    const insertBookmark = db.prepare(
      `INSERT INTO bookmarks (id, title, url, description, category_id, favicon, visits, sort_order, user_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`
    )

    const importedRows: any[] = []
    let skipped = 0
    let sortOrder = (maxSort?.max_sort ?? 0) + 1

    for (const item of items) {
      if (existingUrls.has(item.url)) {
        skipped += 1
        continue
      }

      const id = `bookmark-${randomUUID()}`
      insertBookmark.run(
        id,
        item.title,
        item.url,
        item.description || null,
        pendingCategory.id,
        item.favicon || null,
        sortOrder,
        userId,
        now
      )
      sortOrder += 1
      existingUrls.add(item.url)
      importedRows.push(db.prepare('SELECT * FROM bookmarks WHERE id = ?').get(id))
    }

    const categoryRow = db.prepare('SELECT * FROM categories WHERE id = ?').get(pendingCategory.id) as any
    return {
      imported: importedRows.map(rowToBookmark),
      skipped,
      category: {
        id: categoryRow.id,
        name: categoryRow.name,
        icon: categoryRow.icon,
        color: categoryRow.color,
        count: 0,
        order: categoryRow.sort_order,
        children: [],
      },
    }
  })

  const result = importMany(parsed.data.bookmarks)
  res.status(201).json(result)
})

router.patch('/:id', (req: AuthRequest, res) => {
  const parsed = updateBookmarkSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.format() })
    return
  }

  const existing = db.prepare('SELECT * FROM bookmarks WHERE id = ? AND user_id = ?').get(req.params.id, req.userId)
  if (!existing) {
    res.status(404).json({ error: 'Bookmark not found' })
    return
  }

  const { title, url, description, category_id, tags, visits, favicon } = parsed.data
  const sets: string[] = []
  const params: any[] = []

  if (title !== undefined) {
    sets.push('title = ?')
    params.push(title)
  }
  if (url !== undefined) {
    sets.push('url = ?')
    params.push(url)
  }
  if (description !== undefined) {
    sets.push('description = ?')
    params.push(description || null)
  }
  if (category_id !== undefined) {
    sets.push('category_id = ?')
    params.push(category_id)
  }
  if (visits !== undefined) {
    sets.push('visits = ?')
    params.push(visits)
  }
  if (favicon !== undefined) {
    sets.push('favicon = ?')
    params.push(favicon)
  }

  if (sets.length > 0) {
    params.push(req.params.id)
    db.prepare(`UPDATE bookmarks SET ${sets.join(', ')} WHERE id = ?`).run(...params)
  }

  if (tags !== undefined) {
    db.prepare('DELETE FROM bookmark_tags WHERE bookmark_id = ?').run(req.params.id)
    const insertTag = db.prepare('INSERT OR IGNORE INTO bookmark_tags (bookmark_id, tag_id) VALUES (?, ?)')
    for (const tagName of tags) {
      const tag = db.prepare('SELECT id FROM tags WHERE name = ? AND user_id = ?').get(tagName, req.userId) as { id: string } | undefined
      if (tag) {
        insertTag.run(req.params.id, tag.id)
      }
    }
  }

  const row = db.prepare('SELECT * FROM bookmarks WHERE id = ?').get(req.params.id)
  res.json(rowToBookmark(row))
})

router.delete('/:id', (req: AuthRequest, res) => {
  const result = db.prepare('DELETE FROM bookmarks WHERE id = ? AND user_id = ?').run(req.params.id, req.userId)
  if (result.changes === 0) {
    res.status(404).json({ error: 'Bookmark not found' })
    return
  }
  res.status(204).send()
})

router.post('/batch-delete', (req: AuthRequest, res) => {
  const schema = z.object({ ids: z.array(z.string()) })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.format() })
    return
  }

  const { ids } = parsed.data
  if (ids.length === 0) {
    res.status(204).send()
    return
  }

  const stmt = db.prepare(`DELETE FROM bookmarks WHERE id = ? AND user_id = ?`)
  const deleteTags = db.prepare(`DELETE FROM bookmark_tags WHERE bookmark_id = ?`)
  const deleteMany = db.transaction((bookmarkIds: string[]) => {
    for (const id of bookmarkIds) {
      deleteTags.run(id)
      stmt.run(id, req.userId)
    }
  })
  deleteMany(ids)
  res.status(204).send()
})

router.post('/batch-move', (req: AuthRequest, res) => {
  const schema = z.object({
    ids: z.array(z.string()),
    category_id: z.string(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.format() })
    return
  }

  const { ids, category_id } = parsed.data
  if (ids.length === 0) {
    res.status(204).send()
    return
  }

  const stmt = db.prepare(`UPDATE bookmarks SET category_id = ? WHERE id = ? AND user_id = ?`)
  const moveMany = db.transaction((bookmarkIds: string[]) => {
    for (const id of bookmarkIds) {
      stmt.run(category_id, id, req.userId)
    }
  })
  moveMany(ids)
  res.status(204).send()
})

router.put('/reorder', (req: AuthRequest, res) => {
  const schema = z.object({
    items: z.array(z.object({
      id: z.string(),
      sort_order: z.number().int(),
    })),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.format() })
    return
  }

  const { items } = parsed.data
  if (items.length === 0) {
    res.status(204).send()
    return
  }

  const stmt = db.prepare(`UPDATE bookmarks SET sort_order = ? WHERE id = ? AND user_id = ?`)
  const updateMany = db.transaction((updates: typeof items) => {
    for (const item of updates) {
      stmt.run(item.sort_order, item.id, req.userId)
    }
  })
  updateMany(items)
  res.status(204).send()
})

export default router
