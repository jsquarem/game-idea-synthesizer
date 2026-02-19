-- Baseline: schema state before 20260218000000_add_idea_stream_and_users.
-- Creates tables that migration 20260218000000 expects (Project, BrainstormSession, etc.)
-- and uses old column/table names that later migrations rename.

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WorkspaceAiConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "encryptedApiKey" TEXT NOT NULL,
    "baseUrl" TEXT,
    "defaultModel" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkspaceAiConfig_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "genre" TEXT,
    "platform" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ideation',
    "workspaceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable (old shape: no sourceThreadIds)
CREATE TABLE "BrainstormSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "content" TEXT NOT NULL,
    "author" TEXT,
    "tags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BrainstormSession_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable (extractedBehaviors, no suggestedSystems/suggestedSystemDetails)
CREATE TABLE "SynthesizedOutput" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "brainstormSessionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "extractedSystems" TEXT NOT NULL,
    "extractedBehaviors" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "aiProvider" TEXT,
    "aiModel" TEXT,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SynthesizedOutput_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SynthesizedOutput_brainstormSessionId_fkey" FOREIGN KEY ("brainstormSessionId") REFERENCES "BrainstormSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SynthesisConversationMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "synthesizedOutputId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SynthesisConversationMessage_synthesizedOutputId_fkey" FOREIGN KEY ("synthesizedOutputId") REFERENCES "SynthesizedOutput" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GameSystem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "synthesizedOutputId" TEXT,
    "systemSlug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'v0.1',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "purpose" TEXT,
    "currentState" TEXT,
    "targetState" TEXT,
    "coreMechanics" TEXT,
    "inputs" TEXT,
    "outputs" TEXT,
    "failureStates" TEXT,
    "scalingBehavior" TEXT,
    "mvpCriticality" TEXT NOT NULL DEFAULT 'important',
    "implementationNotes" TEXT,
    "openQuestions" TEXT,
    "markdownContent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GameSystem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GameSystem_synthesizedOutputId_fkey" FOREIGN KEY ("synthesizedOutputId") REFERENCES "SynthesizedOutput" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable (replaced by SystemDetail in 20260218100000)
CREATE TABLE "SystemBehavior" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameSystemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "detailType" TEXT NOT NULL,
    "spec" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "synthesizedOutputId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SystemBehavior_gameSystemId_fkey" FOREIGN KEY ("gameSystemId") REFERENCES "GameSystem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SystemBehavior_synthesizedOutputId_fkey" FOREIGN KEY ("synthesizedOutputId") REFERENCES "SynthesizedOutput" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectContextSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentVersion" INTEGER NOT NULL DEFAULT 1,
    "trigger" TEXT NOT NULL DEFAULT 'synthesis',
    "relatedSynthesisOutputId" TEXT,
    "relatedBrainstormSessionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectContextSnapshot_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Dependency" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceSystemId" TEXT NOT NULL,
    "targetSystemId" TEXT NOT NULL,
    "dependencyType" TEXT NOT NULL DEFAULT 'requires',
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Dependency_sourceSystemId_fkey" FOREIGN KEY ("sourceSystemId") REFERENCES "GameSystem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Dependency_targetSystemId_fkey" FOREIGN KEY ("targetSystemId") REFERENCES "GameSystem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChangeLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameSystemId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "details" TEXT,
    "changeType" TEXT NOT NULL DEFAULT 'update',
    "author" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChangeLog_gameSystemId_fkey" FOREIGN KEY ("gameSystemId") REFERENCES "GameSystem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VersionPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "versionLabel" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "includedSystems" TEXT NOT NULL,
    "excludedSystems" TEXT,
    "phases" TEXT,
    "milestones" TEXT,
    "riskAreas" TEXT,
    "implementationOrder" TEXT,
    "scopeValidation" TEXT,
    "markdownContent" TEXT,
    "finalizedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VersionPlan_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VersionPlanItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "versionPlanId" TEXT NOT NULL,
    "gameSystemId" TEXT NOT NULL,
    "phase" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    CONSTRAINT "VersionPlanItem_versionPlanId_fkey" FOREIGN KEY ("versionPlanId") REFERENCES "VersionPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VersionPlanItem_gameSystemId_fkey" FOREIGN KEY ("gameSystemId") REFERENCES "GameSystem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PromptHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "gameSystemId" TEXT,
    "versionPlanId" TEXT,
    "promptType" TEXT NOT NULL,
    "promptTemplate" TEXT NOT NULL,
    "promptInput" TEXT NOT NULL,
    "promptContext" TEXT,
    "response" TEXT,
    "aiProvider" TEXT NOT NULL,
    "aiModel" TEXT NOT NULL,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "durationMs" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PromptHistory_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PromptHistory_gameSystemId_fkey" FOREIGN KEY ("gameSystemId") REFERENCES "GameSystem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Export" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "exportType" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'markdown',
    "content" TEXT NOT NULL,
    "metadata" TEXT,
    "synthesizedOutputId" TEXT,
    "markedUpToDateAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Export_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Workspace_createdAt_idx" ON "Workspace"("createdAt");

-- CreateIndex
CREATE INDEX "WorkspaceAiConfig_workspaceId_idx" ON "WorkspaceAiConfig"("workspaceId");
CREATE UNIQUE INDEX "WorkspaceAiConfig_workspaceId_providerId_key" ON "WorkspaceAiConfig"("workspaceId", "providerId");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");
CREATE INDEX "Project_createdAt_idx" ON "Project"("createdAt");
CREATE INDEX "Project_workspaceId_idx" ON "Project"("workspaceId");

-- CreateIndex
CREATE INDEX "BrainstormSession_projectId_idx" ON "BrainstormSession"("projectId");
CREATE INDEX "BrainstormSession_createdAt_idx" ON "BrainstormSession"("createdAt");

-- CreateIndex
CREATE INDEX "SynthesizedOutput_projectId_idx" ON "SynthesizedOutput"("projectId");
CREATE INDEX "SynthesizedOutput_brainstormSessionId_idx" ON "SynthesizedOutput"("brainstormSessionId");
CREATE INDEX "SynthesizedOutput_status_idx" ON "SynthesizedOutput"("status");

-- CreateIndex
CREATE INDEX "SynthesisConversationMessage_synthesizedOutputId_idx" ON "SynthesisConversationMessage"("synthesizedOutputId");

-- CreateIndex
CREATE INDEX "GameSystem_projectId_idx" ON "GameSystem"("projectId");
CREATE INDEX "GameSystem_status_idx" ON "GameSystem"("status");
CREATE INDEX "GameSystem_mvpCriticality_idx" ON "GameSystem"("mvpCriticality");
CREATE UNIQUE INDEX "GameSystem_projectId_systemSlug_key" ON "GameSystem"("projectId", "systemSlug");

-- CreateIndex
CREATE INDEX "SystemBehavior_gameSystemId_idx" ON "SystemBehavior"("gameSystemId");
CREATE INDEX "SystemBehavior_synthesizedOutputId_idx" ON "SystemBehavior"("synthesizedOutputId");

-- CreateIndex
CREATE INDEX "ProjectContextSnapshot_projectId_idx" ON "ProjectContextSnapshot"("projectId");
CREATE INDEX "ProjectContextSnapshot_projectId_createdAt_idx" ON "ProjectContextSnapshot"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "Dependency_sourceSystemId_idx" ON "Dependency"("sourceSystemId");
CREATE INDEX "Dependency_targetSystemId_idx" ON "Dependency"("targetSystemId");
CREATE UNIQUE INDEX "Dependency_sourceSystemId_targetSystemId_key" ON "Dependency"("sourceSystemId", "targetSystemId");

-- CreateIndex
CREATE INDEX "ChangeLog_gameSystemId_idx" ON "ChangeLog"("gameSystemId");
CREATE INDEX "ChangeLog_createdAt_idx" ON "ChangeLog"("createdAt");

-- CreateIndex
CREATE INDEX "VersionPlan_projectId_idx" ON "VersionPlan"("projectId");
CREATE INDEX "VersionPlan_status_idx" ON "VersionPlan"("status");
CREATE UNIQUE INDEX "VersionPlan_projectId_versionLabel_key" ON "VersionPlan"("projectId", "versionLabel");

-- CreateIndex
CREATE INDEX "VersionPlanItem_versionPlanId_idx" ON "VersionPlanItem"("versionPlanId");
CREATE UNIQUE INDEX "VersionPlanItem_versionPlanId_gameSystemId_key" ON "VersionPlanItem"("versionPlanId", "gameSystemId");

-- CreateIndex
CREATE INDEX "PromptHistory_projectId_idx" ON "PromptHistory"("projectId");
CREATE INDEX "PromptHistory_gameSystemId_idx" ON "PromptHistory"("gameSystemId");
CREATE INDEX "PromptHistory_promptType_idx" ON "PromptHistory"("promptType");
CREATE INDEX "PromptHistory_createdAt_idx" ON "PromptHistory"("createdAt");

-- CreateIndex
CREATE INDEX "Export_projectId_idx" ON "Export"("projectId");
CREATE INDEX "Export_exportType_idx" ON "Export"("exportType");
