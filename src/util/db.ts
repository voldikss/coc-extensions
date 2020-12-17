import { fsStat, fsWriteFile, fsReadFile } from './fs'
import { HistoryItem, HistoryContent } from '../types'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export class DB {
  private file: string

  constructor(directory: string, private maxsize: number) {
    this.file = path.join(directory, 'translation.json')
  }

  public async load(): Promise<HistoryItem[]> {
    let stat = await fsStat(this.file)
    if (!(stat?.isFile())) return []
    let content = await fsReadFile(this.file)
    return JSON.parse(content) as HistoryItem[]
  }

  public async add(content: HistoryContent, path: string): Promise<void> {
    let items = await this.load()
    if (items.length == this.maxsize) {
      items.pop()
    }

    // check duplication
    let arr = items.map(item => item['content'][0].toLowerCase())
    if (arr.indexOf(content[0].toLowerCase()) >= 0) return

    items.unshift({ id: uuidv4(), content, path } as HistoryItem)
    await fsWriteFile(this.file, JSON.stringify(items, null, 2))
  }

  public async delete(uid: string): Promise<void> {
    let items = await this.load()
    let idx = items.findIndex(o => o.id == uid)
    if (idx !== -1) {
      items.splice(idx, 1)
      await fsWriteFile(this.file, JSON.stringify(items, null, 2))
    }
  }
}
