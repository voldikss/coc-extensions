import { parseStringPromise } from "xml2js"
import { ITranslation } from "../../types"
import { BaseTranslator } from "./baseTranslator"

export default class YoudaoTranslator extends BaseTranslator {
  constructor() {
    super('youdao')
  }

  public async translate(text: string, sl: string, tl: string): Promise<ITranslation> {
    const url = `http://dict.youdao.com/fsearch?client=deskdict&keyfrom=chrome.extension&q=
      ${encodeURIComponent(text)}
      &pos=-1&doctype=xml&xmlVersion=3.2&dogVersion=1.0&vendor=unknown&appVer=3.1.17.4208`
    const resp = await this.request('GET', url, 'text')
    if (!resp) return null
    const obj = (await parseStringPromise(resp))?.yodaodict /// fxxkit! Why it's not `youdaodict`???
    if (!obj) return null

    const res = this.createTranslation(sl, tl, text)
    res.phonetic = this.getPhonetic(obj)
    res.explains = this.getExplains(obj)
    return res
  }

  private getPhonetic(obj): string {
    const phonetic = obj['phonetic-symbol']
    return phonetic ?? ''
  }

  private getExplains(obj): string[] {
    const ct: string = obj['custom-translation']
    if (ct?.length > 0) {
      const translation = ct[0]['translation']
      let explains = []
      for (const t of translation) {
        explains = explains.concat(t['content'])
      }
      return explains
    }
    return []
  }
}
