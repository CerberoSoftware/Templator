import { useState, useMemo, useRef, useEffect } from 'react'
import { FilePlus2, Eye, EyeOff } from 'lucide-react'
import { QUICKSTART_TEMPLATES, QUICKSTART_CATEGORIES, type QuickstartTemplate } from '../data/quickstartTemplates'
import { renderEmail } from '../builder/render'
import { migrateDoc } from '../builder/model'
import { api } from '../api/client'
import { navigate } from '../router'

const CATEGORY_ALL = 'All'
// Width of the preview pane in px (matches card inner width at max-w-4xl / 2-col)
const PREVIEW_WIDTH = 480
// Visible height of the thumbnail
const PREVIEW_HEIGHT = 260

/** Sandboxed, pointer-events-free live preview of an EmailDoc */
function TemplatePreview({ template }: { template: QuickstartTemplate }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const outerRef = useRef<HTMLDivElement>(null)
  const [docHeight, setDocHeight] = useState(900)
  const [containerWidth, setContainerWidth] = useState(PREVIEW_WIDTH)
  const [isVisible, setIsVisible] = useState(false)

  // Ensure doc is migrated so widthPct etc. match editor rendering
  const migrated = useMemo(() => migrateDoc(structuredClone(template.doc) as unknown), [template.doc])
  const scale = containerWidth / migrated.settings.contentWidth
  const html = useMemo(() => renderEmail(migrated), [migrated])

  // Responsive scale via container width
  useEffect(() => {
    const el = outerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width
      if (w) setContainerWidth(Math.max(280, Math.round(w)))
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
      style={{ height: PREVIEW_HEIGHT }}
    >
      {isVisible ? (
        <>
          {/* Scaled wrapper */}
          <div
            style={{
              width: migrated.settings.contentWidth,
              height: docHeight,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            <iframe
              ref={iframeRef}
              title={`Preview: ${template.name}`}
              srcDoc={html}
              sandbox="allow-same-origin"
              scrolling="no"
              loading="lazy"
              style={{
                width: migrated.settings.contentWidth,
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

interface Props {
  onCreated: () => void
}

export function QuickstartTab({ onCreated }: Props) {
  const [creating, setCreating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState(CATEGORY_ALL)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // URL + localStorage persistence for filter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const f = params.get('qs_filter')
    if (f && [CATEGORY_ALL, ...QUICKSTART_CATEGORIES].includes(f)) setFilter(f)
    const stored = localStorage.getItem('qs_filter')
    if (!f && stored && [CATEGORY_ALL, ...QUICKSTART_CATEGORIES].includes(stored)) setFilter(stored)
  }, [])
  useEffect(() => {
    const url = new URL(window.location.href)
    if (filter === CATEGORY_ALL) url.searchParams.delete('qs_filter')
    else url.searchParams.set('qs_filter', filter)
    window.history.replaceState(null, '', url.toString())
    localStorage.setItem('qs_filter', filter)
  }, [filter])

  const categories = [CATEGORY_ALL, ...QUICKSTART_CATEGORIES]
  const counts = useMemo(() => {
    const m = new Map<string, number>()
    m.set(CATEGORY_ALL, QUICKSTART_TEMPLATES.length)
    for (const c of QUICKSTART_CATEGORIES) m.set(c, QUICKSTART_TEMPLATES.filter((t) => t.category === c).length)
    return m
  }, [])

  const visible = useMemo(() => {
    const byCat = filter === CATEGORY_ALL ? QUICKSTART_TEMPLATES : QUICKSTART_TEMPLATES.filter((t) => t.category === filter)
    if (!query.trim()) return byCat
    const q = query.toLowerCase()
    return byCat.filter((t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.doc.settings.subject.toLowerCase().includes(q))
  }, [filter, query])

  const useTemplate = async (template: QuickstartTemplate) => {
    if (creating) return
    setCreating(template.id)
    setError(null)
    try {
      const data = await api.post<{ id: number }>('/api/templates', {
        name: template.name,
        json_structure: JSON.stringify(template.doc),
      })
      onCreated()
      navigate(`/editor/${data.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create template')
    } finally {
      setCreating(null)
    }
  }

  const expanded = expandedId ? QUICKSTART_TEMPLATES.find((t) => t.id === expandedId) ?? null : null

  return (
    <div>
      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates, subjects, descriptions…"
            className="w-full rounded-xl border border-ice-200 bg-white px-4 py-2.5 pr-9 text-sm focus:border-primary focus:outline-none"
            aria-label="Search templates"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-400 hover:text-ink-600"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Category filter pills */}
      <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Template categories">
        {categories.map((cat) => (
          <button
            key={cat}
            role="tab"
            aria-selected={filter === cat}
            aria-pressed={filter === cat}
            onClick={() => setFilter(cat)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
              filter === cat
                ? 'border-primary bg-primary text-white'
                : 'border-ice-200 bg-white text-ink-600 hover:border-primary hover:text-primary'
            }`}
          >
            {cat} <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] ${filter === cat ? 'bg-white/20' : 'bg-ice-100'}`}>{counts.get(cat) ?? 0}</span>
          </button>
        ))}
      </div>

      {/* Template grid */}
      {visible.length === 0 ? (
        <p className="py-12 text-center text-sm text-ink-400">No templates in “{filter}”{query ? ` matching “${query}”` : ''} — try All.</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2" role="list">
          {visible.map((template) => {
            const isCreatingThis = creating === template.id
            const isExpanded = expandedId === template.id
            return (
              <article
                key={template.id}
                role="listitem"
                aria-labelledby={`qs-title-${template.id}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-ice-200 bg-white transition hover:border-primary hover:shadow-md focus-within:border-primary"
              >
                {/* Live preview thumbnail */}
                <TemplatePreview template={template} />

                {/* Card body */}
                <div className="flex flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p id={`qs-title-${template.id}`} className="truncate font-semibold leading-tight">{template.name}</p>
                      <span className="mt-1 inline-block rounded-full bg-ice-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-500">
                        {template.category}
                      </span>
                      <p className="mt-1 line-clamp-1 text-xs text-ink-400">{template.doc.settings.subject} — {template.doc.settings.preheader}</p>
                    </div>
                    {/* Toggle description / open modal */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : template.id)}
                      className="mt-0.5 shrink-0 rounded p-1.5 text-ink-400 transition hover:bg-ice-50 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                      aria-label={isExpanded ? 'Hide details' : 'Show details'}
                      aria-expanded={isExpanded}
                      title={isExpanded ? 'Hide details' : 'Show details'}
                    >
                      {isExpanded ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
                  </div>

                  {isExpanded && (
                    <p className="text-sm leading-relaxed text-ink-500">{template.description}</p>
                  )}

                  <button
                    onClick={() => void useTemplate(template)}
                    disabled={isCreatingThis}
                    aria-busy={isCreatingThis}
                    className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    {isCreatingThis ? (
                      <span className="animate-pulse">Creating…</span>
                    ) : (
                      <>
                        <FilePlus2 className="size-4" />
                        Use this template
                      </>
                    )}
                  </button>
                  {creating && !isCreatingThis && <p className="text-center text-[11px] text-ink-400">Another template is being created…</p>}
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* Expanded details dialog */}
      {expanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4" onClick={() => setExpandedId(null)} role="dialog" aria-modal="true" aria-label={`${expanded.name} details`}>
          <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <header className="flex items-center justify-between border-b border-ice-200 px-5 py-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold">{expanded.name}</h3>
                <p className="truncate text-xs text-ink-400">{expanded.doc.settings.subject} · {expanded.category}</p>
              </div>
              <button onClick={() => setExpandedId(null)} className="rounded p-1.5 text-ink-400 hover:bg-ice-100" aria-label="Close">×</button>
            </header>
            <div className="flex-1 overflow-auto">
              <div className="border-b border-ice-100 bg-ice-50 p-4">
                <p className="text-sm leading-relaxed text-ink-600">{expanded.description}</p>
                <p className="mt-2 text-xs text-ink-400">Subject: {expanded.doc.settings.subject} — {expanded.doc.settings.preheader}</p>
              </div>
              <div className="p-2">
                <TemplatePreview template={expanded} />
              </div>
            </div>
            <footer className="flex justify-end gap-2 border-t border-ice-200 p-4">
              <button onClick={() => setExpandedId(null)} className="rounded-lg border border-ice-200 px-4 py-2 text-sm">Close</button>
              <button
                onClick={() => void useTemplate(expanded)}
                disabled={!!creating}
                className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
              >
                Use this template
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  )
}
