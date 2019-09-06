import {
  ExtensionContext,
  commands,
  workspace,
  listManager,
  WorkspaceConfiguration,
  Neovim
} from 'coc.nvim'
import {
  YoudaoTranslator,
  GoogleTranslator,
  CibaTranslator,
  BingTranslator,
  History,
  Display
} from './commands'
import { statAsync, mkdirAsync } from './util/io'
import { Translation, SingleTranslation } from './types'
import TranslationList from './lists/translation'
import { DB, showMessage } from './util'

export async function activate(context: ExtensionContext): Promise<void> {
  const { subscriptions, storagePath } = context
  const { nvim } = workspace
  const stat = await statAsync(storagePath)
  if (!stat || !stat.isDirectory()) await mkdirAsync(storagePath)

  const config: WorkspaceConfiguration = workspace.getConfiguration('translator')
  const engines = config.get<string[]>('engines', ['ciba', 'google'])
  const toLang = config.get<string>('toLang', 'zh')
  const db = new DB(storagePath, config.get<number>('maxsize', 5000))
  const history = new History(nvim, db)
  const displayer = new Display(nvim)

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
      async () => {
        const text = await getText(nvim)
        const trans = await translate(text, engines, toLang)
        if (!trans) return
        await displayer.popup(trans)
        await history.save(trans)
      }, { sync: false }
    )
  )

  subscriptions.push(
    workspace.registerKeymap(
      ['n'],
      'translator-e',
      async () => {
        const text = await getText(nvim)
        const trans = await translate(text, engines, toLang)
        if (!trans) return
        await displayer.echo(trans)
        await history.save(trans)
      }, { sync: false }
    )
  )

  subscriptions.push(
    workspace.registerKeymap(
      ['n'],
      'translator-r',
      async () => {
        const text = await getText(nvim)
        const trans = await translate(text, engines, toLang)
        if (!trans) return
        await displayer.replace(trans)
        await history.save(trans)
      }, { sync: false }
    )
  )

  subscriptions.push(
    workspace.registerKeymap(
      ['n'],
      'translator-h',
      async () => {
        await history.export()
      }, { sync: false }
    )
  )

  subscriptions.push(
    commands.registerCommand(
      'translator.popup',
      async (text: string) => {
        if (!text || text.trim() === '') text = await getText(nvim)
        const trans = await translate(text, engines, toLang)
        if (!trans) return
        await displayer.popup(trans)
        await history.save(trans)
      }
    )
  )

  subscriptions.push(
    commands.registerCommand(
      'translator.echo',
      async text => {
        if (!text || text.trim() === '') text = await getText(nvim)
        const trans = await translate(text, engines, toLang)
        if (!trans) return
        await displayer.echo(trans)
        await history.save(trans)
      }
    )
  )
  subscriptions.push(
    commands.registerCommand(
      'translator.replace',
      async text => {
        if (!text || text.trim() === '') text = await getText(nvim)
        const trans = await translate(text, engines, toLang)
        if (!trans) return
        await displayer.replace(trans)
        await history.save(trans)
      }
    )
  )

  subscriptions.push(
    commands.registerCommand(
      'translator.exportHistory',
      async () => {
        await history.export()
      }
    )
  )

  subscriptions.push(
    listManager.registerList(
      new TranslationList(nvim, db)
    )
  )
}

async function getText(nvim: Neovim): Promise<string> {
  const text = (await nvim.eval("expand('<cword>')")).toString()
  if (!text || text.trim() === '') return
  return text
}

export async function translate(
  text: string,
  engines: string[],
  toLang: string,
): Promise<Translation | void> {
  if (!text || text.trim() === '') return

  const ENGINES = {
    bing: BingTranslator,
    ciba: CibaTranslator,
    google: GoogleTranslator,
    youdao: YoudaoTranslator
  }

  const translatePromises = engines.map(e => {
    const cls = ENGINES[e]
    const translator = new cls(e)
    return translator.translate(text, toLang)
  })

  return Promise.all(translatePromises)
    .then((results: SingleTranslation[]) => {
      results = results.filter(result => {
        return result.status === 1 &&
          !(result.explain.length === 0 && result.paraphrase === '')
      })
      return {
        text,
        results
      } as Translation
    })
    .catch(_e => {
      showMessage('Translation failed', 'error')
      return
    })
}
