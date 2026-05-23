
import React, { useState, useEffect, useRef } from 'react';
import LoadingSpinner from '../../../../components/common/LoadingSpinner/LoadingSpinner';
import Modal from '../../../../components/common/Modal/Modal';
import {
  KeyboardArrowDown as KeyboardArrowDownIcon, Search as SearchIcon, Print as PrintIcon,
  CheckCircle as CheckCircleIcon, ConfirmationNumber as ConfirmationNumberIcon,
  MedicalServices as MedicalServicesIcon, Queue as QueueIcon, Person as PersonIcon,
  AccessTime as AccessTimeIcon, Warning as WarningIcon, PersonAdd as PersonAddIcon,
  PlayArrow as PlayArrowIcon, SwapHoriz as SwapHorizIcon, Visibility as VisibilityIcon,
  Close as CloseIcon, PowerSettingsNew as PowerSettingsNewIcon, Check as CheckIcon,
  Add as AddIcon, Description as DescriptionIcon, KeyboardArrowUp as KeyboardArrowUpIcon,
  Groups as GroupsIcon, PendingActions as PendingActionsIcon, TaskAlt as TaskAltIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { apiFetch } from '../../../../services/apiClient';
import {
  DOCTOR_LIST,
  RECEPTIONIST_PATIENT_SEARCH
} from '../../../../config/api';


const OPDManagement = () => {
  const [loading, setLoading] = useState(true);
  const [opdPatients, setOpdPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [showConsultationForm, setShowConsultationForm] = useState(false);
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenStep, setTokenStep] = useState('form'); // 'form' or 'slip'
  const [generatedToken, setGeneratedToken] = useState(null);

  const [activeTab, setActiveTab] = useState('patients');
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
  const [selectedDoctorForQueue, setSelectedDoctorForQueue] = useState(null);

  // Token Form State
  const [tokenForm, setTokenForm] = useState({
    patientId: '',
    patientName: '',
    phoneNo: '',
    email: '',
    age: '',
    gender: 'Male',
    bloodGroup: '',
    Type: '',
    address: '',
    department: '',
    doctorId: '',
    type: 'Regular',
    priority: 'Normal'
  });

  // Searchable Dropdown State for Token Creation
  const [deptSearchTerm, setDeptSearchTerm] = useState('');
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
  const deptDropdownRef = useRef(null);

  const [docSearchTerm, setDocSearchTerm] = useState('');
  const [isDocDropdownOpen, setIsDocDropdownOpen] = useState(false);
  const docDropdownRef = useRef(null);
  const [docNameSearchTerm, setDocNameSearchTerm] = useState('');
  const [isDocNameDropdownOpen, setIsDocNameDropdownOpen] = useState(false);
  const docNameDropdownRef = useRef(null);

  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const patientDropdownRef = useRef(null);

  {/* Add this state near your other state declarations */ }
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentPatient, setSelectedPaymentPatient] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentBillingData, setPaymentBillingData] = useState({
    token: '',
    patientName: '',
    patientId: '',
    age: '',
    gender: 'Male',
    email: '',
    contact: '',
    isActive: true
  });

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
      height: ''
    },
    symptoms: '',
    history: '',
    allergies: '',
    examination: '',
    diagnosis: '',
    prescription: '',
    testsRecommended: [{ id: 1, description: '', customDescription: '', samples: '', customSamples: '' }],
    instructions: '',
    nextVisitDate: '',
    remarks: ''
  });


  useEffect(() => {
    loadOPDData();
  }, []);

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
      if (docNameDropdownRef.current && !docNameDropdownRef.current.contains(event.target)) {
        setIsDocNameDropdownOpen(false);
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

  const DEPARTMENTS = [...new Set(doctors.map(d => d.department))];
  const AVAILABLE_DOCTORS = [
    { name: 'Dr. Arun Varma', department: 'Cardiology', specialization: 'Senior Cardiologist', qualification: 'MBBS, MD (Cardiology)', email: 'arun.varma@hospital.com', contact: '+91 9998887771' },
    { name: 'Dr. Sarah Khan', department: 'Pediatrics', specialization: 'Pediatrician', qualification: 'MBBS, MD (Pediatrics)', email: 'sarah.khan@hospital.com', contact: '+91 9998887772' },
    { name: 'Dr. John Doe', department: 'Neurology', specialization: 'Neurosurgeon', qualification: 'MBBS, MS, MCh (Neuro)', email: 'john.doe@hospital.com', contact: '+91 9998887773' },
    { name: 'Dr. Emily Blunt', department: 'Dermatology', specialization: 'Dermatologist', qualification: 'MBBS, MD (Derm)', email: 'emily.blunt@hospital.com', contact: '+91 9998887774' },
    { name: 'Dr. Robert Miller', department: 'Orthopedics', specialization: 'Orthopedic Surgeon', qualification: 'MBBS, MS (Ortho)', email: 'robert.miller@hospital.com', contact: '+91 9998887775' }
  ];

  const REGISTERED_PATIENTS = [
    { id: 'PAT-101', name: 'Rahul Sharma', phoneNo: '9876543210', email: 'rahul@example.com', age: '28', gender: 'Male', bloodGroup: 'O+', address: 'Andheri West, Mumbai' },
    { id: 'PAT-102', name: 'Surbhi Gupta', phoneNo: '9988776655', email: 'surbhi@example.com', age: '24', gender: 'Female', bloodGroup: 'B+', address: 'Bandra East, Mumbai' },
    { id: 'PAT-103', name: 'Anita Verma', phoneNo: '9123456789', email: 'anita@example.com', age: '45', gender: 'Female', bloodGroup: 'A-', address: 'Khar Road, Mumbai' },
    { id: 'PAT-104', name: 'Vikram Singh', phoneNo: '9822334455', email: 'vikram@example.com', age: '35', gender: 'Male', bloodGroup: 'AB+', address: 'Goregaon, Mumbai' }
  ];

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

  const handleSelectDocName = (doc) => {
    setDoctorForm({
      ...doctorForm,
      name: doc.name,
      department: doc.department,
      specialization: doc.specialization,
      qualification: doc.qualification || '',
      email: doc.email || '',
      contact: doc.contact || ''
    });
    setDocNameSearchTerm(doc.name);
    setIsDocNameDropdownOpen(false);
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

  const filteredDoctorsForToken = doctors.filter(d =>
    d.isActive &&
    d.department === tokenForm.department &&
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
      // 1. Fetch doctors from live API
      const docRes = await apiFetch(DOCTOR_LIST);
      const docData = await docRes.json().catch(() => ({}));
      const doctorsList = docData.data?.doctors || docData.data || docData || [];

      const mappedDoctors = Array.isArray(doctorsList) ? doctorsList.map(d => ({
        id: d.id || d.doctor_id || `D-${Math.floor(100 + Math.random() * 900)}`,
        name: d.name || `Dr. ${d.first_name || ''} ${d.last_name || ''}`.trim() || 'Dr. Unknown',
        department: d.department || 'General Medicine',
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
      })) : [];

      // 2. Populate patients with mapped live doctor info
      const initialPatients = [
        {
          id: 'OPD-001',
          patientId: 'PAT-001',
          patientName: 'Ravi Kumar',
          age: 45,
          gender: 'Male',
          token: 'T-101',
          waitingTime: '15 mins',
          status: 'Waiting',
          assignedDoctorId: mappedDoctors[0]?.id || 'D-001',
          doctor: mappedDoctors[0]?.name || 'Dr. Meena Rao',
          department: mappedDoctors[0]?.department || 'Cardiology',
          priority: 'Normal',
          queuePosition: 1,
          arrivalTime: '9:15 AM',
          bloodGroup: 'B+',
          type: 'Regular',
          phoneNo: '+91 98765 43210'
        },
        {
          id: 'OPD-002',
          patientId: 'PAT-002',
          patientName: 'Anita Sharma',
          age: 32,
          gender: 'Female',
          token: 'T-102',
          waitingTime: '5 mins',
          status: 'In Consultation',
          assignedDoctorId: mappedDoctors[0]?.id || 'D-001',
          doctor: mappedDoctors[0]?.name || 'Dr. Meena Rao',
          department: mappedDoctors[0]?.department || 'Cardiology',
          priority: 'Normal',
          queuePosition: 0,
          arrivalTime: '9:00 AM',
          bloodGroup: 'A+',
          type: 'Follow-up',
          phoneNo: '+91 87654 32109'
        },
        {
          id: 'OPD-003',
          patientId: 'PAT-003',
          patientName: 'Suresh Patel',
          age: 58,
          gender: 'Male',
          token: 'T-103',
          waitingTime: '25 mins',
          status: 'Waiting',
          assignedDoctorId: 'D-002',
          doctor: 'Dr. Sharma',
          department: 'Orthopedics',
          priority: 'Urgent',
          queuePosition: 1,
          arrivalTime: '9:30 AM',
          bloodGroup: 'O+',
          type: 'Emergency',
          phoneNo: '+91 76543 21098'
        },
        {
          id: 'OPD-004',
          patientId: 'PAT-004',
          patientName: 'Kiran Reddy',
          age: 28,
          gender: 'Male',
          token: 'T-104',
          waitingTime: '0 mins',
          status: 'Completed',
          assignedDoctorId: mappedDoctors[3]?.id || mappedDoctors[0]?.id || 'D-004',
          doctor: mappedDoctors[3]?.name || mappedDoctors[0]?.name || 'Dr. Gupta',
          department: mappedDoctors[3]?.department || mappedDoctors[0]?.department || 'General Medicine',
          priority: 'Normal',
          queuePosition: 0,
          arrivalTime: '8:45 AM',
          bloodGroup: 'AB+',
          type: 'New Patient',
          visitType: 'New',
          phoneNo: '+91 65432 10987',
          tests: ['CBC', 'Blood Sugar', 'Widal Test', 'Dengue NS1'],
          surgeries: ['Stitching'],
          vitals: { bp: '110/70', pulse: '88', temperature: '102.4', spo2: '96', weight: '68', height: '172' },
          diagnosis: 'Acute Viral Fever (Suspected Dengue)',
          prescription: '1. Tab. Paracetamol 650mg - QID - 3 Days\n2. Syp. Caripill - 10ml - TDS - 5 Days\n3. ORS Liquids - 2 Liters daily',
          medicationList: [
            { name: 'Paracetamol 650mg', dosage: '1 Tab', duration: '3 Days', instruction: 'After Food', frequency: { morning: true, afternoon: true, night: true } },
            { name: 'Caripill Syrup', dosage: '10ml', duration: '5 Days', instruction: 'After Food', frequency: { morning: true, afternoon: true, night: true } }
          ],
          medications: ['Paracetamol 650mg', 'Caripill Syrup'],
          advice: 'Complete bed rest. Monitor platelet count daily. High fluid intake.',
          history: 'No major past illness. Fever since 2 days.',
          allergies: 'None known.'
        },
        {
          id: 'OPD-004',
          patientId: 'PAT-005',
          patientName: 'Pooja Desai',
          age: 40,
          gender: 'Female',
          token: 'T-105',
          waitingTime: '0 mins',
          status: 'Exited',
          assignedDoctorId: 'D-002',
          doctor: 'Dr. Sharma',
          department: 'Orthopedics',
          priority: 'Normal',
          queuePosition: 1,
          arrivalTime: '8:00 AM',
          bloodGroup: 'B-',
          type: 'Follow-up',
          visitType: 'Follow-up',
          phoneNo: '+91 98765 12345',
          tests: ['X-Ray Left Ankle', 'Bone Density Test'],
          vitals: { bp: '110/70', pulse: '75', temperature: '98.4', spo2: '99', weight: '60', height: '160' },
          diagnosis: 'Grade 1 Ankle Sprain',
          prescription: '1. Tab. Ibuprofen 400mg - BD - 3 Days\n2. Oint. Volini - Local Application\n3. Crepe Bandage Application',
          medicationList: [
            { name: 'Ibuprofen 400mg', dosage: '1 Tab', duration: '3 Days', instruction: 'After Meals', frequency: { morning: true, afternoon: false, night: true } },
            { name: 'Volini Ointment', dosage: 'Apply', duration: '5 Days', instruction: 'Local Application', frequency: { morning: true, afternoon: false, night: true } }
          ],
          medications: ['Ibuprofen 400mg', 'Volini Ointment'],
          advice: 'Rest for 2 days. Avoid heavy lifting. Keep ankle elevated.',
          followUpRequired: true,
          followUpDate: '21 May 2026'
        },
        {
          id: 'OPD-005',
          patientId: 'PAT-006',
          patientName: 'Sanjay Dutt',
          age: 52,
          gender: 'Male',
          token: 'E-101',
          waitingTime: 'Immediate',
          status: 'Waiting',
          assignedDoctorId: 'D-004',
          doctor: 'Dr. Gupta',
          department: 'General Medicine',
          priority: 'Urgent',
          queuePosition: 0,
          arrivalTime: '10:45 AM',
          bloodGroup: 'O-',
          visitType: 'Emergency',
          phoneNo: '+91 99988 77766',
          vitals: { bp: '90/60', pulse: '110', temperature: '98.6', spo2: '92', weight: '82', height: '180' }
        }
      ].map(p => ({
        ...p,
        waitingTime: calculateWaitingTime(p.queuePosition)
      }));


      const doctorsWithQueue = initialDoctors.map(doctor => {
        const waitingPatients = initialPatients.filter(
          p => p.assignedDoctorId === doctor.id && p.status === 'Waiting'
        );
        const inConsultationPatient = initialPatients.find(
          p => p.assignedDoctorId === doctor.id && p.status === 'In Consultation'
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

      // 3. Load initial patients for dropdown
      await loadApiPatients('');
    } catch (e) {
      console.error('Error loading live OPD data:', e);
    } finally {
      setLoading(false);
    }
  };

  {/* Add this function */ }
  const handleOpenPaymentModal = (patient) => {
    setSelectedPaymentPatient(patient);
    setPaymentMethod('cash');
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

  const removeTestRow = (index) => {
    setConsultationForm(prev => {
      const updatedTests = prev.testsRecommended.filter((_, i) => i !== index)
        .map((test, i) => ({ ...test, id: i + 1 }));
      return { ...prev, testsRecommended: updatedTests };
    });
  };

  const updateTestRow = (index, field, value) => {
    setConsultationForm(prev => {
      const updatedTests = [...prev.testsRecommended];
      updatedTests[index] = { ...updatedTests[index], [field]: value };
      return { ...prev, testsRecommended: updatedTests };
    });
  };

  const handleStartConsultation = (patient) => {
    setSelectedPatient(patient);
    setConsultationForm({
      ...consultationForm,
      patientId: patient.patientId,
      doctorId: patient.assignedDoctorId,
      consultationType: patient.status === 'Completed' ? 'Follow-up' : 'New'
    });
    setShowConsultationForm(true);

    if (patient.status === 'Waiting') {
      const updatedPatients = opdPatients.map(p => {
        if (p.id === patient.id) {
          return { ...p, status: 'In Consultation' };
        }
        return p;
      });
      setOpdPatients(updatedPatients);

      const updatedDoctors = doctors.map(doctor => {
        if (doctor.id === patient.assignedDoctorId) {
          return {
            ...doctor,
            currentPatient: patient.token,
            currentPatientName: patient.patientName
          };
        }
        return doctor;
      });
      setDoctors(updatedDoctors);
    }
  };

  const handleCompleteConsultation = () => {
    if (!consultationForm.diagnosis || !consultationForm.prescription) {
      alert('Please enter diagnosis and prescription');
      return;
    }

    const updatedPatients = opdPatients.map(p => {
      if (p.id === selectedPatient.id) {
        return {
          ...p,
          status: 'Completed',
          waitingTime: '0 mins'
        };
      }
      return p;
    });

    const doctor = doctors.find(d => d.id === selectedPatient.assignedDoctorId);
    if (doctor) {
      const waitingPatients = updatedPatients.filter(
        patient => patient.assignedDoctorId === doctor.id &&
          patient.status === 'Waiting'
      ).sort((a, b) => a.queuePosition - b.queuePosition);

      let nextPatients = [...waitingPatients];

      if (waitingPatients.length > 0) {
        const nextPatient = waitingPatients[0];
        const patientIndex = updatedPatients.findIndex(p => p.id === nextPatient.id);

        if (patientIndex !== -1) {
          updatedPatients[patientIndex] = {
            ...nextPatient,
            status: 'In Consultation',
            waitingTime: '0 mins'
          };

          nextPatients = waitingPatients.slice(1);
        }
      }

      const finalPatients = updatedPatients.map(patient => {
        if (patient.assignedDoctorId === doctor.id && patient.status === 'Waiting') {
          const newPosition = nextPatients.findIndex(p => p.id === patient.id);
          return {
            ...patient,
            queuePosition: newPosition,
            waitingTime: `${(newPosition + 1) * 15} mins`
          };
        }
        return patient;
      });

      setOpdPatients(finalPatients);

      const updatedDoctors = doctors.map(d => {
        if (d.id === doctor.id) {
          return {
            ...d,
            currentPatient: waitingPatients.length > 0 ? waitingPatients[0].token : null,
            currentPatientName: waitingPatients.length > 0 ? waitingPatients[0].patientName : null,
            queue: Math.max(0, d.queue - 1)
          };
        }
        return d;
      });

      setDoctors(updatedDoctors);
    }

    alert('Consultation completed successfully!');
    setShowConsultationForm(false);
    setSelectedPatient(null);
    setConsultationForm({
      patientId: '',
      doctorId: '',
      consultationType: 'New',
      vitalSigns: {
        bp: '',
        pulse: '',
        temperature: '',
        spo2: '',
        weight: '',
        height: ''
      },
      symptoms: '',
      history: '',
      allergies: '',
      examination: '',
      diagnosis: '',
      prescription: '',
      testsRecommended: [{ id: 1, description: '', customDescription: '', samples: '', customSamples: '' }],
      instructions: '',
      nextVisitDate: '',
      remarks: ''
    });
  };

  const generateToken = () => {
    setTokenStep('form');
    setTokenForm({
      patientId: '',
      patientName: '',
      phoneNo: '',
      email: '',
      age: '',
      gender: 'Male',
      bloodGroup: '',
      address: '',
      department: '',
      doctorId: '',
      type: 'Regular',
      priority: 'Normal'
    });
    setPatientSearchTerm('');
    setDeptSearchTerm('');
    setDocSearchTerm('');
    setShowTokenModal(true);
  };

  const handleTokenSubmit = (e) => {
    e.preventDefault();

    if (!tokenForm.patientName || !tokenForm.department || !tokenForm.doctorId) {
      alert('Please fill in all required fields');
      return;
    }

    const selectedDoctor = doctors.find(d => d.id === tokenForm.doctorId);
    const tokenNumber = Math.floor(Math.random() * 1000);
    const currentTime = new Date();
    const arrivalTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Calculate queue position for the selected doctor
    const doctorWaitingPatients = opdPatients.filter(
      p => p.assignedDoctorId === tokenForm.doctorId && p.status === 'Waiting'
    );
    let queuePosition = doctorWaitingPatients.length;

    const newToken = {
      id: `OPD-${Date.now()}`,
      patientId: tokenForm.patientId || `UHID-${Math.floor(100000 + Math.random() * 900000)}`,
      patientName: tokenForm.patientName,
      phoneNo: tokenForm.phoneNo || 'Not specified',
      email: tokenForm.email || 'Not specified',
      age: tokenForm.age || 'Not specified',
      gender: tokenForm.gender,
      token: `T-${tokenNumber}`,
      waitingTime: `${(queuePosition + 1) * 15} mins`,
      status: 'Waiting',
      assignedDoctorId: tokenForm.doctorId,
      doctor: selectedDoctor.name,
      department: tokenForm.department,
      type: tokenForm.type,
      priority: tokenForm.priority,
      queuePosition: queuePosition,
      arrivalTime: arrivalTime,
      bloodGroup: tokenForm.bloodGroup || 'Not specified',
      address: tokenForm.address || 'Not specified'
    };

    setOpdPatients([newToken, ...opdPatients]);

    // Update doctor's queue count
    const updatedDoctors = doctors.map(d => {
      if (d.id === tokenForm.doctorId) {
        return { ...d, queue: d.queue + 1 };
      }
      return d;
    });
    setDoctors(updatedDoctors);

    setGeneratedToken(newToken);
    setTokenStep('slip');
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
              text-transform: uppercase;
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
              <div style="font-size: 12px; text-transform: uppercase;">Token Number</div>
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
            <div class="box" style="min-height: 120px; font-family: 'Courier New', monospace; white-space: pre-line;">${consultationForm.prescription || '-'}</div>
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

  const handleDoctorStatusToggle = (doctorId) => {
    const doctor = doctors.find(d => d.id === doctorId);
    const isActivating = !doctor.isActive;

    if (isActivating) {
      setDoctors(doctors.map(d =>
        d.id === doctorId ? { ...d, isActive: !d.isActive } : d
      ));
    } else {
      const doctorPatients = opdPatients.filter(p =>
        p.assignedDoctorId === doctorId && (p.status === 'Waiting' || p.status === 'In Consultation')
      );

      if (doctorPatients.length > 0) {
        setDoctorToDeactivate(doctor);
        setPatientsToReassign(doctorPatients);
        setShowDeactivateModal(true);
      } else {
        setDoctors(doctors.map(d =>
          d.id === doctorId ? { ...d, isActive: !d.isActive, queue: 0, currentPatient: null, currentPatientName: null } : d
        ));
      }
    }
  };

  const handleConfirmDeactivation = () => {
    if (!doctorToDeactivate) return;

    const doctorId = doctorToDeactivate.id;
    const activeDoctors = doctors.filter(d => d.isActive && d.id !== doctorId);

    if (activeDoctors.length === 0) {
      alert('No other active doctors available. Cannot deactivate.');
      return;
    }

    let updatedPatients = [...opdPatients];
    let currentDoctors = [...doctors];

    patientsToReassign.forEach(patient => {
      const bestDoctor = activeDoctors.reduce((prev, curr) =>
        prev.queue < curr.queue ? prev : curr
      );

      const newQueuePosition = updatedPatients.filter(
        p => p.assignedDoctorId === bestDoctor.id && p.status === 'Waiting'
      ).length;

      updatedPatients = updatedPatients.map(p => {
        if (p.id === patient.id) {
          return {
            ...p,
            assignedDoctorId: bestDoctor.id,
            doctor: bestDoctor.name,
            department: bestDoctor.department,
            queuePosition: newQueuePosition,
            waitingTime: `${(newQueuePosition + 1) * 15} mins`
          };
        }
        return p;
      });

      // Update the queue count for the best doctor in our local copy
      const bestDocIndex = activeDoctors.findIndex(d => d.id === bestDoctor.id);
      if (bestDocIndex !== -1) {
        activeDoctors[bestDocIndex].queue += 1;
      }
    });

    // Update doctors state
    const finalDoctors = currentDoctors.map(d => {
      const matchingActiveDoc = activeDoctors.find(ad => ad.id === d.id);
      if (matchingActiveDoc) {
        return { ...d, queue: matchingActiveDoc.queue };
      }
      if (d.id === doctorId) {
        return { ...d, isActive: false, queue: 0, currentPatient: null, currentPatientName: null };
      }
      return d;
    });

    setOpdPatients(updatedPatients);
    setDoctors(finalDoctors);
    setShowDeactivateModal(false);
    setDoctorToDeactivate(null);
    setPatientsToReassign([]);
  };

  const handleAddDoctor = () => {
    if (!doctorForm.name || !doctorForm.department) {
      alert('Please enter doctor name and department');
      return;
    }

    const newDoctor = {
      id: `D-${Date.now().toString().slice(-6)}`,
      name: doctorForm.name,
      department: doctorForm.department,
      opdRoom: doctorForm.opdRoom || `Room ${Math.floor(Math.random() * 50) + 100}`,
      specialization: doctorForm.specialization || doctorForm.department,
      qualification: doctorForm.qualification || 'Not specified',
      email: doctorForm.email || 'Not specified',
      contact: doctorForm.contact || 'Not specified',
      isActive: doctorForm.isActive,
      currentPatient: null,
      currentPatientName: null,
      queue: 0,
      maxPatientsPerDay: 30,
      consultationFee: 400,
      workingHours: '9:00 AM - 5:00 PM',
      rating: 4.5,
      experience: '5 years'
    };

    setDoctors([...doctors, newDoctor]);
    setShowDoctorModal(false);
    setDoctorForm({
      name: '',
      department: '',
      opdRoom: '',
      specialization: '',
      qualification: '',
      email: '',
      contact: '',
      isActive: true
    });
    setDocNameSearchTerm('');

    alert(`Dr. ${doctorForm.name} added successfully!`);
  };


  const handleTransferPatient = (patient) => {
    const availableDoctors = doctors.filter(d =>
      d.isActive && d.id !== patient.assignedDoctorId
    );

    if (availableDoctors.length === 0) {
      alert('No other active doctors available for transfer');
      return;
    }

    setTransferPatient(patient);
    setSelectedTransferDoctor(null);
    setShowTransferModal(true);
  };

  const handleConfirmTransfer = () => {
    if (!selectedTransferDoctor || !transferPatient) return;

    const newDoctor = selectedTransferDoctor;
    const patient = transferPatient;

    const newQueueCount = opdPatients.filter(
      p => p.assignedDoctorId === newDoctor.id && p.status === 'Waiting'
    ).length;

    const oldDoctor = doctors.find(d => d.id === patient.assignedDoctorId);
    const updatedDoctors = doctors.map(doctor => {
      if (doctor.id === oldDoctor.id) {
        return { ...doctor, queue: Math.max(0, doctor.queue - 1) };
      }
      if (doctor.id === newDoctor.id) {
        return { ...doctor, queue: doctor.queue + 1 };
      }
      return doctor;
    });

    const updatedPatients = opdPatients.map(p => {
      if (p.id === patient.id) {
        return {
          ...p,
          assignedDoctorId: newDoctor.id,
          doctor: newDoctor.name,
          department: newDoctor.department,
          queuePosition: newQueueCount,
          waitingTime: `${(newQueueCount + 1) * 15} mins`
        };
      }
      if (p.assignedDoctorId === oldDoctor.id && p.status === 'Waiting' && p.queuePosition > patient.queuePosition) {
        return { ...p, queuePosition: p.queuePosition - 1 };
      }
      return p;
    });

    setDoctors(updatedDoctors);
    setOpdPatients(updatedPatients);
    setShowTransferModal(false);
    setTransferPatient(null);
    setSelectedTransferDoctor(null);
  };

  const handleCancelPatient = (patient) => {
    if (window.confirm(`Cancel token ${patient.token} for ${patient.patientName}?`)) {
      if (patient.assignedDoctorId) {
        const updatedDoctors = doctors.map(doctor => {
          if (doctor.id === patient.assignedDoctorId) {
            const newQueue = patient.status === 'In Consultation' ? doctor.queue : Math.max(0, doctor.queue - 1);
            const currentPatient = patient.status === 'In Consultation' ? null : doctor.currentPatient;
            const currentPatientName = patient.status === 'In Consultation' ? null : doctor.currentPatientName;

            return {
              ...doctor,
              queue: newQueue,
              currentPatient,
              currentPatientName
            };
          }
          return doctor;
        });

        const updatedPatients = opdPatients
          .filter(p => p.id !== patient.id)
          .map(p => {
            if (p.assignedDoctorId === patient.assignedDoctorId &&
              p.status === 'Waiting' &&
              p.queuePosition > patient.queuePosition) {
              return { ...p, queuePosition: p.queuePosition - 1 };
            }
            return p;
          });

        setDoctors(updatedDoctors);
        setOpdPatients(updatedPatients);
      } else {
        setOpdPatients(opdPatients.filter(p => p.id !== patient.id));
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-50 text-green-700 border border-green-200';
      case 'In Consultation': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'Waiting': return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
      default: return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };


  const activeDoctors = doctors.filter(d => d.isActive);
  const inactiveDoctors = doctors.filter(d => !d.isActive);

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

          <button
            onClick={() => setShowDoctorModal(true)}
            className="px-4 py-2 border border-blue-600 text-blue-700 bg-white rounded-lg hover:bg-gray-50 transition-colors flex items-center shadow-sm text-sm font-medium"
          >
            <MedicalServicesIcon className="mr-2" /> Manage Doctors
          </button>
          <button
            onClick={() => setShowQueueModal(true)}
            className="px-4 py-2 border border-green-600 text-green-700 bg-white rounded-lg hover:bg-gray-50 transition-colors flex items-center shadow-sm text-sm font-medium"
          >
            <QueueIcon className="mr-2" /> View Queue
          </button>
          <button
            onClick={generateToken}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md flex items-center text-sm font-medium"
          >
            <ConfirmationNumberIcon className="mr-2" /> Generate Token
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">

        {/* TOTAL PATIENTS */}
        <div className="relative bg-white rounded-xl p-5 border border-gray-200 border-t-[3px] border-t-blue-500 shadow-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-transparent to-transparent pointer-events-none" />
          <div className="relative flex flex-col">
            <p className="text-3xl font-bold text-blue-600 mb-1">
              {opdPatients.length}
            </p>
            <p className="text-sm font-semibold text-gray-800">
              Total Patients
            </p>
            <p className="text-xs text-blue-500 mt-1">
              Active: {opdPatients.filter(p => p.status === 'Waiting').length} waiting
            </p>
          </div>
        </div>

        {/* ACTIVE DOCTORS */}
        <div className="relative bg-white rounded-xl p-5 border border-gray-200 border-t-[3px] border-t-green-500 shadow-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/40 via-transparent to-transparent pointer-events-none" />
          <div className="relative flex flex-col">
            <p className="text-3xl font-bold text-green-600 mb-1">
              {activeDoctors.length}
            </p>
            <p className="text-sm font-semibold text-gray-800">
              Active Doctors
            </p>
            <p className="text-xs text-green-500 mt-1">
              {doctors.length} total doctors
            </p>
          </div>
        </div>

        {/* IN CONSULTATION */}
        <div className="relative bg-white rounded-xl p-5 border border-gray-200 border-t-[3px] border-t-yellow-500 shadow-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-50/40 via-transparent to-transparent pointer-events-none" />
          <div className="relative flex flex-col">
            <p className="text-3xl font-bold text-yellow-500 mb-1">
              {opdPatients.filter(p => p.status === 'In Consultation').length}
            </p>
            <p className="text-sm font-semibold text-gray-800">
              In Consultation
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              Patients currently with doctors
            </p>
          </div>
        </div>

        {/* COMPLETED TODAY */}
        <div className="relative bg-white rounded-xl p-5 border border-gray-200 border-t-[3px] border-t-purple-500 shadow-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/40 via-transparent to-transparent pointer-events-none" />
          <div className="relative flex flex-col">
            <p className="text-3xl font-bold text-purple-600 mb-1">
              {opdPatients.filter(p => p.status === 'Completed').length}
            </p>
            <p className="text-sm font-semibold text-gray-800">
              Completed Today
            </p>
            <p className="text-xs text-purple-500 mt-1">
              Throughput for today
            </p>
          </div>
        </div>

      </div>


      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`px-4 py-3 font-medium text-sm ${activeTab === 'patients' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
          onClick={() => setActiveTab('patients')}
        >
          <PersonIcon className="mr-2" fontSize="small" /> Patients ({opdPatients.length})
        </button>
        <button
          className={`px-4 py-3 font-medium text-sm ${activeTab === 'doctors' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
          onClick={() => setActiveTab('doctors')}
        >
          <MedicalServicesIcon className="mr-2" fontSize="small" /> Doctors ({doctors.length})
        </button>
      </div>

      {/* Patients Tab */}
      {activeTab === 'patients' && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">

          {/* Header */}
          <div className="p-5 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Patient Queue
              </h3>

              {/* Search */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search patients..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  value={patientQueueSearch}
                  onChange={(e) => setPatientQueueSearch(e.target.value)}
                />
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase whitespace-nowrap">
                    Patient
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase whitespace-nowrap">
                    Doctor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase whitespace-nowrap">
                    Queue
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-gray-200">
                {opdPatients.filter(patient =>
                  patient.patientName.toLowerCase().includes(patientQueueSearch.toLowerCase()) ||
                  patient.token.toLowerCase().includes(patientQueueSearch.toLowerCase()) ||
                  patient.patientId.toLowerCase().includes(patientQueueSearch.toLowerCase())
                ).length === 0 ? (
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
                  opdPatients.filter(patient =>
                    patient.patientName.toLowerCase().includes(patientQueueSearch.toLowerCase()) ||
                    patient.token.toLowerCase().includes(patientQueueSearch.toLowerCase()) ||
                    patient.patientId.toLowerCase().includes(patientQueueSearch.toLowerCase())
                  ).map(patient => (
                    <tr key={patient.id} className="hover:bg-gray-50">

                      {/* Patient */}
                      <td className="px-4 py-4 align-middle">
                        <div>
                          <p className="font-medium text-gray-900">
                            {patient.patientName}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {patient.token} • {patient.age}y, {patient.gender}
                          </p>
                        </div>
                      </td>

                      {/* Doctor */}
                      <td className="px-4 py-4 align-middle">
                        <div>
                          <p className="font-medium text-gray-900">
                            {patient.doctor}
                          </p>
                          <p className="text-xs text-gray-500">
                            {patient.department}
                          </p>
                        </div>
                      </td>

                      {/* Queue */}
                      <td className="px-4 py-4 align-middle">
                        <div className="flex items-center min-h-[32px]">
                          {patient.status === 'Waiting' && patient.assignedDoctorId && (
                            <>
                              <span className="w-7 h-7 mr-2 rounded-full bg-yellow-100 text-yellow-800 flex items-center justify-center text-xs font-semibold">
                                {patient.queuePosition + 1}
                              </span>
                              <span className="text-sm text-gray-700">
                                {patient.waitingTime}
                              </span>
                            </>
                          )}

                          {patient.status === 'Waiting' && !patient.assignedDoctorId && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-orange-500">
                                Not Assigned
                              </span>
                              <button
                                onClick={() => handleAssignDoctor(patient)}
                                title="Assign Doctor Now"
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              >
                                <PersonAddIcon style={{ fontSize: 16 }} />
                              </button>
                            </div>
                          )}

                          {patient.status === 'In Consultation' && (
                            <span className="text-sm font-medium text-blue-600">
                              Consulting Now
                            </span>
                          )}

                          {patient.status === 'Completed' && (
                            <span className="flex items-center gap-1.5">
                              <CheckCircleIcon style={{ fontSize: 18 }} className="text-green-500" />
                              <span className="text-sm font-medium text-green-600">Completed</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 align-middle">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium w-fit ${getStatusColor(
                              patient.status
                            )}`}
                          >
                            {patient.status}
                          </span>

                          {patient.priority === 'Urgent' && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 w-fit">
                              Urgent
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 align-middle">
                        <div className="flex items-center gap-2">

                          <button
                            onClick={() => {
                              setSelectedPatientForView(patient);
                              setShowViewPatientModal(true);
                            }}
                            title="View Patient Details"
                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded"
                          >
                            <VisibilityIcon fontSize="small" />
                          </button>

                          {patient.status === 'Waiting' && !patient.assignedDoctorId && (
                            <button
                              onClick={() => handleAssignDoctor(patient)}
                              title="Assign Doctor"
                              className="w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <PersonAddIcon fontSize="small" />
                            </button>
                          )}


                          {patient.status === 'Waiting' && patient.assignedDoctorId && (
                            <>
                              <button
                                onClick={() => handleStartConsultation(patient)}
                                title="Start Consultation"
                                className="w-8 h-8 flex items-center justify-center text-green-600 hover:bg-green-50 rounded"
                              >
                                <PlayArrowIcon fontSize="small" />
                              </button>

                              <button
                                onClick={() => handleTransferPatient(patient)}
                                title="Transfer"
                                className="w-8 h-8 flex items-center justify-center text-yellow-600 hover:bg-yellow-50 rounded"
                              >
                                <SwapHorizIcon fontSize="small" />
                              </button>
                            </>
                          )}

                          {patient.status === 'In Consultation' && (
                            <button
                              onClick={() => handleStartConsultation(patient)}
                              title="View Consultation"
                              className="w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <DescriptionIcon fontSize="small" />
                            </button>
                          )}

                          <button
                            onClick={() => handleCancelPatient(patient)}
                            title="Cancel"
                            className="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 rounded"
                          >
                            <CloseIcon fontSize="small" />
                          </button>
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


      {/* Doctors Tab */}
      {activeTab === 'doctors' && (
        <div className="space-y-6">
          {/* Active Doctors */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Active Doctors</h3>
                <p className="text-gray-600 text-sm mt-1">Doctors currently available for consultations</p>
              </div>
              <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                {activeDoctors.length} Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeDoctors.map(doctor => (
                <div key={doctor.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
                        <MedicalServicesIcon className="text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{doctor.name}</p>
                        <p className="text-sm text-gray-600">{doctor.specialization}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${doctor.queue > 5 ? 'bg-red-50 text-red-700' : doctor.queue > 0 ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'}`}>
                      {doctor.queue} in queue
                    </span>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">OPD Room:</span>
                      <span className="font-medium">{doctor.opdRoom}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Patient:</span>
                      <span className="font-medium text-blue-600">{doctor.currentPatientName || 'None'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Working Hours:</span>
                      <span className="font-medium">{doctor.workingHours}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <button
                      className="flex-1 px-3 py-1.5 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
                      onClick={() => {
                        setSelectedDoctorForQueue(doctor);
                        setShowQueueModal(true);
                      }}
                    >
                      View Queue
                    </button>
                    <button
                      className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors shadow-sm"
                      onClick={() => handleDoctorStatusToggle(doctor.id)}
                      title="Deactivate Doctor"
                    >
                      <PowerSettingsNewIcon fontSize="small" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inactive Doctors */}
          {inactiveDoctors.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Inactive Doctors</h3>
                  <p className="text-gray-600 text-sm mt-1">Doctors currently not available for consultations</p>
                </div>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                  {inactiveDoctors.length} Inactive
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inactiveDoctors.map(doctor => (
                  <div key={doctor.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                          <MedicalServicesIcon className="text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">{doctor.name}</p>
                          <p className="text-sm text-gray-500">{doctor.specialization}</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-medium">
                        Inactive
                      </span>
                    </div>

                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Department:</span>
                        <span className="font-medium text-gray-700">{doctor.department}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">OPD Room:</span>
                        <span className="font-medium text-gray-700">{doctor.opdRoom}</span>
                      </div>
                    </div>

                    <button
                      className="w-full py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium flex items-center justify-center text-sm"
                      onClick={() => handleDoctorStatusToggle(doctor.id)}
                    >
                      <CheckIcon className="mr-1" fontSize="small" /> Activate Doctor
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manage Doctors Modal */}
      <Modal
        isOpen={showDoctorModal}
        onClose={() => setShowDoctorModal(false)}
        title="Manage Doctors"
        size="lg"
      >
        <div className="space-y-6">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
            <h4 className="font-semibold text-gray-800 mb-4">Add New Doctor</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative" ref={docNameDropdownRef}>
                <label className="form-label">Doctor Name *</label>
                <div className="relative">
                  <input
                    type="text"
                    className="form-input pr-10"
                    placeholder="Search or enter doctor name"
                    value={docNameSearchTerm}
                    onChange={(e) => {
                      setDocNameSearchTerm(e.target.value);
                      setIsDocNameDropdownOpen(true);
                      setDoctorForm({ ...doctorForm, name: e.target.value });
                    }}
                    onFocus={() => setIsDocNameDropdownOpen(true)}
                  />
                  <KeyboardArrowDownIcon
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
                    onClick={() => setIsDocNameDropdownOpen(!isDocNameDropdownOpen)}
                  />
                </div>
                {isDocNameDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {AVAILABLE_DOCTORS.filter(d =>
                      d.name.toLowerCase().includes(docNameSearchTerm.toLowerCase()) ||
                      d.department.toLowerCase().includes(docNameSearchTerm.toLowerCase())
                    ).length > 0 ? (
                      AVAILABLE_DOCTORS.filter(d =>
                        d.name.toLowerCase().includes(docNameSearchTerm.toLowerCase()) ||
                        d.department.toLowerCase().includes(docNameSearchTerm.toLowerCase())
                      ).map(doc => (
                        <div
                          key={doc.name}
                          className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 border-gray-100 transition-colors"
                          onClick={() => handleSelectDocName(doc)}
                        >
                          <div className="font-bold text-gray-800 text-sm">{doc.name}</div>
                          <div className="text-xs text-blue-600 font-medium">{doc.department} • {doc.specialization}</div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center">
                        <p className="text-sm text-gray-500 mb-2">No matching doctor found</p>
                        <button
                          type="button"
                          className="text-xs text-blue-600 font-bold hover:underline"
                          onClick={() => {
                            setDoctorForm({ ...doctorForm, name: docNameSearchTerm });
                            setIsDocNameDropdownOpen(false);
                          }}
                        >
                          + Use custom name: "{docNameSearchTerm}"
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="form-label">Department *</label>
                <select
                  className="form-input"
                  value={doctorForm.department}
                  onChange={(e) => setDoctorForm({ ...doctorForm, department: e.target.value })}
                >
                  <option value="">Select Department</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Neurology">Neurology</option>
                  <option value="General Medicine">General Medicine</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Dermatology">Dermatology</option>
                </select>
              </div>
              <div>
                <label className="form-label">Specialization</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Cardiologist"
                  value={doctorForm.specialization}
                  onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Qualification</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., MBBS, MD"
                  value={doctorForm.qualification}
                  onChange={(e) => setDoctorForm({ ...doctorForm, qualification: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">OPD Room</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Room 101"
                  value={doctorForm.opdRoom}
                  onChange={(e) => setDoctorForm({ ...doctorForm, opdRoom: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Email ID</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="doctor@hospital.com"
                  value={doctorForm.email}
                  onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Contact Number</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="+91 9876543210"
                  value={doctorForm.contact}
                  onChange={(e) => setDoctorForm({ ...doctorForm, contact: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="form-label">Status</label>
                  <div className="mt-2">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 mr-2"
                        checked={doctorForm.isActive}
                        onChange={(e) => setDoctorForm({ ...doctorForm, isActive: e.target.checked })}
                      />
                      <span>Active</span>
                    </label>
                  </div>
                </div>
                <button
                  onClick={handleAddDoctor}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md flex items-center text-sm font-medium"
                >
                  <AddIcon className="mr-2" fontSize="small" /> Add Doctor
                </button>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-4">Current Doctors ({doctors.length})</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Doctor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Queue</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {doctors.map(doctor => (
                    <tr key={doctor.id}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{doctor.name}</p>
                          <p className="text-xs text-blue-600 font-medium">{doctor.qualification}</p>
                          <p className="text-[10px] text-gray-500">{doctor.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                          {doctor.department}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${doctor.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                          {doctor.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded text-xs font-medium ${doctor.queue > 0 ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-50 text-gray-700'}`}>
                          {doctor.queue} patients
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDoctorStatusToggle(doctor.id)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm ${doctor.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                        >
                          {doctor.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Modal>

      {/* Consultation Modal */}
      <Modal
        isOpen={showConsultationForm}
        onClose={() => setShowConsultationForm(false)}
        title={`Consultation - ${selectedPatient?.patientName || 'Patient'}`}
        size="xl"
        footer={selectedPatient && (
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowConsultationForm(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleCompleteConsultation}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-md flex items-center text-sm font-medium"
            >
              <CheckCircleIcon className="mr-2" fontSize="small" /> Complete Consultation
            </button>
            <button
              onClick={handlePrintPrescription}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md flex items-center text-sm font-medium"
            >
              <PrintIcon className="mr-2" fontSize="small" /> Print Prescription
            </button>
          </div>
        )}
      >
        {selectedPatient && (
          <div className="space-y-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Patient</p>
                  <p className="font-medium text-gray-900">{selectedPatient.patientName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Token No</p>
                  <p className="font-medium text-gray-900">{selectedPatient.token}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Doctor</p>
                  <p className="font-medium text-gray-900">{selectedPatient.doctor}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="font-medium text-gray-900">{selectedPatient.department}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Vital Signs</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Blood Pressure</label>
                  <input
                    type="text"
                    placeholder="120/80"
                    className="form-input"
                    value={consultationForm.vitalSigns.bp}
                    onChange={(e) => setConsultationForm({
                      ...consultationForm,
                      vitalSigns: { ...consultationForm.vitalSigns, bp: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <label className="form-label">Pulse (BPM)</label>
                  <input
                    type="number"
                    placeholder="72"
                    className="form-input"
                    value={consultationForm.vitalSigns.pulse}
                    onChange={(e) => setConsultationForm({
                      ...consultationForm,
                      vitalSigns: { ...consultationForm.vitalSigns, pulse: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <label className="form-label">Temperature (°F)</label>
                  <input
                    type="number"
                    placeholder="98.6"
                    step="0.1"
                    className="form-input"
                    value={consultationForm.vitalSigns.temperature}
                    onChange={(e) => setConsultationForm({
                      ...consultationForm,
                      vitalSigns: { ...consultationForm.vitalSigns, temperature: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <label className="form-label">SpO2 (%)</label>
                  <input
                    type="number"
                    placeholder="98"
                    className="form-input"
                    value={consultationForm.vitalSigns.spo2}
                    onChange={(e) => setConsultationForm({
                      ...consultationForm,
                      vitalSigns: { ...consultationForm.vitalSigns, spo2: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <label className="form-label">Weight (kg)</label>
                  <input
                    type="number"
                    placeholder="65"
                    className="form-input"
                    value={consultationForm.vitalSigns.weight}
                    onChange={(e) => setConsultationForm({
                      ...consultationForm,
                      vitalSigns: { ...consultationForm.vitalSigns, weight: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <label className="form-label">Height (cm)</label>
                  <input
                    type="number"
                    placeholder="170"
                    className="form-input"
                    value={consultationForm.vitalSigns.height}
                    onChange={(e) => setConsultationForm({
                      ...consultationForm,
                      vitalSigns: { ...consultationForm.vitalSigns, height: e.target.value }
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Clinical Assessment Section */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-blue-800 border-b pb-2">
                <MedicalServicesIcon fontSize="small" />
                <h4 className="font-bold uppercase tracking-wider text-sm">Clinical Assessment</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Medical History</label>
                  <textarea
                    className="form-input bg-gray-50/50"
                    rows="3"
                    placeholder="Past medical conditions, surgeries, chronic illnesses..."
                    value={consultationForm.history}
                    onChange={(e) => setConsultationForm({ ...consultationForm, history: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label text-red-700 font-semibold">Known Allergies</label>
                  <textarea
                    className="form-input bg-gray-50/50"
                    rows="3"
                    placeholder="Drug allergies, food allergies, environmental..."
                    value={consultationForm.allergies}
                    onChange={(e) => setConsultationForm({ ...consultationForm, allergies: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Chief Complaints / Symptoms *</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    placeholder="Presenting symptoms and duration..."
                    value={consultationForm.symptoms}
                    onChange={(e) => setConsultationForm({ ...consultationForm, symptoms: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Physical Examination</label>
                  <textarea
                    className="form-input bg-gray-50/50"
                    rows="3"
                    placeholder="General appearance, systemic examination findings..."
                    value={consultationForm.examination}
                    onChange={(e) => setConsultationForm({ ...consultationForm, examination: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Diagnosis & Treatment Section */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-green-800 border-b pb-2">
                <TaskAltIcon fontSize="small" />
                <h4 className="font-bold uppercase tracking-wider text-sm">Diagnosis & Treatment Plan</h4>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="form-label">Final Diagnosis / Impression *</label>
                  <input
                    type="text"
                    className="form-input font-semibold text-blue-900"
                    placeholder="Primary diagnosis..."
                    value={consultationForm.diagnosis}
                    onChange={(e) => setConsultationForm({ ...consultationForm, diagnosis: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Prescription (Medications) *</label>
                  <textarea
                    className="form-input font-mono text-sm leading-relaxed"
                    rows="5"
                    placeholder="Rx:
1. Drug Name - Dosage - Frequency - Duration
2. ..."
                    value={consultationForm.prescription}
                    onChange={(e) => setConsultationForm({ ...consultationForm, prescription: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="form-label mb-0">Laboratory & Imaging Tests</label>
                    <button
                      type="button"
                      onClick={addTestRow}
                      className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-bold bg-blue-50 px-3 py-1.5 rounded-lg transition-colors border border-blue-100"
                    >
                      <AddIcon className="mr-1" fontSize="small" /> Add Investigation
                    </button>
                  </div>
                  <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="px-4 py-3 font-bold text-gray-700 w-16 text-center">#</th>
                          <th className="px-4 py-3 font-bold text-gray-700">Test Description</th>
                          <th className="px-4 py-3 font-bold text-gray-700">Required Samples</th>
                          <th className="px-4 py-3 font-bold text-gray-700 w-20 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {consultationForm.testsRecommended.map((test, index) => (
                          <tr key={index} className="hover:bg-blue-50/30 transition-colors">
                            <td className="px-4 py-3 text-center">
                              <span className="text-gray-400 font-mono">{test.id}</span>
                            </td>
                            <td className="px-4 py-3">
                              {test.description === 'Other' ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    autoFocus
                                    className="w-full p-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-blue-50/30 text-sm"
                                    placeholder="Enter test name..."
                                    value={test.customDescription}
                                    onChange={(e) => updateTestRow(index, 'customDescription', e.target.value)}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => updateTestRow(index, 'description', '')}
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                    title="Change selection"
                                  >
                                    <CloseIcon sx={{ fontSize: 16 }} />
                                  </button>
                                </div>
                              ) : (
                                <select
                                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-all text-sm"
                                  value={test.description}
                                  onChange={(e) => updateTestRow(index, 'description', e.target.value)}
                                >
                                  <option value="">-- Select Test --</option>
                                  {TEST_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {test.samples === 'Other' ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    autoFocus
                                    className="w-full p-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-blue-50/30 text-sm"
                                    placeholder="Enter sample type..."
                                    value={test.customSamples}
                                    onChange={(e) => updateTestRow(index, 'customSamples', e.target.value)}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => updateTestRow(index, 'samples', '')}
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                    title="Change selection"
                                  >
                                    <CloseIcon sx={{ fontSize: 16 }} />
                                  </button>
                                </div>
                              ) : (
                                <select
                                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-all text-sm"
                                  value={test.samples}
                                  onChange={(e) => updateTestRow(index, 'samples', e.target.value)}
                                >
                                  <option value="">-- Select Sample --</option>
                                  {SAMPLE_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {index > 0 && (
                                <button
                                  type="button"
                                  onClick={() => removeTestRow(index)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                >
                                  <DeleteIcon fontSize="small" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>

            {/* Follow-up Section */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-orange-800 border-b pb-2">
                <PendingActionsIcon fontSize="small" />
                <h4 className="font-bold uppercase tracking-wider text-sm">Advice & Follow-up</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="form-label">Instructions for Patient</label>
                  <textarea
                    className="form-input bg-orange-50/10 border-orange-100 focus:border-orange-200 focus:ring-orange-100"
                    rows="3"
                    placeholder="Dietary advice, lifestyle changes, how to use medications..."
                    value={consultationForm.instructions}
                    onChange={(e) => setConsultationForm({ ...consultationForm, instructions: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Next Visit Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={consultationForm.nextVisitDate}
                    onChange={(e) => setConsultationForm({ ...consultationForm, nextVisitDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Internal Remarks</label>
                  <input
                    type="text"
                    className="form-input bg-gray-50/50"
                    placeholder="Confidential notes for clinic staff..."
                    value={consultationForm.remarks}
                    onChange={(e) => setConsultationForm({ ...consultationForm, remarks: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showTokenModal}
        onClose={() => setShowTokenModal(false)}
        title={tokenStep === 'form' ? "Generate Patient Token" : "Token Generated Successfully"}
        size="md"
        footer={
          tokenStep === 'form' ? (
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowTokenModal(false)}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="opd-token-form"
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition-all flex items-center text-sm font-medium"
              >
                <ConfirmationNumberIcon className="mr-2" fontSize="small" /> Generate Token
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row justify-center gap-4 w-full max-w-sm mx-auto">
              <button
                onClick={handlePrintSlip}
                className="flex-1 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-all shadow-md flex items-center justify-center text-sm"
              >
                <PrintIcon className="mr-2" fontSize="small" /> Print Record
              </button>
              <button
                onClick={() => setShowTokenModal(false)}
                className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all shadow-md flex items-center justify-center text-sm"
              >
                Complete
              </button>
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
                  <input
                    type="text"
                    required
                    className="w-full p-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400"
                    placeholder="Search or enter full name"
                    value={patientSearchTerm}
                    onChange={(e) => {
                      setPatientSearchTerm(e.target.value);
                      setIsPatientDropdownOpen(true);
                      setTokenForm({ ...tokenForm, patientName: e.target.value });
                    }}
                    onFocus={() => setIsPatientDropdownOpen(true)}
                  />
                  <KeyboardArrowDownIcon
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
                    onClick={() => setIsPatientDropdownOpen(!isPatientDropdownOpen)}
                  />
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
                        <div
                          key={patient.id}
                          className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 border-gray-100 transition-colors"
                          onClick={() => handleSelectPatient(patient)}
                        >
                          <div className="font-bold text-gray-800 text-sm">{patient.name}</div>
                          <div className="text-[10px] text-gray-500">{patient.id} • {patient.phoneNo}</div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-gray-500 text-sm">
                        No matching patient found
                        <div className="mt-1">
                          <button
                            type="button"
                            className="text-xs text-blue-600 font-bold hover:underline"
                            onClick={() => {
                              setTokenForm({ ...tokenForm, patientName: patientSearchTerm });
                              setIsPatientDropdownOpen(false);
                            }}
                          >
                            + Use "{patientSearchTerm}" as new
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Patient ID
                </label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400"
                  placeholder="Optional for new"
                  value={tokenForm.patientId}
                  onChange={(e) => setTokenForm({ ...tokenForm, patientId: e.target.value })}
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400"
                  placeholder="10-digit number"
                  value={tokenForm.phoneNo}
                  onChange={(e) => setTokenForm({ ...tokenForm, phoneNo: e.target.value })}
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400"
                  placeholder="patient@email.com"
                  value={tokenForm.email}
                  onChange={(e) => setTokenForm({ ...tokenForm, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Age  <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Years"
                  value={tokenForm.age}
                  onChange={(e) => setTokenForm({ ...tokenForm, age: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  value={tokenForm.gender}
                  onChange={(e) => setTokenForm({ ...tokenForm, gender: e.target.value })}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Blood Group
                </label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="e.g., O+, B-"
                  value={tokenForm.bloodGroup}
                  onChange={(e) => setTokenForm({ ...tokenForm, bloodGroup: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Consultation Type</label>
                <select
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                  value={tokenForm.type}
                  onChange={(e) => setTokenForm({ ...tokenForm, type: e.target.value })}
                >
                  <option value="Regular">Regular</option>
                  <option value="New Patient">New Patient</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Residential Address</label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Street, Locality, City, State"
                  value={tokenForm.address}
                  onChange={(e) => setTokenForm({ ...tokenForm, address: e.target.value })}
                />
              </div>

              <div className="relative" ref={deptDropdownRef}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Department <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search Department..."
                    className="w-full p-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={deptSearchTerm}
                    onChange={(e) => {
                      setDeptSearchTerm(e.target.value);
                      setIsDeptDropdownOpen(true);
                      setTokenForm({ ...tokenForm, department: '', doctorId: '' });
                    }}
                    onFocus={() => setIsDeptDropdownOpen(true)}
                  />
                  <KeyboardArrowDownIcon
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
                    onClick={() => setIsDeptDropdownOpen(!isDeptDropdownOpen)}
                  />
                </div>
                {isDeptDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                    {filteredDepartments.length > 0 ? (
                      filteredDepartments.map(dept => (
                        <div
                          key={dept}
                          className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 border-gray-100 transition-colors text-sm"
                          onClick={() => handleSelectDept(dept)}
                        >
                          {dept}
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-gray-500 text-sm">No departments found</div>
                    )}
                  </div>
                )}
              </div>

              <div className="relative" ref={docDropdownRef}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Doctor <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled={!tokenForm.department}
                    placeholder={tokenForm.department ? "Search Doctor..." : "Select department first"}
                    className={`w-full p-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${!tokenForm.department ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    value={docSearchTerm}
                    onChange={(e) => {
                      setDocSearchTerm(e.target.value);
                      setIsDocDropdownOpen(true);
                    }}
                    onFocus={() => tokenForm.department && setIsDocDropdownOpen(true)}
                  />
                  <KeyboardArrowDownIcon
                    className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 ${tokenForm.department ? 'cursor-pointer hover:text-gray-600' : 'cursor-not-allowed'} transition-colors`}
                    onClick={() => tokenForm.department && setIsDocDropdownOpen(!isDocDropdownOpen)}
                  />
                </div>
                {isDocDropdownOpen && tokenForm.department && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                    {filteredDoctorsForToken.length > 0 ? (
                      filteredDoctorsForToken.map(doc => (
                        <div
                          key={doc.id}
                          className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 border-gray-100 transition-colors text-sm"
                          onClick={() => handleSelectDoc(doc)}
                        >
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

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Priority Level</label>
                <select
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                  value={tokenForm.priority}
                  onChange={(e) => setTokenForm({ ...tokenForm, priority: e.target.value })}
                >
                  <option value="Normal">Normal</option>
                  <option value="Urgent">Urgent</option>
                </select>
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
                  <h4 className="text-[10px] font-black tracking-[0.3em] text-blue-200 uppercase mb-3 drop-shadow-sm">OPD TOKEN SLIP</h4>
                  <p className="text-6xl font-black mb-3 tracking-tighter drop-shadow-md">{generatedToken?.token}</p>
                  <div className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full">
                    <p className="text-[11px] font-bold text-blue-50 uppercase tracking-widest">
                      {new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-8 bg-white relative">
                <div className="flex justify-between items-start mb-8">
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-400 uppercase tracking-[0.1em] font-black">Patient ID</p>
                    <p className="font-mono text-xs text-blue-900 font-black bg-blue-50 px-2 py-0.5 rounded inline-block">{generatedToken?.patientId}</p>
                    <div className="pt-2">
                      <p className="text-[10px] text-gray-400 uppercase tracking-[0.1em] font-black mb-1">Full Name</p>
                      <p className="font-black text-gray-900 text-xl leading-tight tracking-tight">{generatedToken?.patientName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black tracking-[0.1em] ${generatedToken?.priority === 'Urgent' ? 'bg-red-500 text-white shadow-sm ring-4 ring-red-50' : 'bg-green-500 text-white shadow-sm ring-4 ring-green-50'}`}>
                      {generatedToken?.priority === 'Urgent' ? 'URGENT' : 'NORMAL'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-6 gap-x-6 mb-8">
                  <div>
                    <p className="text-[9px] text-gray-400 uppercase tracking-[0.2em] font-black mb-1.5">Age / Gender</p>
                    <p className="text-sm font-black text-gray-800">{generatedToken?.age}Y / {generatedToken?.gender}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 uppercase tracking-[0.2em] font-black mb-1.5">Blood Group</p>
                    <p className="text-sm font-black text-gray-800">{generatedToken?.bloodGroup}</p>
                  </div>
                  <div className="col-span-2 p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between group transition-all hover:bg-blue-50 hover:border-blue-100">
                    <div>
                      <p className="text-[9px] text-gray-400 uppercase tracking-[0.2em] font-black mb-1.5">Consulting Doctor</p>
                      <p className="text-base font-black text-blue-800 tracking-tight">{generatedToken?.doctor}</p>
                      <p className="text-[10px] font-bold text-blue-600 mt-0.5 uppercase tracking-widest">{generatedToken?.department}</p>
                    </div>
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                      <PersonIcon fontSize="small" />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t-2 border-dashed border-gray-200 text-center relative">
                  <div className="absolute -left-10 -top-3 w-6 h-6 bg-gray-100 rounded-full"></div>
                  <div className="absolute -right-10 -top-3 w-6 h-6 bg-gray-100 rounded-full"></div>

                  <div className="inline-flex items-center justify-center space-x-2 text-green-600 mb-2">
                    <CheckCircleIcon sx={{ fontSize: 18 }} />
                    <span className="font-black text-[11px] uppercase tracking-[0.3em]">REGISTRATION CONFIRMED</span>
                  </div>
                  <div className="flex items-center justify-center space-x-3 text-gray-500 font-bold text-[10px]">
                    <span className="flex items-center gap-1"><AccessTimeIcon sx={{ fontSize: 14 }} /> Est. Wait: {generatedToken?.waitingTime}</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span>No: {generatedToken?.queuePosition + 1} in queue</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showViewPatientModal}
        onClose={() => setShowViewPatientModal(false)}
        title="Patient Details"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setGeneratedToken(selectedPatientForView);
                setTimeout(() => handlePrintSlip(), 100);
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors flex items-center gap-2"
            >
              <PrintIcon fontSize="small" /> Print Token
            </button>
            <button
              onClick={() => setShowViewPatientModal(false)}
              className="px-6 py-2 bg-blue-600 border border-blue-500 text-white rounded-lg hover:bg-blue-800 font-medium transition-colors"
            >
              Close Record
            </button>
          </div>
        }
      >
        {selectedPatientForView && (
          <div className="space-y-8 py-2">
            {/* Clinical Identity Header */}
            <div className="flex flex-col md:flex-row justify-between items-start border-b border-gray-100 pb-8 gap-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 border border-gray-200 shadow-sm">
                  <PersonIcon sx={{ fontSize: 36 }} />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 tracking-tight leading-none mb-2">
                    {selectedPatientForView.patientName}
                  </h3>
                  <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                    <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {selectedPatientForView.patientId || 'UHID-291088'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <AccessTimeIcon sx={{ fontSize: 14 }} className="text-gray-400" />
                      Reg: 12-Mar-2024
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] border-2 ${selectedPatientForView.status === 'Waiting' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                  selectedPatientForView.status === 'In Consultation' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                  {selectedPatientForView.status}
                </span>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Current Token: <span className="text-gray-900 font-black ml-1">{selectedPatientForView.token}</span>
                </p>
              </div>
            </div>

            {/* Information Architecture */}
            <div className="space-y-10">

              {/* Section 1: Demographic & Contact */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                  <h4 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.25em]">Personal Information</h4>
                </div>
                <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Age / Gender</p>
                    <p className="text-sm font-bold text-gray-800">{selectedPatientForView.age}Y / {selectedPatientForView.gender}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Blood Group</p>
                    <p className="text-sm font-bold text-gray-800">{selectedPatientForView.bloodGroup || 'B+'}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone Number</p>
                    <p className="text-sm font-bold text-gray-800">{selectedPatientForView.phoneNo || '+91 9988776655'}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Identity</p>
                    <p className="text-sm font-bold text-gray-800 truncate">
                      {selectedPatientForView.email || `${selectedPatientForView.patientName?.toLowerCase().split(' ')[0]}.p@health.com`}
                    </p>
                  </div>
                  <div className="col-span-2 md:col-span-4 space-y-1.5 pt-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Registered Residential Address</p>
                    <p className="text-sm font-medium text-gray-700 leading-relaxed max-w-2xl">
                      {selectedPatientForView.address || 'Suite 405, Green Valley Residency, Sector 12, Navi Mumbai, Maharashtra - 400706'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2: Clinical Details */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                  <h4 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.25em]">Consultation Details</h4>
                </div>
                <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Department</p>
                    <p className="text-sm font-bold text-gray-800">{selectedPatientForView.department}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Primary Doctor</p>
                    <p className="text-sm font-bold text-blue-700 underline decoration-blue-200 underline-offset-4">{selectedPatientForView.doctor}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Visit Category</p>
                    <p className="text-sm font-bold text-gray-800">{selectedPatientForView.type || 'Standard Follow-up'}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Priority status</p>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest ${selectedPatientForView.priority === 'Urgent' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                      {selectedPatientForView.priority}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showQueueModal}
        onClose={() => {
          setShowQueueModal(false);
          setSelectedDoctorForQueue(null);
        }}
        title={selectedDoctorForQueue ? `Queue Status: ${selectedDoctorForQueue.name}` : "OPD Queue Status"}
        size="lg"
      >
        <div className="space-y-4">
          {doctors
            .filter(doctor => doctor.isActive && (!selectedDoctorForQueue || doctor.id === selectedDoctorForQueue.id))
            .map(doctor => {
              const doctorPatients = opdPatients.filter(p => p.assignedDoctorId === doctor.id);
              const waitingPatients = doctorPatients.filter(p => p.status === 'Waiting');
              const inConsultationPatient = doctorPatients.find(p => p.status === 'In Consultation');

              return (
                <div key={doctor.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{doctor.name}</h4>
                      <p className="text-sm text-gray-600">{doctor.department} • {doctor.opdRoom}</p>
                    </div>
                    <span className={`px-3 py-1 rounded text-sm ${doctor.queue > 5 ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                      {doctor.queue} in queue
                    </span>
                  </div>

                  {inConsultationPatient && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-blue-800">Currently Consulting</p>
                          <p className="font-medium">{inConsultationPatient.patientName}</p>
                          <p className="text-sm text-gray-600">Token: {inConsultationPatient.token}</p>
                        </div>
                        <button
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center text-sm font-medium"
                          onClick={() => {
                            setShowQueueModal(false);
                            handleStartConsultation(inConsultationPatient);
                          }}
                        >
                          <VisibilityIcon className="mr-1" fontSize="small" /> View
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mb-3">
                    <p className="font-medium mb-2">Waiting Queue ({waitingPatients.length}):</p>
                    <div className="space-y-2">
                      {waitingPatients
                        .sort((a, b) => a.queuePosition - b.queuePosition)
                        .map(patient => (
                          <div key={patient.id} className="flex items-center justify-between bg-gray-50 p-3 rounded border">
                            <div className="flex items-center">
                              <span className="w-8 h-8 bg-yellow-100 text-yellow-800 rounded-full flex items-center justify-center mr-3 font-medium">
                                #{patient.queuePosition + 1}
                              </span>
                              <div>
                                <p className="font-medium">{patient.patientName}</p>
                                <p className="text-sm text-gray-600">Token: {patient.token} • Wait: {patient.waitingTime}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm flex items-center text-sm font-medium"
                                onClick={() => {
                                  setShowQueueModal(false);
                                  handleStartConsultation(patient);
                                }}
                              >
                                <PlayArrowIcon className="mr-1" fontSize="small" /> Start
                              </button>
                              <button
                                className="px-3 py-1.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors shadow-sm flex items-center text-sm font-medium"
                                onClick={() => {
                                  setShowQueueModal(false);
                                  handleTransferPatient(patient);
                                }}
                              >
                                <SwapHorizIcon fontSize="small" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>

                    {waitingPatients.length === 0 && (
                      <p className="text-gray-500 text-center py-3 bg-gray-50 rounded">No patients waiting</p>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </Modal>

      {/* Transfer Patient Modal */}
      <Modal
        isOpen={showTransferModal}
        onClose={() => {
          setShowTransferModal(false);
          setTransferPatient(null);
          setSelectedTransferDoctor(null);
        }}
        title="Transfer Patient"
        size="lg"
      >
        {transferPatient && (
          <div>
            {/* Patient Info Banner */}
            <div className="mb-5 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <SwapHorizIcon className="text-yellow-600" fontSize="small" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Transferring: {transferPatient.patientName}
                  </p>
                  <p className="text-xs text-gray-500">
                    Token: {transferPatient.token} • Currently with {transferPatient.doctor} ({transferPatient.department})
                  </p>
                </div>
              </div>
            </div>

            {/* Section Title */}
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Select a doctor to transfer to:
            </p>

            {/* Doctor Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
              {doctors
                .filter(d => d.isActive && d.id !== transferPatient.assignedDoctorId)
                .map(doctor => {
                  const isSelected = selectedTransferDoctor?.id === doctor.id;
                  const queueCount = opdPatients.filter(
                    p => p.assignedDoctorId === doctor.id && p.status === 'Waiting'
                  ).length;

                  return (
                    <div
                      key={doctor.id}
                      onClick={() => setSelectedTransferDoctor(doctor)}
                      className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-md ${isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                    >
                      {/* Selected Checkmark */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                          <CheckIcon className="text-white" style={{ fontSize: 16 }} />
                        </div>
                      )}

                      {/* Doctor Name & Department */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${isSelected ? 'bg-blue-500' : 'bg-gray-400'
                          }`}>
                          {doctor.name.split(' ').pop()[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{doctor.name}</p>
                          <p className="text-xs text-gray-500">{doctor.department}</p>
                        </div>
                      </div>

                      {/* Doctor Stats */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-gray-500">
                          <AccessTimeIcon style={{ fontSize: 14 }} />
                          <span>{doctor.opdRoom}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full font-medium ${queueCount > 5
                          ? 'bg-red-100 text-red-700'
                          : queueCount > 2
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                          }`}>
                          {queueCount} in queue
                        </span>
                      </div>

                      {/* Specialization */}
                      <p className="text-xs text-gray-400 mt-2">
                        {doctor.specialization} • {doctor.experience}
                      </p>
                    </div>
                  );
                })}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setTransferPatient(null);
                  setSelectedTransferDoctor(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmTransfer}
                disabled={!selectedTransferDoctor}
                className={`px-5 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${selectedTransferDoctor
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
              >
                <SwapHorizIcon style={{ fontSize: 18 }} />
                Confirm Transfer
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Deactivate Doctor Modal */}
      <Modal
        isOpen={showDeactivateModal}
        onClose={() => {
          setShowDeactivateModal(false);
          setDoctorToDeactivate(null);
          setPatientsToReassign([]);
        }}
        title="Deactivate Doctor"
        size="md"
      >
        {doctorToDeactivate && (
          <div className="p-1">
            <div className="flex items-center gap-4 mb-6 p-4 bg-red-50 border border-red-100 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <WarningIcon fontSize="large" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Confirm Deactivation</h3>
                <p className="text-sm text-red-600 font-medium">Dr. {doctorToDeactivate.name}</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-gray-600 text-sm leading-relaxed">
                This doctor has <span className="font-bold text-gray-900">{patientsToReassign.length} active patients</span> in their queue. Deactivating will automatically reassign these patients to other available doctors in the same department.
              </p>

              <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Patients to be reassigned:</p>
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
                  "{selectedLabRecord.result}"
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
                      <p className="text-[10px] font-bold text-black leading-tight italic">"{med.instruction}"</p>
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
            <button className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-3" onClick={() => { alert('Updating patient records...'); setShowQueueDetailModal(false); }}>Save All Changes
            </button>
            <button className="flex-1 py-4 border-2 border-red-100 text-red-600 rounded-2xl font-black text-xs tracking-[0.2em] hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-3 group" onClick={() => { setSelectedExitPatient(selectedQueuePatient); setShowExitModal(true); }}>  <ExitToAppIcon className="group-hover:translate-x-1 transition-transform" /> Complete & Exit Patient
            </button>
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
                <select className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold text-gray-800 focus:border-blue-600 focus:bg-white transition-all outline-none">
                  <option>{selectedQueuePatient.department}</option>
                  <option>Cardiology</option>
                  <option>Orthopedics</option>
                  <option>Neurology</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 tracking-widest ml-1">Consulting Doctor</label>
                <select className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold text-gray-800 focus:border-blue-600 focus:bg-white transition-all outline-none">
                  <option>{selectedQueuePatient.doctor}</option>
                  {AVAILABLE_DOCTORS.map(doc => <option key={doc.name}>{doc.name}</option>)}
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
                      <p className="text-[10px] text-gray-500 font-medium mt-0.5">Based on doctor's recommendation</p>
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
                        <input type="date" className="w-full p-4 bg-white border-2 border-gray-100 rounded-2xl text-sm font-bold text-gray-800 focus:border-blue-600 transition-all outline-none" value={exitForm.followUpDate} onChange={(e) => setExitForm({ ...exitForm, followUpDate: e.target.value })} /> <CalendarMonthIcon className="absolute right-4 top-4 text-gray-400" /> </div>
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
    </div>
  );
};

export default OPDManagement;