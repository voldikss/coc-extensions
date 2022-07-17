import archiver from 'archiver'
import { FileSystemWatcher, Thenable, Uri, workspace, WorkspaceFolder } from 'coc.nvim'
import * as cryto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import * as streamBuffers from 'stream-buffers'
import * as walk from 'walk'

import { FileFilter, FileObserver } from './diff'

export class ProjectTemplate {
  private uri: Uri

  constructor(uri: Uri) {
    this.uri = uri
  }

  build(): Thenable<Uri> {
    const projectConfig = new ProjectConfig()
    projectConfig.name = '新建项目'
    projectConfig.main = 'main.js'
    projectConfig.ignore = ['build']
    projectConfig.packageName = 'com.example'
    projectConfig.versionName = '1.0.0'
    projectConfig.versionCode = 1
    const uri = this.uri
    const jsonFilePath = path.join(uri.fsPath, 'project.json')
    const mainFilePath = path.join(uri.fsPath, 'main.js')
    const mainScript = "toast('Hello, Auto.js');"
    return projectConfig.save(jsonFilePath).then(() => {
      return new Promise<Uri>(function (res, rej) {
        fs.writeFile(mainFilePath, mainScript, function (err) {
          if (err) {
            rej(err)
            return
          }
          res(uri)
        })
      })
    })
  }
}

export class RelativePattern {
  base: string
  pattern: string

  // expose a `baseFolder: URI` property as a workaround for the short-coming
  // of `IRelativePattern` only supporting `base: string` which always translates
  // to a `file://` URI. With `baseFolder` we can support non-file based folders
  // in searches
  // (https://github.com/microsoft/vscode/commit/6326543b11cf4998c8fd1564cab5c429a2416db3)
  readonly baseFolder?: Uri

  constructor(base: WorkspaceFolder | Uri | string, pattern: string) {
    if (typeof base !== 'string') {
      if (!base || (!Uri.isUri(base) && !Uri.isUri(base.uri))) {
        throw new Error('base')
      }
    }

    if (typeof pattern !== 'string') {
      throw new Error('pattern')
    }

    if (typeof base === 'string') {
      this.baseFolder = Uri.file(base)
      this.base = base
    } else if (Uri.isUri(base)) {
      this.baseFolder = base
      this.base = base.fsPath
    } else {
      this.baseFolder = Uri.file(base.uri)
      this.base = this.baseFolder.fsPath
    }

    this.pattern = pattern
  }
}

export class Project {
  config: ProjectConfig
  folder: Uri
  fileFilter = (_relativePath: string, absPath: string, _stats: fs.Stats) => {
    return (
      this.config.ignore.filter((p) => {
        const fullPath = path.join(this.folder.fsPath, p)
        return absPath.startsWith(fullPath)
      }).length == 0
    )
  }
  private watcher: FileSystemWatcher

  constructor(folder: Uri) {
    this.folder = folder
    this.config = ProjectConfig.fromJsonFile(path.join(this.folder.fsPath, 'project.json'))
    this.watcher = workspace.createFileSystemWatcher(
      new RelativePattern(folder.fsPath, 'project.json').pattern, // TODO
    )
    this.watcher.onDidChange((event) => {
      console.log('file changed: ', event.fsPath)
      if (event.fsPath == path.join(this.folder.fsPath, 'project.json')) {
        this.config = ProjectConfig.fromJsonFile(event.fsPath)
        console.log('project.json changed: ', this.config)
      }
    })
  }

  dispose() {
    this.watcher.dispose()
  }
}

export class ProjectObserser {
  folder: string
  private fileObserver: FileObserver
  private fileFilter: FileFilter

  constructor(folder: string, filter: FileFilter) {
    this.folder = folder
    this.fileFilter = filter
    this.fileObserver = new FileObserver(folder, filter)
  }

  diff(): Promise<{ buffer: Buffer; md5: string }> {
    return this.fileObserver
      .walk()
      .then((changedFiles) => {
        const zip = archiver('zip')
        const streamBuffer: any = new streamBuffers.WritableStreamBuffer()
        zip.pipe(streamBuffer)
        changedFiles.forEach((relativePath) => {
          zip.append(fs.createReadStream(path.join(this.folder, relativePath)), {
            name: relativePath,
          })
        })
        zip.finalize()
        return new Promise<Buffer>((res) => {
          zip.on('finish', () => {
            streamBuffer.end()
            res(streamBuffer.getContents())
          })
        })
      })
      .then((buffer) => {
        const md5 = cryto.createHash('md5').update(buffer).digest('hex')
        return {
          buffer: buffer,
          md5: md5,
        }
      })
  }

  zip(): Promise<{ buffer: Buffer; md5: string }> {
    return new Promise<{ buffer: Buffer; md5: string }>(() => {
      const walker = walk.walk(this.folder)
      const zip = archiver('zip')
      const streamBuffer: any = new streamBuffers.WritableStreamBuffer()
      zip.pipe(streamBuffer)
      walker.on('file', (root, stat, next) => {
        const filePath = path.join(root, stat.name)
        const relativePath = path.relative(this.folder, filePath)
        if (!this.fileFilter(relativePath, filePath, stat)) {
          next()
          return
        }
        zip.append(fs.createReadStream(path.join(this.folder, relativePath)), {
          name: relativePath,
        })
        next()
      })
      walker.on('end', () => {
        zip.finalize()
        return new Promise<Buffer>((res) => {
          zip.on('finish', () => {
            streamBuffer.end()
            res(streamBuffer.getContents())
          })
        })
      })
    })
  }
}

export class LaunchConfig {
  hideLogs: boolean
}

export class ProjectConfig {
  name: string
  icon: string
  packageName: string
  main: string
  versionCode: number
  versionName: string
  ignore: string[]
  launchConfig: LaunchConfig

  save(path: string) {
    return new Promise((res, rej) => {
      const json = JSON.stringify(this, null, 4)
      fs.writeFile(path, json, function (err) {
        if (err) {
          rej(err)
          return
        }
        res(path)
      })
    })
  }

  static fromJson(text: string): ProjectConfig {
    const config = JSON.parse(text) as ProjectConfig
    config.ignore = (config.ignore || []).map((p) => path.normalize(p))
    return config
  }

  static fromJsonFile(path: string): ProjectConfig {
    const text = fs.readFileSync(path).toString('utf-8')
    const config = JSON.parse(text) as ProjectConfig
    config.ignore = config.ignore || []
    return config
  }
}
