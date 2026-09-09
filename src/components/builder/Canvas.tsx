import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor, useDraggable, useSensor, useSensors, type DragEndEvent, type DragMoveEvent, type DragStartEvent } from '@dnd-kit/core'
import { GripVertical, Copy, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
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

/** Drag handle overlay for an existing block */
function BlockHandle({
  id,
  rect,
  label,
  isSelected,
  isHovered,
  isAnyActive,
  onSelect,
  onHover,
}: {
  id: string
  rect: Rect
  label: string
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
      {/* Label chip — shows block type on hover/select */}
      {(isHovered || isSelected) && !isAnyActive && label && (
        <div className="absolute -top-6 left-0 rounded-md bg-ink-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow">
          {label}
        </div>
      )}
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
  const nudgeBlock = useEditor((s) => s.nudgeBlock)
  const removeBlock = useEditor((s) => s.removeBlock)
  const insertBlock = useEditor((s) => s.insertBlock)
  const [zoom, setZoom] = useState(1)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  // Frozen at mount. Flipping srcDoc to undefined once ready removes the
  // attribute, which re-navigates the iframe to about:blank and can wipe the
  // document the effect below just wrote — the race behind a saved template
  // rendering with stale geometry. Keeping the value constant means React
  // never touches the attribute again; every update goes through idoc.write().
  const initialSrcDoc = useRef<string | null>(null)
  const [ready, setReady] = useState(false)
  // Bumped after every document rewrite so the resize/mutation observers below
  // rebind: idoc.open() replaces documentElement, which silently detaches any
  // observer still watching the previous one.
  const [generation, setGeneration] = useState(0)
  // Monotonic token guarding against out-of-order async measurements. measure()
  // awaits fonts, images and a settle timeout, so a measurement started against
  // an older document can otherwise resolve last and clobber a newer one — the
  // reason a freshly loaded template showed stale handle positions and a
  // too-short iframe until the next edit forced a re-measure.
  const measureToken = useRef(0)
  const [docHeight, setDocHeight] = useState(420)
  const [blockRects, setBlockRects] = useState<BlockRect[]>([])
  const [colRects, setColRects] = useState<Array<{ id: string; column: 0 | 1; rect: Rect }>>([])
  const [contentRect, setContentRect] = useState<Rect | null>(null)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [active, setActive] = useState<ActiveDrag | null>(null)
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null)

  if (initialSrcDoc.current === null) {
    initialSrcDoc.current = renderEmail(doc, { markers: true, canvas: true })
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  )

  const measure = useCallback(async (): Promise<void> => {
    const iframe = iframeRef.current
    const idoc = iframe?.contentDocument
    if (!idoc || !iframe) return
    const token = ++measureToken.current
    const stale = (): boolean => token !== measureToken.current || iframeRef.current !== iframe
    // Wait for fonts to load
    if (idoc.fonts && idoc.fonts.ready) {
      await idoc.fonts.ready
      if (stale()) return
    }
    // Wait for images to load
    const images = Array.from(idoc.querySelectorAll('img'))
    await Promise.all(images.map((img) => {
      if (img.complete) return Promise.resolve()
      return new Promise<void>((resolve) => {
        img.addEventListener('load', () => resolve(), { once: true })
        img.addEventListener('error', () => resolve(), { once: true })
      })
    }))
    if (stale()) return
    // Small delay to ensure layout is stable
    await new Promise((r) => setTimeout(r, 50))
    if (stale()) return
    // A rewrite between the awaits swaps documentElement out from under us.
    if (iframe.contentDocument !== idoc || !idoc.documentElement) return
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
    const newHeight = Math.max(
      420,
      idoc.documentElement.scrollHeight,
      idoc.body?.scrollHeight ?? 0,
      content ? Math.ceil(content.getBoundingClientRect().height) : 0,
    )
    setDocHeight(newHeight)
    // Also update iframe height to match content
    iframe.style.height = `${newHeight}px`
  }, [])

  // Keep rects fresh on resize / content mutation without waiting for doc prop change
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    const onResize = () => { measure() }
    window.addEventListener('resize', onResize)
    let ro: ResizeObserver | null = null
    let mo: MutationObserver | null = null
    const idoc = iframe.contentDocument
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(onResize)
      ro.observe(iframe)
      // documentElement is pinned to the iframe height, so it never reports
      // content growth — body does.
      if (idoc?.body) ro.observe(idoc.body)
    }
    // Fallback: observe iframe DOM mutations (image load, font load)
    if (idoc?.documentElement && typeof MutationObserver !== 'undefined') {
      mo = new MutationObserver(onResize)
      mo.observe(idoc.documentElement, { childList: true, subtree: true, attributes: true })
    }
    return () => {
      window.removeEventListener('resize', onResize)
      ro?.disconnect()
      mo?.disconnect()
    }
  }, [measure, ready, generation])

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
          measure()
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
    // documentElement is brand new after the write — rebind the observers.
    setGeneration((g) => g + 1)
    measure()
  }, [doc, ready, measure])

  useEffect(() => {
    measure()
  }, [zoom, measure])

  // Auto-scroll newly selected block into view
  useEffect(() => {
    if (!selectedId || !ready) return
    const idoc = iframeRef.current?.contentDocument
    const el = idoc?.querySelector(`[data-et-block="${selectedId}"]`) as HTMLElement | null
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    // Also ensure canvas scroll container shows it. blockRects are in the
    // iframe's unscaled internal coordinates, but the scroll container's own
    // metrics are in on-screen pixels of the zoomed layout, so scale up first.
    const scrollEl = document.getElementById('et-canvas-scroll')
    const rect = blockRects.find((b) => b.id === selectedId)?.rect
    if (!scrollEl || !rect) return
    const top = rect.top * zoom
    const height = rect.height * zoom
    const viewTop = scrollEl.scrollTop
    const viewH = scrollEl.clientHeight
    if (top < viewTop + 20 || top + height > viewTop + viewH - 20) {
      scrollEl.scrollTo({ top: Math.max(0, top - viewH / 2 + height / 2), behavior: 'smooth' })
    }
  }, [selectedId, blockRects, ready, zoom])

  const resolveTarget = useCallback(
    (clientX: number, clientY: number, payload: ActiveDrag): DropTarget | null => {
      const iframe = iframeRef.current
      if (!iframe) return null
      const iframeRect = iframe.getBoundingClientRect()
      // Convert to iframe-local coords — same space as the stored rects. The
      // iframe itself is visually scaled via a CSS transform (see the render
      // below) while its internal layout — and every stored rect — stays at
      // the unscaled size, so the screen-space delta needs dividing by zoom.
      const x = (clientX - iframeRect.left) / zoom
      const y = (clientY - iframeRect.top) / zoom

      const isTwocol =
        (payload.kind === 'new' && payload.type === 'twocol') ||
        (payload.kind === 'move' && findBlock(doc, payload.id)?.block.type === 'twocol')

      let owner: { id: string; column: 0 | 1 } | null = null
      if (!isTwocol) {
        for (const cr of colRects) {
          const inX = x >= cr.rect.left && x <= cr.rect.left + cr.rect.width
          // Allow y slightly outside col rect so drops near column edges still count
          const inY = y >= cr.rect.top - 24 && y <= cr.rect.top + cr.rect.height + 24
          if (inX && inY) owner = { id: cr.id, column: cr.column }
        }
        // Fallback: if y is far outside measured col rects but x is within, still treat as column
        if (!owner) {
          for (const cr of colRects) {
            if (x >= cr.rect.left && x <= cr.rect.left + cr.rect.width) {
              if (contentRect && y >= contentRect.top - 40 && y <= contentRect.top + contentRect.height + 40) {
                owner = { id: cr.id, column: cr.column }
                break
              }
            }
          }
        }
        // Final fallback: use twocol block rect to decide column by x half (robust when colRects are stale/empty)
        if (!owner) {
          for (const b of doc.blocks) {
            if (b.type !== 'twocol') continue
            const br = blockRects.find((r) => r.id === b.id)?.rect
            if (!br) continue
            if (y >= br.top - 10 && y <= br.top + br.height + 10 && x >= br.left && x <= br.left + br.width) {
              const col: 0 | 1 = x < br.left + br.width / 2 ? 0 : 1
              owner = { id: b.id, column: col }
              break
            }
          }
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
    [colRects, contentRect, doc, blockRects, zoom],
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
      {/* Non-scrolling wrapper: the zoom controls below are positioned against this
          element rather than the scrollable pane inside it, so they stay anchored to
          the bottom-right of the visible canvas viewport instead of scrolling away
          with the email content. */}
      <div className="relative flex flex-1">
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
        {/* Outer wrapper reserves the scaled footprint so the scroll container centers
            and sizes around it correctly; the inner wrapper below stays laid out at the
            true (unscaled) size and is visually scaled with a transform, so zooming
            enlarges everything painted inside the iframe — text, images, spacing — the
            way a browser's own zoom does, instead of just reflowing into a wider box
            (which is what CSS `zoom` on the iframe's own box did previously). */}
        <div className="relative my-6" style={{ width: doc.settings.contentWidth * zoom, height: docHeight * zoom }}>
          <div
            className="absolute left-0 top-0"
            style={{ width: `${doc.settings.contentWidth}px`, height: docHeight, transform: `scale(${zoom})`, transformOrigin: 'top left' }}
          >
          <iframe
            ref={iframeRef}
            title="Email canvas"
            srcDoc={initialSrcDoc.current}
            className="absolute left-0 top-0 border-0 shadow-[0_1px_8px_rgba(15,37,64,0.08)]"
            style={{ width: `${doc.settings.contentWidth}px`, height: docHeight, backgroundColor: '#ffffff', pointerEvents: active ? 'none' : 'auto' }}
          />
          {ready && (
            <div className="group absolute inset-0" style={{ pointerEvents: 'none' }}>
              {doc.blocks.length === 0 && !active && (
                <div className="absolute inset-0 flex items-center justify-center p-8" style={{ pointerEvents: 'none' }}>
                  <div className="rounded-xl border-2 border-dashed border-ice-300 bg-white/80 px-6 py-6 text-center shadow-sm backdrop-blur" style={{ pointerEvents: 'auto' }}>
                    <p className="text-sm font-semibold text-ink-700">Drag blocks here</p>
                    <p className="mt-1 text-xs text-ink-400">or quickly add</p>
                    <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                      {(['header', 'text', 'heading', 'image', 'button'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            insertBlock(t as BlockType, { path: { scope: 'root' }, index: 0 })
                          }}
                          className="rounded-full border border-ice-200 bg-white px-2.5 py-1 text-xs font-medium text-ink-600 transition hover:border-primary hover:text-primary"
                        >
                          {(REGISTRY[t as keyof typeof REGISTRY]?.label ?? t) as string}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-[10px] text-ink-400">Tip: drag from the left palette for more options</p>
                  </div>
                </div>
              )}
              {blockRects.map(({ id, rect }) => {
                const type = findBlock(doc, id)?.block.type ?? 'text'
                const label = REGISTRY[type as keyof typeof REGISTRY]?.label ?? type
                return (
                  <BlockHandle
                    key={id}
                    id={id}
                    rect={rect}
                    label={label}
                    isSelected={id === selectedId}
                    isHovered={id === hoverId}
                    isAnyActive={active !== null}
                    onSelect={onSelect}
                    onHover={setHoverId}
                  />
                )
              })}
              {selectedId && !active &&
                (() => {
                  const r = blockRects.find((b) => b.id === selectedId)?.rect
                  if (!r) return null
                  return (
                    <div
                      className="absolute z-20 flex items-center gap-0.5 rounded-lg border border-ice-200 bg-white p-0.5 shadow-md"
                      style={{ top: Math.max(4, r.top - 36), left: Math.max(4, r.left + r.width - 136), pointerEvents: 'auto' }}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      role="toolbar"
                      aria-label="Block actions"
                    >
                      <button
                        type="button"
                        title="Move up"
                        aria-label="Move block up"
                        onClick={() => nudgeBlock(selectedId, -1)}
                        className="rounded p-1.5 text-ink-500 hover:bg-ice-50 hover:text-ink-900"
                      >
                        <ChevronUp className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Move down"
                        aria-label="Move block down"
                        onClick={() => nudgeBlock(selectedId, 1)}
                        className="rounded p-1.5 text-ink-500 hover:bg-ice-50 hover:text-ink-900"
                      >
                        <ChevronDown className="size-3.5" />
                      </button>
                      <div className="h-4 w-px bg-ice-200" />
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
      </div>
        {/* Zoom controls — anchored to the non-scrolling wrapper's bottom-right, next to the
            right sidebar, so they stay put on screen as the canvas content is scrolled. */}
        <div className="pointer-events-auto absolute bottom-4 right-4 z-30 flex items-center gap-1 rounded-full border border-ice-200 bg-white px-1 py-1 shadow-lg">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.5, Math.round((z - 0.1) * 10) / 10))}
            className="rounded-full p-1.5 text-ink-500 hover:bg-ice-50 disabled:opacity-30"
            title="Zoom out (Ctrl+-)"
            aria-label="Zoom out"
            disabled={zoom <= 0.5}
          >
            −
          </button>
          <span className="min-w-[3rem] text-center text-xs font-medium text-ink-600">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.5, Math.round((z + 0.1) * 10) / 10))}
            className="rounded-full p-1.5 text-ink-500 hover:bg-ice-50 disabled:opacity-30"
            title="Zoom in (Ctrl++)"
            aria-label="Zoom in"
            disabled={zoom >= 1.5}
          >
            +
          </button>
          <div className="mx-1 h-4 w-px bg-ice-200" />
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="rounded-full px-2 py-1 text-xs font-medium text-ink-600 hover:bg-ice-50"
            title="Reset zoom to 100%"
          >
            Reset
          </button>
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
