import { workspace, Neovim } from 'coc.nvim'
import { FloatFactory } from './window'
import { showMessage } from '../util'
import { TransType, DisplayMode } from '../types'

class Display {

  constructor(private nvim: Neovim) { }

  private buildContent(trans: TransType[]): string[] {
    const content: string[] = []
    content.push(`@ ${trans[0]['query']} @`)
    for (const i of Object.keys(trans)) {
      const t = trans[i]
      if (!t['phonetic'] && !t['paraphrase'] && !t['explain'].length) continue
      content.push(' ')
      content.push(`------ ${t['engine']} ------`)
      if (t['phonetic']) content.push(`🔉 [${t['phonetic']}]`)
      if (t['paraphrase']) content.push(`🌀 ${t['paraphrase']}`)
      if (t['explain'].length) content.push(...t['explain'].map((i: string) => "📝 " + i))
    }

    return content
  }

  public async winSize(content: string[]): Promise<number[]> {
    const height = content.length
    let width = 0
    for (let i of Object.keys(content)) {
      let line_width = await this.nvim.call('strdisplaywidth', content[i]) + 2
      if (line_width > width) width = line_width
    }
    return [height, width]
  }

  public async popup(trans: TransType[]): Promise<void> {
    const content = this.buildContent(trans)
    let [height, width] = await this.winSize(content)
    for (let i of Object.keys(content)) {
      let line = content[i]
      if (line.startsWith('---') && width > line.length) {
        let padding = Math.floor((width - line.length) / 2) - 1 // foldcolumn
        if (padding < 0) padding = 0
        content[i] = `${'-'.repeat(padding)}${line}${'-'.repeat(padding)}`
      } else if (line.startsWith('@')) {
        let padding = Math.floor((width - line.length) / 2)
        content[i] = `${' '.repeat(padding)}${line}`
      }
    }

    if (workspace.env.floating || workspace.env.textprop) {
      const floatFactory = new FloatFactory(
        this.nvim,
        workspace.env,
        false,
        height,
        width
      )
      const docs = [{
        content: content.join('\n'),
        filetype: "translation"
      }]
      await floatFactory.create(docs)
    } else {
      this.nvim.pauseNotification()
      this.nvim.call('coc#util#preview_info', [content, 'translation'], true)
      // preview window won't open without redraw...
      this.nvim.command('redraw', true)
      // NOTE: this will make preview window crash immediately
      // this.nvim.command('augroup TT | autocmd CursorMoved * pclose | autocmd! TT | augroup END', true)
      await this.nvim.resumeNotification()
    }
  }

  public async echo(trans: TransType[]): Promise<void> {
    let t = trans[0]
    let message = `${t['query']} ==> ${t['paraphrase']} ${t['explain'].join(' ')}`
    showMessage(message)
  }

  public async replace(trans: TransType[]): Promise<void> {
    for (let i of Object.keys(trans)) {
      let t = trans[i]
      if (t['paraphrase']) {
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
}

export async function display(
  nvim: Neovim,
  trans: TransType[],
  mode: DisplayMode
): Promise<void> {
  const displayer = new Display(nvim)

  switch (mode) {
    case 'popup':
      await displayer.popup(trans)
      break
    case 'echo':
      await displayer.echo(trans)
      break
    case 'replace':
      await displayer.replace(trans)
      break
  }
}
