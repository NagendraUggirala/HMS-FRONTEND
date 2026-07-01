import { apiFetch } from './apiClient';

// 1. GET /api/v1/lab/test-registration
export const getLabTestRegistrations = async () => {
  const response = await apiFetch('/api/v1/lab/test-registration');
  if (!response.ok) {
    throw new Error('Failed to fetch test registrations');
  }
  return response.json();
};

// 2. PATCH /api/v1/lab/test-registration/:id/status
export const updateTestRegistrationStatus = async (id, statusData) => {
  const response = await apiFetch(`/api/v1/lab/test-registration/${id}/status`, {
    method: 'PATCH',
    body: statusData,
  });
  if (!response.ok) {
    throw new Error('Failed to update test registration status');
  }
  return response.json();
};

// 3. GET /api/v1/doctor/lab-tests
export const getDoctorLabTests = async () => {
  const response = await apiFetch('/api/v1/doctor/lab-tests');
  if (!response.ok) {
    throw new Error('Failed to fetch doctor lab tests');
  }
  return response.json();
};

// 4. PATCH /api/v1/doctor/lab-tests/:id
export const updateDoctorLabTest = async (id, testData) => {
  const response = await apiFetch(`/api/v1/doctor/lab-tests/${id}`, {
    method: 'PATCH',
    body: testData,
  });
  if (!response.ok) {
    throw new Error('Failed to update doctor lab test');
  }
  return response.json();
};

// 5. POST /api/v1/doctor/lab-tests
export const createDoctorLabTest = async (testData) => {
  const response = await apiFetch('/api/v1/doctor/lab-tests', {
    method: 'POST',
    body: testData,
  });
  if (!response.ok) {
    throw new Error('Failed to create doctor lab test');
  }
  return response.json();
};
