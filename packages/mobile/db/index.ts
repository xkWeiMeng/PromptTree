import * as SQLite from 'expo-sqlite/next'

// ===================
// 数据库实例
// ===================

/** PromptTree 本地 SQLite 数据库（同步 API） */
export const db = SQLite.openDatabaseSync('prompttree.db')

// ===================
// 表初始化
// ===================

/**
 * 初始化数据库表结构
 * 在应用启动时调用
 */
export function initDatabase(): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS nodes (
      id TEXT PRIMARY KEY,
      parentId TEXT,
      type TEXT NOT NULL CHECK(type IN ('folder', 'prompt')),
      title TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      isFavorite INTEGER NOT NULL DEFAULT 0,
      sortOrder INTEGER NOT NULL DEFAULT 0,
      collapsed INTEGER NOT NULL DEFAULT 0,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      deletedAt INTEGER,
      version INTEGER NOT NULL DEFAULT 1,
      _dirty INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_nodes_parentId ON nodes(parentId);
    CREATE INDEX IF NOT EXISTS idx_nodes_type ON nodes(type);
    CREATE INDEX IF NOT EXISTS idx_nodes_isFavorite ON nodes(isFavorite);
    CREATE INDEX IF NOT EXISTS idx_nodes_dirty ON nodes(_dirty);
  `)
}

// ===================
// 元数据 Key 常量
// ===================

export const META_KEYS = {
  LAST_SYNC_TIME: 'lastSyncTime',
  ACCESS_TOKEN: 'accessToken',
  USER: 'user',
  OFFLINE_MODE: 'offlineMode',
  LOCALE: 'locale',
  THEME_MODE: 'themeMode',
} as const
