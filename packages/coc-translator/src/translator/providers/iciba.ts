import { TranslateParams, TranslationProvider } from '../defines'

export class ICibaTranslator implements TranslationProvider {
  readonly name = 'iciba'

  async translate(input: TranslateParams) {
    return null
  }
}
