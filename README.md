# QR-Transformer

全栈 MVP：上传二维码图片，后端用 jimp + jsqr 解析 JSON、提取 `activityId`，填入固定模板并写入 SQLite（Prisma），前端展示原始/转换数据、生成新二维码（可下载）与历史记录。

## 技术栈

- 前端：`client/` — React (Vite)、Tailwind CSS v4、Axios、`qrcode`
- 后端：`server/` — Node.js (Express)、Prisma、SQLite、jimp、jsqr、multer

## 环境要求

- Node.js 18+
- npm

## 首次安装

在项目根目录：

```bash
npm install
npm run install:all
```

初始化数据库（在 `server` 目录执行迁移；会生成/更新 `server/prisma/dev.db`）：

```bash
cd server
npx prisma migrate dev
```

若仅想快速同步 schema 而不生成迁移文件，可使用：

```bash
npx prisma db push
```

## 本地开发

**终端 1 — 后端**（默认端口 **`3100`**，可在 `server/.env` 中设置 `PORT`；入口已加载 `dotenv`）：

```bash
cd server
npm run dev
```

**终端 2 — 前端**（Vite 默认把 `/api` 代理到 **`http://127.0.0.1:3100`**，避免与本机占用 `3001` 的其它程序冲突）：

```bash
cd client
npm run dev
```

若你改了后端端口，请在 `client/.env` 或 `client/.env.local` 中设置同一端口，例如：

```bash
VITE_API_PROXY_TARGET=http://127.0.0.1:3101
```

或在根目录一条命令同时启动前后端（需先执行根目录 `npm install` 以安装 `concurrently`）：

```bash
npm install
npm run dev
```

浏览器打开 Vite 提示的本地地址（一般为 `http://localhost:5173`）。

### 常见问题

- **`/api/...` 返回 404 或异常 JSON**：通常是 Vite 代理指向了**错误端口**（例如本机 `3001` 已被其它服务占用，而本项目的 API 实际未在该端口启动）。请确认终端里后端日志为 `listening on http://127.0.0.1:3100`（或你在 `.env` 中配置的端口），并与 `VITE_API_PROXY_TARGET` 一致。
- **后端启动报 `EADDRINUSE`**：更换 `server/.env` 中的 `PORT`，并同步设置 `client` 的 `VITE_API_PROXY_TARGET`。

## API 说明

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/transform` | `multipart/form-data`，字段名 `image`，上传二维码图片 |
| `GET` | `/api/processing-logs` | 最近 50 条处理记录 |
| `GET` | `/health` | 健康检查 |

## 生产构建

```bash
cd client && npm run build
cd ../server && npm run build && npm start
```

前端静态资源需由 CDN/静态托管或配置反向代理；开发环境下由 Vite 代理 API 即可。
