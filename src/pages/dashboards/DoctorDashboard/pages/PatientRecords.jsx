import React, { useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import LoadingSpinner from '../../../../components/common/LoadingSpinner/LoadingSpinner'
import DataTable from '../../../../components/ui/Tables/DataTable'
import Modal from '../../../../components/common/Modal/Modal'
import {
  advancedSearchDoctorPatients,
  doctorAppointmentErrorMessage,
  getDoctorAllMedicalRecords,
  getDoctorPatientCaseHistory,
  getDoctorPatientClinicalAlerts,
  getDoctorPatientDocuments,
  getDoctorPatientMedicalRecords,
  getDoctorPatientSummary,
  getDoctorPatientTimeline,
  searchDoctorPatients,
} from '../../../../services/doctorApi'

const SEARCH_SCOPE_OPTIONS = [
  { value: 'ALL_PATIENTS', label: 'All Patients' },
  { value: 'MY_PATIENTS', label: 'My Patients' },
  { value: 'DEPARTMENT_PATIENTS', label: 'Department Patients' },
  { value: 'RECENT_PATIENTS', label: 'Recent Patients' },
]

function parseResponseMessage(payload) {
  return doctorAppointmentErrorMessage(payload)
}

function csvToArray(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString()
}

const PatientRecords = () => {
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [loadingGlobalRecords, setLoadingGlobalRecords] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  const [patients, setPatients] = useState([])
  const [globalRecords, setGlobalRecords] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [patientDetails, setPatientDetails] = useState({
    summary: null,
    records: [],
    timeline: [],
    caseHistory: null,
    alerts: [],
    documents: [],
  })

  const [searchForm, setSearchForm] = useState({
    query: '',
    search_scope: 'ALL_PATIENTS',
    include_inactive: false,
    limit: 20,
  })

  const [advancedForm, setAdvancedForm] = useState({
    query: '',
    search_scope: 'ALL_PATIENTS',
    limit: 20,
    age_min: '',
    age_max: '',
    gender: '',
    blood_group: '',
    chronic_conditions: '',
    allergies: '',
    diagnosis_keywords: '',
    last_visit_from: '',
    last_visit_to: '',
  })

  const [globalRecordFilters, setGlobalRecordFilters] = useState({
    page: 1,
    limit: 20,
    patient_search: '',
    date_from: '',
    date_to: '',
  })

  const stats = useMemo(() => {
    const highRisk = patients.filter((p) => (p.risk_factors || []).length > 0).length
    const chronic = patients.filter((p) => (p.chronic_conditions || []).length > 0).length
    return {
      total: patients.length,
      highRisk,
      chronic,
      withAlerts: patients.filter((p) => (p.clinical_alerts || []).length > 0).length,
    }
  }, [patients])

  const handleSearchPatients = async () => {
    if (String(searchForm.query || '').trim().length < 2) {
      toast.info('Enter at least 2 characters to search patients.')
      return
    }

    setLoadingSearch(true)
    try {
      const response = await searchDoctorPatients(searchForm)
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        toast.error(parseResponseMessage(payload))
        setPatients([])
        return
      }
      setPatients(payload?.patients || payload?.data?.patients || [])
    } catch {
      toast.error('Could not search patients right now.')
      setPatients([])
    } finally {
      setLoadingSearch(false)
    }
  }

  const handleAdvancedSearch = async () => {
    if (String(advancedForm.query || '').trim().length < 2) {
      toast.info('Advanced search query must be at least 2 characters.')
      return
    }

    setLoadingSearch(true)
    try {
      const searchRequest = {
        query: advancedForm.query,
        search_scope: advancedForm.search_scope,
        limit: Number(advancedForm.limit) || 20,
      }
      const filters = {
        age_range:
          advancedForm.age_min || advancedForm.age_max
            ? {
                min: advancedForm.age_min ? Number(advancedForm.age_min) : undefined,
                max: advancedForm.age_max ? Number(advancedForm.age_max) : undefined,
              }
            : null,
        gender: advancedForm.gender || null,
        blood_group: advancedForm.blood_group || null,
        chronic_conditions: csvToArray(advancedForm.chronic_conditions),
        allergies: csvToArray(advancedForm.allergies),
        diagnosis_keywords: csvToArray(advancedForm.diagnosis_keywords),
        last_visit_range:
          advancedForm.last_visit_from || advancedForm.last_visit_to
            ? {
                from: advancedForm.last_visit_from || undefined,
                to: advancedForm.last_visit_to || undefined,
              }
            : null,
      }

      const response = await advancedSearchDoctorPatients(searchRequest, filters)
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        toast.error(parseResponseMessage(payload))
        setPatients([])
        return
      }

      setPatients(payload?.patients || payload?.data?.patients || [])
      toast.success('Advanced search completed.')
    } catch {
      toast.error('Advanced patient search failed.')
      setPatients([])
    } finally {
      setLoadingSearch(false)
    }
  }

  const handleLoadGlobalRecords = async () => {
    setLoadingGlobalRecords(true)
    try {
      const response = await getDoctorAllMedicalRecords(globalRecordFilters)
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        toast.error(parseResponseMessage(payload))
        setGlobalRecords([])
        return
      }
      setGlobalRecords(payload?.records || payload?.data?.records || [])
    } catch {
      toast.error('Could not fetch medical records list.')
      setGlobalRecords([])
    } finally {
      setLoadingGlobalRecords(false)
    }
  }

  const handleOpenPatientDetails = async (patient) => {
    const patientRef = patient?.patient_ref || patient?.patient_id || patient?.patientRef
    if (!patientRef) {
      toast.error('Patient reference is missing.')
      return
    }

    setSelectedPatient(patient)
    setIsDetailsModalOpen(true)
    setDetailsLoading(true)

    try {
      const [summaryRes, recordsRes, timelineRes, caseRes, alertsRes, docsRes] = await Promise.all([
        getDoctorPatientSummary(patientRef),
        getDoctorPatientMedicalRecords(patientRef, { limit: 20 }),
        getDoctorPatientTimeline(patientRef, { grouping: 'MONTHLY' }),
        getDoctorPatientCaseHistory(patientRef, '1year'),
        getDoctorPatientClinicalAlerts(patientRef, false),
        getDoctorPatientDocuments(patientRef),
      ])

      const [
        summaryPayload,
        recordsPayload,
        timelinePayload,
        casePayload,
        alertsPayload,
        docsPayload,
      ] = await Promise.all([
        summaryRes.json().catch(() => ({})),
        recordsRes.json().catch(() => ({})),
        timelineRes.json().catch(() => ({})),
        caseRes.json().catch(() => ({})),
        alertsRes.json().catch(() => ({})),
        docsRes.json().catch(() => ({})),
      ])

      setPatientDetails({
        summary: summaryRes.ok ? (summaryPayload.patient_summary || summaryPayload.data?.patient_summary || null) : null,
        records: recordsRes.ok ? (recordsPayload.medical_records || recordsPayload.data?.medical_records || []) : [],
        timeline: timelineRes.ok ? (timelinePayload.timeline_entries || timelinePayload.data?.timeline_entries || []) : [],
        caseHistory: caseRes.ok ? (casePayload.data || casePayload || null) : null,
        alerts: alertsRes.ok ? (alertsPayload.alerts || alertsPayload.data?.alerts || []) : [],
        documents: docsRes.ok ? (docsPayload.documents || docsPayload.data?.documents || []) : [],
      })
    } catch {
      toast.error('Could not load complete patient insight data.')
      setPatientDetails({
        summary: null,
        records: [],
        timeline: [],
        caseHistory: null,
        alerts: [],
        documents: [],
      })
    } finally {
      setDetailsLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Patient Search & Lookup</h2>
          <p className="text-sm text-gray-500">Search, filter and open complete patient clinical records</p>
        </div>
        <button
          type="button"
          className="btn-primary"
          style={{borderRadius:10,
            height:45,
            width:230
          }}
          onClick={() => setIsAdvancedOpen((prev) => !prev)}
        >
          <i className="bi bi-search me-2"></i>
          {isAdvancedOpen ? 'Hide Advanced Search' : 'Show Advanced Search'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl p-4 text-white bg-gradient-to-br from-blue-500 to-blue-700">
          <p className="text-xs opacity-90">Search Results</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-xl p-4 text-white bg-gradient-to-br from-yellow-400 to-yellow-600">
          <p className="text-xs opacity-90">With Risk Factors</p>
          <p className="text-2xl font-bold">{stats.highRisk}</p>
        </div>
        <div className="rounded-xl p-4 text-white bg-gradient-to-br from-purple-500 to-purple-700">
          <p className="text-xs opacity-90">Chronic Conditions</p>
          <p className="text-2xl font-bold">{stats.chronic}</p>
        </div>
        <div className="rounded-xl p-4 text-white bg-gradient-to-br from-red-500 to-red-700">
          <p className="text-xs opacity-90">Clinical Alerts</p>
          <p className="text-2xl font-bold">{stats.withAlerts}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Simple Search</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            className="form-input"
            placeholder="Patient id, name, phone, email"
            value={searchForm.query}
            onChange={(e) => setSearchForm((prev) => ({ ...prev, query: e.target.value }))}
          />
          <select
            className="form-input"
            value={searchForm.search_scope}
            onChange={(e) => setSearchForm((prev) => ({ ...prev, search_scope: e.target.value }))}
          >
            {SEARCH_SCOPE_OPTIONS.map((scope) => (
              <option key={scope.value} value={scope.value}>
                {scope.label}
              </option>
            ))}
          </select>
          <input
            className="form-input"
            type="number"
            min="1"
            max="100"
            value={searchForm.limit}
            onChange={(e) => setSearchForm((prev) => ({ ...prev, limit: Number(e.target.value) || 20 }))}
          />
          <label className="inline-flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={searchForm.include_inactive}
              onChange={(e) => setSearchForm((prev) => ({ ...prev, include_inactive: e.target.checked }))}
            />
            Include inactive
          </label>
          <button type="button" className="btn-primary"   style={{borderRadius:10 , width:100}}   onClick={handleSearchPatients} disabled={loadingSearch}>
            {loadingSearch ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {isAdvancedOpen && (
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Advanced Search</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <input
              className="form-input"
              placeholder="Search query"
              value={advancedForm.query}
              onChange={(e) => setAdvancedForm((prev) => ({ ...prev, query: e.target.value }))}
            />
            <select
              className="form-input"
              value={advancedForm.search_scope}
              onChange={(e) => setAdvancedForm((prev) => ({ ...prev, search_scope: e.target.value }))}
            >
              {SEARCH_SCOPE_OPTIONS.map((scope) => (
                <option key={scope.value} value={scope.value}>
                  {scope.label}
                </option>
              ))}
            </select>
            <input
              className="form-input"
              type="number"
              placeholder="Min age"
              value={advancedForm.age_min}
              onChange={(e) => setAdvancedForm((prev) => ({ ...prev, age_min: e.target.value }))}
            />
            <input
              className="form-input"
              type="number"
              placeholder="Max age"
              value={advancedForm.age_max}
              onChange={(e) => setAdvancedForm((prev) => ({ ...prev, age_max: e.target.value }))}
            />
            <input
              className="form-input"
              placeholder="Gender"
              value={advancedForm.gender}
              onChange={(e) => setAdvancedForm((prev) => ({ ...prev, gender: e.target.value }))}
            />
            <input
              className="form-input"
              placeholder="Blood group"
              value={advancedForm.blood_group}
              onChange={(e) => setAdvancedForm((prev) => ({ ...prev, blood_group: e.target.value }))}
            />
            <input
              className="form-input"
              placeholder="Chronic conditions (comma separated)"
              value={advancedForm.chronic_conditions}
              onChange={(e) => setAdvancedForm((prev) => ({ ...prev, chronic_conditions: e.target.value }))}
            />
            <input
              className="form-input"
              placeholder="Allergies (comma separated)"
              value={advancedForm.allergies}
              onChange={(e) => setAdvancedForm((prev) => ({ ...prev, allergies: e.target.value }))}
            />
            <input
              className="form-input"
              placeholder="Diagnosis keywords (comma separated)"
              value={advancedForm.diagnosis_keywords}
              onChange={(e) => setAdvancedForm((prev) => ({ ...prev, diagnosis_keywords: e.target.value }))}
            />
            <input
              className="form-input"
              type="date"
              value={advancedForm.last_visit_from}
              onChange={(e) => setAdvancedForm((prev) => ({ ...prev, last_visit_from: e.target.value }))}
            />
            <input
              className="form-input"
              type="date"
              value={advancedForm.last_visit_to}
              onChange={(e) => setAdvancedForm((prev) => ({ ...prev, last_visit_to: e.target.value }))}
            />
            <button type="button" className="btn-primary" onClick={handleAdvancedSearch} disabled={loadingSearch}>
              {loadingSearch ? 'Applying...' : 'Apply Advanced Search'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Matched Patients</h3>
        {loadingSearch ? (
          <LoadingSpinner />
        ) : (
          <DataTable
            columns={[
              { key: 'patient_ref', title: 'Patient Ref', sortable: true },
              { key: 'patient_name', title: 'Name', sortable: true },
              { key: 'patient_age', title: 'Age', sortable: true },
              { key: 'gender', title: 'Gender', sortable: true },
              { key: 'phone_number', title: 'Phone', sortable: false },
              { key: 'total_visits', title: 'Visits', sortable: true },
              {
                key: 'last_visit_date',
                title: 'Last Visit',
                render: (value) => formatDate(value),
              },
              {
                key: 'risk_factors',
                title: 'Risk',
                render: (value) => (
                  <span className="text-xs">{Array.isArray(value) && value.length > 0 ? value.join(', ') : '-'}</span>
                ),
              },
              {
                key: 'actions',
                title: 'Actions',
                render: (_, row) => (
                  <button
                    type="button"
                    className="icon-btn text-blue-600"
                    title="Open patient details"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenPatientDetails(row)
                    }}
                  >
                    <i className="fas fa-folder-open"></i>
                  </button>
                ),
              },
            ]}
            data={patients}
          />
        )}
      </div>

      <div className="bg-white rounded-xl border p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <h3 className="text-lg font-semibold text-gray-800">General Medical Records</h3>
          <div className="flex flex-wrap gap-2">
            <input
              className="form-input"
              placeholder="Patient search"
              value={globalRecordFilters.patient_search}
              onChange={(e) => setGlobalRecordFilters((prev) => ({ ...prev, patient_search: e.target.value }))}
            />
            <input
              className="form-input"
              type="date"
              value={globalRecordFilters.date_from}
              onChange={(e) => setGlobalRecordFilters((prev) => ({ ...prev, date_from: e.target.value }))}
            />
            <input
              className="form-input"
              type="date"
              value={globalRecordFilters.date_to}
              onChange={(e) => setGlobalRecordFilters((prev) => ({ ...prev, date_to: e.target.value }))}
            />
            <br />
            <button type="button" className="btn-primary" style={{borderRadius:8,height:45,width:120, marginTop:10}} onClick={handleLoadGlobalRecords}>
              {loadingGlobalRecords ? 'Loading...' : 'Load Records'}
            </button>
          </div>
        </div>
        <DataTable
          columns={[
            { key: 'record_id', title: 'Record ID', sortable: false },
            { key: 'patient_ref', title: 'Patient', sortable: true },
            { key: 'patient_name', title: 'Name', sortable: true },
            { key: 'doctor_name', title: 'Doctor', sortable: true },
            { key: 'date', title: 'Date', sortable: true },
            { key: 'diagnosis', title: 'Diagnosis', sortable: false },
            {
              key: 'is_finalized',
              title: 'Finalized',
              render: (value) => (
                <span className={`text-xs px-2 py-1 rounded-full ${value ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {value ? 'Yes' : 'No'}
                </span>
              ),
            },
          ]}
          data={globalRecords}
        />
      </div>

      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={`Patient Insights - ${selectedPatient?.patient_name || selectedPatient?.patient_ref || ''}`}
        size="xl"
      >
        {detailsLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Patient Summary</h4>
                <p><strong>Name:</strong> {patientDetails.summary?.patient_name || '-'}</p>
                <p><strong>Age:</strong> {patientDetails.summary?.patient_age || '-'}</p>
                <p><strong>Blood Group:</strong> {patientDetails.summary?.blood_group || '-'}</p>
                <p><strong>Phone:</strong> {patientDetails.summary?.phone_number || '-'}</p>
                <p><strong>Last Diagnosis:</strong> {patientDetails.summary?.last_diagnosis || '-'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Clinical Alerts</h4>
                {(patientDetails.alerts || []).length === 0 ? (
                  <p className="text-sm text-gray-500">No active alerts.</p>
                ) : (
                  <div className="space-y-2">
                    {patientDetails.alerts.slice(0, 5).map((alert) => (
                      <div key={alert.alert_id} className="border rounded p-2 bg-white">
                        <p className="font-medium text-sm">{alert.title}</p>
                        <p className="text-xs text-gray-500">{alert.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Recent Medical Records</h4>
              <DataTable
                columns={[
                  { key: 'date', title: 'Date', sortable: true },
                  { key: 'doctor_name', title: 'Doctor', sortable: true },
                  { key: 'chief_complaint', title: 'Chief Complaint', sortable: false },
                  { key: 'diagnosis', title: 'Diagnosis', sortable: false },
                  { key: 'treatment_plan', title: 'Plan', sortable: false },
                ]}
                data={patientDetails.records || []}
              />
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Timeline Entries</h4>
              <div className="max-h-60 overflow-auto border rounded-lg divide-y">
                {(patientDetails.timeline || []).length === 0 ? (
                  <p className="text-sm text-gray-500 p-3">No timeline entries available.</p>
                ) : (
                  patientDetails.timeline.slice(0, 20).map((entry, idx) => (
                    <div key={`${entry.type}-${entry.date}-${idx}`} className="p-3">
                      <p className="font-medium text-sm">{entry.title || entry.type}</p>
                      <p className="text-xs text-gray-500">{entry.date} {entry.time ? `• ${entry.time}` : ''}</p>
                      <p className="text-sm text-gray-700">{entry.description || '-'}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Case History Analysis</h4>
                <div className="border rounded-lg p-3 bg-gray-50 text-sm">
                  <p><strong>Total Cases:</strong> {patientDetails.caseHistory?.total_cases ?? '-'}</p>
                  <p><strong>Readmission Risk:</strong> {patientDetails.caseHistory?.readmission_risk ?? '-'}</p>
                  <p className="mt-2 font-medium">Recommendations</p>
                  <ul className="list-disc pl-5">
                    {(patientDetails.caseHistory?.clinical_recommendations || []).slice(0, 5).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Documents</h4>
                <div className="border rounded-lg p-3 bg-gray-50 text-sm space-y-2 max-h-48 overflow-auto">
                  {(patientDetails.documents || []).length === 0 ? (
                    <p className="text-gray-500">No documents available.</p>
                  ) : (
                    patientDetails.documents.map((doc) => (
                      <div key={doc.document_id} className="bg-white border rounded p-2">
                        <p className="font-medium">{doc.title || doc.file_name}</p>
                        <p className="text-xs text-gray-500">{doc.document_type} • {doc.uploaded_date}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default PatientRecords
