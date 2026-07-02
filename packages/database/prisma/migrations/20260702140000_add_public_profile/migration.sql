-- CreateTable
CREATE TABLE "tenant_public_profiles" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "showScore" BOOLEAN NOT NULL DEFAULT true,
    "showBadges" BOOLEAN NOT NULL DEFAULT true,
    "showReviews" BOOLEAN NOT NULL DEFAULT false,
    "showName" BOOLEAN NOT NULL DEFAULT false,
    "shareableSlug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_public_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenant_public_profiles_tenantId_key" ON "tenant_public_profiles"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_public_profiles_shareableSlug_key" ON "tenant_public_profiles"("shareableSlug");

-- AddForeignKey
ALTER TABLE "tenant_public_profiles" ADD CONSTRAINT "tenant_public_profiles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
