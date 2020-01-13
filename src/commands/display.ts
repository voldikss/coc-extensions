import { workspace, Neovim } from 'coc.nvim'
import { FloatFactory } from './window'
import { showMessage } from '../util'
import { Translation } from '../types'

export class Display {
  constructor(private nvim: Neovim, private winConfig) { }

  private buildContent(trans: Translation): string[] {
    const content: string[] = []
    content.push(`⟦ ${trans.text} ⟧`)
    for (const t of trans.results) {
      content.push(' ')
      content.push(`─── ${t.engine} ───`)
      if (t.phonetic) content.push(`• [${t.phonetic}]`)
      if (t.paraphrase) content.push(`• ${t.paraphrase}`)
      if (t.explain.length) content.push(...t.explain.map(e => "• " + e))
    }
    return content
  }

  public async winSize(content: string[]): Promise<number[]> {
    let height = 0
    let width = 0
    let maxWidth = this.winConfig.get('maxWidth')
    let maxHeight = this.winConfig.get('maxHeight')
    if (maxWidth === 0) {
      let columns = await this.nvim.eval('&columns')
      maxWidth = Math.round(0.6 * parseInt(columns.toString(), 10))
    }
    if (maxHeight === 0) {
      const lines = await this.nvim.eval('&lines')
      maxHeight = Math.round(0.6 * parseInt(lines.toString(), 10))
    }
    for (const line of content) {
      const line_width = await this.nvim.call('strdisplaywidth', line) + 2
      if (line_width > maxWidth) {
        width = maxWidth
        height += Math.floor(line_width / maxWidth) + 1
      } else {
        width = Math.max(line_width, width)
        height += 1
      }
    }
    if (height > maxHeight) height = maxHeight
    return [height, width]
  }

  public async popup(trans: Translation): Promise<void> {
    this.nvim.command(`autocmd FileType coc-translator |
      syntax match CocTranslatorQuery     /\\v⟦.*⟧/ |
      syntax match CocTranslatorPhonetic  /\\v•\\s\\[.*\\]$/ |
      syntax match CocTranslatorExplain   /\\v•.*/ contains=CocTranslatorPhonetic |
      syntax match CocTranslatorDelimiter /\\v\\─.*\\─/ |
      hi def link CocTranslatorQuery      Keyword |
      hi def link CocTranslatorDelimiter  Constant |
      hi def link CocTranslatorPhonetic   Type |
      hi def link CocTranslatorExplain    Comment`, true)

    const content = this.buildContent(trans)
    if (content.length === 0) return
    const [height, width] = await this.winSize(content)
    for (const i of Object.keys(content)) {
      const line = content[i]
      if (line.startsWith('───') && width > line.length) {
        const padding = Math.floor((width - line.length) / 2)
        content[i] = `${'─'.repeat(padding)}${line}${'─'.repeat(padding)}`
        content[i] += '─'.repeat((width - line.length) % 2)
      } else if (line.startsWith('⟦')) {
        const padding = Math.floor((width - line.length) / 2)
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
        filetype: "coc-translator"
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
}
