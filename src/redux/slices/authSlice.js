// src/redux/slices/authSlice.js
import { createSlice } from '@reduxjs/toolkit'

const USER_KEY = 'user'
const REQUIRES_HOSPITAL_ADMIN_PW_KEY = 'requires_hospital_admin_password_change'

function readStoredAuth() {
  const token = localStorage.getItem('access_token') || localStorage.getItem('token')
  const refreshToken = localStorage.getItem('refresh_token')
  let user = null
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (raw) user = JSON.parse(raw)
  } catch {
    user = null
  }
  const valid = !!(token && user && typeof user === 'object')
  if (token && !user) {
    localStorage.removeItem('token')
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem(REQUIRES_HOSPITAL_ADMIN_PW_KEY)
  }
  const requiresPasswordChange =
    valid && localStorage.getItem(REQUIRES_HOSPITAL_ADMIN_PW_KEY) === '1'
  return {
    user: valid ? user : null,
    token: valid ? token : null,
    refreshToken: valid ? refreshToken : null,
    isAuthenticated: valid,
    requiresPasswordChange,
  }
}

const initialState = {
  ...readStoredAuth(),
  loading: false,
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true
      state.error = null
    },
    loginSuccess: (state, action) => {
      state.loading = false
      state.isAuthenticated = true
      state.user = action.payload.user
      state.token = action.payload.token
      state.refreshToken = action.payload.refreshToken ?? null
      state.requiresPasswordChange = !!action.payload.requiresPasswordChange
      localStorage.setItem('access_token', action.payload.token)
      localStorage.setItem('token', action.payload.token)
      if (action.payload.refreshToken) {
        localStorage.setItem('refresh_token', action.payload.refreshToken)
      } else {
        localStorage.removeItem('refresh_token')
      }
      localStorage.setItem(USER_KEY, JSON.stringify(action.payload.user))
      if (state.requiresPasswordChange) {
        localStorage.setItem(REQUIRES_HOSPITAL_ADMIN_PW_KEY, '1')
      } else {
        localStorage.removeItem(REQUIRES_HOSPITAL_ADMIN_PW_KEY)
      }
    },
    loginFailure: (state, action) => {
      state.loading = false
      state.error = action.payload
      state.isAuthenticated = false
      state.user = null
      state.token = null
      state.refreshToken = null
      state.requiresPasswordChange = false
      localStorage.removeItem('token')
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem(USER_KEY)
      localStorage.removeItem(REQUIRES_HOSPITAL_ADMIN_PW_KEY)
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.refreshToken = null
      state.isAuthenticated = false
      state.requiresPasswordChange = false
      localStorage.removeItem('token')
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem(USER_KEY)
      localStorage.removeItem(REQUIRES_HOSPITAL_ADMIN_PW_KEY)
    },
    hospitalAdminPasswordChangeComplete: (state) => {
      state.requiresPasswordChange = false
      localStorage.removeItem(REQUIRES_HOSPITAL_ADMIN_PW_KEY)
    },
    updateAuthUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
        localStorage.setItem(USER_KEY, JSON.stringify(state.user))
      }
    },
    setTokens: (state, action) => {
      state.token = action.payload.token
      if (action.payload.refreshToken != null) {
        state.refreshToken = action.payload.refreshToken
      }
      if (action.payload.token) {
        localStorage.setItem('access_token', action.payload.token)
        localStorage.setItem('token', action.payload.token)
      }
      if (action.payload.refreshToken) {
        localStorage.setItem('refresh_token', action.payload.refreshToken)
      }
    },
    clearError: (state) => {
      state.error = null
    }
  }
})

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  clearError,
  setTokens,
  hospitalAdminPasswordChangeComplete,
  updateAuthUser,
} = authSlice.actions
export default authSlice.reducer