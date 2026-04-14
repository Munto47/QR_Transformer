# 全栈单容器：构建 client + server，启动时执行 migrate 并监听 PORT
FROM node:20-bookworm-slim

# Prisma 在 slim 镜像中需要 OpenSSL；postinstall 会跑 prisma generate，需先有 schema
RUN apt-get update -y \
  && apt-get install -y openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY client/package*.json ./client/
COPY server/package*.json ./server/
# 必须在 npm ci 之前复制，否则 server 的 postinstall（prisma generate）找不到 schema
COPY server/prisma ./server/prisma/

RUN npm ci --prefix client && npm ci --prefix server

COPY client/ ./client/
COPY server/ ./server/

RUN npm run build --prefix client && npm run build --prefix server

ENV NODE_ENV=production
ENV HOST=0.0.0.0
# DATABASE_URL 须由运行环境提供（如 Railway PostgreSQL 插件变量），勿在镜像内写死

WORKDIR /app/server

EXPOSE 3100

CMD ["sh", "-c", "npx prisma migrate deploy && exec node dist/index.js"]
