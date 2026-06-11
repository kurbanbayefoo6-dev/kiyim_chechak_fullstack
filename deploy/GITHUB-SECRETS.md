# GitHub Repository Secrets

Path: **Settings → Secrets and variables → Actions → Repository secrets**

Add or update the secrets below. Never commit passwords or keys to the repo.

## Required secrets

| Secret | Example value | Notes |
|--------|---------------|-------|
| `DOCKER_USERNAME` | `kurbanbayef1` | Docker Hub **username** (not email) |
| `DOCKER_PASSWORD` | `dckr_pat_...` | Docker Hub **Access Token** (Read & Write) |
| `DATABASE_URL` | `postgresql://USER:PASS@HOST/DB?schema=public&sslmode=require` | Render External Database URL |
| `EC2_HOST` | `13.45.67.89` | EC2 public IP only (no `http://`) |
| `EC2_USER` | `ubuntu` | SSH user for Ubuntu EC2 |
| `EC2_SSH_KEY` | Full `.pem` file contents | From `-----BEGIN ... KEY-----` to `-----END ... KEY-----` |
| `JWT_SECRET` | Random 32+ chars | `openssl rand -base64 32` |
| `APP_DOMAIN` | `kiyim-chechak.kahoot.uz` | Public domain (no `https://`) — used for CORS and health checks |

### DOCKER_PASSWORD — create an Access Token

GitHub Actions often fails with plain Docker Hub passwords (`unauthorized`).

1. Open [hub.docker.com/settings/security](https://hub.docker.com/settings/security)
2. **New Access Token** → Description: `github-actions`
3. Permissions: **Read & Write**
4. Copy the token and set it as `DOCKER_PASSWORD`

### JWT_SECRET

```bash
openssl rand -base64 32
```

### EC2_SSH_KEY

Open your AWS `.pem` file and copy the entire contents into the secret.

### DATABASE_URL

Render dashboard → PostgreSQL → **External Database URL**

### APP_DOMAIN

Your production subdomain. The workflow sets:

```env
CORS_ORIGIN=https://kiyim-chechak.kahoot.uz
```

If you change domains, update this secret and redeploy.

## What happens on push to `master` / `main`

1. Build backend and frontend Docker images
2. Push to `${DOCKER_USERNAME}/kiyim-chechak-backend` and `...-frontend` on Docker Hub
3. SSH to EC2
4. Install Docker + host Nginx (first run only)
5. Write `deploy/.env` with production values
6. Install Nginx config for your domain → proxy to `localhost:8080`
7. `docker compose pull && up -d`
8. Run `prisma migrate deploy` in the backend container
9. Health-check `https://APP_DOMAIN/api/health`

Actions tab: `https://github.com/kurbanbayefoo6-dev/kiyim_chechak_fullstack/actions`

Full deploy guide: [DOCKER-DEPLOY.md](DOCKER-DEPLOY.md)

## Docker Hub push denied

| Cause | Fix |
|-------|-----|
| Wrong `DOCKER_USERNAME` | Copy exact username from [Docker Hub settings](https://hub.docker.com/settings/general) |
| Token is Read-only | Create new token with **Read & Write** |
| Repositories missing | Create `kiyim-chechak-backend` and `kiyim-chechak-frontend` on Docker Hub |

## Docker login unauthorized

| Cause | Fix |
|-------|-----|
| Plain password used | Use Access Token |
| Email instead of username | Use Docker Hub username |
| Extra whitespace in secret | Delete and recreate the secret |
| 2FA enabled | Access Token required |

Local test:

```bash
docker logout
docker login -u kurbanbayef1
# Enter Access Token as password
```

## SSL / Certbot (one-time on server)

After the first CI/CD deploy succeeds over HTTP:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d kiyim-chechak.kahoot.uz
```

CORS is already configured for HTTPS by the workflow.
