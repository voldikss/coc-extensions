
export declare type DisplayMode = 'popup' | 'echo' | 'replace'

export interface Translation {
  query: string
  paraphrase: string
  phonetic?: string
  explain?: string[]
}


export interface HistoryItem {
  id: string
  content: string[]
  path: string
}

