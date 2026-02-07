import { db } from './index'

const schema = `
-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
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

// 执行初始化
console.log('Initializing database...')
db.exec(schema)
console.log('Database initialized successfully!')
