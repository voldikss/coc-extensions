import fs from 'fs'
import { promisify } from 'util'

export const fsStat = promisify(fs.stat)
export const fsWriteFile = promisify(fs.writeFile)
export const fsReadFile = promisify(fs.readFile)
export const fsMkdir = promisify(fs.mkdir)
