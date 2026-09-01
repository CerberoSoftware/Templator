interface ClassRule {
  cls: string
  decls: Array<[string, string]>
  order: number
}

interface ParsedCss {
  classRules: Map<string, ClassRule>
  keepClasses: Set<string>
  residualRules: string[]
  mediaBlocks: string[]
}

export function inlineCss(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const styleTags = [...doc.querySelectorAll('style')]
  const parsed = parseStyleSheets(styleTags.map((t) => t.textContent ?? ''))

  for (const el of [...doc.querySelectorAll<HTMLElement>('[class]')]) {
    const tokens = [...el.classList]
    if (tokens.length === 0) continue

    const classDecls = new Map<string, string>()
    for (const token of tokens) {
      const rule = parsed.classRules.get(token)
      if (!rule) continue
      for (const [prop, value] of rule.decls) {
        classDecls.set(prop, value)
      }
    }
    if (classDecls.size === 0 && !tokens.some((t) => parsed.keepClasses.has(t) || inResidual(parsed, t))) {
      continue
    }

    const existing = parseDeclarations(el.getAttribute('style') ?? '')
    const merged = new Map<string, string>(classDecls)
    for (const [prop, value] of existing) {
      merged.set(prop, value)
    }
    if (merged.size > 0) {
      el.setAttribute('style', serializeDecls([...merged]))
    }

    const kept = tokens.filter(
      (t) => parsed.keepClasses.has(t) || inResidual(parsed, t) || !parsed.classRules.has(t),
    )
    if (kept.length === 0) {
      el.removeAttribute('class')
    } else if (kept.length !== tokens.length) {
      el.setAttribute('class', kept.join(' '))
    }
  }

  // Fix: consolidate all <style> tags into a single one to prevent duplicate
  // media queries and residual rules when multiple <style> elements exist.
  const keptCss = [...parsed.mediaBlocks, ...parsed.residualRules].join('\n')
  if (styleTags.length > 0) {
    const first = styleTags[0]
    if (keptCss.trim() === '') {
      first.remove()
    } else {
      first.textContent = keptCss
    }
    // Remove all remaining style tags beyond the first
    for (let i = 1; i < styleTags.length; i++) {
      styleTags[i].remove()
    }
  }

  return `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`
}

function inResidual(parsed: ParsedCss, cls: string): boolean {
  return parsed.residualRules.some((rule) => rule.includes(`.${cls}`))
}

function parseStyleSheets(sheets: string[]): ParsedCss {
  const result: ParsedCss = {
    classRules: new Map(),
    keepClasses: new Set(),
    residualRules: [],
    mediaBlocks: [],
  }
  let order = 0
  for (const sheet of sheets) {
    const css = sheet.replace(/\/\*[\s\S]*?\*\//g, '')
    let i = 0
    while (i < css.length) {
      const braceStart = css.indexOf('{', i)
      if (braceStart === -1) break
      const selector = css.slice(i, braceStart).trim()
      const end = findMatchingBrace(css, braceStart)
      if (end === -1) break
      const body = css.slice(braceStart + 1, end)

      if (selector.startsWith('@media')) {
        result.mediaBlocks.push(`${selector} {${body}}`)
        for (const cls of classTokensIn(body)) result.keepClasses.add(cls)
      } else if (selector.startsWith('@')) {
        result.residualRules.push(`${selector} {${body}}`)
      } else {
        const cls = singleClassSelector(selector)
        if (cls !== null) {
          const rule: ClassRule = { cls, decls: parseDeclarations(body), order: order++ }
          const existing = result.classRules.get(cls)
          if (existing) {
            existing.decls.push(...rule.decls)
          } else {
            result.classRules.set(cls, rule)
          }
        } else {
          result.residualRules.push(`${selector} {${body}}`)
          for (const token of classTokensIn(selector)) result.keepClasses.add(token)
        }
      }
      i = end + 1
    }
  }
  return result
}

function findMatchingBrace(css: string, start: number): number {
  let depth = 0
  for (let i = start; i < css.length; i++) {
    if (css[i] === '{') depth++
    if (css[i] === '}') {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

function singleClassSelector(selector: string): string | null {
  const trimmed = selector.trim()
  if (/^\.[a-zA-Z0-9_-]+$/.test(trimmed)) return trimmed.slice(1)
  return null
}

function classTokensIn(css: string): string[] {
  const out: string[] = []
  const re = /\.([a-zA-Z0-9_-]+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(css)) !== null) out.push(m[1])
  return out
}

function parseDeclarations(style: string): Array<[string, string]> {
  const out: Array<[string, string]> = []
  for (const part of style.split(';')) {
    const colon = part.indexOf(':')
    if (colon === -1) continue
    const prop = part.slice(0, colon).trim().toLowerCase()
    const value = part.slice(colon + 1).trim()
    if (prop !== '' && value !== '') out.push([prop, value])
  }
  return out
}

function serializeDecls(decls: Array<[string, string]>): string {
  return decls.map(([prop, value]) => `${prop}:${value}`).join(';')
}
