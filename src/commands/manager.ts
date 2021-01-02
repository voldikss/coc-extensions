import {
  workspace,
  Neovim,
  FloatFactory,
  FloatWinConfig,
  window,
  Range
} from 'coc.nvim'
import getcfg from '../config'
import { DB } from '../util/db'
import Recorder from './recorder'
import { ActionMode, KeymapMode } from '../types'
import { Translator, Translation } from './translator'

export default class Manager {
  private keymapMode: KeymapMode
  private actionMode: ActionMode
  private floatwin: FloatFactory
  private recorder: Recorder
  public translator: Translator
  constructor(private nvim: Neovim, private db: DB) {
    this.floatwin = new FloatFactory(this.nvim)
    this.recorder = new Recorder(nvim, db)
    this.translator = new Translator(getcfg('engines'), '', getcfg('toLang'))
  }

  public registerKeymapMode(mode: KeymapMode): Manager {
    this.keymapMode = mode
    return this
  }

  public registerActionMode(mode: ActionMode): Manager {
    this.actionMode = mode
    return this
  }

  private async getText(): Promise<string> {
    const doc = await workspace.document
    let range: Range = null
    if (this.keymapMode === 'n') {
      const pos = await window.getCursorPosition()
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
    return text.trim()
  }

  private async popup(translation: Translation): Promise<void> {
    const content = translation.markdown()
    if (content.length == 0) return
    const docs = [{
      content: content.join('\n'),
      filetype: "markdown"
    }]
    await this.floatwin.show(docs, this.floatWinConfig)
  }

  private get floatWinConfig(): FloatWinConfig {
    return {
      autoHide: true,
      border: getcfg('enableBorder') ? [1, 1, 1, 1] : [0, 0, 0, 0],
      close: false,
      maxHeight: getcfg('maxHeight'),
      maxWidth: getcfg('maxWidth')
    }
  }

  private async echo(translation: Translation): Promise<void> {
    const message = translation.line()
    // To prevent from being blocked by user settings
    workspace.nvim.call('coc#util#echo_messages', ['MoreMsg', message.split('\n')], true)
  }

  private async replace(translation: Translation): Promise<void> {
    const repl = translation.replacement()
    if (repl.length == 0) {
      window.showMessage('No paraphrase for replacement', 'error')
    }
    this.nvim.pauseNotification()
    this.nvim.command('let reg_tmp=@a', true)
    this.nvim.command(`let @a='${repl}'`, true)
    this.nvim.command('normal! viw"ap', true)
    this.nvim.command('let @a=reg_tmp', true)
    await this.nvim.resumeNotification()
  }

  public async translate(text?: string): Promise<void> {
    if (!(text?.trim().length > 0)) text = await this.getText()
    const translation = await this.translator.translate(text)
    if (!translation) return
    switch (this.actionMode) {
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
    this.recorder.save(translation)
  }

  public async exportHistory(): Promise<void> {
    await this.recorder.export()
  }
}
