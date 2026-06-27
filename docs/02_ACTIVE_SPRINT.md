# 02 — Active Sprint
_Son güncelleme: 2026-06-27. Branch: checkpoint/p0-1-hardening._

## MEVCUT FAZ
**P0-3 — Test Foundation**

## TAMAMLANAN FAZLAR
- ✅ **P0-1 Production Hardening** — Gates 1-6 PASS (docs/05).
- ✅ **P0-2 AI Engineering Foundation** — docs/constitution/ (3 katman) + CLAUDE.md bootstrap + .env.example.

## P0-3 KAPSAM (Test Foundation)
- jest + @nestjs/testing + ts-jest (apps/api devDependencies) — **paket ekleme = onaylı iş**.
- jest.config.ts + root/apps `test` script.
- İlk spec'ler: health.controller.spec.ts, auth.service.spec.ts (login happy path).
- Hedef: G7 Test Coverage gate → ≥1 spec/domain, build PASS.

## BLOKAJLAR
- `kirapass-os/` nested repo (kendi .git'i) → commit öncesi `.gitignore`'a eklendi; içerik temizliği ayrı karar.
- CI/CD yok → P0-4.
- Postgres default şifre (docker-compose) → ops, launch öncesi.

## SONRAKİ FAZLAR
- P0-3 Test Foundation (aktif)
- P0-4 CI/CD (GitHub Actions)
- P0-5 Production Launch Gate

## NOT
Test runner şu an YOK (kanıt: package.json'da test script yok). "Test edilmedi" ≠ "başarısız". Mevcut doğrulama = build + migration + runtime curl.
