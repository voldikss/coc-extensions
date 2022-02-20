import { TranslateParams, TranslationProvider } from '../defines'
import { decodeHtmlCharCodes } from '../util'
import { HttpClient } from '../http'
import { Translator } from '../manager'

@Translator()
export class BingTranslator implements TranslationProvider {
  readonly name = 'bing'

  async translate(input: TranslateParams) {
    const { data } = await HttpClient.get(
      `http://cn.bing.com/dict/SerpHoverTrans?q=${encodeURIComponent(input.text)}`,
    )
    return {
      engine: this.name,
      phonetic: this.getPhonetic(data.data),
      explains: this.getExplains(data.data),
    }
  }

  private getPhonetic(html: string) {
    const re = /<span class="ht_attr" lang=".*?">\[(.*?)\] <\/span>/g
    const match = re.exec(html)
    if (match) {
      return decodeHtmlCharCodes(match[1])
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
