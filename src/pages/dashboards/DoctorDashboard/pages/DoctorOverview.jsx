// DoctorOverview.jsx
import React, { useState, useEffect, useRef } from 'react'
import LoadingSpinner from '../../../../components/common/LoadingSpinner/LoadingSpinner'
import { apiFetch } from '../../../../services/apiClient'
import { getTodaysAppointmentTracking } from '../../../../services/doctorApi'

/* ===========================
   DoctorOverview component
   =========================== */
const DoctorOverview = ({ onPageChange }) => {
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState({})
  const hasFetched = useRef(false)

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    loadDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const todayDate = new Date().toISOString().split('T')[0];
      
      const safeFetchJson = async (fetchPromise) => {
        try {
          const res = await fetchPromise;
          if (!res || !res.ok) return {};
          return await res.json().catch(() => ({}));
        } catch (err) {
          return {};
        }
      };

      const [overviewResult, appointmentsResult, recentPatientsResult, admittedPatientsResult, tasksResult, quickStatsResult] = await Promise.all([
        safeFetchJson(apiFetch('/api/v1/doctor-dashboard/overview')),
        safeFetchJson(getTodaysAppointmentTracking()),
        safeFetchJson(apiFetch('/api/v1/doctor-dashboard/patients/recent?limit=10')),
        safeFetchJson(apiFetch('/api/v1/doctor-dashboard/patients/admitted')),
        safeFetchJson(apiFetch('/api/v1/doctor-dashboard/tasks/pending')),
        safeFetchJson(apiFetch('/api/v1/doctor-dashboard/stats/quick?period=week'))
      ])

      const apiData = overviewResult?.data || overviewResult || {}
      const statsObj = apiData?.statistics || {}

      const extractArray = (data, key) => {
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.[key])) return data[key];
        if (Array.isArray(data?.data?.[key])) return data.data[key];
        if (Array.isArray(data?.items)) return data.items;
        if (Array.isArray(data?.data)) return data.data;
        return [];
      };

      const todayAppointments = extractArray(appointmentsResult, 'appointments');

      const recentPatients = extractArray(recentPatientsResult, 'patients');
      const admittedPatients = extractArray(admittedPatientsResult, 'patients');
      const pendingTasks = extractArray(tasksResult, 'tasks');

      const quickStatsData = quickStatsResult?.data || quickStatsResult || {}

      setDashboardData({
        overview: apiData,
        stats: {
          todaysAppointments: todayAppointments.length || statsObj.todays_appointments || 0,
          completedToday: statsObj.completed_today || 0,
          pendingAppointments: statsObj.pending_appointments || 0,
          admittedPatients: admittedPatients.length || statsObj.admitted_patients || 0,
          totalPatientsLifetime: statsObj.total_patients_lifetime || 0,
          pendingDischargeSummaries: statsObj.pending_discharge_summaries || 0,
          weekAppointments: statsObj.week_appointments || 0,
        },
        appointments: todayAppointments,
        recentPatients: recentPatients,
        admittedPatients: admittedPatients,
        todos: pendingTasks,
        quickStats: quickStatsData
      })
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
      // Fallback or handle error
    } finally {
      setLoading(false)
    }
  }

  const handleViewAllAppointments = () => {
    onPageChange && onPageChange('appointment-tracking')
  }

  if (loading) return <LoadingSpinner />

  const statCards = [
    { label: "Today's Appointments", value: dashboardData.stats?.todaysAppointments, icon: 'fa-calendar-day', colors: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700' },
    { label: "Completed Today", value: dashboardData.stats?.completedToday, icon: 'fa-check-circle', colors: 'from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600' },
    { label: "Pending Appointments", value: dashboardData.stats?.pendingAppointments, icon: 'fa-clock', colors: 'from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600' },
    { label: "Admitted Patients", value: dashboardData.stats?.admittedPatients, icon: 'fa-bed', colors: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700' },
    { label: "Total Patients", value: dashboardData.stats?.totalPatientsLifetime, icon: 'fa-users', colors: 'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700' },
    { label: "Pending Discharge", value: dashboardData.stats?.pendingDischargeSummaries, icon: 'fa-file-signature', colors: 'from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700' },
    { label: "Week Appointments", value: dashboardData.stats?.weekAppointments, icon: 'fa-calendar-week', colors: 'from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700' }
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="mb-2">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center">
          Doctor Dashboard {dashboardData.overview?.doctor_name ? `- ${dashboardData.overview.doctor_name}` : ''}
        </h2>
        {dashboardData.overview?.specialization && (
          <p className="text-gray-500 text-sm mt-1">
            {dashboardData.overview.specialization} • {dashboardData.overview.department}
          </p>
        )}
      </div>

      {/*Stats Cards with Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card, idx) => (
          <div key={idx} className={`group p-4 rounded-xl text-white bg-gradient-to-br ${card.colors} shadow-md hover:shadow-xl transition-all`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-white/20 rounded-lg mr-4 group-hover:scale-110 transition">
                  <i className={`fas ${card.icon} text-xl`}></i>
                </div>
                <div>
                  <p className="text-sm text-white/80">{card.label}</p>
                  <p className="text-2xl font-bold mt-1">
                    {card.value || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Weekly Performance Stats */}
      {dashboardData.quickStats && dashboardData.quickStats.statistics && (
        <div className="bg-white p-5 rounded border card-shadow mb-6">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-semibold text-gray-800">Weekly Performance</h3>
             {dashboardData.quickStats.date_range && (
                <span className="text-xs text-gray-500 font-medium">
                  {dashboardData.quickStats.date_range.start} to {dashboardData.quickStats.date_range.end}
                </span>
             )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
             <div className="p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-600">{dashboardData.quickStats.statistics.total_appointments || 0}</p>
                <p className="text-xs text-gray-600 mt-1 uppercase font-semibold">Total Appts</p>
             </div>
             <div className="p-4 bg-green-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600">{dashboardData.quickStats.statistics.completed_appointments || 0}</p>
                <p className="text-xs text-gray-600 mt-1 uppercase font-semibold">Completed</p>
             </div>
             <div className="p-4 bg-purple-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-purple-600">{dashboardData.quickStats.statistics.unique_patients_treated || 0}</p>
                <p className="text-xs text-gray-600 mt-1 uppercase font-semibold">Unique Patients</p>
             </div>
             <div className="p-4 bg-yellow-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-yellow-600">{dashboardData.quickStats.statistics.medical_records_created || 0}</p>
                <p className="text-xs text-gray-600 mt-1 uppercase font-semibold">Records Created</p>
             </div>
             <div className="p-4 bg-indigo-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-indigo-600">{dashboardData.quickStats.statistics.completion_rate || 0}%</p>
                <p className="text-xs text-gray-600 mt-1 uppercase font-semibold">Completion %</p>
             </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {dashboardData.overview?.quick_actions && dashboardData.overview.quick_actions.length > 0 && (
        <div className="bg-white p-4 rounded border card-shadow mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            {dashboardData.overview.quick_actions.map((action, idx) => (
              <button key={idx} className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-blue-100">
                {action}
              </button>
            ))}
          </div>
        </div>
      )}



      {/* FIRST ROW: Today's Appointments | Admitted Patients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-stretch">
        {/* Today's Appointments */}
        <div className="bg-white p-4 rounded border card-shadow flex flex-col">
          <h3 className="text-lg font-semibold mb-3">Today's Appointments</h3>

          <div className="flex-1 overflow-y-auto pr-1 divide-y divide-gray-200">
            {dashboardData.appointments && dashboardData.appointments.length > 0 ? dashboardData.appointments.slice(0, 5).map((apt, index) => (
              <div
                key={apt.id || apt._id || index}
                className="flex items-center justify-between py-3 px-2 hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <div
                    className={`w-3 h-3 rounded-full mr-3 ${apt.status === 'Confirmed' || apt.status === 'Completed' ? 'bg-green-900' : apt.status === 'Cancelled' ? 'bg-red-500' : 'bg-yellow-500'
                      }`}
                  ></div>
                  <div>
                    <p className="font-medium">{apt.patient_name || apt.patient || 'Unknown Patient'}</p>
                    <p className="text-xs text-gray-500">
                      {apt.appointment_time || apt.time || ''} - {apt.reason || apt.appointment_reason || apt.type || apt.appointment_type || ''}
                    </p>
                  </div>
                </div>

                <span
                  className={`px-2 py-1 rounded-full text-xs ${apt.status === 'Confirmed' || apt.status === 'Completed'
                    ? 'bg-green-500 text-white'
                    : apt.status === 'Cancelled' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'
                    }`}
                >
                  {apt.status || 'Pending'}
                </span>
              </div>
            )) : (
              <div className="py-8 text-center text-sm text-gray-500">No appointments for today</div>
            )}
          </div>

          <button
            className="w-full mt-3 text-blue-600 text-sm flex items-center justify-center hover:text-blue-800 transition-colors"
            onClick={handleViewAllAppointments}
          >
            <i className="fas fa-arrow-right mr-1"></i> View All Appointments
          </button>
        </div>

        {/* Admitted Patients */}
        <div className="bg-white p-4 rounded border card-shadow flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Admitted Patients</h3>
            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
              {dashboardData.admittedPatients?.length || 0}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 divide-y divide-gray-200 min-h-[180px]">
            {dashboardData.admittedPatients && dashboardData.admittedPatients.length > 0 ? dashboardData.admittedPatients.slice(0, 5).map((patient, index) => (
              <div
                key={patient.id || patient._id || index}
                className="flex items-center justify-between py-3 px-2 hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <div
                    className={`w-3 h-3 rounded-full mr-3 bg-purple-500`}
                  ></div>
                  <div>
                    <p className="font-medium text-sm whitespace-nowrap">{patient.name || patient.patient_name || 'Unknown Patient'}</p>
                    <p className="text-xs text-gray-500">
                      Room: {patient.room_no || patient.room || 'N/A'} • Dept: {patient.department || 'N/A'}
                    </p>
                  </div>
                </div>

                <span
                  className={`px-2 py-1 rounded-full text-[10px] bg-purple-50 text-purple-600 border border-purple-100`}
                >
                  {patient.status || 'Admitted'}
                </span>
              </div>
            )) : (
              <div className="py-8 text-center text-sm text-gray-500">No admitted patients found.</div>
            )}
          </div>
        </div>
      </div>

      {/* SECOND ROW: Todo List | Recent Patients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-stretch">
        {/* Todo List */}
        <div className="bg-white p-4 rounded border card-shadow flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Todo List</h3>
            <button
              className="text-sm text-blue-600 hover:underline"
              onClick={() => onPageChange && onPageChange('todos')}
            >
              View All
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 pr-1 min-h-[180px]">
            {dashboardData.todos && dashboardData.todos.length > 0 ? dashboardData.todos.slice(0, 5).map((todo, index) => (
              <div key={todo.id || todo._id || index} className="flex items-center justify-between px-2 py-3">
                <div className="flex items-center gap-3">
                  <div className="drag-handle text-gray-300">⋮⋮</div>
                  <input
                    type="checkbox"
                    checked={todo.done || todo.status === 'Completed'}
                    onChange={() => {
                      setDashboardData((prev) => ({
                        ...prev,
                        todos: prev.todos.map((t) => ((t.id || t._id) === (todo.id || todo._id) ? { ...t, done: !(t.done || t.status === 'Completed') } : t)),
                      }))
                    }}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <div>
                    <p className={`text-sm ${todo.done || todo.status === 'Completed' ? 'line-through text-gray-400' : 'text-gray-900'} font-medium`}>
                      {todo.title || todo.task || todo.task_name || 'Untitled Task'}
                    </p>
                    <p className="text-xs text-gray-400">{todo.description ? todo.description.substring(0,25) + '...' : '...'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${todo.priority === 'High' ? 'text-red-600' : todo.priority === 'Low' ? 'text-green-600' : 'text-gray-600 bg-gray-100'
                      }`}
                  >
                    {todo.priority || 'Normal'}
                  </span>
                </div>
              </div>
            )) : (
              <div className="py-8 text-center text-sm text-gray-500">No pending tasks. You're all caught up!</div>
            )}
          </div>
        </div>

        {/* Recent Patients */}
        <div className="bg-white p-4 rounded border card-shadow flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Recent Patients</h3>
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
              {dashboardData.recentPatients?.length || 0}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 pr-1 min-h-[180px]">
            {dashboardData.recentPatients && dashboardData.recentPatients.length > 0 ? dashboardData.recentPatients.slice(0, 5).map((patient, index) => (
              <div key={patient.id || patient._id || index} className="flex items-center justify-between py-3 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-medium">
                    {(patient.name || patient.patient_name || 'U').split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 text-sm whitespace-nowrap">{patient.name || patient.patient_name || 'Unknown'}</div>
                    <div className="text-xs text-gray-400">ID: {patient.patient_id || patient.id || 'N/A'}</div>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {patient.last_visit || patient.visit_date ? new Date(patient.last_visit || patient.visit_date).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
              </div>
            )) : (
              <div className="py-8 text-center text-sm text-gray-500">No recent patients found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DoctorOverview
