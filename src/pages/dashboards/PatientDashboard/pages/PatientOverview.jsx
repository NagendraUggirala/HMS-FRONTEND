import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import LoadingSpinner from '../../../../components/common/LoadingSpinner/LoadingSpinner'
import {
  getMyPatientProfile,
  getOverviewMetrics,
  getRecentVitals,
  getDashboardNotifications,
  getMyLabResults,
  getActivePrescriptions
} from '../../../../services/patientApi'

function extractList(payload) {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.data)) return payload.data
  if (Array.isArray(payload.results)) return payload.results
  if (Array.isArray(payload.prescriptions)) return payload.prescriptions
  return []
}

// Initial default safe state to prevent undefined crashes
const defaultDashboardData = {
  patientInfo: {
    name: 'Patient',
    age: '—',
    bloodGroup: '—',
    doctor: '—',
    lastVisit: '—',
    nextAppointment: '—'
  },
  healthMetrics: {
    bloodPressure: '—',
    bloodSugar: '—',
    weight: '—',
    height: '—',
    bmi: '—',
    cholesterol: '—'
  },
  upcomingAppointments: [],
  recentTestResults: [],
  currentPrescriptions: [],
  bills: {
    pending: 0,
    paid: 0,
    nextDue: '—',
    insuranceCoverage: 0
  },
  reminders: []
}

const PatientOverview = ({ setActivePage }) => {
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState(defaultDashboardData)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Fetch data concurrently without letting one failure crash the others
      const [
        profileRes, 
        metricsRes, 
        vitalsRes, 
        notificationsRes,
        labsRes,
        rxRes
      ] = await Promise.allSettled([
        getMyPatientProfile().then(r => r.json()),
        getOverviewMetrics().then(r => r.json()),
        getRecentVitals().then(r => r.json()),
        getDashboardNotifications().then(r => r.json()),
        getMyLabResults().then(r => r.json()),
        getActivePrescriptions().then(r => r.json())
      ])

      const profile = profileRes.status === 'fulfilled' ? profileRes.value : {}
      const metrics = metricsRes.status === 'fulfilled' ? metricsRes.value : {}
      const vitals = vitalsRes.status === 'fulfilled' ? vitalsRes.value : {}
      const notifications = notificationsRes.status === 'fulfilled' ? notificationsRes.value : {}
      const labs = labsRes.status === 'fulfilled' ? extractList(labsRes.value).slice(0, 3) : [] // top 3
      const rx = rxRes.status === 'fulfilled' ? extractList(rxRes.value).slice(0, 3) : [] // top 3

      // Normalize profile data
      const rawProfileData = profile?.data || profile || {}
      const pData = Array.isArray(rawProfileData) ? rawProfileData[0] : (rawProfileData || {})
      
      // Normalize metrics/vitals
      const vData = vitals?.data || vitals || {}
      const mData = metrics?.data || metrics || {}

      setDashboardData({
        patientInfo: {
          name: pData.full_name || pData.name || pData.first_name || pData.fullName || 'Patient',
          age: pData.age || '—',
          bloodGroup: pData.blood_group || pData.blood_type || pData.bloodgroup || pData.bloodGroup || '—',
          doctor: pData.primary_doctor || mData.primary_doctor || '—',
          lastVisit: mData.last_visit || '—',
          nextAppointment: mData.next_appointment || '—'
        },
        healthMetrics: {
          bloodPressure: vData.blood_pressure || vData.bp || '—',
          bloodSugar: vData.blood_sugar || '—',
          weight: vData.weight || pData.weight || '—',
          height: vData.height || pData.height || '—',
          bmi: vData.bmi || pData.bmi || '—',
          cholesterol: vData.cholesterol || '—'
        },
        upcomingAppointments: Array.isArray(mData.upcoming_appointments) 
          ? mData.upcoming_appointments 
          : [],
        recentTestResults: labs,
        currentPrescriptions: rx,
        bills: {
          pending: mData.pending_bills || mData.bills?.pending || 0,
          paid: mData.paid_bills || mData.bills?.paid || 0,
          nextDue: mData.next_bill_due || mData.bills?.nextDue || '—',
          insuranceCoverage: mData.insurance_coverage || 0
        },
        reminders: Array.isArray(notifications?.data) ? notifications.data : (Array.isArray(notifications) ? notifications : [])
      })
    } catch (err) {
      console.error('[Dashboard] error loading data:', err)
      toast.error('Could not load dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page) => {
    setActivePage(page)
  }

  if (loading) return <LoadingSpinner />

  // Destructure with safety fallbacks
  const { 
    patientInfo = defaultDashboardData.patientInfo, 
    healthMetrics = defaultDashboardData.healthMetrics, 
    bills = defaultDashboardData.bills 
  } = dashboardData

  const upcomingAppointments = dashboardData.upcomingAppointments || []
  const recentTestResults = dashboardData.recentTestResults || []
  const currentPrescriptions = dashboardData.currentPrescriptions || []
  const reminders = dashboardData.reminders || []

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Patient Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-700">
            Welcome back, {patientInfo.name}
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handlePageChange('appointments')}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
          >
            <i className="fas fa-calendar-plus mr-2"></i>Book Appointment
          </button>
          <button
            onClick={() => handlePageChange('messages')}
            className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
          >
            <i className="fas fa-comment-medical mr-2"></i>Message Doctor
          </button>
        </div>
      </div>

      {/* Health Summary Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-blue-800 text-lg flex items-center">
              <i className="fas fa-heartbeat mr-2"></i>
              Health Summary
            </h3>
            <p className="text-blue-600 text-sm mt-1">
              Primary Care Physician: {patientInfo.doctor !== '—' ? patientInfo.doctor : 'Not Assigned'}
            </p>
          </div>
          <button
            onClick={() => handlePageChange('records')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <i className="fas fa-file-medical-alt mr-2"></i>View Complete History
          </button>
        </div>

        {/* Health Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5 mt-6">

          {/* Blood Pressure */}
          <div className="relative bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent rounded-xl pointer-events-none" />
            <div className="relative text-center">
              <div className="w-10 h-10 mx-auto flex items-center justify-center rounded-full bg-blue-600 text-white mb-2">
                <i className="fas fa-heartbeat text-sm"></i>
              </div>
              <p className="text-xs text-gray-500">Blood Pressure</p>
              <p className="text-lg font-bold text-blue-700 mt-1">
                {healthMetrics.bloodPressure}
              </p>
            </div>
          </div>

          {/* Blood Sugar */}
          <div className="relative bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-transparent rounded-xl pointer-events-none" />
            <div className="relative text-center">
              <div className="w-10 h-10 mx-auto flex items-center justify-center rounded-full bg-indigo-600 text-white mb-2">
                <i className="fas fa-tint text-sm"></i>
              </div>
              <p className="text-xs text-gray-500">Blood Sugar</p>
              <p className="text-lg font-bold text-blue-700 mt-1">
                {healthMetrics.bloodSugar}
              </p>
            </div>
          </div>

          {/* Weight */}
          <div className="relative bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-transparent rounded-xl pointer-events-none" />
            <div className="relative text-center">
              <div className="w-10 h-10 mx-auto flex items-center justify-center rounded-full bg-yellow-500 text-white mb-2">
                <i className="fas fa-weight text-sm"></i>
              </div>
              <p className="text-xs text-gray-500">Weight</p>
              <p className="text-lg font-bold text-blue-700 mt-1">
                {healthMetrics.weight}
              </p>
            </div>
          </div>

          {/* BMI */}
          <div className="relative bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent rounded-xl pointer-events-none" />
            <div className="relative text-center">
              <div className="w-10 h-10 mx-auto flex items-center justify-center rounded-full bg-green-600 text-white mb-2">
                <i className="fas fa-user-check text-sm"></i>
              </div>
              <p className="text-xs text-gray-500">BMI</p>
              <p className="text-lg font-bold text-blue-700 mt-1">
                {healthMetrics.bmi}
              </p>
            </div>
          </div>

          {/* Cholesterol */}
          <div className="relative bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-transparent rounded-xl pointer-events-none" />
            <div className="relative text-center">
              <div className="w-10 h-10 mx-auto flex items-center justify-center rounded-full bg-orange-500 text-white mb-2">
                <i className="fas fa-flask text-sm"></i>
              </div>
              <p className="text-xs text-gray-500">Cholesterol</p>
              <p className="text-lg font-bold text-blue-700 mt-1">
                {healthMetrics.cholesterol}
              </p>
            </div>
          </div>

          {/* Blood Group */}
          <div className="relative bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-50 to-transparent rounded-xl pointer-events-none" />
            <div className="relative text-center">
              <div className="w-10 h-10 mx-auto flex items-center justify-center rounded-full bg-rose-600 text-white mb-2">
                <i className="fas fa-tint text-sm"></i>
              </div>
              <p className="text-xs text-gray-500">Blood Group</p>
              <p className="text-lg font-bold text-blue-700 mt-1">
                {patientInfo.bloodGroup}
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Appointments */}
        <div className="bg-white rounded-xl card-shadow border p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg flex items-center">
              <i className="fas fa-calendar-check text-blue-500 mr-2"></i>
              Upcoming Appointments
            </h3>
            <button
              onClick={() => handlePageChange('appointments')}
              className="text-blue-600 text-sm hover:underline hover:text-blue-800"
            >
              View All →
            </button>
          </div>
          <div className="space-y-4 flex-1">
            {upcomingAppointments.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No upcoming appointments.</p>
            ) : upcomingAppointments.map((appointment, idx) => (
              <div key={idx} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handlePageChange('appointments')}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{appointment.doctor_name || appointment.doctor || 'Doctor'}</div>
                    <div className="text-sm text-gray-500 mt-1">{appointment.reason || 'Consultation'}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      (appointment.status || '').toUpperCase() === 'CONFIRMED'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                    }`}>
                    {appointment.status || 'Scheduled'}
                  </span>
                </div>
                <div className="flex items-center mt-3 text-sm text-gray-600">
                  <i className="far fa-calendar mr-2"></i>
                  <span>{appointment.appointment_date || appointment.date} at {appointment.time || appointment.appointment_time}</span>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => handlePageChange('appointments')}
            className="w-full mt-4 text-center py-3 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <i className="fas fa-plus mr-2"></i>Book New Appointment
          </button>
        </div>

        {/* Recent Test Results */}
        <div className="bg-white rounded-xl card-shadow border p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg flex items-center">
              <i className="fas fa-flask text-purple-500 mr-2"></i>
              Recent Test Results
            </h3>
            <button
              onClick={() => handlePageChange('tests')}
              className="text-blue-600 text-sm hover:underline hover:text-blue-800"
            >
              View All →
            </button>
          </div>
          <div className="space-y-4 flex-1">
            {recentTestResults.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No recent test results.</p>
            ) : recentTestResults.map((test, idx) => {
              const testName = test.test_name || test.name || test.test || 'Lab Test';
              const date = test.created_at || test.test_date || test.date || '';
              const status = test.status || 'Pending';
              const isCompleted = status.toUpperCase() === 'COMPLETED';
              
              return (
              <div key={idx} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handlePageChange('tests')}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{testName}</div>
                    <div className="text-sm text-gray-500 mt-1">Date: {date ? new Date(date).toLocaleDateString() : '—'}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      isCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                    {status}
                  </span>
                </div>
                <div className="flex items-center mt-3 text-sm text-gray-600">
                  <i className="fas fa-user-md mr-2"></i>
                  <span>Reviewed by: {test.ordered_by || test.doctor || '—'}</span>
                </div>
              </div>
            )})}
          </div>
          <button
            onClick={() => handlePageChange('tests')}
            className="w-full mt-4 text-center py-3 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <i className="fas fa-vial mr-2"></i>View All Tests
          </button>
        </div>

        {/* Current Prescriptions */}
        <div className="bg-white rounded-xl card-shadow border p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg flex items-center">
              <i className="fas fa-prescription-bottle-alt text-green-500 mr-2"></i>
              Current Medications
            </h3>
            <button
              onClick={() => handlePageChange('prescriptions')}
              className="text-blue-600 text-sm hover:underline hover:text-blue-800"
            >
              View All →
            </button>
          </div>
          <div className="space-y-4 flex-1">
            {currentPrescriptions.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No active prescriptions.</p>
            ) : currentPrescriptions.map((rx, idx) => (
              <div key={idx} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handlePageChange('prescriptions')}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">Prescription #{rx.prescription_no || rx.id}</div>
                    <div className="text-sm text-gray-500 mt-1">Status: {rx.status}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
                  <span>
                    <i className="far fa-calendar mr-1"></i>
                    Date: {rx.created_at ? new Date(rx.created_at).toLocaleDateString() : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => handlePageChange('prescriptions')}
            className="w-full mt-4 text-center py-3 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <i className="fas fa-history mr-2"></i>View Prescription History
          </button>
        </div>
      </div>

      {/* Second Row - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Billing Summary */}
        <div className="bg-white rounded-xl card-shadow border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg flex items-center">
              <i className="fas fa-credit-card text-orange-500 mr-2"></i>
              Billing Summary
            </h3>
            <button
              onClick={() => handlePageChange('billing')}
              className="text-blue-600 text-sm hover:underline hover:text-blue-800"
            >
              View Details →
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Pending Amount</div>
              <div className="text-2xl font-bold text-red-600">₹{bills.pending || 0}</div>
              <div className="text-xs text-gray-500 mt-1">Due: {bills.nextDue}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Paid Amount</div>
              <div className="text-2xl font-bold text-green-600">₹{bills.paid || 0}</div>
              <div className="text-xs text-gray-500 mt-1">Total</div>
            </div>
          </div>
        </div>

        {/* Health Reminders */}
        <div className="bg-white rounded-xl card-shadow border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg flex items-center">
              <i className="fas fa-bell text-yellow-500 mr-2"></i>
              Health Reminders
            </h3>
            <button
              onClick={() => handlePageChange('settings')}
              className="text-blue-600 text-sm hover:underline hover:text-blue-800"
            >
              Manage →
            </button>
          </div>
          <div className="space-y-3">
            {reminders.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No new notifications or reminders.</p>
            ) : reminders.map((reminder, idx) => (
              <div key={idx} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg mr-3 ${reminder.type === 'medication' ? 'bg-blue-100' :
                      reminder.type === 'appointment' ? 'bg-green-100' :
                        'bg-yellow-100'
                    }`}>
                    <i className={`fas ${reminder.type === 'medication' ? 'fa-pills text-blue-500' :
                        reminder.type === 'appointment' ? 'fa-calendar-check text-green-500' :
                          'fa-bell text-yellow-500'
                      }`}></i>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{reminder.message || reminder.title || 'Notification'}</div>
                    <div className="text-xs text-gray-500 mt-1">{reminder.time || reminder.created_at ? new Date(reminder.created_at).toLocaleDateString() : ''}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PatientOverview