-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "inviteExpiresAt" TIMESTAMP(3),
ADD COLUMN     "inviteToken" TEXT,
ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "passwordSetAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "tenant_refresh_tokens" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenant_refresh_tokens_token_key" ON "tenant_refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "tenant_refresh_tokens_tenantId_idx" ON "tenant_refresh_tokens"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_inviteToken_key" ON "tenants"("inviteToken");

-- AddForeignKey
ALTER TABLE "tenant_refresh_tokens" ADD CONSTRAINT "tenant_refresh_tokens_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
