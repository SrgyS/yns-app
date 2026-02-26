-- Rename constraints and indexes created in support-chat migration to Chat* names.
-- This migration runs before table rename, so it must target Support* tables.
-- All operations are guarded to be idempotent on replays/shadow DB.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'SupportDialog_pkey'
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'SupportDialog'
    ) THEN
      ALTER TABLE "SupportDialog" RENAME CONSTRAINT "SupportDialog_pkey" TO "ChatDialog_pkey";
    ELSIF EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'ChatDialog'
    ) THEN
      ALTER TABLE "ChatDialog" RENAME CONSTRAINT "SupportDialog_pkey" TO "ChatDialog_pkey";
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'SupportMessage_pkey'
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'SupportMessage'
    ) THEN
      ALTER TABLE "SupportMessage" RENAME CONSTRAINT "SupportMessage_pkey" TO "ChatMessage_pkey";
    ELSIF EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'ChatMessage'
    ) THEN
      ALTER TABLE "ChatMessage" RENAME CONSTRAINT "SupportMessage_pkey" TO "ChatMessage_pkey";
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'SupportDialog_userId_fkey'
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'SupportDialog'
    ) THEN
      ALTER TABLE "SupportDialog" RENAME CONSTRAINT "SupportDialog_userId_fkey" TO "ChatDialog_userId_fkey";
    ELSIF EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'ChatDialog'
    ) THEN
      ALTER TABLE "ChatDialog" RENAME CONSTRAINT "SupportDialog_userId_fkey" TO "ChatDialog_userId_fkey";
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'SupportMessage_dialogId_fkey'
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'SupportMessage'
    ) THEN
      ALTER TABLE "SupportMessage" RENAME CONSTRAINT "SupportMessage_dialogId_fkey" TO "ChatMessage_dialogId_fkey";
    ELSIF EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'ChatMessage'
    ) THEN
      ALTER TABLE "ChatMessage" RENAME CONSTRAINT "SupportMessage_dialogId_fkey" TO "ChatMessage_dialogId_fkey";
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'SupportMessage_senderStaffId_fkey'
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'SupportMessage'
    ) THEN
      ALTER TABLE "SupportMessage" RENAME CONSTRAINT "SupportMessage_senderStaffId_fkey" TO "ChatMessage_senderStaffId_fkey";
    ELSIF EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'ChatMessage'
    ) THEN
      ALTER TABLE "ChatMessage" RENAME CONSTRAINT "SupportMessage_senderStaffId_fkey" TO "ChatMessage_senderStaffId_fkey";
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'SupportMessage_senderUserId_fkey'
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'SupportMessage'
    ) THEN
      ALTER TABLE "SupportMessage" RENAME CONSTRAINT "SupportMessage_senderUserId_fkey" TO "ChatMessage_senderUserId_fkey";
    ELSIF EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'ChatMessage'
    ) THEN
      ALTER TABLE "ChatMessage" RENAME CONSTRAINT "SupportMessage_senderUserId_fkey" TO "ChatMessage_senderUserId_fkey";
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class
    WHERE relkind = 'i'
      AND relname = 'SupportDialog_lastMessageAt_idx'
  ) THEN
    ALTER INDEX "SupportDialog_lastMessageAt_idx" RENAME TO "ChatDialog_lastMessageAt_idx";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class
    WHERE relkind = 'i'
      AND relname = 'SupportDialog_userId_updatedAt_idx'
  ) THEN
    ALTER INDEX "SupportDialog_userId_updatedAt_idx" RENAME TO "ChatDialog_userId_updatedAt_idx";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class
    WHERE relkind = 'i'
      AND relname = 'SupportMessage_dialogId_createdAt_idx'
  ) THEN
    ALTER INDEX "SupportMessage_dialogId_createdAt_idx" RENAME TO "ChatMessage_dialogId_createdAt_idx";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class
    WHERE relkind = 'i'
      AND relname = 'SupportMessage_senderType_createdAt_idx'
  ) THEN
    ALTER INDEX "SupportMessage_senderType_createdAt_idx" RENAME TO "ChatMessage_senderType_createdAt_idx";
  END IF;
END $$;
