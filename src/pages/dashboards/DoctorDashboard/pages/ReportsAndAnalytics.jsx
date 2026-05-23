import React, { useState, useEffect } from 'react'
import LoadingSpinner from '../../../../components/common/LoadingSpinner/LoadingSpinner'
import {
  getPracticeOverview,
  getPatientAnalytics,
  getAppointmentAnalytics,
  getClinicalOutcomes,
  getFinancialSummary,
  getPerformanceMetrics,
  getComparativeAnalysis,
  getExportOptions,
} from '../../../../services/doctorApi'

const ReportsAndAnalytics = ({ onPageChange }) => {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('practice-overview')
  const [reportPeriod, setReportPeriod] = useState('this_month')
  const [customDateFrom, setCustomDateFrom] = useState('')
  const [customDateTo, setCustomDateTo] = useState('')
  const [showCustomDates, setShowCustomDates] = useState(false)
  const [data, setData] = useState({})
  const [error, setError] = useState(null)

  const tabs = [
    { id: 'practice-overview', label: 'Practice Overview', icon: 'fa-chart-pie' },
    { id: 'patient-analytics', label: 'Patient Analytics', icon: 'fa-users' },
    { id: 'appointment-analytics', label: 'Appointment Analytics', icon: 'fa-calendar-check' },
    { id: 'clinical-outcomes', label: 'Clinical Outcomes', icon: 'fa-heartbeat' },
    { id: 'financial-summary', label: 'Financial Summary', icon: 'fa-dollar-sign' },
    { id: 'performance-metrics', label: 'Performance Metrics', icon: 'fa-trophy' },
    { id: 'comparative-analysis', label: 'Comparative Analysis', icon: 'fa-balance-scale' },
  ]

  const periodOptions = [
    { value: 'today', label: 'Today' },
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_quarter', label: 'This Quarter' },
    { value: 'this_year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' },
  ]

  useEffect(() => {
    loadData()
  }, [activeTab, reportPeriod, customDateFrom, customDateTo])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {
        report_period: reportPeriod,
        custom_date_from: customDateFrom || undefined,
        custom_date_to: customDateTo || undefined,
      }

      let result
      switch (activeTab) {
        case 'practice-overview':
          result = await getPracticeOverview(params)
          break
        case 'patient-analytics':
          result = await getPatientAnalytics(params)
          break
        case 'appointment-analytics':
          result = await getAppointmentAnalytics(params)
          break
        case 'clinical-outcomes':
          result = await getClinicalOutcomes(params)
          break
        case 'financial-summary':
          result = await getFinancialSummary(params)
          break
        case 'performance-metrics':
          result = await getPerformanceMetrics(params)
          break
        case 'comparative-analysis':
          result = await getComparativeAnalysis(params)
          break
        default:
          result = {}
      }
      setData(result)
    } catch (err) {
      console.error('Failed to load report data:', err)
      setError(err.message || 'Failed to load report data')
    } finally {
      setLoading(false)
    }
  }

  const handlePeriodChange = (e) => {
    const value = e.target.value
    setReportPeriod(value)
    setShowCustomDates(value === 'custom')
    if (value !== 'custom') {
      setCustomDateFrom('')
      setCustomDateTo('')
    }
  }

  const renderTrendBadge = (trend) => {
    if (!trend) return null
    const isPositive = trend >= 0
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        <i className={`fas fa-arrow-${isPositive ? 'up' : 'down'} mr-1`}></i>
        {Math.abs(trend).toFixed(1)}%
      </span>
    )
  }

  const renderProgressBar = (value, color = 'blue') => {
    const colors = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      red: 'bg-red-500',
      purple: 'bg-purple-500',
    }
    return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`${colors[color] || colors.blue} h-2 rounded-full transition-all duration-500`} style={{ width: `${Math.min(value, 100)}%` }}></div>
      </div>
    )
  }

  const renderPracticeOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Patients Seen"
          value={data.total_patients_seen || 0}
          icon="fa-users"
          color="blue"
          trend={data.patient_growth_trend}
          renderTrendBadge={renderTrendBadge}
        />
        <MetricCard
          title="Total Appointments"
          value={data.total_appointments || 0}
          icon="fa-calendar-check"
          color="green"
          trend={data.appointment_trend}
          renderTrendBadge={renderTrendBadge}
        />
        <MetricCard
          title="Total Prescriptions"
          value={data.total_prescriptions || 0}
          icon="fa-prescription"
          color="purple"
          trend={data.prescription_trend}
          renderTrendBadge={renderTrendBadge}
        />
        <MetricCard
          title="Total Admissions"
          value={data.total_admissions || 0}
          icon="fa-hospital"
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Appointment Completion Rate</h3>
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl font-bold text-gray-800">{data.appointment_completion_rate || 0}%</span>
            {renderProgressBar(data.appointment_completion_rate || 0, 'green')}
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Doctor Information</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Name</span>
              <span className="font-semibold text-gray-800">{data.doctor_name || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Department</span>
              <span className="font-semibold text-gray-800">{data.department || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Specialization</span>
              <span className="font-semibold text-gray-800">{data.specialization || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Most Common Diagnoses</h3>
          <div className="space-y-3">
            {data.most_common_diagnoses?.slice(0, 5).map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-700">{item.diagnosis}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{item.count} cases</span>
                  <span className="text-sm font-semibold text-blue-600">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Most Prescribed Medications</h3>
          <div className="space-y-3">
            {data.most_prescribed_medications?.slice(0, 5).map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-700">{item.medication}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{item.count} prescriptions</span>
                  <span className="text-sm font-semibold text-purple-600">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderPatientAnalytics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Unique Patients"
          value={data.total_unique_patients || 0}
          icon="fa-users"
          color="blue"
        />
        <MetricCard
          title="New Patients"
          value={data.new_patients || 0}
          icon="fa-user-plus"
          color="green"
        />
        <MetricCard
          title="Returning Patients"
          value={data.returning_patients || 0}
          icon="fa-user-check"
          color="purple"
        />
        <MetricCard
          title="High Risk Patients"
          value={data.high_risk_patients || 0}
          icon="fa-exclamation-triangle"
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Patient Retention Rate</h3>
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl font-bold text-gray-800">{data.patient_retention_rate || 0}%</span>
            {renderProgressBar(data.patient_retention_rate || 0, 'green')}
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Average Visits Per Patient</h3>
          <span className="text-3xl font-bold text-gray-800">{data.average_visits_per_patient || 0}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Age Distribution</h3>
          <div className="space-y-3">
            {Object.entries(data.age_distribution || {}).map(([ageGroup, count]) => (
              <div key={ageGroup} className="flex items-center justify-between">
                <span className="text-gray-700">{ageGroup}</span>
                <span className="font-semibold text-gray-800">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Gender Distribution</h3>
          <div className="space-y-3">
            {Object.entries(data.gender_distribution || {}).map(([gender, count]) => (
              <div key={gender} className="flex items-center justify-between">
                <span className="text-gray-700">{gender}</span>
                <span className="font-semibold text-gray-800">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-lg border shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Chronic Conditions Breakdown</h3>
        <div className="space-y-3">
          {data.chronic_conditions_breakdown?.slice(0, 5).map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-gray-700">{item.condition}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{item.patient_count} patients</span>
                <span className="text-sm font-semibold text-orange-600">{item.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderAppointmentAnalytics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Appointments"
          value={data.total_appointments || 0}
          icon="fa-calendar"
          color="blue"
        />
        <MetricCard
          title="Completed"
          value={data.completed_appointments || 0}
          icon="fa-check-circle"
          color="green"
        />
        <MetricCard
          title="Cancelled"
          value={data.cancelled_appointments || 0}
          icon="fa-times-circle"
          color="red"
        />
        <MetricCard
          title="No Show"
          value={data.no_show_appointments || 0}
          icon="fa-user-clock"
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Completion Rate</h3>
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl font-bold text-gray-800">{data.completion_rate || 0}%</span>
            {renderProgressBar(data.completion_rate || 0, 'green')}
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Cancellation Rate</h3>
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl font-bold text-gray-800">{data.cancellation_rate || 0}%</span>
            {renderProgressBar(data.cancellation_rate || 0, 'red')}
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">No Show Rate</h3>
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl font-bold text-gray-800">{data.no_show_rate || 0}%</span>
            {renderProgressBar(data.no_show_rate || 0, 'yellow')}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Peak Appointment Hours</h3>
          <div className="space-y-3">
            {data.peak_appointment_hours?.slice(0, 5).map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-700">{item.hour}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{item.appointment_count} appointments</span>
                  <span className="text-sm font-semibold text-blue-600">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Peak Appointment Days</h3>
          <div className="space-y-3">
            {data.peak_appointment_days?.slice(0, 5).map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-700">{item.day}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{item.appointment_count} appointments</span>
                  <span className="text-sm font-semibold text-purple-600">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Schedule Utilization Rate</h3>
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl font-bold text-gray-800">{data.schedule_utilization_rate || 0}%</span>
            {renderProgressBar(data.schedule_utilization_rate || 0, 'blue')}
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Average Wait Time</h3>
          <span className="text-3xl font-bold text-gray-800">{data.average_wait_time || 0} mins</span>
        </div>
      </div>
    </div>
  )

  const renderClinicalOutcomes = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Cases Treated"
          value={data.total_cases_treated || 0}
          icon="fa-stethoscope"
          color="blue"
        />
        <MetricCard
          title="Success Rate"
          value={`${data.successful_treatment_rate || 0}%`}
          icon="fa-check-double"
          color="green"
        />
        <MetricCard
          title="Readmission Rate"
          value={`${data.readmission_rate || 0}%`}
          icon="fa-redo"
          color="red"
        />
        <MetricCard
          title="Safety Incidents"
          value={data.patient_safety_incidents || 0}
          icon="fa-shield-alt"
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Follow-up Compliance Rate</h3>
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl font-bold text-gray-800">{data.follow_up_compliance_rate || 0}%</span>
            {renderProgressBar(data.follow_up_compliance_rate || 0, 'green')}
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Clinical Guidelines Adherence</h3>
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl font-bold text-gray-800">{data.clinical_guidelines_adherence || 0}%</span>
            {renderProgressBar(data.clinical_guidelines_adherence || 0, 'blue')}
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-lg border shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Diagnosis Accuracy Indicators</h3>
        <div className="space-y-3">
          {data.diagnosis_accuracy_indicators?.map((item, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-800">{item.diagnosis_category}</span>
                <span className="text-sm font-semibold text-green-600">{item.accuracy_score}%</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Confidence: {item.confidence_level}</span>
                <span>{item.cases_analyzed} cases</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-5 rounded-lg border shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Treatment Effectiveness Scores</h3>
        <div className="space-y-3">
          {data.treatment_effectiveness_scores?.map((item, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-800">{item.treatment_type}</span>
                <span className="text-sm font-semibold text-blue-600">{item.effectiveness_score}%</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Improvement: {item.patient_improvement_rate}%</span>
                <span>{item.cases_evaluated} cases</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Areas for Improvement</h3>
          <ul className="space-y-2">
            {data.areas_for_improvement?.map((item, index) => (
              <li key={index} className="flex items-center gap-2 text-gray-700">
                <i className="fas fa-exclamation-circle text-yellow-500"></i>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-5 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quality Recommendations</h3>
          <ul className="space-y-2">
            {data.quality_recommendations?.map((item, index) => (
              <li key={index} className="flex items-center gap-2 text-gray-700">
                <i className="fas fa-lightbulb text-blue-500"></i>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )

  const renderFinancialSummary = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Revenue"
          value={`Rs ${(data.total_revenue || 0).toLocaleString()}`}
          icon="fa-dollar-sign"
          color="green"
        />
        <MetricCard
          title="Consultation Revenue"
          value={`Rs ${(data.consultation_revenue || 0).toLocaleString()}`}
          icon="fa-user-md"
          color="blue"
        />
        <MetricCard
          title="Procedure Revenue"
          value={`Rs ${(data.procedure_revenue || 0).toLocaleString()}`}
          icon="fa-procedures"
          color="purple"
        />
        <MetricCard
          title="Collection Rate"
          value={`${data.collection_rate || 0}%`}
          icon="fa-percentage"
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue by Service Type</h3>
          <div className="space-y-3">
            {Object.entries(data.revenue_by_service_type || {}).map(([service, revenue]) => (
              <div key={service} className="flex items-center justify-between">
                <span className="text-gray-700">{service}</span>
                <span className="font-semibold text-gray-800">Rs {Number(revenue).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Metrics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Average Revenue per Patient</span>
              <span className="font-semibold text-gray-800">Rs {(data.average_revenue_per_patient || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">High Value Patients</span>
              <span className="font-semibold text-gray-800">{data.high_value_patients || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <span className="text-gray-600">Outstanding Payments</span>
              <span className="font-semibold text-red-600">Rs {(data.outstanding_payments || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue vs Previous Period</h3>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-gray-800">{data.revenue_vs_previous_period || 0}%</span>
            {renderTrendBadge(data.revenue_vs_previous_period)}
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Growth Rate</h3>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-gray-800">{data.revenue_growth_rate || 0}%</span>
            {renderTrendBadge(data.revenue_growth_rate)}
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-lg border shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Trend</h3>
        <div className="h-64 overflow-y-auto">
          <div className="space-y-2">
            {data.revenue_trend?.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">{item.date}</span>
                <span className="font-semibold text-gray-800">Rs {item.revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderPerformanceMetrics = () => (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-lg border shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Overall Performance Score</h3>
        <div className="flex items-center justify-center">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="64" cy="64" r="56" stroke="#e5e7eb" strokeWidth="12" fill="none" />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="#3b82f6"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${(data.overall_performance_score || 0) * 3.52} 352`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-800">{data.overall_performance_score || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Patients Per Day"
          value={data.patients_per_day || 0}
          icon="fa-users"
          color="blue"
        />
        <MetricCard
          title="Appointments Per Hour"
          value={data.appointments_per_hour || 0}
          icon="fa-clock"
          color="green"
        />
        <MetricCard
          title="Patient Satisfaction"
          value={`${data.patient_satisfaction_score || 0}/5`}
          icon="fa-smile"
          color="yellow"
        />
        <MetricCard
          title="Clinical Quality Score"
          value={`${data.clinical_quality_score || 0}%`}
          icon="fa-star"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Efficiency Metrics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Consultation Efficiency</span>
              <span className="font-semibold text-gray-800">{data.consultation_efficiency || 0}%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Safety Score</span>
              <span className="font-semibold text-gray-800">{data.safety_score || 0}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Professional Development</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Continuing Education Hours</span>
              <span className="font-semibold text-gray-800">{data.continuing_education_hours || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Certifications Maintained</span>
              <span className="font-semibold text-gray-800">{data.certifications_maintained || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Rankings</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-gray-600">Department Ranking</span>
              <span className="font-semibold text-blue-600">#{data.department_ranking || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="text-gray-600">Hospital Ranking</span>
              <span className="font-semibold text-purple-600">#{data.hospital_ranking || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Achievement Rate</h3>
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl font-bold text-gray-800">{data.achievement_rate || 0}%</span>
            {renderProgressBar(data.achievement_rate || 0, 'green')}
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-lg border shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Targets</h3>
        <div className="space-y-3">
          {Object.entries(data.monthly_targets || {}).map(([target, value]) => (
            <div key={target} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700 capitalize">{target.replace(/_/g, ' ')}</span>
              <span className="font-semibold text-gray-800">{typeof value === 'number' ? value.toLocaleString() : value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderComparativeAnalysis = () => (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-lg border shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Comparison Period</h3>
        <p className="text-gray-700">{data.comparison_period || '-'}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Department Average Metrics</h3>
          <div className="space-y-3">
            {Object.entries(data.department_average_metrics || {}).map(([metric, value]) => (
              <div key={metric} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-gray-700 capitalize">{metric.replace(/_/g, ' ')}</span>
                <span className="font-semibold text-blue-600">{typeof value === 'number' ? value.toFixed(1) : value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Hospital Average Metrics</h3>
          <div className="space-y-3">
            {Object.entries(data.hospital_average_metrics || {}).map(([metric, value]) => (
              <div key={metric} className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-gray-700 capitalize">{metric.replace(/_/g, ' ')}</span>
                <span className="font-semibold text-purple-600">{typeof value === 'number' ? value.toFixed(1) : value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Ranking</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-gray-600">Department Rank</span>
              <span className="font-semibold text-green-600">#{data.department_rank || 0} of {data.total_doctors_in_department || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance vs Benchmark</h3>
          <div className="space-y-3">
            {Object.entries(data.performance_vs_benchmark || {}).map(([metric, status]) => (
              <div key={metric} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700 capitalize">{metric.replace(/_/g, ' ')}</span>
                <span className={`text-sm font-semibold ${status === 'Above Benchmark' ? 'text-green-600' : status === 'Below Benchmark' ? 'text-red-600' : 'text-blue-600'}`}>
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Strengths</h3>
          <ul className="space-y-2">
            {data.strengths?.map((item, index) => (
              <li key={index} className="flex items-center gap-2 text-gray-700">
                <i className="fas fa-check-circle text-green-500"></i>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-5 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Areas for Improvement</h3>
          <ul className="space-y-2">
            {data.improvement_areas?.map((item, index) => (
              <li key={index} className="flex items-center gap-2 text-gray-700">
                <i className="fas fa-exclamation-circle text-yellow-500"></i>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-white p-5 rounded-lg border shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Industry Benchmarks</h3>
        <div className="space-y-3">
          {Object.entries(data.industry_benchmarks || {}).map(([benchmark, value]) => (
            <div key={benchmark} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700 capitalize">{benchmark.replace(/_/g, ' ')}</span>
              <span className="font-semibold text-gray-800">{typeof value === 'number' ? value.toFixed(1) : value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'practice-overview':
        return renderPracticeOverview()
      case 'patient-analytics':
        return renderPatientAnalytics()
      case 'appointment-analytics':
        return renderAppointmentAnalytics()
      case 'clinical-outcomes':
        return renderClinicalOutcomes()
      case 'financial-summary':
        return renderFinancialSummary()
      case 'performance-metrics':
        return renderPerformanceMetrics()
      case 'comparative-analysis':
        return renderComparativeAnalysis()
      default:
        return null
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="mb-2">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Reports & Analytics</h2>
        <p className="text-gray-500 text-sm mt-1">View your performance reports and analytics</p>
      </div>

      {/* Period Selector */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Report Period:</label>
            <select
              value={reportPeriod}
              onChange={handlePeriodChange}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {showCustomDates && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customDateFrom}
                onChange={(e) => setCustomDateFrom(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={customDateTo}
                onChange={(e) => setCustomDateTo(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            <i className="fas fa-sync-alt mr-2"></i>
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="flex border-b overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <i className={`fas ${tab.icon}`}></i>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {error ? (
            <div className="text-center py-8">
              <i className="fas fa-exclamation-circle text-4xl text-red-400 mb-3"></i>
              <p className="text-red-600">{error}</p>
              <button
                onClick={loadData}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : (
            renderContent()
          )}
        </div>
      </div>
    </div>
  )
}

const MetricCard = ({ title, value, icon, color, trend, renderTrendBadge }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-emerald-500',
    yellow: 'from-yellow-400 to-yellow-500',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
  }

  return (
    <div className={`p-4 rounded-xl text-white bg-gradient-to-br ${colorClasses[color] || colorClasses.blue} shadow-md`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/80">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {trend !== undefined && renderTrendBadge && renderTrendBadge(trend)}
        </div>
        <div className="p-3 bg-white/20 rounded-lg">
          <i className={`fas ${icon} text-xl`}></i>
        </div>
      </div>
    </div>
  )
}

export default ReportsAndAnalytics
