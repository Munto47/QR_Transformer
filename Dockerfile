# 全栈单容器：构建 client + server，启动时执行 migrate 并监听 PORT
FROM node:20-bookworm-slim AS runner

WORKDIR /app

COPY client/package*.json ./client/
COPY server/package*.json ./server/

RUN npm ci --prefix client && npm ci --prefix server

COPY client/ ./client/
COPY server/ ./server/

RUN npm run build --prefix client && npm run build --prefix server

ENV NODE_ENV=production
ENV HOST=0.0.0.0
# 平台会注入 PORT；SQLite 路径（无持久卷时容器重建会清空库，见 README）
ENV DATABASE_URL=file:/app/server/prisma/prod.db

WORKDIR /app/server

EXPOSE 3100

CMD ["sh", "-c", "npx prisma migrate deploy && exec node dist/index.js"]
