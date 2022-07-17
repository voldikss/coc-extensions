import { compact } from 'lodash-es'

import { TranslateParams, TranslationProvider } from './defines'
import {
  BingTranslator,
  GoogleTranslator,
  HaiciTranslator,
  ICibaTranslator,
  YoudaoTranslator,
} from './providers'
import { preProcess } from './util'

class TranslatorManager {
  static registry = new Map<string, TranslationProvider>()

  static register(provider: TranslationProvider) {
    if (TranslatorManager.registry.has(provider.name)) {
      throw new Error(`TranslationProvider ${provider.name} has already been registered`)
    }
    TranslatorManager.registry.set(provider.name, provider)
  }

  getProvider(name: string) {
    const provider = TranslatorManager.registry.get(name)
    if (!provider) {
      throw new Error(`TranslationProvider ${name} has not been registered yet`)
    }
    return provider
  }

  get providerNames() {
    return [...TranslatorManager.registry.keys()]
  }

  async translate(input: TranslateParams, onError?: (e: Error) => void) {
    const result = await Promise.all(
      (input.engines ?? this.providerNames).map((name) => {
        return this.getProvider(name)
          .translate({
            ...input,
            text: preProcess(input.text),
          })
          .catch((e: Error) => {
            onError?.(e)
            return null
          })
      }),
    )
    return compact(result)
  }
}

TranslatorManager.register(new BingTranslator())
TranslatorManager.register(new GoogleTranslator())
TranslatorManager.register(new HaiciTranslator())
TranslatorManager.register(new ICibaTranslator())
TranslatorManager.register(new YoudaoTranslator())
export const translator = new TranslatorManager()
