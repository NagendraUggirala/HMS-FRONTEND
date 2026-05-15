// src/redux/slices/hospitalSlice.js
import { createSlice } from '@reduxjs/toolkit'

const HOSPITAL_INFO_KEY = 'hospital_info'
function readStoredHospitalInfo() {
  try {
    const raw = localStorage.getItem(HOSPITAL_INFO_KEY)
    if (raw) return JSON.parse(raw)
  }
catch {
    return null
  }
  return null
}

const initialState = {
  name: 'Levitica',
  logo: null, // Base64 or URL
  ...readStoredHospitalInfo(),
  loading: false,
  error: null
}

const hospitalSlice = createSlice({
  name: 'hospital',
  initialState,
  reducers: {
    updateHospitalInfo: (state, action) => {
      const newState = { ...state, ...action.payload }
      localStorage.setItem(HOSPITAL_INFO_KEY, JSON.stringify({
        name: newState.name,
        logo: newState.logo
      }))
      return newState
    },
    updateLogo: (state, action) => {
      state.logo = action.payload
      localStorage.setItem(HOSPITAL_INFO_KEY, JSON.stringify({
        name: state.name,
        logo: state.logo
      }))
    }
  }
})

export const { updateHospitalInfo, updateLogo } = hospitalSlice.actions
export default hospitalSlice.reducer