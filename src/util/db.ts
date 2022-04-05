import { fsStat, fsWriteFile, fsReadFile } from './fs'
import { Record, RecordBody } from '../types'
import { v4 as uuidv4 } from 'uuid'
import * as path from 'path'

export class DB {
  private file: string
  private maxsize = 5000

  constructor(directory: string) {
    this.file = path.join(directory, 'translation.json')
  }

  public async load(): Promise<Record[]> {
    const stat = await fsStat(this.file)
    if (!stat?.isFile()) return []
    const content = await fsReadFile(this.file, { encoding: 'utf-8' })
    return JSON.parse(content) as Record[]
  }

  public async add(content: RecordBody, path: string): Promise<void> {
    let items = await this.load()
    if (items.length > this.maxsize) {
      items = items.slice(items.length - this.maxsize)
    }

    // check duplication
    const arr = items.map((item) => item['content'][0].toLowerCase())
    if (arr.indexOf(content[0].toLowerCase()) >= 0) return

    items.unshift({ id: uuidv4(), content, path } as Record)
    await fsWriteFile(this.file, JSON.stringify(items, null, 2))
  }

  public async delete(uid: string): Promise<void> {
    const items = await this.load()
    const idx = items.findIndex((o) => o.id == uid)
    if (idx !== -1) {
      items.splice(idx, 1)
      await fsWriteFile(this.file, JSON.stringify(items, null, 2))
    }
  }
}
