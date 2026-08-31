export interface ApiError extends Error {
  status: number
  code: string
}

let csrf = ''

export function setCsrf(token: string): void {
  csrf = token
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {}
  if (body !== undefined && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  if (csrf !== '') {
    headers['X-CSRF-Token'] = csrf
  }
  const res = await fetch(path, {
    method,
    headers,
    credentials: 'same-origin',
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
  })
  const data = (await res.json().catch(() => null)) as { ok?: boolean; data?: T; error?: { message?: string; code?: string } } | null
  if (!res.ok || !data?.ok) {
    const err = new Error(data?.error?.message ?? `Request failed (${res.status})`) as ApiError
    err.status = res.status
    err.code = data?.error?.code ?? ''
    throw err
  }
  return data.data as T
}

async function upload<T>(path: string, file: File): Promise<T> {
  const form = new FormData()
  form.append('file', file)
  const headers: Record<string, string> = {}
  if (csrf !== '') headers['X-CSRF-Token'] = csrf
  const res = await fetch(path, { method: 'POST', headers, credentials: 'same-origin', body: form })
  const data = (await res.json().catch(() => null)) as { ok?: boolean; data?: T; error?: { message?: string; code?: string } } | null
  if (!res.ok || !data?.ok) {
    const err = new Error(data?.error?.message ?? `Upload failed (${res.status})`) as ApiError
    err.status = res.status
    err.code = data?.error?.code ?? ''
    throw err
  }
  return data.data as T
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body ?? {}),
  del: <T>(path: string, body?: unknown) => request<T>('DELETE', path, body),
  upload,
}
