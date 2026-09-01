import { useEffect, useState } from 'react'
import { FilePlus2, KeyRound, LogOut, Pencil, Snowflake, Trash2, Zap } from 'lucide-react'
import { api } from '../api/client'
import { formatDateTime } from '../lib/utils'
import { navigate } from '../router'
import { useAuth } from '../stores/auth'
import { QuickstartTab } from '../components/QuickstartTab'

interface TemplateRow {
  id: number
  name: string
  created_at: string
  updated_at: string
  version_count: number
}

type Tab = 'my-templates' | 'quickstart'

export default function TemplateList() {
  const logout = useAuth((s) => s.logout)
  const changePassword = useAuth((s) => s.changePassword)
  const [templates, setTemplates] = useState<TemplateRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [renaming, setRenaming] = useState<TemplateRow | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [tab, setTab] = useState<Tab>('my-templates')
  const [showChangePw, setShowChangePw] = useState(false)
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNext, setPwNext] = useState('')
  const [pwError, setPwError] = useState<string | null>(null)

  const load = async () => {
    try {
      setTemplates(await api.get<TemplateRow[]>('/api/templates'))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load templates')
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const createTemplate = async () => {
    try {
      const data = await api.post<{ id: number }>('/api/templates', { name: 'Untitled template' })
      navigate(`/editor/${data.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create template')
    }
  }

  const remove = async (template: TemplateRow) => {
    if (!confirm(`Delete "${template.name}" and its ${template.version_count} saved versions? This cannot be undone.`)) return
    try {
      await api.del(`/api/templates/${template.id}`)
      setTemplates((rows) => rows?.filter((r) => r.id !== template.id) ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete template')
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

  const handleChangePw = async () => {
    const err = await changePassword(pwCurrent, pwNext)
    if (err) { setPwError(err); return }
    setShowChangePw(false)
    setPwCurrent(''); setPwNext(''); setPwError(null)
  }

  return (
    <div className="h-full overflow-auto">
      <header className="sticky top-0 z-10 border-b border-ice-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Snowflake className="size-6 text-primary" />
            <span className="text-lg font-bold tracking-tight">eTemplator</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowChangePw(true)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-600 transition hover:bg-ice-100 hover:text-ink-900"
            >
              <KeyRound className="size-4" />
              Change password
            </button>
            <button
              onClick={() => void logout()}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-600 transition hover:bg-ice-100 hover:text-ink-900"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
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
        </div>

        {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

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
              <ul className="divide-y divide-ice-100 overflow-hidden rounded-2xl border border-ice-200 bg-white">
                {templates.map((t) => (
                  <li key={t.id} className="group flex items-center gap-4 px-5 py-4 transition hover:bg-ice-50">
                    <button
                      onClick={() => navigate(`/editor/${t.id}`)}
                      className="min-w-0 flex-1 text-left"
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
                        <p className="truncate font-semibold">{t.name}</p>
                      )}
                      <p className="mt-0.5 text-xs text-ink-400">
                        Updated {formatDateTime(t.updated_at)} · {t.version_count} versions
                      </p>
                    </button>
                    <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
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
                        onClick={() => void remove(t)}
                        className="rounded-lg p-2 text-ink-600 transition hover:bg-red-50 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {tab === 'quickstart' && (
          <QuickstartTab onCreated={() => { void load(); setTab('my-templates') }} />
        )}
      </main>

      {showChangePw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-base font-semibold">Change password</h2>
            {pwError && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{pwError}</p>}
            <label className="mb-1 block text-xs font-medium text-ink-600">Current password</label>
            <input type="password" value={pwCurrent} onChange={e => setPwCurrent(e.target.value)}
              className="mb-3 w-full rounded-lg border border-ice-200 px-3 py-2 text-sm outline-none focus:border-primary" />
            <label className="mb-1 block text-xs font-medium text-ink-600">New password</label>
            <input type="password" value={pwNext} onChange={e => setPwNext(e.target.value)}
              className="mb-5 w-full rounded-lg border border-ice-200 px-3 py-2 text-sm outline-none focus:border-primary" />
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowChangePw(false); setPwError(null) }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ice-100">
                Cancel
              </button>
              <button onClick={() => void handleChangePw()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark">
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
