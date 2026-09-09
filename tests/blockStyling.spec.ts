import { describe, expect, it } from 'vitest'
import { createBlock } from '../src/builder/blocks'
import { blockToComponentHtml, componentHtmlToBlocks } from '../src/builder/componentCodec'
import { normalizeFontStack } from '../src/builder/htmlUtils'
import { renderEmail } from '../src/builder/render'
import { parseEmailHtml } from '../src/builder/parser'
import type {
  ButtonProps,
  CalloutProps,
  FooterProps,
  HeaderProps,
  ImageProps,
  ImageTextProps,
  TextProps,
} from '../src/builder/model'
import { sampleDoc } from './render.spec'

/** Render one block on its own and read its props back out. */
function roundTrip<T>(type: Parameters<typeof createBlock>[0], patch: Partial<T>): T {
  const block = createBlock(type)
  Object.assign(block.props, patch)
  const restored = componentHtmlToBlocks(blockToComponentHtml(block))
  if (!restored || restored.length !== 1) throw new Error(`${type} did not round-trip to one block`)
  return restored[0].props as unknown as T
}

describe('separate top and bottom padding', () => {
  it('writes a three-value padding shorthand and reads both ends back', () => {
    const props = roundTrip<TextProps>('text', { paddingTop: 4, paddingBottom: 40, paddingX: 24 })
    expect(props.paddingTop).toBe(4)
    expect(props.paddingBottom).toBe(40)
    expect(props.paddingX).toBe(24)
  })

  it('renders the top and bottom values in shorthand order', () => {
    const block = createBlock('text')
    Object.assign(block.props, { paddingTop: 4, paddingBottom: 40, paddingX: 24 })
    expect(blockToComponentHtml(block)).toContain('padding:4px 24px 40px')
  })
})

describe('corner radius controls', () => {
  it('round-trips the image radius', () => {
    const props = roundTrip<ImageProps>('image', { src: 'https://example.com/a.png', radius: 12 })
    expect(props.radius).toBe(12)
  })

  it('round-trips the image radius on an image + text block', () => {
    const props = roundTrip<ImageTextProps>('image_text', { imgSrc: 'https://example.com/a.png', imgRadius: 8 })
    expect(props.imgRadius).toBe(8)
  })

  it('omits the declaration entirely at radius 0', () => {
    const block = createBlock('image')
    Object.assign(block.props, { src: 'https://example.com/a.png', radius: 0 })
    expect(blockToComponentHtml(block)).not.toContain('border-radius')
  })

  it('renders and parses the email container radius from settings', () => {
    const doc = sampleDoc()
    doc.settings.containerRadius = 24
    const html = renderEmail(doc, { markers: true })
    expect(html).toContain('border-radius:24px;overflow:hidden;')
    expect(parseEmailHtml(html)!.settings.containerRadius).toBe(24)
  })

  it('renders square corners with no radius declaration at 0', () => {
    const doc = sampleDoc()
    doc.settings.containerRadius = 0
    const contentStyle = /class="et-content" style="([^"]*)"/.exec(renderEmail(doc))![1]
    expect(contentStyle).not.toContain('border-radius')
  })
})

describe('header gradient band', () => {
  it('keeps background-color alongside the gradient so Outlook still gets a colour', () => {
    const block = createBlock('header')
    Object.assign(block.props, { bgColor: '#2b7fe0', bgColorEnd: '#7c3aed' })
    const html = blockToComponentHtml(block)
    expect(html).toContain('background-color:#2b7fe0;')
    expect(html).toContain('background-image:linear-gradient(135deg, #2b7fe0, #7c3aed);')
  })

  it('round-trips the gradient end colour', () => {
    const props = roundTrip<HeaderProps>('header', { bgColor: '#2b7fe0', bgColorEnd: '#7c3aed' })
    expect(props.bgColor).toBe('#2b7fe0')
    expect(props.bgColorEnd).toBe('#7c3aed')
  })

  it('stays a flat band when no second colour is set', () => {
    const block = createBlock('header')
    Object.assign(block.props, { bgColor: '#2b7fe0', bgColorEnd: 'transparent' })
    expect(blockToComponentHtml(block)).not.toContain('linear-gradient')
    expect(roundTrip<HeaderProps>('header', { bgColorEnd: 'transparent' }).bgColorEnd).toBe('transparent')
  })

  it('does not underline a linked logo', () => {
    const block = createBlock('header')
    Object.assign(block.props, { logoUrl: 'https://example.com/l.png', logoLink: 'https://example.com' })
    expect(blockToComponentHtml(block)).toContain('<a href="https://example.com" style="text-decoration:none;">')
  })
})

describe('footer link styling', () => {
  it('renders footer links in their own colour, and round-trips it', () => {
    const props = roundTrip<FooterProps>('footer', {
      content: 'Read the [privacy policy](https://example.com/privacy).',
      linkColor: '#7c3aed',
    })
    expect(props.linkColor).toBe('#7c3aed')
    expect(props.linkUnderline).toBe(true)
  })

  it('round-trips the underline toggle', () => {
    const props = roundTrip<FooterProps>('footer', {
      content: 'Read the [privacy policy](https://example.com/privacy).',
      linkUnderline: false,
    })
    expect(props.linkUnderline).toBe(false)
  })
})

describe('image + text link underline', () => {
  it('round-trips the underline toggle', () => {
    const props = roundTrip<ImageTextProps>('image_text', {
      text: 'See the [docs](https://example.com/docs).',
      linkUnderline: false,
    })
    expect(props.linkUnderline).toBe(false)
  })
})

describe('button VML fallback', () => {
  it('clamps the Outlook arc size to 50% of the shorter side', () => {
    const block = createBlock('button')
    // A pill radius is more than half the button height, which VML cannot express.
    Object.assign(block.props, { radius: 40, height: 46 })
    expect(blockToComponentHtml(block)).toContain('arcsize="50%"')
  })

  it('scales the arc with the radius below the clamp', () => {
    const block = createBlock('button')
    Object.assign(block.props, { radius: 10, height: 50 })
    expect(blockToComponentHtml(block)).toContain('arcsize="20%"')
  })
})

describe('normalizeFontStack', () => {
  it('quotes only the families that need it, always the same way', () => {
    expect(normalizeFontStack('"Plus Jakarta Sans", Arial, sans-serif', 'Arial')).toBe(
      "'Plus Jakarta Sans', Arial, sans-serif",
    )
    expect(normalizeFontStack("'Plus Jakarta Sans', Arial", 'Arial')).toBe("'Plus Jakarta Sans', Arial")
  })

  it('falls back when the value is empty', () => {
    expect(normalizeFontStack('', 'Arial')).toBe('Arial')
    expect(normalizeFontStack(null, 'Arial')).toBe('Arial')
  })

  it('keeps a quoted font stack stable across a render/parse round-trip', () => {
    const stack = "'Plus Jakarta Sans', Arial, sans-serif"
    expect(roundTrip<TextProps>('text', { fontFamily: stack }).fontFamily).toBe(stack)
    expect(roundTrip<ButtonProps>('button', { fontFamily: stack }).fontFamily).toBe(stack)
  })
})

describe('callout card', () => {
  it('round-trips its content, accent and border', () => {
    const props = roundTrip<CalloutProps>('callout', {
      label: 'Next up',
      content: 'Lesson 4 unlocks on Friday.',
      accentColor: '#22c3b6',
      borderColor: '#e7eef6',
      radius: 14,
      innerPadding: 20,
    })
    expect(props.label).toBe('Next up')
    expect(props.content).toBe('Lesson 4 unlocks on Friday.')
    expect(props.accentColor).toBe('#22c3b6')
    expect(props.borderColor).toBe('#e7eef6')
    expect(props.radius).toBe(14)
    expect(props.innerPadding).toBe(20)
  })

  it('keeps the eyebrow label out of the body content', () => {
    const props = roundTrip<CalloutProps>('callout', { label: 'Heads up', content: 'Body copy.' })
    expect(props.content).toBe('Body copy.')
  })

  it('drops the bar and border when they are transparent', () => {
    const block = createBlock('callout')
    Object.assign(block.props, { accentColor: 'transparent', borderColor: 'transparent' })
    const html = blockToComponentHtml(block)
    expect(html).not.toContain('border-left:')
    expect(html).not.toContain('border:1px solid')
    const props = roundTrip<CalloutProps>('callout', { accentColor: 'transparent', borderColor: 'transparent' })
    expect(props.accentColor).toBe('transparent')
    expect(props.borderColor).toBe('transparent')
  })
})
