import {workspace, FloatFactory, Neovim} from 'coc.nvim'
import {showMessage} from './util'
import {TransType, DisplayMode} from './types'

class Display {

  constructor(private nvim: Neovim) {
    this.nvim = nvim
  }

  private buildContent(trans: TransType): string[] {
    const content: string[] = []
    content.push(`From ${trans['engine']}:`)
    content.push("🔍 " + trans['query'])
    if (trans['phonetic']) content.push("🔉 " + trans['phonetic'])
    if (trans['paraphrase']) content.push("🌀 " + trans['paraphrase'])
    if (trans['explain']) content.push(...trans['explain'].map((i: string) => "📝 " + i))
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

  public async echo(trans: TransType): Promise<void> {
    let message = `${trans['query']} ==> ${trans['paraphrase']} ${trans['explain'].join(' ')}`
    showMessage(message)
  }

  public async popup(trans: TransType[]): Promise<void> {
    const content: string[] = []
    for (const t of Object.keys(trans))
      content.push(...this.buildContent(trans[t]))
    let [height, width] = await this.winSize(content)

    // todo: syntax highlight

    if (workspace.env.floating) {
      const floatFactory = new FloatFactory(this.nvim, workspace.env, false, height, width)
      const docs = [{content: content.join('\n'), filetype: "translator"}]
      await floatFactory.create(docs, false)
    } else {
      this.nvim.pauseNotification()
      this.nvim.command('autocmd FileType ct | ' +
        'syn match CTQuery #🔍.*# | hi def link CTQuery Keyword | ' +
        'syn match CTParaphrase #🌀.*# | hi def link CTParaphrase Define | ' +
        'syn match CTPhonetic #🔉.*# | hi def link Special | ' +
        'syn match CTExplain #📝.*# | hi def link CTExplain String', true)

      this.nvim.call('coc#util#preview_info', [content, 'ct'], true)
      // preview window won't open without redraw...
      this.nvim.command('redraw', true)
      // disposable autocmd is nice
      this.nvim.command('augroup TT | autocmd CursorMoved * pclose | autocmd! TT | augroup END', true)
      await this.nvim.resumeNotification()
    }
  }

  public async replace(trans: TransType): Promise<void> {
    this.nvim.pauseNotification()
    this.nvim.command('let reg_tmp=@a', true)
    this.nvim.command(`let @a='${trans["paraphrase"]}'`, true)
    this.nvim.command('normal! viw"ap', true)
    this.nvim.command('let @a=reg_tmp', true)
    await this.nvim.resumeNotification()
  }
}

export default async function display(nvim: Neovim, trans: TransType[], mode: DisplayMode): Promise<void> {
  const displayer = new Display(nvim)

  switch (mode) {
    case 'popup':
      await displayer.popup(trans)
      break
    case 'echo':
      await displayer.echo(trans[0])
      break
    case 'replace':
      await displayer.replace(trans[0])
      break
  }
}
