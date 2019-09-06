import { Neovim, BasicList, ListContext, workspace, ListItem } from 'coc.nvim'
import { Position, Range, TextEdit } from 'vscode-languageserver-protocol'
import { HistoryItem } from '../types'
import { DB } from '../util/db'

export default class TranslationList extends BasicList {
  public readonly name = 'translation'
  public readonly description = 'list of translation history'
  public defaultAction = 'open'

  constructor(nvim: Neovim, private db: DB) {
    super(nvim)

    this.addAction('append', async (item: ListItem) => {
      let { document, position } = await workspace.getCurrentState()
      let doc = workspace.getDocument(document.uri)
      let edits: TextEdit[] = []
      let { content } = item.data as HistoryItem
      let line = doc.getline(position.line)
      let pos = Position.create(position.line, Math.min(position.character + 1, line.length))
      edits.push({
        range: Range.create(pos, pos),
        newText: content.join('\n')
      })
      await doc.applyEdits(nvim, edits)
    })

    this.addAction('prepend', async (item: ListItem) => {
      let { document, position } = await workspace.getCurrentState()
      let doc = workspace.getDocument(document.uri)
      let edits: TextEdit[] = []
      let { content } = item.data as HistoryItem
      let pos = Position.create(position.line, position.character)
      edits.push({
        range: Range.create(pos, pos),
        newText: content.join('\n')
      })
      await doc.applyEdits(nvim, edits)
    })

    this.addAction('open', async (item: ListItem) => {
      let content = item.data.path as string
      let parts = content.split('\t')
      let position = Position.create(Number(parts[1]) - 1, Number(parts[2]) - 1)
      await workspace.jumpTo(parts[0], position)
    })

    this.addAction('yank', (item: ListItem) => {
      let content = item.data.content as string[]
      content = content.map(s => s.replace(/\\/g, '\\\\').replace(/"/, '\\"'))
      nvim.command(`let @" = "${content.join('\\n')}"`, true)
    })

    this.addAction('delete', async (item: ListItem) => {
      let { id } = item.data
      await this.db.delete(id)
    }, { persist: true, reload: true })

    this.addAction('preview', async (item: ListItem, context) => {
      let { content } = item.data as HistoryItem
      let mod = context.options.position == 'top' ? 'below' : ''
      let height = content.length
      let winid = context.listWindow.id
      nvim.pauseNotification()
      nvim.command('pclose', true)
      nvim.command(`${mod} ${height}new +setl\\ previewwindow`, true)
      nvim.command('setl buftype=nofile', true)
      nvim.command('setl bufhidden=wipe', true)
      nvim.call('setline', [1, content[0]], true)
      nvim.call('append', [1, content.slice(1)], true)
      nvim.command('normal! ggzt', true)
      nvim.call('win_gotoid', [winid], true)
      nvim.command('redraw', true)
      await nvim.resumeNotification()
    })
  }

  public async loadItems(_context: ListContext): Promise<ListItem[]> {
    let arr = await this.db.load()
    let columns = await this.nvim.getOption('columns') as number
    let res: ListItem[] = []
    for (let item of arr) {
      let text = item.content[0].padEnd(20) + item.content[1]
      let abbr = text.length > columns - 20 ? text.slice(0, columns - 15) + '...' : text
      res.push({
        label: abbr,
        filterText: abbr,
        data: Object.assign({}, item)
      })
    }
    return res
  }

  public doHighlight(): void {
    let { nvim } = this
    nvim.pauseNotification()
    nvim.command('syntax match CocTranslatorQuery /\\v^.*\\v%20v/', true)
    nvim.command('syntax match CocTranslatorOmit /\\v\\.\\.\\./', true)
    nvim.command('syntax match CocTranslatorResult /\\v%21v.*$/', true)
    nvim.command('highlight default link CocTranslatorQuery Keyword', true)
    nvim.command('highlight default link CocTranslatorResult String', true)
    nvim.resumeNotification().catch(_e => {
      // noop
    })
  }
}
