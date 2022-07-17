const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')
const execa = require('execa')
const targets = process.argv.slice(2)
const jobs = require('os').cpus().length

async function runParallel(maxConcurrency, source, iteratorFn) {
  const ret = []
  const executing = []
  for (const item of source) {
    const p = Promise.resolve().then(() => iteratorFn(item, source))
    ret.push(p)

    if (maxConcurrency <= source.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1))
      executing.push(e)
      if (executing.length >= maxConcurrency) {
        await Promise.race(executing)
      }
    }
  }
  return Promise.all(ret)
}

async function build(targets) {
  const pkgsDir = path.resolve(__dirname, '../packages')
  const pkgDir = path.resolve(`${pkgsDir}/${targets}`)
  const pkgJson = require(`${pkgDir}/package.json`)

  if (pkgJson.private) {
    return
  }

  await execa(
    'rollup',
    [
      '-c',
      '--environment',
      [`NODE_ENV:${process.env.NODE_ENV ?? 'production'}`, `TARGET:${targets}`].join(','),
    ],
    { stdio: 'inherit' },
  )
}

async function run() {
  if (!targets || targets.length === 0) {
    const allTargets = await fs.readdir(path.resolve(__dirname, '../packages'))
    await runParallel(jobs, allTargets, build)
  } else {
    await runParallel(jobs, targets, build)
  }
}

run().catch((err) => {
  console.error(chalk.red(err))
  process.exit(1)
})
