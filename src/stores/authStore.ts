import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Principal } from '../types/api.types'

interface AuthState {
  token: string | null
  principal: Principal | null
  isAuthenticated: boolean
  login: (token: string, principal: Principal) => void
  logout: () => void
}

// Single source of truth for auth state — the ONLY place that touches
// localStorage. The API client reads the token via authStore.getState().
export const authStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      principal: null,
      isAuthenticated: false,

      login: (token, principal) => set({ token, principal, isAuthenticated: true }),

      logout: () => set({ token: null, principal: null, isAuthenticated: false }),
    }),
    {
      name: 'platform-auth',
      partialize: (state) => ({ token: state.token, principal: state.principal }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isAuthenticated = !!state.token
        }
      },
    },
  ),
)
