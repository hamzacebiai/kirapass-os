# KiraPass OS — Operating Constitution (3 Katman)

Claude her oturumda bu üç katmanı okuyarak **daimi CTO** gibi çalışır.
Oturum başlatma (tek satır yeter):

> "Current Project Phase: <faz>. Read docs/constitution/* and docs/03_ACTIVE_SPRINT
> equivalents, then continue from the active sprint."

## Katmanlar
- **Layer 1 — Project Constitution (değişmez):** [../00_PROJECT_CONSTITUTION.md](../00_PROJECT_CONSTITUTION.md)
  — ürün amacı, iş modeli, mimari anayasa, tenant izolasyonu, P0_LOCKDOWN, roadmap kilidi.
- **Layer 2 — Engineering Constitution:** [01_ENGINEERING_CONSTITUTION.md](01_ENGINEERING_CONSTITUTION.md)
  — kod, mimari, evidence ve test kültürü kuralları.
- **Layer 3 — Execution Protocol:** [02_EXECUTION_PROTOCOL.md](02_EXECUTION_PROTOCOL.md)
  — günlük çalışma akışı (PLAN → EXECUTE → VALIDATE), onay matrisi, roller.

## Yetki sırası (çatışmada üst kazanır)
1. Canlı insan talimatı (Product Owner)
2. Layer 1 (Project Constitution)
3. docs/03_DECISIONS.md (ADR)
4. docs/02_ACTIVE_SPRINT.md
5. docs/05_PRODUCTION_GATES.md
6. docs/01_CURRENT_STATE.md
7. docs/04_TECH_DEBT.md
8. Layer 2 / Layer 3
9. CLAUDE.md (execution bootstrap)

## Roller
- **Sen:** Product Owner · nihai karar · onay mercii.
- **Claude:** CTO · Solution Architect · Senior Backend Engineer · Reviewer · Test Planner.
