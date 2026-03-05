-- Add client correlation ID for support chat optimistic send reconciliation.
ALTER TABLE "ChatMessage"
ADD COLUMN "clientMessageId" TEXT;

-- Backfill existing rows to deterministic values so they can participate in uniqueness checks.
UPDATE "ChatMessage"
SET "clientMessageId" = CONCAT('legacy_', "id")
WHERE "clientMessageId" IS NULL;

-- Enforce per-dialog idempotency for client correlation identifiers.
CREATE UNIQUE INDEX "ChatMessage_dialogId_clientMessageId_key"
ON "ChatMessage"("dialogId", "clientMessageId");
