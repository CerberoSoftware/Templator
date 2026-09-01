import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Code2, Download, Eye, FileInput, HelpCircle, History, LayoutTemplate, Palette, Redo2, Save, Snowflake, Type, Undo2 } from 'lucide-react'
import { api } from '../api/client'
import { navigate } from '../router'
import { emptyDoc, migrateDoc, type EmailDoc } from '../builder/model'
import { renderEmail } from '../builder/render'
import { inlineCss } from '../builder/inliner'
import { useEditor } from '../stores/editor'
import { Canvas, type ActiveDrag } from '../components/builder/Canvas'
import { CodePanel } from '../components/builder/CodePanel'
import { PreviewPane } from '../components/builder/PreviewPane'
import { PropertiesPanel } from '../components/builder/PropertiesPanel'
import { VersionsDialog } from '../components/builder/VersionsDialog'
import { ExportDialog } from '../components/builder/ExportDialog'
import { ImportDialog } from '../components/builder/ImportDialog'
import { FontsDialog } from '../components/builder/FontsDialog'
import { componentHtmlToBlocks } from '../builder/componentCodec'
import { cloneBlock } from '../builder/model'
import { useComponents } from '../stores/components'
import { useFonts } from '../stores/fonts'
import type { DropTarget } from '../stores/editor'

type Mode = 'design' | 'code' | 'preview'

const MODES: Array<{ id: Mode; label: string; icon: typeof Code2 }> = [
  { id: 'design', label: 'Design', icon: LayoutTemplate },
  { id: 'code', label: 'Code', icon: Code2 },
  { id: 'preview', label: 'Preview', icon: Eye },
]

interface TemplateData {
  id: number
  name: string
  json_structure: string | null
}

export default function EditorPage({ id }: { id: number }) {
  const load = useEditor((s) => s.load)
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
  const insertBlocks = useEditor((s) => s.insertBlocks)
  const moveBlock = useEditor((s) => s.moveBlock)
  const undo = useEditor((s) => s.undo)
  const redo = useEditor((s) => s.redo)
  const canUndo = useEditor((s) => s.past.length > 0)
  const canRedo = useEditor((s) => s.future.length > 0)
  const loadFonts = useFonts((s) => s.load)
  const [error, setError] = useState<string | null>(null)
  // Fix: track hard load failures separately from non-fatal error messages.
  // A brand-new template legitimately has 0 blocks and an empty name, so
  // gating the error screen on those conditions would block the editor UI
  // for every new template.
  const [loadFailed, setLoadFailed] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>('design')
  const [showVersions, setShowVersions] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showFonts, setShowFonts] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    void loadFonts()
  }, [loadFonts])

  useEffect(() => {
    api
      .get<TemplateData>(`/api/templates/${id}`)
      .then((t) => {
        let parsed: EmailDoc = emptyDoc()
        if (t.json_structure) {
          try {
            const raw = JSON.parse(t.json_structure) as Partial<EmailDoc>
            if (raw && Array.isArray(raw.blocks) && raw.settings) parsed = migrateDoc(raw)
          } catch {
            setError('Stored template JSON is malformed; starting from an empty document.')
          }
        }
        load(t.id, t.name, parsed)
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Failed to load template')
        setLoadFailed(true)
      })
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
      if ((e.key === '?' || (e.key === '/' && e.shiftKey)) && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement) && !(e.target as HTMLElement)?.isContentEditable) {
        e.preventDefault()
        setShowHelp((v) => !v)
        return
      }
      if (e.key === 'Escape' && showHelp) {
        setShowHelp(false)
        return
      }
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
      } else if (e.key === 'Escape' && selectedId) {
        const t = e.target as HTMLElement | null
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
        select(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [save, undo, redo, selectedId, select, showHelp])

  const onDrop = useCallback(
    (payload: ActiveDrag, target: DropTarget) => {
      if (payload.kind === 'new') insertBlock(payload.type, target)
      else if (payload.kind === 'move') moveBlock(payload.id, target)
      else {
        const comp = useComponents.getState().components.find((c) => c.id === payload.componentId)
        if (comp) {
          const blocks = componentHtmlToBlocks(comp.html_template)
          if (blocks) insertBlocks(blocks.map((b) => cloneBlock(b)), target)
        }
      }
    },
    [insertBlock, moveBlock, insertBlocks],
  )

  // Only show the hard error screen when the API call itself failed (404, 500,
  // network error, etc.) — not for a legitimately empty or malformed-JSON doc.
  if (loadFailed) {
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
        <div className="flex rounded-lg border border-ice-200 p-0.5">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                mode === m.id ? 'bg-primary text-white' : 'text-ink-600 hover:bg-ice-100'
              }`}
            >
              <m.icon className="size-3.5" />
              {m.label}
            </button>
          ))}
        </div>
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
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center gap-1.5 rounded-lg border border-ice-200 px-3 py-2 text-sm font-medium text-ink-600 transition hover:border-primary hover:text-primary"
          title="Brand colours"
        >
          <Palette className="size-4" />
          Brand
        </button>
        <button
          onClick={() => setShowFonts(true)}
          className="flex items-center gap-1.5 rounded-lg border border-ice-200 px-3 py-2 text-sm font-medium text-ink-600 transition hover:border-primary hover:text-primary"
        >
          <Type className="size-4" />
          Fonts
        </button>
        <button
          onClick={() => setShowImport(true)}
          className="flex items-center gap-1.5 rounded-lg border border-ice-200 px-3 py-2 text-sm font-medium text-ink-600 transition hover:border-primary hover:text-primary"
        >
          <FileInput className="size-4" />
          Import
        </button>
        <button
          onClick={() => setShowVersions(true)}
          className="flex items-center gap-1.5 rounded-lg border border-ice-200 px-3 py-2 text-sm font-medium text-ink-600 transition hover:border-primary hover:text-primary"
        >
          <History className="size-4" />
          Versions
        </button>
        <button
          onClick={() => setShowExport(true)}
          className="flex items-center gap-1.5 rounded-lg border border-ice-200 px-3 py-2 text-sm font-medium text-ink-600 transition hover:border-primary hover:text-primary"
        >
          <Download className="size-4" />
          Export
        </button>
        <button
          onClick={() => setShowHelp(true)}
          className="rounded-lg p-2 text-ink-400 hover:bg-ice-100 hover:text-ink-900"
          title="Shortcuts (?)"
          aria-label="Show keyboard shortcuts"
        >
          <HelpCircle className="size-4" />
        </button>
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
      {error && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800">
          {error}
        </div>
      )}
      <div className="flex min-h-0 flex-1">
        {mode === 'design' && (
          <>
            <Canvas onSelect={select} onDrop={onDrop} />
            <PropertiesPanel />
          </>
        )}
        {mode === 'code' && <CodePanel />}
        {mode === 'preview' && <PreviewPane />}
      </div>
      {showVersions && <VersionsDialog onClose={() => setShowVersions(false)} />}
      {showExport && <ExportDialog onClose={() => setShowExport(false)} />}
      {showImport && <ImportDialog onClose={() => setShowImport(false)} />}
      {showFonts && <FontsDialog onClose={() => setShowFonts(false)} />}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4" onClick={() => setShowHelp(false)} role="dialog" aria-modal="true" aria-label="Shortcuts help">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="flex items-center gap-2 text-sm font-semibold"><HelpCircle className="size-4 text-primary" /> Shortcuts & Tips</h2>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between"><span className="text-ink-600">Save</span><span className="font-mono text-xs">⌘/Ctrl + S</span></div>
              <div className="flex justify-between"><span className="text-ink-600">Undo / Redo</span><span className="font-mono text-xs">⌘Z / ⇧⌘Z</span></div>
              <div className="flex justify-between"><span className="text-ink-600">Delete block</span><span className="font-mono text-xs">Del / Backspace</span></div>
              <div className="flex justify-between"><span className="text-ink-600">Deselect</span><span className="font-mono text-xs">Esc</span></div>
              <div className="flex justify-between"><span className="text-ink-600">Add Text quickly</span><span className="font-mono text-xs">Click + between blocks</span></div>
              <div className="flex justify-between"><span className="text-ink-600">Drag handle</span><span className="font-mono text-xs">Grip on hover (28px)</span></div>
              <div className="flex justify-between"><span className="text-ink-600">Brand colours</span><span className="font-mono text-xs">Settings → Brand or palette swatches</span></div>
              <div className="flex justify-between"><span className="text-ink-600">Zoom</span><span className="font-mono text-xs">− / + / Reset</span></div>
            </div>
            <p className="mt-4 text-xs text-ink-400">Palette: search, then <span className="font-mono">Enter</span> to add first match. Click any palette item to add at end without dragging. In canvas, “+ Add block” gaps and the empty-state quick-add are keyboard accessible.</p>
            <div className="mt-4 flex justify-end">
              <button onClick={() => setShowHelp(false)} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">Got it</button>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink-900 px-4 py-2 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
