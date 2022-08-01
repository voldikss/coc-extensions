import {
  CompletionItem,
  CompletionItemKind,
  CompletionItemProvider,
  ExtensionContext,
  languages,
  Position,
  ProviderResult,
  TextDocument,
  window,
  workspace,
} from 'coc.nvim'

export async function activate(context: ExtensionContext): Promise<void> {
  const { subscriptions } = context
  const config = workspace.getConfiguration('just-complete')

  subscriptions.push(
    languages.registerCompletionItemProvider(
      'coc-just-complete',
      config.get<string>('shortcut')!,
      null,
      new CompletionProvider(),
      config.get<string[]>('triggerChars')!,
      config.get<number>('priority'),
      [],
    ),
  )
}

export class CompletionProvider implements CompletionItemProvider {
  constructor() {}

  provideCompletionItems(
    document: TextDocument,
    position: Position,
  ): ProviderResult<CompletionItem[]> {
    const doc = workspace.getDocument(document.uri)
    if (!doc) return []

    const wordRange = doc.getWordRangeAtPosition(
      Position.create(position.line, position.character - 2),
    )
    if (!wordRange) return []

    const preWord = document.getText(wordRange)

    return this.gatherWords()
      .filter((word) => word.indexOf(preWord) < 0 && preWord.indexOf(word) < 0)
      .map<CompletionItem>((word) => ({
        label: `${word}`,
        kind: CompletionItemKind.Text,
        insertText: `${word}`,
      }))
  }

  private gatherWords(): string[] {
    const words: string[] = []
    workspace.documents.forEach((document) => {
      window.showInformationMessage(String(document['matchWords']))
      // Object.keys(document).forEach(key => {
      //   // window.showInformationMessage(key, String(document[key]))
      //   window.showInformationMessage(key)
      //   window.showInformationMessage(String(document[key]))
      // })
      return
      // @ts-ignore
      if (document['isIgnored']) return
      // @ts-ignore
      for (const word of document['words'] as string[]) {
        words.push(word)
        for (const word_no_underscore of word.split('_')) {
          if (!words.includes(word_no_underscore) && word_no_underscore.length >= 3) {
            words.push(word_no_underscore)
          }
        }
      }
    })
    return words
  }
}
