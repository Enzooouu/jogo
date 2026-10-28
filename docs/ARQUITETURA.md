# Arquitetura

## Ideia central: a simulação não sabe quem está jogando

```
 Teclado ─┐
 Bot ─────┼──► comando { left, right, up, down, attack, throw } ──► Game.step() ──► estado
 Rede* ───┘                                                                         │
                                                         Renderer (canvas) ◄────────┘
```

- **`shared/game.js`** é a partida inteira: física, combate, armas, perigos,
  vidas e fim de jogo. Não desenha nada e não lê teclado. A cada passo
  (1/60 s) recebe um comando por jogador e atualiza o estado.
- O mesmo arquivo roda no **navegador** (jogo local) e no **Node** (testes e,
  no futuro, servidor do online). Por isso tudo em `shared/` usa só
  JavaScript puro, sem `window` nem `document`.
- **Comandos** têm um formato único (`shared/input.js`). Teclado, bots e
  jogadores remotos produzem o mesmo objeto. `encodeInput()` compacta em
  1 número (1 bit por botão) para mandar pela rede.
- **Aleatoriedade com semente** (`shared/rng.js`): mesma semente + mesmos
  comandos = mesma partida. Há um teste garantindo isso.
- **Eventos** (`game.drainEvents()`): golpes, K.O., armas pegas etc. O
  cliente usa para partículas e sons; o servidor poderá repassar aos jogadores.
- **`game.snapshot()`** devolve o estado em objeto simples, pronto para
  `JSON.stringify` e envio pela rede.

## Como adicionar coisas

| Quero... | Onde |
| --- | --- |
| Liberar Terra e Ar | `shared/elements.js` (`enabled: true`), efeitos em `shared/weapons.js`, desenho da cabeça em `public/js/render/fighter.js` |
| Novo perigo (espinhos, vento) | tipo em `HAZARDS`, reação em `HAZARD_REACTION`, retângulo no mapa, desenho em `public/js/render/stage.js` |
| Nova arma | `WEAPONS` em `shared/weapons.js` (melee ou ranged) + ícone no renderer |
| Novo mapa | `MAPS` em `shared/maps.js` |
| Liberar "Todos contra todos" | o motor já suporta (`mode: 'ffa'`, testado); falta tirar o `disabled` do botão em `public/index.html` |
| Mudar o banco | nova entrada no fim de `MIGRATIONS` em `server/db.js` |

## Plano para o multiplayer online (WebSocket)

O código já está separado do jeito que o online precisa. Passos sugeridos
(continua tudo em JavaScript; só entra o pacote `ws`):

1. **Servidor de salas** — `server/realtime/room.js`: cada sala cria um
   `new Game(...)` (o mesmo de `shared/game.js`) e roda `step()` 60 vezes por
   segundo com `setInterval`. O servidor é a autoridade: ninguém consegue
   trapacear mexendo no próprio navegador.
2. **Conexão** — `server/realtime/ws.js`: `new WebSocketServer({ server })`
   usando o mesmo servidor HTTP de `server/index.js`. Na conexão, leia o
   cookie `sid` e use `store.userBySession()` para saber quem é o jogador
   (a mesma sessão do login).
3. **Mensagens**
   - cliente → servidor: `{ t: 'input', tick, bits: encodeInput(comando) }`
   - servidor → clientes: `{ t: 'state', snap: game.snapshot(), events }`
     cerca de 20–30 vezes por segundo.
4. **Cliente** — `public/js/net/remote.js`: em vez do `MatchRunner` rodar o
   `Game` localmente, ele aplica os snapshots recebidos e o `Renderer`
   desenha (interpolando entre dois snapshots para ficar suave). O
   `KeyboardController` continua igual; só que o comando vai para o socket.
5. **Bots no online** — `BotController` (`shared/ai.js`) roda no servidor
   para completar salas.
6. **Estatísticas** — no fim da partida o próprio servidor chama
   `store.finishMatch()` para cada jogador logado (sem depender do cliente,
   como acontece hoje no modo local).

Melhorias depois do básico: previsão do lado do cliente (o seu boneco
responde na hora e é corrigido pelo servidor) e fila de partidas.

## Contas e segurança

- Senha: `bcryptjs` (implementação de bcrypt em JavaScript puro, sem
  compilação) com custo 12. Login com usuário inexistente também roda o
  bcrypt, para não revelar pelo tempo de resposta quais nomes existem.
- Sessão: token aleatório de 32 bytes no cookie `sid` (`HttpOnly`,
  `SameSite=Lax`, `Secure` quando servido por HTTPS). No banco fica só o
  SHA-256 do token. Expira em 30 dias.
- Rotas que alteram dados só aceitam JSON (bloqueia formulários de outros sites).
- Limite de 20 tentativas de login/cadastro a cada 15 min por IP.
- Partidas: o jogo pede um id ao começar e só pode finalizar esse id uma vez;
  kills e mortes são conferidos contra o máximo possível da partida. No modo
  local o resultado ainda vem do navegador; no online virá do servidor.
