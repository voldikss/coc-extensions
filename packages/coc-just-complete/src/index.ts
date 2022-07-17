import {
  CompletionItem,
  CompletionItemKind,
  CompletionItemProvider,
  ExtensionContext,
  languages,
  Position,
  ProviderResult,
  TextDocument,
  workspace,
} from 'coc.nvim'

export async function activate(context: ExtensionContext): Promise<void> {
  const { subscriptions } = context
  const config = workspace.getConfiguration('just-complete')

  subscriptions.push(
    languages.registerCompletionItemProvider(
      'coc-just-complete',
      config.get<string>('shortcut'),
      null,
      new JustCompleteProvider(),
      ['_'],
      config.get<number>('priority'),
      [],
    ),
  )
}

export class JustCompleteProvider implements CompletionItemProvider {
  constructor() {}

  provideCompletionItems(
    document: TextDocument,
    position: Position,
  ): ProviderResult<CompletionItem[]> {
    const doc = workspace.getDocument(document.uri)
    if (!doc) return []

    const wordRange = doc.getWordRangeAtPosition(
      Position.create(position.line, position.character - 1),
    )
    if (!wordRange) return []

    const preWord = document.getText(wordRange)
    if (preWord.indexOf('_') < 0) return []

    const prePreWord = preWord.slice(0, preWord.lastIndexOf('_'))

    return this.gatherWords()
      .filter((word) => word.indexOf(prePreWord) < 0 && prePreWord.indexOf(word) < 0)
      .map<CompletionItem>((word) => ({
        label: `${prePreWord}_${word}`,
        kind: CompletionItemKind.Text,
        insertText: `${prePreWord}_${word}`,
      }))
  }

  private gatherWords(): string[] {
    const words: string[] = []
    workspace.documents.forEach((document) => {
      if (document['isIgnored']) return
      for (const word of document['words'] as string[]) {
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
