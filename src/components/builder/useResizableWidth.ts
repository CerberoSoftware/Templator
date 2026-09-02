import { useCallback, useEffect, useRef, useState } from 'react'

interface Options {
  /** Width in px used when no stored value exists yet. */
  initial: number
  min: number
  max: number
  /** localStorage key the chosen width is persisted under. */
  storageKey: string
}

/**
 * Draggable width for a side panel, persisted per-browser across sessions.
 * `edge` says which side of the panel the drag handle sits on: 'right' means
 * dragging the pointer right grows the panel (a left-hand sidebar), 'left'
 * means dragging left grows it (a right-hand sidebar).
 */
export function useResizableWidth({ initial, min, max, storageKey }: Options) {
  const [width, setWidth] = useState<number>(() => {
    const stored = Number(window.localStorage.getItem(storageKey))
    return Number.isFinite(stored) && stored >= min && stored <= max ? stored : initial
  })

  useEffect(() => {
    window.localStorage.setItem(storageKey, String(width))
  }, [width, storageKey])

  const widthRef = useRef(width)
  widthRef.current = width

  const startResize = useCallback(
    (edge: 'left' | 'right') => (e: React.PointerEvent) => {
      e.preventDefault()
      const startX = e.clientX
      const startWidth = widthRef.current
      const onMove = (ev: PointerEvent) => {
        const delta = edge === 'left' ? startX - ev.clientX : ev.clientX - startX
        setWidth(Math.min(max, Math.max(min, startWidth + delta)))
      }
      const onUp = () => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [min, max],
  )

  return { width, startResize }
}
