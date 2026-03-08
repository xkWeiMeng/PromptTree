---
name: prompttree-api-key
description: 当用户要通过脚本、Agent 或自动化流程调用 PromptTree 后端接口（尤其是 prompts/folders）时，必须使用此 skill。即使用户只提到“API Key”“批量管理提示词”“对接 PromptTree 接口”而未明确点名 skill，也应触发。此 skill 会先判断是否已有 API Key；如无则先用 JWT 调用 /api/auth/api-keys 创建 key，再用 x-api-key 或 Bearer ptk_ 调用业务接口，并输出可执行的排障结论。
metadata:
  version: 1.0.0
---

# PromptTree API Key 调用 Skill

用于指导其它 Agent 以稳定、可审计的方式调用 PromptTree 系统接口（API Key 模式）。

## 目标

1. 在需要时先完成 API Key 生命周期管理（创建/查看/吊销）。
2. 使用 API Key 调用 Prompt/Folder 业务接口。
3. 明确鉴权边界和错误处理，避免误调接口。

## 触发场景

出现以下任一意图时触发：

- “调用 PromptTree API”
- “用 API Key 操作 prompts/folders”
- “批量创建/更新 PromptTree 节点”
- “给 Agent 接入 PromptTree 后端”
- “写 curl / 脚本对接 PromptTree”

## 输入与前置条件

- `BASE_URL`（默认 `http://localhost:3000`）
- 二选一：
  - 已有 `PROMPTTREE_API_KEY`（推荐）
  - 或者 `PROMPTTREE_JWT`（用于先创建 API Key）

建议先在 shell 中设置：

```bash
export BASE_URL="http://localhost:3000"
export PROMPTTREE_API_KEY="<ptk_xxx>"   # 若已持有
export PROMPTTREE_JWT="<jwt_xxx>"       # 若需要先创建 API Key
```

## 执行流程

### 阶段 A：管理 API Key（JWT）

仅当没有可用 API Key 时执行本阶段。

1. 列出现有 Key（可选）：

```bash
curl -sS "$BASE_URL/api/auth/api-keys" \
  -H "Authorization: Bearer $PROMPTTREE_JWT"
```

2. 创建新 Key（推荐）：

```bash
curl -sS -X POST "$BASE_URL/api/auth/api-keys" \
  -H "Authorization: Bearer $PROMPTTREE_JWT" \
  -H "Content-Type: application/json" \
  -d '{"name":"Agent Integration Key"}'
```

预期响应包含：

- `success: true`
- `key`（元数据）
- `apiKey`（明文，仅这次可见）

3. 必要时吊销 Key：

```bash
curl -sS -X DELETE "$BASE_URL/api/auth/api-keys/<keyId>" \
  -H "Authorization: Bearer $PROMPTTREE_JWT"
```

### 阶段 B：用 API Key 调业务接口

推荐请求头：

```text
X-API-Key: ptk_xxx
```

兼容写法（同样有效）：

```text
Authorization: Bearer ptk_xxx
```

#### 1) 获取 Prompt 列表

```bash
curl -sS "$BASE_URL/api/prompts" \
  -H "X-API-Key: $PROMPTTREE_API_KEY"
```

#### 2) 获取单个 Prompt

```bash
curl -sS "$BASE_URL/api/prompts/<promptId>" \
  -H "X-API-Key: $PROMPTTREE_API_KEY"
```

#### 3) 创建 Prompt

```bash
curl -sS -X POST "$BASE_URL/api/prompts" \
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

#### 4) 更新 Prompt（至少传一个字段）

```bash
curl -sS -X PATCH "$BASE_URL/api/prompts/<promptId>" \
  -H "X-API-Key: $PROMPTTREE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "更新后的标题"
  }'
```

#### 5) 创建 Folder

```bash
curl -sS -X POST "$BASE_URL/api/folders" \
  -H "X-API-Key: $PROMPTTREE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "新文件夹",
    "parentId": null,
    "sortOrder": 0,
    "collapsed": false
  }'
```

## 错误处理规范

- `401 Unauthorized`
  - 检查是否传入了 `X-API-Key` 或 `Authorization: Bearer ...`
  - 检查 key 是否被吊销、过期或格式错误（需 `ptk_` 前缀）
- `400 Bad Request`
  - 检查 JSON 结构和字段类型（例如 `title` 必须是非空字符串）
- `404 Not Found`
  - 检查资源 ID 是否存在且属于当前用户
- `500`
  - 后端内部错误，保留请求参数摘要并建议重试或联系维护者

## 强约束

1. 不要把 `/api/sync/*` 当成 API Key 可调用接口（该路由仅 JWT）。
2. 不要编造不存在的接口或字段。
3. API Key 明文仅在创建时展示一次，后续输出必须脱敏（如 `ptk_****abcd`）。
4. 在日志或最终回复中避免泄露完整密钥。

## 输出模板

执行后按以下结构汇报：

1. `Base URL` 与鉴权方式（JWT 阶段 / API Key 阶段）
2. 调用步骤（按顺序列出 endpoint + method）
3. 每步关键结果（如 `success`、返回对象主键、错误码）
4. 若失败：根因判断 + 下一步可执行建议
5. 已知限制提醒（例如 API Key 不支持 `/api/sync/*`）
