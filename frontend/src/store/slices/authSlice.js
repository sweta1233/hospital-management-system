import { createSlice } from '@reduxjs/toolkit'

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const initialState = {
  user: getStoredUser(),
  token: localStorage.getItem('access_token'),
  isAuthenticated: !!localStorage.getItem('access_token'),
  loading: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true
    },
    loginSuccess: (state, action) => {
      state.user = action.payload.user
      state.token = action.payload.access_token
      state.isAuthenticated = true
      state.loading = false
      if (action.payload.access_token) {
        localStorage.setItem('access_token', action.payload.access_token)
      }
      if (action.payload.refresh_token) {
        localStorage.setItem('refresh_token', action.payload.refresh_token)
      }
      if (action.payload.user) {
        localStorage.setItem('user', JSON.stringify(action.payload.user))
      }
    },
    loginFailure: (state) => {
      state.loading = false
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.loading = false
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
    },
    setUser: (state, action) => {
      state.user = action.payload
      if (action.payload) {
        localStorage.setItem('user', JSON.stringify(action.payload))
      }
    },
  },
})

export const { loginStart, loginSuccess, loginFailure, logout, setUser } = authSlice.actions
export default authSlice.reducer
