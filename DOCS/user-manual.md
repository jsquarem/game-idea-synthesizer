# GamePlan AI - User Manual

**Version:** 1.0
**Last updated:** February 2026

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
3. [Settings](#3-settings)
4. [Dashboard](#4-dashboard)
5. [Projects](#5-projects)
6. [Brainstorm Sessions](#6-brainstorm-sessions)
7. [Idea Stream](#7-idea-stream)
8. [Game Systems](#8-game-systems)
9. [Dependencies](#9-dependencies)
10. [Version Plans](#10-version-plans)
11. [Prompt History](#11-prompt-history)
12. [Export](#12-export)
13. [Core Workflow](#13-core-workflow)
14. [Glossary](#14-glossary)

---

## 1. Introduction

GamePlan AI is a documentation-first web application that transforms chaotic game development brainstorming into structured, versioned, dependency-aware systems and executable development plans.

It bridges the gap between raw creative discussion and actionable implementation plans:

**Conversation → Structured Systems → Dependency Graph → Version Plan → Executable Plan**

GamePlan AI is designed for indie game developers, AI-assisted solo builders, small game dev teams, and anyone who brainstorms game ideas and needs a way to organize them into something buildable.

### What GamePlan AI is

- A design synthesizer that structures creative chaos
- A dependency reasoning engine for game systems
- A roadmap generator with version-aware scoping
- A markdown-native documentation tool

### What GamePlan AI is not

- A project management suite (no tickets, sprints, or assignments)
- A replacement for creativity (it structures ideas, not generates them)
- A game engine or code editor

---

## 2. Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Edge, Safari)
- The GamePlan AI application running locally or on your server

### First Launch

When you first open GamePlan AI, you are taken to the **Dashboard**. The dashboard is your home base -- it shows all your projects and lets you create new ones.

If this is your first time, you will see a prompt to create your first project.

---

## 3. Settings

Open **Settings** by clicking your profile icon in the top bar. Settings is where you manage your profile, your workspace (members and AI), and—for prototyping—multiple users so you can test multi-user flows (e.g. Idea Stream as different people).

### Profile

- **Display name** — Shown in Idea Stream and other collaboration views. If you leave it blank, the app shows “Creator” for the thread starter and “Responder” for others in each thread.
- **Avatar color** — A color used for your avatar in Idea Stream and authoring. You can pick a preset or keep the default.

### Workspace

A **workspace** is the container for members and AI configuration. Projects can be linked to a workspace. By default you have one workspace.

- **Members** — The list shows who is in the workspace. To add someone, they must already exist as a user (see *Prototype: user simulation* below). Use **Add [name]** to add an existing user to the workspace. Invite-by-email may be added in a future release.
- **AI provider and API key** — Choose a provider (OpenAI or Anthropic), enter an API key, and optionally set a base URL and default model. Keys are stored encrypted. This config is used for AI-powered features (e.g. synthesis). Leave the key blank when saving to keep the existing key.

### Prototype: user simulation

For **testing multi-user behavior** (e.g. Idea Stream with two “users” in different browsers or tabs), the app supports creating multiple users and choosing who “this browser” acts as.

- **Active user (this browser)** — A dropdown lists all users. Select a user and click **Use this user in this browser**. From then on, this browser is treated as that user (cookies and session). Other browsers or tabs can act as different users. Use this to simulate multiple people in Idea Stream or other collaboration flows.
- **Create user** — Under *Create user*, enter a **Name** and click **Create user**. The new user appears in the active-user selector and can be added to the workspace. There is no email/password; this is for prototype simulation only.

---

## 4. Dashboard

The dashboard is the landing page of GamePlan AI, accessible at the root URL.

### What you see

- **Your Projects** heading with a **New Project** button in the top right
- A grid of project cards (or an empty state with a "Create your first project" prompt)

### Project cards

Each card displays:

- **Project name** (bold heading)
- **Description** (truncated to two lines if long)
- **Genre** tag (if set)
- **Status** badge (Ideation, Active, or Archived)

Click any project card to open that project's **Overview** page.

---

## 5. Projects

A project is the top-level container for everything in GamePlan AI. Each project holds its own brainstorm sessions, game systems, dependencies, version plans, prompt history, and exports.

### Creating a Project

1. From the Dashboard, click **New Project**.
2. Fill in the form:
   - **Name** (required) -- The name of your game or project.
   - **Description** -- A brief summary of what the project is about.
   - **Genre** -- The game genre (e.g., RPG, Platformer, Strategy).
   - **Platform** -- The target platform (e.g., PC, Mobile, Console).
3. Click **Create Project**.

You are redirected to the new project's Overview page.

### Project Overview

The Overview page is your project dashboard. It shows:

- **Project header** -- Name, genre, platform, and status badges.
- **Description** -- Your project summary.
- **Quick stats** -- Counts for Brainstorms, Systems, Dependencies, and Version Plans. Each stat is a clickable link to the corresponding section.
- **Quick action buttons** -- Shortcuts to create a New Brainstorm, New System, or New Version Plan.

### Navigation

Once inside a project, a tab bar provides navigation between all project sections:

| Tab | Description |
|---|---|
| **Overview** | Project dashboard and stats |
| **Brainstorms** | Brainstorm session management |
| **Systems** | Game system definitions |
| **Dependencies** | System dependency graph |
| **Versions** | Version plan management |
| **Prompts** | AI prompt history |
| **Idea Stream** | Lightweight collaboration: threads and replies, then finalize to brainstorm |
| **Export** | Document export and download |

A breadcrumb trail at the top always shows your current location and lets you navigate back.

---

## 6. Brainstorm Sessions

Brainstorm sessions are where raw creative input lives. They are immutable records of your ideation -- paste a Discord thread, write freeform notes, or upload content.

### Viewing Sessions

Navigate to the **Brainstorms** tab to see all sessions for the current project. Each session shows its title, creation date, and any tags.

### Creating a Session

1. Click **New Brainstorm** (from the Brainstorms list or the Overview page).
2. Fill in the form:
   - **Title** (required) -- Defaults to "Untitled". Give it a descriptive name.
   - **Input mode** -- Choose how you want to enter content:
     - **Paste** -- For pasting Discord threads, chat logs, or notes from elsewhere.
     - **Freeform** -- For writing ideas directly in markdown or plain text.
     - **Upload** -- For file-based content (placeholder for future file upload support).
   - **Content** (required) -- The actual brainstorm text. The placeholder text changes based on your selected input mode.
   - **Author** (required) -- Who created this brainstorm.
   - **Tags** -- Optional labels for categorization. Type a tag name and press Enter or click **Add**. Click the **x** on a tag to remove it.
3. Click **Save session**.

### Viewing a Session

Click any session from the list to view its details:

- **Content** displayed as read-only text
- **Metadata** -- Author, creation date, source type, and tags
- **Synthesized outputs** -- If the session has been processed, results appear here
- **Synthesize** button -- Initiates the synthesis workflow (see Core Workflow)

### Deleting a Session

On a session's detail page, use the **Delete** button. You will be asked to confirm before the session is permanently removed.

You can also create a brainstorm session by **finalizing** threads from Idea Stream (see [Idea Stream](#7-idea-stream)).

---

## 7. Idea Stream

Idea Stream is a lightweight, always-open collaboration space per project. Use it to discuss ideas in threads, then turn selected threads into a brainstorm session and run synthesis.

### Accessing Idea Stream

From a project, click the **Idea Stream** tab in the sidebar. You’ll see a two-panel layout: thread list on the left, active thread (messages) on the right.

### Creating a Thread

In the left panel, type in the “Start a new thread…” box and click the send button. A new thread is created with your message as the first post.

### Replying to Messages

Open a thread by clicking it in the list. At the bottom of the right panel, type in “Write a message…” and click send. To reply to a specific message, click **Reply** on that message; your reply will be linked to it.

### Editing and Deleting Messages

You can edit or delete only your own messages. Use the **Edit** or **Delete** actions on the message. Edited messages show an “(edited)” marker; deleted messages show a “Message deleted” placeholder.

### Finalizing Threads to Brainstorm Sessions

Select one or more threads using the checkboxes in the left panel. Click **Finalize + Synthesize**. The app generates a Brainstorm Session containing the full thread content (in markdown), then opens the synthesis flow so you can extract systems from that session.

### Display name and avatar

Your **display name** and **avatar** are set in [Settings](#3-settings) under Profile. If you leave display name blank, the app shows “Creator” for the thread starter and “Responder” for others in each thread.

---

## 8. Game Systems

A game system is a distinct gameplay subsystem (e.g., Movement, Combat, Health, Inventory, Economy, Crafting, Progression). Systems are the core building blocks of your game design documentation.

### Viewing Systems

Navigate to the **Systems** tab to see all systems for the current project.

### Creating a System

1. Click **New System** (from the Systems list or the Overview page).
2. Fill in the form:
   - **Name** (required) -- The human-readable name (e.g., "Combat System").
   - **System ID (slug)** (required) -- A unique identifier in slug format (e.g., `combat`). This is immutable after creation, so choose carefully.
   - **Version** -- Defaults to `v0.1`. Use semantic versioning.
   - **Status** -- Select one:
     - **Draft** -- Still being defined.
     - **Active** -- Finalized and in use.
     - **Deprecated** -- No longer relevant.
   - **Purpose** -- A high-level description of what this system does.
   - **MVP Criticality** -- How important is this system for your minimum viable product:
     - **Core** -- Must have for MVP.
     - **Important** -- Should have for MVP.
     - **Later** -- Can be deferred.
3. Click **Create system**.

### Viewing and Editing a System

Click any system from the list to open its detail page. You can toggle between two views:

- **Form view** -- Edit all structured fields (Name, Version, Status, Purpose, MVP Criticality). Click **Save changes** to persist edits.
- **Markdown view** -- A read-only rendered markdown representation of the system following the standard system schema.

### System Markdown Schema

Every system follows a standardized markdown template that includes:

- System ID, Version, Status
- Purpose, Current State, Target State
- Core Mechanics, Inputs, Outputs
- Dependencies, Depended On By
- Failure States, Scaling Behavior
- MVP Criticality, Implementation Notes
- Open Questions, Change Log

This structure ensures consistency and AI-readability across all systems.

### System History

Click **History** on a system's detail page to view its change log -- a chronological list of all modifications including version, change type, summary, and timestamp.

### Deleting a System

On a system's detail page, use the **Delete** button with confirmation.

---

## 9. Dependencies

Dependencies define the relationships between game systems. For example, a Combat system might depend on Health and Movement systems. Understanding these relationships is critical for planning implementation order.

### Viewing the Dependency Graph

Navigate to the **Dependencies** tab. The page shows three sections:

#### Implementation Order

A numbered list showing the recommended order to implement your systems based on their dependency relationships. Systems with no dependencies appear first, followed by systems whose dependencies are already accounted for. This is computed using topological sorting.

Each system name is a clickable link to its detail page.

#### Edges

A list of all defined dependency relationships in the format:

**Source System → Target System** (dependency type)

This shows which system depends on which, and the nature of the relationship.

#### Add Dependency

A form at the bottom lets you create new dependencies:

1. Select a **Source system** (the system that depends on another).
2. Select a **Target system** (the system being depended upon).
3. The dependency type defaults to "requires".
4. Click **Add**.

**Constraints:**
- A system cannot depend on itself.
- Circular dependencies are prevented by the graph engine.

---

## 10. Version Plans

Version plans let you scope which systems belong to a specific release (e.g., v1, v1.1, v2). They validate that all required dependencies are included and generate phased implementation sequences.

### Viewing Version Plans

Navigate to the **Versions** tab to see all plans for the current project.

### Creating a Version Plan

1. Click **New Version Plan** (from the Versions list or the Overview page).
2. Fill in the form:
   - **Version label** -- The version identifier (e.g., `v1`, `v1.1`, `v2`).
   - **Title** (required) -- A descriptive name (e.g., "Minimum Viable Prototype").
   - **Description** -- Details about the scope and goals of this version.
   - **Systems in scope** -- Check the boxes next to each system you want included in this version. All project systems are listed.
3. **Scope validation** runs automatically. If a selected system depends on a system that is not selected, you will see a warning about missing dependencies.
4. Click **Create plan**.

### Viewing a Version Plan

Click any plan from the list to see its details:

- **Plan details** -- Version label, title, description, status
- **Systems in scope** -- Listed with their assigned phase numbers (implementation order)
- **Finalize button** (draft plans only) -- Locks the plan as immutable
- **Delete button** (draft plans only) -- Removes the plan

### Finalizing a Plan

Clicking **Finalize** on a draft plan marks it as finalized. Finalized plans:

- Cannot be edited
- Cannot be deleted
- Record a `finalizedAt` timestamp
- Serve as immutable snapshots of your planned scope

---

## 11. Prompt History

The Prompts section tracks AI prompt interactions associated with your project.

### Viewing Prompt History

Navigate to the **Prompts** tab to see a list of all prompts with:

- Prompt type
- AI provider and model used
- Input preview

### Generating Prompts

The **New Prompt** page provides access to the AI prompt generator for creating implementation, architecture, refactor, balance, and expansion prompts. (This feature is being actively developed.)

---

## 12. Export

The Export section lets you generate downloadable documents from your project data.

### Generating an Export

1. Navigate to the **Export** tab.
2. Under **Generate export**, select:
   - **Export type**:
     - **GDD** -- Full Game Design Document
     - **Version PRD** -- Product Requirements Document for a specific version
     - **System Document** -- Individual system documentation
     - **Roadmap** -- Implementation roadmap
     - **Prompt Bundle** -- Collection of AI prompts
   - **Format**:
     - **Markdown** (.md)
     - **JSON**
3. Click **Generate**.

### Downloading Exports

Recent exports appear in a list below the generation form. Each entry shows:

- Export type
- Format
- A **Download** link

Click **Download** to save the file to your computer.

---

## 13. Core Workflow

Here is the recommended workflow for using GamePlan AI from start to finish:

### Step 1: Create a Project

Set up a new project with a name, description, genre, and target platform.

### Step 2: Add Brainstorm Sessions

Paste your Discord threads, meeting notes, or freeform ideas into brainstorm sessions. Tag them for easy reference. Add as many sessions as you need.

### Step 3: Synthesize Ideas

Use the Synthesize feature on a brainstorm session to have AI process your raw ideas into structured outputs. The wizard has three steps: Configure, Processing, and Review. You can move back and forth between steps you have already reached. Review is the final step: use the single Refine form to improve the extraction (refine all systems, or select specific systems to refine only those), then use the Finalize section (Get AI suggestion, Apply suggestion, **Create selected**) to choose which systems to create or merge. Get AI suggestion shows what was sent to the AI (summary and optional "Show prompt" with copy) and the suggestion with an optional **Why** (rationale). Below that, extracted systems appear as independently expandable list items (expand handle on the left; use the **Added** / **Excluded** button per system to include or exclude from finalize). **Added** and **Updated** badges on extracted systems and system details indicate whether each item is new to the project or already exists (compared to your current project systems).

### Step 4: Define Game Systems

Create game systems from your synthesized ideas (or manually). For each system, define its purpose, version, status, and MVP criticality.

### Step 5: Map Dependencies

Go to the Dependencies tab and define which systems depend on which. The app automatically calculates the optimal implementation order.

### Step 6: Tag MVP Criticality

Review each system and set its MVP Criticality to Core, Important, or Later. This helps with scoping version plans.

### Step 7: Create Version Plans

Build version plans (v1, v1.1, v2, etc.) by selecting which systems to include. The app validates your scope against the dependency graph and warns about missing dependencies.

### Step 8: Finalize and Export

Finalize your version plans when ready. Export your documentation as markdown or JSON -- full GDDs, version PRDs, individual system docs, or roadmaps.

### Target Time

The goal is to go from raw brainstorm to a structured, dependency-aware implementation plan in **under 10 minutes**.

---

## 14. Glossary

| Term | Definition |
|---|---|
| **Project** | Top-level container for all game design data. |
| **Brainstorm Session** | An immutable record of raw creative input (pasted text, notes, discussions). |
| **Game System** | A distinct gameplay subsystem (e.g., Combat, Inventory, Economy). |
| **System Slug** | A unique, immutable identifier for a game system (e.g., `combat`, `health`). |
| **Dependency** | A directed relationship where one system relies on another. |
| **Dependency Graph** | The network of all system dependencies, used to derive implementation order. |
| **Topological Sort** | An algorithm that determines a valid implementation order based on dependencies. |
| **Version Plan** | A scoped selection of systems targeted for a specific release version. |
| **MVP Criticality** | A priority rating (Core / Important / Later) indicating how essential a system is for the minimum viable product. |
| **Scope Validation** | Automatic checking that a version plan includes all required dependencies. |
| **Finalize** | Locking a version plan as an immutable snapshot. |
| **GDD** | Game Design Document -- a comprehensive document describing the full game design. |
| **PRD** | Product Requirements Document -- a scoped document for a specific version. |
| **Synthesis** | The AI-powered process of converting raw brainstorm text into structured system definitions. |
| **Prompt Bundle** | A packaged collection of AI prompts with context, ready for use with external AI tools. |
| **Workspace** | Container for members and AI provider configuration; projects can be linked to a workspace. |
| **Active user** | In prototype mode, the user that this browser is currently acting as (for testing multi-user flows). |

---

*Change log: 2026-02-18 — Added Section 3 Settings (Profile, Workspace members and AI config, Prototype user creation and switch). Renumbered sections 3–14. Glossary: Workspace, Active user. Step 3 Synthesize: step navigation (back/forth among reached steps); Added/Updated badges vs existing project.*

*Change log: 2026-02-18 — Synthesize flow: 3-step wizard; Review is final step with single refine form (all or selected systems), independently expandable list with Added/Excluded button per system, Finalize above list, Create selected on same step.*

*Change log: 2026-02-18 — Get AI suggestion: Finalize shows "Based on N candidates, M existing systems," expandable Show prompt with copy, and AI rationale (Why) when provided.*
