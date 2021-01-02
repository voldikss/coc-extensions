export declare type ActionMode = 'popup' | 'echo' | 'replace'
export declare type KeymapMode = 'v' | 'n'

export interface ITranslation {
  engine: string
  sl: string
  tl: string
  text: string
  phonetic: string
  paraphrase: string
  explains: string[]
}

export declare type RecordBody = [string, string]
export interface Record {
  id: string
  content: RecordBody
  path: string
}
