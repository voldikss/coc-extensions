import chalk from 'chalk'
import { BasicList, ListAction, ListItem, Neovim } from 'coc.nvim'

export default class Floaterm extends BasicList {
  public readonly name = 'floaterm'
  public readonly description = 'CocList for vim-floaterm'
  public readonly defaultAction = 'open'
  public actions: ListAction[] = []

  constructor(nvim: Neovim) {
    super(nvim)

    this.addAction('open', async (item: ListItem) => {
      await this.nvim.call('floaterm#terminal#open_existing', item.data)
    })

    this.addAction('preview', async (item: ListItem, context) => {
      const bufnr = item.data
      const lines: string[] = await this.nvim.call('floaterm#buffer#getlines', [bufnr, 10])
      await this.preview(
        {
          sketch: true,
          filetype: 'floaterm_preview',
          lines,
        },
        context,
      )
    })
  }

  public async loadItems(): Promise<ListItem[]> {
    const list: ListItem[] = []
    const loaded_floaterm = await this.nvim.eval('exists("*floaterm#buflist#gather")')
    if (loaded_floaterm.valueOf() == 0) return []

    const buffers = await this.nvim.call('floaterm#buflist#gather')
    for (const bufnr of buffers) {
      const bufinfo = await this.nvim.call('getbufinfo', bufnr)
      const bufname = bufinfo[0]['name']
      const term_title: string = await this.nvim.call('getbufvar', [bufnr, 'term_title'])
      list.push({
        label: `${chalk.cyan(bufnr.toString())}  ${chalk.yellow(bufname.toString())}  ${chalk.gray(
          term_title,
        )}`,
        data: bufnr,
      })
    }
    return list
  }
}
