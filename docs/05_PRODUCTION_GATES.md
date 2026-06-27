# 05 — Production Gates (Evidence Log)
_Son güncelleme: 2026-06-27. Branch: checkpoint/p0-1-hardening._

| Gate | Açıklama | Durum | Commit / Kanıt |
|------|----------|-------|----------------|
| G1 | JWT fail-fast (strong secret, prod exit) | ✅ PASS | 9a53abb · main.ts:18-28 + env-validation.ts (hasWeakJwtSecret) |
| G2 | CORS allowlist (no wildcard) | ✅ PASS | 9a53abb · main.ts CORS_ORIGINS / origin:false |
| G3 | Docker (multi-stage node:22-slim) | ✅ PASS | Dockerfile + .dockerignore; container /health 200, /ready db:true |
| G4 | Backup + restore (tested roundtrip) | ✅ PASS | scripts/backup.ps1 + restore.ps1; backups/*.dump |
| G5 | Audit Persistence (interceptor + table) | ✅ PASS | d39123d · audit.interceptor.ts; migration 20260625205821_add_audit_log |
| G6 | Token Revocation (refresh rotation + logout) | ✅ PASS | e4a3c58 · auth.service refresh/logout; migration 20260625215231_add_refresh_token_rotation |

**Skor: 6/6 PASS.** P0-1 Production Hardening tamamlandı.

## Doğrulama (runtime, bu oturumda)
- Build (tsc + nest) = 0; migrations in sync (10 migration).
- G1: prod missing/weak secret → exit 1; strong → boot.
- G2: allowed origin → ACAO; foreign → none; prod-unset → asla `*`.
- G3: image build 0, container boot, /health 200.
- G4: backup → 33KB dump; restore → tablo+satır eşleşti.
- G5: mutasyon → audit_logs satırı (agency/user); GET hariç.
- G6: login→refresh→rotate; revoked/reused→401; logout→401.

## Sonraki gate
**G7 — Test Coverage** (P0-3): jest + ≥1 spec/domain + build PASS. Status: ❌ OPEN.

## Launch kararı
Public launch için ops bağımlılıkları kalan: prod env (strong JWT_SECRET, DIAGNOSTICS_TOKEN, CORS_ORIGINS), Postgres default şifre rotasyonu, CI/CD, test runner. Kod gate'leri (G1–G6) kapalı.
