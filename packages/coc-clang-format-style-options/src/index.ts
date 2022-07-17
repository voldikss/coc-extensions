import { ExtensionContext, languages, listManager, workspace } from 'coc.nvim'

import { CFSOCompletionProvider } from './completion'
import CFSOHoverProvider from './hover'
import CFSTList from './list'

export async function activate(context: ExtensionContext): Promise<void> {
  const { nvim } = workspace
  const { subscriptions } = context

  const config = workspace.getConfiguration('clang-format-style-options')

  subscriptions.push(
    languages.registerCompletionItemProvider(
      'coc-clang-format-style-options',
      config.get<string>('shortcut'),
      null,
      new CFSOCompletionProvider(nvim),
      [],
      config.get<number>('priority'),
    ),
  )

  subscriptions.push(languages.registerHoverProvider(['*'], new CFSOHoverProvider()))

  subscriptions.push(listManager.registerList(new CFSTList(nvim)))
}
