import { Translation } from "../types"

export function buildLines(trans: Translation): string[] {
  const content: string[] = []
  content.push(`<<${trans.text}>>`)
  for (const t of trans.results) {
    content.push(' ')
    content.push(`<${t.engine}>`)
    if (t.phonetic) content.push(` * [${t.phonetic}]`)
    if (t.paraphrase) content.push(` * ${t.paraphrase}`)
    if (t.explain.length) content.push(...t.explain.map(e => " * " + e))
  }
  return content
}
