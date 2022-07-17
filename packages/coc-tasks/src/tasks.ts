import { BasicList, ListAction, ListContext, ListItem, Neovim, Uri, workspace } from 'coc.nvim'

export default class Tasks extends BasicList {
  public readonly name = 'tasks'
  public readonly description = 'CocList for asynctasks.vim'
  public readonly defaultAction = 'run'
  public actions: ListAction[] = []
  private lastItem: ListItem | null = null

  constructor(nvim: Neovim) {
    super(nvim)

    this.addLocationActions()

    this.addAction('run', (item: ListItem) => {
      this.lastItem = item
      this.nvim.command(`AsyncTask ${item.data.name}`, true)
    })
  }

  public async runLastTask() {
    if (this.lastItem !== null) {
      await this.nvim.command(`AsyncTask ${this.lastItem.data.name}`, true)
    }
  }

  public async loadItems(_context: ListContext): Promise<ListItem[]> {
    const source: ListItem[] = []
    const loaded_asynctasks = await this.nvim.eval('exists("*asynctasks#list")')
    if (loaded_asynctasks.valueOf() == 0) return []

    const tasks: TaskItem[] = await this.nvim.call('asynctasks#list', [''])
    for (const task of tasks) {
      if (/^\./.test(task.name)) continue
      source.push({
        label: `${task.name.padEnd(25)}` + `<${task.scope}>`.padEnd(10) + `:  ${task.command}`,
        data: task,
        filterText: task.name,
        location: Uri.file(task.source).toString(),
      })
    }
    return source
  }

  public doHighlight(): void {
    const { nvim } = workspace
    nvim.pauseNotification()
    nvim.command('syntax match TaskName /^\\S\\+/', true)
    nvim.command('hi def link TaskName Constant', true)
    nvim.command('syn match TaskScope /\\s\\+<.*>\\s\\+:/', true)
    nvim.command('hi def link TaskScope Type', true)
    nvim.command('syn match TaskCommand /.*/ contains=TaskName,TaskScope', true)
    nvim.command('hi def link TaskCommand Comment', true)
    nvim.resumeNotification().catch((_e) => {
      // nop
    })
  }
}

interface TaskItem {
  source: string
  name: string
  scope: string
  command: string
}
