import { useEffect, useMemo, useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { Search, Trash2 } from 'lucide-react'
import {
  AlignLeft,
  Blocks,
  Columns2,
  Footprints,
  Heading1,
  Image as ImageIcon,
  LayoutPanelLeft,
  PanelTop,
  Link2,
  Minus,
  MoveVertical,
  Square,
  Type,
} from 'lucide-react'
import type { BlockType } from '../../builder/model'
import { REGISTRY_ORDER } from '../../builder/blocks'
import type { ActiveDrag } from './Canvas'
import { useComponents } from '../../stores/components'
import { useEditor } from '../../stores/editor'
import { useResizableWidth } from './useResizableWidth'

const ICONS: Record<BlockType, typeof Type> = {
  header: PanelTop,
  heading: Heading1,
  text: AlignLeft,
  image: ImageIcon,
  image_text: LayoutPanelLeft,
  button: Square,
  spacer: MoveVertical,
  divider: Minus,
  social: Link2,
  twocol: Columns2,
  footer: Footprints,
  raw: Type,
}

function PaletteItem({ type, label }: { type: BlockType; label: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { kind: 'new', type } satisfies ActiveDrag,
  })
  const Icon = ICONS[type] ?? Type
  const insertBlock = useEditor((s) => s.insertBlock)
  const handleInsert = () => insertBlock(type, { path: { scope: 'root' }, index: useEditor.getState().doc.blocks.length })
  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        // If drag didn't start, click inserts at end
        if ((e.target as HTMLElement).closest('[data-drag-handle]')) return
        handleInsert()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleInsert()
        }
      }}
      className={`flex cursor-grab items-center gap-2.5 rounded-lg border border-ice-200 bg-white px-3 py-2 text-left text-sm text-ink-900 transition hover:border-primary hover:bg-primary-soft active:cursor-grabbing focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${isDragging ? 'opacity-40' : ''}`}
      title="Drag to canvas or click to add at end, Enter to add"
      aria-label={`Add ${label} block`}
    >
      <Icon className="size-4 shrink-0 text-primary" />
      <span className="truncate">{label}</span>
    </button>
  )
}

function ComponentItem({ id, name }: { id: number; name: string }) {
  const removeComponent = useComponents((s) => s.remove)
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `component-${id}`,
    data: { kind: 'component', componentId: id, name } satisfies ActiveDrag,
  })
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`group flex cursor-grab items-center gap-2.5 rounded-lg border border-ice-200 bg-white px-3 py-2 text-sm text-ink-900 transition hover:border-primary hover:bg-primary-soft active:cursor-grabbing ${isDragging ? 'opacity-40' : ''}`}
    >
      <Blocks className="size-4 shrink-0 text-secondary" />
      <span className="min-w-0 flex-1 truncate">{name}</span>
      <button
        onClick={(e) => {
          e.stopPropagation()
          void removeComponent(id)
        }}
        onPointerDown={(e) => e.stopPropagation()}
        title="Delete component"
        className="hidden rounded p-1 text-ink-400 transition hover:text-red-600 group-hover:block"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  )
}

export function Palette() {
  const components = useComponents((s) => s.components)
  const loadComponents = useComponents((s) => s.load)
  const insertBlock = useEditor((s) => s.insertBlock)
  const [q, setQ] = useState('')
  const { width, startResize } = useResizableWidth({ initial: 240, min: 180, max: 420, storageKey: 'et-palette-width' })
  useEffect(() => {
    void loadComponents()
  }, [loadComponents])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return REGISTRY_ORDER
    return REGISTRY_ORDER.filter((d) => d.label.toLowerCase().includes(s) || d.type.toLowerCase().includes(s) || d.category.toLowerCase().includes(s))
  }, [q])

  const categories = new Map<string, Array<{ type: BlockType; label: string }>>()
  for (const def of filtered) {
    const list = categories.get(def.category) ?? []
    list.push({ type: def.type, label: def.label })
    categories.set(def.category, list)
  }
  const compFiltered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return components
    return components.filter((c) => c.name.toLowerCase().includes(s) || c.category.toLowerCase().includes(s))
  }, [q, components])

  return (
    <div className="relative flex shrink-0" style={{ width }}>
      <aside className="flex w-full flex-col gap-5 overflow-y-auto border-r border-ice-200 bg-white px-3 py-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-400">Blocks</h2>
        <span className="text-[10px] text-ink-400">{filtered.length} types</span>
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && filtered.length > 0) {
              e.preventDefault()
              insertBlock(filtered[0].type, { path: { scope: 'root' }, index: useEditor.getState().doc.blocks.length })
            }
          }}
          placeholder="Search blocks… (Enter to add first match)"
          className="w-full rounded-lg border border-ice-200 bg-ice-50 py-1.5 pl-8 pr-3 text-xs placeholder:text-ink-400 focus:border-primary focus:bg-white focus:outline-none"
          aria-label="Search blocks"
        />
      </div>
      {[...categories.entries()].map(([category, items]) => (
        <div key={category} className="flex flex-col gap-1.5">
          <h3 className="px-1 text-[11px] font-medium uppercase tracking-wider text-ink-600">{category}</h3>
          {items.map((it) => (
            <PaletteItem key={it.type} type={it.type} label={it.label} />
          ))}
        </div>
      ))}
      {filtered.length === 0 && <p className="px-1 text-xs text-ink-400">No blocks match “{q}”.</p>}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[11px] font-medium uppercase tracking-wider text-ink-600">My components</h3>
          <span className="text-[10px] text-ink-400">{compFiltered.length}</span>
        </div>
        {compFiltered.length === 0 && q && (
          <p className="px-1 text-xs text-ink-400">No components match “{q}”.</p>
        )}
        {compFiltered.length === 0 && !q && (
          <p className="px-1 text-[11px] leading-snug text-ink-400">
            Select a block, then use “Save as component” to reuse it here.
          </p>
        )}
        {compFiltered.map((c) => (
          <ComponentItem key={c.id} id={c.id} name={c.name} />
        ))}
      </div>
      </aside>
      <div
        onPointerDown={startResize('right')}
        className="absolute right-0 top-0 z-10 h-full w-1.5 -translate-x-1/2 cursor-col-resize touch-none hover:bg-primary/30 active:bg-primary/50"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize blocks panel"
      />
    </div>
  )
}
