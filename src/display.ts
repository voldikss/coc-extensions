import {workspace, FloatFactory, Neovim} from 'coc.nvim'
import {showMessage} from './util';
import {Translation} from './types';

export default class Display {
  constructor(private nvim: Neovim, private result: Translation) {}
  private async getPopupSize(): Promise<number[]> {
    let height = 0
    let width = 0

    for (let i in this.result) {
      if (i == 'query' || i == 'paraphrase' || i == 'phonetic') {
        let line_width = await this.nvim.call('strdisplaywidth', this.result[i]) + 6
        if (line_width > width) width = line_width
        height++
      } else {
        let explains = this.result[i]
        for (let j in explains) {
          let line_width = await this.nvim.call('strdisplaywidth', explains[j]) + 6
          if (line_width > width) width = line_width
          height++
        }
      }
    }

    return [height, width]
  }

  public async echo() {
    const message = `${this.result['query']} => ${this.result['paraphrase']}`
    showMessage(message)
  }

  public async popup() {
    // process content
    const content: string[] = []
    if ('query' in this.result) content.push("🔍 " + this.result['query'])
    if ('paraphrase' in this.result) content.push("🌀 " + this.result['paraphrase'])
    if ('phonetic' in this.result) content.push("🔉 " + this.result['phonetic'])
    if ('explain' in this.result) content.push(...this.result['explain'].map((i: string) => "📝 " + i))

    const [height, width] = await this.getPopupSize()

    // todo: syntax highlight

    if (workspace.env.floating) {
      const floatFactory = new FloatFactory(this.nvim, workspace.env, false, height, width)
      const docs = [{content: content.join('\n'), filetype: "translator"}]
      await floatFactory.create(docs, false)
    } else {
      this.nvim.command('autocmd FileType ct | ' +
        'syn match CTQuery #🔍.*# | hi def link CTQuery Keyword | ' +
        'syn match CTParaphrase #🌀.*# | hi def link CTParaphrase Define | ' +
        'syn match CTPhonetic #🔉.*# | hi def link Special | ' +
        'syn match CTExplain #📝.*# | hi def link CTExplain String')

      this.nvim.call('coc#util#preview_info', [content, 'ct'], true)
      // preview window won't open without redraw...
      this.nvim.command('redraw')
      // disposable autocmd is nice
      this.nvim.command('augroup TT | autocmd CursorMoved * pclose | autocmd! TT | augroup END')
    }
  }

  public replace() {
    this.nvim.command('let reg_tmp=@a')
    this.nvim.command('let @a="VOLDIKSS"')
    this.nvim.command(`let @a='${this.result["paraphrase"]}'`)
    this.nvim.command('normal! viw"ap')
    this.nvim.command('let @a=reg_tmp')
  }
}
