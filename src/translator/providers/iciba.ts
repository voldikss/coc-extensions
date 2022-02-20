import { TranslateParams, TranslationProvider } from '../defines'
import { Translator } from '../manager'

@Translator()
export class ICibaTranslator implements TranslationProvider {
  readonly name = 'iciba'

  async translate(input: TranslateParams) {
    return null
  }
}
