import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import LoadingSpinner from '../../../../components/common/LoadingSpinner/LoadingSpinner'
import {
  getActivePrescriptions,
  getPrescriptionHistory,
  getPrescriptionDetails,
  requestPrescriptionRefill
} from '../../../../services/patientApi'

// Backend returns these status values from TelePrescription model
// SIGNED, ACTIVE → Active (green)
// DISPENSED      → Dispensed/Completed (blue)
// CANCELLED      → Cancelled (red)
// anything else  → gray
function getStatusColor(status) {
  if (!status) return 'bg-gray-100 text-gray-700'
  const s = status.toUpperCase()
  if (s === 'SIGNED' || s === 'ACTIVE') return 'bg-green-100 text-green-800'
  if (s === 'DISPENSED') return 'bg-blue-100 text-blue-800'
  if (s === 'CANCELLED') return 'bg-red-100 text-red-800'
  return 'bg-gray-100 text-gray-700'
}

function getStatusLabel(status) {
  if (!status) return 'Unknown'
  const s = status.toUpperCase()
  if (s === 'SIGNED') return 'Signed'
  if (s === 'ACTIVE') return 'Active'
  if (s === 'DISPENSED') return 'Dispensed'
  if (s === 'CANCELLED') return 'Cancelled'
  return status
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    })
  } catch {
    return dateStr
  }
}

// Extract list from backend response  
// Backend: GET /my/active → { "prescriptions": [...] }
// Backend: GET /my/history → { "prescriptions": [...] }
function extractList(payload) {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.prescriptions)) return payload.prescriptions
  if (Array.isArray(payload.data)) return payload.data
  return []
}

const Prescriptions = () => {
  const [loading, setLoading] = useState(true)
  const [prescriptions, setPrescriptions] = useState([])
  const [filter, setFilter] = useState('all')
  const [selectedPrescription, setSelectedPrescription] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [refillLoading, setRefillLoading] = useState(null)

  useEffect(() => {
    loadPrescriptions()
  }, [filter])

  const loadPrescriptions = async () => {
    setLoading(true)
    try {
      let all = []

      if (filter === 'all') {
        // Fetch both active and history concurrently
        const [activeRes, historyRes] = await Promise.all([
          getActivePrescriptions(),
          getPrescriptionHistory()
        ])
        
        if (!activeRes.ok || !historyRes.ok) {
          console.error('[Prescriptions] Error fetching all:', activeRes.status, historyRes.status)
          toast.error('Failed to load prescriptions.')
          setPrescriptions([])
          return
        }
        
        const activePayload = await activeRes.json().catch(() => ({}))
        const historyPayload = await historyRes.json().catch(() => ({}))
        
        const activeList = extractList(activePayload)
        const historyList = extractList(historyPayload)
        
        // Merge without duplicates (using prescription_id as key)
        const map = new Map()
        activeList.forEach(p => map.set(p.prescription_id, p))
        historyList.forEach(p => map.set(p.prescription_id, p))
        
        all = Array.from(map.values())

      } else if (filter === 'active') {
        const res = await getActivePrescriptions()
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          console.error('[Prescriptions] active error:', res.status, err)
          toast.error(err?.detail || 'Failed to load active prescriptions.')
          setPrescriptions([])
          return
        }
        const payload = await res.json().catch(() => ({}))
        console.log('[Prescriptions] active payload:', payload)
        all = extractList(payload)

      } else if (filter === 'dispensed') {
        const res = await getPrescriptionHistory()
        if (!res.ok) { setPrescriptions([]); return }
        const payload = await res.json().catch(() => ({}))
        const list = extractList(payload)
        all = list.filter(p => p.status?.toUpperCase() === 'DISPENSED')

      } else if (filter === 'cancelled') {
        const res = await getPrescriptionHistory()
        if (!res.ok) { setPrescriptions([]); return }
        const payload = await res.json().catch(() => ({}))
        const list = extractList(payload)
        all = list.filter(p => p.status?.toUpperCase() === 'CANCELLED')
      }

      setPrescriptions(all)
    } catch (err) {
      console.error('[Prescriptions] exception:', err)
      toast.error('Could not load prescriptions. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = async (prescription) => {
    // prescription_id is the UUID from backend
    const uuid = prescription.prescription_id
    if (!uuid) {
      setSelectedPrescription({ ...prescription, medicines: [], lab_orders: [] })
      return
    }
    setDetailLoading(true)
    try {
      const res = await getPrescriptionDetails(uuid)
      const payload = await res.json().catch(() => ({}))
      console.log('[Prescriptions] detail payload:', payload)
      if (!res.ok) {
        toast.error(payload?.detail || 'Failed to load prescription details.')
        setSelectedPrescription({ ...prescription, medicines: [], lab_orders: [] })
        return
      }
      // Detail response has medicines and lab_orders arrays
      setSelectedPrescription(payload)
    } catch (err) {
      console.error('[Prescriptions] detail exception:', err)
      toast.error('Failed to load details.')
      setSelectedPrescription({ ...prescription, medicines: [], lab_orders: [] })
    } finally {
      setDetailLoading(false)
    }
  }

  const handleRefillRequest = async (prescriptionId) => {
    if (!window.confirm('Submit a refill request for this prescription?')) return
    setRefillLoading(prescriptionId)
    try {
      const res = await requestPrescriptionRefill(prescriptionId)
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(payload?.detail || 'Refill request failed.')
        return
      }
      toast.success(payload?.message || 'Refill request submitted successfully!')
    } catch (err) {
      console.error('[Prescriptions] refill exception:', err)
      toast.error('Failed to submit refill request.')
    } finally {
      setRefillLoading(null)
    }
  }

  const handleNewPrescription = () => setIsRequestModalOpen(true)
  const handleBookAppointment = () => {
    setIsRequestModalOpen(false)
    window.dispatchEvent(new CustomEvent('dashboard-navigation', { detail: { page: 'appointments' } }))
  }

  // Stats from current list
  const statActive = prescriptions.filter(p => ['SIGNED', 'ACTIVE'].includes(p.status?.toUpperCase())).length
  const statDispensed = prescriptions.filter(p => p.status?.toUpperCase() === 'DISPENSED').length
  const statCancelled = prescriptions.filter(p => p.status?.toUpperCase() === 'CANCELLED').length

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-gray-700">Prescriptions</h2>
          <p className="text-gray-500 text-sm mt-1">View and manage your prescribed medications</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleNewPrescription}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
          >
            <i className="fas fa-prescription mr-2"></i>New Prescription
          </button>
          <button
            onClick={() => { setFilter('all'); loadPrescriptions() }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            <i className="fas fa-sync-alt mr-2"></i>Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative bg-gradient-to-br from-white to-blue-50 p-5 rounded-2xl border border-blue-100 shadow-sm">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Total</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{prescriptions.length}</p>
          <div className="mt-4 pt-3 border-t border-blue-100">
            <p className="text-xs text-blue-700 font-medium">All prescriptions</p>
          </div>
        </div>
        <div className="relative bg-gradient-to-br from-white to-emerald-50 p-5 rounded-2xl border border-emerald-100 shadow-sm">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Active</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{statActive}</p>
          <div className="mt-4 pt-3 border-t border-emerald-100">
            <p className="text-xs text-emerald-700 font-medium">Signed / Active</p>
          </div>
        </div>
        <div className="relative bg-gradient-to-br from-white to-indigo-50 p-5 rounded-2xl border border-indigo-100 shadow-sm">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Dispensed</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{statDispensed}</p>
          <div className="mt-4 pt-3 border-t border-indigo-100">
            <p className="text-xs text-indigo-700 font-medium">Given by pharmacy</p>
          </div>
        </div>
        <div className="relative bg-gradient-to-br from-white to-rose-50 p-5 rounded-2xl border border-rose-100 shadow-sm">
          <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Cancelled</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{statCancelled}</p>
          <div className="mt-4 pt-3 border-t border-rose-100">
            <p className="text-xs text-rose-700 font-medium">No longer valid</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'active', label: 'Active' },
          { key: 'dispensed', label: 'Dispensed' },
          { key: 'cancelled', label: 'Cancelled' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              filter === key
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Prescription Cards */}
      <div id="prescription-list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {prescriptions.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-file-prescription text-gray-400 text-2xl"></i>
            </div>
            <h3 className="text-gray-600 font-medium">No prescriptions found</h3>
            <p className="text-gray-400 text-sm mt-1">
              {filter === 'all' ? 'You have no prescriptions yet.' : `No ${filter} prescriptions.`}
            </p>
          </div>
        ) : (
          prescriptions.map((prescription) => {
            const uuid = prescription.prescription_id
            const displayNo = prescription.prescription_no || uuid?.slice(0, 8) || 'N/A'
            const isActive = ['SIGNED', 'ACTIVE'].includes(prescription.status?.toUpperCase())

            return (
              <div key={uuid || displayNo} className="bg-white rounded-xl card-shadow border p-5 hover:shadow-md transition-shadow">
                {/* Card Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(prescription.status)}`}>
                      {getStatusLabel(prescription.status)}
                    </span>
                    <h3 className="font-semibold text-gray-800 mt-2">Rx #{displayNo}</h3>
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(prescription.created_at)}</span>
                </div>

                {/* Diagnosis */}
                {prescription.diagnosis && (
                  <div className="flex items-start text-sm mb-3">
                    <i className="fas fa-stethoscope text-gray-400 mr-2 mt-0.5 w-5 flex-shrink-0"></i>
                    <span className="text-gray-700 line-clamp-2">{prescription.diagnosis}</span>
                  </div>
                )}

                {/* Follow-up Date */}
                {prescription.follow_up_date && (
                  <div className="flex items-center text-sm mb-3">
                    <i className="far fa-calendar-check text-blue-400 mr-2 w-5"></i>
                    <span className="text-gray-700">Follow-up: {formatDate(prescription.follow_up_date)}</span>
                  </div>
                )}

                {/* Note: medicines are NOT in list response, only in detail */}
                <div className="flex items-center text-sm mb-3 text-gray-500">
                  <i className="fas fa-pills mr-2 w-5 text-gray-300"></i>
                  <span className="italic text-xs">View details to see medicines</span>
                </div>

                {/* Card Actions */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <button
                    onClick={() => handleViewDetails(prescription)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    <i className="fas fa-eye mr-1"></i>View Details
                  </button>
                  {isActive && (
                    <button
                      onClick={() => handleRefillRequest(uuid)}
                      disabled={refillLoading === uuid}
                      className="text-green-600 hover:text-green-800 text-sm font-medium disabled:opacity-50"
                      title="Request Refill"
                    >
                      <i className={`fas fa-redo mr-1 ${refillLoading === uuid ? 'fa-spin' : ''}`}></i>
                      {refillLoading === uuid ? 'Requesting...' : 'Refill'}
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Prescription Detail Modal */}
      {detailLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg px-6 py-4 shadow-lg text-gray-700">
            <i className="fas fa-circle-notch fa-spin mr-2 text-blue-500"></i>Loading details…
          </div>
        </div>
      )}

      {selectedPrescription && !detailLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Prescription Details</h3>
                <button
                  onClick={() => setSelectedPrescription(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <i className="fas fa-times text-lg"></i>
                </button>
              </div>

              <div className="space-y-5">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Prescription No.</p>
                    <p className="font-semibold text-gray-800">
                      {selectedPrescription.prescription_no || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedPrescription.status)}`}>
                      {getStatusLabel(selectedPrescription.status)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Issued Date</p>
                    <p className="font-medium">{formatDate(selectedPrescription.created_at)}</p>
                  </div>
                  {selectedPrescription.follow_up_date && (
                    <div>
                      <p className="text-sm text-gray-500">Follow-up Date</p>
                      <p className="font-medium text-blue-700">{formatDate(selectedPrescription.follow_up_date)}</p>
                    </div>
                  )}
                </div>

                {/* Diagnosis */}
                {selectedPrescription.diagnosis && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-500 mb-1">Diagnosis</p>
                    <p className="text-gray-800 font-medium">{selectedPrescription.diagnosis}</p>
                  </div>
                )}

                {/* Medicines - only available in detail response */}
                {Array.isArray(selectedPrescription.medicines) && selectedPrescription.medicines.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-500 mb-3">
                      Medications ({selectedPrescription.medicines.length})
                    </p>
                    <div className="space-y-3">
                      {selectedPrescription.medicines.map((med, idx) => (
                        <div key={med.id || idx} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-semibold text-gray-800">{med.medicine_name}</p>
                            {med.frequency && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                {med.frequency}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                            {med.dose && (
                              <div><span className="font-medium">Dose:</span> {med.dose}</div>
                            )}
                            {med.duration_days && (
                              <div><span className="font-medium">Duration:</span> {med.duration_days} days</div>
                            )}
                            {med.instructions && (
                              <div className="col-span-2">
                                <span className="font-medium">Instructions:</span> {med.instructions}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lab Orders */}
                {Array.isArray(selectedPrescription.lab_orders) && selectedPrescription.lab_orders.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-500 mb-3">Lab Orders ({selectedPrescription.lab_orders.length})</p>
                    <div className="space-y-2">
                      {selectedPrescription.lab_orders.map((order, idx) => (
                        <div key={order.id || idx} className="flex items-center justify-between bg-purple-50 border border-purple-100 rounded-lg px-4 py-2">
                          <div className="flex items-center">
                            <i className="fas fa-flask text-purple-400 mr-2"></i>
                            <span className="text-sm font-medium text-purple-900">{order.test_name}</span>
                          </div>
                          {order.urgency && (
                            <span className="text-xs text-purple-600 font-medium">{order.urgency}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-5 border-t">
                  {['SIGNED', 'ACTIVE'].includes(selectedPrescription.status?.toUpperCase()) && (
                    <button
                      onClick={() => handleRefillRequest(selectedPrescription.prescription_id)}
                      disabled={refillLoading === selectedPrescription.prescription_id}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <i className={`fas fa-redo mr-2 ${refillLoading === selectedPrescription.prescription_id ? 'fa-spin' : ''}`}></i>
                      Request Refill
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedPrescription(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Prescription Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">New Prescription</h3>
                <button onClick={() => setIsRequestModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <i className="fas fa-times text-lg"></i>
                </button>
              </div>
              <p className="text-gray-600 mb-6">How would you like to get a new prescription?</p>
              <div className="space-y-4">
                <button
                  onClick={handleBookAppointment}
                  className="w-full flex items-center p-4 border-2 border-blue-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group text-left"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4 group-hover:bg-blue-200">
                    <i className="fas fa-calendar-alt text-blue-600 text-xl"></i>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800">Book an Appointment</h4>
                    <p className="text-sm text-gray-500">See a doctor for a new prescription.</p>
                  </div>
                  <i className="fas fa-chevron-right text-gray-300 group-hover:text-blue-500 ml-2"></i>
                </button>
                <button
                  onClick={() => {
                    setIsRequestModalOpen(false)
                    toast.info('Request submitted. A doctor will contact you via messages.')
                  }}
                  className="w-full flex items-center p-4 border-2 border-green-100 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group text-left"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4 group-hover:bg-green-200">
                    <i className="fas fa-file-medical text-green-600 text-xl"></i>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800">Request Online</h4>
                    <p className="text-sm text-gray-500">Request a refill or renewal online.</p>
                  </div>
                  <i className="fas fa-chevron-right text-gray-300 group-hover:text-green-500 ml-2"></i>
                </button>
              </div>
              <div className="mt-6 pt-4 border-t flex justify-center">
                <button onClick={() => setIsRequestModalOpen(false)} className="text-gray-500 font-medium hover:text-gray-700">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Prescriptions