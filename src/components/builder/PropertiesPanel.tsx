import { useState } from 'react'
import { ImagePlus, Plus, Trash2, GripVertical } from 'lucide-react'
import type { FieldDef } from '../../builder/blocks'
import { type Block } from '../../builder/model'
import { REGISTRY } from '../../builder/blocks'
import { findBlock } from '../../builder/model'
import { useEditor } from '../../stores/editor'
import { useComponents } from '../../stores/components'
import { useFonts, fontOptions } from '../../stores/fonts'
import { blockToComponentHtml } from '../../builder/componentCodec'
import { AssetPickerDialog } from './AssetPickerDialog'
import { SOCIAL_PLATFORMS } from '../../builder/blocks/social'
import type { SocialLink } from '../../builder/model'

function NumberField({ def, value, onChange }: { def: FieldDef; value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      min={def.min}
      max={def.max}
      step={def.step}
      value={Number.isFinite(value) ? value : ''}
      onChange={(e) => onChange(e.target.value === '' ? (def.min ?? 0) : Number(e.target.value))}
      className="w-full rounded-lg border border-ice-200 bg-white px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none"
    />
  )
}

function RangeField({ def, value, onChange }: { def: FieldDef; value: number; onChange: (v: number) => void }) {
  const num = Number.isFinite(value) ? value : (def.min ?? 0)
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={def.min ?? 0}
        max={def.max ?? 100}
        step={def.step ?? 1}
        value={num}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-ice-200 accent-[#2b7fe0]"
      />
      <span className="w-12 shrink-0 rounded-md border border-ice-200 bg-ice-50 py-0.5 text-center font-mono text-[11px] text-ink-600">
        {Number.isInteger(def.step ?? 1) ? num : num.toFixed(1)}{def.unit ?? ''}
      </span>
    </div>
  )
}

function ColorField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#ffffff'}
        onChange={(e) => onChange(e.target.value)}
        className="size-8 cursor-pointer rounded border border-ice-200 bg-white p-0.5"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-ice-200 bg-white px-2.5 py-1.5 font-mono text-xs focus:border-primary focus:outline-none"
      />
    </div>
  )
}

function FontField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  useFonts((s) => s.brandFonts)
  const opts = fontOptions()
  const base = 'w-full rounded-lg border border-ice-200 bg-white px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none'
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={base}>
      {opts.map((f) => (
        <option key={f.name} value={f.stack}>
          {f.name}
        </option>
      ))}
    </select>
  )
}

function UrlField({
  def,
  value,
  onChange,
}: {
  def: FieldDef
  value: string
  onChange: (v: string) => void
}) {
  const [showPicker, setShowPicker] = useState(false)
  const base = 'w-full rounded-lg border border-ice-200 bg-white px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none'
  return (
    <>
      <input
        type="url"
        placeholder={def.placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={base}
      />
      <button
        type="button"
        onClick={() => setShowPicker(true)}
        className="flex items-center gap-1.5 rounded-lg border border-ice-200 px-2.5 py-1.5 text-xs font-medium text-ink-600 transition hover:border-primary hover:text-primary"
      >
        <ImagePlus className="size-3.5" />
        Pick from library
      </button>
      {showPicker && (
        <AssetPickerDialog
          onClose={() => setShowPicker(false)}
          onPick={(url) => {
            onChange(url)
            setShowPicker(false)
          }}
        />
      )}
    </>
  )
}

/** Structured editor for the social-links field */
function SocialLinksField({ value, onChange }: { value: SocialLink[]; onChange: (v: SocialLink[]) => void }) {
  const links = Array.isArray(value) ? value : []
  const base = 'rounded-lg border border-ice-200 bg-white px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none'

  const update = (index: number, patch: Partial<SocialLink>) => {
    const next = links.map((l, i) => (i === index ? { ...l, ...patch } : l))
    onChange(next)
  }

  const add = () => onChange([...links, { platform: 'Twitter', href: '' }])

  const remove = (index: number) => onChange(links.filter((_, i) => i !== index))

  // Bug 5 fix: track the dragged item by a stable identity key rather than
  // its array index. When onChange() is called inside onDragOver the array
  // shifts, but dragKey stays constant so the splice target is always correct
  // even when the user drags quickly across multiple rows.
  const [dragKey, setDragKey] = useState<string | null>(null)

  const itemKey = (link: SocialLink, i: number) => `${link.platform}::${link.href}::${i}`

  const onDragStart = (link: SocialLink, i: number) => setDragKey(itemKey(link, i))

  const onDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (dragKey === null) return
    const sourceIndex = links.findIndex((l, i) => itemKey(l, i) === dragKey)
    if (sourceIndex === -1 || sourceIndex === targetIndex) return
    const next = [...links]
    const [moved] = next.splice(sourceIndex, 1)
    next.splice(targetIndex, 0, moved)
    // Update the key to reflect the item's new position so subsequent
    // onDragOver calls resolve the source index correctly.
    setDragKey(itemKey(moved, targetIndex))
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-2">
      {links.map((link, i) => (
        <div
          key={i}
          draggable
          onDragStart={() => onDragStart(link, i)}
          onDragOver={(e) => onDragOver(e, i)}
          onDragEnd={() => setDragKey(null)}
          className="flex items-center gap-1.5 rounded-xl border border-ice-200 bg-ice-50 p-2"
        >
          <GripVertical className="size-3.5 shrink-0 cursor-grab text-ink-300" />
          <select
            value={link.platform}
            onChange={(e) => update(i, { platform: e.target.value })}
            className={`w-32 shrink-0 ${base}`}
          >
            {SOCIAL_PLATFORMS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <input
            type="url"
            placeholder="https://"
            value={link.href}
            onChange={(e) => update(i, { href: e.target.value })}
            className={`min-w-0 flex-1 ${base}`}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="shrink-0 rounded p-1 text-ink-300 transition hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-ice-300 px-3 py-2 text-xs font-medium text-ink-500 transition hover:border-primary hover:text-primary"
      >
        <Plus className="size-3.5" />
        Add network
      </button>
    </div>
  )
}

export function Field({ def, value, onChange }: { def: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  const base = 'w-full rounded-lg border border-ice-200 bg-white px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none'
  let control = null
  switch (def.type) {
    case 'textarea':
      control = (
        <textarea
          rows={5}
          placeholder={def.placeholder}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className={`${base} resize-y font-mono text-xs`}
        />
      )
      break
    case 'number':
      control = <NumberField def={def} value={Number(value)} onChange={onChange} />
      break
    case 'range':
      control = <RangeField def={def} value={Number(value)} onChange={onChange} />
      break
    case 'color':
      control = <ColorField value={String(value ?? '')} onChange={onChange} />
      break
    case 'select':
      control = (
        <select value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} className={base}>
          {def.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )
      break
    case 'toggle':
      control = (
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-[#2b7fe0]" />
          <span className="text-ink-600">{def.help ?? 'Enabled'}</span>
        </label>
      )
      break
    case 'font':
      control = <FontField value={String(value ?? '')} onChange={(v) => onChange(v)} />
      break
    case 'url':
      control = <UrlField def={def} value={String(value ?? '')} onChange={(v) => onChange(v)} />
      break
    case 'social-links':
      control = (
        <SocialLinksField
          value={value as SocialLink[]}
          onChange={(v) => onChange(v)}
        />
      )
      break
    default:
      control = (
        <input
          type="text"
          placeholder={def.placeholder}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className={base}
        />
      )
  }
  return (
    <div className="flex flex-col gap-1">
      {def.type !== 'toggle' && <label className="text-xs font-medium text-ink-600">{def.label}</label>}
      {control}
      {def.help && def.type !== 'toggle' && <p className="text-[11px] leading-snug text-ink-400">{def.help}</p>}
    </div>
  )
}

export function PropertiesPanel() {
  const doc = useEditor((s) => s.doc)
  const selectedId = useEditor((s) => s.selectedId)
  const updateProps = useEditor((s) => s.updateProps)
  const updateSettings = useEditor((s) => s.updateSettings)
  const removeBlock = useEditor((s) => s.removeBlock)
  const duplicateBlock = useEditor((s) => s.duplicateBlock)

  const ref = selectedId ? findBlock(doc, selectedId) : null
  const block: Block | null = ref?.block ?? null

  return (
    <aside className="flex w-80 shrink-0 flex-col overflow-y-auto border-l border-ice-200 bg-white">
      {block === null ? (
        <div className="flex flex-col gap-4 p-4">
          <h2 className="text-sm font-semibold">Email settings</h2>

          <Field def={{ key: 'subject', label: 'Subject', type: 'text' }} value={doc.settings.subject} onChange={(v) => updateSettings({ subject: String(v) })} />
          <Field
            def={{ key: 'preheader', label: 'Preheader', type: 'text', help: 'Hidden preview text shown in the inbox list.' }}
            value={doc.settings.preheader}
            onChange={(v) => updateSettings({ preheader: String(v) })}
          />
          <Field
            def={{ key: 'contentWidth', label: 'Content width', type: 'range', min: 480, max: 720, step: 10, unit: 'px' }}
            value={doc.settings.contentWidth}
            onChange={(v) => updateSettings({ contentWidth: Math.max(480, Math.min(720, Number(v) || 600)) })}
          />

          <div className="border-t border-ice-100 pt-2">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-400">Colours</p>
            <div className="flex flex-col gap-3">
              <Field def={{ key: 'bodyBg', label: 'Outer background', type: 'color' }} value={doc.settings.bodyBg} onChange={(v) => updateSettings({ bodyBg: String(v) })} />
              <Field def={{ key: 'containerBg', label: 'Content background', type: 'color' }} value={doc.settings.containerBg} onChange={(v) => updateSettings({ containerBg: String(v) })} />
              <Field
                def={{ key: 'textColor', label: 'Default text colour', type: 'color' }}
                value={doc.settings.textColor ?? '#333333'}
                onChange={(v) => updateSettings({ textColor: String(v) })}
              />
              <Field
                def={{ key: 'linkColor', label: 'Default link colour', type: 'color' }}
                value={doc.settings.linkColor ?? '#2b7fe0'}
                onChange={(v) => updateSettings({ linkColor: String(v) })}
              />
            </div>
          </div>

          <div className="border-t border-ice-100 pt-2">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-400">Typography</p>
            <Field
              def={{ key: 'fontFamily', label: 'Default font', type: 'font' }}
              value={doc.settings.fontFamily ?? 'Arial, Helvetica, sans-serif'}
              onChange={(v) => updateSettings({ fontFamily: String(v) })}
            />
          </div>

          <p className="rounded-lg bg-ice-50 px-3 py-2 text-[11px] leading-relaxed text-ink-600">
            Select a block on the canvas to edit its properties. Drag blocks from the left palette into the email.
          </p>
        </div>
      ) : (
        <BlockPanel
          key={block.id}
          block={block}
          updateProps={updateProps}
          removeBlock={removeBlock}
          duplicateBlock={duplicateBlock}
        />
      )}
    </aside>
  )
}

function BlockPanel({
  block,
  updateProps,
  removeBlock,
  duplicateBlock,
}: {
  block: Block
  updateProps: ReturnType<typeof useEditor>['updateProps']
  removeBlock: ReturnType<typeof useEditor>['removeBlock']
  duplicateBlock: ReturnType<typeof useEditor>['duplicateBlock']
}) {
  const def = REGISTRY[block.type]
  const saveAsComponent = useComponents((s) => s.saveAsComponent)
  const [saving, setSaving] = useState(false)
  const [savedName, setSavedName] = useState<string | null>(null)

  const handleSaveAsComponent = async () => {
    const name = window.prompt('Component name?')
    if (!name?.trim()) return
    setSaving(true)
    try {
      const html = blockToComponentHtml(block)
      await saveAsComponent(name.trim(), html)
      setSavedName(name.trim())
      // Clear the "saved" badge after 3 s
      setTimeout(() => setSavedName(null), 3000)
    } catch (err) {
      window.alert(`Failed to save component: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{def.label}</h2>
        <div className="flex gap-1">
          <button
            type="button"
            title="Duplicate block"
            onClick={() => duplicateBlock(block.id)}
            className="rounded p-1 text-ink-400 transition hover:bg-ice-50 hover:text-ink-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
          </button>
          <button
            type="button"
            title={saving ? 'Saving…' : 'Save as component'}
            disabled={saving}
            onClick={() => void handleSaveAsComponent()}
            className="rounded p-1 text-ink-400 transition hover:bg-ice-50 hover:text-ink-700 disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
          </button>
          <button
            type="button"
            title="Delete block"
            onClick={() => removeBlock(block.id)}
            className="rounded p-1 text-ink-400 transition hover:bg-red-50 hover:text-red-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg>
          </button>
        </div>
      </div>

      {savedName !== null && (
        <div className="rounded-lg bg-green-50 px-3 py-2 text-[11px] font-medium text-green-700">
          ✓ "{savedName}" saved to My components
        </div>
      )}

      {def.fields.map((f) => (
        <Field
          key={f.key}
          def={f}
          value={(block.props as Record<string, unknown>)[f.key]}
          onChange={(v) => updateProps(block.id, { [f.key]: v })}
        />
      ))}
    </div>
  )
}
