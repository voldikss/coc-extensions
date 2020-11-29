import { workspace, HoverProvider } from 'coc.nvim'
import { Hover, MarkupKind } from 'vscode-languageserver-protocol'
import Translator from '../common/translator'
import { buildLines } from '../common/util'

export class TranslatorHoverProvider implements HoverProvider {
  constructor(private translator: Translator) { }

  public async provideHover(document, position): Promise<Hover | null> {
    if (!workspace.getConfiguration('translator').get<boolean>('enableHover')) return
    const doc = workspace.getDocument(document.uri)
    if (!doc) return null
    const wordRange = doc.getWordRangeAtPosition(position)
    if (!wordRange) return null
    const text = document.getText(wordRange) || ''
    if (!text) return null
    const trans = await this.translator.translate(text)
    if (!trans) return null
    return {
      contents: {
        kind: MarkupKind.Markdown,
        value: buildLines(trans).join('\n')
      }
    }
  }
}
