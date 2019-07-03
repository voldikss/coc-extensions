import {workspace, FloatFactory, Neovim} from 'coc.nvim'
import {showMessage} from './util'
import {TransType, DisplayMode} from './types'

class Display {
  private nvim: Neovim
  private result: TransType
  constructor(nvim: Neovim, result: TransType) {
    this.nvim = nvim
    this.result = result
  }

  private async getPopupSize(): Promise<number[]> {
    let height = 0
    let width = 0

    for (let i in this.result) {
      if (i == 'query' || i == 'paraphrase' || i == 'phonetic') {
        if (!this.result[i]) continue
        let line_width = await this.nvim.call('strdisplaywidth', this.result[i]) + 6
        if (line_width > width) width = line_width
        height++
      } else {
        let explains = this.result[i]
        for (let j of Object.keys(explains)) {
          let line_width = await this.nvim.call('strdisplaywidth', explains[j]) + 6
          if (line_width > width) width = line_width
          height++
        }
      }
    }
    return [height, width]
  }

  public async echo(): Promise<void> {
    let message: string
    if (this.result['paraphrase'])
      message = `${this.result['query']} => ${this.result['paraphrase']}`
    else
      message = `${this.result['query']} => ${this.result['explain'].join(' ')}`
    showMessage(message)
  }

  public async popup(): Promise<void> {
    // process content
    const content: string[] = []
    if (this.result['query']) content.push("🔍 " + this.result['query'])
    if (this.result['phonetic']) content.push("🔉 " + this.result['phonetic'])
    if (this.result['paraphrase']) content.push("🌀 " + this.result['paraphrase'])
    if (this.result['explain']) content.push(...this.result['explain'].map((i: string) => "📝 " + i))
    content.push("")

    const [height, width] = await this.getPopupSize()

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

  public async replace(): Promise<void> {
    this.nvim.pauseNotification()
    this.nvim.command('let reg_tmp=@a', true)
    this.nvim.command('let @a="VOLDIKSS"', true)
    this.nvim.command(`let @a='${this.result["paraphrase"]}'`, true)
    this.nvim.command('normal! viw"ap', true)
    this.nvim.command('let @a=reg_tmp', true)
    await this.nvim.resumeNotification()
  }
}

export default async function display(nvim: Neovim, result: TransType, mode: DisplayMode): Promise<void> {
  const displayer = new Display(nvim, result)

  switch (mode) {
    case 'popup':
      await displayer.popup()
      break
    case 'echo':
      await displayer.echo()
      break
    case 'replace':
      await displayer.replace()
      break
  }
}
