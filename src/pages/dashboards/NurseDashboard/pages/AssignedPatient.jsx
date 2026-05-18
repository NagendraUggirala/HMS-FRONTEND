import React, { useState, useEffect } from 'react';
import Modal from '../../../../components/common/Modal/Modal';
import { apiFetch } from '../../../../services/apiClient';
import { NURSE_ASSIGNED_PATIENTS } from '../../../../config/api';

const AssignedPatients = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showTests, setShowTests] = useState({});
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showMedsModal, setShowMedsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [notes, setNotes] = useState('');
  const [medications, setMedications] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [newPatient, setNewPatient] = useState({
    name: '',
    gender: 'Male',
    room: '',
    condition: '',
    treatment: '',
    status: '',
    doctor: 'Dr. Meena Rao',
    temperature: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    pulse: '',
    oxygen: ''
  });

  // Make patients a state variable instead of constant
  const [patients, setPatients] = useState([]);

  const conditions = [
    'Fever', 'Diabetes', 'Hypertension', 'Cardiac Care',
    'Fracture', 'Migraine', 'Infection', 'Post-op Recovery',
    'Pneumonia', 'Asthma', 'Arthritis', 'Other'
  ];

  const fetchAssignedPatients = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch(NURSE_ASSIGNED_PATIENTS);
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = payload?.detail?.message || payload?.detail || payload?.message || 'Unable to load assigned patients';
        throw new Error(typeof message === 'string' ? message : 'Unable to load assigned patients');
      }

      const assignedPatients = payload?.data || [];
      const transformedPatients = assignedPatients.map((patient, index) => ({
        id: patient.id || index + 1,
        name: patient.name || patient.patient_name || 'Unknown',
        gender: patient.gender || 'Unknown',
        room: patient.room_number || patient.room || 'N/A',
        condition: patient.condition || patient.primary_diagnosis || 'N/A',
        treatment: patient.treatment || patient.current_treatment || 'To be determined',
        status: patient.status || 'Stable',
        lastVital: patient.last_vital_timestamp ? new Date(patient.last_vital_timestamp).toLocaleTimeString() : new Date().toLocaleTimeString(),
        avatar: patient.avatar || `https://i.pravatar.cc/60?img=${(index % 20) + 11}`,
        temperature: patient.temperature || patient.vital_temperature || 98.6,
        bloodPressure: patient.blood_pressure || `${patient.bp_systolic || patient.systolic || 120}/${patient.bp_diastolic || patient.diastolic || 80}`,
        pulse: patient.pulse || patient.heart_rate || 72,
        oxygen: patient.oxygen_saturation || patient.oxygen || 98,
        notes: patient.notes || patient.nursing_notes || '',
        medications: patient.medications || patient.current_medications || ''
      }));

      setPatients(transformedPatients);
    } catch (err) {
      setError(err?.message || 'Unable to load assigned patients.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedPatients();
  }, []);

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.condition.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.room.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !statusFilter || patient.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'Stable': return 'bg-green-100 text-green-800 border-green-200';
      case 'Improving': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // FIXED: Proper toggle function for individual cards
  const toggleTests = (patientId) => {
    setShowTests(prev => ({
      ...prev,
      [patientId]: !prev[patientId]
    }));
  };

  const handleFileUpload = (e, patientId, testType) => {
    const file = e.target.files[0];
    if (file) {
      alert(`✅ ${file.name} uploaded successfully to Doctor for Patient ${patientId}`);
    }
  };

  const handleAddPatient = (e) => {
    e.preventDefault();
    if (newPatient.name && newPatient.room && newPatient.condition && newPatient.status) {
      // Create new patient object with vital signs
      const newPatientObj = {
        id: patients.length + 1,
        name: newPatient.name,
        gender: newPatient.gender,
        room: newPatient.room,
        condition: newPatient.condition,
        treatment: newPatient.treatment || 'To be determined',
        status: newPatient.status,
        lastVital: new Date().toLocaleTimeString(),
        avatar: `https://i.pravatar.cc/60?img=${patients.length + 15}`,
        // Add vital signs
        temperature: newPatient.temperature ? parseFloat(newPatient.temperature) : 98.6,
        bloodPressure: newPatient.bloodPressureSystolic && newPatient.bloodPressureDiastolic
          ? `${newPatient.bloodPressureSystolic}/${newPatient.bloodPressureDiastolic}`
          : '120/80',
        pulse: newPatient.pulse ? parseInt(newPatient.pulse) : 72,
        oxygen: newPatient.oxygen ? parseInt(newPatient.oxygen) : 98,
        notes: '',
        medications: ''
      };

      // Add new patient to the patients array
      setPatients(prevPatients => [...prevPatients, newPatientObj]);

      alert(`Patient ${newPatient.name} added successfully!`);
      setShowAddPatientModal(false);

      // Reset form
      setNewPatient({
        name: '',
        gender: 'Male',
        room: '',
        condition: '',
        treatment: '',
        status: '',
        doctor: 'Dr. Meena Rao',
        temperature: '',
        bloodPressureSystolic: '',
        bloodPressureDiastolic: '',
        pulse: '',
        oxygen: ''
      });
    } else {
      alert('Please fill all required fields');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPatient(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle Notes
  const handleNotesClick = (patient) => {
    setSelectedPatient(patient);
    setNotes(patient.notes || '');
    setShowNotesModal(true);
  };

  const handleSaveNotes = () => {
    if (selectedPatient) {
      setPatients(prevPatients =>
        prevPatients.map(patient =>
          patient.id === selectedPatient.id
            ? { ...patient, notes }
            : patient
        )
      );
      setShowNotesModal(false);
      alert('Notes saved successfully!');
    }
  };

  // Handle Medications
  const handleMedsClick = (patient) => {
    setSelectedPatient(patient);
    setMedications(patient.medications || '');
    setShowMedsModal(true);
  };

  const handleSaveMedications = () => {
    if (selectedPatient) {
      setPatients(prevPatients =>
        prevPatients.map(patient =>
          patient.id === selectedPatient.id
            ? { ...patient, medications }
            : patient
        )
      );
      setShowMedsModal(false);
      alert('Medications saved successfully!');
    }
  };

  // Handle Edit Patient
  const handleEditClick = (patient) => {
    setSelectedPatient(patient);
    setNewPatient({
      name: patient.name,
      gender: patient.gender,
      room: patient.room,
      condition: patient.condition,
      treatment: patient.treatment,
      status: patient.status,
      doctor: 'Dr. Meena Rao',
      temperature: patient.temperature || '',
      bloodPressureSystolic: patient.bloodPressure ? patient.bloodPressure.split('/')[0] : '',
      bloodPressureDiastolic: patient.bloodPressure ? patient.bloodPressure.split('/')[1] : '',
      pulse: patient.pulse || '',
      oxygen: patient.oxygen || ''
    });
    setShowEditModal(true);
  };

  const handleUpdatePatient = (e) => {
    e.preventDefault();
    if (selectedPatient && newPatient.name && newPatient.room && newPatient.condition && newPatient.status) {
      setPatients(prevPatients =>
        prevPatients.map(patient =>
          patient.id === selectedPatient.id
            ? {
              ...patient,
              name: newPatient.name,
              gender: newPatient.gender,
              room: newPatient.room,
              condition: newPatient.condition,
              treatment: newPatient.treatment,
              status: newPatient.status,
              temperature: newPatient.temperature ? parseFloat(newPatient.temperature) : patient.temperature,
              bloodPressure: newPatient.bloodPressureSystolic && newPatient.bloodPressureDiastolic
                ? `${newPatient.bloodPressureSystolic}/${newPatient.bloodPressureDiastolic}`
                : patient.bloodPressure,
              pulse: newPatient.pulse ? parseInt(newPatient.pulse) : patient.pulse,
              oxygen: newPatient.oxygen ? parseInt(newPatient.oxygen) : patient.oxygen
            }
            : patient
        )
      );
      setShowEditModal(false);
      alert('Patient details updated successfully!');
    } else {
      alert('Please fill all required fields');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-2xl font-semibold text-gray-700">Assigned Patients</h2>

      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-lg card-shadow border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search patients by name, condition, or room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="Stable">Stable</option>
            <option value="Critical">Critical</option>
            <option value="Improving">Improving</option>
          </select>
        </div>
      </div>

      {/* Add Patient Modal */}
      <Modal
        isOpen={showAddPatientModal}
        onClose={() => setShowAddPatientModal(false)}
        title="Add New Patient"
        size="md"
      >
        <form onSubmit={handleAddPatient} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              name="name"
              value={newPatient.name}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              placeholder="Enter patient's full name"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                name="gender"
                value={newPatient.gender}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room/Bed *</label>
              <input
                type="text"
                name="room"
                value={newPatient.room}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                placeholder="e.g., 101"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Condition *</label>
            <select
              name="condition"
              value={newPatient.condition}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Condition</option>
              {conditions.map(condition => (
                <option key={condition} value={condition}>{condition}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Treatment</label>
            <input
              type="text"
              name="treatment"
              value={newPatient.treatment}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Antibiotics, IV Fluids"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
            <select
              name="status"
              value={newPatient.status}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Status</option>
              <option value="Stable">Stable</option>
              <option value="Critical">Critical</option>
              <option value="Improving">Improving</option>
            </select>
          </div>

          {/* Vital Signs Section */}
          <div className="p-3 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-3">Initial Vital Signs</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (°F)</label>
                <input
                  type="number"
                  step="0.1"
                  name="temperature"
                  value={newPatient.temperature}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 98.6"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pulse (bpm)</label>
                <input
                  type="number"
                  name="pulse"
                  value={newPatient.pulse}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 72"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">BP Systolic</label>
                <input
                  type="number"
                  name="bloodPressureSystolic"
                  value={newPatient.bloodPressureSystolic}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 120"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">BP Diastolic</label>
                <input
                  type="number"
                  name="bloodPressureDiastolic"
                  value={newPatient.bloodPressureDiastolic}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 80"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Oxygen Saturation (%)</label>
                <input
                  type="number"
                  name="oxygen"
                  value={newPatient.oxygen}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 98"
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Doctor</label>
            <select
              name="doctor"
              value={newPatient.doctor}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Dr. Meena Rao">Dr. Meena Rao</option>
              <option value="Dr. Rajesh Kumar">Dr. Rajesh Kumar</option>
              <option value="Dr. Priya Sharma">Dr. Priya Sharma</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setShowAddPatientModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Add Patient
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Patient Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Patient Details"
        size="md"
      >
        <form onSubmit={handleUpdatePatient} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              name="name"
              value={newPatient.name}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                name="gender"
                value={newPatient.gender}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room/Bed *</label>
              <input
                type="text"
                name="room"
                value={newPatient.room}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Condition *</label>
            <select
              name="condition"
              value={newPatient.condition}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Condition</option>
              {conditions.map(condition => (
                <option key={condition} value={condition}>{condition}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Treatment</label>
            <input
              type="text"
              name="treatment"
              value={newPatient.treatment}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
            <select
              name="status"
              value={newPatient.status}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Status</option>
              <option value="Stable">Stable</option>
              <option value="Critical">Critical</option>
              <option value="Improving">Improving</option>
            </select>
          </div>

          <div className="p-3 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-3">Vital Signs</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (°F)</label>
                <input
                  type="number"
                  step="0.1"
                  name="temperature"
                  value={newPatient.temperature}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pulse (bpm)</label>
                <input
                  type="number"
                  name="pulse"
                  value={newPatient.pulse}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">BP Systolic</label>
                <input
                  type="number"
                  name="bloodPressureSystolic"
                  value={newPatient.bloodPressureSystolic}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">BP Diastolic</label>
                <input
                  type="number"
                  name="bloodPressureDiastolic"
                  value={newPatient.bloodPressureDiastolic}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Oxygen Saturation (%)</label>
                <input
                  type="number"
                  name="oxygen"
                  value={newPatient.oxygen}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setShowEditModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Update Patient
            </button>
          </div>
        </form>
      </Modal>

      {/* Notes Modal */}
      <Modal
        isOpen={showNotesModal}
        onClose={() => setShowNotesModal(false)}
        title={`Nursing Notes - ${selectedPatient?.name || ''}`}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nursing Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="8"
              className="w-full border border-gray-300 rounded p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter nursing notes, observations, and patient progress..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setShowNotesModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              onClick={handleSaveNotes}
            >
              Save Notes
            </button>
          </div>
        </div>
      </Modal>

      {/* Medications Modal */}
      <Modal
        isOpen={showMedsModal}
        onClose={() => setShowMedsModal(false)}
        title={`Medications - ${selectedPatient?.name || ''}`}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Medications</label>
            <textarea
              value={medications}
              onChange={(e) => setMedications(e.target.value)}
              rows="8"
              className="w-full border border-gray-300 rounded p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter current medications, dosage, and schedule..."
            />
            <p className="text-xs text-gray-500 mt-1">Enter one medication per line with dosage and frequency</p>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setShowMedsModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              onClick={handleSaveMedications}
            >
              Save Medications
            </button>
          </div>
        </div>
      </Modal>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPatients.map((patient) => (
          <div key={patient.id} className="bg-white border border-gray-200 rounded-lg p-4 card-shadow hover:shadow-md transition-shadow fade-in relative">
            <div className="flex items-center gap-3 mb-3">
              <img src={patient.avatar} className="w-12 h-12 rounded-full" alt={patient.name} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-blue-700 truncate">{patient.name}</h3>
                  <div className="flex items-center gap-1">
                    <button
                      className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                      onClick={() => handleEditClick(patient)}
                      title="Edit Patient"
                    >
                      <i className="fas fa-edit text-sm"></i>
                    </button>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(patient.status)} whitespace-nowrap ml-2`}>
                      {patient.status}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 truncate">{patient.gender} | Bed {patient.room}</p>
              </div>
            </div>

            <div className="text-sm text-gray-600 space-y-2 mb-3">
              <div>
                <span className="font-medium">Doctor:</span> Dr. Meena Rao
              </div>
              <div>
                <span className="font-medium">Condition:</span> {patient.condition}
              </div>
              <div>
                <span className="font-medium">Treatment:</span> {patient.treatment}
              </div>
              <div>
                <span className="font-medium">Temp:</span> {patient.temperature}°F
              </div>
              <div>
                <span className="font-medium">BP:</span> {patient.bloodPressure}
              </div>
              <div>
                <span className="font-medium">Pulse:</span> {patient.pulse} bpm
              </div>
              <div>
                <span className="font-medium">O₂:</span> {patient.oxygen}%
              </div>
              <div>
                <span className="font-medium">Last Vitals:</span> {patient.lastVital}
              </div>
            </div>

            <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200">
              <button
                className="flex-1 bg-blue-50 text-blue-700 py-2 px-2 rounded text-sm hover:bg-blue-100 transition-colors flex items-center justify-center"
                onClick={() => toggleTests(patient.id)}
              >
                <i className="fas fa-flask mr-1 text-xs"></i>Tests
              </button>
              <button
                className="flex-1 bg-green-50 text-green-700 py-2 px-2 rounded text-sm hover:bg-green-100 transition-colors flex items-center justify-center"
                onClick={() => handleNotesClick(patient)}
              >
                <i className="fas fa-notes-medical mr-1 text-xs"></i>Notes
              </button>
              <button
                className="flex-1 bg-purple-50 text-purple-700 py-2 px-2 rounded text-sm hover:bg-purple-100 transition-colors flex items-center justify-center"
                onClick={() => handleMedsClick(patient)}
              >
                <i className="fas fa-pills mr-1 text-xs"></i>Meds
              </button>
            </div>

            {/* Tests Section - FIXED: Absolutely positioned dropdown */}
            <div className={`absolute left-0 right-0 mt-2 bg-white rounded-lg p-3 text-sm border border-gray-200 shadow-lg z-10 ${showTests[patient.id] ? 'block' : 'hidden'
              }`} style={{ top: '100%' }}>
              <div className="border-b border-gray-200 pb-2 mb-2">
                <p><strong>Test:</strong> Blood Test</p>
                <p><strong>Status:</strong> Completed</p>
                <label className="block text-blue-600 mt-2 text-sm cursor-pointer hover:text-blue-800 transition-colors">
                  <i className="fas fa-upload mr-1"></i>Upload Report (PDF)
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf"
                    onChange={(e) => handleFileUpload(e, patient.id, 'Blood')}
                  />
                </label>
              </div>
              <div className="border-b border-gray-200 pb-2 mb-2">
                <p><strong>Test:</strong> Urine Test</p>
                <p><strong>Status:</strong> Pending</p>
                <label className="block text-blue-600 mt-2 text-sm cursor-pointer hover:text-blue-800 transition-colors">
                  <i className="fas fa-upload mr-1"></i>Upload Report (PDF)
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf"
                    onChange={(e) => handleFileUpload(e, patient.id, 'Urine')}
                  />
                </label>
              </div>
              <div className="pb-1">
                <p><strong>Test:</strong> X-Ray</p>
                <p><strong>Status:</strong> Pending</p>
                <label className="block text-blue-600 mt-2 text-sm cursor-pointer hover:text-blue-800 transition-colors">
                  <i className="fas fa-upload mr-1"></i>Upload Report (PDF)
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf"
                    onChange={(e) => handleFileUpload(e, patient.id, 'X-Ray')}
                  />
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPatients.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No patients found</h3>
          <p className="text-gray-600">Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  );
};

export default AssignedPatients;