import { TranslateParams, TranslationProvider } from '../defines'
import { get } from 'lodash'
import { HttpClient } from '../http'
import { logger } from '../../util/logger'
import { window } from 'coc.nvim'

interface GoogleTranslationResponse {
  sentences: Array<{
    /**
     * 翻译
     */
    trans: string
    /**
     * 原文本
     */
    orig: string
  }>
  dict: Array<{
    /**
     * 词性
     */
    pos: string
    /**
     * 更多翻译
     */
    terms: string[]
  }>
}

export class GoogleTranslator implements TranslationProvider {
  readonly name = 'google'

  // https://cloud.google.com/translate/docs/languages
  protected readonly langMap = {
    zh_CN: 'zh-CN',
    zh_TW: 'zh-TW',
  }

  async translate(input: TranslateParams) {
    const targetLang = this.langMap[input.targetLang] ?? input.targetLang
    const url = this.getUrl(input.sourceLang, targetLang, input.text)
    const { data } = await HttpClient.get<GoogleTranslationResponse>(url)
    if (!data) return null

    return {
      engine: this.name,
      paraphrase: this.getParaphrase(data),
      explains: this.getExplains(data),
    }
  }

  private getParaphrase(obj: GoogleTranslationResponse) {
    return get(obj, 'sentences.0.trans', undefined)
  }

  private getExplains(obj: GoogleTranslationResponse) {
    return []
    return obj.dict.map((x) => `${x.pos}. ${x.terms.join(', ')}`)
  }

  private getUrl(_sl: string, targetLang: string, query: string): string {
    let host = 'translate.googleapis.com'
    if (/^zh/.test(targetLang)) host = 'translate.google.cn'
    const url =
      `https://${host}/translate_a/single?client=gtx&dj=1&sl=auto&tl=${targetLang}` +
      `&ie=UTF-8&oe=UTF-8&source=icon&dt=t&dt=bd&q=${encodeURIComponent(query)}`
    return url
  }
}
