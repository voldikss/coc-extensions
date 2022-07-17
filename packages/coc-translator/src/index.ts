import { ExtensionContext, languages, listManager, workspace } from 'coc.nvim'

import { TranslationList } from './lists/translation'
import Manager from './manager'
import { TranslatorHoverProvider } from './provider/hover'
import { DB } from './util/db'
import { fsMkdir, fsStat } from './util/fs'
import { logger } from './util/logger'

export async function activate(context: ExtensionContext): Promise<void> {
  const { subscriptions, storagePath } = context
  const stat = await fsStat(storagePath)
  if (!stat?.isDirectory()) {
    await fsMkdir(storagePath)
  }

  const { nvim } = workspace
  const db = new DB(storagePath)
  const manager = new Manager(nvim, db)

  subscriptions.push(
    workspace.registerKeymap(
      ['n'],
      'translator-p',
      async () => {
        await manager.showTranslation('n', 'popup')
      },
      { sync: false },
    ),
  )

  subscriptions.push(
    workspace.registerKeymap(
      ['v'],
      'translator-pv',
      async () => {
        await manager.showTranslation('v', 'popup')
      },
      { sync: false },
    ),
  )

  subscriptions.push(
    workspace.registerKeymap(
      ['n'],
      'translator-e',
      async () => {
        await manager.showTranslation('n', 'echo')
      },
      { sync: false },
    ),
  )

  subscriptions.push(
    workspace.registerKeymap(
      ['v'],
      'translator-ev',
      async () => {
        await manager.showTranslation('v', 'echo')
      },
      { sync: false },
    ),
  )

  subscriptions.push(
    workspace.registerKeymap(
      ['n'],
      'translator-r',
      async () => {
        await manager.showTranslation('n', 'replace')
      },
      { sync: false },
    ),
  )

  subscriptions.push(
    workspace.registerKeymap(
      ['v'],
      'translator-rv',
      async () => {
        await manager.showTranslation('v', 'replace')
      },
      { sync: false },
    ),
  )

  subscriptions.push(languages.registerHoverProvider(['*'], new TranslatorHoverProvider(manager)))

  subscriptions.push(listManager.registerList(new TranslationList(nvim, db)))

  subscriptions.push(logger)
}
