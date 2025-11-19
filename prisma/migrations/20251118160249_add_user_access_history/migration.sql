-- CreateTable
CREATE TABLE "UserAccessHistory" (
    "id" TEXT NOT NULL,
    "userAccessId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "adminId" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAccessHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserAccessHistory_userAccessId_idx" ON "UserAccessHistory"("userAccessId");

-- AddForeignKey
ALTER TABLE "UserAccessHistory" ADD CONSTRAINT "UserAccessHistory_userAccessId_fkey" FOREIGN KEY ("userAccessId") REFERENCES "UserAccess"("id") ON DELETE CASCADE ON UPDATE CASCADE;
