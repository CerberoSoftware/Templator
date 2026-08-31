import { useMemo } from 'react'
import { AlertTriangle } from 'lucide-react'
import { renderEmail } from '../../builder/render'
import { inlineCss } from '../../builder/inliner'
import { useEditor } from '../../stores/editor'

const GMAIL_CLIP_BYTES = 102400

function byteLength(s: string): number {
  return new TextEncoder().encode(s).length
}

function PreviewFrame({ html, width, label }: { html: string; width: number; label: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-ink-600">
        <span className="rounded-full bg-ice-100 px-2.5 py-1">{label}</span>
        <span className="text-ink-400">{width}px</span>
      </div>
      <div
        className="flex-1 overflow-y-auto rounded-xl border border-ice-200 bg-white shadow-[0_1px_8px_rgba(15,37,64,0.08)]"
        style={{ width, maxWidth: '100%' }}
      >
        <iframe title={`${label} preview`} srcDoc={html} className="h-full min-h-[640px] w-full border-0" sandbox="allow-same-origin" />
      </div>
    </div>
  )
}

export function PreviewPane() {
  const doc = useEditor((s) => s.doc)
  const html = useMemo(() => inlineCss(renderEmail(doc, { markers: false })), [doc])
  const bytes = byteLength(html)
  const clipped = bytes > GMAIL_CLIP_BYTES

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3 bg-ice-100 p-4">
      <div className="flex items-center justify-center gap-3 text-xs">
        <span className="rounded-full bg-white px-3 py-1.5 font-medium text-ink-600 shadow-sm">
          {(bytes / 1024).toFixed(1)} KB
        </span>
        {clipped && (
          <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 font-medium text-amber-800">
            <AlertTriangle className="size-3.5" />
            Gmail clips messages over 102 KB — reduce content or images
          </span>
        )}
      </div>
      <div className="flex min-h-0 flex-1 items-stretch justify-center gap-6">
        <PreviewFrame html={html} width={660} label="Desktop · Outlook / Web" />
        <PreviewFrame html={html} width={375} label="Mobile · Gmail / iCloud" />
      </div>
    </div>
  )
}
