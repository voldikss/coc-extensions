import { window, workspace } from 'coc.nvim'
import opener from 'opener'

import {
  cmake,
  cmCommandsSuggestionsExact,
  cmModulesSuggestionsExact,
  cmPropertiesSuggestionsExact,
  cmVariablesSuggestionsExact,
  complKind2cmakeType,
} from '../core'

// Show Tooltip on over
export default async function onLineHelp(): Promise<void> {
  const document = await workspace.document
  const position = await window.getCursorPosition()
  const range = document.getWordRangeAtPosition(position)
  let currentWord = document.textDocument.getText(range)

  if (range && range.start.character < position.character) {
    const word = document.textDocument.getText(range)
    currentWord = word
  }

  let result = await window.requestInput('Search on Cmake online documentation', currentWord)
  if (result != null) {
    if (result.length === 0) {
      result = currentWord
    }
    if (result != '') {
      await cmake_online_help(result)
    }
  }
}

export async function cmake_online_help(search: string): Promise<void> {
  const url = await cmake_help_url()
  const v2x = url.endsWith('html') // cmake < 3.0
  return Promise.all([
    cmCommandsSuggestionsExact(search),
    cmVariablesSuggestionsExact(search),
    cmModulesSuggestionsExact(search),
    cmPropertiesSuggestionsExact(search),
  ]).then((results) => {
    const suggestions = Array.prototype.concat.apply([], results)

    if (suggestions.length == 0) {
      search = search.replace(/[<>]/g, '')
      if (v2x || search.length == 0) {
        opener(url)
      } else {
        opener(`${url}search.html?q=${search}&check_keywords=yes&area=default`)
      }
    } else {
      const suggestion = suggestions[0]
      let type = complKind2cmakeType(suggestion.kind)
      if (type == 'property') {
        if (v2x) {
          opener(url)
        } else {
          // TODO : needs to filter properties per scope to detect the right URL
          opener(`${url}search.html?q=${search}&check_keywords=yes&area=default`)
        }
      } else {
        if (type == 'function') {
          type = 'command'
        }
        search = search.replace(/[<>]/g, '')
        if (v2x) {
          opener(`${url}#${type}:${search}`)
        } else {
          opener(`${url}${type}/${search}.html`)
        }
      }
    }
  })
}

// Return the url for the online help based on the cmake executable binary used
export async function cmake_help_url(): Promise<string> {
  const base_url = 'https://cmake.org/cmake/help'
  let version = await cmake_version()
  if (version.length > 0) {
    if (version >= '3.0') {
      const re = /(\d+.\d+).\d+/
      version = version.replace(re, '$1/')
    } else {
      const older_versions = [
        '2.8.12',
        '2.8.11',
        '2.8.10',
        '2.8.9',
        '2.8.8',
        '2.8.7',
        '2.8.6',
        '2.8.5',
        '2.8.4',
        '2.8.3',
        '2.8.2',
        '2.8.1',
        '2.8.0',
        '2.6',
      ]
      if (older_versions.indexOf(version) == -1) {
        version = 'latest/'
      } else {
        version = version + '/cmake.html'
      }
    }
  } else {
    version = 'latest/'
  }
  return base_url + '/v' + version
}

async function cmake_version(): Promise<string> {
  const cmd_output = await cmake(['--version'])
  const re = /cmake\s+version\s+(\d+.\d+.\d+)/
  if (re.test(cmd_output)) {
    const result = re.exec(cmd_output)
    return result[1]
  }
  return ''
}
