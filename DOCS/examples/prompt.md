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
    "brainstormsAdded": {
      "count": 1,
      "titles": [
        "Untitled"
      ],
      "dates": [
        "2026-02-19T05:35:53.180Z"
      ]
    },
    "systemsAddedUpdated": {
      "slugs": []
    },
    "dependenciesAddedRemoved": {
      "added": 0,
      "removed": 0
    },
    "versionPlansCreatedFinalized": {
      "labels": [],
      "statuses": []
    }
  },
  "systems": [],
  "dependencyGraph": {
    "edges": [],
    "topologicalOrder": []
  },
  "versionPlans": [],
  "brainstormsSummary": {
    "count": 1,
    "titles": [
      "Untitled"
    ],
    "dates": [
      "2026-02-19T05:35:53.180Z"
    ]
  }
}

No changes since last snapshot.

## New brainstorm: Untitled

# Guild of Emergent Minds

## AI-Driven Dungeon Guild Game

---

## Design Summary

### Core Fantasy

- Heroes dungeon crawl autonomously  
- You can take control of any character at any time  
- Full autoplay is viable  
- Meta progression improves AI behavior and intelligence  
- Base building supports long-term incremental growth  

---

## Inspirations

- Our Adventurer Guild (management loop)  
- Auto-battlers / idle RPGs  
- Tactical RPG depth  
- MMO-style boss mechanics  
- Behavior-tree-driven AI evolution  

---

## Core Pillars

### 1. Autonomous Dungeon Crawling

#### Heroes

- Have defined roles (Tank, DPS, Healer, etc.)  
- Operate via behavior trees / state machines  
- Improve over time  
- Learn encounter mechanics  

#### The Player Can

- Let heroes autoplay  
- Intervene at any time  
- Discover mechanics manually  
- Teach the AI through direct gameplay  

---

### 2. AI Learning & Behavioral Unlocks

**Core differentiator:** Behavior is progression.

#### Examples

- Dodge fire once → unlock "Avoid Fire" behavior  
- Repeated wipes to a mechanic → AI eventually adapts  
- Manual discovery → permanent bot learning  
- Recognition of similar mechanics across encounters  

#### Meta Progression May Include

- Expanding behavior tree capacity  
- Unlocking new conditional logic nodes  
- Improving reaction speed and intelligence  
- Deepening role specialization  

**Concept:** Intelligence is a resource.

---

### 3. Boss Design Philosophy

#### Bosses Feature

- Real mechanics  
- Environmental triggers  
- Clear telegraphs  
- Punishing patterns  

#### Examples

- Standing in fire  
- Line attacks  
- Target swaps  
- Phase transitions  

#### Long-Term Vision

- AI gradually handles mechanics competently  
- Early wipes are part of progression  
- Late-game AI feels "trained"  

---

### 4. Base / Guild Layer (Incremental)

#### Home Base Is

- Incremental  
- Idle-supporting  
- Progression-focused  

#### Likely Systems

- Guild management  
- Quest selection  
- Reputation growth  
- Resource production  
- Hero training upgrades  

Everything outside the dungeon = strategic layer.

---

## Combat Model Direction

### Needs

- Auto-battle viability  
- Real-time or light tactical control  
- Smooth "observe or intervene" loop  

### Player Profile Insight

- Prefers auto systems over heavy micromanagement  
- Low tolerance for slow TRPG pacing  
- Enjoys idle/incremental hybrid depth  

---

## Technical Direction

### Potential Engines

- Godot (strong vibe, previous success)  
- Unity (possible with upgraded hardware)  
- TypeScript engine (sprite + JSON-driven design)  

### Art Strategy

- Placeholder shapes initially  
- AI spritesheets later  
- Systems-first development  

---

## System Architecture Focus

- Behavior trees  
- Role systems  
- State machines  
- Unlockable AI logic  
- Mechanic recognition  
- Adaptation memory  

An idle game where AI sophistication is the primary progression loop.

---

## Emotional North Star

- Watching trained heroes intelligently clear content  
- Two enchanters charming mobs and blowing through dungeons  
- Automation that feels earned  
- "They learned that because I taught them."  

---

## Immediate Next Steps

### Decide Engine

- Godot likely fastest vibe test  

### Prototype

- Basic unit  
- Basic behavior tree  
- Simple dungeon room  
- Fire-on-ground mechanic  
- Unlock "avoid fire" behavior  

### Validate

- Is watching improved AI satisfying?  
- Does intervention feel meaningful?  


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

## Change Log

- 2026-02-18: Instructions updated for flowchart-level granularity and interaction-flow dependencies; example shows multi-system with dependencies.