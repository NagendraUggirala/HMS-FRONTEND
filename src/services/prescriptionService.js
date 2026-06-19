import axios from 'axios';
import { API_BASE_URL, API_HEADERS } from '../config/api';
import { getStoredAuth, clearAuth } from '../utils/auth';

// Create axios instance with auth headers
const prescriptionApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    ...API_HEADERS,
  },
});

// Add auth token to requests
prescriptionApi.interceptors.request.use((config) => {
  const auth = getStoredAuth();
  if (auth?.token) {
    config.headers.Authorization = `Bearer ${auth.token}`;
  }
  return config;
});

// Handle response errors
prescriptionApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Medicine search for doctors
export const searchMedicines = async (query, limit = 20) => {
  try {
    const response = await prescriptionApi.get('/api/v1/simple-prescription/doctor/medicines/search', {
      params: { query, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching medicines:', error);
    throw error;
  }
};

// Create new prescription
export const createPrescription = async (prescriptionData) => {
  try {
    const response = await prescriptionApi.post('/api/v1/simple-prescription/doctor/prescriptions/create', prescriptionData);
    return response.data;
  } catch (error) {
    console.error('Error creating prescription:', error);
    throw error;
  }
};

// Get doctor's prescriptions
export const getDoctorPrescriptions = async (filters = {}) => {
  try {
    const params = { ...filters };
    const response = await prescriptionApi.get('/api/v1/simple-prescription/doctor/prescriptions', {
      params
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching doctor prescriptions:', error);
    throw error;
  }
};

// Get pharmacist prescriptions
export const getPharmacistPrescriptions = async (filters = {}) => {
  try {
    const response = await prescriptionApi.get('/api/v1/simple-prescription/pharmacist/prescriptions', {
      params: filters
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching pharmacist prescriptions:', error);
    throw error;
  }
};

// Get patient prescriptions
export const getPatientPrescriptions = async () => {
  try {
    const response = await prescriptionApi.get('/api/v1/simple-prescription/patient/prescriptions');
    return response.data;
  } catch (error) {
    console.error('Error fetching patient prescriptions:', error);
    throw error;
  }
};

// Get doctor prescription details (own only)
export const getDoctorPrescriptionDetails = async (prescriptionId) => {
  try {
    const response = await prescriptionApi.get(`/api/v1/simple-prescription/doctor/prescriptions/${prescriptionId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching doctor prescription details:', error);
    throw error;
  }
};

// Edit prescription (doctor, before dispense)
export const editPrescription = async (prescriptionId, prescriptionData) => {
  try {
    const response = await prescriptionApi.patch(`/api/v1/simple-prescription/doctor/prescriptions/${prescriptionId}`, prescriptionData);
    return response.data;
  } catch (error) {
    console.error('Error editing prescription:', error);
    throw error;
  }
};

// Get prescription details
export const getPrescriptionDetails = async (prescriptionId) => {
  try {
    const response = await prescriptionApi.get(`/api/v1/simple-prescription/prescriptions/${prescriptionId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching prescription details:', error);
    throw error;
  }
};

// Dispense prescription
export const dispensePrescription = async (prescriptionId, notes = null) => {
  try {
    const response = await prescriptionApi.post(`/api/v1/simple-prescription/pharmacist/prescriptions/${prescriptionId}/dispense`, 
      notes ? { notes } : {}
    );
    return response.data;
  } catch (error) {
    console.error('Error dispensing prescription:', error);
    throw error;
  }
};

// Download prescription PDF
export const downloadPrescriptionPDF = async (prescriptionId) => {
  try {
    const response = await prescriptionApi.get(`/api/v1/simple-prescription/prescriptions/${prescriptionId}/pdf`, {
      responseType: 'blob'
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Get filename from response headers or create default
    const contentDisposition = response.headers['content-disposition'];
    let filename = `prescription_${prescriptionId}.pdf`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return { success: true, filename };
  } catch (error) {
    console.error('Error downloading prescription PDF:', error);
    throw error;
  }
};

export default {
  searchMedicines,
  createPrescription,
  getDoctorPrescriptions,
  getPharmacistPrescriptions,
  getPatientPrescriptions,
  getDoctorPrescriptionDetails,
  editPrescription,
  getPrescriptionDetails,
  dispensePrescription,
  downloadPrescriptionPDF
};
