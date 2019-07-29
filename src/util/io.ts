import { configure, xhr, XHROptions } from 'request-light'
import { workspace, MsgTypes } from 'coc.nvim'
import crypto from 'crypto'
import fs from 'fs'
import util from 'util'

export async function statAsync(filepath: string): Promise<fs.Stats | null> {
  let stat = null
  try {
    stat = await util.promisify(fs.stat)(filepath)
  } catch (e) {
    // noop
  }
  return stat
}

export async function writeFile(fullpath: string, content: string): Promise<void> {
  await util.promisify(fs.writeFile)(fullpath, content, 'utf8')
}

export function readFile(fullpath: string, encoding = 'utf8'): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(fullpath, encoding, (err, content) => {
      if (err) reject(err)
      resolve(content)
    })
  })
}

export function mkdirAsync(filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.mkdir(filepath, err => {
      if (err) return reject(err)
      resolve()
    })
  })
}

export function group<T>(array: T[], size: number): T[][] {
  let len = array.length
  let res: T[][] = []
  for (let i = 0; i < Math.ceil(len / size); i++) {
    res.push(array.slice(i * size, (i + 1) * size))
  }
  return res
}

export function md5(str: string): string {
  return crypto.createHash('md5').update(str).digest('hex')
}

export function showMessage(message: string, type: MsgTypes = 'more'): void {
  workspace.showMessage(`[coc-translator] ${message}`, type)
}