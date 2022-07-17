import chalk from 'chalk'
import {
  BasicList,
  ListAction,
  ListContext,
  ListItem,
  Neovim,
  Position,
  Range,
  TextEdit,
  workspace,
} from 'coc.nvim'

import * as options from '../scripts/ClangFormatStyleOptions.json'

export default class CFSTList extends BasicList {
  public readonly name = 'clang_format_style_options'
  public readonly description = 'CocList for vim-clang-format-style-options'
  public readonly defaultAction = 'append'
  public actions: ListAction[] = []

  constructor(nvim: Neovim) {
    super(nvim)

    this.addAction('append', async (item: ListItem) => {
      const { document, position } = await workspace.getCurrentState()
      const doc = workspace.getDocument(document.uri)
      const edits: TextEdit[] = []
      const line = doc.getline(position.line)
      const pos = Position.create(position.line, Math.min(position.character + 1, line.length))
      edits.push({
        range: Range.create(pos, pos),
        newText: item.data,
      })
      await doc.applyEdits(edits)
    })

    this.addAction('prepend', async (item: ListItem) => {
      const { document, position } = await workspace.getCurrentState()
      const doc = workspace.getDocument(document.uri)
      const edits: TextEdit[] = []
      const pos = Position.create(position.line, position.character)
      edits.push({
        range: Range.create(pos, pos),
        newText: item.data,
      })
      await doc.applyEdits(edits)
    })

    this.addAction(
      'preview',
      async (item: ListItem, context: ListContext) => {
        const name = item.data as string
        // @ts-ignore
        const option = options[name]
        const lines = []
        if ('description' in option) {
          lines.push(...option['description'].split('\n'))
          if ('enum' in option) {
            for (const key of Object.keys(option['enum'])) {
              lines.push(`${key}`)
              lines.push(...option['enum'][key].split('\n'))
            }
          }
        }
        await this.preview(
          {
            filetype: 'markdown',
            lines: lines,
          },
          context,
        )
      },
      { persist: true },
    )

    this.addAction('yank', (item: ListItem) => {
      const content: string = item.data
      nvim.command(`let @" = "${content}"`, true)
    })
  }

  public async loadItems(): Promise<ListItem[]> {
    return Object.keys(options).map<ListItem>((name) => {
      const option = options[name]
      let description = ''
      if ('description' in option) {
        description = option['description'].split('\n', 1)[0]
      }
      return {
        label: chalk.blue(name) + chalk.yellow(description),
        data: name,
        filterText: name + options[name]['description'],
      }
    })
  }
}
