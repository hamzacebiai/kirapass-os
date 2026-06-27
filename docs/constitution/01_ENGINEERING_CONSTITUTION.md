# Layer 2 — Engineering Constitution

Kod ve mimari kuralları. Layer 1'e (Project Constitution) bağımlıdır, onunla çelişemez.

## 1. Stack (kanıtlanmış gerçek)
NestJS 10 (CommonJS) · Prisma 5.22 · PostgreSQL 16 (Docker) · Passport JWT · TypeScript.
Monorepo (npm workspaces: `apps/*`, `packages/*`). Tek API uygulaması (`apps/api`) — modüler monolith, microservice değil. Prod imaj: node:22-slim.

## 2. Mimari anayasa (kırılamaz)
- Katmanlar **tek yönlü**: interface → application → infrastructure → domain.
- **Domain framework bağımsızdır** (NestJS/Prisma import etmez).
- **Circular dependency yasaktır.**
- **Additive-first**: yeni özellik eklenir, mevcut davranış değiştirilmez.
- **Event log append-only**; event silinmez, sıralama varsayımına dayanılmaz.
- **No Shared Kernel · No CQRS · No Repository Pattern · No Microservices** (ADR D2).
- Cross-cutting `common/*`, iş alanları `modules/<domain>/`.

## 3. Tenant izolasyonu (güvenlik çekirdeği)
- `agencyId` YALNIZCA doğrulanmış JWT context'inden gelir; DTO/body/query'den asla.
- Tüm tenant modelleri Prisma middleware ile scope edilir; tekil update/delete önce `getById` ownership kontrolünden geçer.
- Çocuk varlıklar iki seviyeli ownership (entity.agencyId AND parent.agencyId).
- SYSTEM_ADMIN global bypass; diğer roller tenant-bound.

## 4. Evidence kültürü (mutlak)
- Asla "bence" deme. Yalnızca şunlardan konuş: **source code · schema · migration · runtime · build · log · git**.
- Kanıt yoksa → **ASSUMPTION: <sebep>** olarak işaretle, uydurma.
- Dosya/route/şema iddiası, dosyayı okumadan yapılmaz.

## 5. Test/doğrulama kültürü
- Her değişiklik sonunda doğrula: **build · migration status · runtime · ilgili endpoint · rollback planı**.
- "Test edilmedi" ≠ "başarısız oldu" — ikisi ayrı raporlanır.
- Repoda otomatik test/lint **yok** (gerçek): doğrulama = build + migration + runtime curl. Test runner eklemek ayrı, onaylı bir iştir.

## 6. Risk sınıfları
- 🟢 LOW: additive util/doc/iç modül → plan sonrası doğrudan uygulanır.
- 🟡 MEDIUM: servis/application katmanı mantığı → PLAN + EXECUTE.
- 🔴 HIGH: auth · authorization · DB schema · migration · event ordering · API breaking · delete · refactor → onay zorunlu (Layer 3 onay matrisi).

## 7. Üretim disiplini
- Production Gate'ler feature'dan önce gelir; tüm gate'ler PASS olmadan roadmap genişletilmez (Layer 1 P0_LOCKDOWN).
- Sırlar `.env`'de, commit edilmez. Prod config fail-fast doğrulanır.
- Migration'lar additive; DROP/yıkıcı ALTER onaysız yapılmaz.
