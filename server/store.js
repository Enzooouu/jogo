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

    friendRow: db.prepare('SELECT status FROM friendships WHERE user_id = ? AND friend_id = ?'),
    insertFriend: db.prepare("INSERT OR REPLACE INTO friendships (user_id, friend_id, status) VALUES (?, ?, ?)"),
    deleteFriend: db.prepare('DELETE FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)'),
    friends: db.prepare(`
      SELECT u.id, u.username FROM friendships f JOIN users u ON u.id = f.friend_id
      WHERE f.user_id = ? AND f.status = 'aceito' ORDER BY u.username COLLATE NOCASE`),
    incoming: db.prepare(`
      SELECT u.id, u.username FROM friendships f JOIN users u ON u.id = f.user_id
      WHERE f.friend_id = ? AND f.status = 'pendente' ORDER BY f.created_at`),
    outgoing: db.prepare(`
      SELECT u.id, u.username FROM friendships f JOIN users u ON u.id = f.friend_id
      WHERE f.user_id = ? AND f.status = 'pendente' ORDER BY f.created_at`),
    friendCount: db.prepare("SELECT COUNT(*) AS n FROM friendships WHERE user_id = ?"),
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

    // ------------------------------------------------ amigos
    areFriends: (a, b) => q.friendRow.get(a, b)?.status === 'aceito',
    friendList: (userId) => ({
      friends: q.friends.all(userId).map((r) => ({ id: r.id, username: r.username })),
      incoming: q.incoming.all(userId).map((r) => r.username),
      outgoing: q.outgoing.all(userId).map((r) => r.username),
    }),
    friendCount: (userId) => q.friendCount.get(userId).n,
    // Pede amizade. Se o outro já tinha pedido para você, vira amizade na hora.
    // Devolve 'pedido' | 'aceito' | 'ja_amigos' | 'ja_pedido'
    requestFriend(userId, friendId) {
      return transaction(db, () => {
        if (q.friendRow.get(userId, friendId)?.status === 'aceito') return 'ja_amigos';
        if (q.friendRow.get(friendId, userId)?.status === 'pendente') {
          q.insertFriend.run(friendId, userId, 'aceito');
          q.insertFriend.run(userId, friendId, 'aceito');
          return 'aceito';
        }
        if (q.friendRow.get(userId, friendId)) return 'ja_pedido';
        q.insertFriend.run(userId, friendId, 'pendente');
        return 'pedido';
      });
    },
    // Aceita o pedido que `friendId` mandou para `userId`
    acceptFriend(userId, friendId) {
      return transaction(db, () => {
        if (q.friendRow.get(friendId, userId)?.status !== 'pendente') return false;
        q.insertFriend.run(friendId, userId, 'aceito');
        q.insertFriend.run(userId, friendId, 'aceito');
        return true;
      });
    },
    // Desfaz amizade, recusa ou cancela pedido (nos dois sentidos)
    removeFriend: (userId, friendId) => q.deleteFriend.run(userId, friendId, friendId, userId).changes > 0,

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
