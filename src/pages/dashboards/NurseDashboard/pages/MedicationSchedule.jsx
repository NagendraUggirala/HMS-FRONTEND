// MedicationSchedule.jsx
import React, { useState, useEffect } from 'react';
import Modal from '../../../../components/common/Modal/Modal';
import { apiFetch } from '../../../../services/apiClient';
import { NURSE_MEDICATIONS, NURSE_UPDATE_MEDICATION, NURSE_ASSIGNED_PATIENTS } from '../../../../config/api';

const MedicationSchedule = () => {
  const [selectedAdmission, setSelectedAdmission] = useState('');
  const [medications, setMedications] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patientsList, setPatientsList] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    admission_number: '',
    medication_name: '',
    dose: '',
    scheduled_time: '',
    instructions: '',
    frequency: 'Once daily',
    start_date: '',
    end_date: '',
    route: 'Oral',
    duration_days: ''
  });

  const fetchPatients = async () => {
    try {
      const response = await apiFetch(NURSE_ASSIGNED_PATIENTS);
      if (response && response.ok) {
        const data = await response.json();
        const pList = Array.isArray(data?.data) ? data.data : [];
        setPatientsList(pList);
        
        if (pList.length > 0 && !selectedAdmission) {
          const firstAdmission = pList[0].admission_number || pList[0].admissionNumber || pList[0].id?.toString();
          setSelectedAdmission(firstAdmission);
          setFormData(prev => ({ ...prev, admission_number: firstAdmission }));
        }
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const normalizeMedicationRecord = (item, idx, recordAdmission = '', recordPatient = {}) => {
    const admission = item.admission_number || item.admissionNumber || item.admissionId || item.admission || recordAdmission || '';
    const patientName = item.patient_name || item.patientName || item.name || item.full_name || recordPatient.name || recordPatient.patient_name || recordPatient.full_name || '';
    
    // Try to extract the real record ID from the backend response
    let recordId = null;
    const isSynthetic = (idStr) => typeof idStr === 'string' && (idStr.startsWith('ADM-') || idStr.startsWith('med-'));
    
    if (item.id && !isSynthetic(item.id)) recordId = item.id;
    else if (item.record_id && !isSynthetic(item.record_id)) recordId = item.record_id;
    else if (item._id && !isSynthetic(item._id)) recordId = item._id;
    else if (item.medication_id && !isSynthetic(item.medication_id)) recordId = item.medication_id;
    else if (item.prescription_id && !isSynthetic(item.prescription_id)) recordId = item.prescription_id;
    else if (item.uuid && !isSynthetic(item.uuid)) recordId = item.uuid;

    return {
      ...item,
      id: recordId || `${admission || 'med'}-${idx}`,
      record_id: recordId,
      _original: item, // Preserve original for debugging
      patient_name: patientName || 'Patient',
      admission_number: admission || 'Not available',
      medication_name: item.medication_name || item.medicine_name || item.medicine || item.medication || item.name || 'N/A',
      scheduled_time: item.scheduled_time || item.time || item.schedule || 'N/A',
      dose: item.dose || item.dosage || item.quantity || 'N/A',
      instructions: item.instructions || item.notes || item.description || '',
      frequency: item.frequency || item.dosage_frequency || item.schedule_frequency || 'Once daily',
      route: item.route || item.administration_route || item.method || 'Oral',
      duration_days: item.duration_days || item.duration || item.days || '',
      end_date: item.end_date || item.expiry_date || item.endDate || '',
      status: item.status || item.medication_status || 'Pending'
    };
  };

  const fetchMedications = async (admissionNumber) => {
    if (!admissionNumber) return;
    try {
      const response = await apiFetch(`${NURSE_MEDICATIONS}?admission_number=${admissionNumber}`);
      if (response && response.ok) {
        const data = await response.json();
        const rawData = Array.isArray(data?.data) ? data.data : [];
        
        // Log first record to inspect actual structure
        if (rawData.length > 0) {
          console.log('[MedicationSchedule] First API response record:', JSON.stringify(rawData[0], null, 2));
        }

        const medicationsList = rawData.flatMap((record, recordIndex) => {
          if (Array.isArray(record.prescriptions) && record.prescriptions.length > 0) {
            const recordAdmission = record.admission_number || record.admissionNumber || record.admissionId || record.admission || admissionNumber;
            const recordPatient = record.patient || {};
            return record.prescriptions.map((presc, idx) => {
              // Inject parent record ID so PATCH works
              const enrichedPresc = { ...presc, record_id: presc.record_id || presc.id || record.id };
              return normalizeMedicationRecord(enrichedPresc, idx, recordAdmission, recordPatient);
            });
          }

          const recordAdmission = record.admission_number || record.admissionNumber || record.admissionId || record.admission || admissionNumber;
          return [normalizeMedicationRecord(record, recordIndex, recordAdmission, record.patient || {})];
        });

        setMedications(medicationsList);
      } else {
        setMedications([]);
      }
    } catch (error) {
      console.error('Error fetching medications:', error);
      setMedications([]);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedAdmission) {
      fetchMedications(selectedAdmission);
    }
  }, [selectedAdmission]);

  const fetchData = () => {
    fetchPatients();
    if (selectedAdmission) {
      fetchMedications(selectedAdmission);
    }
  };

  const handleMedAction = (action, id) => {
    let message = '';
    let newStatus = '';
    
    if (action === 'give') {
      message = 'Medication marked as given';
      newStatus = 'Given';
    } else if (action === 'delay') {
      message = 'Medication delayed for 1 hour';
      newStatus = 'Pending';
    } else if (action === 'skip') {
      message = 'Medication skipped - reason recorded';
      newStatus = 'Missed';
    }
    
    // Show notification (you can implement your notification system here)
    console.log(message);
    
    // Update medication status in local state
    const updatedMeds = medications.map(med => 
      med.id === id ? { ...med, status: newStatus } : med
    );
    setMedications(updatedMeds);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      if (isEditing && editingRecordId) {
        console.log('[MedicationSchedule] Attempting PATCH with recordId:', editingRecordId);
        console.log('[MedicationSchedule] PATCH endpoint:', NURSE_UPDATE_MEDICATION(editingRecordId));
      }

      // Build payload with only non-empty fields for PATCH (exclude_unset behavior)
      const payloadData = {};
      
      if (formData.admission_number) payloadData.admission_number = formData.admission_number;
      if (formData.medication_name) payloadData.medication_name = formData.medication_name;
      if (formData.dose) payloadData.dose = formData.dose;
      if (formData.scheduled_time) payloadData.scheduled_time = formData.scheduled_time;
      if (formData.frequency) payloadData.frequency = formData.frequency;
      if (formData.instructions) payloadData.instructions = formData.instructions;
      if (formData.start_date) payloadData.start_date = formData.start_date;
      if (formData.end_date) payloadData.end_date = formData.end_date;
      if (formData.route) payloadData.route = formData.route;
      if (formData.duration_days) payloadData.duration_days = formData.duration_days;

      console.log('[MedicationSchedule] Payload:', JSON.stringify(payloadData, null, 2));

      const endpoint = isEditing && editingRecordId ? NURSE_UPDATE_MEDICATION(editingRecordId) : NURSE_MEDICATIONS;
      const method = isEditing && editingRecordId ? 'PATCH' : 'POST';

      if (isEditing && editingRecordId) {
        console.log('[MedicationSchedule] PATCH Request Details:', {
          method: 'PATCH',
          endpoint,
          recordId: editingRecordId,
          payload: payloadData
        });
      }

      const response = await apiFetch(endpoint, {
        method,
        body: payloadData
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        // Enhanced error logging for PATCH failures
        if (isEditing) {
          console.error('[MedicationSchedule] PATCH Failed:', {
            status: response.status,
            statusText: response.statusText,
            recordId: editingRecordId,
            error: payload
          });
        }
        throw new Error(payload?.detail || payload?.message || `Failed to ${isEditing ? 'update' : 'add'} medication`);
      }

      setMessage({ type: 'success', text: payload?.message || (isEditing ? 'Medication updated successfully' : 'Medication added successfully') });
      
      setFormData({
        admission_number: formData.admission_number,
        medication_name: '',
        dose: '',
        scheduled_time: '',
        instructions: '',
        frequency: 'Once daily',
        start_date: '',
        end_date: '',
        route: 'Oral',
        duration_days: ''
      });
      setIsModalOpen(false);
      setIsEditing(false);
      setEditingRecordId('');
      
      fetchData();
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: error.message || `Failed to ${isEditing ? 'update' : 'add'} medication` });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      admission_number: selectedAdmission,
      medication_name: '',
      dose: '',
      scheduled_time: '',
      instructions: '',
      frequency: 'Once daily',
      start_date: '',
      end_date: '',
      route: 'Oral',
      duration_days: ''
    });
    setIsModalOpen(false);
    setIsEditing(false);
    setEditingRecordId('');
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Given': return 'bg-green-100 text-green-800 border border-green-200';
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'Missed': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    }
  };

  return (
   <div className="min-h-screen bg-gray-50 p-1 md:p-1 overflow-x-hidden">

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-3">
          <h2 className="text-2xl font-semibold text-gray-700">Medication Schedule</h2>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <input
                type="text"
                value={selectedAdmission}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedAdmission(val);
                  setFormData(prev => ({ ...prev, admission_number: val }));
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                placeholder="Enter Admission Number"
              />
            </div>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditingRecordId('');
                setFormData(prev => ({ ...prev, admission_number: selectedAdmission }));
                setIsModalOpen(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm whitespace-nowrap"
            >
              <i className="fas fa-plus"></i>
              <span>{isEditing ? 'Edit Medication' : 'Add Medication'}</span>
            </button>
          </div>
        </div>

        {/* Add Medication Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCancel}
          title={isEditing ? 'Edit Medication' : 'Add New Medication'}
          size="lg"
        >
          {message.text && (
            <div className={`p-3 rounded mb-4 text-sm ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200'}`}>
              {message.text}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admission Number</label>
                <input 
                  type="text" 
                  name="admission_number"
                  value={formData.admission_number}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter Admission Number"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medication Name</label>
                <input 
                  type="text" 
                  name="medication_name"
                  value={formData.medication_name}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="Medication name" 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dose</label>
                <input 
                  type="text" 
                  name="dose"
                  value={formData.dose}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="e.g., 500mg" 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input 
                  type="time" 
                  name="scheduled_time"
                  value={formData.scheduled_time}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                <select 
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option>Once daily</option>
                  <option>Twice daily</option>
                  <option>Three times</option>
                  <option>With meals</option>
                  <option>At bedtime</option>
                  <option>As needed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input 
                  type="date" 
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
                <select
                  name="route"
                  value={formData.route}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option>Oral</option>
                  <option>Injection</option>
                  <option>Topical</option>
                  <option>IV</option>
                  <option>Inhalation</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
                <input 
                  type="number" 
                  min="1"
                  name="duration_days"
                  value={formData.duration_days}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="e.g., 5" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input 
                  type="date" 
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
              <textarea 
                name="instructions"
                value={formData.instructions}
                onChange={handleInputChange}
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                placeholder="Special instructions" 
                rows="3"
                required 
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4 border-t">
              <button 
                type="button"
                onClick={handleCancel}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors duration-200"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={loading}
                className={`text-white px-6 py-2 rounded-lg transition-colors duration-200 flex items-center ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <i className={`fas ${isEditing ? 'fa-save' : 'fa-plus'} mr-2`}></i>
                )}
                {loading ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update Medication' : 'Add Medication')}
              </button>
            </div>
          </form>
        </Modal>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-blue-50 p-4 rounded-lg card-shadow border border-blue-100">
            <h4 className="font-semibold text-blue-700 text-sm">Pending</h4>
            <p className="text-2xl font-bold text-blue-600">
              {medications.filter(m => (m.status || '').toLowerCase() === 'pending').length}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg card-shadow border border-green-100">
            <h4 className="font-semibold text-green-700 text-sm">Given</h4>
            <p className="text-2xl font-bold text-green-600">
              {medications.filter(m => (m.status || '').toLowerCase() === 'given').length}
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg card-shadow border border-yellow-100">
            <h4 className="font-semibold text-yellow-700 text-sm">Missed</h4>
            <p className="text-2xl font-bold text-yellow-600">
              {medications.filter(m => (m.status || '').toLowerCase() === 'missed').length}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg card-shadow border border-purple-100">
            <h4 className="font-semibold text-purple-700 text-sm">Delayed</h4>
            <p className="text-2xl font-bold text-purple-600">
              {medications.filter(m => (m.status || '').toLowerCase() === 'delayed').length}
            </p>
          </div>
        </div>

        {/* Medications Table Section */}
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gray-50/50">
            <h3 className="font-semibold text-gray-700">Scheduled Medications</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Medicine</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Dose</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Schedule</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {medications.length > 0 ? (
                  medications.map((med) => (
                    <tr key={med.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                            {med.patient_name?.charAt(0) || 'P'}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{med.patient_name}</div>
                            <div className="text-xs text-gray-500">{med.admission_number || 'Admission not set'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-semibold">{med.medication_name}</div>
                        <div className="text-xs text-gray-500">{med.instructions || 'Standard protocol'}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {med.dose}
                        <div className="text-xs text-gray-500 mt-1">{med.route}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{med.scheduled_time}</div>
                        <div className="text-xs text-gray-500">{med.frequency}</div>
                        {med.duration_days ? (
                          <div className="text-xs text-gray-500">{`Duration: ${med.duration_days} day${med.duration_days > 1 ? 's' : ''}`}</div>
                        ) : null}
                        {med.end_date ? (
                          <div className="text-xs text-gray-500">{`Until: ${med.end_date}`}</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusClass(med.status)}`}>
                          {med.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            className="bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white p-2 rounded-lg transition-all duration-200 shadow-sm"
                            onClick={() => {
                              const recordId = med.record_id || med._id || med.id || med.medication_id || med.prescription_id || med.uuid || '';
                              console.log('[MedicationSchedule] Edit button clicked - med object:', med);
                              console.log('[MedicationSchedule] Selected recordId for PATCH:', recordId);
                              setIsEditing(true);
                              setEditingRecordId(recordId);
                              setFormData({
                                admission_number: med.admission_number || selectedAdmission,
                                medication_name: med.medication_name || '',
                                dose: med.dose || '',
                                scheduled_time: med.scheduled_time || '',
                                instructions: med.instructions || '',
                                frequency: med.frequency || 'Once daily',
                                start_date: med.start_date || '',
                                end_date: med.end_date || '',
                                route: med.route || 'Oral',
                                duration_days: med.duration_days || ''
                              });
                              setIsModalOpen(true);
                            }}
                            title="Edit Medication"
                          >
                            <i className="fas fa-pen"></i>
                          </button>
                          <button 
                            className="bg-green-50 text-green-600 hover:bg-green-600 hover:text-white p-2 rounded-lg transition-all duration-200 shadow-sm"
                            onClick={() => handleMedAction('give', med.id)}
                            title="Mark as Given"
                          >
                            <i className="fas fa-check"></i>
                          </button>
                          <button 
                            className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white p-2 rounded-lg transition-all duration-200 shadow-sm"
                            onClick={() => handleMedAction('delay', med.id)}
                            title="Delay 1hr"
                          >
                            <i className="fas fa-clock"></i>
                          </button>
                          <button 
                            className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white p-2 rounded-lg transition-all duration-200 shadow-sm"
                            onClick={() => handleMedAction('skip', med.id)}
                            title="Mark as Missed"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-4 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <div className="bg-gray-100 p-4 rounded-full mb-3">
                          <i className="fas fa-pills text-3xl text-gray-400"></i>
                        </div>
                        <p className="text-lg font-medium text-gray-900">No medications scheduled</p>
                        <p className="text-sm text-gray-500 mb-4">You haven't added any medications for this patient yet.</p>
                        <button 
                          onClick={() => setIsModalOpen(true)}
                          className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2"
                        >
                          <i className="fas fa-plus-circle"></i>
                          Add First Medication
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Scroll Indicator */}
        <div className="md:hidden flex items-center justify-center gap-2 text-xs text-gray-400 py-2">
          <i className="fas fa-arrows-alt-h"></i>
          <span>Swipe left to see more columns</span>
        </div>
      </div>
    </div>
  );
};

export default MedicationSchedule;