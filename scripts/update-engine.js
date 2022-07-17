const fs = require('fs')
const path = require('path')

const cocVersion = require('../package.json').devDependencies['coc.nvim']
console.log('coc.nvim version', cocVersion)

const packagesDir = path.resolve(__dirname, '../packages')

for (const dir of fs.readdirSync(packagesDir)) {
  const packageDir = path.resolve(packagesDir, dir)
  const packageJsonPath = path.resolve(packageDir, 'package.json')
  const packageJson = require(packageJsonPath)
  if (packageJson.engines?.coc) {
    packageJson.engines.coc = cocVersion
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), { encoding: 'utf8' })
  }
}
console.log('done')
