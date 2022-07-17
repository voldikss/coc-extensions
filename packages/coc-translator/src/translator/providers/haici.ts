import { TranslateParams, TranslationProvider } from '../defines'
import { HttpClient } from '../http'
import { Translator } from '../manager'
import { decodeHtmlCharCodes } from '../util'

@Translator()
export class HaiciTranslator implements TranslationProvider {
  readonly name = 'haici'

  async translate(input: TranslateParams) {
    const url = `http://dict.cn/mini.php?q=${encodeURIComponent(input.text)}`
    const { data } = await HttpClient.get(url)
    if (!data) return null

    return {
      engine: this.name,
      phonetic: this.getPhonetic(data),
      explains: this.getExplains(data),
    }
  }

  public getPhonetic(html: string) {
    const re = /<span class='p'> \[(.*?)\]<\/span>/g
    const match = re.exec(html)
    if (match) {
      return decodeHtmlCharCodes(match[1])
    }
  }

  public getExplains(html: string) {
    const re = /<div id=['"]e['"]>(.*?)<\/div>/g
    const explains: string[] = []
    const match = re.exec(html)
    if (match) {
      for (const e of match[1].split('<br>')) {
        explains.push(e)
      }
    }
    return explains
  }
}
