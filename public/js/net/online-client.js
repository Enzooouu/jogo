// Conexão com o servidor online (WebSocket em /ws). Guarda quem está
// ouvindo cada tipo de mensagem (lobby, start, s, end, invited...).

export class OnlineClient {
  constructor() {
    this.ws = null;
    this.ready = null;
    this.name = null;
    this.account = false;
    this.handlers = new Map();
  }

  get connected() {
    return this.ws?.readyState === 1;
  }

  connect() {
    if (this.ws && this.ws.readyState <= 1) return this.ready;
    const url = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
    let ws;
    try {
      ws = new WebSocket(url);
    } catch {
      return Promise.reject(new Error('Não deu para conectar ao servidor online.'));
    }
    this.ws = ws;
    this.ready = new Promise((resolve, reject) => {
      ws.addEventListener('open', () => resolve(), { once: true });
      ws.addEventListener('error', () => reject(new Error('Não deu para conectar ao servidor online.')), { once: true });
    });
    ws.addEventListener('message', (ev) => {
      let msg;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }
      if (msg.t === 'hello') {
        this.name = msg.name;
        this.account = msg.account;
      }
      this.emit(msg.t, msg);
    });
    ws.addEventListener('close', () => {
      if (this.ws === ws) this.ws = null;
      this.emit('close', {});
    });
    return this.ready;
  }

  // reconecta (ex.: depois de entrar na conta, para o servidor saber quem é)
  reconnect() {
    const old = this.ws;
    this.ws = null;
    old?.close();
    return this.connect();
  }

  on(type, fn) {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type).add(fn);
    return () => this.handlers.get(type)?.delete(fn);
  }

  emit(type, msg) {
    for (const fn of this.handlers.get(type) ?? []) fn(msg);
  }

  send(msg) {
    if (this.connected) this.ws.send(JSON.stringify(msg));
  }
}
