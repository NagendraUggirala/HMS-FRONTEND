import { 
  PATIENT_APPOINTMENT_BOOKING_BASE, 
  PATIENT_DOCUMENT_STORAGE_BASE,
  PATIENT_MEDICAL_HISTORY_BASE,
  PATIENT_PORTAL_DASHBOARD_BASE,
  PATIENT_PRESCRIPTIONS_BASE,
  PATIENT_BILLING_BASE,
  PATIENT_PROFILE_BASE,
  PATIENT_LAB_TESTS_BASE,
  PATIENT_MESSAGING_BASE,
  PATIENT_DISCHARGE_SUMMARY_BASE
} from '../config/api'
import { apiFetch } from './apiClient'

/**
 * Helper for protected patient APIs. Adds Authorization: Bearer <access_token>.
 * Uses the shared refresh-retry behavior from apiFetch on 401 responses.
 */
export async function patientApiFetch(path, options = {}) {
  return apiFetch(path, options)
}

const PAB = PATIENT_APPOINTMENT_BOOKING_BASE
const PDS = PATIENT_DOCUMENT_STORAGE_BASE
const PMH = PATIENT_MEDICAL_HISTORY_BASE
const PDB = PATIENT_PORTAL_DASHBOARD_BASE
const PPR = PATIENT_PRESCRIPTIONS_BASE
const PBL = PATIENT_BILLING_BASE
const PPRF = PATIENT_PROFILE_BASE
const PLT = PATIENT_LAB_TESTS_BASE
const PMS = PATIENT_MESSAGING_BASE
const PDS_SUM = PATIENT_DISCHARGE_SUMMARY_BASE
export function patientAppointmentErrorMessage(payload) {
  const d = payload?.detail
  if (typeof d === 'string') return d
  if (d && typeof d === 'object' && !Array.isArray(d) && d.message) return d.message
  if (Array.isArray(d)) return d.map((e) => e.msg || JSON.stringify(e)).join('; ')
  return payload?.message || 'Request failed'
}

// --- APPOINTMENTS ---
export function getPatientDepartments() {
  // Use global departments list as the PAB endpoint might return empty for some hospitals
  return patientApiFetch(`/api/v1/departments`)
}

export async function getPatientDepartmentDoctors(departmentName) {
  const res = await patientApiFetch(`/api/v1/doctors`);
  if (!res.ok) return res;
  const data = await res.json().catch(() => ({}));
  const list = data?.data?.doctors || data?.data?.staff || data?.doctors || data?.staff || data?.data || data || [];
  const filtered = Array.isArray(list) 
    ? list.filter(d => d.department === departmentName || d.department?.name === departmentName)
    : [];
  return {
    ok: true,
    status: 200,
    json: async () => ({ doctors: filtered })
  };
}

export function getDoctorAvailableSlots(doctorName, date) {
  const q = new URLSearchParams({ date })
  return patientApiFetch(`${PAB}/doctors/${encodeURIComponent(doctorName)}/available-slots?${q}`)
}

export function bookPatientAppointment(body) {
  return patientApiFetch(`${PAB}/book-appointment`, { method: 'POST', body })
}

export function getPatientAppointmentByRef(appointmentRef) {
  return patientApiFetch(`${PAB}/appointment/${encodeURIComponent(appointmentRef)}`)
}

export function getMyPatientAppointments({ page = 1, limit = 10, statusFilter } = {}) {
  const q = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (statusFilter) q.set('status_filter', statusFilter)
  return patientApiFetch(`${PAB}/my-appointments?${q}`)
}

export function cancelPatientAppointment(appointmentRef, cancellationReason) {
  return patientApiFetch(`${PAB}/appointment/${encodeURIComponent(appointmentRef)}/cancel`, {
    method: 'PATCH',
    body: { cancellation_reason: cancellationReason },
  })
}

// --- DOCUMENT STORAGE ---
export function getMyDocuments({ documentType, page = 1, limit = 20 } = {}) {
  const q = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (documentType && documentType !== 'All') q.set('document_type', documentType)
  return patientApiFetch(`${PDS}/my/documents?${q}`)
}

export function uploadMyDocument(formData) {
  return patientApiFetch(`${PDS}/my/documents/upload`, {
    method: 'POST',
    body: formData,
  })
}

export function deleteMyDocument(documentId) {
  return patientApiFetch(`${PDS}/my/documents/${encodeURIComponent(documentId)}`, {
    method: 'DELETE',
  })
}

export function downloadMyDocument(documentId) {
  return patientApiFetch(`${PDS}/my/documents/${encodeURIComponent(documentId)}/download`)
}

export function getMyDocumentStatistics() {
  return patientApiFetch(`${PDS}/my/documents/statistics`)
}

// --- MEDICAL HISTORY ---
export function getMyMedicalSummary() {
  return patientApiFetch(`${PMH}/my/summary`)
}

export function getMyMedicalRecords({ page = 1, limit = 20, type } = {}) {
  const q = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (type) q.set('type', type)
  return patientApiFetch(`${PMH}/my/medical-records?${q}`)
}

export function getMyMedicalRecordDetails(recordId) {
  return patientApiFetch(`${PMH}/my/medical-records/${encodeURIComponent(recordId)}`)
}

export function getMyHealthTimeline() {
  return patientApiFetch(`${PMH}/my/timeline`)
}

// --- DASHBOARD ---
export function getPatientDashboardOverview() {
  return patientApiFetch(`${PDB}/my/overview`)
}

// --- PRESCRIPTIONS ---
export function getActivePrescriptions() {
  return patientApiFetch(`${PPR}/my/active`)
}

export function getPrescriptionHistory() {
  return patientApiFetch(`${PPR}/my/history`)
}

export function getPrescriptionDetails(prescriptionId) {
  return patientApiFetch(`${PPR}/${encodeURIComponent(prescriptionId)}`)
}

export function requestPrescriptionRefill(prescriptionId) {
  return patientApiFetch(`${PPR}/${encodeURIComponent(prescriptionId)}/refill-request`, {
    method: 'POST'
  })
}

// --- BILLING ---
export function getMyBills({ status, page = 1, limit = 20 } = {}) {
  const q = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (status) q.set('status', status)
  return patientApiFetch(`${PBL}/my/invoices?${q}`)
}

export function getMyBillingSummary() {
  // Since there is no dedicated summary endpoint, we'll fetch insurance details as a fallback for summary data
  return patientApiFetch(`${PBL}/my/insurance-details`)
}

export function getMyBillDetails(invoiceId) {
  return patientApiFetch(`${PBL}/my/invoices/${encodeURIComponent(invoiceId)}`)
}

export function initiateBillPayment(invoiceId, paymentData) {
  // Backend uses /payments/process for all payments
  return patientApiFetch(`${PBL}/payments/process`, {
    method: 'POST',
    body: JSON.stringify({ invoice_id: invoiceId, ...paymentData }),
    headers: { 'Content-Type': 'application/json' }
  })
}

export function getMyPaymentHistory() {
  return patientApiFetch(`${PBL}/my/payment-history`)
}



// --- PROFILE ---
export function getMyPatientProfile() {
  return patientApiFetch(`${PPRF}/my/details?t=${Date.now()}`)
}

export function updateMyPatientProfile(body) {
  return patientApiFetch(`${PPRF}/my/details`, {
    method: 'PATCH',
    body
  })
}

// --- LAB TESTS ---
export function getMyLabResults() {
  return patientApiFetch(`${PLT}/my/results`)
}

export function getLabResultDetails(testId) {
  return patientApiFetch(`${PLT}/my/results/${encodeURIComponent(testId)}`)
}

export function downloadLabResult(testId) {
  return patientApiFetch(`${PLT}/my/results/${encodeURIComponent(testId)}/download`)
}// --- MESSAGING ---
export function getMyConversations() {
  return patientApiFetch(`${PATIENT_MESSAGING_BASE}/conversations`)
}

export function startConversation(body) {
  return patientApiFetch(`${PATIENT_MESSAGING_BASE}/conversations`, {
    method: 'POST',
    body
  })
}

export function getConversationMessages(conversationId) {
  return patientApiFetch(`${PATIENT_MESSAGING_BASE}/conversations/${encodeURIComponent(conversationId)}/messages`)
}

export function sendMessage(conversationId, body) {
  return patientApiFetch(`${PATIENT_MESSAGING_BASE}/conversations/${encodeURIComponent(conversationId)}/messages`, {
    method: 'POST',
    body
  })
}

export function markMessageAsRead(messageId) {
  return patientApiFetch(`${PATIENT_MESSAGING_BASE}/messages/${encodeURIComponent(messageId)}/read`, {
    method: 'PATCH'
  })
}

export function getLabTrends(parameterName) {
  return patientApiFetch(`${PLT}/my/trends/${encodeURIComponent(parameterName)}`)
}
// --- DASHBOARD ---
export function getOverviewMetrics() {
  return patientApiFetch(`${PDB}/overview-metrics`)
}

export function getRecentVitals() {
  return patientApiFetch(`${PDB}/recent-vitals`)
}

export function getDashboardNotifications() {
  return patientApiFetch(`${PDB}/notifications`)
}

// --- DISCHARGE SUMMARIES ---
export function getMyDischargeSummaries() {
  return patientApiFetch(`${PDS_SUM}/my/discharge-summaries`)
}
