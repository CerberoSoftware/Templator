import type { FieldDef } from '../../builder/blocks'
import { WEB_SAFE_FONTS, type Block } from '../../builder/model'
import { REGISTRY } from '../../builder/blocks'
import { findBlock } from '../../builder/model'
import { useEditor } from '../../stores/editor'

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
      control = (
        <select value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} className={base}>
          {WEB_SAFE_FONTS.map((f) => (
            <option key={f.name} value={f.stack}>
              {f.name}
            </option>
          ))}
        </select>
      )
      break
    default:
      control = (
        <input
          type={def.type === 'url' ? 'url' : 'text'}
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
            def={{ key: 'contentWidth', label: 'Content width (px)', type: 'number', min: 480, max: 720, step: 10 }}
            value={doc.settings.contentWidth}
            onChange={(v) => updateSettings({ contentWidth: Math.max(480, Math.min(720, Number(v) || 600)) })}
          />
          <Field def={{ key: 'outerBg', label: 'Outer background', type: 'color' }} value={doc.settings.outerBg} onChange={(v) => updateSettings({ outerBg: String(v) })} />
          <Field def={{ key: 'contentBg', label: 'Content background', type: 'color' }} value={doc.settings.contentBg} onChange={(v) => updateSettings({ contentBg: String(v) })} />
          <p className="rounded-lg bg-ice-50 px-3 py-2 text-[11px] leading-relaxed text-ink-600">
            Select a block on the canvas to edit its properties. Drag blocks from the left palette into the email.
          </p>
        </div>
      ) : (
        <BlockPanel
          key={block.id}
          block={block}
          onProp={(key, v) => updateProps(block.id, { [key]: v })}
          onDelete={() => removeBlock(block.id)}
          onDuplicate={() => duplicateBlock(block.id)}
        />
      )}
    </aside>
  )
}

function BlockPanel({
  block,
  onProp,
  onDelete,
  onDuplicate,
}: {
  block: Block
  onProp: (key: string, v: unknown) => void
  onDelete: () => void
  onDuplicate: () => void
}) {
  const def = REGISTRY[block.type]
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{def.label}</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={onDuplicate}
            title="Duplicate block"
            className="rounded-lg p-1.5 text-ink-600 transition hover:bg-ice-100"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            title="Delete block"
            className="rounded-lg p-1.5 text-ink-600 transition hover:bg-red-50 hover:text-red-600"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            </svg>
          </button>
        </div>
      </div>
      {block.type === 'twocol' && <TwoColPanel block={block} onProp={onProp} />}
      {block.type !== 'twocol' &&
        def.fields.map((f) => (
          <Field key={f.key} def={f} value={(block.props as unknown as Record<string, unknown>)[f.key]} onChange={(v) => onProp(f.key, v)} />
        ))}
    </div>
  )
}

function TwoColPanel({ block, onProp }: { block: Block & { type: 'twocol' }; onProp: (key: string, v: unknown) => void }) {
  const def = REGISTRY.twocol
  return (
    <>
      <p className="rounded-lg bg-ice-50 px-3 py-2 text-[11px] leading-relaxed text-ink-600">
        Drop content blocks into either column on the canvas. Columns stack on mobile automatically.
      </p>
      {def.fields.map((f) => (
        <Field key={f.key} def={f} value={(block.props as unknown as Record<string, unknown>)[f.key]} onChange={(v) => onProp(f.key, v)} />
      ))}
    </>
  )
}
