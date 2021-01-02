import { ITranslation } from "../../types"
import { BaseTranslator } from "./baseTranslator"

// deprecated
class ICibaTranslator extends BaseTranslator {
  constructor() {
    super('iciba')
  }

  public async translate(text: string, sl: string, tl: string): Promise<ITranslation> {
    const url = 'http://www.iciba.com/index.php'
    const data = {}
    data['a'] = 'getWordMean'
    data['c'] = 'search'
    data['word'] = encodeURIComponent(text)
    const resp = await this.request('GET', url, 'json', data)
    if (!resp) return null
    const obj = JSON.parse(resp)?.baseInfo?.symbols[0]
    if (!obj) return null

    const res = this.createTranslation(sl, tl, text)
    res.phonetic = this.getPhonetic(obj)
    res.paraphrase = this.getParaphrase(obj)
    res.explains = this.getExplains(obj)
    return res
  }

  public getPhonetic(obj): string {
    return obj?.ph_en ?? ''
  }

  public getParaphrase(obj): string {
    return obj?.parts?.[0]?.means?.[0] ?? ''
  }

  public getExplains(obj): string[] {
    const parts: string = obj['parts']
    const explains = []
    if (parts?.length > 0) {
      for (const part of parts) {
        explains.push(part['part'] + part['means'].join(', '))
      }
    }
    return explains
  }
}
