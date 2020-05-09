import {
  ExtensionContext,
  commands,
  workspace,
  listManager,
  languages
} from 'coc.nvim'
import { History, Display, Translator } from './common'
import { KeymapMode, DisplayMode } from './types'
import { TranslationList } from './lists/translation'
import { DB, statAsync, mkdirAsync } from './util'
import { logger } from './util/logger'
import { TranslatorHoverProvider } from './provider/hover'

export async function activate(context: ExtensionContext): Promise<void> {
  const { subscriptions, storagePath } = context
  subscriptions.push(logger)
  const { nvim } = workspace
  const stat = await statAsync(storagePath)
  if (!stat || !stat.isDirectory()) await mkdirAsync(storagePath)

  const config = workspace.getConfiguration('translator')
  const maxWidth = config.get<number>('window.maxWidth')
  const maxHeight = config.get<number>('window.maxHeight')
  const engines = config.get<string[]>('engines')
  const toLang = config.get<string>('toLang', 'zh')
  const maxSize = config.get<number>('maxsize', 5000)

  const db = new DB(storagePath, maxSize)
  const translator = new Translator(engines, toLang)
  const historyer = new History(nvim, db)
  const displayer = new Display(nvim, maxWidth, maxHeight)
  const helper = new Helper(translator, displayer, historyer)

  subscriptions.push(
    workspace.registerKeymap(
      ['n'],
      'translator-p',
      async () => {
        await helper.keymapCallback('n', 'popup')
      }, { sync: false }
    )
  )

  subscriptions.push(
    workspace.registerKeymap(
      ['v'],
      'translator-pv',
      async () => {
        await helper.keymapCallback('v', 'popup')
      }, { sync: false }
    )
  )

  subscriptions.push(
    workspace.registerKeymap(
      ['n'],
      'translator-e',
      async () => {
        await helper.keymapCallback('n', 'echo')
      }, { sync: false }
    )
  )

  subscriptions.push(
    workspace.registerKeymap(
      ['v'],
      'translator-ev',
      async () => {
        await helper.keymapCallback('v', 'echo')
      }, { sync: false }
    )
  )

  subscriptions.push(
    workspace.registerKeymap(
      ['n'],
      'translator-r',
      async () => {
        await helper.keymapCallback('n', 'replace')
      }, { sync: false }
    )
  )

  subscriptions.push(
    workspace.registerKeymap(
      ['v'],
      'translator-rv',
      async () => {
        await helper.keymapCallback('v', 'replace')
      }, { sync: false }
    )
  )

  subscriptions.push(
    workspace.registerKeymap(
      ['n'],
      'translator-h',
      async () => {
        await historyer.export()
      }, { sync: false }
    )
  )

  subscriptions.push(
    commands.registerCommand(
      'translator.popup',
      async (text: string) => {
        await helper.commandCallback(text, 'popup')
      }
    )
  )

  subscriptions.push(
    commands.registerCommand(
      'translator.echo',
      async text => {
        await helper.commandCallback(text, 'echo')
      }
    )
  )
  subscriptions.push(
    commands.registerCommand(
      'translator.replace',
      async text => {
        await helper.commandCallback(text, 'replace')
      }
    )
  )

  subscriptions.push(
    commands.registerCommand(
      'translator.exportHistory',
      async () => {
        await historyer.export()
      }
    )
  )

  subscriptions.push(
    listManager.registerList(
      new TranslationList(nvim, db)
    )
  )
}

class Helper {
  constructor(
    private translator: Translator,
    private displayer: Display,
    private historyer: History
  ) { }

  public async keymapCallback(
    keymapMode: KeymapMode,
    displayMode: DisplayMode
  ): Promise<void> {
    const text = await this.getText(keymapMode)
    const trans = await this.translator.translate(text)
    if (!trans) return
    await this.displayer.display(trans, displayMode)
    await this.historyer.save(trans)
  }

  public async commandCallback(
    text: string,
    displayMode: DisplayMode
  ): Promise<void> {
    if (!text || text.trim() === '') {
      text = await this.getText('n')
    }
    const trans = await this.translator.translate(text)
    if (!trans) return
    await this.displayer.display(trans, displayMode)
    await this.historyer.save(trans)
  }

  public async getText(mode: KeymapMode): Promise<string> {
    const doc = await workspace.document
    let range
    if (mode === 'n') {
      const pos = await workspace.getCursorPosition()
      range = doc.getWordRangeAtPosition(pos)
    } else {
      range = await workspace.getSelectedRange('v', doc)
    }
    let text = ''
    if (!range) {
      text = (await workspace.nvim.eval('expand("<cword>")')).toString()
    } else {
      text = doc.textDocument.getText(range)
    }
    logger.log(`current text: ${text}`)
    return text
  }
}
