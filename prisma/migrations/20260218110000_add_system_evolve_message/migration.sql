-- CreateTable
CREATE TABLE "SystemEvolveMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameSystemId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SystemEvolveMessage_gameSystemId_fkey" FOREIGN KEY ("gameSystemId") REFERENCES "GameSystem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SystemEvolveMessage_gameSystemId_idx" ON "SystemEvolveMessage"("gameSystemId");
