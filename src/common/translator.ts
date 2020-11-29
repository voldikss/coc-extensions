import { request, showMessage } from './util'
import { parseStringPromise } from 'xml2js'
import { SingleTranslation, Translation, BaseTranslator } from '../types'
import { workspace } from 'coc.nvim'
import { logger } from '../util/logger'

class SingleResult implements SingleTranslation {
  public engine: string
  public paraphrase = ''
  public phonetic = ''
  public explain = []
  public status = 0
  constructor() { }
}

class BingTranslator implements BaseTranslator {
  private name = 'bing'
  constructor() { }

  public async translate(text: string, _toLang: string): Promise<SingleTranslation> {
    const result = new SingleResult()
    result.engine = this.name

    let url = 'http://cn.bing.com/dict/SerpHoverTrans'
    url += '?q=' + encodeURIComponent(text)

    const headers = {
      Host: 'cn.bing.com',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5'
    }

    const res = await request('GET', url, 'text', null, headers)
    if (!res) {
      logger.log(`${this.name} Translating Error: Bad Response`)
      return result
    }
    result.phonetic = this.getPhonetic(res)
    result.explain = this.getExplain(res)
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

// this api was deprecated
// Is there any other api for ciba?
class ICibaTranslator implements BaseTranslator {
  private name = 'iciba'
  constructor() { }

  public async translate(text: string, _toLang: string): Promise<SingleTranslation> {
    const result = new SingleResult()
    result.engine = this.name

    const url = 'http://www.iciba.com/index.php'
    const data = {}
    data["a"] = "getWordMean"
    data["c"] = "search"
    data["word"] = encodeURIComponent(text)
    const res = await request('GET', url, 'json', data)
    let obj = JSON.parse(res)?.baseInfo?.symbols[0]
    if (!obj) {
      logger.log(`${this.name} Translating Error: Bad Response`)
      return result
    }
    result.phonetic = this.getPhonetic(obj)
    result.paraphrase = this.getParaphrase(obj)
    result.explain = this.getExplain(obj)
    result.status = 1
    return result
  }

  public getPhonetic(obj): string {
    return obj?.ph_en ?? ''
  }

  public getParaphrase(obj): string {
    return obj?.parts?.[0]?.means?.[0] ?? ''
  }

  public getExplain(obj): string[] {
    const parts:string = obj['parts']
    const explain = []
    if (parts?.length > 0) {
      for (const part of parts) {
        explain.push(part['part'] + part['means'].join(', '))
      }
    }
    return explain
  }
}

class GoogleTranslator implements BaseTranslator {
  private name = 'google'
  constructor() { }

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

    if (!toLang) toLang = 'zh'
    let host = 'translate.googleapis.com'
    if (/^zh/.test(toLang)) { host = 'translate.google.cn' }

    const url = `https://${host}/translate_a/single?client=gtx&sl=auto&tl=${toLang}` +
      `&dt=at&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t&q=${encodeURIComponent(text)}`
    const res = await request('GET', url, 'json')
    const obj = JSON.parse(res)
    if (!obj) {
      logger.log(`${this.name} Translating Error: Bad Response`)
      return result
    }
    result.paraphrase = this.getParaphrase(obj)
    result.explain = this.getExplain(obj)
    result.status = 1
    return result
  }
}

class HaiciTranslator {
  private name = 'haici'
  constructor() { }

  public async translate(text: string, _toLang: string): Promise<SingleTranslation> {
    const result = new SingleResult()
    result.engine = this.name

    const url = 'http://dict.cn/mini.php'
    const data = {}
    data['q'] = encodeURIComponent(text)
    const resp = await request('GET', url, 'json', data)
    if (!resp) {
      logger.log(`${this.name} Translating Error: Bad Response`)
      return result
    }

    result.phonetic = this.getPhonetic(resp)
    result.explain = this.getExplain(resp)
    result.status = 1
    return result
  }

  public getPhonetic(html): string {
    const re = /<span class='p'> \[(.*?)\]<\/span>/g
    const match = re.exec(html)
    if (match) {
      return match[1]
    }
    return ''
  }

  public getExplain(html): string[] {
    const re = /<div id=['"]e['"]>(.*?)<\/div>/g
    const explain = []
    const match = re.exec(html)
    if (match) {
      for (const e of match[1].split('<br>')) {
        explain.push(e)
      }
    }
    return explain
  }
}

class YoudaoTranslator implements BaseTranslator {
  private name = 'youdao'
  constructor() { }

  public async translate(text: string, _toLang: string): Promise<SingleTranslation> {
    const result = new SingleResult()
    result.engine = this.name

    const url =
      `http://dict.youdao.com/fsearch?client=deskdict&keyfrom=chrome.extension&q=
      ${encodeURIComponent(text)}
      &pos=-1&doctype=xml&xmlVersion=3.2&dogVersion=1.0&vendor=unknown&appVer=3.1.17.4208`
    const res = await request('GET', url, 'text')
    let obj = (await parseStringPromise(res))?.yodaodict /// fxxkit! Why it's not `youdaodict`???
    if (!obj) {
      logger.log(`${this.name} Translating Error: Bad Response`)
      return result
    }
    result.phonetic = this.getPhonetic(obj)
    result.explain = this.getExplain(obj)
    result.status = 1
    return result
  }

  private getPhonetic(obj): string {
    let phonetic = obj['phonetic-symbol']
    return phonetic ?? ''
  }

  private getExplain(obj): string[] {
    let ct: string = obj['custom-translation']
    if (ct?.length > 0) {
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

export default class Translator {
  constructor(private engines, private toLang) {
  }

  public async translate(text: string): Promise<Translation | void> {
    let statusItem = workspace.createStatusBarItem(0, { progress: true })
    statusItem.text = 'translating'
    statusItem.show()
    if (!(text?.trim().length > 0)) return

    const ENGINES = {
      bing: BingTranslator,
      google: GoogleTranslator,
      haici: HaiciTranslator,
      youdao: YoudaoTranslator
    }

    // make sure every `e` is valid for `translatePromises`
    const engines = []
    for (const e of this.engines) {
      if (e in ENGINES) {
        engines.push(e)
      }
      else {
        showMessage(`Bad engine: ${e}`, 'error')
      }
    }
    const translatePromises = engines.map(e => {
      const cls = ENGINES[e]
      const translator: BaseTranslator = new cls()
      return translator.translate(text, this.toLang)
    })

    return Promise.all(translatePromises)
      .then((results: any) => { // Here any should be SingleTranslation[]
        results = results.filter((result: SingleTranslation) => {
          if (result) {
            return result.status === 1 &&
              !(result.explain.length === 0 && result.paraphrase === '')
          }
        })
        statusItem.hide()
        return {
          text,
          results
        } as Translation
      })
      .catch(e => {
        statusItem.hide()
        showMessage(`Translation failed: ${e}`, 'error')
        return
      })
  }
}
