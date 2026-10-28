// Rotas da API (/api/...). Respostas sempre em JSON.

import express from 'express';
import { ELEMENTS } from '../shared/elements.js';
import { MODES, PLAYER } from '../shared/constants.js';
import {
  hashPassword, verifyPassword, validateUsername, validatePassword,
  setSessionCookie, clearSessionCookie, requireUser, rateLimit,
} from './auth.js';

const RESULTS = new Set(['vitoria', 'derrota', 'empate']);

export function createApi(store) {
  const api = express.Router();

  // Só aceitamos JSON nas rotas que mudam algo. Junto com o cookie
  // SameSite=Lax isso impede que outro site envie formulários em seu nome.
  api.use((req, res, next) => {
    if (req.method === 'POST' && !req.is('application/json')) {
      return res.status(415).json({ error: 'Envie os dados em JSON.' });
    }
    next();
  });
  api.use(express.json({ limit: '10kb' }));

  const authLimit = rateLimit({
    max: 20,
    windowMs: 15 * 60 * 1000,
    message: 'Muitas tentativas. Espere alguns minutos e tente de novo.',
  });

  // ------------------------------------------------------------ contas

  api.post('/auth/register', authLimit, async (req, res) => {
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

  api.post('/auth/login', authLimit, async (req, res) => {
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
      maxKills: enemies * PLAYER.lives,
      maxDeaths: PLAYER.lives,
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
