# Full Stack E-Ticaret Projesi

Monorepo yapısında e-ticaret uygulaması: **Next.js** frontend + **Express/PostgreSQL** backend.

## DevSecOps Pipeline

```
Push/PR → Secret Scan → Backend (test + audit) → Frontend (lint + build + audit)
                ↓
         CodeQL (SAST) + Dependency Review (PR)
                ↓
         main branch push → SSH Deploy → PM2 restart → Health check
```

**Deploy kurali:** Production'a kod yalnizca `main` uzerinden gider.
Feature branch / manuel SSH ile `git reset` + build yapilmaz.
`scripts/deploy.sh` sadece GitHub Actions (`DEPLOY_SOURCE=github-actions`) ile calisir.
Acil durum disinda manuel deploy yasaktir.

### Güvenlik katmanları

| Katman | Araç | Ne yapar |
|--------|------|----------|
| Secret leak | CI job | `.env` dosyasının repoya girmesini engeller |
| SAST | CodeQL | JavaScript/TypeScript kod analizi |
| SCA | `npm audit` | Bağımlılık güvenlik taraması (high+) |
| Dependency Review | GitHub Action | PR'larda yeni zafiyetli paketleri bloklar |
| Dependabot | Haftalık | Otomatik güvenlik güncellemeleri |

### GitHub Secrets (zorunlu)

Repo → **Settings → Secrets and variables → Actions** altına ekle:



### GitHub Environment

Repo → **Settings → Environments** → `production` oluştur.

Deploy job'u bu environment üzerinden çalışır; istersen "Required reviewers" ekleyerek manuel onay da koyabilirsin.

### Sunucu hazırlığı

Deploy kullanıcısının (`beratav`) SSH key'ine GitHub Actions public key'i eklenmeli:


Sunucuda PM2 kurulu olmalı ve proje klonlanmış olmalı:

### Gunluk backup (DB + uploads)

Sunucuda bir kez:

```bash
chmod +x /home/beratav/fullstack-eticaret/scripts/backup.sh
mkdir -p /home/beratav/backups
# Manuel deneme
/home/beratav/fullstack-eticaret/scripts/backup.sh
```

Cron (her gun 03:15, 14 gun saklar):

```bash
crontab -e
# ekle:
15 3 * * * /home/beratav/fullstack-eticaret/scripts/backup.sh >> /home/beratav/backups/backup.log 2>&1
```

Yedekler: `/home/beratav/backups/eticaret_YYYYMMDD_HHMMSS.tar.gz`  
Icerik: Postgres custom dump + `uploads.tar.gz`

Geri yukleme (ornek):

```bash
cd /tmp && tar -xzf /home/beratav/backups/eticaret_XXXX.tar.gz
pg_restore --clean --if-exists -h 127.0.0.1 -U DB_USER -d DB_NAME /tmp/STAMP/DB_NAME.dump
tar -xzf /tmp/STAMP/uploads.tar.gz -C /home/beratav/fullstack-eticaret/backend
```

## Lokal geliştirme

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Testler

```bash
cd backend && npm test
cd frontend && npm run lint && npm run build
```

## API

| Endpoint | Açıklama |
|----------|----------|
| `GET /api/test-db` | PostgreSQL bağlantı testi |
