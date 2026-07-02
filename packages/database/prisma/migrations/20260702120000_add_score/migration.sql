-- CreateEnum
CREATE TYPE "CycleStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'BROKEN');

-- CreateEnum
CREATE TYPE "ScoreCategory" AS ENUM ('RENT_ONTIME', 'MESSAGE_REPLY', 'LOGIN_ACTIVITY', 'NO_VIOLATION');

-- CreateEnum
CREATE TYPE "BadgeType" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('ELIGIBLE', 'APPROVED', 'PAID', 'EXPIRED');

-- CreateTable
CREATE TABLE "tenant_score_cycles" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "cycleYear" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "status" "CycleStatus" NOT NULL DEFAULT 'ACTIVE',
    "jokerUsed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "tenant_score_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "score_events" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "category" "ScoreCategory" NOT NULL,
    "points" INTEGER NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "score_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_score_snapshots" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "totalPoints" INTEGER NOT NULL,
    "isPerfect" BOOLEAN NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monthly_score_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_badges" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "badgeType" "BadgeType" NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reward_claims" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "rentAmount" DECIMAL(12,2) NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'ELIGIBLE',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reward_claims_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tenant_score_cycles_tenantId_idx" ON "tenant_score_cycles"("tenantId");

-- CreateIndex
CREATE INDEX "tenant_score_cycles_leaseId_idx" ON "tenant_score_cycles"("leaseId");

-- CreateIndex
CREATE INDEX "score_events_cycleId_idx" ON "score_events"("cycleId");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_score_snapshots_cycleId_month_key" ON "monthly_score_snapshots"("cycleId", "month");

-- CreateIndex
CREATE INDEX "tenant_badges_tenantId_idx" ON "tenant_badges"("tenantId");

-- AddForeignKey
ALTER TABLE "tenant_score_cycles" ADD CONSTRAINT "tenant_score_cycles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_score_cycles" ADD CONSTRAINT "tenant_score_cycles_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "leases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score_events" ADD CONSTRAINT "score_events_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "tenant_score_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_score_snapshots" ADD CONSTRAINT "monthly_score_snapshots_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "tenant_score_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_badges" ADD CONSTRAINT "tenant_badges_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
