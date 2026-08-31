import { useState } from 'react'
import { AlertTriangle, CheckCircle2, FileInput, X } from 'lucide-react'
import { cleanLegacy } from '../../builder/legacyImport'
import { parseEmailHtmlDetailed } from '../../builder/parser'
import { renderEmail } from '../../builder/render'
import { inlineCss } from '../../builder/inliner'
import { useEditor } from '../../stores/editor'

interface ImportPreview {
  warnings: string[]
  blockCount: number
  rawCount: number
  previewHtml: string
}

export function ImportDialog({ onClose }: { onClose: () => void }) {
  const replaceDoc = useEditor((s) => s.replaceDoc)
  const [pasted, setPasted] = useState('')
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [error, setError] = useState<string | null>(null)

  const analyze = () => {
    setError(null)
    if (pasted.trim() === '') {
      setError('Paste some HTML first.')
      return
    }
    try {
      const cleaned = cleanLegacy(pasted)
      const parsed = parseEmailHtmlDetailed(cleaned.html)
      if (parsed === null) {
        setError('Could not find any structure to import.')
        return
      }
      const rawCount = parsed.doc.blocks.filter((b) => b.type === 'raw').length
      setPreview({
        warnings: cleaned.warnings,
        blockCount: parsed.doc.blocks.length,
        rawCount,
        previewHtml: inlineCss(renderEmail(parsed.doc, { markers: false })),
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed')
    }
  }

  const importIntoEditor = () => {
    if (!preview) return
    const cleaned = cleanLegacy(pasted)
    const parsed = parseEmailHtmlDetailed(cleaned.html)
    if (parsed !== null) replaceDoc(parsed.doc)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink-900/40 p-6" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-[860px] max-w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-ice-200 px-5 py-3.5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <FileInput className="size-4 text-primary" />
            Import legacy HTML
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-600 transition hover:bg-ice-100">
            <X className="size-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {preview === null ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-ink-600">
                Paste the full HTML of an existing email. Scripts and unsafe attributes are stripped, class CSS is inlined, and recognizable rows
                (text, headings, images, buttons, spacers) are converted into editable blocks — the rest is kept as raw HTML.
              </p>
              <textarea
                value={pasted}
                onChange={(e) => setPasted(e.target.value)}
                rows={14}
                placeholder="<!DOCTYPE html> …"
                className="w-full resize-y rounded-lg border border-ice-200 bg-white p-3 font-mono text-xs focus:border-primary focus:outline-none"
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex justify-end">
                <button
                  onClick={analyze}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark"
                >
                  Clean &amp; preview
                </button>
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-col gap-4 md:flex-row">
              <div className="flex w-full min-w-0 flex-col gap-3 md:w-72">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle2 className="size-4 text-green-600" />
                  {preview.blockCount} block{preview.blockCount === 1 ? '' : 's'} recognized
                </div>
                {preview.rawCount > 0 && (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
                    {preview.rawCount} row(s) kept as raw HTML blocks — they render exactly as imported but cannot be edited with the property panel.
                  </p>
                )}
                <div className="flex flex-col gap-1.5 overflow-y-auto">
                  {preview.warnings.length === 0 ? (
                    <p className="text-xs text-ink-400">No issues found.</p>
                  ) : (
                    preview.warnings.map((w, i) => (
                      <p key={i} className="flex items-start gap-1.5 text-xs leading-snug text-ink-600">
                        <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                        {w}
                      </p>
                    ))
                  )}
                </div>
                <div className="mt-auto flex gap-2">
                  <button
                    onClick={importIntoEditor}
                    className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark"
                  >
                    Import
                  </button>
                  <button
                    onClick={() => setPreview(null)}
                    className="rounded-lg border border-ice-200 px-3 py-2 text-sm font-medium text-ink-600 transition hover:bg-ice-100"
                  >
                    Back
                  </button>
                </div>
              </div>
              <iframe
                title="Import preview"
                srcDoc={preview.previewHtml}
                sandbox="allow-same-origin"
                className="min-h-[380px] w-full flex-1 rounded-xl border border-ice-200 bg-white"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
