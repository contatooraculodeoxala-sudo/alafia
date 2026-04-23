function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('alafia_token')
}

async function req(method: string, path: string, body?: unknown) {
  const token = getToken()
  const res = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }))
    throw new Error((err as any).error || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  get: (path: string) => req('GET', `/api${path}`),
  post: (path: string, body: unknown) => req('POST', `/api${path}`, body),
  put: (path: string, body: unknown) => req('PUT', `/api${path}`, body),
  delete: (path: string) => req('DELETE', `/api${path}`),
}

export const authApi = {
  login: (email: string, senha: string) =>
    req('POST', '/auth/login', { email, senha }),
}

export const publicApi = {
  cadastrar: (data: unknown) =>
    req('POST', '/publico/clientes/publico/cadastro', data),
}

export class ApiError extends Error {
  constructor(public status: number, public statusText: string, public data?: unknown) {
    super(`API Error: ${status} ${statusText}`)
    this.name = 'ApiError'
  }
}
