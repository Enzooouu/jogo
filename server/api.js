// Rotas da API (/api/...). Respostas sempre em JSON.

import express from 'express';
import { checkProgress } from './progress.js';
import { ELEMENTS } from '../shared/elements.js';
import { MODES, PLAYER } from '../shared/constants.js';
import {
  hashPassword, verifyPassword, validateUsername, validatePassword,
  setSessionCookie, clearSessionCookie, requireUser, rateLimit, clientIp,
} from './auth.js';

const RESULTS = new Set(['vitoria', 'derrota', 'empate']);

export function createApi(store, online = null) {
  const api = express.Router();

  // Só aceitamos JSON nas rotas que mudam algo. Junto com o cookie
  // SameSite=Lax isso impede que outro site envie formulários em seu nome.
  api.use((req, res, next) => {
    if (req.method === 'POST' && !req.is('application/json')) {
      return res.status(415).json({ error: 'Envie os dados em JSON.' });
    }
    next();
  });
  // o progresso é maior que o resto (tem o histórico do perfil)
  api.use('/progress', express.json({ limit: '80kb' }));
  api.use(express.json({ limit: '10kb' }));

  // login: só conta as tentativas erradas, por endereço + conta (quem tenta
  // adivinhar a senha de uma conta é bloqueado; um colega da mesma escola,
  // que sai pelo mesmo endereço de internet, não é atrapalhado)
  const loginLimit = rateLimit({
    max: 10,
    windowMs: 15 * 60 * 1000,
    failuresOnly: true,
    key: (req) => `${clientIp(req)}|${String(req.body?.username ?? '').toLowerCase().slice(0, 40)}`,
    message: 'Muitas tentativas erradas. Espere alguns minutos e tente de novo.',
  });
  // e um teto geral de erros por endereço (contra quem tenta várias contas)
  const loginIpLimit = rateLimit({
    max: 60,
    windowMs: 15 * 60 * 1000,
    failuresOnly: true,
    message: 'Muitas tentativas erradas daqui. Espere alguns minutos e tente de novo.',
  });
  // cadastro: limite folgado por endereço (escolas dividem o mesmo endereço)
  const registerLimit = rateLimit({
    max: 40,
    windowMs: 60 * 60 * 1000,
    message: 'Muitas contas criadas daqui. Espere um pouco e tente de novo.',
  });

  api.post('/auth/register', registerLimit, async (req, res) => {
    const { username, password } = req.body ?? {};
    const error = validateUsername(username) ?? validatePassword(password);
    if (error) return res.status(400).json({ error });
    if (store.findUserByName(username)) {
      return res.status(409).json({ error: 'Esse nome de usuário já está em uso.' });
    }
    const hash = await hashPassword(password);
    let user;
    try {
      user = store.createUser(username, hash);
    } catch (err) {
      // Dois cadastros ao mesmo tempo com o mesmo nome
      if (String(err.message).includes('UNIQUE')) {
        return res.status(409).json({ error: 'Esse nome de usuário já está em uso.' });
      }
      throw err;
    }
    setSessionCookie(req, res, store.createSession(user.id));
    res.status(201).json({ user: publicUser(user) });
  });

  api.post('/auth/login', loginIpLimit, loginLimit, async (req, res) => {
    const { username, password } = req.body ?? {};
    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Informe usuário e senha.' });
    }
    const user = store.findUserByName(username);
    const ok = await verifyPassword(password, user?.password_hash);
    if (!user || !ok) return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
    store.purgeExpiredSessions();
    setSessionCookie(req, res, store.createSession(user.id));
    res.json({ user: publicUser(user) });
  });

  api.post('/auth/logout', (req, res) => {
    store.deleteSession(req.sessionToken);
    clearSessionCookie(req, res);
    res.status(204).end();
  });

  api.get('/auth/me', (req, res) => {
    res.json({ user: req.user ? publicUser(req.user) : null });
  });

  // ------------------------------------------------------------ perfil

  api.get('/profile', requireUser, (req, res) => {
    res.json(store.profile(req.user.id));
  });

  // ------------------------------------------------------------ progresso
  // Nível, XP, conquistas, coleção e foto ficam guardados na conta.

  const progressLimit = rateLimit({ max: 120, windowMs: 10 * 60 * 1000, key: (req) => `p${req.user.id}`, message: 'Muitas gravações. Espere um pouco.' });

  api.get('/progress', requireUser, (req, res) => {
    const p = store.getProgress(req.user.id);
    res.json(p ? { data: p.data, rev: p.rev } : { data: null, rev: null });
  });

  api.post('/progress', requireUser, progressLimit, (req, res) => {
    const { data, rev } = req.body ?? {};
    const old = store.getProgress(req.user.id);
    // alguém (o administrador) mexeu: o jogo pega a versão do servidor
    if ((old?.rev ?? null) !== (rev ?? null)) {
      return res.status(409).json({ error: 'Seu progresso mudou no servidor.', data: old?.data ?? null, rev: old?.rev ?? null });
    }
    const error = checkProgress(data, old);
    if (error) return res.status(422).json({ error, data: old?.data ?? null, rev: old?.rev ?? null });
    const next = store.saveProgress(req.user.id, data, old ? old.rev : null);
    if (next == null) return res.status(409).json({ error: 'Tente de novo.' });
    res.json({ rev: next });
  });

  // ------------------------------------------------------------ amigos

  const MAX_FRIENDS = 200;
  const friendLimit = rateLimit({ max: 60, windowMs: 10 * 60 * 1000, message: 'Muitos pedidos de amizade. Espere um pouco.' });

  api.get('/friends', requireUser, (req, res) => {
    const list = store.friendList(req.user.id);
    res.json({
      friends: list.friends.map((f) => ({ username: f.username, online: online?.isOnline(f.id) ?? false })),
      incoming: list.incoming,
      outgoing: list.outgoing,
    });
  });

  const friendTarget = (req, res) => {
    const { username } = req.body ?? {};
    const other = typeof username === 'string' ? store.findUserByName(username.trim()) : null;
    if (!other) {
      res.status(404).json({ error: 'Não achei ninguém com esse nome de usuário.' });
      return null;
    }
    if (other.id === req.user.id) {
      res.status(400).json({ error: 'Você não pode adicionar você mesmo.' });
      return null;
    }
    return other;
  };

  api.post('/friends/add', requireUser, friendLimit, (req, res) => {
    const other = friendTarget(req, res);
    if (!other) return;
    if (store.friendCount(req.user.id) >= MAX_FRIENDS) return res.status(400).json({ error: 'Você chegou ao limite de amigos.' });
    const status = store.requestFriend(req.user.id, other.id);
    const message = {
      pedido: `Pedido de amizade enviado para ${other.username}.`,
      aceito: `Agora você e ${other.username} são amigos!`,
      ja_amigos: `Você e ${other.username} já são amigos.`,
      ja_pedido: `Você já mandou um pedido para ${other.username}.`,
    }[status];
    res.json({ status, message });
  });

  api.post('/friends/accept', requireUser, (req, res) => {
    const other = friendTarget(req, res);
    if (!other) return;
    if (!store.acceptFriend(req.user.id, other.id)) return res.status(404).json({ error: 'Esse pedido não existe mais.' });
    res.json({ message: `Agora você e ${other.username} são amigos!` });
  });

  api.post('/friends/remove', requireUser, (req, res) => {
    const other = friendTarget(req, res);
    if (!other) return;
    store.removeFriend(req.user.id, other.id);
    res.json({ message: 'Pronto.' });
  });

  // ------------------------------------------------------------ partidas
  // O jogo avisa quando a partida começa (recebe um id) e quando termina.
  // Cada id só pode ser finalizado uma vez, e os números são conferidos
  // contra o máximo possível naquela partida.

  api.post('/matches', requireUser, (req, res) => {
    const { mode, element, teamSize } = req.body ?? {};
    if (!MODES[mode]) return res.status(400).json({ error: 'Modo de jogo inválido.' });
    if (!ELEMENTS[element]?.enabled) return res.status(400).json({ error: 'Elemento inválido.' });
    if (!Number.isInteger(teamSize) || teamSize < 1 || teamSize > 4) {
      return res.status(400).json({ error: 'Tamanho de time inválido.' });
    }
    const enemies = mode === 'ffa' ? teamSize * 2 - 1 : teamSize;
    const matchId = store.startMatch(req.user.id, {
      mode,
      element,
      teamSize,
      // Rei da Ilha: ninguém perde vida, então dá para cair (e derrubar) bem mais
      maxKills: MODES[mode].hill ? 99 : enemies * PLAYER.lives,
      maxDeaths: MODES[mode].hill ? 99 : PLAYER.lives,
    });
    res.status(201).json({ matchId });
  });

  api.post('/matches/:id/finish', requireUser, (req, res) => {
    const matchId = Number(req.params.id);
    const match = Number.isInteger(matchId) ? store.getMatch(matchId, req.user.id) : null;
    if (!match) return res.status(404).json({ error: 'Partida não encontrada.' });
    if (match.status !== 'em_andamento') return res.status(409).json({ error: 'Essa partida já foi registrada.' });

    const { result, kills, deaths } = req.body ?? {};
    if (!RESULTS.has(result)) return res.status(400).json({ error: 'Resultado inválido.' });
    if (!Number.isInteger(kills) || kills < 0 || kills > match.max_kills) {
      return res.status(400).json({ error: 'Número de kills inválido.' });
    }
    if (!Number.isInteger(deaths) || deaths < 0 || deaths > match.max_deaths) {
      return res.status(400).json({ error: 'Número de mortes inválido.' });
    }

    if (!store.finishMatch(match, { result, kills, deaths })) {
      return res.status(409).json({ error: 'Essa partida já foi registrada.' });
    }
    res.json(store.profile(req.user.id));
  });

  api.use((req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
  return api;
}

function publicUser(user) {
  return { id: user.id, username: user.username, createdAt: user.created_at };
}
