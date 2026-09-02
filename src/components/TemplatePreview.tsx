import { useState, useMemo, useRef, useEffect } from 'react'
import type { EmailDoc } from '../builder/model'
import { renderEmail } from '../builder/render'

interface Props {
  doc: EmailDoc
  title: string
  height?: number
}

/** Sandboxed, pointer-events-free live preview of an EmailDoc, scaled to fill its container width. */
export function TemplatePreview({ doc, title, height = 260 }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const outerRef = useRef<HTMLDivElement>(null)
  const [docHeight, setDocHeight] = useState(900)
  const [containerWidth, setContainerWidth] = useState(480)
  const [isVisible, setIsVisible] = useState(false)

  const scale = containerWidth / doc.settings.contentWidth
  const html = useMemo(() => renderEmail(doc), [doc])

  // Responsive scale via container width
  useEffect(() => {
    const el = outerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width
      if (w) setContainerWidth(Math.max(200, Math.round(w)))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Lazy-load iframe when card enters viewport
  useEffect(() => {
    const el = outerRef.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true)
          io.disconnect()
        }
      },
      { rootMargin: '200px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe || !isVisible) return
    const onLoad = () => {
      const idoc = iframe.contentDocument
      const h = idoc?.documentElement.scrollHeight ?? idoc?.body.scrollHeight ?? 900
      setDocHeight(Math.max(400, h))
      // Observe future resizes (images, fonts)
      if (idoc?.documentElement && typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(() => {
          const nh = idoc.documentElement.scrollHeight || idoc.body.scrollHeight || h
          setDocHeight(Math.max(400, nh))
        })
        ro.observe(idoc.documentElement)
        return () => ro.disconnect()
      }
    }
    iframe.addEventListener('load', onLoad)
    return () => iframe.removeEventListener('load', onLoad)
  }, [html, isVisible])

  return (
    // Outer clip — fixed visible size, now responsive
    <div
      ref={outerRef}
      className="relative w-full overflow-hidden rounded-t-xl bg-[#f4f8fc]"
      style={{ height }}
    >
      {isVisible ? (
        <>
          {/* Scaled wrapper */}
          <div
            style={{
              width: doc.settings.contentWidth,
              height: docHeight,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            <iframe
              ref={iframeRef}
              title={`Preview: ${title}`}
              srcDoc={html}
              sandbox="allow-same-origin"
              scrolling="no"
              loading="lazy"
              style={{
                width: doc.settings.contentWidth,
                height: docHeight,
                border: 'none',
                display: 'block',
              }}
            />
          </div>
          {/* Gradient fade at bottom to mask the cut-off */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16"
            style={{ background: 'linear-gradient(to bottom, transparent, rgba(244,248,252,0.95))' }}
          />
        </>
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-ink-400">Loading preview…</div>
      )}
    </div>
  )
}
