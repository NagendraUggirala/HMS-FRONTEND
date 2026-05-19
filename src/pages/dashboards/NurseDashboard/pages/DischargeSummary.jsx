import React, { useState, useEffect } from 'react';
import Modal from '../../../../components/common/Modal/Modal';
import { apiFetch } from '../../../../services/apiClient';
import { NURSE_DISCHARGE_SUPPORT, NURSE_DISCHARGE_SUMMARY } from '../../../../config/api';

const DischargeSummary = () => {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    admissionNumber: '',
    patientName: '',
    admissionDate: '',
    dischargeDate: '',
    finalDiagnosis: '',
    secondaryDiagnoses: '',
    proceduresPerformed: '',
    hospitalCourse: '',
    followUpInstructions: '',
    dietInstructions: '',
    activityRestrictions: '',
    followUpDate: '',
    followUpDoctor: 'Dr. Meena Rao'
  });

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDischargePatients();
  }, []);

  const fetchDischargePatients = async () => {
    setLoading(true);
    try {
      const response = await apiFetch(NURSE_DISCHARGE_SUPPORT);
      if (response && response.ok) {
        const data = await response.json();
        const rawData = Array.isArray(data?.data) ? data.data : [];
        setPatients(rawData.map(p => ({
          id: p.id || p.admission_number,
          admissionNumber: p.admission_number || p.id,
          name: p.patient_name || p.name || 'Unknown Patient',
          bed: p.bed_number || p.bed_code || 'N/A',
          admissionDate: p.admission_date ? new Date(p.admission_date).toLocaleDateString() : 'N/A',
          condition: p.condition || p.diagnosis || p.chief_complaint || 'N/A',
          treatment: p.treatment || p.treatment_plan || 'N/A',
          status: (p.status || 'ready').toLowerCase()
        })));
      }
    } catch (err) {
      console.error("Error fetching discharge patients:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'ready': return 'status-stable';
      case 'improving': return 'status-improving';
      case 'observation': return 'status-critical';
      default: return 'status-stable';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ready': return 'Ready for discharge';
      case 'improving': return 'Improving';
      case 'observation': return 'Under observation';
      default: return 'Ready for discharge';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveSummary = async (e) => {
    e.preventDefault();
    try {
      const patientId = selectedPatient?.admissionNumber || selectedPatient?.id || formData.admissionNumber || formData.patientName;
      
      const payload = {
        admission_number: patientId, // or patient_id if backend expects it
        final_diagnosis: formData.finalDiagnosis,
        secondary_diagnoses: formData.secondaryDiagnoses ? formData.secondaryDiagnoses.split(',').map(s => s.trim()) : [],
        procedures_performed: formData.proceduresPerformed ? formData.proceduresPerformed.split(',').map(s => s.trim()) : [],
        hospital_course: formData.hospitalCourse,
        follow_up_instructions: formData.followUpInstructions,
        diet_instructions: formData.dietInstructions,
        activity_restrictions: formData.activityRestrictions,
        follow_up_date: formData.followUpDate,
        follow_up_doctor: formData.followUpDoctor
      };

      const url = isEditing 
        ? `${NURSE_DISCHARGE_SUMMARY}?admission_number=${encodeURIComponent(patientId)}`
        : NURSE_DISCHARGE_SUMMARY;
        
      const response = await apiFetch(url, {
        method: isEditing ? 'PATCH' : 'POST',
        body: JSON.stringify(payload)
      });

      if (response && response.ok) {
        alert(`Discharge summary ${isEditing ? 'updated' : 'saved'} successfully!`);
        setShowFormModal(false);
        fetchDischargePatients();
      } else {
        alert('Failed to save discharge summary.');
      }
    } catch (error) {
      console.error('Error saving discharge summary:', error);
      alert('Error connecting to backend.');
    }
  };

  const handlePrintSummary = () => {
    setShowPrintModal(true);
  };

  const handleEmailSummary = () => {
    setShowEmailModal(true);
  };

  const handlePrepareSummary = async (patient) => {
    setSelectedPatient(patient);
    
    // Check if summary exists for this patient
    const admId = patient.admissionNumber || patient.id;
    try {
      const res = await apiFetch(`${NURSE_DISCHARGE_SUMMARY}?admission_number=${encodeURIComponent(admId)}`);
      if (res && res.ok) {
        const result = await res.json();
        const existingData = result?.data;
        if (existingData && existingData.length > 0) {
          // Pre-fill existing data for PATCH
          const data = existingData[0];
          setIsEditing(true);
          setFormData(prev => ({
            ...prev,
            admissionNumber: admId,
            patientName: patient.name,
            admissionDate: patient.admissionDate || '',
            finalDiagnosis: data.final_diagnosis || '',
            secondaryDiagnoses: data.secondary_diagnoses ? data.secondary_diagnoses.join(', ') : '',
            proceduresPerformed: data.procedures_performed ? data.procedures_performed.join(', ') : '',
            hospitalCourse: data.hospital_course || '',
            followUpInstructions: data.follow_up_instructions || '',
            dietInstructions: data.diet_instructions || '',
            activityRestrictions: data.activity_restrictions || '',
            followUpDate: data.follow_up_date || '',
            followUpDoctor: data.follow_up_doctor || 'Dr. Meena Rao'
          }));
          setShowFormModal(true);
          return;
        }
      }
    } catch (e) {
      console.error("No existing summary found or error fetching", e);
    }

    // Default to POST
    setIsEditing(false);
    setFormData({
      admissionNumber: admId,
      patientName: patient.name,
      admissionDate: patient.admissionDate || '',
      dischargeDate: new Date().toISOString().split('T')[0],
      finalDiagnosis: '',
      secondaryDiagnoses: '',
      proceduresPerformed: '',
      hospitalCourse: '',
      followUpInstructions: '',
      dietInstructions: '',
      activityRestrictions: '',
      followUpDate: '',
      followUpDoctor: 'Dr. Meena Rao'
    });
    setShowFormModal(true);
  };

  const handleManualSummary = () => {
    setSelectedPatient(null);
    setIsEditing(false);
    setFormData({
      admissionNumber: '',
      patientName: '',
      admissionDate: '',
      dischargeDate: new Date().toISOString().split('T')[0],
      finalDiagnosis: '',
      secondaryDiagnoses: '',
      proceduresPerformed: '',
      hospitalCourse: '',
      followUpInstructions: '',
      dietInstructions: '',
      activityRestrictions: '',
      followUpDate: '',
      followUpDoctor: 'Dr. Meena Rao'
    });
    setShowFormModal(true);
  };

  const handlePrintPatient = (patient) => {
    setSelectedPatient(patient);
    setFormData(prev => ({
      ...prev,
      patientName: patient.name
    }));
    setShowPrintModal(true);
  };

  const handleEmailPatient = (patient) => {
    setSelectedPatient(patient);
    setFormData(prev => ({
      ...prev,
      patientName: patient.name
    }));
    setShowEmailModal(true);
  };

  const handleActualPrint = () => {
    window.print();
    setShowPrintModal(false);
  };

  const handleSendEmail = () => {
    alert('Discharge summary emailed successfully!');
    setShowEmailModal(false);
  };

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-2xl font-semibold text-gray-700">Discharge Summary Support</h2>
        <button 
          onClick={handleManualSummary}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center"
        >
          <i className="fas fa-plus mr-2"></i> Create Manual Summary
        </button>
      </div>

      {/* Patients Grid */}
      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading patients for discharge support...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {patients.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 py-10 bg-white rounded-lg border border-dashed">
              No patients currently pending discharge support.
            </div>
          ) : (
            patients.map(patient => (
          <div key={patient.id} className="bg-white border rounded p-4 card-shadow fade-in">
            <div className="flex items-center gap-3 mb-2">
              <img src={`https://i.pravatar.cc/60?img=${patient.id+10}`} className="avatar" alt={patient.name} />
              <div>
                <h3 className="font-semibold text-blue-700">{patient.name}</h3>
                <p className="text-xs text-gray-500">Bed {patient.bed}</p>
              </div>
            </div>
            <div className="text-sm text-gray-600 space-y-1 mb-3">
              <p><strong>Admission Date:</strong> {patient.admissionDate}</p>
              <p><strong>Condition:</strong> {patient.condition}</p>
              <p><strong>Treatment:</strong> {patient.treatment}</p>
              <p><strong>Current Status:</strong> 
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(patient.status)} ml-1`}>
                  {getStatusText(patient.status)}
                </span>
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => handlePrepareSummary(patient)}
                className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded flex items-center hover:bg-blue-200"
              >
                <i className="fas fa-file-medical mr-1"></i>Prepare Summary
              </button>
              <button 
                onClick={() => handlePrintPatient(patient)}
                className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded flex items-center hover:bg-green-200"
              >
                <i className="fas fa-print mr-1"></i>Print
              </button>
              <button 
                onClick={() => handleEmailPatient(patient)}
                className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded flex items-center hover:bg-purple-200"
              >
                <i className="fas fa-envelope mr-1"></i>Email
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )}

      {/* Discharge Summary Form Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        title={isEditing ? "Edit Discharge Summary" : "Prepare Discharge Summary"}
        size="lg"
      >
        <form onSubmit={handleSaveSummary} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admission Number</label>
              <input 
                type="text" 
                name="admissionNumber"
                value={formData.admissionNumber}
                onChange={handleInputChange}
                className="w-full border rounded p-2" 
                placeholder="Enter admission number"
                required
                disabled={isEditing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
              <input 
                type="text" 
                name="patientName"
                value={formData.patientName}
                onChange={handleInputChange}
                className="w-full border rounded p-2" 
                placeholder="Enter patient name"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admission Date</label>
              <input 
                type="date" 
                name="admissionDate"
                value={formData.admissionDate}
                onChange={handleInputChange}
                className="w-full border rounded p-2" 
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discharge Date</label>
              <input 
                type="date" 
                name="dischargeDate"
                value={formData.dischargeDate}
                onChange={handleInputChange}
                className="w-full border rounded p-2" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Attending Physician</label>
              <input 
                type="text" 
                name="followUpDoctor"
                value={formData.followUpDoctor}
                onChange={handleInputChange}
                className="w-full border rounded p-2" 
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Final Diagnosis</label>
              <input 
                type="text" 
                name="finalDiagnosis"
                value={formData.finalDiagnosis}
                onChange={handleInputChange}
                className="w-full border rounded p-2" 
                placeholder="Enter final diagnosis" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Diagnoses (comma separated)</label>
              <input 
                type="text" 
                name="secondaryDiagnoses"
                value={formData.secondaryDiagnoses}
                onChange={handleInputChange}
                className="w-full border rounded p-2" 
                placeholder="E.g. Hypertension, Diabetes" 
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Procedures Performed (comma separated)</label>
              <input 
                type="text" 
                name="proceduresPerformed"
                value={formData.proceduresPerformed}
                onChange={handleInputChange}
                className="w-full border rounded p-2" 
                placeholder="E.g. Appendectomy, Blood Transfusion" 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Course</label>
            <textarea 
              name="hospitalCourse"
              value={formData.hospitalCourse}
              onChange={handleInputChange}
              className="w-full border rounded p-2" 
              rows="3" 
              placeholder="Describe hospital course"
            ></textarea>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Diet Instructions</label>
              <textarea 
                name="dietInstructions"
                value={formData.dietInstructions}
                onChange={handleInputChange}
                className="w-full border rounded p-2" 
                rows="2" 
                placeholder="Enter diet instructions"
              ></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Activity Restrictions</label>
              <textarea 
                name="activityRestrictions"
                value={formData.activityRestrictions}
                onChange={handleInputChange}
                className="w-full border rounded p-2" 
                rows="2" 
                placeholder="Enter activity restrictions"
              ></textarea>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Instructions & Discharge Notes</label>
            <textarea 
              name="followUpInstructions"
              value={formData.followUpInstructions}
              onChange={handleInputChange}
              className="w-full border rounded p-2" 
              rows="3" 
              placeholder="Enter follow-up instructions and discharge notes"
            ></textarea>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
              <input 
                type="date" 
                name="followUpDate"
                value={formData.followUpDate}
                onChange={handleInputChange}
                className="w-full border rounded p-2" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Doctor</label>
              <input 
                type="text" 
                name="followUpDoctor"
                value={formData.followUpDoctor}
                onChange={handleInputChange}
                className="w-full border rounded p-2" 
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button 
              type="button" 
              onClick={() => setShowFormModal(false)}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
            >
              <i className="fas fa-times mr-1"></i>Cancel
            </button>
            <button 
              type="submit" 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              <i className="fas fa-save mr-1"></i>Save Summary
            </button>
          </div>
        </form>
      </Modal>

      {/* Print Preview Modal */}
      <Modal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        title="Print Preview - Discharge Summary"
        size="xl"
      >
        <div className="space-y-6">
          {/* Print Header */}
          <div className="text-center border-b pb-4">
            <h2 className="text-2xl font-bold text-gray-800">DISCHARGE SUMMARY</h2>
            <p className="text-gray-600">MediCloud Hospital</p>
          </div>

          {/* Patient Information */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Patient Name:</strong> {formData.patientName || 'Not specified'}</p>
              <p><strong>Admission Date:</strong> {formData.admissionDate || 'Not specified'}</p>
              <p><strong>Discharge Date:</strong> {formData.dischargeDate || 'Not specified'}</p>
            </div>
            <div>
              <p><strong>Attending Physician:</strong> {formData.followUpDoctor}</p>
              <p><strong>Follow-up Doctor:</strong> {formData.followUpDoctor}</p>
              <p><strong>Follow-up Appointment:</strong> {formData.followUpAppointment || 'Not scheduled'}</p>
            </div>
          </div>

          {/* Medical Information */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800 border-b pb-1">Final Diagnosis</h3>
              <p className="mt-2">{formData.finalDiagnosis || 'No diagnosis specified'}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 border-b pb-1">Hospital Course</h3>
              <p className="mt-2 whitespace-pre-line">{formData.hospitalCourse || 'No hospital course details provided'}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 border-b pb-1">Discharge Instructions</h3>
              <p className="mt-2 whitespace-pre-line">{formData.dischargeInstructions || 'No discharge instructions provided'}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 border-b pb-1">Follow-up Care</h3>
              <p className="mt-2 whitespace-pre-line">{formData.followUpCare || 'No follow-up care instructions provided'}</p>
            </div>
          </div>

          {/* Signature Section */}
          <div className="border-t pt-4 mt-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="border-b pb-8">_________________________</p>
                <p><strong>Attending Physician</strong></p>
                <p>{formData.followUpDoctor}</p>
              </div>
              <div>
                <p className="border-b pb-8">_________________________</p>
                <p><strong>Date</strong></p>
                <p>{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Print Actions */}
          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={() => setShowPrintModal(false)}
              className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleActualPrint}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <i className="fas fa-print mr-1"></i>Print Now
            </button>
          </div>
        </div>
      </Modal>

      {/* Email Preview Modal */}
      <Modal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        title="Email Discharge Summary"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <input 
              type="email" 
              className="w-full border rounded p-2" 
              placeholder="recipient@example.com"
              defaultValue="patient@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input 
              type="text" 
              className="w-full border rounded p-2" 
              defaultValue={`Discharge Summary - ${formData.patientName || 'Patient'}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea 
              className="w-full border rounded p-2" 
              rows="6"
              defaultValue={`Dear Patient,

Please find your discharge summary attached.

Patient: ${formData.patientName || 'Not specified'}
Discharge Date: ${formData.dischargeDate || 'Not specified'}

If you have any questions, please contact our office.

Best regards,
MediCloud Hospital`}
            ></textarea>
          </div>

          <div className="bg-blue-50 p-3 rounded">
            <p className="text-sm text-blue-700">
              <i className="fas fa-info-circle mr-1"></i>
              The discharge summary document will be attached automatically.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowEmailModal(false)}
              className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSendEmail}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              <i className="fas fa-paper-plane mr-1"></i>Send Email
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DischargeSummary;