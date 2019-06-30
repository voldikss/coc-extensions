import {configure, xhr, XHROptions} from 'request-light'
import {workspace, MsgTypes} from 'coc.nvim';
import crypto from 'crypto'
import fs from 'fs'
import util from 'util'


export async function request(type: string, url: string, data: object = null): Promise<object> {
  const httpConfig = workspace.getConfiguration('http')
  configure(httpConfig.get<string>('proxy', undefined), httpConfig.get<boolean>('proxyStrictSSL', undefined))

  const headers = {
    'Accept-Encoding': 'gzip, deflate',
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36'
  }

  const options: XHROptions = {
    type: type,
    url: url,
    data: JSON.stringify(data),
    headers: headers,
    timeout: 5000,
    followRedirects: 5,
    responseType: 'json'
  }

  try {
    let response = await xhr(options)
    let {responseText} = response
    let obj = JSON.parse(responseText)
    return obj
  }
  catch (e) {
    showMessage(e['responseText'], 'error')
    return
  }
}

export async function statAsync(filepath: string): Promise<fs.Stats | null> {
  let stat = null
  try {
    stat = await util.promisify(fs.stat)(filepath)
  } catch (e) {}
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

export function sha256(str: string): string {
  return crypto.createHash('SHA256').update(str).digest('hex')
}

export function md5(str: string): string {
  return crypto.createHash('md5').update(str).digest('hex')
}

export function showMessage(message: string, type: MsgTypes='more') {
  workspace.showMessage(`[coc-translator] ${message}`, type)
}
