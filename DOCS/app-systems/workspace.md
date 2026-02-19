# System: Workspace

## Purpose
Provides a first-class workspace entity that scopes projects, membership, and workspace-level settings (e.g. AI provider API config). Enables multi-user collaboration per workspace with a simple add-member flow; invite/accept and email onboarding may be added later.

## Responsibilities
- Model workspace and workspace–user membership
- Bootstrap a default workspace and associate default user for prototype
- Store workspace-scoped AI provider config (API keys encrypted at rest)
- Expose membership and config to settings UI and to AI engine (decrypt at runtime only)
- Enforce workspace membership for actions that modify workspace or use workspace config

## Inputs
- Current user (from cookie/header in prototype)
- Workspace ID for membership and config operations
- Add-member: userId to add
- Create user: display name (from Settings; creates new AppUser)
- Switch user: selected userId + explicit confirmation (sets browser-scoped cookie for prototype)
- AI config: providerId, apiKey (plaintext only at input; stored encrypted), baseUrl, defaultModel; optional availableModels (JSON array of model IDs, populated after save or “Refresh models”)

## Outputs
- Workspace and membership records
- Encrypted WorkspaceAiConfig records (API key never stored in plaintext); availableModels stored per provider for model dropdowns app-wide
- Decrypted provider config only at server call sites that need it (e.g. AI engine)

## Dependencies
- doc-store (Prisma: Workspace, WorkspaceMembership, WorkspaceAiConfig; Project.workspaceId)
- Encryption: `lib/security/encryption.ts` (AES-256-GCM, env master key)
- User repository for default user and listing users

## Code Mapping
- Schema: `prisma/schema.prisma` (Workspace, WorkspaceMembership, WorkspaceAiConfig; Project.workspaceId)
- Repositories: `lib/repositories/workspace.repository.ts`, `lib/repositories/workspace-ai-config.repository.ts`
- Security: `lib/security/encryption.ts` (encryptSecret, decryptSecret)
- Config consumption: `lib/ai/get-workspace-provider-config.ts` (getDecryptedWorkspaceProviderConfig)
- List models (server-only): `lib/ai/list-models.ts` (listModelsForProvider, parseAvailableModels); used when saving config or refreshing models
- Model grouping and descriptions (client-side): `lib/utils/group-models-for-select.ts` (groupAndSortModels, getModelDescription, resolveSuggestedModel), `lib/utils/model-descriptions.ts` (curated descriptions; provider APIs do not return them)
- Actions: `app/actions/workspace.actions.ts`, `app/actions/workspace-ai-config.actions.ts` (saveWorkspaceAiConfigAction, refreshWorkspaceModelsAction), `app/actions/user.actions.ts` (createUserAction, switchCurrentUserAction)
- UI: `app/(app)/settings/` — Profile card (avatar, display name); Workspace card (members/add-member, AI config); Prototype card (active-user selector + “Use this user in this browser” button, create-user form)

## Current Implementation (prototype)
- Single default workspace created on first use; default user is added as member.
- Settings: **Profile** card — avatar color and display name. **Workspace** card — members list and add-member, plus AI provider (OpenAI, Anthropic) with API key (masked), optional base URL and default model; after saving an API key, available models are fetched and stored; default model is chosen from a grouped list (3-column layout; descriptions and Suggested badge) (or “Other” for a custom ID); “Refresh models” button refetches the list when key exists. Model list is reused in Synthesize wizard and System evolve as model options. **Prototype: user simulation** card — (1) **Active user (this browser)** — select a user from dropdown, then click “Use this user in this browser” to set the `gameplan-user-id` cookie for this browser only; (2) **Create user** — name field creates a new AppUser (no cookie change); new users appear in the selector and can be added to the workspace. Create and switch are for prototyping only.
- No auth layer yet; membership and “current user” are prototype mechanisms (e.g. cookie-based user id). Design assumes auth will be added later without changing “encrypt at rest, decrypt only server-side” semantics.

## Security: prototype vs production
- **Prototype:** App-level AES-256-GCM encryption at rest; master key from env (`WORKSPACE_SECRETS_MASTER_KEY`). Decrypt only in server process when building provider config. DB admin cannot read API keys from DB.
- **Production requirement (for later):** Stronger controls: KMS/HSM-backed envelope encryption, key rotation, audit logging for secret access, proper authN/authZ, and least-privilege ops. Documented here so production rollout can satisfy “DB admin must not have access to API keys” and PII-level handling.

## Known Limitations
- No invite/accept or email onboarding; add-member is “select existing user and add.”
- Single workspace per app in prototype (default workspace).
- Project.workspaceId is optional; existing projects may be unassigned until explicitly associated.

## Target Evolution
- Invite flow with optional email notifications and accept step
- Multiple workspaces per user and workspace switcher
- Roles/permissions (e.g. owner, admin, member)
- Production secret management (KMS, rotation, audit)

## Change Log
- 2026-02-17: Initial workspace model, membership, encrypted AI config, settings User/Workspace panels.
- 2026-02-17: Add Settings create-user form and switch-user dropdown for prototype testing.
- 2026-02-17: Settings restructure into Profile, Workspace, Prototype cards; workspace members in Workspace section; active user set via explicit “Use this user in this browser” button; create-user is create-only (no auto-switch).
- 2026-02-19: Available models fetched on save/refresh and stored on WorkspaceAiConfig; default model dropdown and Refresh models in Settings; same model options used in Synthesize wizard and System evolve.
- 2026-02-19: Settings AI config: full-width 3-column layout with grouped model list (no dropdown); model descriptions from curated map (lib/utils/model-descriptions.ts); suggested price-sensitive model per provider; Synthesize/Evolve keep dropdowns with tooltip descriptions and Suggested label.
