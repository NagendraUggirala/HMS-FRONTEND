import React, { useState, useEffect } from 'react';
import Modal from '../../../../components/common/Modal/Modal';
import { apiFetch } from '../../../../services/apiClient';
import { NURSE_DISCHARGE_SUPPORT, NURSE_DISCHARGE_SUMMARY } from '../../../../config/api';

const DischargeSummary = () => {
  // State for active tab in the wizard
  const [activeTab, setActiveTab] = useState('patient');

  // State for selected patient
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Modals visibility
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  // Initial template state
  const initialFormState = {
    id: '',
    patientId: '',
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    admissionNumber: '',
    patientName: '',
    age: '',
    gender: 'Male',
    roomBed: '',
    admissionDate: '',
    dischargeDate: '',
    attendingPhysician: 'Dr. Meena Rao',
    finalDiagnosis: '',
    secondaryDiagnoses: '',
    proceduresPerformed: '',
    hospitalCourse: '',
    dischargeInstructions: '',
    followUpCare: '',
    followUpAppointment: '',
    followUpDoctor: 'Dr. Meena Rao',
    vitalBP: '',
    vitalPulse: '',
    vitalTemp: '',
    vitalSpO2: '',
    vitalRespRate: '',
    conditionAtDischarge: 'Stable',
    medications: [
      { name: '', dosage: '', route: 'Oral', frequency: 'Once daily', duration: '5 days', instructions: 'Take after meals' }
    ]
  };

  // State for form data
  const [formData, setFormData] = useState(initialFormState);

  // Patients mock list (with standard dates for direct binding)
  const patients = [
    {
      id: 1,
      name: "Leanne Graham",
      bed: "101",
      admissionDate: "2026-05-15",
      condition: "Acute Tonsillitis / Fever",
      treatment: "IV Antibiotics & Supportive Fluids",
      status: "ready"
    },
    {
      id: 2,
      name: "Ervin Howell",
      bed: "102",
      admissionDate: "2026-05-18",
      condition: "Urinary Tract Infection",
      treatment: "IV Fluids & Antibiotic Therapy",
      status: "improving"
    },
    {
      id: 3,
      name: "Clementine Bauch",
      bed: "103",
      admissionDate: "2026-05-10",
      condition: "Right Femur Fracture",
      treatment: "Surgical Reduction & Immobilization",
      status: "observation"
    },
    {
      id: 4,
      name: "Patricia Lebsack",
      bed: "104",
      admissionDate: "2026-05-20",
      condition: "Chronic Migraine Flare-up",
      treatment: "Physiotherapy & Analgesics",
      status: "ready"
    },
  ];
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

  // Local storage history of summaries
  const [savedSummaries, setSavedSummaries] = useState(() => {
    const saved = localStorage.getItem('discharge_summaries');
    return saved ? JSON.parse(saved) : [
      {
        id: 'DIS-2026-4820',
        patientId: 'PAT-001',
        patientName: 'Leanne Graham',
        age: '32',
        gender: 'Female',
        roomBed: 'Room 101 - Bed 101',
        admissionDate: '2026-05-15',
        dischargeDate: '2026-05-22',
        attendingPhysician: 'Dr. Meena Rao',
        finalDiagnosis: 'Acute Bilateral Tonsillitis with High-grade Fever',
        hospitalCourse: 'Patient admitted with severe throat congestion and high-grade pyrexia. Treated with regular IV antibiotics and paracetamol infusion. Vitals monitored closely. Patient responded remarkably, congestion has resolved and vitals have stabilized nicely. Discharged in active health.',
        dischargeInstructions: 'Avoid chilled beverages and oily food. Complete the course of oral antibiotics on time.',
        followUpCare: 'Rest at home, monitor daily morning temperature, hydrate with warm water.',
        followUpAppointment: '2026-05-29',
        followUpDoctor: 'Dr. Meena Rao',
        vitalBP: '120/80',
        vitalPulse: '74',
        vitalTemp: '98.4',
        vitalSpO2: '99',
        vitalRespRate: '16',
        conditionAtDischarge: 'Stable',
        medications: [
          { name: 'Tab Amoxicillin Clavulanate', dosage: '625mg', route: 'Oral', frequency: 'Twice daily', duration: '5 days', instructions: 'After meals' },
          { name: 'Tab Paracetamol', dosage: '650mg', route: 'Oral', frequency: 'As needed (SOS)', duration: '3 days', instructions: 'For pain or fever' }
        ],
        savedAt: '5/22/2026, 7:30:00 AM'
      }
    ];
  });

  const getStatusClass = (status) => {
    switch (status) {
      case 'ready': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'improving': return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'observation': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ready': return 'Ready for discharge';
      case 'improving': return 'Improving';
      case 'observation': return 'Under observation';
      default: return 'Discharge planned';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Dynamic Medication Management
  const handleMedicationChange = (index, e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updatedMedications = [...prev.medications];
      updatedMedications[index] = {
        ...updatedMedications[index],
        [name]: value
      };
      return {
        ...prev,
        medications: updatedMedications
      };
    });
  };

  const addMedicationRow = () => {
    setFormData(prev => ({
      ...prev,
      medications: [
        ...prev.medications,
        { name: '', dosage: '', route: 'Oral', frequency: 'Once daily', duration: '5 days', instructions: 'Take after meals' }
      ]
    }));
  };

  const removeMedicationRow = (index) => {
    setFormData(prev => {
      if (prev.medications.length === 1) {
        return {
          ...prev,
          medications: [{ name: '', dosage: '', route: 'Oral', frequency: 'Once daily', duration: '5 days', instructions: 'Take after meals' }]
        };
      }
      return {
        ...prev,
        medications: prev.medications.filter((_, i) => i !== index)
      };
    });
  };

  // Fill forms automatically on select
  const handlePrepareSummary = (patient) => {
    setSelectedPatient(patient);

    // Auto-fill detailed professional clinical fields
    setFormData({
      id: '', // New record initially
      patientId: `PAT-00${patient.id}`,
      patientName: patient.name,
      age: patient.id === 1 ? '32' : patient.id === 2 ? '45' : patient.id === 3 ? '28' : '51',
      gender: patient.id % 2 === 0 ? 'Female' : 'Male',
      roomBed: `Room ${patient.bed.startsWith('1') ? '10' : '20'} - Bed ${patient.bed}`,
      admissionDate: patient.admissionDate,
      dischargeDate: new Date().toISOString().split('T')[0],
      attendingPhysician: patient.id % 2 === 0 ? 'Dr. Priya Sharma' : 'Dr. Meena Rao',
      finalDiagnosis: patient.condition || '',
      hospitalCourse: `Patient was admitted with severe ${patient.condition.toLowerCase()}. Started immediately on ${patient.treatment.toLowerCase()}. Monitored continuously. General state has significantly improved with standard care. Vitals are entirely within normal limits. Discharging in stable condition with proper oral therapy advice.`,
      dischargeInstructions: 'Take complete rest. Avoid heavy physical lifting. Ensure adequate oral hydration (2.5-3 liters water).',
      followUpCare: 'Review in General Medicine OPD if fever recurs or if any respiratory discomfort develops.',
      followUpAppointment: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      followUpDoctor: patient.id % 2 === 0 ? 'Dr. Priya Sharma' : 'Dr. Meena Rao',
      vitalBP: patient.id === 2 ? '130/85' : '120/80',
      vitalPulse: '74',
      vitalTemp: '98.6',
      vitalSpO2: '99',
      vitalRespRate: '16',
      conditionAtDischarge: patient.status === 'ready' ? 'Stable' : 'Improving',
      medications: [
        { name: patient.treatment.includes('Antibiotics') ? 'Tab Amoxicillin' : 'Tab Ibuprofen', dosage: '500mg', route: 'Oral', frequency: 'Twice daily', duration: '5 days', instructions: 'Post breakfast and dinner' }
      ]
    });

    setActiveTab('patient');
  };

  const handleSaveSummary = (e) => {
    e.preventDefault();
    if (!formData.patientName.trim()) {
      alert('Please select or specify a Patient Name.');
      return;
    }

    const summaryId = formData.id || `DIS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const updatedSummary = {
      ...formData,
      id: summaryId,
      savedAt: new Date().toLocaleString()
    };

    let updatedList;
    if (savedSummaries.some(s => s.id === updatedSummary.id)) {
      updatedList = savedSummaries.map(s => s.id === updatedSummary.id ? updatedSummary : s);
      alert('Discharge summary updated successfully!');
    } else {
      updatedList = [updatedSummary, ...savedSummaries];
      alert('Discharge summary saved successfully!');
    }

    setSavedSummaries(updatedList);
    localStorage.setItem('discharge_summaries', JSON.stringify(updatedList));

    // Keep updated id in state
    setFormData(updatedSummary);
  };

  const handleEditSummary = (summary) => {
    setFormData(summary);
    setSelectedPatient({ name: summary.patientName });
    setActiveTab('patient');

    // Smooth scroll to top of form wizard
    const formElement = document.getElementById('discharge-form-wizard');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDeleteSummary = (id) => {
    if (window.confirm('Are you sure you want to delete this saved discharge summary?')) {
      const updatedList = savedSummaries.filter(s => s.id !== id);
      setSavedSummaries(updatedList);
      localStorage.setItem('discharge_summaries', JSON.stringify(updatedList));
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
    if (!formData.patientName) {
      alert('Form is empty. Please select or prepare a patient first.');
      return;
    }
    setShowPrintModal(true);
  };

  const handleEmailSummary = () => {
    if (!formData.patientName) {
      alert('Form is empty. Please select or prepare a patient first.');
      return;
    }
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
    handlePrepareSummary(patient);
    // Timeout to allow state to settle
    setTimeout(() => {
      setShowPrintModal(true);
    }, 150);
  };

  const handleEmailPatient = (patient) => {
    handlePrepareSummary(patient);
    setTimeout(() => {
      setShowEmailModal(true);
    }, 150);
  };

  const handleActualPrint = () => {
    window.print();
  };

  const handleSendEmail = () => {
    alert(`Discharge summary for ${formData.patientName} has been emailed successfully!`);
    setShowEmailModal(false);
  };

  // Form completion calculator
  const getCompletionPercentage = () => {
    const requiredFields = [
      formData.patientName,
      formData.admissionDate,
      formData.dischargeDate,
      formData.finalDiagnosis,
      formData.hospitalCourse,
      formData.vitalBP,
      formData.vitalPulse,
      formData.vitalTemp,
      formData.vitalSpO2,
      formData.vitalRespRate,
      formData.followUpAppointment
    ];
    const filledCount = requiredFields.filter(field => field && field.toString().trim() !== '').length;
    const medicationFilled = formData.medications.length > 0 && formData.medications[0].name.trim() !== '';
    const total = requiredFields.length + 1;
    const finalCount = filledCount + (medicationFilled ? 1 : 0);
    return Math.round((finalCount / total) * 100);
  };

  const completionPercent = formData.patientName ? getCompletionPercentage() : 0;

  return (
    <div className="space-y-8 overflow-x-hidden animate-fade-in p-1">
      {/* Dynamic Printing Style Tag */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          /* Hide all application elements */
          body * {
            visibility: hidden;
          }
          #print-discharge-summary-document, #print-discharge-summary-document * {
            visibility: visible;
          }
          #print-discharge-summary-document {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          /* Ensure modal backdrop and scroll elements are invisible */
          .fixed, .z-50, .backdrop-blur-sm, button, footer {
            display: none !important;
          }
        }
      `}} />

      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <i className="fas fa-file-prescription text-blue-600"></i>
            Discharge Summaries
          </h2>
          <p className="text-sm text-gray-500">Manage patient discharges, vital signs checks, discharge medications, and professional report printing.</p>
        </div>
      </div>

      {/* Active Patients Grid */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
            <i className="fas fa-user-injured text-indigo-500"></i>
            Admitted Patients List
          </h3>
          <span className="text-xs text-gray-500 bg-gray-100 border px-2.5 py-1 rounded-full">
            {patients.length} active admissions
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {patients.map(patient => {
            const isCurrentlySelected = selectedPatient && selectedPatient.id === patient.id;
            return (
              <div
                key={patient.id}
                className={`bg-white rounded-xl border p-4 transition-all duration-300 flex flex-col justify-between hover:shadow-md ${isCurrentlySelected ? 'ring-2 ring-indigo-500 border-indigo-200 bg-indigo-50/10' : 'border-gray-200'
                  }`}
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={`https://i.pravatar.cc/80?img=${patient.id + 10}`}
                      className="w-12 h-12 rounded-full border-2 border-indigo-100 object-cover"
                      alt={patient.name}
                    />
                    <div>
                      <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{patient.name}</h4>
                      <p className="text-xs text-gray-500 font-medium">Bed No: <span className="text-indigo-600 font-semibold">{patient.bed}</span></p>
                    </div>
                  </div>

                  <div className="text-xs text-gray-600 space-y-1.5 border-t border-b py-3 my-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-medium">Admission:</span>
                      <span className="font-semibold">{new Date(patient.admissionDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-medium">Diagnosis:</span>
                      <span className="font-semibold text-gray-800 truncate max-w-[150px]">{patient.condition}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 font-medium">Status:</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusClass(patient.status)}`}>
                        {getStatusText(patient.status)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1">
                  <button
                    onClick={() => handlePrepareSummary(patient)}
                    title="Prepare Form"
                    className="text-[11px] bg-indigo-50 text-indigo-700 py-1.5 rounded-lg flex flex-col items-center gap-0.5 font-bold hover:bg-indigo-100 transition-colors"
                  >
                    <i className="fas fa-file-medical"></i>Prepare
                  </button>
                  <button
                    onClick={() => handlePrintPatient(patient)}
                    title="Quick Print"
                    className="text-[11px] bg-emerald-50 text-emerald-700 py-1.5 rounded-lg flex flex-col items-center gap-0.5 font-bold hover:bg-emerald-100 transition-colors"
                  >
                    <i className="fas fa-print"></i>Print
                  </button>
                  <button
                    onClick={() => handleEmailPatient(patient)}
                    title="Quick Email"
                    className="text-[11px] bg-purple-50 text-purple-700 py-1.5 rounded-lg flex flex-col items-center gap-0.5 font-bold hover:bg-purple-100 transition-colors"
                  >
                    <i className="fas fa-envelope"></i>Email
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Discharge Summary Form Section */}
      <div id="discharge-form-wizard" className="bg-white rounded-xl border border-gray-200 card-shadow overflow-hidden">
        {/* Form Header */}
        <div className="bg-gradient-to-r from-slate-800 to-indigo-950 px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <i className="fas fa-file-signature text-indigo-400"></i>
              Discharge Form Wizard
            </h3>
            {formData.patientName ? (
              <p className="text-xs text-indigo-200 font-medium">Currently Editing: <span className="underline font-bold text-white">{formData.patientName}</span> ({formData.patientId || 'New Document'})</p>
            ) : (
              <p className="text-xs text-indigo-200 font-medium">Select a patient above or enter details below to generate a new discharge summary.</p>
            )}
          </div>

          {formData.patientName && (
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex-1 md:flex-initial text-right">
                <span className="text-[10px] text-indigo-300 font-semibold block uppercase">Completion</span>
                <span className="text-xs font-bold text-white">{completionPercent}%</span>
              </div>
              <div className="w-24 bg-slate-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${completionPercent < 50 ? 'bg-amber-500' : completionPercent < 90 ? 'bg-indigo-400' : 'bg-emerald-500'
                    }`}
                  style={{ width: `${completionPercent}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Tab Headers */}
        <div className="flex flex-wrap border-b border-gray-100 bg-slate-50 px-4 pt-3">
          <button
            type="button"
            onClick={() => setActiveTab('patient')}
            className={`px-5 py-3 text-xs font-bold rounded-t-lg transition-all flex items-center gap-1.5 -mb-px ${activeTab === 'patient'
                ? 'bg-white border-t border-x border-gray-200 text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-indigo-600 hover:bg-white/40'
              }`}
          >
            <i className="fas fa-id-card"></i>
            1. Patient & Vitals
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('clinical')}
            className={`px-5 py-3 text-xs font-bold rounded-t-lg transition-all flex items-center gap-1.5 -mb-px ${activeTab === 'clinical'
                ? 'bg-white border-t border-x border-gray-200 text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-indigo-600 hover:bg-white/40'
              }`}
          >
            <i className="fas fa-heartbeat"></i>
            2. Clinical Summary
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('medications')}
            className={`px-5 py-3 text-xs font-bold rounded-t-lg transition-all flex items-center gap-1.5 -mb-px ${activeTab === 'medications'
                ? 'bg-white border-t border-x border-gray-200 text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-indigo-600 hover:bg-white/40'
              }`}
          >
            <i className="fas fa-capsules"></i>
            3. Medications
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('advice')}
            className={`px-5 py-3 text-xs font-bold rounded-t-lg transition-all flex items-center gap-1.5 -mb-px ${activeTab === 'advice'
                ? 'bg-white border-t border-x border-gray-200 text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-indigo-600 hover:bg-white/40'
              }`}
          >
            <i className="fas fa-hand-holding-medical"></i>
            4. Advice & Follow-Up
          </button>
        </div>

        {/* Wizard Form Contents */}
        <form onSubmit={handleSaveSummary} className="p-6 space-y-6">

          {/* TAB 1: Patient & Vitals */}
          {activeTab === 'patient' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-blue-50/50 p-4 border border-blue-100/50 rounded-lg">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800 mb-3 flex items-center gap-1">
                  <i className="fas fa-hospital-user text-blue-600"></i>
                  Patient General Records
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Patient Full Name</label>
                    <input
                      type="text"
                      name="patientName"
                      value={formData.patientName}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-indigo-500"
                      placeholder="Enter patient full name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Patient ID / MRN</label>
                    <input
                      type="text"
                      name="patientId"
                      value={formData.patientId}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-indigo-500"
                      placeholder="e.g. PAT-001"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Age (Years)</label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-indigo-500"
                      placeholder="Age"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Room / Bed No.</label>
                    <input
                      type="text"
                      name="roomBed"
                      value={formData.roomBed}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-indigo-500"
                      placeholder="e.g. Room 101 - Bed A"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Admission Date</label>
                    <input
                      type="date"
                      name="admissionDate"
                      value={formData.admissionDate}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Discharge Date</label>
                    <input
                      type="date"
                      name="dischargeDate"
                      value={formData.dischargeDate}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Attending Physician</label>
                    <input
                      type="text"
                      name="attendingPhysician"
                      value={formData.attendingPhysician}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-indigo-500"
                      placeholder="Physician in charge"
                    />
                  </div>
                </div>
              </div>

              {/* Vitals Section */}
              <div className="bg-rose-50/50 p-4 border border-rose-100/50 rounded-lg">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800 mb-3 flex items-center gap-1">
                  <i className="fas fa-heartbeat text-rose-600"></i>
                  Vital Signs on Discharge
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Blood Pressure (mmHg)</label>
                    <input
                      type="text"
                      name="vitalBP"
                      value={formData.vitalBP}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-indigo-500 font-semibold text-rose-950"
                      placeholder="e.g. 120/80"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Pulse Rate (bpm)</label>
                    <input
                      type="number"
                      name="vitalPulse"
                      value={formData.vitalPulse}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-indigo-500 font-semibold text-rose-950"
                      placeholder="Pulse"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Temperature (°F)</label>
                    <input
                      type="text"
                      name="vitalTemp"
                      value={formData.vitalTemp}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-indigo-500 font-semibold text-rose-950"
                      placeholder="Temp"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">SpO2 (%)</label>
                    <input
                      type="number"
                      name="vitalSpO2"
                      value={formData.vitalSpO2}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-indigo-500 font-semibold text-rose-950"
                      placeholder="Oxygen Level"
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Respiration Rate (/min)</label>
                    <input
                      type="number"
                      name="vitalRespRate"
                      value={formData.vitalRespRate}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-indigo-500 font-semibold text-rose-950"
                      placeholder="Respiration"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Clinical Summary */}
          {activeTab === 'clinical' && (
            <div className="space-y-5 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Final Diagnosis</label>
                  <input
                    type="text"
                    name="finalDiagnosis"
                    value={formData.finalDiagnosis}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-indigo-500 font-semibold text-gray-900"
                    placeholder="Enter main diagnosis and critical co-morbidities"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Condition at Discharge</label>
                  <select
                    name="conditionAtDischarge"
                    value={formData.conditionAtDischarge}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-indigo-500 font-bold"
                  >
                    <option value="Stable">Stable</option>
                    <option value="Recovered">Recovered</option>
                    <option value="Improving">Improving</option>
                    <option value="Referred">Referred to Tertiary Care</option>
                    <option value="LAMA">LAMA (Left Against Medical Advice)</option>
                  </select>
                </div>
              </div>

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
                <label className="block text-xs font-bold text-gray-700 mb-1">Hospital Course & Clinical Summary</label>
                <textarea
                  name="hospitalCourse"
                  value={formData.hospitalCourse}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-1 focus:ring-indigo-500 leading-relaxed font-sans"
                  rows="6"
                  placeholder="Record summary of treatment, medical course, surgery performed, lab/radiology findings and response to medication during hospital stay..."
                ></textarea>
              </div>
            </div>
          )}

          {/* TAB 3: Medications Grid */}
          {activeTab === 'medications' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center border-b pb-2">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Prescribed Take-home Medications</h4>
                  <p className="text-[11px] text-gray-400">Add all medicines the patient must continue taking after discharge.</p>
                </div>
                <button
                  type="button"
                  onClick={addMedicationRow}
                  className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold hover:bg-indigo-700 transition-colors"
                >
                  <i className="fas fa-plus"></i>Add Drug
                </button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-gray-700 border-b border-gray-200">
                      <th className="p-3 font-bold border-r">Drug Name</th>
                      <th className="p-3 font-bold border-r w-[120px]">Dosage</th>
                      <th className="p-3 font-bold border-r w-[120px]">Route</th>
                      <th className="p-3 font-bold border-r w-[160px]">Frequency</th>
                      <th className="p-3 font-bold border-r w-[110px]">Duration</th>
                      <th className="p-3 font-bold border-r">Instructions</th>
                      <th className="p-3 font-bold text-center w-[50px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.medications.map((med, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-slate-50/50">
                        <td className="p-2 border-r">
                          <input
                            type="text"
                            name="name"
                            value={med.name}
                            onChange={(e) => handleMedicationChange(index, e)}
                            className="w-full border border-gray-300 rounded p-1.5 font-bold"
                            placeholder="e.g. Tab. Amoxicillin"
                            required
                          />
                        </td>
                        <td className="p-2 border-r">
                          <input
                            type="text"
                            name="dosage"
                            value={med.dosage}
                            onChange={(e) => handleMedicationChange(index, e)}
                            className="w-full border border-gray-300 rounded p-1.5"
                            placeholder="e.g. 500 mg"
                          />
                        </td>
                        <td className="p-2 border-r">
                          <select
                            name="route"
                            value={med.route}
                            onChange={(e) => handleMedicationChange(index, e)}
                            className="w-full border border-gray-300 rounded p-1.5"
                          >
                            <option value="Oral">Oral</option>
                            <option value="IV">Intravenous (IV)</option>
                            <option value="Sublingual">Sublingual</option>
                            <option value="Inhalation">Inhalation</option>
                            <option value="Topical">Topical</option>
                            <option value="Subcutaneous">Subcutaneous</option>
                          </select>
                        </td>
                        <td className="p-2 border-r">
                          <select
                            name="frequency"
                            value={med.frequency}
                            onChange={(e) => handleMedicationChange(index, e)}
                            className="w-full border border-gray-300 rounded p-1.5 font-semibold text-blue-900"
                          >
                            <option value="Once daily">Once daily (QD)</option>
                            <option value="Twice daily">Twice daily (BID)</option>
                            <option value="Three times daily">Three times daily (TID)</option>
                            <option value="Four times daily">Four times daily (QID)</option>
                            <option value="Every 4 hours">Every 4 hours</option>
                            <option value="Every 8 hours">Every 8 hours</option>
                            <option value="Once weekly">Once weekly</option>
                            <option value="As needed (SOS)">As needed (SOS)</option>
                            <option value="Before Bedtime">Before Bedtime (HS)</option>
                          </select>
                        </td>
                        <td className="p-2 border-r">
                          <input
                            type="text"
                            name="duration"
                            value={med.duration}
                            onChange={(e) => handleMedicationChange(index, e)}
                            className="w-full border border-gray-300 rounded p-1.5"
                            placeholder="e.g. 5 days"
                          />
                        </td>
                        <td className="p-2 border-r">
                          <input
                            type="text"
                            name="instructions"
                            value={med.instructions}
                            onChange={(e) => handleMedicationChange(index, e)}
                            className="w-full border border-gray-300 rounded p-1.5"
                            placeholder="e.g. Take after meals"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeMedicationRow(index)}
                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded transition-all"
                            title="Remove Medication"
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Advice & Follow-Up */}
          {activeTab === 'advice' && (
            <div className="space-y-5 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">General Discharge Advice & Instructions</label>
                  <textarea
                    name="dischargeInstructions"
                    value={formData.dischargeInstructions}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-indigo-500"
                    rows="4"
                    placeholder="Enter special precautions, diet notes, emergency triggers, activity limitations..."
                  ></textarea>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Follow-up Home Care & Signs of Concern</label>
                  <textarea
                    name="followUpCare"
                    value={formData.followUpCare}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-indigo-500"
                    rows="4"
                    placeholder="Record clinical indicators when they should return immediately (e.g. pain level, heavy bleeding, high fever)..."
                  ></textarea>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-indigo-50/20 p-4 border border-indigo-100/50 rounded-lg">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Follow-up Review Date</label>
                  <input
                    type="date"
                    name="followUpAppointment"
                    value={formData.followUpAppointment}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Consulting Physician</label>
                  <input
                    type="text"
                    name="followUpDoctor"
                    value={formData.followUpDoctor}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-indigo-500"
                    placeholder="Doctor for review appointment"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <div className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 p-2.5 rounded-lg flex items-start gap-1">
                    <i className="fas fa-exclamation-triangle mt-0.5 shrink-0"></i>
                    <span>Review appointments are booked in OPD automatically upon saving this summary.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="flex flex-wrap gap-2 border-t pt-5 justify-between items-center">
            <div className="flex gap-2">
              {activeTab !== 'patient' && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'clinical') setActiveTab('patient');
                    else if (activeTab === 'medications') setActiveTab('clinical');
                    else if (activeTab === 'advice') setActiveTab('medications');
                  }}
                  className="px-4 py-2 border rounded-lg text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition-all"
                >
                  <i className="fas fa-chevron-left mr-1"></i>Previous Step
                </button>
              )}
              {activeTab !== 'advice' && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'patient') setActiveTab('clinical');
                    else if (activeTab === 'clinical') setActiveTab('medications');
                    else if (activeTab === 'medications') setActiveTab('advice');
                  }}
                  className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition-all"
                >
                  Next Step<i className="fas fa-chevron-right ml-1"></i>
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-1 shadow-sm"
              >
                <i className="fas fa-save"></i>Save Summary
              </button>

              {formData.patientName && (
                <>
                  <button
                    type="button"
                    onClick={handlePrintSummary}
                    className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold rounded-lg hover:bg-emerald-700 transition-all flex items-center gap-1 shadow-sm"
                  >
                    <i className="fas fa-print"></i>Print Summary
                  </button>
                  <button
                    type="button"
                    onClick={handleEmailSummary}
                    className="bg-purple-600 text-white px-4 py-2 text-xs font-bold rounded-lg hover:bg-purple-700 transition-all flex items-center gap-1 shadow-sm"
                  >
                    <i className="fas fa-envelope"></i>Email Patient
                  </button>
                </>
              )}

              {formData.patientName && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Reset this form? All unsaved data will be cleared.')) {
                      setFormData(initialFormState);
                      setSelectedPatient(null);
                      setActiveTab('patient');
                    }
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-500 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all"
                >
                  Reset Form
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Saved Records History Table */}
      <div className="bg-white rounded-xl border border-gray-200 card-shadow p-6 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
            <i className="fas fa-history text-indigo-500"></i>
            Saved Discharge Records History
          </h3>
          <p className="text-xs text-gray-500">Below are the saved discharge records. You can load, edit, print, or email them anytime.</p>
        </div>

        {savedSummaries.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-gray-700 border-b border-gray-200 font-bold uppercase text-[10px] tracking-wider">
                  <th className="p-3 border-r">Doc ID</th>
                  <th className="p-3 border-r">Patient Name</th>
                  <th className="p-3 border-r">Discharge Date</th>
                  <th className="p-3 border-r">Physician</th>
                  <th className="p-3 border-r">Diagnosis</th>
                  <th className="p-3 border-r">Vitals (BP/PR/SpO2)</th>
                  <th className="p-3 border-r text-center">Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {savedSummaries.map((summary) => (
                  <tr key={summary.id} className="border-b border-gray-100 hover:bg-slate-50/50">
                    <td className="p-3 border-r font-mono font-bold text-gray-500">{summary.id}</td>
                    <td className="p-3 border-r">
                      <div>
                        <span className="font-bold text-indigo-950 text-sm block">{summary.patientName}</span>
                        <span className="text-[10px] text-gray-400">{summary.age} Yrs • {summary.gender}</span>
                      </div>
                    </td>
                    <td className="p-3 border-r font-medium text-gray-700">
                      {summary.dischargeDate ? new Date(summary.dischargeDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'N/A'}
                    </td>
                    <td className="p-3 border-r text-gray-600 font-semibold">{summary.attendingPhysician}</td>
                    <td className="p-3 border-r text-gray-600 truncate max-w-[200px]" title={summary.finalDiagnosis}>
                      {summary.finalDiagnosis || 'Not recorded'}
                    </td>
                    <td className="p-3 border-r text-slate-800">
                      <div className="flex gap-1.5 font-bold font-mono">
                        <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">{summary.vitalBP}</span>
                        <span className="bg-red-50 text-red-700 px-1.5 py-0.5 rounded border border-red-100">{summary.vitalPulse}</span>
                        <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-100">{summary.vitalSpO2}%</span>
                      </div>
                    </td>
                    <td className="p-3 border-r text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${summary.conditionAtDischarge === 'Stable' || summary.conditionAtDischarge === 'Recovered'
                          ? 'bg-green-100 text-green-800'
                          : summary.conditionAtDischarge === 'Improving'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                        {summary.conditionAtDischarge}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex gap-1.5 justify-center">
                        <button
                          onClick={() => handleEditSummary(summary)}
                          className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100 font-semibold transition-colors flex items-center gap-1"
                          title="Edit Document"
                        >
                          <i className="fas fa-edit"></i>Edit
                        </button>
                        <button
                          onClick={() => {
                            setFormData(summary);
                            setTimeout(() => {
                              setShowPrintModal(true);
                            }, 100);
                          }}
                          className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-100 font-semibold transition-colors flex items-center gap-1"
                          title="Print Document"
                        >
                          <i className="fas fa-print"></i>Print
                        </button>
                        <button
                          onClick={() => handleDeleteSummary(summary.id)}
                          className="bg-rose-50 text-rose-700 px-2 py-1 rounded hover:bg-rose-100 font-semibold transition-colors flex items-center gap-1"
                          title="Delete Document"
                        >
                          <i className="fas fa-trash-alt"></i>Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed rounded-lg border-gray-200">
            <i className="fas fa-file-invoice text-gray-300 text-4xl mb-2 block"></i>
            <span className="text-sm font-semibold text-gray-400 block">No saved discharge history records found.</span>
            <span className="text-xs text-gray-400">Prepare and save a summary above to populate history.</span>
          </div>
        )}
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
        title="Official Discharge Sheet Print Preview"
        size="xl"
      >
        <div className="space-y-6">
          {/* Printable Document Box */}
          <div id="print-discharge-summary-document" className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 font-sans text-gray-800">

            {/* Logo and Hospital Letterhead */}
            <div className="flex justify-between items-center border-b-2 border-indigo-600 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
                  <i className="fas fa-hospital-alt"></i>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 tracking-wide leading-none mb-1">MEDICLOUD HOSPITAL</h1>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">24/7 Patient-Centric Clinical Excellence</p>
                </div>
              </div>
              <div className="text-right text-[10px] text-gray-500 leading-normal">
                <p className="font-bold text-gray-700">123 Healthcare Blvd, Medical District</p>
                <p>Phone: +1 (555) 019-2834 | Email: info@medicloud.com</p>
                <p>www.medicloudhospital.com</p>
              </div>
            </div>

            {/* Document Subhead */}
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold text-indigo-800 tracking-widest border-b pb-1 inline-block uppercase">PATIENT DISCHARGE SUMMARY</h2>
            </div>

            {/* Patient Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg text-xs border border-slate-100 mb-6">
              <div>
                <span className="text-gray-400 block uppercase tracking-wider font-bold text-[9px] mb-0.5">Patient Name</span>
                <span className="font-bold text-gray-900 text-sm block">{formData.patientName || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-400 block uppercase tracking-wider font-bold text-[9px] mb-0.5">Patient ID / MRN</span>
                <span className="font-bold text-gray-900 text-sm block">{formData.patientId || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-400 block uppercase tracking-wider font-bold text-[9px] mb-0.5">Age / Gender</span>
                <span className="font-bold text-gray-900 text-sm block">{formData.age ? `${formData.age} Yrs` : 'N/A'} / {formData.gender}</span>
              </div>
              <div>
                <span className="text-gray-400 block uppercase tracking-wider font-bold text-[9px] mb-0.5">Room / Bed No.</span>
                <span className="font-bold text-gray-900 text-sm block">{formData.roomBed || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-400 block uppercase tracking-wider font-bold text-[9px] mb-0.5">Admission Date</span>
                <span className="font-bold text-gray-900 text-sm block">
                  {formData.admissionDate ? new Date(formData.admissionDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block uppercase tracking-wider font-bold text-[9px] mb-0.5">Discharge Date</span>
                <span className="font-bold text-gray-900 text-sm block">
                  {formData.dischargeDate ? new Date(formData.dischargeDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block uppercase tracking-wider font-bold text-[9px] mb-0.5">Attending Physician</span>
                <span className="font-bold text-gray-900 text-sm block">{formData.attendingPhysician || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-400 block uppercase tracking-wider font-bold text-[9px] mb-0.5">Discharge Condition</span>
                <span className="font-bold text-emerald-700 text-sm block uppercase tracking-wider">{formData.conditionAtDischarge || 'Stable'}</span>
              </div>
            </div>

            {/* Vitals Summary Grid */}
            <div className="mb-6 border rounded-lg p-3 bg-slate-50/20">
              <h3 className="text-[10px] uppercase font-bold text-indigo-700 tracking-widest border-b pb-1 mb-3">VITAL SIGNS AT DISCHARGE</h3>
              <div className="grid grid-cols-5 gap-3 text-center">
                <div className="border rounded p-2 bg-white">
                  <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Blood Pressure</p>
                  <p className="font-mono font-bold text-gray-900 text-sm">{formData.vitalBP || 'N/A'} <span className="text-[9px] font-normal text-gray-500">mmHg</span></p>
                </div>
                <div className="border rounded p-2 bg-white">
                  <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Pulse Rate</p>
                  <p className="font-mono font-bold text-gray-900 text-sm">{formData.vitalPulse || 'N/A'} <span className="text-[9px] font-normal text-gray-500">bpm</span></p>
                </div>
                <div className="border rounded p-2 bg-white">
                  <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Temperature</p>
                  <p className="font-mono font-bold text-gray-900 text-sm">{formData.vitalTemp || 'N/A'} <span className="text-[9px] font-normal text-gray-500">°F</span></p>
                </div>
                <div className="border rounded p-2 bg-white">
                  <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">SpO2 Level</p>
                  <p className="font-mono font-bold text-gray-900 text-sm">{formData.vitalSpO2 || 'N/A'} <span className="text-[9px] font-normal text-gray-500">%</span></p>
                </div>
                <div className="border rounded p-2 bg-white">
                  <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Respiration</p>
                  <p className="font-mono font-bold text-gray-900 text-sm">{formData.vitalRespRate || 'N/A'} <span className="text-[9px] font-normal text-gray-500">/min</span></p>
                </div>
              </div>
            </div>

            {/* Diagnosis & Course info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="border rounded-lg p-3 bg-white">
                <h3 className="text-[10px] uppercase font-bold text-indigo-700 tracking-widest border-b pb-1 mb-2">FINAL CLINICAL DIAGNOSIS</h3>
                <p className="text-sm font-bold text-gray-900 whitespace-pre-line leading-relaxed">{formData.finalDiagnosis || 'Not specified'}</p>
              </div>
              <div className="border rounded-lg p-3 bg-white">
                <h3 className="text-[10px] uppercase font-bold text-indigo-700 tracking-widest border-b pb-1 mb-2">HOSPITAL COURSE SUMMARY</h3>
                <p className="text-xs leading-relaxed text-gray-700 whitespace-pre-line font-medium">{formData.hospitalCourse || 'No course summaries recorded.'}</p>
              </div>
            </div>

            {/* Medications Table */}
            <div className="mb-6">
              <h3 className="text-[10px] uppercase font-bold text-indigo-700 tracking-widest border-b pb-1 mb-2">DISCHARGE MEDICATIONS FOR HOME ADMINISTRATION</h3>
              {formData.medications && formData.medications.length > 0 && formData.medications[0].name.trim() !== '' ? (
                <table className="w-full text-xs text-left border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-200 text-gray-800">
                      <th className="p-2 border-r font-bold">Medication Name</th>
                      <th className="p-2 border-r font-bold w-[100px]">Dosage</th>
                      <th className="p-2 border-r font-bold w-[80px]">Route</th>
                      <th className="p-2 border-r font-bold w-[130px]">Frequency</th>
                      <th className="p-2 border-r font-bold w-[80px]">Duration</th>
                      <th className="p-2 font-bold">Special Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.medications.map((med, index) => (
                      med.name.trim() !== '' && (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="p-2 border-r font-bold text-gray-900">{med.name}</td>
                          <td className="p-2 border-r">{med.dosage}</td>
                          <td className="p-2 border-r">{med.route}</td>
                          <td className="p-2 border-r font-semibold text-blue-900">{med.frequency}</td>
                          <td className="p-2 border-r">{med.duration}</td>
                          <td className="p-2 italic text-gray-500">{med.instructions}</td>
                        </tr>
                      )
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-xs text-gray-500 italic">No take-home medications specified.</p>
              )}
            </div>

            {/* Care Instructions & Follow-up Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="border rounded-lg p-3 bg-white">
                <h3 className="text-[10px] uppercase font-bold text-indigo-700 tracking-widest border-b pb-1 mb-2">PATIENT CARE DIRECTIVES</h3>
                <div className="text-xs text-gray-700 space-y-1.5 leading-relaxed font-medium">
                  <p><strong>Discharge Advice:</strong> {formData.dischargeInstructions || 'None specified'}</p>
                  <p><strong>Home Care Limits:</strong> {formData.followUpCare || 'None specified'}</p>
                </div>
              </div>
              <div className="border rounded-lg p-3 bg-white">
                <h3 className="text-[10px] uppercase font-bold text-indigo-700 tracking-widest border-b pb-1 mb-2">FOLLOW-UP OPD CLINIC DETAILS</h3>
                <div className="text-xs text-gray-700 space-y-1.5 leading-relaxed font-medium">
                  <p><strong>Scheduled Appointment:</strong> <span className="font-bold text-indigo-900">{formData.followUpAppointment ? new Date(formData.followUpAppointment).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'No appointment scheduled'}</span></p>
                  <p><strong>Consulting Physician:</strong> <span className="font-bold text-gray-900">{formData.followUpDoctor}</span></p>
                  <p className="text-[9px] text-red-500 font-bold mt-1.5 leading-normal">
                    ⚠️ CRITICAL RED FLAGS: Please report to emergency or call primary doctors immediately if the patient experiences severe abdominal pain, persistent high fever, chest pressure, severe breath shortness, or bleeding.
                  </p>
                </div>
              </div>
            </div>

            {/* Standard Signature Block */}
            <div className="mt-12 border-t pt-4">
              <div className="flex justify-between items-center text-xs text-gray-600">
                <div className="text-center w-1/3">
                  <p className="italic text-gray-400 mb-8">(Generated electronically by nursing staff)</p>
                  <div className="border-t border-gray-300 pt-1 font-bold text-gray-800">Assigned Ward Nurse</div>
                </div>
                <div className="w-1/4"></div>
                <div className="text-center w-1/3">
                  <p className="h-8 mb-8"></p>
                  <div className="border-t border-gray-300 pt-1 font-bold text-gray-800">Authorized Medical Officer</div>
                  <p className="font-semibold text-gray-700">{formData.attendingPhysician}</p>
                </div>
              </div>
            </div>

          </div>

          {/* Action Row */}
          <div className="flex justify-end gap-2 shrink-0 border-t pt-4">
            <button
              onClick={() => setShowPrintModal(false)}
              className="px-4 py-2 border rounded-lg text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Close Preview
            </button>
            <button
              onClick={handleActualPrint}
              className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <i className="fas fa-print"></i>Print Discharge Sheet
            </button>
          </div>
        </div>
      </Modal>

      {/* Email Modal */}
      <Modal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        title="Email Discharge Summary to Patient"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Recipient Email Address</label>
            <input
              type="email"
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-indigo-500"
              placeholder="patient@example.com"
              defaultValue={`${formData.patientName ? formData.patientName.toLowerCase().replace(' ', '') : 'patient'}@example.com`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-indigo-500"
              defaultValue={`Official Patient Discharge Summary: ${formData.patientName || 'Patient'}`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Email Body Message</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-indigo-500 leading-relaxed font-sans"
              rows="8"
              defaultValue={`Dear ${formData.patientName || 'Patient'},

Please find attached your official Discharge Summary report generated from your hospital stay at MediCloud Hospital.

KEY DISCHARGE SUMMARY:
- Patient Name: ${formData.patientName || 'N/A'}
- Discharge Date: ${formData.dischargeDate ? new Date(formData.dischargeDate).toLocaleDateString() : 'N/A'}
- Attending Physician: ${formData.attendingPhysician || 'N/A'}
- Follow-up Review: ${formData.followUpAppointment ? new Date(formData.followUpAppointment).toLocaleDateString() : 'Not scheduled'} with ${formData.followUpDoctor}

RECOMMENDATION NOTE:
Please carefully read and follow the take-home medication schedule and care directives enclosed in the attached document.

In case of any fever, bleeding, acute pain, or other symptoms of concern, contact our round-the-clock patient desk at +1 (555) 019-2834 or visit emergency immediately.

Best Regards,
MediCloud Hospital Patient Relations Desk
123 Healthcare Blvd, Medical District`}
            ></textarea>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 p-3.5 rounded-lg flex items-start gap-2 text-xs">
            <i className="fas fa-info-circle text-indigo-700 mt-0.5"></i>
            <span className="text-indigo-800">
              A high-fidelity PDF copy of the discharge summary (including diagnosed results, vital indicators, and home medication charts) will be automatically generated and attached.
            </span>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <button
              onClick={() => setShowEmailModal(false)}
              className="px-4 py-2 border rounded-lg text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSendEmail}
              className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <i className="fas fa-paper-plane"></i>Send Summary Email
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DischargeSummary;