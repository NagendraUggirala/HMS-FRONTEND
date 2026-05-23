import React, { useState, useEffect } from 'react'
import LoadingSpinner from '../../../../components/common/LoadingSpinner/LoadingSpinner'
import { toast } from 'react-toastify'
import { getMyDischargeSummaries } from '../../../../services/patientApi'

function extractList(payload) {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.data)) return payload.data
  if (Array.isArray(payload.summaries)) return payload.summaries
  return []
}

const DischargeSummary = () => {
  const [loading, setLoading] = useState(true)
  const [summaries, setSummaries] = useState([])

  useEffect(() => {
    loadSummaries()
  }, [])

  const loadSummaries = async () => {
    setLoading(true)
    try {
      const res = await getMyDischargeSummaries()
      const payload = await res.json().catch(() => ({}))
      console.log('[Discharge Summary] payload:', payload)

      if (!res.ok) {
        toast.error(payload?.detail || 'Failed to load discharge summaries.')
        setSummaries([])
        return
      }

      const list = extractList(payload)
      setSummaries(list)
    } catch (error) {
      console.error('[Discharge Summary] error:', error)
      toast.error('Could not connect to the server to fetch summaries.')
      setSummaries([])
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = (id) => {
    toast.info(`Downloading discharge summary ${id}...`)
    // In a real implementation, this would trigger a PDF download from the backend
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6 animate-fade-in p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Discharge Summaries</h2>
          <p className="text-gray-500 text-sm mt-1">
            View and download your past hospital admission and discharge records.
          </p>
        </div>
      </div>

      {summaries.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            <i className="fas fa-file-contract"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-1">No Discharge Records Found</h3>
          <p className="text-gray-500">You don't have any past hospital admissions on record.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {summaries.map((summary) => {
            const isFinalized = summary.is_finalized
            const statusLabel = isFinalized ? 'Finalized' : 'Draft'
            
            // Handle dates
            const admissionDate = summary.admission_date ? new Date(summary.admission_date).toLocaleDateString() : '—'
            const dischargeDate = summary.discharge_date ? new Date(summary.discharge_date).toLocaleDateString() : '—'

            // Format medications
            let meds = []
            if (Array.isArray(summary.medications_on_discharge)) {
              meds = summary.medications_on_discharge
            }

            return (
              <div key={summary.summary_id || summary.id} className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="bg-blue-50/50 p-4 border-b flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-800 text-lg">{summary.final_diagnosis || summary.diagnosis || 'Discharge Record'}</h3>
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        isFinalized ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {statusLabel}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      <i className="far fa-building mr-1.5"></i> {summary.department_name || summary.hospitalName || 'Hospital'} &nbsp;|&nbsp; 
                      <i className="fas fa-user-md ml-2 mr-1.5"></i> {summary.doctor_name || summary.admittingDoctor || 'Doctor'}
                    </p>
                  </div>
                  <div className="flex flex-col md:items-end">
                    <div className="text-sm font-medium text-gray-700 mb-1">
                      Admission No: <span className="text-blue-600">{summary.admission_number || summary.id}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {admissionDate} to {dischargeDate}
                    </div>
                  </div>
                </div>
                
                <div className="p-5">
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Hospital Course & Notes</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">{summary.hospital_course || summary.notes || 'No detailed course notes available.'}</p>
                  </div>

                  {summary.chief_complaint && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Chief Complaint</h4>
                      <p className="text-gray-600 text-sm leading-relaxed">{summary.chief_complaint}</p>
                    </div>
                  )}

                  {summary.follow_up_instructions && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Follow-up Instructions</h4>
                      <p className="text-gray-600 text-sm leading-relaxed">{summary.follow_up_instructions}</p>
                    </div>
                  )}
                  
                  {meds.length > 0 && (
                    <div className="mt-5">
                      <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Discharge Medications</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {meds.map((med, idx) => {
                          const medName = typeof med === 'string' ? med : (med.name || med.medication_name || 'Medicine')
                          const dosage = med.dosage || ''
                          const frequency = med.frequency || ''
                          const duration = med.duration || ''
                          return (
                            <div key={idx} className="flex items-start p-3 bg-gray-50 rounded-lg border border-gray-100">
                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 flex-shrink-0">
                                <i className="fas fa-pills text-sm"></i>
                              </div>
                              <div>
                                <div className="font-medium text-gray-800 text-sm">{medName} {dosage && <span className="text-gray-500 font-normal">({dosage})</span>}</div>
                                {(frequency || duration) && (
                                  <div className="text-xs text-gray-500 mt-1">{frequency} {duration && `• ${duration}`}</div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-6 pt-4 border-t flex justify-end">
                    <button 
                      onClick={() => handleDownload(summary.summary_id || summary.id)}
                      className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
                    >
                      <i className="fas fa-file-pdf text-red-500 mr-2"></i> Download Full Report
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default DischargeSummary
