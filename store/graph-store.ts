import { create } from 'zustand'

export type LayoutAlgorithm = 'dagre' | 'force' | 'tree'
export type CriticalityFilter = 'core' | 'important' | 'later'
export type StatusFilter = 'draft' | 'active' | 'deprecated'

export type GraphState = {
  selectedNodeId: string | null
  highlightedPath: string[]
  layoutAlgorithm: LayoutAlgorithm
  criticalityFilter: CriticalityFilter[]
  statusFilter: StatusFilter[]
  isEdgeEditMode: boolean
  pendingEdgeSource: string | null
}

export type GraphActions = {
  selectNode: (id: string | null) => void
  setHighlightedPath: (path: string[]) => void
  clearHighlight: () => void
  setLayout: (layout: LayoutAlgorithm) => void
  setCriticalityFilter: (values: CriticalityFilter[]) => void
  setStatusFilter: (values: StatusFilter[]) => void
  resetFilters: () => void
  toggleEdgeEditMode: () => void
  setPendingEdgeSource: (id: string | null) => void
  resetEdgeEditMode: () => void
}

const initialState: GraphState = {
  selectedNodeId: null,
  highlightedPath: [],
  layoutAlgorithm: 'dagre',
  criticalityFilter: [],
  statusFilter: [],
  isEdgeEditMode: false,
  pendingEdgeSource: null,
}

export const useGraphStore = create<GraphState & GraphActions>((set) => ({
  ...initialState,

  selectNode: (id) => set({ selectedNodeId: id }),

  setHighlightedPath: (highlightedPath) => set({ highlightedPath }),

  clearHighlight: () => set({ highlightedPath: [] }),

  setLayout: (layoutAlgorithm) => set({ layoutAlgorithm }),

  setCriticalityFilter: (criticalityFilter) => set({ criticalityFilter }),

  setStatusFilter: (statusFilter) => set({ statusFilter }),

  resetFilters: () =>
    set({ criticalityFilter: [], statusFilter: [] }),

  toggleEdgeEditMode: () =>
    set((state) => ({
      isEdgeEditMode: !state.isEdgeEditMode,
      pendingEdgeSource: !state.isEdgeEditMode ? null : state.pendingEdgeSource,
    })),

  setPendingEdgeSource: (id) => set({ pendingEdgeSource: id }),

  resetEdgeEditMode: () =>
    set({ isEdgeEditMode: false, pendingEdgeSource: null }),
}))
