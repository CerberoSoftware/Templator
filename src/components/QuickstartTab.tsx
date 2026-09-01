import { useState, useMemo } from 'react'
import { FilePlus2, Layers } from 'lucide-react'
import { QUICKSTART_TEMPLATES, QUICKSTART_CATEGORIES, type QuickstartTemplate } from '../data/quickstartTemplates'
import { api } from '../api/client'
import { navigate } from '../router'

const CATEGORY_ALL = 'All'

interface Props {
  onCreated: () => void
}

export function QuickstartTab({ onCreated }: Props) {
  const [creating, setCreating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState(CATEGORY_ALL)

  const categories = [CATEGORY_ALL, ...QUICKSTART_CATEGORIES]

  const visible = useMemo(
    () => filter === CATEGORY_ALL ? QUICKSTART_TEMPLATES : QUICKSTART_TEMPLATES.filter((t) => t.category === filter),
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {visible.map((template) => (
          <div
            key={template.id}
            className="group flex flex-col overflow-hidden rounded-2xl border border-ice-200 bg-white transition hover:border-primary hover:shadow-sm"
          >
            {/* Mini colour band matching the header bg */}
            <div className="h-1.5 w-full" style={{ backgroundColor: template.doc.blocks[0]?.type === 'header' ? (template.doc.blocks[0].props as { bgColor: string }).bgColor : '#2b7fe0' }} />

            <div className="flex flex-1 flex-col gap-2 p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold leading-tight">{template.name}</p>
                  <span className="mt-1 inline-block rounded-full bg-ice-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-500">
                    {template.category}
                  </span>
                </div>
                <Layers className="mt-0.5 size-4 shrink-0 text-ice-300" />
              </div>
              <p className="flex-1 text-sm leading-relaxed text-ink-500">{template.description}</p>
              <button
                onClick={() => void useTemplate(template)}
                disabled={creating !== null}
                className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-50"
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
        ))}
      </div>
    </div>
  )
}
