import {
  Neovim,
  BasicList,
  ListContext,
  workspace,
  ListItem,
  Position,
  TextEdit,
  Range
} from 'coc.nvim'
import { Record } from '../types'
import { DB } from '../util/db'

export class TranslationList extends BasicList {
  public readonly name = 'translation'
  public readonly description = 'list of translation history'
  public defaultAction = 'open'

  constructor(nvim: Neovim, private db: DB) {
    super(nvim)

    this.addAction('append', async (item: ListItem) => {
      const { document, position } = await workspace.getCurrentState()
      const doc = workspace.getDocument(document.uri)
      const edits: TextEdit[] = []
      const { content } = item.data as Record
      const line = doc.getline(position.line)
      const pos = Position.create(position.line, Math.min(position.character + 1, line.length))
      edits.push({
        range: Range.create(pos, pos),
        newText: content.join('\n')
      })
      await doc.applyEdits(edits)
    })

    this.addAction('prepend', async (item: ListItem) => {
      const { document, position } = await workspace.getCurrentState()
      const doc = workspace.getDocument(document.uri)
      const edits: TextEdit[] = []
      const { content } = item.data as Record
      const pos = Position.create(position.line, position.character)
      edits.push({
        range: Range.create(pos, pos),
        newText: content.join('\n')
      })
      await doc.applyEdits(edits)
    })

    this.addAction('jumpto', async (item: ListItem) => {
      const content = item.data.path as string
      const parts = content.split('\t')
      const position = Position.create(Number(parts[1]) - 1, Number(parts[2]) - 1)
      await workspace.jumpTo(parts[0], position)
    })

    this.addAction('yank', (item: ListItem) => {
      let content = item.data.content as string[]
      content = content.map(s => s.replace(/\\/g, '\\\\').replace(/"/, '\\"'))
      nvim.command(`let @" = "${content.join('\\n')}"`, true)
    })

    this.addAction('delete', async (item: ListItem) => {
      const { id } = item.data
      await this.db.delete(id)
    }, { persist: true, reload: true })
  }

  public async loadItems(_context: ListContext): Promise<ListItem[]> {
    const arr = await this.db.load()
    const columns = await this.nvim.getOption('columns') as number
    const res: ListItem[] = []
    for (const item of arr) {
      const text = item.content[0].padEnd(20) + item.content[1]
      const abbr = text.length > columns - 20 ? text.slice(0, columns - 15) + '...' : text
      res.push({
        label: abbr,
        filterText: abbr,
        data: Object.assign({}, item)
      })
    }
    return res
  }

  public doHighlight(): void {
    const { nvim } = this
    nvim.pauseNotification()
    nvim.command('syntax match CocTranslatorQuery /\\v^.*\\v%20v/', true)
    nvim.command('syntax match CocTranslatorOmit /\\v\\.\\.\\./', true)
    nvim.command('syntax match CocTranslatorResult /\\v%21v.*$/', true)
    nvim.command('highlight default link CocTranslatorQuery Keyword', true)
    nvim.command('highlight default link CocTranslatorResult String', true)
    nvim.resumeNotification().catch(_e => {})
  }
}
