export declare type MsgType = 'info' | 'warning' | 'error'
export declare type HistoryContent = [string, string]
export declare type DisplayMode = 'popup' | 'echo' | 'replace'
export declare type KeymapMode = 'v' | 'n'

/**
 * Single translation from one engine
 *
 * @param engine Translation engine name
 * @param phonetic
 * @param paraphrase Used for `replaceWord` function
 * @param explain More detailes
 * @param href A link use which to get translation
 * @param status 1 if translation succeeds
 */
export interface SingleTranslation {
  engine: string
  phonetic: string
  paraphrase: string
  explain: string[]
  status: number
}

/**
 * Translation results
 */
export interface Translation {
  text: string
  results: SingleTranslation[]
}

export interface BaseTranslator {
  translate(text: string, toLang: string): Promise<SingleTranslation>
}

export interface HistoryItem {
  id: string
  content: HistoryContent
  path: string
}
