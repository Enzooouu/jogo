# Elementum — instruções para o Claude

## Como trabalhar com o usuário
- Responder sempre em português do Brasil, de forma simples (o usuário está aprendendo).
- **Sempre que terminar uma parte do trabalho, terminar a mensagem com uma sugestão do que fazer em seguida.**
- Se não entender algo do pedido, perguntar antes de fazer.
- Se precisar de outra linguagem de programação além de JavaScript, perguntar antes.
- Testar sozinho antes de entregar (`npm test` e o jogo no navegador).
- Depois de mudanças no jogo, atualizar também a versão online (página publicada sem servidor, só modo convidado) e o `docs/index.html` (o mesmo jogo num arquivo só, publicado no GitHub Pages em https://enzooouu.github.io/jogo/).
- Commits só no nome do Enzo (autor `Enzooouu <200690972+Enzooouu@users.noreply.github.com>`, o e-mail escondido do GitHub; nunca usar o e-mail pessoal), sem linhas "Co-Authored-By" nem "Claude-Session" na mensagem.

## Projeto
- Node.js + Express, SQLite (`node:sqlite`), HTML5 Canvas com JavaScript puro, sem framework.
- Simulação em `shared/` (roda no navegador e no Node), desenho em `public/js/render/`, servidor em `server/`.
- Detalhes em `README.md` e `docs/ARQUITETURA.md`.
