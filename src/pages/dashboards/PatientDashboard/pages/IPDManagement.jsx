import React, { useState, useEffect, useRef } from 'react';
import { Hotel, Bed, MonitorHeart, MeetingRoom, Payments, Visibility, SwapHoriz, Logout, ReceiptLong, MedicalInformation, Assignment, History, KeyboardArrowDown, Search, Close, Add, Edit, Delete, FilterList, Layers, AcUnit, Shield, LocationOn, CheckCircle, LocalHospital } from '@mui/icons-material';
import LoadingSpinner from '../../../../components/common/LoadingSpinner/LoadingSpinner';
import DataTable from '../../../../components/ui/Tables/DataTable';
import Modal from '../../../../components/common/Modal/Modal';
import { patientApiFetch as apiFetch } from '../../../../services/patientApi';
import { toast } from 'react-toastify';
import { IPD_DASHBOARD, IPD_PATIENTS, HOSPITAL_WARDS, HOSPITAL_BEDS, IPD_ADMISSIONS, IPD_AVAILABLE_PATIENTS, IPD_DOCTOR_ROUNDS, NURSE_BEDS } from '../../../../config/api';

const availableNurses = [
  { id: 'NUR-402', name: 'Nurse Sarah Jenkins', specialty: 'Intensive Care' },
  { id: 'NUR-109', name: 'Nurse Michael Chang', specialty: 'Pediatrics' },
  { id: 'NUR-255', name: 'Nurse Emily Rodriguez', specialty: 'General Ward' },
  { id: 'NUR-102', name: 'Nurse David Kim', specialty: 'Emergency Care' },
  { id: 'NUR-304', name: 'Nurse Priya Patel', specialty: 'Cardiology' },
  { id: 'NUR-512', name: 'Nurse Jessica Taylor', specialty: 'Post-Op' }
];

const IPDManagement = () => {
  const [loading, setLoading] = useState(true);
  const [ipdPatients, setIpdPatients] = useState([]);
  const [ipdDashboardStats, setIpdDashboardStats] = useState({ total_admissions: 0, active_patients: 0, available_beds: 0, discharged_patients: 0 });
  const [wards, setWards] = useState([]);

  // Room state
  const [rooms, setRooms] = useState([]);

  const [showAdmissionForm, setShowAdmissionForm] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showRecordsModal, setShowRecordsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const [mainTab, setMainTab] = useState('Admissions');

  // Ward search and filters
  const [wardSearchQuery, setWardSearchQuery] = useState('');
  const [wardTypeFilter, setWardTypeFilter] = useState('');
  const [wardStatusFilter, setWardStatusFilter] = useState('');

  // Room search and filters
  const [roomSearchQuery, setRoomSearchQuery] = useState('');
  const [roomTypeFilter, setRoomTypeFilter] = useState('');
  const [roomStatusFilter, setRoomStatusFilter] = useState('');

  // Ward & Room Modal Forms
  const [showAddWardModal, setShowAddWardModal] = useState(false);
  const [showEditWardModal, setShowEditWardModal] = useState(false);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [showEditRoomModal, setShowEditRoomModal] = useState(false);

  const [selectedWard, setSelectedWard] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [wardForm, setWardForm] = useState({ ward_id: '', ward_name: '', ward_type: 'General', floor_number: '', department_id: 'Cardiology', total_rooms: 0, total_beds: 0, occupied_beds: 0, available_beds: 0, ward_status: 'Active', rate: 2000 });
  const [roomForm, setRoomForm] = useState({ room_id: '', room_number: '', ward_id: '', room_type: 'General', floor_number: '', room_status: 'Available', daily_charge: 2000 });

  const [beds, setBeds] = useState([]);

  // Bed search and filters
  const [bedSearchQuery, setBedSearchQuery] = useState('');
  const [bedStatusFilter, setBedStatusFilter] = useState('');
  const [bedTypeFilter, setBedTypeFilter] = useState('');
  const [bedOxygenFilter, setBedOxygenFilter] = useState('');
  const [bedVentilatorFilter, setBedVentilatorFilter] = useState('');

  // Bed Modals
  const [showAddBedModal, setShowAddBedModal] = useState(false);
  const [showEditBedModal, setShowEditBedModal] = useState(false);
  const [selectedBed, setSelectedBed] = useState(null);

  const [bedForm, setBedForm] = useState({ bed_id: '', bed_number: '', room_id: '', ward_id: '', bed_type: 'General', bed_status: 'Available', patient_id: '', assigned_date: '', assigned_time: '', vacant_date: '', is_oxygen_available: true, ventilator_available: false, bed_charges: 0, cleaning_required: false, bed_category: 'Standard', bed_priority: 'Normal', bed_cleaning_status: 'Clean', last_cleaned_at: '', bed_maintenance_status: 'Operational', monitor_attached: false, ecg_available: false, suction_available: false, oxygen_flow_meter: false, nurse_call_system: true, smart_bed_enabled: false });

  // Nurse Assignments state with required fields:
  const [nurseAssignments, setNurseAssignments] = useState([]);

  // Doctor Rounds & Inpatient Treatment Plan states
  const [doctorRounds, setDoctorRounds] = useState([]);

  const [treatmentPlans, setTreatmentPlans] = useState([]);

  const [showAddRoundModal, setShowAddRoundModal] = useState(false);
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [roundsSearch, setRoundsSearch] = useState('');
  const [plansSearch, setPlansSearch] = useState('');

  const [roundForm, setRoundForm] = useState({ doctor_name: '', specialty: 'General Medicine', ward_name: '', round_date: new Date().toISOString().split('T')[0], round_time: '', patients_visited: '', status: 'Scheduled', clinical_notes: '' });

  const [planForm, setPlanForm] = useState({ patient_id: '', patient_name: '', diagnosis: '', doctor_name: '', treatment_details: '', cycles_prescribed: 'Standard Day Cycle', drip_flow_rate: '100 ml/hr', start_date: new Date().toISOString().split('T')[0], duration: '', status: 'Active' });

  // Nurse Assignment search and filters
  const [nurseSearchQuery, setNurseSearchQuery] = useState('');
  const [nurseShiftFilter, setNurseShiftFilter] = useState('');
  const [nurseWardFilter, setNurseWardFilter] = useState('');

  // Nurse Assignment Modals
  const [showAddNurseModal, setShowAddNurseModal] = useState(false);
  const [showEditNurseModal, setShowEditNurseModal] = useState(false);
  const [selectedNurseAssignment, setSelectedNurseAssignment] = useState(null);
  const [showViewNurseModal, setShowViewNurseModal] = useState(false);

  const [nurseForm, setNurseForm] = useState({ nurse_assignment_id: '', nurse_id: '', patient_id: '', ward_id: '', shift_type: 'Morning', assigned_date: '', vitals_monitoring_frequency: 'Every 4 Hours', special_instructions: '', nursing_notes: '', bp: '', pulse: '', spo2: '', temp: '', treatment_cycle: 'Standard Day Cycle', drip_flow_rate: '100 ml/hr' });

  // Admissions search and filters
  const [admissionSearchQuery, setAdmissionSearchQuery] = useState('');
  const [admissionStatusFilter, setAdmissionStatusFilter] = useState('');
  const [admissionWardFilter, setAdmissionWardFilter] = useState('');

  const [patientNameSearch, setPatientNameSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [showPlanPatientDropdown, setShowPlanPatientDropdown] = useState(false);
  const [showPlanPatientIdDropdown, setShowPlanPatientIdDropdown] = useState(false);
  const [showPlanDoctorDropdown, setShowPlanDoctorDropdown] = useState(false);
  const patientNameRef = useRef(null);

  // Doctor and Department search states
  const [doctorSearch, setDoctorSearch] = useState('');
  const [deptSearch, setDeptSearch] = useState('');
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);

  // Billing states
  const [billingForm, setBillingForm] = useState({ category: 'Pharmacy / Medications', amount: '', description: '' });
  const [pendingCharges, setPendingCharges] = useState([]);

  const [allPatients, setAllPatients] = useState([]);

  const [doctors, setDoctors] = useState([]);

  const [departments, setDepartments] = useState([]);


  const filteredPatients = allPatients.filter(p =>
    p.name.toLowerCase().includes(patientNameSearch.toLowerCase()) ||
    p.id.toLowerCase().includes(patientNameSearch.toLowerCase())
  );

  const filteredAdmissions = ipdPatients.filter(patient => {
    const matchesSearch =
      (patient.patientName || '').toLowerCase().includes(admissionSearchQuery.toLowerCase()) ||
      (patient.patientId || '').toLowerCase().includes(admissionSearchQuery.toLowerCase()) ||
      (patient.id || '').toLowerCase().includes(admissionSearchQuery.toLowerCase()) ||
      (patient.diagnosis || '').toLowerCase().includes(admissionSearchQuery.toLowerCase()) ||
      (patient.consultant || '').toLowerCase().includes(admissionSearchQuery.toLowerCase());

    const matchesStatus = admissionStatusFilter ? patient.status === admissionStatusFilter : true;
    const matchesWard = admissionWardFilter ? patient.ward === admissionWardFilter : true;

    return matchesSearch && matchesStatus && matchesWard;
  });

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

  const [admissionForm, setAdmissionForm] = useState({ patientId: '', patientAge: '', gender: 'Male', bloodGroup: '', admissionDateTime: new Date().toISOString().slice(0, 16), caseType: 'Medical', triageLevel: 'Routine', diagnosis: '', ward: '', roomId: '', consultant: '', department: '', emergencyContact: '', estimatedStay: '', admissionType: 'Emergency', admissionNotes: '' });

  const [dischargeForm, setDischargeForm] = useState({ dischargeDate: new Date().toISOString().split('T')[0], dischargeTime: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }), dischargeType: 'Normal', dischargeCondition: 'Stable', dischargeMode: 'Walk', finalDiagnosis: '', treatmentSummary: '', dischargeMedications: '', dosageInstructions: '', medicationDuration: '', dietInstructions: '', followUpDate: '', vitalsAtDischarge: { bp: '', pulse: '', temp: '', spo2: '' }, totalBillAmount: '', paidAmount: '', pendingAmount: '', paymentMode: 'Cash', billingStatus: 'Pending', handoverTo: '', handoverRelationship: '', attendantSignature: false, dischargeNotes: '' });

  const [transferForm, setTransferForm] = useState({ newWard: '', transferDate: new Date().toISOString().split('T')[0], priority: 'Routine', reason: '' });


  useEffect(() => {
    loadIPDData();
  }, []);

  const loadIPDData = async () => {
    setLoading(true);
    try {
      const responses = await Promise.all([
        apiFetch(IPD_PATIENTS),
        apiFetch(IPD_DASHBOARD),
        apiFetch(IPD_AVAILABLE_PATIENTS)
      ]);
      
      const patientsData = await responses[0].json().catch(() => ({}));
      const dashboardData = await responses[1].json().catch(() => ({}));
      const availablePatientsData = await responses[2].json().catch(() => ({}));

      const extractArray = (data) => Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : Array.isArray(data?.data?.items) ? data.data.items : [];

      if (responses[0].ok) setIpdPatients(extractArray(patientsData));
      if (responses[1].ok) setIpdDashboardStats(dashboardData?.data || { total_admissions: 0, active_patients: 0, available_beds: 0, discharged_patients: 0 });
      if (responses[2].ok) setAllPatients(extractArray(availablePatientsData));
    } catch (error) {
      console.error('Error loading IPD data:', error);
      toast.error('Failed to load IPD data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddWard = async () => {
    if (!wardForm.ward_name || !wardForm.floor_number) {
      alert('Please fill ward name and floor number');
      return;
    }

    try {
      const result = await apiFetch(HOSPITAL_WARDS, {
        method: 'POST',
        body: JSON.stringify(wardForm)
      });
      if (!result.ok) throw new Error('Failed to add ward');
      toast.success('Ward added successfully');
      loadIPDData(); // refresh data
      setShowAddWardModal(false);
      setWardForm({
        ward_id: '',
        ward_name: '',
        ward_type: 'General',
        floor_number: '',
        department_id: 'Cardiology',
        total_rooms: 0,
        total_beds: 0,
        ward_status: 'Active',
        rate: ''
      });
    } catch (error) {
      console.error('Error adding ward:', error);
      toast.error('Failed to add ward');
    }
  };


  const handleEditWard = async () => {
    if (!wardForm.ward_name || !wardForm.floor_number) {
      alert('Please fill ward name and floor number');
      return;
    }

    try {
      const result = await apiFetch(HOSPITAL_WARD_DETAILS(selectedWard.ward_id), {
        method: 'PUT',
        body: JSON.stringify(wardForm)
      });
      if (!result.ok) throw new Error('Failed to update ward');
      toast.success('Ward updated successfully');
      loadIPDData(); // refresh data
      setShowEditWardModal(false);
      setWardForm({
        ward_id: '',
        ward_name: '',
        ward_type: 'General',
        floor_number: '',
        department_id: 'Cardiology',
        total_rooms: 0,
        total_beds: 0,
        ward_status: 'Active',
        rate: ''
      });
      setSelectedWard(null);
    } catch (error) {
      console.error('Error updating ward:', error);
      toast.error('Failed to update ward');
    }
  };

  const handleDeleteWard = (wardId) => {
    if (confirm('Are you sure you want to delete this ward?')) {
      setWards(wards.filter(w => w.ward_id !== wardId));
      alert('Ward deleted successfully!');
    }
  };

  // ROOM MANAGEMENT ACTIONS
  const handleAddRoom = () => {
    if (!roomForm.room_number || !roomForm.ward_id) {
      alert('Please fill room number and select a ward');
      return;
    }

    const newRoomId = `RM-${roomForm.room_number}`;
    const newRoom = {
      ...roomForm,
      room_id: newRoomId,
      daily_charge: parseFloat(roomForm.daily_charge) || 2000
    };

    setRooms([...rooms, newRoom]);
    setShowAddRoomModal(false);
    setRoomForm({
      room_id: '',
      room_number: '',
      ward_id: '',
      room_type: 'General',
      floor_number: '',
      room_status: 'Available',
      daily_charge: 2000
    });
    alert('Room added successfully!');
  };

  const handleEditRoom = () => {
    if (!roomForm.room_number || !roomForm.ward_id) {
      alert('Please fill room number and select a ward');
      return;
    }

    setRooms(rooms.map(r => {
      if (r.room_id === selectedRoom.room_id) {
        return {
          ...r,
          ...roomForm,
          daily_charge: parseFloat(roomForm.daily_charge) || 2000
        };
      }
      return r;
    }));

    setShowEditRoomModal(false);
    setSelectedRoom(null);
    alert('Room details updated successfully!');
  };

  const handleDeleteRoom = (roomId) => {
    if (confirm('Are you sure you want to delete this room?')) {
      setRooms(rooms.filter(r => r.room_id !== roomId));
      alert('Room deleted successfully!');
    }
  };

  // BED MANAGEMENT ACTIONS
  const handleAddBed = async () => {
    if (!bedForm.bed_number || !bedForm.room_id || !bedForm.ward_id) {
      alert('Please fill bed number, select a room and select a ward');
      return;
    }

    try {
      const result = await apiFetch(HOSPITAL_BEDS, {
        method: 'POST',
        body: JSON.stringify(bedForm)
      });
      if (!result.ok) throw new Error('Failed to add bed');
      toast.success('Bed added successfully!');
      loadIPDData();
      setShowAddBedModal(false);
      setBedForm({
        bed_id: '',
        bed_number: '',
        room_id: '',
        ward_id: '',
        bed_type: 'General',
        bed_status: 'Available',
        patient_id: '',
        assigned_date: '',
        assigned_time: '',
        vacant_date: '',
      is_oxygen_available: true,
      ventilator_available: false,
      bed_charges: 0,
      cleaning_required: false,
      bed_category: 'Standard',
      bed_priority: 'Normal',
      bed_cleaning_status: 'Clean',
      last_cleaned_at: '',
      bed_maintenance_status: 'Operational',
      monitor_attached: false,
      ecg_available: false,
      suction_available: false,
      oxygen_flow_meter: false,
      nurse_call_system: true,
      smart_bed_enabled: false
    });
    } catch (error) {
      console.error('Error adding bed:', error);
      toast.error('Failed to add bed');
    }
  };

  const handleEditBed = () => {
    if (!bedForm.bed_number || !bedForm.room_id || !bedForm.ward_id) {
      alert('Please fill bed number, select a room and select a ward');
      return;
    }

    setBeds(beds.map(b => {
      if (b.bed_id === selectedBed.bed_id) {
        return {
          ...b,
          ...bedForm,
          bed_charges: parseFloat(bedForm.bed_charges) || 0
        };
      }
      return b;
    }));

    setShowEditBedModal(false);
    setSelectedBed(null);
    alert('Bed details updated successfully!');
  };

  const handleDeleteBed = (bedId) => {
    if (confirm('Are you sure you want to delete this bed?')) {
      setBeds(beds.filter(b => b.bed_id !== bedId));
      alert('Bed deleted successfully!');
    }
  };

  // NURSE ASSIGNMENT ACTIONS
  const handleAddNurseAssignment = () => {
    if (!nurseForm.nurse_id || !nurseForm.patient_id || !nurseForm.ward_id) {
      alert('Please fill nurse ID, select a patient, and select a ward');
      return;
    }

    const newAssignmentId = `NAS-${Date.now().toString().slice(-4)}`;
    const newAssignment = {
      ...nurseForm,
      nurse_assignment_id: newAssignmentId
    };

    setNurseAssignments([...nurseAssignments, newAssignment]);
    setShowAddNurseModal(false);
    setNurseForm({
      nurse_assignment_id: '',
      nurse_id: '',
      patient_id: '',
      ward_id: '',
      shift_type: 'Morning',
      assigned_date: new Date().toISOString().split('T')[0],
      vitals_monitoring_frequency: 'Every 4 Hours',
      special_instructions: '',
      nursing_notes: '',
      bp: '',
      pulse: '',
      spo2: '',
      temp: '',
      treatment_cycle: 'Standard Day Cycle',
      drip_flow_rate: '100 ml/hr'
    });
    alert('Nurse assignment saved successfully!');
  };

  const handleEditNurseAssignment = () => {
    if (!nurseForm.nurse_id || !nurseForm.patient_id || !nurseForm.ward_id) {
      alert('Please fill nurse ID, select a patient, and select a ward');
      return;
    }
    setNurseAssignments(nurseAssignments.map(nas => {
      if (nas.nurse_assignment_id === selectedNurseAssignment.nurse_assignment_id) {
        return {
          ...nas,
          ...nurseForm
        };
      }
      return nas;
    }));

    setShowEditNurseModal(false);
    setSelectedNurseAssignment(null);
    alert('Nurse assignment details updated successfully!');
  };

  const handleDeleteNurseAssignment = (assignmentId) => {
    if (confirm('Are you sure you want to delete this nurse assignment?')) {
      setNurseAssignments(nurseAssignments.filter(nas => nas.nurse_assignment_id !== assignmentId));
      alert('Nurse assignment deleted successfully!');
    }
  };

  const handleAddRound = async () => {
    if (!roundForm.doctor_name || !roundForm.ward_name) {
      toast.error('Please fill in both Doctor Name and Ward Location.');
      return;
    }
    try {
      const response = await apiFetch(IPD_DOCTOR_ROUNDS, {
        method: 'POST',
        body: JSON.stringify(roundForm)
      });
      if (!response.ok) throw new Error('Failed to schedule doctor round');
      
      const newRound = {
        round_id: `RND-${Math.floor(Math.random() * 900) + 100}`, // Fallback if API doesn't return ID
        ...roundForm
      };
      setDoctorRounds([newRound, ...doctorRounds]);
      setShowAddRoundModal(false);
      setRoundForm({
        doctor_name: '',
        specialty: 'General Medicine',
        ward_name: '',
        round_date: new Date().toISOString().split('T')[0],
        round_time: '',
        patients_visited: '',
        status: 'Scheduled',
        clinical_notes: ''
      });
      toast.success('Doctor round scheduled successfully!');
    } catch (error) {
      console.error('Error scheduling round:', error);
      toast.error('Failed to schedule doctor round');
    }
  };

  const handleDeleteRound = (roundId) => {
    if (confirm('Are you sure you want to remove this doctor round schedule?')) {
      setDoctorRounds(doctorRounds.filter(r => r.round_id !== roundId));
      alert('Doctor round removed successfully!');
    }
  };

  const handleAddPlan = () => {
    if (!planForm.patient_name || !planForm.diagnosis || !planForm.doctor_name) {
      alert('Please fill in the Patient Name, Diagnosis, and Prescribing Doctor.');
      return;
    }
    const newPlan = {
      plan_id: `TRT-${Math.floor(Math.random() * 900) + 100}`,
      patient_id: planForm.patient_id || `PAT-${Math.floor(Math.random() * 900) + 100}`,
      ...planForm
    };
    setTreatmentPlans([newPlan, ...treatmentPlans]);
    setShowAddPlanModal(false);
    setPlanForm({
      patient_id: '',
      patient_name: '',
      diagnosis: '',
      doctor_name: '',
      treatment_details: '',
      cycles_prescribed: 'Standard Day Cycle',
      drip_flow_rate: '100 ml/hr',
      start_date: new Date().toISOString().split('T')[0],
      duration: '',
      status: 'Active'
    });
    alert('Patient treatment plan recorded successfully!');
  };

  const handleDeletePlan = (planId) => {
    if (confirm('Are you sure you want to delete this patient treatment plan?')) {
      setTreatmentPlans(treatmentPlans.filter(p => p.plan_id !== planId));
      alert('Treatment plan deleted successfully!');
    }
  };

  const toggleResponsibility = (nasId, field) => {
    setNurseAssignments(prev => prev.map(nas => {
      if (nas.nurse_assignment_id === nasId) {
        return { ...nas, [field]: !nas[field] };
      }
      return nas;
    }));
  };

  const handleAdmission = async () => {
    if (!admissionForm.patientId || !admissionForm.diagnosis) {
      toast.error('Please fill patient and diagnosis required fields');
      return;
    }

    const [datePart, timePart] = (admissionForm.admissionDateTime || '').split('T');

    // Bed and Room assignment bypassed (No API support)
    const bedNumber = 'Auto-Assigned';

    const initialConditionVal = admissionForm.triageLevel === 'Critical' ? 'Critical' : admissionForm.triageLevel === 'Urgent' ? 'Fair' : 'Stable';

    const newAdmission = {
      patientId: admissionForm.patientId,
      patientName: patientNameSearch,
      patientAge: admissionForm.patientAge,
      gender: admissionForm.gender,
      bloodGroup: admissionForm.bloodGroup,
      admissionDate: datePart || new Date().toISOString().split('T')[0],
      admissionTime: timePart || new Date().toTimeString().slice(0, 5),
      admissionSource: 'OPD',
      admissionType: admissionForm.admissionType,
      caseType: admissionForm.caseType,
      triageLevel: admissionForm.triageLevel,
      initialCondition: initialConditionVal,
      ward: admissionForm.ward,
      bed: bedNumber,
      diagnosis: admissionForm.diagnosis,
      consultant: admissionForm.consultant,
      department: admissionForm.department,
      referredBy: 'Self',
      emergencyContact: admissionForm.emergencyContact,
      estimatedStay: admissionForm.estimatedStay,
      admissionNotes: admissionForm.admissionNotes,
      status: 'Admitted',
      estimatedDischarge: new Date(Date.now() + parseInt(admissionForm.estimatedStay || 3) * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0],
      roomCharges: wards.find(w => w.name === admissionForm.ward)?.rate || 0,
      totalBill: 0
    };

    try {
      const result = await apiFetch(IPD_ADMISSIONS, {
        method: 'POST',
        body: JSON.stringify(newAdmission)
      });
      
      if (!result.ok) throw new Error('Failed to admit patient');

      toast.success('Patient admitted successfully and bed assigned!');
      loadIPDData(); // Refresh data from backend
      
      setAdmissionForm({
        patientId: '',
        patientAge: '',
        gender: 'Male',
        bloodGroup: '',
        admissionDateTime: new Date().toISOString().slice(0, 16),
        caseType: 'Medical',
        triageLevel: 'Routine',
        diagnosis: '',
        ward: '',
        roomId: '',
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
    } catch (error) {
      console.error('Error admitting patient:', error);
      toast.error('Failed to admit patient');
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-700">IPD Management System</h2>
        <div className="flex gap-2">
          {mainTab === 'Wards' && (
            <button
              onClick={() => {
                setWardForm({
                  ward_id: '',
                  ward_name: '',
                  ward_type: 'General',
                  floor_number: '',
                  department_id: 'Cardiology',
                  total_rooms: 0,
                  total_beds: 0,
                  occupied_beds: 0,
                  available_beds: 0,
                  ward_status: 'Active',
                  nursing_station: '',
                  oxygen_supported: true,
                  icu_supported: false,
                  rate: 2000
                });
                setShowAddWardModal(true);
              }}
              className="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center shadow-lg shadow-blue-100"
            >
              <Add className="mr-2" fontSize="small" /> Add New Ward
            </button>
          )}
          {mainTab === 'Rooms' && (
            <button
              onClick={() => {
                setRoomForm({
                  room_id: '',
                  room_number: '',
                  ward_id: wards[0]?.ward_id || '',
                  room_type: 'General',
                  floor_number: '',
                  room_status: 'Available',
                  cleaning_status: 'Clean',
                  infection_status: 'Standard',
                  ac_available: true,
                  private_room: false,
                  daily_charge: 2000
                });
                setShowAddRoomModal(true);
              }}
              className="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center shadow-lg shadow-blue-100"
            >
              <Add className="mr-2" fontSize="small" /> Add New Room
            </button>
          )}
          {mainTab === 'Beds' && (
            <button
              onClick={() => {
                setBedForm({
                  bed_id: '',
                  bed_number: '',
                  room_id: rooms[0]?.room_id || '',
                  ward_id: wards[0]?.ward_id || '',
                  bed_type: 'General',
                  bed_status: 'Available',
                  patient_id: '',
                  assigned_date: '',
                  assigned_time: '',
                  vacant_date: '',
                  is_oxygen_available: true,
                  ventilator_available: false,
                  bed_charges: 1000,
                  cleaning_required: false,
                  bed_category: 'Standard',
                  bed_priority: 'Normal',
                  bed_cleaning_status: 'Clean',
                  last_cleaned_at: '',
                  bed_maintenance_status: 'Operational',
                  monitor_attached: false,
                  ecg_available: false,
                  suction_available: false,
                  oxygen_flow_meter: false,
                  nurse_call_system: true,
                  smart_bed_enabled: false
                });
                setShowAddBedModal(true);
              }}
              className="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center shadow-lg shadow-blue-100"
            >
              <Add className="mr-2" fontSize="small" /> Add New Bed
            </button>
          )}
          {mainTab === 'NurseAssignments' && (
            <button
              onClick={() => {
                setNurseForm({
                  nurse_assignment_id: '',
                  nurse_id: '',
                  patient_id: allPatients[0]?.id || '',
                  ward_id: wards[0]?.ward_id || '',
                  shift_type: 'Morning',
                  assigned_date: new Date().toISOString().split('T')[0],
                  vitals_monitoring_frequency: 'Every 4 Hours',
                  special_instructions: ''
                });
                setShowAddNurseModal(true);
              }}
              className="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center shadow-lg shadow-blue-100"
            >
              <Add className="mr-2" fontSize="small" /> Assign Nurse
            </button>
          )}
          {mainTab === 'Admissions' && (
            <button
              onClick={() => setShowAdmissionForm(true)}
              className="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center shadow-lg shadow-blue-100"
            >
              <Hotel className="mr-2" fontSize="small" /> New Admission
            </button>
          )}
        </div>
      </div>
      {/* Main Tabs Navigation */}
      <div className="flex items-center p-1 bg-slate-100 rounded-xl mb-6 max-w-fit border border-slate-200">
        {[
          { id: 'Admissions', icon: <Hotel style={{ fontSize: 18 }} />, label: 'Patient Admissions' },
          { id: 'DoctorRounds', icon: <MedicalInformation style={{ fontSize: 18 }} />, label: 'Doctor Rounds' }
        ].map((tab) => (
          <button key={tab.id}
            onClick={() => setMainTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2 text-xs font-bold tracking-wider rounded-lg transition-all duration-200 ${mainTab === tab.id ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'}`} >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      {/* Main Tab Content */}
      {mainTab === 'Admissions' && (
        <>
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
                    {ipdDashboardStats?.total_admissions || ipdPatients.length}
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
                    {ipdDashboardStats?.active_patients || ipdPatients.filter(p => p.status === 'Critical').length}
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
                    {ipdDashboardStats?.available_beds || 0}
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
                    Discharged Patients
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {ipdDashboardStats?.discharged_patients || 0}
                  </p>
                </div>

                <div className="w-12 h-12 rounded-xl bg-yellow-500 flex items-center justify-center">
                  <Payments className="text-white text-lg" fontSize="inherit" />
                </div>
              </div>

              <div className="h-px w-full bg-yellow-200 my-3"></div>

              <p className="text-xs text-yellow-600">
                Total discharged patients
              </p>
            </div>
          </div>

          {/* Search & Filters Controls */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm mb-6">
            <div className="relative w-full md:w-[480px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" fontSize="small" />
              <input
                type="text"
                placeholder="Search patient, ID, diagnosis, doctor..."
                className="form-input w-full text-sm animate-fade-in py-2"
                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                value={admissionSearchQuery}
                onChange={(e) => setAdmissionSearchQuery(e.target.value)}
              />
              {admissionSearchQuery && (
                <button
                  onClick={() => setAdmissionSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10 flex items-center justify-center"
                >
                  <Close fontSize="small" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <select
                className="form-input text-sm py-2 px-4 w-full md:w-48"
                value={admissionWardFilter}
                onChange={(e) => setAdmissionWardFilter(e.target.value)}
              >
                <option value="">All Wards</option>
                {wards.map(w => (
                  <option key={w.id || w.ward_id} value={w.name || w.ward_name}>
                    {w.name || w.ward_name}
                  </option>
                ))}
              </select>
              <select
                className="form-input text-sm py-2 px-4 w-full md:w-44"
                value={admissionStatusFilter}
                onChange={(e) => setAdmissionStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Admitted">Admitted</option>
                <option value="Critical">Critical</option>
                <option value="Discharge Pending">Discharge Pending</option>
                <option value="Discharged">Discharged</option>
              </select>
              {(admissionSearchQuery || admissionWardFilter || admissionStatusFilter) && (
                <button
                  onClick={() => {
                    setAdmissionSearchQuery('');
                    setAdmissionWardFilter('');
                    setAdmissionStatusFilter('');
                  }}
                  className="text-xs font-semibold text-red-600 hover:text-red-800 flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Clear Filters
                </button>
              )}
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
                      <button className={`p-1 modal-touch-target flex items-center justify-center ${row.status === 'Discharged' || row.status === 'Discharge Pending' ? 'text-gray-400 cursor-not-allowed opacity-50' : 'text-green-600 hover:text-green-800'}`} title={row.status === 'Discharged' || row.status === 'Discharge Pending' ? 'Patient Discharged' : 'Transfer'} onClick={() => row.status !== 'Discharged' && row.status !== 'Discharge Pending' && initiateTransfer(row)} disabled={row.status === 'Discharged' || row.status === 'Discharge Pending'}>
                        <SwapHoriz fontSize="small" />
                      </button>
                      <button className={`p-1 modal-touch-target flex items-center justify-center ${row.status === 'Discharge Pending' || row.status === 'Discharged' ? 'text-gray-400 cursor-not-allowed opacity-50' : 'text-purple-600 hover:text-purple-800'}`} title={row.status === 'Discharge Pending' || row.status === 'Discharged' ? 'Discharge Initiated' : 'Initiate Discharge'} onClick={() => row.status !== 'Discharge Pending' && row.status !== 'Discharged' && initiateDischarge(row)} disabled={row.status === 'Discharge Pending' || row.status === 'Discharged'}>
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
              data={filteredAdmissions}
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
        </>
      )}
      {/* Wards Management Tab Content */}
      {mainTab === 'Wards' && (
        <div className="space-y-6">
          {/* Ward Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-left">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Total Wards</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{wards.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
                  <Layers className="text-white text-lg" fontSize="inherit" />
                </div>
              </div>
              <div className="h-px w-full bg-blue-200 my-3"></div>
              <p className="text-xs text-blue-600">Active ward departments</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-left">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Available Beds</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {wards.reduce((sum, w) => sum + (parseInt(w.availableBeds) || 0), 0)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
                  <Bed className="text-white text-lg" fontSize="inherit" />
                </div>
              </div>
              <div className="h-px w-full bg-green-200 my-3"></div>
              <p className="text-xs text-green-600">Across all operational wards</p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 text-left">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">ICU Wards</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {wards.filter(w => w.ward_type === 'ICU').length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center">
                  <LocalHospital className="text-white text-lg" fontSize="inherit" />
                </div>
              </div>
              <div className="h-px w-full bg-purple-200 my-3"></div>
              <p className="text-xs text-purple-600">Critical intensive care units</p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-left">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Active Wards</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {wards.filter(w => w.ward_status === 'Active').length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center">
                  <CheckCircle className="text-white text-lg" fontSize="inherit" />
                </div>
              </div>
              <div className="h-px w-full bg-emerald-200 my-3"></div>
              <p className="text-xs text-emerald-600">Operational clinical zones</p>
            </div>
          </div>

          {/* Search & Filters Controls */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
            <div className="relative w-full md:w-[480px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" fontSize="small" />
              <input type="text" placeholder="Search wards by name or floor..." className="form-input w-full text-sm animate-fade-in py-2" style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }} value={wardSearchQuery} onChange={(e) => setWardSearchQuery(e.target.value)} />
              {wardSearchQuery && (
                <button onClick={() => setWardSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10 flex items-center justify-center">
                  <Close fontSize="small" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <select className="form-input text-sm py-2 px-4 w-full md:w-40" value={wardTypeFilter} onChange={(e) => setWardTypeFilter(e.target.value)}>
                <option value="">All Ward Types</option>
                <option value="General">General</option>
                <option value="ICU">ICU</option>
                <option value="Semi-Private">Semi-Private</option>
                <option value="Private">Private</option>
                <option value="Deluxe">Deluxe</option>
              </select>
              <select
                className="form-input text-sm py-2 px-4 w-full md:w-40"
                value={wardStatusFilter}
                onChange={(e) => setWardStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          {/* Wards Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wards
              .filter(w => {
                const matchesSearch =
                  (w.ward_name || w.name || '').toLowerCase().includes(wardSearchQuery.toLowerCase()) ||
                  (w.floor_number || '').toString().includes(wardSearchQuery);
                const matchesType = wardTypeFilter ? w.ward_type === wardTypeFilter : true;
                const matchesStatus = wardStatusFilter ? w.ward_status === wardStatusFilter : true;
                return matchesSearch && matchesType && matchesStatus;
              })
              .map(ward => {
                const occupancyPercent = ((parseInt(ward.totalBeds - ward.availableBeds) || 0) / (parseInt(ward.totalBeds) || 1)) * 100;
                return (
                  <div key={ward.ward_id || ward.id} className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden text-left">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/30 rounded-full -mr-12 -mt-12 blur-xl group-hover:bg-blue-50/50 transition-colors" />
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">{ward.ward_type || 'General'}</span>
                          <h4 className="text-lg font-bold text-gray-900 mt-1">{ward.ward_name || ward.name}</h4>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <LocationOn style={{ fontSize: 12 }} /> Floor {ward.floor_number || '1'} • Dept: {ward.department_id || 'General'}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider ${ward.ward_status === 'Active' ? 'bg-emerald-100 text-emerald-800' :
                          ward.ward_status === 'Maintenance' ? 'bg-amber-100 text-amber-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                          {ward.ward_status || 'Active'}
                        </span>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 my-4 space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500 font-medium">Daily Charge</span>
                          <span className="text-blue-600 font-bold">₹{ward.rate || ward.daily_charge || 2000}/day</span>
                        </div>
                      </div>

                      {/* Bed Occupancy Meter */}
                      <div className="space-y-1.5 my-3">
                        <div className="flex justify-between text-xs font-bold text-gray-700">
                          <span>Bed Occupancy</span>
                          <span>{ward.totalBeds - ward.availableBeds} / {ward.totalBeds} Occupied</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${occupancyPercent > 85 ? 'bg-rose-500' :
                              occupancyPercent > 50 ? 'bg-amber-500' :
                                'bg-emerald-500'
                              }`}
                            style={{ width: `${occupancyPercent}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400">
                          <span>{ward.total_rooms || 1} Rooms Total</span>
                          <span>{ward.availableBeds} Beds Free</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                      <button
                        className="btn border border-slate-200 hover:bg-slate-50 text-slate-700 btn-sm flex-1 font-semibold flex items-center justify-center gap-1"
                        onClick={() => {
                          setSelectedWard(ward);
                          setWardForm({
                            ward_id: ward.ward_id || ward.id,
                            ward_name: ward.ward_name || ward.name,
                            ward_type: ward.ward_type || 'General',
                            floor_number: ward.floor_number || '1',
                            department_id: ward.department_id || 'General Medicine',
                            total_rooms: ward.total_rooms || 5,
                            total_beds: ward.totalBeds || 20,
                            occupied_beds: ward.totalBeds - ward.availableBeds,
                            available_beds: ward.availableBeds,
                            ward_status: ward.ward_status || 'Active',
                            rate: ward.rate || ward.daily_charge || 2000
                          });
                          setShowEditWardModal(true);
                        }}
                      >
                        <Edit fontSize="inherit" /> Edit Ward
                      </button>
                      <button
                        className="btn border border-red-200 hover:bg-red-50 text-red-600 btn-sm flex-1 font-semibold flex items-center justify-center gap-1"
                        onClick={() => handleDeleteWard(ward.ward_id || ward.id)}
                      >
                        <Delete fontSize="inherit" /> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
      {/* Rooms Management Tab Content */}
      {mainTab === 'Rooms' && (
        <div className="space-y-6">
          {/* Room Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Total Rooms</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{rooms.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center">
                  <MeetingRoom className="text-white text-lg" fontSize="inherit" />
                </div>
              </div>
              <div className="h-px w-full bg-slate-200 my-3"></div>
              <p className="text-xs text-slate-600">Across all operational wards</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-left">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Available Rooms</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {rooms.filter(r => r.room_status === 'Available').length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
                  <CheckCircle className="text-white text-lg" fontSize="inherit" />
                </div>
              </div>
              <div className="h-px w-full bg-green-200 my-3"></div>
              <p className="text-xs text-green-600">Ready for patient allocation</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-left">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Occupied Rooms</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {rooms.filter(r => r.room_status === 'Occupied').length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
                  <Hotel className="text-white text-lg" fontSize="inherit" />
                </div>
              </div>
              <div className="h-px w-full bg-blue-200 my-3"></div>
              <p className="text-xs text-blue-600">Currently active rooms</p>
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-left">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-rose-700 uppercase tracking-wide">Maintenance Rooms</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {rooms.filter(r => r.room_status === 'Maintenance').length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-rose-500 flex items-center justify-center">
                  <LocalHospital className="text-white text-lg" fontSize="inherit" />
                </div>
              </div>
              <div className="h-px w-full bg-rose-200 my-3"></div>
              <p className="text-xs text-rose-600">Rooms undergoing service</p>
            </div>
          </div>
          {/* Search & Filters Controls */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
            <div className="relative w-full md:w-[480px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" fontSize="small" />
              <input
                type="text"
                placeholder="Search rooms by number or ward..."
                className="form-input w-full text-sm py-2"
                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                value={roomSearchQuery}
                onChange={(e) => setRoomSearchQuery(e.target.value)}
              />
              {roomSearchQuery && (
                <button
                  onClick={() => setRoomSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10 flex items-center justify-center"
                >
                  <Close fontSize="small" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
              <select
                className="form-input text-xs py-2 px-3 w-full md:w-36"
                value={roomTypeFilter}
                onChange={(e) => setRoomTypeFilter(e.target.value)}
              >
                <option value="">All Room Types</option>
                <option value="General">General</option>
                <option value="ICU">ICU</option>
                <option value="Semi-Private">Semi-Private</option>
                <option value="Private">Private</option>
                <option value="Deluxe">Deluxe</option>
              </select>
              <select
                className="form-input text-xs py-2 px-3 w-full md:w-32"
                value={roomStatusFilter}
                onChange={(e) => setRoomStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Occupied">Occupied</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Reserved">Reserved</option>
              </select>
            </div>
          </div>

          {/* Rooms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {rooms
              .filter(r => {
                const matchedWard = wards.find(w => w.ward_id === r.ward_id || w.id === r.ward_id);
                const matchesSearch =
                  r.room_number?.toLowerCase().includes(roomSearchQuery.toLowerCase()) ||
                  (matchedWard?.ward_name || matchedWard?.name || '').toLowerCase().includes(roomSearchQuery.toLowerCase());
                const matchesType = roomTypeFilter ? r.room_type === roomTypeFilter : true;
                const matchesStatus = roomStatusFilter ? r.room_status === roomStatusFilter : true;
                return matchesSearch && matchesType && matchesStatus;
              })
              .map(room => {
                const matchedWard = wards.find(w => w.ward_id === room.ward_id || w.id === room.ward_id);
                return (
                  <div key={room.room_id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group text-left">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Room {room.room_number}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${room.room_status === 'Available' ? 'bg-emerald-100 text-emerald-800' :
                          room.room_status === 'Occupied' ? 'bg-blue-100 text-blue-800' :
                            room.room_status === 'Maintenance' ? 'bg-amber-100 text-amber-800' :
                              'bg-rose-100 text-rose-800'
                          }`}>
                          {room.room_status}
                        </span>
                      </div>

                      <h4 className="font-bold text-gray-900 text-base">{matchedWard?.ward_name || matchedWard?.name || 'Unassigned Ward'}</h4>
                      <p className="text-[11px] text-gray-400 mt-0.5">Floor: {room.floor_number} • Type: {room.room_type}</p>

                      <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-50 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Daily Charge:</span>
                          <span className="font-bold text-blue-600">₹{room.daily_charge || room.rate || 2000}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                      <button
                        className="btn border border-slate-200 hover:bg-slate-50 text-slate-700 btn-xs flex-1 font-semibold py-1.5 flex items-center justify-center gap-0.5"
                        onClick={() => {
                          setSelectedRoom(room);
                          setRoomForm(room);
                          setShowEditRoomModal(true);
                        }}
                      >
                        <Edit style={{ fontSize: 12 }} /> Edit
                      </button>
                      <button
                        className="btn border border-red-200 hover:bg-red-50 text-red-600 btn-xs flex-1 font-semibold py-1.5 flex items-center justify-center gap-0.5"
                        onClick={() => handleDeleteRoom(room.room_id)}
                      >
                        <Delete style={{ fontSize: 12 }} /> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
      {/* Beds Management Tab Content */}
      {mainTab === 'Beds' && (
        <div className="space-y-6">
          {/* Bed Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 animate-fade-in">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Total Registered Beds</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{beds.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center">
                  <Bed className="text-white text-lg" fontSize="inherit" />
                </div>
              </div>
              <div className="h-px w-full bg-slate-200 my-3"></div>
              <p className="text-xs text-slate-600">Across all active rooms</p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-left">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Beds Available</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {beds.filter(b => b.bed_status === 'Available' && !b.cleaning_required).length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center">
                  <CheckCircle className="text-white text-lg" fontSize="inherit" />
                </div>
              </div>
              <div className="h-px w-full bg-emerald-200 my-3"></div>
              <p className="text-xs text-emerald-600">Ready for instant assignment</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-left">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Oxygen Supported</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {beds.filter(b => b.is_oxygen_available).length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
                  <LocalHospital className="text-white text-lg" fontSize="inherit" />
                </div>
              </div>
              <div className="h-px w-full bg-blue-200 my-3"></div>
              <p className="text-xs text-blue-600">Equipped with local flowports</p>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-left">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-rose-700 uppercase tracking-wide">Ventilator Equipped</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {beds.filter(b => b.ventilator_available).length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-rose-500 flex items-center justify-center">
                  <MonitorHeart className="text-white text-lg" fontSize="inherit" />
                </div>
              </div>
              <div className="h-px w-full bg-rose-200 my-3"></div>
              <p className="text-xs text-rose-600">Critical intensive ventilators</p>
            </div>
          </div>

          {/* Bed Filters bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
            <div className="relative w-full md:w-[480px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" fontSize="small" />
              <input
                type="text"
                placeholder="Search beds by number, room, or ward ID..."
                className="form-input w-full text-sm animate-fade-in py-2"
                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                value={bedSearchQuery}
                onChange={(e) => setBedSearchQuery(e.target.value)}
              />
              {bedSearchQuery && (
                <button
                  onClick={() => setBedSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10 flex items-center justify-center"
                >
                  <Close fontSize="small" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <select
                className="form-input text-xs py-2 px-3 w-full md:w-32"
                value={bedStatusFilter}
                onChange={(e) => setBedStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Occupied">Occupied</option>
                <option value="Maintenance">Maintenance</option>
              </select>
              <select
                className="form-input text-xs py-2 px-3 w-full md:w-32"
                value={bedTypeFilter}
                onChange={(e) => setBedTypeFilter(e.target.value)}
              >
                <option value="">All Bed Types</option>
                <option value="General">General</option>
                <option value="ICU">ICU</option>
                <option value="Semi-Private">Semi-Private</option>
                <option value="Private">Private</option>
                <option value="Deluxe">Deluxe</option>
              </select>
              <select
                className="form-input text-xs py-2 px-3 w-full md:w-32"
                value={bedOxygenFilter}
                onChange={(e) => setBedOxygenFilter(e.target.value)}
              >
                <option value="">All Oxygen</option>
                <option value="Yes">Oxygen Available</option>
                <option value="No">No Oxygen</option>
              </select>
              <select
                className="form-input text-xs py-2 px-3 w-full md:w-32"
                value={bedVentilatorFilter}
                onChange={(e) => setBedVentilatorFilter(e.target.value)}
              >
                <option value="">All Ventilators</option>
                <option value="Yes">Ventilator Ready</option>
                <option value="No">No Ventilator</option>
              </select>
            </div>
          </div>

          {/* Bed Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {beds
              .filter(b => {
                const matchesSearch =
                  b.bed_number?.toLowerCase().includes(bedSearchQuery.toLowerCase()) ||
                  b.room_id?.toLowerCase().includes(bedSearchQuery.toLowerCase()) ||
                  b.ward_id?.toLowerCase().includes(bedSearchQuery.toLowerCase()) ||
                  b.patient_id?.toLowerCase().includes(bedSearchQuery.toLowerCase());
                const matchesStatus = bedStatusFilter ? b.bed_status === bedStatusFilter : true;
                const matchesType = bedTypeFilter ? b.bed_type === bedTypeFilter : true;
                const matchesOxygen = bedOxygenFilter ? (bedOxygenFilter === 'Yes' ? b.is_oxygen_available : !b.is_oxygen_available) : true;
                const matchesVentilator = bedVentilatorFilter ? (bedVentilatorFilter === 'Yes' ? b.ventilator_available : !b.ventilator_available) : true;
                return matchesSearch && matchesStatus && matchesType && matchesOxygen && matchesVentilator;
              })
              .map(bed => {
                const matchedRoom = rooms.find(r => r.room_id === bed.room_id);
                const matchedWard = wards.find(w => w.ward_id === bed.ward_id || w.id === bed.ward_id);
                return (
                  <div key={bed.bed_id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group text-left">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Bed {bed.bed_number}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${bed.bed_status === 'Available' ? 'bg-emerald-100 text-emerald-800' :
                          bed.bed_status === 'Occupied' ? 'bg-blue-100 text-blue-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                          {bed.bed_status}
                        </span>
                      </div>

                      <h4 className="font-bold text-gray-900 text-base">{matchedWard?.ward_name || matchedWard?.name || 'Unassigned Ward'}</h4>
                      <p className="text-[11px] text-gray-400 mt-0.5">Room: {matchedRoom?.room_number || bed.room_id} • Type: {bed.bed_type}</p>

                      <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-50 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Bed ID:</span>
                          <span className="font-semibold text-slate-700">{bed.bed_id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Charges:</span>
                          <span className="font-bold text-blue-600">₹{bed.bed_charges}/day</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Category:</span>
                          <span className="font-semibold text-slate-700">{bed.bed_category || 'Standard'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Priority:</span>
                          <span className={`font-semibold ${bed.bed_priority === 'Emergency' ? 'text-red-500 font-bold' : bed.bed_priority === 'Urgent' ? 'text-orange-500' : 'text-slate-700'}`}>
                            {bed.bed_priority || 'Normal'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Cleaning Duty:</span>
                          <span className={`font-semibold ${bed.bed_cleaning_status === 'Needs Cleaning' ? 'text-amber-600 font-bold' : bed.bed_cleaning_status === 'In Progress' ? 'text-blue-600' : 'text-emerald-600'}`}>
                            {bed.bed_cleaning_status || (bed.cleaning_required ? 'Needs Cleaning' : 'Clean')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Maintenance:</span>
                          <span className={`font-semibold ${bed.bed_maintenance_status === 'Under Maintenance' ? 'text-rose-600 font-bold' : 'text-slate-700'}`}>
                            {bed.bed_maintenance_status || 'Operational'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mt-3 pt-2">
                        {bed.is_oxygen_available && (
                          <span className="flex items-center gap-0.5 bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase" title="Oxygen Supported">
                            O2
                          </span>
                        )}
                        {bed.ventilator_available && (
                          <span className="flex items-center gap-0.5 bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase" title="Ventilator Supported">
                            VENT
                          </span>
                        )}
                        {bed.smart_bed_enabled && (
                          <span className="flex items-center gap-0.5 bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase" title="Smart Bed">
                            SMART
                          </span>
                        )}
                        {bed.monitor_attached && (
                          <span className="flex items-center gap-0.5 bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase" title="Monitor Attached">
                            MONITOR
                          </span>
                        )}
                        {bed.ecg_available && (
                          <span className="flex items-center gap-0.5 bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase" title="ECG Available">
                            ECG
                          </span>
                        )}
                        {bed.suction_available && (
                          <span className="flex items-center gap-0.5 bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase" title="Suction Available">
                            SUCTION
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                      <button
                        className="btn border border-slate-200 hover:bg-slate-50 text-slate-700 btn-xs flex-1 font-semibold py-1.5 flex items-center justify-center gap-0.5"
                        onClick={() => {
                          setSelectedBed(bed);
                          setBedForm(bed);
                          setShowEditBedModal(true);
                        }}
                      >
                        <Edit style={{ fontSize: 12 }} /> Edit
                      </button>
                      <button
                        className="btn border border-red-200 hover:bg-red-50 text-red-600 btn-xs flex-1 font-semibold py-1.5 flex items-center justify-center gap-0.5"
                        onClick={() => handleDeleteBed(bed.bed_id)}
                      >
                        <Delete style={{ fontSize: 12 }} /> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
      {/* Nurse Assignments Tab Content */}
      {mainTab === 'NurseAssignments' && (
        <div className="space-y-6 animate-fade-in">
          {/* Shift & Staff Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Active Assignments</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{nurseAssignments.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center">
                  <Assignment className="text-white text-lg" fontSize="inherit" />
                </div>
              </div>
              <div className="h-px w-full bg-slate-200 my-3"></div>
              <p className="text-xs text-slate-600">On duty currently</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-left">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Morning Shift</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {nurseAssignments.filter(nas => nas.shift_type === 'Morning').length} Assigned
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
                  <LocalHospital className="text-white text-lg" fontSize="inherit" />
                </div>
              </div>
              <div className="h-px w-full bg-blue-200 my-3"></div>
              <p className="text-xs text-blue-600">Morning roster tracking</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-left">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Evening Shift</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {nurseAssignments.filter(nas => nas.shift_type === 'Evening').length} Assigned
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center">
                  <History className="text-white text-lg" fontSize="inherit" />
                </div>
              </div>
              <div className="h-px w-full bg-amber-200 my-3"></div>
              <p className="text-xs text-amber-600">Evening roster tracking</p>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 text-left">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Night Shift</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {nurseAssignments.filter(nas => nas.shift_type === 'Night').length} Assigned
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center">
                  <Shield className="text-white text-lg" fontSize="inherit" />
                </div>
              </div>
              <div className="h-px w-full bg-indigo-200 my-3"></div>
              <p className="text-xs text-indigo-600">Overnight monitoring</p>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
            <div className="relative w-full md:w-[480px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" fontSize="small" />
              <input
                type="text"
                placeholder="Search by Nurse, Patient, or Instructions..."
                className="form-input w-full text-sm py-2"
                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                value={nurseSearchQuery}
                onChange={(e) => setNurseSearchQuery(e.target.value)}
              />
              {nurseSearchQuery && (
                <button
                  onClick={() => setNurseSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10 flex items-center justify-center"
                >
                  <Close fontSize="small" />
                </button>
              )}
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <select
                className="form-input text-xs py-2 px-3 w-full md:w-40"
                value={nurseShiftFilter}
                onChange={(e) => setNurseShiftFilter(e.target.value)}
              >
                <option value="">All Shifts</option>
                <option value="Morning">Morning Shift</option>
                <option value="Evening">Evening Shift</option>
                <option value="Night">Night Shift</option>
              </select>
              <select
                className="form-input text-xs py-2 px-3 w-full md:w-40"
                value={nurseWardFilter}
                onChange={(e) => setNurseWardFilter(e.target.value)}
              >
                <option value="">All Wards</option>
                {wards.map(w => (
                  <option key={w.ward_id || w.id} value={w.ward_id || w.id}>{w.ward_name || w.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Nurse Assignment Clinical Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                    <th className="py-4 px-6">Nurse ID</th>
                    <th className="py-4 px-6">Nurse Name</th>
                    <th className="py-4 px-6">Allocated Ward</th>
                    <th className="py-4 px-6">Patient Name</th>
                    <th className="py-4 px-6">Patient Join Date</th>
                    <th className="py-4 px-6 text-center w-[120px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {nurseAssignments
                    .filter(nas => {
                      const matchesSearch =
                        nas.nurse_id?.toLowerCase().includes(nurseSearchQuery.toLowerCase()) ||
                        nas.patient_id?.toLowerCase().includes(nurseSearchQuery.toLowerCase()) ||
                        nas.special_instructions?.toLowerCase().includes(nurseSearchQuery.toLowerCase());
                      const matchesShift = nurseShiftFilter ? nas.shift_type === nurseShiftFilter : true;
                      const matchesWard = nurseWardFilter ? nas.ward_id === nurseWardFilter : true;
                      return matchesSearch && matchesShift && matchesWard;
                    })
                    .map(nas => {
                      const matchedWard = wards.find(w => w.ward_id === nas.ward_id || w.id === nas.ward_id);
                      const matchedPatient = allPatients.find(p => p.id === nas.patient_id);
                      const matchedNurse = availableNurses.find(n => n.id === nas.nurse_id);
                      return (
                        <tr key={nas.nurse_assignment_id} className="hover:bg-slate-50/65 transition-colors">
                          {/* Nurse ID */}
                          <td className="py-4 px-6 align-middle font-mono font-bold text-slate-600">
                            {nas.nurse_id}
                          </td>

                          {/* Nurse Name */}
                          <td className="py-4 px-6 align-middle">
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                                <MedicalInformation className="text-blue-500" style={{ fontSize: 15 }} />
                                {matchedNurse?.name || 'N/A'}
                              </span>
                              {matchedNurse?.specialty && (
                                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mt-0.5 ml-5">
                                  {matchedNurse.specialty}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Allocated Ward */}
                          <td className="py-4 px-6 align-middle">
                            <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg text-xs border border-slate-200">
                              {matchedWard?.ward_name || matchedWard?.name || 'General Ward'}
                            </span>
                          </td>

                          {/* Patient Name */}
                          <td className="py-4 px-6 align-middle">
                            <div className="flex flex-col">
                              <span className="font-bold text-blue-600 text-sm">
                                {matchedPatient?.name || `Patient (${nas.patient_id})`}
                              </span>
                              <span className="text-[10px] text-gray-400 font-medium mt-0.5">
                                ID: {nas.patient_id}
                              </span>
                            </div>
                          </td>

                          {/* Patient Join Date */}
                          <td className="py-4 px-6 align-middle font-semibold text-slate-700">
                            {nas.assigned_date}
                          </td>

                          {/* Action Buttons: View & Delete */}
                          <td className="py-4 px-6 text-center align-middle">
                            <div className="flex gap-2 justify-center">
                              <button
                                className="btn border border-blue-200 hover:bg-blue-50 text-blue-600 btn-xs font-bold py-1.5 px-3 flex items-center justify-center gap-1 shadow-sm transition-all"
                                onClick={() => {
                                  setSelectedNurseAssignment(nas);
                                  setShowViewNurseModal(true);
                                }}
                              >
                                <Visibility style={{ fontSize: 12 }} /> View
                              </button>
                              <button
                                className="btn border border-red-200 hover:bg-red-50 text-red-600 btn-xs font-bold py-1.5 px-3 flex items-center justify-center gap-1 shadow-sm transition-all"
                                onClick={() => handleDeleteNurseAssignment(nas.nurse_assignment_id)}
                              >
                                <Delete style={{ fontSize: 12 }} /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* Doctor Rounds Tab Content */}
      {mainTab === 'DoctorRounds' && (
        <div className="space-y-6 animate-fade-in">
          {/* Shift & Round Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Total Scheduled Rounds</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{doctorRounds.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center">
                  <MedicalInformation className="text-white text-lg" fontSize="inherit" />
                </div>
              </div>
              <div className="h-px w-full bg-slate-200 my-3"></div>
              <p className="text-xs text-slate-600">Active ward visitation rosters</p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-left shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Completed Rounds</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {doctorRounds.filter(r => r.status === 'Completed').length} Checked
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center">
                  <CheckCircle className="text-white text-lg" fontSize="inherit" />
                </div>
              </div>
              <div className="h-px w-full bg-emerald-200 my-3"></div>
              <p className="text-xs text-emerald-600">Visitation goals met today</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-left shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Active Inpatient Plans</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {treatmentPlans.filter(p => p.status === 'Active').length} Active
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
                  <Hotel className="text-white text-lg" fontSize="inherit" />
                </div>
              </div>
              <div className="h-px w-full bg-blue-200 my-3"></div>
              <p className="text-xs text-blue-600">Monitored care pathways</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-left shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Pending Plans Review</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {treatmentPlans.filter(p => p.status === 'Pending').length} Pending
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center">
                  <MonitorHeart className="text-white text-lg" fontSize="inherit" />
                </div>
              </div>
              <div className="h-px w-full bg-amber-200 my-3"></div>
              <p className="text-xs text-amber-600">Awaiting clinical approval</p>
            </div>
          </div>

          {/* Section: Doctor Rounds Tracker */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <MedicalInformation className="text-blue-500" />
                  Doctor Inpatient Ward Rounds
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Track active ward rounds, clinical checkup dates, and visited patients.</p>
              </div>
              <div className="flex gap-3 items-center">
                <div className="relative w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" fontSize="small" />
                  <input
                    type="text"
                    placeholder="Search rounds by doctor or ward..."
                    className="form-input w-full text-xs py-1.5 animate-fade-in"
                    style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                    value={roundsSearch}
                    onChange={(e) => setRoundsSearch(e.target.value)}
                  />
                  {roundsSearch && (
                    <button
                      onClick={() => setRoundsSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10 flex items-center justify-center"
                    >
                      <Close fontSize="small" style={{ fontSize: 14 }} />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => {
                    setRoundForm({
                      doctor_name: '',
                      specialty: 'General Medicine',
                      ward_name: wards[0]?.ward_name || wards[0]?.name || 'General Ward',
                      round_date: new Date().toISOString().split('T')[0],
                      round_time: '',
                      patients_visited: '',
                      status: 'Scheduled',
                      clinical_notes: ''
                    });
                    setShowAddRoundModal(true);
                  }}
                  className="btn bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center py-1.5 px-4 rounded-xl text-xs gap-1.5 shadow-md shadow-blue-100"
                >
                  <Add fontSize="small" /> Schedule Round
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                    <th className="py-3 px-4">Round ID</th>
                    <th className="py-3 px-4">Doctor / Specialty</th>
                    <th className="py-3 px-4">Allocated Location</th>
                    <th className="py-3 px-4">Visitation Schedule</th>
                    <th className="py-3 px-4">Visited Patient Name(s)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center w-[120px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {doctorRounds
                    .filter(r =>
                      r.doctor_name?.toLowerCase().includes(roundsSearch.toLowerCase()) ||
                      r.ward_name?.toLowerCase().includes(roundsSearch.toLowerCase())
                    )
                    .map(r => (
                      <tr key={r.round_id} className="hover:bg-slate-50/65 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-500">{r.round_id}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">{r.doctor_name}</span>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{r.specialty}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-700">{r.ward_name}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-slate-700">{r.round_date}</span>
                            <span className="text-[10px] text-slate-400 font-bold">{r.round_time}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-blue-600 font-bold">{r.patients_visited || 'None'}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${r.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            r.status === 'In Progress' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            className="btn border border-red-200 hover:bg-red-50 text-red-600 btn-xs font-bold py-1 px-2.5 flex items-center justify-center gap-1 mx-auto"
                            onClick={() => handleDeleteRound(r.round_id)}
                          >
                            <Delete style={{ fontSize: 12 }} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  {doctorRounds.length === 0 && (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400 font-medium">No doctor rounds scheduled today.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: Inpatient Patient Treatment Plans */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Assignment className="text-emerald-500" />
                  Inpatient Treatment & Care Pathways
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Manage patient clinical diagnoses, prescribed medications, drip rates, and treatment progress.</p>
              </div>
              <div className="flex gap-3 items-center">
                <div className="relative w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" fontSize="small" />
                  <input
                    type="text"
                    placeholder="Search plans by patient or diagnosis..."
                    className="form-input w-full text-xs py-1.5 animate-fade-in"
                    style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                    value={plansSearch}
                    onChange={(e) => setPlansSearch(e.target.value)}
                  />
                  {plansSearch && (
                    <button
                      onClick={() => setPlansSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10 flex items-center justify-center"
                    >
                      <Close fontSize="small" style={{ fontSize: 14 }} />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => {
                    setPlanForm({
                      patient_id: allPatients[0]?.id || '',
                      patient_name: allPatients[0]?.name || '',
                      diagnosis: '',
                      doctor_name: 'Dr. Alexander Bennett',
                      treatment_details: '',
                      cycles_prescribed: 'Standard Day Cycle',
                      drip_flow_rate: '100 ml/hr',
                      start_date: new Date().toISOString().split('T')[0],
                      duration: '7 Days',
                      status: 'Active'
                    });
                    setShowAddPlanModal(true);
                  }}
                  className="btn bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center py-1.5 px-4 rounded-xl text-xs gap-1.5 shadow-md shadow-emerald-100"
                >
                  <Add fontSize="small" /> Record Treatment Plan
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                    <th className="py-3 px-4">Plan ID</th>
                    <th className="py-3 px-4">Patient Details</th>
                    <th className="py-3 px-4">Diagnosis</th>
                    <th className="py-3 px-4">Prescribed Treatment Pathway</th>
                    <th className="py-3 px-4">Cycle & Flow Rate</th>
                    <th className="py-3 px-4">Duration & Start</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center w-[120px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {treatmentPlans
                    .filter(p =>
                      p.patient_name?.toLowerCase().includes(plansSearch.toLowerCase()) ||
                      p.diagnosis?.toLowerCase().includes(plansSearch.toLowerCase())
                    )
                    .map(p => (
                      <tr key={p.plan_id} className="hover:bg-slate-50/65 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-500">{p.plan_id}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-blue-600">{p.patient_name}</span>
                            <span className="text-[10px] font-medium text-slate-400">ID: {p.patient_id}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800 bg-slate-50 px-2 py-1 rounded border border-slate-150">{p.diagnosis}</span>
                        </td>
                        <td className="py-3 px-4 max-w-[280px]">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-slate-700 line-clamp-2">{p.treatment_details}</span>
                            <span className="text-[10px] text-slate-400 font-bold mt-0.5">By: {p.doctor_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-black text-blue-800 bg-blue-50 px-2 py-0.5 rounded tracking-wide w-fit">
                              {p.cycles_prescribed}
                            </span>
                            <span className="text-[9px] font-bold text-slate-500 font-mono">
                              Flow: {p.drip_flow_rate}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-slate-700">{p.start_date}</span>
                            <span className="text-[10px] text-slate-400 font-bold">Span: {p.duration}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${p.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                            }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            className="btn border border-red-200 hover:bg-red-50 text-red-600 btn-xs font-bold py-1 px-2.5 flex items-center justify-center gap-1 mx-auto"
                            onClick={() => handleDeletePlan(p.plan_id)}
                          >
                            <Delete style={{ fontSize: 12 }} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  {treatmentPlans.length === 0 && (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-slate-400 font-medium">No patient treatment plans recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={showAdmissionForm}
        onClose={() => {
          setShowAdmissionForm(false);
          setAdmissionForm({
            patientId: '',
            patientAge: '',
            gender: 'Male',
            bloodGroup: '',
            admissionDateTime: new Date().toISOString().slice(0, 16),
            caseType: 'Medical',
            triageLevel: 'Routine',
            diagnosis: '',
            ward: '',
            roomId: '',
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
            <div className="form-group md:col-span-2">
              <label className="form-label">Admission Date & Time <span className="text-red-500">*</span></label>
              <input
                type="datetime-local"
                value={admissionForm.admissionDateTime}
                onChange={(e) => setAdmissionForm({ ...admissionForm, admissionDateTime: e.target.value })}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Ward <span className="text-red-500">*</span></label>
              <select
                value={admissionForm.ward}
                onChange={(e) => setAdmissionForm({ ...admissionForm, ward: e.target.value, roomId: '' })}
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
              <label className="form-label">Room <span className="text-red-500">*</span></label>
              <select
                value={admissionForm.roomId}
                onChange={(e) => setAdmissionForm({ ...admissionForm, roomId: e.target.value })}
                className="form-input"
                required
                disabled={!admissionForm.ward}
              >
                <option value="">Select Room</option>
                {rooms
                  .filter(r => r.ward_id === (wards.find(w => w.name === admissionForm.ward)?.ward_id || wards.find(w => w.name === admissionForm.ward)?.id))
                  .map(room => (
                    <option key={room.room_id} value={room.room_id}>
                      Room {room.room_number} ({room.room_type} - {room.room_status})
                    </option>
                  ))}
              </select>
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
            <div className="form-group md:col-span-2">
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
                Close
              </button>
              <button
                className="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center px-6 shadow-md shadow-blue-100"
                onClick={() => window.print()}
              >
                <ReceiptLong className="mr-2" fontSize="small" /> Print
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

      {/* Unified Ward Modal */}
      <Modal
        isOpen={showAddWardModal || showEditWardModal}
        onClose={() => {
          setShowAddWardModal(false);
          setShowEditWardModal(false);
          setSelectedWard(null);
        }}
        title={selectedWard ? "Edit Ward Details" : "Create New Ward"}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setShowAddWardModal(false);
                setShowEditWardModal(false);
                setSelectedWard(null);
              }}
              className="btn bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={selectedWard ? handleEditWard : handleAddWard}
              className="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-100 font-semibold"
            >
              {selectedWard ? <><Edit className="mr-1" fontSize="small" /> Save Changes</> : <><Add className="mr-1" fontSize="small" /> Save Ward</>}
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-left p-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label font-bold text-gray-700 mb-1 block text-sm">Ward Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="form-input w-full text-sm"
                placeholder="e.g. General Medicine Wing A"
                value={wardForm.ward_name}
                onChange={(e) => setWardForm({ ...wardForm, ward_name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label font-bold text-gray-700 mb-1 block text-sm">Ward Type</label>
              <select
                className="form-input w-full text-sm"
                value={wardForm.ward_type}
                onChange={(e) => setWardForm({ ...wardForm, ward_type: e.target.value })}
              >
                <option value="General">General</option>
                <option value="ICU">ICU</option>
                <option value="Semi-Private">Semi-Private</option>
                <option value="Private">Private</option>
                <option value="Deluxe">Deluxe</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label font-bold text-gray-700 mb-1 block text-sm">Floor Number <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="form-input w-full text-sm"
                placeholder="e.g. 1"
                value={wardForm.floor_number}
                onChange={(e) => setWardForm({ ...wardForm, floor_number: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label font-bold text-gray-700 mb-1 block text-sm">Department</label>
              <select
                className="form-input w-full text-sm"
                value={wardForm.department_id}
                onChange={(e) => setWardForm({ ...wardForm, department_id: e.target.value })}
              >
                {departments.map((dept, i) => (
                  <option key={i} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="form-group">
              <label className="form-label font-bold text-gray-700 mb-1 block text-sm">Total Rooms</label>
              <input
                type="number"
                className="form-input w-full text-sm"
                value={wardForm.total_rooms}
                onChange={(e) => setWardForm({ ...wardForm, total_rooms: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label className="form-label font-bold text-gray-700 mb-1 block text-sm">Total Beds</label>
              <input
                type="number"
                className="form-input w-full text-sm"
                value={wardForm.total_beds}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  if (selectedWard) {
                    setWardForm({ ...wardForm, total_beds: val });
                  } else {
                    setWardForm({ ...wardForm, total_beds: val, available_beds: val });
                  }
                }}
              />
            </div>
            <div className="form-group">
              <label className="form-label font-bold text-gray-700 mb-1 block text-sm">Daily Charge (₹)</label>
              <input
                type="number"
                className="form-input w-full text-sm"
                value={wardForm.rate}
                onChange={(e) => setWardForm({ ...wardForm, rate: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group col-span-2">
              <label className="form-label font-bold text-gray-700 mb-1 block text-sm">Ward Status</label>
              <select
                className="form-input w-full text-sm"
                value={wardForm.ward_status}
                onChange={(e) => setWardForm({ ...wardForm, ward_status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>



      {/* Unified Room Modal */}
      <Modal
        isOpen={showAddRoomModal || showEditRoomModal}
        onClose={() => {
          setShowAddRoomModal(false);
          setShowEditRoomModal(false);
          setSelectedRoom(null);
        }}
        title={selectedRoom ? "Edit Room Details" : "Add New Room"}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setShowAddRoomModal(false);
                setShowEditRoomModal(false);
                setSelectedRoom(null);
              }}
              className="btn bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={selectedRoom ? handleEditRoom : handleAddRoom}
              className="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-100 font-semibold"
            >
              {selectedRoom ? <><Edit className="mr-1" fontSize="small" /> Save Changes</> : <><Add className="mr-1" fontSize="small" /> Save Room</>}
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-left p-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label font-bold text-gray-700 mb-1 block text-sm">Room Number <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="form-input w-full text-sm"
                placeholder="e.g. 101"
                value={roomForm.room_number}
                onChange={(e) => setRoomForm({ ...roomForm, room_number: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label font-bold text-gray-700 mb-1 block text-sm">Select Ward Location <span className="text-red-500">*</span></label>
              <select
                className="form-input w-full text-sm"
                value={roomForm.ward_id}
                onChange={(e) => setRoomForm({ ...roomForm, ward_id: e.target.value })}
                required
              >
                <option value="">Select Ward...</option>
                {wards.map(w => (
                  <option key={w.ward_id || w.id} value={w.ward_id || w.id}>{w.ward_name || w.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label font-bold text-gray-700 mb-1 block text-sm">Room Type</label>
              <select
                className="form-input w-full text-sm"
                value={roomForm.room_type}
                onChange={(e) => setRoomForm({ ...roomForm, room_type: e.target.value })}
              >
                <option value="General">General</option>
                <option value="ICU">ICU</option>
                <option value="Semi-Private">Semi-Private</option>
                <option value="Private">Private</option>
                <option value="Deluxe">Deluxe</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label font-bold text-gray-700 mb-1 block text-sm">Floor Number</label>
              <input
                type="text"
                className="form-input w-full text-sm"
                placeholder="e.g. 1"
                value={roomForm.floor_number}
                onChange={(e) => setRoomForm({ ...roomForm, floor_number: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label font-bold text-gray-700 mb-1 block text-sm">Room Status</label>
              <select
                className="form-input w-full text-sm"
                value={roomForm.room_status}
                onChange={(e) => setRoomForm({ ...roomForm, room_status: e.target.value })}
              >
                <option value="Available">Available</option>
                <option value="Occupied">Occupied</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Reserved">Reserved</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label font-bold text-gray-700 mb-1 block text-sm">Daily Charge (₹)</label>
              <input
                type="number"
                className="form-input w-full text-sm"
                value={roomForm.daily_charge}
                onChange={(e) => setRoomForm({ ...roomForm, daily_charge: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

        </div>
      </Modal>

      {/* Unified Bed Modal */}
      <Modal
        isOpen={showAddBedModal || showEditBedModal}
        onClose={() => {
          setShowAddBedModal(false);
          setShowEditBedModal(false);
          setSelectedBed(null);
        }}
        title={selectedBed ? "Edit Bed Details" : "Add New Bed"}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setShowAddBedModal(false);
                setShowEditBedModal(false);
                setSelectedBed(null);
              }}
              className="btn bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={selectedBed ? handleEditBed : handleAddBed}
              className="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-100 font-semibold"
            >
              {selectedBed ? <><Edit className="mr-1" fontSize="small" /> Save Changes</> : <><Add className="mr-1" fontSize="small" /> Save Bed</>}
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-left p-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label font-bold text-gray-700 mb-1 block text-sm">Bed Number <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="form-input w-full text-sm"
                placeholder="e.g. 101A"
                value={bedForm.bed_number}
                onChange={(e) => setBedForm({ ...bedForm, bed_number: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label font-bold text-gray-700 mb-1 block text-sm">Bed Type</label>
              <select
                className="form-input w-full text-sm"
                value={bedForm.bed_type}
                onChange={(e) => setBedForm({ ...bedForm, bed_type: e.target.value })}
              >
                <option value="General">General</option>
                <option value="ICU">ICU</option>
                <option value="Semi-Private">Semi-Private</option>
                <option value="Private">Private</option>
                <option value="Deluxe">Deluxe</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label font-bold text-gray-700 mb-1 block text-sm">Select Ward <span className="text-red-500">*</span></label>
              <select
                className="form-input w-full text-sm"
                value={bedForm.ward_id}
                onChange={(e) => setBedForm({ ...bedForm, ward_id: e.target.value, room_id: '' })}
                required
              >
                <option value="">Select Ward...</option>
                {wards.map(w => (
                  <option key={w.ward_id || w.id} value={w.ward_id || w.id}>{w.ward_name || w.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label font-bold text-gray-700 mb-1 block text-sm">Select Room <span className="text-red-500">*</span></label>
              <select
                className="form-input w-full text-sm"
                value={bedForm.room_id}
                onChange={(e) => setBedForm({ ...bedForm, room_id: e.target.value })}
                required
                disabled={!bedForm.ward_id}
              >
                <option value="">Select Room...</option>
                {rooms
                  .filter(r => r.ward_id === bedForm.ward_id)
                  .map(r => (
                    <option key={r.room_id} value={r.room_id}>Room {r.room_number}</option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label font-bold text-gray-700 mb-1 block text-sm">Bed Status</label>
              <select
                className="form-input w-full text-sm"
                value={bedForm.bed_status}
                onChange={(e) => setBedForm({ ...bedForm, bed_status: e.target.value })}
              >
                <option value="Available">Available</option>
                <option value="Occupied">Occupied</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label font-bold text-gray-700 mb-1 block text-sm">Bed Daily Charges (₹)</label>
              <input
                type="number"
                className="form-input w-full text-sm"
                value={bedForm.bed_charges}
                onChange={(e) => setBedForm({ ...bedForm, bed_charges: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          {bedForm.bed_status === 'Occupied' && !selectedBed && (
            <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label font-bold text-gray-700 mb-1 block text-xs">Patient ID</label>
                  <select
                    className="form-input w-full text-xs py-1.5"
                    value={bedForm.patient_id}
                    onChange={(e) => setBedForm({ ...bedForm, patient_id: e.target.value })}
                  >
                    <option value="">Select Patient...</option>
                    {allPatients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label font-bold text-gray-700 mb-1 block text-xs">Assigned Date</label>
                  <input
                    type="date"
                    className="form-input w-full text-xs py-1.5"
                    value={bedForm.assigned_date}
                    onChange={(e) => setBedForm({ ...bedForm, assigned_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label font-bold text-gray-700 mb-1 block text-xs">Assigned Time</label>
                  <input
                    type="time"
                    className="form-input w-full text-xs py-1.5"
                    value={bedForm.assigned_time}
                    onChange={(e) => setBedForm({ ...bedForm, assigned_time: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label font-bold text-gray-700 mb-1 block text-xs">Est. Vacant Date</label>
                  <input
                    type="date"
                    className="form-input w-full text-xs py-1.5"
                    value={bedForm.vacant_date}
                    onChange={(e) => setBedForm({ ...bedForm, vacant_date: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label font-bold text-gray-700 mb-1 block text-sm">Bed Category</label>
              <select className="form-input w-full text-sm" value={bedForm.bed_category} onChange={(e) => setBedForm({ ...bedForm, bed_category: e.target.value })}>
                <option value="Standard">Standard</option>
                <option value="Premium">Premium</option>
                <option value="VIP">VIP</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label font-bold text-gray-700 mb-1 block text-sm">Bed Priority</label>
              <select className="form-input w-full text-sm" value={bedForm.bed_priority} onChange={(e) => setBedForm({ ...bedForm, bed_priority: e.target.value })}>
                <option value="Normal">Normal</option>
                <option value="Urgent">Urgent</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="form-group">
              <label className="form-label font-bold text-gray-700 mb-1 block text-xs">Cleaning Status</label>
              <select className="form-input w-full text-xs py-1.5" value={bedForm.bed_cleaning_status} onChange={(e) => setBedForm({ ...bedForm, bed_cleaning_status: e.target.value })}>
                <option value="Clean">Clean</option>
                <option value="In Progress">In Progress</option>
                <option value="Needs Cleaning">Needs Cleaning</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label font-bold text-gray-700 mb-1 block text-xs">Last Cleaned At</label>
              <input type="datetime-local" className="form-input w-full text-xs py-1.5" value={bedForm.last_cleaned_at} onChange={(e) => setBedForm({ ...bedForm, last_cleaned_at: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label font-bold text-gray-700 mb-1 block text-xs">Maintenance</label>
              <select className="form-input w-full text-xs py-1.5" value={bedForm.bed_maintenance_status} onChange={(e) => setBedForm({ ...bedForm, bed_maintenance_status: e.target.value })}>
                <option value="Operational">Operational</option>
                <option value="Under Maintenance">Under Maintenance</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl mt-2">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-gray-700">
              <input
                type="checkbox"
                checked={bedForm.is_oxygen_available}
                onChange={(e) => setBedForm({ ...bedForm, is_oxygen_available: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              Oxygen Supported
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-gray-700">
              <input
                type="checkbox"
                checked={bedForm.ventilator_available}
                onChange={(e) => setBedForm({ ...bedForm, ventilator_available: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              Ventilator Supported
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-gray-700">
              <input
                type="checkbox"
                checked={bedForm.cleaning_required}
                onChange={(e) => setBedForm({ ...bedForm, cleaning_required: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              Cleaning Required
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-gray-700">
              <input type="checkbox" checked={bedForm.monitor_attached} onChange={(e) => setBedForm({ ...bedForm, monitor_attached: e.target.checked })} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" />
              Monitor Attached
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-gray-700">
              <input type="checkbox" checked={bedForm.ecg_available} onChange={(e) => setBedForm({ ...bedForm, ecg_available: e.target.checked })} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" />
              ECG Available
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-gray-700">
              <input type="checkbox" checked={bedForm.suction_available} onChange={(e) => setBedForm({ ...bedForm, suction_available: e.target.checked })} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" />
              Suction Available
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-gray-700">
              <input type="checkbox" checked={bedForm.oxygen_flow_meter} onChange={(e) => setBedForm({ ...bedForm, oxygen_flow_meter: e.target.checked })} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" />
              Oxygen Flow Meter
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-gray-700">
              <input type="checkbox" checked={bedForm.nurse_call_system} onChange={(e) => setBedForm({ ...bedForm, nurse_call_system: e.target.checked })} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" />
              Nurse Call System
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-gray-700">
              <input type="checkbox" checked={bedForm.smart_bed_enabled} onChange={(e) => setBedForm({ ...bedForm, smart_bed_enabled: e.target.checked })} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" />
              Smart Bed
            </label>
          </div>
        </div>
      </Modal>
      {/* Unified Nurse Assignment Modal (Add & Edit) */}
      <Modal
        isOpen={showAddNurseModal}
        onClose={() => {
          setShowAddNurseModal(false);
          setSelectedNurseAssignment(null);
        }}
        title="New Nurse Assignment"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setShowAddNurseModal(false);
                setSelectedNurseAssignment(null);
              }}
              className="btn bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleAddNurseAssignment}
              className="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-100 font-semibold"
            >
              <Add className="mr-1" fontSize="small" /> Save Assignment
            </button>
          </div>
        }
      >
        <div className="space-y-5 text-left p-1">
          {/* Assignment Information Section */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/60">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Assignment style={{ fontSize: 16 }} className="text-blue-500" />
              Nurse Assignment Details
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Select Nurse Dropdown */}
              <div className="form-group">
                <label className="form-label font-bold text-gray-700 mb-1 block text-xs">Select Nurse <span className="text-red-500">*</span></label>
                <select
                  className="form-input w-full text-xs"
                  value={nurseForm.nurse_id || ''}
                  onChange={(e) => setNurseForm({ ...nurseForm, nurse_id: e.target.value })}
                  required
                >
                  <option value="">Select Nurse by Name...</option>
                  {availableNurses.map(n => (
                    <option key={n.id} value={n.id}>{n.name} ({n.id} - {n.specialty})</option>
                  ))}
                </select>
              </div>

              {/* Select Patient Dropdown */}
              <div className="form-group">
                <label className="form-label font-bold text-gray-700 mb-1 block text-xs">Select Patient <span className="text-red-500">*</span></label>
                <select
                  className="form-input w-full text-xs"
                  value={nurseForm.patient_id || ''}
                  onChange={(e) => setNurseForm({ ...nurseForm, patient_id: e.target.value })}
                  required
                >
                  <option value="">Select Patient...</option>
                  {allPatients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                  ))}
                </select>
              </div>

              {/* Select Ward Dropdown */}
              <div className="form-group">
                <label className="form-label font-bold text-gray-700 mb-1 block text-xs">Select Ward <span className="text-red-500">*</span></label>
                <select
                  className="form-input w-full text-xs"
                  value={nurseForm.ward_id || ''}
                  onChange={(e) => setNurseForm({ ...nurseForm, ward_id: e.target.value })}
                  required
                >
                  <option value="">Select Ward...</option>
                  {wards.map(w => (
                    <option key={w.ward_id || w.id} value={w.ward_id || w.id}>{w.ward_name || w.name}</option>
                  ))}
                </select>
              </div>

              {/* Select Shift */}
              <div className="form-group">
                <label className="form-label font-bold text-gray-700 mb-1 block text-xs">Select Shift</label>
                <select
                  className="form-input w-full text-xs"
                  value={nurseForm.shift_type || 'Morning'}
                  onChange={(e) => setNurseForm({ ...nurseForm, shift_type: e.target.value })}
                >
                  <option value="Morning">Morning Shift</option>
                  <option value="Evening">Evening Shift</option>
                  <option value="Night">Night Shift</option>
                </select>
              </div>

              {/* Assigned Date */}
              <div className="form-group">
                <label className="form-label font-bold text-gray-700 mb-1 block text-xs">Assigned Date</label>
                <input
                  type="date"
                  className="form-input w-full text-xs"
                  value={nurseForm.assigned_date || ''}
                  onChange={(e) => setNurseForm({ ...nurseForm, assigned_date: e.target.value })}
                />
              </div>

              {/* Vitals Schedule */}
              <div className="form-group">
                <label className="form-label font-bold text-gray-700 mb-1 block text-xs">Vitals Monitoring Frequency</label>
                <select
                  className="form-input w-full text-xs"
                  value={nurseForm.vitals_monitoring_frequency || 'Every 4 Hours'}
                  onChange={(e) => setNurseForm({ ...nurseForm, vitals_monitoring_frequency: e.target.value })}
                >
                  <option value="Every 1 Hour">Every 1 Hour</option>
                  <option value="Every 2 Hours">Every 2 Hours</option>
                  <option value="Every 4 Hours">Every 4 Hours</option>
                  <option value="Every 6 Hours">Every 6 Hours</option>
                  <option value="Every 8 Hours">Every 8 Hours</option>
                  <option value="Once a Shift">Once a Shift</option>
                </select>
              </div>
            </div>
          </div>

          {/* Prescribed Cycles Section */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/60">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <span>🩺</span> Doctor-Prescribed Cycles
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Treatment Cycle Pattern */}
              <div className="form-group col-span-1">
                <label className="form-label font-bold text-gray-700 mb-1 block text-xs">Treatment Cycle Pattern</label>
                <select
                  className="form-input w-full text-xs"
                  value={nurseForm.treatment_cycle || 'Standard Day Cycle'}
                  onChange={(e) => setNurseForm({ ...nurseForm, treatment_cycle: e.target.value })}
                >
                  <option value="Standard Day Cycle">Standard Day Cycle</option>
                  <option value="Triple Action Meds Cycle (TID)">Triple Action Meds Cycle (TID)</option>
                  <option value="Continuous IV Infusion / Drip Check">Continuous IV Infusion / Drip Check</option>
                  <option value="Intensive Cardiac Post-Op Cycle">Intensive Cardiac Post-Op Cycle</option>
                  <option value="Diabetes Management Plan">Diabetes Management Plan</option>
                </select>
              </div>

              {/* IV Flow Rate */}
              <div className="form-group col-span-1">
                <label className="form-label font-bold text-gray-700 mb-1 block text-xs">IV Flow Rate</label>
                <input
                  type="text"
                  placeholder="e.g. 100 ml/hr"
                  className="form-input w-full text-xs"
                  value={nurseForm.drip_flow_rate || ''}
                  onChange={(e) => setNurseForm({ ...nurseForm, drip_flow_rate: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Clinical Instructions Section */}
          <div className="form-group text-left">
            <label className="form-label font-bold text-gray-700 mb-1 block text-xs">Special Clinical Instructions</label>
            <textarea
              rows="2"
              className="form-input w-full text-xs p-2.5 border border-slate-200 rounded-xl"
              placeholder="e.g. Monitor glucose levels before breakfast."
              value={nurseForm.special_instructions || ''}
              onChange={(e) => setNurseForm({ ...nurseForm, special_instructions: e.target.value })}
            />
          </div>
        </div>
      </Modal>


      {/* View Nurse Assignment Details Modal */}
      <Modal
        isOpen={showViewNurseModal}
        onClose={() => {
          setShowViewNurseModal(false);
          setSelectedNurseAssignment(null);
        }}
        title="Nurse Assignment Detail Record"
        size="lg"
        footer={
          <div className="flex justify-end">
            <button
              onClick={() => {
                setShowViewNurseModal(false);
                setSelectedNurseAssignment(null);
              }}
              className="btn bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 shadow-md shadow-blue-100 rounded-xl"
            >
              Close Record
            </button>
          </div>
        }
      >
        {selectedNurseAssignment && (() => {
          const nas = selectedNurseAssignment;
          const matchedWard = wards.find(w => w.ward_id === nas.ward_id || w.id === nas.ward_id);
          const matchedPatient = allPatients.find(p => p.id === nas.patient_id);
          const matchedNurse = availableNurses.find(n => n.id === nas.nurse_id);
          const workflowItems = [
            { label: 'Patient Vitals Checked', field: 'vitals_checked' },
            { label: 'Medication Administered', field: 'meds_administered' },
            { label: 'IV Fluids Checked', field: 'iv_fluids_checked' },
            { label: 'Continuous Patient Monitoring', field: 'monitoring_active' },
            { label: 'Intake/Output Tracking', field: 'intake_output_tracked' }
          ];
          const completedCount = workflowItems.filter(item => nas[item.field]).length;
          const percent = (completedCount / workflowItems.length) * 100;
          return (
            <div className="space-y-6 text-left p-1">
              {/* Top Summary Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                    Record ID: {nas.nurse_assignment_id}
                  </span>
                  <h3 className="text-xl font-bold text-gray-900 mt-2 flex items-center gap-2">
                    <MedicalInformation className="text-blue-500" />
                    {matchedNurse?.name || 'N/A'}
                  </h3>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mt-1 ml-7">
                    Specialty: {matchedNurse?.specialty || 'General Nursing'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${nas.shift_type === 'Morning' ? 'bg-sky-100 text-sky-800' :
                    nas.shift_type === 'Evening' ? 'bg-amber-100 text-amber-800' :
                      'bg-indigo-100 text-indigo-800'
                    }`}>
                    {nas.shift_type} Shift
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">Joined: {nas.assigned_date}</span>
                </div>
              </div>

              {/* Patient & Location Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <span>👤</span> Patient Information
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Name:</span>
                      <span className="font-bold text-blue-600 text-sm">
                        {matchedPatient?.name || `Patient (${nas.patient_id})`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Patient ID:</span>
                      <span className="font-semibold text-slate-700">{nas.patient_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Age / Gender:</span>
                      <span className="font-semibold text-slate-700">
                        {matchedPatient?.age || '42'} yrs / {matchedPatient?.gender || 'Male'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <span>📍</span> Location Allocation
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Assigned Ward:</span>
                      <span className="font-bold text-slate-700">
                        {matchedWard?.ward_name || matchedWard?.name || 'General Ward'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Ward ID:</span>
                      <span className="font-semibold text-slate-700">{nas.ward_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bed Number:</span>
                      <span className="font-bold text-emerald-600">Bed 12-A</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Treatment Cycle, Drips & Vitals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-blue-50/30 border border-blue-100 rounded-2xl p-5">
                  <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-1.5 border-b border-blue-100/50 pb-2">
                    <span>🩺</span> Prescribed Care & Treatment Cycle
                  </h4>
                  <div className="space-y-3.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Care Plan Cycle:</span>
                      <span className="font-bold text-blue-600 bg-blue-100/50 px-2 py-0.5 rounded">
                        {nas.treatment_cycle || 'Standard Day Cycle'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">IV Infusion Flow Rate:</span>
                      <span className="font-mono font-bold text-slate-700">
                        {nas.drip_flow_rate || '100 ml/hr'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                  <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                    <span>⏱️</span> Vitals Monitoring & Live Metrics
                  </h4>
                  <div className="space-y-4 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Monitoring Schedule:</span>
                      <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        {nas.vitals_monitoring_frequency}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block mb-2 uppercase text-[9px] tracking-wider">Last Recorded Vitals</span>
                      <div className="grid grid-cols-4 gap-2 text-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                        {[
                          { label: 'BP', value: nas.bp || '--/--', unit: 'mmHg', color: 'text-cyan-600' },
                          { label: 'Pulse', value: nas.pulse || '--', unit: 'bpm', color: 'text-rose-600' },
                          { label: 'SPO2', value: nas.spo2 || '--', unit: '%', color: 'text-emerald-600' },
                          { label: 'Temp', value: nas.temp || '--', unit: '°F', color: 'text-amber-600' }
                        ].map((v, idx) => (
                          <div key={idx}>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">{v.label}</span>
                            <span className={`text-sm font-black block mt-1 ${v.color}`}>{v.value}</span>
                            <span className="text-[7px] text-slate-500 block">{v.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes & Special instructions */}
              {(nas.special_instructions || nas.nursing_notes) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {nas.special_instructions && (
                    <div className="bg-amber-50/40 border border-amber-100 rounded-2xl p-5 text-amber-800">
                      <span className="font-bold text-xs text-amber-700 uppercase tracking-wider block mb-2">Special Clinical Instructions:</span>
                      <p className="text-xs italic leading-relaxed">"{nas.special_instructions}"</p>
                    </div>
                  )}
                  {nas.nursing_notes && (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-slate-600">
                      <span className="font-bold text-xs text-slate-500 uppercase tracking-wider block mb-2">Nursing Notes / Shift Logs:</span>
                      <p className="text-xs italic leading-relaxed">"{nas.nursing_notes}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </Modal>

      {/* Schedule Doctor Round Modal */}
      <Modal
        isOpen={showAddRoundModal}
        onClose={() => setShowAddRoundModal(false)}
        title="Schedule New Doctor Round"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowAddRoundModal(false)}
              className="btn bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
            >
              Cancel
            </button>
            <button
              onClick={handleAddRound}
              className="btn bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-1 shadow-lg shadow-blue-100"
            >
              <Add fontSize="small" /> Schedule Round
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Doctor Name Searchable Select */}
            <div className="form-group relative" onMouseLeave={() => setShowDoctorDropdown(false)}>
              <label className="form-label font-bold text-gray-700 mb-1 block text-xs">Doctor Name</label>
              <div className="relative">
                <input type="text" placeholder="Search & Select Doctor..." className="form-input w-full text-xs pr-8" value={roundForm.doctor_name} onFocus={() => setShowDoctorDropdown(true)} onChange={(e) => { setRoundForm({ ...roundForm, doctor_name: e.target.value }); setShowDoctorDropdown(true); }} />
                <KeyboardArrowDown
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors"
                  style={{ fontSize: '18px' }}
                  onClick={() => setShowDoctorDropdown(prev => !prev)}
                />
              </div>

              {showDoctorDropdown && (
                <div className="absolute z-[110] left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {doctors
                    .filter(doc => doc.name.toLowerCase().includes((roundForm.doctor_name || '').toLowerCase()))
                    .map((doc, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex justify-between items-center transition-colors border-0"
                        onClick={() => {
                          setRoundForm({
                            ...roundForm,
                            doctor_name: doc.name,
                            specialty: doc.dept
                          });
                          setShowDoctorDropdown(false);
                        }}
                      >
                        <span>{doc.name}</span>
                      </button>
                    ))}
                  {doctors.filter(doc => doc.name.toLowerCase().includes((roundForm.doctor_name || '').toLowerCase())).length === 0 && (
                    <div className="px-4 py-2.5 text-xs text-slate-400 italic">No matching doctor found</div>
                  )}
                </div>
              )}
            </div>

            {/* Department / Specialty Searchable Select */}
            <div className="form-group relative" onMouseLeave={() => setShowDeptDropdown(false)}>
              <label className="form-label font-bold text-gray-700 mb-1 block text-xs">Medical Specialty / Department</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search & Select Department..."
                  className="form-input w-full text-xs pr-8"
                  value={roundForm.specialty}
                  onFocus={() => setShowDeptDropdown(true)}
                  onChange={(e) => {
                    setRoundForm({ ...roundForm, specialty: e.target.value });
                    setShowDeptDropdown(true);
                  }}
                />
                <KeyboardArrowDown
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors"
                  style={{ fontSize: '18px' }}
                  onClick={() => setShowDeptDropdown(prev => !prev)}
                />
              </div>

              {showDeptDropdown && (
                <div className="absolute z-[110] left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {departments
                    .filter(dept => dept.toLowerCase().includes((roundForm.specialty || '').toLowerCase()))
                    .map((dept, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex justify-between items-center transition-colors border-0"
                        onClick={() => {
                          setRoundForm({
                            ...roundForm,
                            specialty: dept
                          });
                          setShowDeptDropdown(false);
                        }}
                      >
                        <span>{dept} Department</span>
                      </button>
                    ))}
                  {departments.filter(dept => dept.toLowerCase().includes((roundForm.specialty || '').toLowerCase())).length === 0 && (
                    <div className="px-4 py-2.5 text-xs text-slate-400 italic">No matching department found</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label font-bold text-gray-700 mb-1 block text-xs">Target Ward Location</label>
            <select
              className="form-input w-full text-xs"
              value={roundForm.ward_name}
              onChange={(e) => setRoundForm({ ...roundForm, ward_name: e.target.value })}
            >
              {wards.map(w => (
                <option key={w.ward_id || w.id} value={w.ward_name || w.name}>{w.ward_name || w.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label font-bold text-gray-700 mb-1 block text-xs">Round Date</label>
              <input
                type="date"
                className="form-input w-full text-xs"
                value={roundForm.round_date}
                onChange={(e) => setRoundForm({ ...roundForm, round_date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label font-bold text-gray-700 mb-1 block text-xs">Round Time</label>
              <input
                type="text"
                placeholder="e.g. 09:30 AM"
                className="form-input w-full text-xs"
                value={roundForm.round_time}
                onChange={(e) => setRoundForm({ ...roundForm, round_time: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label font-bold text-gray-700 mb-1 block text-xs">Visited Patients (Comma Separated)</label>
            <input
              type="text"
              placeholder="e.g. Sarah Jenkins, Michael Chang"
              className="form-input w-full text-xs"
              value={roundForm.patients_visited}
              onChange={(e) => setRoundForm({ ...roundForm, patients_visited: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label font-bold text-gray-700 mb-1 block text-xs">Clinical Rounds Notes</label>
            <textarea
              rows="2"
              placeholder="Enter special clinical findings..."
              className="form-input w-full text-xs p-2.5"
              value={roundForm.clinical_notes}
              onChange={(e) => setRoundForm({ ...roundForm, clinical_notes: e.target.value })}
            />
          </div>
        </div>
      </Modal>
      {/* Record Inpatient Treatment Plan Modal */}
      <Modal
        isOpen={showAddPlanModal}
        onClose={() => setShowAddPlanModal(false)}
        title="Record Inpatient Treatment Plan"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowAddPlanModal(false)} className="btn bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold">Cancel</button>
            <button
              onClick={handleAddPlan}
              className="btn bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1 shadow-lg shadow-emerald-100"
            >
              <Add fontSize="small" /> Save Treatment Plan
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Patient Name Searchable Select */}
            <div className="form-group relative" onMouseLeave={() => setShowPlanPatientDropdown(false)}>
              <label className="form-label font-bold text-gray-700 mb-1 block text-xs">Patient Name <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search & Select Patient..."
                  className="form-input w-full text-xs pr-8"
                  value={planForm.patient_name || ''}
                  onFocus={() => setShowPlanPatientDropdown(true)}
                  onChange={(e) => {
                    const typedVal = e.target.value;
                    setPlanForm(prev => ({
                      ...prev,
                      patient_name: typedVal,
                      patient_id: ''
                    }));
                    setShowPlanPatientDropdown(true);
                  }}
                  required
                />
                <KeyboardArrowDown
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors"
                  style={{ fontSize: '18px' }}
                  onClick={() => setShowPlanPatientDropdown(prev => !prev)}
                />
              </div>

              {showPlanPatientDropdown && (
                <div className="absolute z-[110] left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {allPatients
                    .filter(p => p.name.toLowerCase().includes((planForm.patient_name || '').toLowerCase()))
                    .map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex justify-between items-center transition-colors border-0"
                        onClick={() => {
                          setPlanForm(prev => ({
                            ...prev,
                            patient_name: p.name,
                            patient_id: p.id
                          }));
                          setShowPlanPatientDropdown(false);
                        }}
                      >
                        <span>{p.name}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono">
                          {p.id}
                        </span>
                      </button>
                    ))}
                  {allPatients.filter(p => p.name.toLowerCase().includes((planForm.patient_name || '').toLowerCase())).length === 0 && (
                    <div className="px-4 py-2.5 text-xs text-slate-400 italic">No matching patient found</div>
                  )}
                </div>
              )}
            </div>

            {/* Patient ID — auto-filled */}
            <div className="form-group">
              <label className="form-label font-bold text-gray-700 mb-1 block text-xs">Patient ID <span className="text-red-500">*</span></label>
              <input type="text" placeholder="Patient ID" className="form-input w-full text-xs bg-slate-50 border border-slate-200 text-slate-500 font-semibold cursor-not-allowed" value={planForm.patient_id || ''} readOnly required/>
            </div>

          </div>
          <div className="form-group">
            <label className="form-label font-bold text-gray-700 mb-1 block text-xs">Diagnosis / Case Details</label>
            <input
              type="text"
              placeholder="e.g. Acute Coronary Syndrome"
              className="form-input w-full text-xs"
              value={planForm.diagnosis}
              onChange={(e) => setPlanForm({ ...planForm, diagnosis: e.target.value })}
            />
          </div>

          <div className="form-group relative" onMouseLeave={() => setShowPlanDoctorDropdown(false)}>
            <label className="form-label font-bold text-gray-700 mb-1 block text-xs">Prescribing Doctor</label>
            <div className="relative">
              <input type="text" placeholder="Search & Select Doctor..." className="form-input w-full text-xs pr-8" value={planForm.doctor_name || ''} onFocus={() => setShowPlanDoctorDropdown(true)} onChange={(e) => { setPlanForm({ ...planForm, doctor_name: e.target.value }); setShowPlanDoctorDropdown(true); }} />
              <KeyboardArrowDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors" style={{ fontSize: '18px' }} onClick={() => setShowPlanDoctorDropdown(prev => !prev)} />
            </div>

            {showPlanDoctorDropdown && (
              <div className="absolute z-[110] left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                {doctors
                  .filter(doc => doc.name.toLowerCase().includes((planForm.doctor_name || '').toLowerCase()))
                  .map((doc, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex justify-between items-center transition-colors border-0"
                      onClick={() => {
                        setPlanForm({
                          ...planForm,
                          doctor_name: doc.name
                        });
                        setShowPlanDoctorDropdown(false);
                      }}
                    >
                      <span>{doc.name}</span>
                    </button>
                  ))}
                {doctors.filter(doc => doc.name.toLowerCase().includes((planForm.doctor_name || '').toLowerCase())).length === 0 && (
                  <div className="px-4 py-2.5 text-xs text-slate-400 italic">No matching doctor found</div>
                )}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label font-bold text-gray-700 mb-1 block text-xs">Treatment Pathway Details</label>
            <textarea rows="2" placeholder="Prescribed medicines, oxygen support levels, physiotherapy daily targets..." className="form-input w-full text-xs p-2.5" value={planForm.treatment_details} onChange={(e) => setPlanForm({ ...planForm, treatment_details: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label font-bold text-gray-700 mb-1 block text-xs">Care Plan Cycle</label>
              <select className="form-input w-full text-xs" value={planForm.cycles_prescribed} onChange={(e) => setPlanForm({ ...planForm, cycles_prescribed: e.target.value })} >
                <option value="Standard Day Cycle">Standard Day Cycle</option>
                <option value="Triple Action Meds Cycle (TID)">Triple Action Meds Cycle (TID)</option>
                <option value="Continuous IV Infusion / Drip Check">Continuous IV Infusion</option>
                <option value="Intensive Cardiac Post-Op Cycle">Intensive Cardiac Post-Op</option>
                <option value="Diabetes Management Plan">Diabetes Management Plan</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label font-bold text-gray-700 mb-1 block text-xs">IV Flow Rate</label>
              <input type="text" placeholder="e.g. 100 ml/hr" className="form-input w-full text-xs" value={planForm.drip_flow_rate} onChange={(e) => setPlanForm({ ...planForm, drip_flow_rate: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label font-bold text-gray-700 mb-1 block text-xs">Start Date</label>
              <input type="date" className="form-input w-full text-xs" value={planForm.start_date} onChange={(e) => setPlanForm({ ...planForm, start_date: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label font-bold text-gray-700 mb-1 block text-xs">Treatment Span Duration</label>
              <input type="text" placeholder="e.g. 7 Days" className="form-input w-full text-xs" value={planForm.duration} onChange={(e) => setPlanForm({ ...planForm, duration: e.target.value })} />
            </div>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default IPDManagement;