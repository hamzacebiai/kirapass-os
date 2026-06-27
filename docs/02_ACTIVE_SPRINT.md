# 02 — Active Sprint
_Son güncelleme: 2026-06-27._

## TAMAMLANAN FAZLAR
- ✅ P0-1 Production Hardening (Gates 1-6)
- ✅ P0-2 AI Engineering Foundation (constitution + bootstrap + .env.example)
- ✅ P0-3 Test Foundation (jest + ts-jest + ilk spec'ler)
- ✅ P0-4 CI/CD (GitHub Actions — 1472cc4 green)
- ✅ G7 Domain Coverage (9 suite / 23 test)
- ✅ **P0-5 CODE COMPLETE** (ops env = deploy-time)

## MEVCUT FAZ
**P1 — Layer 1 Feature Development** (P0_LOCKDOWN kalktı; Layer 2/3 hâlâ kilitli).

## P1 KAPSAM (öneri — seçim bekliyor)
Layer 1 Rental Operations genişlemesi: property gelişmiş CRUD · lease workflow · payment akışı · tenant portal · dashboard API. Yeni endpoint/iş kuralı/domain olayı — additive, mevcut davranış korunur.

## TECH DEBT (kilitli değil, ayrı onay)
- auth.service derin unit test → PrismaClient inject refactor.
- Postgres default şifresi rotasyonu (docker-compose).
- CI coverage report (jest --coverage + threshold).
- Incident endpoint egress (Gemini) gizlilik/throttle gözden geçirme.
- Nested `kirapass-os/` repo temizliği.

## NOT
Mevcut doğrulama = build + migration + runtime + jest + CI. "Test edilmedi" ≠ "başarısız".
