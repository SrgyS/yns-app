-- Canonicalize support chat dialogs to one dialog per user.
-- The migration keeps one canonical dialog for each user, moves dependent rows,
-- and then enforces uniqueness on "ChatDialog"."userId".

CREATE TEMP TABLE chat_dialog_canonical_selection ON COMMIT DROP AS
SELECT
  ranked."userId",
  ranked.id AS canonical_id
FROM (
  SELECT
    d."userId",
    d.id,
    ROW_NUMBER() OVER (
      PARTITION BY d."userId"
      ORDER BY d."lastMessageAt" DESC, d."createdAt" DESC, d.id ASC
    ) AS row_number
  FROM "ChatDialog" d
) ranked
WHERE ranked.row_number = 1;

CREATE TEMP TABLE chat_dialog_duplicate_map ON COMMIT DROP AS
SELECT
  d.id AS duplicate_id,
  canonical.canonical_id,
  d."userId"
FROM "ChatDialog" d
JOIN chat_dialog_canonical_selection canonical
  ON canonical."userId" = d."userId"
WHERE d.id <> canonical.canonical_id;

CREATE TEMP TABLE chat_dialog_affected_map ON COMMIT DROP AS
SELECT
  duplicate_id AS dialog_id,
  canonical_id
FROM chat_dialog_duplicate_map
UNION
SELECT
  canonical_id AS dialog_id,
  canonical_id
FROM chat_dialog_duplicate_map;

CREATE TEMP TABLE chat_read_state_ranked ON COMMIT DROP AS
SELECT
  sr.id,
  affected.canonical_id,
  ROW_NUMBER() OVER (
    PARTITION BY affected.canonical_id, sr."readerType", sr."readerUserId"
    ORDER BY sr."readAt" DESC NULLS LAST, sr."updatedAt" DESC, sr."createdAt" DESC, sr.id DESC
  ) AS row_number
FROM "SupportReadState" sr
JOIN chat_dialog_affected_map affected
  ON affected.dialog_id = sr."dialogId";

DELETE FROM "SupportReadState"
WHERE id IN (
  SELECT ranked.id
  FROM chat_read_state_ranked ranked
  WHERE ranked.row_number > 1
);

UPDATE "SupportReadState" sr
SET
  "dialogId" = ranked.canonical_id,
  "updatedAt" = NOW()
FROM chat_read_state_ranked ranked
WHERE sr.id = ranked.id
  AND ranked.row_number = 1
  AND sr."dialogId" <> ranked.canonical_id;

UPDATE "ChatMessage" message
SET "dialogId" = mapping.canonical_id
FROM chat_dialog_duplicate_map mapping
WHERE message."dialogId" = mapping.duplicate_id;

UPDATE "ChatAttachment" attachment
SET "dialogId" = mapping.canonical_id
FROM chat_dialog_duplicate_map mapping
WHERE attachment."dialogId" = mapping.duplicate_id;

UPDATE "ChatDialog" dialog
SET
  "lastMessageAt" = COALESCE(message_summary.latest_message_at, dialog."lastMessageAt"),
  "updatedAt" = NOW()
FROM (
  SELECT
    mapping.canonical_id,
    MAX(message."createdAt") AS latest_message_at
  FROM chat_dialog_duplicate_map mapping
  LEFT JOIN "ChatMessage" message
    ON message."dialogId" = mapping.canonical_id
  GROUP BY mapping.canonical_id
) message_summary
WHERE dialog.id = message_summary.canonical_id;

DELETE FROM "ChatDialog"
WHERE id IN (
  SELECT mapping.duplicate_id
  FROM chat_dialog_duplicate_map mapping
);

DROP INDEX IF EXISTS "ChatDialog_userId_updatedAt_idx";
CREATE UNIQUE INDEX "ChatDialog_userId_key" ON "ChatDialog"("userId");
CREATE INDEX "ChatDialog_updatedAt_idx" ON "ChatDialog"("updatedAt");
