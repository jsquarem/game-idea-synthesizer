-- DropTable (destructive: DB can be cleared per plan)
DROP TABLE "SystemBehavior";

-- CreateTable
CREATE TABLE "SystemDetail" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameSystemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "detailType" TEXT NOT NULL,
    "spec" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "synthesizedOutputId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SystemDetail_gameSystemId_fkey" FOREIGN KEY ("gameSystemId") REFERENCES "GameSystem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SystemDetail_synthesizedOutputId_fkey" FOREIGN KEY ("synthesizedOutputId") REFERENCES "SynthesizedOutput" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SystemDetail_gameSystemId_idx" ON "SystemDetail"("gameSystemId");
CREATE INDEX "SystemDetail_synthesizedOutputId_idx" ON "SystemDetail"("synthesizedOutputId");

-- RedefineTables: SynthesizedOutput - rename extractedBehaviors to extractedSystemDetails (SQLite 3.35+)
ALTER TABLE "SynthesizedOutput" RENAME COLUMN "extractedBehaviors" TO "extractedSystemDetails";
