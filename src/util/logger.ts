// from https://github.com/iamcco/coc-zi/blob/master/src/common/logger.ts
import { OutputChannel, workspace } from 'coc.nvim'

import { Dispose } from './dispose'

class Logger extends Dispose {
  private outputChannel: OutputChannel | undefined

  constructor() {
    super()
    this.outputChannel = workspace.createOutputChannel('translator')
  }

  public log(message: string): void {
    this.outputChannel.appendLine(`[INFO] ${message}`)

  }

  public dispose(): void {
    super.dispose()
    if (this.outputChannel) {
      this.outputChannel.dispose()
      this.outputChannel = undefined
    }
  }
}

export const logger = new Logger()
