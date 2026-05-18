// src/pages/dashboards/AdminDashboard/pages/AdminOverview.jsx
import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../../../../components/common/LoadingSpinner/LoadingSpinner';
import { apiFetch } from '../../../../services/apiClient';

const AdminOverview = ({ setActivePage }) => {
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState('');
  const [dashboardData, setDashboardData] = useState({
    // Will be filled from /overview
    dashboard_type: '',
    total_hospitals: 0,
    active_hospitals: 0,
    total_admins: 0,
    active_admins: 0,
    total_patients: 0,

    // Hospital Admin dashboard OVERVIEW (nested metrics)
    patient_metrics: {
      total_patients: 0,
      active_patients: 0,
      patient_activity_rate: 0,
    },
    staff_metrics: {
      total_staff: 0,
      total_doctors: 0,
      active_doctors: 0,
      doctor_utilization_rate: 0,
    },
    appointment_metrics: {
      todays_appointments: 0,
      monthly_appointments: 0,
      completed_appointments: 0,
      appointment_completion_rate: 0,
    },
    bed_metrics: {
      total_beds: 0,
      occupied_beds: 0,
      available_beds: 0,
      bed_occupancy_rate: 0,
      current_admissions: 0,
      todays_admissions: 0,
      todays_discharges: 0,
    },
    facility_metrics: {
      total_departments: 0,
      total_wards: 0,
    },
    revenue_metrics: {
      monthly_consultation_revenue: 0,
      monthly_payments: 0,
      total_monthly_revenue: 0,
    },
    recent_activity: [],

    // Will be filled from /appointment-stats
    appointment_report_type: '',
    total_appointments: 0,
    appointments_today: 0,
    appointments_this_week: 0,
    appointments_by_status: {},
    appointments_by_department: {},
    // Will be filled from /staff-stats
    staff_report_type: '',
    total_staff: 0,
    active_staff: 0,
    staff_by_role: {},
    staff_by_department: {},
    criticalAlerts: [],
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setWarning('');

    try {
      const unwrap = (json) => json?.data ?? json ?? {};

      const toDictOfNumbers = (maybeObj) => {
        if (!maybeObj || typeof maybeObj !== 'object' || Array.isArray(maybeObj)) return {};
        return Object.fromEntries(
          Object.entries(maybeObj).map(([k, v]) => [k, typeof v === 'number' ? v : Number(v) || 0])
        );
      };

      const parseAppointmentStats = (raw) => {
        const reportType = raw?.report_type ?? raw?.reportType ?? '';

        // Flat shape
        if (raw?.total_appointments !== undefined || raw?.appointments_today !== undefined) {
          return {
            appointment_report_type: reportType,
            total_appointments: raw?.total_appointments ?? 0,
            appointments_today: raw?.appointments_today ?? 0,
            appointments_this_week: raw?.appointments_this_week ?? 0,
            appointments_by_status: toDictOfNumbers(raw?.appointments_by_status),
            appointments_by_department: toDictOfNumbers(raw?.appointments_by_department),
          };
        }

        // Nested shape (as seen in your validation error)
        const overall = raw?.overall_statistics ?? {};
        const time = raw?.time_period_breakdown ?? {};
        const departmentBreakdown = raw?.department_breakdown;

        const appointments_by_status = {
          completed: overall?.completed_appointments ?? 0,
          cancelled: overall?.cancelled_appointments ?? 0,
          no_show: overall?.no_show_appointments ?? 0,
          pending: overall?.pending_appointments ?? 0,
          emergency: overall?.emergency_appointments ?? 0,
        };

        let appointments_by_department = {};
        if (departmentBreakdown) {
          if (typeof departmentBreakdown === 'object' && !Array.isArray(departmentBreakdown)) {
            // Already a dict
            appointments_by_department = toDictOfNumbers(departmentBreakdown);
          } else if (Array.isArray(departmentBreakdown)) {
            // Array entries
            appointments_by_department = Object.fromEntries(
              departmentBreakdown
                .map((item) => {
                  const dept =
                    item?.department ??
                    item?.department_name ??
                    item?.name ??
                    item?.dept ??
                    item?.department_id;
                  const count = item?.total_appointments ?? item?.total ?? item?.count ?? 0;
                  return dept ? [String(dept), Number(count) || 0] : null;
                })
                .filter(Boolean)
            );
          }
        }

        return {
          appointment_report_type: reportType,
          total_appointments: overall?.total_appointments ?? 0,
          appointments_today: time?.today?.total ?? 0,
          appointments_this_week: time?.this_week?.total ?? 0,
          appointments_by_status,
          appointments_by_department,
        };
      };

      const parseStaffStats = (raw) => {
        const reportType = raw?.report_type ?? raw?.reportType ?? '';
        const summary = raw?.summary ?? {};
        const roleBreakdown = Array.isArray(raw?.role_breakdown) ? raw.role_breakdown : [];
        const departmentDistribution = Array.isArray(raw?.department_distribution) ? raw.department_distribution : [];

        const staff_by_role = Object.fromEntries(
          roleBreakdown
            .map((item) => {
              const role = item?.role ?? item?.name ?? item?.position ?? null;
              const count = item?.active_count ?? item?.total_count ?? item?.total ?? item?.count ?? 0;
              return role ? [String(role), Number(count) || 0] : null;
            })
            .filter(Boolean)
        );

        const staff_by_department = Object.fromEntries(
          departmentDistribution
            .map((item) => {
              const dept = item?.department ?? item?.department_name ?? item?.name ?? null;
              const count = item?.active_count ?? item?.total_count ?? item?.total ?? item?.count ?? 0;
              return dept ? [String(dept), Number(count) || 0] : null;
            })
            .filter(Boolean)
        );

        return {
          staff_report_type: reportType,
          total_staff: summary?.total_staff ?? 0,
          active_staff: summary?.active_staff ?? 0,
          staff_by_role,
          staff_by_department,
        };
      };

      const [overviewRes, appointmentRes, staffRes] = await Promise.allSettled([
        apiFetch('/api/v1/hospital-admin/dashboard/overview'),
        apiFetch('/api/v1/hospital-admin/dashboard/appointment-stats'),
        apiFetch('/api/v1/hospital-admin/dashboard/staff-stats'),
      ]);

      const warnings = [];
      let overview = {};
      let appointmentRaw = null;
      let staffRaw = null;

      if (overviewRes.status === 'fulfilled') {
        if (overviewRes.value.ok) {
          overview = unwrap(await overviewRes.value.json().catch(() => ({})));
        } else {
          warnings.push(`Overview failed (${overviewRes.value.status})`);
        }
      } else {
        warnings.push('Overview request failed');
      }

      if (appointmentRes.status === 'fulfilled') {
        if (appointmentRes.value.ok) {
          appointmentRaw = unwrap(await appointmentRes.value.json().catch(() => ({})));
        } else {
          warnings.push(`Appointment stats failed (${appointmentRes.value.status})`);
        }
      } else {
        warnings.push('Appointment stats request failed');
      }

      if (staffRes.status === 'fulfilled') {
        if (staffRes.value.ok) {
          staffRaw = unwrap(await staffRes.value.json().catch(() => ({})));
        } else {
          warnings.push(`Staff stats failed (${staffRes.value.status})`);
        }
      } else {
        warnings.push('Staff stats request failed');
      }

      const appointmentParsed = appointmentRaw ? parseAppointmentStats(appointmentRaw) : null;
      const staffParsed = staffRaw ? parseStaffStats(staffRaw) : null;

      setDashboardData((prev) => ({
        ...prev,
        // Overview fields
        dashboard_type: overview?.dashboard_type ?? '',
        total_hospitals: overview?.total_hospitals ?? 0, // not provided by your current backend overview payload
        active_hospitals: overview?.active_hospitals ?? 0, // not provided by your current backend overview payload
        total_admins: overview?.total_admins ?? 0, // not provided by your current backend overview payload
        active_admins: overview?.active_admins ?? 0, // not provided by your current backend overview payload

        total_patients: overview?.patient_metrics?.total_patients ?? 0,

        patient_metrics: overview?.patient_metrics ?? prev.patient_metrics,
        staff_metrics: overview?.staff_metrics ?? prev.staff_metrics,
        appointment_metrics: overview?.appointment_metrics ?? prev.appointment_metrics,
        bed_metrics: overview?.bed_metrics ?? prev.bed_metrics,
        facility_metrics: overview?.facility_metrics ?? prev.facility_metrics,
        revenue_metrics: overview?.revenue_metrics ?? prev.revenue_metrics,
        recent_activity: Array.isArray(overview?.recent_activity) ? overview.recent_activity : prev.recent_activity,

        // Appointment fields
        appointment_report_type: appointmentParsed?.appointment_report_type ?? '',
        total_appointments: appointmentParsed?.total_appointments ?? 0,
        // Fallback to overview metrics if the appointment-stats parsing fails/changes
        appointments_today: appointmentParsed?.appointments_today ?? overview?.appointment_metrics?.todays_appointments ?? 0,
        appointments_this_week: appointmentParsed?.appointments_this_week ?? 0,
        appointments_by_status: appointmentParsed?.appointments_by_status ?? {},
        appointments_by_department: appointmentParsed?.appointments_by_department ?? {},

        // Staff fields
        staff_report_type: staffParsed?.staff_report_type ?? '',
        total_staff: staffParsed?.total_staff ?? overview?.staff_metrics?.total_staff ?? 0,
        active_staff: staffParsed?.active_staff ?? overview?.staff_metrics?.total_staff ?? 0,
        staff_by_role: staffParsed?.staff_by_role ?? {},
        staff_by_department: staffParsed?.staff_by_department ?? {},
        
        // Critical alerts dynamically calculated
        criticalAlerts: (() => {
          const generatedAlerts = [];
          let alertId = 1;

          const bedOccupancyRate = overview?.bed_metrics?.bed_occupancy_rate || 0;
          if (bedOccupancyRate >= 90) {
            generatedAlerts.push({
              id: alertId++, type: 'bed', severity: 'high',
              message: `High bed occupancy: ${bedOccupancyRate.toFixed(1)}% capacity reached`, time: 'Just now'
            });
          } else if (bedOccupancyRate >= 80) {
            generatedAlerts.push({
              id: alertId++, type: 'bed', severity: 'medium',
              message: `Bed occupancy at ${bedOccupancyRate.toFixed(1)}% capacity`, time: 'Just now'
            });
          }

          const tStaff = staffParsed?.total_staff || overview?.staff_metrics?.total_staff || 0;
          const aStaff = staffParsed?.active_staff || overview?.staff_metrics?.active_staff || 0;
          const sLeave = tStaff - aStaff;
          if (tStaff > 0 && sLeave > 0) {
            generatedAlerts.push({
              id: alertId++, type: 'staff', severity: sLeave > 5 ? 'high' : 'medium',
              message: `${sLeave} staff member${sLeave > 1 ? 's' : ''} currently on leave or inactive`, time: 'Just now'
            });
          }

          const pendingAppts = appointmentParsed?.appointments_by_status?.pending || 0;
          if (pendingAppts > 10) {
            generatedAlerts.push({
              id: alertId++, type: 'appointments', severity: 'medium',
              message: `${pendingAppts} appointments pending review`, time: 'Just now'
            });
          }

          return Array.isArray(overview?.critical_alerts) && overview.critical_alerts.length > 0 
            ? overview.critical_alerts 
            : generatedAlerts;
        })(),
      }));

      if (warnings.length) setWarning(warnings.join(' • '));
    } catch (err) {
      setWarning(err.message || 'An error occurred while loading dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setActivePage(page);
  };

  const handleAlertClick = (alertType) => {
    switch (alertType) {
      case 'bed':
        setActivePage('inpatient');
        break;
      case 'staff':
        setActivePage('staff');
        break;
      case 'equipment':
        setActivePage('settings');
        break;
      default:
        setActivePage('dashboard');
    }
  };

  if (loading) return <LoadingSpinner />;

  // Compute derived values
  const staffOnLeave = dashboardData.total_staff - dashboardData.active_staff;
  const topStaffRoles = Object.entries(dashboardData.staff_by_role)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const topStaffDepts = Object.entries(dashboardData.staff_by_department)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const totalAppointments = dashboardData.total_appointments;
  const appointmentsToday = dashboardData.appointments_today;
  const appointmentsThisWeek = dashboardData.appointments_this_week;
  const statusBreakdown = Object.entries(dashboardData.appointments_by_status);
  const topAppointmentDepts = Object.entries(dashboardData.appointments_by_department)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const percent = (num, den) => (den > 0 ? Math.min(100, Math.max(0, (num / den) * 100)) : 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-700">
            Dashboard Overview
          </h2>
          {dashboardData.dashboard_type ? (
            <p className="text-sm text-gray-500 mt-1">
              Type: <span className="font-medium text-gray-700">{dashboardData.dashboard_type}</span>
            </p>
          ) : null}
          {(dashboardData.staff_report_type || dashboardData.appointment_report_type) ? (
            <p className="text-xs text-gray-500 mt-1">
              {dashboardData.staff_report_type ? `Staff: ${dashboardData.staff_report_type}` : null}
              {dashboardData.staff_report_type && dashboardData.appointment_report_type ? ' • ' : null}
              {dashboardData.appointment_report_type ? `Appointments: ${dashboardData.appointment_report_type}` : null}
            </p>
          ) : null}
          {warning ? (
            <div className="mt-2 flex items-center gap-3">
              <p className="text-sm text-amber-700">{warning}</p>
              <button
                onClick={loadDashboardData}
                className="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors text-xs font-medium"
              >
                Retry
              </button>
            </div>
          ) : null}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handlePageChange('inpatient')}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
          >
            <i className="fas fa-ambulance mr-2"></i>Emergency Protocol
          </button>
          <button
            onClick={() => handlePageChange('reports')}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
          >
            <i className="fas fa-chart-bar mr-2"></i>Generate Reports
          </button>
        </div>
      </div>

      {/* Critical Alerts Banner */}
      {dashboardData.criticalAlerts && dashboardData.criticalAlerts.length > 0 && (
        <div
          className="bg-red-50 border border-red-200 rounded-xl p-4 cursor-pointer hover:bg-red-100 transition-colors"
          onClick={() => handleAlertClick(dashboardData.criticalAlerts[0].type)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <i className="fas fa-exclamation-triangle text-red-500 text-xl mr-3"></i>
              <div>
                <h3 className="font-semibold text-red-700">Critical Alerts</h3>
                <p className="text-red-600 text-sm">
                  {dashboardData.criticalAlerts[0].message} • {dashboardData.criticalAlerts[0].time}
                </p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePageChange('reports');
              }}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              View all ({dashboardData.criticalAlerts.length})
            </button>
          </div>
        </div>
      )}

      {/* Metrics Grid (4 fields) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Appointments */}
        <div
          className="relative bg-white rounded-xl p-5 border border-gray-200 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handlePageChange('appointments')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent pointer-events-none" />
          <div className="relative flex justify-between items-end">
            <div>
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-500 mb-3">
                <i className="fas fa-calendar-check text-white"></i>
              </div>
              <p className="text-sm text-gray-500">Total Appointments</p>
              <p className="text-2xl font-bold text-gray-900">{totalAppointments}</p>
              <p className="text-xs text-gray-400 mt-1">all time</p>
            </div>
            <div className="flex items-end gap-1 h-14">
              <div className="w-1.5 h-7 bg-blue-400 rounded"></div>
              <div className="w-1.5 h-10 bg-blue-300 rounded"></div>
              <div className="w-1.5 h-8 bg-blue-500 rounded"></div>
              <div className="w-1.5 h-12 bg-blue-400 rounded"></div>
              <div className="w-1.5 h-9 bg-blue-300 rounded"></div>
            </div>
          </div>
        </div>

        {/* Total Beds */}
        <div
          className="relative bg-white rounded-xl p-5 border border-gray-200 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handlePageChange('inpatient')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent pointer-events-none" />
          <div className="relative flex justify-between items-end">
            <div>
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-green-500 mb-3">
                <i className="fas fa-bed text-white"></i>
              </div>
              <p className="text-sm text-gray-500">Total Beds</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.bed_metrics?.total_beds || 0}</p>
              <p className="text-xs text-gray-400 mt-1">available capacity</p>
            </div>
            <div className="flex items-end gap-1 h-14">
              <div className="w-1.5 h-8 bg-green-300 rounded"></div>
              <div className="w-1.5 h-10 bg-green-400 rounded"></div>
              <div className="w-1.5 h-6 bg-green-300 rounded"></div>
              <div className="w-1.5 h-12 bg-green-500 rounded"></div>
              <div className="w-1.5 h-9 bg-green-400 rounded"></div>
            </div>
          </div>
        </div>

        {/* Total Billing */}
        <div
          className="relative bg-white rounded-xl p-5 border border-gray-200 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handlePageChange('billing')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent pointer-events-none" />
          <div className="relative flex justify-between items-end">
            <div>
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-purple-500 mb-3">
                <i className="fas fa-money-bill-wave text-white"></i>
              </div>
              <p className="text-sm text-gray-500">Total Billing</p>
              <p className="text-2xl font-bold text-gray-900">₹{dashboardData.revenue_metrics?.total_monthly_revenue?.toLocaleString() || '0'}</p>
              <p className="text-xs text-gray-400 mt-1">monthly revenue</p>
            </div>
            <svg width="70" height="40" viewBox="0 0 70 40">
              <polyline
                points="0,28 12,30 24,26 36,24 48,20 60,18"
                fill="none"
                stroke="#a855f7"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>

        {/* Total Doctors */}
        <div
          className="relative bg-white rounded-xl p-5 border border-gray-200 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handlePageChange('doctors')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-transparent pointer-events-none" />
          <div className="relative flex justify-between items-end">
            <div>
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-indigo-500 mb-3">
                <i className="fas fa-user-md text-white"></i>
              </div>
              <p className="text-sm text-gray-500">Total Doctors</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.staff_metrics?.total_doctors || 0}</p>
              <p className="text-xs text-gray-400 mt-1">active physicians</p>
            </div>
            <div className="flex items-end gap-1 h-14">
              <div className="w-1.5 h-10 bg-indigo-400 rounded"></div>
              <div className="w-1.5 h-8 bg-indigo-300 rounded"></div>
              <div className="w-1.5 h-12 bg-indigo-500 rounded"></div>
              <div className="w-1.5 h-6 bg-indigo-400 rounded"></div>
              <div className="w-1.5 h-11 bg-indigo-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Staff Status & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Staff Status */}
        <div className="relative bg-white rounded-xl p-5 border border-gray-200 shadow-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-500 mr-3">
                  <i className="fas fa-users text-white"></i>
                </div>
                <h3 className="font-semibold text-lg">Staff Status</h3>
              </div>
              <button
                onClick={() => handlePageChange('staff')}
                className="text-blue-600 text-sm hover:underline hover:text-blue-800"
              >
                Manage →
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div
                className="relative bg-white rounded-lg p-4 border border-gray-200 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all"
                onClick={() => handlePageChange('staff')}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{dashboardData.total_staff}</div>
                  <div className="text-sm text-gray-600 mt-1">Total Staff</div>
                </div>
                <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: '100%' }}></div>
                </div>
              </div>
              <div
                className="relative bg-white rounded-lg p-4 border border-gray-200 cursor-pointer hover:border-green-300 hover:shadow-sm transition-all"
                onClick={() => handlePageChange('staff')}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{dashboardData.active_staff}</div>
                  <div className="text-sm text-gray-600 mt-1">Active Staff</div>
                </div>
                <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${percent(dashboardData.active_staff, dashboardData.total_staff)}%` }}
                  ></div>
                </div>
              </div>
              <div
                className="relative bg-white rounded-lg p-4 border border-gray-200 cursor-pointer hover:border-yellow-300 hover:shadow-sm transition-all"
                onClick={() => handlePageChange('staff')}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{staffOnLeave}</div>
                  <div className="text-sm text-gray-600 mt-1">On Leave</div>
                </div>
                <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500"
                    style={{ width: `${percent(staffOnLeave, dashboardData.total_staff)}%` }}
                  ></div>
                </div>
              </div>
              <div
                className="relative bg-white rounded-lg p-4 border border-gray-200 cursor-pointer hover:border-purple-300 hover:shadow-sm transition-all"
                onClick={() => handlePageChange('staff')}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{Object.keys(dashboardData.staff_by_role).length}</div>
                  <div className="text-sm text-gray-600 mt-1">Roles</div>
                </div>
                <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500"
                    style={{ width: `${(Object.keys(dashboardData.staff_by_role).length / 10) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {topStaffRoles.length > 0 && (
              <div className="mt-4 border-t pt-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Top Roles</h4>
                <div className="space-y-2">
                  {topStaffRoles.map(([role, count]) => (
                    <div key={role} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 capitalize">{role}</span>
                      <span className="font-medium text-gray-800">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {topStaffDepts.length > 0 && (
              <div className="mt-4 border-t pt-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Top Departments</h4>
                <div className="space-y-2">
                  {topStaffDepts.map(([dept, count]) => (
                    <div key={dept} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 capitalize">{dept}</span>
                      <span className="font-medium text-gray-800">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="relative bg-white rounded-xl p-5 border border-gray-200 shadow-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-purple-500 mr-3">
                <i className="fas fa-bolt text-white"></i>
              </div>
              <h3 className="font-semibold text-lg">Quick Actions</h3>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => handlePageChange('inpatient')}
                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:shadow-sm transition-all text-left"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <i className="fas fa-bed text-blue-600"></i>
                  </div>
                  <span>Bed Allocation</span>
                </div>
                <i className="fas fa-chevron-right text-gray-400"></i>
              </button>
              <button
                onClick={() => handlePageChange('staff')}
                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:shadow-sm transition-all text-left"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <i className="fas fa-calendar-alt text-green-600"></i>
                  </div>
                  <span>Schedule Roster</span>
                </div>
                <i className="fas fa-chevron-right text-gray-400"></i>
              </button>
              <button
                onClick={() => handlePageChange('pharmacy')}
                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:shadow-sm transition-all text-left"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                    <i className="fas fa-boxes text-yellow-600"></i>
                  </div>
                  <span>Medical Inventory</span>
                </div>
                <i className="fas fa-chevron-right text-gray-400"></i>
              </button>
              <button
                onClick={() => handlePageChange('settings')}
                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:shadow-sm transition-all text-left"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <i className="fas fa-check-circle text-purple-600"></i>
                  </div>
                  <span>Pending Approvals</span>
                </div>
                <i className="fas fa-chevron-right text-gray-400"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Appointments Overview */}
      <div className="relative bg-white rounded-xl p-5 border border-gray-200 shadow-sm overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-50 to-transparent pointer-events-none" />
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-sky-500 mr-3">
                <i className="fas fa-calendar-check text-white"></i>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Appointments Overview</h3>
                <p className="text-gray-500 text-sm">Real‑time appointment metrics</p>
              </div>
            </div>
            <button
              onClick={() => handlePageChange('appointments')}
              className="text-blue-600 text-sm hover:underline hover:text-blue-800"
            >
              View All →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div
              className="relative bg-white rounded-lg p-4 border border-gray-200 cursor-pointer hover:border-sky-300 hover:shadow-sm transition-all"
              onClick={() => handlePageChange('appointments')}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-sky-600">{appointmentsToday}</div>
                <div className="text-sm text-gray-600 mt-1">Appointments Today</div>
              </div>
              <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500"
                  style={{ width: `${percent(appointmentsToday, totalAppointments)}%` }}
                ></div>
              </div>
            </div>
            <div
              className="relative bg-white rounded-lg p-4 border border-gray-200 cursor-pointer hover:border-sky-300 hover:shadow-sm transition-all"
              onClick={() => handlePageChange('appointments')}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-sky-600">{appointmentsThisWeek}</div>
                <div className="text-sm text-gray-600 mt-1">This Week</div>
              </div>
              <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500"
                  style={{ width: `${percent(appointmentsThisWeek, totalAppointments)}%` }}
                ></div>
              </div>
            </div>
            <div
              className="relative bg-white rounded-lg p-4 border border-gray-200 cursor-pointer hover:border-sky-300 hover:shadow-sm transition-all"
              onClick={() => handlePageChange('appointments')}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-sky-600">{totalAppointments}</div>
                <div className="text-sm text-gray-600 mt-1">Total Appointments</div>
              </div>
              <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {statusBreakdown.length > 0 && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">By Status</h4>
                <div className="space-y-2">
                  {statusBreakdown.map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 capitalize">{status}</span>
                      <span className="font-medium text-gray-800">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {topAppointmentDepts.length > 0 && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Top Departments</h4>
                <div className="space-y-2">
                  {topAppointmentDepts.map(([dept, count]) => (
                    <div key={dept} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 capitalize">{dept}</span>
                      <span className="font-medium text-gray-800">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;