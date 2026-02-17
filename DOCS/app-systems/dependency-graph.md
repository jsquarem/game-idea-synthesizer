# System: Dependency Graph

## Purpose
Builds, maintains, and queries the directed dependency graph between game systems. Provides structural analysis for implementation ordering, impact assessment, and scope validation.

## Responsibilities
- Maintain directed edges between game systems
- Prevent circular dependencies
- Compute topological sort (implementation ordering)
- Perform upstream/downstream impact analysis
- Detect risk surfaces (high fan-in/fan-out nodes)
- Validate version plan scope completeness
- Compute implementation phases from dependency layers

## Inputs
- GameSystem records (nodes)
- Dependency records (edges)
- System IDs for targeted analysis
- Scope sets for validation

## Outputs
- Full dependency graph structure (nodes + edges)
- Topologically sorted implementation order
- Impact analysis reports
- Risk surface identification
- Phase groupings
- Cycle detection results
- Scope validation results

## Dependencies
- doc-store (reads system and dependency data)

## Code Mapping
- Engine: `lib/graph/graph-engine.ts`
- Types: `lib/graph/types.ts`
- Service: `lib/services/dependency.service.ts`
- Repository: `lib/repositories/dependency.repository.ts`
- Actions: `app/actions/dependency.actions.ts`

## Current Implementation
(To be filled during implementation)

## Known Limitations
- Graph is recomputed on each request (not cached in v1)
- No weighted edges (all dependencies treated equally except type)
- Visualization is frontend concern, engine only provides data

## Target Evolution
- Cached/incremental graph updates
- Weighted dependency strengths
- Suggested dependency detection via AI
- Graph diff between version plan snapshots

## Change Log
(Chronological updates)
