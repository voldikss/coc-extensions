import { window } from 'coc.nvim'
import http from 'http'
import path from 'path'

import { Dispose } from './dispose'
import { fsWriteFile } from './util'

export default class Server extends Dispose {
  private counter = 0
  private server = new http.Server()
  private capacity = 8 // 8 cache files, so 8 webpages at most
  constructor(private port: number, public cacheDir: string) {
    super()
  }

  public async start(): Promise<void> {
    this.server.listen(this.port)
    // if there is already a server running on the port
    // then close this server
    this.server.once('error', () => {
      this.server?.close()
    })
    this.server.once('listening', () => {
      // todo: write to CocLog
    })
    let words = ''
    this.server.on('request', (request, response) => {
      request.on('data', (data: Buffer) => {
        words += data
      })
      request.on('end', async () => {
        await this.saveWords(words)
        words = '' // NOTE: Important! OMG!
      })
      request.on('error', (e: any) => {
        window.showInformationMessage(`request error from browser: ${e.message}`)
      })
      response.writeHead(200, { 'Content-Type': 'text/plain' })
      response.write('response from coc-browser local server\n')
      response.end()
    })
  }

  public dispose(): void {
    this.server.close(() => {
      // nop
    })
  }

  public async saveWords(text: string): Promise<void> {
    const { cacheDir } = this
    const cachePath = path.join(cacheDir, `${this.counter % this.capacity}`)
    await fsWriteFile(cachePath, text)
    this.counter++
  }
}
