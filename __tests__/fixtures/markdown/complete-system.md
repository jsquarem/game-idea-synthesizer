# Combat

## System ID
combat

## Version
v1.0

## Status
Draft

## Purpose
Handles all combat interactions between entities: damage, healing, and status effects.

## Current State
Basic damage and health deduction are defined. No status effects or resistances yet.

## Target State
Full damage types, armor/resistance, status effects (stun, burn, slow), and combo chains.

## Core Mechanics
- Resolve hit detection and damage application
- Apply armor/resistance modifiers
- Trigger status effect application
- Emit combat events for UI and audio

## Inputs
- Entity IDs (attacker, target)
- Weapon or ability reference
- Current health and armor state

## Outputs
- Updated health/armor values
- Applied status effects
- Combat event log entries

## Dependencies
- health
- movement

## Depended On By
- economy
- achievements

## Failure States
- Division by zero if resistance calculation is invalid
- Stale entity state if combat runs on deleted entities

## Scaling Behavior
Linear with entity count; batch processing for large encounters.

## MVP Criticality
Core

## Implementation Notes
- Use fixed-point or integer math for deterministic multiplayer
- Combat resolution must run in a single frame to avoid desync

## Open Questions
- How do we handle simultaneous attacks (same frame)?
- Should status effects stack or replace?

## Change Log
- 2025-01-15: Initial draft created
- 2025-01-20: Added Dependencies and Depended On By
