import { useEffect, useState } from 'react'
import { ArrowLeft, Palette, Plus, Trash2, Check } from 'lucide-react'
import { navigate } from '../router'
import { api } from '../api/client'
import { useBrandColours } from '../stores/brandColours'

function isHex(v: string) {
  return /^#[0-9a-fA-F]{6}$/.test(v)
}

export default function SettingsPage() {
  const colours = useBrandColours((s) => s.colours)
  const loaded = useBrandColours((s) => s.loaded)
  const load = useBrandColours((s) => s.load)
  const save = useBrandColours((s) => s.save)

  const [draft, setDraft] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (loaded) setDraft(colours)
  }, [colours, loaded])

  const add = () => {
    if (draft.length >= 5) return
    setDraft([...draft, '#2b7fe0'])
    setError(null)
  }

  const remove = (i: number) => setDraft(draft.filter((_, idx) => idx !== i))

  const update = (i: number, hex: string) => {
    const next = [...draft]
    next[i] = hex
    setDraft(next)
  }

  const onSave = async () => {
    const cleaned = draft.map((c) => c.trim().toLowerCase()).filter((c) => isHex(c))
    // dedup
    const uniq: string[] = []
    for (const c of cleaned) if (!uniq.includes(c)) uniq.push(c)
    if (uniq.length !== draft.length) {
      // keep raw but warn
    }
    const invalid = draft.filter((c) => !isHex(c.trim()))
    if (invalid.length > 0) {
      setError(`Fix invalid hex colours: ${invalid.join(', ')} — use #rrggbb`)
      return
    }
    if (uniq.length > 5) {
      setError('Maximum 5 brand colours.')
      return
    }
    // dedup by lowercasing
    if (new Set(uniq).size !== uniq.length) {
      setError('Duplicate colours are not allowed.')
      return
    }
    setError(null)
    setSaving(true)
    try {
      await save(uniq)
      setSavedAt(new Date().toLocaleTimeString())
      setTimeout(() => setSavedAt(null), 2500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const canSave = draft.length <= 5 && draft.every((c) => isHex(c.trim())) && draft.map((c) => c.toLowerCase()).length === new Set(draft.map((c) => c.toLowerCase())).size

  return (
    <div className="min-h-full bg-ice-50">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-ice-200 bg-white px-4 py-3">
        <button onClick={() => navigate('/')} className="rounded-lg p-2 text-ink-600 hover:bg-ice-100" aria-label="Back to templates">
          <ArrowLeft className="size-4" />
        </button>
        <div className="flex items-center gap-2">
          <Palette className="size-4 text-primary" />
          <h1 className="text-sm font-semibold">Brand settings</h1>
          <span className="hidden text-xs text-ink-400 sm:inline">— up to 5 brand colours, used across the Design page</span>
        </div>
        <div className="flex-1" />
        <button onClick={() => void onSave()} disabled={saving || !canSave} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50">
          {saving ? 'Saving…' : 'Save colours'}
        </button>
      </header>

      <main className="mx-auto max-w-3xl p-6">
        <div className="rounded-2xl border border-ice-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs text-white">1</span>
            Brand colours
            <span className="ml-2 rounded-full bg-ice-100 px-2 py-0.5 text-xs font-medium text-ink-500">{draft.length}/5</span>
          </h2>
          <p className="mt-1 text-sm text-ink-500">These colours appear at the top of every colour picker in the Design page for one-click application. Add your primary, secondary and accent colours.</p>

          {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
          {savedAt && <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700"><Check className="size-3.5" /> Saved at {savedAt}</p>}

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {draft.map((hex, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-ice-200 bg-ice-50/50 p-3">
                <input
                  type="color"
                  value={isHex(hex) ? hex : '#ffffff'}
                  onChange={(e) => update(i, e.target.value)}
                  className="size-10 cursor-pointer rounded-lg border border-ice-200 bg-white p-1"
                  aria-label={`Brand colour ${i + 1}`}
                />
                <div className="min-w-0 flex-1">
                  <label className="text-xs font-medium text-ink-600">Colour {i + 1}</label>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="hidden size-3 rounded-full border border-ice-200 sm:inline-block" style={{ backgroundColor: isHex(hex) ? hex : 'transparent' }} />
                    <input
                      value={hex}
                      onChange={(e) => update(i, e.target.value)}
                      placeholder="#2b7fe0"
                      className="w-full rounded-lg border border-ice-200 bg-white px-2.5 py-1.5 font-mono text-xs focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
                <button onClick={() => remove(i)} className="rounded p-2 text-ink-400 hover:bg-white hover:text-red-600" title="Remove" aria-label={`Remove colour ${i + 1}`}>
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
            {draft.length === 0 && (
              <div className="col-span-2 rounded-xl border-2 border-dashed border-ice-200 p-8 text-center text-sm text-ink-400">No brand colours yet — add one below.</div>
            )}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={add}
              disabled={draft.length >= 5}
              className="flex items-center gap-1.5 rounded-lg border border-dashed border-ice-300 bg-white px-3.5 py-2 text-sm font-medium text-ink-600 hover:border-primary hover:text-primary disabled:opacity-40"
            >
              <Plus className="size-4" />
              Add colour {draft.length >= 5 ? '(max 5)' : ''}
            </button>
            <span className="text-xs text-ink-400">{draft.length < 5 ? `${5 - draft.length} slots left` : 'Maximum reached — remove one to add another'}</span>
          </div>

          <div className="mt-6 rounded-xl bg-ice-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Preview — how they appear in the Design page</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {draft.length === 0 ? (
                <span className="text-xs text-ink-400">Pick colours above to see them here.</span>
              ) : (
                draft.map((c, i) => (
                  <span key={i} className="flex items-center gap-2 rounded-full border border-ice-200 bg-white px-2.5 py-1.5 text-xs">
                    <span className="size-4 rounded-full border border-ice-200" style={{ backgroundColor: isHex(c) ? c : '#fff' }} />
                    <span className="font-mono">{c.toLowerCase()}</span>
                  </span>
                ))
              )}
            </div>
            <p className="mt-2 text-[11px] text-ink-400">In the Design page, these swatches sit at the very top of each colour picker — one click to apply, no typing hex codes.</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={() => navigate('/')} className="rounded-lg border border-ice-200 bg-white px-4 py-2 text-sm">Back to templates</button>
          <button
            onClick={async () => {
              try {
                const rows = await api.get<{ id: number }[]>('/api/templates')
                if (rows.length > 0) {
                  navigate(`/editor/${rows[0].id}`)
                  return
                }
              } catch {
                // fall through to create
              }
              try {
                const data = await api.post<{ id: number }>('/api/templates', { name: 'Untitled template' })
                navigate(`/editor/${data.id}`)
              } catch {
                navigate('/')
              }
            }}
            className="rounded-lg border border-ice-200 bg-white px-4 py-2 text-sm hover:border-primary hover:text-primary"
          >
            Go to Design (demo)
          </button>
        </div>
      </main>
    </div>
  )
}
