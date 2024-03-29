import axios from 'axios'
import { window, workspace } from 'coc.nvim'
import express from 'express'
import { Server } from 'http'
import { URLSearchParams } from 'url'

import DB from './util/db'

export class GitHubOAuthService {
  private app: express.Express
  private server?: Server
  private clientId = 'b32302cd17c89e5d8fcd'
  private clientSecret = 'f40b66f0851e9ce94b4ba643b64583fadbc103db'
  constructor(private db: DB) {
    this.app = express()
    this.app.use(express.json(), express.urlencoded({ extended: false }))
  }

  public async start(): Promise<void> {
    this.app.get('/', (_req, res) => {
      res.redirect(`https://github.com/login/oauth/authorize?client_id=${this.clientId}&scope=gist`)
    })

    this.server = this.app.listen(3000)
    this.app.get('/oauth-callback', async (req, res) => {
      const params = new URLSearchParams(await this.getToken(req.query.code as string))
      res.send(`
            <html lang="en">
              <body>
                  <h1>Success! You may now close this tab.</h1>
                  <style>
                    html, body {
                      background-color: #1a1a1a
                      color: #c3c3c3
                      display: flex
                      justify-content: center
                      align-items: center
                      height: 100%
                      width: 100%
                      margin: 0
                    }
                  </style>
              </body>
            </html>
          `)
      this.server?.close()
      const token = params.get('access_token')!
      this.saveToken(token)
    })
    workspace.openResource('http://127.0.0.1:3000/')
  }

  private async getToken(code: string) {
    const params = new URLSearchParams()
    params.append('client_id', this.clientId)
    params.append('client_secret', this.clientSecret)
    params.append('code', code)
    const { data: token } = await axios.post<string>(
      `https://github.com/login/oauth/access_token`,
      params,
    )
    return token
  }

  public async saveToken(token: string): Promise<void> {
    await this.db.push('token', token)
    window.showMessage('new token saved, run `:CocRestart` or restart nvim to use coc-gist')
  }
}
