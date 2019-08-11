import { ExtensionContext, commands, workspace, listManager } from 'coc.nvim'
import { statAsync, mkdirAsync } from './util/io'
import { DisplayMode, Translation } from './types'
import { translate, display, History } from './commands'
import TranslationList from './lists/translation'
import DB from './util/db'
import { showMessage } from './util'

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

  nvim.command('autocmd FileType translation | ' +
    'syn match CTQuery #@ \\w\\+ @# | hi def link CTQuery Keyword | ' +
    'syn match CTEngine #-\\+ .* -\\+# | hi def link CTEngine Constant | ' +
    'syn match CTParaphrase #🌀.*# | hi def link CTParaphrase PreProc | ' +
    'syn match CTPhonetic #🔉.*# | hi def link CTPhonetic Special | ' +
    'syn match CTExplain #📝.*# | hi def link CTExplain Comment', true)

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
      async text => { await manager('popup', db, text) }
    )
  )

  subscriptions.push(
    commands.registerCommand(
      'translator.echo',
      async text => { await manager('echo', db, text) }
    )
  )
  subscriptions.push(
    commands.registerCommand(
      'translator.replace',
      async text => { await manager('replace', db, text) }
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

async function manager(mode: DisplayMode, db: DB, text?: string): Promise<void> {
  const { nvim } = workspace
  const history = new History(nvim, db)
  if (text === undefined)
    text = (await nvim.eval("expand('<cword>')")).toString()
  const result: Translation = await translate(text)
  if (!result.status) {
    showMessage('Translation failed', 'error')
    return
  }
  await display(nvim, result, mode)
  await history.save(result)
}
