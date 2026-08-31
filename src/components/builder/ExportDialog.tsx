import { useMemo, useState } from 'react'
import { Check, Copy, Download, X } from 'lucide-react'
import { renderEmail } from '../../builder/render'
import { inlineCss } from '../../builder/inliner'
import { useEditor } from '../../stores/editor'

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'template'
}

export function ExportDialog({ onClose }: { onClose: () => void }) {
  const doc = useEditor((s) => s.doc)
  const templateName = useEditor((s) => s.templateName)
  const [copied, setCopied] = useState(false)
  const html = useMemo(() => inlineCss(renderEmail(doc, { markers: false })), [doc])

  const copy = async () => {
    await navigator.clipboard.writeText(html)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const download = () => {
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${slug(templateName)}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink-900/40 p-6" onClick={onClose}>
      <div
        className="flex max-h-[80vh] w-[760px] max-w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-ice-200 px-5 py-3.5">
          <h2 className="text-sm font-semibold">Export HTML</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-600 transition hover:bg-ice-100">
            <X className="size-4" />
          </button>
        </header>
        <div className="flex items-center gap-2 border-b border-ice-100 px-5 py-2.5">
          <span className="text-xs text-ink-400">{(new TextEncoder().encode(html).length / 1024).toFixed(1)} KB · fully inlined · production-ready</span>
          <div className="flex-1" />
          <button
            onClick={() => void copy()}
            className="flex items-center gap-1.5 rounded-lg border border-ice-200 px-3 py-1.5 text-xs font-medium text-ink-600 transition hover:border-primary hover:text-primary"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={download}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-dark"
          >
            <Download className="size-3.5" />
            Download
          </button>
        </div>
        <pre className="min-h-0 flex-1 overflow-auto bg-ink-900 p-4 font-mono text-[11.5px] leading-relaxed text-ice-100">{html}</pre>
      </div>
    </div>
  )
}
