# AGENTS.md — PromptTree 导航枢纽

> Agent 的入口文件。链接到规范，不复制内容。

## 项目概览

PromptTree — Prompt 管理工具，树形结构、变量填充、离线优先 + 云端同步。

- **架构**：pnpm monorepo（shared / web / mobile / extension / backend）
- **技术栈**：Vue 3 + Pinia + Dexie.js | Hono + better-sqlite3 | Expo + Zustand

## 规范入口

| 路径 | 内容 |
|------|------|
| [specs/README.md](specs/README.md) | 规范体系概览与规则 |
| [specs/system/](specs/system/) | 跨服务契约、错误码 |
| [specs/services/](specs/services/) | 各服务能力与接口 |
| [specs/product-specs/](specs/product-specs/) | 产品需求规范 |
| [specs/design-docs/](specs/design-docs/) | 技术设计文档 |
| [specs/exec-plans/](specs/exec-plans/) | 执行计划 |
| [specs/decisions/](specs/decisions/) | 架构决策记录 (ADR) |

## 开发指南

| 资源 | 位置 |
|------|------|
| 项目自定义指令 | 见 repo 根目录 custom instructions |
| 构建与运行 | `pnpm install` → `pnpm dev:backend` → `pnpm dev:web` |
| 测试 | `pnpm test`（shared + web，Vitest） |
| 核心类型 | [packages/shared/src/types.ts](packages/shared/src/types.ts) |
| 数据库 Schema | [packages/backend/src/db/index.ts](packages/backend/src/db/index.ts) |

## Harness 反馈

- [反馈日志](specs/decisions/harness-feedback-log.md) — 记录 Agent 错误与修复

## 规则

1. **规范优先** — 先写/更新规范，再写代码
2. **同一 PR** — 规范变更与代码变更一起提交
3. **WHEN/THEN** — 每个规范包含可验证场景
4. **链接不复制** — 本文件只做导航，不重复内容
