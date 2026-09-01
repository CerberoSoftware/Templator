import { useState, useMemo, useRef, useEffect } from 'react'
import { FilePlus2, Eye, EyeOff } from 'lucide-react'
import { QUICKSTART_TEMPLATES, QUICKSTART_CATEGORIES, type QuickstartTemplate } from '../data/quickstartTemplates'
import { renderEmail } from '../builder/render'
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
  const [docHeight, setDocHeight] = useState(900)
  const scale = PREVIEW_WIDTH / template.doc.settings.contentWidth
  const html = useMemo(() => renderEmail(template.doc), [template.id])

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    const onLoad = () => {
      const h = iframe.contentDocument?.documentElement.scrollHeight ?? 900
      setDocHeight(h)
    }
    iframe.addEventListener('load', onLoad)
    return () => iframe.removeEventListener('load', onLoad)
  }, [html])

  const scaledHeight = docHeight * scale

  return (
    // Outer clip — fixed visible size
    <div
      className="relative w-full overflow-hidden rounded-t-xl bg-[#f4f8fc]"
      style={{ height: PREVIEW_HEIGHT }}
    >
      {/* Scaled wrapper */}
      <div
        style={{
          width: template.doc.settings.contentWidth,
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
          style={{
            width: template.doc.settings.contentWidth,
            height: Math.max(docHeight, 400),
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
    </div>
  )
}

interface Props {
  onCreated: () => void
}

export function QuickstartTab({ onCreated }: Props) {
  const [creating, setCreating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState(CATEGORY_ALL)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const categories = [CATEGORY_ALL, ...QUICKSTART_CATEGORIES]

  const visible = useMemo(
    () =>
      filter === CATEGORY_ALL
        ? QUICKSTART_TEMPLATES
        : QUICKSTART_TEMPLATES.filter((t) => t.category === filter),
    [filter],
  )

  const useTemplate = async (template: QuickstartTemplate) => {
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

  return (
    <div>
      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {/* Category filter pills */}
      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
              filter === cat
                ? 'border-primary bg-primary text-white'
                : 'border-ice-200 bg-white text-ink-600 hover:border-primary hover:text-primary'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {visible.map((template) => {
          const isExpanded = expandedId === template.id
          return (
            <div
              key={template.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-ice-200 bg-white transition hover:border-primary hover:shadow-md"
            >
              {/* Live preview thumbnail */}
              <TemplatePreview template={template} />

              {/* Card body */}
              <div className="flex flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold leading-tight">{template.name}</p>
                    <span className="mt-1 inline-block rounded-full bg-ice-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-500">
                      {template.category}
                    </span>
                  </div>
                  {/* Toggle description */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : template.id)}
                    className="mt-0.5 shrink-0 rounded p-1 text-ink-400 transition hover:text-primary"
                    title={isExpanded ? 'Hide description' : 'Show description'}
                  >
                    {isExpanded ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>

                {isExpanded && (
                  <p className="text-sm leading-relaxed text-ink-500">{template.description}</p>
                )}

                <button
                  onClick={() => void useTemplate(template)}
                  disabled={creating !== null}
                  className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-50"
                >
                  {creating === template.id ? (
                    <span className="animate-pulse">Creating…</span>
                  ) : (
                    <>
                      <FilePlus2 className="size-4" />
                      Use this template
                    </>
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
