import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  patients: [],
  doctors: [],
  queues: {},
  activeConsultations: [],
  labReports: [],
  pharmacyOrders: [],
  billingRecords: [],
  emergencyPatients: [],
  loading: false,
  error: null,
  realtimeStatus: 'connected'
};

const opdSlice = createSlice({
  name: 'opd',
  initialState,
  reducers: {
    setPatients: (state, action) => {
      state.patients = action.payload;
    },
    addPatient: (state, action) => {
      state.patients.push(action.payload);
    },
    updatePatient: (state, action) => {
      const index = state.patients.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.patients[index] = { ...state.patients[index], ...action.payload };
      }
    },
    setDoctors: (state, action) => {
      state.doctors = action.payload;
    },
    updateDoctorStatus: (state, action) => {
      const { doctorId, status } = action.payload;
      const doctor = state.doctors.find(d => d.id === doctorId);
      if (doctor) {
        doctor.status = status;
      }
    },
    addLabReport: (state, action) => {
      state.labReports.push(action.payload);
    },
    updateLabStatus: (state, action) => {
      const { reportId, status } = action.payload;
      const report = state.labReports.find(r => r.id === reportId);
      if (report) {
        report.status = status;
      }
    },
    addPharmacyOrder: (state, action) => {
      state.pharmacyOrders.push(action.payload);
    },
    addBillingRecord: (state, action) => {
      state.billingRecords.push(action.payload);
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    syncQueue: (state, action) => {
      // Real-time queue sync logic
      state.queues = action.payload;
    }
  }
});

export const {
  setPatients,
  addPatient,
  updatePatient,
  setDoctors,
  updateDoctorStatus,
  addLabReport,
  updateLabStatus,
  addPharmacyOrder,
  addBillingRecord,
  setLoading,
  setError,
  syncQueue
} = opdSlice.actions;

export default opdSlice.reducer;
