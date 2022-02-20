import { TranslateParams, TranslationProvider } from '../defines'
import { get } from 'lodash'
import { parseStringPromise } from 'xml2js'
import { HttpClient } from '../http'
import { Translator } from '../manager'

@Translator()
export class YoudaoTranslator implements TranslationProvider {
  readonly name = 'youdao'

  async translate(input: TranslateParams) {
    const url = `http://dict.youdao.com/fsearch?client=deskdict&keyfrom=chrome.extension&q=
      ${encodeURIComponent(input.text)}
      &pos=-1&doctype=xml&xmlVersion=3.2&dogVersion=1.0&vendor=unknown&appVer=3.1.17.4208`
    const { data } = await HttpClient.get(url)
    if (!data) return null
    const obj = (await parseStringPromise(data))?.yodaodict /// fxxkit! Why it's not `youdaodict`???
    if (!obj) return null

    return {
      engine: this.name,
      phonetic: this.getPhonetic(obj),
      explains: this.getExplains(obj),
    }
  }

  private getPhonetic(obj): string {
    return get(obj, 'phonetic-symbol.0', undefined)
  }

  private getExplains(obj): string[] {
    const ct: string = get(obj, 'custom-translation', [])
    const translation = get(ct, '0.translation', [])
    let explains: string[] = []
    for (const x of translation) {
      explains = explains.concat(x['content'])
    }
    return explains
  }
}
