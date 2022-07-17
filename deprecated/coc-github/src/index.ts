import * as child from 'child_process'
import { ExtensionContext, SourceConfig, sources, workspace } from 'coc.nvim'
import request from 'request'

export async function activate(context: ExtensionContext): Promise<void> {
  const config = workspace.getConfiguration('coc.github')
  const enable = config.get<boolean>('enable', true)

  if (!enable) {
    return
  }

  const priority = config.get<number>('priority', 99)
  const filetypes = config.get<Array<string>>('filetypes', ['gitcommit'])

  const source: SourceConfig = {
    name: 'github',
    enable: true,
    shortcut: 'I',
    filetypes: filetypes,
    priority: priority,
    sourceType: 2,
    triggerCharacters: ['#'],
    doComplete: async function () {
      const issues = await getIssues()
      return {
        items: issues.map((i) => {
          return {
            word: i.character,
            abbr: `#${i.character} ${i.description}`,
            filterText: i.character + i.description,
          }
        }),
      }
    },
  }
  context.subscriptions.push(sources.createSource(source))
}

async function getIssues(): Promise<Issue[]> {
  const repoUrl = await getRepoUrl()
  const options = {
    url: repoUrl,
    headers: { 'User-Agent': 'request' },
  }
  return new Promise((resolve, reject) => {
    request(options, (err, res, body) => {
      if (!err && res.statusCode == 200) {
        const issues = getCandidates(body)
        resolve(issues)
      } else {
        reject([])
      }
    })
  })
    .then((result) => {
      return result
    })
    .catch((err) => {
      return err
    })
}

function getCandidates(body: string) {
  const info = JSON.parse(body)
  const candidates = []
  for (let i = 0, len = info.length; i < len; i++) {
    const issue = {
      character: info[i].number.toString(),
      description: info[i].title,
    }
    candidates.push(issue)
  }
  return candidates
}

async function getRepoUrl(): Promise<string> {
  const cmd = 'git remote get-url origin'
  return new Promise((resolve, reject) => {
    child.exec(cmd, (err, stdout, stderr) => {
      if (err) {
        reject(stderr)
      } else {
        const remote = stdout.split('\n')[0]
        let repoUrl = remote.replace(/\.git$/, '')
        // for uri like `git@github.com:username/reponame.git`
        if (repoUrl.startsWith('git')) {
          const repo = repoUrl.slice(4)
          const info = repo.split(':', 2)
          repoUrl = `https://api.github.com/repos/${info[1]}/issues?state=all`
        }
        resolve(repoUrl)
      }
    })
  })
}

interface Issue {
  character: string
  description: string
}
