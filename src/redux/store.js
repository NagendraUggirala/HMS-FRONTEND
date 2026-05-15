// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import userReducer from './slices/userSlice'
import dashboardReducer from './slices/dashboardSlice'
import hospitalReducer from './slices/hospitalSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    dashboard: dashboardReducer,
    hospital: hospitalReducer,
  },
})

export default store