import { workspace, HoverProvider, TextDocument, Position, Hover } from 'coc.nvim'
import Manager from '../manager'

export class TranslatorHoverProvider implements HoverProvider {
  constructor(private manager: Manager) {}

  public async provideHover(document: TextDocument, position: Position): Promise<Hover | null> {
    if (!workspace.getConfiguration('translator').get<boolean>('enableHover')) return
    const doc = workspace.getDocument(document.uri)
    if (!doc) return null
    const wordRange = doc.getWordRangeAtPosition(position)
    if (!wordRange) return null
    const text = document.getText(wordRange) || ''
    if (!text) return null
    const translation = await this.manager.getTranslation(text)
    if (!translation) return null
    return {
      contents: {
        kind: 'markdown',
        value: translation.toMarkdown().join('\n'),
      },
    }
  }
}
