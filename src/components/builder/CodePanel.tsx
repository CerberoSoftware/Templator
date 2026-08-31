import { useEffect, useRef, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { html } from '@codemirror/lang-html'
import { renderEmail } from '../../builder/render'
import { parseEmailHtmlDetailed } from '../../builder/parser'
import type { EmailDoc } from '../../builder/model'
import { useEditor } from '../../stores/editor'

const DEBOUNCE_MS = 500

export function CodePanel() {
  const doc = useEditor((s) => s.doc)
  const replaceDoc = useEditor((s) => s.replaceDoc)
  const [code, setCode] = useState(() => renderEmail(doc, { markers: true }))
  const appliedDocRef = useRef<EmailDoc>(doc)
  const [syncError, setSyncError] = useState(0)

  useEffect(() => {
    if (doc !== appliedDocRef.current) {
      appliedDocRef.current = doc
      setCode(renderEmail(doc, { markers: true }))
      setSyncError(0)
    }
  }, [doc])

  const applyCode = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onCodeChange = (value: string) => {
    setCode(value)
    if (applyCode.current) clearTimeout(applyCode.current)
    applyCode.current = setTimeout(() => {
      const result = parseEmailHtmlDetailed(value)
      if (result !== null) {
        setSyncError(result.unmatched)
        appliedDocRef.current = result.doc
        replaceDoc(result.doc)
      }
    }, DEBOUNCE_MS)
  }

  return (
    <div className="relative flex min-w-0 flex-1 flex-col bg-ink-900">
      {syncError > 0 && (
        <div className="absolute right-4 top-3 z-10 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 shadow">
          {syncError} row{syncError === 1 ? '' : 's'} couldn&apos;t be matched — kept as raw blocks
        </div>
      )}
      <CodeMirror
        value={code}
        onChange={onCodeChange}
        extensions={[html()]}
        theme="dark"
        height="100%"
        basicSetup={{ tabSize: 2 }}
        style={{ height: '100%', fontSize: 12.5 }}
      />
    </div>
  )
}
