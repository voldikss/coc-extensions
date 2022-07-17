const path = require('path')
const execa = require('execa')
const fs = require('fs-extra')
const chalk = require('chalk')
const minimist = require('minimist')
const { getCurrentBranchName, getLatestCommitMessage } = require('./utils')

const args = minimist(process.argv.slice(2))
const isDryRun = args['dry-run'] || false

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

async function getPublishPackages() {
  const commitMessage = process.env.CI_COMMIT_MESSAGE || (await getLatestCommitMessage())
  const branchName = process.env.CI_COMMIT_REF_NAME || (await getCurrentBranchName())
  info(`branchName: ${branchName} \n`)

  if (
    branchName !== 'main' ||
    !commitMessage ||
    !commitMessage.startsWith(`chore(release): bump`)
  ) {
    info(`publish skipped.`)
    process.exit()
  }

  const packages = commitMessage
    .split(/[\r\n]+/)
    .slice(1)
    .map((row) => {
      const v = row.trim()
      return v && v.startsWith('- ') ? v.slice(2).trim() : null
    })
    .filter(Boolean)

  info('will publish:', packages)
  return packages
}

async function buildAndPublish(packages) {
  step(`\nBuilding...`)
  await runIfNotDry('pnpm', ['build', ...packages])

  for (const package of packages) {
    const packageDir = path.resolve(__dirname, '../packages', package)
    const packageJson = require(path.resolve(packageDir, 'package.json'))
    if (packageJson.private) {
      error('skip due to private')
      continue
    }
    const dist = packageJson.main
    if (!dist) {
      error('skip due to no main field in the package.json')
      continue
    }
    const distPath = path.resolve(packageDir, dist)
    if (!(await fs.pathExists(distPath))) {
      error('no build output, exiting')
      process.exit(1)
    }

    step(`\nPublishing ${package}...`)
    await runIfNotDry('npm', ['publish'], { cwd: packageDir })
  }
}

async function main() {
  const packages = await getPublishPackages()
  await buildAndPublish(packages)
}

main().catch((err) => {
  error(err)
  process.exit()
})
