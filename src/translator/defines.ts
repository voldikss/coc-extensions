export interface TranslationProvider {
  readonly name: string

  translate(input: TranslateParams): Promise<ITranslation | null>
}

export interface TranslateParams {
  text: string

  sourceLang?: string

  targetLang?: string

  engines?: string[]
}

export interface ITranslation {
  engine: string

  phonetic?: string
  paraphrase?: string
  explains?: string[]
}

export type Constructor<T> = new (...args: any[]) => T
