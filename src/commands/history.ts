import { workspace } from 'coc.nvim'
import { TransType } from '../types'
import { NeovimClient as Neovim } from '@chemzqm/neovim'
import DB from '../util/db'

export class History {
  constructor(private nvim: Neovim, private db: DB) { }

  public async save(result: TransType[]): Promise<void> {
    const bufnr = workspace.bufnr
    const doc = workspace.getDocument(bufnr)
    const [, lnum, col] = await this.nvim.call('getpos', ".")
    const path = `${doc.uri}\t${lnum}\t${col}`

    for (const i of Object.keys(result)) {
      let t: TransType = result[i]
      let query: string = t['query']
      let paraphrase: string = t['paraphrase']
      let explain: string[] = t['explain']
      let item: string[] = []

      if (explain.length)
        item = [t['query'], explain[0]]
      else if (paraphrase && query.toLowerCase() !== paraphrase.toLowerCase())
        item = [t['query'], paraphrase]

      if (item.length) {
        await this.db.add(item, path)
        return
      }
    }
  }

  public async export(): Promise<void> {
    const arr = await this.db.load()
    const { nvim } = this
    nvim.pauseNotification()
    nvim.command('tabnew', true)
    for (let item of arr) {
      let text = item.content[0].padEnd(20) + item.content[1]
      nvim.call('append', [0, text], true)
    }
    nvim.command('syntax match CocTranslatorQuery /\\v^.*\\v%20v/', true)
    nvim.command('syntax match CocTranslatorOmit /\\v\\.\\.\\./', true)
    nvim.command('syntax match CocTranslatorResult /\\v%21v.*$/', true)
    nvim.command('highlight default link CocTranslatorQuery Keyword', true)
    nvim.command('highlight default link CocTranslatorResult String', true)
    await nvim.resumeNotification()
  }
}
