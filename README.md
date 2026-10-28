# Brawl dos Elementos (nome provisório)

Jogo de luta 2D com plataformas que roda no navegador. Mistura Brawlhalla
(dano acumulado e arremessar o inimigo para fora do mapa), Fireboy and
Watergirl (cada elemento morre num perigo diferente) e Supreme Duelist
Stickman (bonecos de palito).

## Como rodar

Precisa do **Node.js 22.13 ou mais novo** (recomendado: Node 24 LTS).

```bash
npm install
npm start
```

Abra **http://localhost:3000** no navegador.

- `npm run dev` reinicia o servidor sozinho quando você salva um arquivo.
- `npm test` roda os testes (simulação do jogo e API de contas).
- Porta diferente: `PORT=8080 npm start` (no Windows PowerShell: `$env:PORT=8080; npm start`).
- `http://localhost:3000/?debug` mostra caixas de colisão e FPS.

## Como jogar

| Ação | Teclas |
| --- | --- |
| Andar | `A` `D` ou `←` `→` |
| Pular (2x no ar) | `W`, `↑` ou `Espaço` |
| Descer da plataforma / cair rápido | `S` ou `↓` |
| Se pendurar na parede (no ar) | segurar a direção da parede |
| Pulo de parede | pular enquanto pendurado |
| Atacar | clique esquerdo, `J` ou `Z` |
| Arremessar a arma | clique direito, `K` ou `X` |
| Placar completo (dano causado, recebido...) | segurar `Tab` |
| Pausar | `Esc` ou `P` |
| Som liga/desliga | `M` |
| Acelerar (depois de eliminado) | `F` |

**Regras**

- Partida **Time vs Time**: você + 1 bot contra 2 bots (dá para escolher 3v3 e 4v4).
- Cada time é de um elemento só, e dois times nunca têm o mesmo elemento (hoje: Fogo contra Água).
- Cada jogador tem 3 vidas. Perde uma vida quem **cai do mapa** ou **toca num perigo mortal**.
- Cada golpe aumenta o dano (%) do alvo; quanto mais dano, mais longe ele voa.
- Foi arremessado? Segure na direção da ilha para se pendurar na parede e pule para subir.
- A câmera se afasta sozinha quando alguém sai da área principal.
- Vence o time que eliminar o outro. Se o tempo (4 min) acabar, vence quem tem mais vidas.

**Elementos e perigos**

| Elemento | Imune a | Morre em |
| --- | --- | --- |
| Fogo | Lava | Água |
| Água | Água | Lava |
| Terra *(em breve)* | Espinhos | Vento |
| Ar *(em breve)* | Vento | Espinhos |

**Armas** caem do céu de paraquedas. Encoste para pegar. O efeito muda com o seu elemento:

| Arma | Com Fogo | Com Água |
| --- | --- | --- |
| Espada | Lâmina Flamejante: mais dano e queima o alvo | Lâmina da Maré: empurra mais e deixa o alvo lento |
| Cajado | Bola de Fogo: explode em área e queima | Jato d'Água: atravessa inimigos e empurra muito |

## Contas e estatísticas

- Cadastro e login com usuário e senha (botões no canto do menu).
- A senha é guardada só como **hash bcrypt** (custo 12), nunca em texto puro.
- A sessão fica num cookie `HttpOnly`; no banco fica só o hash do token.
- Por conta são salvos: vitórias, derrotas, empates, partidas jogadas, kills,
  mortes e elemento mais usado (tela **Perfil**). Atualiza no fim de cada partida.
- Sem conta dá para jogar como convidado (nada é salvo).
- O banco SQLite fica em `data/brawl.db` (criado sozinho). Para outro lugar: `DB_PATH=/caminho/arquivo.db`.

## Estrutura

```
shared/        Simulação do jogo (roda no navegador E no Node)
  game.js        regras, física, combate, armas, vidas, fim de partida
  ai.js          bots
  elements.js    elementos e tabela de perigos
  weapons.js     armas e efeito por elemento
  maps.js        mapa (plataformas, perigos, pontos de nascimento)
  input.js       formato do comando de um jogador (teclado, bot ou rede)
public/        Navegador
  js/main.js     telas e fluxo (menu, partida, resultado, login, perfil)
  js/match.js    laço da partida (passo fixo de 1/60 s)
  js/render/     desenho no canvas
  js/input/      teclado
  js/api.js      chamadas à API
server/        Node + Express
  index.js       servidor HTTP
  api.js         rotas /api (contas, perfil, partidas)
  auth.js        bcrypt, cookie de sessão, limite de tentativas
  store.js       consultas SQL
  db.js          conexão SQLite e migrações
tests/         Testes automáticos (node --test)
docs/          Arquitetura e plano do multiplayer online
```

Detalhes da arquitetura e o passo a passo para o modo online com WebSocket
estão em [docs/ARQUITETURA.md](docs/ARQUITETURA.md).
