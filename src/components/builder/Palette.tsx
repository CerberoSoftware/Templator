import { useEffect } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { Trash2 } from 'lucide-react'
import {
  AlignLeft,
  Blocks,
  Columns2,
  Footprints,
  Heading1,
  Image as ImageIcon,
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

const ICONS: Record<BlockType, typeof Type> = {
  header: PanelTop,
  heading: Heading1,
  text: AlignLeft,
  image: ImageIcon,
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
  const Icon = ICONS[type]
  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex cursor-grab items-center gap-2.5 rounded-lg border border-ice-200 bg-white px-3 py-2 text-left text-sm text-ink-900 transition hover:border-primary hover:bg-primary-soft active:cursor-grabbing ${isDragging ? 'opacity-40' : ''}`}
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
  useEffect(() => {
    void loadComponents()
  }, [loadComponents])

  const categories = new Map<string, Array<{ type: BlockType; label: string }>>()
  for (const def of REGISTRY_ORDER) {
    const list = categories.get(def.category) ?? []
    list.push({ type: def.type, label: def.label })
    categories.set(def.category, list)
  }
  return (
    <aside className="flex w-60 shrink-0 flex-col gap-5 overflow-y-auto border-r border-ice-200 bg-white px-3 py-4">
      <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-ink-400">Blocks</h2>
      {[...categories.entries()].map(([category, items]) => (
        <div key={category} className="flex flex-col gap-1.5">
          <h3 className="px-1 text-[11px] font-medium uppercase tracking-wider text-ink-600">{category}</h3>
          {items.map((it) => (
            <PaletteItem key={it.type} type={it.type} label={it.label} />
          ))}
        </div>
      ))}
      <div className="flex flex-col gap-1.5">
        <h3 className="px-1 text-[11px] font-medium uppercase tracking-wider text-ink-600">My components</h3>
        {components.length === 0 && (
          <p className="px-1 text-[11px] leading-snug text-ink-400">
            Select a block, then use “Save as component” to reuse it here.
          </p>
        )}
        {components.map((c) => (
          <ComponentItem key={c.id} id={c.id} name={c.name} />
        ))}
      </div>
    </aside>
  )
}
