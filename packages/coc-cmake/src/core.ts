import { CompletionItem, CompletionItemKind, InsertTextFormat, Thenable } from 'coc.nvim'

import getConfig from './config'
import { parseCmdArgs, strContains, strEquals } from './util'
import child_process = require('child_process')

function cmakeType2complKind(kind: string): CompletionItemKind {
  switch (kind) {
    case 'function':
      return CompletionItemKind.Function
    case 'variable':
      return CompletionItemKind.Variable
    case 'module':
      return CompletionItemKind.Module
  }
  return CompletionItemKind.Property
}

export function complKind2cmakeType(kind: CompletionItemKind): string {
  switch (kind) {
    case CompletionItemKind.Function:
      return 'function'
    case CompletionItemKind.Variable:
      return 'variable'
    case CompletionItemKind.Module:
      return 'module'
  }
  return 'property'
}

// Simple helper function that invoke the CMAKE executable and return a promise
// with stdout
export async function cmake(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const cmake_path = getConfig<string>('cmakePath')
    const cmake_args = parseCmdArgs(cmake_path)
    const cmd = child_process.spawn(
      cmake_args[0],
      cmake_args.slice(1, cmake_args.length).concat(args.map((arg) => arg.replace(/\r/gm, ''))),
    )
    let stdout = ''
    cmd.stdout.on('data', (data) => {
      const txt: string = data.toString()
      stdout += txt.replace(/\r/gm, '')
    })
    cmd.on('error', () => {
      reject()
    })
    cmd.on('exit', () => resolve(stdout))
  })
}

// return the cmake command list
function cmake_help_command_list(): Promise<string> {
  return cmake(['--help-command-list'])
}

function cmake_help_command(name: string): Thenable<string> {
  return cmake_help_command_list()
    .then(
      (result: string) => {
        const contains = result.indexOf(name) > -1
        return new Promise((resolve, reject) => {
          if (contains) {
            resolve(name)
          } else {
            reject('not found')
          }
        })
      },
      () => {},
    )
    .then((n: string) => {
      return cmake(['--help-command', n])
    }, null)
}

function cmake_help_variable_list(): Promise<string> {
  return cmake(['--help-variable-list'])
}

function cmake_help_variable(name: string): Promise<string> {
  return cmake_help_variable_list()
    .then(
      (result: string) => {
        const contains = result.indexOf(name) > -1
        return new Promise((resolve, reject) => {
          if (contains) {
            resolve(name)
          } else {
            reject('not found')
          }
        })
      },
      () => {},
    )
    .then((name: string) => cmake(['--help-variable', name]), null)
}

function cmake_help_property_list(): Promise<string> {
  return cmake(['--help-property-list'])
}

function cmake_help_property(name: string): Promise<string> {
  return cmake_help_property_list()
    .then(
      (result: string) => {
        const contains = result.indexOf(name) > -1
        return new Promise((resolve, reject) => {
          if (contains) {
            resolve(name)
          } else {
            reject('not found')
          }
        })
      },
      () => {},
    )
    .then((name: string) => cmake(['--help-property', name]), null)
}

function cmake_help_module_list(): Promise<string> {
  return cmake(['--help-module-list'])
}

function cmake_help_module(name: string): Promise<string> {
  return cmake_help_module_list()
    .then(
      (result: string) => {
        const contains = result.indexOf(name) > -1
        return new Promise((resolve, reject) => {
          if (contains) {
            resolve(name)
          } else {
            reject('not found')
          }
        })
      },
      () => {},
    )
    .then((name: string) => cmake(['--help-module', name]), null)
}

export function cmake_help_all(): any {
  const promises = {
    function: (name: string) => {
      return cmake_help_command(name)
    },
    module: (name: string) => {
      return cmake_help_module(name)
    },
    variable: (name: string) => {
      return cmake_help_variable(name)
    },
    property: (name: string) => {
      return cmake_help_property(name)
    },
  }
  return promises
}

function suggestionsHelper(
  cmake_cmd: Promise<string>,
  currentWord: string,
  type: string,
  insertText,
  matchPredicate,
): Thenable<CompletionItem[]> {
  return new Promise((resolve, reject) => {
    cmake_cmd
      .then((stdout: string) => {
        const commands = stdout.split('\n').filter((v) => matchPredicate(v, currentWord))
        if (commands.length > 0) {
          const suggestions = commands.map((command_name) => {
            const item: CompletionItem = { label: command_name }
            item.kind = cmakeType2complKind(type)
            if (insertText == null || insertText == '') {
              item.insertText = command_name
            } else {
              item.insertTextFormat = InsertTextFormat.Snippet
              item.insertText = insertText(command_name)
            }
            return item
          })
          resolve(suggestions)
        } else {
          resolve([])
        }
      })
      .catch((err) => reject(err))
  })
}

function cmModuleInsertText(module: string): string {
  if (module.indexOf('Find') == 0) {
    return 'find_package(' + module.replace('Find', '') + '${1: REQUIRED})'
  } else {
    return 'include(' + module + ')'
  }
}

function cmFunctionInsertText(func: string): string {
  const scoped_func = ['if', 'function', 'while', 'macro', 'foreach']
  const is_scoped = scoped_func.reduceRight((prev, name) => prev || func == name, false)
  if (is_scoped) {
    return func + '(${1})\n\t\nend' + func + '(${1})\n'
  } else {
    return func + '(${1})'
  }
}

function cmVariableInsertText(variable: string): string {
  return variable.replace(/<(.*)>/g, '${1:<$1>}')
}

function cmPropetryInsertText(variable: string): string {
  return variable.replace(/<(.*)>/g, '${1:<$1>}')
}

export function cmCommandsSuggestions(currentWord: string): Thenable<CompletionItem[]> {
  const cmd = cmake_help_command_list()
  return suggestionsHelper(cmd, currentWord, 'function', cmFunctionInsertText, strContains)
}

export function cmVariablesSuggestions(currentWord: string): Thenable<CompletionItem[]> {
  const cmd = cmake_help_variable_list()
  return suggestionsHelper(cmd, currentWord, 'variable', cmVariableInsertText, strContains)
}

export function cmPropertiesSuggestions(currentWord: string): Thenable<CompletionItem[]> {
  const cmd = cmake_help_property_list()
  return suggestionsHelper(cmd, currentWord, 'property', cmPropetryInsertText, strContains)
}

export function cmModulesSuggestions(currentWord: string): Thenable<CompletionItem[]> {
  const cmd = cmake_help_module_list()
  return suggestionsHelper(cmd, currentWord, 'module', cmModuleInsertText, strContains)
}

export function cmCommandsSuggestionsExact(currentWord: string): Thenable<CompletionItem[]> {
  const cmd = cmake_help_command_list()
  return suggestionsHelper(cmd, currentWord, 'function', cmFunctionInsertText, strEquals)
}

export function cmVariablesSuggestionsExact(currentWord: string): Thenable<CompletionItem[]> {
  const cmd = cmake_help_variable_list()
  return suggestionsHelper(cmd, currentWord, 'variable', cmVariableInsertText, strEquals)
}

export function cmPropertiesSuggestionsExact(currentWord: string): Thenable<CompletionItem[]> {
  const cmd = cmake_help_property_list()
  return suggestionsHelper(cmd, currentWord, 'property', cmPropetryInsertText, strEquals)
}

export function cmModulesSuggestionsExact(currentWord: string): Thenable<CompletionItem[]> {
  const cmd = cmake_help_module_list()
  return suggestionsHelper(cmd, currentWord, 'module', cmModuleInsertText, strEquals)
}
