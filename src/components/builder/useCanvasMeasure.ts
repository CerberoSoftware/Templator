import { useCallback, useEffect, useState } from 'react'
import type { Rect } from './Canvas'

export interface BlockRect {
  id: string
  rect: Rect
}

function rectOf(el: HTMLElement, origin: { left: number; top: number }): Rect {
  const r = el.getBoundingClientRect()
  return { top: r.top - origin.top, left: r.left - origin.left, width: r.width, height: r.height }
}

/**
 * Measures block/col/content rects inside the iframe relative to iframe origin.
 * Includes ResizeObserver + MutationObserver to stay fresh without doc churn.
 * Extracted for testability and to keep Canvas.tsx lean (D-6).
 */
export function useCanvasMeasure(
  iframeRef: React.RefObject<HTMLIFrameElement | null>,
  ready: boolean,
  onMeasured?: (height: number) => void,
) {
  const [blockRects, setBlockRects] = useState<BlockRect[]>([])
  const [colRects, setColRects] = useState<Array<{ id: string; column: 0 | 1; rect: Rect }>>([])
  const [contentRect, setContentRect] = useState<Rect | null>(null)
  const [docHeight, setDocHeight] = useState(420)

  const measure = useCallback(() => {
    const iframe = iframeRef.current
    const idoc = iframe?.contentDocument
    if (!idoc || !iframe) return
    const origin = iframe.getBoundingClientRect()
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
    const h = Math.max(420, idoc.documentElement.scrollHeight)
    setDocHeight(h)
    onMeasured?.(h)
  }, [iframeRef, onMeasured])

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
  }, [measure, ready, iframeRef])

  return { blockRects, colRects, contentRect, docHeight, measure }
}
