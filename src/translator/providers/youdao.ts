import { ITranslation, TranslateParams, TranslationProvider } from '../defines'
import { get } from 'lodash'
import { parseStringPromise } from 'xml2js'
import { HttpClient } from '../http'
import { Translator } from '../manager'

@Translator()
export class YoudaoTranslator implements TranslationProvider {
  readonly name = 'youdao'

  async translate(input: TranslateParams) {
    const dictResult = await this.dict(input)
    if (dictResult && dictResult.explains && dictResult.explains.length) return dictResult
    return await this.fanyi(input)
  }

  private getPhonetic(obj: any): string {
    return get(obj, 'phonetic-symbol.0', undefined)
  }

  private getExplains(obj: any): string[] {
    const ct: string = get(obj, 'custom-translation', [])
    const translation = get(ct, '0.translation', [])
    let explains: string[] = []
    for (const x of translation) {
      explains = explains.concat(x['content'])
    }
    return explains
  }

  private async dict(input: TranslateParams): Promise<ITranslation> {
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

  private async fanyi(input: TranslateParams): Promise<ITranslation> {
    // https://github.com/afc163/fanyi
    const { data } = await HttpClient.get(
      `http://fanyi.youdao.com/openapi.do?keyfrom=node-fanyi&key=110811608&type=data&doctype=json&version=1.2&q=${encodeURIComponent(
        input.text,
      )}`,
    )
    if (data.errorCode == 0) return { engine: this.name, explains: data.translation }
  }
}
