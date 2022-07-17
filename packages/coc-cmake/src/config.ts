import { workspace } from 'coc.nvim'

export default function getConfig<T>(key: string, defaultValue?: any): T {
  const cmake_conf = workspace.getConfiguration('cmake')
  return cmake_conf.get<T>(key, defaultValue)
}
