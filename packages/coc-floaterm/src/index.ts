import { ExtensionContext, languages, listManager, workspace } from 'coc.nvim'

import { FloatermCompletionProvider } from './completion'
import Floaterm from './list'

export async function activate(context: ExtensionContext): Promise<void> {
  const { nvim } = workspace
  const { subscriptions } = context

  const config = workspace.getConfiguration('floaterm.completion')

  if (config.get<boolean>('enable')) {
    subscriptions.push(
      languages.registerCompletionItemProvider(
        'coc-floaterm',
        config.get<string>('shortcut', 'floaterm'),
        null,
        new FloatermCompletionProvider(nvim),
        [],
        config.get<number>('priority'),
      ),
    )
  }

  subscriptions.push(listManager.registerList(new Floaterm(nvim)))
}
