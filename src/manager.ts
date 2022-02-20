import {
  workspace,
  Neovim,
  FloatFactory,
  FloatWinConfig,
  window,
  MapMode,
  StatusBarItem,
} from 'coc.nvim'
import { config } from './config'
import Storage from './storage'
import { Translation } from './translation'
import { getTextUnderCursor } from './helper'
import { translator } from './translator/manager'
import { DB } from './util/db'

export default class Manager {
  private floatwin: FloatFactory
  private storage: Storage
  private statusBar: StatusBarItem

  constructor(private nvim: Neovim, private db: DB) {
    this.floatwin = new FloatFactory(this.nvim)
    this.storage = new Storage(nvim, this.db)
    this.statusBar = window.createStatusBarItem(0, { progress: true })
    this.statusBar.text = 'translating'
  }

  private async popup(translation: Translation): Promise<void> {
    const content = translation.toMarkdown()
    if (content.length == 0) return
    const docs = [
      {
        content: content.join('\n'),
        filetype: 'markdown',
      },
    ]
    await this.floatwin.show(docs, this.floatWinConfig)
  }

  private get floatWinConfig(): FloatWinConfig {
    return {
      autoHide: true,
      border: config.get('window.enableBorder') ? [1, 1, 1, 1] : [0, 0, 0, 0],
      close: false,
      maxHeight: config.get('window.maxHeight'),
      maxWidth: config.get('window.maxWidth'),
    }
  }

  private async echo(translation: Translation): Promise<void> {
    const message = translation.toLine()
    // To prevent from being blocked by user settings
    workspace.nvim.call('coc#util#echo_messages', ['MoreMsg', message.split('\n')], true)
  }

  private async replace(translation: Translation): Promise<void> {
    const repl = translation.toReplacement()
    if (repl.length == 0) {
      window.showMessage('No paraphrase for replacement', 'error')
    }
    this.nvim.pauseNotification()
    this.nvim.command('let reg_tmp=@a', true)
    this.nvim.command(`let @a='${repl}'`, true)
    this.nvim.command('normal! viw"ap', true)
    this.nvim.command('let @a=reg_tmp', true)
    await this.nvim.resumeNotification(false)
  }

  async getTranslation(text: string) {
    this.statusBar.show()
    try {
      const results = await translator.translate(
        {
          text,
          targetLang: config.get('toLang'),
          engines: config.get('engines'),
        },
        (err) => {
          window.showErrorMessage(`Translating failed: ${err}`)
        },
      )
      return Translation.create(text, results)
    } finally {
      this.statusBar.hide()
    }
  }

  async showTranslation(mode: MapMode, action: 'echo' | 'popup' | 'replace') {
    const text = await getTextUnderCursor(mode)
    const translation = await this.getTranslation(text)
    switch (action) {
      case 'popup':
        await this.popup(translation)
        break
      case 'echo':
        await this.echo(translation)
        break
      case 'replace':
        await this.replace(translation)
        break
      default:
        break
    }
    this.storage.save(translation)
  }
}
