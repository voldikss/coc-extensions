const chalk = require('chalk')
const { build } = require('esbuild')
const { resolve } = require('path')
const { existsSync } = require('fs-extra')
const { writeFileSync, readFileSync } = require('fs')

const target = process.argv.at(2)

const packageDir = resolve(__dirname, `../packages/${target}`)
if (!existsSync(packageDir)) {
  console.error(chalk.red(`target is not found: ${target}`))
  process.exit(1)
}
const packageJson = require(resolve(packageDir, 'package.json'))
const outfile = resolve(packageDir, packageJson.main ?? 'lib/index.js')

function updateVimrc() {
  let template = readFileSync(resolve(__dirname, '../dev/vimrc.template'), { encoding: 'utf8' })
  template += `\n\nset rtp+=${packageDir}`
  const vimrc = resolve(__dirname, '../dev/vimrc')
  writeFileSync(vimrc, template, { encoding: 'utf8' })
  console.log(chalk.cyan(`updated ${vimrc}`))
}

build({
  entryPoints: [resolve(packageDir, 'src/index.ts')],
  outfile,
  bundle: true,
  external: ['coc.nvim'],
  sourcemap: false,
  format: 'cjs',
  platform: 'node',
  tsconfig: resolve(__dirname, '../tsconfig.json'),
  watch: {
    onRebuild(err) {
      if (err) {
        console.error(chalk.red(err))
      } else {
        console.log(`rebuilt ${outfile}`)
      }
    },
  },
})
  .then(() => {
    console.log(chalk.green(`watching ${outfile}`))
    updateVimrc()
  })
  .catch((err) => {
    console.error(chalk.red(err))
  })
