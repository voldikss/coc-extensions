# coc-github

Github issue source for [coc.nvim](https://github.com/neoclide/coc.nvim)

**NOTE:**

**[coc-git](https://github.com/neoclide/coc-git) now has this feature included and it provides more other useful functionalities, please use coc-git instead.**

![](https://user-images.githubusercontent.com/20282795/58370347-0331c400-7f38-11e9-8bb4-9ade97aad37e.png)

## Install 

```vim
CocInstall coc-github
```

## Usage

In your git commit message: 

- Type "#" to trigger issues of the current github repository

- Filter candidates with either issue numbers or issue titles

# Config

```jsonc
"coc.github.enable": {
    "type": "boolean",
    "default": true
},
"coc.github.priority": {
    "type": "number",
    "default": 99
},
"coc.github.filetypes": {
    "type": "array",
    "default": [
    "gitcommit"
    ]
}
```

# Todo

- [ ] Use cache to improve the speed
- [ ] Support cross repo issues
- [ ] Support private repo
- [ ] Support GitLab
- [ ] Support AzureDevOps

## References

Inspired by [deoplete-github](https://github.com/SevereOverfl0w/deoplete-github)

## License

MIT
