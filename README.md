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

| Secret | Değer |
|--------|-------|
| `SSH_HOST` | `161.35.198.70` |
| `SSH_USER` | `beratav` |
| `SSH_PRIVATE_KEY` | SSH private key içeriği (`id_ed25519`) |

### GitHub Environment

Repo → **Settings → Environments** → `production` oluştur.

Deploy job'u bu environment üzerinden çalışır; istersen "Required reviewers" ekleyerek manuel onay da koyabilirsin.

### Sunucu hazırlığı

Deploy kullanıcısının (`beratav`) SSH key'ine GitHub Actions public key'i eklenmeli:

```bash
# Sunucuda beratav kullanıcısı için
echo "GITHUB_ACTIONS_PUBLIC_KEY" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Sunucuda PM2 kurulu olmalı ve proje klonlanmış olmalı:

```bash
git clone https://github.com/wiss-54/fullstack-eticaret.git /home/beratav/fullstack-eticaret
cd /home/beratav/fullstack-eticaret/backend
cp .env.example .env   # sunucuya özel değerlerle doldur
npm ci --omit=dev
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
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
