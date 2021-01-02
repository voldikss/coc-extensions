# coc-translator

Translation extension for [coc.nvim](https://github.com/neoclide/coc.nvim).

![publish](https://github.com/voldikss/coc-translator/workflows/publish/badge.svg)
[![npm version](https://badge.fury.io/js/coc-translator.svg)](https://badge.fury.io/js/coc-translator)

![](https://user-images.githubusercontent.com/20282795/103474126-b8e31b00-4ddb-11eb-916b-2e2d7b2b29e0.png)

## Install

```
:CocInstall coc-translator
```

**NOTE:** No need to install vim-translator

## Features

- Multiple translator engines
- Translation history(CocList)
- Proxy support(see [coc.nvim doc](https://github.com/neoclide/coc.nvim/blob/master/doc/coc.txt#L113-L119))

## Configuration

```jsonc
"translator.toLang": {
  "type": "string",
  "default": "zh",
  "description": "Target language type"
},
"translator.engines": {
  "type": "array",
  "default": [
    "bing",
    "google",
    "youdao",
    "haici"
  ]
},
"translator.enableBorder": {
  "type": "boolean",
  "default": true
},
"translator.enableHover": {
  "type": "boolean",
  "default": false,
  "description": "Translate when mouse hover"
},
"translator.window.maxWidth": {
  "type": "number",
  "default": 999
},
"translator.window.maxHeight": {
  "type": "number",
  "default": 999
}
```

## Engines

| engine            | supported language types |
| ----------------- | ------------------------ |
| bing              | [ref][1]                 |
| iciba(deprecated) | [ref][2]                 |
| google            | [ref][3]                 |
| youdao            | [ref][4]                 |
| haici             |                          |

## Keymaps

Example

```vim
" NOTE: do NOT use `nore` mappings
" popup
nmap <Leader>t <Plug>(coc-translator-p)
vmap <Leader>t <Plug>(coc-translator-pv)
" echo
nmap <Leader>e <Plug>(coc-translator-e)
vmap <Leader>e <Plug>(coc-translator-ev)
" replace
nmap <Leader>r <Plug>(coc-translator-r)
vmap <Leader>r <Plug>(coc-translator-rv)
```

## Commands

- `:CocCommand translator.popup [text]` Display translation result via floating/popup window
- `:CocCommand translator.echo [text]` Echo the translation result in the cmdline
- `:CocCommand translator.replace [text]` Replace the word under the cursor with the translation
- `:CocCommand translator.exportHistory` Export translation history

**Note:** `[text]` is optional, if it's not given, use the `<cword>` (the word under the cursor).

## Work with translation lists

run `:CocList translation` to open the translation list.

- Filter your translation items and perform operations via `<Tab>`
- Use operation `delete` to delete the translation item under the cursor
- Use operation `yank` to yank ...
- Use operation `jumpto` to jump to the location where you've performed translating
- Use operation `append` to append the word to the end of cursor position
- Use operation `pretend` to pretend ...

[1]: https://github.com/voldikss/vim-translate-me/wiki/bing-api
[2]: https://github.com/voldikss/vim-translate-me/wiki/Ciba-api
[3]: https://github.com/voldikss/vim-translate-me/wiki/Google-api
[4]: https://github.com/voldikss/vim-translate-me/wiki/Youdao-api

## References

- [vim-translator](https://github.com/voldikss/vim-translator)

## License

MIT
