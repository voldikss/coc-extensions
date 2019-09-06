import { configure, xhr, XHROptions } from 'request-light'
import { workspace } from 'coc.nvim'
import { MsgType } from '../types'
import crypto from 'crypto'

export async function request(
  type: string,
  url: string,
  data: object = null,
  headers: object = null,
  responseType = 'json'
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
    let { responseText } = response
    if (responseType === 'json') {
      return JSON.parse(responseText)
    } else {
      return responseText
    }
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

export function md5(str: string): string {
  return crypto.createHash('md5').update(str).digest('hex')
}

export function showMessage(message: string, type: MsgType = 'info'): void {
  let prefix = '[coc-translator] '
  let msgLevel = 'MoreMsg'
  let msg = prefix + message
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
