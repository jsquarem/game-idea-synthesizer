# Sample Game: Copy-Paste Into App Flow

Use these in order: **Project** → **Brainstorm** (paste content). Optionally create **Game Systems** manually from the system list at the end.

---

## 1. New Project (Dashboard → New Project)

| Field        | Paste this |
|-------------|------------|
| **Name**    | Guild of Emergent Minds |
| **Description** | AI-driven dungeon guild game. Heroes dungeon crawl autonomously; player can take control anytime. Meta progression improves AI behavior. Base building supports long-term growth. |
| **Genre**   | Idle RPG / Auto-battler / Tactical |
| **Platform** | PC (Godot or Unity) |

---

## 2. New Brainstorm (Project → Brainstorms → New session)

**Title:** Core design – pillars and systems  
**Author:** (your name)  
**Tags:** core-pillars, ai-behavior, boss-design, base-building

**Content** (paste into the big text area):

```markdown
# Guild of Emergent Minds – Design Input

## Core Fantasy
- Heroes dungeon crawl autonomously.
- Player can take control of any character at any time.
- Full autoplay is viable.
- Meta progression improves AI behavior and intelligence.
- Base building supports long-term incremental growth.

## Inspirations
- Our Adventurer Guild (management loop)
- Auto-battlers / idle RPGs
- Tactical RPG depth
- MMO-style boss mechanics
- Behavior-tree-driven AI evolution

## Pillar 1: Autonomous Dungeon Crawling
Heroes have defined roles (Tank, DPS, Healer). They operate via behavior trees and state machines, improve over time, and learn encounter mechanics. The player can let heroes autoplay, intervene at any time, discover mechanics manually, and teach the AI through direct gameplay.

## Pillar 2: AI Learning & Behavioral Unlocks
Behavior is progression. Examples: dodge fire once → unlock "Avoid Fire" behavior; repeated wipes → AI eventually adapts; manual discovery → permanent bot learning; recognition of similar mechanics across encounters. Meta progression may include expanding behavior tree capacity, unlocking new conditional logic nodes, improving reaction speed and intelligence, deepening role specialization. Concept: intelligence is a resource.

## Pillar 3: Boss Design Philosophy
Bosses feature real mechanics, environmental triggers, clear telegraphs, punishing patterns (standing in fire, line attacks, target swaps, phase transitions). Long-term: AI gradually handles mechanics competently; early wipes are part of progression; late-game AI feels "trained".

## Pillar 4: Base / Guild Layer (Incremental)
Home base is incremental, idle-supporting, progression-focused. Likely systems: guild management, quest selection, reputation growth, resource production, hero training upgrades. Everything outside the dungeon = strategic layer.

## Combat Model
Needs: auto-battle viability, real-time or light tactical control, smooth "observe or intervene" loop. Player prefers auto systems over heavy micromanagement and enjoys idle/incremental hybrid depth.

## Technical Direction
Potential engines: Godot, Unity, or TypeScript (sprite + JSON). Art: placeholder shapes first, AI spritesheets later. Systems-first development.

## System Architecture Focus
Behavior trees, role systems, state machines, unlockable AI logic, mechanic recognition, adaptation memory. North star: an idle game where AI sophistication is the primary progression loop.

## Emotional North Star
- Watching trained heroes intelligently clear content.
- Two enchanters charming mobs and blowing through dungeons.
- Automation that feels earned.
- "They learned that because I taught them."

## Immediate Next Steps
Decide engine (Godot likely fastest vibe test). Prototype: basic unit, basic behavior tree, simple dungeon room, fire-on-ground mechanic, unlock "avoid fire" behavior. Validate: Is watching improved AI satisfying? Does intervention feel meaningful?
```

---

## 3. Optional: Game Systems (if creating manually)

After synthesis, or for manual entry, these map to **Game System** records. Use as names/slugs and paste the description into **Purpose** (or full Section 7 markdown if you use the system editor).

| System name (and slug) | Purpose / one-liner |
|------------------------|---------------------|
| Autonomous Dungeon Crawling | Heroes run on behavior trees/state machines; player can observe or take control; full autoplay supported. |
| AI Learning & Behavioral Unlocks | Behavior is progression; unlock nodes (e.g. Avoid Fire) via play; meta progression expands tree capacity and intelligence. |
| Boss Design | Real mechanics, telegraphs, phases; early wipes feed into AI learning; late-game AI feels trained. |
| Base / Guild Layer | Incremental home base: guild management, quest selection, reputation, resources, hero training. |
| Combat Model | Auto-battle viable; real-time or light tactical; observe-or-intervene loop; idle-friendly. |
| Role System | Tank, DPS, Healer, etc.; role defines behavior tree and specialization. |
| Behavior Tree Engine | Runtime behavior trees; unlockable nodes; adaptation memory and mechanic recognition. |

Dependencies you might set later: **Combat Model** depends on **Role System** and **Behavior Tree Engine**. **AI Learning** depends on **Behavior Tree Engine**. **Boss Design** informs **Combat Model** and **AI Learning**.

---

## Flow summary

1. **Dashboard** → New Project → fill Name, Description, Genre, Platform from section 1.
2. Open the project → **Brainstorms** → **New session** → set Title, Author, Tags; paste the **Content** from section 2.
3. Use **Synthesize** on that session to get suggested systems, or create **Systems** manually from the table in section 3.
4. Add **Dependencies** between systems, then create a **Version plan** (e.g. MVP = Role System + Behavior Tree Engine + Combat Model + one pillar).
