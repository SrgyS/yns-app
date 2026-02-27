-- CreateEnum
CREATE TYPE "ChatAttachmentStatus" AS ENUM ('UPLOADED', 'LINKED');

-- CreateTable
CREATE TABLE "ChatAttachment" (
    "id" TEXT NOT NULL,
    "dialogId" TEXT NOT NULL,
    "messageId" TEXT,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "originalName" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "status" "ChatAttachmentStatus" NOT NULL DEFAULT 'UPLOADED',
    "etag" TEXT,
    "lastModified" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatAttachment_dialogId_id_idx" ON "ChatAttachment"("dialogId", "id");

-- CreateIndex
CREATE INDEX "ChatAttachment_messageId_idx" ON "ChatAttachment"("messageId");

-- CreateIndex
CREATE INDEX "ChatAttachment_status_createdAt_idx" ON "ChatAttachment"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "ChatAttachment"
ADD CONSTRAINT "ChatAttachment_dialogId_fkey" FOREIGN KEY ("dialogId") REFERENCES "SupportDialog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatAttachment"
ADD CONSTRAINT "ChatAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "SupportMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatAttachment"
ADD CONSTRAINT "ChatAttachment_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
