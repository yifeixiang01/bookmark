import { db, initDb } from './db'

initDb()

const existing = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number }
if (existing.count > 0) {
  console.log('Database already seeded.')
  process.exit(0)
}

const categories = [
  { id: 'all', name: '全部书签', icon: 'BookmarkIcon', color: null, parent_id: null, sort_order: 0 },
  { id: 'dev', name: '开发工具', icon: 'CodeIcon', color: '#3b82f6', parent_id: null, sort_order: 1 },
  { id: 'dev-docs', name: '文档', icon: 'FileTextIcon', color: null, parent_id: 'dev', sort_order: 0 },
  { id: 'dev-tools', name: '工具', icon: 'WrenchIcon', color: null, parent_id: 'dev', sort_order: 1 },
  { id: 'dev-github', name: 'GitHub', icon: 'GithubIcon', color: null, parent_id: 'dev', sort_order: 2 },
  { id: 'design', name: '设计资源', icon: 'PaletteIcon', color: '#a855f7', parent_id: null, sort_order: 2 },
  { id: 'design-ui', name: 'UI 组件', icon: 'LayoutIcon', color: null, parent_id: 'design', sort_order: 0 },
  { id: 'design-icons', name: '图标', icon: 'SmileIcon', color: null, parent_id: 'design', sort_order: 1 },
  { id: 'productivity', name: '效率工具', icon: 'ZapIcon', color: '#22c55e', parent_id: null, sort_order: 3 },
  { id: 'reading', name: '阅读收藏', icon: 'BookOpenIcon', color: '#f97316', parent_id: null, sort_order: 4 },
  { id: 'social', name: '社交媒体', icon: 'UsersIcon', color: '#ec4899', parent_id: null, sort_order: 5 },
]

const tags = [
  { id: 'tag-1', name: 'productivity', color: '#22c55e' },
  { id: 'tag-2', name: 'coding', color: '#3b82f6' },
  { id: 'tag-3', name: 'design', color: '#a855f7' },
  { id: 'tag-4', name: 'frontend', color: '#14b8a6' },
  { id: 'tag-5', name: 'backend', color: '#f97316' },
  { id: 'tag-6', name: 'ai', color: '#ec4899' },
  { id: 'tag-7', name: 'tools', color: '#6b7280' },
  { id: 'tag-8', name: 'docs', color: '#eab308' },
  { id: 'tag-9', name: 'tutorial', color: '#6366f1' },
  { id: 'tag-10', name: 'inspiration', color: '#ef4444' },
  { id: 'tag-11', name: 'news', color: '#f59e0b' },
  { id: 'tag-12', name: 'learning', color: '#3b82f6' },
]

const insertCat = db.prepare('INSERT INTO categories (id, name, icon, color, parent_id, sort_order) VALUES (?, ?, ?, ?, ?, ?)')
for (const c of categories) {
  insertCat.run(c.id, c.name, c.icon, c.color, c.parent_id, c.sort_order)
}

const insertTag = db.prepare('INSERT INTO tags (id, name, color) VALUES (?, ?, ?)')
for (const t of tags) {
  insertTag.run(t.id, t.name, t.color)
}

const sites = [
  { title: 'GitHub', url: 'https://github.com', category: 'dev-github', tags: ['coding', 'tools'] },
  { title: 'Next.js 文档', url: 'https://nextjs.org', category: 'dev-docs', tags: ['frontend', 'docs'] },
  { title: 'Tailwind CSS', url: 'https://tailwindcss.com', category: 'dev-docs', tags: ['frontend', 'design'] },
  { title: 'React', url: 'https://react.dev', category: 'dev-docs', tags: ['frontend', 'docs'] },
  { title: 'TypeScript', url: 'https://typescriptlang.org', category: 'dev-docs', tags: ['coding', 'docs'] },
  { title: 'Vercel', url: 'https://vercel.com', category: 'dev-tools', tags: ['tools', 'frontend'] },
  { title: 'Figma', url: 'https://figma.com', category: 'design-ui', tags: ['design', 'tools'] },
  { title: 'Dribbble', url: 'https://dribbble.com', category: 'design', tags: ['design', 'inspiration'] },
  { title: 'Notion', url: 'https://notion.so', category: 'productivity', tags: ['productivity', 'tools'] },
  { title: 'Linear', url: 'https://linear.app', category: 'productivity', tags: ['productivity', 'tools'] },
  { title: 'Raycast', url: 'https://raycast.com', category: 'productivity', tags: ['productivity', 'tools'] },
  { title: 'Medium', url: 'https://medium.com', category: 'reading', tags: ['learning'] },
  { title: 'Dev.to', url: 'https://dev.to', category: 'reading', tags: ['coding', 'learning'] },
  { title: 'Twitter', url: 'https://twitter.com', category: 'social', tags: ['news'] },
  { title: 'Discord', url: 'https://discord.com', category: 'social', tags: ['tools'] },
  { title: 'Stack Overflow', url: 'https://stackoverflow.com', category: 'dev', tags: ['coding', 'learning'] },
  { title: 'MDN Web Docs', url: 'https://developer.mozilla.org', category: 'dev-docs', tags: ['docs', 'frontend'] },
  { title: 'npm', url: 'https://npmjs.com', category: 'dev-tools', tags: ['tools', 'coding'] },
  { title: 'Supabase', url: 'https://supabase.com', category: 'dev-tools', tags: ['backend', 'tools'] },
  { title: 'Prisma', url: 'https://prisma.io', category: 'dev-docs', tags: ['backend', 'docs'] },
  { title: 'Radix UI', url: 'https://radix-ui.com', category: 'design-ui', tags: ['frontend', 'design'] },
  { title: 'shadcn/ui', url: 'https://ui.shadcn.com', category: 'design-ui', tags: ['frontend', 'design'] },
  { title: 'Lucide Icons', url: 'https://lucide.dev', category: 'design-icons', tags: ['design', 'tools'] },
  { title: 'Heroicons', url: 'https://heroicons.com', category: 'design-icons', tags: ['design', 'tools'] },
  { title: 'OpenAI', url: 'https://openai.com', category: 'dev', tags: ['ai', 'tools'] },
  { title: 'Anthropic', url: 'https://anthropic.com', category: 'dev', tags: ['ai', 'docs'] },
  { title: 'Hugging Face', url: 'https://huggingface.co', category: 'dev', tags: ['ai', 'tools'] },
  { title: 'Hacker News', url: 'https://news.ycombinator.com', category: 'reading', tags: ['news', 'coding'] },
  { title: 'Product Hunt', url: 'https://producthunt.com', category: 'productivity', tags: ['tools', 'inspiration'] },
  { title: 'CodePen', url: 'https://codepen.io', category: 'dev-tools', tags: ['frontend', 'coding'] },
]

const insertBookmark = db.prepare(
  'INSERT INTO bookmarks (id, title, url, description, category_id, visits, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
)
const insertBookmarkTag = db.prepare('INSERT OR IGNORE INTO bookmark_tags (bookmark_id, tag_id) VALUES (?, ?)')

const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

const baseDate = new Date('2024-01-01').getTime()

for (let i = 0; i < 200; i++) {
  const site = sites[i % sites.length]
  const suffix = i >= sites.length ? ` ${Math.floor(i / sites.length) + 1}` : ''
  const id = `bookmark-${i}`
  const title = site.title + suffix
  const visits = Math.floor(seededRandom(i * 13) * 500) + 1
  const createdAt = Math.floor((baseDate + i * 24 * 60 * 60 * 1000) / 1000)

  insertBookmark.run(id, title, site.url, `${title} - 高效开发必备工具和资源`, site.category, visits, createdAt)

  for (const tagName of site.tags) {
    const tag = db.prepare('SELECT id FROM tags WHERE name = ?').get(tagName) as { id: string } | undefined
    if (tag) {
      insertBookmarkTag.run(id, tag.id)
    }
  }
}

console.log('Database seeded successfully.')
