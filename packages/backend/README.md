# @prompttree/backend

Node.js + Hono 后端服务

## 开发

```bash
pnpm dev
```

## 构建

```bash
pnpm build
```

## 数据库初始化

```bash
pnpm db:init
```

## API Key 与开放接口

- API Key 管理（JWT）：
  - `GET /api/auth/api-keys`
  - `POST /api/auth/api-keys`
  - `DELETE /api/auth/api-keys/:id`
- Prompt/Folder 接口（JWT 或 API Key）：
  - `GET /api/prompts`
  - `GET /api/prompts/:id`
  - `POST /api/prompts`
  - `PATCH /api/prompts/:id`
  - `POST /api/folders`

### API Key 调用方式

可任选其一：
- `Authorization: Bearer ptk_xxx`
- `X-API-Key: ptk_xxx`
