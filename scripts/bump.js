const semver = require('semver')
const enquirer = require('enquirer')
const { getUnCommittedFiles, getCurrentBranchName } = require('./utils')
const chalk = require('chalk')
const path = require('path')
const fs = require('fs-extra')
const execa = require('execa')
const minimist = require('minimist')

const args = minimist(process.argv.slice(2))
const isDryRun = args['dry-run'] || false
const push = args['push'] || false
const skipCheck = args['skip-check'] || false

const packagesDir = path.resolve(__dirname, '../packages')

const error = (msg) => console.error(chalk.red(msg))
const info = (msg) => console.info(chalk.green(msg))
const step = (msg) => console.log(chalk.magenta(msg))

async function runIfNotDry(bin, args, opts = {}) {
  if (isDryRun) {
    console.log(chalk.blue(`[dryrun] ${bin} ${args.join(' ')}`))
  } else {
    await execa(bin, args, {
      stdio: 'inherit',
      ...opts,
    })
  }
}

async function check() {
  const changedFiles = await getUnCommittedFiles()
  if (changedFiles.length > 0) {
    error(`Repository is not clean, commit or stash those changes first`)
    process.exit(1)
  }

  // only bump on specific branch
  const safeBranches = ['main']
  const currentBranch = await getCurrentBranchName()
  if (!safeBranches.includes(currentBranch)) {
    error(`Please operate at the '${safeBranches.join('|')}' branches!`)
    process.exit(1)
  }
}

async function getPackages() {
  let targets = args._
  let packages
  if (!targets || targets.length === 0) {
    packages = await fs.readdir(packagesDir).then((dirs) => {
      return dirs
        .map((dir) => {
          const packageDir = path.resolve(packagesDir, dir)
          return {
            name: dir,
            path: packageDir,
          }
        })
        .filter((pkg) => {
          const packageJson = require(path.resolve(pkg.path, 'package.json'))
          return !packageJson.private
        })
    })
    targets = (
      await enquirer.prompt({
        type: 'multiselect',
        name: 'packages',
        message: 'Select packages to bump',
        choices: packages.map((pkg) => pkg.name),
      })
    ).packages
    if (!targets || targets.length === 0) {
      error('no packages to bump')
      process.exit(1)
    }
    packages = packages.filter((pkg) => targets.includes(pkg.name))
  } else {
    packages = []
    for (const target of targets) {
      const packageDir = path.resolve(packagesDir, target)
      if (!(await fs.pathExists(packageDir))) {
        error(`invalid target: ${target}`)
        process.exit(1)
      }
      const packageJson = path.resolve(packageDir, 'package.json')
      if (packageJson.private) {
        error(`can not bump for private package ${target}`)
        process.exit(1)
      }
      packages.push({
        name: target,
        path: packageDir,
      })
    }
  }
  info(`Will bump: ${targets.join(', ')}`)
  return packages
}

async function getNewVersion(packages) {
  const versionMap = {}
  for (const package of packages) {
    const currentVersion = require(path.resolve(package.path, 'package.json')).version
    const { version } = await enquirer.prompt({
      type: 'select',
      name: 'version',
      message: 'Select bump type',
      choices: ['patch', 'minor', 'major'].map((type) => {
        const newVersion = semver.inc(currentVersion, type)
        return {
          name: newVersion,
          message: `${type}, ${newVersion}`,
          value: newVersion,
        }
      }),
    })
    versionMap[package.name] = {
      old: currentVersion,
      new: version,
    }
  }
  return versionMap
}

async function updateVersion(packages, versionMap) {
  return Promise.all(
    packages.map(async (pkg) => {
      const pkgJsonPath = path.resolve(pkg.path, 'package.json')
      const pkgJson = require(pkgJsonPath)
      const version = versionMap[pkg.name].new
      pkgJson.version = version
      await fs.writeFile(pkgJsonPath, JSON.stringify(pkgJson, null, 2))
    }),
  )
}

async function bump() {
  const packages = await getPackages()
  const versionMap = await getNewVersion(packages)
  const { yes } = await enquirer.prompt({
    type: 'confirm',
    name: 'yes',
    message:
      'Confirm: \n' +
      Object.entries(versionMap)
        .map(([target, version]) => {
          return `${target}: ${version.old} => ${version.new}`
        })
        .join('\n') +
      '\n',
  })
  if (!yes) return

  step(`\nUpdate version...`)
  await updateVersion(packages, versionMap)

  const { stdout } = await execa('git', ['diff'], { stdio: 'pipe' })
  if (stdout) {
    step(`\nCommitting changes...`)
    await runIfNotDry('git', ['add', '-A'])
    await runIfNotDry('git', [
      'commit',
      '-m',
      `chore(release): bump\n\n${packages.map((pkg) => `- ${pkg.name}`).join('\n')}`,
    ])
    if (push && !isDryRun) {
      step(`\nPushing to GitHub...`)
      await runIfNotDry('git', ['push'])
    }
  } else {
    console.log('No changes to commit.')
    return
  }

  if (isDryRun) {
    console.log(`\nDry run finished - run git diff to see package changes.`)
  }
}

async function run() {
  if (!skipCheck) {
    await check()
  }
  await bump()
}

run().catch((err) => {
  error(err)
})
