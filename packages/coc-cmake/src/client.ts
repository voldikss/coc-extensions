import { LanguageClient, LanguageClientOptions, ServerOptions, window } from 'coc.nvim'

import getConfig from './config'
import { checkCommand } from './util'

const serverPath = getConfig<string>('lsp.serverPath')

const serverOptions: ServerOptions = {
  command: serverPath,
  args: /\bneocmakelsp\b/.test(serverPath) ? ['stdio'] : undefined,
}

const clientOptions: LanguageClientOptions = {
  documentSelector: ['cmake'],
  initializationOptions: {
    buildDirectory: getConfig<string>('lsp.buildDirectory'),
  },
}

export default class CMakeLanguageClient extends LanguageClient {
  constructor() {
    super('cmake', 'cmake language server', serverOptions, clientOptions)
    checkServerBin()
  }
}

async function checkServerBin(): Promise<void> {
  const serverExists = await checkCommand(serverPath)
  if (!serverExists) {
    const install = await window.showPrompt(
      '`cmake.lsp.enable` is set to `true` but ' +
        'cmake-language-server is not installed, install it?',
    )
    if (install) {
      await window.openTerminal('pip install cmake-language-server')
    }
  }
}
