import fs from 'fs'
import util from 'util'
import { promisify } from 'util'

export async function fsStat(filepath: string) {
  let stat = null
  try {
    stat = await util.promisify(fs.stat)(filepath)
  } finally {
    // eslint-disable-next-line no-unsafe-finally
    return stat
  }
}
export const fsWriteFile = promisify(fs.writeFile)
export const fsReadFile = promisify(fs.readFile)
export const fsMkdir = promisify(fs.mkdir)
