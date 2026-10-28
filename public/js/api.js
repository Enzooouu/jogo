// Chamadas à API do servidor (contas e estatísticas).

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(method, url, body) {
  let res;
  try {
    res = await fetch(url, {
      method,
      credentials: 'same-origin',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Sem conexão com o servidor.', 0);
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(data?.error ?? `Erro ${res.status}`, res.status);
  return data;
}

export const api = {
  me: () => request('GET', '/api/auth/me'),
  register: (username, password) => request('POST', '/api/auth/register', { username, password }),
  login: (username, password) => request('POST', '/api/auth/login', { username, password }),
  logout: () => request('POST', '/api/auth/logout', {}),
  profile: () => request('GET', '/api/profile'),
  startMatch: (info) => request('POST', '/api/matches', info),
  finishMatch: (id, summary) => request('POST', `/api/matches/${id}/finish`, summary),
};
