# Project context (snapshot)
{
  "schemaVersion": 1,
  "project": {
    "name": "Guild of Emergent Minds",
    "description": "AI-driven dungeon guild game. Heroes dungeon crawl autonomously; player can take control anytime. Meta progression improves AI behavior. Base building supports long-term growth.",
    "genre": "Idle RPG / Auto-battler / Tactical",
    "platform": "PC (Godot or Unity)",
    "status": "ideation",
    "createdAt": "2026-02-19T01:47:15.069Z",
    "updatedAt": "2026-02-19T01:47:15.069Z"
  },
  "changesSummary": {
    "brainstormsAdded": { "count": 1, "titles": ["Design Summary"], "dates": ["2026-02-19T05:35:53.180Z"] },
    "systemsAddedUpdated": { "slugs": [] },
    "dependenciesAddedRemoved": { "added": 0, "removed": 0 },
    "versionPlansCreatedFinalized": { "labels": [], "statuses": [] }
  },
  "systems": [],
  "dependencyGraph": { "edges": [], "topologicalOrder": [] },
  "versionPlans": [],
  "brainstormsSummary": { "count": 1, "titles": ["Design Summary"], "dates": ["2026-02-19T05:35:53.180Z"] }
}

No changes since last snapshot.

## New brainstorm: Design Summary

# Guild of Emergent Minds — Design Summary

## Core Fantasy
- Heroes dungeon crawl autonomously; you can take control of any character at any time.
- Full autoplay is viable; meta progression improves AI behavior; base building supports long-term growth.

## Core Pillars

### 1. Autonomous Dungeon Crawling
- **Heroes:** Defined roles (Tank, DPS, Healer); operate via behavior trees / state machines; improve over time; learn encounter mechanics.
- **Player:** Let heroes autoplay; intervene at any time; discover mechanics manually; teach the AI through direct gameplay.

### 2. AI Learning & Behavioral Unlocks
- Behavior is progression. Dodge fire once → unlock "Avoid Fire" behavior; repeated wipes → AI adapts; manual discovery → permanent bot learning.
- Meta progression: expanding behavior tree capacity; unlocking new conditional logic nodes; improving reaction speed; deepening role specialization.

### 3. Boss Design Philosophy
- Real mechanics, environmental triggers, clear telegraphs, punishing patterns (fire, line attacks, target swaps, phase transitions).
- AI gradually handles mechanics competently; early wipes are part of progression.

### 4. Base / Guild Layer (Incremental)
- Home base: incremental, idle-supporting, progression-focused.
- Likely systems: guild management, quest selection, reputation growth, resource production, hero training upgrades.
- Everything outside the dungeon = strategic layer.

## Combat Model Direction
- Auto-battle viability; real-time or light tactical control; smooth "observe or intervene" loop.

## System Architecture Focus
- Behavior trees; role systems; state machines; unlockable AI logic; mechanic recognition; adaptation memory.

---

# Instructions
You must identify game systems AND their system details from the context and new brainstorm. Respond with ONLY a single JSON object (no markdown, no code fence, no explanation). The JSON must have exactly two keys:

1. **"extractedSystems"**: array of objects. Each has: name, systemSlug (lowercase-with-hyphens), purpose (one short sentence), dependencies (array of other system slugs this system interfaces with or uses—who calls whom, who feeds whom).
2. **"extractedSystemDetails"**: array of objects. Each has: name, detailType (exactly one of: mechanic, input, output, content, ui_hint), spec (markdown string describing the system detail), targetSystemSlug (must match the systemSlug of the system this detail belongs to).

Rules:
- Every system you list MUST have at least one system detail in extractedSystemDetails. Use targetSystemSlug on each detail to attach it to a system (use the exact systemSlug value).
- The main definition of each system is its system details—break down mechanics, inputs, outputs, and UI/content into separate details rather than putting everything in purpose.
- **Produce one system per major interface boundary** so the result can be visualized as a systems interaction flowchart (e.g. Guild Management, Quest Selection, Combat/Encounters, Behavior Trees, Roles, Heroes/Units, Player Intervention, AI Learning, Boss/Encounter Mechanics, Reputation, Resource Production, Hero Training Upgrades as distinct systems where the design implies them).
- Set **dependencies** to reflect interaction flow: for each system, list the slugs of systems it interfaces with or uses (data flow, triggers, "A sends to B"). This drives the dependency graph used for the flowchart.
- Use the dependency graph in the project context when existing systems are present. When proposing new systems, set dependencies so the graph shows how systems connect.
- Fit new ideas into existing systems where appropriate; suggest new systems when needed.

Example shape (replace with real content from the brainstorm):
{"extractedSystems":[{"name":"Quest Selection","systemSlug":"quest-selection","purpose":"Chooses which dungeons or objectives the guild pursues.","dependencies":["combat-encounters"]},{"name":"Combat / Encounters","systemSlug":"combat-encounters","purpose":"Runs dungeon rooms and combat; hosts bosses and heroes.","dependencies":["reputation","heroes-units"]}],"extractedSystemDetails":[{"name":"Dungeon selection","detailType":"mechanic","spec":"Selects next dungeon or objective from guild.","targetSystemSlug":"quest-selection"},{"name":"Encounter resolution","detailType":"mechanic","spec":"Resolves combat and encounter events.","targetSystemSlug":"combat-encounters"}]}
