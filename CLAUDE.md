# Brawl dos Elementos — instruções para o Claude

## Como trabalhar com o usuário
- Responder sempre em português do Brasil, de forma simples (o usuário está aprendendo).
- **Sempre que terminar uma parte do trabalho, terminar a mensagem com uma sugestão do que fazer em seguida.**
- Se não entender algo do pedido, perguntar antes de fazer.
- Se precisar de outra linguagem de programação além de JavaScript, perguntar antes.
- Testar sozinho antes de entregar (`npm test` e o jogo no navegador).
- Depois de mudanças no jogo, atualizar também a versão online (página publicada sem servidor, só modo convidado).

## Projeto
- Node.js + Express, SQLite (`node:sqlite`), HTML5 Canvas com JavaScript puro, sem framework.
- Simulação em `shared/` (roda no navegador e no Node), desenho em `public/js/render/`, servidor em `server/`.
- Detalhes em `README.md` e `docs/ARQUITETURA.md`.
