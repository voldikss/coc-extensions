import {
  BasicList,
  ListAction,
  ListContext,
  ListItem,
  Location,
  Neovim,
  Position,
  Range,
  window,
  workspace,
} from 'coc.nvim'
import colors from 'colors/safe'

import { Gist } from '../gist'
import { fsCreateTmpfile, fsReadFile, fsStat, fsWriteFile } from '../util/fs'

interface GistsListFile {
  id: string
  url: string // for insert/open
  html_url: string // for browserOpen
  public: boolean
  filename: string
  description: string
}

export default class GistsList extends BasicList {
  public readonly name = 'gist'
  public readonly description = 'gists list'
  public readonly defaultAction = 'browserOpen'
  public actions: ListAction[] = []
  private cache: Record<string, string> = {}

  constructor(protected nvim: Neovim, private gist: Gist, private token: string) {
    super(nvim)

    this.addAction('open', async (item: ListItem) => {
      const { filename, url } = item.data as GistsListFile
      const filepath = await this.checkCache(filename, url)
      if (!filepath) return
      setTimeout(async () => {
        //todo
        await nvim.command(`edit ${filepath}`)
      }, 500)
    })

    this.addAction('preview', async (item: ListItem, context: ListContext) => {
      const { filename, url } = item.data as GistsListFile
      const filepath = await this.checkCache(filename, url)
      if (!filepath) return
      await this.previewLocation(
        Location.create(filepath, Range.create(Position.create(0, 0), Position.create(0, 0))),
        context,
      )
    })

    this.addAction('update', async (item: ListItem) => {
      const { id, url, filename } = item.data as GistsListFile
      const filepath = await this.checkCache(filename, url)
      if (!filepath) return
      setTimeout(async () => {
        //todo
        await nvim.command(`edit ${filepath}`)
        const buf = await nvim.buffer
        await buf.setVar('coc_gist_id', id)
        await buf.setVar('coc_gist_filename', filename)
        window.showMessage('Run `:CocCommand gist.update` after amending')
      }, 500)
    })

    this.addAction('append', async (item: ListItem) => {
      const { filename, url } = item.data as GistsListFile
      const filepath = await this.checkCache(filename, url)
      if (!filepath) return
      const content = await fsReadFile(filepath)
      setTimeout(async () => {
        const pos = await window.getCursorPosition()
        nvim.call('append', [pos.line, content.split('\n')], true)
      }, 500)
    })

    this.addAction(
      'delete',
      async (item: ListItem) => {
        const data = item.data as GistsListFile
        await gist.delete(data.id)
      },
      { persist: true, reload: true },
    )

    this.addAction(
      'browserOpen',
      async (item: ListItem) => {
        const data = item.data as GistsListFile
        await workspace.openResource(data.html_url)
      },
      { persist: true, reload: false },
    )
  }

  public async loadItems(): Promise<ListItem[]> {
    this.cache = {}
    const items: ListItem[] = []
    const result = await this.gist.list()

    for (const item of result) {
      for (const file of Object.values(item['files'])) {
        const gist: GistsListFile = {
          id: item['id'],
          url: file['raw_url'],
          html_url: item['html_url'],
          public: item['public'],
          filename: file['filename'],
          description: item['description'],
        }
        const label = `${gist.public ? '+' : '-'} [${colors.yellow(
          gist.filename,
        )}] ${colors.underline(gist.description)}`
        items.push({
          label,
          filterText: label,
          data: Object.assign({}, gist),
        })
      }
    }
    items.sort((a, b) => a.label.localeCompare(b.label))
    return items
  }

  public async checkCache(filename, url): Promise<string> {
    let filepath = this.cache[url]
    if (!filepath || !(await fsStat(filepath)).isFile()) {
      filepath = await fsCreateTmpfile(filename)
      const content = await this.gist.get(url)
      if (content == '') return null
      await fsWriteFile(filepath, content)
      this.cache[url] = filepath
    }
    return filepath
  }
}
