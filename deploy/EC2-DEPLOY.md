# AWS Ubuntu EC2 — Deploy Qo'llanmasi

> **Docker + CI/CD (tavsiya etiladi):** [DOCKER-DEPLOY.md](DOCKER-DEPLOY.md)  
> Quyidagi qo'llanma — qo'lda Nginx + systemd usuli (Docker siz).

Kiyim Chechak full-stack loyihasini bitta Ubuntu EC2 serverga joylash.

## Arxitektura

```
Internet
   │
   ▼
EC2 (Ubuntu) — port 80/443
   │
   ├── Nginx
   │     ├── /          → frontend/dist (React SPA)
   │     └── /api/*     → localhost:3000 (Node.js backend)
   │
   └── systemd → kiyim-chechak-backend.service
                     │
                     ▼
              Render PostgreSQL (tashqi DB)
```

## 1. AWS EC2 yaratish

| Sozlama | Qiymat |
|---------|--------|
| AMI | Ubuntu 22.04 LTS yoki 24.04 LTS |
| Instance type | t2.micro (free tier) yoki t3.small |
| Storage | 20 GB gp3 |
| Key pair | `.pem` faylni saqlang |

### Security Group (Inbound rules)

| Type | Port | Source | Izoh |
|------|------|--------|------|
| SSH | 22 | Sizning IP | Serverga kirish |
| HTTP | 80 | 0.0.0.0/0 | Veb-sayt |
| HTTPS | 443 | 0.0.0.0/0 | SSL (ixtiyoriy) |

> **Muhim:** Port **3000** ni ochmang — backend faqat localhost orqali Nginx proxy qilinadi.

## 2. Serverga ulanish

```bash
ssh -i "your-key.pem" ubuntu@EC2_PUBLIC_IP
```

## 3. Loyihani yuklash va sozlash

```bash
# Reponi klonlash
sudo mkdir -p /var/www/kiyim-chechak
sudo chown ubuntu:ubuntu /var/www/kiyim-chechak
git clone https://github.com/kurbanbayefoo6-dev/kiyim_chechak_fullstack.git /var/www/kiyim-chechak
cd /var/www/kiyim-chechak

# Backend .env yaratish
cp deploy/env/backend.env.example backend/.env
nano backend/.env
```

### backend/.env — to'ldiring:

```env
NODE_ENV=production
PORT=3000

DATABASE_URL="postgresql://timur_db:PAROL@dpg-....oregon-postgres.render.com/kiyim_chechak_db?schema=public&sslmode=require"

JWT_SECRET=<openssl rand -base64 32 natijasini qo'ying>

# EC2 public IP yoki domen
CORS_ORIGIN=http://13.45.67.89

LOG_LEVEL=info
```

JWT_SECRET yaratish:
```bash
openssl rand -base64 32
```

## 4. Avtomatik o'rnatish

```bash
cd /var/www/kiyim-chechak
chmod +x deploy/*.sh
bash deploy/ec2-setup.sh
```

Bu skript:
- Node.js 20, Nginx, Git o'rnatadi
- Backend build qiladi va migration ishga tushiradi
- Frontend build qiladi (`VITE_API_URL=/api`)
- systemd service va Nginx ni sozlaydi
- Birinchi marta database seed qiladi

## 5. Tekshirish

```bash
# Backend health
curl http://localhost/api/health

# Brauzerda
http://EC2_PUBLIC_IP
```

Login (seed qilingan bo'lsa):
- Email: `admin@example.com`
- Parol: `Admin123!`

## 6. Keyingi yangilanishlar (re-deploy)

Kod o'zgarganda:

```bash
cd /var/www/kiyim-chechak
git pull
bash deploy/deploy.sh
```

## 7. HTTPS (ixtiyoriy — domen bo'lsa)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

Certbot Nginx configni avtomatik yangilaydi. `CORS_ORIGIN` ni ham `https://yourdomain.com` ga o'zgartiring va backend ni qayta ishga tushiring:

```bash
nano backend/.env   # CORS_ORIGIN=https://yourdomain.com
sudo systemctl restart kiyim-chechak-backend
```

## 8. Foydali buyruqlar

```bash
# Backend loglari
sudo journalctl -u kiyim-chechak-backend -f

# Backend holati
sudo systemctl status kiyim-chechak-backend

# Nginx holati
sudo systemctl status nginx

# Qo'lda migration
cd /var/www/kiyim-chechak/backend
npx prisma migrate deploy

# Qo'lda seed (faqat birinchi marta)
RUN_SEED=true bash deploy/deploy.sh
```

## Muammolar

| Xato | Yechim |
|------|--------|
| `P1000` / DB auth failed | `DATABASE_URL` ni Render dashboarddan qayta nusxalang |
| `P1017` connection closed | Render DB uxlab qolgan — dashboardda uyg'oting |
| CORS xatosi | `CORS_ORIGIN` ga EC2 IP yoki domen qo'shing |
| 502 Bad Gateway | `sudo systemctl status kiyim-chechak-backend` — backend ishlamayapti |
| Sahifa 404 (SPA) | Nginx `try_files` sozlamasi bor — `sudo nginx -t` tekshiring |
