# System: Ingestion

## Purpose
Handles the intake of raw brainstorming content from multiple sources (manual paste, Discord threads, markdown upload) into the application's storage layer.

## Responsibilities
- Accept and validate raw text input from the UI
- Detect input format (Discord conversation, freeform text, structured markdown)
- Store immutable brainstorm sessions linked to projects
- Parse raw content into structured messages via brainstorm-parser
- Trigger downstream synthesis pipeline on user request

## Inputs
- Raw text content (pasted or uploaded)
- Source type indicator (manual | discord | upload | idea-stream)
- Project reference
- Optional author and tags metadata
- Idea Stream finalize: selected thread IDs and generated markdown (source = "idea-stream", sourceThreadIds)

## Outputs
- Stored BrainstormSession record
- Parsed BrainstormMessage array (for UI display)
- Trigger signal to synthesis subsystem

## Dependencies
- doc-store (for persistence)
- brainstorm-parser (for format detection and parsing)
- Idea Stream (finalize flow creates brainstorm sessions from threads)

## Code Mapping
- Service: `lib/services/brainstorm.service.ts`
- Repository: `lib/repositories/brainstorm.repository.ts`
- Parser: `lib/parsers/brainstorm-parser.ts`
- Actions: `app/actions/brainstorm.actions.ts`
- Zod schema: `createBrainstormSchema`

## Current Implementation
(To be filled during implementation)

## Known Limitations
- v1 does not support real-time Discord bot integration
- File upload limited to plain text and markdown
- No OCR or voice-to-text support

## Target Evolution
- Discord bot integration for live ingestion
- Voice recording transcription
- Image/whiteboard scanning
- Batch import from multiple sources

## Change Log
(Chronological updates)
