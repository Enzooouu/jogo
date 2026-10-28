// Senhas (bcrypt), validação de cadastro, cookie de sessão e limite de
// tentativas de login.

import bcrypt from 'bcryptjs';
import { SESSION_DAYS } from './store.js';

export const BCRYPT_ROUNDS = 12;
export const SESSION_COOKIE = 'sid';

// Hash usado quando o usuário não existe, para o login demorar o mesmo
// tempo e não revelar quais nomes estão cadastrados.
const DUMMY_HASH = bcrypt.hashSync('senha-que-ninguem-usa', BCRYPT_ROUNDS);

export function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash ?? DUMMY_HASH);
}

export function validateUsername(username) {
  if (typeof username !== 'string') return 'Informe um nome de usuário.';
  if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {
    return 'O usuário deve ter de 3 a 20 caracteres: letras sem acento, números ou _.';
  }
  return null;
}

export function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 6) return 'A senha precisa ter pelo menos 6 caracteres.';
  // O bcrypt só considera os primeiros 72 bytes.
  if (Buffer.byteLength(password, 'utf8') > 72) return 'A senha pode ter no máximo 72 caracteres.';
  return null;
}

// ---------------------------------------------------------------- cookie

export function readCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i === -1) continue;
    if (part.slice(0, i).trim() === name) {
      try {
        return decodeURIComponent(part.slice(i + 1).trim());
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function setSessionCookie(req, res, token) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: req.secure,
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearSessionCookie(req, res) {
  res.clearCookie(SESSION_COOKIE, { httpOnly: true, sameSite: 'lax', secure: req.secure, path: '/' });
}

// ---------------------------------------------------------------- middleware

export function loadUser(store) {
  return (req, _res, next) => {
    req.sessionToken = readCookie(req, SESSION_COOKIE);
    req.user = store.userBySession(req.sessionToken);
    next();
  };
}

export function requireUser(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Você precisa entrar na sua conta.' });
  next();
}

// Limite simples em memória: N tentativas por janela de tempo, por chave.
export function rateLimit({ max, windowMs, message }) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip;
    let entry = hits.get(key);
    if (!entry || entry.reset <= now) {
      entry = { count: 0, reset: now + windowMs };
      hits.set(key, entry);
    }
    entry.count++;
    if (hits.size > 10000) {
      for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
    }
    if (entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.reset - now) / 1000)));
      return res.status(429).json({ error: message });
    }
    next();
  };
}
