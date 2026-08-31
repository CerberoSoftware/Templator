import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Redo2, Save, Snowflake, Undo2 } from 'lucide-react'
import { api } from '../api/client'
import { navigate } from '../router'
import { emptyDoc, type EmailDoc } from '../builder/model'
import { renderEmail } from '../builder/render'
import { inlineCss } from '../builder/inliner'
import { useEditor } from '../stores/editor'
import { Canvas, type ActiveDrag } from '../components/builder/Canvas'
import { PropertiesPanel } from '../components/builder/PropertiesPanel'
import type { DropTarget } from '../stores/editor'

interface TemplateData {
  id: number
  name: string
  json_structure: string | null
}

export default function EditorPage({ id }: { id: number }) {
  const load = useEditor((s) => s.load)
  const doc = useEditor((s) => s.doc)
  const selectedId = useEditor((s) => s.selectedId)
  const select = useEditor((s) => s.select)
  const templateName = useEditor((s) => s.templateName)
  const setName = useEditor((s) => s.setName)
  const dirty = useEditor((s) => s.dirty)
  const saving = useEditor((s) => s.saving)
  const lastSavedAt = useEditor((s) => s.lastSavedAt)
  const setSaving = useEditor((s) => s.setSaving)
  const markSaved = useEditor((s) => s.markSaved)
  const insertBlock = useEditor((s) => s.insertBlock)
  const moveBlock = useEditor((s) => s.moveBlock)
  const undo = useEditor((s) => s.undo)
  const redo = useEditor((s) => s.redo)
  const canUndo = useEditor((s) => s.past.length > 0)
  const canRedo = useEditor((s) => s.future.length > 0)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<TemplateData>(`/api/templates/${id}`)
      .then((t) => {
        let parsed: EmailDoc = emptyDoc()
        if (t.json_structure) {
          try {
            const raw = JSON.parse(t.json_structure) as Partial<EmailDoc>
            if (raw && Array.isArray(raw.blocks) && raw.settings) parsed = raw as EmailDoc
          } catch {
            setError('Stored template JSON is malformed; starting from an empty document.')
          }
        }
        load(t.id, t.name, parsed)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load template'))
  }, [id, load])

  const save = useCallback(async () => {
    const state = useEditor.getState()
    setSaving(true)
    try {
      const finalHtml = inlineCss(renderEmail(state.doc, { markers: false }))
      await api.put(`/api/templates/${id}`, {
        name: state.templateName,
        json_structure: JSON.stringify(state.doc),
        final_html: finalHtml,
      })
      markSaved(new Date().toLocaleTimeString())
      setToast('Saved')
      setTimeout(() => setToast(null), 2200)
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Save failed')
      setTimeout(() => setToast(null), 3200)
    } finally {
      setSaving(false)
    }
  }, [id, markSaved, setSaving])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void save()
      } else if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        const t = e.target as HTMLElement | null
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
        e.preventDefault()
        undo()
      } else if ((mod && e.key.toLowerCase() === 'z' && e.shiftKey) || (mod && e.key.toLowerCase() === 'y')) {
        const t = e.target as HTMLElement | null
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
        e.preventDefault()
        redo()
      } else if (
        (e.key === 'Backspace' || e.key === 'Delete') &&
        selectedId &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault()
        useEditor.getState().removeBlock(selectedId)
        select(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [save, undo, redo, selectedId, select])

  const onDrop = useCallback(
    (payload: ActiveDrag, target: DropTarget) => {
      if (payload.kind === 'new') insertBlock(payload.type, target)
      else moveBlock(payload.id, target)
    },
    [insertBlock, moveBlock],
  )

  if (error && doc.blocks.length === 0 && templateName === '') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <p className="font-medium text-red-600">{error}</p>
        <a href="/" className="text-primary hover:underline">
          Back to templates
        </a>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b border-ice-200 bg-white px-3 py-2.5">
        <button onClick={() => navigate('/')} className="rounded-lg p-2 text-ink-600 transition hover:bg-ice-100" title="Back to templates">
          <ArrowLeft className="size-4" />
        </button>
        <Snowflake className="size-4 shrink-0 text-primary" />
        <input
          value={templateName}
          onChange={(e) => setName(e.target.value)}
          className="w-56 rounded-lg border border-transparent px-2 py-1.5 text-sm font-semibold transition hover:border-ice-200 focus:border-primary focus:outline-none"
          placeholder="Template name"
        />
        <div className="mx-2 h-5 w-px bg-ice-200" />
        <button
          onClick={undo}
          disabled={!canUndo}
          title="Undo (⌘Z)"
          className="rounded-lg p-2 text-ink-600 transition hover:bg-ice-100 disabled:opacity-30"
        >
          <Undo2 className="size-4" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          title="Redo (⇧⌘Z)"
          className="rounded-lg p-2 text-ink-600 transition hover:bg-ice-100 disabled:opacity-30"
        >
          <Redo2 className="size-4" />
        </button>
        <div className="flex-1" />
        <span className="text-xs text-ink-400">
          {saving ? 'Saving…' : dirty ? 'Unsaved changes' : lastSavedAt ? `Saved ${lastSavedAt}` : 'Ready'}
        </span>
        <button
          onClick={() => void save()}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-50"
        >
          <Save className="size-4" />
          Save
        </button>
      </header>
      <div className="flex min-h-0 flex-1">
        <Canvas onSelect={select} onDrop={onDrop} />
        <PropertiesPanel />
      </div>
      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink-900 px-4 py-2 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
