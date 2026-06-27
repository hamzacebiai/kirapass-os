# KiraPass OS — Railway Deployment Guide

Backend'i Railway.app'te canlıya almak için. (v0.1.2+)

## Adımlar
1. railway.app → **New Project** → **Deploy from GitHub repo**.
2. Repo: `hamzacebiai/kirapass-os` seç (branch: `main`).
3. Service: Railway `Dockerfile`'ı otomatik algılar (`railway.json` → `DOCKERFILE`).
4. **Add Plugin → PostgreSQL** (Railway managed).
5. Service → **Variables** ekle:
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JWT_SECRET=<min 32 karakter güçlü rastgele secret>
   JWT_ACCESS_EXPIRES_IN=15m
   NODE_ENV=production
   CORS_ORIGINS=https://<railway-domain>.up.railway.app
   DIAGNOSTICS_TOKEN=<güçlü rastgele string>
   ```
   - `PORT` → Railway otomatik enjekte eder (app `process.env.PORT` okur).
   - `JWT_SECRET` zayıf/eksikse uygulama prod'da **fail-fast** ile boot etmez (Gate 1).
6. **Deploy** → `startup.sh` önce `prisma migrate deploy` çalıştırır, sonra server'ı başlatır.
7. **Smoke test:**
   ```
   curl https://<domain>/api/v1/health          # {"status":"ok"}
   curl https://<domain>/api/v1/health/ready     # {"db":true}
   ```

## Notlar
- **Swagger** sadece non-production'da açık (`/api/docs`). Prod'da güvenlik için kapalı.
- **Diagnostics** uçları (`/metrics`, `/_internal/*`, `/health/info`) prod'da `x-internal-token: <DIAGNOSTICS_TOKEN>` ister.
- **Migration'lar** her boot'ta `migrate deploy` ile uygulanır (additive, idempotent).

## İlk Veri (Seed)
- Railway service shell'inden:
  ```
  cd /app && DATABASE_URL=$DATABASE_URL npx ts-node --transpile-only packages/database/prisma/seed.ts
  ```
  (ya da local `npm run db:seed` ile prod DB URL'ine karşı.)
- Demo hesap: **demo@kirapass.com / Demo1234!** (AGENCY_OWNER).

## API Testi
- Swagger (dev): `http://localhost:3000/api/docs`
- Postman workspace config: `.postman/resources.yaml`
- Sprint B1 uçları: `GET /dashboard/summary`, `PATCH /leases/:id/{activate,expire,terminate}`, `PATCH /payments/:id/pay`.
