import React, { useState, useEffect, useRef } from 'react';
import LoadingSpinner from '../../../../components/common/LoadingSpinner/LoadingSpinner';
import Modal from '../../../../components/common/Modal/Modal';
import {
  KeyboardArrowDown as KeyboardArrowDownIcon, Search as SearchIcon, Print as PrintIcon,
  CheckCircle as CheckCircleIcon, ConfirmationNumber as ConfirmationNumberIcon,
  MedicalServices as MedicalServicesIcon, Person as PersonIcon,
  AccessTime as AccessTimeIcon, Warning as WarningIcon, PersonAdd as PersonAddIcon,
  PlayArrow as PlayArrowIcon, SwapHoriz as SwapHorizIcon, Visibility as VisibilityIcon,
  Close as CloseIcon, PowerSettingsNew as PowerSettingsNewIcon, Check as CheckIcon,
  Add as AddIcon, Description as DescriptionIcon,
  Groups as GroupsIcon, PendingActions as PendingActionsIcon, TaskAlt as TaskAltIcon,
  Delete as DeleteIcon, CalendarMonth as CalendarMonthIcon, Payments as PaymentsIcon,
  Timeline as TimelineIcon, ReceiptLong as ReceiptLongIcon,
  Science as ScienceIcon, Medication as MedicationIcon, Assessment as AssessmentIcon,
  Edit as EditIcon, ExitToApp as ExitToAppIcon, Info as InfoIcon,
  HistoryEdu as HistoryEduIcon
} from '@mui/icons-material';
import { apiFetch } from '../../../../services/apiClient';
import { toast } from 'react-toastify';
import {
  DEPARTMENT_LIST,
  DOCTOR_LIST,
  DEPARTMENT_DOCTORS,
  RECEPTIONIST_PATIENT_SEARCH,
  OPD_TOKENS, 
  OPD_PATIENT_STATUS, OPD_PATIENT_DELETE, 
  OPD_DOCTOR_TOGGLE_STATUS, OPD_CONSULTATION_START, 
  OPD_CONSULTATION_COMPLETE, 
  OPD_TRANSFER
} from '../../../../config/api';


const OPDManagement = () => {
  const [loading, setLoading] = useState(true);
  const [opdPatients, setOpdPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [showConsultationForm, setShowConsultationForm] = useState(false);

  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenStep, setTokenStep] = useState('form'); // 'form' or 'slip'
  const [generatedToken, setGeneratedToken] = useState(null);
  const [activeTab, setActiveTab] = useState('patients');
  const [opdStats, setOpdStats] = useState({ total_queue: 0, waiting: 0, in_consultation: 0, completed: 0 });
  const [selectedPatient, setSelectedPatient] = useState(null);
  // View Patient Details State
  const [showViewPatientModal, setShowViewPatientModal] = useState(false);
  const [selectedPatientForView, setSelectedPatientForView] = useState(null);
  // Transfer Patient Modal State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferPatient, setTransferPatient] = useState(null);
  const [selectedTransferDoctor, setSelectedTransferDoctor] = useState(null);
  // Deactivate Doctor Modal State
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [doctorToDeactivate, setDoctorToDeactivate] = useState(null);
  const [patientsToReassign, setPatientsToReassign] = useState([]);
  const [showLabResultModal, setShowLabResultModal] = useState(false);
  const [selectedLabRecord] = useState(null);
  const [showQueueDetailModal, setShowQueueDetailModal] = useState(false);
  const [selectedQueuePatient, setSelectedQueuePatient] = useState(null);
  const [showPharmacyModal, setShowPharmacyModal] = useState(false);
  const [selectedPharmacyRecord] = useState(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [selectedExitPatient, setSelectedExitPatient] = useState(null);
  const [exitForm, setExitForm] = useState({
    billingStatus: 'Pending',
    followUpRequired: false,
    followUpDate: '',
    remarks: ''
  });
  // Token Form State
  const [tokenForm, setTokenForm] = useState({
    uhid: '',
    visitId: '',
    tokenNumber: '',
    queueNumber: '',
    patientId: '',
    patientName: '',
    age: '',
    gender: 'Male',
    bloodGroup: '',
    phoneNo: '',
    email: '',
    address: '',
    department: '',
    doctorId: '',
    visitType: 'New',
    appointmentType: 'Walk-in',
    priority: 'Normal',
    arrivalTime: '',
    estimatedWaitTime: '',
    queuePosition: 0,
    tokenStatus: 'Waiting',
    referredBy: ''
  });

  const [apiDepartments, setApiDepartments] = useState([]);
  const [deptDoctors, setDeptDoctors] = useState([]);
  const [loadingDeptDoctors, setLoadingDeptDoctors] = useState(false);

  // Searchable Dropdown State for Token Creation
  const [deptSearchTerm, setDeptSearchTerm] = useState('');
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
  const deptDropdownRef = useRef(null);
  const [docSearchTerm, setDocSearchTerm] = useState('');
  const [isDocDropdownOpen, setIsDocDropdownOpen] = useState(false);
  const docDropdownRef = useRef(null);

  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const patientDropdownRef = useRef(null);
  const [registeredPatients, setRegisteredPatients] = useState([]);
  // State for Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentPatient, setSelectedPaymentPatient] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentBillingData, setPaymentBillingData] = useState({
    token: '',
    patientName: '',
    patientId: '',
    age: '',
    gender: 'Male',
    email: '',
    doctor: '',
    consultationFee: 0,
    labTests: []
  });

  const updatePaymentBillingData = (field, value) => {
    setPaymentBillingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addPaymentLabTest = () => {
    setPaymentBillingData(prev => ({
      ...prev,
      labTests: [...prev.labTests, { name: '', fee: 0 }]
    }));
  };

  const updatePaymentLabTest = (index, field, value) => {
    setPaymentBillingData(prev => {
      const updatedTests = [...prev.labTests];
      updatedTests[index] = { ...updatedTests[index], [field]: value };
      return { ...prev, labTests: updatedTests };
    });
  };

  const removePaymentLabTest = (index) => {
    setPaymentBillingData(prev => ({
      ...prev,
      labTests: prev.labTests.filter((_, i) => i !== index)
    }));
  };
  const calculatePaymentTotal = () => {
    const consultation = parseFloat(paymentBillingData.consultationFee) || 0;
    const tests = paymentBillingData.labTests.reduce((sum, test) => sum + (parseFloat(test.fee) || 0), 0);
    return (consultation + tests).toFixed(2);
  };
  const [patientQueueSearch, setPatientQueueSearch] = useState('');
  const [billingSearch, setBillingSearch] = useState('');
  const [exitSearch, setExitSearch] = useState('');
  // Helper function for dynamic waiting time
  const calculateWaitingTime = (queuePosition) => {
    const baseTimePerPatient = 15; // average minutes per patient
    const time = queuePosition * baseTimePerPatient;
    return time > 0 ? `${time} mins` : 'Immediate';
  };
  const [consultationForm, setConsultationForm] = useState({
    patientId: '',
    doctorId: '',
    consultationType: 'New',
    vitalSigns: {
      bp: '',
      pulse: '',
      temperature: '',
      spo2: '',
      weight: '',
      height: '',
      respiratoryRate: '',
      bmi: '',
      bloodSugar: '',
      painScore: ''
    },
    symptoms: '',
    history: '',
    allergies: '',
    examination: '',
    diagnosis: '',
    diagnosisCode: '',
    clinicalNotes: '',
    medications: [
      {
        name: '',
        genericName: '',
        dosage: '',
        route: '',
        duration: '',
        beforeFood: false,
        afterFood: false,
        frequency: {
          morning: false,
          afternoon: false,
          night: false
        },
        instructions: ''
      }
    ],
    testsRecommended: [
      {
        id: 1,
        description: '',
        samples: '',
        labStatus: 'Ordered',
        sampleCollected: false,
        sampleCollectedAt: '',
        labTechnician: '',
        resultValue: '',
        referenceRange: '',
        remarks: '',
        reportFile: '',
        verifiedBy: '',
        verifiedAt: ''
      }
    ],
    instructions: '',
    followUpRequired: false,
    followUpDate: '',
    consultationStatus: 'Pending',
    consultationStartTime: '',
    consultationEndTime: '',
    remarks: ''
  });

  useEffect(() => {
    loadOPDData();
  }, []);

  // Debounced patient search from API
  useEffect(() => {
    if (!patientSearchTerm.trim()) {
      loadApiPatients('');
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      loadApiPatients(patientSearchTerm);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [patientSearchTerm]);

  // Fetch department specific doctors dynamically
  useEffect(() => {
    const fetchDeptDoctors = async () => {
      if (!tokenForm.department) {
        setDeptDoctors([]);
        return;
      }

      setLoadingDeptDoctors(true);
      try {
        // Find the department object to get its ID
        const deptObj = apiDepartments.find(d => 
          (typeof d === 'object' ? (d.name || d.department_name) : d) === tokenForm.department
        );

        if (deptObj && deptObj.id) {
          const res = await apiFetch(DEPARTMENT_DOCTORS(deptObj.id));
          if (res.ok) {
            const data = await res.json();
            const rawDoctors = data.data?.doctors || data.data || data || [];
            const mapped = Array.isArray(rawDoctors) ? rawDoctors.map(d => ({
              id: d.id || d.doctor_id || `D-${Math.floor(100 + Math.random() * 900)}`,
              name: d.name || `Dr. ${d.first_name || ''} ${d.last_name || ''}`.trim() || 'Dr. Unknown',
              department: tokenForm.department,
              isActive: d.status?.toLowerCase() === 'active' || d.isActive || true,
              queue: d.queue || 0
            })) : [];
            setDeptDoctors(mapped);
            return;
          }
        }
      } catch (err) {
        console.error('Error fetching department doctors:', err);
      } finally {
        setLoadingDeptDoctors(false);
      }

      // Fallback: use global doctors list filtered by department name
      const fallbackDocs = doctors.filter(d => 
        String(d.department).toLowerCase().trim() === String(tokenForm.department).toLowerCase().trim()
      );
      setDeptDoctors(fallbackDocs);
    };

    fetchDeptDoctors();
  }, [tokenForm.department, apiDepartments, doctors]);

  // Update doctor queues when patients change
  useEffect(() => {
    if (opdPatients.length > 0) {
      setDoctors(prevDoctors => prevDoctors.map(doctor => ({
        ...doctor,
        queue: opdPatients.filter(p =>
          p.assignedDoctorId === doctor.id &&
          ['Token Generated', 'Waiting', 'Vitals Completed', 'Lab Ordered'].includes(p.status)
        ).length,
        currentPatient: opdPatients.find(p => p.assignedDoctorId === doctor.id && p.status === 'In Consultation')?.token || null,
        currentPatientName: opdPatients.find(p => p.assignedDoctorId === doctor.id && p.status === 'In Consultation')?.patientName || null
      })));
    }
  }, [opdPatients]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(event.target)) {
        setIsDeptDropdownOpen(false);
      }
      if (docDropdownRef.current && !docDropdownRef.current.contains(event.target)) {
        setIsDocDropdownOpen(false);
      }
      if (patientDropdownRef.current && !patientDropdownRef.current.contains(event.target)) {
        setIsPatientDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const DEPARTMENTS = apiDepartments.length > 0
    ? [...new Set(apiDepartments.map(d => typeof d === 'object' ? (d.name || d.department_name) : d).filter(Boolean))]
    : [...new Set(doctors.map(d => d.department).filter(Boolean))];
  const AVAILABLE_DOCTORS = doctors;

  const TEST_PRICES = {
    'Blood Test': 250,
    'CBC': 300,
    'Lipid Profile': 500,
    'Blood Sugar': 150,
    'X-Ray': 600,
    'ECG': 400,
    'MRI': 3500,
    'Ultrasound': 1200,
    'CT Scan': 4500,
    'Urine Test': 200,
    'Biopsy': 1500,
    'Other': 500
  };

  const SURGERY_PRICES = {
    'Minor Surgery': 5000,
    'Stitching': 1500,
    'Cataract': 15000,
    'Appendix': 25000,
    'Dental Extraction': 2000
  };

  const handleSelectDept = (dept) => {
    setTokenForm({
      ...tokenForm,
      department: dept,
      doctorId: ''
    });
    setDeptSearchTerm(dept);
    setDocSearchTerm('');
    setIsDeptDropdownOpen(false);
  };

  const handleSelectDoc = (doc) => {
    setTokenForm({
      ...tokenForm,
      doctorId: doc.id
    });
    setDocSearchTerm(doc.name);
    setIsDocDropdownOpen(false);
  };

  const handleSelectPatient = (patient) => {
    setTokenForm({
      ...tokenForm,
      patientId: patient.id,
      patientName: patient.name,
      phoneNo: patient.phoneNo,
      email: patient.email,
      age: patient.age,
      gender: patient.gender,
      bloodGroup: patient.bloodGroup,
      address: patient.address
    });
    setPatientSearchTerm(patient.name);
    setIsPatientDropdownOpen(false);
  };

  const filteredDepartments = DEPARTMENTS.filter(dept =>
    dept.toLowerCase().includes(deptSearchTerm.toLowerCase())
  );

  const filteredDoctorsForToken = deptDoctors.filter(d =>
    d.isActive &&
    d.name.toLowerCase().includes(docSearchTerm.toLowerCase())
  );

  const calculateAge = (dobString) => {
    if (!dobString) return '';
    const dob = new Date(dobString);
    const diffMs = Date.now() - dob.getTime();
    const ageDate = new Date(diffMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970).toString();
  };

  const loadApiPatients = async (query = '') => {
    try {
      let url = RECEPTIONIST_PATIENT_SEARCH;
      if (query) {
        url += `?query=${encodeURIComponent(query)}`;
      } else {
        url += `?limit=100`;
      }
      const res = await apiFetch(url);
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const patientsList = data.data?.patients || data.data || [];
        const formattedPatients = patientsList.map(patient => {
          const age = patient.age || calculateAge(patient.date_of_birth) || '30';
          return {
            id: patient.patient_id || patient.patient_ref || patient.id || `PAT-${Math.floor(1000 + Math.random() * 9000)}`,
            name: patient.name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Unknown Patient',
            phoneNo: patient.phone || patient.phoneNo || 'Not specified',
            email: patient.email || 'Not specified',
            age: age.toString(),
            gender: patient.gender ? (patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1).toLowerCase()) : 'Male',
            bloodGroup: patient.bloodGroup || patient.blood_group || 'O+',
            address: patient.address || patient.residential_address || 'Not specified'
          };
        });
        setRegisteredPatients(formattedPatients);
      }
    } catch (e) {
      console.error('Error fetching patients:', e);
    }
  };

  const loadOPDData = async () => {
    setLoading(true);
    try {

      // Fetch departments from live API
      let fetchedDeptList = [];
      try {
        const deptRes = await apiFetch(DEPARTMENT_LIST);
        const deptData = await deptRes.json().catch(() => ({}));
        const deptList = deptData.data?.departments || deptData.data || deptData || [];
        fetchedDeptList = Array.isArray(deptList) ? deptList : [];
        setApiDepartments(fetchedDeptList);
      } catch (deptErr) {
        console.error('Error fetching departments:', deptErr);
      }

      // 1. Fetch doctors from live API
      let doctorsList = [];
      try {
        const docRes = await apiFetch(DOCTOR_LIST);
        const docData = await docRes.json().catch(() => ({}));
        doctorsList = docData.data?.items || docData.items || docData.data?.doctors || docData.data || docData || [];
        if (!Array.isArray(doctorsList) && doctorsList.items) doctorsList = doctorsList.items;
        if (!Array.isArray(doctorsList) && doctorsList.data) doctorsList = doctorsList.data;
      } catch (err) {
        console.error('Error fetching DOCTOR_LIST:', err);
      }

      // FALLBACK: If DOCTOR_LIST is empty, build it by fetching each department's doctors
      if ((!Array.isArray(doctorsList) || doctorsList.length === 0) && fetchedDeptList.length > 0) {
        try {
          const promises = fetchedDeptList.map(async (dept) => {
            const id = typeof dept === 'object' ? (dept.id || dept.department_id || dept.name) : dept;
            if (!id) return [];
            try {
              const res = await apiFetch(DEPARTMENT_DOCTORS(id));
              if (res.ok) {
                const data = await res.json();
                let dList = data.data?.doctors || data.data || data || [];
                if (!Array.isArray(dList) && dList.items) dList = dList.items;
                return Array.isArray(dList) ? dList : [];
              }
            } catch (e) {
              console.error('Error fetching fallback doctors:', e);
            }
            return [];
          });
          const results = await Promise.all(promises);
          const rawDocs = results.flat();
          
          // Deduplicate doctors by id or name
          const uniqueDocs = [];
          const seenIds = new Set();
          for (const doc of rawDocs) {
             const docId = doc.id || doc.doctor_id || doc.doctor_user_id || doc.name;
             if (!seenIds.has(docId)) {
               seenIds.add(docId);
               uniqueDocs.push(doc);
             }
          }
          doctorsList = uniqueDocs;
        } catch (fallbackErr) {
          console.error('Fallback doctor fetch failed:', fallbackErr);
        }
      }

      const mappedDoctors = Array.isArray(doctorsList) ? doctorsList.map(d => {
        let deptName = 'General Medicine';
        if (d.department) {
          if (typeof d.department === 'object') {
            deptName = d.department.name || d.department.department_name || 'General Medicine';
          } else {
            deptName = d.department;
          }
        } else if (d.department_name) {
          if (typeof d.department_name === 'object') {
            deptName = d.department_name.name || d.department_name.department_name || 'General Medicine';
          } else {
            deptName = d.department_name;
          }
        }
        return {
          id: d.id || d.doctor_id || `D-${Math.floor(100 + Math.random() * 900)}`,
          name: d.name || `Dr. ${d.first_name || ''} ${d.last_name || ''}`.trim() || 'Dr. Unknown',
          department: deptName,
          opdRoom: d.opdRoom || d.room || d.opd_room || `Room ${Math.floor(101 + Math.random() * 20)}`,
          specialization: d.specialization || d.doctor_specialization || 'General Physician',
          qualification: d.qualification || 'MBBS',
          email: d.email || 'doctor@health.com',
          contact: d.phone || d.contact || '+91 9999999999',
          isActive: d.status?.toLowerCase() === 'active' || d.isActive || true,
          currentPatient: null,
          queue: 0,
          maxPatientsPerDay: d.maxPatientsPerDay || d.max_patients || 30,
          consultationFee: d.consultationFee || d.consulting_fee || 300,
          workingHours: d.workingHours || d.working_hours || '9:00 AM - 5:00 PM',
          rating: d.rating || 4.5,
          experience: d.experience ? `${d.experience} ${d.experienceUnit || 'years'}` : '10 years'
        };
      }) : [];

      // 2. Fetch OPD tokens (patients in queue)
      const tokenRes = await apiFetch(OPD_TOKENS);
      const tokenData = await tokenRes.json().catch(() => ({}));
      const tokensList = tokenData.data?.items || tokenData.items || tokenData.data || tokenData || [];

      const initialPatients = Array.isArray(tokensList) ? tokensList.map((t, idx) => {
        const rawStatus = String(t.status || t.tokenStatus || 'WAITING');
        const formattedStatus = rawStatus === 'IN_CONSULTATION' ? 'In Consultation' : (rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase());
        
        const assignedDocId = t.doctorId || t.doctor_id || t.doctor_user_id || 'Unknown';
        const foundDoc = mappedDoctors.find(d => String(d.id) === String(assignedDocId));
        const doctorName = (foundDoc ? foundDoc.name : null) || t.doctorName || t.doctor_name || 'Dr. Unknown';

        return {
          id: t.id || `OPD-${idx}`,
          visitId: t.id || t.visit_id || t.opd_ref,
          opdRef: t.opd_ref || '',
          patientId: t.patientId || t.patient_profile_id || t.patient_id || 'Unknown',
          patientName: t.patientName || t.patient_name || 'Unknown Patient',
          age: t.age || 0,
          gender: t.gender || 'Male',
          token: t.tokenNumber || t.token_no || t.token_number || `T-${idx + 100}`,
          waitingTime: t.waiting_time !== undefined ? t.waiting_time : calculateWaitingTime(idx + 1),
          status: formattedStatus,
          assignedDoctorId: assignedDocId,
          doctor: doctorName,
          department: t.department || t.department_name || (foundDoc ? foundDoc.department : 'General'),
          priority: t.priority || 'Normal',
          queuePosition: t.queue_position !== undefined ? t.queue_position : idx + 1,
          arrivalTime: t.arrivalTime || t.arrival_time || '09:00 AM',
          bloodGroup: t.bloodGroup || t.blood_group || 'O+',
          visitType: t.visitType || t.visit_type || 'New',
          phoneNo: t.phoneNo || t.phone_no || t.phone || 'Not specified'
        };
      }) : [];

      const doctorsWithQueue = mappedDoctors.map(doctor => {
        const waitingPatients = initialPatients.filter(
          p => p.assignedDoctorId === doctor.id && p.status === 'WAITING' || p.status === 'Waiting'
        );
        const inConsultationPatient = initialPatients.find(
          p => p.assignedDoctorId === doctor.id && p.status === 'IN_CONSULTATION' || p.status === 'In Consultation'
        );

        return {
          ...doctor,
          queue: waitingPatients.length,
          currentPatient: inConsultationPatient?.token || null,
          currentPatientName: inConsultationPatient?.patientName || null
        };
      });

      setDoctors(doctorsWithQueue);
      setOpdPatients(initialPatients);

      // Dynamically calculate actual exact stats from the loaded patients
      setOpdStats({
        total_queue: initialPatients.filter(p => p.status !== 'Cancelled').length,
        waiting: initialPatients.filter(p => p.status === 'Waiting' || p.status === 'WAITING').length,
        in_consultation: initialPatients.filter(p => p.status === 'In Consultation' || p.status === 'IN_CONSULTATION').length,
        completed: initialPatients.filter(p => p.status === 'Completed' || p.status === 'COMPLETED' || p.status === 'Exited').length
      });

      // 3. Load initial patients for dropdown
      await loadApiPatients('');
    } catch (e) {
      console.error('Error loading live OPD data:', e);
      toast.error('Failed to load OPD data');
    } finally {
      setLoading(false);
    }
  };

  // Open Payment Modal
  const handleOpenPaymentModal = (patient) => {
    setSelectedPaymentPatient(patient);
    const doc = doctors.find(d => d.id === patient.assignedDoctorId);
    // Add realistic dummy data if patient data is minimal
    const dummyTests = patient.tests && patient.tests.length > 0
      ? patient.tests.map(t => ({ name: t, fee: TEST_PRICES[t] || 450 }))
      : [
        { name: 'Complete Blood Count (CBC)', fee: 450 },
        { name: 'Liver Function Test (LFT)', fee: 850 }
      ];

    setPaymentBillingData({
      token: patient.token || 'TK-782',
      patientName: patient.patientName || 'Aditya Sharma',
      patientId: patient.patientId || 'UHID-2024-0012',
      age: patient.age || '32',
      gender: patient.gender || 'Male',
      email: patient.email || 'aditya.sharma@example.com',
      doctor: patient.doctor || doc?.name || 'Dr. Sameer Varma',
      consultationFee: doc?.consultationFee || 500,
      labTests: dummyTests
    });

    setShowPaymentModal(true);
  };

  const handleProcessPaymentWithModal = async () => {
    setPaymentProcessing(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    // Update patient status
    setOpdPatients(prev => prev.map(p =>
      p.id === selectedPaymentPatient.id ? {
        ...p,
        status: 'Completed',
        patientName: paymentBillingData.patientName,
        age: paymentBillingData.age,
        gender: paymentBillingData.gender,
        email: paymentBillingData.email,
        doctor: paymentBillingData.doctor,
        tests: paymentBillingData.labTests.map(t => t.name)
      } : p
    ));

    setPaymentProcessing(false);
    setShowPaymentModal(false);

    // Show success message
    alert(`Payment of ₹${calculatePaymentTotal()} received successfully from ${paymentBillingData.patientName}`);

    // Optional: Print receipt automatically
    if (window.confirm('Would you like to print the receipt?')) {
      handlePrintInvoice({
        ...selectedPaymentPatient,
        ...paymentBillingData,
        status: 'Completed'
      });
    }
  };

  const handleStartConsultation = (patient) => {
    setSelectedPatient(patient);
    setConsultationForm({
      ...consultationForm,
      patientId: patient.patientId,
      doctorId: patient.assignedDoctorId,
      consultationType: patient.status === 'Completed' ? 'Follow-up' : 'New',
      vitalSigns: patient.vitals ? { ...consultationForm.vitalSigns, ...patient.vitals } : consultationForm.vitalSigns,
      diagnosis: patient.diagnosis || '',
      diagnosisCode: patient.diagnosisCode || '',
      clinicalNotes: patient.clinicalNotes || '',
      medications: patient.medicationList || [
        {
          name: '',
          genericName: '',
          dosage: '',
          route: '',
          duration: '',
          beforeFood: false,
          afterFood: false,
          frequency: { morning: false, afternoon: false, night: false },
          instructions: ''
        }
      ],
      symptoms: patient.symptoms || '',
      history: patient.history || '',
      allergies: patient.allergies || '',
      instructions: patient.advice || '',
      followUpRequired: patient.followUpRequired || false,
      followUpDate: patient.followUpDate || '',
      consultationStatus: patient.status === 'Completed' ? 'Completed' : 'Pending',
      consultationStartTime: new Date().toLocaleTimeString(),
      testsRecommended: (patient.tests || []).map((t, i) => ({
        id: i + 1,
        description: t,
        samples: 'Not specified',
        labStatus: 'Ordered',
        sampleCollected: false,
        sampleCollectedAt: '',
        labTechnician: '',
        resultValue: '',
        referenceRange: '',
        remarks: '',
        reportFile: '',
        verifiedBy: '',
        verifiedAt: ''
      })).concat(patient.tests?.length ? [] : [
        {
          id: 1,
          description: '',
          samples: '',
          labStatus: 'Ordered',
          sampleCollected: false,
          sampleCollectedAt: '',
          labTechnician: '',
          resultValue: '',
          referenceRange: '',
          remarks: '',
          reportFile: '',
          verifiedBy: '',
          verifiedAt: ''
        }
      ])
    });
    setShowConsultationForm(true);

    if (['Token Generated', 'WAITING', 'Waiting', 'Vitals Completed'].includes(patient.status)) {
      // Create consultation record on backend
      apiFetch(OPD_CONSULTATION_START, {
        method: 'POST',
        body: { patientId: patient.patientId, doctorId: patient.assignedDoctorId, consultationType: 'New' }
      }).catch(err => console.error('Error starting consultation:', err));

      // Update token status
      apiFetch(OPD_PATIENT_STATUS(patient.visitId), {
        method: 'PUT',
        body: { status: 'IN_CONSULTATION' }
      }).then(res => {
        if (res.ok) {
          loadOPDData();
        } else {
          toast.error('Failed to update patient status');
        }
      }).catch(err => {
        console.error('Error updating status:', err);
      });
    }
  };

  const handlePatientExit = async (patient) => {
    try {
      // Complete consultation on backend
      await apiFetch(OPD_CONSULTATION_COMPLETE(patient.visitId), { method: 'POST' }).catch(() => {});

      const res = await apiFetch(OPD_PATIENT_STATUS(patient.visitId), {
        method: 'PUT',
        body: { status: 'Exited' }
      });
      
      if (res.ok) {
        toast.success(`${patient.patientName} has been successfully checked out and visit record finalized.`);
        loadOPDData();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || err.detail || 'Failed to check out patient');
      }
    } catch (e) {
      console.error('Error checking out patient:', e);
      toast.error('Error connecting to the server');
    }
  };

  const generateToken = () => {
    setTokenStep('form');
    setTokenForm({ uhid: '', visitId: '', tokenNumber: '', queueNumber: '', patientId: '', patientName: '', age: '', gender: 'Male', bloodGroup: '', phoneNo: '', email: '', address: '', department: '', doctorId: '', visitType: 'New', appointmentType: 'Walk-in', priority: 'Normal', arrivalTime: '', estimatedWaitTime: '', queuePosition: 0, tokenStatus: 'Waiting', referredBy: ''});
    setPatientSearchTerm('');
    setDeptSearchTerm('');
    setDocSearchTerm('');
    setShowTokenModal(true);
  };

  const handleTokenSubmit = async (e) => {
    e.preventDefault();

    if (!tokenForm.patientName || !tokenForm.department || !tokenForm.doctorId) {
      toast.error('Please fill in all required fields (Patient Name, Department, Doctor)');
      return;
    }

    try {
      const payload = {
        patientId: tokenForm.patientId || null,
        patientName: tokenForm.patientName,
        phoneNo: tokenForm.phoneNo || null,
        email: tokenForm.email || null,
        age: tokenForm.age ? parseInt(tokenForm.age) : null,
        gender: tokenForm.gender || "Male",
        bloodGroup: tokenForm.bloodGroup || null,
        Type: tokenForm.visitType || "New",
        address: tokenForm.address || null,
        department: tokenForm.department || null,
        doctorId: tokenForm.doctorId || null,
        type: tokenForm.appointmentType || "Walk-in",
        priority: tokenForm.priority || "Normal"
      };

      const res = await apiFetch(OPD_TOKENS, {
        method: 'POST',
        body: payload
      });

      if (res.ok) {
        const data = await res.json();
        toast.success('Token generated successfully');
        setGeneratedToken(data.data || data);
        setTokenStep('slip');
        loadOPDData(); // Refresh the list
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || err.detail || 'Failed to generate token. Database constraint may be violated.');
      }
    } catch (error) {
      console.error('Error generating token:', error);
      toast.error('Error connecting to the server');
    }
  };

  const handlePrintPrescription = () => {
    if (!selectedPatient) return;

    const printWindow = window.open('', '', 'width=900,height=1000');

    const prescriptionHTML = `
    <html>
      <head>
        <title>Prescription - ${selectedPatient.patientName}</title>
        <style>
          @page {
            size: A4;
            margin: 20mm;
          }
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            color: #000;
          }
          .container {
            width: 100%;
            max-width: 800px;
            margin: auto;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            margin-bottom: 20px;
            padding-bottom: 10px;
          }
          .header h2 {
            margin: 0;
            font-size: 24px;
          }
          .header p {
            margin: 5px 0;
            font-size: 14px;
          }
          .section {
            margin-bottom: 20px;
          }
          .row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 14px;
          }
          .label {
            font-weight: bold;
          }
          .box {
            border: 1px solid #000;
            padding: 10px;
            min-height: 60px;
          }
          .footer {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
          }
          .signature {
            text-align: right;
          }
          .signature-line {
            margin-top: 40px;
            border-top: 1px solid #000;
            width: 200px;
          }
          @media print {
            body {
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <h2>HOSPITAL NAME</h2>
            <p>OPD Prescription</p>
            <p>Date: ${new Date().toLocaleDateString()}</p>
          </div>
          <!-- Patient Info -->
          <div class="section">
            <div class="row">
              <span><span class="label">Patient:</span> ${selectedPatient.patientName}</span>
              <span><span class="label">Age:</span> ${selectedPatient.age}</span>
            </div>
            <div class="row">
              <span><span class="label">Gender:</span> ${selectedPatient.gender}</span>
              <span><span class="label">Token:</span> ${selectedPatient.token}</span>
            </div>
            <div class="row">
              <span><span class="label">Doctor:</span> ${selectedPatient.doctor}</span>
              <span><span class="label">Department:</span> ${selectedPatient.department}</span>
            </div>
          </div>
          <!-- Vitals -->
          <div class="section">
            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; background: #f9f9f9; padding: 10px; border: 1px solid #eee;">
              <div><span class="label" style="font-size: 10px;">BP</span><br/>${consultationForm.vitalSigns.bp || '-'}</div>
              <div><span class="label" style="font-size: 10px;">PULSE</span><br/>${consultationForm.vitalSigns.pulse || '-'}</div>
              <div><span class="label" style="font-size: 10px;">TEMP</span><br/>${consultationForm.vitalSigns.temperature || '-'}°F</div>
              <div><span class="label" style="font-size: 10px;">SPO2</span><br/>${consultationForm.vitalSigns.spo2 || '-'}%</div>
              <div><span class="label" style="font-size: 10px;">WT/HT</span><br/>${consultationForm.vitalSigns.weight || '-'}kg / ${consultationForm.vitalSigns.height || '-'}cm</div>
            </div>
          </div>
          <!-- History & Allergies -->
          <div class="section" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <p class="label">Clinical History</p>
              <div class="box" style="min-height: 40px; font-size: 13px;">${consultationForm.history || '-'}</div>
            </div>
            <div>
              <p class="label" style="color: #d32f2f;">Allergies</p>
              <div class="box" style="min-height: 40px; font-size: 13px; border-color: #ffcdd2; background: #fff8f8;">${consultationForm.allergies || 'NIL'}</div>
            </div>
          </div>
          <!-- Symptoms & Examination -->
          <div class="section" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <p class="label">Symptoms / Complaints</p>
              <div class="box" style="min-height: 50px; font-size: 13px;">${consultationForm.symptoms || '-'}</div>
            </div>
            <div>
              <p class="label">Physical Examination</p>
              <div class="box" style="min-height: 50px; font-size: 13px;">${consultationForm.examination || '-'}</div>
            </div>
          </div>
          <!-- Diagnosis -->
          <div class="section">
            <p class="label">Diagnosis / Impression</p>
            <div class="box" style="font-weight: bold; color: #1a237e;">${consultationForm.diagnosis || '-'}</div>
          </div>
          <!-- Prescription -->
          <div class="section">
            <p class="label">Prescription (Rx)</p>
            <div class="box" style="min-height: 120px; padding: 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <thead style="background: #f5f5f5;">
                  <tr>
                    <th style="padding: 8px; text-align: left; border-bottom: 1px solid #000; font-size: 12px;">Medicine</th>
                    <th style="padding: 8px; text-align: left; border-bottom: 1px solid #000; font-size: 12px;">Dosage</th>
                    <th style="padding: 8px; text-align: left; border-bottom: 1px solid #000; font-size: 12px;">Duration</th>
                    <th style="padding: 8px; text-align: left; border-bottom: 1px solid #000; font-size: 12px;">Shifts</th>
                  </tr>
                </thead>
                <tbody>
                  ${consultationForm.medications?.length > 0 && consultationForm.medications[0].name
        ? consultationForm.medications.map(m => `
                    <tr>
                      <td style="padding: 8px; border-bottom: 1px solid #eee; font-size: 12px;">${m.name || '-'}</td>
                      <td style="padding: 8px; border-bottom: 1px solid #eee; font-size: 12px;">${m.dosage || '-'}</td>
                      <td style="padding: 8px; border-bottom: 1px solid #eee; font-size: 12px;">${m.duration || '-'}</td>
                      <td style="padding: 8px; border-bottom: 1px solid #eee; font-size: 12px;">
                        ${m.frequency.morning ? 'M ' : ''}${m.frequency.afternoon ? 'A ' : ''}${m.frequency.night ? 'N ' : ''}
                      </td>
                    </tr>
                  `).join('')
        : `<tr><td colspan="4" style="padding: 20px; text-align: center; color: #999; font-style: italic;">${consultationForm.prescription || 'No medications prescribed'}</td></tr>`}
                </tbody>
              </table>
            </div>
          </div>
          <!-- Tests -->
          <div class="section">
            <p class="label">Tests Recommended</p>
            <div class="box">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <thead>
                  <tr style="border-bottom: 1px solid #000; text-align: left;">
                    <th style="padding: 4px;">id</th>
                    <th style="padding: 4px;">Test Description</th>
                    <th style="padding: 4px;">Samples</th>
                  </tr>
                </thead>
                <tbody>
                  ${consultationForm.testsRecommended?.length > 0
        ? consultationForm.testsRecommended.map(t => `
                    <tr style="border-bottom: 1px dotted #ccc;">
                      <td style="padding: 4px;">${t.id}</td>
                      <td style="padding: 4px;">${t.description === 'Other' ? t.customDescription : (t.description || '-')}</td>
                      <td style="padding: 4px;">${t.samples === 'Other' ? t.customSamples : (t.samples || '-')}</td>
                    </tr>
                  `).join('')
        : '<tr><td colspan="3" style="padding: 4px; text-align: center;">None</td></tr>'
      }
                </tbody>
              </table>
            </div>
          </div>
          <!-- Instructions -->
          <div class="section">
            <p class="label">Patient Instructions / Advice</p>
            <div class="box" style="min-height: 50px; font-size: 13px; background: #fffde7; border-color: #fff59d;">${consultationForm.instructions || '-'}</div>
          </div>
          <!-- Footer -->
          <div class="footer">
            <div>
              <p><strong>Next Visit:</strong> ${consultationForm.nextVisitDate || '-'}</p>
            </div>
            <div class="signature">
              <div class="signature-line"></div>
              <p>Doctor Signature</p>
            </div>
          </div>
        </div>
        <script>
          setTimeout(() => {
            window.print();
            window.close();
          }, 500);
        </script>
      </body>
    </html>
    `;
    printWindow.document.write(prescriptionHTML);
    printWindow.document.close();
  };

  const handleConfirmDeactivation = async () => {
    if (!doctorToDeactivate) return;
    const doctorId = doctorToDeactivate.id;
    try {
      const res = await apiFetch(OPD_DOCTOR_TOGGLE_STATUS(doctorId), {
        method: 'PUT'
      });
      if (res.ok) {
        toast.success('Doctor status toggled successfully');
        loadOPDData();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || 'Failed to toggle doctor status');
      }
    } catch (e) {
      console.error('Error toggling doctor status:', e);
      toast.error('Error connecting to the server');
    }
    setShowDeactivateModal(false);
    setDoctorToDeactivate(null);
    setPatientsToReassign([]);
  };

  const handleTransferPatient = (patient) => {
    setTransferPatient(patient);
    setSelectedTransferDoctor(null);
    setShowTransferModal(true);
  };

  const handleConfirmTransfer = async () => {
    if (!selectedTransferDoctor || !transferPatient) return;
    try {
      const payload = {
        opd_visit_id: transferPatient.visitId,
        to_doctor_user_id: selectedTransferDoctor.id,
        reason: 'Patient transferred from reception'
      };
      const res = await apiFetch(OPD_TRANSFER, {
        method: 'POST',
        body: payload
      });
      if (res.ok) {
        toast.success('Patient transferred successfully');
        loadOPDData();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || 'Failed to transfer patient');
      }
    } catch (e) {
      console.error('Error transferring patient:', e);
    }
    setShowTransferModal(false);
    setTransferPatient(null);
    setSelectedTransferDoctor(null);
  };

  const handleCancelPatient = async (patient) => {
    if (window.confirm(`Cancel token ${patient.token} for ${patient.patientName}?`)) {
      try {
        const res = await apiFetch(OPD_PATIENT_DELETE(patient.visitId), {
          method: 'DELETE'
        });
        if (res.ok) {
          toast.success('Patient visit cancelled successfully');
          loadOPDData();
        } else {
          const err = await res.json().catch(() => ({}));
          toast.error(err.message || 'Failed to cancel patient');
        }
      } catch (e) {
        console.error('Error cancelling patient:', e);
        toast.error('Error connecting to the server');
      }
    }
  };

  const handlePrintSlip = () => {
    const printWindow = window.open('', '', 'width=800,height=800');
    const invoiceHTML = `
      <html>
        <head>
          <title>Print Token - ${generatedToken?.token}</title>
          <style>
            @page { margin: 0; }
            body {
              font-family: 'Courier New', Courier, monospace;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              background: #f3f4f6 !important;
              color: black;
              margin: 0;
            }
            .invoice-wrapper {
              width: 100%;
              max-width: 400px;
              background: white;
              padding: 40px;
              border: 1px solid #ccc;
              border-radius: 8px;
              box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 25px;
              border-bottom: 2px dashed black;
              padding-bottom: 20px;
            }
            .header h2 {
              margin: 0 0 10px 0;
              font-size: 24px;
              text-transform: ;
              letter-spacing: 2px;
            }
            .token-container {
              text-align: center;
              margin: 30px 0;
            }
            .token-number {
              font-size: 64px;
              font-weight: bold;
              margin: 10px 0;
              line-height: 1;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 12px;
              font-size: 14px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 12px;
              border-top: 2px dashed black;
              padding-top: 20px;
            }
            @media print {
              body { background: white !important; padding: 0; }
              .invoice-wrapper { box-shadow: none; border: none; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-wrapper">
            <div class="header">
              <h2>OPD TOKEN</h2>
              <p>${new Date().toLocaleString()}</p>
            </div>
            <div class="token-container">
              <div style="font-size: 12px; text-transform: ;">Token Number</div>
              <div class="token-number">${generatedToken?.token || '-'}</div>
            </div>
            <div class="info-row"><span>Patient:</span> <b>${generatedToken?.patientName || '-'}</b></div>
            <div class="info-row"><span>UHID:</span> <b>${generatedToken?.patientId || '-'}</b></div>
            <div class="info-row"><span>Doctor:</span> <b>${generatedToken?.doctor || '-'}</b></div>
            <div class="info-row"><span>Dept:</span> <b>${generatedToken?.department || '-'}</b></div>
            <div class="footer">
              <p>Please wait for your turn. Thank you!</p>
            </div>
          </div>
          <script>
            setTimeout(() => { window.print(); window.close(); }, 500);
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
  };

  const handlePrintInvoice = (patient) => {
    const printWindow = window.open('', '', 'width=900,height=900');
    const total = calculateTotalAmount(patient);
    const consult = doctors.find(d => d.id === patient.assignedDoctorId)?.consultationFee || 300;
    const testsTotal = calculateTestsFee(patient);
    const surgeryTotal = calculateSurgeryFee(patient);
    const invoiceHTML = `
      <html>
        <head>
          <title>Invoice - ${patient.patientName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.5; }
            .invoice-card { max-width: 800px; margin: auto; border: 1px solid #eee; padding: 40px; border-radius: 12px; }
            .header { display: flex; justify-content: space-between; align-items: start; border-bottom: 2px solid #f3f4f6; padding-bottom: 30px; margin-bottom: 30px; }
            .hospital-info h1 { margin: 0; font-size: 24px; font-weight: 900; color: #2563eb; }
            .hospital-info p { margin: 4px 0; font-size: 12px; color: #666; font-weight: 600; }
            .invoice-meta { text-align: right; }
            .invoice-meta h2 { margin: 0; font-size: 32px; font-weight: 900; letter-spacing: -1px; }
            .invoice-meta p { margin: 4px 0; font-size: 12px; color: #999; font-weight: bold; }
            .section-title { font-size: 10px; font-weight: 900; text-transform: ; letter-spacing: 2px; color: #999; margin-bottom: 12px; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px; margin-bottom: 40px; }
            .info-block p { margin: 4px 0; font-size: 14px; font-weight: 700; }
            .info-block span { font-size: 10px; font-weight: bold; color: #aaa; text-transform: ; }
            table { width: 100%; border-collapse: collapse; margin: 30px 0; }
            th { text-align: left; font-size: 10px; font-weight: 900; text-transform: ; color: #999; padding: 12px; border-bottom: 2px solid #f3f4f6; }
            td { padding: 16px 12px; font-size: 14px; font-weight: 700; border-bottom: 1px solid #f3f4f6; }
            .total-row { background: #f8fafc; }
            .total-row td { font-size: 20px; font-weight: 900; color: #2563eb; }
            .status-badge { display: inline-block; padding: 6px 12px; border-radius: 6px; font-size: 10px; font-weight: 900; text-transform: ; letter-spacing: 1px; }
            .status-paid { background: #dcfce7; color: #166534; }
            .status-pending { background: #fef9c3; color: #854d0e; }
            .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #aaa; font-weight: 600; }
            @media print { .invoice-card { border: none; padding: 0; } body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="invoice-card">
            <div class="header">
              <div class="hospital-info">
                <h1>LIFELINE MEDICAL CENTER</h1>
                <p>123 Health Avenue, Medical District</p>
                <p>New Delhi, India - 110001</p>
                <p>Tel: +91 11 2345 6789 | contact@lifeline.com</p>
              </div>
              <div class="invoice-meta">
                <h2>INVOICE</h2>
                <p>#INV-${patient.id.slice(-6).toUpperCase()}</p>
                <p>Date: ${new Date().toLocaleDateString('en-GB')}</p>
                <div class="status-badge ${patient.status === 'Completed' ? 'status-paid' : 'status-pending'}" style="margin-top: 10px;">
                  ${patient.status === 'Completed' ? 'Payment Received' : 'Payment Pending'}
                </div>
              </div>
            </div>

            <div class="section-title">Patient & Visit Information</div>
            <div class="grid">
              <div class="info-block">
                <span>Patient Name</span>
                <p>${patient.patientName}</p>
                <span style="margin-top: 10px; display: block;">UHID</span>
                <p>${patient.patientId}</p>
              </div>
              <div class="info-block">
                <span>Consulting Doctor</span>
                <p>${patient.doctor}</p>
                <span style="margin-top: 10px; display: block;">Department</span>
                <p>${patient.department}</p>
              </div>
            </div>
            <div class="section-title">Billing Breakdown</div>
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Service Category</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Doctor's Consultation Fee</td>
                  <td>OPD Services</td>
                  <td style="text-align: right;">₹${consult}.00</td>
                </tr>
                ${testsTotal > 0 ? `
                <tr>
                  <td>Laboratory Investigations (${patient.tests?.join(', ') || 'Standard Profile'})</td>
                  <td>Diagnostics</td>
                  <td style="text-align: right;">₹${testsTotal}.00</td>
                </tr>
                ` : ''}
                ${surgeryTotal > 0 ? `
                <tr>
                  <td>Clinical Procedures / Minor Surgery</td>
                  <td>Medical Procedures</td>
                  <td style="text-align: right;">₹${surgeryTotal}.00</td>
                </tr>
                ` : ''}
                <tr class="total-row">
                  <td colspan="2" style="text-align: right; font-size: 12px; color: #666; font-weight: bold;">GRAND TOTAL</td>
                  <td style="text-align: right;">₹${total}.00</td>
                </tr>
              </tbody>
            </table>
            <div class="footer">
              <p>This is a computer-generated document. No signature is required.</p>
              <p>Wishing you a speedy recovery. Please keep this for your records.</p>
            </div>
          </div>
          <script>
            setTimeout(() => { window.print(); window.close(); }, 500);
          </script>
        </body>
      </html>`;
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
  };

  const handleAssignDoctor = (patient) => {
    alert(`Assigning doctor for ${patient.patientName}`);
    // Future logic: Open assignment modal
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Token Generated': return 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'Waiting': return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
      case 'Vitals Completed': return 'bg-cyan-50 text-cyan-700 border border-cyan-200';
      case 'In Consultation': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'Lab Ordered': return 'bg-orange-50 text-orange-700 border border-orange-200';
      case 'Billing Pending': return 'bg-pink-50 text-pink-700 border border-pink-200';
      case 'Pharmacy Pending': return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
      case 'Completed': return 'bg-green-50 text-green-700 border border-green-200';
      case 'Exited': return 'bg-gray-100 text-gray-600 border border-gray-300';
      default: return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  const calculateTestsFee = (patient) => {
    if (!patient) return 0;
    const tests = patient.tests || [];
    return tests.reduce((sum, test) => sum + (TEST_PRICES[test] || 200), 0);
  };

  const calculateSurgeryFee = (patient) => {
    if (!patient) return 0;
    const surgeries = patient.surgeries || [];
    return surgeries.reduce((sum, surgery) => sum + (SURGERY_PRICES[surgery] || 1000), 0);
  };

  const calculateTotalAmount = (patient) => {
    if (!patient) return 0;
    const doctor = doctors.find(d => d.id === patient.assignedDoctorId);
    const consultationFee = doctor?.consultationFee || 300;
    return consultationFee + calculateTestsFee(patient) + calculateSurgeryFee(patient);
  };
  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">OPD Management</h2>
          <p className="text-gray-600 text-sm mt-1">Manage outpatient department operations</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:flex-nowrap">

          <button onClick={generateToken} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md flex items-center text-sm font-medium">
            <ConfirmationNumberIcon className="mr-2" /> Generate Token </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {/* TOTAL QUEUE */}
        <div className="relative bg-white rounded-xl p-5 border border-gray-200 border-t-[3px] border-t-blue-500 shadow-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-transparent to-transparent pointer-events-none" />
          <div className="relative flex flex-col">
            <p className="text-3xl font-bold text-blue-600 mb-1">{opdStats.total_queue}</p>
            <p className="text-sm font-semibold text-gray-800">Total Queue</p>
            <p className="text-xs text-blue-500 mt-1">Tokens issued today</p>
          </div>
        </div>
        {/* WAITING PATIENTS */}
        <div className="relative bg-white rounded-xl p-5 border border-gray-200 border-t-[3px] border-t-yellow-500 shadow-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-50/40 via-transparent to-transparent pointer-events-none" />
          <div className="relative flex flex-col">
            <p className="text-3xl font-bold text-yellow-600 mb-1">{opdStats.waiting}</p>
            <p className="text-sm font-semibold text-gray-800">Waiting Patients</p>
            <p className="text-xs text-yellow-500 mt-1">Patients waiting for doctor</p>
          </div>
        </div>
        {/* IN CONSULTATION */}
        <div className="relative bg-white rounded-xl p-5 border border-gray-200 border-t-[3px] border-t-purple-500 shadow-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/40 via-transparent to-transparent pointer-events-none" />
          <div className="relative flex flex-col">
            <p className="text-3xl font-bold text-purple-500 mb-1">{opdStats.in_consultation}</p>
            <p className="text-sm font-semibold text-gray-800">In Consultation</p>
            <p className="text-xs text-purple-600 mt-1">Currently with doctor</p>
          </div>
        </div>
        {/* PATIENTS EXITED / COMPLETED */}
        <div className="relative bg-white rounded-xl p-5 border border-gray-200 border-t-[3px] border-t-green-500 shadow-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/40 via-transparent to-transparent pointer-events-none" />
          <div className="relative flex flex-col">
            <p className="text-3xl font-bold text-green-600 mb-1">{opdStats.completed}</p>
            <p className="text-sm font-semibold text-gray-800">Patients Exited</p>
            <p className="text-xs text-green-500 mt-1">Fully processed today</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto scrollbar-hide">
        {/* Patients */}
        <button className={`px-4 py-3 font-medium text-sm flex items-center whitespace-nowrap ${activeTab === 'patients' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'}`} onClick={() => setActiveTab('patients')}>
          <PersonIcon className="mr-2" fontSize="small" />Patients ({opdPatients.filter(p => p.status !== 'Exited' && p.status !== 'Cancelled').length})
        </button>

        {/* Billing */}
        <button className={`px-4 py-3 font-medium text-sm flex items-center whitespace-nowrap ${activeTab === 'billing' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'}`} onClick={() => setActiveTab('billing')}>
          <ReceiptLongIcon className="mr-2" fontSize="small" />Billing
        </button>

        {/* Patient Exit */}
        <button className={`px-4 py-3 font-medium text-sm flex items-center whitespace-nowrap ${activeTab === 'exit' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'}`} onClick={() => setActiveTab('exit')}>
          <ExitToAppIcon className="mr-2" fontSize="small" />Patient Exit
        </button>

      </div>

      {/* Patients Tab */}
      {activeTab === 'patients' && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-lg font-semibold text-gray-800">Patient Queue</h3>
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <input type="text" placeholder="Search patients..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  value={patientQueueSearch} onChange={(e) => setPatientQueueSearch(e.target.value)} />
                <SearchIcon className="absolute left-3 top-2.5 text-gray-400 text-sm" fontSize="small" />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">

              {/* Table Head */}
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 whitespace-nowrap">Patient</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 whitespace-nowrap">Doctor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 whitespace-nowrap">Queue</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 whitespace-nowrap">Actions</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-gray-200">
                {opdPatients.filter(patient => patient.status !== 'Exited' && patient.status !== 'Cancelled' && (patient.patientName.toLowerCase().includes(patientQueueSearch.toLowerCase()) || patient.token.toLowerCase().includes(patientQueueSearch.toLowerCase()) || patient.patientId.toLowerCase().includes(patientQueueSearch.toLowerCase()))).length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-10 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <SearchIcon className="text-gray-300 mb-2" sx={{ fontSize: 40 }} />
                        <p className="font-medium">No patients found</p>
                        <p className="text-xs">Try adjusting your search term</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  opdPatients.filter(patient => patient.status !== 'Exited' && patient.status !== 'Cancelled' && (patient.patientName.toLowerCase().includes(patientQueueSearch.toLowerCase()) || patient.token.toLowerCase().includes(patientQueueSearch.toLowerCase()) || patient.patientId.toLowerCase().includes(patientQueueSearch.toLowerCase()))
                  ).map(patient => (
                    <tr key={patient.id} className="hover:bg-gray-50">

                      {/* Patient */}
                      <td className="px-4 py-4 align-middle">
                        <div>
                          <p className="font-medium text-gray-900">{patient.patientName}</p>
                          <p className="text-xs text-gray-500 mt-1">{patient.token} • {patient.age}y, {patient.gender}</p>
                        </div>
                      </td>

                      <td className="px-4 py-4 align-middle">
                        <div>
                          <p className="font-medium text-gray-900 cursor-pointer hover:text-blue-600 hover:underline transition-colors" onClick={() => setActiveTab('doctors')} title="Go to Doctor management">{patient.doctor}</p>
                          <p className="text-xs text-gray-500">{patient.department}</p>
                        </div>
                      </td>

                      {/* Queue */}
                      <td className="px-4 py-4 align-middle">
                        <div className="flex items-center min-h-[32px]">
                          {patient.status === 'Waiting' && patient.assignedDoctorId && (
                            <>
                              <span className="w-7 h-7 mr-2 rounded-full bg-yellow-100 text-yellow-800 flex items-center justify-center text-xs font-semibold shadow-sm" title="Queue Position">{patient.queuePosition}</span>
                              <span className="text-sm text-gray-700">{patient.waitingTime} mins</span>
                            </>
                          )}

                          {patient.status === 'Waiting' && !patient.assignedDoctorId && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-orange-500">Not Assigned</span>
                              <button onClick={() => handleAssignDoctor(patient)} title="Assign Doctor Now" className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                                <PersonAddIcon style={{ fontSize: 16 }} />
                              </button>
                            </div>
                          )}

                          {patient.status === 'In Consultation' && (
                            <span className="text-sm font-medium text-blue-600">Consulting Now</span>
                          )}

                          {patient.status === 'Completed' && (
                            <span className="flex items-center gap-1.5">
                              <CheckCircleIcon style={{ fontSize: 18 }} className="text-green-500" />
                              <span className="text-sm font-medium text-green-600">Completed</span>
                            </span>
                          )}

                          {patient.status === 'Cancelled' && (
                            <span className="flex items-center gap-1.5">
                              <CloseIcon style={{ fontSize: 18 }} className="text-red-500" />
                              <span className="text-sm font-medium text-red-600">Cancelled</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 align-middle">
                        <div className="flex flex-col gap-1">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium w-fit transition-all ${patient.status !== 'Waiting' ? 'cursor-pointer hover:ring-2 hover:ring-offset-1' : 'cursor-default'} ${getStatusColor(patient.status)}`} onClick={() => {
                            if (patient.status === 'In Consultation') setActiveTab('consultation');
                            else if (patient.status === 'Completed') setActiveTab('billing');
                          }} title={patient.status === 'Waiting' ? 'Patient is Waiting' : `Go to ${patient.status} management`}
                          >
                            {patient.status}
                          </span>

                          {patient.priority === 'Urgent' && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 w-fit">Urgent</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 align-middle">
                        <div className="flex items-center gap-2">

                          <button onClick={() => {
                            setSelectedPatientForView(patient);
                            setShowViewPatientModal(true);
                          }} className="px-3 py-1.5 text-xs font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 rounded flex items-center gap-1.5 transition-colors">
                            <VisibilityIcon fontSize="inherit" /> View
                          </button>

                          <button onClick={() => {
                            setSelectedQueuePatient(patient);
                            setShowQueueDetailModal(true);
                          }} className="px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded flex items-center gap-1.5 transition-colors">
                            <EditIcon fontSize="inherit" /> Edit
                          </button>


                          {['Waiting', 'Token Generated'].includes(patient.status) && patient.assignedDoctorId && (
                            <>
                              <button onClick={() => handleStartConsultation(patient)} className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded flex items-center gap-1.5 transition-colors">
                                <PlayArrowIcon fontSize="inherit" /> Start
                              </button>

                              <button onClick={() => handleTransferPatient(patient)} className="px-3 py-1.5 text-xs font-medium bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200 rounded flex items-center gap-1.5 transition-colors">
                                <SwapHorizIcon fontSize="inherit" /> Transfer
                              </button>
                            </>
                          )}

                          {patient.status === 'In Consultation' && (
                            <button onClick={() => handleStartConsultation(patient)} className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded flex items-center gap-1.5 transition-colors">
                              <DescriptionIcon fontSize="inherit" /> Consult
                            </button>
                          )}

                          {patient.status !== 'Cancelled' && patient.status !== 'Completed' && patient.status !== 'Exited' && (
                            <button onClick={() => handleCancelPatient(patient)} className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded flex items-center gap-1.5 transition-colors">
                              <DeleteIcon fontSize="inherit" /> Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">OPD Billing</h3>
              </div>
              <div className="relative w-full sm:w-64">
                <input type="text" placeholder="Search invoices..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500" value={billingSearch} onChange={(e) => setBillingSearch(e.target.value)} />
                <SearchIcon className="absolute left-3 top-2.5 text-gray-400 text-sm" fontSize="small" />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 ">Patient</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 ">Invoice No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 ">Doctor / Dept</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 ">Total Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 ">Payment Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 ">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {opdPatients.filter(p => p.status !== 'Exited' && p.status !== 'Cancelled' && p.patientName.toLowerCase().includes(billingSearch.toLowerCase())).map(patient => {
                  const total = calculateTotalAmount(patient);
                  const consult = doctors.find(d => d.id === patient.assignedDoctorId)?.consultationFee || 300;
                  const testsTotal = calculateTestsFee(patient);
                  const surgeryTotal = calculateSurgeryFee(patient);

                  return (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <p className="font-medium text-gray-900">{patient.patientName}</p>
                        <p className="text-[10px] text-gray-500">{patient.patientId}</p>
                      </td>
                      <td className="px-4 py-4">INV-{patient.id.slice(-4)}</td>
                      <td className="px-4 py-4">
                        <p className="text-gray-800 font-medium">{patient.doctor}</p>
                        <p className="text-xs text-gray-500">{patient.department}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 text-base">₹{total}.00</span>
                          <span className="text-[9px] text-gray-500 leading-tight">Fee: ₹{consult} + Tests: ₹{testsTotal} {surgeryTotal > 0 ? `+ Surg: ₹${surgeryTotal}` : ''}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${patient.status === 'Completed' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}>{patient.status === 'Completed' ? 'Paid' : 'Pending'}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <button onClick={() => { setSelectedPatientForView(patient); setShowViewPatientModal(true); }} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 border border-gray-200 transition-all font-bold text-[10px] tracking-widest shadow-sm" title="View Detailed Bill & Record">
                            <VisibilityIcon sx={{ fontSize: 14 }} /></button>
                          <button onClick={() => handlePrintInvoice(patient)} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-100 transition-all font-bold text-[10px] tracking-widest shadow-sm" title="Print Invoice">
                            <PrintIcon sx={{ fontSize: 14 }} />
                          </button>
                          {patient.status !== 'Completed' ? (
                            <button onClick={() => handleOpenPaymentModal(patient)} className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-black text-[10px] tracking-widest shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200" title="Process Payment"><PaymentsIcon sx={{ fontSize: 14 }} /></button>
                          ) : (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg border border-green-200 font-black text-[10px] tracking-widest cursor-default"><CheckCircleIcon sx={{ fontSize: 14 }} /></div>
                          )}

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Patient Exit Tab */}
      {activeTab === 'exit' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

              <div>
                <h3 className="text-lg font-semibold text-gray-800">Patient Treatment Records</h3>
                <p className="text-xs text-gray-500 mt-1">Review treatment details and manage final exit for all patients</p>
              </div>
              <div className="relative w-full lg:w-72">
                <input type="text" placeholder="Search records..." className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm" value={exitSearch} onChange={(e) => setExitSearch(e.target.value)} />
                <SearchIcon className="absolute left-3 top-2.5 text-gray-400 text-sm" fontSize="small" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {opdPatients.filter(p => (p.status === 'Completed' || p.status === 'COMPLETED' || p.status === 'Exited') && p.patientName.toLowerCase().includes(exitSearch.toLowerCase())).map(patient => (
              <div key={patient.id} className="bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden group flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${patient.status === 'Exited' ? 'bg-emerald-500' : 'bg-purple-500'}`}></div>
                      <span className={`text-[10px] font-black tracking-widest ${patient.status === 'Exited' ? 'text-emerald-600' : 'text-purple-600'}`}> {patient.status === 'Exited' ? 'Visit Finalized' : 'Ready for Exit'}</span>
                    </div>
                    <h4 className="text-xl font-black text-gray-900 leading-tight">{patient.patientName}</h4>
                    <p className="text-[10px] font-bold text-gray-400 tracking-widest mt-1">Token: {patient.token} • UHID: {patient.patientId}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${patient.status === 'Exited' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}>{patient.status === 'Exited' ? <CheckCircleIcon sx={{ fontSize: 28 }} /> : <PersonIcon sx={{ fontSize: 28 }} />}</div>
                </div>

                <div className="p-6 space-y-5 flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 tracking-widest mb-1">Consulting Doctor</p>
                      <p className="text-sm font-bold text-gray-800">{patient.doctor || 'Not Assigned'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">Billing Status</p>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${patient.status === 'Exited' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}> {patient.status === 'Exited' ? 'Paid' : 'Pending'} </span>
                    </div>
                  </div>

                  {/* Treatment Summary Section */}
                  <div className="bg-gray-50 rounded-2xl p-4 space-y-4">
                    <div>
                      <p className="text-[9px] font-black text-gray-400 tracking-[0.2em] mb-2 flex items-center gap-1">
                        <MedicationIcon sx={{ fontSize: 12 }} /> Prescribed Medications
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {patient.medications && patient.medications.length > 0 ? (patient.medications.map((med, idx) => (<span key={idx} className="px-2 py-1 bg-white border border-gray-100 rounded-lg text-[9px] font-bold text-gray-700 shadow-sm">{med}</span>))) : (<span className="text-[10px] italic text-gray-400">No medication recorded</span>)}
                        {patient.medications?.length > 3 && (
                          <span className="text-[9px] font-bold text-blue-600 self-center">+{patient.medications.length - 3} more</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-[9px] font-black text-gray-400 tracking-[0.2em] mb-2 flex items-center gap-1"><ScienceIcon sx={{ fontSize: 12 }} /> Diagnostic Tests </p>
                      <div className="flex flex-wrap gap-1.5">
                        {patient.tests && patient.tests.length > 0 ? (patient.tests.map((test, idx) => (<span key={idx} className="px-2 py-1 bg-white border border-gray-100 rounded-lg text-[9px] font-bold text-orange-700 shadow-sm">{test}</span>))) : (<span className="text-[10px] italic text-gray-400">No tests recommended</span>)}
                      </div>
                    </div>
                  </div>

                  {patient.status === 'Exited' ? (
                    <div className="pt-4 space-y-3">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-gray-400 tracking-widest">Exited On</span>
                        <span className="font-black text-gray-900">{patient.exitDate} at {patient.exitTime}</span>
                      </div>
                      {patient.followUpRequired && (
                        <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-between">
                          <div className="flex items-center gap-2"><CalendarMonthIcon className="text-blue-600" sx={{ fontSize: 16 }} /> <span className="text-[10px] font-black text-blue-800 tracking-widest">Follow-up</span></div>
                          <span className="text-[10px] font-black text-blue-900">{patient.followUpDate}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="pt-6 flex justify-end gap-3 border-t border-gray-50 mt-auto">
                      <button className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-xs tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100" onClick={() => { setSelectedExitPatient(patient); setExitForm({ billingStatus: 'Pending', followUpRequired: false, followUpDate: '', remarks: '' }); setShowExitModal(true); }}>
                        <ExitToAppIcon sx={{ fontSize: 18 }} />Finalize Exit
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Consultation Modal - Read Only View */}
      <Modal isOpen={showConsultationForm} onClose={() => setShowConsultationForm(false)} title={`Clinical Summary Profile - ${selectedPatient?.patientName || 'Record'}`} size="xl" footer={selectedPatient && (
        <div className="flex justify-end gap-3 px-4 pb-2">
          <button onClick={() => setShowConsultationForm(false)} className="px-6 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 font-bold transition-colors text-sm tracking-widest"> Close </button>
          <button onClick={handlePrintPrescription} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md flex items-center text-sm font-bold tracking-widest"> <PrintIcon className="mr-2" fontSize="small" /> Print Summary </button>
        </div>
      )}>
        {selectedPatient && (
          <div className="space-y-6 py-2 px-1">
            {/* Clinical Identity Header Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 tracking-widest">Patient Identity</p>
                  <p className="text-xl font-black text-black">{selectedPatient.patientName}</p>
                  <p className="text-[10px] font-bold text-blue-600">{selectedPatient.patientId || 'UHID-291088'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 tracking-widest">Visit Identity</p>
                  <p className="text-lg font-black text-black">Token: {selectedPatient.token}</p>
                  <p className="text-[10px] font-bold text-gray-500">{new Date().toLocaleDateString('en-GB')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 tracking-widest">Attending Physician</p>
                  <p className="text-lg font-black text-black">{selectedPatient.doctor}</p>
                  <p className="text-[10px] font-bold text-blue-600">{selectedPatient.department}</p>
                </div>
                <div className="space-y-2 text-right">
                  <p className="text-[10px] font-black text-gray-400 tracking-widest">Clinical Status</p>
                  <span className={`inline-flex items-center px-4 py-1.5 rounded-lg text-[10px] font-black ${consultationForm.consultationStatus === 'Completed' ? 'border-blue-600 text-blue-600' : 'border-black text-black'}`}>
                    {consultationForm.consultationStatus.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Information Architecture - Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Left Column: Vitals & Assessment */}
              <div className="lg:col-span-1 space-y-6">
                {/* Vital Signs Analysis */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-white px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                    <TimelineIcon sx={{ fontSize: 16 }} className="text-blue-600" />
                    <h4 className="text-[10px] font-black text-black tracking-widest">Vital Signs Analysis</h4>
                  </div>
                  <div className="p-5 grid grid-cols-2 gap-4">
                    {[
                      { label: 'Blood Pressure', value: consultationForm.vitalSigns.bp || '120/80', unit: 'mmHg' },
                      { label: 'Pulse Rate', value: consultationForm.vitalSigns.pulse || '72', unit: 'BPM' },
                      { label: 'Temperature', value: consultationForm.vitalSigns.temperature || '98.6', unit: '°F' },
                      { label: 'SpO2 Level', value: consultationForm.vitalSigns.spo2 || '98', unit: '%' },
                      { label: 'Body Weight', value: consultationForm.vitalSigns.weight || '65', unit: 'kg' },
                      { label: 'BMI', value: consultationForm.vitalSigns.bmi || '22.5', unit: 'kg/m²' },
                    ].map((vital, idx) => (
                      <div key={idx} className="p-3 bg-gray-50/50 rounded-xl border border-gray-100 shadow-inner">
                        <p className="text-[8px] font-black text-gray-400 mb-1">{vital.label}</p>
                        <p className="text-sm font-black text-black">{vital.value} <span className="text-[8px] font-bold text-gray-400">{vital.unit}</span></p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Clinical History & Allergies */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-white px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                    <HistoryEduIcon sx={{ fontSize: 16 }} className="text-blue-600" />
                    <h4 className="text-[10px] font-black text-black tracking-widest">Patient Background</h4>
                  </div>
                  <div className="p-5 space-y-5">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-gray-400 tracking-widest">Medical History</p>
                      <p className="text-xs font-medium text-black leading-relaxed">
                        {consultationForm.history || 'No significant past history recorded.'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-blue-600 tracking-widest">Known Allergies</p>
                      <p className="text-xs font-black text-black bg-blue-50 px-3 py-1.5 rounded border border-blue-100 block">
                        {consultationForm.allergies || 'No Known Allergies (NKA)'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Middle/Right Column: Clinical assessment, Diagnosis, Medications */}
              <div className="lg:col-span-2 space-y-6">
                {/* Primary Assessment & Diagnosis */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-white px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AssessmentIcon sx={{ fontSize: 16 }} className="text-blue-600" />
                      <h4 className="text-[10px] font-black text-black tracking-widest">Clinical Impression & Assessment</h4>
                    </div>
                    {consultationForm.diagnosisCode && (
                      <span className="text-[9px] font-black text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">ICD: {consultationForm.diagnosisCode}</span>
                    )}
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-gray-50">
                    <div className="space-y-2">
                      <p className="text-[9px] font-black text-gray-400 tracking-widest">Chief Complaints</p>
                      <p className="text-sm font-bold text-black border-l-4 border-blue-600 pl-4 py-1 italic leading-relaxed">
                        &quot;{consultationForm.symptoms || 'Symptoms not specified.'}&quot;
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[9px] font-black text-gray-400 tracking-widest">Primary Diagnosis</p>
                      <p className="text-lg font-black text-blue-600 italic leading-tight">
                        {consultationForm.diagnosis || 'Pending Diagnosis'}
                      </p>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="space-y-2">
                      <p className="text-[9px] font-black text-gray-400 tracking-widest">Physical Examination & Observations</p>
                      <p className="text-xs font-medium text-gray-700 leading-relaxed bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                        {consultationForm.examination || 'Detailed examination results not available.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Prescribed Medications Table */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-white px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                    <MedicationIcon sx={{ fontSize: 16 }} className="text-blue-600" />
                    <h4 className="text-[10px] font-black text-black tracking-widest">Prescribed Medications (Rx)</h4>
                  </div>
                  <div className="p-0 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100 border-collapse">
                      <thead className="bg-gray-50/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 tracking-widest">Medicine Detail</th>
                          <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 tracking-widest">Route/Dosage</th>
                          <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 tracking-widest">Frequency</th>
                          <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 tracking-widest">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-50">
                        {(consultationForm.medications.length > 0 && consultationForm.medications[0].name ? consultationForm.medications : [
                          { name: 'Tab. Amoxicillin', genericName: 'Amoxicillin 500mg', dosage: '1 Tablet', route: 'Oral', duration: '5 Days', afterFood: true, frequency: { morning: true, afternoon: true, night: true }, instructions: 'Complete course' }
                        ]).map((med, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="text-sm font-black text-black">{med.name}</p>
                              <p className="text-[10px] font-bold text-gray-400 italic leading-tight">{med.genericName || 'Generic Not Specified'}</p>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <p className="text-xs font-black text-blue-600">{med.route || 'Oral'}</p>
                              <p className="text-[10px] font-bold text-gray-500">{med.dosage}</p>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex justify-center gap-1.5 mb-1.5">
                                {['M', 'A', 'N'].map((slot, i) => {
                                  const key = i === 0 ? 'morning' : i === 1 ? 'afternoon' : 'night';
                                  const active = med.frequency?.[key];
                                  return (
                                    <span key={slot} className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-black ${active ? 'text-black' : 'text-blue-600'}`}>
                                      {slot}
                                    </span>
                                  );
                                })}
                              </div>
                              <span className="text-[8px] font-black text-gray-400 tracking-tighter">
                                {med.beforeFood ? 'Before Food' : med.afterFood ? 'After Food' : 'As Directed'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <p className="text-xs font-black text-blue-600">{med.duration}</p>
                              {med.instructions && <p className="text-[8px] font-bold text-gray-400 italic">&quot;{med.instructions}&quot;</p>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Investigations Recommended Table */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-white px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                    <ScienceIcon sx={{ fontSize: 16 }} className="text-blue-600" />
                    <h4 className="text-[10px] font-black text-black tracking-widest">Investigations & Lab Orders</h4>
                  </div>
                  <div className="p-0 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100 border-collapse">
                      <thead className="bg-gray-50/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 tracking-widest">Investigation</th>
                          <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 tracking-widest">Status</th>
                          <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 tracking-widest">Interpretation</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-50">
                        {(consultationForm.testsRecommended.length > 0 && consultationForm.testsRecommended[0].description ? consultationForm.testsRecommended : [
                          { description: 'Complete Blood Count (CBC)', samples: 'Blood', labStatus: 'Verified', resultValue: '14.2 g/dL' }
                        ]).map((test, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="text-sm font-black text-black">{test.description}</p>
                              <p className="text-[9px] font-bold text-gray-400 tracking-tighter">Ref Id: {test.id || 'LAB-2910'}</p>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`text-[9px] font-black px-3 py-1 ${test.labStatus === 'Verified' ? 'text-blue-600' : 'text-black'}`}>
                                {test.labStatus?.toUpperCase() || 'ORDERED'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <p className="text-sm font-black text-black">{test.resultValue || 'Results Pending'}</p>
                              <p className="text-[9px] font-bold text-gray-400">{test.verifiedBy || 'Awaiting Lab Signature'}</p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Advice & Clinical Follow-up */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm ">
                  <div className="bg-white px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                    <PendingActionsIcon sx={{ fontSize: 16 }} className="text-blue-600" />
                    <h4 className="text-[10px] font-black text-black tracking-widest">Advice & Clinical Follow-up</h4>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="space-y-2">
                      <p className="text-[9px] font-black text-gray-400 tracking-widest">Clinical Advice & Instructions</p>
                      <p className="text-sm font-medium text-black leading-relaxed">
                        {consultationForm.instructions || 'Continue standard post-consultation care as directed by the primary physician.'}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                      <div className="p-4 bg-blue-50/30 rounded-xl border border-blue-100">
                        <p className="text-[9px] font-black text-blue-600 tracking-widest mb-2">Next Scheduled Visit</p>
                        <div className="flex items-center gap-3">
                          <CalendarMonthIcon sx={{ fontSize: 20 }} className="text-blue-600" />
                          <p className="text-lg font-black text-black">
                            {consultationForm.followUpRequired
                              ? new Date(consultationForm.followUpDate || Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                              : '2026-06-19'}
                          </p>
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-[9px] font-black text-gray-400 tracking-widest mb-2">Internal Case Remarks</p>
                        <p className="text-xs font-bold text-gray-600">{consultationForm.remarks || 'No additional internal remarks recorded for this session.'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showTokenModal} onClose={() => setShowTokenModal(false)} title={tokenStep === 'form' ? "Generate Patient Token" : "Token Generated Successfully"} size="md" footer={
        tokenStep === 'form' ? (
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowTokenModal(false)} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium" >Cancel </button>
            <button type="submit" form="opd-token-form" className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition-all flex items-center text-sm font-medium">  <ConfirmationNumberIcon className="mr-2" fontSize="small" /> Generate Token </button>
          </div>
        ) : (
          <div className="flex flex-row justify-center gap-3 w-full">
            <button onClick={handlePrintSlip} className="flex-1 py-3 bg-gray-900 text-white font-black rounded-xl hover:bg-black transition-all shadow-md flex items-center justify-center text-[10px] tracking-widest uppercase"><PrintIcon className="mr-2" fontSize="small" /> Print Record </button>
            <button onClick={() => setShowTokenModal(false)} className="flex-1 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all shadow-md flex items-center justify-center text-[10px] tracking-widest uppercase">Complete</button>
          </div>
        )
      }
      >
        {tokenStep === 'form' ? (
          <form id="opd-token-form" onSubmit={handleTokenSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-1 relative" ref={patientDropdownRef}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Patient Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input type="text" required className="w-full p-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400" placeholder="Search or enter full name" value={patientSearchTerm} onChange={(e) => { setPatientSearchTerm(e.target.value); setIsPatientDropdownOpen(true); setTokenForm({ ...tokenForm, patientName: e.target.value }); }} onFocus={() => setIsPatientDropdownOpen(true)} />
                  <KeyboardArrowDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" onClick={() => setIsPatientDropdownOpen(!isPatientDropdownOpen)} />
                </div>
                {isPatientDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                    {(registeredPatients || []).filter(p =>
                      (p.name || '').toLowerCase().includes((patientSearchTerm || '').toLowerCase()) ||
                      (p.phoneNo || '').includes(patientSearchTerm) ||
                      (p.id || '').toLowerCase().includes((patientSearchTerm || '').toLowerCase())
                    ).length > 0 ? (
                      (registeredPatients || []).filter(p =>
                        (p.name || '').toLowerCase().includes((patientSearchTerm || '').toLowerCase()) ||
                        (p.phoneNo || '').includes(patientSearchTerm) ||
                        (p.id || '').toLowerCase().includes((patientSearchTerm || '').toLowerCase())
                      ).map(patient => (
                        <div key={patient.id} className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 border-gray-100 transition-colors" onClick={() => handleSelectPatient(patient)}>
                          <div className="font-bold text-gray-800 text-sm">{patient.name}</div>
                          <div className="text-[10px] text-gray-500">{patient.id} • {patient.phoneNo}</div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-gray-500 text-sm">
                        No matching patient found
                        <div className="mt-1">
                          <button type="button" className="text-xs text-blue-600 font-bold hover:underline" onClick={() => { setTokenForm({ ...tokenForm, patientName: patientSearchTerm }); setIsPatientDropdownOpen(false); }}>+ Use &quot;{patientSearchTerm}&quot; as new </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">UHID / Patient ID</label>
                <input type="text" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400" placeholder="Optional for new" value={tokenForm.patientId || tokenForm.uhid} onChange={(e) => setTokenForm({ ...tokenForm, uhid: e.target.value, patientId: e.target.value })} />
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5"> Phone Number <span className="text-red-500">*</span> </label>
                <input type="tel" required className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400" placeholder="10-digit number" value={tokenForm.phoneNo} onChange={(e) => setTokenForm({ ...tokenForm, phoneNo: e.target.value })} />
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5"> Email Address </label>
                <input type="email" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400" placeholder="patient@email.com" value={tokenForm.email} onChange={(e) => setTokenForm({ ...tokenForm, email: e.target.value })} />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5"> Age <span className="text-red-500">*</span> </label>
                <input type="number" required className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Years" value={tokenForm.age} onChange={(e) => setTokenForm({ ...tokenForm, age: e.target.value })} />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5"> Gender <span className="text-red-500">*</span> </label>
                <select className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={tokenForm.gender} onChange={(e) => setTokenForm({ ...tokenForm, gender: e.target.value })}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5"> Blood Group </label>
                <input type="text" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="e.g., O+, B-" value={tokenForm.bloodGroup} onChange={(e) => setTokenForm({ ...tokenForm, bloodGroup: e.target.value })} />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5"> Visit Type </label>
                <select className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white" value={tokenForm.visitType} onChange={(e) => setTokenForm({ ...tokenForm, visitType: e.target.value })}>
                  <option value="New">New</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5"> Residential Address </label>
                <input type="text" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Street, Locality, City, State" value={tokenForm.address} onChange={(e) => setTokenForm({ ...tokenForm, address: e.target.value })} />
              </div>

              <div className="relative" ref={deptDropdownRef}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5"> Department <span className="text-red-500">*</span> </label>
                <div className="relative">
                  <input type="text" placeholder="Search Department..." className="w-full p-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={deptSearchTerm} onChange={(e) => { setDeptSearchTerm(e.target.value); setIsDeptDropdownOpen(true); setTokenForm({ ...tokenForm, department: '', doctorId: '' }); }} onFocus={() => setIsDeptDropdownOpen(true)} />
                  <KeyboardArrowDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" onClick={() => setIsDeptDropdownOpen(!isDeptDropdownOpen)} />
                </div>
                {isDeptDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                    {filteredDepartments.length > 0 ? (
                      filteredDepartments.map(dept => (
                        <div key={dept} className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 border-gray-100 transition-colors text-sm" onClick={() => handleSelectDept(dept)}> {dept}</div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-gray-500 text-sm">No departments found</div>
                    )}
                  </div>
                )}
              </div>

              <div className="relative" ref={docDropdownRef}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5"> Doctor <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input type="text" disabled={!tokenForm.department} placeholder={tokenForm.department ? "Search Doctor..." : "Select department first"} className={`w-full p-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${!tokenForm.department ? 'bg-gray-50 cursor-not-allowed' : ''}`} value={docSearchTerm} onChange={(e) => { setDocSearchTerm(e.target.value); setIsDocDropdownOpen(true); }} onFocus={() => tokenForm.department && setIsDocDropdownOpen(true)} />
                  <KeyboardArrowDownIcon className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 ${tokenForm.department ? 'cursor-pointer hover:text-gray-600' : 'cursor-not-allowed'} transition-colors`} onClick={() => tokenForm.department && setIsDocDropdownOpen(!isDocDropdownOpen)} />
                </div>
                {isDocDropdownOpen && tokenForm.department && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                    {loadingDeptDoctors ? (
                      <div className="p-3 text-center text-gray-500 text-sm flex items-center justify-center gap-2">
                        <div className="inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        Fetching department doctors...
                      </div>
                    ) : filteredDoctorsForToken.length > 0 ? (
                      filteredDoctorsForToken.map(doc => (
                        <div key={doc.id} className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 border-gray-100 transition-colors text-sm" onClick={() => handleSelectDoc(doc)}>
                          <div className="font-medium text-gray-800 text-sm">{doc.name}</div>
                          <div className="text-[10px] text-gray-500">Queue: {doc.queue} patients</div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-gray-500 text-sm">No active doctors found</div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5"> Appointment Type </label>
                <select className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white" value={tokenForm.appointmentType} onChange={(e) => setTokenForm({ ...tokenForm, appointmentType: e.target.value })}>
                  <option value="Walk-in">Walk-in</option>
                  <option value="Online">Online</option>
                  <option value="Tele-consultation">Tele-consultation</option>
                </select>
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Priority Level</label>
                <select className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white" value={tokenForm.priority} onChange={(e) => setTokenForm({ ...tokenForm, priority: e.target.value })}>
                  <option value="Normal">Normal</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5"> Referred By </label>
                <input type="text" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400" placeholder="Doctor or Clinic Name" value={tokenForm.referredBy} onChange={(e) => setTokenForm({ ...tokenForm, referredBy: e.target.value })} />
              </div>
            </div>
          </form>
        ) : (
          <div className="py-2 flex flex-col items-center">
            {/* Token Slip UI Card */}
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 flex flex-col mx-auto transform transition-all duration-500 animate-in fade-in zoom-in slide-in-from-bottom-4">

              {/* Header */}
              <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-8 text-white text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-6 -translate-y-6 rotate-12">
                  <ConfirmationNumberIcon sx={{ fontSize: 140 }} />
                </div>
                <div className="relative z-10">
                  <h4 className="text-[10px] font-black tracking-[0.3em] text-blue-200 mb-3 drop-shadow-sm">OPD TOKEN SLIP</h4>
                  <p className="text-6xl font-black mb-3 tracking-tighter drop-shadow-md">{generatedToken?.token}</p>
                  <div className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full">
                    <p className="text-[11px] font-bold text-blue-50 tracking-widest">{new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-8 bg-white relative">
                <div className="flex justify-between items-start mb-8">
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-400 tracking-[0.1em] font-black">Patient ID</p>
                    <p className="font-mono text-xs text-blue-900 font-black bg-blue-50 px-2 py-0.5 rounded inline-block">{generatedToken?.patientId}</p>
                    <div className="pt-2">
                      <p className="text-[10px] text-gray-400 tracking-[0.1em] font-black mb-1">Full Name</p>
                      <p className="font-black text-gray-900 text-xl leading-tight tracking-tight">{generatedToken?.patientName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black tracking-[0.1em] ${generatedToken?.priority === 'Urgent' ? 'bg-red-500 text-white shadow-sm ring-4 ring-red-50' : 'bg-green-500 text-white shadow-sm ring-4 ring-green-50'}`}> {generatedToken?.priority === 'Urgent' ? 'URGENT' : 'NORMAL'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-6 gap-x-6 mb-8">
                  <div>
                    <p className="text-[9px] text-gray-400 tracking-[0.2em] font-black mb-1.5">Age / Gender</p>
                    <p className="text-sm font-black text-gray-800">{generatedToken?.age}Y / {generatedToken?.gender}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 tracking-[0.2em] font-black mb-1.5">Blood Group</p>
                    <p className="text-sm font-black text-gray-800">{generatedToken?.bloodGroup}</p>
                  </div>
                  <div className="col-span-2 p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between group transition-all hover:bg-blue-50 hover:border-blue-100">
                    <div>
                      <p className="text-[9px] text-gray-400 tracking-[0.2em] font-black mb-1.5">Consulting Doctor</p>
                      <p className="text-base font-black text-blue-800 tracking-tight">{generatedToken?.doctor}</p>
                      <p className="text-[10px] font-bold text-blue-600 mt-0.5 tracking-widest">{generatedToken?.department}</p>
                    </div>
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform"> <PersonIcon fontSize="small" /></div>
                  </div>
                </div>

                <div className="pt-6 border-t-2 border-dashed border-gray-200 text-center relative">
                  <div className="absolute -left-10 -top-3 w-6 h-6 bg-gray-100 rounded-full"></div>
                  <div className="absolute -right-10 -top-3 w-6 h-6 bg-gray-100 rounded-full"></div>

                  <div className="inline-flex items-center justify-center space-x-2 text-green-600 mb-2"> <CheckCircleIcon sx={{ fontSize: 18 }} /> <span className="font-black text-[11px] tracking-[0.3em]">REGISTRATION CONFIRMED</span> </div>
                  <div className="flex items-center justify-center space-x-3 text-gray-500 font-bold text-[10px]">
                    <span className="flex items-center gap-1"><AccessTimeIcon sx={{ fontSize: 14 }} /> Est. Wait: {generatedToken?.waitingTime}</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span>No: {generatedToken?.queuePosition} in queue</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showViewPatientModal} onClose={() => setShowViewPatientModal(false)} title={`Comprehensive Medical Profile - ${selectedPatientForView?.patientName || 'Record'}`} size="xl" footer={<div className="flex justify-end gap-3 px-4 pb-2">
        <button onClick={() => setShowViewPatientModal(false)} className="px-6 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 font-bold transition-colors text-sm tracking-widest"> Close </button>
      </div>}>
        {selectedPatientForView && (
          <div className="space-y-6 py-2 px-1">
            {/* Clinical Identity Header */}
            <div className="flex flex-col md:flex-row justify-between items-start border border-gray-200 rounded-xl p-6 shadow-sm gap-6 bg-white">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white border border-blue-600 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm"> <PersonIcon sx={{ fontSize: 36 }} /></div>
                <div>
                  <h3 className="text-3xl font-black text-black tracking-tight leading-none mb-2"> {selectedPatientForView.patientName} </h3>
                  <div className="flex items-center gap-4 text-xs font-bold tracking-wider text-gray-500">
                    <span className="text-blue-600 border border-blue-100 px-2 py-0.5 rounded"> {selectedPatientForView.patientId || 'UHID-REG-291088'} </span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span className="flex items-center gap-1.5">  <CalendarMonthIcon sx={{ fontSize: 14 }} className="text-gray-400" /> Visit Date: {new Date().toLocaleDateString('en-GB')} </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black ${selectedPatientForView.status === 'Waiting' ? 'border-gray-900 text-gray-900' : selectedPatientForView.status === 'In Consultation' ? 'border-blue-600 text-blue-600' : 'border-blue-900 text-blue-900'}`}> {selectedPatientForView.status.toUpperCase()} </span>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-gray-100"> <ConfirmationNumberIcon sx={{ fontSize: 14 }} className="text-gray-400" />
                  <p className="text-[11px] font-bold text-gray-500 tracking-widest"> Token: <span className="text-black font-black">{selectedPatientForView.token}</span> </p>
                </div>
              </div>
            </div>

            {/* Information Architecture - Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Demographics & Vitals */}
              <div className="lg:col-span-1 space-y-6">
                {/* Demographic Card */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="bg-white px-5 py-3 border-b border-gray-100 flex items-center gap-2"> <GroupsIcon sx={{ fontSize: 16 }} className="text-blue-600" />
                    <h4 className="text-[10px] font-black text-black tracking-[0.2em]">Patient Demographics</h4>
                  </div>
                  <div className="p-5 grid grid-cols-2 gap-y-6 gap-x-4">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-gray-400 tracking-widest">Age / Gender</p>
                      <p className="text-sm font-bold text-black">{selectedPatientForView.age}Y / {selectedPatientForView.gender}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-gray-400 tracking-widest">Blood Group</p>
                      <p className="text-sm font-bold text-blue-600">{selectedPatientForView.bloodGroup || 'B+'}</p>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <p className="text-[9px] font-black text-gray-400 tracking-widest">Contact Identity</p>
                      <p className="text-sm font-bold text-black">{selectedPatientForView.phoneNo || '+91 99887 76655'}</p>
                      <p className="text-xs text-gray-500 truncate">{selectedPatientForView.email || 'patient.record@hospital.com'}</p>
                    </div>
                    <div className="col-span-2 space-y-1 pt-2">
                      <p className="text-[9px] font-black text-gray-400 tracking-widest">Permanent Address</p>
                      <p className="text-xs font-medium text-gray-700 leading-relaxed border-l border-gray-200 pl-3">
                        {selectedPatientForView.address || 'H.No 12, Sector 4, Green Valley Colony, Navi Mumbai - 400706'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Vital Signs Card */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="bg-white px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                    <TimelineIcon sx={{ fontSize: 16 }} className="text-blue-600" />
                    <h4 className="text-[10px] font-black text-black tracking-[0.2em]">Vital Signs Analysis</h4>
                  </div>
                  <div className="p-5">
                    {selectedPatientForView.vitals ? (
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { label: 'Blood Pressure', value: selectedPatientForView.vitals.bp, unit: 'mmHg' },
                          { label: 'Pulse Rate', value: selectedPatientForView.vitals.pulse, unit: 'BPM' },
                          { label: 'Temperature', value: selectedPatientForView.vitals.temperature, unit: '°F' },
                          { label: 'SpO2 Level', value: selectedPatientForView.vitals.spo2, unit: '%' }
                        ].map((vital, idx) => (
                          <div key={idx} className="p-3 bg-white rounded-xl border border-gray-100 flex flex-col items-center shadow-sm">
                            <p className="text-[8px] font-black text-gray-400 mb-1">{vital.label}</p>
                            <p className="text-sm font-black text-black">{vital.value} <span className="text-[8px] font-bold text-gray-400">{vital.unit}</span></p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-4 text-center">
                        <p className="text-xs text-gray-400 italic">Vitals not recorded for this visit</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Middle Column: Clinical Assessment & Treatment */}
              <div className="lg:col-span-2 space-y-6">
                {/* Treatment Journey Header */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-white border border-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                        <MedicalServicesIcon sx={{ fontSize: 18 }} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-400 tracking-widest leading-none mb-1">Consulting Physician</p>
                        <p className="text-sm font-black text-black">{selectedPatientForView.doctor}</p>
                      </div>
                    </div>
                    <div className="pl-11">
                      <span className="text-[10px] font-bold text-blue-600 border border-blue-50 px-2 py-0.5 rounded tracking-widest">{selectedPatientForView.department}</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-white border border-gray-100 rounded-lg flex items-center justify-center text-black"><CalendarMonthIcon sx={{ fontSize: 18 }} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-400 tracking-widest leading-none mb-1">Visit Type & Priority</p>
                        <p className="text-sm font-black text-black">{selectedPatientForView.visitType || 'New'}</p>
                      </div>
                    </div>
                    <div className="pl-11">
                      <span className={`text-[10px] font-black px-3 py-0.5 rounded tracking-widest border ${selectedPatientForView.priority === 'Urgent' ? 'border-blue-600 text-blue-600' : 'border-gray-200 text-gray-500'}`}> {selectedPatientForView.priority} PRIORITY </span>
                    </div>
                  </div>
                </div>

                {/* Diagnosis & Prescription Section */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="bg-white px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DescriptionIcon sx={{ fontSize: 16 }} className="text-blue-600" />
                      <h4 className="text-[10px] font-black text-black tracking-[0.2em]">Clinical Impression & Rx</h4>
                    </div>
                    {selectedPatientForView.diagnosis && <TaskAltIcon sx={{ fontSize: 16 }} className="text-blue-600" />}
                  </div>
                  <div className="p-0">
                    {selectedPatientForView.diagnosis ? (
                      <div className="space-y-0">
                        {/* Diagnosis Row */}
                        <div className="px-6 py-5 border-b border-gray-100">
                          <div className="flex items-start gap-4">
                            <div className="w-8 h-8 bg-white border border-gray-100 rounded-lg flex items-center justify-center text-blue-600 mt-1"> <AssessmentIcon sx={{ fontSize: 16 }} /> </div>
                            <div>
                              <p className="text-[9px] font-black text-gray-400 tracking-widest mb-1">Primary Diagnosis</p>
                              <p className="text-lg font-black text-black italic"> &quot;{selectedPatientForView.diagnosis}&quot; </p>
                            </div>
                          </div>
                        </div>

                        {/* Medications Table */}
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-100 border-collapse">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 tracking-widest">Medicine Detail</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 tracking-widest">Route/Dosage</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 tracking-widest">Frequency (M-A-N)</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 tracking-widest">Duration</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-50">
                              {(selectedPatientForView.medicationList || [
                                { name: 'Tab. Paracetamol', genericName: 'Paracetamol 650mg', dosage: '1 Tab', route: 'Oral', duration: '3 Days', instruction: 'After Food', frequency: { morning: true, afternoon: true, night: true } }
                              ]).map((med, idx) => (
                                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="px-6 py-4">
                                    <p className="text-sm font-black text-black">{med.name}</p>
                                    <p className="text-[10px] font-bold text-gray-400 italic">{med.genericName || med.instruction || 'As directed'}</p>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <p className="text-xs font-black text-blue-600">{med.route || 'Oral'}</p>
                                    <p className="text-[10px] font-bold text-gray-500">{med.dosage}</p>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <div className="flex justify-center gap-1.5">
                                      {['M', 'A', 'N'].map((slot, i) => {
                                        const active = i === 0 ? med.frequency?.morning : i === 1 ? med.frequency?.afternoon : med.frequency?.night;
                                        return (
                                          <span key={slot} className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-black ${active ? 'bg-black text-white' : 'bg-gray-100 text-gray-300'}`}>
                                            {slot}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <span className="text-xs font-black text-blue-600">{med.duration}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Advice Row */}
                        <div className="px-6 py-4 bg-gray-50/30">
                          <div className="flex items-center gap-3">
                            <InfoIcon sx={{ fontSize: 16 }} className="text-blue-600" />
                            <p className="text-xs text-gray-600 italic"> <span className="font-bold text-black text-[10px] mr-2 not-italic">Clinical Advice:</span> {selectedPatientForView.advice || 'Continue medications as prescribed. Review SOS.'} </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-12 text-center flex flex-col items-center bg-white">
                        <PendingActionsIcon sx={{ fontSize: 40 }} className="text-gray-200 mb-2" />
                        <p className="text-sm font-bold text-gray-400">Diagnosis Pending</p>
                        <p className="text-xs text-gray-400 mt-1 tracking-widest">Consultation is currently in progress</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Investigations & Lab Details */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="bg-white px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                    <ScienceIcon sx={{ fontSize: 16 }} className="text-blue-600" />
                    <h4 className="text-[10px] font-black text-black tracking-[0.2em]">Investigations & Diagnostics</h4>
                  </div>
                  <div className="p-0">
                    {selectedPatientForView.tests && selectedPatientForView.tests.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100 border-collapse">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 tracking-widest">Investigation Identity</th>
                              <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 tracking-widest">Fulfillment</th>
                              <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 tracking-widest">Interpretation</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-50">
                            {selectedPatientForView.tests.map((test, idx) => (
                              <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 bg-white border border-gray-100 rounded flex items-center justify-center text-blue-600"> <ScienceIcon sx={{ fontSize: 14 }} /> </div>
                                    <p className="text-xs font-black text-black tracking-tight">{test}</p>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <CheckCircleIcon sx={{ fontSize: 14 }} className="text-blue-600" />
                                    <span className="text-[9px] font-black text-blue-600 tracking-widest">Completed</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <span className="text-[9px] font-black px-2 py-1 bg-white text-gray-400 rounded border border-gray-100 tracking-widest">Normal Range</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="py-8 text-center bg-white">
                        <p className="text-xs text-gray-400 italic">No lab tests recommended during this visit</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="rounded-xl p-6 text-black border border-gray-200 bg-white shadow-sm relative overflow-hidden">
                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="space-y-1 text-center md:text-left">
                      <p className="text-[10px] font-black text-gray-400 tracking-[0.3em]">Total Billing Amount</p>
                      <p className="text-4xl font-black tracking-tight text-black">₹{calculateTotalAmount(selectedPatientForView)}.00</p>
                    </div>
                    <div className="flex flex-wrap justify-center md:justify-end gap-3">
                      <div className="bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 text-center min-w-[100px]">
                        <p className="text-[8px] font-black text-gray-400 mb-1">Consultation</p>
                        <p className="text-xs font-black text-black">₹{doctors.find(d => d.id === selectedPatientForView.assignedDoctorId)?.consultationFee || 300}</p>
                      </div>
                      <div className="bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 text-center min-w-[100px]">
                        <p className="text-[8px] font-black text-gray-400 mb-1">Lab Tests</p>
                        <p className="text-xs font-black text-black">₹{calculateTestsFee(selectedPatientForView)}</p>
                      </div>
                      {calculateSurgeryFee(selectedPatientForView) > 0 && (
                        <div className="bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 text-center min-w-[100px]">
                          <p className="text-[8px] font-black text-gray-400 mb-1">Procedures</p>
                          <p className="text-xs font-black text-black">₹{calculateSurgeryFee(selectedPatientForView)}</p>
                        </div>
                      )}
                    </div>
                    <div className={`px-4 py-2 rounded-lg font-black tracking-widest ${selectedPatientForView.status === 'Completed' ? 'border-blue-600 text-blue-600' : 'border-black text-black'}`}> {selectedPatientForView.status === 'Completed' ? 'Payment Received' : 'Pending Payment'} </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Transfer Patient Modal */}
      <Modal isOpen={showTransferModal} onClose={() => { setShowTransferModal(false); setTransferPatient(null); setSelectedTransferDoctor(null); }} title="Transfer Patient" size="lg">
        {transferPatient && (
          <div>
            {/* Patient Info Banner */}
            <div className="mb-5 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center"> <SwapHorizIcon className="text-yellow-600" fontSize="small" /></div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Transferring: {transferPatient.patientName}</p>
                  <p className="text-xs text-gray-500">Token: {transferPatient.token} • Currently with {transferPatient.doctor} ({transferPatient.department})</p>
                </div>
              </div>
            </div>

            {/* Section Title */}
            <p className="text-sm font-semibold text-gray-700 mb-3">Select a doctor to transfer to:</p>

            {/* Doctor Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
              {doctors.filter(d => d.isActive && String(d.id) !== String(transferPatient.assignedDoctorId)).length === 0 ? (
                <div className="col-span-1 sm:col-span-2 text-center p-6 bg-gray-50 border border-gray-100 rounded-xl">
                  <p className="text-gray-500 font-medium text-sm">No other active doctors available to transfer to.</p>
                </div>
              ) : doctors.filter(d => d.isActive && String(d.id) !== String(transferPatient.assignedDoctorId)).map(doctor => {
                const isSelected = selectedTransferDoctor?.id === doctor.id;
                const queueCount = opdPatients.filter(p => p.assignedDoctorId === doctor.id && p.status === 'Waiting').length;

                return (
                  <div key={doctor.id} onClick={() => setSelectedTransferDoctor(doctor)} className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-md ${isSelected ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                    {/* Selected Checkmark */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center"> <CheckIcon className="text-white" style={{ fontSize: 16 }} /> </div>
                    )}

                    {/* Doctor Name & Department */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${isSelected ? 'bg-blue-500' : 'bg-gray-400'}`}> {doctor.name.split(' ').pop()[0]} </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{doctor.name}</p>
                        <p className="text-xs text-gray-500">{doctor.department}</p>
                      </div>
                    </div>

                    {/* Doctor Stats */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-gray-500"> <AccessTimeIcon style={{ fontSize: 14 }} /> <span>{doctor.opdRoom}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full font-medium ${queueCount > 5 ? 'bg-red-100 text-red-700' : queueCount > 2 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}> {queueCount} in queue </span>
                    </div>

                    {/* Specialization */}
                    <p className="text-xs text-gray-400 mt-2">{doctor.specialization} • {doctor.experience}</p>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-gray-200">
              <button onClick={() => { setShowTransferModal(false); setTransferPatient(null); setSelectedTransferDoctor(null); }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={handleConfirmTransfer} disabled={!selectedTransferDoctor} className={`px-5 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${selectedTransferDoctor ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}><SwapHorizIcon style={{ fontSize: 18 }} /> Confirm Transfer </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Deactivate Doctor Modal */}
      <Modal isOpen={showDeactivateModal} onClose={() => { setShowDeactivateModal(false); setDoctorToDeactivate(null); setPatientsToReassign([]); }} title="Deactivate Doctor" size="md">
        {doctorToDeactivate && (
          <div className="p-1">
            <div className="flex items-center gap-4 mb-6 p-4 bg-red-50 border border-red-100 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600"> <WarningIcon fontSize="large" /></div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Confirm Deactivation</h3>
                <p className="text-sm text-red-600 font-medium">Dr. {doctorToDeactivate.name}</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-gray-600 text-sm leading-relaxed">This doctor has <span className="font-bold text-gray-900">{patientsToReassign.length} active patients</span> in their queue. Deactivating will automatically reassign these patients to other available doctors in the same department.</p>

              <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto border border-gray-100">
                <p className="text-xs font-bold text-gray-400 tracking-wider mb-2">Patients to be reassigned:</p>
                <div className="space-y-2">
                  {patientsToReassign.map(patient => (
                    <div key={patient.id} className="flex justify-between items-center text-sm bg-white p-2 rounded border border-gray-100">
                      <span className="font-medium text-gray-700">{patient.patientName}</span>
                      <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-bold">{patient.token}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button onClick={() => { setShowDeactivateModal(false); setDoctorToDeactivate(null); setPatientsToReassign([]); }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">No, Keep Active</button>
              <button onClick={handleConfirmDeactivation} className="px-6 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-md transition-all flex items-center gap-2"> <PowerSettingsNewIcon style={{ fontSize: 18 }} /> Confirm & Reassign </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showLabResultModal} onClose={() => setShowLabResultModal(false)} title="Clinical Investigation Report" size="lg" footer={selectedLabRecord && (
        <div className="flex justify-end gap-3 px-4 pb-2">
          <button className="px-6 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 font-bold transition-colors text-sm tracking-widest" onClick={() => setShowLabResultModal(false)}> Close </button>
        </div>
      )}
      >
        {selectedLabRecord && (
          <div className="space-y-6 py-2 px-1">
            {/* Header Identity Section */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">

              <div className="flex flex-col md:flex-row justify-between items-start relative z-10 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <ScienceIcon sx={{ fontSize: 16 }} />
                    <span className="text-[10px] font-black tracking-widest">Central Laboratory Services</span>
                  </div>
                  <h3 className="text-2xl font-black text-black tracking-tight leading-none ">{selectedLabRecord.patientName}</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-blue-600 border border-blue-100 px-2 py-0.5 rounded">ID: {selectedLabRecord.patientId}</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span className="text-[10px] font-black text-gray-500 tracking-wider">{selectedLabRecord.age}Y / {selectedLabRecord.gender}</span>
                  </div>
                </div>
                <div className="md:text-right space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 text-blue-600 rounded-lg text-[10px] font-black ">
                    <CheckCircleIcon sx={{ fontSize: 14 }} /> Report Verified
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 tracking-widest">Date: <span className="text-black font-black">{selectedLabRecord.date}</span></p>
                    <p className="text-[10px] font-black text-blue-600 tracking-widest italic">REF ID: {selectedLabRecord.reportId}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Investigation Table */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="bg-white px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                <ScienceIcon sx={{ fontSize: 16 }} className="text-blue-600" />
                <h4 className="text-[10px] font-black text-black tracking-widest">Ordered Investigations</h4>
              </div>
              <div className="max-h-[280px] overflow-y-auto">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead className="sticky top-0 z-20 bg-gray-50/50 border-b border-gray-100">
                    <tr>
                      <th className="w-2/3 px-6 py-4 text-[10px] font-black text-gray-400 tracking-widest">Investigation Identity & Details</th>
                      <th className="w-1/3 px-6 py-4 text-[10px] font-black text-gray-400 tracking-widest text-right">Fulfillment Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 bg-white">
                    {(() => {
                      const prescribed = (selectedLabRecord.prescribedTests || '').split(',').map(s => s.trim()).filter(Boolean);
                      const performed = (selectedLabRecord.performedTests || '').split(',').map(s => s.trim()).filter(Boolean);
                      const allTests = Array.from(new Set([...prescribed, ...performed]));

                      if (allTests.length === 0) return (
                        <tr>
                          <td colSpan="2" className="px-6 py-12 text-center text-gray-400 italic text-sm font-medium">No investigations recorded for this order.</td>
                        </tr>
                      );

                      return allTests.map((test, idx) => {
                        const isPrescribed = prescribed.includes(test);
                        const isPerformed = performed.includes(test);

                        return (
                          <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-start gap-4">
                                <div className="w-10 h-10 border border-gray-100 rounded-xl flex items-center justify-center text-blue-600 bg-white shadow-sm">
                                  <ScienceIcon sx={{ fontSize: 18 }} />
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-black text-black tracking-tight leading-none ">{test}</p>
                                    <span className="text-[8px] font-black text-blue-600">
                                      {test.length > 5 ? 'PANEL' : 'SPECIFIC'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <p className="text-[9px] font-bold text-gray-400">{isPrescribed ? 'Physician Ordered' : 'Laboratory Add-on'}</p>
                                    <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                                    <p className="text-[9px] font-black text-blue-600">Code: {idx + 101}</p>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex justify-end">
                                {isPerformed ? (
                                  <div className="inline-flex items-center gap-1.5 px-3 py-1 text-black">
                                    <CheckCircleIcon sx={{ fontSize: 14 }} />
                                    <span className="text-[10px] font-black">Completed</span>
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center gap-1.5 px-3 py-1 text-gray-500">
                                    <AccessTimeIcon sx={{ fontSize: 14 }} />
                                    <span className="text-[10px] font-black tracking-widest">Pending</span>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Technical Validation & Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-4 p-5 rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="w-12 h-12 border border-gray-100 rounded-xl flex items-center justify-center text-blue-600 bg-blue-50/30"> <ScienceIcon sx={{ fontSize: 20 }} /> </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-gray-400 tracking-widest">Validated & Signed By</p>
                  <p className="text-sm font-black text-black">{selectedLabRecord.uploadedBy}</p>
                  <div className="flex items-center gap-1.5">
                    <CheckCircleIcon sx={{ fontSize: 12 }} className="text-blue-600" />
                    <span className="text-[9px] font-black text-blue-600 tracking-widest">Digital Signature Verified</span>
                  </div>
                </div>
              </div>
              <div className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 relative overflow-hidden shadow-sm flex items-center">
                <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center text-blue-600 opacity-20"> <InfoIcon sx={{ fontSize: 24 }} /> </div>
                <div className="relative z-10 flex gap-3">
                  <p className="text-[10px] font-bold text-gray-500 italic">
                    Note: These results should be correlated with clinical findings by the consulting physician. Laboratory results are subject to biological variations.
                  </p>
                </div>
              </div>
            </div>

            {/* Results Interpretation */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden border-t-4 border-t-blue-600">
              <div className="bg-white px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                <AssessmentIcon sx={{ fontSize: 16 }} className="text-blue-600" />
                <h4 className="text-[10px] font-black text-black tracking-widest">Clinical Interpretation</h4>
              </div>
              <div className="p-8 bg-gray-50/30">
                <p className="text-lg font-black text-black text-center leading-relaxed italic">
                  &quot;{selectedLabRecord.result}&quot;
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Pharmacy Details Modal */}
      <Modal isOpen={showPharmacyModal} onClose={() => setShowPharmacyModal(false)} title="Prescription Dispensing Record" size="lg" footer={selectedPharmacyRecord && (
        <div className="flex justify-end gap-3 px-4 pb-2">
          <button className="px-6 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 font-bold transition-colors text-sm tracking-widest" onClick={() => setShowPharmacyModal(false)}> Close </button>
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md flex items-center text-sm font-bold tracking-widest" onClick={() => { alert('Dispensing medications for ' + selectedPharmacyRecord.patientName); setShowPharmacyModal(false); }}> <CheckCircleIcon className="mr-2" fontSize="small" /> Confirm Dispense </button>
        </div>
      )}>
        {selectedPharmacyRecord && (
          <div className="space-y-6 py-2 px-1">
            {/* Header Identity Section */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between items-start relative z-10 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-blue-600 mb-1">
                    <MedicationIcon sx={{ fontSize: 16 }} />
                    <span className="text-[10px] font-black tracking-widest uppercase">Pharmacy Services</span>
                  </div>
                  <h3 className="text-2xl font-black text-black tracking-tight leading-none ">{selectedPharmacyRecord.patientName}</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-blue-600 border border-blue-100 px-2 py-0.5 rounded">ID: {selectedPharmacyRecord.patientId}</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span className="text-[10px] font-black text-gray-500 tracking-wider">{selectedPharmacyRecord.age}Y / {selectedPharmacyRecord.gender}</span>
                  </div>
                </div>
                <div className="md:text-right space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 text-blue-600 rounded-lg text-[10px] font-black ">
                    <CheckCircleIcon sx={{ fontSize: 14 }} /> Ready to Dispense
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Prescribed By</p>
                    <p className="text-sm font-black text-black leading-none">{selectedPharmacyRecord.doctor}</p>
                    <p className="text-[10px] font-bold text-blue-600 tracking-widest">{selectedPharmacyRecord.department}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Inventory & Schedule */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="bg-white px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MedicationIcon sx={{ fontSize: 16 }} className="text-blue-600" />
                  <h4 className="text-[10px] font-black text-black tracking-widest uppercase">Medication Inventory</h4>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-600"></span><span className="text-[9px] font-bold text-gray-500">Morning</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500"></span><span className="text-[9px] font-bold text-gray-500">Afternoon</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-600"></span><span className="text-[9px] font-bold text-gray-500">Night</span></div>
                </div>
              </div>

              <div className="p-4 space-y-4 max-h-[420px] overflow-y-auto">
                {selectedPharmacyRecord.prescriptions.map((med, idx) => (
                  <div key={idx} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col lg:flex-row lg:items-center gap-6 hover:border-black transition-all shadow-sm">
                    {/* Med Name & Duration */}
                    <div className="flex-1 flex gap-4 items-center">
                      <div className="w-9 h-9 border border-gray-200 bg-gray-50 rounded-lg flex items-center justify-center text-black font-black text-base">
                        {idx + 1}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-base font-black text-black leading-tight">{med.name}</p>
                          <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded tracking-widest uppercase">
                            {med.type || 'Medication'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold text-gray-400 tracking-widest uppercase">Dosage:</span>
                            <span className="text-[10px] font-black text-black">{med.dosage || 'As Directed'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold text-gray-400 tracking-widest uppercase">Duration:</span>
                            <span className="text-[10px] font-black text-blue-600 tracking-widest">{med.duration}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Schedule Side-by-Side - Reduced Size */}
                    <div className="flex items-center gap-2">
                      <div className={`w-11 h-12 rounded-lg flex flex-col items-center justify-center border transition-all ${med.morning ? 'border-orange-600 bg-orange-600 text-white shadow-md' : 'border-gray-100 bg-gray-50 text-gray-300'}`}>
                        <span className="text-[7px] font-black tracking-tighter mb-0.5">MORN</span>
                        <span className="text-base font-black leading-none">{med.morning ? '1' : '0'}</span>
                      </div>
                      <div className={`w-11 h-12 rounded-lg flex flex-col items-center justify-center border transition-all ${med.afternoon ? 'border-yellow-500 bg-yellow-500 text-white shadow-md' : 'border-gray-100 bg-gray-50 text-gray-300'}`}>
                        <span className="text-[7px] font-black tracking-tighter mb-0.5">AFTN</span>
                        <span className="text-base font-black leading-none">{med.afternoon ? '1' : '0'}</span>
                      </div>
                      <div className={`w-11 h-12 rounded-lg flex flex-col items-center justify-center border transition-all ${med.night ? 'border-indigo-600 bg-indigo-600 text-white shadow-md' : 'border-gray-100 bg-gray-50 text-gray-300'}`}>
                        <span className="text-[7px] font-black tracking-tighter mb-0.5">NGHT</span>
                        <span className="text-base font-black leading-none">{med.night ? '1' : '0'}</span>
                      </div>
                    </div>

                    {/* Instructions Box */}
                    <div className="lg:w-48 p-3 rounded-xl border border-gray-100 bg-gray-50/50 flex flex-col justify-center">
                      <p className="text-[8px] font-black text-gray-400 tracking-widest mb-1 uppercase">Instructions</p>
                      <p className="text-[10px] font-bold text-black leading-tight italic">&quot;{med.instruction}&quot;</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Queue Details / Modify Modal */}
      <Modal
        isOpen={showQueueDetailModal}
        onClose={() => setShowQueueDetailModal(false)}
        title="Manage Patient Queue Details"
        size="lg"
        footer={selectedQueuePatient && (
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <button className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-3" onClick={() => { toast.success('Patient details updated successfully'); setShowQueueDetailModal(false); }}>Save All Changes
            </button>
            {selectedQueuePatient.status !== 'Exited' && selectedQueuePatient.status !== 'Cancelled' ? (
              <button className="flex-1 py-4 border-2 border-red-100 text-red-600 rounded-2xl font-black text-xs tracking-[0.2em] hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-3 group" onClick={() => { setSelectedExitPatient(selectedQueuePatient); setExitForm({ billingStatus: 'Pending', followUpRequired: false, followUpDate: '', remarks: '' }); setShowExitModal(true); }}>  <ExitToAppIcon className="group-hover:translate-x-1 transition-transform" /> Complete & Exit Patient
              </button>
            ) : (
              <div className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold text-xs tracking-widest flex items-center justify-center gap-2 border border-gray-200">
                <CheckCircleIcon sx={{ fontSize: 18 }} className="text-green-500" /> Patient {selectedQueuePatient.status === 'Cancelled' ? 'Cancelled' : 'Exited'}
              </div>
            )}
          </div>
        )}
      >
        {selectedQueuePatient && (
          <div className="space-y-8 py-2">
            {/* Patient Identity Header */}
            <div className="flex items-center gap-6 pb-6 border-b border-gray-100">
              <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 shadow-inner"><PersonIcon sx={{ fontSize: 40 }} /> </div>
              <div className="flex-1">
                <h3 className="text-2xl font-black text-gray-900 leading-tight">{selectedQueuePatient.patientName}</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                  <span className="text-xs font-bold text-gray-400 tracking-widest">UHID: {selectedQueuePatient.patientId}</span>
                  <span className="text-xs font-bold text-gray-400 tracking-widest">•</span>
                  <span className="text-xs font-bold text-blue-600 tracking-widest">Token: {selectedQueuePatient.token}</span>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest border-2 ${selectedQueuePatient.priority === 'Urgent' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}> {selectedQueuePatient.priority} Priority </span>
              </div>
            </div>

            {/* Editable Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 tracking-widest ml-1">Assigned Department</label>
                <select 
                  className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold text-gray-800 focus:border-blue-600 focus:bg-white transition-all outline-none"
                  value={selectedQueuePatient.department}
                  onChange={(e) => {
                    const newDept = e.target.value;
                    const matchedDoc = AVAILABLE_DOCTORS.find(d => d.department === newDept && d.isActive);
                    setSelectedQueuePatient(prev => ({
                      ...prev,
                      department: newDept,
                      doctor: matchedDoc ? matchedDoc.name : '',
                      assignedDoctorId: matchedDoc ? matchedDoc.id : ''
                    }));
                    setOpdPatients(prev => prev.map(p => 
                      p.id === selectedQueuePatient.id ? {
                        ...p,
                        department: newDept,
                        doctor: matchedDoc ? matchedDoc.name : '',
                        assignedDoctorId: matchedDoc ? matchedDoc.id : ''
                      } : p
                    ));
                  }}
                >
                  {Array.from(new Set([selectedQueuePatient.department, ...DEPARTMENTS])).filter(Boolean).map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 tracking-widest ml-1">Consulting Doctor</label>
                <select 
                  className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold text-gray-800 focus:border-blue-600 focus:bg-white transition-all outline-none"
                  value={selectedQueuePatient.doctor}
                  onChange={(e) => {
                    const docName = e.target.value;
                    const docObj = AVAILABLE_DOCTORS.find(d => d.name === docName);
                    if (docObj) {
                      setSelectedQueuePatient(prev => ({
                        ...prev,
                        doctor: docObj.name,
                        assignedDoctorId: docObj.id,
                        department: docObj.department
                      }));
                      setOpdPatients(prev => prev.map(p => 
                        p.id === selectedQueuePatient.id ? {
                          ...p,
                          doctor: docObj.name,
                          assignedDoctorId: docObj.id,
                          department: docObj.department
                        } : p
                      ));
                    }
                  }}
                >
                  {AVAILABLE_DOCTORS.filter(d => d.isActive).map(doc => (
                    <option key={doc.id} value={doc.name}>{doc.name} ({doc.department})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 tracking-widest ml-1">Queue Priority</label>
                <div className="flex gap-3">
                  <button className={`flex-1 py-3 rounded-xl border-2 font-black text-[10px] tracking-widest transition-all ${selectedQueuePatient.priority === 'Normal' ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-white border-gray-100 text-gray-400 hover:border-emerald-200'}`}>Normal</button>
                  <button className={`flex-1 py-3 rounded-xl border-2 font-black text-[10px] tracking-widest transition-all ${selectedQueuePatient.priority === 'Urgent' ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-100' : 'bg-white border-gray-100 text-gray-400 hover:border-red-200'}`}>Urgent</button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 tracking-widest ml-1">Current Status</label>
                <div className="p-4 bg-blue-50 border-2 border-blue-100 rounded-2xl text-sm font-black text-blue-700 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  Waiting in Queue
                </div>
              </div>
            </div>

            {/* Vital Signs (Editable Mini Cards) */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-gray-900 tracking-[0.2em] mb-4">Patient Vital Signs</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'BP', value: '120/80', unit: 'mmHg' },
                  { label: 'Pulse', value: '72', unit: 'bpm' },
                  { label: 'Temp', value: '98.6', unit: '°F' },
                  { label: 'SpO2', value: '98', unit: '%' }
                ].map((vital, idx) => (
                  <div key={idx} className="p-4 bg-white border-2 border-gray-50 rounded-2xl hover:border-blue-100 transition-colors">
                    <p className="text-[8px] font-black text-gray-400 tracking-widest mb-1">{vital.label}</p>
                    <input type="text" defaultValue={vital.value} className="w-full bg-transparent text-sm font-black text-gray-800 outline-none" />
                    <p className="text-[8px] font-bold text-gray-400 mt-1">{vital.unit}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Patient Journey Stepper */}
            <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
              <h4 className="text-[10px] font-black text-gray-900 tracking-[0.2em] mb-6">OPD Workflow Progress</h4>
              <div className="flex items-center justify-between relative px-2">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 z-0"></div>
                <div className="absolute top-1/2 left-0 w-1/3 h-1 bg-blue-600 -translate-y-1/2 z-0 transition-all duration-1000"></div>
                {[
                  { label: 'Reg', status: 'done' },
                  { label: 'Consult', status: 'current' },
                  { label: 'Lab/Diag', status: 'pending' },
                  { label: 'Pharmacy', status: 'pending' },
                  { label: 'Billing', status: 'pending' }
                ].map((step, idx) => (
                  <div key={idx} className="relative z-10 flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${step.status === 'done' ? 'bg-blue-600 border-blue-100 text-white' : step.status === 'current' ? 'bg-white border-blue-600 text-blue-600' : 'bg-white border-gray-200 text-gray-400'}`}>
                      {step.status === 'done' ? <CheckIcon sx={{ fontSize: 14 }} /> : <span className="text-[10px] font-black">{idx + 1}</span>}
                    </div>
                    <span className={`text-[8px] font-black tracking-widest mt-2 ${step.status === 'pending' ? 'text-gray-400' : 'text-gray-900'}`}>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Patient Exit Modal */}
      <Modal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        title="Finalize Patient Exit"
        size="lg"
        footer={selectedExitPatient && (
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <button
              className="flex-1 py-4 border-2 border-gray-100 text-gray-400 rounded-2xl font-black text-xs tracking-widest hover:border-gray-900 hover:text-gray-900 transition-all"
              onClick={() => setShowExitModal(false)}
            >
              Cancel
            </button>
            <button
              className={`flex-1 py-4 rounded-2xl font-black text-xs tracking-widest transition-all shadow-xl flex items-center justify-center gap-2 ${exitForm.billingStatus === 'Paid' ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              disabled={exitForm.billingStatus !== 'Paid'}
              onClick={() => { handlePatientExit(selectedExitPatient); setShowExitModal(false); }}
            >
              <CheckCircleIcon sx={{ fontSize: 18 }} /> Complete & Exit
            </button>
          </div>
        )}
      >
        {selectedExitPatient && (
          <div className="space-y-6">
            {/* Sticky Patient Identity Header */}
            <div className="sticky -top-6 bg-white z-10 flex items-center gap-4 pb-4 border-b border-gray-100 -mx-6 px-6 pt-2">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner shrink-0">
                <PersonIcon sx={{ fontSize: 32 }} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 leading-tight">{selectedExitPatient.patientName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded tracking-widest border border-blue-100 ">UHID: {selectedExitPatient.patientId}</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  <span className="text-[10px] font-black text-gray-400 tracking-widest ">Token: {selectedExitPatient.token}</span>
                </div>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="space-y-6">
              {/* Clinical Summary */}
              <div className="bg-blue-50/30 rounded-3xl p-6 border border-blue-100 space-y-6">
                <div className="flex items-center justify-between border-b border-blue-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-50"> <MedicalServicesIcon sx={{ fontSize: 20 }} /> </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 tracking-widest">Consulting Doctor</p>
                      <p className="text-sm font-black text-gray-900">{selectedExitPatient.doctor || 'Not Assigned'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 tracking-widest">Department</p>
                    <p className="text-sm font-black text-blue-600 tracking-widest">{selectedExitPatient.department || 'OPD'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Medications */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1"> <MedicationIcon className="text-emerald-500" sx={{ fontSize: 18 }} /> <h4 className="text-[10px] font-black text-gray-900 tracking-widest">Prescribed Medications</h4></div>
                    <div className="space-y-2">
                      {selectedExitPatient.medications && selectedExitPatient.medications.length > 0 ? (
                        selectedExitPatient.medications.map((med, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white/60 p-3 rounded-2xl border border-white shadow-sm backdrop-blur-sm">
                            <span className="text-xs font-bold text-gray-800">{med}</span>
                            <span className="text-[10px] font-black text-gray-400 ">1-0-1</span>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 text-center">
                          <p className="text-[10px] font-bold text-gray-400 italic">No Medications Recorded</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tests */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1"> <ScienceIcon className="text-orange-500" sx={{ fontSize: 18 }} /> <h4 className="text-[10px] font-black text-gray-900 tracking-widest">Diagnostic Investigations</h4></div>
                    <div className="space-y-2">
                      {selectedExitPatient.tests && selectedExitPatient.tests.length > 0 ? (
                        selectedExitPatient.tests.map((test, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white/60 p-3 rounded-2xl border border-white shadow-sm backdrop-blur-sm group">
                            <div> <p className="text-xs font-bold text-gray-800">{test}</p> <p className="text-[9px] font-black text-orange-600 tracking-widest">Est. ₹{(200 + (idx * 150)).toFixed(2)}</p> </div>
                            <button className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="Download Requisition" onClick={() => alert(`Downloading Requisition for ${test}...`)}> <PrintIcon sx={{ fontSize: 14 }} /> </button>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 text-center"> <p className="text-[10px] font-bold text-gray-400 italic">No Tests Recommended</p></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Billing, Follow-up, Remarks */}
              <div className="space-y-6 pb-4">
                {/* Billing Status */}
                <div>
                  <label className="text-[10px] font-black text-gray-400 tracking-widest block mb-2 ml-1">Billing & Payment Check</label>
                  <div className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${exitForm.billingStatus === 'Paid' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${exitForm.billingStatus === 'Paid' ? 'bg-emerald-100' : 'bg-red-100'}`}> <PaymentsIcon sx={{ fontSize: 20 }} /> </div>
                      <div> <p className="text-[10px] font-black tracking-widest opacity-60">Final Checkout Amount</p>
                        <p className="font-bold text-sm"> {exitForm.billingStatus === 'Paid' ? 'Fully Paid' : 'Pending: ₹1,450.00'} </p> </div>
                    </div>
                    {exitForm.billingStatus !== 'Paid' && (
                      <button className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-black tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-100" onClick={() => setExitForm({ ...exitForm, billingStatus: 'Paid' })} > Pay Now </button>
                    )}
                  </div>
                </div>

                {/* Follow-up Section */}
                <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-900 tracking-widest block">Follow-up Required?</label>
                      <p className="text-[10px] text-gray-500 font-medium mt-0.5">Based on doctor&apos;s recommendation</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={exitForm.followUpRequired} onChange={(e) => setExitForm({ ...exitForm, followUpRequired: e.target.checked })} />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {exitForm.followUpRequired && (
                    <div className="space-y-2 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="text-[10px] font-black text-gray-400 tracking-widest ml-1">Suggested Re-visit Date</label>
                      <div className="relative">
                        <input type="date" className="w-full p-4 bg-white border-2 border-gray-100 rounded-2xl text-sm font-bold text-gray-800 focus:border-blue-600 transition-all outline-none" value={exitForm.followUpDate} onChange={(e) => setExitForm({ ...exitForm, followUpDate: e.target.value })} /> 
                        <CalendarMonthIcon className="absolute right-4 top-4 text-gray-400 pointer-events-none" /> 
                      </div>
                    </div>
                  )}
                </div>

                {/* Remarks */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 tracking-widest ml-1">Exit Remarks / Notes</label>
                  <textarea className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold text-gray-800 focus:border-blue-600 focus:bg-white transition-all outline-none min-h-[100px] resize-none" placeholder="Any final instructions for the patient or internal notes..." value={exitForm.remarks} onChange={(e) => setExitForm({ ...exitForm, remarks: e.target.value })} ></textarea>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Add the Payment Modal Component - Place this before the closing </div> of your main component */}
      <Modal isOpen={showPaymentModal} onClose={() => !paymentProcessing && setShowPaymentModal(false)} title="Clinical Billing Gateway" size="lg" footer={selectedPaymentPatient && (
        <div className="flex gap-4 w-full px-2">
          <button onClick={() => setShowPaymentModal(false)} className="flex-1 px-8 py-4 border-2 border-gray-100 text-gray-400 rounded-2xl hover:border-gray-900 hover:text-gray-900 transition-all font-black text-[10px] tracking-[0.2em]"> Close </button>
          <button onClick={handleProcessPaymentWithModal} disabled={paymentProcessing} className="flex-[2] px-8 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all font-black text-[10px] tracking-[0.2em] shadow-2xl shadow-gray-200 disabled:opacity-50 flex items-center justify-center gap-3"> {paymentProcessing ? (<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>) : (<><CheckCircleIcon sx={{ fontSize: 18 }} /> Process Payment: ₹{calculatePaymentTotal()}</>)} </button>
        </div>
      )}
      >
        {selectedPaymentPatient && (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8">
              {/* Patient Identity Section */}
              <div className="pb-6 border-b border-gray-100">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-3xl border-2 border-gray-50 flex items-center justify-center text-gray-400 shadow-sm"> <PersonIcon sx={{ fontSize: 32 }} /> </div>
                    <div>
                      <h3 className="text-2xl font-black text-gray-900 tracking-tight">{paymentBillingData.patientName}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded tracking-widest border border-blue-100">{paymentBillingData.patientId}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span className="text-[10px] font-black text-gray-400 tracking-widest">TOKEN: {paymentBillingData.token}</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-1 gap-x-8 gap-y-1 text-left md:text-right">
                    <p className="text-[9px] font-black text-gray-400 tracking-widest">Invoicing Physician</p>
                    <p className="text-sm font-black text-gray-900">{paymentBillingData.doctor}</p>
                    <p className="text-[9px] font-black text-gray-400 tracking-widest mt-2 md:mt-1">Billing Cycle</p>
                    <p className="text-xs font-bold text-blue-600">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
              </div>

              {/* Billing Items Container */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[10px] font-black text-gray-900 tracking-[0.3em]">Service Breakdown</h4>
                    <p className="text-[10px] text-gray-400 font-bold mt-1 tracking-widest">Itemized Medical Charges</p>
                  </div>
                  <button onClick={addPaymentLabTest} className="flex items-center gap-2 px-4 py-2 border-2 border-gray-50 text-gray-400 rounded-xl text-[10px] font-black tracking-widest hover:border-blue-600 hover:text-blue-600 transition-all group"> <AddIcon sx={{ fontSize: 16 }} className="group-hover:rotate-90 transition-transform" /> Add Investigation </button>
                </div>

                <div className="space-y-4">
                  {/* Doctor Fee Card */}
                  <div className="p-6 border-2 border-gray-50 rounded-3xl hover:border-gray-200 transition-all group">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400"> <MedicalServicesIcon sx={{ fontSize: 20 }} /></div>
                        <div>
                          <p className="text-[9px] font-black text-gray-400 tracking-[0.2em] mb-1">Professional Service</p>
                          <h5 className="text-sm font-black text-gray-900 tracking-wider">Consultation Fee (Dr. {paymentBillingData.doctor})</h5>
                          <p className="text-[10px] text-gray-500 font-bold tracking-widest mt-1">OPD Registration & Assessment</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="relative">
                          <span className="absolute -left-4 top-1/2 -translate-y-1/2 text-gray-300 font-black text-xs">₹</span>
                          <input type="number" value={paymentBillingData.consultationFee} onChange={(e) => updatePaymentBillingData('consultationFee', e.target.value)} className="w-24 bg-transparent border-b-2 border-transparent focus:border-gray-900 text-xl font-black text-gray-900 text-right outline-none transition-all p-1" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lab Test Cards */}
                  {paymentBillingData.labTests.map((test, index) => (
                    <div key={index} className="p-6 border-2 border-gray-50 rounded-3xl hover:border-blue-100 transition-all group animate-in fade-in slide-in-from-top-2">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-4 flex-1">
                          <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-blue-400"><ScienceIcon sx={{ fontSize: 20 }} /> </div>
                          <div className="flex-1">
                            <p className="text-[9px] font-black text-blue-400 tracking-[0.2em] mb-1">Diagnostic Investigation</p>
                            <input type="text" value={test.name} onChange={(e) => updatePaymentLabTest(index, 'name', e.target.value)} placeholder="Investigation Name..." className="w-full bg-transparent border-none p-0 text-sm font-black text-gray-900 tracking-wider focus:ring-0" />
                            <p className="text-[10px] text-gray-400 font-bold tracking-widest mt-1">Laboratory Facility Charges</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="text-right">
                            <div className="relative">
                              <span className="absolute -left-4 top-1/2 -translate-y-1/2 text-gray-300 font-black text-xs">₹</span>
                              <input type="number" value={test.fee} onChange={(e) => updatePaymentLabTest(index, 'fee', e.target.value)} className="w-24 bg-transparent border-b-2 border-transparent focus:border-blue-600 text-xl font-black text-gray-900 text-right outline-none transition-all p-1" />
                            </div>
                          </div>
                          <button onClick={() => removePaymentLabTest(index)} className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><DeleteIcon sx={{ fontSize: 18 }} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Section */}
              <div className="pt-8 border-t-2 border-dashed border-gray-100 flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-[10px] font-black text-gray-400 tracking-[0.3em]">Total Receivable Amount</p>
                  </div>
                  <p className="text-[10px] text-gray-500 font-bold italic tracking-wider">Net payable inclusive of all clinical service taxes</p>
                </div>
                <div className="text-right">
                  <span className="text-5xl font-black text-gray-900 tracking-tighter">₹{calculatePaymentTotal()}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default OPDManagement;