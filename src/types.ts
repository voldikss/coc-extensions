
export declare type DisplayMode = 'popup' | 'echo' | 'replace'

export interface TransType {
  engine: string
  query: string
  phonetic: string
  paraphrase: string
  explain: string[]
}

export interface HistoryItem {
  id: string
  content: string[]
  path: string
}
