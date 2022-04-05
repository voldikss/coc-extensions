set nocompatible

set runtimepath+=/home/alan/.cache/nvim/plugged/coc.nvim
set runtimepath+=/home/alan/code/coc-translator


" common configs
"=============================================================================
let g:mapleader = ';'
nnoremap <silent>       Q         :qa!<CR>
nnoremap <silent> <Leader>m :messages<CR>

" coc-translator configs
"=============================================================================
" popup
nmap <Leader>t <Plug>(coc-translator-p)
vmap <Leader>t <Plug>(coc-translator-pv)
" echo
nmap <Leader>e <Plug>(coc-translator-e)
vmap <Leader>e <Plug>(coc-translator-ev)
" replace
nmap <Leader>r <Plug>(coc-translator-r)
vmap <Leader>r <Plug>(coc-translator-rv)

filetype plugin indent on
syntax on
