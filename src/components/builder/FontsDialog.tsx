import { useEffect, useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { WEB_SAFE_FONTS } from '../../builder/model'
import { useFonts, type FontOption } from '../../stores/fonts'

export function FontsDialog({ onClose }: { onClose: () => void }) {
  const brandFonts = useFonts((s) => s.brandFonts)
  const save = useFonts((s) => s.save)
  const [rows, setRows] = useState<FontOption[]>(brandFonts)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => setRows(brandFonts), [brandFonts])

  const addRow = () => setRows((r) => [...r, { name: '', stack: WEB_SAFE_FONTS[0].stack }])
  const removeRow = (i: number) => setRows((r) => r.filter((_, idx) => idx !== i))
  const updateRow = (i: number, patch: Partial<FontOption>) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)))

  const onSave = async () => {
    setError(null)
    const cleaned = rows.filter((r) => r.name.trim() && r.stack.trim())
    setSaving(true)
    try {
      await save(cleaned)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save fonts')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink-900/40 p-6" onClick={onClose}>
      <div
        className="flex max-h-[80vh] w-[560px] max-w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-ice-200 px-5 py-3.5">
          <h2 className="text-sm font-semibold">Brand fonts</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-600 transition hover:bg-ice-100">
            <X className="size-4" />
          </button>
        </header>
        {error && <div className="bg-red-50 px-5 py-2 text-sm text-red-700">{error}</div>}
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <p className="mb-3 text-[11px] leading-relaxed text-ink-400">
            Add custom font stacks. They’ll appear alongside web-safe fonts in every font picker across the builder.
          </p>
          {rows.length === 0 && <p className="text-sm text-ink-400">No brand fonts yet.</p>}
          <div className="flex flex-col gap-3">
            {rows.map((row, i) => (
              <div key={i} className="flex items-start gap-2 rounded-xl border border-ice-200 p-3">
                <div className="flex flex-1 flex-col gap-2">
                  <input
                    value={row.name}
                    onChange={(e) => updateRow(i, { name: e.target.value })}
                    placeholder="Display name (e.g. Brand Sans)"
                    className="w-full rounded-lg border border-ice-200 bg-white px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none"
                  />
                  <select
                    value={WEB_SAFE_FONTS.some((f) => f.stack === row.stack) ? row.stack : '__custom__'}
                    onChange={(e) => {
                      if (e.target.value !== '__custom__') updateRow(i, { stack: e.target.value })
                    }}
                    className="w-full rounded-lg border border-ice-200 bg-white px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none"
                  >
                    {WEB_SAFE_FONTS.map((f) => (
                      <option key={f.name} value={f.stack}>
                        {f.name} preset
                      </option>
                    ))}
                    <option value="__custom__">Custom stack…</option>
                  </select>
                  <input
                    value={row.stack}
                    onChange={(e) => updateRow(i, { stack: e.target.value })}
                    placeholder="font-family stack, e.g. 'Brand Sans', Arial, sans-serif"
                    className="w-full rounded-lg border border-ice-200 bg-white px-2.5 py-1.5 font-mono text-xs focus:border-primary focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => removeRow(i)}
                  title="Remove font"
                  className="mt-1 rounded p-1.5 text-ink-400 transition hover:text-red-600"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addRow}
            className="mt-3 flex items-center gap-1.5 rounded-lg border border-ice-200 px-3 py-2 text-xs font-medium text-ink-600 transition hover:border-primary hover:text-primary"
          >
            <Plus className="size-3.5" />
            Add font
          </button>
        </div>
        <footer className="flex items-center justify-end gap-2 border-t border-ice-200 px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-ice-200 px-3.5 py-2 text-sm font-medium text-ink-600 transition hover:bg-ice-100"
          >
            Cancel
          </button>
          <button
            onClick={() => void onSave()}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </footer>
      </div>
    </div>
  )
}
