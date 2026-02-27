-- Rename enum for sender type to match Prisma schema
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'SupportMessageSenderType'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'ChatMessageSenderType'
  ) THEN
    ALTER TYPE "SupportMessageSenderType" RENAME TO "ChatMessageSenderType";
  END IF;
END $$;

-- Rename support chat tables to chat tables
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'SupportDialog'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'ChatDialog'
  ) THEN
    ALTER TABLE "SupportDialog" RENAME TO "ChatDialog";
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'SupportMessage'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'ChatMessage'
  ) THEN
    ALTER TABLE "SupportMessage" RENAME TO "ChatMessage";
  END IF;
END $$;

