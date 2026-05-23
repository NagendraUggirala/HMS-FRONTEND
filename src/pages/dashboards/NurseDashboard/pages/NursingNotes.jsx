import React, { useState, useEffect } from 'react';
import Modal from '../../../../components/common/Modal/Modal';
const NursingNotes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [nursingNotes, setNursingNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState(null);
  
  // Updated to match typical backend fields (snake_case)
  const [newNote, setNewNote] = useState({
    admission_number: '',
    patient_name: '',
    note_type: 'Routine Observation',
    title: '',
    details: '',
    priority: 'Low',
    follow_up: 'No',
    nurse_name: ''
  });

  useEffect(() => {
    // Only fetch notes when user manually enters an admission number and clicks Load Notes
    setLoading(false);
  }, []);

  const normalizeNote = (note) => {
    const nursingNote = note?.vital_signs?.nursing_note || {};
    return {
      id: note.id,
      patient_id: note.patient_id,
      doctor_id: note.doctor_id,
      appointment_id: note.appointment_id,
      chief_complaint: note.chief_complaint,
      history_of_present_illness: note.history_of_present_illness,
      past_medical_history: note.past_medical_history,
      examination_findings: note.examination_findings,
      diagnosis: note.diagnosis,
      differential_diagnosis: note.differential_diagnosis,
      treatment_plan: note.treatment_plan,
      follow_up_instructions: note.follow_up_instructions,
      created_at: note.created_at,
      updated_at: note.updated_at,
      hospital_id: note.hospital_id,
      is_finalized: note.is_finalized,
      is_active: note.is_active,
      details: nursingNote.details || nursingNote.note_content || '',
      note_content: nursingNote.note_content,
      observation_title: nursingNote.observation_title,
      title: nursingNote.observation_title || note.title || '',
      priority: nursingNote.priority,
      note_type: nursingNote.note_type || note.note_type,
      follow_up_required: nursingNote.follow_up_required,
      recorded_at: nursingNote.recorded_at,
      recorded_by: nursingNote.recorded_by,
    };
  };

  const getToken = () => {
    return (
      localStorage.getItem('access_token') ||
      localStorage.getItem('authToken') ||
      localStorage.getItem('token') ||
      ''
    );
  };

  const fetchNursingNotes = async () => {
    if (!admissionNumber || admissionNumber.trim() === '') {
      setError('Please enter an admission number to view notes.');
      setNursingNotes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const token = getToken();
      const query = `?admission_number=${encodeURIComponent(admissionNumber.trim())}`;
      
      // Using standard fetch, assuming proxy or full URL is configured
      const response = await fetch(`/api/v1/nurse/nursing-notes${query}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch from API');
      }
      
      const data = await response.json();
      const rawNotes = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      setNursingNotes(rawNotes.map(normalizeNote));
    } catch (err) {
      console.error('API Error:', err.message, err);
      setError(`Failed to fetch nursing notes: ${err.message}`);
      setNursingNotes([]); // No more dummy data
    } finally {
      setLoading(false);
    }
  };

  const getPriorityClass = (priority) => {
    const p = priority?.toLowerCase() || 'routine';
    switch (p) {
      case 'routine': 
      case 'low':
      case 'normal':
        return 'status-stable';
      case 'critical': 
      case 'high':
        return 'status-critical';
      case 'improving': 
      case 'medium':
        return 'status-improving';
      default: return 'status-stable';
    }
  };

  const getPriorityText = (priority) => {
    const p = priority?.toLowerCase() || 'routine';
    switch (p) {
      case 'routine': return 'Routine';
      case 'normal': return 'Normal';
      case 'critical': return 'Critical';
      case 'improving': return 'Follow-up';
      case 'low': return 'Low';
      case 'medium': return 'Medium';
      case 'high': return 'High';
      default: return priority || 'Routine';
    }
  };

  const formatDate = (value) => {
    if (!value) return 'Unknown date';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
  };

  const filteredNotes = nursingNotes.filter(note => {
    const search = searchTerm.toLowerCase();
    const patientMatch = note.patient_name ? note.patient_name.toLowerCase().includes(search) : false;
    const titleMatch = note.title ? note.title.toLowerCase().includes(search) : false;
    const detailsMatch = note.details ? note.details.toLowerCase().includes(search) : false;
    const typeMatch = note.note_type ? note.note_type.toLowerCase().includes(search) : false;
    const nurseMatch = note.nurse_name ? note.nurse_name.toLowerCase().includes(search) : false;
    const followUpMatch = typeof note.follow_up_required === 'boolean' ? String(note.follow_up_required).includes(search) : false;
    const observationMatch = note.observation_title ? note.observation_title.toLowerCase().includes(search) : false;
    const contentMatch = note.note_content ? note.note_content.toLowerCase().includes(search) : false;
    const patientIdMatch = note.patient_id ? note.patient_id.toLowerCase().includes(search) : false;

    return patientMatch || titleMatch || detailsMatch || typeMatch || nurseMatch || followUpMatch || observationMatch || contentMatch || patientIdMatch;
  });

  const handleSubmitNote = async (e) => {
    e.preventDefault();
    if (newNote.title && newNote.details) {
      try {
        const token = getToken();
        
        const url = isEditing ? `/api/v1/nurse/nursing-notes/${editingRecordId}` : '/api/v1/nurse/nursing-notes';
        const method = isEditing ? 'PATCH' : 'POST';
        
        const response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            admission_number: newNote.admission_number,
            observation_title: newNote.title,
            note_type: newNote.note_type,
            details: newNote.details,
            note_content: newNote.details,
            priority: newNote.priority.toUpperCase(),
            follow_up_required: newNote.follow_up.startsWith('Yes'),
            history_of_present_illness: newNote.details
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save to backend');
        }

        // Refresh the list after successful post
        await fetchNursingNotes();
        alert(`Nursing note ${isEditing ? 'updated' : 'saved'} successfully to backend!`);
        
        setNewNote({
          admission_number: '',
          patient_name: '',
          note_type: 'Routine Observation',
          title: '',
          details: '',
          priority: 'Low',
          follow_up: 'No',
          nurse_name: ''
        });
        setIsEditing(false);
        setEditingRecordId(null);
        setIsModalOpen(false);
      } catch (err) {

        console.error('Save error:', err.message);
        alert(`Failed to save nursing note. Check backend connection. ${err.message}`);
      }
    }
  };

  const handleEditClick = (note) => {
    setIsEditing(true);
    setEditingRecordId(note.id);
    
    // Convert backend priority to UI match, if necessary
    let p = note.priority || 'Low';
    p = p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();

    setNewNote({
      admission_number: admissionNumber || '', // Since it fetches by admission number
      patient_name: '', // We don't necessarily have it unless from note
      note_type: note.note_type || 'Routine Observation',
      title: note.observation_title || note.title || '',
      details: note.note_content || note.details || note.history_of_present_illness || '',
      priority: p,
      follow_up: note.follow_up_required ? 'Yes - Today' : 'No',
      nurse_name: ''
    });
    setIsModalOpen(true);
  };

  const handleAddNewClick = () => {
    setIsEditing(false);
    setEditingRecordId(null);
    setNewNote({
      admission_number: admissionNumber || '',
      patient_name: '',
      note_type: 'Routine Observation',
      title: '',
      details: '',
      priority: 'Low',
      follow_up: 'No',
      nurse_name: ''
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-semibold text-gray-700">Nursing Notes & Observations</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <input
            type="text"
            placeholder="Admission number"
            value={admissionNumber}
            onChange={(e) => setAdmissionNumber(e.target.value)}
            className="border rounded p-2 w-full sm:w-64"
          />
          <button
            type="button"
            onClick={fetchNursingNotes}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Load Notes
          </button>
          <button
            type="button"
            onClick={handleAddNewClick}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2 shadow-sm text-sm"
          >
            <i className="fas fa-plus"></i> Add Note
          </button>
        </div>
      </div>

      {/* Notes List */}
      <div className="bg-white p-4 border rounded card-shadow space-y-3">
        {loading && (
          <div className="text-center text-gray-500 py-8">Loading nursing notes...</div>
        )}
        {!loading && error && (
          <div className="text-center text-red-500 py-8">{error}</div>
        )}
        {!loading && !error && filteredNotes.length === 0 && (
          <div className="text-center text-gray-500 py-8">No nursing notes found.</div>
        )}
        {!loading && !error && filteredNotes.map((note, index) => (
          <div key={note.id || index} className="border-b pb-4 fade-in">
            <div className="flex flex-col md:flex-row justify-between gap-2 items-start">
              <div>
                <h3 className="font-semibold text-blue-700">{note.observation_title || note.title || 'Untitled note'}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="font-medium">Patient ID:</span> {note.patient_id || 'Unknown'}
                  {' • '}
                  <span className="font-medium">Note Type:</span> {note.note_type || 'Nursing Note'}
                </p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${getPriorityClass(note.priority)}`}>
                {getPriorityText(note.priority)}
              </span>
            </div>
            <p className="text-sm text-gray-600 my-2">{note.note_content || note.details || 'No nursing note content available'}...</p>
            {note.follow_up_required !== undefined && (
              <p className="text-sm text-indigo-700 font-medium">Follow-up required: {note.follow_up_required ? 'Yes' : 'No'}</p>
            )}
            {note.chief_complaint && (
              <p className="text-sm text-gray-500">Chief complaint: {note.chief_complaint}</p>
            )}
            {note.history_of_present_illness && (
              <p className="text-sm text-gray-500">History: {note.history_of_present_illness}</p>
            )}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-gray-400">
              <div className="flex gap-4">
                <p>Doctor ID: {note.doctor_id || 'N/A'}</p>
                <p>Recorded at: {formatDate(note.recorded_at || note.created_at)}</p>
              </div>
              <button 
                onClick={() => handleEditClick(note)} 
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded"
              >
                <i className="fas fa-edit"></i>
                <span className="font-medium">Edit</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Nursing Note Form in Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? "Edit Nursing Note" : "Add New Nursing Note"}
        size="lg"
      >
        <form onSubmit={handleSubmitNote} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admission No.</label>
                <input 
                  type="text"
                  value={newNote.admission_number}
                  onChange={(e) => setNewNote({...newNote, admission_number: e.target.value})}
                  className="w-full border rounded p-2"
                  placeholder="e.g. ADM-001"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
                <input 
                  type="text"
                  value={newNote.patient_name}
                  onChange={(e) => setNewNote({...newNote, patient_name: e.target.value})}
                  className="w-full border rounded p-2"
                  placeholder="Optional name"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note Type</label>
              <select 
                value={newNote.note_type}
                onChange={(e) => setNewNote({...newNote, note_type: e.target.value})}
                className="w-full border rounded p-2"
              >
                <option value="Routine Observation">Routine Observation</option>
                <option value="Medication Administration">Medication Administration</option>
                <option value="Vital Signs">Vital Signs</option>
                <option value="Patient Education">Patient Education</option>
                <option value="Incident Report">Incident Report</option>
                <option value="Critical Finding">Critical Finding</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observation</label>
            <input 
              type="text" 
              value={newNote.title}
              onChange={(e) => setNewNote({...newNote, title: e.target.value})}
              className="w-full border rounded p-2" 
              placeholder="Enter observation title" 
              required 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
            <textarea 
              value={newNote.details}
              onChange={(e) => setNewNote({...newNote, details: e.target.value})}
              className="w-full border rounded p-2" 
              rows="4" 
              placeholder="Enter detailed notes" 
              required 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select 
                value={newNote.priority}
                onChange={(e) => setNewNote({...newNote, priority: e.target.value})}
                className="w-full border rounded p-2"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Required</label>
              <select 
                value={newNote.follow_up}
                onChange={(e) => setNewNote({...newNote, follow_up: e.target.value})}
                className="w-full border rounded p-2"
              >
                <option value="No">No</option>
                <option value="Yes - Next Shift">Yes - Next Shift</option>
                <option value="Yes - Today">Yes - Today</option>
                <option value="Yes - Immediately">Yes - Immediately</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nurse Name</label>
            <input
              type="text"
              value={newNote.nurse_name}
              onChange={(e) => setNewNote({ ...newNote, nurse_name: e.target.value })}
              className="w-full border rounded p-2"
              placeholder="Enter nurse name"
            />
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              <i className="fas fa-save mr-1"></i>Save Note
            </button>
            <button 
              type="button" 
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
              onClick={() => {
                setNewNote({
                  admission_number: '',
                  patient_name: '',
                  note_type: 'Routine Observation',
                  title: '',
                  details: '',
                  priority: 'Low',
                  follow_up: 'No',
                  nurse_name: ''
                });
                setIsEditing(false);
                setEditingRecordId(null);
                setIsModalOpen(false);
              }}
            >
              <i className="fas fa-times mr-1"></i>Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Mobile Search */}
      <div className="block md:hidden bg-white p-4 border rounded card-shadow">
        <input
          type="text"
          placeholder="Search nursing notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border rounded p-2 text-sm"
        />
      </div>
    </div>
  );
};

export default NursingNotes;