import { commands, languages, services, window } from 'coc.nvim'

import CMakeLanguageClient from './client'
import getConfig from './config'
import onLineHelp from './provider/command'
import CMakeCompletionProvider from './provider/completion'
import CMakeFormattingEditProvider from './provider/format'
import CMakeExtraInfoProvider from './provider/hover'
import { checkCommand } from './util'

export async function activate(): Promise<void> {
  if (!(await checkCommand(getConfig<string>('cmakePath')))) {
    window.showInformationMessage(
      'Install cmake or specify its path using `cmake.cmakePath`.',
      'error',
    )
    return
  }

  commands.registerCommand('cmake.onlineHelp', async () => await onLineHelp())

  if (getConfig<boolean>('lsp.enable')) {
    services.registLanguageClient(new CMakeLanguageClient())
    return
  }

  languages.registerHoverProvider(['cmake'], new CMakeExtraInfoProvider())

  languages.registerDocumentFormatProvider(['cmake'], new CMakeFormattingEditProvider())

  languages.registerCompletionItemProvider(
    'coc-cmake',
    'CMAKE',
    ['cmake'],
    new CMakeCompletionProvider(),
  )
}
