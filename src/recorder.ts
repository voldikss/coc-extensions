import { Neovim, workspace } from 'coc.nvim'
import { Translation } from './translation'
import { DB } from './util/db'

export default class Recorder {
  constructor(private nvim: Neovim, private db: DB) {}

  public async save(trans: Translation): Promise<void> {
    const bufnr = workspace.bufnr
    const doc = workspace.getDocument(bufnr)
    const [, lnum, col] = await this.nvim.call('getpos', '.')
    const path = `${doc.uri}\t${lnum}\t${col}`
    const content = trans.toHistoryItem()
    if (content && content.length) {
      await this.db.add(content, path)
    }
  }

  public async export(): Promise<void> {
    const arr = await this.db.load()
    const { nvim } = this
    nvim.pauseNotification()
    nvim.command('tabnew', true)
    for (const item of arr) {
      const text = item.content[0].padEnd(20) + item.content[1]
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
