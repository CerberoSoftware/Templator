import { useEffect, useState } from 'react'
import { FilePlus2, Lock, Pencil, Palette, Rocket, RotateCcw, Snowflake, Trash2, Unlock, XCircle, Zap } from 'lucide-react'
import { api } from '../api/client'
import { formatDateTime } from '../lib/utils'
import { navigate } from '../router'
import { QuickstartTab } from '../components/QuickstartTab'
import { TemplatePreview } from '../components/TemplatePreview'
import { migrateDoc, type EmailDoc } from '../builder/model'

const CARD_PREVIEW_HEIGHT = 220

interface TemplateRow {
  id: number
  name: string
  locked: boolean | number
  created_at: string
  updated_at: string
  version_count: number
}

interface TrashedTemplateRow extends TemplateRow {
  deleted_at: string
}

const TRASH_RETENTION_DAYS = 30

function daysRemaining(deletedAt: string): number {
  const deleted = new Date(deletedAt.includes('T') ? deletedAt : deletedAt.replace(' ', 'T') + 'Z')
  if (Number.isNaN(deleted.getTime())) return TRASH_RETENTION_DAYS
  const elapsedMs = Date.now() - deleted.getTime()
  const remaining = TRASH_RETENTION_DAYS - Math.floor(elapsedMs / (24 * 60 * 60 * 1000))
  return Math.max(0, remaining)
}

type Tab = 'my-templates' | 'quickstart' | 'recycle-bin'

/** Fetches a template's saved structure and renders a live thumbnail, like the Quickstart cards. */
function TemplateThumbnail({ id, name }: { id: number; name: string }) {
  const [doc, setDoc] = useState<EmailDoc | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    setDoc(null)
    setFailed(false)
    void (async () => {
      try {
        const template = await api.get<{ json_structure: string | null }>(`/api/templates/${id}`)
        if (cancelled) return
        if (!template.json_structure) {
          setFailed(true)
          return
        }
        setDoc(migrateDoc(JSON.parse(template.json_structure) as unknown))
      } catch {
        if (!cancelled) setFailed(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  if (failed) {
    return (
      <div
        className="flex w-full items-center justify-center rounded-t-xl bg-[#f4f8fc] text-xs text-ink-400"
        style={{ height: CARD_PREVIEW_HEIGHT }}
      >
        No preview available
      </div>
    )
  }
  if (!doc) {
    return (
      <div
        className="flex w-full animate-pulse items-center justify-center rounded-t-xl bg-[#f4f8fc] text-xs text-ink-400"
        style={{ height: CARD_PREVIEW_HEIGHT }}
      >
        Loading preview…
      </div>
    )
  }
  return <TemplatePreview doc={doc} title={name} height={CARD_PREVIEW_HEIGHT} />
}

export default function TemplateList() {
  const [templates, setTemplates] = useState<TemplateRow[] | null>(null)
  const [trashed, setTrashed] = useState<TrashedTemplateRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [renaming, setRenaming] = useState<TemplateRow | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [tab, setTab] = useState<Tab>('my-templates')
  const [addingToQuickstart, setAddingToQuickstart] = useState<TemplateRow | null>(null)
  const [qsCategory, setQsCategory] = useState('Custom')
  const [qsDescription, setQsDescription] = useState('')
  const [qsSaving, setQsSaving] = useState(false)

  const load = async () => {
    try {
      setTemplates(await api.get<TemplateRow[]>('/api/templates'))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load templates')
    }
  }

  const loadTrash = async () => {
    try {
      setTrashed(await api.get<TrashedTemplateRow[]>('/api/templates/trash'))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load recycle bin')
    }
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    if (tab === 'recycle-bin') void loadTrash()
  }, [tab])

  const createTemplate = async () => {
    try {
      const data = await api.post<{ id: number }>('/api/templates', { name: 'Untitled template' })
      navigate(`/editor/${data.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create template')
    }
  }

  const remove = async (template: TemplateRow) => {
    if (template.locked) {
      setError(`"${template.name}" is locked. Unlock it before deleting.`)
      return
    }
    if (!confirm(`Move "${template.name}" to the recycle bin? It can be restored within ${TRASH_RETENTION_DAYS} days.`)) return
    try {
      await api.del(`/api/templates/${template.id}`)
      setTemplates((rows) => rows?.filter((r) => r.id !== template.id) ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete template')
    }
  }

  const toggleLock = async (template: TemplateRow) => {
    const locked = !template.locked
    try {
      await api.put(`/api/templates/${template.id}/lock`, { locked })
      setTemplates((rows) => rows?.map((r) => (r.id === template.id ? { ...r, locked } : r)) ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update lock')
    }
  }

  const restoreTemplate = async (template: TrashedTemplateRow) => {
    try {
      await api.post(`/api/templates/${template.id}/restore`)
      setTrashed((rows) => rows?.filter((r) => r.id !== template.id) ?? null)
      void load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to restore template')
    }
  }

  const purgeTemplate = async (template: TrashedTemplateRow) => {
    if (!confirm(`Permanently delete "${template.name}" and its ${template.version_count} saved versions? This cannot be undone.`)) return
    try {
      await api.del(`/api/templates/${template.id}/permanent`)
      setTrashed((rows) => rows?.filter((r) => r.id !== template.id) ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to permanently delete template')
    }
  }

  const commitRename = async () => {
    if (!renaming) return
    const name = renameValue.trim()
    const target = renaming
    setRenaming(null)
    if (name === '' || name === target.name) return
    try {
      await api.put(`/api/templates/${target.id}`, { name })
      setTemplates((rows) => rows?.map((r) => (r.id === target.id ? { ...r, name } : r)) ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to rename template')
    }
  }

  const submitAddToQuickstart = async () => {
    if (!addingToQuickstart) return
    setQsSaving(true)
    try {
      await api.post('/api/quickstart', {
        template_id: addingToQuickstart.id,
        category: qsCategory.trim() || 'Custom',
        description: qsDescription.trim(),
      })
      setNotice(`"${addingToQuickstart.name}" added to Quickstart.`)
      setAddingToQuickstart(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add template to Quickstart')
    } finally {
      setQsSaving(false)
    }
  }

  return (
    <div className="h-full overflow-auto">
      <header className="sticky top-0 z-10 border-b border-ice-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Snowflake className="size-6 text-primary" />
            <span className="text-lg font-bold tracking-tight">Templator 2</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate('/settings')}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-600 transition hover:bg-ice-100 hover:text-ink-900"
              title="Brand colours"
            >
              <Palette className="size-4" />
              Brand colours
            </button>

          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
            <p className="mt-1 text-sm text-ink-600">Build and export highly compatible email templates.</p>
          </div>
          {tab === 'my-templates' && (
            <button
              onClick={() => void createTemplate()}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
            >
              <FilePlus2 className="size-4" />
              New template
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl border border-ice-200 bg-ice-50 p-1">
          <button
            onClick={() => setTab('my-templates')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === 'my-templates' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            <Snowflake className="size-4" />
            My Templates
          </button>
          <button
            onClick={() => setTab('quickstart')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === 'quickstart' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            <Zap className="size-4" />
            Quickstart
          </button>
          <button
            onClick={() => setTab('recycle-bin')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === 'recycle-bin' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            <Trash2 className="size-4" />
            Recycle Bin
          </button>
        </div>

        {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {notice && <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p>}

        {tab === 'my-templates' && (
          <>
            {templates === null ? (
              <p className="py-16 text-center text-sm text-ink-400">Loading…</p>
            ) : templates.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-ice-200 bg-white py-16 text-center">
                <Snowflake className="mx-auto mb-3 size-8 text-ice-300" />
                <p className="font-medium">No templates yet</p>
                <p className="mt-1 text-sm text-ink-600">Create your first template to get started, or pick one from the <button onClick={() => setTab('quickstart')} className="text-primary hover:underline">Quickstart</button> tab.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {templates.map((t) => (
                  <article
                    key={t.id}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-ice-200 bg-white transition hover:border-primary hover:shadow-md focus-within:border-primary"
                  >
                    <button
                      onClick={() => navigate(`/editor/${t.id}`)}
                      className="block text-left"
                      title="Open in builder"
                    >
                      <TemplateThumbnail id={t.id} name={t.name} />
                    </button>

                    <div className="flex flex-col gap-2 p-4">
                      <button
                        onClick={() => navigate(`/editor/${t.id}`)}
                        className="min-w-0 text-left"
                        title="Open in builder"
                      >
                        {renaming?.id === t.id ? (
                          <input
                            value={renameValue}
                            autoFocus
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={() => void commitRename()}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') void commitRename()
                              if (e.key === 'Escape') setRenaming(null)
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full rounded border border-primary px-2 py-1 text-sm font-semibold outline-none"
                          />
                        ) : (
                          <p className="flex items-center gap-1.5 truncate font-semibold">
                            {t.name}
                            {t.locked ? <Lock className="size-3.5 shrink-0 text-ink-400" /> : null}
                          </p>
                        )}
                        <p className="mt-0.5 text-xs text-ink-400">
                          Updated {formatDateTime(t.updated_at)} · {t.version_count} versions
                        </p>
                      </button>
                      <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                        <button
                          onClick={() => {
                            setRenaming(t)
                            setRenameValue(t.name)
                          }}
                          className="rounded-lg p-2 text-ink-600 transition hover:bg-ice-100"
                          title="Rename"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => {
                            setAddingToQuickstart(t)
                            setQsCategory('Custom')
                            setQsDescription('')
                          }}
                          className="rounded-lg p-2 text-ink-600 transition hover:bg-ice-100"
                          title="Add to Quickstart"
                        >
                          <Rocket className="size-4" />
                        </button>
                        <button
                          onClick={() => void toggleLock(t)}
                          className="rounded-lg p-2 text-ink-600 transition hover:bg-ice-100"
                          title={t.locked ? 'Unlock' : 'Lock to prevent deletion'}
                        >
                          {t.locked ? <Unlock className="size-4" /> : <Lock className="size-4" />}
                        </button>
                        <button
                          onClick={() => void remove(t)}
                          disabled={!!t.locked}
                          className="rounded-lg p-2 text-ink-600 transition enabled:hover:bg-red-50 enabled:hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                          title={t.locked ? 'Unlock to delete' : 'Delete'}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'quickstart' && (
          <QuickstartTab onCreated={() => { void load(); setTab('my-templates') }} />
        )}

        {tab === 'recycle-bin' && (
          <>
            {trashed === null ? (
              <p className="py-16 text-center text-sm text-ink-400">Loading…</p>
            ) : trashed.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-ice-200 bg-white py-16 text-center">
                <Trash2 className="mx-auto mb-3 size-8 text-ice-300" />
                <p className="font-medium">Recycle bin is empty</p>
                <p className="mt-1 text-sm text-ink-600">Deleted templates stay here for {TRASH_RETENTION_DAYS} days before they're permanently removed.</p>
              </div>
            ) : (
              <ul className="divide-y divide-ice-100 overflow-hidden rounded-2xl border border-ice-200 bg-white">
                {trashed.map((t) => (
                  <li key={t.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{t.name}</p>
                      <p className="mt-0.5 text-xs text-ink-400">
                        Deleted {formatDateTime(t.deleted_at)} · {t.version_count} versions · {daysRemaining(t.deleted_at)} day{daysRemaining(t.deleted_at) === 1 ? '' : 's'} left
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => void restoreTemplate(t)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-600 transition hover:bg-ice-100"
                        title="Restore"
                      >
                        <RotateCcw className="size-4" />
                        Restore
                      </button>
                      <button
                        onClick={() => void purgeTemplate(t)}
                        className="rounded-lg p-2 text-ink-600 transition hover:bg-red-50 hover:text-red-600"
                        title="Delete permanently"
                      >
                        <XCircle className="size-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>

      {addingToQuickstart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-1 text-base font-semibold">Add to Quickstart</h2>
            <p className="mb-4 text-sm text-ink-500">Adds "{addingToQuickstart.name}" to the Quickstart library so it can be reused to start new templates.</p>
            <label className="mb-1 block text-xs font-medium text-ink-600">Category</label>
            <input value={qsCategory} onChange={(e) => setQsCategory(e.target.value)} placeholder="Custom"
              className="mb-3 w-full rounded-lg border border-ice-200 px-3 py-2 text-sm outline-none focus:border-primary" />
            <label className="mb-1 block text-xs font-medium text-ink-600">Description (optional)</label>
            <textarea value={qsDescription} onChange={(e) => setQsDescription(e.target.value)} rows={3}
              className="mb-5 w-full resize-none rounded-lg border border-ice-200 px-3 py-2 text-sm outline-none focus:border-primary" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setAddingToQuickstart(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ice-100">
                Cancel
              </button>
              <button onClick={() => void submitAddToQuickstart()} disabled={qsSaving}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50">
                {qsSaving ? 'Adding…' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
