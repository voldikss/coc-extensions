import * as fs from 'fs'
import { promisify } from 'util'

export async function fsStat(filepath: string) {
  try {
    return await fs.promises.stat(filepath)
  } catch (err) {
    if (err.code === 'ENOENT') {
      return
    }
    throw err
  }
}
export const fsWriteFile = promisify(fs.writeFile)
export const fsReadFile = promisify(fs.readFile)
export const fsMkdir = promisify(fs.mkdir)
