---
name: prompttree-api-key
description: "当用户要通过脚本、Agent 或自动化流程调用 PromptTree 官网 API（https://prompttree.tech）来管理 prompts 和 folders 时，使用此 skill。触发关键词包括：'API Key'、'批量管理提示词'、'对接 PromptTree'、'调用 PromptTree 接口'、'PromptTree API'、'获取我的 prompt'、'批量创建 prompt'。此 skill 会先判断是否已有 API Key；如无则先用 JWT 调用 /api/auth/api-keys 创建 key，再用 X-API-Key 头调用业务接口。即使用户没有明确提到 API Key，只要涉及通过 HTTP 接口操作 PromptTree 数据，也应触发。"
---

# PromptTree API Key 调用 Skill

指导 Agent 通过 API Key 调用 PromptTree 官网（`https://prompttree.tech`）的 HTTP 接口来管理 prompts 和 folders。

这是对外公开的在线服务接口，不是本地开发服务器。

## 目标

1. 在需要时先完成 API Key 生命周期管理（创建 / 查看 / 吊销）。
2. 使用 API Key 调用 Prompt / Folder 业务接口。
3. 明确鉴权边界和错误处理，避免误调接口。

## 前置条件

- **Base URL**: `https://prompttree.tech`（固定，不可更改）
- 鉴权二选一：
  - 已有 `PROMPTTREE_API_KEY`（推荐，格式 `ptk_` 前缀 + 40 位随机字符串）
  - 或 `PROMPTTREE_JWT`（用于先创建 API Key，可通过网站登录后在浏览器 DevTools 获取）

建议先在 shell 中设置：

```bash
export PROMPTTREE_API_KEY="ptk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
# 或者，若需要先创建 API Key：
export PROMPTTREE_JWT="eyJhbGciOiJIUzI1NiIs..."
```

## 可用接口总览

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| GET | `/api/auth/api-keys` | JWT only | 列出当前用户的 API Keys |
| POST | `/api/auth/api-keys` | JWT only | 创建新 API Key |
| DELETE | `/api/auth/api-keys/:id` | JWT only | 吊销 API Key |
| GET | `/api/prompts` | JWT 或 API Key | 获取 prompt 列表 |
| GET | `/api/prompts/:id` | JWT 或 API Key | 获取单个 prompt |
| POST | `/api/prompts` | JWT 或 API Key | 创建 prompt |
| PATCH | `/api/prompts/:id` | JWT 或 API Key | 更新 prompt |
| POST | `/api/folders` | JWT 或 API Key | 创建 folder |

> **重要**：`/api/sync/*` 路由**仅支持 JWT**，API Key 无法访问。不要尝试用 API Key 调用同步接口。

## 执行流程

### 阶段 A：管理 API Key（需要 JWT）

仅当没有可用 API Key 时执行。API Key 管理接口只接受 JWT 鉴权。

#### 1) 列出现有 Key

```bash
curl -sS "https://prompttree.tech/api/auth/api-keys" \
  -H "Authorization: Bearer $PROMPTTREE_JWT"
```

响应示例：

```json
{
  "success": true,
  "keys": [
    {
      "id": "uuid",
      "name": "My Key",
      "prefix": "ptk_a1b2",
      "createdAt": 1711000000000,
      "lastUsedAt": 1711100000000,
      "expiresAt": null
    }
  ]
}
```

#### 2) 创建新 Key

```bash
curl -sS -X POST "https://prompttree.tech/api/auth/api-keys" \
  -H "Authorization: Bearer $PROMPTTREE_JWT" \
  -H "Content-Type: application/json" \
  -d '{"name": "Agent Integration Key"}'
```

响应示例：

```json
{
  "success": true,
  "key": {
    "id": "uuid",
    "name": "Agent Integration Key",
    "prefix": "ptk_a1b2",
    "createdAt": 1711000000000
  },
  "apiKey": "ptk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"
}
```

> **`apiKey` 明文仅此一次返回**，务必立即保存。后续查询只能看到 `prefix`。

#### 3) 吊销 Key

```bash
curl -sS -X DELETE "https://prompttree.tech/api/auth/api-keys/<keyId>" \
  -H "Authorization: Bearer $PROMPTTREE_JWT"
```

### 阶段 B：用 API Key 调业务接口

推荐请求头（二选一）：

```text
X-API-Key: ptk_xxx
```

```text
Authorization: Bearer ptk_xxx
```

#### 1) 获取 Prompt 列表

```bash
curl -sS "https://prompttree.tech/api/prompts" \
  -H "X-API-Key: $PROMPTTREE_API_KEY"
```

响应：`{ "success": true, "prompts": [...] }`

#### 2) 获取单个 Prompt

```bash
curl -sS "https://prompttree.tech/api/prompts/<promptId>" \
  -H "X-API-Key: $PROMPTTREE_API_KEY"
```

响应：`{ "success": true, "prompt": { ... } }`

#### 3) 创建 Prompt

```bash
curl -sS -X POST "https://prompttree.tech/api/prompts" \
  -H "X-API-Key: $PROMPTTREE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "新 Prompt",
    "content": "你好，{{name}}",
    "parentId": null,
    "isFavorite": false,
    "sortOrder": 0,
    "collapsed": false
  }'
```

字段说明：

| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| `title` | string | **是** | 1–200 字符，不可为空 |
| `content` | string | 否 | 支持 `{{variable}}` 语法 |
| `parentId` | string \| null | 否 | 必须是已存在的 folder 的 UUID，或 null（根级） |
| `isFavorite` | boolean | 否 | 默认 false |
| `sortOrder` | number | 否 | 默认 0 |
| `collapsed` | boolean | 否 | 默认 false |

响应：`{ "success": true, "prompt": { "id": "uuid", ... } }`

#### 4) 更新 Prompt

至少传一个可更新字段（`title`、`content`、`parentId`、`isFavorite`、`sortOrder`、`collapsed`）：

```bash
curl -sS -X PATCH "https://prompttree.tech/api/prompts/<promptId>" \
  -H "X-API-Key: $PROMPTTREE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title": "更新后的标题"}'
```

响应：`{ "success": true, "prompt": { ... } }`

#### 5) 创建 Folder

```bash
curl -sS -X POST "https://prompttree.tech/api/folders" \
  -H "X-API-Key: $PROMPTTREE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "新文件夹",
    "parentId": null,
    "sortOrder": 0,
    "collapsed": false
  }'
```

字段校验与 prompt 一致（`title` 必填 1–200 字符，`parentId` 必须指向 folder 或为 null）。

响应：`{ "success": true, "folder": { "id": "uuid", ... } }`

> **注意**：Folder 只有创建接口。更新和查询 folder 需要通过 `/api/sync` 路由（仅 JWT），API Key 无法操作。

## 错误处理

所有错误响应格式：`{ "error": "描述信息", "code": "ERROR_CODE" }`

| HTTP 状态码 | 常见原因 | 排查方式 |
|-------------|----------|----------|
| 401 | 缺少鉴权头、Key 已吊销/过期、格式错误 | 检查 `X-API-Key` 或 `Authorization` 头；确认 key 以 `ptk_` 开头 |
| 400 | 请求体缺少必填字段或类型错误 | 检查 `title` 非空（1–200 字符）；`parentId` 为合法 UUID 或 null |
| 404 | 资源不存在或不属于当前用户 | 确认 ID 正确且未被软删除 |
| 500 | 服务端内部错误 | 记录请求参数，稍后重试或联系维护者 |

## 约束

1. **不要用 API Key 调 `/api/sync/*`** — 同步路由仅接受 JWT。
2. **不要编造不存在的接口** — 上方表格即为 API Key 可用的全部接口。
3. **保护 API Key 明文** — 创建后仅展示一次，日志和回复中必须脱敏（如 `ptk_****abcd`）。
4. **parentId 必须指向 folder** — 不能把 prompt 的 ID 作为 parentId。

## 输出模板

执行后按以下结构汇报：

1. 鉴权方式（JWT / API Key）
2. 调用步骤（按顺序列出 endpoint + method）
3. 每步结果摘要（`success`、返回 ID、错误码）
4. 若失败：根因判断 + 可执行的修复建议
5. 已知限制提醒
