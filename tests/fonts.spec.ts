import { beforeEach, describe, expect, it } from 'vitest'
import { fontOptions, useFonts } from '../src/stores/fonts'
import { WEB_SAFE_FONTS } from '../src/builder/model'

describe('fontOptions', () => {
  beforeEach(() => useFonts.setState({ brandFonts: [], loaded: true }))

  it('lists every web-safe font once when there are no brand fonts', () => {
    expect(fontOptions()).toEqual(WEB_SAFE_FONTS)
  })

  it('does not duplicate fonts already seeded as brand fonts', () => {
    // migrations/001_init.sql used to store the whole web-safe list as brand
    // fonts, which made every family appear twice in the Design font dropdown.
    useFonts.setState({ brandFonts: WEB_SAFE_FONTS.map((f) => ({ ...f })) })
    const opts = fontOptions()
    expect(opts).toHaveLength(WEB_SAFE_FONTS.length)
    expect(new Set(opts.map((f) => f.name)).size).toBe(opts.length)
  })

  it('de-duplicates across quoting and spacing differences', () => {
    useFonts.setState({ brandFonts: [{ name: 'times new roman', stack: '"Times New Roman",Times,serif' }] })
    const named = fontOptions().filter((f) => f.name.toLowerCase() === 'times new roman')
    expect(named).toHaveLength(1)
    expect(named[0].name).toBe('times new roman')
  })

  it('keeps genuinely custom brand fonts, listed first', () => {
    useFonts.setState({ brandFonts: [{ name: 'Brand Sans', stack: "'Brand Sans', Arial, sans-serif" }] })
    const opts = fontOptions()
    expect(opts[0].name).toBe('Brand Sans')
    expect(opts).toHaveLength(WEB_SAFE_FONTS.length + 1)
  })

  it('drops blank entries', () => {
    useFonts.setState({ brandFonts: [{ name: '', stack: '' }, { name: 'Ok', stack: '' }] })
    expect(fontOptions()).toEqual(WEB_SAFE_FONTS)
  })

  it('offers Helvetica first, matching the default font', () => {
    expect(fontOptions()[0].name).toBe('Helvetica')
  })
})
