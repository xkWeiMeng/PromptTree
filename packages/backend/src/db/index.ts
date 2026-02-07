import Database from 'better-sqlite3'
import { resolve } from 'path'

const DB_PATH = process.env.DB_PATH || resolve(process.cwd(), '../../data/prompttree.db')

export const db = new Database(DB_PATH)

// 启用 WAL 模式提升并发性能
db.pragma('journal_mode = WAL')
