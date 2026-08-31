import axios from 'axios'
import { store } from '../store'
import { logout } from '../store/slices/authSlice'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle 401, refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const url = originalRequest?.url || ''

    // Do NOT attempt token refresh for authentication attempts (login/register/etc.)
    const isAuthRoute =
      url.includes('/auth/login') ||
      url.includes('/auth/staff/login') ||
      url.includes('/auth/patient/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/patient/register') ||
      url.includes('/auth/forgot-password') ||
      url.includes('/auth/reset-password')

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (!refreshToken) {
          store.dispatch(logout())
          return Promise.reject(error)
        }

        const response = await axios.post(
          `${API_BASE}/auth/refresh`,
          {},
          {
            headers: { Authorization: `Bearer ${refreshToken}` },
          }
        )

        const { access_token } = response.data.data
        localStorage.setItem('access_token', access_token)
        originalRequest.headers.Authorization = `Bearer ${access_token}`
        return api(originalRequest)
      } catch (refreshError) {
        store.dispatch(logout())
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api
