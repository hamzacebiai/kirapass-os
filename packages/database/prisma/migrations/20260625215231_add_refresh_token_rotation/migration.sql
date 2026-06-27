-- AlterTable
ALTER TABLE "refresh_tokens" ADD COLUMN     "replacedById" TEXT,
ADD COLUMN     "revokedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");
