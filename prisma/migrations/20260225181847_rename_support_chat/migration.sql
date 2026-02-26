-- AlterTable
ALTER TABLE "ChatDialog" RENAME CONSTRAINT "SupportDialog_pkey" TO "ChatDialog_pkey";

-- AlterTable
ALTER TABLE "ChatMessage" RENAME CONSTRAINT "SupportMessage_pkey" TO "ChatMessage_pkey";

-- RenameForeignKey
ALTER TABLE "ChatDialog" RENAME CONSTRAINT "SupportDialog_userId_fkey" TO "ChatDialog_userId_fkey";

-- RenameForeignKey
ALTER TABLE "ChatMessage" RENAME CONSTRAINT "SupportMessage_dialogId_fkey" TO "ChatMessage_dialogId_fkey";

-- RenameForeignKey
ALTER TABLE "ChatMessage" RENAME CONSTRAINT "SupportMessage_senderStaffId_fkey" TO "ChatMessage_senderStaffId_fkey";

-- RenameForeignKey
ALTER TABLE "ChatMessage" RENAME CONSTRAINT "SupportMessage_senderUserId_fkey" TO "ChatMessage_senderUserId_fkey";

-- RenameIndex
ALTER INDEX "SupportDialog_lastMessageAt_idx" RENAME TO "ChatDialog_lastMessageAt_idx";

-- RenameIndex
ALTER INDEX "SupportDialog_userId_updatedAt_idx" RENAME TO "ChatDialog_userId_updatedAt_idx";

-- RenameIndex
ALTER INDEX "SupportMessage_dialogId_createdAt_idx" RENAME TO "ChatMessage_dialogId_createdAt_idx";

-- RenameIndex
ALTER INDEX "SupportMessage_senderType_createdAt_idx" RENAME TO "ChatMessage_senderType_createdAt_idx";
