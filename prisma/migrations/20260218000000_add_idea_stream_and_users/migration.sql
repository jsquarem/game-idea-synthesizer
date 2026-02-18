-- CreateTable
CREATE TABLE "AppUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "displayName" TEXT,
    "avatarColor" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProjectMembership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectMembership_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IdeaStreamThread" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "IdeaStreamThread_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "IdeaStreamThread_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "AppUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IdeaStreamMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "parentMessageId" TEXT,
    "authorUserId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "editedAt" DATETIME,
    "deletedAt" DATETIME,
    "deletedByUserId" TEXT,
    CONSTRAINT "IdeaStreamMessage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "IdeaStreamMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "IdeaStreamThread" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "IdeaStreamMessage_parentMessageId_fkey" FOREIGN KEY ("parentMessageId") REFERENCES "IdeaStreamMessage" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "IdeaStreamMessage_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "AppUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IdeaStreamThreadRead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IdeaStreamThreadRead_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "IdeaStreamThreadRead_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "IdeaStreamThread" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "IdeaStreamThreadRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
CREATE TABLE "new_BrainstormSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "content" TEXT NOT NULL,
    "author" TEXT,
    "tags" TEXT,
    "sourceThreadIds" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BrainstormSession_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_BrainstormSession" ("id", "projectId", "title", "source", "content", "author", "tags", "createdAt") SELECT "id", "projectId", "title", "source", "content", "author", "tags", "createdAt" FROM "BrainstormSession";
DROP TABLE "BrainstormSession";
ALTER TABLE "new_BrainstormSession" RENAME TO "BrainstormSession";
CREATE INDEX "BrainstormSession_projectId_idx" ON "BrainstormSession"("projectId");
CREATE INDEX "BrainstormSession_createdAt_idx" ON "BrainstormSession"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AppUser_email_key" ON "AppUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMembership_projectId_userId_key" ON "ProjectMembership"("projectId", "userId");
CREATE INDEX "ProjectMembership_projectId_idx" ON "ProjectMembership"("projectId");
CREATE INDEX "ProjectMembership_userId_idx" ON "ProjectMembership"("userId");

-- CreateIndex
CREATE INDEX "IdeaStreamThread_projectId_idx" ON "IdeaStreamThread"("projectId");
CREATE INDEX "IdeaStreamThread_updatedAt_idx" ON "IdeaStreamThread"("updatedAt");

-- CreateIndex
CREATE INDEX "IdeaStreamMessage_threadId_createdAt_idx" ON "IdeaStreamMessage"("threadId", "createdAt");
CREATE INDEX "IdeaStreamMessage_projectId_updatedAt_idx" ON "IdeaStreamMessage"("projectId", "updatedAt");
CREATE INDEX "IdeaStreamMessage_parentMessageId_idx" ON "IdeaStreamMessage"("parentMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "IdeaStreamThreadRead_threadId_userId_key" ON "IdeaStreamThreadRead"("threadId", "userId");
CREATE INDEX "IdeaStreamThreadRead_projectId_idx" ON "IdeaStreamThreadRead"("projectId");
