import { ITranslation } from './translator/defines'
import { RecordBody } from './types'

export class Translation {
  constructor(private text: string, private results: ITranslation[]) {}

  static create(text: string, results: ITranslation[]): Translation {
    return new Translation(text, results)
  }

  // for window show
  public toMarkdown() {
    const content: string[] = []
    content.push(`__{ ${this.text} }__`)
    for (const { phonetic, paraphrase, explains, engine } of this.results) {
      if (!paraphrase && (!explains || explains.length === 0)) {
        continue
      }
      content.push('')
      content.push(`_${engine}_`)
      if (phonetic?.length > 0) {
        content.push(`* /${phonetic}/`)
      }
      if (paraphrase?.length > 0) {
        content.push(`* ${paraphrase}`)
      }
      if (explains?.length > 0) {
        content.push(...explains.map((explain) => `* ${explain}`))
      }
    }
    return content
  }

  // for echo
  public toLine() {
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
  public toReplacement() {
    for (const t of this.results) {
      if (t.paraphrase) {
        return t.paraphrase
      }
    }
    return ''
  }

  // for history saving
  public toHistoryItem(): RecordBody {
    for (const t of this.results) {
      const paraphrase = t.paraphrase
      const explains = t.explains

      if (explains.length !== 0) {
        return [this.text, explains[0]] as RecordBody
      } else if (paraphrase && this.text.toLowerCase() !== paraphrase.toLowerCase()) {
        return [this.text, paraphrase] as RecordBody
      }
    }
  }
}
