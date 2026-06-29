// src/config/api.js
export const API_BASE_URL = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_API_BASE_URL || 'https://hms-backend-2av4.onrender.com').replace(/\/$/, '');

export const PUBLIC_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://hms-backend-2av4.onrender.com';
/** When using ngrok, skip browser warning so API returns JSON instead of HTML interstitial. Empty object when not ngrok = no impact. */
export const API_HEADERS = (API_BASE_URL && API_BASE_URL.includes('ngrok')) ? { 'ngrok-skip-browser-warning': 'true' } : {};

/** Auth: super-admin login */
export const AUTH_SUPER_ADMIN_LOGIN = '/api/v1/auth/login';
/** Auth: hospital-admin login */
export const AUTH_HOSPITAL_ADMIN_LOGIN = '/api/v1/auth/login';
/** Auth: hospital staff login (DOCTOR, PHARMACIST, LAB_TECH, NURSE, RECEPTIONIST) */
export const AUTH_STAFF_LOGIN = '/api/v1/auth/login';
/** Auth: patient login */
export const AUTH_PATIENT_LOGIN = '/api/v1/auth/patient/login';
/** Auth: patient signup helpers */
export const AUTH_HOSPITALS = '/api/v1/auth/hospitals';
export const AUTH_PATIENT_REGISTER = '/api/v1/auth/patient/register';
export const AUTH_PATIENT_VERIFY_OTP = '/api/v1/auth/patient/verify-otp';

/** Patient portal: authenticated appointment booking (Bearer patient JWT) */
export const PATIENT_APPOINTMENT_BOOKING_BASE = '/api/v1/patient-appointment-booking';
export const PATIENT_DOCUMENT_STORAGE_BASE = '/api/v1/patient-document-storage';
export const PATIENT_MEDICAL_HISTORY_BASE = '/api/v1/patient-medical-history';
export const PATIENT_PORTAL_DASHBOARD_BASE = '/api/v1/patient-dashboard';
export const PATIENT_PRESCRIPTIONS_BASE = '/api/v1/patient-prescriptions';
export const PATIENT_BILLING_BASE = '/api/v1/patient-billing';
export const PATIENT_PROFILE_BASE = '/api/v1/patient-profile';
export const PATIENT_LAB_TESTS_BASE = '/api/v1/patient-lab-tests';
export const PATIENT_MESSAGING_BASE = '/api/v1/patient-messaging';
export const PATIENT_DISCHARGE_SUMMARY_BASE = '/api/v1/patient-discharge-summary';

/** Auth: hospital-admin change password (e.g. after first login with temp password) */
export const AUTH_HOSPITAL_ADMIN_CHANGE_PASSWORD = '/api/v1/auth/hospital-admin/change-password';
/** Auth: refresh access token (optional; wire to your backend path if different). */
export const AUTH_REFRESH = '/api/v1/auth/refresh';

/** Super Admin: POST create hospital */
export const SUPER_ADMIN_HOSPITALS_CREATE = '/api/v1/auth/super-admin/hospitals';
/** Super Admin: POST create hospital admin for a hospital */
export const SUPER_ADMIN_HOSPITAL_ADMINS_CREATE = (hospitalId) => `/api/v1/auth/super-admin/hospitals/${encodeURIComponent(hospitalId)}/admins`;
/** Super Admin: GET list, GET one, PUT, PATCH status, DELETE (separate router on backend) */
export const SUPER_ADMIN_HOSPITALS = '/api/v1/super-admin/hospitals';
/** Super Admin: subscription plan management */
export const SUPER_ADMIN_SUBSCRIPTION_PLANS = '/api/v1/super-admin/plans';
/** Super Admin: notifications to hospital admins */
export const SUPER_ADMIN_NOTIFY_HOSPITAL_ADMINS = '/api/v1/super-admin/notifications/send-to-hospital-admins';
/** Super Admin: hospital subscription management */
export const SUPER_ADMIN_HOSPITAL_SUBSCRIPTION = (hospitalName) => `/api/v1/super-admin/hospitals/${encodeURIComponent(hospitalName)}/subscription`;
export const SUPER_ADMIN_HOSPITAL_ASSIGN_PLAN = (hospitalName) => `/api/v1/super-admin/hospitals/${encodeURIComponent(hospitalName)}/assign-plan`;
/** Super Admin: Profile management */
export const SUPER_ADMIN_PROFILE = '/api/v1/super-admin/profile';
export const SUPER_ADMIN_ME = '/api/v1/super-admin/me';
export const SUPER_ADMIN_ME_AVATAR = '/api/v1/super-admin/me/avatar';
export const SUPER_ADMIN_ME_SECURITY = '/api/v1/super-admin/me/security';
export const SUPER_ADMIN_ME_CHANGE_PASSWORD = '/api/v1/super-admin/me/change-password';

/** Hospital Admin: personal profile */
export const HOSPITAL_ADMIN_ME = '/api/v1/auth/me';
export const HOSPITAL_ADMIN_PROFILE = '/api/v1/hospital-admin/profile';
export const HOSPITAL_ADMIN_ME_AVATAR = '/api/v1/super-admin/me/avatar'; // Using placeholder if no specific one exists
export const HOSPITAL_ADMIN_ME_SECURITY = '/api/v1/auth/me/security';
export const HOSPITAL_ADMIN_ME_CHANGE_PASSWORD = '/api/v1/auth/hospital-admin/change-password';

/** Hospital Admin: Platform Settings */
export const HOSPITAL_ADMIN_PLATFORM_FEATURES = '/api/v1/hospital-admin/platform-settings/features';
export const HOSPITAL_ADMIN_PLATFORM_SUBSCRIPTION = '/api/v1/hospital-admin/platform-settings/subscription';
export const HOSPITAL_ADMIN_PLATFORM_PLAN = '/api/v1/hospital-admin/platform-settings/plan';
export const HOSPITAL_ADMIN_PLATFORM_HOSPITAL = '/api/v1/hospital-admin/platform-settings/hospital';
export const HOSPITAL_ADMIN_PLATFORM_MODULES = '/api/v1/hospital-admin/platform-settings/modules';
export const HOSPITAL_ADMIN_PLATFORM_USAGE = '/api/v1/hospital-admin/platform-settings/usage';
export const HOSPITAL_ADMIN_PLATFORM_COMBINED = '/api/v1/hospital-admin/platform-settings';

/** Analytics: GET overview (hospitals, subscriptions, revenue, patients, occupancy) */
export const ANALYTICS_OVERVIEW = '/api/v1/analytics/overview';
export const SUPER_ADMIN_ANALYTICS_OVERVIEW = '/api/v1/super-admin/analytics/overview';

/** Super Admin: Dashboard Overview Cards with growth metrics */
export const SUPER_ADMIN_DASHBOARD_OVERVIEW_CARDS = (periodDays = 30, trendMonths = 6) => `/api/v1/super-admin/dashboard/overview-cards?period_days=${periodDays}&trend_months=${trendMonths}`;

/** Analytics: GET audit logs with filters */
export const ANALYTICS_AUDIT_LOGS = (resourceType = 1, skip = 0, limit = 50) => `/api/v1/analytics/audit-logs?resource_type=${resourceType}&skip=${skip}&limit=${limit}`;

/** Super Admin: Financial Analytics - POST with filter body (date_from, date_to, hospital_id) */
export const SUPER_ADMIN_FINANCIAL_ANALYTICS = '/api/v1/super-admin/financial-analytics';

/** Super Admin: Subscription Analytics - POST with filter body (date_from, date_to, hospital_id) */
export const SUPER_ADMIN_SUBSCRIPTION_ANALYTICS = '/api/v1/super-admin/subscription-analytics';

/** Super Admin: Performance Analytics */
export const SUPER_ADMIN_PERFORMANCE_ANALYTICS = '/api/v1/super-admin/performance-analytics';

// SUPPORT MANAGEMENT ENDPOINTS
/** Super Admin: Support Tickets */
export const SUPER_ADMIN_SUPPORT_TICKETS = '/api/v1/super-admin/support/tickets';
export const SUPER_ADMIN_SUPPORT_TICKET_STATUS = (ticketId) => `/api/v1/super-admin/support/tickets/${ticketId}/status`;
export const SUPER_ADMIN_SUPPORT_TICKET_DETAILS = (ticketId) => `/api/v1/super-admin/support/tickets/${ticketId}`;

/** Public demo request form */
export const DEMO_REQUEST = '/demo/request';

/** Public contact form */
export const CONTACT_SEND = '/contact/send';

/** Hospital Admin: dashboard endpoints */
export const HOSPITAL_ADMIN_DASHBOARD_OVERVIEW = '/api/v1/hospital-admin/dashboard/overview';
export const HOSPITAL_ADMIN_DASHBOARD_APPOINTMENT_STATS = '/api/v1/hospital-admin/dashboard/appointment-stats';
export const HOSPITAL_ADMIN_DASHBOARD_STAFF_STATS = '/api/v1/hospital-admin/dashboard/staff-stats';

/** Hospital Admin: audit logs */
export const HOSPITAL_ADMIN_AUDIT_LOGS = '/api/v1/hospital-admin/audit-logs';

// HOSPITAL ADMIN - STAFF MANAGEMENT ENDPOINTS
export const HOSPITAL_ADMIN_STAFF = '/api/v1/hospital-admin/staff';
export const HOSPITAL_ADMIN_STAFF_DETAILS = (staffId) => `/api/v1/hospital-admin/staff/${encodeURIComponent(staffId)}`;
export const HOSPITAL_ADMIN_STAFF_STATUS = (staffId) => `/api/v1/hospital-admin/staff/${encodeURIComponent(staffId)}/status`;
export const HOSPITAL_ADMIN_STAFF_RESET_PASSWORD = (staffId) => `/api/v1/hospital-admin/staff/${encodeURIComponent(staffId)}/reset-password`;

// HOSPITAL ADMIN - DEPARTMENT MANAGEMENT ENDPOINTS
export const HOSPITAL_ADMIN_DEPARTMENTS = '/api/v1/hospital-admin/departments';
export const HOSPITAL_ADMIN_DEPARTMENT_DETAILS = (departmentId) => `/api/v1/hospital-admin/departments/${encodeURIComponent(departmentId)}`;
export const HOSPITAL_ADMIN_DEPARTMENT_STATUS = (departmentId) => `/api/v1/hospital-admin/departments/${encodeURIComponent(departmentId)}/status`;
export const HOSPITAL_ADMIN_DEPARTMENT_CREATE = '/api/v1/hospital-admin/departments';
export const HOSPITAL_ADMIN_DEPARTMENT_UPDATE = (departmentId) => `/api/v1/hospital-admin/departments/${encodeURIComponent(departmentId)}`;
export const HOSPITAL_ADMIN_DEPARTMENT_DELETE = (departmentId) => `/api/v1/hospital-admin/departments/${encodeURIComponent(departmentId)}`;

// HOSPITAL ADMIN - APPOINTMENT OVERSIGHT
export const HOSPITAL_ADMIN_APPOINTMENTS = '/api/v1/hospital-admin/appointments';
export const HOSPITAL_ADMIN_APPOINTMENT_DETAILS = (appointmentId) => `/api/v1/hospital-admin/appointments/${encodeURIComponent(appointmentId)}`;
export const HOSPITAL_ADMIN_APPOINTMENT_STATUS_UPDATE = (appointmentId) => `/api/v1/hospital-admin/appointments/${encodeURIComponent(appointmentId)}/status`;

/** Hospital Admin: assign / unassign staff to departments (by names) */
export const HOSPITAL_ADMIN_DEPARTMENTS_ASSIGN_STAFF = '/api/v1/hospital-admin/departments/assign-staff';
export const HOSPITAL_ADMIN_DEPARTMENTS_UNASSIGN_STAFF = '/api/v1/hospital-admin/departments/unassign-staff';

/** GET staff assigned to a department (path uses department name) */
export const HOSPITAL_ADMIN_DEPARTMENT_STAFF_BY_NAME = (departmentName) => `/api/v1/hospital-admin/departments/${encodeURIComponent(departmentName)}/staff`;

/** GET departments for a staff member (path uses staff display name) */
export const HOSPITAL_ADMIN_STAFF_DEPARTMENTS_BY_NAME = (staffName) => `/api/v1/hospital-admin/staff/${encodeURIComponent(staffName)}/departments`;

/** Hospital Admin: ward & bed management */
export const HOSPITAL_ADMIN_WARDS = '/api/v1/hospital-admin/wards';
export const HOSPITAL_ADMIN_WARD = (wardId) => `/api/v1/hospital-admin/wards/${encodeURIComponent(wardId)}`;
export const HOSPITAL_ADMIN_WARD_STATUS = (wardId) => `/api/v1/hospital-admin/wards/${encodeURIComponent(wardId)}/status`;
export const HOSPITAL_ADMIN_BEDS = '/api/v1/hospital-admin/beds';
export const HOSPITAL_ADMIN_BED = (bedId) => `/api/v1/hospital-admin/beds/${encodeURIComponent(bedId)}`;
export const HOSPITAL_ADMIN_BED_STATUS = (bedId) => `/api/v1/hospital-admin/beds/${encodeURIComponent(bedId)}/status`;

/** Hospital Admin: admissions (bed assignment / discharge flow) */
export const HOSPITAL_ADMIN_ADMISSIONS = '/api/v1/hospital-admin/admissions';
export const HOSPITAL_ADMIN_ADMISSION_ASSIGN_BED = (admissionId) => `/api/v1/hospital-admin/admissions/${encodeURIComponent(admissionId)}/assign-bed`;
export const HOSPITAL_ADMIN_ADMISSION_DISCHARGE = (admissionId) => `/api/v1/hospital-admin/admissions/${encodeURIComponent(admissionId)}/discharge`;

/** Doctor: schedule management */
export const DOCTOR_SCHEDULE_WEEKLY = '/api/v1/doctor-management/schedule/weekly';
export const DOCTOR_SCHEDULE_SLOTS = '/api/v1/doctor-management/schedule/slots';
export const DOCTOR_SCHEDULE_CREATE = '/api/v1/doctor-management/schedule/create';
export const DOCTOR_SCHEDULE_SLOT_DETAILS = (scheduleId) => `/api/v1/doctor-management/schedule/${encodeURIComponent(scheduleId)}`;
export const DOCTOR_STATISTICS_SUMMARY = (period = 'month') => `/api/v1/doctor-management/statistics/summary?period=${period}`;

/** Doctor: profile management */
export const DOCTOR_PROFILE = '/api/v1/doctor-sidebar/profile';
export const DOCTOR_PROFILE_UPDATE = '/api/v1/doctor-sidebar/profile';

/** Doctor: reports and analytics */
export const DOCTOR_REPORTS_PRACTICE_OVERVIEW = '/api/v1/doctor-reports-analytics/practice-overview';
export const DOCTOR_REPORTS_PATIENT_ANALYTICS = '/api/v1/doctor-reports-analytics/patient-analytics';
export const DOCTOR_REPORTS_APPOINTMENT_ANALYTICS = '/api/v1/doctor-reports-analytics/appointment-analytics';
export const DOCTOR_REPORTS_CLINICAL_OUTCOMES = '/api/v1/doctor-reports-analytics/clinical-outcomes';
export const DOCTOR_REPORTS_FINANCIAL_SUMMARY = '/api/v1/doctor-reports-analytics/financial-summary';
export const DOCTOR_REPORTS_PERFORMANCE_METRICS = '/api/v1/doctor-reports-analytics/performance-metrics';
export const DOCTOR_REPORTS_COMPARATIVE_ANALYSIS = '/api/v1/doctor-reports-analytics/comparative-analysis';
export const DOCTOR_REPORTS_GENERATE_CUSTOM_REPORT = '/api/v1/doctor-reports-analytics/generate-custom-report';
export const DOCTOR_REPORTS_EXPORT_OPTIONS = '/api/v1/doctor-reports-analytics/export-options';

/** Receptionist: profile management */
export const RECEPTIONIST_PROFILE = '/api/v1/receptionist/profile';
/** Receptionist: profile update */
export const RECEPTIONIST_PROFILE_UPDATE = '/api/v1/receptionist/profile';
/** Receptionist: patient registration */
export const RECEPTIONIST_PATIENT_REGISTER = '/api/v1/receptionist/patients/register';
export const RECEPTIONIST_PATIENT_SEARCH = '/api/v1/receptionist/patients/search';
export const RECEPTIONIST_PATIENT_PROFILE = (patientId) => `/api/v1/receptionist/patients/${encodeURIComponent(patientId)}/profile`;
export const RECEPTIONIST_PATIENT_UPDATE = (patientId) => `/api/v1/receptionist/patients/${encodeURIComponent(patientId)}`;
export const RECEPTIONIST_PATIENT_DOCUMENTS_UPLOAD = '/api/v1/receptionist/patient-documents/upload';
export const RECEPTIONIST_PATIENT_DOCUMENTS = (patientRef) => `/api/v1/receptionist/patients/${encodeURIComponent(patientRef)}/documents`;

/** Receptionist: dashboard overview */
export const RECEPTIONIST_DASHBOARD_OVERVIEW = '/api/v1/receptionist/dashboard';
/** Receptionist: Department management */
export const DEPARTMENT_LIST = '/api/v1/departments';
export const DEPARTMENT_SEARCH = '/api/v1/departments/search';
export const DEPARTMENT_STATISTICS = '/api/v1/departments/statistics';
export const DEPARTMENT_DETAILS = (id) => `/api/v1/departments/${encodeURIComponent(id)}`;
export const DEPARTMENT_DOCTORS = (id) => `/api/v1/receptionist/departments/${encodeURIComponent(id)}/doctors`;
export const DEPARTMENT_NURSES = (id) => `/api/v1/receptionist/departments/${encodeURIComponent(id)}/nurses`;
export const DEPARTMENT_BEDS = (id) => `/api/v1/receptionist/departments/${encodeURIComponent(id)}/beds`;

/** Receptionist: Doctor management */
export const DOCTOR_LIST = '/api/v1/doctors';
export const DOCTOR_SEARCH = '/api/v1/doctors/search';
export const DOCTOR_DROPDOWN = '/api/v1/doctors/dropdown';
export const DOCTOR_STATISTICS = '/api/v1/doctors/statistics';
export const DOCTOR_DETAILS = (id) => `/api/v1/doctors/${encodeURIComponent(id)}`;
/** Receptionist: Doctor management */
export const RECEPTIONIST_DOCTORS = '/api/v1/receptionist/doctors';
export const RECEPTIONIST_DOCTORS_SEARCH = '/api/v1/receptionist/doctors/search';
export const RECEPTIONIST_DOCTORS_DROPDOWN = '/api/v1/receptionist/doctors/dropdown';
export const RECEPTIONIST_DOCTORS_STATISTICS = '/api/v1/receptionist/doctors/statistics';
export const RECEPTIONIST_DOCTOR_DETAILS = (id) => `/api/v1/receptionist/doctors/${encodeURIComponent(id)}`;
/** Prescription Management - Doctor endpoints */
export const PRESCRIPTION_MEDICINES_SEARCH = '/api/v1/simple-prescription/doctor/medicines/search';
export const PRESCRIPTION_CREATE = '/api/v1/simple-prescription/doctor/prescriptions/create';
export const PRESCRIPTION_DOCTOR_LIST = '/api/v1/simple-prescription/doctor/prescriptions';
/** Prescription Management - Pharmacist endpoints */
export const PRESCRIPTION_PHARMACIST_LIST = '/api/v1/simple-prescription/pharmacist/prescriptions';
export const PRESCRIPTION_DISPENSE = (prescriptionId) => `/api/v1/simple-prescription/pharmacist/prescriptions/${encodeURIComponent(prescriptionId)}/dispense`;
/** Prescription Management - Patient endpoints */
export const PRESCRIPTION_PATIENT_LIST = '/api/v1/simple-prescription/patient/prescriptions';

/** Prescription Management - Common endpoints */
export const PRESCRIPTION_DETAILS = (prescriptionId) => `/api/v1/simple-prescription/prescriptions/${encodeURIComponent(prescriptionId)}`;
export const PRESCRIPTION_PDF_DOWNLOAD = (prescriptionId) => `/api/v1/simple-prescription/prescriptions/${encodeURIComponent(prescriptionId)}/pdf`;
/** Receptionist: patient management */
export const RECEPTIONIST_PATIENTS = '/api/v1/receptionist/patients';

// --- RECEPTIONIST APPOINTMENTS ---
export const RECEPTIONIST_QUICK_ACTIONS = '/api/v1/receptionist/quick-actions';
export const RECEPTIONIST_APPOINTMENTS_STATUS_SUMMARY = '/api/v1/receptionist/appointments/status-summary';
export const RECEPTIONIST_APPOINTMENTS_STATISTICS = '/api/v1/receptionist/appointments/statistics';
export const RECEPTIONIST_APPOINTMENTS_TODAY = '/api/v1/receptionist/appointments/today';
export const RECEPTIONIST_APPOINTMENTS_QUEUE = '/api/v1/receptionist/appointments/queue';
export const RECEPTIONIST_APPOINTMENTS_AVAILABLE_SLOTS = (doctorId, date) => `/api/v1/receptionist/appointments/available-slots?doctor=${encodeURIComponent(doctorId)}&date=${encodeURIComponent(date)}`;
export const PUBLIC_APPOINTMENTS_AVAILABLE_SLOTS = (doctorId, date) => `/api/v1/public/appointments/available-slots?doctor=${encodeURIComponent(doctorId)}&date=${encodeURIComponent(date)}`;
export const STAFF_DOCTOR_SCHEDULES = (doctorName) => `/api/v1/staff/doctor-schedules/${encodeURIComponent(doctorName)}`;
export const STAFF_DOCTOR_CHECK_SLOTS = (doctorName, date) => `/api/v1/staff/doctor-schedules/${encodeURIComponent(doctorName)}/check-slots?date=${encodeURIComponent(date)}`;
export const RECEPTIONIST_APPOINTMENTS_REF = (appointmentId) => `/api/v1/receptionist/appointments/${encodeURIComponent(appointmentId)}`;
export const RECEPTIONIST_APPOINTMENTS_SCHEDULE = 'https://hms-backend-2av4.onrender.com/api/v1/receptionist/appointments/schedule';
export const RECEPTIONIST_APPOINTMENTS_CANCEL = (appointmentId) => `/api/v1/receptionist/appointments/${encodeURIComponent(appointmentId)}/cancel`;
export const RECEPTIONIST_APPOINTMENTS_STATUS = (appointmentId) => `/api/v1/receptionist/appointments/${encodeURIComponent(appointmentId)}/status`;
export const RECEPTIONIST_APPOINTMENTS_CHECK_IN = (appointmentId) => `/api/v1/receptionist/appointments/${encodeURIComponent(appointmentId)}/check-in`;

// --- PHARMACY REPORTS ---
export const PHARMACY_REPORTS_BASE = '/api/v1/pharmacy/reports';
export const PHARMACY_REPORTS_SALES_SUMMARY = `${PHARMACY_REPORTS_BASE}/sales-summary`;
export const PHARMACY_REPORTS_STOCK_VALUATION = `${PHARMACY_REPORTS_BASE}/stock-valuation`;
export const PHARMACY_REPORTS_EXPIRY = `${PHARMACY_REPORTS_BASE}/expiry`;
export const PHARMACY_REPORTS_FAST_SLOW_MOVING = `${PHARMACY_REPORTS_BASE}/fast-slow-moving`;
export const PHARMACY_REPORTS_PROFIT_MARGINS = `${PHARMACY_REPORTS_BASE}/profit-margins`;

// --- PHARMACY ---
export const PHARMACY_INVENTORY_BASE = '/api/v1/pharmacy/inventory';
export const PHARMACY_MEDICINES_BASE = '/api/v1/pharmacy/medicines';
export const PHARMACY_SUPPLIERS_BASE = '/api/v1/pharmacy/suppliers';
export const PHARMACY_PURCHASE_ORDERS_BASE = '/api/v1/pharmacy/purchase-orders';
export const PHARMACY_GRN_BASE = '/api/v1/pharmacy/grn';
export const PHARMACY_STOCK_BASE = '/api/v1/pharmacy/stock';
export const PHARMACY_SALES_BASE = '/api/v1/pharmacy/sales';
export const PHARMACY_RETURNS_BASE = '/api/v1/pharmacy/returns';
export const PHARMACY_ALERTS_BASE = '/api/v1/pharmacy/alerts';
export const PHARMACY_DASHBOARD_OVERVIEW = '/api/v1/pharmacy/dashboard/overview';
export const PHARMACY_SETTINGS_BASE = '/api/v1/pharmacy/settings';

// --- NURSE ---
export const NURSE_BASE = '/api/v1/nurse';
// NURSE DASHBOARD APIs
export const NURSE_DASHBOARD_OVERVIEW = '/api/v1/nurse/dashboard';

export const NURSE_ADD_VITALS = '/api/v1/nurse/vitals';
export const NURSE_GET_VITALS = '/api/v1/nurse/vitals';
export const NURSE_UPDATE_VITALS = (recordId) => `/api/v1/nurse/vitals/${encodeURIComponent(recordId)}`;
export const NURSE_ASSIGNED_PATIENTS = '/api/v1/nurse/assigned-patients';
export const NURSE_MEDICATIONS = '/api/v1/nurse/medications';
export const NURSE_UPDATE_MEDICATION = (recordId) => `/api/v1/nurse/medications/${encodeURIComponent(recordId)}`;
export const NURSE_BEDS = '/api/v1/nurse/beds';
export const NURSE_UPDATE_BED = (bedId) => `/api/v1/nurse/beds/${encodeURIComponent(bedId)}`;
export const NURSE_LAB_TESTS = '/api/v1/nurse/lab-tests';
export const NURSE_UPDATE_LAB_TEST = (recordId) => `/api/v1/nurse/lab-tests/${encodeURIComponent(recordId)}`;
export const NURSE_NURSING_NOTES = '/api/v1/nurse/nursing-notes';
export const NURSE_DISCHARGE_SUPPORT = '/api/v1/nurse/discharge-support';
export const NURSE_DISCHARGE_SUMMARY = '/api/v1/nurse/discharge-summary';
 
// --- LAB MANAGEMENT ---
export const LAB_BASE = '/api/v1/lab';
export const LAB_TECH_DASHBOARD = `${LAB_BASE}/tech-dashboard`;
export const LAB_REPORT_GENERATION = `${LAB_BASE}/report-generation`;
export const LAB_EQUIPMENT = `${LAB_BASE}/equipment-tracking`;
export const LAB_SAMPLES = `${LAB_BASE}/samples`;
export const LAB_RESULT_ACCESS = `${LAB_BASE}/result-access`;
export const LAB_RESULT_ACCESS_GRANT = `${LAB_RESULT_ACCESS}/grant`;
export const LAB_EQUIPMENT_QC_BASE = `${LAB_BASE}/equipment-qc/equipment`;
export const LAB_EQUIPMENT_DETAILS = (id) => `${LAB_EQUIPMENT_QC_BASE}/${encodeURIComponent(id)}`;
export const LAB_EQUIPMENT_LOGS = (id) => `${LAB_EQUIPMENT_QC_BASE}/${encodeURIComponent(id)}/logs`;
export const LAB_EQUIPMENT_STATUS = (id) => `${LAB_EQUIPMENT_QC_BASE}/${encodeURIComponent(id)}/status`;

// --- OPD MANAGEMENT ---
export const OPD_PATIENT_CREATE = '/api/v1/opd/patient';
export const OPD_TOKENS = '/api/v1/opd/tokens';
export const OPD_TOKEN_DETAILS = (id) => `/api/v1/opd/tokens/${encodeURIComponent(id)}`;
export const OPD_PATIENTS_LIST = '/api/v1/opd/patients';
export const OPD_PATIENT_STATUS = (visitId) => `/api/v1/opd/patient/${encodeURIComponent(visitId)}/status`;
export const OPD_PATIENT_DELETE = (visitId) => `/api/v1/opd/patient/${encodeURIComponent(visitId)}`;
export const OPD_DOCTORS = '/api/v1/opd/doctors';
export const OPD_DOCTOR_CONFIG = '/api/v1/opd/doctor';
export const OPD_DOCTOR_TOGGLE_STATUS = (doctorUserId) => `/api/v1/opd/doctor/${encodeURIComponent(doctorUserId)}/toggle-status`;
export const OPD_CONSULTATION = '/api/v1/opd/consultation';
export const OPD_CONSULTATION_START = '/api/v1/opd/consultations/start';
export const OPD_CONSULTATION_COMPLETE = (id) => `/api/v1/opd/consultations/${encodeURIComponent(id)}/complete`;
export const OPD_CONSULTATION_DETAILS = (id) => `/api/v1/opd/consultations/${encodeURIComponent(id)}`;
export const OPD_CONSULTATION_BY_PATIENT = (patientId) => `/api/v1/opd/consultation/${encodeURIComponent(patientId)}`;
export const OPD_TRANSFER = '/api/v1/opd/transfer';
export const OPD_TRANSFER_PATIENT = '/api/v1/opd/transfer-patient';
export const OPD_DASHBOARD_STATS = '/api/v1/opd/dashboard';

/** IPD Management APIs */
export const IPD_ADMISSIONS = '/api/v1/ipd-management/admissions';
export const IPD_AVAILABLE_PATIENTS = '/api/v1/ipd-management/available-patients';
export const IPD_PATIENTS = '/api/v1/ipd-management/patients';
export const IPD_ADMISSION_DETAILS = (admissionNumber) => `/api/v1/ipd-management/admissions/${encodeURIComponent(admissionNumber)}`;
export const IPD_DOCTOR_ROUNDS = '/api/v1/ipd-management/doctor-rounds';
export const IPD_DASHBOARD = '/api/v1/ipd-management/dashboard';

/** Hospital Admin - Ward & Bed Management */
export const HOSPITAL_WARDS = '/api/v1/hospital-admin/wards';
export const HOSPITAL_WARD_DETAILS = (wardId) => `/api/v1/hospital-admin/wards/${encodeURIComponent(wardId)}`;
export const HOSPITAL_WARD_STATUS = (wardId) => `/api/v1/hospital-admin/wards/${encodeURIComponent(wardId)}/status`;
export const HOSPITAL_BEDS = '/api/v1/hospital-admin/beds';
export const HOSPITAL_BED_DETAILS = (bedId) => `/api/v1/hospital-admin/beds/${encodeURIComponent(bedId)}`;
export const HOSPITAL_BED_STATUS = (bedId) => `/api/v1/hospital-admin/beds/${encodeURIComponent(bedId)}/status`;

/** Nurse Module - Beds */

export const NURSE_BED_DETAILS = (bedId) => `/api/v1/nurse/beds/${encodeURIComponent(bedId)}`;
 