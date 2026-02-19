export type SystemDetailStub = {
  name: string
  detailType: string
  spec: string
}

export type GameSystemData = {
  name: string
  systemSlug: string
  version: string
  status: string
  purpose: string
  currentState: string
  targetState: string
  coreMechanics: string
  inputs: string
  outputs: string
  dependencies: string[]
  dependedOnBy: string[]
  failureStates: string
  scalingBehavior: string
  mvpCriticality: string
  implementationNotes: string
  openQuestions: string
  changeLog: { date: string; version: string; summary: string }[]
  /** Optional; emitted as ## Content when present (Option A roll-up) */
  content?: string
  /** Parsed from or emitted in System details section for round-trip */
  systemDetails?: SystemDetailStub[]
}

export type ParseSystemMarkdownResult =
  | { ok: true; data: GameSystemData }
  | { ok: false; error: string }
