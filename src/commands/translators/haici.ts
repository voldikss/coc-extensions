import { ITranslation } from '../../types'
import { BaseTranslator } from './baseTranslator'

export default class HaiciDict extends BaseTranslator {
  constructor() {
    super('haici')
  }

  public async translate(text: string, sl: string, tl: string): Promise<ITranslation> {
    const url = 'http://dict.cn/mini.php'
    const data = {}
    data['q'] = encodeURIComponent(text)
    const resp = await this.request('GET', url, 'json', data)
    if (!resp) return null

    const res = this.createTranslation(sl, tl, text)
    res.phonetic = this.getPhonetic(resp)
    res.explains = this.getExplains(resp)
    return res
  }

  public getPhonetic(html: string): string {
    const re = /<span class='p'> \[(.*?)\]<\/span>/g
    const match = re.exec(html)
    if (match) {
      return this.decodeHtmlCharCodes(match[1])
    }
    return ''
  }

  public getExplains(html: string): string[] {
    const re = /<div id=['"]e['"]>(.*?)<\/div>/g
    const explains = []
    const match = re.exec(html)
    if (match) {
      for (const e of match[1].split('<br>')) {
        explains.push(e)
      }
    }
    return explains
  }
}
