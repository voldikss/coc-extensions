import fs from 'fs'
import { exit } from 'process'

const fsp = fs.promises

//

interface Values {
  name: string
  description: string
}

interface Option {
  name: string
  type: string
  description?: string
  values?: Values
}

const options: Option[] = []

let lines: string[] = [] //
let index = 0 // global file line pointer
const re_option_name_type = /\*\*(\w+)\*\* \(``(\w+)``\)/
const re_option_value = /^\s+Possible values:$/

async function do_options() {}

async function do_option(): Promise<Option> {
  const option = {} as Option

  const [name, type] = await do_option_name_type()
  option.name = name
  option.type = type

  const description = await do_option_description()
  if (description?.length > 0) option.description = description

  return option
}

async function do_option_name_type(): Promise<string[]> {
  const line = lines[index++]
  const group = line.match(re_option_name_type)
  const [_, name, type] = group
  return [name, type]
}

async function do_option_description(): Promise<string> {
  const description = []

  while (true) {
    const line = lines[index++]
    if (re_option_value.test(line)) {
      break
    } else if (re_option_name_type.test(line)) {
      break
    }
    description.push(line)
  }

  return description.join()
}

async function do_values(): Promise<Values> {
  const values = {} as Values
}

async function do_value_name(): Promise<string> {}

async function do_value_description(): Promise<string> {}

async function main() {
  const f = await fsp.readFile('./ClangFormatStyleOptions.rst', 'utf-8')
  lines = f.split('\n')
  for (const line of lines) {
    if (re_option_name_type.test(line)) {
      do_option()
      return
    }
    index++
  }
}

main().catch(console.error)
