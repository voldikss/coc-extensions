import { Disposable, OutputChannel, window } from 'coc.nvim'

class Logger implements Disposable {
  private outputChannel: OutputChannel

  constructor() {
    this.outputChannel = window.createOutputChannel('translator')
  }

  public log(message: unknown): void {
    let text: string | undefined
    if (typeof message === 'string') {
      text = message
    } else if (Object.prototype.toString.call(message) === '[object Object]') {
      text = JSON.stringify(message)
    }
    if (text) this.outputChannel.appendLine(text)
  }

  public dispose(): void {
    this.outputChannel.dispose()
  }
}

export const logger = new Logger()
