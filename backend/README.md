# KiraPass Backend (minimal Express + Postgres)

Standalone Express starter on port **3001**. Reuses the existing
`kirapass-postgres` container (port 5432). Does not touch the NestJS app.

## 1. Postgres (already running)
```bash
docker compose up -d        # from repo root, if not already running
```

If `kirapass_dev` does not exist, create it:
```bash
docker exec -it kirapass-postgres psql -U postgres -c "CREATE DATABASE kirapass_dev;"
```

## 2. Start backend
```bash
cd backend
npm install
npm run dev      # or: npm start
```

## 3. Test
```bash
curl http://localhost:3001/health
```
Expected:
```json
{ "status": "ok", "db": "connected", "timestamp": "...", "version": "PostgreSQL 16 ..." }
```

## 4. Enter Postgres container
```bash
docker exec -it kirapass-postgres psql -U postgres
```

## 5. Run SQL
```sql
SELECT version();
```
