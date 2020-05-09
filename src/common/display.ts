import { workspace, Neovim, FloatFactory } from 'coc.nvim'
import { showMessage } from '../util'
import { Translation, DisplayMode } from '../types'
import { buildLines } from './util'

export class Display {
  constructor(private nvim: Neovim, private maxWidth, private maxHeight) { }

  public async popup(trans: Translation): Promise<void> {
    const content = buildLines(trans)
    if (content.length == 0) return

    if (workspace.env.floating || workspace.env.textprop) {
      const floatFactory = new FloatFactory(
        this.nvim,
        workspace.env,
        false,
        this.maxHeight,
        this.maxWidth,
        true
      )
      const docs = [{
        content: content.join('\n'),
        filetype: "markdown"
      }]
      await floatFactory.create(docs)
    } else {
      this.nvim.pauseNotification()
      this.nvim.call('coc#util#preview_info', [content, 'coc-translator'], true)
      // preview window won't open without redraw
      this.nvim.command('redraw', true)
      // NOTE: this will make preview window crash immediately
      // this.nvim.command('augroup TT | autocmd CursorMoved * pclose | autocmd! TT | augroup END', true)
      await this.nvim.resumeNotification()
    }
  }

  public async echo(trans: Translation): Promise<void> {
    let phonetic = ''
    let paraphrase = ''
    let explain = ''

    for (const t of trans.results) {
      if (t.phonetic && !phonetic) {
        phonetic = `[ ${t.phonetic} ]`
      }
      if (t.paraphrase && !paraphrase) {
        paraphrase = t.paraphrase
      }
      if (t.explain && !explain) {
        explain = t.explain.join(' ')
      }
    }
    const message = `${trans.text} ==> ${phonetic} ${paraphrase} ${explain}`
    showMessage(message)
  }

  public async replace(trans: Translation): Promise<void> {
    for (const t of trans.results) {
      if (t.paraphrase) {
        this.nvim.pauseNotification()
        this.nvim.command('let reg_tmp=@a', true)
        this.nvim.command(`let @a='${t["paraphrase"]}'`, true)
        this.nvim.command('normal! viw"ap', true)
        this.nvim.command('let @a=reg_tmp', true)
        await this.nvim.resumeNotification()
        return
      }
    }
    showMessage('No paraphrase for replacement')
  }

  public async display(trans: Translation, mode: DisplayMode): Promise<void> {
    switch (mode) {
      case 'popup':
        await this.popup(trans)
        break
      case 'echo':
        await this.echo(trans)
        break
      case 'replace':
        await this.replace(trans)
        break
      default:
        break
    }
  }
}
