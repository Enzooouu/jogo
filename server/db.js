// Banco de dados SQLite usando o módulo nativo do Node (node:sqlite),
// então não precisa compilar nada na instalação.
//
// Para mudar o esquema no futuro, adicione um item novo no fim de
// MIGRATIONS (nunca edite os antigos): o banco aplica só o que falta.

import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const MIGRATIONS = [
  // 1: contas, sessões, estatísticas e histórico de partidas
  `
  CREATE TABLE users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE sessions (
    token_hash  TEXT PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at  TEXT NOT NULL
  );
  CREATE INDEX sessions_user ON sessions(user_id);

  CREATE TABLE stats (
    user_id        INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    matches_played INTEGER NOT NULL DEFAULT 0,
    wins           INTEGER NOT NULL DEFAULT 0,
    losses         INTEGER NOT NULL DEFAULT 0,
    draws          INTEGER NOT NULL DEFAULT 0,
    kills          INTEGER NOT NULL DEFAULT 0,
    deaths         INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE element_usage (
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    element     TEXT NOT NULL,
    matches     INTEGER NOT NULL DEFAULT 0,
    last_played TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, element)
  );

  CREATE TABLE matches (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mode        TEXT NOT NULL,
    element     TEXT NOT NULL,
    team_size   INTEGER NOT NULL,
    max_kills   INTEGER NOT NULL,
    max_deaths  INTEGER NOT NULL,
    status      TEXT NOT NULL DEFAULT 'em_andamento',
    result      TEXT,
    kills       INTEGER,
    deaths      INTEGER,
    started_at  TEXT NOT NULL DEFAULT (datetime('now')),
    finished_at TEXT
  );
  CREATE INDEX matches_user ON matches(user_id, id);
  `,
];

export function openDatabase(file) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 3000');
  if (file !== ':memory:') db.exec('PRAGMA journal_mode = WAL');
  migrate(db);
  return db;
}

function migrate(db) {
  const { user_version: current } = db.prepare('PRAGMA user_version').get();
  for (let v = current; v < MIGRATIONS.length; v++) {
    transaction(db, () => {
      db.exec(MIGRATIONS[v]);
      db.exec(`PRAGMA user_version = ${v + 1}`);
    });
  }
}

export function transaction(db, fn) {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
