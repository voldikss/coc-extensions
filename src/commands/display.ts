import { workspace, Neovim } from 'coc.nvim'
import { FloatFactory } from './window'
import { showMessage } from '../util'
import { DisplayMode, Translation } from '../types'

class Display {

  constructor(private nvim: Neovim) { }

  private buildContent(trans: Translation): string[] {
    const content: string[] = []
    content.push(`@ ${trans.text} @`)
    for (const t of trans.results) {
      if (!t) continue
      content.push(' ')
      content.push(`------ ${t.engine} ------`)
      if (t.phonetic) content.push(`🔉 [${t.phonetic}]`)
      if (t.paraphrase) content.push(`🌀 ${t.paraphrase}`)
      if (t.explain.length) content.push(...t.explain.map((i: string) => "📝 " + i))
    }

    return content
  }

  public async winSize(content: string[]): Promise<number[]> {
    const height = content.length
    let width = 0
    for (let line of content) {
      let line_width = await this.nvim.call('strdisplaywidth', line) + 2
      if (line_width > width) width = line_width
    }
    return [height, width]
  }

  public async popup(trans: Translation): Promise<void> {
    const content = this.buildContent(trans)
    if (content.length === 0) return
    let [height, width] = await this.winSize(content)
    for (let i of Object.keys(content)) {
      let line = content[i]
      if (line.startsWith('---') && width > line.length) {
        let padding = Math.floor((width - line.length) / 2)
        content[i] = `${'-'.repeat(padding)}${line}${'-'.repeat(padding)}`
        content[i] += '-'.repeat((width - line.length) % 2)
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
        width + 2 // for foldcolumn and padding in the line end
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

  public async echo(trans: Translation): Promise<void> {
    let hasPhonetic = false
    let hasParaphrase = false
    let hasExplain = false
    const content = []

    for (const t of trans.results) {
      if (t.phonetic && !hasPhonetic) {
        content.push(`[${t.phonetic}]`)
        hasPhonetic = true
      }

      if (t.paraphrase && !hasParaphrase) {
        content.push(t.paraphrase)
        hasParaphrase = true
      }

      if (t.explain.length !== 0 && !hasExplain) {
        content.push(t.explain.join('; '))
        hasExplain = true
      }
    }
    const message = `${trans.text} ==> ${content.join(' ')}`
    showMessage(message)
  }

  public async replace(trans: Translation): Promise<void> {
    for (let t of trans.results) {
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
}

export async function display(
  nvim: Neovim,
  trans: Translation,
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
