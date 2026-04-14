import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import cors from "cors";
import express from "express";
import { apiRouter } from "./routes/api.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
/** 默认 3100，避免与本机已占用 3001 的其他服务冲突；可在 server/.env 中设置 PORT */
const PORT = Number(process.env.PORT) || 3100;
/** 云端/容器内需监听 0.0.0.0；本地可不设 */
const HOST = process.env.HOST ?? "0.0.0.0";

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? true,
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api", apiRouter);

/** 生产环境托管 Vite 构建产物（与 server 并列的 client/dist） */
const clientDistDefault = path.resolve(__dirname, "../../client/dist");
const clientDist = process.env.CLIENT_DIST?.trim() || clientDistDefault;
const serveClient =
  process.env.NODE_ENV === "production" && fs.existsSync(clientDist);

if (serveClient) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      next();
      return;
    }
    res.sendFile(path.join(clientDist, "index.html"), (err) => {
      if (err) next(err);
    });
  });
}

const server = app.listen(PORT, HOST, () => {
  console.log(`QR-Transformer listening on http://${HOST}:${PORT}`);
  if (serveClient) {
    console.log(`Static UI from ${clientDist} (same origin /api)`);
  } else if (process.env.NODE_ENV === "production") {
    console.warn(
      `[WARN] NODE_ENV=production but client dist not found at ${clientDist}. Build client first or set CLIENT_DIST.`
    );
  }
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `[FATAL] 端口 ${PORT} 已被占用。请在 server/.env 中设置其他 PORT=（例如 3101），并同步修改 client 的 VITE_API_PROXY_TARGET。`
    );
  } else {
    console.error(err);
  }
  process.exit(1);
});
