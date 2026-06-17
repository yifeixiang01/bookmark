import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data')
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

const DB_PATH = path.join(DATA_DIR, 'bookmarks.db')
export const db: Database.Database = new Database(DB_PATH)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

function columnExists(table: string, column: string): boolean {
  const cols = db.pragma(`table_info(${table})`) as Array<{ name: string }>
  return cols.some(c => c.name === column)
}

function tableExists(table: string): boolean {
  const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table)
  return !!row
}

function hasUniqueConstraint(table: string, column: string): boolean {
  const indexes = db.prepare("SELECT sql FROM sqlite_master WHERE type='index' AND tbl_name=?").all(table) as Array<{ sql: string | null }>
  return indexes.some(idx => idx.sql?.includes(`UNIQUE`) && idx.sql?.includes(column))
}

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT 'FolderIcon',
      color TEXT,
      parent_id TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      user_id TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#6b7280',
      user_id TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      description TEXT,
      category_id TEXT,
      visits INTEGER NOT NULL DEFAULT 0,
      favicon TEXT,
      user_id TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS bookmark_tags (
      bookmark_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      PRIMARY KEY (bookmark_id, tag_id),
      FOREIGN KEY (bookmark_id) REFERENCES bookmarks(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_bookmarks_category ON bookmarks(category_id);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_created ON bookmarks(created_at);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_visits ON bookmarks(visits);
    CREATE INDEX IF NOT EXISTS idx_bookmark_tags_tag ON bookmark_tags(tag_id);
  `)

  // Migrate old tables without user_id
  if (tableExists('bookmarks') && !columnExists('bookmarks', 'user_id')) {
    db.exec(`ALTER TABLE bookmarks ADD COLUMN user_id TEXT`)
  }
  if (tableExists('categories') && !columnExists('categories', 'user_id')) {
    db.exec(`ALTER TABLE categories ADD COLUMN user_id TEXT`)
  }

  // Migrate bookmarks table: add favicon for databases created before icons were stored.
  if (tableExists('bookmarks') && !columnExists('bookmarks', 'favicon')) {
    db.exec(`ALTER TABLE bookmarks ADD COLUMN favicon TEXT`)
  }

  // Migrate bookmarks table: add sort_order
  if (tableExists('bookmarks') && !columnExists('bookmarks', 'sort_order')) {
    db.exec(`ALTER TABLE bookmarks ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0`)
  }
  db.exec(`CREATE INDEX IF NOT EXISTS idx_bookmarks_sort_order ON bookmarks(sort_order)`)

  if (tableExists('bookmarks') && !columnExists('bookmarks', 'created_at')) {
    db.exec(`ALTER TABLE bookmarks ADD COLUMN created_at INTEGER`)
    db.exec(`UPDATE bookmarks SET created_at = unixepoch() WHERE created_at IS NULL`)
  }
  if (tableExists('categories') && !columnExists('categories', 'created_at')) {
    db.exec(`ALTER TABLE categories ADD COLUMN created_at INTEGER`)
    db.exec(`UPDATE categories SET created_at = unixepoch() WHERE created_at IS NULL`)
  }
  if (tableExists('tags') && !columnExists('tags', 'created_at')) {
    db.exec(`ALTER TABLE tags ADD COLUMN created_at INTEGER`)
    db.exec(`UPDATE tags SET created_at = unixepoch() WHERE created_at IS NULL`)
  }

  // Migrate tags: old schema had UNIQUE on name, we need per-user uniqueness
  if (tableExists('tags')) {
    if (!columnExists('tags', 'user_id')) {
      // Old tags table exists without user_id. We need to rebuild it because
      // old schema had UNIQUE(name) which prevents multi-user same-name tags.
      db.exec(`
        ALTER TABLE tags RENAME TO tags_old;
        CREATE TABLE tags (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          color TEXT NOT NULL DEFAULT '#6b7280',
          user_id TEXT,
          created_at INTEGER NOT NULL DEFAULT (unixepoch())
        );
        INSERT INTO tags (id, name, color, user_id, created_at)
          SELECT id, name, color, NULL, created_at FROM tags_old;
        DROP TABLE tags_old;
      `)
    }
  }

  // Create user-scoped unique index after migration
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_user_name ON tags(user_id, name)`)
}

export interface DbUser {
  id: string
  username: string
  password_hash: string
  created_at: number
}

export interface DbBookmark {
  id: string
  title: string
  url: string
  description: string | null
  category_id: string | null
  visits: number
  favicon: string | null
  sort_order: number
  user_id: string | null
  created_at: number
}

export interface DbCategory {
  id: string
  name: string
  icon: string
  color: string | null
  parent_id: string | null
  sort_order: number
  user_id: string | null
  created_at: number
}

export interface DbTag {
  id: string
  name: string
  color: string
  user_id: string | null
  created_at: number
}
