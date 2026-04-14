import "dotenv/config";
import cors from "cors";
import express from "express";
import { apiRouter } from "./routes/api.js";

const app = express();
/** 默认 3100，避免与本机已占用 3001 的其他服务冲突；可在 server/.env 中设置 PORT */
const PORT = Number(process.env.PORT) || 3100;

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

const server = app.listen(PORT, () => {
  console.log(`QR-Transformer API listening on http://127.0.0.1:${PORT}`);
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
