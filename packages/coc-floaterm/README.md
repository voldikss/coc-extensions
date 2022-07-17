# coc-floaterm

![publish](https://github.com/voldikss/coc-floaterm/workflows/publish/badge.svg)
[![npm version](https://badge.fury.io/js/coc-floaterm.svg)](https://badge.fury.io/js/coc-floaterm)

coc.nvim extension for [vim-floaterm](https://github.com/voldikss/vim-floaterm)

![](https://user-images.githubusercontent.com/20282795/75005925-fcc27f80-54aa-11ea-832e-59ea5b02fc04.gif)

# Use cases

- CocList for all opened floaterms
- Completion from opened floaterms

## Requirements

- [coc.nvim](https://github.com/neoclide/coc.nvim)
- [vim-floaterm](https://github.com/voldikss/vim-floaterm)

## Install

```
:CocInstall coc-floaterm
```

## Configurations

- `floaterm.completion.enable`:
  default: `true`

- `floaterm.completion.shortcut`:
  default: `"floaterm"`

- `floaterm.completion.priority`:
  default: `5`

## CocList

Try `:CocList floaterm`

- `open`
- `preview`

## Commands

Removed `:CocCommand floaterm.xxx`

## License

MIT
