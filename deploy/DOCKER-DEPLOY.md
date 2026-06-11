# Docker + CI/CD Deploy — kiyim-kechak.kahoot.uz

Production deployment using Docker Compose on Ubuntu EC2, host Nginx for domain/SSL, and GitHub Actions for CI/CD.

## Architecture

```
Internet
   │
   ▼
EC2 (Ubuntu) — ports 80/443
   │
   ├── Host Nginx + Certbot (SSL termination)
   │     └── proxy -> http://127.0.0.1:8080
   │
   └── Docker Compose
         ├── frontend container (Nginx + React SPA, localhost:8080)
         │     └── /api -> backend:3000
         └── backend container (Node.js API, internal only)
               │
               ▼
         PostgreSQL (Render / external)
```

## Prerequisites

| Item | Value |
|------|-------|
| EC2 | Ubuntu 22.04 or 24.04 |
| Domain | `kiyim-kechak.kahoot.uz` A record → EC2 public IP |
| Database | Render PostgreSQL (or any external Postgres) |
| Docker Hub | Account with `kiyim-chechak-backend` and `kiyim-chechak-frontend` repos |
| GitHub Secrets | See [GITHUB-SECRETS.md](GITHUB-SECRETS.md) |

### Security Group (Inbound)

| Type | Port | Source |
|------|------|--------|
| SSH | 22 | Your IP |
| HTTP | 80 | 0.0.0.0/0 |
| HTTPS | 443 | 0.0.0.0/0 |

Do **not** open port 3000 or 8080 publicly — backend and frontend Docker ports stay on localhost.

## 1. DNS Setup

Point your subdomain to the EC2 public IP:

```
kiyim-kechak.kahoot.uz  A  <EC2_PUBLIC_IP>
```

Verify from your machine:

```bash
nslookup kiyim-kechak.kahoot.uz
curl -I http://kiyim-kechak.kahoot.uz
```

## 2. GitHub Secrets

Configure all secrets listed in [GITHUB-SECRETS.md](GITHUB-SECRETS.md), including the new `APP_DOMAIN` secret:

```
APP_DOMAIN=kiyim-kechak.kahoot.uz
```

## 3. First Deploy (Automatic via GitHub Actions)

Push to `master` or `main`, or trigger manually from the Actions tab.

The workflow will:

1. Build and push Docker images to Docker Hub
2. SSH into EC2, install Docker + Nginx if missing
3. Clone/update the repo at `/var/www/kiyim-chechak`
4. Write production `.env` with `CORS_ORIGIN=https://kiyim-kechak.kahoot.uz`
5. Install host Nginx config from `deploy/nginx/kiyim-chechak-docker.conf`
6. Pull images and run `docker compose up -d`
7. Run `prisma migrate deploy` inside the backend container
8. Health-check the API

## 4. One-Time SSL Setup (Certbot)

After the first successful deploy (HTTP must work first):

```bash
ssh -i "your-key.pem" ubuntu@EC2_PUBLIC_IP

sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d kiyim-kechak.kahoot.uz
```

Certbot updates the host Nginx config automatically. CORS is already set to `https://kiyim-kechak.kahoot.uz` by CI/CD — no manual backend restart needed unless you change the domain.

Renewal is automatic via certbot timer:

```bash
sudo certbot renew --dry-run
```

## 5. Verify Deployment

```bash
# On EC2
curl http://127.0.0.1:8080/api/health
curl https://kiyim-kechak.kahoot.uz/api/health

sudo docker compose --env-file /var/www/kiyim-chechak/deploy/.env \
  -f /var/www/kiyim-chechak/deploy/docker-compose.prod.yml ps

sudo nginx -t
```

In browser: `https://kiyim-kechak.kahoot.uz`

Default admin (if database was seeded):

- Email: `admin@example.com`
- Password: `Admin123!`

## 6. Manual Server Setup (Optional)

If you prefer to set up the server before the first CI/CD run:

```bash
ssh -i "your-key.pem" ubuntu@EC2_PUBLIC_IP

sudo mkdir -p /var/www/kiyim-chechak
sudo chown ubuntu:ubuntu /var/www/kiyim-chechak
git clone https://github.com/kurbanbayefoo6-dev/kiyim_chechak_fullstack.git /var/www/kiyim-chechak

sudo apt install -y nginx
sudo cp /var/www/kiyim-chechak/deploy/nginx/kiyim-chechak-docker.conf /etc/nginx/sites-available/kiyim-chechak
sudo ln -sf /etc/nginx/sites-available/kiyim-chechak /etc/nginx/sites-enabled/kiyim-chechak
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx
```

Then push to GitHub to trigger the full Docker deploy.

## 7. Check Nginx Configuration

To inspect the active Nginx config on the server:

```bash
sudo nginx -T | grep -E "server_name|listen|proxy_pass"
sudo nano /etc/nginx/sites-available/kiyim-chechak
```

Expected values:

```nginx
server_name kiyim-kechak.kahoot.uz;
proxy_pass http://127.0.0.1:8080;
```

## 8. Useful Commands

```bash
# Container logs
sudo docker compose --env-file /var/www/kiyim-chechak/deploy/.env \
  -f /var/www/kiyim-chechak/deploy/docker-compose.prod.yml logs -f

# Backend logs only
sudo docker compose --env-file /var/www/kiyim-chechak/deploy/.env \
  -f /var/www/kiyim-chechak/deploy/docker-compose.prod.yml logs -f backend

# Manual migration
sudo docker compose --env-file /var/www/kiyim-chechak/deploy/.env \
  -f /var/www/kiyim-chechak/deploy/docker-compose.prod.yml exec backend npx prisma migrate deploy

# Restart containers
sudo docker compose --env-file /var/www/kiyim-chechak/deploy/.env \
  -f /var/www/kiyim-chechak/deploy/docker-compose.prod.yml up -d --force-recreate
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `502 Bad Gateway` | Check containers: `docker compose ps`. Frontend must listen on `127.0.0.1:8080`. |
| CORS error | Ensure `CORS_ORIGIN=https://kiyim-kechak.kahoot.uz` in `deploy/.env` and redeploy. |
| Certbot fails | DNS must point to EC2. Port 80 must be open. Nginx must be running. |
| DB auth failed (`P1000`) | Verify `DATABASE_URL` in GitHub secret. |
| DB connection closed (`P1017`) | Wake Render DB from dashboard. |
| Migration failed | Check backend logs; run migrate manually (see above). |
| Domain shows default Nginx page | Remove `/etc/nginx/sites-enabled/default`, restart Nginx. |

## Alternative: Manual Nginx + systemd

For non-Docker deployment, see [EC2-DEPLOY.md](EC2-DEPLOY.md).
