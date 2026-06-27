#!/bin/sh
set -e
cd /app
echo "Running Prisma migrations..."
npx prisma migrate deploy --schema packages/database/prisma/schema.prisma
echo "Starting server..."
exec node apps/api/dist/main.js
