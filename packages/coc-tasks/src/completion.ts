import {
  CompletionItem,
  CompletionItemKind,
  CompletionItemProvider,
  Position,
  TextDocument,
} from 'coc.nvim'

import { genMacros } from './macros'

export class TasksMacroCompletionProvider implements CompletionItemProvider {
  public async provideCompletionItems(
    document: TextDocument,
    position: Position,
  ): Promise<CompletionItem[]> {
    const prechar = document.getText({
      start: {
        line: position.line,
        character: position.character,
      },
      end: {
        line: position.line,
        character: position.character - 1,
      },
    })
    return Object.entries(await genMacros()).map((entry) => {
      const [macro, { description, example }] = entry
      return {
        label: macro,
        kind: CompletionItemKind.Constant,
        documentation: description + (example != '' ? `\ne.g. \`${example}\`` : ''),
        insertText: prechar == '$' ? `(${macro})` : macro,
      }
    })
  }
}
