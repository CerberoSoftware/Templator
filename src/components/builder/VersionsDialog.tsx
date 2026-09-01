import { useEffect, useState } from 'react'
import { ArrowLeft, RotateCcw, X } from 'lucide-react'
import { api } from '../../api/client'
import { migrateDoc, type EmailDoc } from '../../builder/model'
import { useEditor } from '../../stores/editor'

interface VersionRow {
  id: number
  label: string
  created_at: string
  json_bytes: number
  html_bytes: number
}

interface VersionFull extends VersionRow {
  json_structure: string
  final_html: string
}

export function VersionsDialog({ onClose }: { onClose: () => void }) {
  const templateId = useEditor((s) => s.templateId)
  const replaceDoc = useEditor((s) => s.replaceDoc)
  const [versions, setVersions] = useState<VersionRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<VersionFull | null>(null)
  const [restoring, setRestoring] = useState(false)

  useEffect(() => {
    api
      .get<VersionRow[]>(`/api/templates/${templateId}/versions`)
      .then(setVersions)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load versions'))
  }, [templateId])

  const restore = async (id: number) => {
    setRestoring(true)
    try {
      await api.post(`/api/templates/${templateId}/versions/${id}/restore`)
      const full = await api.get<VersionFull>(`/api/templates/${templateId}/versions/${id}`)
      let doc: EmailDoc | null = null
      try {
        const parsed = JSON.parse(full.json_structure) as EmailDoc
        if (parsed && Array.isArray(parsed.blocks) && parsed.settings) doc = migrateDoc(parsed)
      } catch {
        doc = null
      }
      if (doc) {
        replaceDoc(doc)
        onClose()
      } else {
        setError('Restored version has unreadable JSON.')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Restore failed')
    } finally {
      setRestoring(false)
    }
  }

  const openPreview = async (id: number) => {
    try {
      setPreview(await api.get<VersionFull>(`/api/templates/${templateId}/versions/${id}`))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load version')
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink-900/40 p-6" onClick={onClose}>
      <div
        className="flex max-h-[80vh] w-[640px] max-w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-ice-200 px-5 py-3.5">
          <div className="flex items-center gap-2">
            {preview && (
              <button onClick={() => setPreview(null)} className="rounded-lg p-1.5 text-ink-600 transition hover:bg-ice-100">
                <ArrowLeft className="size-4" />
              </button>
            )}
            <h2 className="text-sm font-semibold">{preview ? `Version: ${preview.label}` : 'Version history'}</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-600 transition hover:bg-ice-100">
            <X className="size-4" />
          </button>
        </header>
        {error && <div className="bg-red-50 px-5 py-2 text-sm text-red-700">{error}</div>}
        {!preview && (
          <div className="min-h-0 flex-1 overflow-y-auto">
            {versions === null && !error && <p className="p-5 text-sm text-ink-400">Loading…</p>}
            {versions !== null && versions.length === 0 && (
              <p className="p-5 text-sm text-ink-400">No versions yet — every save creates a snapshot automatically.</p>
            )}
            {versions?.map((v) => (
              <div key={v.id} className="flex items-center gap-3 border-b border-ice-100 px-5 py-3 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{v.label}</p>
                  <p className="text-xs text-ink-400">
                    {new Date(v.created_at.replace(' ', 'T') + 'Z').toLocaleString()} · {Math.max(1, Math.round(v.json_bytes / 1024))} KB structure
                  </p>
                </div>
                <button
                  onClick={() => void openPreview(v.id)}
                  className="rounded-lg border border-ice-200 px-3 py-1.5 text-xs font-medium text-ink-600 transition hover:border-primary hover:text-primary"
                >
                  Preview
                </button>
                <button
                  onClick={() => void restore(v.id)}
                  disabled={restoring}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-dark disabled:opacity-50"
                >
                  <RotateCcw className="size-3.5" />
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}
        {preview && (
          <iframe title="Version preview" srcDoc={preview.final_html || '<p style="font-family:Arial;padding:20px;color:#8aa0b8;">No HTML stored for this version.</p>'} className="min-h-0 flex-1 border-0" sandbox="allow-same-origin" />
        )}
      </div>
    </div>
  )
}
