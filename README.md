# coc-translator

Translation extension for [coc.nvim](https://github.com/neoclide/coc.nvim).
Inspired by [vim-translator](https://github.com/voldikss/vim-translator)

![](https://user-images.githubusercontent.com/20282795/72232547-b56be800-35fc-11ea-980a-3402fea13ec1.png)

## Install

```
:CocInstall coc-translator
```

## Features

- Multiple translator engines
- Export translation history
- View and process translation history via CocList
- Proxy support(see [coc.nvim doc](https://github.com/neoclide/coc.nvim/blob/master/doc/coc.txt#L113-L119))

## Configuration

- `translator.toLang`: Target language, default: `'zh'`
- `translator.engines`: Translation engines, default: `['bing', 'iciba', 'google', 'youdao', 'haici']`
- `translator.maxsize`: Max count of history items, default: 5000
- `translator.window.maxWidth`: Max width of the translation floating window, default: `0.6*&columns`
- `translator.window.maxHeight`: Max height of the translation floating window, default: `0.6*&lines`

more information, see [package.json](https://github.com/voldikss/coc-translator/blob/master/package.json)

## Engines

| engine | supported language types |
| ------ | ------------------------ |
| bing   | [ref][1]                 |
| iciba  | [ref][2]                 |
| google | [ref][3]                 |
| youdao | [ref][4]                 |
| haici  |                          |

## Keymaps

Example

```vim
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
- `:CocCommand translator.exportHistory` Export translation history in the tabpage

**Note:** `[text]` is optional, if no `text`, the extension will use the `<word>` under the cursor.

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

## F.A.Q

Q: Where are the translation data stored?

A: Normally the data is saved in `~/.config/coc/extensions/coc-translation-data`, but if you set `g:coc_extension_root` to another location, it will change as well

## Screenshots

![](https://user-images.githubusercontent.com/20282795/68870604-1b8bda00-0736-11ea-862f-2b2989d0c1fe.png)
![](https://user-images.githubusercontent.com/20282795/68870605-1b8bda00-0736-11ea-9442-3a910ab7a6cf.png)

[1]: https://github.com/voldikss/vim-translate-me/wiki/bing-api
[2]: https://github.com/voldikss/vim-translate-me/wiki/Ciba-api
[3]: https://github.com/voldikss/vim-translate-me/wiki/Google-api
[4]: https://github.com/voldikss/vim-translate-me/wiki/Youdao-api

## License

MIT
