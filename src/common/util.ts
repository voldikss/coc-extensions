import { Translation } from "../types"
import { MsgType } from '../types'
import { workspace } from "coc.nvim"
import { configure, xhr, XHROptions } from 'request-light'

export function buildLines(trans: Translation): string[] {
  const content: string[] = []
  content.push(`<<${trans.text}>>`)
  for (const t of trans.results) {
    content.push(' ')
    content.push(`<${t.engine}>`)
    if (t.phonetic) content.push(` * [${t.phonetic}]`)
    if (t.paraphrase) content.push(` * ${t.paraphrase}`)
    if (t.explain.length) content.push(...t.explain.map(e => " * " + e))
  }
  return content
}

export async function request(
  type: string,
  url: string,
  responseType: string,
  data = null,
  headers = null
): Promise<any> {
  const httpConfig = workspace.getConfiguration('http')
  configure(
    httpConfig.get<string>('proxy', undefined),
    httpConfig.get<boolean>('proxyStrictSSL', undefined)
  )

  if (!headers) {
    headers = {
      'Accept-Encoding': 'gzip, deflate',
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36'
    }
  }

  let post_data: string = null
  if (type === 'POST') {
    post_data = JSON.stringify(data)
  } else if (data) {
    url = url + '?' + urlencode(data)
  }

  const options: XHROptions = {
    type,
    url,
    data: post_data || null,
    headers,
    timeout: 5000,
    followRedirects: 5,
    responseType
  }

  try {
    let response = await xhr(options)
    // workspace.showMessage(JSON.stringify(response))
    return response.responseText
  } catch (e) {
    showMessage(e['responseText'], 'error')
    return
  }
}

function urlencode(data: object): string {
  return Object.keys(data).map(key =>
    [key, data[key]].map(encodeURIComponent).join("="))
    .join("&")
}

// To prevent from being blocked by user settings
export function showMessage(message: string, type: MsgType = 'info'): void {
  const prefix = '[coc.nvim] '
  let msgLevel = 'MoreMsg'
  const msg = prefix + message
  switch (type) {
    case 'error':
      msgLevel = 'Error'
      break
    case 'warning':
      msgLevel = 'WarningMsg'
      break
    default:
      break
  }
  workspace.nvim.call('coc#util#echo_messages', [msgLevel, msg.split('\n')], true)
}
