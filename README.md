# Kiyim Chechak Full Stack

Monorepo for the **Kiyim Chechak** clothing retail platform: API backend and web frontend in one repository.

## Structure

| Directory   | Description |
|------------|-------------|
| `backend/` | Node.js, Express, TypeScript, PostgreSQL (Prisma). ERP/CRM/WMS API, JWT auth, Docker. See [backend/README.md](backend/README.md). |
| `frontend/`| React, TypeScript, Vite, Tailwind. Customer and admin UI. See [frontend/README.md](frontend/README.md). |

## Quick start

1. **Backend** — copy `backend/.env.example` to `backend/.env`, install deps, run migrations, start the API.
2. **Frontend** — copy `frontend/.env.example` to `frontend/.env`, install deps, run the dev server.

Each package has its own `package.json`; run `npm install` and npm scripts from the corresponding folder.

## AWS EC2 Deploy

### Docker + GitHub Actions (recommended)

Domain: `https://kiyim-kechak.kahoot.uz`

On push to `master` / `main`:

1. Docker images build → [Docker Hub](https://hub.docker.com/u/kurbanbayef1)
2. EC2 deploy via SSH → host Nginx + `docker compose up -d`
3. Prisma migrations run automatically

**Guides:**

- [deploy/DOCKER-DEPLOY.md](deploy/DOCKER-DEPLOY.md) — full Docker + domain + Certbot setup
- [deploy/GITHUB-SECRETS.md](deploy/GITHUB-SECRETS.md) — required GitHub secrets (including `APP_DOMAIN`)

### Qo'lda (Nginx + systemd)

Full guide: [deploy/EC2-DEPLOY.md](deploy/EC2-DEPLOY.md)

## Notes

- Do not commit `.env` files; use `.env.example` as templates.
- Previously separate repos: `backend_kiyim_kechak` and `frontend_kiyim_kechak` are now combined here.