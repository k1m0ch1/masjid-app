import { create } from 'zustand'
import { supabase } from '../services/supabase'
import { authAPI } from '../services/api'

const getErrorMessage = (error) => {
  if (error?.response?.status === 403) {
    return error.response?.data?.detail || 'Email tidak diizinkan mengakses platform.'
  }
  return error?.message || 'Terjadi kesalahan saat login.'
}

const clearAuthStorage = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('user')
}

const useAuthStore = create((set) => ({
  user: null,
  session: null,
  loading: true,
  authError: null,

  // Initialize auth state — returns subscription for cleanup (prevents React StrictMode double-register)
  initialize: () => {
    const handleSession = async (session) => {
      // Store token first so api interceptor picks it up
      localStorage.setItem('access_token', session.access_token)
      try {
        const response = await authAPI.getMe()
        const user = response.data
        localStorage.setItem('user', JSON.stringify(user))
        set({ session, user, authError: null, loading: false })
      } catch (error) {
        localStorage.removeItem('access_token')
        await supabase.auth.signOut()
        clearAuthStorage()
        set({
          session: null,
          user: null,
          authError: getErrorMessage(error),
          loading: false,
        })
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && session) {
        await handleSession(session)
      } else if (event === 'INITIAL_SESSION' && !session) {
        set({ loading: false })
      } else if (event === 'SIGNED_OUT') {
        clearAuthStorage()
        set({ session: null, user: null, loading: false })
      }
    })

    return subscription
  },

  clearAuthError: () => set({ authError: null }),

  // Sign in with Google
  signInWithGoogle: async () => {
    try {
      set({ authError: null })
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Google sign in error:', error)
      throw error
    }
  },

  // Sign out
  signOut: async () => {
    try {
      await supabase.auth.signOut()
      clearAuthStorage()
      set({ session: null, user: null, authError: null })
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  },
}))

export default useAuthStore
