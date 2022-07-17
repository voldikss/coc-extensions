/* tslint:disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export interface CMake {
  /**
   * Path to CMake generator executable
   */
  'cmake.cmakePath'?: string
  /**
   * Path to [cmake-format](https://github.com/cheshirekow/cmake_format)
   */
  'cmake.formatter'?: string
  /**
   * Additional arguments to be passed down to the formatter
   */
  'cmake.formatter_args'?: string[]
  /**
   * Enable language server(https://github.com/regen100/cmake-language-server), Notice that the functionality(completion, formatting, etc.) of lsp and extension builtin can not coexist
   */
  'cmake.lsp.enable'?: boolean
  /**
   * Path to [cmake-language-server](https://github.com/regen100/cmake-language-server)
   */
  'cmake.lsp.serverPath'?: string
  /**
   * See https://github.com/regen100/cmake-language-server#configuration
   */
  'cmake.lsp.buildDirectory'?: string
  [k: string]: unknown
}
