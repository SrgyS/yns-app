/*
  Warnings:

  - You are about to drop the column `freezeDaysUsed` on the `UserAccess` table. All the data in the column will be lost.
  - You are about to drop the column `freezes` on the `UserAccess` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserAccess" DROP COLUMN "freezeDaysUsed",
DROP COLUMN "freezes";

-- CreateTable
CREATE TABLE "UserFreeze" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "canceledAt" TIMESTAMP(3),
    "canceledBy" TEXT,

    CONSTRAINT "UserFreeze_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserFreeze_userId_start_idx" ON "UserFreeze"("userId", "start");

-- CreateIndex
CREATE INDEX "UserFreeze_userId_end_idx" ON "UserFreeze"("userId", "end");

-- AddForeignKey
ALTER TABLE "UserFreeze" ADD CONSTRAINT "UserFreeze_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
