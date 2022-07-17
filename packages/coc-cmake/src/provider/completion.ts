import {
  CompletionItem,
  CompletionItemProvider,
  Position,
  ProviderResult,
  TextDocument,
  Thenable,
  workspace,
} from 'coc.nvim'

import {
  cmake_help_all,
  cmCommandsSuggestions,
  cmModulesSuggestions,
  cmPropertiesSuggestions,
  cmVariablesSuggestions,
  complKind2cmakeType,
} from '../core'

export default class CMakeCompletionProvider implements CompletionItemProvider {
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
    const text = document.getText(wordRange)

    return new Promise((resolve, reject) => {
      Promise.all([
        cmCommandsSuggestions(text),
        cmVariablesSuggestions(text),
        cmPropertiesSuggestions(text),
        cmModulesSuggestions(text),
      ])
        .then((results) => {
          const suggestions = Array.prototype.concat.apply([], results)
          resolve(suggestions)
        })
        .catch((err) => {
          reject(err)
        })
    })
  }

  public resolveCompletionItem(item: CompletionItem): Thenable<CompletionItem> {
    const promises = cmake_help_all()
    const type = complKind2cmakeType(item.kind!)
    return promises[type](item.label).then((result: string) => {
      item.documentation = result.split('\n')[3]
      return item
    })
  }
}
