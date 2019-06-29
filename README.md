# coc-translator

Translation extension for [coc.nvim](https://github.com/neoclide/coc.nvim)

Ported from [vim-translate-me](https://github/voldikss/vim-translate-me)

## Install

```
:CocInstall coc-translator
```

## Features

- Multiple translator engines
- Export translation history
- View and process translation history via CocList
- Proxy support(see [coc.txt](https://github.com/neoclide/coc.nvim/blob/master/doc/coc.txt#L113-L119))

## Configuration

- `translator.toLang`: Target language, default: `'zh'`
- `translator.engine`: Translation engine, default: `'google'`
- `translator.appId`: AppID of translation API
- `translator.appKey`: AppKey of translation API
- `translator.maxsize`: Max count of history items, default: 5000

more information, see [package.json](https://github.com/voldikss/coc-translator/blob/master/package.json)

## Engines

| engine | needs id/key | supported languages | note                  |
|--------|--------------|---------------------|-----------------------|
| ciba   | no           | [language list][3]  | -                     |
| google | no           | -                   | -                     |
| youdao | yes          | [language list][4]  | [apply for id/key][5] |
| baidu  | yes          | [language list][1]  | [apply for id/key][2] |

## Keymaps

Example

```vim
" popup 
nmap <Leader>t <Plug>(coc-translator-p)
" echo 
nmap <Leader>e <Plug>(coc-translator-e)
" replace
nmap <Leader>r <Plug>(coc-translator-r)
```

## Commands

- `:CocCommand translator.popup` Display translation result via floating window or preview window
- `:CocCommand translator.echo` Echo the translation result in the cmdline
- `:CocCommand translator.replace` Replace the word under the cursor with the translation
- `:CocCommand translator.exportHistory` Export translation history in the tabpage

## Work with translation lists

run `:CocList translation` to open the translation list.

- Filter your translation items and perform operations via `<Tab>`
- Use operation `delete` to delete the translation item under the cursor
- Use operation `yank` to yank ...
- Use operation `open` to open the file which contains the query word
- Use operation `preview` to preview ...
- Use operation `append` to append the word to the end of cursor position
- Use operation `pretend` to pretend ...

For more advance usage, checkout `:h coc-list`

## Todo

- [ ] Syntax highlight
- [ ] Visual select translation

## License

MIT

[1]: https://github.com/voldikss/vim-translate-me/wiki/Baidu-api
[2]: https://api.fanyi.baidu.com/api/trans/product/apidoc
[3]: https://github.com/voldikss/vim-translate-me/wiki/Ciba-api
[4]: https://github.com/voldikss/vim-translate-me/wiki/Youdao-api
[5]: https://ai.youdao.com/docs/doc-trans-api.s#p07
