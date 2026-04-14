# QR-Transformer

## 在线体验

**立即打开：** [**https://qrtransformer-production.up.railway.app**](https://qrtransformer-production.up.railway.app)

浏览器访问即可使用，无需安装。若解析失败，页面会提供参考示意。

---

## 项目介绍

本项目能够为你将**活动二维码**转换成**签到二维码**，在签到开始时即可用于**签到、签退**等流程。

---

## 使用提示：如何取得待转换的二维码

请在志愿服务等活动平台的**活动详情**页中，按下图方式找到**活动二维码**（截图或保存图片），再回到上方 [**在线体验**](#在线体验) 地址上传，即可完成转换。

<table>
  <tr>
    <td align="center" width="50%">
      <strong>方式一</strong><br/>
      底部导航进入「二维码」，在页面中央出现活动二维码。
    </td>
    <td align="center" width="50%">
      <strong>方式二</strong><br/>
      点击活动页上的二维码入口（如「活动二维码」），按提示展示后截图或保存。
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

- 前端：`client/` — React (Vite)、Tailwind CSS、Axios、`qrcode`
- 后端：`server/` — Node.js (Express)、Prisma、PostgreSQL、jimp、jsqr、multer

---

## 本地运行（开发）

**环境：** Node.js 18+、npm。

```bash
npm install
npm run install:all
cd server && npx prisma migrate dev && cd ..
npm run dev
```

根目录 `npm run dev` 会同时启动前端（默认 `http://localhost:5173`）与后端 API（默认 `3100`）。若端口冲突，可在 `server/.env` 修改 `PORT`，并在 `client/.env.local` 设置 `VITE_API_PROXY_TARGET` 指向同一后端地址。

首次使用需准备 **PostgreSQL**（本地安装或 Docker），在 `server` 目录配置 `DATABASE_URL` 后执行 `npx prisma migrate dev`（见上）。勿将 `server/.env` 提交到 Git；可参考 [`server/.env.example`](server/.env.example)。

---

## 云端部署（Docker / Railway）

仓库根目录 [`Dockerfile`](Dockerfile) 用于一键构建：安装依赖、构建前后端、启动时执行 `prisma migrate deploy` 并监听平台注入的 `PORT`。

1. 将代码推送到 GitHub。  
2. 在 [Railway](https://railway.app/) **New Project → Deploy from GitHub**，选择本仓库，使用 **Dockerfile** 构建。  
3. 在同一项目中 **New → Database → PostgreSQL** 创建数据库；在 Web 服务的 **Variables** 里为 **`DATABASE_URL`** 选择 **Reference** 指向 Postgres 插件提供的变量（与镜像内默认无关，须显式引用）。  
4. 在 **Networking** 中 **Generate Domain** 得到公网 HTTPS 地址。

**说明：** 生产环境依赖 PostgreSQL；处理记录与上传原图均持久化在数据库中。未配置 `DATABASE_URL` 时容器无法完成迁移与启动。

---

## 自建服务器（概要）

在机器上安装 Node 与 PostgreSQL 后：配置 `DATABASE_URL` → `client` / `server` 分别安装依赖 → `npx prisma migrate deploy` → `npm run build`（根目录或分目录）→ 设置 `NODE_ENV=production` 后执行 `server` 的 `npm start`（会执行迁移并启动）。生产环境 Express 会托管 `client/dist` 与 `/api`；亦可配合 Nginx 反代与 HTTPS。

---

## API 摘要

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/transform` | `multipart/form-data`，字段名 `image`，上传二维码图片 |
| `GET` | `/api/processing-logs` | 最近处理记录（不含图片二进制；含 `mimeType`、`sizeBytes` 等元数据） |
| `GET` | `/api/processing-logs/:id/image` | 对应记录的上传原图（`Content-Type` 为保存的 MIME） |
| `GET` | `/health` | 健康检查 |

---

开发环境下由 Vite 将 `/api` 代理到后端；生产构建后前端使用相对路径 `/api`，与 Express 同源。
