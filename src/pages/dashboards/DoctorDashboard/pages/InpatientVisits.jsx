import React, { useState, useEffect, useRef } from 'react'
import LoadingSpinner from '../../../../components/common/LoadingSpinner/LoadingSpinner'
import { getDoctorInpatientVisits, updateDoctorInpatientVitals } from '../../../../services/doctorApi'

const InpatientVisits = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [inpatients, setInpatients] = useState([])
  const [activeOnly, setActiveOnly] = useState(false)

  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [showVitalsModal, setShowVitalsModal] = useState(false)
  const [showMedicationsModal, setShowMedicationsModal] = useState(false)
  const [vitalsSubmitting, setVitalsSubmitting] = useState(false)

  const [notes, setNotes] = useState('')
  const [vitals, setVitals] = useState({
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    oxygenSaturation: ''
  })
  const [newMedication, setNewMedication] = useState('')
  const medicationInputRef = useRef(null)

  useEffect(() => {
    loadInpatients()
  }, [activeOnly])

  const loadInpatients = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getDoctorInpatientVisits(activeOnly)
      setInpatients(data)
    } catch (err) {
      console.error('Failed to load inpatient visits:', err)
      setError(err.message || 'Failed to load inpatient visits')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateNotes = (patient) => {
    setSelectedPatient(patient)
    setNotes(patient.notes || '')
    setShowNotesModal(true)
  }

  const handleSaveNotes = () => {
    if (selectedPatient) {
      setInpatients(prev => prev.map(p =>
        p.id === selectedPatient.id ? { ...p, notes } : p
      ))
    }
    setShowNotesModal(false)
    setSelectedPatient(null)
    setNotes('')
  }

  const handleVitals = (patient) => {
    setSelectedPatient(patient)
    setVitals({
      bloodPressure: patient.vitals?.bloodPressure || '',
      heartRate: patient.vitals?.heartRate || '',
      temperature: patient.vitals?.temperature || '',
      oxygenSaturation: patient.vitals?.oxygenSaturation || ''
    })
    setShowVitalsModal(true)
  }

  const handleSaveVitals = async () => {
    if (!selectedPatient) return
    try {
      setVitalsSubmitting(true)
      await updateDoctorInpatientVitals(selectedPatient.admissionId, {
        bloodPressure: vitals.bloodPressure || null,
        heartRate: vitals.heartRate || null,
        temperature: vitals.temperature || null,
        oxygenSaturation: vitals.oxygenSaturation || null,
      })
      setInpatients(prev => prev.map(p =>
        p.id === selectedPatient.id ? { ...p, vitals } : p
      ))
      alert('Vitals saved successfully!')
      setShowVitalsModal(false)
      setSelectedPatient(null)
    } catch (err) {
      console.error('Failed to save vitals:', err)
      alert('Failed to save vitals: ' + err.message)
    } finally {
      setVitalsSubmitting(false)
    }
  }

  const handleMedications = (patient) => {
    setSelectedPatient(patient)
    setNewMedication('')
    setShowMedicationsModal(true)
  }

  const handleAddMedication = () => {
    if (newMedication.trim() && selectedPatient) {
      setInpatients(prev => prev.map(p =>
        p.id === selectedPatient.id
          ? { ...p, medications: [...(p.medications || []), newMedication.trim()] }
          : p
      ))
      setSelectedPatient(prev => ({
        ...prev,
        medications: [...(prev.medications || []), newMedication.trim()]
      }))
      setNewMedication('')
      medicationInputRef.current?.focus()
    }
  }

  const handleRemoveMedication = (patientId, medicationIndex) => {
    setInpatients(prev => prev.map(p =>
      p.id === patientId
        ? { ...p, medications: p.medications.filter((_, i) => i !== medicationIndex) }
        : p
    ))
    setSelectedPatient(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== medicationIndex)
    }))
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleAddMedication()
  }

  const statusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800'
    const s = status.toUpperCase()
    if (s === 'ADMITTED' || s === 'STABLE') return 'bg-green-100 text-green-800'
    if (s === 'CRITICAL') return 'bg-red-100 text-red-800'
    if (s === 'PENDING') return 'bg-yellow-100 text-yellow-800'
    if (s === 'DISCHARGED') return 'bg-blue-100 text-blue-800'
    return 'bg-gray-100 text-gray-800'
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Inpatient Visits</h2>
          <p className="text-gray-500 text-sm mt-1">
            {inpatients.length} admission{inpatients.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="rounded"
            />
            Active only
          </label>
          <button
            onClick={loadInpatients}
            className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm flex items-center gap-2 transition-colors"
          >
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <i className="fas fa-exclamation-circle text-red-500"></i>
          <div>
            <p className="text-red-700 font-medium">Failed to load inpatient visits</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <button onClick={loadInpatients} className="ml-auto text-red-600 hover:text-red-800 text-sm underline">
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!error && inpatients.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <i className="fas fa-hospital-user text-5xl mb-4 block"></i>
          <p className="text-lg font-medium">No inpatient visits found</p>
          <p className="text-sm mt-1">
            {activeOnly ? 'No active admissions at this time.' : 'No admissions on record.'}
          </p>
        </div>
      )}

      {/* Patient Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {inpatients.map(patient => (
          <div key={patient.id} className="bg-white p-4 border rounded-xl card-shadow fade-in hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-blue-700 text-lg">{patient.name}</h3>
                <p className="text-sm text-gray-500">#{patient.admissionNumber}</p>
                {(patient.ward || patient.bed) && (
                  <p className="text-sm text-gray-600 mt-0.5">
                    {[patient.ward, patient.room && 'Rm ' + patient.room, patient.bed && 'Bed ' + patient.bed]
                      .filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(patient.status)}`}>
                {patient.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div>
                <p className="text-gray-500">Admission Date</p>
                <p className="font-medium">{patient.admissionDate || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">Admission Type</p>
                <p className="font-medium">{patient.admissionType || '—'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500">Chief Complaint</p>
                <p className="font-medium">{patient.condition || '—'}</p>
              </div>
            </div>

            {patient.vitals && (
              <div className="mb-3 p-3 bg-green-50 rounded-lg border border-green-100 grid grid-cols-2 gap-1 text-xs">
                {patient.vitals.bloodPressure && <span><strong>BP:</strong> {patient.vitals.bloodPressure}</span>}
                {patient.vitals.heartRate && <span><strong>HR:</strong> {patient.vitals.heartRate}</span>}
                {patient.vitals.temperature && <span><strong>Temp:</strong> {patient.vitals.temperature}</span>}
                {patient.vitals.oxygenSaturation && <span><strong>SpO₂:</strong> {patient.vitals.oxygenSaturation}</span>}
              </div>
            )}

            {patient.notes && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Notes</p>
                <p className="text-sm">{patient.notes}</p>
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleUpdateNotes(patient)}
                className="bg-blue-500 text-white px-3 py-2 text-sm rounded-xl hover:bg-blue-600 shadow-sm flex items-center transition-all"
              >
                <i className="fas fa-notes-medical mr-2"></i>Notes
              </button>
              <button
                onClick={() => handleVitals(patient)}
                className="bg-green-500 text-white px-3 py-2 text-sm rounded-xl hover:bg-green-600 shadow-sm flex items-center transition-all"
              >
                <i className="fas fa-chart-line mr-2"></i>Vitals
              </button>
              <button
                onClick={() => handleMedications(patient)}
                className="bg-purple-500 text-white px-3 py-2 text-sm rounded-xl hover:bg-purple-600 shadow-sm flex items-center transition-all"
              >
                <i className="fas fa-pills mr-2"></i>Medications
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Update Notes — {selectedPatient?.name}</h3>
              <button onClick={() => setShowNotesModal(false)} className="text-gray-500 hover:text-gray-700">
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-32 p-3 border border-gray-300 rounded mb-4 resize-none"
              placeholder="Enter patient notes..."
            />
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={() => setShowNotesModal(false)}
                className="w-full sm:w-auto px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vitals Modal */}
      {showVitalsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Record Vitals — {selectedPatient?.name}</h3>
              <button onClick={() => setShowVitalsModal(false)} className="text-gray-500 hover:text-gray-700">
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-4">Admission #{selectedPatient?.admissionNumber}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Blood Pressure</label>
                <input
                  type="text"
                  value={vitals.bloodPressure}
                  onChange={(e) => setVitals(prev => ({ ...prev, bloodPressure: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="e.g. 120/80"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Heart Rate</label>
                <input
                  type="text"
                  value={vitals.heartRate}
                  onChange={(e) => setVitals(prev => ({ ...prev, heartRate: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="e.g. 72 bpm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Temperature</label>
                <input
                  type="text"
                  value={vitals.temperature}
                  onChange={(e) => setVitals(prev => ({ ...prev, temperature: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="e.g. 98.6°F"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Oxygen Saturation</label>
                <input
                  type="text"
                  value={vitals.oxygenSaturation}
                  onChange={(e) => setVitals(prev => ({ ...prev, oxygenSaturation: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="e.g. 98%"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={() => setShowVitalsModal(false)}
                disabled={vitalsSubmitting}
                className="w-full sm:w-auto px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveVitals}
                disabled={vitalsSubmitting}
                className="w-full sm:w-auto px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {vitalsSubmitting && <i className="fas fa-spinner fa-spin"></i>}
                {vitalsSubmitting ? 'Saving...' : 'Save Vitals'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Medications Modal */}
      {showMedicationsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Medications — {selectedPatient?.name}</h3>
              <button onClick={() => setShowMedicationsModal(false)} className="text-gray-500 hover:text-gray-700">
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <h4 className="font-medium mb-2">Current Medications:</h4>
              {selectedPatient?.medications?.length > 0 ? (
                <div className="space-y-2">
                  {selectedPatient.medications.map((med, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <i className="fas fa-pill text-purple-500 mr-3"></i>
                        <span className="text-sm">{med}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveMedication(selectedPatient.id, index)}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <i className="fas fa-pills text-3xl text-gray-300 mb-2 block"></i>
                  <p>No medications added yet</p>
                </div>
              )}
              <div className="mt-4">
                <h4 className="font-medium mb-2">Add New Medication:</h4>
                <div className="flex gap-2">
                  <input
                    ref={medicationInputRef}
                    type="text"
                    value={newMedication}
                    onChange={(e) => setNewMedication(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Name and dosage..."
                    className="flex-1 p-2 border border-gray-300 rounded text-sm"
                  />
                  <button
                    onClick={handleAddMedication}
                    disabled={!newMedication.trim()}
                    className={`px-4 py-2 rounded ${newMedication.trim() ? 'bg-purple-500 text-white hover:bg-purple-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Press Enter or click + to add</p>
              </div>
            </div>
            <div className="p-4 border-t">
              <button
                onClick={() => setShowMedicationsModal(false)}
                className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InpatientVisits
