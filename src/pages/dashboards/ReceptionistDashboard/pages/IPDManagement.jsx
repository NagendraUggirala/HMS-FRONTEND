import React, { useState, useEffect, useRef } from 'react';
import {
  Hotel,
  Bed,
  MonitorHeart,
  MeetingRoom,
  Payments,
  Visibility,
  SwapHoriz,
  Logout,
  ReceiptLong,
  MedicalInformation,
  Assignment,
  History,
  KeyboardArrowDown,
  Search,
  Close
} from '@mui/icons-material';
import LoadingSpinner from '../../../../components/common/LoadingSpinner/LoadingSpinner';
import DataTable from '../../../../components/ui/Tables/DataTable';
import Modal from '../../../../components/common/Modal/Modal';

const IPDManagement = () => {
  const [loading, setLoading] = useState(true);
  const [ipdPatients, setIpdPatients] = useState([]);
  const [wards, setWards] = useState([]);
  const [showAdmissionForm, setShowAdmissionForm] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showRecordsModal, setShowRecordsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');

  // Patient search combobox state
  const [patientNameSearch, setPatientNameSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const patientNameRef = useRef(null);

  // Doctor and Department search states
  const [doctorSearch, setDoctorSearch] = useState('');
  const [deptSearch, setDeptSearch] = useState('');
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);

  // Billing states
  const [billingForm, setBillingForm] = useState({
    category: 'Pharmacy / Medications',
    amount: '',
    description: ''
  });
  const [pendingCharges, setPendingCharges] = useState([]);

  const allPatients = [
    { id: 'PAT-001', name: 'Ravi Kumar', age: 45, gender: 'Male', bloodGroup: 'O+' },
    { id: 'PAT-002', name: 'Anita Sharma', age: 32, gender: 'Female', bloodGroup: 'A+' },
    { id: 'PAT-003', name: 'Suresh Patel', age: 58, gender: 'Male', bloodGroup: 'B+' },
    { id: 'PAT-004', name: 'Priya Singh', age: 28, gender: 'Female', bloodGroup: 'O-' },
    { id: 'PAT-005', name: 'Rajesh Khanna', age: 50, gender: 'Male', bloodGroup: 'AB+' },
    { id: 'PAT-006', name: 'Sunita Devi', age: 42, gender: 'Female', bloodGroup: 'B-' },
    { id: 'PAT-007', name: 'Vikram Joshi', age: 35, gender: 'Male', bloodGroup: 'O+' },
    { id: 'PAT-008', name: 'Kiran Reddy', age: 29, gender: 'Female', bloodGroup: 'A-' }
  ];

  const doctors = [
    { name: 'Dr. Meena Rao', dept: 'Cardiology' },
    { name: 'Dr. Sharma', dept: 'Orthopedics' },
    { name: 'Dr. Menon', dept: 'Neurology' },
    { name: 'Dr. Patel', dept: 'General Surgery' },
    { name: 'Dr. Gupta', dept: 'Pediatrics' },
    { name: 'Dr. Verma', dept: 'Dermatology' }
  ];

  const departments = [
    'Cardiology',
    'Orthopedics',
    'Neurology',
    'General Surgery',
    'Pediatrics',
    'Dermatology',
    'Oncology',
    'Gastroenterology'
  ];

  
  const filteredPatients = allPatients.filter(p =>
    p.name.toLowerCase().includes(patientNameSearch.toLowerCase()) ||
    p.id.toLowerCase().includes(patientNameSearch.toLowerCase())
  );

  const selectPatient = (patient) => {
    setPatientNameSearch(patient.name);
    setAdmissionForm(prev => ({
      ...prev,
      patientId: patient.id,
      patientAge: patient.age || '',
      gender: patient.gender || 'Male',
      bloodGroup: patient.bloodGroup || ''
    }));
    setShowPatientDropdown(false);
  };

  const clearPatientSelection = () => {
    setPatientNameSearch('');
    setAdmissionForm(prev => ({
      ...prev,
      patientId: '',
      patientAge: '',
      gender: 'Male',
      bloodGroup: ''
    }));
    patientNameRef.current?.focus();
  };

  const [admissionForm, setAdmissionForm] = useState({
    patientId: '',
    patientAge: '',
    gender: 'Male',
    bloodGroup: '',
    admissionDate: new Date().toISOString().split('T')[0],
    admissionTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    admissionSource: 'OPD',
    caseType: 'Medical',
    triageLevel: 'Routine',
    initialCondition: 'Stable',
    referredBy: '',
    diagnosis: '',
    ward: '',
    bed: '',
    consultant: '',
    department: '',
    emergencyContact: '',
    estimatedStay: '',
    admissionType: 'Emergency',
    admissionNotes: ''
  });

  const [dischargeForm, setDischargeForm] = useState({
    dischargeDate: new Date().toISOString().split('T')[0],
    dischargeTime: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
    dischargeType: 'Normal',
    dischargeCondition: 'Stable',
    dischargeMode: 'Walk',
    finalDiagnosis: '',
    treatmentSummary: '',
    dischargeMedications: '',
    dosageInstructions: '',
    medicationDuration: '',
    dietInstructions: '',
    followUpDate: '',
    vitalsAtDischarge: {
      bp: '',
      pulse: '',
      temp: '',
      spo2: ''
    },
    totalBillAmount: '',
    paidAmount: '',
    pendingAmount: '',
    paymentMode: 'Cash',
    billingStatus: 'Pending',
    handoverTo: '',
    handoverRelationship: '',
    attendantSignature: false,
    dischargeNotes: ''
  });

  const [transferForm, setTransferForm] = useState({
    newWard: '',
    transferDate: new Date().toISOString().split('T')[0],
    priority: 'Routine',
    reason: ''
  });


  useEffect(() => {
    loadIPDData();
  }, []);

  const loadIPDData = async () => {
    setLoading(true);
    setTimeout(() => {
      setIpdPatients([
        {
          id: 'ADM-001',
          patientId: 'PAT-005',
          patientName: 'Rajesh Verma',
          patientAge: 50,
          gender: 'Male',
          bloodGroup: 'AB+',
          admissionDate: '2023-10-10',
          admissionTime: '10:30',
          admissionSource: 'OPD',
          admissionType: 'Routine',
          caseType: 'Medical',
          triageLevel: 'Routine',
          initialCondition: 'Stable',
          ward: 'General Ward A',
          bed: 'A-12',
          diagnosis: 'Pneumonia',
          consultant: 'Dr. Meena Rao',
          department: 'General Medicine',
          emergencyContact: '+91 98765 43210',
          estimatedStay: '8',
          status: 'Admitted',
          estimatedDischarge: '2023-10-18',
          roomCharges: 2500,
          totalBill: 18500,
          referredBy: 'Self',
          admissionNotes: 'Patient has history of mild asthma.'
        },
        {
          id: 'ADM-002',
          patientId: 'PAT-006',
          patientName: 'Meera Desai',
          patientAge: 42,
          gender: 'Female',
          bloodGroup: 'B-',
          admissionDate: '2023-10-12',
          admissionTime: '02:15',
          admissionSource: 'Emergency',
          admissionType: 'Emergency',
          caseType: 'Surgical',
          triageLevel: 'Critical',
          initialCondition: 'Poor',
          ward: 'ICU',
          bed: 'ICU-03',
          diagnosis: 'Cardiac Arrest',
          consultant: 'Dr. Sharma',
          department: 'Cardiology',
          emergencyContact: '+91 91234 56789',
          estimatedStay: '15',
          status: 'Critical',
          estimatedDischarge: '2023-10-20',
          roomCharges: 8500,
          totalBill: 42500,
          referredBy: 'City Clinic',
          admissionNotes: 'Immediate surgery performed.'
        },
        {
          id: 'ADM-003',
          patientId: 'PAT-007',
          patientName: 'Vikram Joshi',
          patientAge: 35,
          gender: 'Male',
          bloodGroup: 'O+',
          admissionDate: '2023-10-08',
          admissionTime: '11:45',
          admissionSource: 'Referral',
          admissionType: 'Scheduled',
          caseType: 'Surgical',
          triageLevel: 'Routine',
          initialCondition: 'Stable',
          ward: 'Orthopedic Ward',
          bed: 'OW-07',
          diagnosis: 'Fractured Femur',
          consultant: 'Dr. Menon',
          department: 'Orthopedics',
          emergencyContact: '+91 88776 65544',
          estimatedStay: '7',
          status: 'Admitted',
          estimatedDischarge: '2023-10-15',
          roomCharges: 3200,
          totalBill: 27800,
          referredBy: 'Dr. Kulkarni',
          admissionNotes: 'Post-accident trauma.'
        },
        {
          id: 'ADM-004',
          patientId: 'PAT-008',
          patientName: 'Kiran Reddy',
          patientAge: 29,
          gender: 'Female',
          bloodGroup: 'A-',
          admissionDate: '2023-10-05',
          admissionTime: '09:00',
          admissionSource: 'Direct',
          admissionType: 'Routine',
          caseType: 'Medical',
          triageLevel: 'Routine',
          initialCondition: 'Stable',
          ward: 'Private Room',
          bed: 'PR-02',
          diagnosis: 'Appendicitis',
          consultant: 'Dr. Meena Rao',
          department: 'General Surgery',
          emergencyContact: '+91 77665 54433',
          estimatedStay: '5',
          status: 'Discharge Pending',
          estimatedDischarge: '2023-10-12',
          roomCharges: 5000,
          totalBill: 35200,
          referredBy: 'Self',
          admissionNotes: 'Patient opted for private room.'
        }
      ]);

      setWards([
        { id: 'WARD-001', name: 'General Ward A', totalBeds: 20, availableBeds: 8, rate: 2500 },
        { id: 'WARD-002', name: 'General Ward B', totalBeds: 20, availableBeds: 12, rate: 2500 },
        { id: 'WARD-003', name: 'ICU', totalBeds: 10, availableBeds: 3, rate: 8500 },
        { id: 'WARD-004', name: 'ICU-2', totalBeds: 8, availableBeds: 2, rate: 8500 },
        { id: 'WARD-005', name: 'Orthopedic Ward', totalBeds: 15, availableBeds: 6, rate: 3200 },
        { id: 'WARD-006', name: 'Pediatric Ward', totalBeds: 12, availableBeds: 5, rate: 2800 },
        { id: 'WARD-007', name: 'Private Room', totalBeds: 8, availableBeds: 2, rate: 5000 },
        { id: 'WARD-008', name: 'Deluxe Room', totalBeds: 4, availableBeds: 1, rate: 8000 }
      ]);

      setLoading(false);
    }, 1000);
  };

  const handleAdmission = () => {
    if (!admissionForm.patientId || !admissionForm.ward || !admissionForm.diagnosis) {
      alert('Please fill all required fields');
      return;
    }

    const newAdmission = {
      id: `ADM-${Date.now().toString().slice(-4)}`,
      patientId: admissionForm.patientId,
      patientName: patientNameSearch,
      patientAge: admissionForm.patientAge,
      gender: admissionForm.gender,
      bloodGroup: admissionForm.bloodGroup,
      admissionDate: admissionForm.admissionDate,
      admissionTime: admissionForm.admissionTime,
      admissionSource: admissionForm.admissionSource,
      admissionType: admissionForm.admissionType,
      caseType: admissionForm.caseType,
      triageLevel: admissionForm.triageLevel,
      initialCondition: admissionForm.initialCondition,
      ward: admissionForm.ward,
      bed: admissionForm.bed || 'To be assigned',
      diagnosis: admissionForm.diagnosis,
      consultant: admissionForm.consultant,
      department: admissionForm.department,
      referredBy: admissionForm.referredBy,
      emergencyContact: admissionForm.emergencyContact,
      estimatedStay: admissionForm.estimatedStay,
      admissionNotes: admissionForm.admissionNotes,
      status: 'Admitted',
      estimatedDischarge: new Date(Date.now() + parseInt(admissionForm.estimatedStay || 3) * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0],
      roomCharges: wards.find(w => w.name === admissionForm.ward)?.rate || 0,
      totalBill: 0
    };

    setIpdPatients([newAdmission, ...ipdPatients]);

    // Update ward availability
    setWards(wards.map(ward =>
      ward.name === admissionForm.ward
        ? { ...ward, availableBeds: ward.availableBeds - 1 }
        : ward
    ));

    alert('Patient admitted successfully!');
    setAdmissionForm({
      patientId: '',
      patientAge: '',
      gender: 'Male',
      bloodGroup: '',
      admissionDate: new Date().toISOString().split('T')[0],
      admissionTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      admissionSource: 'OPD',
      caseType: 'Medical',
      triageLevel: 'Routine',
      initialCondition: 'Stable',
      referredBy: '',
      diagnosis: '',
      ward: '',
      bed: '',
      consultant: '',
      department: '',
      emergencyContact: '',
      estimatedStay: '',
      admissionType: 'Routine',
      admissionNotes: ''
    });
    setPatientNameSearch('');
    setDoctorSearch('');
    setDeptSearch('');
    setShowAdmissionForm(false);
  };

  const initiateTransfer = (patient) => {
    setSelectedPatient(patient);
    setTransferForm({
      newWard: '',
      transferDate: new Date().toISOString().split('T')[0],
      priority: 'Routine',
      reason: ''
    });
    setShowTransferModal(true);
  };

  const handleTransfer = () => {
    if (!transferForm.newWard) {
      alert('Please select a new ward');
      return;
    }

    const patientId = selectedPatient.id;
    const newWard = transferForm.newWard;

    setIpdPatients(ipdPatients.map(patient => {
      if (patient.id === patientId) {
        const oldWard = patient.ward;
        const newWardRate = wards.find(w => w.name === newWard)?.rate || patient.roomCharges;

        // Update wards availability
        setWards(wards.map(ward => {
          if (ward.name === oldWard) {
            return { ...ward, availableBeds: ward.availableBeds + 1 };
          }
          if (ward.name === newWard) {
            return { ...ward, availableBeds: ward.availableBeds - 1 };
          }
          return ward;
        }));

        return {
          ...patient,
          ward: newWard,
          roomCharges: newWardRate
        };
      }
      return patient;
    }));

    alert('Patient transferred successfully!');
    setShowTransferModal(false);
    setSelectedPatient(null);
    setTransferForm({
      newWard: '',
      transferDate: new Date().toISOString().split('T')[0],
      priority: 'Routine',
      reason: ''
    });
  };

  const initiateDischarge = (patient) => {
    setSelectedPatient(patient);
    setDischargeForm({
      ...dischargeForm,
      finalDiagnosis: patient.diagnosis,
      dischargeDate: new Date().toISOString().split('T')[0],
      followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totalBillAmount: patient.totalBill || '',
      pendingAmount: patient.totalBill || '',
      paidAmount: '0',
      billingStatus: 'Pending'
    });
    setShowDischargeModal(true);
  };

  const handleConfirmDischarge = (patientId) => {
    setIpdPatients(ipdPatients.map(patient =>
      patient.id === patientId
        ? { ...patient, status: 'Discharged' }
        : patient
    ));
    setShowDischargeModal(false);
    setSelectedPatient(null);
    setDischargeForm({
      dischargeDate: new Date().toISOString().split('T')[0],
      dischargeType: 'Normal',
      dischargeCondition: 'Stable',
      finalDiagnosis: '',
      treatmentSummary: '',
      prescription: '',
      followUpDate: '',
      vitalsAtDischarge: {
        bp: '',
        pulse: '',
        temp: ''
      },
      billingStatus: 'Pending',
      totalBillAmount: '',
      paidAmount: '',
      pendingAmount: '',
      paymentMode: 'Cash',
      handoverTo: '',
      transportMode: 'Private Vehicle',
      dischargeNotes: ''
    });
  };

  const updateBill = (patient) => {
    setSelectedPatient(patient);
    setPendingCharges([]);
    setBillingForm({
      category: 'Pharmacy / Medications',
      amount: '',
      description: ''
    });
    setShowBillingModal(true);
  };

  const addCharge = () => {
    if (!billingForm.amount || parseFloat(billingForm.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    const newCharge = {
      ...billingForm,
      id: Date.now(),
      date: new Date().toISOString().split('T')[0]
    };
    setPendingCharges([...pendingCharges, newCharge]);
    setBillingForm({
      category: 'Pharmacy / Medications',
      amount: '',
      description: ''
    });
  };

  const removePendingCharge = (id) => {
    setPendingCharges(pendingCharges.filter(c => c.id !== id));
  };

  const handleUpdateBill = (patientId) => {
    const totalNewCharges = pendingCharges.reduce((sum, c) => sum + parseFloat(c.amount), 0);

    if (totalNewCharges === 0 && (!billingForm.amount || billingForm.amount === '')) {
      alert('No charges to add');
      return;
    }

    // If there's something in the form but not added to pending, add it automatically
    let finalCharges = totalNewCharges;
    if (billingForm.amount && parseFloat(billingForm.amount) > 0) {
      finalCharges += parseFloat(billingForm.amount);
    }

    setIpdPatients(ipdPatients.map(patient =>
      patient.id === patientId
        ? { ...patient, totalBill: patient.totalBill + finalCharges }
        : patient
    ));

    setShowBillingModal(false);
    setSelectedPatient(null);
    setPendingCharges([]);
    alert(`Added ₹${finalCharges} to ${selectedPatient.patientName}'s bill`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Admitted': return 'status-confirmed';
      case 'Critical': return 'status-urgent';
      case 'Discharge Pending': return 'status-processing';
      case 'Discharged': return 'status-completed';
      default: return 'status-pending';
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-700"> IPD Management</h2>
        <button
          onClick={() => setShowAdmissionForm(true)}
          className="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center shadow-lg shadow-blue-100"
        >
          <Hotel className="mr-2" fontSize="small" /> New Admission
        </button>
      </div>

      {/* IPD Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">

        {/* TOTAL ADMISSIONS */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                Total Admissions
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {ipdPatients.length}
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
              <Bed className="text-white text-lg" fontSize="inherit" />
            </div>
          </div>

          {/* FULL WIDTH LINE */}
          <div className="h-px w-full bg-blue-200 my-3"></div>

          <p className="text-xs text-blue-600">
            Overall admitted patients
          </p>
        </div>

        {/* CRITICAL PATIENTS */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">
                Critical Patients
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {ipdPatients.filter(p => p.status === 'Critical').length}
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center">
              <MonitorHeart className="text-white text-lg" fontSize="inherit" />
            </div>
          </div>

          <div className="h-px w-full bg-red-200 my-3"></div>

          <p className="text-xs text-red-600">
            Requires immediate care
          </p>
        </div>

        {/* AVAILABLE BEDS */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                Available Beds
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {wards.reduce((sum, ward) => sum + ward.availableBeds, 0)}
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
              <MeetingRoom className="text-white text-lg" fontSize="inherit" />
            </div>
          </div>

          <div className="h-px w-full bg-green-200 my-3"></div>

          <p className="text-xs text-green-600">
            Ready for admission
          </p>
        </div>

        {/* TODAY'S REVENUE */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">
                Today's Revenue
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ₹{ipdPatients.reduce((sum, p) => sum + p.roomCharges, 0)}
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-yellow-500 flex items-center justify-center">
              <Payments className="text-white text-lg" fontSize="inherit" />
            </div>
          </div>

          <div className="h-px w-full bg-yellow-200 my-3"></div>

          <p className="text-xs text-yellow-600">
            Room charges collected
          </p>
        </div>

      </div>


      {/* IPD Patients Table */}
      <div className="bg-white rounded-lg card-shadow border overflow-hidden mb-6">
        <DataTable
          columns={[
            {
              key: 'patientName',
              title: 'Patient',
              sortable: true,
              render: (value, row) => (
                <div>
                  <p className="font-medium">{value}</p>
                  <p className="text-xs text-gray-500">ID: {row.patientId}</p>
                  <p className="text-xs text-gray-500">Admission: {row.admissionDate}</p>
                </div>
              )
            },
            { key: 'ward', title: 'Ward', sortable: true },
            { key: 'bed', title: 'Bed', sortable: true },
            { key: 'diagnosis', title: 'Diagnosis', sortable: true },
            { key: 'consultant', title: 'Consultant', sortable: true },
            {
              key: 'status',
              title: 'Status',
              sortable: true,
              render: (value) => (
                <span className={`px-3 py-1 rounded-full text-xs  font-medium ${getStatusColor(value)}`}>
                  {value}
                </span>
              )
            },
            { key: 'estimatedDischarge', title: 'Est. Discharge', sortable: true },
            { key: 'roomCharges', title: 'Room Charges', sortable: true, render: (value) => `₹${value}` },
            {
              key: 'actions',
              title: 'Actions',
              headerClassName: 'pl-6',
              render: (_, row) => (
                <div className="flex gap-0.5">
                  <button
                    className="text-blue-600 hover:text-blue-800 p-1 modal-touch-target flex items-center justify-center"
                    title="View Details"
                    onClick={() => setSelectedPatient(row)}
                  >
                    <Visibility fontSize="small" />
                  </button>
                  <button
                    className={`p-1 modal-touch-target flex items-center justify-center ${row.status === 'Discharged' || row.status === 'Discharge Pending'
                      ? 'text-gray-400 cursor-not-allowed opacity-50'
                      : 'text-green-600 hover:text-green-800'
                      }`}
                    title={row.status === 'Discharged' || row.status === 'Discharge Pending' ? 'Patient Discharged' : 'Transfer'}
                    onClick={() => row.status !== 'Discharged' && row.status !== 'Discharge Pending' && initiateTransfer(row)}
                    disabled={row.status === 'Discharged' || row.status === 'Discharge Pending'}
                  >
                    <SwapHoriz fontSize="small" />
                  </button>
                  <button
                    className={`p-1 modal-touch-target flex items-center justify-center ${row.status === 'Discharge Pending' || row.status === 'Discharged'
                      ? 'text-gray-400 cursor-not-allowed opacity-50'
                      : 'text-purple-600 hover:text-purple-800'
                      }`}
                    title={row.status === 'Discharge Pending' || row.status === 'Discharged' ? 'Discharge Initiated' : 'Initiate Discharge'}
                    onClick={() => row.status !== 'Discharge Pending' && row.status !== 'Discharged' && initiateDischarge(row)}
                    disabled={row.status === 'Discharge Pending' || row.status === 'Discharged'}
                  >
                    <Logout fontSize="small" />
                  </button>
                  <button
                    className="text-yellow-600 hover:text-yellow-800 p-1 modal-touch-target flex items-center justify-center"
                    title="Update Bill"
                    onClick={() => updateBill(row)}
                  >
                    <ReceiptLong fontSize="small" />
                  </button>
                </div>
              )
            }
          ]}
          data={ipdPatients}
        />
      </div>

      {/* Wards Overview */}
      <div className="bg-white rounded-lg card-shadow border p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4"> Wards & Bed Availability</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {wards.map(ward => (
            <div key={ward.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold">{ward.name}</h4>
                <span className={`px-2 py-1 rounded text-xs font-medium ${ward.availableBeds > 3 ? 'bg-green-100 text-green-800' :
                  ward.availableBeds > 0 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                  {ward.availableBeds} Available
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">Rate: ₹{ward.rate}/day</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${((ward.totalBeds - ward.availableBeds) / ward.totalBeds) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 text-center">
                {ward.totalBeds - ward.availableBeds}/{ward.totalBeds} beds occupied
              </p>
              <div className="mt-3 pt-3 border-t">
                <button
                  className="w-full btn border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white btn-sm"
                  onClick={() => {
                    setAdmissionForm({ ...admissionForm, ward: ward.name });
                    setShowAdmissionForm(true);
                  }}
                  disabled={ward.availableBeds === 0}
                >
                  {ward.availableBeds === 0 ? 'Full' : 'Admit Patient'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal
        isOpen={showAdmissionForm}
        onClose={() => {
          setShowAdmissionForm(false);
          setAdmissionForm({
            patientId: '',
            patientAge: '',
            gender: 'Male',
            bloodGroup: '',
            admissionDate: new Date().toISOString().split('T')[0],
            admissionTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
            admissionSource: 'OPD',
            caseType: 'Medical',
            triageLevel: 'Routine',
            initialCondition: 'Stable',
            referredBy: '',
            diagnosis: '',
            ward: '',
            bed: '',
            consultant: '',
            department: '',
            emergencyContact: '',
            estimatedStay: '',
            admissionType: 'Routine',
            admissionNotes: ''
          });
          setPatientNameSearch('');
          setDoctorSearch('');
          setDeptSearch('');
        }}
        title="New IPD Admission"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowAdmissionForm(false)}
              className="btn bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 border-none"
            >
              Cancel
            </button>
            <button
              onClick={handleAdmission}
              className="btn bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center px-8 shadow-lg shadow-emerald-100"
            >
              <Hotel className="mr-2" fontSize="small" /> Complete Admission
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Patient Selection — Name + ID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Patient Name — searchable combobox */}
            <div className="form-group relative md:col-span-1">
              <label className="form-label">Patient Name <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  ref={patientNameRef}
                  type="text"
                  className="form-input pl-10 pr-10"
                  placeholder="Search by name or ID..."
                  value={patientNameSearch}
                  onChange={(e) => {
                    setPatientNameSearch(e.target.value);
                    setShowPatientDropdown(true);
                    // If the typed value no longer matches a patient, clear the ID
                    const match = allPatients.find(p => p.name.toLowerCase() === e.target.value.toLowerCase());
                    if (match) {
                      setAdmissionForm(prev => ({ ...prev, patientId: match.id }));
                    } else {
                      setAdmissionForm(prev => ({ ...prev, patientId: '' }));
                    }
                  }}
                  onFocus={() => setShowPatientDropdown(true)}
                  required
                />
                {/* Arrow toggle button */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-1">
                  <button
                    type="button"
                    onClick={() => setShowPatientDropdown(prev => !prev)}
                    className={`p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all ${showPatientDropdown ? 'rotate-180' : ''
                      }`}
                  >
                    <KeyboardArrowDown fontSize="small" />
                  </button>
                </div>
              </div>

              {/* Dropdown results */}
              {showPatientDropdown && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                  {filteredPatients.length > 0 ? (
                    filteredPatients.map(p => (
                      <div
                        key={p.id}
                        className={`px-4 py-2.5 flex justify-between items-center cursor-pointer transition-colors border-b border-gray-50 last:border-0 ${admissionForm.patientId === p.id
                          ? 'bg-blue-50'
                          : 'hover:bg-gray-50'
                          }`}
                        onClick={() => selectPatient(p)}
                      >
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                          <p className="text-[11px] text-gray-500">{p.id}</p>
                        </div>
                        {admissionForm.patientId === p.id && (
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">Selected</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-400 italic text-center">No matching patients</div>
                  )}
                  <div
                    className="px-4 py-2.5 text-emerald-600 font-semibold text-sm cursor-pointer hover:bg-emerald-50 border-t border-gray-100 flex items-center gap-1"
                    onClick={() => {
                      setShowPatientDropdown(false);
                      alert('Redirecting to Patient Registration...');
                    }}
                  >
                    Register New Patient
                  </div>
                </div>
              )}
            </div>

            {/* Patient ID — auto-filled, editable */}
            <div className="form-group">
              <label className="form-label">Patient ID <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. PAT-001"
                value={admissionForm.patientId}
                onChange={(e) => {
                  const newId = e.target.value;
                  setAdmissionForm(prev => ({ ...prev, patientId: newId }));
                  // Reverse-lookup: if ID matches a known patient, fill the name
                  const match = allPatients.find(p => p.id.toLowerCase() === newId.toLowerCase());
                  if (match) {
                    setPatientNameSearch(match.name);
                    setAdmissionForm(prev => ({
                      ...prev,
                      patientId: match.id,
                      patientAge: match.age || '',
                      gender: match.gender || 'Male',
                      bloodGroup: match.bloodGroup || ''
                    }));
                  }
                }}
                required
              />
            </div>
          </div>

          {/* Age, Gender, Blood Group row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-group">
              <label className="form-label">Age</label>
              <input
                type="number"
                className="form-input"
                placeholder="Years"
                value={admissionForm.patientAge}
                onChange={(e) => setAdmissionForm({ ...admissionForm, patientAge: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select
                className="form-input"
                value={admissionForm.gender}
                onChange={(e) => setAdmissionForm({ ...admissionForm, gender: e.target.value })}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Blood Group</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. O+"
                value={admissionForm.bloodGroup}
                onChange={(e) => setAdmissionForm({ ...admissionForm, bloodGroup: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Admission Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={admissionForm.admissionDate}
                onChange={(e) => setAdmissionForm({ ...admissionForm, admissionDate: e.target.value })}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Admission Time <span className="text-red-500">*</span></label>
              <input
                type="time"
                value={admissionForm.admissionTime}
                onChange={(e) => setAdmissionForm({ ...admissionForm, admissionTime: e.target.value })}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-group">
              <label className="form-label">Admission Source <span className="text-red-500">*</span></label>
              <select
                value={admissionForm.admissionSource}
                onChange={(e) => setAdmissionForm({ ...admissionForm, admissionSource: e.target.value })}
                className="form-input"
                required
              >
                <option value="OPD">OPD</option>
                <option value="Emergency">Emergency Room</option>
                <option value="Referral">External Referral</option>
                <option value="Direct">Direct Admission</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Triage Level <span className="text-red-500">*</span></label>
              <select
                value={admissionForm.triageLevel}
                onChange={(e) => setAdmissionForm({ ...admissionForm, triageLevel: e.target.value })}
                className="form-input"
                required
              >
                <option value="Routine">Routine (P3)</option>
                <option value="Urgent">Urgent (P2)</option>
                <option value="Critical">Critical (P1)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Case Type <span className="text-red-500">*</span></label>
              <select
                value={admissionForm.caseType}
                onChange={(e) => setAdmissionForm({ ...admissionForm, caseType: e.target.value })}
                className="form-input"
                required
              >
                <option value="Medical">Medical</option>
                <option value="Surgical">Surgical</option>
                <option value="Diagnostic">Diagnostic</option>
                <option value="Palliative">Palliative</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Admission Type <span className="text-red-500">*</span></label>
              <select
                value={admissionForm.admissionType}
                onChange={(e) => setAdmissionForm({ ...admissionForm, admissionType: e.target.value })}
                className="form-input"
                required
              >
                <option value="Emergency">Emergency</option>
                <option value="Routine">Routine</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Maternity">Maternity</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Initial Condition <span className="text-red-500">*</span></label>
              <select
                value={admissionForm.initialCondition}
                onChange={(e) => setAdmissionForm({ ...admissionForm, initialCondition: e.target.value })}
                className="form-input"
                required
              >
                <option value="Stable">Stable</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
                <option value="Critical">Critical</option>
                <option value="Unconscious">Unconscious</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Ward <span className="text-red-500">*</span></label>
              <select
                value={admissionForm.ward}
                onChange={(e) => setAdmissionForm({ ...admissionForm, ward: e.target.value })}
                className="form-input"
                required
              >
                <option value="">Select Ward</option>
                {wards.filter(w => w.availableBeds > 0).map(ward => (
                  <option key={ward.id} value={ward.name}>
                    {ward.name} (Available: {ward.availableBeds}, Rate: ₹{ward.rate}/day)
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Bed (Optional)</label>
              <input
                type="text"
                value={admissionForm.bed}
                onChange={(e) => setAdmissionForm({ ...admissionForm, bed: e.target.value })}
                className="form-input"
                placeholder="Will be auto-assigned if left blank"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Primary Diagnosis <span className="text-red-500">*</span></label>
            <textarea
              value={admissionForm.diagnosis}
              onChange={(e) => setAdmissionForm({ ...admissionForm, diagnosis: e.target.value })}
              className="form-input"
              rows="2"
              placeholder="Enter primary diagnosis..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Doctor Name Search */}
            <div className="form-group relative md:col-span-1">
              <label className="form-label">Doctor Name <span className="text-red-500">*</span></label>
              <div className="relative">

                <input
                  type="text"
                  className="form-input pl-10 pr-10"
                  placeholder="Search or enter doctor..."
                  value={doctorSearch || admissionForm.consultant}
                  onChange={(e) => {
                    setDoctorSearch(e.target.value);
                    setAdmissionForm({ ...admissionForm, consultant: e.target.value });
                    setShowDoctorDropdown(true);
                  }}
                  onFocus={() => setShowDoctorDropdown(true)}
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-1">
                  <button
                    type="button"
                    onClick={() => setShowDoctorDropdown(!showDoctorDropdown)}
                    className="p-1 rounded hover:bg-gray-100 text-gray-400"
                  >
                    <KeyboardArrowDown fontSize="small" />
                  </button>
                </div>
              </div>
              {showDoctorDropdown && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {doctors
                    .filter(d => d.name.toLowerCase().includes((doctorSearch || admissionForm.consultant).toLowerCase()))
                    .map((d, i) => (
                      <div
                        key={i}
                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-50 last:border-0"
                        onClick={() => {
                          setAdmissionForm({
                            ...admissionForm,
                            consultant: d.name,
                            department: d.dept
                          });
                          setDoctorSearch(d.name);
                          setDeptSearch(d.dept);
                          setShowDoctorDropdown(false);
                        }}
                      >
                        <p className="font-bold text-gray-900">{d.name}</p>
                        <p className="text-[10px] text-gray-500 uppercase">{d.dept}</p>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Department Search */}
            <div className="form-group relative md:col-span-1">
              <label className="form-label">Department <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type="text"
                  className="form-input pl-10 pr-10"
                  placeholder="Search or enter dept..."
                  value={deptSearch || admissionForm.department}
                  onChange={(e) => {
                    setDeptSearch(e.target.value);
                    setAdmissionForm({ ...admissionForm, department: e.target.value });
                    setShowDeptDropdown(true);
                  }}
                  onFocus={() => setShowDeptDropdown(true)}
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-1">
                  <button
                    type="button"
                    onClick={() => setShowDeptDropdown(!showDeptDropdown)}
                    className="p-1 rounded hover:bg-gray-100 text-gray-400"
                  >
                    <KeyboardArrowDown fontSize="small" />
                  </button>
                </div>
              </div>
              {showDeptDropdown && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {departments
                    .filter(dept => dept.toLowerCase().includes((deptSearch || admissionForm.department).toLowerCase()))
                    .map((dept, i) => (
                      <div
                        key={i}
                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-50 last:border-0"
                        onClick={() => {
                          setAdmissionForm({ ...admissionForm, department: dept });
                          setDeptSearch(dept);
                          setShowDeptDropdown(false);
                        }}
                      >
                        {dept}
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Estimated Stay */}
            <div className="form-group md:col-span-1">
              <label className="form-label">Est. Stay (Days)</label>
              <input
                type="number"
                value={admissionForm.estimatedStay}
                onChange={(e) => setAdmissionForm({ ...admissionForm, estimatedStay: e.target.value })}
                className="form-input"
                min="1"
                max="30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Referred By</label>
              <input
                type="text"
                value={admissionForm.referredBy}
                onChange={(e) => setAdmissionForm({ ...admissionForm, referredBy: e.target.value })}
                className="form-input"
                placeholder="Doctor/Clinic name"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Emergency Contact <span className="text-red-500">*</span></label>
              <input
                type="tel"
                value={admissionForm.emergencyContact}
                onChange={(e) => setAdmissionForm({ ...admissionForm, emergencyContact: e.target.value })}
                className="form-input"
                placeholder="+91 98765 43210"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Admission Notes</label>
            <textarea
              value={admissionForm.admissionNotes}
              onChange={(e) => setAdmissionForm({ ...admissionForm, admissionNotes: e.target.value })}
              className="form-input"
              rows="3"
              placeholder="Any special instructions or notes..."
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showTransferModal}
        onClose={() => {
          setShowTransferModal(false);
          setSelectedPatient(null);
          setTransferForm({
            newWard: '',
            transferDate: new Date().toISOString().split('T')[0],
            priority: 'Routine',
            reason: ''
          });
        }}
        title={`Patient Transfer: ${selectedPatient?.patientName || ''}`}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setShowTransferModal(false);
                setSelectedPatient(null);
                setTransferForm({
                  newWard: '',
                  transferDate: new Date().toISOString().split('T')[0],
                  priority: 'Routine',
                  reason: ''
                });
              }}
              className="btn bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleTransfer}
              className="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center shadow-lg shadow-blue-100"
            >
              <SwapHoriz className="mr-2" fontSize="small" /> Complete Transfer
            </button>
          </div>
        }
      >
        {selectedPatient && (
          <div className="space-y-6">
            {/* Location Status */}
            <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-2xl shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                <SwapHoriz className="text-gray-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current Ward</span>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">Active</span>
                </div>
                <p className="text-base font-bold text-gray-900 mt-0.5">
                  {selectedPatient.ward} <span className="mx-2 text-gray-300">|</span> <span className="text-gray-500 font-normal">Bed {selectedPatient.bed}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Transfer Date</label>
                <input
                  type="date"
                  value={transferForm.transferDate}
                  onChange={(e) => setTransferForm({ ...transferForm, transferDate: e.target.value })}
                  className="w-full text-sm px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50/30"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Priority Level</label>
                <select
                  value={transferForm.priority}
                  onChange={(e) => setTransferForm({ ...transferForm, priority: e.target.value })}
                  className="w-full text-sm px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50/30"
                  required
                >
                  <option value="Routine">Routine</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Target Ward Location</label>
              <select
                className="w-full text-sm px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50/30 font-semibold text-gray-900"
                value={transferForm.newWard}
                onChange={(e) => setTransferForm({ ...transferForm, newWard: e.target.value })}
                required
              >
                <option value="">Select Ward...</option>
                {wards
                  .filter(w => w.name !== selectedPatient.ward && w.availableBeds > 0)
                  .map(ward => (
                    <option key={ward.id} value={ward.name}>
                      {ward.name} ({ward.availableBeds} beds left) • ₹{ward.rate}/day
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Clinical Reason</label>
              <textarea
                className="w-full text-sm px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50/30"
                rows="3"
                value={transferForm.reason}
                onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                placeholder="Briefly describe the clinical necessity for ward transfer..."
              />
            </div>

            {/* Protocol Steps */}
            <div className="p-4 border border-dashed border-gray-200 rounded-2xl">
              <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Assignment style={{ fontSize: 14 }} /> Transfer Protocol Checklist
              </h5>
              <div className="space-y-2">
                {[
                  'Room charges will auto-adjust upon completion',
                  'Nursing stations & consultants will be alerted',
                  'Verify all medical equipment is moved with patient'
                ].map((note, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-[11px] text-gray-500 leading-relaxed">
                    <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                    {note}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Patient Detail Modal */}
      {selectedPatient && !showTransferModal && !showDischargeModal && !showBillingModal && (
        <Modal
          isOpen={!!selectedPatient}
          onClose={() => {
            setSelectedPatient(null);
            setActiveTab('Overview');
          }}
          title={
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100">
                <Hotel fontSize="medium" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Patient Clinical Record</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(selectedPatient.status)}`}>
                    {selectedPatient.status}
                  </span>
                </div>
                <p className="text-sm text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                  <span className="text-slate-900 font-bold">{selectedPatient.patientName}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span>ID: {selectedPatient.patientId}</span>
                </p>
              </div>
            </div>
          }
          size="lg"
          footer={
            <div className="flex justify-end gap-3 w-full pt-4 border-t border-slate-100">
              <button
                className="btn bg-yellow-500  text-white flex items-center justify-center px-6 transition-all duration-200 shadow-md shadow-teal-100 font-bold text-xs  tracking-wider"
                onClick={() => setShowRecordsModal(true)}
              >
                <MedicalInformation className="mr-2" style={{ fontSize: 18 }} /> Medical Records
              </button>
              <button
                className={`btn flex items-center justify-center px-6 transition-all duration-200 shadow-md font-bold text-xs tracking-wider ${selectedPatient.status === 'Discharged' || selectedPatient.status === 'Discharge Pending'
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100'
                  }`}
                onClick={() => selectedPatient.status !== 'Discharged' && selectedPatient.status !== 'Discharge Pending' && initiateTransfer(selectedPatient)}
                disabled={selectedPatient.status === 'Discharged' || selectedPatient.status === 'Discharge Pending'}
              >
                <SwapHoriz className="mr-2" style={{ fontSize: 18 }} /> Transfer Ward
              </button>
              <button
                className={`btn flex items-center justify-center px-6 transition-all duration-200 shadow-lg font-bold text-xs tracking-wider ${selectedPatient.status === 'Discharged' || selectedPatient.status === 'Discharge Pending'
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100'
                  }`}
                onClick={() => selectedPatient.status !== 'Discharged' && selectedPatient.status !== 'Discharge Pending' && initiateDischarge(selectedPatient)}
                disabled={selectedPatient.status === 'Discharged' || selectedPatient.status === 'Discharge Pending'}
              >
                <Logout className="mr-2" style={{ fontSize: 18 }} /> Discharge Patient
              </button>
            </div>
          }
        >
          <div className="min-h-[480px]">
            {/* Professional Tabs Navigation */}
            <div className="flex items-center p-1.5 bg-slate-100/50 rounded-2xl border border-slate-200/60 mb-8 max-w-fit mx-auto">
              {[
                { id: 'Overview', icon: <Assignment style={{ fontSize: 18 }} />, label: 'Admission Overview' },
                { id: 'Clinical', icon: <MonitorHeart style={{ fontSize: 18 }} />, label: 'Clinical Status' },
                { id: 'Financial', icon: <Payments style={{ fontSize: 18 }} />, label: 'Financial Summary' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 ${activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-md shadow-blue-50/50 scale-[1.02]'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                    }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content with refined alignment */}
            <div className="px-2 pb-4">
              {activeTab === 'Overview' && (
                <div className="animate-fade-in space-y-8">
                  {/* High-Level Demographics Card */}
                  <div className="grid grid-cols-4 gap-0 divide-x divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                    {[
                      { label: 'Patient Age', value: `${selectedPatient.patientAge || 'N/A'} Years`, color: 'text-slate-900' },
                      { label: 'Gender', value: selectedPatient.gender, color: 'text-slate-900' },
                      { label: 'Blood Group', value: selectedPatient.bloodGroup || 'O+', color: 'text-rose-600 font-black' },
                      { label: 'Admission ID', value: selectedPatient.id, color: 'text-blue-600' }
                    ].map((item, idx) => (
                      <div key={idx} className="p-4 text-center group hover:bg-slate-50 transition-colors">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">{item.label}</label>
                        <p className={`text-sm font-bold ${item.color}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Primary Details Grid */}
                  <div className="grid grid-cols-2 gap-8">
                    {/* Left Column: Logistics */}
                    <div className="space-y-6">
                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Logistical Details</h4>
                      <div className="grid grid-cols-1 gap-5">
                        <div className="flex justify-between items-center group">
                          <span className="text-sm text-slate-500">Admission Schedule</span>
                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-800">{selectedPatient.admissionDate}</p>
                            <p className="text-[11px] text-slate-400 font-medium">{selectedPatient.admissionTime || '09:00 AM'}</p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center group">
                          <span className="text-sm text-slate-500">Est. Discharge Date</span>
                          <p className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                            {selectedPatient.estimatedDischarge || 'Not Finalized'}
                          </p>
                        </div>
                        <div className="flex justify-between items-center group">
                          <span className="text-sm text-slate-500">Ward Location</span>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-black uppercase">BED {selectedPatient.bed}</span>
                            <span className="text-sm font-bold text-slate-800">{selectedPatient.ward}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Source & Contact */}
                    <div className="space-y-6">
                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Source & Emergency</h4>
                      <div className="grid grid-cols-1 gap-5">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-500">Admission Source</span>
                          <span className="text-sm font-bold text-slate-800">{selectedPatient.admissionSource || 'OPD'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-500">Admission Type</span>
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${selectedPatient.admissionType === 'Emergency' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                            {selectedPatient.admissionType || 'Routine'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-500">Emergency Contact</span>
                          <span className="text-sm font-bold text-blue-600 underline underline-offset-4 decoration-blue-200">{selectedPatient.emergencyContact || '+91 00000 00000'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Clinical Status Banner */}
                  <div className="p-5 bg-gradient-to-r from-slate-50 to-white border border-slate-200/60 rounded-2xl flex gap-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-full -mr-12 -mt-12 blur-2xl" />
                    <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 border border-amber-100 shrink-0">
                      <History />
                    </div>
                    <div>
                      <h5 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                        Clinical Status: <span className="text-amber-600">{selectedPatient.status}</span>
                      </h5>
                      <p className="text-xs text-slate-500 leading-relaxed mt-1">
                        Patient is currently stable and under continuous observation by <strong>{selectedPatient.consultant}</strong>.
                        The recovery trajectory is <strong>{selectedPatient.status === 'Critical' ? 'Closely Monitored' : 'As Expected'}</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Clinical' && (
                <div className="animate-fade-in space-y-6">
                  {/* Primary Diagnosis & Medical Team */}
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-slate-50/80 px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MedicalInformation className="text-blue-500" />
                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">Medical Assessment</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-black rounded-md uppercase border border-blue-100">{selectedPatient.caseType || 'Medical'} Case</span>
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-md uppercase border border-emerald-100">Verified</span>
                      </div>
                    </div>
                    <div className="p-6 space-y-6">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Primary Clinical Diagnosis</label>
                        <p className="text-xl font-bold text-slate-900 leading-tight border-l-4 border-blue-500 pl-4 py-1">{selectedPatient.diagnosis}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-6 pt-2">
                        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group transition-all hover:bg-blue-50/50">
                          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-100 group-hover:scale-105 transition-transform">
                            {selectedPatient.consultant?.charAt(0) || 'D'}
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-0.5">Lead Consultant</label>
                            <p className="font-bold text-slate-800 text-base">{selectedPatient.consultant}</p>
                          </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-center">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Clinical Department</label>
                          <p className="font-black text-slate-800 text-xs uppercase tracking-wider">{selectedPatient.department || 'Internal Medicine'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Monitoring & Observations */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                          <MonitorHeart style={{ fontSize: 18 }} />
                        </div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Triage & Condition</label>
                      </div>
                      <div className="space-y-3.5">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 font-medium">Triage Priority</span>
                          <span className={`font-black px-2 py-0.5 rounded ${selectedPatient.triageLevel === 'Critical' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                            {selectedPatient.triageLevel || 'Routine'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 font-medium">Current Status</span>
                          <span className="text-slate-900 font-bold">{selectedPatient.initialCondition || 'Stable'}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 font-medium">Clinical Referral</span>
                          <span className="text-slate-900 font-bold">{selectedPatient.referredBy || 'Direct Walk-in'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                          <Assignment style={{ fontSize: 18 }} />
                        </div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinical Protocol</label>
                      </div>
                      <div className="space-y-3.5 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Vital Signs Status</span>
                          <span className="text-emerald-600 font-black flex items-center gap-1.5 text-xs uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Normalized
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Nursing Observation</span>
                          <span className="text-blue-600 font-black text-xs uppercase italic">Active Phase</span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-50 mt-1">
                          <span className="text-blue-600 font-bold underline underline-offset-4 cursor-pointer text-[11px] flex items-center gap-2 hover:text-blue-800 transition-colors">
                            <MedicalInformation style={{ fontSize: 16 }} /> Download Clinical Summary
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedPatient.admissionNotes && (
                    <div className="p-5 bg-slate-50 border border-dashed border-slate-200 rounded-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 opacity-10">
                        <Assignment style={{ fontSize: 48 }} />
                      </div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Physician's Admission Notes</label>
                      <p className="text-sm text-slate-700 italic leading-relaxed relative z-10">
                        "{selectedPatient.admissionNotes}"
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'Financial' && (
                <div className="animate-fade-in space-y-8">
                  {/* Financial Stats Grid */}
                  <div className="grid grid-cols-3 gap-6">
                    <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm group hover:border-blue-200 transition-colors">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Daily Ward Rate</p>
                      <p className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">₹{selectedPatient.roomCharges?.toLocaleString()}</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-tight">Based on {selectedPatient.ward}</p>
                    </div>
                    <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm group hover:border-blue-200 transition-colors">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Observation Tenure</p>
                      <p className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">5 Days</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-tight">Since {selectedPatient.admissionDate}</p>
                    </div>
                    <div className="p-6 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-100 flex flex-col justify-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl" />
                      <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest mb-2 relative z-10">Est. Total Outstanding</p>
                      <p className="text-3xl font-black relative z-10">₹{selectedPatient.totalBill?.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Billing Breakdown Detailed Card */}
                  <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-200 shadow-inner">
                    <h5 className="text-[11px] font-black text-slate-500 mb-6 flex items-center gap-3 uppercase tracking-widest">
                      <ReceiptLong className="text-blue-500" style={{ fontSize: 18 }} /> Estimated Billing Breakdown
                    </h5>
                    <div className="space-y-4">
                      {[
                        { label: 'Accommodation & Nursing (Standard Ward)', amount: selectedPatient.roomCharges * 5 },
                        { label: 'Medical Consumables & Diagnostics', amount: 3000 },
                        { label: 'Consultation & Clinical Supervision Fees', amount: 3000 }
                      ].map((charge, idx) => (
                        <div key={idx} className="flex justify-between items-center group">
                          <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                            <span className="text-sm text-slate-600 font-medium">{charge.label}</span>
                          </div>
                          <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">₹{charge.amount.toLocaleString()}</span>
                        </div>
                      ))}

                      <div className="pt-6 mt-6 border-t-2 border-slate-200 border-dashed flex justify-between items-end">
                        <div className="space-y-1">
                          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Final Estimated Outstanding</span>
                          <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-tight bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Verified by Accounts</span>
                        </div>
                        <div className="text-right">
                          <span className="text-3xl font-black text-slate-900 tracking-tighter">₹{selectedPatient.totalBill?.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Financial Note */}
                  <p className="text-[11px] text-slate-400 text-center italic">
                    Note: Financial details are estimated based on current clinical progress and ward rates. Final billing subject to discharge audit.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Medical Records Modal */}
      {selectedPatient && (
        <Modal
          isOpen={showRecordsModal}
          onClose={() => setShowRecordsModal(false)}
          title={
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <MedicalInformation />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 leading-tight">Medical Records Vault</h3>
                <p className="text-sm text-gray-500 font-normal">Patient: {selectedPatient.patientName}</p>
              </div>
            </div>
          }
          size="lg"
          footer={
            <div className="flex justify-end gap-3 w-full border-t pt-4">
              <button
                className="btn bg-gray-100 hover:bg-gray-200 text-gray-700 px-6"
                onClick={() => setShowRecordsModal(false)}
              >
                Close Vault
              </button>
              <button
                className="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center px-6 shadow-md shadow-blue-100"
                onClick={() => window.print()}
              >
                <ReceiptLong className="mr-2" fontSize="small" /> Print Full Report
              </button>
            </div>
          }
        >
          <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Blood Type</p>
                <p className="text-lg font-bold text-gray-900">O+ Positive</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Allergies</p>
                <p className="text-lg font-bold text-red-600">Penicillin</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Last Visit</p>
                <p className="text-lg font-bold text-gray-900">12 Feb 2024</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Risk Factor</p>
                <p className="text-lg font-bold text-amber-600">Moderate</p>
              </div>
            </div>

            {/* Records Sections */}
            <div className="space-y-4">
              <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
                  <Assignment className="text-blue-600" fontSize="small" /> Clinical History & Notes
                </h4>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-50">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-bold text-blue-700 uppercase">Admission Diagnosis</span>
                      <span className="text-[10px] text-gray-500 font-medium">{selectedPatient.admissionDate}</span>
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed">{selectedPatient.diagnosis}</p>
                    <p className="text-xs text-gray-500 mt-2 italic">— Dr. {selectedPatient.consultant}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-bold text-gray-700 uppercase">Follow-up Observation</span>
                      <span className="text-[10px] text-gray-500 font-medium">Today, 10:30 AM</span>
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed">Patient showing signs of improvement. Vital signs are stable. Recommended continued monitoring for next 24 hours.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                  <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
                    <MonitorHeart className="text-rose-600" fontSize="small" /> Vital Sign Trends
                  </h4>
                  <div className="space-y-2">
                    {[
                      { label: 'Pulse Rate', value: '72 bpm', status: 'Normal' },
                      { label: 'SPO2', value: '98%', status: 'Normal' },
                      { label: 'Temperature', value: '98.6°F', status: 'Normal' }
                    ].map((v, i) => (
                      <div key={i} className="flex justify-between items-center text-xs p-2 hover:bg-gray-50 rounded transition-colors">
                        <span className="text-gray-600">{v.label}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-900">{v.value}</span>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">{v.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                  <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
                    <ReceiptLong className="text-indigo-600" fontSize="small" /> Prescribed Medications
                  </h4>
                  <div className="space-y-2">
                    {[
                      { name: 'Amoxicillin 500mg', dose: '1-0-1', timing: 'After Meals' },
                      { name: 'Paracetamol 650mg', dose: '1-1-1', timing: 'As needed' },
                      { name: 'Vitamin C 500mg', dose: '0-1-0', timing: 'After Meals' }
                    ].map((m, i) => (
                      <div key={i} className="text-xs p-2 hover:bg-gray-50 rounded transition-colors border-l-2 border-indigo-200">
                        <p className="font-bold text-gray-900">{m.name}</p>
                        <p className="text-gray-500 mt-0.5">{m.dose} • {m.timing}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      <Modal
        isOpen={showDischargeModal}
        onClose={() => {
          setShowDischargeModal(false);
          setSelectedPatient(null);
          setDischargeForm({
            dischargeDate: new Date().toISOString().split('T')[0],
            dischargeTime: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
            dischargeType: 'Normal',
            dischargeCondition: 'Stable',
            dischargeMode: 'Walk',
            finalDiagnosis: '',
            treatmentSummary: '',
            dischargeMedications: '',
            dosageInstructions: '',
            medicationDuration: '',
            dietInstructions: '',
            followUpDate: '',
            vitalsAtDischarge: {
              bp: '',
              pulse: '',
              temp: '',
              spo2: ''
            },
            billingStatus: 'Pending',
            totalBillAmount: '',
            paidAmount: '',
            pendingAmount: '',
            paymentMode: 'Cash',
            handoverTo: '',
            handoverRelationship: '',
            attendantSignature: false,
            dischargeNotes: ''
          });
        }}
        title="Discharge Initiation"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setShowDischargeModal(false);
                setSelectedPatient(null);
                setDischargeForm({
                  dischargeDate: new Date().toISOString().split('T')[0],
                  dischargeTime: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
                  dischargeType: 'Normal',
                  dischargeCondition: 'Stable',
                  dischargeMode: 'Walk',
                  finalDiagnosis: '',
                  treatmentSummary: '',
                  dischargeMedications: '',
                  dosageInstructions: '',
                  medicationDuration: '',
                  dietInstructions: '',
                  followUpDate: '',
                  vitalsAtDischarge: {
                    bp: '',
                    pulse: '',
                    temp: '',
                    spo2: ''
                  },
                  billingStatus: 'Pending',
                  totalBillAmount: '',
                  paidAmount: '',
                  pendingAmount: '',
                  paymentMode: 'Cash',
                  handoverTo: '',
                  handoverRelationship: '',
                  attendantSignature: false,
                  dischargeNotes: ''
                });
              }}
              className="btn bg-gray-200 hover:bg-gray-300 text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={() => handleConfirmDischarge(selectedPatient.id)}
              className="btn bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center px-8 shadow-lg shadow-purple-100"
            >
              <Logout className="mr-2" fontSize="small" /> Proceed with Discharge
            </button>
          </div>
        }
      >
        {selectedPatient && (
          <div className="space-y-8">
            {/* Header Notification */}
            <div className="flex items-center gap-4 p-4 border border-purple-100 rounded-2xl shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100">
                <Logout className="text-purple-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-800">Initiate Discharge Process</h4>
                <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                  Starting the discharge workflow for <strong className="text-slate-700">{selectedPatient.patientName}</strong>. This includes final medical summary and billing clearance.
                </p>
              </div>
            </div>

            {/* Section: Patient & Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h5 className="text-xs font-bold text-gray-700 tracking-wider">Patient Summary</h5>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-gray-400 font-bold">Patient Name</p>
                    <p className="text-sm font-bold text-slate-800">{selectedPatient.patientName}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-gray-400 font-bold">Patient ID</p>
                    <p className="text-xs font-bold text-gray-700">{selectedPatient.patientId}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-gray-400 font-bold">Age / Gender</p>
                    <p className="text-xs font-bold text-gray-700">{selectedPatient.patientAge}Y / {selectedPatient.gender}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-gray-400 font-bold">Admission ID</p>
                    <p className="text-xs font-bold text-gray-700">{selectedPatient.id}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-gray-400 font-bold">Adm. Date & Time</p>
                    <p className="text-xs font-bold text-gray-700">{selectedPatient.admissionDate} • {selectedPatient.admissionTime}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-gray-400 font-bold">Ward / Bed</p>
                    <p className="text-xs font-bold text-gray-700">{selectedPatient.ward} • {selectedPatient.bed}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-gray-400 font-bold">Consultant</p>
                    <p className="text-xs font-bold text-gray-700">{selectedPatient.consultant}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h5 className="text-xs font-bold text-gray-700 tracking-wider flex justify-between items-center">
                  <span>Financial Summary</span>
                  <span className="text-[10px] font-medium text-emerald-600 italic">Estimated</span>
                </h5>
                <div className="space-y-3 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Room Charges</span>
                    <span className="text-gray-700 font-bold">₹{selectedPatient.roomCharges?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Est. Misc Charges</span>
                    <span className="text-gray-700 font-bold">₹{(selectedPatient.totalBill * 0.15).toFixed(0).toLocaleString()}</span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-800">Final Outstanding</span>
                    <span className="text-lg font-black text-emerald-700">₹{selectedPatient.totalBill?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Discharge Parameters */}
            <div className="space-y-4">
              <h5 className="text-xs font-bold text-gray-700 tracking-wider">Discharge Documentation</h5>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label font-bold text-gray-700">Discharge Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={dischargeForm.dischargeDate}
                    onChange={(e) => setDischargeForm({ ...dischargeForm, dischargeDate: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label font-bold text-gray-700">Discharge Time <span className="text-red-500">*</span></label>
                  <input
                    type="time"
                    value={dischargeForm.dischargeTime}
                    onChange={(e) => setDischargeForm({ ...dischargeForm, dischargeTime: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label font-bold text-gray-700">Discharge Type <span className="text-red-500">*</span></label>
                  <select
                    value={dischargeForm.dischargeType}
                    onChange={(e) => setDischargeForm({ ...dischargeForm, dischargeType: e.target.value })}
                    className="form-input"
                    required
                  >
                    <option value="Normal">Normal Discharge</option>
                    <option value="LAMA">LAMA (Against Medical Advice)</option>
                    <option value="Transfer">Medical Transfer</option>
                    <option value="Death">Death (Expired)</option>
                    <option value="Absconded">Absconded</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label font-bold text-gray-700">Condition at Discharge <span className="text-red-500">*</span></label>
                  <select
                    value={dischargeForm.dischargeCondition}
                    onChange={(e) => setDischargeForm({ ...dischargeForm, dischargeCondition: e.target.value })}
                    className="form-input"
                    required
                  >
                    <option value="Recovered">Recovered</option>
                    <option value="Improved">Improved</option>
                    <option value="Stable">Stable</option>
                    <option value="Critical">Critical</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label font-bold text-gray-700">Discharge Mode <span className="text-red-500">*</span></label>
                  <select
                    value={dischargeForm.dischargeMode}
                    onChange={(e) => setDischargeForm({ ...dischargeForm, dischargeMode: e.target.value })}
                    className="form-input"
                    required
                  >
                    <option value="Walk">Walk</option>
                    <option value="Wheelchair">Wheelchair</option>
                    <option value="Stretcher">Stretcher</option>
                    <option value="Ambulance">Ambulance</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label font-bold text-gray-700">Final Medical Diagnosis <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={dischargeForm.finalDiagnosis}
                    onChange={(e) => setDischargeForm({ ...dischargeForm, finalDiagnosis: e.target.value })}
                    className="form-input"
                    placeholder="E.g., Resolved Acute Bronchitis"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label font-bold text-gray-700">Clinical Course & Summary <span className="text-red-500">*</span></label>
                  <textarea
                    value={dischargeForm.treatmentSummary}
                    onChange={(e) => setDischargeForm({ ...dischargeForm, treatmentSummary: e.target.value })}
                    className="form-input"
                    rows="4"
                    placeholder="Brief overview of treatment and hospital course..."
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label font-bold text-gray-700">Diet Instructions</label>
                  <textarea
                    value={dischargeForm.dietInstructions}
                    onChange={(e) => setDischargeForm({ ...dischargeForm, dietInstructions: e.target.value })}
                    className="form-input"
                    rows="4"
                    placeholder="E.g., Low salt diet, Soft food only..."
                  />
                </div>
              </div>
            </div>

            {/* Section: Medication & Prescription */}
            <div className="space-y-4">
              <h5 className="text-xs font-bold text-gray-700 tracking-wider">Medication & Prescription</h5>

              <div className="form-group">
                <label className="form-label font-bold text-gray-700">Discharge Medications <span className="text-red-500">*</span></label>
                <textarea
                  value={dischargeForm.dischargeMedications}
                  onChange={(e) => setDischargeForm({ ...dischargeForm, dischargeMedications: e.target.value })}
                  className="form-input"
                  rows="3"
                  placeholder="List medications to be continued at home..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label font-bold text-gray-700">Dosage Instructions</label>
                  <input
                    type="text"
                    value={dischargeForm.dosageInstructions}
                    onChange={(e) => setDischargeForm({ ...dischargeForm, dosageInstructions: e.target.value })}
                    className="form-input"
                    placeholder="E.g., 1-0-1 after food"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label font-bold text-gray-700">Duration of Medication</label>
                  <input
                    type="text"
                    value={dischargeForm.medicationDuration}
                    onChange={(e) => setDischargeForm({ ...dischargeForm, medicationDuration: e.target.value })}
                    className="form-input"
                    placeholder="E.g., 5 days, 2 weeks"
                  />
                </div>
              </div>
            </div>

            {/* Section: Billing & Financial Clearance */}
            <div className="space-y-4">
              <h5 className="text-xs font-bold text-gray-700 tracking-wider">Billing & Financial Clearance</h5>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="form-group">
                  <label className="form-label font-bold text-gray-700">Total Bill Amount <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                    <input
                      type="number"
                      value={dischargeForm.totalBillAmount}
                      onChange={(e) => {
                        const total = e.target.value;
                        const pending = total - (dischargeForm.paidAmount || 0);
                        setDischargeForm({ ...dischargeForm, totalBillAmount: total, pendingAmount: pending });
                      }}
                      className="form-input pl-7"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label font-bold text-gray-700">Paid Amount <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                    <input
                      type="number"
                      value={dischargeForm.paidAmount}
                      onChange={(e) => {
                        const paid = e.target.value;
                        const pending = (dischargeForm.totalBillAmount || 0) - paid;
                        setDischargeForm({ ...dischargeForm, paidAmount: paid, pendingAmount: pending });
                      }}
                      className="form-input pl-7"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label font-bold text-gray-700">Pending Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                    <input
                      type="number"
                      value={dischargeForm.pendingAmount}
                      className="form-input pl-7 bg-gray-50 font-bold text-red-600"
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label font-bold text-gray-700">Payment Mode</label>
                  <select
                    value={dischargeForm.paymentMode}
                    onChange={(e) => setDischargeForm({ ...dischargeForm, paymentMode: e.target.value })}
                    className="form-input"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="UPI">UPI</option>
                    <option value="Insurance">Insurance</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label font-bold text-gray-700">Billing Status <span className="text-red-500">*</span></label>
                  <select
                    value={dischargeForm.billingStatus}
                    onChange={(e) => setDischargeForm({ ...dischargeForm, billingStatus: e.target.value })}
                    className="form-input"
                    required
                  >
                    <option value="Cleared">Cleared</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Logistics Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label font-bold text-gray-700">Follow-up Date</label>
                <input
                  type="date"
                  value={dischargeForm.followUpDate}
                  onChange={(e) => setDischargeForm({ ...dischargeForm, followUpDate: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            {/* Section: Handover & Responsibility */}
            <div className="space-y-4">
              <h5 className="text-xs font-bold text-gray-700 tracking-wider">Handover & Responsibility</h5>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label font-bold text-gray-700">Patient Handover To <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={dischargeForm.handoverTo}
                    onChange={(e) => setDischargeForm({ ...dischargeForm, handoverTo: e.target.value })}
                    className="form-input"
                    placeholder="Relative/Guardian name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label font-bold text-gray-700">Relationship <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={dischargeForm.handoverRelationship}
                    onChange={(e) => setDischargeForm({ ...dischargeForm, handoverRelationship: e.target.value })}
                    className="form-input"
                    placeholder="e.g., Spouse, Parent, Sibling"
                    required
                  />
                </div>
              </div>

              <div className="form-group flex flex-col justify-end">
                <label className="flex items-center gap-2 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={dischargeForm.attendantSignature}
                    onChange={(e) => setDischargeForm({ ...dischargeForm, attendantSignature: e.target.checked })}
                    className="w-4 h-4 rounded text-purple-600 border-gray-300 focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Attendant Signature Verified</span>
                  <span className="text-[10px] text-gray-400 font-normal ml-auto">(Optional)</span>
                </label>
              </div>
            </div>

            {/* Exit Vitals Section */}
            <div className="space-y-4">
              <h5 className="text-xs font-bold text-gray-700 tracking-wider">Exit Vitals</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="form-group">
                  <label className="text-[10px] font-bold text-gray-500">BP (mmHg)</label>
                  <input
                    type="text"
                    value={dischargeForm.vitalsAtDischarge.bp}
                    onChange={(e) => setDischargeForm({
                      ...dischargeForm,
                      vitalsAtDischarge: { ...dischargeForm.vitalsAtDischarge, bp: e.target.value }
                    })}
                    className="form-input"
                    placeholder="120/80"
                  />
                </div>
                <div className="form-group">
                  <label className="text-[10px] font-bold text-gray-500">Pulse (bpm)</label>
                  <input
                    type="text"
                    value={dischargeForm.vitalsAtDischarge.pulse}
                    onChange={(e) => setDischargeForm({
                      ...dischargeForm,
                      vitalsAtDischarge: { ...dischargeForm.vitalsAtDischarge, pulse: e.target.value }
                    })}
                    className="form-input"
                    placeholder="72"
                  />
                </div>
                <div className="form-group">
                  <label className="text-[10px] font-bold text-gray-500">Temp (°F)</label>
                  <input
                    type="text"
                    value={dischargeForm.vitalsAtDischarge.temp}
                    onChange={(e) => setDischargeForm({
                      ...dischargeForm,
                      vitalsAtDischarge: { ...dischargeForm.vitalsAtDischarge, temp: e.target.value }
                    })}
                    className="form-input"
                    placeholder="98.6"
                  />
                </div>
                <div className="form-group">
                  <label className="text-[10px] font-bold text-gray-500">SPO2 (%)</label>
                  <input
                    type="text"
                    value={dischargeForm.vitalsAtDischarge.spo2}
                    onChange={(e) => setDischargeForm({
                      ...dischargeForm,
                      vitalsAtDischarge: { ...dischargeForm.vitalsAtDischarge, spo2: e.target.value }
                    })}
                    className="form-input"
                    placeholder="98%"
                  />
                </div>
              </div>
            </div>

            {/* Section: Checklist */}
            <div className="p-5 border border-dashed border-gray-200 rounded-2xl bg-gray-50/30">
              <h5 className="text-[10px] font-bold text-gray-400 tracking-widest mb-4 flex items-center gap-2">
                <Assignment style={{ fontSize: 14 }} /> Discharge Clearance Checklist
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  'Final consultation summary signed',
                  'Nursing & Ward clearance completed',
                  'Pharmacy medication return processed',
                  'All lab/radiology reports handed over',
                  'Patient belongings verified & returned',
                  'Billing clearance & receipt generated'
                ].map((item, index) => (
                  <label key={index} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-white cursor-pointer transition-all hover:shadow-sm">
                    <input type="checkbox" className="w-4 h-4 rounded text-purple-600 border-gray-300 focus:ring-purple-500" />
                    <span className="text-[11px] font-medium text-gray-600">{item}</span>
                  </label>
                ))}
              </div>
            </div>

          </div>
        )}
      </Modal>

      <Modal
        isOpen={showBillingModal}
        onClose={() => {
          setShowBillingModal(false);
          setSelectedPatient(null);
        }}
        title={`Update Bill: ${selectedPatient?.patientName || ''}`}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setShowBillingModal(false);
                setSelectedPatient(null);
                setPendingCharges([]);
              }}
              className="btn bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={() => handleUpdateBill(selectedPatient.id)}
              className="btn bg-yellow-600 hover:bg-yellow-700 text-white flex items-center justify-center px-8 shadow-lg shadow-yellow-100"
            >
              <Payments className="mr-2" fontSize="small" /> Save Billing Changes
            </button>
          </div>
        }
      >
        {selectedPatient && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Current Outstanding</p>
                <p className="text-2xl font-bold text-slate-900">₹{selectedPatient.totalBill}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Patient ID</p>
                <p className="font-medium text-slate-700">{selectedPatient.patientId}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Add New Charges</h5>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Charge Category</label>
                  <select
                    className="form-input"
                    value={billingForm.category}
                    onChange={(e) => setBillingForm({ ...billingForm, category: e.target.value })}
                  >
                    <option>Pharmacy / Medications</option>
                    <option>Laboratory / Investigations</option>
                    <option>Radiology / Imaging</option>
                    <option>Nursing Charges</option>
                    <option>Consumables</option>
                    <option>Miscellaneous</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0.00"
                    value={billingForm.amount}
                    onChange={(e) => setBillingForm({ ...billingForm, amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description / Remarks</label>
                <textarea
                  className="form-input"
                  rows="2"
                  placeholder="Itemized details..."
                  value={billingForm.description}
                  onChange={(e) => setBillingForm({ ...billingForm, description: e.target.value })}
                ></textarea>
              </div>

              <button
                onClick={addCharge}
                className="w-full btn border-dashed border-2 border-slate-300 text-slate-500 hover:bg-slate-50 hover:border-slate-400 py-3 flex items-center justify-center gap-2"
              >
                <Close style={{ transform: 'rotate(45deg)', fontSize: 18 }} /> Add to Pending Items
              </button>
            </div>

            {pendingCharges.length > 0 && (
              <div className="bg-yellow-50/50 p-4 rounded-xl border border-yellow-100">
                <h5 className="text-xs font-bold text-yellow-700 uppercase tracking-wider mb-3">Pending Items to Add</h5>
                <div className="space-y-2">
                  {pendingCharges.map((item) => (
                    <div key={item.id} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-yellow-100 shadow-sm text-sm">
                      <div>
                        <p className="font-semibold text-gray-900">{item.category}</p>
                        <p className="text-[10px] text-gray-500">{item.description || 'No description'}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900">₹{item.amount}</span>
                        <button
                          onClick={() => removePendingCharge(item.id)}
                          className="text-red-400 hover:text-red-600 p-1"
                        >
                          <Close style={{ fontSize: 14 }} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-yellow-100 flex justify-between items-center text-sm font-bold text-yellow-800">
                    <span>Total Pending</span>
                    <span>₹{pendingCharges.reduce((sum, c) => sum + parseFloat(c.amount), 0)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <h5 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Recent Transactions</h5>
              <div className="space-y-2">
                {[
                  { date: '2023-10-15', desc: 'Pharmacy - Antibiotics', amt: 1250 },
                  { date: '2023-10-14', desc: 'Lab - Blood Test (CBC)', amt: 850 }
                ].map((t, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-slate-50/50 border border-slate-100 rounded-lg text-sm grayscale opacity-70">
                    <div>
                      <p className="font-medium text-slate-700">{t.desc}</p>
                      <p className="text-[10px] text-gray-500 uppercase">{t.date}</p>
                    </div>
                    <span className="font-bold text-slate-600">₹{t.amt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default IPDManagement;