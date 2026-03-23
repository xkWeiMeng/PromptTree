# PromptTree

> Keep Your AI Prompts Organized

**[Website](https://prompttree.tech)** · **[中文说明](#中文说明)**

A tree-structured prompt management tool with variable filling `{{variable}}`, offline-first design, and multi-device sync. Free & open source.

## Features

- **Tree Structure** — Organize prompts like a file manager with unlimited nesting, drag-and-drop sorting, and collapse/expand
- **Variable Filling** — Create reusable templates with `{{variable}}` placeholders, auto-detect and fill in one click
- **Offline-First** — All data stored locally (IndexedDB); works without internet and syncs automatically when connected
- **Multi-Device Sync** — Incremental sync with conflict resolution across Web, Mobile, and Browser Extension
- **Browser Extension** — Use prompts directly on ChatGPT, Claude, Gemini, Poe — no window switching
- **Mind Map View** — Visual browsing of your prompt library with zoom, pan, and collapse
- **Public Sharing** — Generate secure links to share prompts or folders; no account needed to view
- **API Key Access** — Programmatic access for scripts, automation, and workflow tools

## Platforms

| Platform | Tech Stack |
|----------|------------|
| Web App | Vue 3 + Vite + Pinia + Dexie.js |
| Mobile (iOS & Android) | React Native + Expo + Zustand |
| Browser Extension | WXT + Vue 3 |
| Backend | Node.js + Hono + SQLite |
| Shared | TypeScript |

## Project Structure

```
prompttree/
├── packages/
│   ├── shared/        # Shared types, utils, and business logic
│   ├── web/           # Vue 3 Web application
│   ├── mobile/        # React Native mobile app
│   ├── extension/     # Browser extension (Chrome/Firefox)
│   └── backend/       # Node.js + Hono API server
├── data/              # SQLite database (gitignored)
├── package.json       # Monorepo root config
└── pnpm-workspace.yaml
```

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm >= 8

### Install Dependencies

```bash
pnpm install
```

### Configure Environment

```bash
# Backend
cp packages/backend/.env.example packages/backend/.env
# Edit packages/backend/.env with your values

# Web
cp packages/web/.env.example packages/web/.env
```

### Initialize Database

```bash
pnpm --filter @prompttree/backend db:init
```

### Start Development Servers

```bash
# Backend (localhost:3000)
pnpm dev:backend

# Web frontend (localhost:5173, proxies /api to :3000)
pnpm dev:web

# Mobile (Expo)
pnpm dev:mobile

# Browser extension (WXT)
pnpm dev:extension
```

### Run Tests

```bash
pnpm test
```

## License

MIT

---

## 中文说明

> 让混乱归于秩序 —— AI Prompt 管理工具

**[官网](https://prompttree.tech)**

树形结构管理 Prompt，支持变量填充 `{{variable}}`、离线优先、多端同步。免费开源。

### 功能特性

- **树形结构** — 像文件管理器一样组织 Prompt，无限层级嵌套、拖拽排序、折叠记忆
- **变量填充** — 使用 `{{variable}}` 创建可复用模板，自动检测变量并一键填充复制
- **离线优先** — 数据本地存储 (IndexedDB)，无网络也能使用，联网后自动同步
- **多端同步** — Web、移动端、浏览器插件增量同步，自动冲突解决
- **浏览器插件** — 在 ChatGPT、Claude、Gemini、Poe 等 AI 平台直接使用 Prompt，无需切换窗口
- **思维导图** — 可视化浏览 Prompt 库，支持缩放、平移、折叠展开
- **公开分享** — 生成安全分享链接，无需登录即可查看
- **API Key** — 编程接口，支持脚本、自动化和工作流工具集成

### 快速开始

```bash
# 安装依赖
pnpm install

# 配置环境变量
cp packages/backend/.env.example packages/backend/.env
cp packages/web/.env.example packages/web/.env

# 初始化数据库
pnpm --filter @prompttree/backend db:init

# 启动后端 (localhost:3000)
pnpm dev:backend

# 启动 Web 前端 (localhost:5173)
pnpm dev:web
```
