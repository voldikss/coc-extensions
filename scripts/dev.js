const rollup = require('rollup')
const chalk = require('chalk')
const { resolve } = require('path')
const { writeFileSync, existsSync, readFileSync, copyFileSync } = require('fs')

const target = process.argv.at(2)
const packageDir = resolve(__dirname, `../packages/${target}`)
if (!existsSync(packageDir)) {
  console.error(chalk.red(`target is not found: ${target}`))
  process.exit(1)
}

const createConfig = require('../rollup.config')
const watcher = rollup.watch(createConfig(target))

watcher.on('event', (event) => {
  if (event.code === 'BUNDLE_END') {
    console.log(chalk.green(`updated: ${event.output}`))
  }
  // event.code can be one of:
  //   START        — the watcher is (re)starting
  //   BUNDLE_START — building an individual bundle
  //                  * event.input will be the input options object if present
  //                  * event.output contains an array of the "file" or
  //                    "dir" option values of the generated outputs
  //   BUNDLE_END   — finished building a bundle
  //                  * event.input will be the input options object if present
  //                  * event.output contains an array of the "file" or
  //                    "dir" option values of the generated outputs
  //                  * event.duration is the build duration in milliseconds
  //                  * event.result contains the bundle object that can be
  //                    used to generate additional outputs by calling
  //                    bundle.generate or bundle.write. This is especially
  //                    important when the watch.skipWrite option is used.
  //                  You should call "event.result.close()" once you are done
  //                  generating outputs, or if you do not generate outputs.
  //                  This will allow plugins to clean up resources via the
  //                  "closeBundle" hook.
  //   END          — finished building all bundles
  //   ERROR        — encountered an error while bundling
  //                  * event.error contains the error that was thrown
  //                  * event.result is null for build errors and contains the
  //                    bundle object for output generation errors. As with
  //                    "BUNDLE_END", you should call "event.result.close()" if
  //                    present once you are done.
})

// This will make sure that bundles are properly closed after each run
watcher.on('event', ({ result }) => {
  if (result) {
    result.close()
  }
})

function updateVimrc() {
  let template = readFileSync(resolve(__dirname, '../dev/vimrc.template'), { encoding: 'utf8' })
  template += `\n\nset rtp+=${packageDir}`
  const vimrc = resolve(__dirname, '../dev/vimrc')
  writeFileSync(vimrc, template, { encoding: 'utf8' })
  console.log(chalk.cyan(`updated ${vimrc}`))
}
updateVimrc()

function updateCocSettings() {
  const templateCocSettingsFile = resolve(__dirname, '../dev/coc-settings.json.template')
  const targetCocSettingsFile = resolve(__dirname, '../dev/coc-settings.json')
  copyFileSync(templateCocSettingsFile, targetCocSettingsFile)
  console.log(chalk.cyan(`updated ${targetCocSettingsFile}`))
}
updateCocSettings()
