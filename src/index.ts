import {ExtensionContext, commands, workspace, listManager} from 'coc.nvim'
import {statAsync, mkdirAsync} from './util'
import {Translation, DisplayMode} from './types'
import TranslationList from './lists/translation'
import DB from './db'
import translate from './translator'
import display from './display'


export async function activate(context: ExtensionContext): Promise<void> {
  const {subscriptions, storagePath} = context
  const {nvim} = workspace
  const stat = await statAsync(storagePath)
  if (!stat || !stat.isDirectory()) {
    await mkdirAsync(storagePath)
  }
  const config = workspace.getConfiguration('translator')
  const db = new DB(storagePath, config.get<number>('maxsize', 5000))

  subscriptions.push(workspace.registerKeymap(['n'], 'translator-p', async () => {
    await manager('popup', db)
  }, {sync: false}))

  subscriptions.push(workspace.registerKeymap(['n'], 'translator-e', async () => {
    await manager('echo', db)
  }, {sync: false}))

  subscriptions.push(workspace.registerKeymap(['n'], 'translator-r', async () => {
    await manager('replace', db)
  }, {sync: false}))

  subscriptions.push(workspace.registerKeymap(['n'], 'translator-h', async () => {
    await exportHistory(db)
  }, {sync: false}))

  subscriptions.push(commands.registerCommand('translator.popup', async () => {
    await manager('popup', db)
  }))

  subscriptions.push(commands.registerCommand('translator.echo', async () => {
    await manager('echo', db)

  }))
  subscriptions.push(commands.registerCommand('translator.replace', async () => {
    await manager('replace', db)
  }))

  subscriptions.push(commands.registerCommand('translator.exportHistory', async () => {
    await exportHistory(db)
  }))

  subscriptions.push(listManager.registerList(new TranslationList(nvim, db)))
}

async function manager(mode: DisplayMode, db: DB): Promise<void> {
  const {nvim} = workspace
  const currWord = (await nvim.eval("expand('<cword>')")).toString()
  const result: Translation = await translate(currWord)
  if (!result) return
  await display(nvim, result, mode)

  // save history
  const bufnr = workspace.bufnr
  const doc = workspace.getDocument(bufnr)
  const [, lnum, col] = await nvim.call('getpos', ".")
  const path = `${doc.uri}\t${lnum}\t${col}`
  const paraphrase: string = result['paraphrase']
  if (paraphrase && paraphrase.toLowerCase() !== currWord.toLowerCase())
    await db.add([currWord, result['paraphrase']], path)
}

async function exportHistory(db: DB): Promise<void> {
  const arr = await db.load()
  const {nvim} = workspace
  nvim.command('tabnew')
  for (let item of arr) {
    let text = item.content[0].padEnd(20) + item.content[1]
    nvim.call('append', [0, text], true)
  }
  nvim.command('syntax match CocTranslatorQuery /\\v^.*\\v%20v/', true)
  nvim.command('syntax match CocTranslatorOmit /\\v\\.\\.\\./', true)
  nvim.command('syntax match CocTranslatorResult /\\v%21v.*$/', true)
  nvim.command('highlight default link CocTranslatorQuery Keyword', true)
  nvim.command('highlight default link CocTranslatorResult String', true)
}
