// modified from: github.com/neoclide/coc.nvim/blob/master/src/model/floatFactory.ts
import { CancellationTokenSource, Disposable } from 'vscode-languageserver-protocol'
import { FloatBuffer, Env, events, Documentation, workspace } from 'coc.nvim'
import createPopup, { Popup } from 'coc.nvim/lib/model/popup'
import { Buffer, Neovim, Window } from '@chemzqm/neovim'
import { disposeAll } from 'coc.nvim/lib/util'
import { equals } from 'coc.nvim/lib/util/object'
import debounce from 'debounce'
import { showMessage } from '../util'

export interface WindowConfig {
  width: number
  height: number
  col: number
  row: number
  relative: 'cursor' | 'win' | 'editor'
}

// factory class for floating window
export class FloatFactory implements Disposable {
  private targetBufnr: number
  private window: Window
  private disposables: Disposable[] = []
  private floatBuffer: FloatBuffer
  private tokenSource: CancellationTokenSource
  private alignTop = false
  private pumAlignTop = false
  private createTs = 0
  private cursor: [number, number] = [0, 0]
  private popup: Popup
  public shown = false
  constructor(
    private nvim: Neovim,
    private env: Env,
    private preferTop = false,
    private maxHeight = 999,
    private maxWidth?: number,
    private autoHide = true
  ) {
    if (!env.floating && !env.textprop) return
    this.maxWidth = Math.min(maxWidth || 80, this.columns - 10)

    events.on('BufEnter', bufnr => {
      if (this.buffer && bufnr == this.buffer.id) return
      if (bufnr == this.targetBufnr) return
      this.close()
    }, null, this.disposables)

    events.on('CursorMoved', debounce((bufnr, cursor) => {
      if (Date.now() - this.createTs < 100) return
      this.onCursorMoved(false, bufnr, cursor)
    }, 100), null, this.disposables)
    events.on('CursorMovedI', this.onCursorMoved.bind(this, true), null, this.disposables)
  }

  private onCursorMoved(insertMode: boolean, bufnr: number, cursor: [number, number]): void {
    if (!this.window || this.buffer && bufnr == this.buffer.id) return
    if (bufnr == this.targetBufnr && equals(cursor, this.cursor)) return
    if (this.autoHide) {
      this.close()
      return
    }
    if (!insertMode || bufnr != this.targetBufnr || (this.cursor && cursor[0] != this.cursor[0])) {
      this.close()
      return
    }
  }

  private async checkFloatBuffer(): Promise<void> {
    let { floatBuffer, nvim, window } = this
    if (this.env.textprop) {
      let valid = await this.activated()
      if (!valid) window = null
      if (!window) {
        this.popup = await createPopup(nvim, [''], {
          padding: [0, 1, 0, 1],
          tab: -1,
        })
        let win = this.window = nvim.createWindow(this.popup.id)
        nvim.pauseNotification()
        win.setVar('float', 1, true)
        win.setOption('linebreak', true, true)
        win.setOption('showbreak', '', true)
        win.setOption('conceallevel', 2, true)
        await nvim.resumeNotification()
      }
      let buffer = this.nvim.createBuffer(this.popup.bufferId)
      this.floatBuffer = new FloatBuffer(nvim, buffer, nvim.createWindow(this.popup.id))
    } else {
      if (floatBuffer) {
        let valid = await floatBuffer.valid
        if (valid) return
      }
      let buf = await this.nvim.createNewBuffer(false, true)
      await buf.setOption('buftype', 'nofile')
      await buf.setOption('bufhidden', 'hide')
      this.floatBuffer = new FloatBuffer(this.nvim, buf)
    }
  }

  private get columns(): number {
    return this.env.columns
  }

  private get lines(): number {
    return this.env.lines - this.env.cmdheight - 1
  }

  public async getBoundings(docs: Documentation[], offsetX = 0): Promise<WindowConfig> {
    let { nvim, preferTop } = this
    let { columns, lines } = this
    let alignTop = false
    let [row, col] = await nvim.call('coc#util#win_position') as [number, number]
    let maxWidth = this.maxWidth
    let height = this.floatBuffer.getHeight(docs, maxWidth)
    height = Math.min(height, this.maxHeight)
    if (!preferTop) {
      if (lines - row < height && row > height) {
        alignTop = true
      }
    } else {
      if (row >= height || row >= lines - row) {
        alignTop = true
      }
    }
    if (alignTop) docs.reverse()
    await this.floatBuffer.setDocuments(docs, maxWidth)
    let { width } = this.floatBuffer
    if (offsetX) {
      offsetX = Math.min(col - 1, offsetX)
      if (col - offsetX + width > columns) {
        offsetX = col - offsetX + width - columns
      }
    }
    this.alignTop = alignTop
    return {
      height: alignTop ? Math.max(1, Math.min(row, height)) : Math.max(1, Math.min(height, (lines - row))),
      width: Math.min(columns, width),
      row: alignTop ? - height : 1,
      col: offsetX == 0 ? 0 : - offsetX,
      relative: 'cursor'
    }
  }
  public async create(docs: Documentation[], offsetX = 0): Promise<void> {
    let shown = await this.createPopup(docs, offsetX)
    if (!shown) this.close(false)
  }

  public async createPopup(docs: Documentation[], offsetX = 0): Promise<boolean> {
    if (this.tokenSource) {
      this.tokenSource.cancel()
    }
    if (docs.length == 0) return false
    this.createTs = Date.now()
    this.targetBufnr = workspace.bufnr
    let tokenSource = this.tokenSource = new CancellationTokenSource()
    let token = tokenSource.token
    await this.checkFloatBuffer()
    let config = await this.getBoundings(docs, offsetX)
    let [, line, col, visible] = await this.nvim.eval('[mode(),line("."),col("."),pumvisible()]') as [string, number, number, number]
    this.cursor = [line, col]
    if (visible && this.alignTop == this.pumAlignTop) return false
    if (!config || token.isCancellationRequested) return false
    let { nvim, alignTop } = this
    let reuse = false
    if (workspace.isNvim) {
      reuse = this.window && await this.window.valid
      if (!reuse) this.window = await nvim.openFloatWindow(this.buffer, false, config)
    }
    if (token.isCancellationRequested) return false
    nvim.pauseNotification()
    if (workspace.isNvim) {
      if (!reuse) {
        nvim.command(`noa call win_gotoid(${this.window.id})`, true)
        this.window.setVar('float', 1, true)
        nvim.command(`setl nospell nolist nowrap linebreak foldcolumn=1`, true)
        nvim.command(`setl nonumber norelativenumber nocursorline nocursorcolumn`, true)
        nvim.command(`setl signcolumn=no conceallevel=2 concealcursor=n`, true)
        nvim.call('coc#util#do_autocmd', ['CocOpenFloat'], true)
      } else {
        this.window.setConfig(config, true)
        nvim.command(`noa call win_gotoid(${this.window.id})`, true)
      }
      this.floatBuffer.setLines()
      nvim.command('silent! setl filetype=translation', true)
      nvim.command(`normal! ${alignTop ? 'G' : 'gg'}0`, true)
      nvim.command('noa wincmd p', true)
    } else {
      this.popup.setFiletype('translation')
      this.popup.move({
        line: cursorPostion(config.row),
        col: cursorPostion(config.col),
        minwidth: config.width - 2,
        minheight: config.height,
        maxwidth: config.width - 2,
        maxheight: config.height
      })
      this.floatBuffer.setLines()
      nvim.command('redraw', true)
    }
    let [, err] = await nvim.resumeNotification()
    if (err) {
      showMessage(`Error on ${err[0]}: ${err[1]} - ${err[2]}`, 'error')
      return false
    }
    return true
  }

  public close(cancel = true): void {
    if (cancel && this.tokenSource) {
      if (this.tokenSource) {
        this.tokenSource.cancel()
        this.tokenSource = null
      }
    }
    let { window, popup } = this
    this.shown = false
    if (this.env.textprop) {
      if (popup) popup.dispose()
    } else if (window) {
      this.nvim.call('nvim_win_close', [window.id, 1], true)
    }
  }

  public dispose(): void {
    if (this.tokenSource) {
      this.tokenSource.cancel()
    }
    disposeAll(this.disposables)
  }

  private get buffer(): Buffer {
    return this.floatBuffer ? this.floatBuffer.buffer : null
  }

  public async activated(): Promise<boolean> {
    if (this.env.textprop) {
      if (!this.popup) return false
      return await this.popup.visible()
    }
    if (!this.window) return false
    let valid = await this.window.valid
    return valid
  }
}

function cursorPostion(n: number): string {
  if (n == 0) return 'cursor'
  if (n < 0) return `cursor${n}`
  return `cursor+${n}`
}
