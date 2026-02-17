import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const BRAINSTORM_CONTENT = `# Guild of Emergent Minds – Design Input

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
Decide engine (Godot likely fastest vibe test). Prototype: basic unit, basic behavior tree, simple dungeon room, fire-on-ground mechanic, unlock "avoid fire" behavior. Validate: Is watching improved AI satisfying? Does intervention feel meaningful?`

const SYSTEMS = [
  { slug: 'autonomous-dungeon-crawling', name: 'Autonomous Dungeon Crawling', purpose: 'Heroes run on behavior trees/state machines; player can observe or take control; full autoplay supported.' },
  { slug: 'ai-learning-behavioral-unlocks', name: 'AI Learning & Behavioral Unlocks', purpose: 'Behavior is progression; unlock nodes (e.g. Avoid Fire) via play; meta progression expands tree capacity and intelligence.' },
  { slug: 'boss-design', name: 'Boss Design', purpose: 'Real mechanics, telegraphs, phases; early wipes feed into AI learning; late-game AI feels trained.' },
  { slug: 'base-guild-layer', name: 'Base / Guild Layer', purpose: 'Incremental home base: guild management, quest selection, reputation, resources, hero training.' },
  { slug: 'combat-model', name: 'Combat Model', purpose: 'Auto-battle viable; real-time or light tactical; observe-or-intervene loop; idle-friendly.' },
  { slug: 'role-system', name: 'Role System', purpose: 'Tank, DPS, Healer, etc.; role defines behavior tree and specialization.' },
  { slug: 'behavior-tree-engine', name: 'Behavior Tree Engine', purpose: 'Runtime behavior trees; unlockable nodes; adaptation memory and mechanic recognition.' },
] as const

const PROJECT_NAME = 'Guild of Emergent Minds'

async function main() {
  let project = await prisma.project.findFirst({ where: { name: PROJECT_NAME } })
  if (project) {
    console.log('Sample project already exists:', project.id)
    return
  }

  project = await prisma.project.create({
    data: {
      name: PROJECT_NAME,
      description: 'AI-driven dungeon guild game. Heroes dungeon crawl autonomously; player can take control anytime. Meta progression improves AI behavior. Base building supports long-term growth.',
      genre: 'Idle RPG / Auto-battler / Tactical',
      platform: 'PC (Godot or Unity)',
      status: 'ideation',
    },
  })

  const brainstorm = await prisma.brainstormSession.create({
    data: {
      projectId: project.id,
      title: 'Core design – pillars and systems',
      source: 'manual',
      content: BRAINSTORM_CONTENT,
      author: 'Sample',
      tags: JSON.stringify(['core-pillars', 'ai-behavior', 'boss-design', 'base-building']),
    },
  })

  const systemIds: Record<string, string> = {}
  for (const s of SYSTEMS) {
    const sys = await prisma.gameSystem.create({
      data: {
        projectId: project.id,
        systemSlug: s.slug,
        name: s.name,
        purpose: s.purpose,
        status: 'draft',
        mvpCriticality: 'important',
      },
    })
    systemIds[s.slug] = sys.id
  }

  const combatId = systemIds['combat-model']
  const roleId = systemIds['role-system']
  const behaviorId = systemIds['behavior-tree-engine']
  const aiLearningId = systemIds['ai-learning-behavioral-unlocks']

  if (combatId && roleId) {
    await prisma.dependency.create({
      data: { sourceSystemId: combatId, targetSystemId: roleId, dependencyType: 'requires' },
    })
  }
  if (combatId && behaviorId) {
    await prisma.dependency.create({
      data: { sourceSystemId: combatId, targetSystemId: behaviorId, dependencyType: 'requires' },
    })
  }
  if (aiLearningId && behaviorId) {
    await prisma.dependency.create({
      data: { sourceSystemId: aiLearningId, targetSystemId: behaviorId, dependencyType: 'requires' },
    })
  }

  for (const sys of await prisma.gameSystem.findMany({ where: { projectId: project.id } })) {
    await prisma.changeLog.create({
      data: {
        gameSystemId: sys.id,
        version: sys.version,
        summary: 'System created from seed',
        changeType: 'create',
      },
    })
  }

  console.log('Seeded: project', project.id, 'brainstorm', brainstorm.id, 'systems', SYSTEMS.length)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
