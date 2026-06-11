#!/usr/bin/env bash
# Re-deploy after git pull on Ubuntu EC2
# Usage: bash deploy/deploy.sh

set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/kiyim-chechak}"
RUN_SEED="${RUN_SEED:-false}"

echo "==> Deploying Kiyim Chechak from ${APP_DIR}"

cd "${APP_DIR}"

if [ -d .git ]; then
  echo "==> Pulling latest code..."
  git pull origin master || git pull origin main
fi

# --- Backend ---
echo "==> Building backend..."
cd "${APP_DIR}/backend"

if [ ! -f .env ]; then
  echo "ERROR: backend/.env not found. Copy deploy/env/backend.env.example and configure it."
  exit 1
fi

npm ci --omit=dev
npm run build

echo "==> Running database migrations..."
npx prisma migrate deploy

if [ "${RUN_SEED}" = "true" ]; then
  echo "==> Seeding database (first deploy only)..."
  npx prisma db seed
fi

# --- Frontend ---
echo "==> Building frontend..."
cd "${APP_DIR}/frontend"

cp "${APP_DIR}/deploy/env/frontend.env.production" .env.production
npm ci
npm run build

# --- Restart services ---
echo "==> Restarting backend service..."
sudo systemctl restart kiyim-chechak-backend

echo "==> Restarting Nginx..."
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

echo "==> Deploy complete!"
echo "    Health check: curl http://localhost/api/health"
sudo systemctl status kiyim-chechak-backend --no-pager || true
