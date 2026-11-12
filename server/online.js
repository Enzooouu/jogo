// Multiplayer online (WebSocket em /ws).
//
// Quem cria a sala recebe um código de 6 números; a outra pessoa entra com
// esse código. Na sala de espera os dois têm 30 segundos: o dono escolhe o
// modo e o mapa, e cada um escolhe o personagem. A partida roda AQUI no
// servidor (o mesmo Game de shared/), com os comandos que chegam dos dois;
// o estado vai para os jogadores umas 30 vezes por segundo.
//
// Mensagens (JSON, campo "t"):
//   jogador -> servidor: create, join {code}, leave, config {mode, mapId},
//     pick {element, hat}, ready {ready}, i {h, p} (botões segurados e
//     apertados, ver shared/input.js), invite {username}
//   servidor -> jogador: hello, lobby, error, start {setup, you}, s {s, e}
//     (estado e eventos), end {result, ...}, invited {from, code}, left

import { WebSocketServer } from 'ws';
import crypto from 'node:crypto';
import { Game } from '../shared/game.js';
import { BotController } from '../shared/ai.js';
import { DT } from '../shared/constants.js';
import { ELEMENTS, enabledElements } from '../shared/elements.js';
import { decodeInput } from '../shared/input.js';
import { gameConfig, snapshotGame, buildOnlineSetup, ONLINE_MODES, mapsFor, RANDOM } from '../shared/net.js';
import { carryAfterWin, isGuardianFloor, guardianOf } from '../shared/tower.js';
import { readCookie, SESSION_COOKIE } from './auth.js';

export const LOBBY_SECONDS = 30;
const REMATCH_SECONDS = 45;       // depois de uma partida: tempo para ver o resultado e escolher de novo
const SNAP_EVERY = 2;             // manda o estado a cada 2 passos (30 por segundo)
const MAX_ROOMS = 500;
const HATS = new Set(['capacete', 'coroa', 'pirata']);
const BITS = 127;                 // 7 botões (ver INPUT_KEYS)

export function createOnline(store, { lobbySeconds = LOBBY_SECONDS, rematchSeconds = REMATCH_SECONDS } = {}) {
  const rooms = new Map();       // código -> sala
  const presence = new Map();    // id da conta -> conexões abertas
  let wss = null;

  // ------------------------------------------------------------ envio

  const send = (conn, msg) => {
    if (conn.ws.readyState === 1) conn.ws.send(typeof msg === 'string' ? msg : JSON.stringify(msg));
  };

  function lobbyMessage(room, conn) {
    return {
      t: 'lobby',
      code: room.code,
      phase: room.phase,
      mode: room.mode,
      mapId: room.mapId,
      host: room.members[0] === conn,
      secondsLeft: room.endsAt ? Math.max(0, Math.ceil((room.endsAt - Date.now()) / 1000)) : null,
      members: room.members.map((m) => ({ name: m.name, element: m.element, ready: m.ready, host: m === room.members[0], you: m === conn })),
    };
  }

  const sendLobby = (room) => {
    for (const m of room.members) send(m, lobbyMessage(room, m));
  };

  // ------------------------------------------------------------ salas

  function newCode() {
    for (let i = 0; i < 50; i++) {
      const code = String(crypto.randomInt(100000, 1000000));
      if (!rooms.has(code)) return code;
    }
    return null;
  }

  function createRoom(conn) {
    leaveRoom(conn);
    if (rooms.size >= MAX_ROOMS) return send(conn, { t: 'error', error: 'O servidor está cheio agora. Tente de novo daqui a pouco.' });
    const code = newCode();
    if (!code) return send(conn, { t: 'error', error: 'Não deu para criar a sala. Tente de novo.' });
    const room = { code, members: [conn], mode: '1x1', mapId: RANDOM, phase: 'waiting', endsAt: null, timer: null, match: null, tower: null };
    rooms.set(code, room);
    joinState(conn, room);
    sendLobby(room);
  }

  function joinState(conn, room) {
    conn.room = room;
    conn.ready = false;
    conn.held = 0;
    conn.press = 0;
  }

  function joinRoom(conn, code) {
    code = String(code ?? '').replace(/\D/g, '');
    const room = rooms.get(code);
    if (!room) return send(conn, { t: 'error', error: 'Não achei nenhuma sala com esse código. Confira os 6 números.' });
    if (room === conn.room) return sendLobby(room);
    if (room.members.length >= 2) return send(conn, { t: 'error', error: 'Essa sala já está cheia.' });
    if (room.phase === 'match') return send(conn, { t: 'error', error: 'A partida dessa sala já começou.' });
    leaveRoom(conn);
    room.members.push(conn);
    joinState(conn, room);
    startLobbyTimer(room, lobbySeconds);
    sendLobby(room);
  }

  function startLobbyTimer(room, seconds) {
    clearTimeout(room.timer);
    room.phase = 'lobby';
    room.endsAt = Date.now() + seconds * 1000;
    room.timer = setTimeout(() => startMatch(room), seconds * 1000);
  }

  function leaveRoom(conn) {
    const room = conn.room;
    if (!room) return;
    conn.room = null;
    room.members = room.members.filter((m) => m !== conn);
    if (room.phase === 'match') {
      // saiu no meio da partida: o outro ganha (na Torre a dupla acaba)
      finishByLeave(room, conn);
    }
    if (!room.members.length) {
      closeRoom(room);
      return;
    }
    clearTimeout(room.timer);
    room.timer = null;
    room.endsAt = null;
    room.phase = 'waiting';
    for (const m of room.members) {
      m.ready = false;
      send(m, { t: 'left', name: conn.name });
    }
    sendLobby(room);
  }

  function closeRoom(room) {
    clearTimeout(room.timer);
    stopLoop(room);
    rooms.delete(room.code);
  }

  // ------------------------------------------------------------ escolhas

  function configRoom(conn, { mode, mapId }) {
    const room = conn.room;
    if (!room || room.members[0] !== conn || room.phase === 'match') return;
    if (mode in ONLINE_MODES) room.mode = mode;
    const maps = mapsFor(room.mode);
    room.mapId = mapId === RANDOM || maps.includes(mapId) ? mapId : maps.includes(room.mapId) ? room.mapId : RANDOM;
    if (room.mode === 'torre') room.mapId = 'torre';
    for (const m of room.members) m.ready = false;
    sendLobby(room);
  }

  function pick(conn, { element, hat }) {
    const room = conn.room;
    if (!room || room.phase === 'match') return;
    if (element === RANDOM || (ELEMENTS[element] && ELEMENTS[element].enabled)) conn.element = element;
    conn.hat = HATS.has(hat) ? hat : null;
    sendLobby(room);
  }

  function setReady(conn, ready) {
    const room = conn.room;
    if (!room || room.phase !== 'lobby') return;
    conn.ready = Boolean(ready);
    if (room.members.length === 2 && room.members.every((m) => m.ready)) startMatch(room);
    else sendLobby(room);
  }

  // ------------------------------------------------------------ partida

  function startMatch(room) {
    clearTimeout(room.timer);
    room.timer = null;
    room.endsAt = null;
    if (room.members.length < 2) {
      room.phase = 'waiting';
      sendLobby(room);
      return;
    }
    const all = enabledElements().map((e) => e.id);
    const humans = room.members.map((m, i) => ({
      id: i + 1,
      name: m.name,
      element: m.element && m.element !== RANDOM ? m.element : all[crypto.randomInt(all.length)],
      hat: m.hat ?? null,
    }));
    if (room.mode === 'torre' && !room.tower) room.tower = { floor: 0, carry: {}, climbInfo: null };
    if (room.mode !== 'torre') room.tower = null;
    const setup = buildOnlineSetup({ mode: room.mode, mapId: room.mapId, humans, rand: () => crypto.randomInt(1e9) / 1e9, tower: room.tower });
    const game = new Game(gameConfig(setup));
    const bots = setup.players.filter((p) => p.isBot)
      .map((p) => new BotController(p.id, { difficulty: setup.difficulty, brain: p.brain ?? null, seed: setup.seed + p.id * 7919 }));
    room.match = { setup, game, bots, tick: 0, events: [], acc: 0, last: performance.now(), ended: false };
    room.phase = 'match';
    room.members.forEach((m, i) => {
      m.pid = i + 1;
      m.held = 0;
      m.press = 0;
      m.ready = false;
      send(m, { t: 'start', setup, you: m.pid, code: room.code });
    });
    stopLoop(room);
    room.loop = setInterval(() => tickRoom(room), 1000 / 60);
  }

  function stopLoop(room) {
    clearInterval(room.loop);
    room.loop = null;
  }

  // passo fixo de 1/60 s, mesmo que o setInterval atrase um pouco
  function tickRoom(room) {
    const match = room.match;
    if (!match || match.ended) return;
    const now = performance.now();
    match.acc += Math.min(0.25, (now - match.last) / 1000);
    match.last = now;
    let steps = 0;
    while (match.acc >= DT && steps < 8) {
      stepMatch(room, match);
      match.acc -= DT;
      steps++;
      if (match.ended) return;
    }
  }

  function stepMatch(room, match) {
    const g = match.game;
    const inputs = {};
    for (const m of room.members) {
      // botão apertado entre dois passos conta como apertado neste passo
      inputs[m.pid] = decodeInput((m.held | m.press) & BITS);
      m.press = 0;
    }
    for (const b of match.bots) inputs[b.playerId] = b.getInput(g);
    g.step(inputs);
    match.tick++;
    const ev = g.drainEvents();
    if (ev.length) match.events.push(...ev);
    if (match.tick % SNAP_EVERY === 0 || g.phase === 'ended') {
      const msg = JSON.stringify({ t: 's', s: snapshotGame(g), e: match.events });
      match.events = [];
      for (const m of room.members) send(m, msg);
    }
    if (g.phase === 'ended') endMatch(room, match);
  }

  function endMatch(room, match) {
    match.ended = true;
    stopLoop(room);
    const result = match.game.result;
    // Torre em dupla: venceram o andar -> sobe (com a subida do elevador)
    if (room.mode === 'torre' && room.tower && result.winnerTeam === 'A' && result.reason !== 'desistencia') {
      const t = room.tower;
      const beat = isGuardianFloor(t.floor);
      for (const p of result.players.filter((x) => !x.isBot)) {
        // quem caiu de vez volta no próximo andar com 1 vida
        const c = carryAfterWin(t.floor, { lives: Math.max(1, p.livesLeft), damage: p.livesLeft > 0 ? p.damage : 0 });
        t.carry[p.id] = { lives: c.lives, damage: c.damage };
      }
      t.climbInfo = { title: beat ? `${guardianOf(t.floor).name.toUpperCase()} DERROTADO!` : `ANDAR ${t.floor} VENCIDO!`, extra: '' };
      t.floor++;
      room.match = null;
      startMatch(room);
      return;
    }
    const floors = room.mode === 'torre' && room.tower ? room.tower.floor : null;
    room.tower = null;
    room.match = null;
    for (const m of room.members) send(m, { t: 'end', result, mode: room.mode, floors, you: m.pid });
    startLobbyTimer(room, rematchSeconds);
    sendLobby(room);
  }

  function finishByLeave(room, conn) {
    const match = room.match;
    if (!match || match.ended) return;
    match.game.forfeit(conn.pid);
    match.ended = true;
    stopLoop(room);
    const result = match.game.result;
    const floors = room.mode === 'torre' && room.tower ? room.tower.floor : null;
    room.tower = null;
    room.match = null;
    for (const m of room.members) send(m, { t: 'end', result, mode: room.mode, floors, you: m.pid, leftBy: conn.name });
  }

  // ------------------------------------------------------------ amigos

  function invite(conn, username) {
    if (!conn.user) return send(conn, { t: 'error', error: 'Entre na sua conta para convidar amigos.' });
    if (!conn.room) return send(conn, { t: 'error', error: 'Crie uma sala antes de convidar.' });
    const friend = store.findUserByName(String(username ?? ''));
    if (!friend || !store.areFriends(conn.user.id, friend.id)) return send(conn, { t: 'error', error: 'Vocês ainda não são amigos.' });
    const conns = presence.get(friend.id);
    if (!conns?.size) return send(conn, { t: 'error', error: `${friend.username} não está online agora.` });
    for (const c of conns) send(c, { t: 'invited', from: conn.name, code: conn.room.code });
    send(conn, { t: 'info', message: `Convite enviado para ${friend.username}!` });
  }

  // ------------------------------------------------------------ conexões

  function onConnection(ws, req) {
    const user = store.userBySession(readCookie(req, SESSION_COOKIE));
    const conn = {
      ws, user,
      name: user?.username ?? `Convidado${crypto.randomInt(1000, 10000)}`,
      room: null, element: null, hat: null, ready: false, held: 0, press: 0, pid: 0, msgs: 0,
    };
    ws.conn = conn;
    if (user) {
      if (!presence.has(user.id)) presence.set(user.id, new Set());
      presence.get(user.id).add(conn);
    }
    send(conn, { t: 'hello', name: conn.name, account: Boolean(user) });

    ws.on('message', (data) => {
      // proteção simples contra flood: no máximo ~200 mensagens por segundo
      if (++conn.msgs > 200) return;
      let msg;
      try {
        msg = JSON.parse(data);
      } catch {
        return;
      }
      handle(conn, msg);
    });
    ws.on('close', () => {
      leaveRoom(conn);
      if (user) {
        const set = presence.get(user.id);
        set?.delete(conn);
        if (!set?.size) presence.delete(user.id);
      }
    });
    ws.on('error', () => {});
  }

  function handle(conn, msg) {
    switch (msg?.t) {
      case 'i':
        conn.held = Number(msg.h) & BITS;
        conn.press |= Number(msg.p) & BITS;
        break;
      case 'create': createRoom(conn); break;
      case 'join': joinRoom(conn, msg.code); break;
      case 'leave': leaveRoom(conn); break;
      case 'config': configRoom(conn, msg); break;
      case 'pick': pick(conn, msg); break;
      case 'ready': setReady(conn, msg.ready); break;
      case 'invite': invite(conn, msg.username); break;
      default: break;
    }
  }

  // zera o contador de mensagens a cada segundo
  const flood = setInterval(() => {
    if (!wss) return;
    for (const ws of wss.clients) if (ws.conn) ws.conn.msgs = 0;
  }, 1000);

  return {
    attach(server) {
      wss = new WebSocketServer({ server, path: '/ws', maxPayload: 4096, perMessageDeflate: { threshold: 512 } });
      wss.on('connection', onConnection);
      return wss;
    },
    isOnline: (userId) => presence.has(userId),
    roomCount: () => rooms.size,
    _rooms: () => rooms,   // só para os testes
    close() {
      clearInterval(flood);
      for (const room of rooms.values()) closeRoom(room);
      wss?.close();
    },
  };
}
