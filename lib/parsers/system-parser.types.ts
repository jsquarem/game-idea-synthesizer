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
}

export type ParseSystemMarkdownResult =
  | { ok: true; data: GameSystemData }
  | { ok: false; error: string }
