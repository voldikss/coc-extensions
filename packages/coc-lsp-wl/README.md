# coc-lsp-wl

Coc.nvim client for Wolfram Language Server, fork of [vscode-lsp-wl](https://github.com/kenkangxgwe/vscode-lsp-wl)

# Installation

- Install [Wolfram Language Server](https://github.com/kenkangxgwe/lsp-wl)

- Install this extension
  ```
  CocInstall coc-lsp-wl
  ```

# Configuration

```jsonc
"lsp-wl.enable": {
    "type": "boolean",
    "default": true,
    "description": "whether enable wolfram language lsp"
},
"lsp-wl.port": {
    "type": "number",
    "default": 6536,
    "description": "Port to communicate with language server."
},
"lsp-wl.trace.server": {
    "type": "string",
    "enum": ["off", "messages", "verbose"],
    "default": "off",
    "description": "Traces the communication between coc and the wolfram language server."
},
"lsp-wl.wolframExecutablePath": {
    "type": "string",
    "default": "wolfram",
    "description": "Path to wolfram executable."
},
"lsp-wl.wolframLanguageServerPath": {
    "type": "string",
    "default": "/path/to/lsp-wl",
    "description": "Path to wolfram language server directory."
},
"lsp-wl.maxNumberOfProblems": {
    "type": "number",
    "default": 100,
    "description": "Controls the maximum number of problems produced by the server."
}
```

# Screenshots

![](https://user-images.githubusercontent.com/20282795/62026404-84922500-b20d-11e9-88a3-2196428987c0.png)
![](https://user-images.githubusercontent.com/20282795/62032075-56b3dd00-b21b-11e9-8d8a-05c6e4f17eac.png)

for better syntax highlight support, refer to [vim-mma](https://github.com/voldikss/vim-mma)
