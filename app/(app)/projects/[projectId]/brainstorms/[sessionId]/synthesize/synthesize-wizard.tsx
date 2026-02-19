'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Copy,
  Check,
  ChevronDownIcon,
  Plus,
  PlusCircle,
  MinusCircle,
  CheckCircle,
  X,
  Settings,
  Loader2,
  Sparkles,
  ClipboardList,
  FileText,
  MessageSquare,
  Send,
  Lightbulb,
  Database,
  Layers,
  Code,
  Eye,
  Inbox,
  Star,
  FileCheck,
  Link2,
  Trash2,
} from 'lucide-react'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { Accordion, AccordionContent, AccordionItem } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import oneDark from 'react-syntax-highlighter/dist/esm/styles/prism/one-dark'
import { cn } from '@/lib/utils'
import type { ExtractedSystemStub, ExtractedSystemDetailStub } from '@/lib/ai/parse-synthesis-response'
import { parseSynthesisResponse, normalizeDependencyEntry } from '@/lib/ai/parse-synthesis-response'
import {
  groupAndSortModels,
  getModelDescription,
  resolveSuggestedModel,
} from '@/lib/utils/group-models-for-select'
import { extractionToMarkdown } from '@/lib/services/extraction-markdown'
import { convertSynthesisAction, addSuggestedSystemsToExtractionAction } from '@/app/actions/synthesis.actions'
import type { CandidateSelection } from '@/lib/services/synthesis-convert.service'

const STEPS = ['Configure', 'Processing', 'Review'] as const

/** Normalize for system detail–system matching: AI may use slug or name with different casing. */
function norm(s: string | undefined | null): string {
  return (s ?? '').toString().trim().toLowerCase()
}

/** System details belong to a system by targetSystemSlug or systemSlug (or unassigned). Match normalized. */
function getSystemDetailsForSystem(
  system: ExtractedSystemStub,
  systemIndex: number,
  allSystemDetails: ExtractedSystemDetailStub[],
  allSystems: ExtractedSystemStub[]
): ExtractedSystemDetailStub[] {
  const systemId = norm(system.systemSlug ?? system.name)
  if (!systemId) return []
  return allSystemDetails.filter((b) => {
    const target = norm(b.targetSystemSlug ?? b.systemSlug)
    if (target) return target === systemId || target === norm(system.name)
    return false
  })
}

/** Unassigned system details (no target) for showing in a separate list. */
function getUnassignedSystemDetails(
  allSystemDetails: ExtractedSystemDetailStub[]
): ExtractedSystemDetailStub[] {
  return allSystemDetails.filter((b) => {
    const target = (b.targetSystemSlug ?? b.systemSlug ?? '').toString().trim()
    return target === '' || target === 'new'
  })
}

type ExtractionAccordionProps = {
  extractedSystems: ExtractedSystemStub[]
  extractedSystemDetails: ExtractedSystemDetailStub[]
  expandedValue: string[]
  onExpandedChange: (v: string[]) => void
  isStreaming?: boolean
  systemStatus?: Record<number, 'added' | 'updated'>
  detailStatus?: Record<number, 'added' | 'updated'>
  showSelectionAndFinalize?: boolean
  selectedSystemIndices: number[]
  onToggleSystemSelection: (systemIndex: number) => void
  excludedDetailIndices?: number[]
  onToggleDetailExclude?: (detailIndex: number) => void
  /** When provided, show an "Interactions" section in expanded content with labels and remove. */
  interactionEdges?: { sourceSlug: string; targetSlug: string; description?: string }[]
  onRemoveInteraction?: (edge: { sourceSlug: string; targetSlug: string; description?: string }) => void
  effectiveSourceSlugByIndex?: Map<number, string>
  getLabelForSlug?: (slug: string) => string
}

function ExtractionAccordion({
  extractedSystems,
  extractedSystemDetails,
  expandedValue,
  onExpandedChange,
  isStreaming = false,
  systemStatus = {},
  detailStatus = {},
  showSelectionAndFinalize = false,
  selectedSystemIndices,
  onToggleSystemSelection,
  excludedDetailIndices = [],
  onToggleDetailExclude,
  interactionEdges,
  onRemoveInteraction,
  effectiveSourceSlugByIndex,
  getLabelForSlug,
}: ExtractionAccordionProps) {
  return (
    <Accordion
      type="multiple"
      value={expandedValue}
      onValueChange={onExpandedChange}
      className="mt-2"
    >
      {extractedSystems.map((s, i) => {
        const detailsForSystem = getSystemDetailsForSystem(
          s,
          i,
          extractedSystemDetails,
          extractedSystems
        )
        const isSelected = selectedSystemIndices.includes(i)
        return (
          <AccordionItem key={i} value={String(i)}>
            <AccordionPrimitive.Header className="flex">
              <AccordionPrimitive.Trigger
                className={cn(
                  'flex flex-1 items-center gap-2 py-4 text-left text-sm font-medium transition-all outline-none hover:no-underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&[data-state=open]>svg]:rotate-180 min-h-[4rem]',
                  '[&>svg]:shrink-0'
                )}
              >
                <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                <div className="flex flex-1 flex-col items-start gap-0.5 min-w-0 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-medium">
                      {s.name ?? s.systemSlug ?? 'Unnamed'}
                    </span>
                    {systemStatus[i] && (
                      <Badge
                        variant={systemStatus[i] === 'added' ? 'status-new' : 'status-existing'}
                        className="text-xs font-normal gap-1"
                      >
                        {systemStatus[i] === 'added' ? (
                          <>
                            <Star className="size-3 shrink-0" aria-hidden />
                            New
                          </>
                        ) : (
                          <>
                            <FileCheck className="size-3 shrink-0" aria-hidden />
                            Existing
                          </>
                        )}
                      </Badge>
                    )}
                  </div>
                  {s.purpose && (
                    <span className="text-sm font-normal text-muted-foreground">
                      {(s.purpose as string).slice(0, 120)}
                      {(s.purpose as string).length > 120 ? '…' : ''}
                    </span>
                  )}
                  {(s.dependencies ?? []).length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="text-xs text-muted-foreground">Interacts with:</span>
                      {(s.dependencies ?? []).map((entry) => {
                        const { slug } = normalizeDependencyEntry(entry)
                        return (
                          <Badge
                            key={slug}
                            variant="secondary"
                            className="text-xs font-normal px-1.5 py-0"
                          >
                            {slug}
                          </Badge>
                        )
                      })}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground/70 mt-1">No interaction links</span>
                  )}
                </div>
                {showSelectionAndFinalize && (
                  <span
                    role="button"
                    tabIndex={0}
                    className={cn(
                      buttonVariants({ size: 'sm', variant: isSelected ? 'default' : 'outline' }),
                      'shrink-0 ml-auto mr-2 cursor-pointer'
                    )}
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleSystemSelection(i)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        e.stopPropagation()
                        onToggleSystemSelection(i)
                      }
                    }}
                    aria-label={`${isSelected ? 'Include' : 'Exclude'}: ${s.name ?? s.systemSlug ?? 'system'}`}
                  >
                    {isSelected ? (
                      <>
                        <CheckCircle className="size-3.5 shrink-0" aria-hidden />
                        Include
                      </>
                    ) : (
                      <>
                        <X className="size-3.5 shrink-0" aria-hidden />
                        Exclude
                      </>
                    )}
                  </span>
                )}
              </AccordionPrimitive.Trigger>
            </AccordionPrimitive.Header>
            <AccordionContent className="border-t border-border bg-muted/20 px-4 py-4">
              <div className="space-y-4">
                <section className="rounded-md border border-border bg-background p-3">
                  <h4 className="text-sm font-medium">System details</h4>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Discrete mechanics, inputs, outputs, or content for this system.
                  </p>
                  {detailsForSystem.length === 0 ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {isStreaming ? 'Waiting for system details…' : 'No system details yet.'}
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-3">
                      {detailsForSystem.map((b, bi) => {
                        const detailIndex = extractedSystemDetails.indexOf(b)
                        const status = detailIndex >= 0 ? detailStatus[detailIndex] : undefined
                        const isDetailExcluded = detailIndex >= 0 && excludedDetailIndices.includes(detailIndex)
                        return (
                          <li key={bi} className="rounded-md border border-border/50 bg-muted/10 p-2">
                            <div className="flex items-start gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="mb-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                                  <span>{b.name} ({b.detailType ?? 'mechanic'})</span>
                                  {status && (
                                    <Badge
                                      variant={status === 'added' ? 'status-new' : 'status-existing'}
                                      className="text-[10px] font-normal px-1 py-0 gap-0.5"
                                    >
                                      {status === 'added' ? (
                                        <>
                                          <Star className="size-2.5 shrink-0" aria-hidden />
                                          New
                                        </>
                                      ) : (
                                        <>
                                          <FileCheck className="size-2.5 shrink-0" aria-hidden />
                                          Existing
                                        </>
                                      )}
                                    </Badge>
                                  )}
                                </div>
                                <p className="whitespace-pre-wrap text-xs text-foreground">
                                  {b.spec ?? '—'}
                                </p>
                              </div>
                              {showSelectionAndFinalize && onToggleDetailExclude && detailIndex >= 0 && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={!isDetailExcluded ? 'default' : 'outline'}
                                  className="shrink-0 ml-auto mr-2"
                                  onClick={() => onToggleDetailExclude(detailIndex)}
                                  aria-label={`${isDetailExcluded ? 'Include' : 'Exclude'} ${b.name} from finalize`}
                                >
                                  {!isDetailExcluded ? (
                                    <>
                                      <CheckCircle className="size-3.5 shrink-0" aria-hidden />
                                      Include
                                    </>
                                  ) : (
                                    <>
                                      <X className="size-3.5 shrink-0" aria-hidden />
                                      Exclude
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </section>
                {showSelectionAndFinalize &&
                  interactionEdges != null &&
                  onRemoveInteraction != null &&
                  effectiveSourceSlugByIndex != null &&
                  getLabelForSlug != null && (
                    <section className="rounded-md border border-border bg-background p-3">
                      <h4 className="text-sm font-medium flex items-center gap-1.5">
                        <Link2 className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                        Interacts with
                      </h4>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Systems this one uses or interfaces with. Remove to drop the link.
                      </p>
                      {(() => {
                        const effectiveSlug =
                          effectiveSourceSlugByIndex.get(i) ?? s.systemSlug ?? ''
                        const outgoing = interactionEdges.filter(
                          (e) => e.sourceSlug === effectiveSlug
                        )
                        if (outgoing.length === 0) {
                          return (
                            <p className="mt-1 text-xs text-muted-foreground">
                              No interaction links for this system.
                            </p>
                          )
                        }
                        return (
                          <ul className="mt-2 space-y-2">
                            {outgoing.map((edge) => (
                              <li
                                key={`${edge.sourceSlug}-${edge.targetSlug}`}
                                className="flex flex-wrap items-center gap-2 rounded-md border border-border/50 bg-muted/10 p-2"
                              >
                                <div className="min-w-0 flex-1">
                                  <span className="text-xs font-medium">
                                    {getLabelForSlug(edge.targetSlug)}
                                  </span>
                                  <span className="text-xs text-muted-foreground ml-1">
                                    ({edge.targetSlug})
                                  </span>
                                  {edge.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {edge.description}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="ml-auto h-7 text-destructive hover:text-destructive shrink-0"
                                  onClick={() => onRemoveInteraction(edge)}
                                  aria-label={`Remove link to ${edge.targetSlug}`}
                                >
                                  <Trash2 className="size-3.5 shrink-0" aria-hidden />
                                  Remove
                                </Button>
                              </li>
                            ))}
                          </ul>
                        )
                      })()}
                    </section>
                  )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )
      })}
      {getUnassignedSystemDetails(extractedSystemDetails).length > 0 && (
        <AccordionItem value="unassigned">
          <AccordionPrimitive.Header className="flex">
            <AccordionPrimitive.Trigger
              className={cn(
                'flex flex-1 items-center gap-2 py-3 text-left text-sm font-medium transition-all outline-none hover:no-underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&[data-state=open]>svg]:rotate-180 min-h-[3rem]',
                '[&>svg]:shrink-0'
              )}
            >
              <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform duration-200" />
              <Inbox className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="text-sm font-medium text-muted-foreground">
                Unassigned system details
              </span>
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionContent className="border-t border-border bg-muted/20 px-4 py-3">
            <ul className="mt-1 space-y-3">
              {getUnassignedSystemDetails(extractedSystemDetails).map((b, bi) => {
                const detailIndex = extractedSystemDetails.indexOf(b)
                const status = detailIndex >= 0 ? detailStatus[detailIndex] : undefined
                return (
                  <li key={bi} className="rounded-md border border-border/50 bg-muted/10 p-2">
                    <div className="mb-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <span>{b.name} ({b.detailType ?? 'mechanic'})</span>
                      {status && (
                        <Badge
                          variant={status === 'added' ? 'status-new' : 'status-existing'}
                          className="text-[10px] font-normal px-1 py-0 gap-0.5"
                        >
                          {status === 'added' ? (
                            <>
                              <Star className="size-2.5 shrink-0" aria-hidden />
                              New
                            </>
                          ) : (
                            <>
                              <FileCheck className="size-2.5 shrink-0" aria-hidden />
                              Existing
                            </>
                          )}
                        </Badge>
                      )}
                    </div>
                    <p className="whitespace-pre-wrap text-xs text-foreground">
                      {b.spec ?? '—'}
                    </p>
                  </li>
                )
              })}
            </ul>
          </AccordionContent>
        </AccordionItem>
      )}
    </Accordion>
  )
}

export type SynthesisConfig = {
  providerId: string
  model: string
  focusAreas: string
  rerunMode: 'rerun' | 'update_context'
}

export type WizardConfig = {
  projectId: string
  sessionId: string
  sessionTitle: string
  snapshotDate: string | null
  providerConfigs: { providerId: string; defaultModel: string | null; availableModels?: string[] }[]
  sourcePreview: string
}

type ExistingProjectSystemForReview = {
  systemSlug: string
  systemDetails: { name: string; detailType: string }[]
}

type WizardProps = {
  initialConfig: WizardConfig
  existingOutputId?: string | null
  existingOutput?: {
    extractedSystems: ExtractedSystemStub[]
    extractedSystemDetails: ExtractedSystemDetailStub[]
    suggestedSystems?: ExtractedSystemStub[]
    suggestedSystemDetails?: ExtractedSystemDetailStub[]
    content: string
  } | null
  existingProjectSystems?: ExistingProjectSystemForReview[]
}

const initialStep = (existingOutputId: string | null | undefined, existingOutput: WizardProps['existingOutput']) =>
  existingOutputId && existingOutput ? 2 : 0

export function SynthesizeWizard({
  initialConfig,
  existingOutputId,
  existingOutput,
  existingProjectSystems = [],
}: WizardProps) {
  const [step, setStep] = useState(initialStep(existingOutputId, existingOutput))
  const [maxStepReached, setMaxStepReached] = useState(initialStep(existingOutputId, existingOutput))
  const defaultProvider = initialConfig.providerConfigs[0]
  const defaultModels = defaultProvider?.availableModels ?? []
  const defaultSuggested = resolveSuggestedModel(
    defaultProvider?.providerId ?? 'openai',
    defaultModels
  )
  const [config, setConfig] = useState<SynthesisConfig>({
    providerId: defaultProvider?.providerId ?? 'openai',
    model:
      defaultProvider?.defaultModel ??
      defaultSuggested ??
      defaultModels[0] ??
      'gpt-4o-mini',
    focusAreas: '',
    rerunMode: 'rerun',
  })
  const [streamingText, setStreamingText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [runError, setRunError] = useState<string | null>(null)
  const [outputId, setOutputId] = useState<string | null>(existingOutputId ?? null)
  const [extractedSystems, setExtractedSystems] = useState<ExtractedSystemStub[]>(
    existingOutput?.extractedSystems ?? []
  )
  const [extractedSystemDetails, setExtractedSystemDetails] = useState<
    ExtractedSystemDetailStub[]
  >(existingOutput?.extractedSystemDetails ?? [])
  const [suggestedSystems, setSuggestedSystems] = useState<ExtractedSystemStub[]>(
    existingOutput?.suggestedSystems ?? []
  )
  const [suggestedSystemDetails, setSuggestedSystemDetails] = useState<
    ExtractedSystemDetailStub[]
  >(existingOutput?.suggestedSystemDetails ?? [])
  const [runDurationMs, setRunDurationMs] = useState<number | null>(null)
  const [tokenCount, setTokenCount] = useState<{ prompt?: number; completion?: number } | null>(null)
  const [convertSelections, setConvertSelections] = useState<
    Map<number, { action: 'create' | 'merge' | 'discard'; slug?: string; existingSystemId?: string; detailIndices: number[] }>
  >(new Map())
  const [dependencyEdges, setDependencyEdges] = useState<
    { sourceSlug: string; targetSlug: string; description?: string }[]
  >([])
  const [convertError, setConvertError] = useState<string | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  const [refineMessages, setRefineMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [refineInput, setRefineInput] = useState('')
  const [isRefining, setIsRefining] = useState(false)
  const [refineError, setRefineError] = useState<string | null>(null)
  const [convertSuggestion, setConvertSuggestion] = useState<{
    create: number[]
    merge: { candidateIndex: number; intoExistingSlug: string }[]
    discard: number[]
    dependencies: { sourceSlug: string; targetSlug: string; description?: string }[]
    rationale?: string
  } | null>(null)
  const [suggestUserPrompt, setSuggestUserPrompt] = useState<string | null>(null)
  const [suggestPromptSummary, setSuggestPromptSummary] = useState<{
    candidateCount: number
    existingCount: number
  } | null>(null)
  const [showSuggestPrompt, setShowSuggestPrompt] = useState(false)
  const [existingSystemsForSuggest, setExistingSystemsForSuggest] = useState<
    { id: string; systemSlug: string }[]
  >([])
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [suggestError, setSuggestError] = useState<string | null>(null)
  const [expandedSystemValues, setExpandedSystemValues] = useState<string[]>([])
  const [expandedSuggestedValues, setExpandedSuggestedValues] = useState<string[]>([])
  const [isAddingSuggested, setIsAddingSuggested] = useState(false)
  const [selectedSystemIndices, setSelectedSystemIndices] = useState<number[]>([])
  const [excludedDetailIndices, setExcludedDetailIndices] = useState<number[]>([])
  const [lastRefineOutput, setLastRefineOutput] = useState<string | null>(null)
  const [promptUsed, setPromptUsed] = useState<string | null>(null)
  const [rawOutput, setRawOutput] = useState<string | null>(
    existingOutput?.content ?? null
  )
  const [markdownViewMode, setMarkdownViewMode] = useState<'preview' | 'source'>('preview')
  const [copyId, setCopyId] = useState<string | null>(null)

  const goToStep = useCallback((n: number) => {
    setStep(n)
    setMaxStepReached((prev) => Math.max(prev, n))
  }, [])

  const handleCopy = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopyId(id)
      setTimeout(() => setCopyId(null), 1500)
    } catch {
      // ignore
    }
  }, [])

  const streamingResponseRef = useRef<HTMLPreElement>(null)

  // When provider has availableModels and current model is not in list, use suggested or first available
  useEffect(() => {
    const pc = initialConfig.providerConfigs.find((p) => p.providerId === config.providerId)
    const models = pc?.availableModels ?? []
    if (models.length > 0 && config.model && !models.includes(config.model)) {
      const fallback = resolveSuggestedModel(config.providerId, models) ?? models[0]
      if (fallback) setConfig((c) => ({ ...c, model: fallback }))
    }
  }, [config.providerId, config.model, initialConfig.providerConfigs])

  useEffect(() => {
    if (!isStreaming || !streamingResponseRef.current) return
    streamingResponseRef.current.scrollTop = streamingResponseRef.current.scrollHeight
  }, [isStreaming, streamingText])

  // During streaming, try to parse partial response so the skeleton can show systems/behaviors as they appear
  useEffect(() => {
    if (!isStreaming || !streamingText.trim()) return
    const parsed = parseSynthesisResponse(streamingText)
    if (parsed.extractedSystems.length > 0 || parsed.extractedSystemDetails.length > 0) {
      setExtractedSystems((prev) =>
        parsed.extractedSystems.length > 0 ? parsed.extractedSystems : prev
      )
      setExtractedSystemDetails((prev) =>
        parsed.extractedSystemDetails.length > 0 ? parsed.extractedSystemDetails : prev
      )
    }
  }, [isStreaming, streamingText])

  // Load raw output for Prompt & raw tab when we have outputId but no rawOutput (e.g. loaded from URL)
  useEffect(() => {
    if (step !== 2 || !outputId || !initialConfig.projectId || rawOutput !== null) return
    fetch(
      `/api/projects/${initialConfig.projectId}/synthesis/output?outputId=${encodeURIComponent(outputId)}`
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { content?: string } | null) => {
        if (data?.content != null) setRawOutput(data.content)
      })
      .catch(() => {})
  }, [step, outputId, initialConfig.projectId, rawOutput])

  useEffect(() => {
    if (step !== 2 || !outputId || !initialConfig.projectId) return
    fetch(
      `/api/projects/${initialConfig.projectId}/synthesis/refine?outputId=${encodeURIComponent(outputId)}`
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { messages?: { role: string; content: string }[] } | null) => {
        if (data?.messages?.length) {
          setRefineMessages(
            data.messages.map((m) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            }))
          )
        }
      })
      .catch(() => {})
  }, [step, outputId, initialConfig.projectId])

  const prevStepRef = useRef(step)
  const hasInitializedReviewSelection = useRef(false)
  if (prevStepRef.current !== step) {
    prevStepRef.current = step
    if (step !== 2) hasInitializedReviewSelection.current = false
  }
  // Default all systems selected (included in finalize) when first showing Review with extraction
  useEffect(() => {
    if (step !== 2 || extractedSystems.length === 0) return
    if (hasInitializedReviewSelection.current) return
    hasInitializedReviewSelection.current = true
    setSelectedSystemIndices(extractedSystems.map((_, i) => i))
    setConvertSelections((m) => {
      const next = new Map(m)
      extractedSystems.forEach((s, i) => {
        const slug = s.systemSlug ?? (s.name ?? 'system').toLowerCase().replace(/\s+/g, '-')
        const detailIndices = extractedSystemDetails
          .map((b, bi) => ({ b, bi }))
          .filter(
            ({ b }) =>
              (b.targetSystemSlug ?? b.systemSlug) === (s.systemSlug ?? s.name) ||
              !(b.targetSystemSlug ?? b.systemSlug)
          )
          .map(({ bi }) => bi)
        next.set(i, { action: 'create', slug, detailIndices })
      })
      return next
    })
  }, [step, extractedSystems, extractedSystemDetails])

  const handleRefineSubmit = useCallback(async () => {
    const message = refineInput.trim()
    if (!message || !outputId || isRefining) return
    setRefineError(null)
    setIsRefining(true)
    const lastK = 6 * 2
    const history = refineMessages.slice(-lastK)
    const focusedSystemSlugs =
      selectedSystemIndices.length > 0
        ? selectedSystemIndices
            .map((i) => extractedSystems[i]?.systemSlug ?? extractedSystems[i]?.name)
            .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
            .map((s) => s.trim())
        : undefined
    try {
      const res = await fetch(
        `/api/projects/${initialConfig.projectId}/synthesis/refine`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            outputId,
            providerId: config.providerId,
            model: config.model || undefined,
            userMessage: message,
            messages: history,
            extractedSystems,
            extractedSystemDetails,
            ...(focusedSystemSlugs && focusedSystemSlugs.length > 0
              ? { focusedSystemSlugs }
              : {}),
          }),
        }
      )
      const data = await res.json()
      if (!res.ok) {
        setRefineError(data.error ?? 'Refine failed')
        setIsRefining(false)
        return
      }
      setExtractedSystems(data.extractedSystems ?? extractedSystems)
      setExtractedSystemDetails(data.extractedSystemDetails ?? extractedSystemDetails)
      if (Array.isArray(data.suggestedSystems)) setSuggestedSystems(data.suggestedSystems)
      if (Array.isArray(data.suggestedSystemDetails)) setSuggestedSystemDetails(data.suggestedSystemDetails)
      setLastRefineOutput(data.rawContent ?? null)
      setRefineMessages((prev) => [
        ...prev,
        { role: 'user' as const, content: message },
        {
          role: 'assistant' as const,
          content: 'Updated extraction applied.',
        },
      ])
      setRefineInput('')
    } catch (e) {
      setRefineError(e instanceof Error ? e.message : 'Refine failed')
    } finally {
      setIsRefining(false)
    }
  }, [
    refineInput,
    outputId,
    isRefining,
    initialConfig.projectId,
    config.providerId,
    config.model,
    refineMessages,
    extractedSystems,
    extractedSystemDetails,
    selectedSystemIndices,
  ])

  const handleToggleSystemSelection = useCallback(
    (systemIndex: number) => {
      const nextSelected = selectedSystemIndices.includes(systemIndex)
        ? selectedSystemIndices.filter((j) => j !== systemIndex)
        : [...selectedSystemIndices, systemIndex].sort((a, b) => a - b)
      setSelectedSystemIndices(nextSelected)
      const s = extractedSystems[systemIndex]
      const slug = s?.systemSlug ?? (s?.name ?? 'system').toLowerCase().replace(/\s+/g, '-')
      const detailIndices = extractedSystemDetails
        .map((b, bi) => ({ b, bi }))
        .filter(
          ({ b }) =>
            (b.targetSystemSlug ?? b.systemSlug) === (s?.systemSlug ?? s?.name) ||
            !(b.targetSystemSlug ?? b.systemSlug)
        )
        .map(({ bi }) => bi)
      setConvertSelections((m) => {
        const nextMap = new Map(m)
        nextMap.set(systemIndex, {
          action: nextSelected.includes(systemIndex) ? 'create' : 'discard',
          slug: nextSelected.includes(systemIndex) ? slug : undefined,
          detailIndices: nextSelected.includes(systemIndex) ? detailIndices : [],
        })
        return nextMap
      })
    },
    [extractedSystems, extractedSystemDetails, selectedSystemIndices]
  )

  const handleToggleDetailExclude = useCallback((detailIndex: number) => {
    setExcludedDetailIndices((prev) =>
      prev.includes(detailIndex)
        ? prev.filter((j) => j !== detailIndex)
        : [...prev, detailIndex].sort((a, b) => a - b)
    )
  }, [])

  const handleSynthesize = useCallback(async () => {
    setRunError(null)
    setStreamingText('')
    setPromptUsed(null)
    setIsStreaming(true)
    goToStep(1)
    const start = Date.now()
    try {
      const res = await fetch(
        `/api/projects/${initialConfig.projectId}/synthesis/stream`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: initialConfig.sessionId,
            providerId: config.providerId,
            model: config.model || undefined,
            rerunMode: config.rerunMode,
          }),
        }
      )
      if (!res.ok || !res.body) {
        setRunError('Stream request failed')
        setIsStreaming(false)
        return
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let currentEvent = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim()
            continue
          }
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6)) as {
                text?: string
                outputId?: string
                promptTokens?: number
                completionTokens?: number
                message?: string
                prompt?: string
                rawContent?: string
                extractedSystems?: ExtractedSystemStub[]
                extractedSystemDetails?: ExtractedSystemDetailStub[]
                suggestedSystems?: ExtractedSystemStub[]
                suggestedSystemDetails?: ExtractedSystemDetailStub[]
              }
              if (currentEvent === 'prompt' && data.prompt != null) setPromptUsed(data.prompt)
              if (currentEvent === 'chunk' && data.text) setStreamingText((t) => t + data.text)
              if (currentEvent === 'done' && data.outputId) {
                setOutputId(data.outputId)
                setTokenCount({
                  prompt: data.promptTokens,
                  completion: data.completionTokens,
                })
                if (data.prompt != null) setPromptUsed(data.prompt)
                if (data.rawContent != null) setRawOutput(data.rawContent)
                if (Array.isArray(data.extractedSystems)) setExtractedSystems(data.extractedSystems)
                if (Array.isArray(data.extractedSystemDetails)) setExtractedSystemDetails(data.extractedSystemDetails)
                if (Array.isArray(data.suggestedSystems)) setSuggestedSystems(data.suggestedSystems)
                if (Array.isArray(data.suggestedSystemDetails)) setSuggestedSystemDetails(data.suggestedSystemDetails)
              }
              if (data.message) setRunError(data.message)
            } catch {
              // ignore parse errors
            }
          }
        }
      }
      setRunDurationMs(Date.now() - start)
      if (buffer) {
        try {
          const data = JSON.parse(buffer.replace(/^data: /, '').trim()) as {
            outputId?: string
            promptTokens?: number
            completionTokens?: number
            prompt?: string
            rawContent?: string
            extractedSystems?: ExtractedSystemStub[]
            extractedSystemDetails?: ExtractedSystemDetailStub[]
            suggestedSystems?: ExtractedSystemStub[]
            suggestedSystemDetails?: ExtractedSystemDetailStub[]
          }
          if (data.outputId) {
            setOutputId(data.outputId)
            setTokenCount({
              prompt: data.promptTokens,
              completion: data.completionTokens,
            })
            if (data.prompt != null) setPromptUsed(data.prompt)
            if (data.rawContent != null) setRawOutput(data.rawContent)
            if (Array.isArray(data.extractedSystems)) setExtractedSystems(data.extractedSystems)
            if (Array.isArray(data.extractedSystemDetails)) setExtractedSystemDetails(data.extractedSystemDetails)
            if (Array.isArray(data.suggestedSystems)) setSuggestedSystems(data.suggestedSystems)
            if (Array.isArray(data.suggestedSystemDetails)) setSuggestedSystemDetails(data.suggestedSystemDetails)
          }
        } catch {
          // ignore
        }
      }
      goToStep(2)
    } catch (e) {
      setRunError(e instanceof Error ? e.message : 'Synthesis failed')
    } finally {
      setIsStreaming(false)
    }
  }, [initialConfig.projectId, initialConfig.sessionId, config])

  const handleConvert = useCallback(async () => {
    if (!outputId) return
    setConvertError(null)
    setIsConverting(true)
    const excludedSet = new Set(excludedDetailIndices)
    const selections: CandidateSelection[] = extractedSystems.map((s, candidateIndex) => {
      const sel = convertSelections.get(candidateIndex) ?? {
        action: 'create' as const,
        slug: s.systemSlug ?? (s.name ?? 'system').toLowerCase().replace(/\s+/g, '-'),
        detailIndices: extractedSystemDetails
          .map((b, bi) => ({ b, bi }))
          .filter(({ b }) => (b.targetSystemSlug ?? b.systemSlug) === (s.systemSlug ?? s.name) || !(b.targetSystemSlug ?? b.systemSlug))
          .map(({ bi }) => bi),
      }
      const detailIndices = (sel.detailIndices ?? []).filter((bi) => !excludedSet.has(bi))
      return {
        candidateIndex,
        action: sel.action === 'discard' ? 'discard' : sel.action,
        slug: sel.action === 'create' ? sel.slug : undefined,
        existingSystemId: sel.action === 'merge' ? sel.existingSystemId : undefined,
        detailIndices,
      }
    })
    let edgesToApply: { sourceSlug: string; targetSlug: string; description?: string }[]
    if (dependencyEdges.length > 0) {
      edgesToApply = dependencyEdges
    } else if (convertSuggestion?.dependencies?.length) {
      edgesToApply = convertSuggestion.dependencies
    } else {
      const nonDiscard = selections.filter((s) => s.action !== 'discard')
      const slugifyName = (name: string) =>
        name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      const idToSlug = new Map(
        existingSystemsForSuggest.map((s) => [s.id, s.systemSlug])
      )
      const effectiveSlugs = new Set<string>()
      for (const sel of nonDiscard) {
        const stub = extractedSystems[sel.candidateIndex]
        if (!stub) continue
        const slug =
          sel.action === 'create'
            ? sel.slug ?? stub.systemSlug ?? slugifyName(stub.name ?? 'system')
            : sel.existingSystemId
              ? idToSlug.get(sel.existingSystemId)
              : undefined
        if (slug) effectiveSlugs.add(slug)
      }
      const seen = new Set<string>()
      edgesToApply = []
      for (const sel of nonDiscard) {
        const stub = extractedSystems[sel.candidateIndex]
        if (!stub?.dependencies?.length) continue
        const sourceSlug =
          sel.action === 'create'
            ? sel.slug ?? stub.systemSlug ?? slugifyName(stub.name ?? 'system')
            : sel.existingSystemId
              ? idToSlug.get(sel.existingSystemId)
              : undefined
        if (!sourceSlug) continue
        for (const entry of stub.dependencies) {
          const { slug: targetSlug, description } = normalizeDependencyEntry(entry)
          if (!effectiveSlugs.has(targetSlug)) continue
          const key = `${sourceSlug}\n${targetSlug}`
          if (seen.has(key)) continue
          seen.add(key)
          edgesToApply.push({ sourceSlug, targetSlug, description })
        }
      }
    }
    const result = await convertSynthesisAction(
      outputId,
      selections.filter((s) => s.action !== 'discard'),
      edgesToApply
    )
    setIsConverting(false)
    if (result.success && result.projectId) {
      window.location.href = `/projects/${result.projectId}/dependencies`
      return
    }
    setConvertError(result.error ?? 'Convert failed')
  }, [outputId, convertSelections, convertSuggestion, dependencyEdges, extractedSystems, extractedSystemDetails, excludedDetailIndices, existingSystemsForSuggest])

  const handleAddSuggestedToExtraction = useCallback(
    async (suggestedIndex: number) => {
      if (!outputId || isAddingSuggested) return
      setIsAddingSuggested(true)
      try {
        const result = await addSuggestedSystemsToExtractionAction(outputId, [suggestedIndex])
        if (!result.success) return
        if (result.extractedSystems != null) setExtractedSystems(result.extractedSystems)
        if (result.extractedSystemDetails != null) setExtractedSystemDetails(result.extractedSystemDetails)
        if (result.suggestedSystems != null) setSuggestedSystems(result.suggestedSystems)
        if (result.suggestedSystemDetails != null) setSuggestedSystemDetails(result.suggestedSystemDetails)
      } finally {
        setIsAddingSuggested(false)
      }
    },
    [outputId, isAddingSuggested]
  )

  const handleGetSuggestion = useCallback(async () => {
    if (!outputId || isSuggesting) return
    setSuggestError(null)
    setConvertSuggestion(null)
    setSuggestUserPrompt(null)
    setSuggestPromptSummary(null)
    setShowSuggestPrompt(false)
    setIsSuggesting(true)
    try {
      const res = await fetch(
        `/api/projects/${initialConfig.projectId}/synthesis/convert-suggest`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            outputId,
            providerId: config.providerId,
            model: config.model || undefined,
          }),
        }
      )
      const data = await res.json()
      if (!res.ok) {
        setSuggestError(data.error ?? 'Failed to get suggestion')
        return
      }
      setConvertSuggestion(data.suggestion ?? null)
      setExistingSystemsForSuggest(data.existingSystems ?? [])
      setSuggestUserPrompt(typeof data.userPrompt === 'string' ? data.userPrompt : null)
      setSuggestPromptSummary(
        data.promptSummary && typeof data.promptSummary.candidateCount === 'number'
          ? {
              candidateCount: data.promptSummary.candidateCount,
              existingCount: data.promptSummary.existingCount ?? 0,
            }
          : null
      )
    } catch (e) {
      setSuggestError(e instanceof Error ? e.message : 'Failed to get suggestion')
    } finally {
      setIsSuggesting(false)
    }
  }, [outputId, isSuggesting, initialConfig.projectId, config.providerId, config.model])

  const handleApplySuggestion = useCallback(() => {
    if (!convertSuggestion) return
    const slugById = new Map(existingSystemsForSuggest.map((s) => [s.systemSlug, s.id]))
    const next = new Map<
      number,
      { action: 'create' | 'merge' | 'discard'; slug?: string; existingSystemId?: string; detailIndices: number[] }
    >()
    for (const i of convertSuggestion.create) {
      const s = extractedSystems[i]
      next.set(i, {
        action: 'create',
        slug: s?.systemSlug ?? (s?.name ?? 'system').toLowerCase().replace(/\s+/g, '-'),
        detailIndices: extractedSystemDetails
          .map((b, bi) => ({ b, bi }))
          .filter(
            ({ b }) =>
              (b.targetSystemSlug ?? b.systemSlug) === (s?.systemSlug ?? s?.name) ||
              !(b.targetSystemSlug ?? b.systemSlug)
          )
          .map(({ bi }) => bi),
      })
    }
    for (const m of convertSuggestion.merge) {
      const s = extractedSystems[m.candidateIndex]
      const existingId = slugById.get(m.intoExistingSlug)
      next.set(m.candidateIndex, {
        action: 'merge',
        existingSystemId: existingId ?? undefined,
        detailIndices: extractedSystemDetails
          .map((b, bi) => ({ b, bi }))
          .filter(
            ({ b }) =>
              (b.targetSystemSlug ?? b.systemSlug) === (s?.systemSlug ?? s?.name) ||
              !(b.targetSystemSlug ?? b.systemSlug)
          )
          .map(({ bi }) => bi),
      })
    }
    for (const i of convertSuggestion.discard) {
      const s = extractedSystems[i]
      next.set(i, {
        action: 'discard',
        detailIndices: extractedSystemDetails
          .map((b, bi) => ({ b, bi }))
          .filter(
            ({ b }) =>
              (b.targetSystemSlug ?? b.systemSlug) === (s?.systemSlug ?? s?.name) ||
              !(b.targetSystemSlug ?? b.systemSlug)
          )
          .map(({ bi }) => bi),
      })
    }
    setConvertSelections(next)
    setDependencyEdges(convertSuggestion.dependencies ?? [])
    setConvertSuggestion(null)
    setSuggestUserPrompt(null)
    setSuggestPromptSummary(null)
    setShowSuggestPrompt(false)
    setSelectedSystemIndices([
      ...convertSuggestion.create,
      ...convertSuggestion.merge.map((m) => m.candidateIndex),
    ])
  }, [
    convertSuggestion,
    existingSystemsForSuggest,
    extractedSystems,
    extractedSystemDetails,
  ])

  const markdownPreview = useMemo(
    () =>
      extractionToMarkdown(
        extractedSystems,
        extractedSystemDetails,
        initialConfig.sessionTitle
      ),
    [extractedSystems, extractedSystemDetails, initialConfig.sessionTitle]
  )

  const formattedRawOutput = useMemo(() => {
    if (rawOutput == null || rawOutput.trim() === '') return rawOutput ?? ''
    try {
      const parsed = JSON.parse(rawOutput) as unknown
      return typeof parsed === 'object' && parsed !== null
        ? JSON.stringify(parsed, null, 2)
        : rawOutput
    } catch {
      return rawOutput
    }
  }, [rawOutput])

  const { systemStatus, detailStatus } = useMemo(() => {
    const empty = {
      systemStatus: {} as Record<number, 'added' | 'updated'>,
      detailStatus: {} as Record<number, 'added' | 'updated'>,
    }
    const existingSystemSlugs = new Set(
      existingProjectSystems.map((s) => norm(s.systemSlug))
    )
    const systemStatus: Record<number, 'added' | 'updated'> = {}
    extractedSystems.forEach((s, i) => {
      const slug = norm(s.systemSlug ?? s.name)
      systemStatus[i] = existingSystemSlugs.has(slug) ? 'updated' : 'added'
    })
    const detailKeysBySystemSlug = new Map<string, Set<string>>()
    for (const proj of existingProjectSystems) {
      const slug = norm(proj.systemSlug)
      const keys = new Set(
        proj.systemDetails.map((d) => `${norm(d.name)}|${norm(d.detailType ?? '')}`)
      )
      detailKeysBySystemSlug.set(slug, keys)
    }
    const detailStatus: Record<number, 'added' | 'updated'> = {}
    extractedSystemDetails.forEach((d, j) => {
      const systemSlug = norm(
        (d.targetSystemSlug ?? d.systemSlug ?? '') || 'unassigned'
      )
      const key = `${norm(d.name ?? '')}|${norm(d.detailType ?? '')}`
      const keys = detailKeysBySystemSlug.get(systemSlug)
      detailStatus[j] = keys?.has(key) ? 'updated' : 'added'
    })
    return { systemStatus, detailStatus }
  }, [existingProjectSystems, extractedSystems, extractedSystemDetails])

  const effectiveSourceSlugByIndex = useMemo(() => {
    const map = new Map<number, string>()
    extractedSystems.forEach((s, i) => {
      const sel = convertSelections.get(i)
      const fallback = s.systemSlug ?? (s.name ?? 'system').toLowerCase().replace(/\s+/g, '-')
      if (!sel) {
        map.set(i, fallback)
        return
      }
      if (sel.action === 'merge' && sel.existingSystemId) {
        map.set(
          i,
          existingSystemsForSuggest.find((x) => x.id === sel.existingSystemId)?.systemSlug ??
            fallback
        )
        return
      }
      if (sel.action === 'create') {
        map.set(i, sel.slug ?? fallback)
        return
      }
      map.set(i, fallback)
    })
    return map
  }, [convertSelections, existingSystemsForSuggest, extractedSystems])

  const edgesDerivedFromStubs = useMemo(() => {
    const slugifyName = (name: string) =>
      name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const idToSlug = new Map(
      existingSystemsForSuggest.map((s) => [s.id, s.systemSlug])
    )
    const effectiveSlugs = new Set<string>()
    extractedSystems.forEach((_s, i) => {
      const sel = convertSelections.get(i)
      if (sel?.action === 'discard') return
      const stub = extractedSystems[i]
      if (!stub) return
      const slug =
        sel?.action === 'create'
          ? sel.slug ?? stub.systemSlug ?? slugifyName(stub.name ?? 'system')
          : sel?.action === 'merge' && sel.existingSystemId
            ? idToSlug.get(sel.existingSystemId)
            : stub.systemSlug ?? slugifyName(stub.name ?? 'system')
      if (slug) effectiveSlugs.add(slug)
    })
    const seen = new Set<string>()
    const edges: { sourceSlug: string; targetSlug: string; description?: string }[] = []
    extractedSystems.forEach((stub, i) => {
      const sel = convertSelections.get(i)
      if (sel?.action === 'discard' || !stub?.dependencies?.length) return
      const sourceSlug = effectiveSourceSlugByIndex.get(i) ?? stub.systemSlug ?? slugifyName(stub.name ?? 'system')
      for (const entry of stub.dependencies) {
        const { slug: targetSlug, description } = normalizeDependencyEntry(entry)
        if (!effectiveSlugs.has(targetSlug)) continue
        const key = `${sourceSlug}\n${targetSlug}`
        if (seen.has(key)) continue
        seen.add(key)
        edges.push({ sourceSlug, targetSlug, description })
      }
    })
    return edges
  }, [convertSelections, existingSystemsForSuggest, extractedSystems, effectiveSourceSlugByIndex])

  const getLabelForSlug = useCallback(
    (slug: string) => {
      const s = extractedSystems.find(
        (x) => (x.systemSlug ?? '').toLowerCase() === slug.toLowerCase()
      )
      return s?.name ?? slug
    },
    [extractedSystems]
  )

  const handleRemoveInteraction = useCallback(
    (edge: { sourceSlug: string; targetSlug: string }) => {
      setDependencyEdges((prev) => {
        const list =
          prev.length > 0
            ? prev
            : (convertSuggestion?.dependencies?.length
                ? convertSuggestion.dependencies
                : edgesDerivedFromStubs)
        return list.filter(
          (e) =>
            !(e.sourceSlug === edge.sourceSlug && e.targetSlug === edge.targetSlug)
        )
      })
    },
    [convertSuggestion?.dependencies, edgesDerivedFromStubs]
  )

  const reviewInteractionEdges =
    dependencyEdges.length > 0
      ? dependencyEdges
      : (convertSuggestion?.dependencies?.length
          ? convertSuggestion.dependencies
          : edgesDerivedFromStubs)

  return (
    <div className="flex h-full min-h-0 flex-col space-y-6">
      <div className="relative flex shrink-0 items-center">
        <Link
          href={`/projects/${initialConfig.projectId}/brainstorms/${initialConfig.sessionId}`}
          className="text-sm text-muted-foreground hover:text-foreground shrink-0"
        >
          ← Back to session
        </Link>
        <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1.5 text-sm text-muted-foreground">
          {STEPS.map((label, i) => (
            <span key={label} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-muted-foreground/70">&gt;</span>}
              {i <= maxStepReached ? (
                <button
                  type="button"
                  onClick={() => goToStep(i)}
                  aria-current={i === step ? 'step' : undefined}
                  className={cn(
                    'flex items-center gap-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring rounded px-1 -mx-1 hover:text-foreground hover:underline',
                    i === step && 'font-medium text-foreground'
                  )}
                >
                  {i === 0 && <Settings className="size-3.5 shrink-0" aria-hidden />}
                  {i === 1 && <Loader2 className="size-3.5 shrink-0" aria-hidden />}
                  {i === 2 && <ClipboardList className="size-3.5 shrink-0" aria-hidden />}
                  {i + 1}. {label}
                </button>
              ) : (
                <span
                  className={cn(
                    'flex items-center gap-1.5',
                    i === step && 'font-medium text-foreground'
                  )}
                >
                  {i === 0 && <Settings className="size-3.5 shrink-0" aria-hidden />}
                  {i === 1 && <Loader2 className="size-3.5 shrink-0" aria-hidden />}
                  {i === 2 && <ClipboardList className="size-3.5 shrink-0" aria-hidden />}
                  {i + 1}. {label}
                </span>
              )}
            </span>
          ))}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 pb-6 lg:grid-cols-[1fr_minmax(360px,1fr)] items-stretch">
      <div className="flex min-h-0 flex-1 flex-col space-y-6">
      {step === 0 && (
        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <CardHeader className="shrink-0">
            <CardTitle className="flex items-center gap-2">
              <Settings className="size-4 shrink-0" aria-hidden />
              Configure
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {initialConfig.snapshotDate
                ? `Context snapshot: ${new Date(initialConfig.snapshotDate).toLocaleString()}`
                : 'No snapshot yet'}
            </p>
            <p className="text-sm text-muted-foreground">
              Source: {initialConfig.sessionTitle}
            </p>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
            <div className="shrink-0 space-y-4">
              <div>
                <label className="text-sm font-medium">Provider</label>
                <select
                  className="mt-1 w-full rounded border bg-background px-3 py-2"
                  value={config.providerId}
                  onChange={(e) => {
                    const providerId = e.target.value
                    const pc = initialConfig.providerConfigs.find(
                      (p) => p.providerId === providerId
                    )
                    setConfig((c) => {
                      const models = pc?.availableModels ?? []
                      const nextModel =
                        pc?.defaultModel ??
                        resolveSuggestedModel(providerId, models) ??
                        models[0] ??
                        c.model ??
                        'gpt-4o-mini'
                      return { ...c, providerId, model: nextModel }
                    })
                  }}
                >
                  {initialConfig.providerConfigs.map((pc) => (
                    <option key={pc.providerId} value={pc.providerId}>
                      {pc.providerId}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Model</label>
                {(() => {
                  const pc = initialConfig.providerConfigs.find(
                    (p) => p.providerId === config.providerId
                  )
                  const models = pc?.availableModels ?? []
                  const suggested = resolveSuggestedModel(config.providerId, models)
                  if (models.length > 0) {
                    const value = models.includes(config.model)
                      ? config.model
                      : (suggested ?? models[0] ?? '')
                    return (
                      <select
                        className="mt-1 w-full rounded border bg-background px-3 py-2"
                        value={value}
                        onChange={(e) =>
                          setConfig((c) => ({ ...c, model: e.target.value }))
                        }
                      >
                        {groupAndSortModels(models).map((group) => (
                          <optgroup key={group.label} label={group.label}>
                            {group.models.map((id) => (
                              <option
                                key={id}
                                value={id}
                                title={
                                  getModelDescription(config.providerId, id) ??
                                  undefined
                                }
                              >
                                {id}
                                {suggested === id ? ' — Suggested' : ''}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    )
                  }
                  return (
                    <input
                      className="mt-1 w-full rounded border bg-background px-3 py-2"
                      value={config.model}
                      onChange={(e) =>
                        setConfig((c) => ({ ...c, model: e.target.value }))
                      }
                      placeholder="gpt-4o-mini"
                    />
                  )
                })()}
              </div>
              <div>
                <label className="text-sm font-medium">Rerun mode</label>
                <select
                  className="mt-1 w-full rounded border bg-background px-3 py-2"
                  value={config.rerunMode}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      rerunMode: e.target.value as 'rerun' | 'update_context',
                    }))
                  }
                >
                  <option value="rerun">Rerun (reuse snapshot)</option>
                  <option value="update_context">Update context and rerun</option>
                </select>
              </div>
              <Button
                onClick={handleSynthesize}
                disabled={isStreaming || initialConfig.providerConfigs.length === 0}
              >
                {isStreaming ? (
                <>
                  <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                  Running…
                </>
              ) : (
                <>
                  <Sparkles className="size-4 shrink-0" aria-hidden />
                  Synthesize
                </>
              )}
              </Button>
            </div>
            <div className="flex flex-1 flex-col overflow-hidden min-h-0">
              <label className="text-sm font-medium shrink-0">Source preview</label>
              <textarea
                readOnly
                className="mt-1 flex-1 w-full resize-none overflow-y-auto overflow-x-hidden rounded border bg-muted/30 p-2 text-xs font-mono"
                value={initialConfig.sourcePreview}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isStreaming ? (
                <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
              ) : (
                <Sparkles className="size-4 shrink-0" aria-hidden />
              )}
              Processing
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {isStreaming
                ? 'Extracting systems and system details from the session…'
                : 'Starting…'}
            </p>
          </CardHeader>
          <CardContent className="space-y-4 border-t border-border pt-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium flex items-center gap-1.5">
                <FileText className="size-3.5 shrink-0" aria-hidden />
                Request
              </h3>
              <div className="rounded-md border border-border bg-muted/20 overflow-hidden">
                {promptUsed != null ? (
                  <pre
                    className="max-h-48 overflow-auto whitespace-pre-wrap p-3 text-xs font-mono"
                    aria-label="Request prompt"
                  >
                    {promptUsed}
                  </pre>
                ) : (
                  <p className="p-3 text-sm text-muted-foreground">
                    {isStreaming ? 'Waiting for request…' : '—'}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium flex items-center gap-1.5">
                <FileText className="size-3.5 shrink-0" aria-hidden />
                Response
              </h3>
              <div className="rounded-md border border-border bg-muted/20 overflow-hidden">
                <pre
                  ref={streamingResponseRef}
                  className="max-h-64 overflow-auto whitespace-pre-wrap p-3 text-xs font-mono"
                  aria-label="Streaming AI response"
                >
                  {streamingText || (isStreaming ? '…' : '—')}
                </pre>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium flex items-center gap-1.5">
                <Layers className="size-3.5 shrink-0" aria-hidden />
                Extracted systems
              </h3>
              {extractedSystems.length === 0 ? (
                <div className="rounded-md border border-border bg-muted/20 p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    {isStreaming ? 'Waiting for systems…' : '—'}
                  </p>
                </div>
              ) : (
                <ExtractionAccordion
                  extractedSystems={extractedSystems}
                  extractedSystemDetails={extractedSystemDetails}
                  expandedValue={expandedSystemValues}
                  onExpandedChange={setExpandedSystemValues}
                  isStreaming={isStreaming}
                  selectedSystemIndices={[]}
                  onToggleSystemSelection={() => {}}
                />
              )}
            </div>
            {runDurationMs != null && (
              <p className="text-sm text-muted-foreground">
                Run duration: {(runDurationMs / 1000).toFixed(1)}s
                {tokenCount && (
                  <> · Tokens: {tokenCount.prompt ?? 0} prompt, {tokenCount.completion ?? 0} completion</>
                )}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {runError ? (
            <>
              <CardHeader>
                <CardTitle>Review output</CardTitle>
                <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm">
                  <p className="font-medium text-destructive">Synthesis failed</p>
                  <p className="mt-1 text-destructive/90">{runError}</p>
                  {(runError.includes('429') ||
                    runError.toLowerCase().includes('quota') ||
                    runError.toLowerCase().includes('billing')) && (
                    <p className="mt-2 text-muted-foreground">
                      This usually means your API quota or billing limit was exceeded.
                      Check your provider plan and billing, or go back to Configure to
                      try another provider.
                    </p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      setRunError(null)
                      goToStep(0)
                    }}
                  >
                    Back to Configure
                  </Button>
                </div>
              </CardHeader>
            </>
          ) : (
            <Tabs defaultValue="extraction" className="flex min-h-0 w-full flex-1 flex-col">
              <CardHeader className="flex shrink-0 flex-row items-center justify-between gap-4 py-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardList className="size-4 shrink-0" aria-hidden />
                  Review output
                </CardTitle>
                <TabsList variant="line" className="h-8 shrink-0">
                  <TabsTrigger value="extraction" className="text-xs flex items-center gap-1.5">
                    <Layers className="size-3.5 shrink-0" aria-hidden />
                    Extraction
                  </TabsTrigger>
                  <TabsTrigger value="prompt-raw" className="text-xs flex items-center gap-1.5">
                    <Code className="size-3.5 shrink-0" aria-hidden />
                    Prompt &amp; raw
                  </TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden border-t border-border px-6 py-3">
                <TabsContent value="extraction" className="mt-0 flex min-h-0 flex-1 flex-col space-y-4 overflow-y-auto pt-0">
                  <div className="pb-4">
                    <h3 className="text-sm font-medium flex items-center gap-1.5">
                      <MessageSquare className="size-3.5 shrink-0" aria-hidden />
                      Refine
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {selectedSystemIndices.length === 0
                        ? 'Refining with no systems selected will refine the entire extraction.'
                        : `Refining ${selectedSystemIndices.length} selected system(s) only. Select none to refine all.`}
                    </p>
                    {refineError && (
                      <p className="mt-2 text-sm text-destructive">
                        {refineError}
                      </p>
                    )}
                    {isRefining && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Refining…
                      </p>
                    )}
                    {lastRefineOutput && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-muted-foreground">
                          Last AI response (raw)
                        </summary>
                        <pre className="mt-1 max-h-64 overflow-auto whitespace-pre-wrap rounded border bg-muted/30 p-2 text-xs">
                          {lastRefineOutput}
                        </pre>
                      </details>
                    )}
                    <div className="mt-2 max-h-48 space-y-2 overflow-auto rounded border bg-muted/30 p-2">
                      {refineMessages.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          No messages yet. Type a request below.
                        </p>
                      )}
                      {refineMessages.map((m, i) => (
                        <div
                          key={i}
                          className={cn(
                            'rounded px-2 py-1 text-sm',
                            m.role === 'user'
                              ? 'bg-primary/10 text-primary-foreground ml-4'
                              : 'bg-muted mr-4'
                          )}
                        >
                          <span className="font-medium text-xs">
                            {m.role === 'user' ? 'You' : 'AI'}:
                          </span>{' '}
                          {m.role === 'assistant' &&
                          m.content === 'Updated extraction applied.'
                            ? 'Updated extraction applied.'
                            : m.content.slice(0, 200)}
                          {m.role === 'assistant' &&
                            m.content !== 'Updated extraction applied.' &&
                            m.content.length > 200 &&
                            '…'}
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <input
                        className="min-w-0 flex-1 rounded border bg-background px-3 py-2 text-sm"
                        value={refineInput}
                        onChange={(e) => setRefineInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleRefineSubmit()
                          }
                        }}
                        placeholder="e.g. Merge Combat and Abilities into one system"
                        disabled={isRefining}
                      />
                      <Button
                        size="sm"
                        onClick={handleRefineSubmit}
                        disabled={isRefining || !refineInput.trim()}
                      >
                        {isRefining ? (
                          <>
                            <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
                            Refining…
                          </>
                        ) : (
                          <>
                            <Send className="size-3.5 shrink-0" aria-hidden />
                            Refine
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="border-t border-border pt-4 space-y-3">
                    <h3 className="text-sm font-medium flex items-center gap-1.5">
                      <Lightbulb className="size-3.5 shrink-0" aria-hidden />
                      Finalize
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Create selected systems (or merge into existing). Use Get AI suggestion to fill create/merge/discard and interaction links.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGetSuggestion}
                        disabled={isSuggesting || !outputId}
                      >
                        {isSuggesting ? (
                          <>
                            <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
                            Getting suggestion…
                          </>
                        ) : (
                          <>
                            <Lightbulb className="size-3.5 shrink-0" aria-hidden />
                            Get AI suggestion
                          </>
                        )}
                      </Button>
                      {convertSuggestion && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleApplySuggestion}
                        >
                          <Check className="size-3.5 shrink-0" aria-hidden />
                          Apply suggestion
                        </Button>
                      )}
                      {suggestError && (
                        <span className="text-sm text-destructive">{suggestError}</span>
                      )}
                    </div>
                    {(suggestPromptSummary || convertSuggestion) && (
                      <p className="text-xs text-muted-foreground">
                        Based on{' '}
                        <strong>
                          {suggestPromptSummary?.candidateCount ?? extractedSystems.length}
                        </strong>{' '}
                        candidates and{' '}
                        <strong>
                          {suggestPromptSummary?.existingCount ?? existingSystemsForSuggest.length}
                        </strong>{' '}
                        existing systems.
                        {suggestUserPrompt && (
                          <>
                            {' '}
                            <button
                              type="button"
                              onClick={() => setShowSuggestPrompt((v) => !v)}
                              className="underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-ring rounded"
                            >
                              {showSuggestPrompt ? 'Hide prompt' : 'Show prompt'}
                            </button>
                          </>
                        )}
                      </p>
                    )}
                    {showSuggestPrompt && suggestUserPrompt && (
                      <div className="rounded-md border border-border bg-muted/20 p-3 text-xs space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-muted-foreground font-medium">What we sent the AI</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleCopy(suggestUserPrompt, 'suggest-prompt')}
                            aria-label="Copy prompt"
                          >
                            {copyId === 'suggest-prompt' ? (
                              <Check className="size-3.5 text-green-600" aria-hidden />
                            ) : (
                              <Copy className="size-3.5" aria-hidden />
                            )}
                          </Button>
                        </div>
                        <pre className="whitespace-pre-wrap font-sans text-muted-foreground overflow-x-hidden max-h-40 overflow-y-auto">
                          {suggestUserPrompt}
                        </pre>
                      </div>
                    )}
                    {convertSuggestion && (
                      <div className="rounded-md border border-border bg-muted/30 p-3 text-sm space-y-2">
                        <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide">
                          AI suggestion
                        </p>
                        <ul className="space-y-1.5 text-xs">
                          {convertSuggestion.create.length > 0 && (
                            <li>
                              <span className="text-muted-foreground">Create:</span>{' '}
                              {convertSuggestion.create
                                .map((i) => extractedSystems[i]?.name ?? extractedSystems[i]?.systemSlug ?? `#${i}`)
                                .join(', ')}
                            </li>
                          )}
                          {convertSuggestion.merge.length > 0 && (
                            <li>
                              <span className="text-muted-foreground">Merge:</span>{' '}
                              {convertSuggestion.merge
                                .map(
                                  (m) =>
                                    `${extractedSystems[m.candidateIndex]?.name ?? extractedSystems[m.candidateIndex]?.systemSlug ?? `#${m.candidateIndex}`} → ${m.intoExistingSlug}`
                                )
                                .join('; ')}
                            </li>
                          )}
                          {convertSuggestion.discard.length > 0 && (
                            <li>
                              <span className="text-muted-foreground">Discard:</span>{' '}
                              {convertSuggestion.discard
                                .map((i) => extractedSystems[i]?.name ?? extractedSystems[i]?.systemSlug ?? `#${i}`)
                                .join(', ')}
                            </li>
                          )}
                          {convertSuggestion.dependencies && convertSuggestion.dependencies.length > 0 && (
                            <li>
                              <span className="text-muted-foreground">Interaction links:</span>{' '}
                              {convertSuggestion.dependencies
                                .map((d) =>
                                  `${d.sourceSlug} → ${d.targetSlug}${d.description ? ` (${d.description})` : ''}`
                                )
                                .join('; ')}
                            </li>
                          )}
                          {convertSuggestion.create.length === 0 &&
                            convertSuggestion.merge.length === 0 &&
                            convertSuggestion.discard.length === 0 &&
                            (!convertSuggestion.dependencies || convertSuggestion.dependencies.length === 0) && (
                              <li className="text-muted-foreground">No create/merge/discard or interaction links suggested.</li>
                            )}
                        </ul>
                        {convertSuggestion.rationale && (
                          <div className="pt-2 mt-2 border-t border-border">
                            <p className="text-xs text-muted-foreground font-medium mb-1">Why</p>
                            <p className="text-xs text-muted-foreground">{convertSuggestion.rationale}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {convertError && (
                      <p className="text-sm text-destructive">{convertError}</p>
                    )}
                    <Button
                      onClick={handleConvert}
                      disabled={isConverting || !outputId}
                    >
                      {isConverting ? (
                        <>
                          <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                          Creating…
                        </>
                      ) : (
                        <>
                          <Database className="size-4 shrink-0" aria-hidden />
                          Create selected
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="border-t border-border pt-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="text-sm font-medium flex items-center gap-1.5">
                          <Layers className="size-3.5 shrink-0" aria-hidden />
                          Extracted systems
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Select systems to include in finalize (and to refine only those). Expand to see details and optionally exclude individual details from finalize.
                        </p>
                      </div>
                      {extractedSystems.length > 0 && (
                        <div className="flex items-center gap-2 shrink-0 ml-auto mr-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedSystemIndices(extractedSystems.map((_, idx) => idx))}
                            disabled={selectedSystemIndices.length === extractedSystems.length}
                          >
                            <PlusCircle className="size-3.5 shrink-0" aria-hidden />
                            Add all
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedSystemIndices([])}
                            disabled={selectedSystemIndices.length === 0}
                          >
                            <MinusCircle className="size-3.5 shrink-0" aria-hidden />
                            Exclude all
                          </Button>
                        </div>
                      )}
                    </div>
                    <ExtractionAccordion
                      extractedSystems={extractedSystems}
                      extractedSystemDetails={extractedSystemDetails}
                      expandedValue={expandedSystemValues}
                      onExpandedChange={setExpandedSystemValues}
                      showSelectionAndFinalize={true}
                      selectedSystemIndices={selectedSystemIndices}
                      onToggleSystemSelection={handleToggleSystemSelection}
                      excludedDetailIndices={excludedDetailIndices}
                      onToggleDetailExclude={handleToggleDetailExclude}
                      systemStatus={systemStatus}
                      detailStatus={detailStatus}
                      interactionEdges={reviewInteractionEdges}
                      onRemoveInteraction={handleRemoveInteraction}
                      effectiveSourceSlugByIndex={effectiveSourceSlugByIndex}
                      getLabelForSlug={getLabelForSlug}
                    />
                    {suggestedSystems.length > 0 && (
                      <div className="mt-6 rounded-md border border-border border-l-4 border-l-primary/50 bg-muted/30 p-4">
                        <h3 className="text-sm font-medium flex items-center gap-1.5 mb-2">
                          <Lightbulb className="size-3.5 shrink-0 text-primary" aria-hidden />
                          Suggested systems (fill gaps)
                        </h3>
                        <p className="text-xs text-muted-foreground mb-3">
                          These systems were suggested to fill design gaps. Add them to extraction to include in Create selected.
                        </p>
                        <Accordion
                          type="multiple"
                          value={expandedSuggestedValues}
                          onValueChange={setExpandedSuggestedValues}
                          className="mt-2"
                        >
                          {suggestedSystems.map((s, i) => {
                            const detailsForSystem = getSystemDetailsForSystem(
                              s,
                              i,
                              suggestedSystemDetails,
                              suggestedSystems
                            )
                            return (
                              <AccordionItem
                                key={i}
                                value={`suggested-${i}`}
                                className="border border-border/60 rounded-md bg-background/60 mb-2 overflow-hidden"
                              >
                                <AccordionPrimitive.Header className="flex items-center gap-2">
                                  <AccordionPrimitive.Trigger className="flex flex-1 items-center gap-2 py-3 px-3 text-left text-sm font-medium transition-all outline-none hover:no-underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&[data-state=open]>svg]:rotate-180 min-h-[3rem] [&>svg]:shrink-0">
                                    <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                                    <div className="flex flex-1 flex-col items-start gap-0.5 min-w-0 text-left">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-base font-medium">
                                          {s.name ?? s.systemSlug ?? 'Unnamed'}
                                        </span>
                                        <Badge variant="secondary" className="text-xs font-normal gap-1 bg-primary/10 text-primary border-primary/20">
                                          <Lightbulb className="size-3 shrink-0" aria-hidden />
                                          Suggestion
                                        </Badge>
                                      </div>
                                      {s.purpose && (
                                        <span className="text-sm font-normal text-muted-foreground">
                                          {(s.purpose as string).slice(0, 120)}
                                          {(s.purpose as string).length > 120 ? '…' : ''}
                                        </span>
                                      )}
                                      {(s.dependencies ?? []).length > 0 ? (
                                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                          <span className="text-xs text-muted-foreground">Interacts with:</span>
                                          {(s.dependencies ?? []).map((entry) => {
                                            const { slug } = normalizeDependencyEntry(entry)
                                            return (
                                              <Badge key={slug} variant="secondary" className="text-xs font-normal px-1.5 py-0">
                                                {slug}
                                              </Badge>
                                            )
                                          })}
                                        </div>
                                      ) : null}
                                    </div>
                                  </AccordionPrimitive.Trigger>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="default"
                                    className="shrink-0 mr-2"
                                    disabled={isAddingSuggested}
                                    onClick={() => handleAddSuggestedToExtraction(i)}
                                  >
                                    {isAddingSuggested ? (
                                      <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
                                    ) : (
                                      <PlusCircle className="size-3.5 shrink-0" aria-hidden />
                                    )}
                                    Add to extraction
                                  </Button>
                                </AccordionPrimitive.Header>
                                <AccordionContent className="border-t border-border/60 bg-muted/20 px-4 py-3">
                                  <div className="space-y-4">
                                    <section className="rounded-md border border-border bg-background/80 p-3">
                                      <h4 className="text-sm font-medium">System details</h4>
                                      {detailsForSystem.length === 0 ? (
                                        <p className="mt-1 text-xs text-muted-foreground">No system details.</p>
                                      ) : (
                                        <ul className="mt-2 space-y-3">
                                          {detailsForSystem.map((b, bi) => (
                                            <li key={bi} className="rounded-md border border-border/50 bg-muted/10 p-2">
                                              <div className="mb-1 text-xs text-muted-foreground">
                                                {b.name} ({b.detailType ?? 'mechanic'})
                                              </div>
                                              <p className="whitespace-pre-wrap text-xs text-foreground">{b.spec ?? '—'}</p>
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                    </section>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            )
                          })}
                        </Accordion>
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="prompt-raw" className="mt-0 flex min-h-0 min-w-0 flex-1 flex-col space-y-4 overflow-y-auto pt-0">
                  <div className="rounded-md border border-border bg-muted/20 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-medium">Prompt used</h3>
                      {promptUsed != null && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => handleCopy(promptUsed, 'prompt')}
                          aria-label="Copy to clipboard"
                        >
                          {copyId === 'prompt' ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                    {promptUsed != null ? (
                      <div className="mt-2 max-h-80 min-w-0 overflow-auto rounded border bg-background text-xs">
                        <SyntaxHighlighter
                          language="text"
                          style={oneDark}
                          customStyle={{
                            margin: 0,
                            padding: '0.75rem',
                            fontSize: '0.75rem',
                            background: 'transparent',
                          }}
                          PreTag="pre"
                          codeTagProps={{ className: 'whitespace-pre-wrap' }}
                        >
                          {promptUsed}
                        </SyntaxHighlighter>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Prompt not stored for this run.
                      </p>
                    )}
                  </div>
                  <div className="rounded-md border border-border bg-muted/20 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-medium">Raw output</h3>
                      {rawOutput != null && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => handleCopy(rawOutput, 'raw')}
                          aria-label="Copy to clipboard"
                        >
                          {copyId === 'raw' ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                    {rawOutput != null ? (
                      <div className="mt-2 max-h-96 min-w-0 overflow-auto rounded border bg-background text-xs">
                        <SyntaxHighlighter
                          language="json"
                          style={oneDark}
                          customStyle={{
                            margin: 0,
                            padding: '0.75rem',
                            fontSize: '0.75rem',
                            background: 'transparent',
                          }}
                          PreTag="pre"
                          codeTagProps={{ className: 'whitespace-pre-wrap' }}
                        >
                          {formattedRawOutput}
                        </SyntaxHighlighter>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Loading…
                      </p>
                    )}
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          )}
        </Card>
      )}

      </div>

      <aside className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <CardHeader className="flex shrink-0 flex-row items-center justify-between gap-4 py-3">
            <CardTitle className="text-base">Markdown preview</CardTitle>
            <Tabs
              value={markdownViewMode}
              onValueChange={(v) => setMarkdownViewMode(v as 'preview' | 'source')}
              className="w-auto"
            >
              <TabsList variant="line" className="h-8">
                <TabsTrigger value="preview" className="text-xs flex items-center gap-1.5">
                  <Eye className="size-3.5 shrink-0" aria-hidden />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="source" className="text-xs flex items-center gap-1.5">
                  <Code className="size-3.5 shrink-0" aria-hidden />
                  Source
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden border-t border-border py-3">
            {extractedSystems.length === 0 && extractedSystemDetails.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Run synthesis to see preview.
              </p>
            ) : markdownViewMode === 'preview' ? (
              <div className="markdown-preview text-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {markdownPreview}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="relative max-h-full min-h-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 z-10 h-8 w-8 shrink-0 bg-background/80"
                  onClick={() => handleCopy(markdownPreview, 'markdown')}
                  aria-label="Copy to clipboard"
                >
                  {copyId === 'markdown' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <div className="max-h-full overflow-auto rounded border bg-muted/30 text-xs pr-12">
                  <SyntaxHighlighter
                    language="markdown"
                    style={oneDark}
                    customStyle={{
                      margin: 0,
                      padding: '1rem',
                      fontSize: '0.75rem',
                      background: 'transparent',
                    }}
                    PreTag="pre"
                    codeTagProps={{ className: 'whitespace-pre-wrap' }}
                  >
                    {markdownPreview}
                  </SyntaxHighlighter>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
    </div>
  )
}
