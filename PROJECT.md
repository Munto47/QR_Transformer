# QR-Transformer 项目说明

本文档面向开发与运维，说明技术栈、运行流程与部署方式。简明入口见 [`README.md`](README.md)。

---

## 1. 项目定位

**QR-Transformer** 将志愿服务等活动平台的**活动二维码**图片解析后，转换为适用于**签到 / 签退**的签到二维码（payload 中的业务类型等按规则调整）。

**线上地址：** [https://www.breezecode.top](https://www.breezecode.top)  
**部署平台：** 阿里云 ECS + Docker + Nginx + PostgreSQL

核心功能：
- 前端上传图片 → 后端用 jsQR 识别 → 载荷解析与转换 → 返回新 payload
- 「大家一起用」侧栏：按学校共享活动二维码（近期活动 + 本周热门）
- 管理员后台（`/admin`）：分页查看转换记录与活动列表，支持搜索筛选删除

---

## 2. 仓库结构

| 路径 | 说明 |
|------|------|
| `package.json` | 根脚本：一键安装子项目、`dev` 同时起前后端、`build`、`start` |
| `client/` | React + Vite 单页应用，生产构建输出 `client/dist` |
| `server/` | Express API、Prisma 数据层、二维码与图片处理逻辑 |
| `Dockerfile` | 单容器：构建 client + server，启动前执行 `prisma migrate deploy` |
| `docs/` | 教程配图（`image1.png`、`image2.png`） |

---

## 3. 技术栈

### 3.1 前端（`client/`）

| 类别 | 技术 |
|------|------|
| 框架 | **React 19**、**TypeScript**、**Vite 8** |
| 路由 | **React Router v7**（`BrowserRouter`，`/`、`/tutorial`、`/admin`） |
| 样式 | **Tailwind CSS 4**（`@tailwindcss/vite` 插件） |
| HTTP | **Axios**（封装在 `src/api/`） |
| 动效 / 图标 | **Framer Motion**、**lucide-react** |
| 二维码 | **`qrcode`**（浏览器侧生成）、**`canvas-confetti`**（转换成功庆祝动效） |

开发时通过 Vite **`/api` 代理**转发到后端（默认 `http://127.0.0.1:3100`）。

### 3.2 后端（`server/`）

| 类别 | 技术 |
|------|------|
| 运行时 | **Node.js 20**（Dockerfile 基准） |
| 语言 | **TypeScript**，开发用 **`tsx watch`**，生产为 `tsc` 编译后的 `dist/` |
| Web | **Express 4**、**cors**、**dotenv** |
| 数据库 | **PostgreSQL** + **Prisma 6**（迁移在 `server/prisma/migrations/`） |
| 上传 | **multer**（内存存储，限 5MB，仅图片） |
| 图像 / 二维码 | **jimp** 读图、**jsqr** 解码；服务端用 **`qrcode`** 生成 PNG |
| 管理端鉴权 | **jose**（JWT HS256，`ADMIN_PASSWORD` + `JWT_SECRET`，有效期 2 小时） |

### 3.3 部署层

| 类别 | 技术 |
|------|------|
| 服务器 | 阿里云 ECS |
| 容器化 | **Docker**（`node:20-bookworm-slim`，镜像内安装 **OpenSSL** 以满足 Prisma） |
| 反向代理 | **Nginx**（HTTP → HTTPS 跳转、反代至容器端口） |
| HTTPS | 阿里云 SSL 证书 / Let's Encrypt |
| 数据库 | 阿里云 RDS PostgreSQL 或同机 PostgreSQL |

---

## 4. 页面路由

| 路径 | 说明 |
|------|------|
| `/` | 主页：上传转换、历史记录、分享链接、侧边栏活动列表 |
| `/tutorial` | 使用教程：两张指导图片 + 步骤说明 + 常见问题 |
| `/admin` | 管理后台：概览统计、转换记录、活动二维码（均分页，每页 20 条） |

服务端已配置静态资源 fallback，所有路径均返回 `index.html`，由 React Router 处理。

---

## 5. 本地开发

**前置条件：** Node.js 18+、npm、PostgreSQL 实例（本地 Docker 或远程）。

```bash
npm install && npm run install:all

# 配置 server/.env（见下方环境变量说明）
cp server/.env.example server/.env

# 首次建表
cd server && npx prisma migrate deploy && cd ..

# 启动
npm run dev
# 前端：http://localhost:5173
# 后端：http://localhost:3100
```

**本地 PostgreSQL（Docker）：**

```bash
docker run -d \
  --name qr-pg \
  -e POSTGRES_USER=qr \
  -e POSTGRES_PASSWORD=qr123 \
  -e POSTGRES_DB=qr_dev \
  -p 5432:5432 \
  postgres:16-alpine
```

`DATABASE_URL="postgresql://qr:qr123@localhost:5432/qr_dev"`

---

## 6. 环境变量

| 变量 | 说明 | 必填 |
|------|------|------|
| `DATABASE_URL` | PostgreSQL 连接字符串 | **是** |
| `ADMIN_PASSWORD` | 管理员登录密码 | **是** |
| `JWT_SECRET` | JWT 签名密钥（32 位以上随机字符串） | **是** |
| `PORT` | 后端监听端口，默认 `3100` | 否 |
| `HOST` | 监听地址，默认 `0.0.0.0` | 否 |
| `CLIENT_ORIGIN` | CORS 来源限制（生产建议设为 `https://www.breezecode.top`） | 否 |
| `CLIENT_DIST` | 静态文件目录，默认 `../../client/dist`（相对 server） | 否 |
| `VITE_API_PROXY_TARGET` | **仅前端开发**：Vite 代理目标，默认 `http://127.0.0.1:3100` | 否 |

**注意：** 勿将含密钥的 `.env` 提交到 Git；以 `server/.env.example` 为模板。

---

## 7. 生产部署（阿里云）

### 方式一：Docker（推荐）

```bash
# 在阿里云 ECS 上
docker build -t qr-transformer .

docker run -d \
  --name qr-transformer \
  --restart unless-stopped \
  -p 3100:3100 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/dbname" \
  -e ADMIN_PASSWORD="strong-password" \
  -e JWT_SECRET="random-64-char-string" \
  -e NODE_ENV=production \
  qr-transformer
```

容器启动时自动执行 `prisma migrate deploy` 完成数据库迁移。

### 方式二：直接运行

```bash
# 在 ECS 上安装 Node.js 20 + PostgreSQL
npm install && npm run install:all

# 配置 server/.env
cd server && npx prisma migrate deploy && cd ..

npm run build
NODE_ENV=production npm run start
# 或用 PM2：pm2 start "npm run start" --name qr-transformer
```

### Nginx 配置

```nginx
server {
    listen 443 ssl;
    server_name www.breezecode.top;

    ssl_certificate     /etc/ssl/breezecode.top.pem;
    ssl_certificate_key /etc/ssl/breezecode.top.key;

    location / {
        proxy_pass         http://127.0.0.1:3100;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        client_max_body_size 10m;
    }
}

server {
    listen 80;
    server_name www.breezecode.top;
    return 301 https://$host$request_uri;
}
```

---

## 8. API 一览

基础路径均为 `/api`（健康检查在 `/health`）。

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| `GET` | `/health` | 无 | 健康检查 `{ ok: true }` |
| `POST` | `/api/transform` | 无 | `multipart/form-data`，字段 `image`，返回转换结果 |
| `GET` | `/api/processing-logs/count` | 无 | 累计处理次数 |
| `POST` | `/api/admin/login` | 无 | 管理员登录，返回 JWT |
| `GET` | `/api/admin/stats` | JWT | 概览统计（转换数、活动数、下载数） |
| `GET` | `/api/admin/processing-logs` | JWT | 分页查询转换记录（`page`、`limit`≤50、`search`） |
| `DELETE` | `/api/admin/processing-logs/:id` | JWT | 删除转换记录 |
| `GET` | `/api/admin/activity-qrs` | JWT | 分页查询活动（`page`、`limit`≤50、`school`、`dateFrom`、`dateTo`） |
| `DELETE` | `/api/admin/activity-qrs/:id` | JWT | 删除活动 |
| `GET` | `/api/activity-qrs` | 无 | 按学校查询近期活动（`?school=`） |
| `GET` | `/api/activity-qrs/hot` | 无 | 本周热门活动（按下载量排序） |
| `GET` | `/api/activity-qrs/school-stats` | 无 | 学校活动统计（`?school=`） |
| `POST` | `/api/activity-qrs/share` | 无 | 公开投稿活动二维码 |
| `POST` | `/api/activity-qrs` | JWT | 管理员上传活动二维码（`multipart/form-data`） |
| `GET` | `/api/activity-qrs/:id/image` | 无 | 活动二维码图片（自增下载计数） |

单文件上传限制 **5MB**；超出返回 `FILE_TOO_LARGE` 错误。

---

## 9. 数据模型

- **`ProcessingLog`**：每次 `/api/transform` 的原始内容、提取 ID、最终内容、上传图片二进制与元数据。
- **`ActivityQr`**：活动名称、时间、学校、签到时间、图片二进制、`downloadCount`（下载计数）等。

详细字段见 `server/prisma/schema.prisma`。

---

## 10. 常用脚本

| 命令 | 说明 |
|------|------|
| `npm run install:all` | 安装 `server` 与 `client` 依赖 |
| `npm run dev` | 并行启动 server（`tsx watch`）与 client（`vite`） |
| `npm run build` | 先构建 client，再构建 server |
| `npm run start` | 执行 `prisma migrate deploy` 后启动 Node（生产用） |
| `cd server && npx prisma migrate dev` | 本地新增迁移 |
| `cd server && npx prisma generate` | 重新生成 Prisma Client |

---

## 11. 文档关系

- **[`README.md`](README.md)**：面向用户与初次接触项目的开发者，含在线体验、使用教程、快速部署。
- **`PROJECT.md`（本文）**：面向开发与运维，含完整技术架构、流程与 API 参考。

如线上地址或技术栈有变更，请同步更新两个文件。
