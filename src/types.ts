
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

