import * as packageJson from '../package.json'
import * as cp from 'child_process'

const PACKAGE_ROOT = `${__dirname}/../`

function fail(errmsg) {
  console.error('\n', '\x1b[31m' + errmsg + '\x1b[m', '\n\n')
  process.exit(1)
}

function execSyncInPackageRoot(cmd: string, options?: cp.ExecSyncOptions) {
  return cp
    .execSync(cmd, {
      cwd: PACKAGE_ROOT,
      env: process.env,
      ...options,
    })
    .toString()
    .trim()
}

process.on('uncaughtException', (err) => fail(err))

try {
  execSyncInPackageRoot('npm help')
} catch (e) {
  fail(e)
}

const { name, version: localVersion } = packageJson
const remoteVersion = execSyncInPackageRoot(`npm view ${name} version`)

console.log({ localVersion })
console.log({ remoteVersion })

if (localVersion > remoteVersion) {
  console.log('npm publish...')
  execSyncInPackageRoot('npm publish')
  console.log('git tag')
  execSyncInPackageRoot(`
    git config user.name github-actions
    git config user.email github-actions@github.com
    git tag -a ${localVersion} -m v${localVersion}
    git push --tags
  `)
  console.log('finished')
}
