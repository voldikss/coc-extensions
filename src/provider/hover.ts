import {
  workspace,
  HoverProvider,
  TextDocument,
  Position,
  Hover
} from 'coc.nvim'
import { Translator } from '../commands/translator'

export class TranslatorHoverProvider implements HoverProvider {
  constructor(private translator: Translator) {}

  public async provideHover(document: TextDocument, position: Position): Promise<Hover | null> {
    if (!workspace.getConfiguration('translator').get<boolean>('enableHover')) return
    const doc = workspace.getDocument(document.uri)
    if (!doc) return null
    const wordRange = doc.getWordRangeAtPosition(position)
    if (!wordRange) return null
    const text = document.getText(wordRange) || ''
    if (!text) return null
    const translation = await this.translator.translate(text)
    if (!translation) return null
    return {
      contents: {
        kind: 'markdown',
        value: translation.markdown().join('\n')
      }
    }
  }
}
