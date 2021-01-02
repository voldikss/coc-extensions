import { ITranslation } from "../../types"
import { BaseTranslator } from "./baseTranslator"

export default class GoogleTranslator extends BaseTranslator {
  constructor() {
    super("google")
  }

  public async translate(text: string, sl: string, tl: string): Promise<ITranslation> {
    const url = this.getUrl(sl, tl, text)
    const resp = await this.request('GET', url, 'json')
    if (!resp) return null
    const obj = JSON.parse(resp)
    if (!obj) return null

    const res = this.createTranslation(sl, tl, text)
    res.paraphrase = this.getParaphrase(obj)
    res.explains = this.getExplains(obj)
    return res
  }

  private getParaphrase(obj: any): string {
    let paraphrase = ''
    for (const x of obj[0]) {
      if (x[0]) {
        paraphrase += x[0]
      }
    }
    return paraphrase
  }

  private getExplains(obj: any): string[] {
    const explains = []
    if (obj[1]) {
      for (const expl of obj[1]) {
        let str = `[${expl[0][0]}] `
        str += expl[2].map((i: string[]) => i[0]).join(', ')
        explains.push(str)
      }
    }
    return explains
  }

  private getUrl(_sl: string, tl: string, query: string): string {
    let host = 'translate.googleapis.com'
    if (/^zh/.test(tl)) host = 'translate.google.cn'
    const url =
      `https://${host}/translate_a/single?client=gtx&sl=auto&tl=${tl}&dt=at&dt=bd` +
      `&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t&q=${encodeURIComponent(query)}`
    return url
  }
}
