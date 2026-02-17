import { describe, it, expect } from 'vitest'
import { parseSystemMarkdown, renderSystemMarkdown } from '../system-parser'

const MINIMAL_VALID_MD = `# Combat

## System ID
combat

## Version
v1.0

## Status
Draft

## Purpose
Handles combat resolution.

## Current State

## Target State

## Core Mechanics

## Inputs

## Outputs

## Dependencies

## Depended On By

## Failure States

## Scaling Behavior

## MVP Criticality
Core

## Implementation Notes

## Open Questions

## Change Log
`

describe('system-parser', () => {
  describe('Round-trip', () => {
    it('should parse a complete system markdown into a GameSystem struct', () => {
      const result = parseSystemMarkdown(MINIMAL_VALID_MD)
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.name).toBe('Combat')
        expect(result.data.systemSlug).toBe('combat')
        expect(result.data.version).toBe('v1.0')
        expect(result.data.status).toBe('draft')
        expect(result.data.purpose).toContain('combat resolution')
        expect(result.data.mvpCriticality).toBe('core')
      }
    })

    it('should serialize a GameSystem struct back to markdown', () => {
      const parsed = parseSystemMarkdown(MINIMAL_VALID_MD)
      expect(parsed.ok).toBe(true)
      if (!parsed.ok) return
      const rendered = renderSystemMarkdown(parsed.data)
      expect(rendered).toContain('# Combat')
      expect(rendered).toContain('## System ID')
      expect(rendered).toContain('combat')
      expect(rendered).toContain('v1.0')
    })

    it('should round-trip: parse → serialize → parse produces identical struct', () => {
      const first = parseSystemMarkdown(MINIMAL_VALID_MD)
      expect(first.ok).toBe(true)
      if (!first.ok) return
      const rendered = renderSystemMarkdown(first.data)
      const second = parseSystemMarkdown(rendered)
      expect(second.ok).toBe(true)
      if (!second.ok) return
      expect(second.data.name).toBe(first.data.name)
      expect(second.data.systemSlug).toBe(first.data.systemSlug)
      expect(second.data.version).toBe(first.data.version)
      expect(second.data.purpose).toBe(first.data.purpose)
    })
  })

  describe('Field coverage', () => {
    it('should parse System Name from H1 header', () => {
      const result = parseSystemMarkdown(MINIMAL_VALID_MD)
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data.name).toBe('Combat')
    })

    it('should parse System ID slug', () => {
      const result = parseSystemMarkdown(MINIMAL_VALID_MD)
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data.systemSlug).toBe('combat')
    })

    it('should parse Version in vX.Y format', () => {
      const result = parseSystemMarkdown(MINIMAL_VALID_MD)
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data.version).toBe('v1.0')
    })

    it('should parse Status enum (Draft | Active | Deprecated)', () => {
      const result = parseSystemMarkdown(MINIMAL_VALID_MD)
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data.status).toBe('draft')
    })

    it('should parse Purpose section', () => {
      const result = parseSystemMarkdown(MINIMAL_VALID_MD)
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data.purpose).toContain('Handles combat resolution')
    })

    it('should parse Dependencies as list of system IDs', () => {
      const md = MINIMAL_VALID_MD.replace(
        '## Dependencies\n\n',
        '## Dependencies\n- health\n- movement\n'
      )
      const result = parseSystemMarkdown(md)
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.dependencies).toEqual(['health', 'movement'])
      }
    })

    it('should parse Depended On By as optional list', () => {
      const md = MINIMAL_VALID_MD.replace(
        '## Depended On By\n\n',
        '## Depended On By\n- economy\n'
      )
      const result = parseSystemMarkdown(md)
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data.dependedOnBy).toEqual(['economy'])
    })

    it('should parse MVP Criticality enum (Core | Important | Later)', () => {
      const result = parseSystemMarkdown(MINIMAL_VALID_MD)
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data.mvpCriticality).toBe('core')
    })
  })

  describe('Missing / malformed input', () => {
    it('should return error for empty string input', () => {
      const result = parseSystemMarkdown('')
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error).toBeDefined()
    })

    it('should return error for markdown with no H1 header', () => {
      const result = parseSystemMarkdown('## System ID\ncombat')
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.toLowerCase()).toMatch(/name|h1|header/)
    })

    it('should return error for missing System ID section', () => {
      const md = `# Foo\n\n## Version\nv1.0\n\n## Status\nDraft\n\n## Purpose\nx`
      const result = parseSystemMarkdown(md)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.toLowerCase()).toMatch(/system id|missing/)
    })

    it('should return error for missing Version section when invalid', () => {
      const md = MINIMAL_VALID_MD.replace('## Version\nv1.0', '## Version\ninvalid')
      const result = parseSystemMarkdown(md)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.toLowerCase()).toMatch(/version|vx.y/)
    })

    it('should handle missing optional Depended On By gracefully', () => {
      const result = parseSystemMarkdown(MINIMAL_VALID_MD)
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data.dependedOnBy).toEqual([])
    })

    it('should handle missing Change Log gracefully', () => {
      const result = parseSystemMarkdown(MINIMAL_VALID_MD)
      expect(result.ok).toBe(true)
      if (result.ok) expect(Array.isArray(result.data.changeLog)).toBe(true)
    })
  })

  describe('Optional System: prefix in H1', () => {
    it('should parse H1 with "System: Name" format', () => {
      const md = MINIMAL_VALID_MD.replace('# Combat', '# System: Combat')
      const result = parseSystemMarkdown(md)
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data.name).toBe('Combat')
    })
  })
})
