import { describe, it, expect } from 'vitest'
import {
  createProjectSchema,
  createGameSystemSchema,
  createBrainstormSessionSchema,
  createVersionPlanSchema,
  createDependencyEdgeSchema,
  createIdeaStreamThreadSchema,
  postIdeaStreamMessageSchema,
  editIdeaStreamMessageSchema,
  finalizeIdeaStreamThreadsSchema,
} from '../schemas'

describe('Zod schemas', () => {
  describe('Project schema', () => {
    it('should accept valid project input', () => {
      const result = createProjectSchema.safeParse({
        name: 'My Game',
        description: 'A cool game',
        genre: 'RPG',
        platform: 'PC',
        status: 'ideation',
      })
      expect(result.success).toBe(true)
    })

    it('should reject project without name', () => {
      const result = createProjectSchema.safeParse({ name: '' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('name'))).toBe(true)
      }
    })

    it('should reject project with invalid status', () => {
      const result = createProjectSchema.safeParse({
        name: 'Game',
        status: 'invalid',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('status'))).toBe(true)
      }
    })

    it('should accept project with optional fields omitted', () => {
      const result = createProjectSchema.safeParse({ name: 'Minimal' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.description).toBeUndefined()
        expect(result.data.genre).toBeUndefined()
        expect(result.data.status).toBe('ideation')
      }
    })
  })

  describe('Game system schema', () => {
    it('should accept valid game system input', () => {
      const result = createGameSystemSchema.safeParse({
        projectId: 'proj-1',
        systemId: 'combat',
        name: 'Combat System',
        version: 'v1.0',
        status: 'draft',
        mvpCriticality: 'core',
      })
      expect(result.success).toBe(true)
    })

    it('should reject system without systemId', () => {
      const result = createGameSystemSchema.safeParse({
        projectId: 'proj-1',
        name: 'Combat',
        systemId: '',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('systemId'))).toBe(true)
      }
    })

    it('should reject system with invalid status', () => {
      const result = createGameSystemSchema.safeParse({
        projectId: 'proj-1',
        systemId: 'combat',
        name: 'Combat',
        status: 'invalid',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('status'))).toBe(true)
      }
    })

    it('should reject system with invalid mvpCriticality', () => {
      const result = createGameSystemSchema.safeParse({
        projectId: 'proj-1',
        systemId: 'combat',
        name: 'Combat',
        mvpCriticality: 'critical',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('mvpCriticality'))).toBe(true)
      }
    })

    it('should reject system with invalid version format', () => {
      const result = createGameSystemSchema.safeParse({
        projectId: 'proj-1',
        systemId: 'combat',
        name: 'Combat',
        version: '1.0',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('version'))).toBe(true)
      }
    })

    it('should accept system with empty dependencies array', () => {
      const result = createGameSystemSchema.safeParse({
        projectId: 'proj-1',
        systemId: 'combat',
        name: 'Combat',
        dependencies: [],
      })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.dependencies).toEqual([])
    })

    it('should accept system with populated dependencies', () => {
      const result = createGameSystemSchema.safeParse({
        projectId: 'proj-1',
        systemId: 'combat',
        name: 'Combat',
        dependencies: ['health', 'movement'],
      })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.dependencies).toEqual(['health', 'movement'])
    })
  })

  describe('Brainstorm session schema', () => {
    it('should accept valid brainstorm session', () => {
      const result = createBrainstormSessionSchema.safeParse({
        projectId: 'proj-1',
        title: 'Session 1',
        content: 'Some ideas here',
        author: 'Dev',
        tags: ['gameplay'],
      })
      expect(result.success).toBe(true)
    })

    it('should reject session without content', () => {
      const result = createBrainstormSessionSchema.safeParse({
        projectId: 'proj-1',
        title: 'Session',
        content: '',
        author: 'Dev',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('content'))).toBe(true)
      }
    })

    it('should reject session without author', () => {
      const result = createBrainstormSessionSchema.safeParse({
        projectId: 'proj-1',
        title: 'Session',
        content: 'Ideas',
        author: '',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('author'))).toBe(true)
      }
    })

    it('should accept session with optional tags', () => {
      const result = createBrainstormSessionSchema.safeParse({
        projectId: 'proj-1',
        title: 'Session',
        content: 'Ideas',
        author: 'Dev',
        tags: ['a', 'b'],
      })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.tags).toEqual(['a', 'b'])
    })
  })

  describe('Version plan schema', () => {
    it('should accept valid version plan', () => {
      const result = createVersionPlanSchema.safeParse({
        projectId: 'proj-1',
        versionIdentifier: 'v1',
        title: 'MVP',
        includedSystems: ['combat', 'health'],
        status: 'draft',
      })
      expect(result.success).toBe(true)
    })

    it('should reject plan without version identifier', () => {
      const result = createVersionPlanSchema.safeParse({
        projectId: 'proj-1',
        title: 'MVP',
        versionIdentifier: '',
        includedSystems: ['combat'],
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('versionIdentifier'))).toBe(true)
      }
    })

    it('should reject plan without included systems', () => {
      const result = createVersionPlanSchema.safeParse({
        projectId: 'proj-1',
        versionIdentifier: 'v1',
        title: 'MVP',
        includedSystems: [],
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('includedSystems'))).toBe(true)
      }
    })

    it('should reject plan with invalid status', () => {
      const result = createVersionPlanSchema.safeParse({
        projectId: 'proj-1',
        versionIdentifier: 'v1',
        title: 'MVP',
        includedSystems: ['combat'],
        status: 'archived',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('status'))).toBe(true)
      }
    })
  })

  describe('Dependency edge schema', () => {
    it('should accept valid dependency edge', () => {
      const result = createDependencyEdgeSchema.safeParse({
        sourceSystemId: 'sys-a',
        targetSystemId: 'sys-b',
      })
      expect(result.success).toBe(true)
    })

    it('should reject edge where source === target', () => {
      const result = createDependencyEdgeSchema.safeParse({
        sourceSystemId: 'sys-a',
        targetSystemId: 'sys-a',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const hasRefinementError = result.error.issues.some(
          (i) => i.code === 'custom' || i.path.includes('targetSystemId')
        )
        expect(hasRefinementError).toBe(true)
      }
    })
  })

  describe('Idea Stream schemas', () => {
    describe('createIdeaStreamThreadSchema', () => {
      it('should accept valid thread input', () => {
        const result = createIdeaStreamThreadSchema.safeParse({
          projectId: 'proj-1',
          content: ' First message content ',
        })
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.content).toBe('First message content')
        }
      })

      it('should reject empty content', () => {
        const result = createIdeaStreamThreadSchema.safeParse({
          projectId: 'proj-1',
          content: '   ',
        })
        expect(result.success).toBe(false)
      })

      it('should reject content over 10000 chars', () => {
        const result = createIdeaStreamThreadSchema.safeParse({
          projectId: 'proj-1',
          content: 'x'.repeat(10001),
        })
        expect(result.success).toBe(false)
      })
    })

    describe('postIdeaStreamMessageSchema', () => {
      it('should accept valid message with optional parent', () => {
        const result = postIdeaStreamMessageSchema.safeParse({
          projectId: 'proj-1',
          threadId: 'thread-1',
          content: ' Reply content ',
          parentMessageId: 'msg-1',
        })
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.content).toBe('Reply content')
          expect(result.data.parentMessageId).toBe('msg-1')
        }
      })
    })

    describe('editIdeaStreamMessageSchema', () => {
      it('should accept valid edit', () => {
        const result = editIdeaStreamMessageSchema.safeParse({
          messageId: 'msg-1',
          content: ' Updated content ',
        })
        expect(result.success).toBe(true)
        if (result.success) expect(result.data.content).toBe('Updated content')
      })
    })

    describe('finalizeIdeaStreamThreadsSchema', () => {
      it('should accept valid finalize input', () => {
        const result = finalizeIdeaStreamThreadsSchema.safeParse({
          projectId: 'proj-1',
          threadIds: ['thread-1', 'thread-2'],
          title: 'My Session',
        })
        expect(result.success).toBe(true)
      })

      it('should reject empty threadIds', () => {
        const result = finalizeIdeaStreamThreadsSchema.safeParse({
          projectId: 'proj-1',
          threadIds: [],
        })
        expect(result.success).toBe(false)
      })
    })
  })
})
