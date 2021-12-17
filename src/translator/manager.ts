import { TranslationProvider, TranslateParams, Constructor } from './defines'
import { BingTranslator } from './providers/bing'
import { GoogleTranslator } from './providers/google'
import { HaiciTranslator } from './providers/haici'
import { ICibaTranslator } from './providers/iciba'
import { YoudaoTranslator } from './providers/youdao'
import { compact } from 'lodash'
import { preProcess } from './util'

class TranslatorManager {
  private readonly registry = new Map<string, TranslationProvider>()

  constructor() {
    this.forProviders([
      BingTranslator,
      GoogleTranslator,
      HaiciTranslator,
      ICibaTranslator,
      YoudaoTranslator,
    ])
  }

  private register(provider: TranslationProvider) {
    if (this.registry.has(provider.name)) {
      throw new Error(`TranslationProvider ${provider.name} has already been registered`)
    }
    this.registry.set(provider.name, provider)
  }

  private getProvider(name: string) {
    const provider = this.registry.get(name)
    if (!provider) {
      throw new Error(`TranslationProvider ${name} has not been registered yet`)
    }
    return provider
  }

  private get providerNames() {
    return [...this.registry.keys()]
  }

  private forProviders(ProviderConstructors: Constructor<TranslationProvider>[]) {
    for (const ProviderConstructor of ProviderConstructors) {
      this.register(new ProviderConstructor())
    }
  }

  async translate(input: TranslateParams, onError?: (e) => void) {
    const result = await Promise.all(
      (input.engines ?? this.providerNames).map((name) => {
        return this.getProvider(name)
          .translate({
            ...input,
            text: preProcess(input.text),
          })
          .catch((e) => {
            onError(e)
            return null
          })
      }),
    )
    return compact(result)
  }
}

export const translator = new TranslatorManager()
