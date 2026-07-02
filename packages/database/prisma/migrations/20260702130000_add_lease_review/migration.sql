-- CreateEnum
CREATE TYPE "ReviewerRole" AS ENUM ('TENANT', 'AGENCY');

-- CreateTable
CREATE TABLE "lease_reviews" (
    "id" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "reviewerRole" "ReviewerRole" NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lease_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lease_reviews_leaseId_idx" ON "lease_reviews"("leaseId");

-- CreateIndex
CREATE UNIQUE INDEX "lease_reviews_leaseId_reviewerRole_key" ON "lease_reviews"("leaseId", "reviewerRole");

-- AddForeignKey
ALTER TABLE "lease_reviews" ADD CONSTRAINT "lease_reviews_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "leases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
