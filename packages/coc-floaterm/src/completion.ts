import { CompletionItem, CompletionItemKind, CompletionItemProvider, Neovim } from 'coc.nvim'

export class FloatermCompletionProvider implements CompletionItemProvider {
  constructor(private nvim: Neovim) {}

  public async provideCompletionItems(): Promise<CompletionItem[]> {
    const words: string[] = []
    const lines: string[] = await this.nvim.call('floaterm#buffer#getlines', [-1, 100])

    lines.forEach((line) => {
      const matches = line.match(/[0-9a-zA-Z_]{5,20}/g)
      if (matches)
        matches.forEach((word) => {
          if (words && !words.includes(word)) words.push(word)
        })
    })

    return words.map<CompletionItem>((word) => ({
      label: word,
      kind: CompletionItemKind.Text,
      insertText: word,
    }))
  }
}
