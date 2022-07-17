import { Disposable, OutputChannel, window, workspace } from 'coc.nvim'

class Logger implements Disposable {
  private outputChannel: OutputChannel
  private trace: boolean

  constructor() {
    this.outputChannel = window.createOutputChannel('autoxjs')
    this.trace = workspace.getConfiguration('autoxjs').get('trace')
  }

  public log(message: string): void {
    if (this.trace) this.outputChannel.appendLine(message)
  }

  public dispose(): void {
    this.outputChannel.dispose()
  }
}

export const logger = new Logger()
