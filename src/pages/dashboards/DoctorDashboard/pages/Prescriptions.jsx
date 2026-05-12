import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import LoadingSpinner from '../../../../components/common/LoadingSpinner/LoadingSpinner'
import DataTable from '../../../../components/ui/Tables/DataTable'
import Modal from '../../../../components/common/Modal/Modal'
import { 
  getDoctorPrescriptions, 
  createPrescription, 
  searchMedicines,
  downloadPrescriptionPDF,
  getPrescriptionDetails
} from '../../../../services/prescriptionService'

const Prescriptions = () => {
  const [loading, setLoading] = useState(true)
  const [prescriptions, setPrescriptions] = useState([])
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedPrescription, setSelectedPrescription] = useState(null)
  const [medicineSearchResults, setMedicineSearchResults] = useState([])
  const [searchingMedicines, setSearchingMedicines] = useState(false)
  const [medicineSearchQuery, setMedicineSearchQuery] = useState('')
  const [patients, setPatients] = useState([])
  
  const [newPrescription, setNewPrescription] = useState({
    patient_ref: '',
    diagnosis: '',
    symptoms: '',
    medicines: [{
      medicine_name: '',
      medicine_id: '',
      quantity: 1,
      dosage_text: '',
      frequency: '',
      timing: {
        morning: false,
        afternoon: false,
        night: false,
        times: []
      },
      before_food: false,
      after_food: false,
      duration_days: 1,
      route: 'ORAL',
      instructions: ''
    }],
    general_instructions: '',
    diet_instructions: '',
    follow_up_date: ''
  })

  useEffect(() => {
    loadPrescriptions()
    loadPatients()
  }, [])

  const loadPrescriptions = async () => {
    try {
      setLoading(true)
      const response = await getDoctorPrescriptions()
      setPrescriptions(response || [])
    } catch (error) {
      console.error('Error loading prescriptions:', error)
      toast.error('Failed to load prescriptions')
    } finally {
      setLoading(false)
    }
  }

  const loadPatients = async () => {
    // Mock patients data - in real app, this would come from an API call
    setPatients([
      { patient_id: 'P001', name: 'Ravi Kumar' },
      { patient_id: 'P002', name: 'Anita Sharma' },
      { patient_id: 'P003', name: 'Suresh Patel' },
      { patient_id: 'P004', name: 'Priya Singh' },
      { patient_id: 'P005', name: 'Rajesh Kumar' }
    ])
  }

  const handleCreatePrescription = async () => {
    try {
      setLoading(true)
      
      // Validate form
      if (!newPrescription.patient_ref || !newPrescription.diagnosis) {
        toast.error('Please fill in all required fields')
        return
      }
      
      // Validate medicines
      const validMedicines = newPrescription.medicines.filter(med => 
        med.medicine_name && med.dosage_text && med.frequency && med.duration_days > 0
      )
      
      if (validMedicines.length === 0) {
        toast.error('Please add at least one valid medicine')
        return
      }
      
      const prescriptionData = {
        ...newPrescription,
        medicines: validMedicines
      }
      
      const response = await createPrescription(prescriptionData)
      
      toast.success('Prescription created successfully!')
      setIsNewModalOpen(false)
      resetNewPrescriptionForm()
      loadPrescriptions() // Reload prescriptions
      
    } catch (error) {
      console.error('Error creating prescription:', error)
      toast.error(error.response?.data?.detail || 'Failed to create prescription')
    } finally {
      setLoading(false)
    }
  }

  const handleViewPrescription = async (prescription) => {
    try {
      setLoading(true)
      const details = await getPrescriptionDetails(prescription.prescription_id)
      setSelectedPrescription(details)
      setIsViewModalOpen(true)
    } catch (error) {
      console.error('Error fetching prescription details:', error)
      toast.error('Failed to load prescription details')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async (prescription) => {
    try {
      await downloadPrescriptionPDF(prescription.prescription_id)
      toast.success('PDF downloaded successfully!')
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast.error('Failed to download PDF')
    }
  }

  const handleMedicineSearch = async (query) => {
    if (query.length < 2) {
      setMedicineSearchResults([])
      return
    }
    
    try {
      setSearchingMedicines(true)
      const results = await searchMedicines(query)
      setMedicineSearchResults(results || [])
    } catch (error) {
      console.error('Error searching medicines:', error)
      toast.error('Failed to search medicines')
    } finally {
      setSearchingMedicines(false)
    }
  }

  const addMedicine = () => {
    setNewPrescription(prev => ({
      ...prev,
      medicines: [...prev.medicines, {
        medicine_name: '',
        medicine_id: '',
        quantity: 1,
        dosage_text: '',
        frequency: '',
        timing: {
          morning: false,
          afternoon: false,
          night: false,
          times: []
        },
        before_food: false,
        after_food: false,
        duration_days: 1,
        route: 'ORAL',
        instructions: ''
      }]
    }))
  }

  const removeMedicine = (index) => {
    setNewPrescription(prev => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== index)
    }))
  }

  const updateMedicine = (index, field, value) => {
    setNewPrescription(prev => ({
      ...prev,
      medicines: prev.medicines.map((med, i) => 
        i === index ? { ...med, [field]: value } : med
      )
    }))
  }

  const selectMedicine = (index, medicine) => {
    setNewPrescription(prev => ({
      ...prev,
      medicines: prev.medicines.map((med, i) => 
        i === index ? { 
          ...med, 
          medicine_name: medicine.brand_name || medicine.generic_name,
          medicine_id: medicine.medicine_id,
          dosage_text: `${medicine.strength || ''}`.trim(),
          medicine_code: medicine.medicine_code
        } : med
      )
    }))
    setMedicineSearchResults([])
    setMedicineSearchQuery('')
  }

  const resetNewPrescriptionForm = () => {
    setNewPrescription({
      patient_ref: '',
      diagnosis: '',
      symptoms: '',
      medicines: [{
        medicine_name: '',
        medicine_id: '',
        quantity: 1,
        dosage_text: '',
        frequency: '',
        timing: {
          morning: false,
          afternoon: false,
          night: false,
          times: []
        },
        before_food: false,
        after_food: false,
        duration_days: 1,
        route: 'ORAL',
        instructions: ''
      }],
      general_instructions: '',
      diet_instructions: '',
      follow_up_date: ''
    })
    setMedicineSearchResults([])
    setMedicineSearchQuery('')
  }

  const handleInputChange = (field, value) => {
    setNewPrescription(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const dosageOptions = [
    '250mg', '500mg', '750mg', '1000mg',
    '5mg', '10mg', '20mg', '40mg',
    '50mg', '100mg', '150mg', '200mg'
  ]

  const frequencyOptions = [
    'OD', 'BD', 'TID', 'QID', 'SOS',
    'Once daily',
    'Twice daily',
    'Three times daily',
    'Four times daily',
    'As needed',
    'Before meals',
    'After meals',
    'At bedtime'
  ]

  const routeOptions = [
    'ORAL', 'TOPICAL', 'INHALATION', 'IV', 'IM', 'SC', 'NASAL', 'OPHTHALMIC', 'OTIC'
  ]

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h5 className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-700 text-responsive">
          Prescriptions</h5>
        <button
          onClick={() => setIsNewModalOpen(true)}
          className="btn btn-primary  btn-sm btn-mobile-full sm:w-auto flex items-center justify-center my-3"
        >
          <i className="fas fa-plus mr-2 "></i> New Prescription
        </button>
      </div>

      <DataTable
        columns={[
          {
            key: 'prescription_number',
            title: 'Prescription #',
            sortable: true,
            className: 'text-left min-w-[140px]'
          },
          {
            key: 'patient_name',
            title: 'Patient',
            sortable: true,
            className: 'text-left min-w-[160px]'
          },
          {
            key: 'diagnosis',
            title: 'Diagnosis',
            sortable: true,
            className: 'text-left min-w-[180px]'
          },
          {
            key: 'total_medicines',
            title: 'Medicines',
            sortable: true,
            className: 'text-center min-w-[90px]'
          },
          {
            key: 'prescription_date',
            title: 'Date',
            sortable: true,
            className: 'text-center min-w-[120px]'
          },
          {
            key: 'is_dispensed',
            title: 'Status',
            sortable: true,
            className: 'text-center min-w-[100px]',
            render: (_, row) => (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                row.is_dispensed 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {row.is_dispensed ? 'Dispensed' : 'Pending'}
              </span>
            )
          },
          {
            key: 'actions',
            title: 'Actions',
            className: 'text-center min-w-[140px]',
            render: (_, row) => (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleViewPrescription(row)
                  }}
                  className="table-action-btn text-blue-600"
                  title="View Details"
                >
                  <i className="fas fa-eye"></i>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDownloadPDF(row)
                  }}
                  className="table-action-btn text-green-600"
                  title="Download PDF"
                >
                  <i className="fas fa-download"></i>
                </button>
              </div>
            )
          }
        ]}
        data={prescriptions}
        selectable={false}
      />

      {/* Commonly Prescribed Medicines */}
      <div className="card card-responsive card-shadow card-mobile">
        <h3 className="text-lg font-semibold mb-4 text-responsive">Commonly Prescribed Medicines</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[
            { name: 'Paracetamol', use: 'Pain Relief', color: 'blue' },
            { name: 'Ibuprofen', use: 'Anti-inflammatory', color: 'green' },
            { name: 'Amoxicillin', use: 'Antibiotic', color: 'purple' },
            { name: 'Cetirizine', use: 'Antihistamine', color: 'yellow' }
          ].map((med, index) => (
            <div
              key={index}
              className="border rounded p-3 text-center hover:bg-gray-50 cursor-pointer card-hover transition-all duration-200"
              onClick={() => {
                handleMedicineSearch(med.name)
                setIsNewModalOpen(true)
              }}
            >
              <i className={`fas fa-pills text-${med.color}-500 text-xl mb-2`}></i>
              <p className="font-medium text-sm md:text-base">{med.name}</p>
              <p className="text-xs text-gray-500">{med.use}</p>
            </div>
          ))}
        </div>
      </div>

      {/* New Prescription Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => {
          setIsNewModalOpen(false)
          resetNewPrescriptionForm()
        }}
        title="Create New Prescription"
        size="xl"
      >
        <div className="modal-form max-h-[80vh] overflow-y-auto">
          {/* Patient and Diagnosis Section */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Patient Information</h3>
            <div className="modal-grid mobile-form-grid">
              <div className="form-group form-group-mobile">
                <label className="modal-label">Patient *</label>
                <select
                  required
                  value={newPrescription.patient_ref}
                  onChange={(e) => handleInputChange('patient_ref', e.target.value)}
                  className="modal-select form-input-mobile"
                >
                  <option value="">Select Patient</option>
                  {patients.map(patient => (
                    <option key={patient.patient_id} value={patient.patient_id}>
                      {patient.name} ({patient.patient_id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group form-group-mobile">
                <label className="modal-label">Follow-up Date</label>
                <input
                  type="date"
                  value={newPrescription.follow_up_date}
                  onChange={(e) => handleInputChange('follow_up_date', e.target.value)}
                  className="modal-input form-input-mobile"
                />
              </div>
            </div>

            <div className="form-group form-group-mobile">
              <label className="modal-label">Diagnosis *</label>
              <input
                type="text"
                required
                value={newPrescription.diagnosis}
                onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                className="modal-input form-input-mobile"
                placeholder="Enter diagnosis..."
              />
            </div>

            <div className="form-group form-group-mobile">
              <label className="modal-label">Symptoms</label>
              <textarea
                rows="2"
                value={newPrescription.symptoms}
                onChange={(e) => handleInputChange('symptoms', e.target.value)}
                className="modal-textarea form-input-mobile"
                placeholder="Patient symptoms..."
              />
            </div>
          </div>

          {/* Medicines Section */}
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Medicines</h3>
              <button
                type="button"
                onClick={addMedicine}
                className="btn btn-sm btn-primary"
              >
                <i className="fas fa-plus mr-2"></i> Add Medicine
              </button>
            </div>

            {newPrescription.medicines.map((medicine, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4 bg-gray-50">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Medicine {index + 1}</h4>
                  {newPrescription.medicines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMedicine(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  )}
                </div>

                <div className="modal-grid mobile-form-grid">
                  <div className="form-group form-group-mobile col-span-2">
                    <label className="modal-label">Medicine Search *</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={medicineSearchQuery && index === newPrescription.medicines.length - 1 ? medicineSearchQuery : medicine.medicine_name}
                        onChange={(e) => {
                          if (index === newPrescription.medicines.length - 1) {
                            setMedicineSearchQuery(e.target.value)
                            handleMedicineSearch(e.target.value)
                          } else {
                            updateMedicine(index, 'medicine_name', e.target.value)
                          }
                        }}
                        className="modal-input form-input-mobile"
                        placeholder="Search medicine by name..."
                      />
                      {searchingMedicines && index === newPrescription.medicines.length - 1 && (
                        <div className="absolute right-2 top-2">
                          <i className="fas fa-spinner fa-spin text-gray-400"></i>
                        </div>
                      )}
                    </div>
                    
                    {/* Medicine Search Results */}
                    {medicineSearchResults.length > 0 && index === newPrescription.medicines.length - 1 && (
                      <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
                        {medicineSearchResults.map((result, idx) => (
                          <div
                            key={idx}
                            onClick={() => selectMedicine(index, result)}
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium">{result.brand_name || result.generic_name}</div>
                            <div className="text-sm text-gray-600">
                              {result.generic_name} {result.strength} - {result.dosage_form}
                            </div>
                            <div className="text-xs text-gray-500">
                              Stock: {result.available_qty} ({result.stock_status})
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="form-group form-group-mobile">
                    <label className="modal-label">Quantity *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={medicine.quantity}
                      onChange={(e) => updateMedicine(index, 'quantity', parseInt(e.target.value))}
                      className="modal-input form-input-mobile"
                    />
                  </div>

                  <div className="form-group form-group-mobile">
                    <label className="modal-label">Dosage *</label>
                    <input
                      type="text"
                      required
                      value={medicine.dosage_text}
                      onChange={(e) => updateMedicine(index, 'dosage_text', e.target.value)}
                      className="modal-input form-input-mobile"
                      placeholder="e.g., 1 tablet, 5ml"
                    />
                  </div>
                </div>

                <div className="modal-grid mobile-form-grid">
                  <div className="form-group form-group-mobile">
                    <label className="modal-label">Frequency *</label>
                    <select
                      required
                      value={medicine.frequency}
                      onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                      className="modal-select form-input-mobile"
                    >
                      <option value="">Select Frequency</option>
                      {frequencyOptions.map(freq => (
                        <option key={freq} value={freq}>{freq}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group form-group-mobile">
                    <label className="modal-label">Duration (days) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={medicine.duration_days}
                      onChange={(e) => updateMedicine(index, 'duration_days', parseInt(e.target.value))}
                      className="modal-input form-input-mobile"
                    />
                  </div>
                </div>

                <div className="modal-grid mobile-form-grid">
                  <div className="form-group form-group-mobile">
                    <label className="modal-label">Route</label>
                    <select
                      value={medicine.route}
                      onChange={(e) => updateMedicine(index, 'route', e.target.value)}
                      className="modal-select form-input-mobile"
                    >
                      {routeOptions.map(route => (
                        <option key={route} value={route}>{route}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group form-group-mobile">
                    <label className="modal-label">Food Instructions</label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={medicine.before_food}
                          onChange={(e) => updateMedicine(index, 'before_food', e.target.checked)}
                          className="mr-2"
                        />
                        Before Food
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={medicine.after_food}
                          onChange={(e) => updateMedicine(index, 'after_food', e.target.checked)}
                          className="mr-2"
                        />
                        After Food
                      </label>
                    </div>
                  </div>
                </div>

                <div className="form-group form-group-mobile">
                  <label className="modal-label">Instructions</label>
                  <textarea
                    rows="2"
                    value={medicine.instructions}
                    onChange={(e) => updateMedicine(index, 'instructions', e.target.value)}
                    className="modal-textarea form-input-mobile"
                    placeholder="Specific instructions for this medicine..."
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Additional Instructions */}
          <div className="space-y-4">
            <div className="form-group form-group-mobile">
              <label className="modal-label">General Instructions</label>
              <textarea
                rows="2"
                value={newPrescription.general_instructions}
                onChange={(e) => handleInputChange('general_instructions', e.target.value)}
                className="modal-textarea form-input-mobile"
                placeholder="General instructions for the patient..."
              />
            </div>

            <div className="form-group form-group-mobile">
              <label className="modal-label">Diet Instructions</label>
              <textarea
                rows="2"
                value={newPrescription.diet_instructions}
                onChange={(e) => handleInputChange('diet_instructions', e.target.value)}
                className="modal-textarea form-input-mobile"
                placeholder="Dietary instructions..."
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={() => {
                setIsNewModalOpen(false)
                resetNewPrescriptionForm()
              }}
              className="modal-btn modal-btn-secondary btn-mobile"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreatePrescription}
              disabled={loading}
              className="modal-btn modal-btn-primary btn-mobile"
            >
              {loading ? 'Creating...' : 'Create Prescription'}
            </button>
          </div>
        </div>
      </Modal>

      {/* View Prescription Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedPrescription(null)
        }}
        title="Prescription Details"
        size="xl"
      >
        {selectedPrescription && (
          <div className="modal-form max-h-[80vh] overflow-y-auto">
            {/* Prescription Header */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedPrescription.prescription_number}</h3>
                  <p className="text-gray-600">Date: {selectedPrescription.prescription_date}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedPrescription.is_dispensed 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedPrescription.is_dispensed ? 'Dispensed' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            {/* Patient and Doctor Info */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-semibold mb-2">Patient Information</h4>
                <p><strong>Name:</strong> {selectedPrescription.patient_name}</p>
                <p><strong>ID:</strong> {selectedPrescription.patient_ref}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Doctor Information</h4>
                <p><strong>Name:</strong> {selectedPrescription.doctor_name}</p>
              </div>
            </div>

            {/* Medical Information */}
            <div className="space-y-4 mb-6">
              <div>
                <h4 className="font-semibold mb-2">Diagnosis</h4>
                <p className="bg-gray-50 p-3 rounded">{selectedPrescription.diagnosis}</p>
              </div>
              
              {selectedPrescription.symptoms && (
                <div>
                  <h4 className="font-semibold mb-2">Symptoms</h4>
                  <p className="bg-gray-50 p-3 rounded">{selectedPrescription.symptoms}</p>
                </div>
              )}
            </div>

            {/* Medicines */}
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Medicines ({selectedPrescription.medicines?.length || 0})</h4>
              <div className="space-y-3">
                {selectedPrescription.medicines?.map((medicine, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p><strong>Medicine:</strong> {medicine.brand_name || medicine.medicine_name}</p>
                        <p><strong>Generic:</strong> {medicine.generic_name}</p>
                        <p><strong>Dosage:</strong> {medicine.dosage_text}</p>
                        <p><strong>Quantity:</strong> {medicine.quantity}</p>
                      </div>
                      <div>
                        <p><strong>Frequency:</strong> {medicine.frequency}</p>
                        <p><strong>Duration:</strong> {medicine.duration_days} days</p>
                        <p><strong>Route:</strong> {medicine.route}</p>
                        <div>
                          <strong>Food:</strong> 
                          {medicine.before_food && <span className="ml-1">Before</span>}
                          {medicine.after_food && <span className="ml-1">After</span>}
                          {!medicine.before_food && !medicine.after_food && <span className="ml-1">No restriction</span>}
                        </div>
                      </div>
                    </div>
                    {medicine.instructions && (
                      <div className="mt-3">
                        <p><strong>Instructions:</strong> {medicine.instructions}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Instructions */}
            {(selectedPrescription.general_instructions || selectedPrescription.diet_instructions) && (
              <div className="space-y-3 mb-6">
                {selectedPrescription.general_instructions && (
                  <div>
                    <h4 className="font-semibold mb-2">General Instructions</h4>
                    <p className="bg-gray-50 p-3 rounded">{selectedPrescription.general_instructions}</p>
                  </div>
                )}
                
                {selectedPrescription.diet_instructions && (
                  <div>
                    <h4 className="font-semibold mb-2">Diet Instructions</h4>
                    <p className="bg-gray-50 p-3 rounded">{selectedPrescription.diet_instructions}</p>
                  </div>
                )}
              </div>
            )}

            {/* Follow-up Date */}
            {selectedPrescription.follow_up_date && (
              <div className="mb-6">
                <h4 className="font-semibold mb-2">Follow-up Date</h4>
                <p className="bg-gray-50 p-3 rounded">{selectedPrescription.follow_up_date}</p>
              </div>
            )}

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => {
                  setIsViewModalOpen(false)
                  setSelectedPrescription(null)
                }}
                className="modal-btn modal-btn-secondary btn-mobile"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleDownloadPDF(selectedPrescription)}
                className="modal-btn modal-btn-primary btn-mobile"
              >
                <i className="fas fa-download mr-2"></i> Download PDF
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Prescriptions