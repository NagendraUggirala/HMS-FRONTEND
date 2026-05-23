// src/config/api.js  apiConfig.js - Add support endpoints
/*
 * Backend API base URL (`BASE_URL` + paths = e.g. http://localhost:8060/api/v1/...).
 * In dev: empty string so requests use the Vite dev server origin and `/api` is proxied to the backend (avoids CORS).
 * In production: set `VITE_API_BASE_URL` (e.g. http://localhost:8060).
*/
// In local dev, use Vite proxy (/api -> Render backend) to avoid browser CORS.
// In production builds, call backend directly.
export const API_BASE_URL = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_API_BASE_URL || 'https://hms-backend-t9m3.onrender.com').replace(/\/$/, '');

export const PUBLIC_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://hms-backend-t9m3.onrender.com';

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

/** Analytics: GET overview (hospitals, subscriptions, revenue, patients, occupancy) */
export const ANALYTICS_OVERVIEW = '/api/v1/analytics/overview';
export const SUPER_ADMIN_ANALYTICS_OVERVIEW = '/api/v1/super-admin/analytics/overview';

/** Super Admin: Dashboard Overview Cards with growth metrics */
export const SUPER_ADMIN_DASHBOARD_OVERVIEW_CARDS = (periodDays = 30, trendMonths = 6) =>
  `/api/v1/super-admin/dashboard/overview-cards?period_days=${periodDays}&trend_months=${trendMonths}`;

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

/** Receptionist: profile management */
export const RECEPTIONIST_PROFILE = '/api/v1/receptionist/profile';

/** Receptionist: profile update */
export const RECEPTIONIST_PROFILE_UPDATE = '/api/v1/receptionist/profile';
/** Receptionist: patient registration */
export const RECEPTIONIST_PATIENT_REGISTER = '/api/v1/receptionist/patients/register';

/** Receptionist: dashboard overview */
export const RECEPTIONIST_DASHBOARD_OVERVIEW = '/api/v1/receptionist/dashboard';

/** Receptionist: patient management */
export const RECEPTIONIST_PATIENTS = '/api/v1/receptionist/patients';
export const RECEPTIONIST_PATIENT_SEARCH = '/api/v1/receptionist/patients/search';
export const RECEPTIONIST_PATIENT_PROFILE = (patientRef) => `/api/v1/receptionist/patients/${encodeURIComponent(patientRef)}/profile`;
export const RECEPTIONIST_PATIENT_UPDATE = (patientId) => `/api/v1/receptionist/patients/${encodeURIComponent(patientId)}`;

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

/** Receptionist: Doctor management (receptionist-specific) */
export const RECEPTIONIST_DOCTORS = '/api/v1/receptionist/doctors';
export const RECEPTIONIST_DOCTORS_SEARCH = '/api/v1/receptionist/doctors/search';
export const RECEPTIONIST_DOCTORS_DROPDOWN = '/api/v1/receptionist/doctors/dropdown';
export const RECEPTIONIST_DOCTORS_STATISTICS = '/api/v1/receptionist/doctors/statistics';
export const RECEPTIONIST_DOCTOR_DETAILS = (id) => `/api/v1/receptionist/doctors/${encodeURIComponent(id)}`;
