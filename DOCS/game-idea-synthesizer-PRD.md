# Product Requirements Document (PRD)
## Product Name: GamePlan AI (Working Title)
**Version:** v1.0 (Unified Product + Architecture)
**Status:** Draft

---

# 1. Executive Summary

GamePlan AI is a documentation-first web application that transforms chaotic game development brainstorming into structured, versioned, dependency-aware systems and executable development plans.

It bridges the gap between:

Conversation → Structured Systems → Dependency Graph → Version Plan → AI-Ready Execution

The product goal is:

> Turn unstructured creative discussion into rational, scoped, dependency-aware game design documentation.

The engineering goal is:

> Build the system in a modular, documentation-native, AI-friendly way that preserves long-term structural clarity and avoids architectural drift.

This PRD defines both:
- What the product is and does
- The architectural constraints required to support long-term AI-assisted iteration

---

# 2. Problem

Game development ideation is fragmented across:

- Discord threads
- Ad hoc AI prompts
- Notes apps
- Markdown files
- Voice conversations

As ideas evolve:

- System boundaries remain implicit
- Dependencies are unclear
- Scope inflates unpredictably
- Version targets lack discipline
- Implementation order becomes arbitrary

Turning creative chaos into structured, actionable documentation requires heavy manual organization.

---

# 3. Solution

GamePlan AI is a web application that:

1. Ingests brainstorming discussions.
2. Synthesizes ideas into structured gameplay systems.
3. Identifies and formalizes dependencies between systems.
4. Enables version targeting (v1, v1.1, v2, etc.).
5. Generates phased implementation plans derived from dependency relationships.
6. Produces structured markdown and AI-ready prompt bundles.

The system does not replace creativity.

It structures it.

---

# 4. Product Vision

GamePlan AI becomes:

A structured reasoning engine for game design.

It transforms:

Conversation → Systems  
Systems → Dependencies  
Dependencies → Phases  
Phases → Executable Plans  

It should feel like:

- A design synthesizer
- A structural clarity engine
- A roadmap generator
- An AI prompt amplifier

It should not become:

- A Jira replacement
- A full project management suite
- A heavy enterprise workflow system

---

# 5. Target Users

Primary Users:

- Indie game developers
- AI-assisted solo builders
- Small game dev teams
- Designers brainstorming in Discord
- Technical founders iterating on gameplay systems

User traits:

- Comfortable with markdown
- Comfortable using AI tools
- Systems-oriented thinkers
- Rapid iteration mindset

---

# 6. Core Product Concepts

## 6.1 Project

A top-level container for:

- Brainstorm Sessions
- Idea Stream (threads and messages; can be finalized into brainstorm sessions)
- Synthesized Outputs
- Systems
- Version Plans
- Prompt History
- Exports

Project metadata:

- Name
- Description
- Genre
- Target Platform
- Status (Ideation / Active / Archived)

---

## 6.2 Brainstorm Session

Raw creative input.

v1 input methods:

- Manual paste of Discord conversations
- Freeform text entry
- Markdown upload
- Idea Stream finalize (select threads → generate brainstorm session → synthesize)

Each session stores:

- Author
- Timestamp
- Message content
- Optional tags

Brainstorm sessions are immutable records of ideation.

---

## 6.3 Game System

A distinct gameplay subsystem such as:

- Movement
- Combat
- Health
- Inventory
- Economy
- Crafting
- Progression
- AI Behavior

Each system:

- Lives as its own markdown document
- Has a unique System ID
- Declares dependencies
- Has versioning
- Can evolve over time

Systems are:

- Editable
- Regeneratable
- Mergeable
- Splittable

---

## 6.4 Dependency Graph

The application derives a directed graph between systems.

Example:

- Combat → depends on Health, Movement
- Economy → depends on Combat, Loot
- Progression → depends on Combat, Economy

This graph enables:

- Suggested implementation ordering
- Impact analysis
- Version scoping validation
- Risk surface detection

Dependency ordering must be rational and deterministic.

---

## 6.5 Version Plan

Users select systems and generate:

- v1
- v1.1
- v2
- Experimental branch plans

AI produces:

- Included systems
- Explicit exclusions
- Development phases
- Milestones
- Risk areas
- Dependency-ordered implementation sequence
- Scope validation notes

Version plans are immutable snapshots.

---

## 6.6 Prompt Generator

For any system or version plan, users can generate:

- Implementation prompts
- Architecture prompts
- Refactor prompts
- Balance prompts
- Expansion prompts

Prompt output modes:

- Raw prompt only
- Prompt + structured context
- Prompt bundle (markdown)

All prompts are stored with their AI responses for transparency.

---

## 6.7 Markdown Export

Exportable documents:

- Full GDD
- Version PRD
- Individual System Documents
- Roadmap Plan
- Prompt Bundle

Formats:

- Markdown (.md)
- JSON
- Copy-to-clipboard

Markdown is the primary external artifact.

---

# 7. System Markdown Schema (Required)

Every game system must follow a strict template:

```markdown
# System: <Name>

## System ID
<slug>

## Version
vX.Y

## Status
Draft | Active | Deprecated

## Purpose
High-level description.

## Current State
What is currently defined.

## Target State
Desired evolution.

## Core Mechanics
Primary behaviors.

## Inputs
Consumed data/interactions.

## Outputs
Produced state/data.

## Dependencies
System IDs relied upon.

## Depended On By
(Optional auto-generated)

## Failure States
How this system can break.

## Scaling Behavior
How it evolves over time.

## MVP Criticality
Core | Important | Later

## Implementation Notes
Constraints or assumptions.

## Open Questions
Unresolved areas.

## Change Log
Chronological updates.
```

This structure ensures:

- AI parseability
- Consistency
- Version clarity
- Clear system boundaries

---

# 8. System Evolution Model

Each system contains:

- Current State
- Target State

AI must be able to generate:

- Delta Summary
- Required Changes
- Dependency Impact
- Suggested Refactor Order

Changes are never auto-applied.
All modifications are proposed and reviewed before persistence.

---

# 9. Core Workflow

1. Create Project.
2. Add Brainstorm Session (or use Idea Stream: create threads, discuss, then Finalize + Synthesize to create a session from selected threads).
3. Paste Discord thread or ideas (or use content from Idea Stream finalize).
4. Click “Synthesize.”
5. Review structured output.
6. Convert output to Systems.
7. Review dependencies.
8. Tag MVP criticality.
9. Generate Version Plan (e.g., v1).
10. Review phased roadmap.
11. Export markdown or generate prompts.

Time from brainstorm to structured plan should be under 10 minutes.

---

# 10. Architecture Principles

The product must remain:

- Documentation-first
- Modular
- AI-friendly
- Iteration-safe
- Free from architectural drift

---

# 11. Documentation-First Design

Markdown is canonical.

- Brainstorms → `.md`
- Systems → `.md`
- Version Plans → `.md`
- App subsystem specs → `.md`

Structured JSON views are derived from markdown via parsers.

There is no hidden business state outside documented artifacts.

Benefits:

- Git-friendly storage
- AI-readable format
- Long-term transparency
- Reduced coupling

---

# 12. Separation of Concerns (Critical)

Business logic must never live in route handlers.

Architecture layers:

Routes:
- Handle HTTP
- Call services only

Services:
- Contain business logic

Repositories:
- Handle file or database IO

Parsers:
- Convert markdown ↔ structured objects

Graph Engine:
- Builds and queries dependency graph

AI Engine:
- Constructs prompts
- Handles completion calls
- Stores prompt-response history

No cross-layer leakage.

---

# 13. Application Subsystems (Each Documented Separately)

Under `/docs/app-systems`, each major subsystem must have its own spec:

- ingestion.md
- system-extraction.md
- dependency-graph.md
- doc-store.md
- versioning.md
- export-engine.md
- ai-engine.md

Each app subsystem doc must include:

```markdown
# System: <App Subsystem Name>

## Purpose
## Responsibilities
## Inputs
## Outputs
## Dependencies
## Current Implementation
## Known Limitations
## Target Evolution
## Change Log
```

This enables:

- AI-assisted refactoring
- Clear modular boundaries
- Controlled architectural evolution

---

# 14. Technical Stack (Initial Direction)

Frontend:

- Next.js (App Router)
- TailwindCSS
- Component-driven system view
- Markdown + Structured toggle

Backend:

- Next.js API routes or Node + Express
- PostgreSQL (optional, file-based storage acceptable early)

AI Layer:

- OpenAI / Claude / Gemini
- Raw completion calls (v1)
- Store prompt + response pairs

Hosting:

- Dockerized
- Homelab primary
- Optional cloud later

No complex orchestration in v1.

---

# 15. Metrics for Success

- Brainstorm → structured systems in < 10 minutes.
- At least one version plan generated per project.
- Markdown exports reused externally.
- Prompt generation reused across multiple AI tools.
- Architecture remains modular after multiple feature additions.

---

# 16. Risks

- Over-automation reduces creative control.
- AI hallucinations introduce structural errors.
- Scope creep into full PM suite.
- Architectural drift if constraints are not enforced.

---

# 17. Long-Term Vision

GamePlan AI becomes:

A structured cognitive layer for game development.

It enables:

- Design clarity
- Dependency reasoning
- Rational scoping
- AI-accelerated execution

Built in a way that:

- Is documentation-native
- Is AI-native
- Is modular
- Is iteration-friendly
- Does not collapse under its own abstraction

## Change Log

- 2026-02-17: PRD aligned with current scope and app-systems.
