import {
  ExtensionContext,
  commands,
  workspace,
  listManager,
  languages,
} from 'coc.nvim'
import { KeymapMode, ActionMode } from './types'
import { TranslationList } from './lists/translation'
import { fsStat, fsMkdir } from './util/fs'
import { logger } from './util/logger'
import { DB } from './util/db'
import { TranslatorHoverProvider } from './provider/hover'
import Manager from './commands/manager'

export async function activate(context: ExtensionContext): Promise<void> {
  const { subscriptions, storagePath } = context
  const stat = await fsStat(storagePath)
  if (!(stat?.isDirectory())) {
    await fsMkdir(storagePath)
  }

  const { nvim } = workspace
  const db = new DB(storagePath)
  const manager = new Manager(nvim, db)

  subscriptions.push(logger)

  subscriptions.push(
    workspace.registerKeymap(
      ['n'],
      'translator-p',
      async () => {
        await manager
          .setKeymapMode('n')
          .setActionMode('popup')
          .translate()
      }, { sync: false }
    )
  )

  subscriptions.push(
    workspace.registerKeymap(
      ['v'],
      'translator-pv',
      async () => {
        await manager
          .setKeymapMode('v')
          .setActionMode('popup')
          .translate()
      }, { sync: false }
    )
  )

  subscriptions.push(
    workspace.registerKeymap(
      ['n'],
      'translator-e',
      async () => {
        await manager
          .setKeymapMode('n')
          .setActionMode('echo')
          .translate()
      }, { sync: false }
    )
  )

  subscriptions.push(
    workspace.registerKeymap(
      ['v'],
      'translator-ev',
      async () => {
        await manager
          .setKeymapMode('v')
          .setActionMode('echo')
          .translate()
      }, { sync: false }
    )
  )

  subscriptions.push(
    workspace.registerKeymap(
      ['n'],
      'translator-r',
      async () => {
        await manager
          .setKeymapMode('n')
          .setActionMode('replace')
          .translate()
      }, { sync: false }
    )
  )

  subscriptions.push(
    workspace.registerKeymap(
      ['v'],
      'translator-rv',
      async () => {
        await manager
          .setKeymapMode('v')
          .setActionMode('replace')
          .translate()
      }, { sync: false }
    )
  )

  subscriptions.push(
    commands.registerCommand(
      'translator.popup',
      async (text: string) => {
        await manager
          .setKeymapMode('n')
          .setActionMode('popup')
          .translate(text)
      }
    )
  )

  subscriptions.push(
    commands.registerCommand(
      'translator.echo',
      async (text: string) => {
        await manager
          .setKeymapMode('n')
          .setActionMode('echo')
          .translate(text)
      }
    )
  )
  subscriptions.push(
    commands.registerCommand(
      'translator.replace',
      async (text: string) => {
        await manager
          .setKeymapMode('n')
          .setActionMode('replace')
          .translate(text)
      }
    )
  )

  subscriptions.push(
    commands.registerCommand(
      'translator.exportHistory',
      async () => {
        await manager.exportHistory()
      }
    )
  )

  subscriptions.push(
    languages.registerHoverProvider(
      ['*'],
      new TranslatorHoverProvider(
        manager
      )
    )
  )

  subscriptions.push(
    listManager.registerList(
      new TranslationList(
        nvim,
        db
      )
    )
  )
}
