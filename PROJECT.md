# QR-Transformer 项目说明

本文档说明 **QR-Transformer** 的定位、技术栈、使用方式与运行流程。更简短的入口见根目录 [`README.md`](README.md)。

---

## 1. 项目是什么

**QR-Transformer** 将志愿服务等活动平台上的 **活动二维码** 图片解析后，转换为适用于 **签到 / 签退** 流程的 **签到二维码**（payload 中的业务类型等会按规则调整）。前端提供上传、结果展示、处理历史；并支持「大家一起用」侧栏（按学校筛选活动二维码）以及管理员投稿活动二维码等功能。

核心业务在后端完成：**图片解码 → 二维码识别（jsQR）→ 载荷解析与转换（`qrTransform`）→ 可选写入 PostgreSQL**。

---

## 2. 仓库结构

| 路径 | 说明 |
|------|------|
| `package.json` | 根脚本：一键安装子项目、`dev` 同时起前后端、`build`、`start` |
| `client/` | React + Vite 单页应用，生产构建输出 `client/dist` |
| `server/` | Express API、`prisma` 数据层、二维码与图片处理逻辑 |
| `Dockerfile` | 单容器：构建 client + server，启动前执行 `prisma migrate deploy` |
| `docs/` | 说明配图等（如 README 中引用的截图） |

---

## 3. 技术栈

### 3.1 前端（`client/`）

| 类别 | 技术 |
|------|------|
| 运行时 / 框架 | **Node.js**（开发构建）、**React 19**、**TypeScript** |
| 构建工具 | **Vite 8**、`@vitejs/plugin-react` |
| 样式 | **Tailwind CSS 4**（`@tailwindcss/vite` 插件） |
| HTTP | **Axios**（封装在 `src/api/`） |
| 动效 / 图标 | **Framer Motion**、**lucide-react** |
| 二维码展示 | **`qrcode`**（浏览器侧生成二维码等） |
| 代码质量 | **ESLint 9**（`eslint.config.js`、typescript-eslint 等） |

开发时通过 Vite **`/api` 代理** 转发到后端（默认 `http://127.0.0.1:3100`，可用 `VITE_API_PROXY_TARGET` 覆盖）。

### 3.2 后端（`server/`）

| 类别 | 技术 |
|------|------|
| 运行时 | **Node.js**（建议与 Dockerfile 一致使用 **20** 或兼容版本） |
| 语言 | **TypeScript**，开发用 **`tsx watch`**，生产为 `tsc` 编译后的 `dist/` |
| Web | **Express 4**、**cors**、**dotenv** |
| 数据库 | **PostgreSQL** + **Prisma 6**（`@prisma/client`、迁移在 `server/prisma/migrations/`） |
| 上传 | **multer**（内存存储，配合自定义「仅图片」校验） |
| 图像 / 二维码 | **jimp** 读图、**jsqr** 解码；必要时服务端用 **qrcode** 生成 PNG |
| 管理端鉴权 | **jose**（JWT，`ADMIN_PASSWORD` + `JWT_SECRET`） |

### 3.3 根目录与部署

| 类别 | 技术 |
|------|------|
| 并行开发 | **concurrently**（`npm run dev` 同时跑 `server` 与 `client`） |
| 容器 | **Docker**（`node:20-bookworm-slim`，镜像内安装 **OpenSSL** 以满足 Prisma） |

---

## 4. 使用方式与流程

### 4.1 终端用户（线上或本地构建后）

1. 在浏览器打开部署地址或本地前端地址（开发默认 `http://localhost:5173`；生产通常由 Express 托管静态资源，同源访问 `/api`）。
2. 在活动平台 **活动详情** 中取得 **活动二维码**（截图或保存图片，尽量清晰完整）。
3. 在页面上传图片，等待解析；成功则展示 **转换后的签到用二维码内容**，并可查看 **最近处理记录**。
4. 若解析失败，界面可提示参考示意（见前端 `showParseReference` 等逻辑）。
5. **「大家一起用」**：用户可选择学校、填写活动信息等，将当前转换得到的 payload 投稿为共享活动（公开接口 `POST /api/activity-qrs/share`）。
6. **侧栏活动列表**：按 `school` 查询附近时间的活动二维码（`GET /api/activity-qrs?school=...`），可拉取图片 `GET /api/activity-qrs/:id/image`。
7. **管理员**：通过 `POST /api/admin/login` 获取 JWT，在已登录状态下可上传活动二维码入库（`POST /api/activity-qrs`，需 `Authorization: Bearer <token>`）。

### 4.2 本地开发（推荐流程）

**前置条件：** **Node.js 18+**、**npm**、可连接的 **PostgreSQL**。

1. 在仓库根目录安装根依赖与子项目依赖：

   ```bash
   npm install
   npm run install:all
   ```

2. 在 `server/` 下复制 `server/.env.example` 为 `server/.env`，填写 **`DATABASE_URL`**（以及生产或管理功能所需的 **`ADMIN_PASSWORD`**、**`JWT_SECRET`** 等）。

3. 执行数据库迁移（首次或 schema 变更后）：

   ```bash
   cd server && npx prisma migrate dev && cd ..
   ```

4. 启动前后端（单命令）：

   ```bash
   npm run dev
   ```

   - 前端开发服务器：默认 **5173**（Vite）。
   - 后端 API：默认 **3100**（可在 `server/.env` 中设置 `PORT`）。
   - 若改后端端口，请在 `client/.env.local` 中设置 **`VITE_API_PROXY_TARGET`** 指向同一地址，以便代理 `/api` 正确转发。

5. 可选：仅构建验证

   ```bash
   npm run build
   ```

   根目录 **`npm run start`** 会执行 `server` 的 `start`（先 **`prisma migrate deploy`** 再启动 Node），通常用于生产或本地模拟生产；需已构建 `client` 且 `NODE_ENV=production` 时 Express 才会托管 `client/dist`。

### 4.3 生产部署（概要）

- **Docker / Railway 等**：使用根目录 `Dockerfile`。构建阶段 `npm ci` 安装 client、server 并执行 `client`/`server` 的 `build`；运行时需注入 **`DATABASE_URL`**，启动命令内含 **`prisma migrate deploy`** 与 `node dist/index.js`。平台分配的 **`PORT`** 由环境变量提供。
- **自建**：安装 Node 与 PostgreSQL → 配置 `DATABASE_URL` → 安装依赖并 `npm run build` → 设置 `NODE_ENV=production` 与 `CLIENT_DIST`（若静态资源不在默认相对路径）→ 运行 `server` 的 `npm start`。

**注意：** 未配置有效 **`DATABASE_URL`** 时，迁移无法完成，服务无法正常持久化数据（与 README 说明一致）。

---

## 5. 环境变量（要点）

| 变量 | 作用 |
|------|------|
| `DATABASE_URL` | Prisma 连接 PostgreSQL（**必填**于迁移与运行） |
| `PORT` | 后端监听端口（默认 `3100`） |
| `HOST` | 监听地址（默认 `0.0.0.0`，容器内需对外访问时常用） |
| `CLIENT_ORIGIN` | CORS 来源（未设时 `cors` 默认较宽松，生产可按需收紧） |
| `CLIENT_DIST` | 生产环境静态文件目录，默认相对 `server` 解析到 `../../client/dist` |
| `ADMIN_PASSWORD` | 管理员登录口令（`POST /api/admin/login`） |
| `JWT_SECRET` | 签发管理员 JWT |
| `VITE_API_PROXY_TARGET` | **仅前端开发**：Vite 将 `/api` 代理到的后端基地址 |

勿将含密钥的 `.env` 提交到版本库；以 `server/.env.example` 为模板。

---

## 6. 常用 npm 脚本

| 命令 | 说明 |
|------|------|
| `npm run install:all` | 分别安装 `server` 与 `client` 依赖 |
| `npm run dev` | 并行启动 server（`tsx watch`）与 client（`vite`） |
| `npm run build` | 先构建 client，再构建 server |
| `npm run start` | 在 `server` 目录执行 `start`（迁移 deploy + 启动） |
| `npm run db:migrate` 等 | 见 `server/package.json`（`db:migrate`、`migrate:deploy` 等） |

---

## 7. API 一览

基础路径均为 **`/api`**（健康检查在根路径 **`/health`**）。

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| `GET` | `/health` | 无 | 健康检查 `{ ok: true }` |
| `POST` | `/api/transform` | 无 | `multipart/form-data`，字段名 **`image`**，上传二维码图片，返回转换结果 |
| `GET` | `/api/processing-logs` | 无 | 最近 50 条处理记录（不含图片二进制） |
| `GET` | `/api/processing-logs/:id/image` | 无 | 指定记录的上传原图 |
| `POST` | `/api/admin/login` | 无 | Body JSON：`password`，返回 JWT |
| `POST` | `/api/activity-qrs` | **管理员 JWT** | `multipart/form-data`：`image` + 活动字段等，创建活动二维码记录 |
| `GET` | `/api/activity-qrs` | 无 | Query：**`school`**（合法学校值），返回该校推荐列表 |
| `GET` | `/api/activity-qrs/:id/image` | 无 | 活动二维码图片 |
| `POST` | `/api/activity-qrs/share` | 无 | JSON：`school`、`activityName`、`qrPayload`、可选 `signInAt`，服务端生成 PNG 并入库 |

单文件上传大小限制为 **5MB**（超出返回 `FILE_TOO_LARGE` 类错误）。

---

## 8. 数据模型（Prisma 摘要）

- **`ProcessingLog`**：每次 `/api/transform` 成功后的原始内容、提取 ID、最终内容、上传图片二进制与元数据、创建时间。
- **`ActivityQr`**：活动名称、时间、学校、可选签到开始时间、图片二进制与元数据等，供侧栏与分享功能使用。

详细字段见 `server/prisma/schema.prisma`。

---

## 9. 与其他文档的关系

- **[`README.md`](README.md)**：在线体验链接、简明使用提示、部署步骤与 API 简表。
- **`PROJECT.md`（本文）**：面向开发与运维的 **结构、技术栈、流程与环境** 总览。

若线上地址或依赖大版本升级，请同步更新 `README.md` 与本文件中的版本描述。
