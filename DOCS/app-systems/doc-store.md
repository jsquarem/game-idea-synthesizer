# System: Doc Store

## Purpose
Provides the persistence layer for all application data. Abstracts database access behind repository interfaces. Handles JSON serialization for SQLite string fields.

## Responsibilities
- CRUD operations for all domain models
- JSON serialization/deserialization for complex fields stored as strings in SQLite
- Pagination and filtering
- Cascade delete management
- Transaction support for multi-step operations (merge, split, conversion)
- Unique constraint enforcement

## Inputs
- Typed input objects from service layer
- Filter and pagination parameters

## Outputs
- Typed domain model records
- Paginated result sets
- Relation-included queries (e.g., system with dependencies)

## Dependencies
- Prisma Client (ORM)
- SQLite database

## Code Mapping
- Prisma schema: `prisma/schema.prisma`
- Repositories: `lib/repositories/*.repository.ts`
- Shared types: `lib/repositories/types.ts`
- Prisma client singleton: `lib/db.ts`

## Current Implementation
(To be filled during implementation)

## Known Limitations
- SQLite single-writer constraint (not an issue for single-user/small-team use)
- JSON fields are not queryable via SQL (must deserialize in application layer)
- No full-text search index in v1

## Target Evolution
- PostgreSQL migration option for multi-user deployments
- Full-text search via SQLite FTS5 extension
- Database migration versioning strategy
- Backup/restore utilities

## Change Log
(Chronological updates)
