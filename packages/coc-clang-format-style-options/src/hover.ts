import { Hover, HoverProvider, Position, TextDocument, workspace } from 'coc.nvim'

import * as options from '../scripts/ClangFormatStyleOptions.json'

export default class CFSOHoverProvider implements HoverProvider {
  public async provideHover(document: TextDocument, position: Position): Promise<Hover | null> {
    const doc = workspace.getDocument(document.uri)
    if (!doc) return null
    const wordRange = doc.getWordRangeAtPosition(position)
    if (!wordRange) return null
    const text = document.getText(wordRange) || ''
    if (!text) return null
    if (!(text in options)) return null

    const option = options[text as keyof typeof options]
    if (!('description' in option)) return null
    let info = option['description']
    if ('enum' in option) {
      for (const [value, detail] of Object.entries(option['enum'])) {
        info += `\`${value}\`\n${detail}`
      }
    }

    const hover: Hover = {
      contents: {
        kind: 'markdown',
        value: info,
      },
    }
    return hover
  }
}
