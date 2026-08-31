import { create } from 'zustand'
import { api, setCsrf } from '../api/client'

export type AuthStatus = 'loading' | 'authed' | 'guest'

interface AuthState {
  status: AuthStatus
  init: () => Promise<void>
  login: (password: string) => Promise<string | null>
  logout: () => Promise<void>
}

export const useAuth = create<AuthState>((set) => ({
  status: 'loading',
  init: async () => {
    try {
      const data = await api.get<{ csrf: string }>('/api/auth/me')
      setCsrf(data.csrf)
      set({ status: 'authed' })
    } catch {
      set({ status: 'guest' })
    }
  },
  login: async (password) => {
    try {
      const data = await api.post<{ csrf: string }>('/api/auth/login', { password })
      setCsrf(data.csrf)
      set({ status: 'authed' })
      return null
    } catch (e) {
      return e instanceof Error ? e.message : 'Login failed'
    }
  },
  logout: async () => {
    try {
      await api.post('/api/auth/logout')
    } catch {
      setCsrf('')
    }
    set({ status: 'guest' })
  },
}))
