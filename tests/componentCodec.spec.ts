import { describe, expect, it } from 'vitest'
import { createBlock } from '../src/builder/blocks'
import { blockToComponentHtml, componentHtmlToBlocks } from '../src/builder/componentCodec'
import type { ButtonProps } from '../src/builder/model'

describe('component codec round-trip', () => {
  it('restores a text block with its props', () => {
    const original = createBlock('text')
    const html = blockToComponentHtml(original)
    const restored = componentHtmlToBlocks(html)
    expect(restored).not.toBeNull()
    expect(restored).toHaveLength(1)
    const block = restored![0]
    expect(block.type).toBe('text')
    expect(block.props).toEqual(original.props)
  })

  it('restores a button block with its props', () => {
    const original = createBlock('button')
    ;(original.props as ButtonProps).label = 'Read more'
    ;(original.props as ButtonProps).bgColor = '#111111'
    const html = blockToComponentHtml(original)
    const restored = componentHtmlToBlocks(html)!
    expect(restored[0].type).toBe('button')
    expect((restored[0].props as ButtonProps).label).toBe('Read more')
    expect((restored[0].props as ButtonProps).bgColor).toBe('#111111')
  })

  it('restores multi-row fragments as multiple blocks', () => {
    const a = createBlock('heading')
    const b = createBlock('spacer')
    const html = `${blockToComponentHtml(a)}\n${blockToComponentHtml(b)}`
    const restored = componentHtmlToBlocks(html)
    expect(restored).not.toBeNull()
    expect(restored!.map((b) => b.type)).toEqual(['heading', 'spacer'])
  })

  it('returns null for empty fragments', () => {
    expect(componentHtmlToBlocks('<p>no rows here</p>')).toBeNull()
    expect(componentHtmlToBlocks('')).toBeNull()
  })
})
