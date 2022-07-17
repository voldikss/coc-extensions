import { Disposable, OutputChannel, window } from 'coc.nvim'

class Logger implements Disposable {
  private outputChannel: OutputChannel

  constructor() {
    this.outputChannel = window.createOutputChannel('gist')
  }

  public log(message: string): void {
    this.outputChannel.appendLine(message)
  }

  public dispose(): void {
    this.outputChannel.dispose()
  }
}

export const logger = new Logger()
