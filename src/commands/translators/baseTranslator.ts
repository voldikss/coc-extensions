import { window, workspace } from 'coc.nvim'
import { ITranslation } from '../../types'
import { configure, xhr, XHROptions } from 'request-light'

export abstract class BaseTranslator {
  constructor(protected name: string) {}

  public abstract translate(text: string, sl: string, tl: string): Promise<ITranslation>

  protected createTranslation(sl: string, tl: string, text: string): ITranslation {
    return {
      engine: this.name,
      sl: sl,
      tl: tl,
      text: text,
      explains: [],
      paraphrase: '',
      phonetic: '',
    }
  }

  protected async request(
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
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36',
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
      responseType,
    }

    try {
      const response = await xhr(options)
      return response.responseText
    } catch (e) {
      window.showMessage(e['responseText'], 'error')
      return null
    }
  }

  protected decodeHtmlCharCodes(text: string): string {
    return text.replace(/(&#(\d+);)/g, (_match, _capture, charCode) => {
      return String.fromCharCode(charCode)
    })
  }

}

function urlencode(data: Record<string, string>): string {
  return Object.keys(data).map(key =>
    [key, data[key]].map(encodeURIComponent).join("=")
  ).join("&")
}
