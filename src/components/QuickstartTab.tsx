import { useState, useMemo, useEffect } from 'react'
import { FilePlus2, Eye, EyeOff, Lock, Trash2, Unlock } from 'lucide-react'
import { migrateDoc, type EmailDoc } from '../builder/model'
import { api } from '../api/client'
import { navigate } from '../router'
import { TemplatePreview } from './TemplatePreview'

const CATEGORY_ALL = 'All'
// Visible height of the thumbnail
const PREVIEW_HEIGHT = 220

interface QuickstartRow {
  id: number
  name: string
  description: string
  category: string
  json_structure: string
  locked: boolean | number
  created_at: string
}

/** Live preview thumbnail for a quickstart template */
function QuickstartPreview({ doc, name }: { doc: EmailDoc; name: string }) {
  return <TemplatePreview doc={doc} title={name} height={PREVIEW_HEIGHT} />
}

interface Props {
  onCreated: () => void
}

export function QuickstartTab({ onCreated }: Props) {
  const [rows, setRows] = useState<QuickstartRow[] | null>(null)
  const [creating, setCreating] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState(CATEGORY_ALL)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const load = async () => {
    try {
      setRows(await api.get<QuickstartRow[]>('/api/quickstart'))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load quickstart templates')
    }
  }

  useEffect(() => {
    void load()
  }, [])

  // Parse & migrate each row's doc once, keyed by id.
  const docs = useMemo(() => {
    const m = new Map<number, EmailDoc>()
    for (const r of rows ?? []) {
      try {
        m.set(r.id, migrateDoc(JSON.parse(r.json_structure) as unknown))
      } catch {
        // skip rows with unparsable structure
      }
    }
    return m
  }, [rows])

  const availableCategories = useMemo(() => {
    const set = new Set<string>()
    for (const r of rows ?? []) set.add(r.category)
    return Array.from(set).sort()
  }, [rows])

  // URL + localStorage persistence for filter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const f = params.get('qs_filter')
    if (f) setFilter(f)
    else {
      const stored = localStorage.getItem('qs_filter')
      if (stored) setFilter(stored)
    }
  }, [])
  useEffect(() => {
    const url = new URL(window.location.href)
    if (filter === CATEGORY_ALL) url.searchParams.delete('qs_filter')
    else url.searchParams.set('qs_filter', filter)
    window.history.replaceState(null, '', url.toString())
    localStorage.setItem('qs_filter', filter)
  }, [filter])

  const categories = [CATEGORY_ALL, ...availableCategories]
  const counts = useMemo(() => {
    const m = new Map<string, number>()
    m.set(CATEGORY_ALL, rows?.length ?? 0)
    for (const c of availableCategories) m.set(c, (rows ?? []).filter((r) => r.category === c).length)
    return m
  }, [rows, availableCategories])

  const visible = useMemo(() => {
    const all = rows ?? []
    const byCat = filter === CATEGORY_ALL ? all : all.filter((r) => r.category === filter)
    if (!query.trim()) return byCat
    const q = query.toLowerCase()
    return byCat.filter((r) => {
      const doc = docs.get(r.id)
      return r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || (doc?.settings.subject.toLowerCase().includes(q) ?? false)
    })
  }, [rows, filter, query, docs])

  const useTemplate = async (row: QuickstartRow) => {
    if (creating) return
    setCreating(row.id)
    setError(null)
    try {
      const data = await api.post<{ id: number }>('/api/templates', {
        name: row.name,
        json_structure: row.json_structure,
      })
      onCreated()
      navigate(`/editor/${data.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create template')
    } finally {
      setCreating(null)
    }
  }

  const toggleLock = async (row: QuickstartRow) => {
    const locked = !row.locked
    try {
      await api.put(`/api/quickstart/${row.id}/lock`, { locked })
      setRows((prev) => prev?.map((r) => (r.id === row.id ? { ...r, locked } : r)) ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update lock')
    }
  }

  const removeQuickstart = async (row: QuickstartRow) => {
    if (row.locked) {
      setError(`"${row.name}" is locked. Unlock it before deleting.`)
      return
    }
    if (!confirm(`Remove "${row.name}" from Quickstart? This won't affect templates already created from it.`)) return
    try {
      await api.del(`/api/quickstart/${row.id}`)
      setRows((prev) => prev?.filter((r) => r.id !== row.id) ?? null)
      if (expandedId === row.id) setExpandedId(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to remove template')
    }
  }

  const expanded = expandedId ? rows?.find((r) => r.id === expandedId) ?? null : null
  const expandedDoc = expanded ? docs.get(expanded.id) ?? null : null

  return (
    <div>
      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}

      {rows === null ? (
        <p className="py-16 text-center text-sm text-ink-400">Loading…</p>
      ) : (
        <>
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
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" role="list">
              {visible.map((row) => {
                const doc = docs.get(row.id)
                if (!doc) return null
                const isCreatingThis = creating === row.id
                const isExpanded = expandedId === row.id
                return (
                  <article
                    key={row.id}
                    role="listitem"
                    aria-labelledby={`qs-title-${row.id}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-ice-200 bg-white transition hover:border-primary hover:shadow-md focus-within:border-primary"
                  >
                    {/* Live preview thumbnail */}
                    <QuickstartPreview doc={doc} name={row.name} />

                    {/* Card body */}
                    <div className="flex flex-col gap-2 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p id={`qs-title-${row.id}`} className="flex items-center gap-1.5 truncate font-semibold leading-tight">
                            {row.name}
                            {row.locked ? <Lock className="size-3.5 shrink-0 text-ink-400" /> : null}
                          </p>
                          <span className="mt-1 inline-block rounded-full bg-ice-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-500">
                            {row.category}
                          </span>
                          <p className="mt-1 line-clamp-1 text-xs text-ink-400">{doc.settings.subject} — {doc.settings.preheader}</p>
                        </div>
                        {/* Toggle description / open modal */}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : row.id)}
                          className="mt-0.5 shrink-0 rounded p-1.5 text-ink-400 transition hover:bg-ice-50 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                          aria-label={isExpanded ? 'Hide details' : 'Show details'}
                          aria-expanded={isExpanded}
                          title={isExpanded ? 'Hide details' : 'Show details'}
                        >
                          {isExpanded ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                        </button>
                      </div>

                      {isExpanded && (
                        <p className="text-sm leading-relaxed text-ink-500">{row.description}</p>
                      )}

                      <button
                        onClick={() => void useTemplate(row)}
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

                      <div className="mt-1 flex items-center justify-end gap-1">
                        <button
                          onClick={() => void toggleLock(row)}
                          className="rounded-lg p-2 text-ink-600 transition hover:bg-ice-100"
                          title={row.locked ? 'Unlock' : 'Lock to prevent deletion'}
                        >
                          {row.locked ? <Unlock className="size-4" /> : <Lock className="size-4" />}
                        </button>
                        <button
                          onClick={() => void removeQuickstart(row)}
                          disabled={!!row.locked}
                          className="rounded-lg p-2 text-ink-600 transition enabled:hover:bg-red-50 enabled:hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                          title={row.locked ? 'Unlock to delete' : 'Remove from Quickstart'}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Expanded details dialog */}
      {expanded && expandedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4" onClick={() => setExpandedId(null)} role="dialog" aria-modal="true" aria-label={`${expanded.name} details`}>
          <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <header className="flex items-center justify-between border-b border-ice-200 px-5 py-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold">{expanded.name}</h3>
                <p className="truncate text-xs text-ink-400">{expandedDoc.settings.subject} · {expanded.category}</p>
              </div>
              <button onClick={() => setExpandedId(null)} className="rounded p-1.5 text-ink-400 hover:bg-ice-100" aria-label="Close">×</button>
            </header>
            <div className="flex-1 overflow-auto">
              <div className="border-b border-ice-100 bg-ice-50 p-4">
                <p className="text-sm leading-relaxed text-ink-600">{expanded.description}</p>
                <p className="mt-2 text-xs text-ink-400">Subject: {expandedDoc.settings.subject} — {expandedDoc.settings.preheader}</p>
              </div>
              <div className="p-2">
                <QuickstartPreview doc={expandedDoc} name={expanded.name} />
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
