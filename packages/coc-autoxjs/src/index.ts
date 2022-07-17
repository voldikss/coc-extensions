'use strict'
import { commands, ExtensionContext, Uri, window, workspace } from 'coc.nvim'
import * as fs from 'fs'

import { AutoJsDebugServer, Device } from './autojs-debug'
import { Project } from './project'

const server = new AutoJsDebugServer(9317)
let recentDevice: Device
server
  .on('connect', () => {
    window.showInformationMessage(
      `Auto.js server running on ${server.getIPAddress()}:${server.getPort()}`,
    )
  })
  .on('new_device', (device: Device) => {
    let messageShown = false
    const showMessage = () => {
      if (messageShown) return
      window.showInformationMessage('New device attached: ' + device)
      messageShown = true
    }
    setTimeout(showMessage, 1000)
    device.on('data:device_name', showMessage)
  })
  .on('cmd', (cmd: string, url: string) => {
    switch (cmd) {
      case 'save':
        extension.saveProject(url)
        break
      case 'rerun':
        extension.stopAll()
        setTimeout(function () {
          extension.run(url)
        }, 1000)
        break
      default:
        break
    }
  })
  .on('log', () => {})

class Extension {
  // private documentViewPanel: any = undefined
  // private documentCache: Map<string, string> = new Map<string, string>()

  // openDocument() {
  //   if (this.documentViewPanel) {
  //     this.documentViewPanel.reveal((vscode.ViewColumn as any).Beside)
  //   } else {
  //     // 1.创建并显示Webview
  //     this.documentViewPanel = (window as any).createWebviewPanel(
  //       // 该webview的标识，任意字符串
  //       'Auto.js Document',
  //       // webview面板的标题，会展示给用户
  //       'Auto.js开发文档',
  //       // webview面板所在的分栏
  //       (vscode.ViewColumn as any).Beside,
  //       // 其它webview选项
  //       {
  //         // Enable scripts in the webview
  //         enableScripts: true,
  //       }
  //     )
  //     // Handle messages from the webview
  //     this.documentViewPanel.webview.onDidReceiveMessage(
  //       (message) => {
  //         // console.log('插件收到的消息：' + message.href);
  //         const href = message.href.substring(
  //           message.href.indexOf('/electron-browser/') + 18
  //         )
  //         // console.log("得到uri：" + href)
  //         this.loadDocument(href)
  //       },
  //       undefined,
  //       _context.subscriptions
  //     )
  //     this.documentViewPanel.onDidDispose(
  //       () => {
  //         this.documentViewPanel = undefined
  //       },
  //       undefined,
  //       _context.subscriptions
  //     )
  //   }
  //   try {
  //     // 默认加载首页
  //     this.loadDocument('index.html')
  //   } catch (e) {
  //     console.trace(e)
  //   }
  // }

  // private loadDocument(fileName) {
  //   try {
  //     let cache = this.documentCache.get(fileName)
  //     if (!cache) {
  //       const docRootPath = path.join(_context.extensionPath, 'src', 'document')
  //       const resourcePath = path.resolve(docRootPath, fileName)
  //       let html = fs.readFileSync(resourcePath, 'utf-8')
  //       // vscode不支持直接加载本地资源，需要替换成其专有路径格式，这里只是简单的将样式和JS的路径替换
  //       html = html.replace(
  //         /(<link.+?href="|<script.+?src="|<img.+?src=")(.+?)"/g,
  //         (_m, $1, $2) => {
  //           if ($2.substring($2.length - 4, $2.length) != 'html') {
  //             return (
  //               $1 +
  //               Uri.file(path.resolve(docRootPath, $2))
  //                 .with({ scheme: 'vscode-resource' })
  //                 .toString() +
  //               '"'
  //             )
  //           } else {
  //             return $1 + $2 + '"'
  //           }
  //         }
  //       )
  //       // console.log(html)
  //       cache =
  //         html +
  //         `<script>
  //                   const vscode = acquireVsCodeApi();
  //                   document.querySelectorAll("a").forEach(e => {
  //                       if (e) {
  //                           e.onclick = () =>{
  //                               if (e.href) {
  //                                   let target = e.href.substring(e.href.lastIndexOf("/"),
  //                                       (e.href.lastIndexOf("#") < 0 ? e.href.length : e.href.lastIndexOf("#")));
  //                                   let cur = location.href.substring(location.href.lastIndexOf("/"),
  //                                       (location.href.lastIndexOf("#") < 0 ? location.href.length : location.href.lastIndexOf("#")));
  //                                   if (target == '/index.html' || (target != cur && e.href.indexOf("http") != 0)) {
  //                                       let href= e.href.substring(e.href.lastIndexOf("/"), (e.href.lastIndexOf("#") < 0 ? e.href.length : e.href.lastIndexOf("#")));
  //                                       vscode.postMessage({href: e.href});
  //                                   } else {
  //                                       console.log("内部跳转：" + e.href)
  //                                   }
  //                               }
  //                           }
  //                       }
  //                   })
  //               </script>`
  //       this.documentCache.set(fileName, cache)
  //     }
  //     this.documentViewPanel.webview.html = cache
  //   } catch (e) {
  //     console.trace(e)
  //   }
  // }

  startServer() {
    server.listen()
  }

  stopServer() {
    server.disconnect()
    window.showInformationMessage('Auto.js server stopped')
  }

  run(url?: string) {
    this.runOrRerun('run', url)
  }

  async stop() {
    server.sendCommand('stop', {
      id: (await workspace.document).uri,
    })
  }

  stopAll() {
    server.sendCommand('stopAll')
  }

  rerun(url?: string) {
    this.runOrRerun('rerun', url)
  }

  async runOrRerun(cmd: string, url?: string) {
    console.log('url-->', url)
    let text = ''
    let fileName = null
    if (url != null) {
      const uri = Uri.parse(url)
      fileName = uri.fsPath
      console.log('fileName-->', fileName)
      try {
        text = fs.readFileSync(fileName, 'utf8')
      } catch (error) {
        console.error(error)
      }
    } else {
      const doc = await workspace.document
      text = doc.getDocumentContent()
      fileName = doc.uri
    }
    server.sendCommand(cmd, {
      id: fileName,
      name: fileName,
      script: text,
    })
  }

  async runOnDevice() {
    await this.selectDevice(async (device) => await this.runOn(device))
  }

  async selectDevice(callback: (device: Device) => void) {
    let devices: Array<Device> = server.devices
    if (recentDevice) {
      const i = devices.indexOf(recentDevice)
      if (i > 0) {
        devices = devices.slice(0)
        devices[i] = devices[0]
        devices[0] = recentDevice
      }
    }
    const names = devices.map((device) => device.toString())
    window.showQuickpick(names).then((select) => {
      if (select == -1) return
      const device = devices[select]
      recentDevice = device
      callback(device)
    })
  }
  async runOn(target: AutoJsDebugServer | Device) {
    const doc = await workspace.document
    target.sendCommand('run', {
      id: doc.uri,
      name: doc.uri,
      script: doc.getDocumentContent(),
    })
  }

  async save(url?: string) {
    await this.saveTo(server, url)
  }
  async saveToDevice() {
    await this.selectDevice(async (device) => await this.saveTo(device))
  }

  async saveTo(target: AutoJsDebugServer | Device, url?: string) {
    console.log('url-->', url)
    let text = ''
    const fileName = ''
    if (url != null) {
      const uri = Uri.parse(url)
      const fileName = uri.fsPath
      console.log('fileName-->', fileName)
      try {
        text = fs.readFileSync(fileName, 'utf8')
      } catch (error) {
        console.error(error)
      }
    } else {
      const doc = await workspace.document
      text = doc.getDocumentContent()
    }
    target.sendCommand('save', {
      id: fileName,
      name: fileName,
      script: text,
    })
  }

  // newProject() {
  //   window.showOpenDialog({
  //       canSelectFiles: false,
  //       canSelectFolders: true,
  //       openLabel: '新建到这里',
  //     })
  //     .then((uris) => {
  //       if (!uris || uris.length == 0) {
  //         return
  //       }
  //       return new ProjectTemplate(uris[0]).build()
  //     })
  //     .then((uri) => {
  //       commands.executeCommand('vscode.openFolder', uri)
  //     })
  // }

  runProject() {
    this.sendProjectCommand('run_project')
  }

  sendProjectCommand(command: string, url?: string) {
    console.log('url-->', url)
    let folder: Uri | null = null
    if (url == null) {
      const folders = workspace.workspaceFolders
      if (!folders || folders.length == 0) {
        window.showInformationMessage('请打开一个项目的文件夹')
        return null
      }
      folder = Uri.parse(folders[0].uri)
    } else {
      folder = Uri.parse(url)
    }
    console.log('folder-->', folder)
    if (!server.project || server.project.folder != folder) {
      server.project && server.project.dispose()
      server.project = new Project(folder)
    }
    if (!server.project || server.project.folder != folder) {
      server.project && server.project.dispose()
      server.project = new Project(folder)
    }
    server.sendProjectCommand(folder.fsPath, command)
  }

  saveProject(url?: string) {
    this.sendProjectCommand('save_project', url)
  }
}

// let _context: any
const extCmds = [
  // 'openDocument',
  'startServer',
  'stopServer',
  'run',
  'runOnDevice',
  'stop',
  'stopAll',
  'rerun',
  'save',
  'saveToDevice',
  // 'newProject',
  'runProject',
  'saveProject',
]
const extension = new Extension()

export async function activate(context: ExtensionContext) {
  console.log('extension "auto-js-vscodeext-fixed" is now active.')
  extCmds.forEach((command) => {
    // eslint-disable-next-line @typescript-eslint/ban-types
    const action: Function = extension[command as keyof Extension]
    context.subscriptions.push(
      commands.registerCommand('autoxjs.' + command, action.bind(extension)),
    )
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // _context = context
  })
}

export function deactivate() {
  server.disconnect()
}
