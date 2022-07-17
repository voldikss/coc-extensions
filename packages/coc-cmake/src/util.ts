import child_process, { spawn } from 'child_process'
import commandExists from 'command-exists'
import fs from 'fs'
import tmp from 'tmp'

export function strContains(word: string, pattern: string): boolean {
  return word.indexOf(pattern) > -1
}

export function strEquals(word: string, pattern: string): boolean {
  return word.toLowerCase() == pattern.toLowerCase()
}

// https://stackoverflow.com/questions/13796594/how-to-split-string-into-arguments-and-options-in-javascript
export function parseCmdArgs(text: string): string[] {
  const re = /^"[^"]*"$/ // Check if argument is surrounded with double-quotes
  const re2 = /^([^"]|[^"].*?[^"])$/ // Check if argument is NOT surrounded with double-quotes

  const arr: string[] = []
  let argPart: string | undefined

  // tslint:disable-next-line: no-unused-expression
  text &&
    text.split(' ').forEach((arg) => {
      if ((re.test(arg) || re2.test(arg)) && !argPart) {
        arr.push(arg)
      } else {
        argPart = argPart ? argPart + ' ' + arg : arg
        // If part is complete (ends with a double quote), we can add it to the array
        if (/"$/.test(argPart)) {
          arr.push(argPart)
        }
      }
    })
  return arr
}

export async function fsCreateTmpfile(): Promise<string> {
  return new Promise((resolve, reject) => {
    tmp.file((err, path) => {
      if (err) reject(new Error('Failed to create a tmp file'))
      resolve(path)
    })
  })
}

export async function fsWriteFile(fullpath: string, content: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.writeFile(fullpath, content, 'utf8', (err) => {
      if (err) reject()
      resolve()
    })
  })
}

export async function runCommand(command: string, args?: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    child_process.execFile(command, args, (error, stdout) => {
      if (error) reject(error)
      resolve(stdout)
    })
  })
}

export async function checkCommand(command: string): Promise<boolean> {
  return new Promise((resolve) => {
    commandExists(command, (_err, exists) => {
      resolve(exists)
    })
  })
}

export async function openBrowser(url: string) {
  const opener = (() => {
    switch (process.platform) {
      case 'win32':
        return 'rundll32 url.dll,FileProtocolHandler'
      case 'darwin':
        return 'open'
      default:
        return 'xdg-open'
    }
  })()
  spawn(opener, [url], { detached: true })
}
