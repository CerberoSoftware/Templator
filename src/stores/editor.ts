import { create } from 'zustand'
import {
  type Block,
  type BlockType,
  type EmailDoc,
  emptyDoc,
  findBlock,
  cloneBlock,
  uid,
} from '../builder/model'
import { REGISTRY } from '../builder/blocks'

export interface ListPath {
  scope: 'root' | 'column'
  blockId?: string
  column?: 0 | 1
}

export interface DropTarget {
  path: ListPath
  index: number
}

interface EditorState {
  templateId: number
  templateName: string
  doc: EmailDoc
  selectedId: string | null
  dirty: boolean
  saving: boolean
  lastSavedAt: string | null
  lastSavedDoc: EmailDoc | null
  past: EmailDoc[]
  future: EmailDoc[]
  load: (templateId: number, name: string, doc: EmailDoc) => void
  replaceDoc: (doc: EmailDoc) => void
  setName: (name: string) => void
  select: (id: string | null) => void
  insertBlock: (type: BlockType, target: DropTarget) => void
  insertBlocks: (blocks: Block[], target: DropTarget) => void
  moveBlock: (id: string, target: DropTarget) => void
  removeBlock: (id: string) => void
  duplicateBlock: (id: string) => void
  updateProps: (id: string, partial: Record<string, unknown>) => void
  updateSettings: (partial: Partial<EmailDoc['settings']>) => void
  undo: () => void
  redo: () => void
  markSaved: (at: string) => void
  setSaving: (saving: boolean) => void
}

const HISTORY_LIMIT = 100
const HISTORY_DEBOUNCE_MS = 400
let lastHistoryPush = 0
let lastSavedJson: string | null = null

function isDirty(doc: EmailDoc): boolean {
  if (lastSavedJson === null) return true
  try {
    return JSON.stringify(doc) !== lastSavedJson
  } catch {
    return true
  }
}

function withHistory(state: EditorState, doc: EmailDoc): Partial<EditorState> {
  lastHistoryPush = Date.now()
  return {
    doc,
    past: [...state.past, state.doc].slice(-HISTORY_LIMIT),
    future: [],
    dirty: isDirty(doc),
  }
}

function withoutHistory(doc: EmailDoc): Partial<EditorState> {
  return {
    doc,
    future: [],
    dirty: isDirty(doc),
  }
}

function listFor(doc: EmailDoc, path: ListPath): Block[] {
  if (path.scope === 'root') return doc.blocks
  const ref = path.blockId != null ? findBlock(doc, path.blockId) : null
  if (ref && ref.block.type === 'twocol') return ref.block.columns[path.column ?? 0]
  return doc.blocks
}

function canPlace(type: BlockType, path: ListPath): boolean {
  if (type !== 'twocol') return true
  return path.scope === 'root'
}

function removeById(blocks: Block[], id: string): { blocks: Block[]; removed: Block | null } {
  const out: Block[] = []
  let removed: Block | null = null
  for (const b of blocks) {
    if (b.id === id) {
      removed = b
      continue
    }
    if (b.type === 'twocol') {
      const c0 = removeById(b.columns[0], id)
      const c1 = removeById(b.columns[1], id)
      if (c0.removed) removed = c0.removed
      if (c1.removed) removed = c1.removed
      out.push({ ...b, columns: [c0.blocks, c1.blocks] })
    } else {
      out.push(b)
    }
  }
  return { blocks: out, removed }
}

function insertIntoList(blocks: Block[], index: number, block: Block): Block[] {
  const out = [...blocks]
  out.splice(Math.max(0, Math.min(index, out.length)), 0, block)
  return out
}

export const useEditor = create<EditorState>((set) => ({
  templateId: 0,
  templateName: '',
  doc: emptyDoc(),
  selectedId: null,
  dirty: false,
  saving: false,
  lastSavedAt: null,
  lastSavedDoc: null,
  past: [],
  future: [],

  load: (templateId, name, doc) => {
    lastSavedJson = JSON.stringify(doc)
    lastHistoryPush = 0
    return set({ templateId, templateName: name, doc, selectedId: null, dirty: false, past: [], future: [], lastSavedAt: null, lastSavedDoc: structuredClone(doc) })
  },
  replaceDoc: (doc) =>
    set((state) => ({ ...withHistory(state, doc), selectedId: null })),
  setName: (name) => set({ templateName: name, dirty: true }),
  select: (id) => set({ selectedId: id }),

  insertBlock: (type, target) =>
    set((state) => {
      if (!canPlace(type, target.path)) return {}
      const block = createBlockOf(type)
      const doc = structuredClone(state.doc)
      const list = listFor(doc, target.path)
      const index = target.path.scope === 'root' ? target.index : target.index
      const newList = insertIntoList(list, index, block)
      if (target.path.scope === 'root') doc.blocks = newList
      else {
        const ref = findBlock(doc, target.path.blockId!)
        if (!ref || ref.block.type !== 'twocol') return {}
        ref.block.columns[target.path.column ?? 0] = newList
      }
      return { ...withHistory(state, doc), selectedId: block.id }
    }),

  insertBlocks: (blocks, target) =>
    set((state) => {
      const placeable = blocks.filter((b) => canPlace(b.type, target.path))
      if (placeable.length === 0) return {}
      const doc = structuredClone(state.doc)
      let list = [...listFor(doc, target.path)]
      let index = Math.max(0, Math.min(target.index, list.length))
      for (const block of placeable) {
        list = insertIntoList(list, index, block)
        index++
      }
      if (target.path.scope === 'root') doc.blocks = list
      else {
        const ref = findBlock(doc, target.path.blockId!)
        if (!ref || ref.block.type !== 'twocol') return {}
        ref.block.columns[target.path.column ?? 0] = list
      }
      return { ...withHistory(state, doc), selectedId: placeable[placeable.length - 1].id }
    }),

  moveBlock: (id, target) =>
    set((state) => {
      const ref = findBlock(state.doc, id)
      if (!ref) return {}
      const current: ListPath =
        ref.container && ref.container.type === 'twocol'
          ? { scope: 'column', blockId: ref.container.id, column: ref.columnIndex as 0 | 1 }
          : { scope: 'root' }
      const sameList = current.scope === target.path.scope && current.blockId === target.path.blockId
      if (!canPlace(ref.block.type, target.path)) return {}
      if (sameList && (target.index === ref.index || target.index === ref.index + 1)) return {}
      const doc = structuredClone(state.doc)
      const { blocks: without, removed } = removeById(doc.blocks, id)
      if (!removed) return {}
      doc.blocks = without
      const list = listFor(doc, target.path)
      const adjusted = sameList && ref.index < target.index ? target.index - 1 : target.index
      const newList = insertIntoList(list, adjusted, removed)
      if (target.path.scope === 'root') doc.blocks = newList
      else {
        const targetRef = findBlock(doc, target.path.blockId!)
        if (!targetRef || targetRef.block.type !== 'twocol') return {}
        targetRef.block.columns[target.path.column ?? 0] = newList
      }
      return { ...withHistory(state, doc), selectedId: id }
    }),

  removeBlock: (id) =>
    set((state) => {
      const doc = structuredClone(state.doc)
      const { blocks } = removeById(doc.blocks, id)
      doc.blocks = blocks
      return { ...withHistory(state, doc), selectedId: state.selectedId === id ? null : state.selectedId }
    }),

  duplicateBlock: (id) =>
    set((state) => {
      const ref = findBlock(state.doc, id)
      if (!ref) return {}
      const copy = cloneBlock(ref.block)
      const doc = structuredClone(state.doc)
      const target: ListPath =
        ref.container && ref.container.type === 'twocol'
          ? { scope: 'column', blockId: ref.container.id, column: ref.columnIndex as 0 | 1 }
          : { scope: 'root' }
      const list = listFor(doc, target)
      const newList = insertIntoList(list, ref.index + 1, copy)
      if (target.scope === 'root') doc.blocks = newList
      else {
        const tRef = findBlock(doc, target.blockId!)
        if (!tRef || tRef.block.type !== 'twocol') return {}
        tRef.block.columns[target.column ?? 0] = newList
      }
      return { ...withHistory(state, doc), selectedId: copy.id }
    }),

  updateProps: (id, partial) =>
    set((state) => {
      const ref = findBlock(state.doc, id)
      if (!ref) return {}
      const doc = structuredClone(state.doc)
      const fresh = findBlock(doc, id)
      if (!fresh) return {}
      fresh.block.props = { ...fresh.block.props, ...partial }
      const now = Date.now()
      if (now - lastHistoryPush < HISTORY_DEBOUNCE_MS && state.past.length > 0) {
        return withoutHistory(doc)
      }
      return withHistory(state, doc)
    }),

  updateSettings: (partial) =>
    set((state) => {
      const doc = structuredClone(state.doc)
      doc.settings = { ...doc.settings, ...partial }
      const now = Date.now()
      if (now - lastHistoryPush < HISTORY_DEBOUNCE_MS && state.past.length > 0) {
        return withoutHistory(doc)
      }
      return withHistory(state, doc)
    }),

  undo: () =>
    set((state) => {
      if (state.past.length === 0) return {}
      const previous = state.past[state.past.length - 1]
      const nextSelected = state.selectedId && findBlock(previous, state.selectedId) ? state.selectedId : null
      return {
        doc: previous,
        past: state.past.slice(0, -1),
        future: [state.doc, ...state.future].slice(0, HISTORY_LIMIT),
        selectedId: nextSelected,
        dirty: isDirty(previous),
      }
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0) return {}
      const next = state.future[0]
      const nextSelected = state.selectedId && findBlock(next, state.selectedId) ? state.selectedId : null
      return {
        doc: next,
        past: [...state.past, state.doc].slice(-HISTORY_LIMIT),
        future: state.future.slice(1),
        selectedId: nextSelected,
        dirty: isDirty(next),
      }
    }),

  markSaved: (at) => {
    const doc = useEditor.getState().doc
    lastSavedJson = JSON.stringify(doc)
    return set({ dirty: false, lastSavedAt: at, lastSavedDoc: structuredClone(doc) })
  },
  setSaving: (saving) => set({ saving }),
}))

function createBlockOf(type: BlockType): Block {
  const def = REGISTRY[type]
  const block = { id: uid(), type, props: def.defaults() } as Block
  if (type === 'twocol') {
    ;(block as Block & { columns: [Block[], Block[]] }).columns = [[], []]
  }
  return block
}
