#!/bin/bash
# ==============================================================
# QR-Transformer 一键部署脚本（在 ECS 服务器上运行）
# 用法：bash deploy.sh
# ==============================================================
set -e

APP_NAME="qr-transformer"
IMAGE_NAME="qr-transformer:latest"
ENV_FILE="$(dirname "$0")/server/.env"   # 生产环境变量文件，须提前在服务器上创建

# ── 颜色输出 ──────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERR ]${NC}  $*"; exit 1; }

# ── 1. 检查 .env 存在 ──────────────────────────────────────────
[ -f "$ENV_FILE" ] || error ".env 文件不存在：$ENV_FILE\n       请先创建并填写 DATABASE_URL / ADMIN_PASSWORD / JWT_SECRET"

# ── 2. 拉取最新代码 ───────────────────────────────────────────
info "拉取最新代码..."
cd "$(dirname "$0")"
git pull origin main

# ── 3. 构建新镜像 ─────────────────────────────────────────────
info "构建 Docker 镜像..."
docker build -t "$IMAGE_NAME" .

# ── 4. 停止并删除旧容器（保留数据库，不受影响）─────────────────
info "停止旧容器（如有）..."
docker stop "$APP_NAME" 2>/dev/null && docker rm "$APP_NAME" 2>/dev/null || true

# ── 5. 启动新容器 ─────────────────────────────────────────────
# --network host：让容器直接使用宿主机网络，
#   从而可通过 127.0.0.1:5434 访问宿主机上的 PostgreSQL
# 若数据库在独立容器中，改为 --network <your-network> 并去掉 --network host
info "启动新容器..."
docker run -d \
  --name "$APP_NAME" \
  --network host \
  --env-file "$ENV_FILE" \
  --restart unless-stopped \
  "$IMAGE_NAME"

# ── 6. 等待并检查健康状态 ─────────────────────────────────────
info "等待服务启动..."
sleep 4
if docker ps --filter "name=$APP_NAME" --filter "status=running" | grep -q "$APP_NAME"; then
  info "✅ 部署成功！容器运行中。"
  docker logs "$APP_NAME" --tail 20
else
  error "容器未正常启动，查看日志：docker logs $APP_NAME"
fi
