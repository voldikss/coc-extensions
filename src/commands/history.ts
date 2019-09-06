import { workspace } from 'coc.nvim'
import { Translation, HistoryContent } from '../types'
import { NeovimClient as Neovim } from '@chemzqm/neovim'
import { DB } from '../util'

export class History {
  constructor(private nvim: Neovim, private db: DB) { }

  public async save(trans: Translation): Promise<void> {
    const bufnr = workspace.bufnr
    const doc = workspace.getDocument(bufnr)
    const [, lnum, col] = await this.nvim.call('getpos', ".")
    const path = `${doc.uri}\t${lnum}\t${col}`

    let text: string = trans.text
    for (const t of trans.results) {
      let paraphrase = t.paraphrase
      let explain = t.explain
      let content = []

      if (explain.length !== 0) {
        content = [text, explain[0]]
      } else if (paraphrase && text.toLowerCase() !== paraphrase.toLowerCase()) {
        content = [text, paraphrase]
      }

      if (content.length) {
        await this.db.add(content as HistoryContent, path)
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
