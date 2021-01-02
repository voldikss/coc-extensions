import { window } from 'coc.nvim'
import { RecordBody, ITranslation } from '../types'
import { BaseTranslator } from './translators/baseTranslator'
import BingDict from './translators/bing'
import HaiciDict from './translators/haici'
import GoogleTranslator from './translators/google'
import YoudaoTranslator from './translators/youdao'

export class Translator {
  constructor(
    private engines: string[],
    private sl: string,
    private tl: string
  ) {}

  private preTreat(text: string): string {
    const camelReg = /([a-z])([A-Z])(?=[a-z])/g
    const underlineReg = /([a-zA-Z])_([a-zA-Z])/g
    return text.trim()
      .replace(camelReg, '$1 $2')
      .replace(underlineReg, '$1 $2')
      .toLowerCase()
  }

  public async translate(text: string): Promise<Translation | null> {
    if (!(text?.trim().length > 0)) return null
    text = this.preTreat(text)

    const statusItem = window.createStatusBarItem(0, { progress: true })
    statusItem.text = 'translating'
    statusItem.show()

    const ENGINES = {
      bing: BingDict,
      google: GoogleTranslator,
      haici: HaiciDict,
      youdao: YoudaoTranslator,
    }

    const engines = []
    for (const e of this.engines) {
      if (e in ENGINES) {
        engines.push(e)
      } else {
        window.showMessage(`Bad engine: ${e}`, 'error')
      }
    }
    const promises = engines.map((e) => {
      const cls = ENGINES[e]
      const translator: BaseTranslator = new cls()
      return translator.translate(text, this.sl, this.tl)
    })

    return new Promise((resolve, reject) => {
      Promise.all(promises)
        .then((results: ITranslation[]) => {
          results = results.filter(result => result != null)
          statusItem.hide()
          resolve(Translation.create(text, results))
        })
        .catch(e => {
          statusItem.hide()
          window.showMessage(`Translation failed: ${e}`, 'error')
          reject(e)
        })
    })
  }
}

export class Translation {
  constructor(private text: string, private results: ITranslation[]) {}

  static create(text: string, results: ITranslation[]): Translation {
    return new Translation(text, results)
  }

  // for window show
  public markdown(): string[] {
    const content: string[] = []
    content.push(`__{ ${this.text} }__`)
    for (const translation of this.results) {
      if (translation.paraphrase.length == 0 &&
        translation.explains.length == 0) {
        continue
      }
      content.push('')
      content.push(`_${translation.engine}_`)
      if (translation.phonetic.length > 0) {
        content.push(`* /${translation.phonetic}/`)
      }
      if (translation.paraphrase.length > 0) {
        content.push(`* ${translation.paraphrase}`)
      }
      if (translation.explains.length > 0) {
        content.push(...translation.explains.map(explain => `* ${explain}`))
      }
    }
    return content
  }

  // for echo
  public line(): string {
    let phonetic = ''
    let paraphrase = ''
    let explains = ''

    for (const t of this.results) {
      if (t.phonetic && !phonetic) {
        phonetic = `[ ${t.phonetic} ]`
      }
      if (t.paraphrase && !paraphrase) {
        paraphrase = t.paraphrase
      }
      if (t.explains && !explains) {
        explains = t.explains.join(' ')
      }
    }
    return `${this.text} ==> ${phonetic} ${paraphrase} ${explains}`
  }

  // for replacement
  public replacement(): string {
    for (const t of this.results) {
      if (t.paraphrase) {
        return t.paraphrase
      }
    }
    return ''
  }

  // for history saving
  public entry(): RecordBody {
    for (const t of this.results) {
      const paraphrase = t.paraphrase
      const explains = t.explains
      let content = []

      if (explains.length !== 0) {
        content = [this.text, explains[0]]
      } else if (paraphrase && this.text.toLowerCase() !== paraphrase.toLowerCase()) {
        content = [this.text, paraphrase]
      }
      return content as RecordBody
    }
  }
}
