import { ITranslation } from "../../types"
import { BaseTranslator } from "./baseTranslator"

export default class BingDict extends BaseTranslator {
  constructor() {
    super("bing")
  }

  public async translate(text: string, sl: string, tl: string): Promise<ITranslation> {
    const url = `http://cn.bing.com/dict/SerpHoverTrans?q=${encodeURIComponent(text)}`
    const headers = {
      Host: 'cn.bing.com',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    }
    const resp = await this.request('GET', url, 'text', null, headers)
    if (!resp) return null

    const res = this.createTranslation(sl, tl, text)
    res.phonetic = this.getPhonetic(resp)
    res.explains = this.getExplains(resp)
    return res
  }

  private getPhonetic(html: string): string {
    const re = /<span class="ht_attr" lang=".*?">\[(.*?)\] <\/span>/g
    const match = re.exec(html)
    if (match) {
      return this.decodeHtmlCharCodes(match[1])
    } else {
      return ''
    }
  }

  private getExplains(html: string): string[] {
    const re = /<span class="ht_pos">(.*?)<\/span><span class="ht_trs">(.*?)<\/span>/g
    const explains = []
    let expl = re.exec(html)
    while (expl) {
      explains.push(`${expl[1]} ${expl[2]} `)
      expl = re.exec(html)
    }
    return explains
  }
}
