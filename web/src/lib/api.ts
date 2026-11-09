const BASE_URL = import.meta.env.VITE_API_URL
const HUB_URL = import.meta.env.VITE_HUB_URL
// Em desenvolvimento não existe o cookie do hub no localhost: dá pra usar um token gerado com
// `npm run dev:token` (pasta api). Em produção isso é ignorado.
const DEV_TOKEN = import.meta.env.DEV ? import.meta.env.VITE_DEV_TOKEN : undefined

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  if (DEV_TOKEN) headers.set('Authorization', `Bearer ${DEV_TOKEN}`)

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers, credentials: 'include' })

  if (res.status === 401) {
    // sem token ou token vencido: volta pro hub pra logar de novo
    if (HUB_URL && !DEV_TOKEN) window.location.href = HUB_URL
    throw new ApiError('Sua sessão expirou. Entre de novo pelo hub.', 401)
  }

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    throw new ApiError(data?.error ?? 'Erro inesperado. Tente de novo.', res.status)
  }

  return data as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  upload: <T>(path: string, formData: FormData) => request<T>(path, { method: 'POST', body: formData }),
}

export function photoUrl(fileName: string) {
  return `${BASE_URL}/uploads/${fileName}`
}

export function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}
