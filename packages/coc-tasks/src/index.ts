import { commands, ExtensionContext, languages, listManager, workspace } from 'coc.nvim'

import { TasksMacroCompletionProvider } from './completion'
import TasksMacroHoverProvider from './hover'
import Tasks from './tasks'

export async function activate(context: ExtensionContext): Promise<void> {
  const { nvim } = workspace
  const { subscriptions } = context
  const config = workspace.getConfiguration('tasks')

  const taskList = new Tasks(nvim)

  subscriptions.push(
    listManager.registerList(taskList),

    commands.registerCommand('tasks.runLastTask', async () => {
      await taskList.runLastTask()
    }),
  )

  subscriptions.push(
    languages.registerCompletionItemProvider(
      'coc-tasks',
      config.get<string>('shortcut'),
      config.get<string[]>('filetypes'),
      new TasksMacroCompletionProvider(),
      config.get<string[]>('triggerCharacters'),
      config.get<number>('priority'),
      [],
    ),
  )

  subscriptions.push(
    languages.registerHoverProvider(config.get('filetypes'), new TasksMacroHoverProvider()),
  )
}
