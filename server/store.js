// Todas as consultas ao banco ficam aqui. As rotas só chamam estas funções.

import crypto from 'node:crypto';
import { transaction } from './db.js';

export const SESSION_DAYS = 30;

export function createStore(db) {
  const q = {
    insertUser: db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)'),
    insertStats: db.prepare('INSERT INTO stats (user_id) VALUES (?)'),
    userByName: db.prepare('SELECT id, username, password_hash, created_at FROM users WHERE username = ?'),
    userById: db.prepare('SELECT id, username, created_at FROM users WHERE id = ?'),

    insertSession: db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, datetime('now', ?))"),
    sessionUser: db.prepare(`
      SELECT u.id, u.username, u.created_at FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > datetime('now')`),
    deleteSession: db.prepare('DELETE FROM sessions WHERE token_hash = ?'),
    purgeSessions: db.prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')"),

    stats: db.prepare('SELECT matches_played, wins, losses, draws, kills, deaths FROM stats WHERE user_id = ?'),
    elements: db.prepare('SELECT element, matches FROM element_usage WHERE user_id = ? ORDER BY matches DESC, last_played DESC'),
    recent: db.prepare(`
      SELECT id, mode, element, team_size, result, kills, deaths, finished_at FROM matches
      WHERE user_id = ? AND status = 'finalizada' ORDER BY id DESC LIMIT ?`),

    insertMatch: db.prepare('INSERT INTO matches (user_id, mode, element, team_size, max_kills, max_deaths) VALUES (?, ?, ?, ?, ?, ?)'),
    match: db.prepare('SELECT * FROM matches WHERE id = ? AND user_id = ?'),
    finishMatch: db.prepare(`
      UPDATE matches SET status = 'finalizada', result = ?, kills = ?, deaths = ?, finished_at = datetime('now')
      WHERE id = ? AND status = 'em_andamento'`),
    addStats: db.prepare(`
      UPDATE stats SET matches_played = matches_played + 1,
        wins = wins + ?, losses = losses + ?, draws = draws + ?,
        kills = kills + ?, deaths = deaths + ?
      WHERE user_id = ?`),
    useElement: db.prepare(`
      INSERT INTO element_usage (user_id, element, matches) VALUES (?, ?, 1)
      ON CONFLICT (user_id, element) DO UPDATE SET matches = matches + 1, last_played = datetime('now')`),
  };

  return {
    // ------------------------------------------------ usuários
    createUser(username, passwordHash) {
      return transaction(db, () => {
        const { lastInsertRowid } = q.insertUser.run(username, passwordHash);
        const id = Number(lastInsertRowid);
        q.insertStats.run(id);
        return q.userById.get(id);
      });
    },
    findUserByName: (username) => q.userByName.get(username) ?? null,
    findUserById: (id) => q.userById.get(id) ?? null,

    // ------------------------------------------------ sessões
    // O token vai no cookie; no banco fica só o hash dele.
    createSession(userId) {
      const token = crypto.randomBytes(32).toString('base64url');
      q.insertSession.run(hashToken(token), userId, `+${SESSION_DAYS} days`);
      return token;
    },
    userBySession: (token) => (token ? q.sessionUser.get(hashToken(token)) ?? null : null),
    deleteSession: (token) => { if (token) q.deleteSession.run(hashToken(token)); },
    purgeExpiredSessions: () => q.purgeSessions.run(),

    // ------------------------------------------------ estatísticas
    profile(userId, recentLimit = 10) {
      const user = q.userById.get(userId);
      if (!user) return null;
      const s = q.stats.get(userId);
      const elements = q.elements.all(userId).map((r) => ({ element: r.element, matches: r.matches }));
      return {
        user: { id: user.id, username: user.username, createdAt: user.created_at },
        stats: {
          matchesPlayed: s.matches_played,
          wins: s.wins,
          losses: s.losses,
          draws: s.draws,
          kills: s.kills,
          deaths: s.deaths,
          favoriteElement: elements[0]?.element ?? null,
        },
        elements,
        recent: q.recent.all(userId, recentLimit).map((r) => ({
          id: r.id, mode: r.mode, element: r.element, teamSize: r.team_size,
          result: r.result, kills: r.kills, deaths: r.deaths, finishedAt: r.finished_at,
        })),
      };
    },

    // ------------------------------------------------ partidas
    startMatch(userId, { mode, element, teamSize, maxKills, maxDeaths }) {
      const { lastInsertRowid } = q.insertMatch.run(userId, mode, element, teamSize, maxKills, maxDeaths);
      return Number(lastInsertRowid);
    },
    getMatch: (matchId, userId) => q.match.get(matchId, userId) ?? null,

    // Fecha a partida e soma nas estatísticas, tudo junto (ou nada).
    finishMatch(match, { result, kills, deaths }) {
      return transaction(db, () => {
        const { changes } = q.finishMatch.run(result, kills, deaths, match.id);
        if (changes === 0) return false;   // já tinha sido finalizada
        q.addStats.run(
          result === 'vitoria' ? 1 : 0,
          result === 'derrota' ? 1 : 0,
          result === 'empate' ? 1 : 0,
          kills,
          deaths,
          match.user_id,
        );
        q.useElement.run(match.user_id, match.element);
        return true;
      });
    },
  };
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
