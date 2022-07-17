import {
  ExtensionContext,
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  services,
  TransportKind,
  workspace,
  WorkspaceConfiguration,
} from 'coc.nvim'

export function activate(context: ExtensionContext): void {
  const config: WorkspaceConfiguration = workspace.getConfiguration('lsp-wl')

  const isEnable = config.get<boolean>('enable', true)
  if (!isEnable) return

  const wlKernel: string = config.get<string>('wolframExecutablePath')!
  let wlServerDir: string = config.get<string>('wolframLanguageServerPath')!
  if (wlServerDir[-1] !== '\\' && wlServerDir[-1] !== '/') {
    wlServerDir += '/'
  }

  const socketPort = Number(config.get<number>('port'))
  const serverOptions: ServerOptions = {
    module: wlServerDir + 'init.wls',
    runtime: wlKernel,
    transport: {
      kind: TransportKind.socket,
      port: socketPort,
    },
    options: {
      execArgv: ['-script'],
    },
  }

  const clientOptions: LanguageClientOptions = {
    documentSelector: ['mma', 'wl'],
  }

  const client: LanguageClient = new LanguageClient(
    'lsp-wl',
    'Wolfram Language Server',
    serverOptions,
    clientOptions,
  )

  context.subscriptions.push(services.registLanguageClient(client))
}
