-- AlterTable
ALTER TABLE "chat_messages" ADD COLUMN     "flagReason" TEXT;

-- CreateIndex
CREATE INDEX "chat_messages_userId_createdAt_idx" ON "chat_messages"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "chat_messages_flagged_idx" ON "chat_messages"("flagged");
