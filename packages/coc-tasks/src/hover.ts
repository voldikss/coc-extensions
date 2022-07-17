import { Hover, HoverProvider, Position, TextDocument, workspace } from 'coc.nvim'

import { genMacros } from './macros'

export default class TasksMacroHoverProvider implements HoverProvider {
  public async provideHover(document: TextDocument, position: Position): Promise<Hover | null> {
    const doc = workspace.getDocument(document.uri)
    if (!doc) return null
    const wordRange = doc.getWordRangeAtPosition(position)
    if (!wordRange) return null
    const text = document.getText(wordRange) || ''
    if (!text) return null
    const macros = await genMacros()
    if (!(text in macros)) return null
    const { description, example } = macros[text as keyof typeof macros]
    const hover: Hover = {
      contents: {
        kind: 'markdown',
        value: description + (example != '' ? `\ne.g. \`${example}\`` : ''),
      },
    }
    return hover
  }
}
