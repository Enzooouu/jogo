# Elementum

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
**Jogar** → escolha o modo (**1×1, 2×2, 3×3, Todos contra todos ou Treino livre**) → escolha a **carta** do
elemento do seu time (ou a carta **?**, que sorteia o elemento a cada partida) → escolha o **mapa**
num carrossel com a prévia animada de cada um (o primeiro cartão, **Aleatório**, sorteia o mapa) →
confira os times na tela **Versus** e clique em **Lutar**. Nas telas de carta e de mapa, ← → trocam
a escolha e Enter continua.

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
- **Rei da Ilha** (2 × 2): uma área brilhante com uma coroa fica **fixa no centro** do mapa (no trono do Castelo e no topo de ouro da Pirâmide). O time que estiver **sozinho** dentro dela ganha 1 ponto por segundo; com gente dos dois times ela fica **disputada** e ninguém pontua. Vence quem chegar a **60 pontos**, ou quem tiver mais pontos depois de 3 minutos. Ninguém perde vida: quem cai volta depois de um tempinho. Os bots também disputam a área. O Rei da Ilha tem **mapas só dele** (e não usa os dos outros modos): **Castelo do Rei** (pátio ao pôr do sol, liso dos lados e descendo até embaixo; a **sala do trono** fica numa torre no meio, lá no alto, com telhado pontudo, cortinas e o trono, e é onde fica a área da coroa; duas pontes de madeira penduradas por cordas nos lados ajudam a subir; e as duas torres ficam bem longe, quase na borda do mapa, para não atrapalhar quem cai) e **Pirâmide do Sol** (pirâmide no deserto ao meio-dia com **rampas** lisas dos dois lados até o topo de ouro, faixas de hieróglifos, porta no pé, estátuas de gato e dois blocos de arenito flutuando dos lados; no fundo, pirâmides iluminadas pelo sol, uma esfinge deitada, uma caravana de camelos andando na duna e uma cidade antiga com templo, casinhas de barro e o oásis).
- **Treino livre**: tem um mapa só dele, o Campo de Treino (depois da carta já vai direto para a luta). Você treina num **espantalho preso ao chão** (não sai do lugar, só balança na estaca) e pode virar ele num **boneco solto** (que voa longe) com **T** ou com o botão do painel. Sem tempo e sem perder vida. O painel mostra o dano do último golpe, o combo, o maior combo, o dano total e a % do alvo. **R** zera o alvo e **1 2 3 4** fazem cair uma espada, cajado, lança ou marretão do seu lado. Dá para **trocar de personagem** sem sair do treino: clique num dos 5 bonecos do painel ou aperte **C** para ir para o próximo elemento. Não conta nas estatísticas.

**Controle (gamepad):** é só ligar um controle de Xbox, PlayStation ou parecido (fio ou Bluetooth) e apertar um botão; aparece "Controle conectado". Na luta: analógico ou direcional anda (para baixo desce), **A/✕** ou **Y/△** pula, **X/▢** ataca, **B/◯** lança a arma, **LB/RB/LT/RT** dão dash, **Start** pausa e **Select** (segurar) mostra o placar. Nos menus o direcional anda entre as opções, **A** confirma e **B** volta. No treino livre: **Select** faz cair a próxima arma, **L3** troca espantalho/boneco e **R3** zera o alvo. Funciona junto com o teclado.

**Celular e tablet:** abra o jogo no navegador do celular e deixe ele **deitado** (de pé aparece "Gire o celular" e a luta pausa). Na luta aparece um **joystick** na esquerda (encoste o dedo em qualquer lugar da metade esquerda e arraste; puxando bem para baixo desce da plataforma) e na direita os botões **PULAR**, **BATER**, **DASH** e **ARMA** (lançar a arma), que dá para apertar junto com o joystick. Em cima ficam **❚❚** (pausar) e **☰** (segurar para ver o placar). A luta abre em tela cheia quando dá. No treino livre o painel ganha os botões **Cair arma** e **Zerar alvo**, e o tutorial mostra os botões da tela em vez das teclas. Os menus ficam mais compactos em tela baixa.
- Cada time é de um elemento só, e dois times nunca têm o mesmo elemento.
- Cada jogador tem 3 vidas. Perde uma vida quem **cai do mapa** ou **toca num perigo mortal**.
- Cada golpe aumenta o dano (%) do alvo; quanto mais dano, mais longe ele voa.
- Foi arremessado? Use o **dash** (1 no ar; recarrega ao pisar no chão ou se pendurar na parede) e se pendure na parede para subir.
- A câmera se afasta sozinha quando alguém sai da área principal.
- Vence o time que eliminar o outro. Se o tempo (4 min) acabar, vence quem tem mais vidas.

**Elementos e perigos**

| Elemento | Imune a | Morre em | Machuca (+6%/s) | Jeito de jogar |
| --- | --- | --- | --- | --- |
| Fogo | Lava | Água | Espinhos | equilibrado; armas queimam |
| Água | Água | Lava | Espinhos | equilibrado; armas deixam lento (no chão) |
| Terra | Espinhos | Lava, Água | — | mais lento e pesado (voa menos, vento empurra metade), não fica atordoado; armas atordoam |
| Ar | Vento | Lava, Água | Espinhos | mais rápido e pula mais alto; tornado puxa os inimigos |
| Mortal | — | Lava, Água | Espinhos | sem poder nenhum (o vento empurra inteiro) e armas padrão sem efeito, mas **bate 40% mais forte** e é um pouco mais pesado; visual do manequim preto; vitória: **Soco Final** (um punho gigante racha a tela como vidro) |

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
| **Marretão** (rara, só 1 golpe; demora para bater, mas dá 30 de dano e faz uma onda de choque no chão) | Marretão Vulcânico: queima | Marretão da Ressaca: empurra mais e deixa lento | Marretão de Pedra: 34 de dano, atordoa | Marretão do Furacão: mais rápido | Marretão: sem efeito |

**Mapas:** na tela de mapas escolha **Caldeira**, **Campo Aberto** (fim de tarde dourado no interior, com plantações em retalhos (verdes, trigo e terra arada), montanhas serrilhadas com neve no topo e pessoinhas fazendo trilha lá em cima, vilinha, rio, moinho girando, vacas, ovelhas e um balão no céu; sem piscina, espinho nem vento: duas ilhas com um buraco no meio, onde ficava uma ponte que quebrou, e uma plataforma de madeira no alto; só vale derrubar o outro) **Pico dos Ventos**, **Lago Congelado** (noite de neve com aurora boreal: o gelo do meio **escorrega** e tem peixes, ossos, fósseis e armas velhas presos dentro; as margens de neve são firmes. Quem cai arremessado no gelo, quem cai de bem alto ou quem leva um golpe forte em pé no gelo **racha o gelo**: na 3ª pancada ele quebra e abre um buraco de água gelada por 10 s. As **plataformas de gelo derretem** com alguém em cima e voltam depois. De vez em quando vem uma **nevasca** na diagonal (com aviso), **pingentes** caem das plataformas e aparecem **montinhos de neve**: quem passa pega 3 **bolas de neve** (arremessa com a tecla de arremessar, sem arma na mão), que dão 1 de dano (3 no Fogo) e empurram; em quem é de Água ela devolve 1 de vida) **Navio Voador** (dois navios piratas voando acima das nuvens, com um vão no meio que se atravessa pulando; os navios sobem e descem e os mastros balançam, levando junto a verga e a gávea, e no convés quem está parado escorrega um pouco; perto do tombadilho de cada navio fica um **canhão** que, a cada 14 s, atira em arco por cima do vão: antes aparece o caminho da bala pontilhado e um alvo vermelho no tombadilho do outro navio, onde a bala cai e explode, e quem estiver no caminho é arremessado; tem timão no tombadilho e hélices na popa) ou **Coliseu** (palco de pedra sobre o fosso, colunas quebradas, velário listrado e a torcida dividida pelos 5 elementos pulando; a **torcida joga as armas** em vez das caixas, e a arma que acertar alguém no caminho dá dano e empurra; embaixo do palco fica o **fosso** com portões de ferro, tochas e os pilares; no palco, armas velhas caídas, rachaduras e o medalhão dos 4 elementos; o **imperador** faz joinha quando alguém derruba alguém e polegar para baixo quando alguém cai sozinho; **morte súbita** depois de 2:30 de luta: o palco se abre e os pilares caem (sobram dois pedaços e a laje do alto) e sobem paredes de espinhos até o céu nas pontas, que **matam** quem encosta)
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
