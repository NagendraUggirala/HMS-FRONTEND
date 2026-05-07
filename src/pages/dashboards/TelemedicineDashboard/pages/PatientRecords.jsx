import React, { useState, useEffect } from 'react'
import LoadingSpinner from '../../../../components/common/LoadingSpinner/LoadingSpinner'
import Modal from '../../../../components/common/Modal/Modal'
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PatientRecords = ({ onPageChange }) => {
  const [loading, setLoading] = useState(true)
  const [patients, setPatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [isTestsModalOpen, setIsTestsModalOpen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false)
  const [selectedTest, setSelectedTest] = useState('')
  const [prescription, setPrescription] = useState({
    medication: '',
    dosage: '',
    frequency: '',
    duration: '',
    notes: ''
  })

  useEffect(() => {
    loadPatients()
  }, [])

  const loadPatients = async () => {
    setLoading(true)
    setTimeout(() => {
      setPatients([
        { 
          id: 1, 
          name: "Ravi Kumar", 
          age: 32, 
          gender: "Male", 
          city: "Mumbai", 
          allergies: "None", 
          lastVisit: "2023-10-15", 
          conditions: ["Hypertension"],
          medicalHistory: [
            { date: "2023-10-15", diagnosis: "Hypertension Checkup", treatment: "Medication adjustment" },
            { date: "2023-08-20", diagnosis: "Routine Checkup", treatment: "Blood pressure monitoring" }
          ],
          labTests: ["Blood Pressure", "Cholesterol", "Blood Sugar"]
        },
        { 
          id: 2, 
          name: "Anita Sharma", 
          age: 28, 
          gender: "Female", 
          city: "Delhi", 
          allergies: "Penicillin", 
          lastVisit: "2023-10-10", 
          conditions: ["Asthma"],
          medicalHistory: [
            { date: "2023-10-10", diagnosis: "Asthma Review", treatment: "Inhaler prescription" },
            { date: "2023-07-15", diagnosis: "Allergy Testing", treatment: "Antihistamines" }
          ],
          labTests: ["Spirometry", "Chest X-Ray", "Allergy Test"]
        },
        { 
          id: 3, 
          name: "Suresh Patel", 
          age: 45, 
          gender: "Male", 
          city: "Bangalore", 
          allergies: "None", 
          lastVisit: "2023-10-05", 
          conditions: ["Diabetes", "Hypertension"],
          medicalHistory: [
            { date: "2023-10-05", diagnosis: "Diabetes Management", treatment: "Insulin adjustment" },
            { date: "2023-09-12", diagnosis: "Hypertension Follow-up", treatment: "Medication review" }
          ],
          labTests: ["HbA1c", "Blood Pressure", "Kidney Function", "Lipid Profile"]
        },
        { 
          id: 4, 
          name: "Priya Singh", 
          age: 35, 
          gender: "Female", 
          city: "Chennai", 
          allergies: "Sulfa", 
          lastVisit: "2023-09-28", 
          conditions: ["Migraine"],
          medicalHistory: [
            { date: "2023-09-28", diagnosis: "Migraine Episode", treatment: "Pain management" },
            { date: "2023-08-10", diagnosis: "Neurological Consultation", treatment: "Preventive medication" }
          ],
          labTests: ["MRI Scan", "Blood Tests", "Neurological Exam"]
        }
      ])
      setLoading(false)
    }, 1000)
  }

  const handleTestsClick = (patient) => {
    setSelectedPatient(patient)
    setIsTestsModalOpen(true)
  }

  const handleHistoryClick = (patient) => {
    setSelectedPatient(patient)
    setIsHistoryModalOpen(true)
  }

  const handlePrescribeClick = (patient) => {
    setSelectedPatient(patient)
    setPrescription({
      medication: '',
      dosage: '',
      frequency: '',
      duration: '',
      notes: ''
    })
    setIsPrescriptionModalOpen(true)
  }

  const handleOrderTest = () => {
    if (selectedTest) {
      toast.success(`Test ordered for ${selectedPatient.name}: ${selectedTest}`)
      setIsTestsModalOpen(false)
      setSelectedTest('')
      // Navigate to lab results page
      if (onPageChange) {
        onPageChange('labs')
      }
    } else {
      toast.info('Please select a test to order')
    }
  }

  const handlePrescriptionSubmit = () => {
    if (prescription.medication && prescription.dosage && prescription.frequency && prescription.duration) {
      toast.success(`Prescription created for ${selectedPatient.name}:\nMedication: ${prescription.medication}\nDosage: ${prescription.dosage}\nFrequency: ${prescription.frequency}\nDuration: ${prescription.duration}`)
      setIsPrescriptionModalOpen(false)
      setPrescription({
        medication: '',
        dosage: '',
        frequency: '',
        duration: '',
        notes: ''
      })
      // Navigate to prescriptions page
      if (onPageChange) {
        onPageChange('prescriptions')
      }
    } else {
      toast.info('Please fill in all required prescription fields')
    }
  }

  const commonTests = [
    "Blood Test",
    "Urine Test",
    "X-Ray",
    "CT Scan",
    "MRI",
    "Ultrasound",
    "ECG",
    "Blood Pressure",
    "Blood Sugar",
    "Cholesterol",
    "Thyroid Test",
    "Liver Function Test"
  ]

  const medications = [
    "Paracetamol",
    "Ibuprofen",
    "Amoxicillin",
    "Metformin",
    "Lisinopril",
    "Atorvastatin",
    "Salbutamol",
    "Omeprazole",
    "Aspirin",
    "Insulin"
  ]

  if (loading) return <LoadingSpinner />

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-semibold text-gray-700">
          <i className='fas fa-user-injured text-blue-500 mr-3'></i> Patient Records
        </h2>

        {/* Total Patients Stat */}
        <div className="bg-white px-6 py-3 rounded-xl border shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center shadow-inner">
            <i className="fas fa-users text-xl"></i>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium tracking-wide">Total Patients</p>
            <p className="text-2xl font-bold text-gray-800">{loading ? '...' : patients.length}</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {patients.map(patient => (
          <div key={patient.id} className="bg-white p-4 border rounded card-shadow fade-in">
            <div className="flex items-center gap-3 mb-2">
              <img 
                src={`https://i.pravatar.cc/60?img=${patient.id + 10}`} 
                className="w-12 h-12 rounded-full" 
                alt={patient.name} 
              />
              <div>
                <h3 className="font-semibold text-blue-700">{patient.name}</h3>
                <p className="text-xs text-gray-500">{patient.gender} | Age {patient.age}</p>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-1"><strong>City:</strong> {patient.city}</p>
            <p className="text-sm text-gray-600 mb-1"><strong>Allergies:</strong> {patient.allergies}</p>
            <p className="text-sm text-gray-600 mb-2"><strong>Last Visit:</strong> {patient.lastVisit}</p>
            
            <div className="flex flex-wrap gap-1 mb-3">
              {patient.conditions.map(condition => (
                <span key={condition} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  {condition}
                </span>
              ))}
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => handleTestsClick(patient)}
                className="bg-blue-500 text-white px-3 py-1 text-xs rounded hover:bg-blue-600 transition-colors"
              >
                <i className="fas fa-flask mr-1"></i> Tests
              </button>
              <button 
                onClick={() => handleHistoryClick(patient)}
                className="bg-green-500 text-white px-3 py-1 text-xs rounded hover:bg-green-600 transition-colors"
              >
                <i className="fas fa-history mr-1"></i> History
              </button>
              <button 
                onClick={() => handlePrescribeClick(patient)}
                className="bg-purple-500 text-white px-3 py-1 text-xs rounded hover:bg-purple-600 transition-colors"
              >
                <i className="fas fa-prescription mr-1"></i> Prescribe
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Tests Modal */}
      <Modal
        isOpen={isTestsModalOpen}
        onClose={() => {
          setIsTestsModalOpen(false)
          setSelectedTest('')
        }}
        title={`Order Tests for ${selectedPatient?.name}`}
        size="md"
      >
        {selectedPatient && (
          <div className="space-y-4">
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Test to Order
              </label>
              <select
                value={selectedTest}
                onChange={(e) => setSelectedTest(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a test</option>
                {commonTests.map(test => (
                  <option key={test} value={test}>{test}</option>
                ))}
              </select>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-2">Previous Tests:</h4>
              <div className="space-y-1">
                {selectedPatient.labTests.map((test, index) => (
                  <div key={index} className="text-sm text-gray-600 flex items-center">
                    <i className="fas fa-check text-green-500 mr-2 text-xs"></i>
                    {test}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setIsTestsModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleOrderTest}
                disabled={!selectedTest}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Order Test
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Medical History Modal */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title={`Medical History - ${selectedPatient?.name}`}
        size="lg"
      >
        {selectedPatient && (
          <div className="space-y-4">
            <div className="bg-white border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Date</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Diagnosis</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Treatment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {selectedPatient.medicalHistory.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">{record.date}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{record.diagnosis}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{record.treatment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Prescription Modal */}
      <Modal
        isOpen={isPrescriptionModalOpen}
        onClose={() => setIsPrescriptionModalOpen(false)}
        title={`Create Prescription for ${selectedPatient?.name}`}
        size="lg"
      >
        {selectedPatient && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medication *
                </label>
                <select
                  value={prescription.medication}
                  onChange={(e) => setPrescription(prev => ({ ...prev, medication: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Medication</option>
                  {medications.map(med => (
                    <option key={med} value={med}>{med}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dosage *
                </label>
                <input
                  type="text"
                  value={prescription.dosage}
                  onChange={(e) => setPrescription(prev => ({ ...prev, dosage: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 500mg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frequency *
                </label>
                <select
                  value={prescription.frequency}
                  onChange={(e) => setPrescription(prev => ({ ...prev, frequency: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Frequency</option>
                  <option value="Once daily">Once daily</option>
                  <option value="Twice daily">Twice daily</option>
                  <option value="Three times daily">Three times daily</option>
                  <option value="Four times daily">Four times daily</option>
                  <option value="As needed">As needed</option>
                </select>
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration *
                </label>
                <input
                  type="text"
                  value={prescription.duration}
                  onChange={(e) => setPrescription(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 7 days"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                rows="3"
                value={prescription.notes}
                onChange={(e) => setPrescription(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any special instructions or notes..."
              />
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-700">
                <strong>Allergy Alert:</strong> Patient is allergic to {selectedPatient.allergies}
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setIsPrescriptionModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePrescriptionSubmit}
                disabled={!prescription.medication || !prescription.dosage || !prescription.frequency || !prescription.duration}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create Prescription
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default PatientRecords