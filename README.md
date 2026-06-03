# QR-Transformer

## 在线体验

**立即打开：** [**https://www.breezecode.top**](https://www.breezecode.top)

浏览器访问即可使用，无需安装。若解析失败，页面内有使用教程与参考示意。

---

## 项目介绍

本项目能够将**活动二维码**转换为可用于**签到、签退**的签到二维码。

上传活动平台（如志愿服务平台）的活动二维码截图，工具自动解析并生成新的签到码；支持「大家一起用」社区共享活动列表（按学校筛选）、管理员后台等功能。

---

## 使用教程

请在活动平台 App 的**活动详情**页中找到**活动二维码**（截图或保存图片），再上传到工具完成转换。详细步骤见 [在线使用教程](https://www.breezecode.top/tutorial)。

<table>
  <tr>
    <td align="center" width="50%">
      <strong>方式一</strong><br/>
      底部导航进入「二维码」页，在页面中央找到活动二维码。
    </td>
    <td align="center" width="50%">
      <strong>方式二</strong><br/>
      点击活动页上的「活动二维码」入口，按提示展示后截图保存。
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="docs/image1.png" alt="方式一：底部进入二维码" width="380" />
    </td>
    <td align="center">
      <img src="docs/image2.png" alt="方式二：活动二维码入口" width="380" />
    </td>
  </tr>
</table>

请尽量使用**清晰、完整**的二维码截图，便于识别与转换。

---

## 技术栈

- **前端**：`client/` — React 19、Vite、Tailwind CSS 4、Framer Motion、React Router
- **后端**：`server/` — Node.js、Express、Prisma、PostgreSQL、jimp、jsqr、multer
- **部署**：阿里云 ECS + Docker + Nginx + PostgreSQL

---

## 本地运行（开发）

**前置条件：** Node.js 18+、npm、可连接的 PostgreSQL 实例。

```bash
# 1. 安装依赖
npm install
npm run install:all

# 2. 配置环境变量（参考下方说明）
cp server/.env.example server/.env
# 编辑 server/.env，填写 DATABASE_URL、ADMIN_PASSWORD、JWT_SECRET

# 3. 执行数据库迁移
cd server && npx prisma migrate deploy && cd ..

# 4. 启动前后端（单命令）
npm run dev
```

- 前端开发服务器：`http://localhost:5173`（Vite）
- 后端 API：`http://localhost:3100`

> **关于本地 PostgreSQL**：需要一个 PostgreSQL 实例。可选方案：
> - **Docker**（推荐）：`docker run -d -e POSTGRES_PASSWORD=qr123 -e POSTGRES_DB=qr_dev -p 5432:5432 postgres:16-alpine`，`DATABASE_URL="postgresql://postgres:qr123@localhost:5432/qr_dev"`
> - **阿里云开发库**：在服务器上创建独立的开发数据库，直接连接

---

## 环境变量

| 变量 | 说明 | 必填 |
|------|------|------|
| `DATABASE_URL` | PostgreSQL 连接字符串 | 是 |
| `ADMIN_PASSWORD` | 管理员登录密码 | 是 |
| `JWT_SECRET` | JWT 签名密钥（建议 32 位以上随机字符串） | 是 |
| `PORT` | 后端监听端口，默认 `3100` | 否 |
| `HOST` | 监听地址，默认 `0.0.0.0` | 否 |
| `CLIENT_ORIGIN` | CORS 来源限制（生产环境建议设为域名） | 否 |

---

## 云端部署（阿里云服务器）

本项目部署于**阿里云 ECS**，通过 Docker 容器运行，Nginx 反向代理至 `www.breezecode.top`。

**Docker 方式（推荐）：**

```bash
# 构建镜像
docker build -t qr-transformer .

# 运行容器（注入环境变量）
docker run -d \
  --name qr-transformer \
  -p 3100:3100 \
  -e DATABASE_URL="postgresql://..." \
  -e ADMIN_PASSWORD="your-password" \
  -e JWT_SECRET="your-secret" \
  -e NODE_ENV=production \
  qr-transformer
```

**Nginx 配置要点：**

```nginx
server {
    listen 80;
    server_name www.breezecode.top;
    location / {
        proxy_pass http://127.0.0.1:3100;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

HTTPS 证书通过阿里云 SSL 或 Let's Encrypt 配置。

**说明：** 容器启动时自动执行 `prisma migrate deploy` 完成数据库迁移，需确保 `DATABASE_URL` 已配置且数据库可访问。

---

## 管理后台

访问 `https://www.breezecode.top/admin`，使用服务器配置的管理员账号登录：

- **账号**：`admin`
- **密码**：服务器 `ADMIN_PASSWORD` 环境变量的值

---

## API 摘要

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/transform` | 上传二维码图片，返回转换结果 |
| `GET` | `/api/activity-qrs` | 查询活动二维码列表（需 `?school=` 参数） |
| `GET` | `/api/activity-qrs/hot` | 本周热门活动（按下载量排序） |
| `POST` | `/api/activity-qrs/share` | 公开投稿活动二维码 |
| `POST` | `/api/admin/login` | 管理员登录，返回 JWT |
| `GET` | `/api/admin/stats` | 管理端数据统计（需登录） |
| `GET` | `/health` | 健康检查 |

---

开发环境由 Vite 将 `/api` 代理到后端；生产构建后前端使用相对路径 `/api`，与 Express 同源。
