import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragMoveEvent, type DragStartEvent } from '@dnd-kit/core'
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

function rectOf(el: HTMLElement): Rect {
  const r = el.getBoundingClientRect()
  return { top: r.top, left: r.left, width: r.width, height: r.height }
}

function inside(r: Rect, x: number, y: number): boolean {
  return x >= r.left && x <= r.left + r.width && y >= r.top && y <= r.top + r.height
}

export function Canvas({ onSelect, onDrop }: CanvasProps) {
  const doc = useEditor((s) => s.doc)
  const selectedId = useEditor((s) => s.selectedId)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [ready, setReady] = useState(false)
  const [docHeight, setDocHeight] = useState(420)
  const [blockRects, setBlockRects] = useState<BlockRect[]>([])
  const [colRects, setColRects] = useState<Array<{ id: string; column: 0 | 1; rect: Rect }>>([])
  const [contentRect, setContentRect] = useState<Rect | null>(null)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [active, setActive] = useState<ActiveDrag | null>(null)
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const measure = useCallback(() => {
    const idoc = iframeRef.current?.contentDocument
    if (!idoc) return
    const nextBlocks: BlockRect[] = []
    idoc.querySelectorAll<HTMLElement>('[data-et-block]').forEach((el) => {
      const id = el.getAttribute('data-et-block')
      if (id != null) nextBlocks.push({ id, rect: rectOf(el) })
    })
    const nextCols: Array<{ id: string; column: 0 | 1; rect: Rect }> = []
    idoc.querySelectorAll<HTMLElement>('[data-et-col]').forEach((el) => {
      const key = el.getAttribute('data-et-col')
      if (!key) return
      const [blockId, colStr] = key.split(':')
      nextCols.push({ id: blockId, column: colStr === '1' ? 1 : 0, rect: rectOf(el) })
    })
    const content = idoc.querySelector<HTMLElement>('.et-content')
    setBlockRects(nextBlocks)
    setColRects(nextCols)
    setContentRect(content ? rectOf(content) : null)
    setDocHeight(Math.max(420, idoc.documentElement.scrollHeight))
  }, [])

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    if (!ready) {
      iframe.addEventListener('load', () => setReady(true), { once: true })
      return
    }
    const idoc = iframe.contentDocument
    if (!idoc) return
    idoc.open()
    idoc.write(renderEmail(doc, { markers: true, canvas: true }))
    idoc.close()
    requestAnimationFrame(measure)
  }, [doc, ready, measure])

  const resolveTarget = useCallback(
    (clientX: number, clientY: number, payload: ActiveDrag): DropTarget | null => {
      const iframe = iframeRef.current
      if (!iframe) return null
      const iframeRect = iframe.getBoundingClientRect()
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
        const rects = list
          .map((b) => blockRects.find((br) => br.id === b.id)?.rect)
          .filter((r): r is Rect => r !== undefined)
        for (let i = 0; i < rects.length; i++) {
          const r = rects[i]
          const mid = r.top + r.height / 2
          if (y < mid) {
            consider(i, Math.abs(y - r.top))
            break
          }
          if (i === rects.length - 1) consider(i + 1, Math.abs(y - (r.top + r.height)))
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

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragMove={onDragMove} onDragEnd={onDragEnd} onDragCancel={() => { setActive(null); setDropTarget(null) }}>
      <Palette />
      <div className="flex flex-1 justify-center overflow-y-auto bg-ice-100" id="et-canvas-scroll" onClick={() => onSelect(null)}>
        <div className="relative my-6" style={{ width: doc.settings.contentWidth, height: docHeight }}>
          <iframe
            ref={iframeRef}
            title="Email canvas"
            srcDoc={ready ? undefined : renderEmail(doc, { markers: true, canvas: true })}
            className="absolute left-0 top-0 h-full w-full border-0 bg-white shadow-[0_1px_8px_rgba(15,37,64,0.08)]"
            style={{ height: docHeight }}
          />
          {ready && (
            <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
              {blockRects.map(({ id, rect }) => {
                const isSel = id === selectedId
                const isHover = id === hoverId
                return (
                  <div
                    key={id}
                    data-et-drop-id={id}
                    className={`absolute box-border rounded-[3px] ${isSel ? 'outline-2 outline-primary outline' : isHover ? 'outline-1 outline-secondary outline' : ''}`}
                    style={{
                      top: rect.top,
                      left: rect.left,
                      width: rect.width,
                      height: Math.max(rect.height, 6),
                      pointerEvents: active ? 'none' : 'auto',
                      cursor: active ? undefined : 'grab',
                    }}
                    onPointerOver={() => setHoverId(id)}
                    onPointerOut={() => setHoverId((h) => (h === id ? null : h))}
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelect(id)
                    }}
                  />
                )
              })}
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
