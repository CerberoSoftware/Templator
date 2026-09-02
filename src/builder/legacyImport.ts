import { inlineCss } from './inliner'

export interface LegacyCleanResult {
  html: string
  warnings: string[]
}

const DROP_TAGS = 'script, noscript, iframe, object, embed, form, input, select, textarea, button, base, link[rel="stylesheet"]'

interface ScoredTable {
  table: HTMLTableElement
  score: number
}

export function cleanLegacy(input: string): LegacyCleanResult {
  const warnings: string[] = []
  const dom = new DOMParser().parseFromString(input, 'text/html')
  const body = dom.body

  const dropped = dom.querySelectorAll(DROP_TAGS)
  if (dropped.length > 0) {
    dropped.forEach((el) => el.remove())
    warnings.push(`Removed ${dropped.length} unsupported tag(s) (scripts, forms, iframes, stylesheets)`)
  }

  let handlers = 0
  dom.querySelectorAll('*').forEach((el) => {
    for (const attr of [...el.attributes]) {
      if (/^on/i.test(attr.name)) {
        el.removeAttribute(attr.name)
        handlers++
      } else if (attr.name === 'href' && attr.value.trim().toLowerCase().startsWith('javascript:')) {
        el.setAttribute('href', '#')
        handlers++
      }
    }
  })
  if (handlers > 0) warnings.push(`Stripped ${handlers} unsafe attribute(s)`)

  const httpImgs = [...dom.querySelectorAll('img')].filter((i) => (i.getAttribute('src') ?? '').toLowerCase().startsWith('http://'))
  if (httpImgs.length > 0) warnings.push(`${httpImgs.length} image(s) use insecure http:// URLs — re-upload via the asset manager before sending`)

  const noAlt = [...dom.querySelectorAll('img')].filter((i) => !(i.getAttribute('alt') ?? '').trim())
  if (noAlt.length > 0) {
    noAlt.forEach((i) => i.setAttribute('alt', ''))
    warnings.push(`${noAlt.length} image(s) missing alt text (added empty alt)`)
  }

  const tables = [...body.querySelectorAll('table')]
  if (tables.length === 0) {
    warnings.push('No table layout detected — whole body imported as a raw block')
    return { html: dom.documentElement.outerHTML, warnings }
  }

  const content = findContentTable(body)
  if (content === null) {
    warnings.push('Could not identify a main content table — imported as raw blocks')
    return { html: dom.documentElement.outerHTML, warnings }
  }

  let width = parseInt((content.getAttribute('width') ?? '').replace(/px$/, ''), 10)
  if (!Number.isFinite(width) || width <= 0) {
    const styleWidth = /(\d+)px/.exec(content.style.width)?.[1]
    width = styleWidth ? parseInt(styleWidth, 10) : 600
  }
  if (width !== 600) warnings.push(`Content width normalized from ${width}px to 600px`)
  content.setAttribute('width', '600')
  content.style.width = '600px'
  content.style.maxWidth = '600px'
  content.classList.add('et-content')

  const stats = tagRows(content)
  if (stats.text > 0) warnings.push(`Recognized ${stats.text} text row(s)`)
  if (stats.heading > 0) warnings.push(`Recognized ${stats.heading} heading row(s)`)
  if (stats.image > 0) warnings.push(`Recognized ${stats.image} image row(s)`)
  if (stats.button > 0) warnings.push(`Recognized ${stats.button} button row(s)`)
  if (stats.spacer > 0) warnings.push(`Recognized ${stats.spacer} spacer row(s)`)
  if (stats.raw > 0) warnings.push(`${stats.raw} row(s) kept as raw HTML — edit carefully or rebuild with blocks`)

  const inlined = inlineCss(dom.documentElement.outerHTML)
  return { html: inlined, warnings }
}

function findContentTable(body: HTMLElement): HTMLTableElement | null {
  const tables = [...body.querySelectorAll('table')]
  const scored: ScoredTable[] = tables.map((table) => {
    const widthAttr = parseInt((table.getAttribute('width') ?? '').replace(/px$/, ''), 10)
    const styleWidth = /(\d+)px/.exec(table.style.width)?.[1]
    let width = Number.isFinite(widthAttr) && widthAttr > 0 ? widthAttr : (styleWidth ? parseInt(styleWidth, 10) : 0)
    if (width === 0) width = 500
    const rows = table.querySelectorAll('tr').length
    const nested = table.querySelectorAll('table').length
    const wrapperPenalty = table.getAttribute('width') === '100%' ? -1000 : 0
    return { table, score: width + rows * 5 + nested * 2 + wrapperPenalty }
  })
  scored.sort((a, b) => b.score - a.score)
  return scored.length > 0 ? scored[0].table : null
}

interface TagStats {
  text: number
  heading: number
  image: number
  button: number
  spacer: number
  raw: number
}

/**
 * Marker classes every block type's own render() writes on its row's <td>.
 * Rows already carrying one of these (re-importing HTML the app itself
 * exported) are left alone: heading/text/image/button/spacer are
 * structurally distinct enough that re-running the heuristics below is
 * harmless, but a footer's plain-paragraph content is structurally
 * identical to a generic text block, so re-tagging it would add `et-text`
 * alongside `et-footer` and — since text is matched first during parsing —
 * silently reclassify the block, dropping its footer-specific styling.
 */
const KNOWN_BLOCK_CLASSES = [
  'et-header', 'et-heading', 'et-text', 'et-image', 'et-btn-td', 'et-spacer',
  'et-divider', 'et-social', 'et-footer', 'et-twocol', 'et-imgtext', 'et-raw',
]

function tagRows(content: HTMLTableElement): TagStats {
  const stats: TagStats = { text: 0, heading: 0, image: 0, button: 0, spacer: 0, raw: 0 }
  const rows = directRows(content)
  for (const tr of rows) {
    const tds = [...tr.children].filter((c) => c.tagName === 'TD')
    if (tds.length !== 1) {
      stats.raw++
      continue
    }
    const td = tds[0] as HTMLElement
    if (KNOWN_BLOCK_CLASSES.some((cls) => td.classList.contains(cls))) continue
    const children = [...td.children].filter((c) => !isLayoutNoise(c))
    const text = (td.textContent ?? '').trim()

    if (text === '' && children.length === 0) {
      const heightAttr = td.getAttribute('height')
      const styleMatch = /(\d+)px/.exec(td.style.height)?.[1]
      const height = heightAttr ?? styleMatch
      if (height != null) {
        td.classList.add('et-spacer')
        td.style.height = `${parseInt(height, 10)}px`
        stats.spacer++
        continue
      }
    }

    if (children.length === 1 && td.querySelectorAll('img').length === 1 && td.querySelector('table') === null) {
      const img = td.querySelector('img')!
      td.classList.add('et-image')
      img.classList.add('et-img')
      stats.image++
      continue
    }

    if (children.length === 1 && children[0].tagName === 'A' && text !== '' && td.querySelector('img, table') === null) {
      const a = children[0] as HTMLElement
      td.classList.add('et-btn-td')
      a.classList.add('et-btn')
      stats.button++
      continue
    }

    const heading = children.length >= 1 && td.querySelector('table, img') === null ? td.querySelector('h1, h2, h3') : null
    if (heading !== null && (heading.textContent ?? '').trim() === text) {
      td.classList.add('et-heading')
      heading.classList.add('et-h')
      stats.heading++
      continue
    }

    if (td.querySelector('table, img, hr, ul, ol, div') === null && text !== '') {
      td.classList.add('et-text')
      td.querySelectorAll('a').forEach((a) => a.classList.add('et-link'))
      stats.text++
      continue
    }

    stats.raw++
  }
  return stats
}

function isLayoutNoise(el: Element): boolean {
  return el.tagName === 'BR' || (el.tagName === 'DIV' && (el.textContent ?? '').trim() === '')
}

function directRows(table: HTMLTableElement): Element[] {
  const out: Element[] = []
  for (const child of table.children) {
    if (child.tagName === 'TR') out.push(child)
    else if (child.tagName === 'TBODY' || child.tagName === 'THEAD' || child.tagName === 'TFOOT') {
      for (const tr of child.children) if (tr.tagName === 'TR') out.push(tr)
    }
  }
  return out
}
