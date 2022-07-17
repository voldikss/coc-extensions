import {
  CompletionItem,
  CompletionItemKind,
  CompletionItemProvider,
  Neovim,
  TextDocument,
} from 'coc.nvim'

import * as options from '../scripts/ClangFormatStyleOptions.json'

export class CFSOCompletionProvider implements CompletionItemProvider {
  constructor(private nvim: Neovim) {}

  public async provideCompletionItems(document: TextDocument): Promise<CompletionItem[]> {
    if (document.languageId != 'clang-format' && document.uri.indexOf('clang-format') < 0) {
      return []
    }
    return [...new Set(Object.keys(options))].map<CompletionItem>((name) => {
      const option = options[name as keyof typeof options]
      let description = ''
      if ('description' in option) {
        description = option['description']
        if ('enum' in option) {
          for (const [value, detail] of Object.entries(option['enum'])) {
            description += `\`${value}\`\n${detail}`
          }
        }
      }
      return {
        label: `${name}~`,
        kind: CompletionItemKind.Keyword,
        insertText: name,
        documentation: description,
      }
    })
  }
}
