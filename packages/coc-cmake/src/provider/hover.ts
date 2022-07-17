import { CompletionItem, Hover, HoverProvider, Position, TextDocument, workspace } from 'coc.nvim'

import {
  cmake_help_all,
  cmCommandsSuggestionsExact,
  cmModulesSuggestionsExact,
  cmPropertiesSuggestionsExact,
  cmVariablesSuggestionsExact,
  complKind2cmakeType,
} from '../core'

export default class CMakeExtraInfoProvider implements HoverProvider {
  public async provideHover(document: TextDocument, position: Position): Promise<Hover | null> {
    const doc = workspace.getDocument(document.uri)
    if (!doc) return null
    const wordRange = doc.getWordRangeAtPosition(position)
    if (!wordRange) return null
    const text = document.getText(wordRange) || ''
    if (!text) {
      return null
    }
    const promises = cmake_help_all()

    return Promise.all([
      cmCommandsSuggestionsExact(text),
      cmVariablesSuggestionsExact(text),
      cmModulesSuggestionsExact(text),
      cmPropertiesSuggestionsExact(text),
    ]).then((results) => {
      const suggestions = Array.prototype.concat.apply([], results)
      if (suggestions.length == 0) {
        return null
      }
      const suggestion: CompletionItem = suggestions[0]

      return promises[complKind2cmakeType(suggestion.kind!)](suggestion.label).then(
        (result: string) => {
          let lines = result.split('\n')
          lines = lines.slice(2, lines.length)
          const hover: Hover = {
            contents: {
              kind: 'markdown',
              value: lines.join('\n'),
            },
          }
          return hover
        },
      )
    })
  }
}
