import { request, showMessage } from './util'
import { parseStringPromise } from 'xml2js'
import { SingleTranslation, Translation, BaseTranslator } from '../types'
import { workspace } from 'coc.nvim'

class SingleResult implements SingleTranslation {
  public engine: string
  public paraphrase = ''
  public phonetic = ''
  public explain = []
  public status = 0
  constructor() { }
}

class BingTranslator implements BaseTranslator {
  constructor(private name: string) { }

  public async translate(text: string, toLang: string): Promise<SingleTranslation> {
    const result = new SingleResult()
    result.engine = this.name

    if (toLang === undefined) return result
    let url = 'http://cn.bing.com/dict/SerpHoverTrans'
    url += '?q=' + encodeURI(text)

    const headers = {
      Host: 'cn.bing.com',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5'
    }

    const resp = await request('GET', url, 'text', null, headers)
    if (!resp) return result
    result.phonetic = this.getPhonetic(resp)
    result.explain = this.getExplain(resp)
    result.status = 1
    return result
  }

  private getPhonetic(html: string): string {
    // there is a blank here \] <\/span>
    const re = /<span class="ht_attr" lang=".*?">\[(.*?)\] <\/span>/g
    const match = re.exec(html)
    if (match) {
      return match[1]
    } else {
      return ''
    }
  }

  private getExplain(html: string): string[] {
    const re = /<span class="ht_pos">(.*?)<\/span><span class="ht_trs">(.*?)<\/span>/g
    const explain = []
    let expl = re.exec(html)
    while (expl) {
      explain.push(`${expl[1]} ${expl[2]} `)
      expl = re.exec(html)
    }
    return explain
  }
}

class CibaTranslator implements BaseTranslator {
  constructor(private name: string) { }

  public async translate(text: string, toLang: string): Promise<SingleTranslation> {
    const result = new SingleResult()
    result.engine = this.name

    if (toLang === undefined) return result
    const url = `https://fy.iciba.com/ajax.php`
    const data = {}
    data['a'] = 'fy'
    data['w'] = text
    data['f'] = 'auto'
    data['t'] = toLang
    const res = await request('GET', url, 'json', data)
    let obj = JSON.parse(res)
    if (!(obj && obj['content'])) {
      showMessage("ParseError: Bad response", 'error')
      return result
    }
    obj = obj['content']
    if (obj['ph_en']) result.phonetic = `${obj['ph_en']}`
    if (obj['out']) result.paraphrase = `${obj['out']}`
    if (obj['word_mean']) result.explain = obj['word_mean']
    result.status = 1
    return result
  }
}

class GoogleTranslator implements BaseTranslator {
  constructor(private name: string) { }

  private getParaphrase(obj: object): string {
    let paraphrase = ""
    for (let x of obj[0]) {
      if (x[0]) { paraphrase += x[0] }
    }
    return paraphrase
  }

  private getExplain(obj: object): string[] {
    const explains = []
    if (obj[1]) {
      for (let expl of obj[1]) {
        let str = `[${expl[0][0]}] `
        str += expl[2].map((i: string[]) => i[0]).join(', ')
        explains.push(str)
      }
    }
    return explains
  }

  public async translate(text: string, toLang: string): Promise<SingleTranslation> {
    const result = new SingleResult()
    result.engine = this.name

    if (!toLang) return result
    let host = 'translate.googleapis.com'
    if (/^zh/.test(toLang)) { host = 'translate.google.cn' }

    const url = `https://${host}/translate_a/single?client=gtx&sl=auto&tl=${toLang}` +
      `&dt=at&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t&q=${encodeURI(text)}`
    const res = await request('GET', url, 'json')
    const obj = JSON.parse(res)
    if (!obj) {
      showMessage("ParseError: Bad response", 'error')
      return result
    }
    result.paraphrase = this.getParaphrase(obj)
    result.explain = this.getExplain(obj)
    result.status = 1
    return result
  }
}

class YoudaoTranslator implements BaseTranslator {
  constructor(private name: string) {
  }

  public async translate(text: string, _toLang: string): Promise<SingleTranslation> {
    const result = new SingleResult()
    result.engine = this.name

    const url =
      `http://dict.youdao.com/fsearch?client=deskdict&keyfrom=chrome.extension&q=
      ${encodeURIComponent(text)}
      &pos=-1&doctype=xml&xmlVersion=3.2&dogVersion=1.0&vendor=unknown&appVer=3.1.17.4208`
    const res = await request('GET', url, 'text')
    let obj = await parseStringPromise(res)
    if (!(obj && obj['yodaodict'])) {
      showMessage("ParseError: Bad response", 'error')
      return result
    }
    obj = obj['yodaodict']
    result.phonetic = this.getPhonetic(obj)
    result.explain = this.getExplain(obj)
    result.status = 1
    return result
  }

  private getPhonetic(obj): string {
    let phonetic = obj['phonetic-symbol']
    if (phonetic) return phonetic
    return ''
  }

  private getExplain(obj): string[] {
    let ct = obj['custom-translation']
    if (ct && ct.length > 0) {
      const translation = ct[0]['translation']
      let explain = []
      for (let t of translation) {
        explain = explain.concat(t['content'])
      }
      return explain
    }
    return []
  }
}

export class Translator {
  constructor(private engines, private toLang) {
  }

  public async translate(text: string): Promise<Translation | void> {
    let statusItem = workspace.createStatusBarItem(0, { progress: true })
    statusItem.text = 'translating'
    statusItem.show()
    if (!text || text.trim() === '') return

    const ENGINES = {
      bing: BingTranslator,
      ciba: CibaTranslator,
      google: GoogleTranslator,
      youdao: YoudaoTranslator
    }

    const translatePromises = this.engines.map(e => {
      const cls = ENGINES[e]
      const translator: BaseTranslator = new cls(e)
      return translator.translate(text, this.toLang)
    })

    return Promise.all(translatePromises)
      .then((results: any) => { // Here any should be SingleTranslation[]
        results = results.filter((result: SingleTranslation) => {
          return result.status === 1 &&
            !(result.explain.length === 0 && result.paraphrase === '')
        })
        statusItem.hide()
        return {
          text,
          results
        } as Translation
      })
      .catch(_e => {
        statusItem.hide()
        showMessage('Translation failed', 'error')
        return
      })
  }
}
