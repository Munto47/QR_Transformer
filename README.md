# QR-Transformer

全栈 MVP：上传二维码图片，后端用 jimp + jsqr 解析 JSON、提取 `activityId`，填入固定模板并写入 SQLite（Prisma），前端展示原始/转换数据、生成新二维码（可下载）与历史记录。

## 公网访问（部署后把链接写在这里）

在 [Railway](https://railway.app/)、[Render](https://render.com/) 等平台完成 [云端部署](#cloud-deploy) 后，把平台分配的 **HTTPS 地址**填到下面，其他人即可从本 README 直接打开网站（无需小程序；也可先用平台提供的子域名，不必自备域名）。

|  |  |
|--|--|
| **在线地址** | `https://请替换为你的云端地址` |

---

## 技术栈

- 前端：`client/` — React (Vite)、Tailwind CSS v4、Axios、`qrcode`
- 后端：`server/` — Node.js (Express)、Prisma、SQLite、jimp、jsqr、multer

## 环境要求

- Node.js 18+
- npm

## 仓库与敏感信息

- **应提交**：`client/`、`server/` 源码、`package.json` / `package-lock.json`、Prisma `schema` 与 `migrations/`、`client/public/` 静态资源等。
- **勿提交**：`server/.env`（密钥与本地配置）、本地 SQLite `*.db`、各目录 `node_modules/`、`dist/`。本地可从 `[server/.env.example](server/.env.example)` 复制为 `.env`。
- 若远程仓库里**只有 README**，通常是尚未执行 `git add` 添加整个项目目录，并非被 `.gitignore` 屏蔽了全部代码。

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

**终端 1 — 后端**（默认端口 `**3100`**，可在 `server/.env` 中设置 `PORT`；入口已加载 `dotenv`）：

```bash
cd server
npm run dev
```

**终端 2 — 前端**（Vite 默认把 `/api` 代理到 `**http://127.0.0.1:3100`**，避免与本机占用 `3001` 的其它程序冲突）：

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

- `**/api/...` 返回 404 或异常 JSON**：通常是 Vite 代理指向了**错误端口**（例如本机 `3001` 已被其它服务占用，而本项目的 API 实际未在该端口启动）。请确认终端里后端日志为 `listening on http://127.0.0.1:3100`（或你在 `.env` 中配置的端口），并与 `VITE_API_PROXY_TARGET` 一致。
- **后端启动报 `EADDRINUSE`**：更换 `server/.env` 中的 `PORT`，并同步设置 `client` 的 `VITE_API_PROXY_TARGET`。

## 没有服务器、也没有域名？

**自用（最省事）**  
只在本人电脑上用即可：**不必买服务器、不必备案域名**。装好依赖后执行根目录 `npm run dev`（或前后端两个终端），浏览器打开 `http://localhost:5173` 就能完整使用。数据在本地 SQLite，不经过公网。

**需要让别人临时访问你电脑上的页面（仍不买服务器）**  
可以用**内网穿透**：在你本机已正常跑起 `npm run dev` 的前提下，用工具把本机端口映射成一个临时公网链接（例如 [ngrok](https://ngrok.com/)、[Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/) 等）。一般只需穿透 **前端端口**（如 `5173`），Vite 会把 `/api` 代理到本机后端，对方用一条链接即可访问。注意：链接多为临时的，电脑关机或断网即失效；且勿用于敏感数据。

**希望「一个链接、前后端同一端口」再穿透**  
可先按上文做**生产构建**，`NODE_ENV=production` 只启动后端（Express 同时托管 `client/dist`），再对**该端口**（如 `3100`）做内网穿透，只需暴露一个端口。

**完全不想装环境**  
可考虑 GitHub **Codespaces**、GitPod 等云端开发环境：在浏览器里打开仓库、装 Node 后同样 `npm run dev`，但仍是「云端一台临时机器」，并非真正意义上的「无服务器自动托管」。

---

## API 说明


| 方法     | 路径                     | 说明                                        |
| ------ | ---------------------- | ----------------------------------------- |
| `POST` | `/api/transform`       | `multipart/form-data`，字段名 `image`，上传二维码图片 |
| `GET`  | `/api/processing-logs` | 最近 50 条处理记录                               |
| `GET`  | `/health`              | 健康检查                                      |


## 生产构建

```bash
cd client && npm run build
cd ../server && npm run build && npm start
```

设置 `NODE_ENV=production` 且已存在 `client/dist` 时，**Express 会同时托管前端静态文件与 `/api`**（同源访问，无需再配 Vite 代理）。若未构建前端或路径不同，可通过环境变量 `CLIENT_DIST` 指定静态目录绝对路径。

根目录提供 **`npm run build`**（依次构建 client + server）与 **`npm run start`**（在 `server` 中执行迁移并启动 Node），便于云平台使用「一条构建命令 + 一条启动命令」。

---

<a id="cloud-deploy"></a>

## 云端部署（推荐：Docker + GitHub）

适合：**没有自己的服务器**，但希望仓库推送到 Git 后，在云端自动构建并得到一个 **HTTPS 链接**给别人用。

### 思路

仓库根目录包含 **[`Dockerfile`](Dockerfile)**：在镜像内安装依赖、构建前端与后端、启动时执行 `prisma migrate deploy` 并监听 **`PORT`**（云平台会注入）。进程监听 **`0.0.0.0`**，可被容器外访问。

### Railway（示例）

1. 注册 [Railway](https://railway.app/)，**New Project → Deploy from GitHub**，选择本仓库。
2. 选择 **Dockerfile** 部署（通常会自动识别根目录 `Dockerfile`）。
3. 部署完成后在 **Settings → Networking → Generate Domain**，得到 `https://xxx.up.railway.app` 这类地址。
4. 把该地址填回本文顶部的 **「在线地址」** 表格，提交到 Git，他人即可从 README 直达。

**环境变量（一般可不配）**：`NODE_ENV`、`PORT` 多由平台注入；`DATABASE_URL` 默认与 `Dockerfile` 中一致。若你为数据库挂了**持久卷**，把 `DATABASE_URL` 指到卷内路径即可。

### Render（示例）

1. 注册 [Render](https://render.com/)，**New → Web Service**，连接同一 GitHub 仓库。
2. **Runtime** 选 **Docker**，根目录 `Dockerfile` 构建。
3. 创建后同样会得到 `https://xxx.onrender.com`，可写回 README 顶部链接。

### SQLite 与数据持久

默认 SQLite 文件在容器内；**无持久磁盘时**，平台重启/重新部署可能**清空库**。若需要长期保留「历史记录」，请在平台为服务挂载 **Volume**，并把 `DATABASE_URL` 指到卷目录下的 `.db` 文件；或自行将 Prisma 换为 PostgreSQL 等托管数据库。

### 与「自购服务器」的区别

| 方式 | 特点 |
|------|------|
| **Railway / Render + Dockerfile** | 免运维机器、自带 HTTPS 子域名、按文档绑定 Git 即可。 |
| **自建 VPS** | 见下文「挂载到服务器」，适合已有机器或要备案域名的场景。 |

---

## 挂载到服务器（部署概要）

### 1. 准备

- 服务器安装 **Node.js 18+**、**git**（可选 **nginx** 做 80/443 反代）。
- 克隆仓库到目录，例如 `/var/www/QR_CODE`，在仓库根执行 `npm run install:all`（或分别在 `client`、`server` 下 `npm ci`）。

### 2. 环境变量

在 `server/` 下复制 `server/.env.example` 为 `**server/.env`**（勿提交到 Git），至少设置：

- `DATABASE_URL`：生产可用 `file:./prod.db` 等，与迁移生成的 SQLite 文件一致。
- `PORT`：Node 监听端口，例如 `3100`（若前面有 nginx，可保持内网端口）。

### 3. 数据库

在 `**server/**` 目录执行（生产用 deploy，勿用会交互的 `migrate dev`）：

```bash
cd server
npx prisma migrate deploy
npx prisma generate
```

### 4. 构建

在仓库根：

```bash
cd client && npm run build
cd ../server && npm run build
```

### 5. 启动 Node（二选一或组合）

**方式 A — 直接监听端口（已内置静态站）**

```bash
cd server
set NODE_ENV=production   # Linux/macOS: export NODE_ENV=production
node dist/index.js
```

浏览器访问 `http://服务器IP:PORT` 即可打开页面；接口为同源的 `/api/*`。

**方式 B — 使用 PM2 常驻**

```bash
cd server
npx prisma migrate deploy
export NODE_ENV=production
pm2 start dist/index.js --name qr-transformer
pm2 save
```

**方式 C — 前面加 Nginx（推荐公网域名与 HTTPS）**

- Nginx 监听 `80`/`443`，`location /` 反代到 `http://127.0.0.1:3100`（与 `PORT` 一致）。
- 或使用 Nginx 托管静态、`location /api` 反代到 Node（此时可不把 `NODE_ENV=production` 用于 Express 静态，仅跑 API；当前项目更推荐 **整站反代到 Node** 以少改配置）。

示例（整站反代）：

```nginx
server {
    listen 80;
    server_name your.domain.com;
    location / {
        proxy_pass http://127.0.0.1:3100;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 6m;
    }
}
```

上传图片需放宽 `client_max_body_size`（与后端 multer 限制匹配）。

### 6. 防火墙与安全组

在云厂商安全组 / 本机防火墙中放行对应 **TCP 端口**（或仅放行 80/443，由 Nginx 转发）。

### 7. SQLite 说明

数据库为服务器上的 **单文件**，请做好**备份**与磁盘权限；高并发或需集群时请自行改为 PostgreSQL 等并调整 Prisma 配置。

---

开发环境下由 Vite 将 `/api` 代理到后端；**生产环境**前端构建后使用相对路径 `/api`，与 Express 同端口即可。