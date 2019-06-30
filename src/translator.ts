import {workspace, WorkspaceConfiguration} from 'coc.nvim'
import {YOUDAO_ERROR_CODE, BAIDU_ERROR_CODE} from './errcode'
import {md5, sha256, request, showMessage} from './util'
import {TransType} from './types';


class Translation implements TransType {
  public query: string
  public paraphrase: string
  public phonetic: string
  public explain: string[]
  constructor() {
    this.query = ''
    this.phonetic = ''
    this.paraphrase = ''
    this.explain = []
  }
}


class Translator {
  public toLang: string
  public appId: string
  public appKey: string
  public query: string
  constructor(query: string, toLang: string, appId: string, appKey: string) {
    this.toLang = toLang
    this.appId = appId
    this.appKey = appKey
    this.query = query
  }
}


class BaiduTranslator extends Translator {
  constructor(
    query: string,
    toLang: string,
    appId: string,
    appKey: string
  ) {
    super(query, toLang, appId, appKey)
  }

  public async translate(): Promise<TransType> {
    const salt = new Date().getTime()
    const str = this.appId + this.query + salt + this.appKey
    const sign = md5(str)

    const url = `http://api.fanyi.baidu.com/api/trans/vip/translate?q=${this.query}` +
      `&appid=${this.appId}&salt=${salt}&from=auto&to=${this.toLang}&sign=${sign}`
    const obj = await request('GET', url)

    if (!obj) {
      showMessage("HTTP request failed", 'error')
      return
    } else if ('error_code' in obj) {
      showMessage(BAIDU_ERROR_CODE[obj['error_code']], 'error')
      return
    }

    const result: TransType = new Translation()
    result['query'] = this.query
    result['paraphrase'] = obj['trans_result'][0]['dst']
    return result
  }
}


class CibaTranslator extends Translator {
  constructor(
    query: string,
    toLang: string,
    appId: string,
    appKey: string
  ) {
    super(query, toLang, appId, appKey)
  }

  public async translate(): Promise<TransType> {
    const url = `https://fy.iciba.com/ajax.php?a=fy&w=${this.query}&f=auto&t=${this.toLang}`

    // XXX: why the following code get {"responseText":"","status":200} result
    // const data = {}
    // data['a'] = 'fy'
    // data['w'] = this.query
    // data['f'] = 'auto'
    // data['t'] = this.toLang
    // const obj = await request('GET', 'https://fy.iciba.com/ajax.php', data)

    const obj = await request('GET', url)

    if (!obj || !('status' in obj) || obj['status'] !== 0) {
      showMessage("HTTP request failed", 'error')
      return
    }

    const result: TransType = new Translation()
    result['query'] = this.query
    if ('ph_en' in obj['content']) result['phonetic'] = `[${obj['content']['ph_en']}]`
    if ('word_mean' in obj['content']) result['explain'] = obj['content']['word_mean']

    return result
  }
}


class GoogleTranslator extends Translator {
  constructor(
    query: string,
    toLang: string,
    appId: string,
    appKey: string
  ) {
    super(query, toLang, appId, appKey)
  }

  private getParaphrase(obj: object): string {
    let paraphrase = ""
    for (let x in obj[0]) {
      let trans = obj[0][x]
      if (trans[0]) paraphrase += trans[0]
    }
    return paraphrase
  }

  private getExplain(obj: object): string[] {
    const explains = []
    if (obj[1]) {
      for (let x in obj[1]) {
        let expl = obj[1][x]
        let str = `[${expl[0][0]}] `
        str += expl[2].map((i: string[]) => i[0]).join(', ')
        explains.push(str)
      }
    }
    return explains
  }

  public async translate(): Promise<TransType> {
    let host = 'translate.googleapis.com'
    if (this.toLang === 'zh') host = 'translate.google.cn'

    const url = `https://${host}/translate_a/single?client=gtx&sl=auto&tl=${this.toLang}` +
      `&dt=at&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t&q=${this.query}`

    const obj = await request('GET', url)

    if (!obj) {
      showMessage("HTTP request failed", 'error')
      return
    }

    const result: TransType = new Translation()
    result['query'] = this.query
    result['paraphrase'] = this.getParaphrase(obj)
    result['explain'] = this.getExplain(obj)

    return result
  }
}


class YoudaoTranslator extends Translator {
  constructor(
    query: string,
    toLang: string,
    appId: string,
    appKey: string
  ) {
    super(query, toLang, appId, appKey)
  }

  public async translate(): Promise<TransType> {
    const salt = new Date().getTime()
    const curtime = Math.round(new Date().getTime() / 1000)
    const str = this.appId + this.query + salt + curtime + this.appKey
    const sign = sha256(str)

    if (this.toLang === 'zh') this.toLang = 'zh-CHS'

    const url = `https://openapi.youdao.com/api?q=${this.query}&appKey=${this.appId}` +
      `&salt=${salt}&from=auto&to=${this.toLang}&curtime=${curtime}&sign=${sign}&signType=v3`

    const obj = await request('GET', url)

    if (!obj) {
      showMessage("HTTP request failed", 'error')
      return
    } else if ('errorCode' in obj && obj['errorCode'] !== "0") {
      showMessage(YOUDAO_ERROR_CODE[obj['errorCode']], 'error')
      return
    }

    const result: TransType = new Translation()
    result['query'] = this.query
    result['paraphrase'] = obj['translation'][0]
    if ('basic' in obj && obj['basic']) {
      if ('phonetic' in obj['basic']) result['phonetic'] = obj['basic']['phonetic']
      if ('explains' in obj['basic']) result['explain'] = obj['basic']['explains']
    }
    return result
  }
}


export default async function translate(query: string): Promise<TransType> {
  const ENGINES = {
    'baidu': BaiduTranslator,
    'ciba': CibaTranslator,
    'google': GoogleTranslator,
    'youdao': YoudaoTranslator
  }

  const config: WorkspaceConfiguration = workspace.getConfiguration('translator')
  const engine = config.get<string>('engine', 'google')
  const toLang = config.get<string>('toLang', 'zh')
  const appId = config.get<string>('appId', '')
  const appKey = config.get<string>('appKey', '')

  let cls = ENGINES[engine]
  let translator = new cls(query, toLang, appId, appKey)

  return translator.translate()
}
