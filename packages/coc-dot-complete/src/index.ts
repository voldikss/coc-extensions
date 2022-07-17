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
  const config = workspace.getConfiguration('dot-complete')

  subscriptions.push(
    languages.registerCompletionItemProvider(
      'coc-dot-complete',
      config.get<string>('shortcut'),
      null,
      new DotCompleteProvider(),
      ['.'],
      config.get<number>('priority'),
      [],
    ),
  )
}

export class DotCompleteProvider implements CompletionItemProvider {
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
      if (document['isIgnored']) return
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
