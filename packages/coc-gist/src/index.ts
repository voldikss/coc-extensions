import { commands, ExtensionContext, listManager, window, workspace } from 'coc.nvim'

import { Gist } from './gist'
import { GitHubOAuthService } from './github.oauth'
import Gists from './lists/gists'
import DB from './util/db'
import { fsMkdir, fsStat } from './util/fs'

export async function activate(context: ExtensionContext): Promise<void> {
  const { subscriptions, storagePath } = context
  const stat = await fsStat(storagePath)
  if (!stat?.isDirectory()) {
    await fsMkdir(storagePath)
  }

  const db = new DB(storagePath)
  const token = await db.fetch('token')
  if (!token) {
    const oauth = new GitHubOAuthService(db)
    const ifgen = await window.showPrompt(
      'A user token is required for this extension, generate one?',
    )
    if (ifgen) await oauth.start()
    return
  }

  const gist = new Gist(token)
  const { nvim } = workspace

  subscriptions.push(
    commands.registerCommand('gist.create', async () => {
      const filename = await nvim.call('expand', ['%'])
      const content = (await workspace.document).textDocument.getText()
      await gist.create(filename, content)
    }),
  )

  subscriptions.push(
    commands.registerCommand('gist.update', async () => {
      const buf = await nvim.buffer
      const id = (await buf.getVar('coc_gist_id')).toString()
      const filename = (await buf.getVar('coc_gist_filename')).toString()
      if (!id || !filename) {
        window.showMessage('Not a updatable gist file')
        return
      }
      const content = (await workspace.document).textDocument.getText()
      await gist.update(id, filename, content)
    }),
  )

  subscriptions.push(listManager.registerList(new Gists(nvim, gist, token)))
}
