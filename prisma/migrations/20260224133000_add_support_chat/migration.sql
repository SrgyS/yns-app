-- CreateEnum
CREATE TYPE "SupportMessageSenderType" AS ENUM ('USER', 'STAFF', 'SYSTEM');

-- CreateEnum
CREATE TYPE "SupportReadType" AS ENUM ('USER', 'STAFF');

-- AlterTable
ALTER TABLE "StaffPermission"
ADD COLUMN "canManageSupportChats" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "SupportDialog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportDialog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportMessage" (
    "id" TEXT NOT NULL,
    "dialogId" TEXT NOT NULL,
    "senderType" "SupportMessageSenderType" NOT NULL,
    "senderUserId" TEXT,
    "senderStaffId" TEXT,
    "text" TEXT,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportReadState" (
    "id" TEXT NOT NULL,
    "dialogId" TEXT NOT NULL,
    "readerType" "SupportReadType" NOT NULL,
    "readerUserId" TEXT NOT NULL,
    "lastReadMessageId" TEXT,
    "readAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportReadState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupportDialog_userId_updatedAt_idx" ON "SupportDialog"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "SupportDialog_lastMessageAt_idx" ON "SupportDialog"("lastMessageAt");

-- CreateIndex
CREATE INDEX "SupportMessage_dialogId_createdAt_idx" ON "SupportMessage"("dialogId", "createdAt");

-- CreateIndex
CREATE INDEX "SupportMessage_senderType_createdAt_idx" ON "SupportMessage"("senderType", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SupportReadState_dialogId_readerType_readerUserId_key" ON "SupportReadState"("dialogId", "readerType", "readerUserId");

-- CreateIndex
CREATE INDEX "SupportReadState_dialogId_readerType_idx" ON "SupportReadState"("dialogId", "readerType");

-- AddForeignKey
ALTER TABLE "SupportDialog"
ADD CONSTRAINT "SupportDialog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportMessage"
ADD CONSTRAINT "SupportMessage_dialogId_fkey" FOREIGN KEY ("dialogId") REFERENCES "SupportDialog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportMessage"
ADD CONSTRAINT "SupportMessage_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportMessage"
ADD CONSTRAINT "SupportMessage_senderStaffId_fkey" FOREIGN KEY ("senderStaffId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportReadState"
ADD CONSTRAINT "SupportReadState_dialogId_fkey" FOREIGN KEY ("dialogId") REFERENCES "SupportDialog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportReadState"
ADD CONSTRAINT "SupportReadState_readerUserId_fkey" FOREIGN KEY ("readerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
