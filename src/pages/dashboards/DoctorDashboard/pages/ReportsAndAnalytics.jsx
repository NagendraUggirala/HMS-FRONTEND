import React, { useState, useEffect } from 'react'
import LoadingSpinner from '../../../../components/common/LoadingSpinner/LoadingSpinner'

const ReportsAndAnalytics = ({ onPageChange }) => {
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState({})

  useEffect(() => {
    loadReportData()
  }, [])

  const loadReportData = async () => {
    setLoading(true)
    try {
      // Simulate API call - replace with actual API endpoint
      // const response = await apiFetch('/api/v1/doctor-dashboard/reports')
      // const data = await response.json()
      // setReportData(data)
      
      // Placeholder data
      setReportData({
        totalAppointments: 150,
        completedAppointments: 120,
        cancelledAppointments: 10,
        pendingAppointments: 20,
        totalPatients: 85,
        averageConsultationTime: 15,
        revenue: 45000,
      })
    } catch (err) {
      console.error('Failed to load report data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="mb-2">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Reports & Analytics</h2>
        <p className="text-gray-500 text-sm mt-1">View your performance reports and analytics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl text-white bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80">Total Appointments</p>
              <p className="text-2xl font-bold mt-1">{reportData.totalAppointments || 0}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-lg">
              <i className="fas fa-calendar-check text-xl"></i>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl text-white bg-gradient-to-br from-green-500 to-emerald-500 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80">Completed</p>
              <p className="text-2xl font-bold mt-1">{reportData.completedAppointments || 0}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-lg">
              <i className="fas fa-check-circle text-xl"></i>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl text-white bg-gradient-to-br from-yellow-400 to-yellow-500 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80">Pending</p>
              <p className="text-2xl font-bold mt-1">{reportData.pendingAppointments || 0}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-lg">
              <i className="fas fa-clock text-xl"></i>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl text-white bg-gradient-to-br from-purple-500 to-purple-600 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80">Total Patients</p>
              <p className="text-2xl font-bold mt-1">{reportData.totalPatients || 0}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-lg">
              <i className="fas fa-users text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded border card-shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Average Consultation Time</span>
              <span className="font-semibold text-gray-800">{reportData.averageConsultationTime || 0} mins</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Completion Rate</span>
              <span className="font-semibold text-gray-800">
                {reportData.totalAppointments ? Math.round((reportData.completedAppointments / reportData.totalAppointments) * 100) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Cancellation Rate</span>
              <span className="font-semibold text-gray-800">
                {reportData.totalAppointments ? Math.round((reportData.cancelledAppointments / reportData.totalAppointments) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded border card-shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-gray-600">Total Revenue</span>
              <span className="font-semibold text-green-600">Rs {reportData.revenue?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Revenue per Patient</span>
              <span className="font-semibold text-gray-800">
                Rs {reportData.totalPatients ? Math.round(reportData.revenue / reportData.totalPatients) : 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Placeholder for charts */}
      <div className="bg-white p-5 rounded border card-shadow">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Trends</h3>
        <div className="text-center py-8 text-gray-500">
          <i className="fas fa-chart-line text-4xl mb-3 text-gray-300"></i>
          <p>Chart visualization will be added here</p>
        </div>
      </div>
    </div>
  )
}

export default ReportsAndAnalytics
