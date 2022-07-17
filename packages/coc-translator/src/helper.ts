import { MapMode, Range, window, workspace } from 'coc.nvim'

export async function getTextUnderCursor(mode: MapMode): Promise<string> {
  const doc = await workspace.document
  let range: Range | null = null
  if (mode === 'n') {
    const pos = await window.getCursorPosition()
    range = doc.getWordRangeAtPosition(pos)
  } else {
    range = await window.getSelectedRange('v')
  }
  let text = ''
  if (!range) {
    text = (await workspace.nvim.eval('expand("<cword>")')).toString()
  } else {
    text = doc.textDocument.getText(range)
  }
  return text.trim()
}
