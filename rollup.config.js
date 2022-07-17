const { defineConfig } = require('rollup')
const path = require('path')
const chalk = require('chalk')
const ts = require('rollup-plugin-typescript2')
const { nodeResolve } = require('@rollup/plugin-node-resolve')
const commonjs = require('@rollup/plugin-commonjs')
const json = require('@rollup/plugin-json')
const strip = require('@rollup/plugin-strip')

if (!process.env.TARGET) {
  console.error('TARGET package must be specified via --environment flag.')
  process.exit(1)
}

const packagesDir = path.resolve(__dirname, 'packages')
const packageDir = path.resolve(packagesDir, process.env.TARGET)
const resolve = (p) => path.resolve(packageDir, p)
const packageJson = require(resolve('package.json'))

const banner = `\
/*!
 * ${packageJson.name} v${packageJson.version}
 * https://github.com/voldikss/coc-translator
 * Released under the MIT License.
 */
`

module.exports = defineConfig({
  input: resolve('src/index.ts'),
  output: {
    file: resolve(packageJson.main ?? 'lib/index.js'),
    format: 'cjs',
    sourcemap: false,
    inlineDynamicImports: true,
    banner,
  },
  external: ['coc.nvim'],
  plugins: [
    ts({
      check: false,
      tsconfig: path.resolve(__dirname, 'tsconfig.json'),
      exclude: ['**/__tests__'],
    }),
    strip({
      include: ['**/*.ts', '**/*.js'],
      functions: ['console.*'],
    }),
    json(),
    commonjs({
      sourceMap: false,
      requireReturnsDefault: 'auto',
    }),
    nodeResolve({
      preferBuiltins: true,
    }),
  ],
  onwarn: (msg, warn) => {
    if (msg.code === 'CIRCULAR_DEPENDENCY') {
      if (/index\.ts$/.test(msg.cycle.at(0)) && /index\.ts$/.test(msg.cycle.at(-1))) {
        console.error(chalk.red('Circular Dependency Detected:'))
        console.error(chalk.red(msg.message))
        console.error(chalk.yellow('[Hint] Self-import is not allowed'))
        process.exit(1)
      }
    } else {
      // warn(msg)
    }
  },
  treeshake: {
    annotations: true,
    moduleSideEffects: true,
  },
})
