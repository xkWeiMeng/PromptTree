# PromptTree

> 让混乱归于秩序 —— Prompt 管理工具

## 项目结构

```
prompttree/
├── packages/
│   ├── shared/        # 共享代码（类型、工具函数、业务逻辑）
│   ├── web/           # Vue 3 Web 应用
│   ├── mobile/        # React Native 移动端
│   ├── extension/     # 浏览器插件 (Chrome/Firefox)
│   └── backend/       # Node.js + Hono 后端
├── docs/              # 文档
├── data/              # SQLite 数据库（.gitignore）
├── package.json       # Monorepo 根配置
└── pnpm-workspace.yaml
```

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 初始化数据库

```bash
pnpm --filter @prompttree/backend db:init
```

### 启动开发服务

```bash
# 启动后端
pnpm dev:backend

# 启动 Web 前端（新终端）
pnpm dev:web

# 启动移动端（新终端）
pnpm dev:mobile

# 启动插件开发（新终端）
pnpm dev:extension
```

## 技术栈

| 模块 | 技术 |
|------|------|
| Web | Vue 3 + Vite + Pinia + Dexie.js |
| Mobile | React Native + Expo + Zustand |
| Extension | WXT + Vue 3 |
| Backend | Node.js + Hono + SQLite |
| Shared | TypeScript |

## 文档

- [技术架构](docs/技术架构.md)
- [产品方向](产品方向.md)

## License

MIT
