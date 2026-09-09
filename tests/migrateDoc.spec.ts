import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, migrateDoc, type Block } from '../src/builder/model'

/** A doc as it was stored before the vertical padding split. */
function legacyDoc(): unknown {
  return {
    settings: {
      subject: 'Old',
      preheader: '',
      contentWidth: 600,
      outerBg: '#f4f8fc',
      contentBg: '#ffffff',
    },
    blocks: [
      { id: 'a', type: 'text', props: { content: 'Hi', paddingY: 20, paddingX: 24 } },
      { id: 'b', type: 'image', props: { src: '', paddingY: 8, paddingX: 0 } },
      { id: 'c', type: 'footer', props: { content: '©', color: '#5c7793', paddingY: 20 } },
      { id: 'd', type: 'header', props: { logoUrl: '', paddingY: 24, paddingX: 24 } },
    ],
  }
}

function propsOf(blocks: Block[], id: string): Record<string, unknown> {
  const block = blocks.find((b) => b.id === id)
  if (!block) throw new Error(`no block ${id}`)
  return block.props as unknown as Record<string, unknown>
}

describe('migrateDoc', () => {
  it('carries a saved paddingY into both paddingTop and paddingBottom', () => {
    const { blocks } = migrateDoc(legacyDoc())
    const text = propsOf(blocks, 'a')
    expect(text.paddingTop).toBe(20)
    expect(text.paddingBottom).toBe(20)
    expect(text.paddingY).toBeUndefined()
  })

  it('back-fills the fields added alongside the newer block controls', () => {
    const { blocks, settings } = migrateDoc(legacyDoc())
    expect(settings.containerRadius).toBe(DEFAULT_SETTINGS.containerRadius)
    expect(propsOf(blocks, 'b').radius).toBe(0)
    expect(propsOf(blocks, 'd').bgColorEnd).toBe('transparent')
    const footer = propsOf(blocks, 'c')
    expect(footer.linkColor).toBe('#5c7793')
    expect(footer.linkUnderline).toBe(true)
  })

  it('renames the legacy background keys and drops them', () => {
    const settings = migrateDoc(legacyDoc()).settings as unknown as Record<string, unknown>
    expect(settings.bodyBg).toBe('#f4f8fc')
    expect(settings.containerBg).toBe('#ffffff')
    expect(settings.outerBg).toBeUndefined()
    expect(settings.contentBg).toBeUndefined()
  })

  it('leaves an already-current doc alone', () => {
    const current = migrateDoc(legacyDoc())
    expect(migrateDoc(structuredClone(current))).toEqual(current)
  })

  it('returns an empty doc rather than throwing on unusable input', () => {
    for (const bad of [null, undefined, 'nope', 42, {}, { settings: {} }]) {
      const doc = migrateDoc(bad)
      expect(doc.blocks).toEqual([])
      expect(doc.settings).toEqual(DEFAULT_SETTINGS)
    }
  })

  it('repairs a two-column block whose columns are missing', () => {
    const doc = migrateDoc({
      settings: {},
      blocks: [{ id: 't', type: 'twocol', props: { paddingY: 8, paddingX: 24 } }],
    })
    const twocol = doc.blocks[0]
    if (twocol.type !== 'twocol') throw new Error('expected a twocol block')
    expect(twocol.columns).toEqual([[], []])
  })
})
