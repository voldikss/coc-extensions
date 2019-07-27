# coc-translator

Translation extension for [coc.nvim](https://github.com/neoclide/coc.nvim)

Inspired by [vim-translate-me](https://github.com/voldikss/vim-translate-me)

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
- `translator.engines`: Translation engines, default: `['bing', 'ciba', 'google']`
- `translator.maxsize`: Max count of history items, default: 5000

more information, see [package.json](https://github.com/voldikss/coc-translator/blob/master/package.json)

## Engines

| engine                 | needs id/key | supported languages |
| ---------------------- | ------------ | ------------------- |
| bing                   | no           | [language list][1]  |
| ciba                   | no           | [language list][2]  |
| google                 | no           | [language list][3]  |
| youdao(not usable yet) | no           | [language list][4]  |

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

## License

MIT

## Screenshots

![](https://user-images.githubusercontent.com/20282795/60753425-931d6000-a004-11e9-8506-47b15c3d2c8a.png)
![](https://user-images.githubusercontent.com/20282795/60385979-6b893d80-9ac2-11e9-821f-c656dd38c9fa.png)
![](https://user-images.githubusercontent.com/20282795/60385982-6f1cc480-9ac2-11e9-8519-448c6d9c77e4.png)
![](https://user-images.githubusercontent.com/20282795/60385983-704df180-9ac2-11e9-9912-96f302f66474.png)

[1]: https://github.com/voldikss/vim-translate-me/wiki/bing-api
[2]: https://github.com/voldikss/vim-translate-me/wiki/Ciba-api
[3]: https://github.com/voldikss/vim-translate-me/wiki/Google-api
[4]: https://github.com/voldikss/vim-translate-me/wiki/Youdao-api
