# KiraPass OS — Technical Debt Register

Deferred, intentionally-accepted items. Recorded only (not implemented).

## Lease Domain (Phase 3.3)
1. **Lease date-range validation** — enforce `endDate > startDate` (DTO/service level).
2. **Active lease overlap prevention per Unit** — block overlapping ACTIVE leases on the same `unitId`.
3. **LeaseArchive permission separation** — archive currently uses `lease.delete`; consider a dedicated `lease.archive` permission.
4. **Decimal serialization documentation** — `rentAmount`/`depositAmount` are Prisma `Decimal`, serialized as JSON strings; document for API consumers.
