import Database from 'better-sqlite3'
import { resolve } from 'path'
import { mkdirSync } from 'fs'

const DB_PATH = process.env.DB_PATH || resolve(process.cwd(), '../../data/prompttree.db')

// 确保 data 目录存在
mkdirSync(resolve(DB_PATH, '..'), { recursive: true })

export const db = new Database(DB_PATH)

// 启用 WAL 模式提升并发性能
db.pragma('journal_mode = WAL')

// 初始化表结构（必须在 db.prepare() 之前完成）
const schema = `
-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password_hash TEXT,
    email_verified INTEGER DEFAULT 0,
    github_id TEXT UNIQUE,
    google_id TEXT UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    created_at INTEGER NOT NULL,
    last_sync_at INTEGER
);

-- 节点表（统一存储文件夹和 Prompt）
CREATE TABLE IF NOT EXISTS nodes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    parent_id TEXT,
    type TEXT NOT NULL CHECK(type IN ('folder', 'prompt')),
    title TEXT,
    content TEXT,
    is_favorite INTEGER DEFAULT 0,
    sort_order INTEGER,
    collapsed INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER,
    version INTEGER DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (parent_id) REFERENCES nodes(id)
);

-- 魔法链接表
CREATE TABLE IF NOT EXISTS magic_links (
    token TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    used INTEGER DEFAULT 0
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_nodes_user ON nodes(user_id);
CREATE INDEX IF NOT EXISTS idx_nodes_parent ON nodes(user_id, parent_id);
CREATE INDEX IF NOT EXISTS idx_nodes_updated ON nodes(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_magic_links_email ON magic_links(email);
`

console.log('Initializing database...')
db.exec(schema)

// 迁移：为已有数据库添加 password_hash 和 email_verified 列
try {
  const columns = db.pragma('table_info(users)') as { name: string }[]
  const columnNames = columns.map(c => c.name)
  if (!columnNames.includes('password_hash')) {
    db.exec('ALTER TABLE users ADD COLUMN password_hash TEXT')
    console.log('Migration: added password_hash column')
  }
  if (!columnNames.includes('email_verified')) {
    db.exec('ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0')
    console.log('Migration: added email_verified column')
  }
} catch (e) {
  // 忽略，可能是全新数据库
}

console.log('Database initialized successfully!')
