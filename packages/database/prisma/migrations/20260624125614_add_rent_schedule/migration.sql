-- CreateEnum
CREATE TYPE "RentScheduleStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateTable
CREATE TABLE "rent_schedules" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "tenantId" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "RentScheduleStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rent_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rent_schedules_agencyId_idx" ON "rent_schedules"("agencyId");

-- CreateIndex
CREATE INDEX "rent_schedules_leaseId_idx" ON "rent_schedules"("leaseId");

-- CreateIndex
CREATE INDEX "rent_schedules_tenantId_idx" ON "rent_schedules"("tenantId");

-- AddForeignKey
ALTER TABLE "rent_schedules" ADD CONSTRAINT "rent_schedules_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "leases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rent_schedules" ADD CONSTRAINT "rent_schedules_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
