/**
 * 种子数据脚本 - 用于开发测试
 * 运行: pnpm db:seed
 */

import { db } from './index'
import { generateId, now } from '../utils/id'

// 确保表已创建
import './init'

console.log('Seeding database...')

// 创建测试用户
const testUserId = generateId()
const timestamp = now()

db.prepare(`
  INSERT OR REPLACE INTO users (id, email, display_name, created_at)
  VALUES (?, ?, ?, ?)
`).run(testUserId, 'test@example.com', 'Test User', timestamp)

console.log(`Created test user: ${testUserId}`)

// 创建示例文件夹和 Prompt
const seedData = [
  // 根文件夹
  {
    id: generateId(),
    user_id: testUserId,
    parent_id: null,
    type: 'folder',
    title: '📁 工作',
    content: null,
    is_favorite: 0,
    sort_order: 0,
    collapsed: 0,
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    version: 1
  },
  {
    id: generateId(),
    user_id: testUserId,
    parent_id: null,
    type: 'folder',
    title: '📁 学习',
    content: null,
    is_favorite: 0,
    sort_order: 1,
    collapsed: 0,
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    version: 1
  },
  {
    id: generateId(),
    user_id: testUserId,
    parent_id: null,
    type: 'prompt',
    title: '通用翻译助手',
    content: `你是一个专业的翻译助手。请将以下内容翻译成{{目标语言}}：

{{待翻译内容}}

要求：
1. 保持原文的语气和风格
2. 专业术语使用准确
3. 译文流畅自然`,
    is_favorite: 1,
    sort_order: 2,
    collapsed: 0,
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    version: 1
  }
]

// 保存第一个文件夹的 ID 用于创建子节点
const workFolderId = seedData[0].id

// 在"工作"文件夹下创建子 Prompt
seedData.push(
  {
    id: generateId(),
    user_id: testUserId,
    parent_id: workFolderId,
    type: 'prompt',
    title: '代码审查',
    content: `请帮我审查以下代码，并指出潜在问题：

\`\`\`{{语言}}
{{代码}}
\`\`\`

请从以下方面进行审查：
1. 代码质量和可读性
2. 潜在的 Bug
3. 性能问题
4. 安全隐患
5. 改进建议`,
    is_favorite: 0,
    sort_order: 0,
    collapsed: 0,
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    version: 1
  },
  {
    id: generateId(),
    user_id: testUserId,
    parent_id: workFolderId,
    type: 'prompt',
    title: '周报生成',
    content: `请根据以下工作内容生成一份周报：

本周完成的工作：
{{完成的工作}}

下周计划：
{{下周计划}}

遇到的问题：
{{问题}}

要求：
- 语言简洁专业
- 突出重点成果
- 量化工作成果（如有）`,
    is_favorite: 1,
    sort_order: 1,
    collapsed: 0,
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    version: 1
  }
)

// 在"学习"文件夹下创建子 Prompt
const learnFolderId = seedData[1].id

seedData.push(
  {
    id: generateId(),
    user_id: testUserId,
    parent_id: learnFolderId,
    type: 'prompt',
    title: '概念解释',
    content: `请用简单易懂的语言解释以下概念：

概念：{{概念名称}}

要求：
1. 先用一句话总结
2. 举一个生活中的例子
3. 说明实际应用场景
4. 提供进一步学习的方向`,
    is_favorite: 0,
    sort_order: 0,
    collapsed: 0,
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    version: 1
  }
)

// 插入所有节点
const insertStmt = db.prepare(`
  INSERT INTO nodes (
    id, user_id, parent_id, type, title, content,
    is_favorite, sort_order, collapsed,
    created_at, updated_at, deleted_at, version
  ) VALUES (
    @id, @user_id, @parent_id, @type, @title, @content,
    @is_favorite, @sort_order, @collapsed,
    @created_at, @updated_at, @deleted_at, @version
  )
`)

const insertMany = db.transaction((nodes: typeof seedData) => {
  for (const node of nodes) {
    insertStmt.run(node)
  }
})

insertMany(seedData)

console.log(`Created ${seedData.length} nodes`)
console.log('')
console.log('Seed data created successfully!')
console.log('')
console.log('Test user credentials:')
console.log(`  Email: test@example.com`)
console.log(`  User ID: ${testUserId}`)
console.log('')
console.log('To get a test token, use the magic link API:')
console.log('  POST /api/auth/magic-link')
console.log('  Body: { "email": "test@example.com" }')
