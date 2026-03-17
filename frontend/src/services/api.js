import axios from 'axios'
import { supabase } from './supabase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      // Immediately clear auth state so ProtectedRoute redirects to /login
      // (don't wait for async signOut — prevents infinite loading in PWA/TWA)
      import('../stores/useAuthStore').then(({ default: useAuthStore }) => {
        useAuthStore.setState({ user: null, session: null, loading: false })
      })
      supabase.auth.signOut().catch(() => {})
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  googleAuth: (token) => api.post('/auth/google', { token }),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
}

// User access API
export const userAccessAPI = {
  list: () => api.get('/user-access'),
  invite: (data) => api.post('/user-access/invite', data),
  update: (id, data) => api.put(`/user-access/${id}`, data),
  remove: async (id) => {
    const attempts = [
      () => api.delete(`/user-access/${id}`),
      () => api.post(`/user-access/${id}/delete`),
      () => api.post(`/user-access/${id}/remove`),
      () => api.put(`/user-access/${id}/remove`),
    ]

    let lastError

    for (const attempt of attempts) {
      try {
        return await attempt()
      } catch (error) {
        const status = error?.response?.status
        if (status === 404 || status === 405) {
          lastError = error
          continue
        }
        throw error
      }
    }

    try {
      await api.put(`/user-access/${id}`, {
        is_active: false,
        is_allowed: false,
        allowed_modules: [],
      })

      return {
        data: {
          message: 'Endpoint hapus tidak tersedia. Akses user dinonaktifkan.',
        },
      }
    } catch {
      throw lastError
    }
  },
}

// Jamaah API
export const jamaahAPI = {
  list: (params) => api.get('/jamaah', { params }),
  create: (data) => api.post('/jamaah', data),
  get: (id) => api.get(`/jamaah/${id}`),
  update: (id, data) => api.put(`/jamaah/${id}`, data),
  delete: (id) => api.delete(`/jamaah/${id}`),
  // Tags
  listTags: () => api.get('/jamaah/tags'),
  createTag: (data) => api.post('/jamaah/tags', data),
  updateTag: (id, data) => api.put(`/jamaah/tags/${id}`, data),
  deleteTag: (id) => api.delete(`/jamaah/tags/${id}`),
}

// Family API
export const familyAPI = {
  list: (params) => api.get('/families', { params }),
  create: (data) => api.post('/families', data),
  get: (id) => api.get(`/families/${id}`),
  getMembers: (id) => api.get(`/families/${id}/members`),
}

// Transaction API
export const transactionAPI = {
  list: (params) => api.get('/transactions', { params }),
  create: (data) => api.post('/transactions', data),
  createIncome: (data) => api.post('/transactions/income', data),
  createExpense: (data) => api.post('/transactions/expense', data),
  get: (id) => api.get(`/transactions/${id}`),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
  approve: (id) => api.post(`/transactions/${id}/approve`),
  summary: (params) => api.get('/finance/summary', { params }),
  export: (params) => api.get('/finance/export', { params, responseType: 'blob' }),
}

// Budget API
export const budgetAPI = {
  list: (params) => api.get('/budgets', { params }),
  create: (data) => api.post('/budgets', data),
}

// Zakat Fitrah API
export const zakatFitrahAPI = {
  list: (params) => api.get('/zakat-fitrah', { params }),
  create: (data) => api.post('/zakat-fitrah', data),
  get: (id) => api.get(`/zakat-fitrah/${id}`),
  update: (id, data) => api.put(`/zakat-fitrah/${id}`, data),
  delete: (id) => api.delete(`/zakat-fitrah/${id}`),
  pay: (id) => api.post(`/zakat-fitrah/${id}/pay`),
  summary: (year) => api.get('/zakat-fitrah/summary', { params: { year } }),
}

// WhatsApp API
export const whatsappAPI = {
  getGroups: () => api.get('/whatsapp/groups'),
  createQueue: (data) => api.post('/whatsapp/queue', data),
  listQueue: (params) => api.get('/whatsapp/queue', { params }),
  cancelQueue: (id) => api.delete(`/whatsapp/queue/${id}`),
  retryQueue: (id) => api.post(`/whatsapp/queue/${id}/retry`),
}

// ZISWAF API
export const ziswafAPI = {
  list: (params) => api.get('/ziswaf', { params }),
  create: (data) => api.post('/ziswaf', data),
  get: (id) => api.get(`/ziswaf/${id}`),
  update: (id, data) => api.put(`/ziswaf/${id}`, data),
  delete: (id) => api.delete(`/ziswaf/${id}`),
  verify: (id) => api.post(`/ziswaf/${id}/verify`),
  summary: (params) => api.get('/ziswaf/summary', { params }),
}

// Event API
export const eventAPI = {
  list: (params) => api.get('/events', { params }),
  create: (data) => api.post('/events', data),
  get: (id) => api.get(`/events/${id}`),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
  recordAttendance: (id, data) => api.post(`/events/${id}/attendance`, data),
  getAttendance: (id) => api.get(`/events/${id}/attendance`),
}

export default api
