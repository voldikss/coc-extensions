import {
  DocumentFormattingEditProvider,
  DocumentRangeFormattingEditProvider,
  ProviderResult,
  Range,
  TextDocument,
  TextEdit,
  Uri,
  window,
  workspace,
} from 'coc.nvim'

import getConfig from '../config'
import { checkCommand, fsCreateTmpfile, fsWriteFile, runCommand } from '../util'

export default class CMakeFormattingEditProvider
  implements DocumentFormattingEditProvider, DocumentRangeFormattingEditProvider
{
  provideDocumentFormattingEdits(document: TextDocument): ProviderResult<TextEdit[]> {
    return this._providerEdits(document)
  }

  provideDocumentRangeFormattingEdits(
    document: TextDocument,
    range: Range,
  ): ProviderResult<TextEdit[]> {
    return this._providerEdits(document, range)
  }

  async _providerEdits(document: TextDocument, range?: Range): Promise<TextEdit[]> {
    workspace.nvim.command('update')
    const replacementText = await format(document, range)
    if (!replacementText || replacementText?.length == 0) return []

    if (!range) range = wholeRange(document)

    return [TextEdit.replace(range, replacementText)]
  }
}

async function format(document: TextDocument, range?: Range) {
  const formatter = getConfig<string>('formatter')
  const args = Array.from(getConfig<Array<string>>('formatter_args'))
  if (!range) {
    args.push(Uri.parse(document.uri).fsPath)
  } else {
    // write the selected code into a tmp file and invoke formatter
    const tmpfile = await fsCreateTmpfile()
    const text = document.getText(range)
    await fsWriteFile(tmpfile, text)
    args.push(tmpfile)
  }

  try {
    return await runCommand(formatter, args)
  } catch {
    const formatterExists = await checkCommand(formatter)
    if (!formatterExists) {
      const install = await window.showPrompt('cmake-format is not installed, install it?')
      if (install) {
        await window.openTerminal('pip3 install cmake-format')
      }
      return ''
    }
  }
}

function wholeRange(document: TextDocument): Range {
  const doc = workspace.getDocument(document.uri)
  return Range.create(
    {
      line: 0,
      character: 0,
    },
    {
      line: document.lineCount - 1,
      character: doc.getline(doc.lineCount - 1).length,
    },
  )
}
