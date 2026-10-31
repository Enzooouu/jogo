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

Na tela inicial (com uma partida de demonstração rodando ao fundo), clique em
**Jogar** → escolha o modo (**1×1, 2×2, 3×3 ou Todos contra todos**) → escolha a **carta** do
elemento do seu time → confira os times na tela **Versus** e clique em **Lutar**.

Primeira vez? Clique em **Tutorial** (o jogo também oferece na primeira vez que
abre). São 11 etapas no Campo de Treino: andar, pular, descer das plataformas,
dash, paredes (com um manequim preto), depois você escolhe o elemento e aprende
a pegar armas, atacar o boneco de treino, lançar a arma, os perigos e como
voltar para a arena. No fim tem um duelo contra um bot fácil.

Você perde uma vida quando **cai lá embaixo** (para fora da ilha) ou num perigo
que mata o seu elemento. Para os lados e para cima não tem limite: quem é
arremessado longe continua voando e só perde a vida se cair.


Teclas padrão (dá para trocar em **Controles**, na tela inicial: cada movimento tem
uma tecla principal, obrigatória, e uma extra, opcional; se a tecla já estiver em
outro movimento, os dois trocam):

| Ação | Teclas |
| --- | --- |
| Andar | `A` `D` ou `←` `→` |
| Pular (2x no ar) | `W` ou `Espaço` |
| Descer da plataforma / cair rápido | `S` ou `↓` |
| Se pendurar na parede (no ar) | segurar a direção da parede |
| Pulo de parede | pular enquanto pendurado |
| Dash (na direção segurada, ex.: ↗ para voltar à ilha) | `Shift esq.` ou `L` |
| Atacar | clique esquerdo ou `J` |
| Arremessar a arma | clique direito ou `K` |
| Placar completo (dano causado, recebido...) | segurar `Tab` |
| Pausar | `Esc` (ou `P`, se não estiver em nenhuma ação) |
| Som liga/desliga | `M` |
| Acelerar (depois de eliminado) | `F` (se não estiver em nenhuma ação) |

Dá para trocar todas essas teclas (menos o `Esc`) em **Controles**, no menu inicial.

**Regras**

- **Time vs Time**: 1×1, 2×2 ou 3×3 contra bots.
- **Todos contra todos**: 4 jogadores, um de cada elemento.
- Cada time é de um elemento só, e dois times nunca têm o mesmo elemento.
- Cada jogador tem 3 vidas. Perde uma vida quem **cai do mapa** ou **toca num perigo mortal**.
- Cada golpe aumenta o dano (%) do alvo; quanto mais dano, mais longe ele voa.
- Foi arremessado? Use o **dash** (1 no ar; recarrega ao pisar no chão ou se pendurar na parede; o Ar tem 2) e se pendure na parede para subir.
- A câmera se afasta sozinha quando alguém sai da área principal.
- Vence o time que eliminar o outro. Se o tempo (4 min) acabar, vence quem tem mais vidas.

**Elementos e perigos**

| Elemento | Imune a | Morre em | Machuca (+6%/s) | Jeito de jogar |
| --- | --- | --- | --- | --- |
| Fogo | Lava | Água | Espinhos | equilibrado; armas queimam |
| Água | Água | Lava | Espinhos | equilibrado; armas deixam lento (no chão) |
| Terra | Espinhos | Lava, Água | — | mais lento e pesado (voa menos, vento empurra metade), não fica atordoado; armas atordoam |
| Ar | Vento | Lava, Água | Espinhos | mais rápido e pula mais alto; tornado puxa os inimigos |
| Mortal | — | Lava, Água | Espinhos | sem poder nenhum (o vento empurra inteiro) e armas padrão sem efeito, mas **bate 25% mais forte**; visual do manequim preto; vitória: **Soco Final** (um punho gigante racha a tela como vidro) |

- **Espinhos** (em cima da plataforma do meio) não matam: somam 6% de dano por segundo.
- **Vento**: rajadas aparecem em lugares aleatórios (com 1 s de aviso piscando) e
  empurram para fora da ilha. Ande contra o vento para resistir.

**Combinações:** quando disparos de cajado de elementos diferentes se encontram no
ar, eles se combinam: Fogo + Água viram **vapor** (os dois somem); nos outros pares o
disparo mais forte continua e ganha o efeito do outro ao acertar — **tornado de fogo**
e **pedra de magma** queimam, **lama** e **tempestade** deixam lento e **tempestade de
areia** atordoa.

**Armas** caem do céu numa caixa de paraquedas (sem mostrar o que tem dentro). Quando
a caixa bate no chão ela se quebra e a arma fica caída no chão: encoste para pegar.
O efeito muda com o seu elemento.
Se você arremessar a arma e ela não acertar ninguém (nem cair para fora do mapa,
na lava ou na água), ela fica no chão como uma espada, cajado ou lança universal, sem
time, e quem pegar recebe ela com as mesmas cargas que tinha:

| Arma | Fogo | Água | Terra | Ar | Mortal |
| --- | --- | --- | --- | --- | --- |
| Espada | Lâmina Flamejante: queima | Lâmina da Maré: empurra mais e deixa lento | Espadão de Pedra: dano alto, atordoa | Lâmina do Vento: rápida e longa | Espada: sem efeito |
| Cajado | Bola de Fogo: explode e queima | Jato d'Água: atravessa e empurra | Pedrada: arco, atordoa | Tornado: lento, atravessa e puxa | Cajado: esfera de força, sem efeito |
| Lança (investida para a frente; no ar 1 vez por pulo) | Lança Ígnea: queima | Tridente da Maré: deixa lento | Lança de Rocha: forte, atordoa | Lança do Vento: investida mais longa | Lança: sem efeito |

**Mapas:** na tela antes da luta (Versus) escolha **Caldeira** ou **Pico dos Ventos**
(ilhas no céu, plataformas penduradas em balões que balançam em arco quando
alguém anda em cima ou o vento bate, correntes de vento que atravessam o mapa
de ponta a ponta além das rajadas comuns, lava, lago e espinhos no meio).

**Modo ADM (testes):** em Configurações, ligue "Modo ADM (testes)". Cada golpe seu
passa a dar 999% de dano, você tem pulos e dashes no ar infinitos e o seu
lutador fica intangível: nenhum golpe, lava,
água, espinho ou vento pega nele (cair lá embaixo ainda tira vida). Os
bots continuam normais e essas partidas não contam nas estatísticas da conta.

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
  maps.js        mapas (plataformas, perigos, pontos de nascimento)
  maps-treino.js arenas do tutorial (Campo de Treino)
  tutorial.js    as 11 etapas do tutorial (tarefa de cada uma)
  input.js       formato do comando de um jogador (teclado, bot ou rede)
public/        Navegador
  js/main.js     telas e fluxo (menu, partida, resultado, login, perfil)
  js/match.js    laço da partida (passo fixo de 1/60 s)
  js/screens/    telas (tutorial, controles, versus, conta...)
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
