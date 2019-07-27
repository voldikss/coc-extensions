import { ExtensionContext, commands, workspace, listManager } from 'coc.nvim'
import { statAsync, mkdirAsync } from './util'
import { TransType, DisplayMode } from './types'
import TranslationList from './lists/translation'
import DB from './db'
import translate from './translator'
import display from './display'
import History from './history'

export async function activate(context: ExtensionContext): Promise<void> {
  const { subscriptions, storagePath } = context
  const { nvim } = workspace
  const stat = await statAsync(storagePath)
  if (!stat || !stat.isDirectory()) {
    await mkdirAsync(storagePath)
  }
  const config = workspace.getConfiguration('translator')
  const db = new DB(storagePath, config.get<number>('maxsize', 5000))
  const history = new History(nvim, db)

  subscriptions.push(
    workspace.registerKeymap(
      ['n'],
      'translator-p',
      async () => { await manager('popup', db) },
      { sync: false }
    )
  )

  subscriptions.push(
    workspace.registerKeymap(
      ['n'],
      'translator-e',
      async () => { await manager('echo', db) },
      { sync: false }
    )
  )

  subscriptions.push(
    workspace.registerKeymap(
      ['n'],
      'translator-r',
      async () => { await manager('replace', db) },
      { sync: false }
    )
  )

  subscriptions.push(
    workspace.registerKeymap(
      ['n'],
      'translator-h',
      async () => { await history.export() },
      { sync: false }
    )
  )

  subscriptions.push(
    commands.registerCommand(
      'translator.popup',
      async () => { await manager('popup', db) }
    )
  )

  subscriptions.push(
    commands.registerCommand(
      'translator.echo',
      async () => { await manager('echo', db) }
    )
  )
  subscriptions.push(
    commands.registerCommand(
      'translator.replace',
      async () => { await manager('replace', db) }
    )
  )

  subscriptions.push(
    commands.registerCommand(
      'translator.exportHistory',
      async () => { await history.export() }
    )
  )

  subscriptions.push(
    listManager.registerList(
      new TranslationList(nvim, db)
    )
  )
}

async function manager(mode: DisplayMode, db: DB): Promise<void> {
  const { nvim } = workspace
  const history = new History(nvim, db)
  const currWord = (await nvim.eval("expand('<cword>')")).toString()
  const result: TransType[] = await translate(currWord)
  if (!result) return
  await display(nvim, result, mode)
  await history.save(result)
}

