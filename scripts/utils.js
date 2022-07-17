const exec = require('util').promisify(require('child_process').exec)
const os = require('os')

async function run(cmd) {
  const { stdout } = await exec(cmd)
  return stdout.trim()
}

async function getCurrentBranchName() {
  return await run('git rev-parse --abbrev-ref HEAD')
}

async function getCurrentTagName() {
  return await run('git describe HEAD --tags --abbrev=0')
}

async function getUnCommittedFiles() {
  const stdout = await run('git diff --name-only HEAD')
  return stdout.split(os.EOL).filter(Boolean)
}

async function getLatestCommitMessage(detail = true) {
  if (detail) {
    return await run('git log -n1 --format=%B')
  } else {
    return await run('git log -n1 --format=%s')
  }
}

module.exports = {
  getCurrentBranchName,
  getCurrentTagName,
  getUnCommittedFiles,
  getLatestCommitMessage,
}
