import { apiFetch } from './apiClient'

const DOCTOR_APPOINTMENT_BASE_CANDIDATES = [
  '/api/v1/doctor-management',
  '/api/v1/doctor-dashboard',
  '/api/v1/doctor',
  '/api/v1/doctors',
  '/api/v1/doctor-appointments',
]

const DOCTOR_APPOINTMENT_TRACKING_BASE_CANDIDATES = [
  '/api/v1/doctor-management',
  '/api/v1/doctor-dashboard',
  '/api/v1/doctor',
  '/api/v1/doctors',
  '/api/v1/doctor-appointment-tracking',
]

const DOCTOR_PATIENT_RECORDS_BASE_CANDIDATES = [
  '/api/v1/doctor-management',
  '/api/v1/doctor-dashboard',
  '/api/v1/doctor-patient-records',
  '/api/v1/doctor',
  '/api/v1/doctors',
]

const DOCTOR_TREATMENT_PLANS_BASE_CANDIDATES = [
  '/api/v1/doctor-treatment-plans',
  '/api/v1/doctor-management',
  '/api/v1/doctor-dashboard',
  '/api/v1/doctor',
  '/api/v1/doctors',
]

function normalizeApiData(payload) {
  return payload?.data ?? payload ?? {}
}

function withQuery(path, queryObj = {}) {
  const query = new URLSearchParams()
  Object.entries(queryObj).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      query.set(key, String(value))
    }
  })
  const queryString = query.toString()
  return queryString ? `${path}?${queryString}` : path
}

async function doctorApiFetchWithFallback(paths, options = {}) {
  let lastResponse = null
  let lastPath = ''

  for (const path of paths) {
    const response = await apiFetch(path, options)
    lastResponse = response
    lastPath = path
    if (response.status !== 404) return response
  }

  if (lastResponse) {
    lastResponse._attemptedPath = lastPath
  }
  return lastResponse
}

function buildAppointmentPaths({ appointmentRef, action = 'list', query = {} } = {}) {
  return DOCTOR_APPOINTMENT_BASE_CANDIDATES.map((base) => {
    if (action === 'list') return withQuery(`${base}/appointments`, query)
    if (action === 'details') return `${base}/appointments/${encodeURIComponent(appointmentRef)}`
    if (action === 'update') return `${base}/appointments/${encodeURIComponent(appointmentRef)}`
    if (action === 'complete') return `${base}/appointments/${encodeURIComponent(appointmentRef)}/complete`
    if (action === 'cancel') return `${base}/appointments/${encodeURIComponent(appointmentRef)}/cancel`
    return ''
  }).filter(Boolean)
}

function buildAppointmentTrackingPaths({ appointmentRef, action = 'today', query = {} } = {}) {
  return DOCTOR_APPOINTMENT_TRACKING_BASE_CANDIDATES.map((base) => {
    if (action === 'today') return `${base}/appointments/today`
    if (action === 'upcoming') return withQuery(`${base}/appointments/upcoming`, query)
    if (action === 'details') return `${base}/appointments/${encodeURIComponent(appointmentRef)}/tracking`
    if (action === 'sendNotification') return `${base}/notifications/send`
    if (action === 'bulkSendNotification') return `${base}/notifications/bulk-send`
    if (action === 'notificationHistory') return withQuery(`${base}/notifications/history`, query)
    if (action === 'delayUpdate') return `${base}/appointments/${encodeURIComponent(appointmentRef)}/delay`
    if (action === 'delaysToday') return `${base}/appointments/delays/today`
    if (action === 'communicationLog') return withQuery(`${base}/communication/log`, query)
    if (action === 'createCommunicationLog') return `${base}/communication/log`
    if (action === 'metricsSummary') return withQuery(`${base}/metrics/summary`, query)
    if (action === 'notificationSettings') return `${base}/settings/notifications`
    return ''
  }).filter(Boolean)
}

function buildPatientRecordPaths({ patientRef, action = 'search', query = {} } = {}) {
  return DOCTOR_PATIENT_RECORDS_BASE_CANDIDATES.map((base) => {
    if (action === 'search') return withQuery(`${base}/patients/search`, query)
    if (action === 'advancedSearch') return `${base}/patients/advanced-search`
    if (action === 'allMedicalRecords') return withQuery(`${base}/medical-records`, query)
    if (action === 'patientSummary') return `${base}/patients/${encodeURIComponent(patientRef)}/summary`
    if (action === 'patientMedicalRecords') return withQuery(`${base}/patients/${encodeURIComponent(patientRef)}/medical-records`, query)
    if (action === 'patientTimeline') return withQuery(`${base}/patients/${encodeURIComponent(patientRef)}/timeline`, query)
    if (action === 'patientCaseHistory') return withQuery(`${base}/patients/${encodeURIComponent(patientRef)}/case-history`, query)
    if (action === 'patientClinicalAlerts') return withQuery(`${base}/patients/${encodeURIComponent(patientRef)}/clinical-alerts`, query)
    if (action === 'patientDocuments') return withQuery(`${base}/patients/${encodeURIComponent(patientRef)}/documents`, query)
    return ''
  }).filter(Boolean)
}

function buildTreatmentPlanPaths({ planId, action = 'list', query = {} } = {}) {
  return DOCTOR_TREATMENT_PLANS_BASE_CANDIDATES.map((base) => {
    if (action === 'list') return withQuery(`${base}/plans`, query)
    if (action === 'details') return `${base}/plans/${encodeURIComponent(planId)}`
    if (action === 'create') return `${base}/plans`
    if (action === 'update') return `${base}/plans/${encodeURIComponent(planId)}`
    if (action === 'progress') return `${base}/plans/${encodeURIComponent(planId)}/progress`
    if (action === 'status') return `${base}/plans/${encodeURIComponent(planId)}/status`
    if (action === 'recordOutcome') return `${base}/plans/${encodeURIComponent(planId)}/outcome`
    if (action === 'getOutcome') return `${base}/plans/${encodeURIComponent(planId)}/outcome`
    if (action === 'templates') return withQuery(`${base}/templates`, query)
    if (action === 'createFromTemplate') return `${base}/plans/from-template`
    if (action === 'analytics') return withQuery(`${base}/analytics/summary`, query)
    if (action === 'cleanupDates') return `${base}/maintenance/cleanup-dates`
    return ''
  }).filter(Boolean)
}

export function doctorAppointmentErrorMessage(payload) {
  const detail = payload?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map((item) => item?.msg || JSON.stringify(item)).join('; ')
  if (detail && typeof detail === 'object' && detail.message) return detail.message
  return payload?.message || 'Request failed'
}

export function normalizeDoctorAppointmentList(payload) {
  const data = normalizeApiData(payload)
  const rawAppointments = Array.isArray(data)
    ? data
    : Array.isArray(data?.appointments)
      ? data.appointments
      : Array.isArray(data?.items)
        ? data.items
        : []

  return rawAppointments.map((item) => ({
    appointment_ref: item?.appointment_ref || item?.reference || String(item?.id || ''),
    patient_name: item?.patient_name || item?.patient || 'Unknown',
    appointment_date: item?.appointment_date || item?.date || '',
    appointment_time: item?.appointment_time || item?.time || '',
    status: item?.status || 'PENDING',
    appointment_type: item?.appointment_type || item?.type || 'Regular',
    reason: item?.chief_complaint || item?.reason || '-',
    duration_minutes: item?.duration_minutes ?? item?.duration ?? null,
    notes: item?.notes || '',
    consultation_fee: item?.consultation_fee ?? null,
  }))
}

export function normalizeDoctorAppointmentDetails(payload) {
  const data = normalizeApiData(payload)
  return {
    appointment_ref: data?.appointment_ref || data?.reference || '',
    patient_name: data?.patient_name || data?.patient || 'Unknown',
    patient_phone: data?.patient_phone || data?.phone || '',
    appointment_date: data?.appointment_date || data?.date || '',
    appointment_time: data?.appointment_time || data?.time || '',
    status: data?.status || 'PENDING',
    appointment_type: data?.appointment_type || data?.type || 'Regular',
    reason: data?.chief_complaint || data?.reason || '',
    duration_minutes: data?.duration_minutes ?? data?.duration ?? '',
    notes: data?.notes || '',
    consultation_fee: data?.consultation_fee ?? '',
  }
}

export function getDoctorAppointments(filters = {}) {
  const query = {
    date_from: filters.date_from,
    date_to: filters.date_to,
    status: filters.status,
    limit: filters.limit ?? 50,
  }
  return doctorApiFetchWithFallback(buildAppointmentPaths({ action: 'list', query }))
}

export function getDoctorAppointmentDetails(appointmentRef) {
  return doctorApiFetchWithFallback(buildAppointmentPaths({ action: 'details', appointmentRef }))
}

export function updateDoctorAppointment(appointmentRef, body) {
  return doctorApiFetchWithFallback(buildAppointmentPaths({ action: 'update', appointmentRef }), {
    method: 'PUT',
    body,
  })
}

export function completeDoctorAppointment(appointmentRef) {
  return doctorApiFetchWithFallback(buildAppointmentPaths({ action: 'complete', appointmentRef }), {
    method: 'POST',
  })
}

export function cancelDoctorAppointment(appointmentRef, cancellationReason) {
  return doctorApiFetchWithFallback(buildAppointmentPaths({ action: 'cancel', appointmentRef }), {
    method: 'POST',
    body: { cancellation_reason: cancellationReason },
  })
}

export function getTodaysAppointmentTracking() {
  return doctorApiFetchWithFallback(buildAppointmentTrackingPaths({ action: 'today' }))
}

export function getUpcomingAppointmentsTracking(daysAhead = 7) {
  return doctorApiFetchWithFallback(
    buildAppointmentTrackingPaths({
      action: 'upcoming',
      query: { days_ahead: daysAhead },
    })
  )
}

export function getAppointmentTrackingDetails(appointmentRef) {
  return doctorApiFetchWithFallback(
    buildAppointmentTrackingPaths({ action: 'details', appointmentRef })
  )
}

export function sendAppointmentNotification(body) {
  return doctorApiFetchWithFallback(
    buildAppointmentTrackingPaths({ action: 'sendNotification' }),
    {
      method: 'POST',
      body,
    }
  )
}

export function sendBulkAppointmentNotifications(body) {
  return doctorApiFetchWithFallback(
    buildAppointmentTrackingPaths({ action: 'bulkSendNotification' }),
    {
      method: 'POST',
      body,
    }
  )
}

export function getNotificationHistory(filters = {}) {
  const query = {
    appointment_ref: filters.appointment_ref,
    notification_type: filters.notification_type,
    date_from: filters.date_from,
    date_to: filters.date_to,
    limit: filters.limit ?? 50,
  }
  return doctorApiFetchWithFallback(
    buildAppointmentTrackingPaths({ action: 'notificationHistory', query })
  )
}

export function updateAppointmentDelay(appointmentRef, body) {
  return doctorApiFetchWithFallback(
    buildAppointmentTrackingPaths({ action: 'delayUpdate', appointmentRef }),
    {
      method: 'POST',
      body,
    }
  )
}

export function getTodaysAppointmentDelays() {
  return doctorApiFetchWithFallback(
    buildAppointmentTrackingPaths({ action: 'delaysToday' })
  )
}

export function getCommunicationLog(filters = {}) {
  const query = {
    appointment_ref: filters.appointment_ref,
    patient_ref: filters.patient_ref,
    communication_type: filters.communication_type,
    date_from: filters.date_from,
    date_to: filters.date_to,
    limit: filters.limit ?? 50,
  }
  return doctorApiFetchWithFallback(
    buildAppointmentTrackingPaths({ action: 'communicationLog', query })
  )
}

export function createCommunicationLogEntry(body) {
  return doctorApiFetchWithFallback(
    buildAppointmentTrackingPaths({ action: 'createCommunicationLog' }),
    {
      method: 'POST',
      body,
    }
  )
}

export function getAppointmentMetricsSummary(period = 'month') {
  return doctorApiFetchWithFallback(
    buildAppointmentTrackingPaths({
      action: 'metricsSummary',
      query: { period },
    })
  )
}

export function getDoctorNotificationSettings() {
  return doctorApiFetchWithFallback(
    buildAppointmentTrackingPaths({ action: 'notificationSettings' })
  )
}

export function searchDoctorPatients(filters = {}) {
  const query = {
    query: filters.query,
    search_scope: filters.search_scope,
    include_inactive: filters.include_inactive,
    limit: filters.limit ?? 20,
  }
  return doctorApiFetchWithFallback(buildPatientRecordPaths({ action: 'search', query }))
}

export function advancedSearchDoctorPatients(searchRequest = {}, filters = {}) {
  return doctorApiFetchWithFallback(buildPatientRecordPaths({ action: 'advancedSearch' }), {
    method: 'POST',
    body: {
      search_request: searchRequest,
      filters,
    },
  })
}

export function getDoctorAllMedicalRecords(filters = {}) {
  const query = {
    page: filters.page ?? 1,
    limit: filters.limit ?? 50,
    patient_search: filters.patient_search,
    date_from: filters.date_from,
    date_to: filters.date_to,
  }
  return doctorApiFetchWithFallback(buildPatientRecordPaths({ action: 'allMedicalRecords', query }))
}

export function getDoctorPatientSummary(patientRef) {
  return doctorApiFetchWithFallback(
    buildPatientRecordPaths({ action: 'patientSummary', patientRef })
  )
}

export function getDoctorPatientMedicalRecords(patientRef, filters = {}) {
  const query = {
    record_type: filters.record_type,
    date_from: filters.date_from,
    date_to: filters.date_to,
    limit: filters.limit ?? 50,
  }
  return doctorApiFetchWithFallback(
    buildPatientRecordPaths({ action: 'patientMedicalRecords', patientRef, query })
  )
}

export function getDoctorPatientTimeline(patientRef, filters = {}) {
  const query = {
    grouping: filters.grouping,
    date_from: filters.date_from,
    date_to: filters.date_to,
  }
  return doctorApiFetchWithFallback(
    buildPatientRecordPaths({ action: 'patientTimeline', patientRef, query })
  )
}

export function getDoctorPatientCaseHistory(patientRef, analysisPeriod = '1year') {
  return doctorApiFetchWithFallback(
    buildPatientRecordPaths({
      action: 'patientCaseHistory',
      patientRef,
      query: { analysis_period: analysisPeriod },
    })
  )
}

export function getDoctorPatientClinicalAlerts(patientRef, includeResolved = false) {
  return doctorApiFetchWithFallback(
    buildPatientRecordPaths({
      action: 'patientClinicalAlerts',
      patientRef,
      query: { include_resolved: includeResolved },
    })
  )
}

export function getDoctorPatientDocuments(patientRef, documentType) {
  return doctorApiFetchWithFallback(
    buildPatientRecordPaths({
      action: 'patientDocuments',
      patientRef,
      query: { document_type: documentType },
    })
  )
}

export function getDoctorTreatmentPlans(filters = {}) {
  const query = {
    status: filters.status,
    priority: filters.priority,
    patient_ref: filters.patient_ref,
    limit: filters.limit ?? 50,
    offset: filters.offset ?? 0,
  }
  return doctorApiFetchWithFallback(buildTreatmentPlanPaths({ action: 'list', query }))
}

export function getDoctorTreatmentPlanDetails(planId) {
  return doctorApiFetchWithFallback(
    buildTreatmentPlanPaths({ action: 'details', planId })
  )
}

export function createDoctorTreatmentPlan(body) {
  return doctorApiFetchWithFallback(
    buildTreatmentPlanPaths({ action: 'create' }),
    {
      method: 'POST',
      body,
    }
  )
}

export function updateDoctorTreatmentPlan(planId, body) {
  return doctorApiFetchWithFallback(
    buildTreatmentPlanPaths({ action: 'update', planId }),
    {
      method: 'PUT',
      body,
    }
  )
}

export function updateDoctorTreatmentPlanProgress(planId, body) {
  return doctorApiFetchWithFallback(
    buildTreatmentPlanPaths({ action: 'progress', planId }),
    {
      method: 'POST',
      body,
    }
  )
}

export function getDoctorTreatmentPlanStatus(planId) {
  return doctorApiFetchWithFallback(
    buildTreatmentPlanPaths({ action: 'status', planId })
  )
}

export function recordDoctorTreatmentPlanOutcome(planId, body) {
  return doctorApiFetchWithFallback(
    buildTreatmentPlanPaths({ action: 'recordOutcome', planId }),
    {
      method: 'POST',
      body,
    }
  )
}

export function getDoctorTreatmentPlanOutcome(planId) {
  return doctorApiFetchWithFallback(
    buildTreatmentPlanPaths({ action: 'getOutcome', planId })
  )
}

export function getDoctorTreatmentPlanTemplates(filters = {}) {
  const query = {
    diagnosis: filters.diagnosis,
    specialty: filters.specialty,
  }
  return doctorApiFetchWithFallback(
    buildTreatmentPlanPaths({ action: 'templates', query })
  )
}

export function createDoctorTreatmentPlanFromTemplate(body) {
  return doctorApiFetchWithFallback(
    buildTreatmentPlanPaths({ action: 'createFromTemplate' }),
    {
      method: 'POST',
      body,
    }
  )
}

export function getDoctorTreatmentPlanAnalytics(filters = {}) {
  const query = {
    date_from: filters.date_from,
    date_to: filters.date_to,
  }
  return doctorApiFetchWithFallback(
    buildTreatmentPlanPaths({ action: 'analytics', query })
  )
}

export function cleanupDoctorTreatmentPlanDates() {
  return doctorApiFetchWithFallback(
    buildTreatmentPlanPaths({ action: 'cleanupDates' }),
    {
      method: 'POST',
    }
  )
}
// --- DISCHARGE SUMMARY ---
const DISCHARGE_SUMMARY_BASE = '/api/v1/patient-discharge-summary'

export async function getAdmissionsReadyForDischarge(params = {}) {
  const path = withQuery(`${DISCHARGE_SUMMARY_BASE}/admissions/ready-for-discharge`, params)
  return doctorApiFetchWithFallback([path])
}

export async function getDischargeSummaryTemplate(admissionNumber) {
  const path = `${DISCHARGE_SUMMARY_BASE}/admissions/${encodeURIComponent(admissionNumber)}/discharge-template`
  return doctorApiFetchWithFallback([path])
}

export async function createDischargeSummary(body) {
  return doctorApiFetchWithFallback([`${DISCHARGE_SUMMARY_BASE}/discharge-summaries`], {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  })
}

export async function getDischargeSummaryById(summaryId) {
  return doctorApiFetchWithFallback([`${DISCHARGE_SUMMARY_BASE}/discharge-summaries/${encodeURIComponent(summaryId)}`])
}

export async function updateDischargeSummary(summaryId, body) {
  return doctorApiFetchWithFallback([`${DISCHARGE_SUMMARY_BASE}/discharge-summaries/${encodeURIComponent(summaryId)}`], {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  })
}

export async function finalizeDischargeSummary(summaryId) {
  return doctorApiFetchWithFallback([`${DISCHARGE_SUMMARY_BASE}/discharge-summaries/${encodeURIComponent(summaryId)}/finalize`], {
    method: 'POST'
  })
}

export async function getDischargeStatistics(params = {}) {
  const path = withQuery(`${DISCHARGE_SUMMARY_BASE}/discharge-summaries/statistics`, params)
  return doctorApiFetchWithFallback([path])
}
