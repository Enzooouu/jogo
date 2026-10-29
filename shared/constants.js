// Constantes da simulação. Este arquivo (e toda a pasta /shared) roda tanto
// no navegador quanto no Node, para que no futuro o servidor possa rodar a
// mesma simulação no modo online (servidor autoritativo via WebSocket).

export const TICK_RATE = 60;            // passos de simulação por segundo
export const DT = 1 / TICK_RATE;        // duração de um passo (segundos)

export const PHYS = {
  gravity: 2300,          // px/s²
  maxFall: 1000,          // velocidade máxima de queda
  fastFall: 1250,         // segurando "baixo" no ar
  moveSpeed: 330,         // velocidade horizontal máxima
  groundAccel: 3200,
  airAccel: 1900,
  groundFriction: 2800,
  airDrag: 320,
  hitstunDrag: 140,       // atrito horizontal enquanto atordoado
  jumpSpeed: 800,
  doubleJumpSpeed: 720,
  maxJumps: 2,            // pulo + pulo duplo
  wallHangTime: 0.35,     // tempo parado ao se pendurar na parede
  wallSlideSpeed: 150,    // velocidade máxima escorregando na parede
  wallJumpSpeed: 740,     // pulo de parede (para cima)
  wallJumpPush: 300,      // pulo de parede (para longe da parede)
  wallJumpLock: 0.14,     // tempo em que o impulso vale mais que o direcional
  dashSpeed: 820,         // velocidade do dash
  dashTime: 0.16,         // duração do dash (sem gravidade)
  dashCooldown: 0.55,     // intervalo mínimo entre dashes
  airDashes: 1,           // dashes no ar até pisar no chão ou se pendurar na parede
};

export const PLAYER = {
  width: 30,
  height: 66,
  lives: 3,
  respawnTime: 1.6,       // segundos fora antes de reaparecer
  invulnTime: 2.0,        // invencibilidade após reaparecer
  killCreditTime: 6,      // até quantos segundos depois do último golpe a kill conta
  pickupCooldown: 0.4,    // tempo sem pegar arma depois de arremessar
  adminDamage: 999,       // dano de cada golpe no modo ADM (testes)
};

export const MATCH = {
  countdown: 3,           // "3, 2, 1, LUTA!"
  timeLimit: 240,         // 4 minutos; depois disso vence quem tem mais vidas
  endDelay: 4,            // comemoração do vencedor antes da tela de resultado
};

export const ITEMS = {
  spawnMin: 5,            // intervalo entre armas caindo (segundos)
  spawnMax: 9,
  firstSpawn: 3,
  maxOnMap: 3,
  fallSpeed: 150,         // queda lenta (caixote com paraquedas)
  lifetime: 15,           // some se ninguém pegar
};

// Modos de jogo. 'ffa' (todos contra todos) já funciona no motor, só falta
// liberar no menu.
export const MODES = {
  times: { id: 'times', name: 'Time vs Time', teams: true },
  ffa: { id: 'ffa', name: 'Todos contra todos', teams: false },
};
