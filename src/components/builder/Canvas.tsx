import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor, useDraggable, useSensor, useSensors, type DragEndEvent, type DragMoveEvent, type DragStartEvent } from '@dnd-kit/core'
import { GripVertical, Copy, Trash2 } from 'lucide-react'
import { renderEmail } from '../../builder/render'
import { type EmailDoc, type BlockType, findBlock } from '../../builder/model'
import { REGISTRY } from '../../builder/blocks'
import { useEditor, type DropTarget, type ListPath } from '../../stores/editor'
import { Palette } from './Palette'

export interface Rect {
  top: number
  left: number
  width: number
  height: number
}

interface BlockRect {
  id: string
  rect: Rect
}

export interface DragData {
  kind: 'new'
  type: BlockType
}

export interface MoveData {
  kind: 'move'
  id: string
}

export interface ComponentDragData {
  kind: 'component'
  componentId: number
  name: string
}

export type ActiveDrag = DragData | MoveData | ComponentDragData

interface CanvasProps {
  onSelect: (id: string | null) => void
  onDrop: (payload: ActiveDrag, target: DropTarget) => void
}

/** Returns a rect relative to the iframe's top-left corner. */
function rectOf(el: HTMLElement, iframeOrigin: { left: number; top: number }): Rect {
  const r = el.getBoundingClientRect()
  return {
    top: r.top - iframeOrigin.top,
    left: r.left - iframeOrigin.left,
    width: r.width,
    height: r.height,
  }
}

function inside(r: Rect, x: number, y: number): boolean {
  return x >= r.left && x <= r.left + r.width && y >= r.top && y <= r.top + r.height
}

/** Drag handle overlay for an existing block */
function BlockHandle({
  id,
  rect,
  isSelected,
  isHovered,
  isAnyActive,
  onSelect,
  onHover,
}: {
  id: string
  rect: Rect
  isSelected: boolean
  isHovered: boolean
  isAnyActive: boolean
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `move-${id}`,
    data: { kind: 'move', id } satisfies ActiveDrag,
  })

  return (
    <div
      ref={setNodeRef}
      data-et-drop-id={id}
      tabIndex={0}
      role="region"
      aria-label={`Block ${id}, press Space to drag`}
      aria-grabbed={isDragging}
      className={`absolute box-border rounded-[3px] outline-offset-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
        isSelected
          ? 'outline outline-2 outline-primary'
          : isHovered
            ? 'outline outline-1 outline-secondary'
            : ''
      } ${isDragging ? 'opacity-30' : ''}`}
      style={{
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: Math.max(rect.height, 6),
        pointerEvents: isAnyActive && !isDragging ? 'none' : 'auto',
        cursor: isDragging ? 'grabbing' : 'default',
      }}
      onPointerOver={() => onHover(id)}
      onPointerOut={() => onHover(null)}
      onFocus={() => onHover(id)}
      onBlur={() => onHover(null)}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !isAnyActive) {
          e.preventDefault()
          onSelect(id)
        }
      }}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(id)
      }}
    >
      {/* Drag handle — 28px hit area, visible on hover/select */}
      {(isHovered || isSelected) && !isAnyActive && (
        <div
          {...listeners}
          {...attributes}
          className="absolute -left-7 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-grab items-center justify-center rounded-md text-ink-400 hover:bg-white hover:shadow-sm hover:text-primary active:cursor-grabbing"
          style={{ pointerEvents: 'auto', touchAction: 'none' }}
          onClick={(e) => e.stopPropagation()}
          title="Drag to reorder"
          aria-label="Drag to reorder"
        >
          <GripVertical className="size-4" />
        </div>
      )}
    </div>
  )
}

export function Canvas({ onSelect, onDrop }: CanvasProps) {
  const doc = useEditor((s) => s.doc)
  const selectedId = useEditor((s) => s.selectedId)
  const duplicateBlock = useEditor((s) => s.duplicateBlock)
  const removeBlock = useEditor((s) => s.removeBlock)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [ready, setReady] = useState(false)
  const [docHeight, setDocHeight] = useState(420)
  const [blockRects, setBlockRects] = useState<BlockRect[]>([])
  const [colRects, setColRects] = useState<Array<{ id: string; column: 0 | 1; rect: Rect }>>([])
  const [contentRect, setContentRect] = useState<Rect | null>(null)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [active, setActive] = useState<ActiveDrag | null>(null)
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  )

  const measure = useCallback(() => {
    const iframe = iframeRef.current
    const idoc = iframe?.contentDocument
    if (!idoc || !iframe) return
    // Use the iframe document's own viewport as origin so rects are
    // iframe-local. Subtracting documentElement (same window as blocks)
    // works both when getBoundingClientRect is iframe-viewport (0-based)
    // and when it is parent-viewport (iframeOrigin) — the delta cancels.
    const rootRect = idoc.documentElement.getBoundingClientRect()
    const origin = { left: rootRect.left, top: rootRect.top }
    const nextBlocks: BlockRect[] = []
    idoc.querySelectorAll<HTMLElement>('[data-et-block]').forEach((el) => {
      const id = el.getAttribute('data-et-block')
      if (id != null) nextBlocks.push({ id, rect: rectOf(el, origin) })
    })
    const nextCols: Array<{ id: string; column: 0 | 1; rect: Rect }> = []
    idoc.querySelectorAll<HTMLElement>('[data-et-col]').forEach((el) => {
      const key = el.getAttribute('data-et-col')
      if (!key) return
      const [blockId, colStr] = key.split(':')
      nextCols.push({ id: blockId, column: colStr === '1' ? 1 : 0, rect: rectOf(el, origin) })
    })
    const content = idoc.querySelector<HTMLElement>('.et-content')
    setBlockRects(nextBlocks)
    setColRects(nextCols)
    setContentRect(content ? rectOf(content, origin) : null)
    setDocHeight(Math.max(420, idoc.documentElement.scrollHeight))
  }, [])

  // Keep rects fresh on resize / content mutation without waiting for doc prop change
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    const onResize = () => requestAnimationFrame(measure)
    window.addEventListener('resize', onResize)
    let ro: ResizeObserver | null = null
    let mo: MutationObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(onResize)
      ro.observe(iframe)
      const idoc = iframe.contentDocument
      if (idoc?.documentElement) ro.observe(idoc.documentElement)
    }
    // Fallback: observe iframe DOM mutations (image load, font load)
    const idoc = iframe.contentDocument
    if (idoc && typeof MutationObserver !== 'undefined') {
      mo = new MutationObserver(onResize)
      mo.observe(idoc.documentElement, { childList: true, subtree: true, attributes: true })
    }
    return () => {
      window.removeEventListener('resize', onResize)
      ro?.disconnect()
      mo?.disconnect()
    }
  }, [measure, ready])

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    if (!ready) {
      iframe.addEventListener(
        'load',
        () => {
          setReady(true)
          // Bug 3 fix: call measure() immediately after the iframe loads so
          // block handles are visible on first render without requiring a
          // subsequent doc-change to trigger the effect again.
          requestAnimationFrame(measure)
        },
        { once: true },
      )
      return
    }
    const idoc = iframe.contentDocument
    if (!idoc) return
    idoc.open()
    idoc.write(renderEmail(doc, { markers: true, canvas: true }))
    idoc.close()
    requestAnimationFrame(measure)
  }, [doc, ready, measure])

  // Auto-scroll newly selected block into view
  useEffect(() => {
    if (!selectedId || !ready) return
    const idoc = iframeRef.current?.contentDocument
    const el = idoc?.querySelector(`[data-et-block="${selectedId}"]`) as HTMLElement | null
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    // Also ensure canvas scroll container shows it
    const scrollEl = document.getElementById('et-canvas-scroll')
    const rect = blockRects.find((b) => b.id === selectedId)?.rect
    if (!scrollEl || !rect) return
    const viewTop = scrollEl.scrollTop
    const viewH = scrollEl.clientHeight
    if (rect.top < viewTop + 20 || rect.top + rect.height > viewTop + viewH - 20) {
      scrollEl.scrollTo({ top: Math.max(0, rect.top - viewH / 2 + rect.height / 2), behavior: 'smooth' })
    }
  }, [selectedId, blockRects, ready])

  const resolveTarget = useCallback(
    (clientX: number, clientY: number, payload: ActiveDrag): DropTarget | null => {
      const iframe = iframeRef.current
      if (!iframe) return null
      const iframeRect = iframe.getBoundingClientRect()
      // Convert to iframe-local coords — same space as the stored rects.
      const x = clientX - iframeRect.left
      const y = clientY - iframeRect.top

      const isTwocol =
        (payload.kind === 'new' && payload.type === 'twocol') ||
        (payload.kind === 'move' && findBlock(doc, payload.id)?.block.type === 'twocol')

      let owner: { id: string; column: 0 | 1 } | null = null
      if (!isTwocol) {
        for (const cr of colRects) {
          if (inside(cr.rect, x, y)) owner = { id: cr.id, column: cr.column }
        }
      }

      const path: ListPath = owner ? { scope: 'column', blockId: owner.id, column: owner.column } : { scope: 'root' }
      const list = path.scope === 'root' ? doc.blocks : columnBlocks(doc, path.blockId!, path.column!)

      let best: { path: ListPath; index: number; dist: number } | null = null
      const consider = (idx: number, dist: number) => {
        if (best === null || dist < best.dist) best = { path, index: idx, dist }
      }

      if (list.length === 0) {
        const base =
          path.scope === 'column'
            ? colRects.find((c) => c.id === path.blockId && c.column === path.column)?.rect
            : contentRect
        if (base) consider(0, Math.abs(y - (base.top + Math.min(base.height / 2, 40))))
      } else {
        // Iterate original list indices so missing rects don't shift drop indices
        const rectMap = new Map(blockRects.map((br) => [br.id, br.rect] as const))
        let lastVisibleIdx = -1
        let lastVisibleRect: Rect | null = null
        for (let i = 0; i < list.length; i++) {
          const r = rectMap.get(list[i].id)
          if (!r) continue
          lastVisibleIdx = i
          lastVisibleRect = r
          const mid = r.top + r.height / 2
          if (y < mid) {
            consider(i, Math.abs(y - r.top))
            break
          }
          if (i === list.length - 1) consider(i + 1, Math.abs(y - (r.top + r.height)))
        }
        // Edge: all rects missing but list non-empty -> fallback to last known rect bottom
        if (best === null && lastVisibleRect !== null) {
          consider(lastVisibleIdx + 1, Math.abs(y - (lastVisibleRect.top + lastVisibleRect.height)))
        }
      }
      return best
    },
    [colRects, contentRect, doc, blockRects],
  )

  const onDragStart = useCallback((_e: DragStartEvent) => {
    const data = _e.active.data.current as ActiveDrag | undefined
    if (data) setActive(data)
  }, [])

  const onDragMove = useCallback(
    (e: DragMoveEvent) => {
      if (!active) return
      const translated = e.active.rect.current.translated
      if (!translated) return
      const cx = translated.left + translated.width / 2
      const cy = translated.top + translated.height / 2
      const target = resolveTarget(cx, cy, active)
      setDropTarget(target ? { path: target.path, index: target.index } : null)
    },
    [active, resolveTarget],
  )

  const onDragEnd = useCallback(
    (e: DragEndEvent) => {
      const data = e.active.data.current as ActiveDrag | undefined
      setActive(null)
      if (!data) {
        setDropTarget(null)
        return
      }
      const translated = e.active.rect.current.translated
      const target = translated
        ? resolveTarget(translated.left + translated.width / 2, translated.top + translated.height / 2, data)
        : null
      setDropTarget(null)
      if (target) onDrop(data, { path: target.path, index: target.index })
    },
    [resolveTarget, onDrop],
  )

  const indicator = useMemo((): { top: number; left: number; width: number } | null => {
    if (!dropTarget) return null
    const { path, index } = dropTarget
    if (path.scope === 'root') {
      if (doc.blocks.length === 0) {
        if (!contentRect) return null
        return { top: contentRect.top, left: contentRect.left, width: contentRect.width }
      }
      const r = blockRects.find((b) => b.id === doc.blocks[Math.min(index, doc.blocks.length - 1)].id)?.rect
      if (!r) return null
      return { top: index >= doc.blocks.length ? r.top + r.height : r.top, left: r.left, width: r.width }
    }
    const cr = colRects.find((c) => c.id === path.blockId && c.column === path.column)?.rect
    const col = columnBlocks(doc, path.blockId!, path.column!)
    if (col.length === 0 || !cr) {
      return cr ? { top: cr.top + 2, left: cr.left + 3, width: cr.width - 6 } : null
    }
    const r = blockRects.find((b) => b.id === col[Math.min(index, col.length - 1)].id)?.rect
    if (!r) return null
    return { top: index >= col.length ? r.top + r.height : r.top, left: r.left, width: r.width }
  }, [dropTarget, doc, blockRects, colRects, contentRect])

  const activeLabel = active
    ? active.kind === 'new'
      ? REGISTRY[active.type].label
      : active.kind === 'move'
        ? (REGISTRY[findBlock(doc, active.id)?.block.type ?? 'text']?.label ?? 'Block')
        : active.name
    : ''

  // Canvas surround colour matches the email's outer background
  const canvasBg = doc.settings.bodyBg ?? '#f4f8fc'

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragMove={onDragMove} onDragEnd={onDragEnd} onDragCancel={() => { setActive(null); setDropTarget(null) }}>
      <Palette />
      <div
        className="flex flex-1 justify-center overflow-y-auto"
        style={{ backgroundColor: canvasBg }}
        id="et-canvas-scroll"
        // Bug 4 fix: suppress the deselect-all click while a drag is in
        // progress. Without this the pointer-up that ends a DnD gesture
        // also fired onClick on the scroll container, deselecting the
        // freshly-dropped block and requiring an extra click to re-select it.
        onClick={active ? undefined : () => onSelect(null)}
      >
        {/* Wrapper is exactly the iframe width — overlay inset-0 aligns perfectly */}
        <div className="relative my-6" style={{ width: `${doc.settings.contentWidth}px`, height: docHeight }}>
          <iframe
            ref={iframeRef}
            title="Email canvas"
            srcDoc={ready ? undefined : renderEmail(doc, { markers: true, canvas: true })}
            className="absolute left-0 top-0 border-0 shadow-[0_1px_8px_rgba(15,37,64,0.08)]"
            style={{ width: `${doc.settings.contentWidth}px`, height: docHeight, backgroundColor: '#ffffff' }}
          />
          {ready && (
            <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
              {doc.blocks.length === 0 && !active && (
                <div className="absolute inset-0 flex items-center justify-center p-8" style={{ pointerEvents: 'none' }}>
                  <div className="rounded-xl border-2 border-dashed border-ice-300 bg-white/80 px-6 py-8 text-center shadow-sm backdrop-blur">
                    <p className="text-sm font-semibold text-ink-700">Drag blocks here</p>
                    <p className="mt-1 text-xs text-ink-400">Try Header, Text, or Button from the palette</p>
                  </div>
                </div>
              )}
              {blockRects.map(({ id, rect }) => (
                <BlockHandle
                  key={id}
                  id={id}
                  rect={rect}
                  isSelected={id === selectedId}
                  isHovered={id === hoverId}
                  isAnyActive={active !== null}
                  onSelect={onSelect}
                  onHover={setHoverId}
                />
              ))}
              {selectedId && !active &&
                (() => {
                  const r = blockRects.find((b) => b.id === selectedId)?.rect
                  if (!r) return null
                  return (
                    <div
                      className="absolute z-20 flex items-center gap-0.5 rounded-lg border border-ice-200 bg-white p-0.5 shadow-md"
                      style={{ top: Math.max(4, r.top - 36), left: Math.max(4, r.left + r.width - 68), pointerEvents: 'auto' }}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        title="Duplicate"
                        aria-label="Duplicate block"
                        onClick={() => duplicateBlock(selectedId)}
                        className="rounded p-1.5 text-ink-500 hover:bg-ice-50 hover:text-ink-900"
                      >
                        <Copy className="size-3.5" />
                      </button>
                      <div className="h-4 w-px bg-ice-200" />
                      <button
                        type="button"
                        title="Delete"
                        aria-label="Delete block"
                        onClick={() => {
                          removeBlock(selectedId)
                          onSelect(null)
                        }}
                        className="rounded p-1.5 text-ink-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  )
                })()}
              {dropTarget?.path.scope === 'column' &&
                (() => {
                  const cr = colRects.find((c) => c.id === dropTarget.path.blockId && c.column === dropTarget.path.column)?.rect
                  return cr ? (
                    <div
                      className="absolute rounded-md border-2 border-dashed border-primary/50 bg-primary/5"
                      style={{ top: cr.top, left: cr.left, width: cr.width, height: Math.max(cr.height, 56) }}
                    />
                  ) : null
                })()}
              {indicator && (
                <div
                  className="absolute z-10 h-[3px] rounded bg-primary"
                  style={{ top: indicator.top - 1.5, left: indicator.left, width: indicator.width, boxShadow: '0 0 0 3px rgba(43,127,224,0.25)' }}
                />
              )}
            </div>
          )}
        </div>
      </div>
      <DragOverlay dropAnimation={null}>
        {active && (
          <div className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white shadow-lg">
            {activeLabel}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

function columnBlocks(doc: EmailDoc, blockId: string, column: 0 | 1) {
  const owner = doc.blocks.find((b) => b.id === blockId)
  return owner && owner.type === 'twocol' ? owner.columns[column] : []
}
