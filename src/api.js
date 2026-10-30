import { useCallback, useEffect, useState } from 'react'

const TOKEN_KEY = 'medicenter-token'

export const tokenStore = {
  get() {
    try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
  },
  set(token) {
    try { token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY) } catch {}
  },
}

export class ApiError extends Error {
  constructor(status, code, fields) {
    super(code)
    this.status = status
    this.code = code
    this.fields = fields ?? {}
  }
}

export async function api(path, { method = 'GET', body } = {}) {
  const token = tokenStore.get()
  let res
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: {
        ...(body ? { 'content-type': 'application/json' } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'network')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(res.status, data.error ?? 'server_error', data.fields)
  return data
}

// Loads `path` and reloads whenever it changes. Pass null to skip.
export function useApi(path) {
  const [state, setState] = useState({ data: null, error: null, loading: !!path })

  const load = useCallback(async () => {
    if (!path) return
    setState((s) => ({ ...s, loading: true }))
    try {
      setState({ data: await api(path), error: null, loading: false })
    } catch (error) {
      setState({ data: null, error, loading: false })
    }
  }, [path])

  useEffect(() => { load() }, [load])
  return { ...state, reload: load }
}
