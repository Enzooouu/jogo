// Servidor HTTP: entrega o jogo (arquivos estáticos) e a API de contas.
//
// Para o multiplayer online, o servidor WebSocket pode ser ligado a este
// mesmo servidor HTTP (ver docs/ARQUITETURA.md).

import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDatabase } from './db.js';
import { createStore } from './store.js';
import { createApi } from './api.js';
import { loadUser } from './auth.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function createApp({ db }) {
  const store = createStore(db);
  const app = express();
  app.disable('x-powered-by');
  // Atrás de um proxy (ex.: hospedagem), use TRUST_PROXY=1 para o IP real.
  if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);

  app.use((_req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'same-origin',
      'Content-Security-Policy':
        "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
    });
    next();
  });

  app.use(loadUser(store));
  app.use('/api', createApi(store));

  // /shared roda no navegador e no servidor (mesma simulação dos dois lados)
  app.use('/shared', express.static(path.join(ROOT, 'shared')));
  app.use(express.static(path.join(ROOT, 'public')));

  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido.' });
    console.error(err);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  });

  return app;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const port = Number(process.env.PORT) || 3000;
  const dbFile = process.env.DB_PATH || path.join(ROOT, 'data', 'brawl.db');
  const db = openDatabase(dbFile);
  const server = createApp({ db }).listen(port, () => {
    console.log(`Brawl dos Elementos rodando em http://localhost:${port}`);
    console.log(`Banco de dados: ${dbFile}`);
  });
  const shutdown = () => {
    server.close();
    db.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
