import { create } from 'zustand'
import { api, setCsrf } from '../api/client'

export type AuthStatus = 'loading' | 'authed' | 'guest'

interface AuthState {
  status: AuthStatus
  init: () => Promise<void>
  login: (password: string) => Promise<string | null>
  logout: () => Promise<void>
  changePassword: (current: string, next: string) => Promise<string | null>
}

export const useAuth = create<AuthState>((set) => ({
  status: 'authed',
  init: async () => {
    set({ status: 'authed' })
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
  changePassword: async (current, next) => {
    try {
      await api.post('/api/auth/change-password', { current_password: current, new_password: next })
      return null
    } catch (e) {
      return e instanceof Error ? e.message : 'Failed to change password'
    }
  },
}))
