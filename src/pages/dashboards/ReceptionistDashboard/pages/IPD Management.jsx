import React, { useState, useEffect } from 'react';
import {
  Hotel, Bed, MonitorHeart, MeetingRoom, Payments, Visibility, SwapHoriz,
  ReceiptLong, History, Search, Add, Layers, LocalHospital,
  Check, Info, Print, AddAlert, Edit, Delete
} from '@mui/icons-material';
import LoadingSpinner from '../../../../components/common/LoadingSpinner/LoadingSpinner';
import DataTable from '../../../../components/ui/Tables/DataTable';
import Modal from '../../../../components/common/Modal/Modal';

// Static Configurations for pricing and templates
const PRICING_CONFIG_DEFAULT = {
  wardCharges: {
    "General Ward": 1000,
    "Semi Private Ward": 2000,
    "Private Ward": 3500,
    "Deluxe Room": 5000,
    "ICU": 8000,
    "NICU": 7500,
    "PICU": 7500,
    "Emergency Ward": 1500
  },
  doctorVisitCharges: 500,
  nursingChargesPerDay: 400,
  procedures: {
    "Suturing": 1500,
    "Intubation": 4500,
    "Catheterization": 1200,
    "Ventilation Setup": 6000,
    "IV Cannulation": 300,
    "Nebulization": 250
  },
  labTests: {
    "CBC (Complete Blood Count)": 450,
    "LFT (Liver Function Test)": 900,
    "KFT (Kidney Function Test)": 1000,
    "Lipid Profile": 1200,
    "Blood Sugar Fasting": 150,
    "Urine Routine": 200
  },
  radiologyTests: {
    "Chest X-Ray": 800,
    "Ultrasound Abdomen": 1800,
    "CT Scan Brain": 4500,
    "MRI Spine": 7500
  }
};

const INITIAL_DOCTORS = [
  { id: "DOC-01", name: "Dr. Anil Mehta", specialty: "General Medicine", dept: "General Medicine" },
  { id: "DOC-02", name: "Dr. Rajesh Patel", specialty: "Cardiology", dept: "Cardiology" },
  { id: "DOC-03", name: "Dr. Seema Sen", specialty: "Pulmonology", dept: "Pulmonology" },
  { id: "DOC-04", name: "Dr. Vijay Kumar", specialty: "Orthopedics", dept: "Orthopedics" }
];

const INITIAL_NURSES = [
  { id: "NUR-01", name: "Nurse Priyanka", specialty: "General Care", shift: "Morning" },
  { id: "NUR-02", name: "Nurse Joseph", specialty: "ICU Specialist", shift: "Evening" },
  { id: "NUR-03", name: "Nurse Shalini", specialty: "Pediatrics", shift: "Night" }
];

const INITIAL_OPD_PATIENTS = [
  { id: "PAT-101", name: "Rahul Sharma", age: 34, gender: "Male", diagnosis: "Acute Appendicitis", consultant: "Dr. Anil Mehta", recommendedWard: "Semi Private Ward", date: "2026-06-16", status: "Recommended" },
  { id: "PAT-102", name: "Sunita Rao", age: 52, gender: "Female", diagnosis: "Congestive Heart Failure", consultant: "Dr. Rajesh Patel", recommendedWard: "ICU", date: "2026-06-15", status: "Recommended" },
  { id: "PAT-103", name: "John Smith", age: 45, gender: "Male", diagnosis: "Pneumonia with Pleural Effusion", consultant: "Dr. Seema Sen", recommendedWard: "Private Ward", date: "2026-06-16", status: "Recommended" },
  { id: "PAT-104", name: "Amit Verma", age: 28, gender: "Male", diagnosis: "Fracture Tibia", consultant: "Dr. Vijay Kumar", recommendedWard: "General Ward", date: "2026-06-16", status: "Recommended" }
];

const INITIAL_WARDS = [
  { ward_id: "WARD-1", ward_name: "General Ward", ward_type: "General Ward", floor: "1st Floor", capacity: 20, status: "Active" },
  { ward_id: "WARD-2", ward_name: "Semi Private Ward", ward_type: "Semi Private Ward", floor: "2nd Floor", capacity: 10, status: "Active" },
  { ward_id: "WARD-3", ward_name: "Private Ward", ward_type: "Private Ward", floor: "3rd Floor", capacity: 8, status: "Active" },
  { ward_id: "WARD-4", ward_name: "Deluxe Room", ward_type: "Deluxe Room", floor: "4th Floor", capacity: 5, status: "Active" },
  { ward_id: "WARD-5", ward_name: "ICU", ward_type: "ICU", floor: "5th Floor", capacity: 8, status: "Active" },
  { ward_id: "WARD-6", ward_name: "Emergency Ward", ward_type: "Emergency Ward", floor: "Ground Floor", capacity: 12, status: "Active" }
];

const INITIAL_ROOMS = [
  { room_id: "RM-101", room_number: "101", ward_id: "WARD-1", room_type: "General Ward", daily_price: 1000, status: "Available" },
  { room_id: "RM-102", room_number: "102", ward_id: "WARD-1", room_type: "General Ward", daily_price: 1000, status: "Available" },
  { room_id: "RM-201", room_number: "201", ward_id: "WARD-2", room_type: "Semi Private Ward", daily_price: 2000, status: "Available" },
  { room_id: "RM-202", room_number: "202", ward_id: "WARD-2", room_type: "Semi Private Ward", daily_price: 2000, status: "Available" },
  { room_id: "RM-301", room_number: "301", ward_id: "WARD-3", room_type: "Private Ward", daily_price: 3500, status: "Available" },
  { room_id: "RM-401", room_number: "401", ward_id: "WARD-4", room_type: "Deluxe Room", daily_price: 5000, status: "Available" },
  { room_id: "RM-501", room_number: "501", ward_id: "WARD-5", room_type: "ICU", daily_price: 8000, status: "Available" },
  { room_id: "RM-601", room_number: "601", ward_id: "WARD-6", room_type: "Emergency Ward", daily_price: 1500, status: "Available" }
];

const INITIAL_BEDS = [
  { bed_id: "BED-101A", bed_number: "101-A", room_id: "RM-101", ward_id: "WARD-1", bed_type: "General", daily_price: 0, status: "Available", is_oxygen_available: true, ventilator_available: false, cleaning_status: "Clean" },
  { bed_id: "BED-101B", bed_number: "101-B", room_id: "RM-101", ward_id: "WARD-1", bed_type: "General", daily_price: 0, status: "Available", is_oxygen_available: false, ventilator_available: false, cleaning_status: "Clean" },
  { bed_id: "BED-102A", bed_number: "102-A", room_id: "RM-102", ward_id: "WARD-1", bed_type: "General", daily_price: 0, status: "Available", is_oxygen_available: true, ventilator_available: false, cleaning_status: "Clean" },
  { bed_id: "BED-201A", bed_number: "201-A", room_id: "RM-201", ward_id: "WARD-2", bed_type: "Semi Private", daily_price: 0, status: "Available", is_oxygen_available: true, ventilator_available: false, cleaning_status: "Clean" },
  { bed_id: "BED-201B", bed_number: "201-B", room_id: "RM-201", ward_id: "WARD-2", bed_type: "Semi Private", daily_price: 0, status: "Available", is_oxygen_available: true, ventilator_available: false, cleaning_status: "Clean" },
  { bed_id: "BED-301A", bed_number: "301-A", room_id: "RM-301", ward_id: "WARD-3", bed_type: "Private", daily_price: 0, status: "Available", is_oxygen_available: true, ventilator_available: false, cleaning_status: "Clean" },
  { bed_id: "BED-401A", bed_number: "401-A", room_id: "RM-401", ward_id: "WARD-4", bed_type: "Deluxe", daily_price: 0, status: "Available", is_oxygen_available: true, ventilator_available: false, cleaning_status: "Clean" },
  { bed_id: "BED-501A", bed_number: "501-A", room_id: "RM-501", ward_id: "WARD-5", bed_type: "ICU", daily_price: 0, status: "Occupied", is_oxygen_available: true, ventilator_available: true, cleaning_status: "Clean" },
  { bed_id: "BED-501B", bed_number: "501-B", room_id: "RM-501", ward_id: "WARD-5", bed_type: "ICU", daily_price: 0, status: "Available", is_oxygen_available: true, ventilator_available: true, cleaning_status: "Clean" },
  { bed_id: "BED-601A", bed_number: "601-A", room_id: "RM-601", ward_id: "WARD-6", bed_type: "Emergency", daily_price: 0, status: "Available", is_oxygen_available: true, ventilator_available: false, cleaning_status: "Clean" }
];

const INITIAL_ADMITTED_PATIENTS = [
  {
    admissionNo: "ADM-0045",
    patientId: "PAT-201",
    patientName: "Aarav Patel",
    age: 29,
    gender: "Male",
    diagnosis: "Dengue Fever with Severe Thrombocytopenia",
    ward_id: "WARD-1",
    room_id: "RM-101",
    bed_id: "BED-101A",
    consultant_id: "DOC-01",
    nurse_id: "NUR-01",
    admissionDate: "2026-06-12",
    admissionTime: "10:30 AM",
    status: "Admitted",
    advancePaid: 5000,
    insurance: {
      provider: "Star Health",
      policyNo: "SH-99081-A",
      approvalLimit: 100000,
      copayPercent: 10,
      isTpaEnabled: true
    },
    daysStayed: 4,
    readmission: false
  },
  {
    admissionNo: "ADM-0048",
    patientId: "PAT-202",
    patientName: "Meera Deshmukh",
    age: 67,
    gender: "Female",
    diagnosis: "Unstable Angina",
    ward_id: "WARD-5",
    room_id: "RM-501",
    bed_id: "BED-501A",
    consultant_id: "DOC-02",
    nurse_id: "NUR-02",
    admissionDate: "2026-06-14",
    admissionTime: "08:15 PM",
    status: "Critical",
    advancePaid: 15000,
    insurance: {
      provider: "HDFC Ergo",
      policyNo: "HE-77165-C",
      approvalLimit: 300000,
      copayPercent: 0,
      isTpaEnabled: true
    },
    daysStayed: 2,
    readmission: false
  }
];

const INITIAL_BILLING = {
  "ADM-0045": [
    { id: 1, date: "2026-06-12", category: "Room Charges", description: "General Ward Rent (4 days)", amount: 4000 },
    { id: 2, date: "2026-06-12", category: "Nursing Charges", description: "Nursing Service (4 days)", amount: 1600 },
    { id: 3, date: "2026-06-13", category: "Doctor Visit Charges", description: "Dr. Anil Mehta - Daily Visit", amount: 500 },
    { id: 4, date: "2026-06-13", category: "Pharmacy Charges", description: "Paracetamol IV & Saline Infusion", amount: 1200 },
    { id: 5, date: "2026-06-14", category: "Lab Charges", description: "Platelet Count Test & CBC", amount: 450 }
  ],
  "ADM-0048": [
    { id: 1, date: "2026-06-14", category: "Room Charges", description: "ICU Rent (2 days)", amount: 16000 },
    { id: 2, date: "2026-06-14", category: "Nursing Charges", description: "ICU Nursing Service (2 days)", amount: 800 },
    { id: 3, date: "2026-06-14", category: "Doctor Visit Charges", description: "Dr. Rajesh Patel - ICU Round", amount: 1000 },
    { id: 4, date: "2026-06-14", category: "Procedure Charges", description: "ECG Monitoring Setup", amount: 1200 },
    { id: 5, date: "2026-06-15", category: "Pharmacy Charges", description: "Clopidogrel & Atorvastatin Dose", amount: 3500 }
  ]
};

const INITIAL_VITALS = {
  "ADM-0045": [
    { timestamp: "2026-06-12 11:00 AM", bp: "110/70", pulse: "78", spo2: "97", temp: "101.2", nurse: "Nurse Priyanka" },
    { timestamp: "2026-06-13 09:00 AM", bp: "115/75", pulse: "76", spo2: "98", temp: "99.8", nurse: "Nurse Priyanka" },
    { timestamp: "2026-06-14 02:00 PM", bp: "120/80", pulse: "72", spo2: "99", temp: "98.6", nurse: "Nurse Priyanka" }
  ],
  "ADM-0048": [
    { timestamp: "2026-06-14 09:00 PM", bp: "145/95", pulse: "92", spo2: "93", temp: "98.4", nurse: "Nurse Joseph" },
    { timestamp: "2026-06-15 08:00 AM", bp: "135/88", pulse: "88", spo2: "95", temp: "98.6", nurse: "Nurse Joseph" }
  ]
};

const INITIAL_MEDICATIONS = {
  "ADM-0045": [
    { id: 1, medicine: "Paracetamol 650mg", dosage: "1 Tablet", frequency: "TID (Thrice Daily)", status: "Administered", time: "02:00 PM", nurse: "Nurse Priyanka" },
    { id: 2, medicine: "Ceftriaxone 1g IV", dosage: "IV Injection", frequency: "BD (Twice Daily)", status: "Pending", time: "", nurse: "" }
  ],
  "ADM-0048": [
    { id: 1, medicine: "Clopidogrel 75mg", dosage: "1 Tablet", frequency: "OD (Once Daily)", status: "Administered", time: "09:00 AM", nurse: "Nurse Joseph" },
    { id: 2, medicine: "Atorvastatin 40mg", dosage: "1 Tablet", frequency: "HS (At Bedtime)", status: "Administered", time: "09:30 PM", nurse: "Nurse Joseph" },
    { id: 3, medicine: "Nitroglycerin Drip", dosage: "5 mcg/min IV", frequency: "Continuous", status: "Administered", time: "Continuous", nurse: "Nurse Joseph" }
  ]
};

const INITIAL_CLINICAL_NOTES = {
  "ADM-0045": [
    { timestamp: "2026-06-13 10:00 AM", type: "Doctor Round", author: "Dr. Anil Mehta", notes: "Patient responsive. Temperature is stabilizing. Thrombocytopenia under watch. Advised CBC platelet check tomorrow." },
    { timestamp: "2026-06-14 08:00 AM", type: "Nurse Note", author: "Nurse Priyanka", notes: "Drip running smoothly. Intake-Output logged. Patient reports mild headache, pain scale 2/10." }
  ],
  "ADM-0048": [
    { timestamp: "2026-06-14 10:00 PM", type: "Doctor Round", author: "Dr. Rajesh Patel", notes: "Admitted through Emergency. Angina chest pain under control. NTG drip running. EKG shows ST depression. Monitor closely." },
    { timestamp: "2026-06-15 09:30 AM", type: "Doctor Round", author: "Dr. Rajesh Patel", notes: "No recurring chest pain. Vitals stable. Plan for Troponin-T test in the evening. Keep patient in ICU." }
  ]
};

const INITIAL_AUDIT_LOGS = [
  { timestamp: "2026-06-12 10:30 AM", action: "Admission", user: "Receptionist", detail: "Admitted patient Rahul Sharma to General Ward bed 101-A (ADM-0045)." },
  { timestamp: "2026-06-14 08:15 PM", action: "Emergency Admission", user: "Receptionist", detail: "Emergency Admitted Meera Deshmukh to ICU bed 501-A (ADM-0048)." },
  { timestamp: "2026-06-15 09:30 AM", action: "Clinical Update", user: "Dr. Rajesh Patel", detail: "Recorded round notes and updated prescriptions for ADM-0048." }
];

const IPDManagement = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Dashboard");

  // Core Data States (only Receptionist actions, but holds states dynamically)
  const [recommendedList, setRecommendedList] = useState(() => {
    const saved = localStorage.getItem("ipd_reco_receptionist");
    return saved ? JSON.parse(saved) : INITIAL_OPD_PATIENTS;
  });
  const [admissions, setAdmissions] = useState(() => {
    const saved = localStorage.getItem("ipd_adm_receptionist");
    return saved ? JSON.parse(saved) : INITIAL_ADMITTED_PATIENTS;
  });
  const [wards, setWards] = useState(() => {
    const saved = localStorage.getItem("ipd_wards_receptionist");
    return saved ? JSON.parse(saved) : INITIAL_WARDS;
  });
  const [rooms, setRooms] = useState(() => {
    const saved = localStorage.getItem("ipd_rooms_receptionist");
    return saved ? JSON.parse(saved) : INITIAL_ROOMS;
  });
  const [beds, setBeds] = useState(() => {
    const saved = localStorage.getItem("ipd_beds_receptionist");
    return saved ? JSON.parse(saved) : INITIAL_BEDS;
  });

  const [billing, setBilling] = useState(() => {
    const saved = localStorage.getItem("ipd_bill_receptionist");
    return saved ? JSON.parse(saved) : INITIAL_BILLING;
  });
  const [vitals, setVitals] = useState(() => {
    const saved = localStorage.getItem("ipd_vit_receptionist");
    return saved ? JSON.parse(saved) : INITIAL_VITALS;
  });
  const [medications, setMedications] = useState(() => {
    const saved = localStorage.getItem("ipd_meds_receptionist");
    return saved ? JSON.parse(saved) : INITIAL_MEDICATIONS;
  });
  const [clinicalNotes, setClinicalNotes] = useState(() => {
    const saved = localStorage.getItem("ipd_notes_receptionist");
    return saved ? JSON.parse(saved) : INITIAL_CLINICAL_NOTES;
  });
  const [auditLogs, setAuditLogs] = useState(() => {
    const saved = localStorage.getItem("ipd_aud_receptionist");
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [pricingConfig, setPricingConfig] = useState(PRICING_CONFIG_DEFAULT);
  const [notifications, setNotifications] = useState([
    { id: 1, type: "Urgent", message: "Patient Meera Deshmukh (ICU) requires immediate Doctor review", time: "5 mins ago", read: false },
    { id: 2, type: "Info", message: "Bed 102-B cleaning requested", time: "15 mins ago", read: true }
  ]);

  // Modals & Forms States
  const [showAdmitForm, setShowAdmitForm] = useState(false);
  const [admitPatientData, setAdmitPatientData] = useState(null); // Selected patient from OPD
  const [showRegretModal, setShowRegretModal] = useState(false);
  const [regretForm, setRegretForm] = useState({ patientId: "", reason: "Financial issue", notes: "" });

  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyForm, setEmergencyForm] = useState({ name: "", age: "", gender: "Male", diagnosis: "", consultant_id: "", ward_id: "", room_id: "", bed_id: "", advancePaid: "", tpaProvider: "", tpaLimit: "", copay: "" });

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferForm, setTransferForm] = useState({ admissionNo: "", currentWard: "", currentRoom: "", currentBed: "", newWardId: "", newRoomId: "", newBedId: "", reason: "Clinical recommendation" });



  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [showBillViewModal, setShowBillViewModal] = useState(false);
  const [billingAuditNo, setBillingAuditNo] = useState("");
  const [paymentForm, setPaymentForm] = useState({ amount: "", paymentMode: "Cash", referenceNo: "" });
  const [depositAmount, setDepositAmount] = useState("");

  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printSummaryData, setPrintSummaryData] = useState(null);

  // Wards, Rooms, and Beds addition modals and forms
  const [showAddWardModal, setShowAddWardModal] = useState(false);
  const [addWardForm, setAddWardForm] = useState({ ward_name: "", floor: "1st Floor", capacity: 10, status: "Active" });
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [addRoomForm, setAddRoomForm] = useState({ room_number: "", ward_id: "", daily_price: 1500, status: "Available" });
  const [showAddBedModal, setShowAddBedModal] = useState(false);
  const [addBedForm, setAddBedForm] = useState({ bed_number: "", ward_id: "", room_id: "", daily_price: 0, is_oxygen_available: true, ventilator_available: false });

  // Infrastructure editing states
  const [showEditWardModal, setShowEditWardModal] = useState(false);
  const [editWardForm, setEditWardForm] = useState({ ward_id: "", ward_name: "", floor: "1st Floor", capacity: 10, status: "Active" });
  const [showEditRoomModal, setShowEditRoomModal] = useState(false);
  const [editRoomForm, setEditRoomForm] = useState({ room_id: "", room_number: "", ward_id: "", daily_price: 1500, status: "Available" });
  const [showEditBedModal, setShowEditBedModal] = useState(false);
  const [editBedForm, setEditBedForm] = useState({ bed_id: "", bed_number: "", ward_id: "", room_id: "", daily_price: 0, is_oxygen_available: true, ventilator_available: false, status: "Available" });
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, type: "", id: null, title: "", message: "" });

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [wardFilter, setWardFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Populate dynamic dropdowns based on selections in forms
  const [availableRooms, setAvailableRooms] = useState([]);
  const [availableBeds, setAvailableBeds] = useState([]);

  // Auto-save to LocalStorage
  useEffect(() => {
    localStorage.setItem("ipd_reco_receptionist", JSON.stringify(recommendedList));
  }, [recommendedList]);

  useEffect(() => {
    localStorage.setItem("ipd_adm_receptionist", JSON.stringify(admissions));
  }, [admissions]);

  useEffect(() => {
    localStorage.setItem("ipd_wards_receptionist", JSON.stringify(wards));
  }, [wards]);

  useEffect(() => {
    localStorage.setItem("ipd_rooms_receptionist", JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem("ipd_beds_receptionist", JSON.stringify(beds));
  }, [beds]);



  useEffect(() => {
    localStorage.setItem("ipd_bill_receptionist", JSON.stringify(billing));
  }, [billing]);

  useEffect(() => {
    localStorage.setItem("ipd_vit_receptionist", JSON.stringify(vitals));
  }, [vitals]);

  useEffect(() => {
    localStorage.setItem("ipd_meds_receptionist", JSON.stringify(medications));
  }, [medications]);

  useEffect(() => {
    localStorage.setItem("ipd_notes_receptionist", JSON.stringify(clinicalNotes));
  }, [clinicalNotes]);

  useEffect(() => {
    localStorage.setItem("ipd_aud_receptionist", JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Loading timer
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Logger helper
  const logActivity = (action, detail) => {
    const timestamp = new Date().toLocaleString();
    setAuditLogs(prev => [{ timestamp, action, user: "Receptionist", detail }, ...prev]);
  };

  const handlePrintDischarge = (adm) => {
    setPrintSummaryData(adm);
    setShowPrintModal(true);
  };

  // Helper for billing calculations
  const getBillingSummary = (admissionNo) => {
    const txs = billing[admissionNo] || [];
    const total = txs.reduce((sum, item) => sum + item.amount, 0);
    const adm = admissions.find(a => a.admissionNo === admissionNo);
    const advance = adm ? adm.advancePaid || 0 : 0;
    const insuranceLimit = adm && adm.insurance?.isTpaEnabled ? adm.insurance.approvalLimit : 0;
    const copay = adm && adm.insurance?.isTpaEnabled ? adm.insurance.copayPercent : 0;

    let insuranceAmt = 0;
    let pendingAmt = total - advance;

    if (insuranceLimit > 0) {
      const billableToInsurance = Math.min(total, insuranceLimit);
      const copayAmt = (billableToInsurance * copay) / 100;
      insuranceAmt = billableToInsurance - copayAmt;
      pendingAmt = total - advance - insuranceAmt;
    }

    return {
      total,
      advance,
      insuranceAmt,
      pendingAmt: pendingAmt < 0 ? 0 : pendingAmt,
      excessRefund: pendingAmt < 0 ? Math.abs(pendingAmt) : 0
    };
  };

  // Keep daily room charges up-to-date
  useEffect(() => {
    const interval = setTimeout(() => {
      setAdmissions(prevAdmissions => {
        let changed = false;
        const updated = prevAdmissions.map(adm => {
          if (adm.status === "Discharged") return adm;
          const start = new Date(adm.admissionDate);
          const now = new Date();
          const diffMs = now - start;
          const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

          if (adm.daysStayed !== days) {
            changed = true;
            const ward = wards.find(w => w.ward_id === adm.ward_id);
            const room = rooms.find(r => r.room_id === adm.room_id);
            const bed = beds.find(b => b.bed_id === adm.bed_id);
            const rate = (bed?.daily_price && bed.daily_price > 0)
              ? bed.daily_price
              : (room?.daily_price && room.daily_price > 0)
                ? room.daily_price
                : (pricingConfig.wardCharges[ward?.ward_name] || 1000);
            const newRoomRent = rate * days;
            const nursingRent = pricingConfig.nursingChargesPerDay * days;

            setBilling(prevBilling => {
              const patientBilling = prevBilling[adm.admissionNo] || [];
              let roomChargeExists = false;
              let nursingChargeExists = false;

              const updatedTxs = patientBilling.map(tx => {
                if (tx.category === "Room Charges") {
                  roomChargeExists = true;
                  return { ...tx, amount: newRoomRent, description: `${ward?.ward_name} Rent (${days} days)` };
                }
                if (tx.category === "Nursing Charges") {
                  nursingChargeExists = true;
                  return { ...tx, amount: nursingRent, description: `Nursing Service (${days} days)` };
                }
                return tx;
              });

              if (!roomChargeExists) {
                updatedTxs.push({
                  id: Date.now() + 1,
                  date: new Date().toISOString().split("T")[0],
                  category: "Room Charges",
                  description: `${ward?.ward_name} Rent (${days} days)`,
                  amount: newRoomRent
                });
              }

              if (!nursingChargeExists) {
                updatedTxs.push({
                  id: Date.now() + 2,
                  date: new Date().toISOString().split("T")[0],
                  category: "Nursing Charges",
                  description: `Nursing Service (${days} days)`,
                  amount: nursingRent
                });
              }

              return { ...prevBilling, [adm.admissionNo]: updatedTxs };
            });

            return { ...adm, daysStayed: days };
          }
          return adm;
        });

        return changed ? updated : prevAdmissions;
      });
    }, 3000);
    return () => clearTimeout(interval);
  }, [admissions, wards, rooms, beds, pricingConfig]);

  // Synchronized dropdowns
  const handleWardChangeInForm = (wardId) => {
    const filteredRooms = rooms.filter(r => r.ward_id === wardId && r.status === "Available");
    setAvailableRooms(filteredRooms);
    setAvailableBeds([]);
  };

  const handleRoomChangeInForm = (roomId) => {
    const filteredBeds = beds.filter(b => b.room_id === roomId && b.status === "Available");
    setAvailableBeds(filteredBeds);
  };

  // ADMISSION METHODS
  const handleSelectAdmit = (patient) => {
    setAdmitPatientData(patient);
    setAvailableRooms(rooms.filter(r => r.ward_id === wards.find(w => w.ward_name === patient.recommendedWard)?.ward_id));
    setAvailableBeds([]);
    setShowAdmitForm(true);
  };

  const handleConfirmAdmission = (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const selectedWardId = data.get("ward_id");
    const selectedRoomId = data.get("room_id");
    const selectedBedId = data.get("bed_id");
    const docId = data.get("consultant_id");
    const nurseId = data.get("nurse_id");
    const advance = parseFloat(data.get("advancePaid")) || 0;

    const insuranceProvider = data.get("insuranceProvider");
    const insuranceLimit = parseFloat(data.get("approvalLimit")) || 0;
    const copay = parseInt(data.get("copayPercent")) || 0;

    const admNo = `ADM-00${Math.floor(100 + Math.random() * 900)}`;
    const dateStr = new Date().toISOString().split("T")[0];
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Check for readmission tracking (30 days since previous discharge)
    const isReadmission = auditLogs.some(log =>
      log.action === "Discharge Completion" &&
      log.detail.includes(admitPatientData.id) &&
      (new Date() - new Date(log.timestamp) < 30 * 24 * 60 * 60 * 1000)
    );

    const newAdmission = {
      admissionNo: admNo,
      patientId: admitPatientData.id,
      patientName: admitPatientData.name,
      age: admitPatientData.age,
      gender: admitPatientData.gender,
      diagnosis: admitPatientData.diagnosis,
      ward_id: selectedWardId,
      room_id: selectedRoomId,
      bed_id: selectedBedId,
      consultant_id: docId,
      nurse_id: nurseId,
      admissionDate: dateStr,
      admissionTime: timeStr,
      status: "Admitted",
      advancePaid: advance,
      insurance: {
        provider: insuranceProvider,
        policyNo: data.get("policyNo") || `INS-${Math.floor(10000 + Math.random() * 90000)}`,
        approvalLimit: insuranceLimit,
        copayPercent: copay,
        isTpaEnabled: !!insuranceProvider
      },
      daysStayed: 1,
      readmission: isReadmission
    };

    const ward = wards.find(w => w.ward_id === selectedWardId);
    const room = rooms.find(r => r.room_id === selectedRoomId);
    const bed = beds.find(b => b.bed_id === selectedBedId);
    const roomRent = (bed?.daily_price && bed.daily_price > 0)
      ? bed.daily_price
      : (room?.daily_price && room.daily_price > 0)
        ? room.daily_price
        : (pricingConfig.wardCharges[ward?.ward_name] || 1000);
    const nurseFee = pricingConfig.nursingChargesPerDay;

    setAdmissions(prev => [newAdmission, ...prev]);
    setRecommendedList(prev => prev.filter(p => p.id !== admitPatientData.id));
    setBeds(prev => prev.map(b => b.bed_id === selectedBedId ? { ...b, status: "Occupied" } : b));

    setBilling(prev => ({
      ...prev,
      [admNo]: [
        { id: Date.now(), date: dateStr, category: "Room Charges", description: `${ward?.ward_name} Rent (1 day)`, amount: roomRent },
        { id: Date.now() + 1, date: dateStr, category: "Nursing Charges", description: `Nursing Service (1 day)`, amount: nurseFee }
      ]
    }));

    logActivity("Admission", `Admitted patient ${newAdmission.patientName} (${newAdmission.patientId}) to ${ward?.ward_name} Bed ${beds.find(b => b.bed_id === selectedBedId)?.bed_number}. Admission ID: ${admNo}`);

    setShowAdmitForm(false);
    setAdmitPatientData(null);
  };

  const handleRegretAdmission = (patient) => {
    setRegretForm({ patientId: patient.id, reason: "Financial issue", notes: "" });
    setShowRegretModal(true);
  };

  const submitRegretAdmission = (e) => {
    e.preventDefault();
    const patient = recommendedList.find(p => p.id === regretForm.patientId);
    if (!patient) return;

    setRecommendedList(prev => prev.filter(p => p.id !== regretForm.patientId));
    logActivity("Regret Admission", `Patient ${patient.name} (${patient.id}) refused admission. Reason: ${regretForm.reason}. Comments: ${regretForm.notes}`);
    setShowRegretModal(false);
    alert("Refusal logs recorded successfully.");
  };

  // DIRECT EMERGENCY ADMISSION
  const handleEmergencyAdmissionSubmit = (e) => {
    e.preventDefault();
    const ward = wards.find(w => w.ward_id === emergencyForm.ward_id);
    const bed = beds.find(b => b.bed_id === emergencyForm.bed_id);

    const admNo = `ADM-EMG${Math.floor(100 + Math.random() * 900)}`;
    const patId = `PAT-EMG${Math.floor(100 + Math.random() * 900)}`;
    const dateStr = new Date().toISOString().split("T")[0];
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newAdmission = {
      admissionNo: admNo,
      patientId: patId,
      patientName: emergencyForm.name,
      age: parseInt(emergencyForm.age) || 30,
      gender: emergencyForm.gender,
      diagnosis: emergencyForm.diagnosis || "Acute Trauma / Chest Pain",
      ward_id: emergencyForm.ward_id,
      room_id: emergencyForm.room_id,
      bed_id: emergencyForm.bed_id,
      consultant_id: emergencyForm.consultant_id,
      nurse_id: INITIAL_NURSES[0].id,
      admissionDate: dateStr,
      admissionTime: timeStr,
      status: "Critical",
      advancePaid: parseFloat(emergencyForm.advancePaid) || 0,
      insurance: {
        provider: emergencyForm.tpaProvider || "",
        policyNo: `INS-EMG-${Math.floor(1000 + Math.random() * 9000)}`,
        approvalLimit: parseFloat(emergencyForm.tpaLimit) || 0,
        copayPercent: parseInt(emergencyForm.copay) || 0,
        isTpaEnabled: !!emergencyForm.tpaProvider
      },
      daysStayed: 1,
      readmission: false
    };

    const room = rooms.find(r => r.room_id === emergencyForm.room_id);
    const roomRent = (bed?.daily_price && bed.daily_price > 0)
      ? bed.daily_price
      : (room?.daily_price && room.daily_price > 0)
        ? room.daily_price
        : (pricingConfig.wardCharges[ward?.ward_name] || 1500);
    const nurseFee = pricingConfig.nursingChargesPerDay;

    setAdmissions(prev => [newAdmission, ...prev]);
    setBeds(prev => prev.map(b => b.bed_id === emergencyForm.bed_id ? { ...b, status: "Occupied" } : b));
    setBilling(prev => ({
      ...prev,
      [admNo]: [
        { id: Date.now(), date: dateStr, category: "Room Charges", description: `${ward?.ward_name} Rent (1 day)`, amount: roomRent },
        { id: Date.now() + 1, date: dateStr, category: "Nursing Charges", description: `Nursing Service (1 day)`, amount: nurseFee }
      ]
    }));

    logActivity("Emergency Admission", `CRITICAL direct emergency admission: ${newAdmission.patientName} allocated to ICU/Emergency Bed ${bed?.bed_number}. ID: ${admNo}`);
    setShowEmergencyModal(false);
    setEmergencyForm({ name: "", age: "", gender: "Male", diagnosis: "", consultant_id: "", ward_id: "", room_id: "", bed_id: "", advancePaid: "", tpaProvider: "", tpaLimit: "", copay: "" });
  };


  // ROOM / BED TRANSFERS
  const handleInitiateTransfer = (adm) => {
    setTransferForm({
      admissionNo: adm.admissionNo,
      currentWard: wards.find(w => w.ward_id === adm.ward_id)?.ward_name || "Unknown",
      currentRoom: rooms.find(r => r.room_id === adm.room_id)?.room_number || "Unknown",
      currentBed: beds.find(b => b.bed_id === adm.bed_id)?.bed_number || "Unknown",
      newWardId: "",
      newRoomId: "",
      newBedId: "",
      reason: "Clinical preference"
    });
    setAvailableRooms([]);
    setAvailableBeds([]);
    setShowTransferModal(true);
  };

  const handleConfirmTransfer = (e) => {
    e.preventDefault();
    const adm = admissions.find(a => a.admissionNo === transferForm.admissionNo);
    if (!adm) return;

    const oldBedId = adm.bed_id;
    const newBedId = transferForm.newBedId;
    const newWardId = transferForm.newWardId;
    const newRoomId = transferForm.newRoomId;

    const oldBed = beds.find(b => b.bed_id === oldBedId);
    const newBed = beds.find(b => b.bed_id === newBedId);
    const oldWard = wards.find(w => w.ward_id === adm.ward_id);
    const newWard = wards.find(w => w.ward_id === newWardId);

    setAdmissions(prev => prev.map(a => {
      if (a.admissionNo === transferForm.admissionNo) {
        return {
          ...a,
          ward_id: newWardId,
          room_id: newRoomId,
          bed_id: newBedId
        };
      }
      return a;
    }));

    setBeds(prev => prev.map(b => {
      if (b.bed_id === oldBedId) return { ...b, status: "Available", cleaning_status: "Needs Cleaning" };
      if (b.bed_id === newBedId) return { ...b, status: "Occupied" };
      return b;
    }));

    const txDate = new Date().toISOString().split("T")[0];
    setBilling(prev => {
      const patientBilling = prev[adm.admissionNo] || [];
      return {
        ...prev,
        [adm.admissionNo]: [
          ...patientBilling,
          {
            id: Date.now(),
            date: txDate,
            category: "Procedure Charges",
            description: `Inter-ward Transfer: ${oldWard?.ward_name} (Bed ${oldBed?.bed_number}) ➔ ${newWard?.ward_name} (Bed ${newBed?.bed_number}). Reason: ${transferForm.reason}`,
            amount: 500
          }
        ]
      };
    });

    logActivity("Transfer", `Transferred patient ${adm.patientName} from ${oldWard?.ward_name} to ${newWard?.ward_name} (Bed ${newBed?.bed_number})`);
    setShowTransferModal(false);
  };

  // ROOM CLEANING WORKFLOW (Receptionist can clear cleaned beds)
  const handleMarkBedClean = (bedId) => {
    setBeds(prev => prev.map(b => b.bed_id === bedId ? { ...b, cleaning_status: "Clean" } : b));
    logActivity("Maintenance", `Marked Bed ${beds.find(b => b.bed_id === bedId)?.bed_number} as clean and ready for admissions.`);
  };

  // DYNAMIC INFRASTRUCTURE CREATION HANDLERS
  const handleCreateWard = (e) => {
    e.preventDefault();
    const newId = `WARD-${Date.now()}`;
    const newWardObj = {
      ward_id: newId,
      ward_name: addWardForm.ward_name,
      ward_type: addWardForm.ward_name,
      floor: addWardForm.floor,
      capacity: parseInt(addWardForm.capacity) || 10,
      status: addWardForm.status || "Active"
    };

    setWards(prev => [...prev, newWardObj]);
    logActivity("Infrastructure Creation", `Created new Ward: ${newWardObj.ward_name} (${newWardObj.floor}) with capacity of ${newWardObj.capacity} beds.`);
    setShowAddWardModal(false);
    setAddWardForm({ ward_name: "", floor: "1st Floor", capacity: 10, status: "Active" });
  };

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!addRoomForm.ward_id) {
      alert("Please select a ward first.");
      return;
    }
    const newId = `RM-${Date.now()}`;
    const selectedWard = wards.find(w => w.ward_id === addRoomForm.ward_id);
    const newRoomObj = {
      room_id: newId,
      room_number: addRoomForm.room_number,
      ward_id: addRoomForm.ward_id,
      room_type: selectedWard ? selectedWard.ward_name : "General Room",
      daily_price: parseFloat(addRoomForm.daily_price) || 1500,
      status: addRoomForm.status || "Available"
    };

    setRooms(prev => [...prev, newRoomObj]);
    logActivity("Infrastructure Creation", `Created new Room ${newRoomObj.room_number} in Ward: ${selectedWard?.ward_name || "Unknown"}.`);
    setShowAddRoomModal(false);
    setAddRoomForm({ room_number: "", ward_id: "", daily_price: 1500, status: "Available" });
  };

  const handleCreateBed = (e) => {
    e.preventDefault();
    if (!addBedForm.ward_id || !addBedForm.room_id) {
      alert("Please select a ward and a room first.");
      return;
    }
    const newId = `BED-${Date.now()}`;
    const selectedWard = wards.find(w => w.ward_id === addBedForm.ward_id);
    const newBedObj = {
      bed_id: newId,
      bed_number: addBedForm.bed_number,
      room_id: addBedForm.room_id,
      ward_id: addBedForm.ward_id,
      bed_type: selectedWard ? selectedWard.ward_name : "General",
      daily_price: parseFloat(addBedForm.daily_price) || 0,
      status: "Available",
      is_oxygen_available: addBedForm.is_oxygen_available,
      ventilator_available: addBedForm.ventilator_available,
      cleaning_status: "Clean"
    };

    setBeds(prev => [...prev, newBedObj]);
    logActivity("Infrastructure Creation", `Created new Bed ${newBedObj.bed_number} in Room ${rooms.find(r => r.room_id === addBedForm.room_id)?.room_number || "Unknown"}.`);
    setShowAddBedModal(false);
    setAddBedForm({ bed_number: "", ward_id: "", room_id: "", daily_price: 0, is_oxygen_available: true, ventilator_available: false });
  };

  const handleOpenEditWard = (ward) => {
    setEditWardForm({
      ward_id: ward.ward_id,
      ward_name: ward.ward_name,
      floor: ward.floor,
      capacity: ward.capacity,
      status: ward.status || "Active"
    });
    setShowEditWardModal(true);
  };

  const handleUpdateWard = (e) => {
    e.preventDefault();
    const oldWard = wards.find(w => w.ward_id === editWardForm.ward_id);
    if (!oldWard) return;

    setWards(prev => prev.map(w => {
      if (w.ward_id === editWardForm.ward_id) {
        return {
          ...w,
          ward_name: editWardForm.ward_name,
          floor: editWardForm.floor,
          capacity: parseInt(editWardForm.capacity) || 10,
          status: editWardForm.status
        };
      }
      return w;
    }));

    logActivity("Infrastructure Update", `Updated Ward: ${oldWard.ward_name} -> ${editWardForm.ward_name}.`);
    setShowEditWardModal(false);
  };

  const triggerDeleteWard = (wardId) => {
    const ward = wards.find(w => w.ward_id === wardId);
    if (!ward) return;

    setDeleteConfirm({
      isOpen: true,
      type: "ward",
      id: wardId,
      title: "Delete Ward/Floor Confirmation",
      message: `Are you sure you want to delete the ward/floor "${ward.ward_name}"? This will also remove all associated rooms and beds.`
    });
  };
  // ROOM EDIT & DELETE HANDLERS
  const handleOpenEditRoom = (room) => {
    setEditRoomForm({
      room_id: room.room_id,
      room_number: room.room_number,
      ward_id: room.ward_id,
      daily_price: room.daily_price,
      status: room.status || "Available"
    });
    setShowEditRoomModal(true);
  };

  const handleUpdateRoom = (e) => {
    e.preventDefault();
    const oldRoom = rooms.find(r => r.room_id === editRoomForm.room_id);
    if (!oldRoom) return;

    setRooms(prev => prev.map(r => {
      if (r.room_id === editRoomForm.room_id) {
        return {
          ...r,
          room_number: editRoomForm.room_number,
          ward_id: editRoomForm.ward_id,
          daily_price: parseFloat(editRoomForm.daily_price) || 0,
          status: editRoomForm.status
        };
      }
      return r;
    }));

    logActivity("Infrastructure Update", `Updated Room: ${oldRoom.room_number} -> ${editRoomForm.room_number}.`);
    setShowEditRoomModal(false);
  };

  const triggerDeleteRoom = (roomId) => {
    const room = rooms.find(r => r.room_id === roomId);
    if (!room) return;

    setDeleteConfirm({
      isOpen: true,
      type: "room",
      id: roomId,
      title: "Delete Room Confirmation",
      message: `Are you sure you want to delete room "Room ${room.room_number}"? This will also remove all associated beds.`
    });
  };

  // BED EDIT & DELETE HANDLERS
  const handleOpenEditBed = (bed) => {
    setEditBedForm({
      bed_id: bed.bed_id,
      bed_number: bed.bed_number,
      ward_id: bed.ward_id,
      room_id: bed.room_id,
      daily_price: bed.daily_price || 0,
      is_oxygen_available: bed.is_oxygen_available,
      ventilator_available: bed.ventilator_available,
      status: bed.status
    });
    setShowEditBedModal(true);
  };

  const handleUpdateBed = (e) => {
    e.preventDefault();
    const oldBed = beds.find(b => b.bed_id === editBedForm.bed_id);
    if (!oldBed) return;

    setBeds(prev => prev.map(b => {
      if (b.bed_id === editBedForm.bed_id) {
        const selectedWard = wards.find(w => w.ward_id === editBedForm.ward_id);
        return {
          ...b,
          bed_number: editBedForm.bed_number,
          ward_id: editBedForm.ward_id,
          room_id: editBedForm.room_id,
          bed_type: selectedWard ? selectedWard.ward_type.replace(" Ward", "") : b.bed_type,
          daily_price: parseFloat(editBedForm.daily_price) || 0,
          is_oxygen_available: editBedForm.is_oxygen_available,
          ventilator_available: editBedForm.ventilator_available
        };
      }
      return b;
    }));

    logActivity("Infrastructure Update", `Updated Bed: ${oldBed.bed_number} -> ${editBedForm.bed_number}.`);
    setShowEditBedModal(false);
  };

  const triggerDeleteBed = (bedId) => {
    const bed = beds.find(b => b.bed_id === bedId);
    if (!bed) return;

    setDeleteConfirm({
      isOpen: true,
      type: "bed",
      id: bedId,
      title: "Delete Bed Confirmation",
      message: `Are you sure you want to delete bed "Bed ${bed.bed_number}"?`
    });
  };

  const executeDelete = () => {
    const { type, id } = deleteConfirm;
    if (type === "ward") {
      const ward = wards.find(w => w.ward_id === id);
      if (ward) {
        setWards(prev => prev.filter(w => w.ward_id !== id));
        setRooms(prev => prev.filter(r => r.ward_id !== id));
        setBeds(prev => prev.filter(b => b.ward_id !== id));
        logActivity("Infrastructure Deletion", `Deleted Ward: ${ward.ward_name} along with its rooms and beds.`);
      }
    } else if (type === "room") {
      const room = rooms.find(r => r.room_id === id);
      if (room) {
        setRooms(prev => prev.filter(r => r.room_id !== id));
        setBeds(prev => prev.filter(b => b.room_id !== id));
        logActivity("Infrastructure Deletion", `Deleted Room: ${room.room_number} along with its beds.`);
      }
    } else if (type === "bed") {
      const bed = beds.find(b => b.bed_id === id);
      if (bed) {
        setBeds(prev => prev.filter(b => b.bed_id !== id));
        logActivity("Infrastructure Deletion", `Deleted Bed: ${bed.bed_number}.`);
        setShowEditBedModal(false);
      }
    }
    setDeleteConfirm({ isOpen: false, type: "", id: null, title: "", message: "" });
  };

  // SIMULATE DOCTOR & NURSE EVENTS (Clinical JSON states simulation helper)
  const handleSimulateDoctorRound = (adm) => {
    const timestamp = new Date().toLocaleString();
    const doc = INITIAL_DOCTORS.find(d => d.id === adm.consultant_id);
    const chargeDate = new Date().toISOString().split("T")[0];

    // Prescribe random medicine
    const medList = ["Inj Ceftriaxone 1g IV", "Tab Clopidogrel 75mg", "Inj Pantoprazole 40mg", "Tab Multivitamin OD"];
    const randomMedName = medList[Math.floor(Math.random() * medList.length)];
    const newMed = {
      id: Date.now(),
      medicine: randomMedName,
      dosage: "1 dose",
      frequency: "BD (Twice Daily)",
      status: "Administered",
      time: "10:00 AM",
      nurse: "Nurse Priyanka"
    };

    // Add round note
    const roundNote = {
      timestamp,
      type: "Doctor Round",
      author: doc?.name || "Consultant",
      notes: `SIMULATED ROUND: Patient prognosis stable. Administered meds & ordered Lab check.`
    };

    // Update state
    setClinicalNotes(prev => ({ ...prev, [adm.admissionNo]: [roundNote, ...(prev[adm.admissionNo] || [])] }));
    setMedications(prev => ({ ...prev, [adm.admissionNo]: [newMed, ...(prev[adm.admissionNo] || [])] }));

    // Add charges
    setBilling(prev => {
      const patientBilling = prev[adm.admissionNo] || [];
      return {
        ...prev,
        [adm.admissionNo]: [
          ...patientBilling,
          { id: Date.now() + 10, date: chargeDate, category: "Doctor Visit Charges", description: `Consultation round visit by ${doc?.name}`, amount: pricingConfig.doctorVisitCharges },
          { id: Date.now() + 11, date: chargeDate, category: "Pharmacy Charges", description: `Prescription: ${randomMedName}`, amount: 350 },
          { id: Date.now() + 12, date: chargeDate, category: "Lab Charges", description: "Diagnostics: CBC Panel", amount: 450 }
        ]
      };
    });

    logActivity("Clinical Simulation", `Simulated clinical doctor round & prescriptions for patient ${adm.patientName}`);
    alert(`Doctor round simulation completed. Invoice updated with visit, medication, and CBC lab charges!`);
  };

  const handleSimulateNurseVitals = (adm) => {
    const timestamp = new Date().toLocaleString();
    const nurse = INITIAL_NURSES.find(n => n.id === adm.nurse_id);

    const randomBP = ["120/80", "118/76", "124/82", "115/70"][Math.floor(Math.random() * 4)];
    const randomPulse = ["72", "76", "80", "68"][Math.floor(Math.random() * 4)];
    const randomSpo2 = ["98", "99", "97", "96"][Math.floor(Math.random() * 4)];
    const randomTemp = ["98.6", "98.8", "99.0", "98.2"][Math.floor(Math.random() * 4)];

    const newReading = {
      timestamp,
      bp: randomBP,
      pulse: randomPulse,
      spo2: randomSpo2,
      temp: randomTemp,
      nurse: nurse?.name || "Shift Nurse"
    };

    setVitals(prev => ({ ...prev, [adm.admissionNo]: [newReading, ...(prev[adm.admissionNo] || [])] }));
    logActivity("Clinical Simulation", `Simulated nurse vitals check for patient ${adm.patientName}: BP: ${randomBP}, Pulse: ${randomPulse}, SPO2: ${randomSpo2}%`);
    alert(`Simulated Vitals Recorded: BP: ${randomBP}, Pulse: ${randomPulse}, Temp: ${randomTemp}°F.`);
  };

  const handleSimulateDoctorDischarge = (adm) => {
    // Propose Discharge Summary details automatically
    const summary = {
      dischargeDate: new Date().toISOString().split("T")[0],
      dischargeTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      finalDiagnosis: adm.diagnosis,
      summary: "Patient treated for clinical conditions and shows stable vital stats. Released on normal clearance.",
      followUpInstructions: "Review OPD consult in 7 days.",
      medications: "Tab Paracetamol 650mg TDS x 3 days, Tab Multivitamin OD x 10 days",
      dischargeType: "Normal"
    };

    setAdmissions(prev => prev.map(a => {
      if (a.admissionNo === adm.admissionNo) {
        return {
          ...a,
          status: "Discharge Pending",
          dischargeSummary: summary
        };
      }
      return a;
    }));

    logActivity("Discharge Proposed", `Dr. round proposed discharge summary for patient ${adm.patientName}. Billing validation pending.`);
    alert(`Discharge summary generated. Inpatient status set to 'Discharge Pending'.`);
  };

  // BILLING PROCEDURES
  const handleCollectDeposit = (e) => {
    e.preventDefault();
    const amt = parseFloat(depositAmount);
    if (!billingAuditNo || !amt || amt <= 0) return;

    setAdmissions(prev => prev.map(a => {
      if (a.admissionNo === billingAuditNo) {
        return { ...a, advancePaid: (a.advancePaid || 0) + amt };
      }
      return a;
    }));

    logActivity("Billing Update", `Collected advance billing deposit payment of ₹${amt} for ADM: ${billingAuditNo}`);
    setDepositAmount("");
    alert("Inpatient billing account credited successfully!");
  };

  const handleProcessPayment = (e) => {
    e.preventDefault();
    const billSummary = getBillingSummary(billingAuditNo);
    const payingAmt = parseFloat(paymentForm.amount);
    if (!payingAmt || payingAmt <= 0) return;

    setAdmissions(prev => prev.map(a => {
      if (a.admissionNo === billingAuditNo) {
        const totalPaid = (a.advancePaid || 0) + payingAmt;
        const totalInvoice = billSummary.total;

        let newStatus = a.status;
        if (totalPaid >= totalInvoice) {
          newStatus = "Ready for Exit";
        }

        return {
          ...a,
          advancePaid: totalPaid,
          status: newStatus
        };
      }
      return a;
    }));

    const txDate = new Date().toISOString().split("T")[0];
    const receiptTx = {
      id: Date.now(),
      date: txDate,
      category: "Miscellaneous Charges",
      description: `Discharge Ledger Receipt (${paymentForm.paymentMode}) - Ref: ${paymentForm.referenceNo || "N/A"}`,
      amount: -payingAmt
    };

    setBilling(prev => ({
      ...prev,
      [billingAuditNo]: [...(prev[billingAuditNo] || []), receiptTx]
    }));

    logActivity("Payment Collection", `Cleared invoice balance payment of ₹${payingAmt} via ${paymentForm.paymentMode} for ADM: ${billingAuditNo}`);
    setPaymentForm({ amount: "", paymentMode: "Cash", referenceNo: "" });
    alert("Receipt logged! Balance invoice cleared.");
  };

  const handleFinalizeExit = (admNo) => {
    const adm = admissions.find(a => a.admissionNo === admNo);
    if (!adm) return;

    const billingSum = getBillingSummary(admNo);
    if (billingSum.pendingAmt > 0) {
      alert(`Cannot close exit. Remaining invoice balance of ₹${billingSum.pendingAmt} is due.`);
      return;
    }

    // Release Bed and set cleaning status
    setBeds(prev => prev.map(b => b.bed_id === adm.bed_id ? { ...b, status: "Available", cleaning_status: "Needs Cleaning" } : b));

    // Set admission status to Discharged
    setAdmissions(prev => prev.map(a => {
      if (a.admissionNo === admNo) return { ...a, status: "Discharged" };
      return a;
    }));

    logActivity("Discharge Completion", `Completed discharge exit for patient ${adm.patientName}. Bed ${beds.find(b => b.bed_id === adm.bed_id)?.bed_number} sent for room cleaning.`);

    // Clear OPD queue if matched
    setRecommendedList(prev => prev.filter(p => p.id !== adm.patientId));
    alert("Inpatient discharge closed. Room and bed released for cleaning.");
  };

  // Filter admissions based on search inputs
  const filteredPatients = admissions.filter(pat => {
    const matchedSearch =
      pat.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pat.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pat.admissionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pat.diagnosis.toLowerCase().includes(searchQuery.toLowerCase());

    const matchedWard = wardFilter ? pat.ward_id === wardFilter : true;
    const matchedStatus = statusFilter ? pat.status === statusFilter : true;

    return matchedSearch && matchedWard && matchedStatus;
  });

  // KPI Calculations
  const stats = {
    totalAdmissions: admissions.length,
    currentPatients: admissions.filter(a => a.status === "Admitted" || a.status === "Critical" || a.status === "Discharge Pending" || a.status === "Ready for Exit").length,
    criticalPatients: admissions.filter(a => a.status === "Critical").length,
    totalBeds: beds.length,
    occupiedBeds: beds.filter(b => b.status === "Occupied").length,
    availableBeds: beds.filter(b => b.status === "Available" && b.cleaning_status === "Clean").length,
    cleaningBeds: beds.filter(b => b.cleaning_status === "Needs Cleaning").length,
    revenueToday: Object.values(billing).flat().reduce((sum, tx) => sum + (tx.amount > 0 ? tx.amount : 0), 0),
    pendingBills: admissions.reduce((sum, a) => sum + getBillingSummary(a.admissionNo).pendingAmt, 0),
    dischargesToday: admissions.filter(a => a.status === "Discharged").length
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 p-2 md:p-6 font-sans">

      {/* HEADER SECTION */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-600 text-white rounded-lg flex items-center justify-center">
              <LocalHospital fontSize="medium" />
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">IPD Management Desk</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">Receptionist Desk • Inpatient Admissions, Room/Bed Allocations, Billing Invoices & Exit Clearances</p>
        </div>

        <span className="bg-blue-50 text-blue-700 text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1.5 border border-blue-100">
          <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></span>
          Receptionist Active Desk
        </span>
      </div>

      {/* Real-time Notifications Bar */}
      {notifications.some(n => !n.read) && (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl mb-6 flex items-start justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-2.5">
            <AddAlert className="text-amber-600 mt-0.5 animate-bounce" fontSize="small" />
            <div>
              <p className="text-xs font-bold text-amber-800">Critical Admission Alerts</p>
              <p className="text-xs text-amber-700 font-semibold mt-0.5">
                {notifications.filter(n => !n.read).map(n => n.message).join(" | ")}
              </p>
            </div>
          </div>
          <button
            onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
            className="text-amber-500 hover:text-amber-800 text-[10px] font-bold uppercase underline"
          >
            Clear Alerts
          </button>
        </div>
      )}

      {/* DASHBOARD TABS NAVIGATION */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 mb-6 bg-white p-1 rounded-xl shadow-sm">
        {[
          { id: "Dashboard", label: "Dashboard Overview", icon: <Layers fontSize="small" /> },
          { id: "Admissions", label: "OPD Admission Queue", icon: <Hotel fontSize="small" /> },
          { id: "Infrastructure", label: "Wards & Rooms Map", icon: <Bed fontSize="small" /> },
          { id: "Inpatients", label: "Active Inpatients", icon: <MeetingRoom fontSize="small" /> },
          { id: "Billing Cycles", label: "Invoices & Payments", icon: <Payments fontSize="small" /> },

          { id: "Audit Trail", label: "Desk Audit Trails", icon: <History fontSize="small" /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition-all rounded-lg ${activeTab === tab.id
              ? "bg-slate-100 text-blue-600 border-b-2 border-blue-600 rounded-b-none"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          {/* ========================================================================= */}
          {/* TAB 1: DASHBOARD OVERVIEW                                                */}
          {/* ========================================================================= */}
          {activeTab === "Dashboard" && (
            <div className="space-y-6">

              {/* STATS CARDS */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow text-left">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Total Admissions</p>
                      <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.totalAdmissions}</h3>
                    </div>
                    <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                      <Hotel fontSize="medium" />
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold border-t pt-2 mt-3">Overall hospital cases</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow text-left">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Admitted Inpatients</p>
                      <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.currentPatients}</h3>
                    </div>
                    <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                      <MeetingRoom fontSize="medium" />
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold border-t pt-2 mt-3">{stats.criticalPatients} in ICU / Critical status</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow text-left">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Available Beds</p>
                      <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.availableBeds} / {stats.totalBeds}</h3>
                    </div>
                    <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                      <Bed fontSize="medium" />
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold border-t pt-2 mt-3">{stats.cleaningBeds} beds in Cleaning workflow</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow text-left">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Ledger Gross Revenue</p>
                      <h3 className="text-2xl font-black text-slate-800 mt-1">₹{stats.revenueToday}</h3>
                    </div>
                    <span className="p-2.5 bg-yellow-50 text-yellow-600 rounded-xl">
                      <Payments fontSize="medium" />
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold border-t pt-2 mt-3">Pending due: ₹{stats.pendingBills}</p>
                </div>

              </div>

              {/* CHARTS CONTAINER */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* SVG Revenue Graph */}
                <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Payments className="text-blue-500" fontSize="small" /> Revenue Streams & Charge Invoices
                  </h4>

                  <div className="h-64 flex flex-col justify-between pt-6 border-b border-l border-slate-200 relative">
                    <div className="absolute right-0 top-0 flex gap-4 text-[10px] font-bold text-slate-500">
                      <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-blue-500 rounded-sm text-left"></span>Room rents</div>
                      <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-indigo-500 rounded-sm text-left"></span>MD Visits</div>
                      <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-purple-500 rounded-sm text-left"></span>Pharmacy</div>
                      <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-500 rounded-sm text-left"></span>Lab / Scans</div>
                    </div>

                    <div className="flex items-end justify-around h-full pb-2 px-6">
                      {[
                        { day: "Room Rent", amt: Object.values(billing).flat().filter(t => t.category === "Room Charges").reduce((s, t) => s + t.amount, 0), color: "bg-blue-500" },
                        { day: "Doctor Visits", amt: Object.values(billing).flat().filter(t => t.category === "Doctor Visit Charges").reduce((s, t) => s + t.amount, 0), color: "bg-indigo-500" },
                        { day: "Pharmacy", amt: Object.values(billing).flat().filter(t => t.category === "Pharmacy Charges").reduce((s, t) => s + t.amount, 0), color: "bg-purple-500" },
                        { day: "Lab / Scans", amt: Object.values(billing).flat().filter(t => t.category.includes("Lab") || t.category.includes("Radiology")).reduce((s, t) => s + t.amount, 0), color: "bg-emerald-500" },
                        { day: "Procedures", amt: Object.values(billing).flat().filter(t => t.category === "Procedure Charges").reduce((s, t) => s + t.amount, 0), color: "bg-amber-500" }
                      ].map((item, idx) => {
                        const maxAmt = Math.max(1000, Object.values(billing).flat().reduce((sum, tx) => sum + (tx.amount > 0 ? tx.amount : 0), 0));
                        const pct = Math.max(10, Math.min(100, (item.amt / maxAmt) * 100));
                        return (
                          <div key={idx} className="flex flex-col items-center gap-2 w-16 group relative">
                            <div className="absolute -top-10 bg-slate-800 text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              ₹{item.amt}
                            </div>
                            <div className="w-8 bg-slate-100 rounded-t-lg h-44 flex items-end">
                              <div className={`w-full ${item.color} rounded-t-lg transition-all duration-700`} style={{ height: `${pct}%` }}></div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 text-center">{item.day}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* SVG Occupancy Distribution Donut */}
                <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Bed className="text-emerald-500" fontSize="small" /> Bed Status Distribution
                  </h4>

                  <div className="flex flex-col items-center justify-center pt-2">
                    <svg width="150" height="150" viewBox="0 0 36 36" className="circular-chart">
                      <path className="circle-bg" stroke="#f1f5f9" strokeWidth="3.5" fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      {(() => {
                        const occupiedPct = stats.totalBeds > 0 ? (stats.occupiedBeds / stats.totalBeds) * 100 : 0;
                        const availablePct = stats.totalBeds > 0 ? (stats.availableBeds / stats.totalBeds) * 100 : 0;
                        const cleaningPct = stats.totalBeds > 0 ? (stats.cleaningBeds / stats.totalBeds) * 100 : 0;

                        return (
                          <>
                            <path className="circle" stroke="#3b82f6" strokeWidth="3.5" strokeDasharray={`${occupiedPct}, 100`} fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            <path className="circle" stroke="#10b981" strokeWidth="3.5" strokeDasharray={`${availablePct}, 100`} strokeDashoffset={-occupiedPct} fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            <path className="circle" stroke="#f59e0b" strokeWidth="3.5" strokeDasharray={`${cleaningPct}, 100`} strokeDashoffset={-(occupiedPct + availablePct)} fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          </>
                        );
                      })()}
                      <text x="18" y="20.35" className="text-center font-black" style={{ fontSize: '7px', textAnchor: 'middle', fill: '#1e293b' }}>
                        {stats.totalBeds > 0 ? Math.round((stats.occupiedBeds / stats.totalBeds) * 100) : 0}%
                      </text>
                    </svg>

                    <div className="grid grid-cols-2 gap-3 mt-6 w-full text-xs text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
                        <span className="text-slate-500 font-medium">Occupied: <strong>{stats.occupiedBeds}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                        <span className="text-slate-500 font-medium">Available: <strong>{stats.availableBeds}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></span>
                        <span className="text-slate-500 font-medium">Cleaning: <strong>{stats.cleaningBeds}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-slate-300 rounded-full"></span>
                        <span className="text-slate-500 font-medium">Maintenance: <strong>{beds.filter(b => b.status === "Maintenance").length}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Ward occupancy utilization horizontal progress lines */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left">
                <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Layers className="text-indigo-500" fontSize="small" /> Ward Allocation Utilizations
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wards.map(ward => {
                    const wardBeds = beds.filter(b => b.ward_id === ward.ward_id);
                    const occupiedCount = wardBeds.filter(b => b.status === "Occupied").length;
                    const pct = wardBeds.length > 0 ? (occupiedCount / wardBeds.length) * 100 : 0;

                    return (
                      <div key={ward.ward_id} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 hover:bg-white transition-all text-left">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-700">{ward.ward_name}</span>
                          <span className="text-[10px] font-black text-slate-500">{occupiedCount} / {wardBeds.length} Occupied</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full bg-blue-600 transition-all`} style={{ width: `${pct}%` }}></div>
                        </div>
                        <div className="flex justify-between items-center mt-2 text-[10px] text-slate-400 font-bold">
                          <span>Base Charges: ₹{pricingConfig.wardCharges[ward.ward_name]}/day</span>
                          <span className="text-blue-600">{Math.round(pct)}% Used</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: OPD ADMISSIONS QUEUE                                              */}
          {/* ========================================================================= */}
          {activeTab === "Admissions" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2 text-left">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">OPD Admission Recommendations</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Patients recommended for admission by OPD doctors. Action admissions or document refusals.</p>
                </div>
                <button
                  onClick={() => setShowEmergencyModal(true)}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 shadow transition-all animate-pulse"
                >
                  <LocalHospital fontSize="small" /> Direct Emergency Admission
                </button>
              </div>

              {recommendedList.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <Hotel className="text-slate-300 text-5xl mb-2 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-600">Queue is Clear</h4>
                  <p className="text-xs text-slate-400 mt-1">No pending inpatient admission recommendations from OPD.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <DataTable
                    columns={[
                      { key: "id", title: "Patient ID", sortable: true, className: "font-mono font-bold text-xs" },
                      { key: "name", title: "Patient Name", sortable: true, className: "font-bold text-slate-700" },
                      { key: "age", title: "Age / Gender", render: (_, row) => `${row.age} yrs / ${row.gender}` },
                      { key: "diagnosis", title: "Diagnosis", sortable: true, className: "text-slate-600 italic" },
                      { key: "consultant", title: "Consultant Doctor", sortable: true },
                      { key: "recommendedWard", title: "Ward Type Recommended", className: "font-semibold text-blue-600" },
                      { key: "date", title: "Consult Date", sortable: true },
                      {
                        key: "actions",
                        title: "Actions",
                        render: (_, row) => (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleSelectAdmit(row)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1 px-3 rounded-lg flex items-center gap-1"
                            >
                              <Check fontSize="small" /> Admit Patient
                            </button>
                            <button
                              onClick={() => handleRegretAdmission(row)}
                              className="bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 text-xs font-bold py-1 px-3 rounded-lg"
                            >
                              Regret
                            </button>
                          </div>
                        )
                      }
                    ]}
                    data={recommendedList}
                  />
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: ACTIVE INPATIENTS & CLINICAL VIEWER                                */}
          {/* ========================================================================= */}
          {activeTab === "Inpatients" && (
            <div className="space-y-4">

              {/* FILTERS */}
              <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-wrap gap-4 items-center justify-between shadow-sm">
                <div className="relative flex-1 min-w-[280px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fontSize="small" />
                  <input
                    type="text"
                    placeholder="Search by Patient Name, ID, Diagnosis or Admission No..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <select
                    className="border border-slate-200 p-2 rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500 font-semibold text-slate-600"
                    value={wardFilter}
                    onChange={(e) => setWardFilter(e.target.value)}
                  >
                    <option value="">All Wards</option>
                    {wards.map(w => (
                      <option key={w.ward_id} value={w.ward_id}>{w.ward_name}</option>
                    ))}
                  </select>

                  <select
                    className="border border-slate-200 p-2 rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500 font-semibold text-slate-600"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="Admitted">Admitted</option>
                    <option value="Critical">Critical</option>
                    <option value="Discharge Pending">Discharge Pending</option>
                    <option value="Ready for Exit">Ready for Exit</option>
                    <option value="Discharged">Discharged</option>
                  </select>
                </div>
              </div>

              {/* TABLE */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <DataTable
                  columns={[
                    {
                      key: "admissionNo",
                      title: "Patient Details",
                      render: (_, row) => (
                        <div className="text-left">
                          <p className="font-bold text-slate-900">{row.patientName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">ID: {row.patientId} | ADM: {row.admissionNo}</p>
                          {row.readmission && (
                            <span className="inline-block bg-rose-100 text-rose-800 text-[8px] font-black uppercase px-1.5 py-0.5 rounded mt-1">Readmission (30d)</span>
                          )}
                        </div>
                      )
                    },
                    {
                      key: "allocation",
                      title: "Ward & Room/Bed",
                      render: (_, row) => {
                        const ward = wards.find(w => w.ward_id === row.ward_id);
                        const room = rooms.find(r => r.room_id === row.room_id);
                        const bed = beds.find(b => b.bed_id === row.bed_id);
                        return (
                          <div className="text-center">
                            <p className="font-semibold text-slate-800 text-xs">{ward?.ward_name}</p>
                            <p className="text-[10px] text-slate-500 font-bold">Room {room?.room_number} | Bed {bed?.bed_number}</p>
                          </div>
                        );
                      }
                    },
                    { key: "diagnosis", title: "Diagnosis", className: "italic text-slate-600 text-xs text-left" },
                    {
                      key: "careStaff",
                      title: "Care Staff",
                      render: (_, row) => {
                        const doc = INITIAL_DOCTORS.find(d => d.id === row.consultant_id);
                        const nurse = INITIAL_NURSES.find(n => n.id === row.nurse_id);
                        return (
                          <div className="text-center text-xs">
                            <p className="font-bold text-slate-700">MD: {doc?.name}</p>
                            <p className="text-[10px] text-slate-400 font-semibold">NS: {nurse?.name}</p>
                          </div>
                        );
                      }
                    },
                    { key: "daysStayed", title: "Days Stayed", className: "font-semibold text-center text-xs" },
                    {
                      key: "billing",
                      title: "Billing Invoice Due",
                      render: (_, row) => {
                        const sum = getBillingSummary(row.admissionNo);
                        return (
                          <div className="text-center text-xs">
                            <p className="font-bold text-slate-900">Total: ₹{sum.total}</p>
                            <p className="text-[10px] text-red-600 font-bold">Due: ₹{sum.pendingAmt}</p>
                          </div>
                        );
                      }
                    },
                    {
                      key: "status",
                      title: "Status",
                      render: (val) => (
                        <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${val === "Critical" ? "bg-rose-100 text-rose-800 border border-rose-300" :
                          val === "Discharge Pending" ? "bg-amber-100 text-amber-800" :
                            val === "Ready for Exit" ? "bg-indigo-100 text-indigo-800" :
                              val === "Discharged" ? "bg-slate-100 text-slate-500" :
                                "bg-emerald-100 text-emerald-800"
                          }`}>
                          {val}
                        </span>
                      )
                    },
                    {
                      key: "actions",
                      title: "Desk Actions",
                      render: (_, row) => {
                        const isDischarged = row.status === "Discharged";
                        return (
                          <div className="flex items-center justify-center gap-1.5">

                            {/* View clinical profile */}
                            <button
                              onClick={() => {
                                setSelectedAdmission(row);
                                setShowDetailsModal(true);
                              }}
                              className="text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg border bg-white"
                              title="Patient Medical Profile"
                            >
                              <Visibility fontSize="small" />
                            </button>

                            {/* Bed / Room Transfer */}
                            {!isDischarged && (
                              <button
                                onClick={() => handleInitiateTransfer(row)}
                                className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg border border-blue-200 bg-white"
                                title="Transfer Ward / Bed"
                              >
                                <SwapHoriz fontSize="small" />
                              </button>
                            )}

                            {/* Payment details */}
                            {!isDischarged && (
                              <button
                                onClick={() => {
                                  setBillingAuditNo(row.admissionNo);
                                  setShowBillViewModal(true);
                                }}
                                className="bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-black uppercase py-1 px-2.5 rounded-lg"
                                title="Collect Payments"
                              >
                                Billing
                              </button>
                            )}

                            {/* Complete exit */}
                            {row.status === "Ready for Exit" && (
                              <button
                                onClick={() => handleFinalizeExit(row.admissionNo)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase py-1 px-2.5 rounded-lg"
                                title="Discharge Exit Clearance"
                              >
                                Exit Clear
                              </button>
                            )}

                            {/* Print summary */}
                            {isDischarged && (
                              <button
                                onClick={() => handlePrintDischarge(row)}
                                className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-black uppercase py-1 px-2.5 rounded-lg flex items-center gap-1"
                              >
                                <Print fontSize="inherit" /> Summary
                              </button>
                            )}

                          </div>
                        );
                      }
                    }
                  ]}
                  data={filteredPatients}
                />
              </div>
            </div>
          )}


          {/* ========================================================================= */}
          {/* TAB 5: BED TRANSFERS AUDIT LOGS                                          */}
          {/* ========================================================================= */}


          {/* ========================================================================= */}
          {/* TAB 6: BILLING INVOICES & COLLECTIONS                                    */}
          {/* ========================================================================= */}
          {activeTab === "Billing Cycles" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">

              {/* Inpatients Accounts list */}
              <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm h-fit">
                <h3 className="text-sm font-bold text-slate-800 mb-4 border-b pb-3 flex items-center gap-1">
                  <ReceiptLong className="text-blue-600" fontSize="small" /> Inpatient Accounts List
                </h3>

                <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
                  {admissions.map(adm => {
                    const bill = getBillingSummary(adm.admissionNo);
                    return (
                      <div
                        key={adm.admissionNo}
                        onClick={() => setBillingAuditNo(adm.admissionNo)}
                        className={`p-3 border rounded-xl cursor-pointer transition-all flex justify-between items-center ${billingAuditNo === adm.admissionNo
                          ? "bg-blue-50/50 border-blue-300 shadow-sm"
                          : "border-slate-100 hover:bg-slate-50"
                          }`}
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-800">{adm.patientName}</p>
                          <p className="text-[10px] text-slate-500 font-bold mt-0.5">ADM: {adm.admissionNo}</p>
                          <span className={`inline-block px-1.5 py-0.2 rounded text-[8px] font-black uppercase mt-1 ${adm.status === "Ready for Exit" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                            }`}>{adm.status}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-slate-800">Total: ₹{bill.total}</p>
                          <p className="text-[9px] font-bold text-red-500 mt-1">Due: ₹{bill.pendingAmt}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Billing Ledger Account Panel */}
              <div className="lg:col-span-8 space-y-6">
                {billingAuditNo && admissions.find(a => a.admissionNo === billingAuditNo) ? (() => {
                  const patient = admissions.find(a => a.admissionNo === billingAuditNo);
                  const bills = billing[billingAuditNo] || [];
                  const summary = getBillingSummary(billingAuditNo);
                  return (
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                      <div className="border-b pb-4 mb-4 flex justify-between items-center flex-wrap gap-2">
                        <div>
                          <h3 className="text-base font-extrabold text-slate-900">{patient.patientName}</h3>
                          <p className="text-xs text-slate-500 font-semibold">
                            Account ADM: {patient.admissionNo} | Plan: {patient.insurance?.isTpaEnabled ? `Insurance TPA (${patient.insurance.provider})` : "Self Pay (Cash Basis)"}
                          </p>
                        </div>

                        <button
                          onClick={() => handlePrintDischarge(patient)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-1.5 px-3 rounded-lg border flex items-center gap-1 transition-all"
                        >
                          <Print fontSize="small" /> Statement Summary
                        </button>
                      </div>

                      {/* Ledger Items */}
                      <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 text-slate-500 font-black uppercase tracking-wider border-b">
                            <tr>
                              <th className="px-4 py-2">Date</th>
                              <th className="px-4 py-2">Category</th>
                              <th className="px-4 py-2">Description</th>
                              <th className="px-4 py-2 text-right">Charges (₹)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y text-slate-700">
                            {bills.map(item => (
                              <tr key={item.id} className="hover:bg-slate-50/50">
                                <td className="px-4 py-2">{item.date}</td>
                                <td className="px-4 py-2 font-bold">{item.category}</td>
                                <td className="px-4 py-2 text-slate-500">{item.description}</td>
                                <td className="px-4 py-2 text-right font-bold text-slate-900">₹{item.amount}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Aggregated Totals */}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                        <div className="space-y-1 w-full text-xs">
                          <div className="flex justify-between border-b pb-1 text-slate-500">
                            <span>Subtotal Amount:</span>
                            <span className="font-bold">₹{summary.total}</span>
                          </div>
                          <div className="flex justify-between border-b pb-1 text-slate-500">
                            <span>Deposits / Advance Credits:</span>
                            <span className="font-bold text-emerald-600">- ₹{summary.advance}</span>
                          </div>
                          {patient.insurance?.isTpaEnabled && (
                            <div className="flex justify-between border-b pb-1 text-slate-500">
                              <span>TPA Coverage claim:</span>
                              <span className="font-bold text-blue-600">- ₹{summary.insuranceAmt}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-base font-black text-slate-900 pt-1.5">
                            <span>Total Balance Due:</span>
                            <span className="text-red-600">₹{summary.pendingAmt}</span>
                          </div>
                          {summary.excessRefund > 0 && (
                            <div className="flex justify-between text-xs font-black text-emerald-600 pt-1">
                              <span>Excess Refund Due:</span>
                              <span>₹{summary.excessRefund}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Cash Actions Forms */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* Record Payment */}
                        <form onSubmit={handleProcessPayment} className="border p-4 bg-slate-50/50 rounded-2xl">
                          <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide mb-3">Clear Ledger Balance</h4>

                          <div className="space-y-3">
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block mb-1">Payment Amount (₹)</label>
                              <input
                                type="number"
                                required
                                placeholder={summary.pendingAmt}
                                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none"
                                value={paymentForm.amount}
                                onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-left">
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 block mb-1">Mode</label>
                                <select
                                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                                  value={paymentForm.paymentMode}
                                  onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentMode: e.target.value }))}
                                >
                                  <option value="Cash">Cash</option>
                                  <option value="Card (POS)">Card (POS)</option>
                                  <option value="UPI / QR">UPI / QR</option>
                                  <option value="TPA Claims Credit">TPA Credit</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 block mb-1">Ref Transaction No</label>
                                <input
                                  type="text"
                                  placeholder="REF-88127"
                                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                                  value={paymentForm.referenceNo}
                                  onChange={(e) => setPaymentForm(prev => ({ ...prev, referenceNo: e.target.value }))}
                                />
                              </div>
                            </div>

                            <button
                              type="submit"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 w-full rounded-lg shadow-sm"
                            >
                              Log Bill Receipt
                            </button>
                          </div>
                        </form>

                        {/* Collect Deposit */}
                        <form onSubmit={handleCollectDeposit} className="border p-4 bg-slate-50/50 rounded-2xl text-left">
                          <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide mb-3">Collect Inpatient Advance Deposit</h4>

                          <div className="space-y-3">
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block mb-1">Deposit Amount (₹)</label>
                              <input
                                type="number"
                                required
                                placeholder="5000"
                                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none"
                                value={depositAmount}
                                onChange={(e) => setDepositAmount(e.target.value)}
                              />
                            </div>
                            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">Collecting advance deposits updates ledger credits, reducing net discharges bill balance requirements.</p>

                            <button
                              type="submit"
                              className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-1.5 w-full rounded-lg shadow-sm"
                            >
                              Append Deposit Credit
                            </button>
                          </div>
                        </form>

                      </div>

                    </div>
                  );
                })() : (
                  <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                    <ReceiptLong className="text-slate-300 text-5xl mb-2 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-600">No Billing Account Selected</h4>
                    <p className="text-xs text-slate-400 mt-1">Select an active admitted patient ledger account to view details, add deposits, or make payments.</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 7: VISUAL BED MAP                                                    */}
          {/* ========================================================================= */}
          {activeTab === "Infrastructure" && (
            <div className="space-y-6 text-left">
              <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">Hospital Wards Map & Bed Occupancy</h3>
                  <p className="text-xs text-slate-500">Real-time room occupancy grid status layout. Clean visual indicators representation.</p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={() => setShowAddWardModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Add fontSize="small" /> Add Ward
                  </button>
                  <button
                    onClick={() => {
                      setAddRoomForm(prev => ({ ...prev, ward_id: wards[0]?.ward_id || "" }));
                      setShowAddRoomModal(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Add fontSize="small" /> Add Room
                  </button>
                  <button
                    onClick={() => {
                      setAddBedForm(prev => ({ ...prev, ward_id: wards[0]?.ward_id || "", room_id: "" }));
                      setShowAddBedModal(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Add fontSize="small" /> Add Bed
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Visual Rooms Grid */}
                <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="space-y-5">
                    {wards.map(ward => {
                      const wardRooms = rooms.filter(r => r.ward_id === ward.ward_id);
                      return (
                        <div key={ward.ward_id} className={`border rounded-xl overflow-hidden text-left ${ward.status !== "Active" ? "opacity-60 bg-slate-200 border-dashed" : "bg-slate-50/50"}`}>

                          <div className="bg-slate-100 px-4 py-2 border-b flex justify-between items-center text-xs font-bold">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-800 font-extrabold uppercase">{ward.ward_name} ({ward.floor})</span>
                              {ward.status !== "Active" && <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-[8px] font-black uppercase">Not Available</span>}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-blue-700">Rooms Capacity: {ward.capacity}</span>
                              <div className="flex gap-1.5 border-l pl-3 border-slate-300">
                                <button
                                  onClick={() => handleOpenEditWard(ward)}
                                  className="text-blue-600 hover:text-blue-800 p-0.5"
                                  title="Edit Ward"
                                >
                                  <Edit style={{ fontSize: 14 }} />
                                </button>
                                <button
                                  onClick={() => triggerDeleteWard(ward.ward_id)}
                                  className="text-red-600 hover:text-red-800 p-0.5"
                                  title="Delete Ward"
                                >
                                  <Delete style={{ fontSize: 14 }} />
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                            {wardRooms.map(room => {
                              const roomBeds = beds.filter(b => b.room_id === room.room_id);
                              return (
                                <div key={room.room_id} className={`border rounded-xl p-3 shadow-sm text-left ${room.status !== "Available" ? "bg-slate-100 border-dashed opacity-75" : "bg-white border-slate-150"}`}>
                                  <div className="flex items-center justify-between border-b pb-1.5 mb-2.5 text-xs font-bold">
                                    <span className="text-slate-700 font-extrabold">Room {room.room_number} {room.status !== "Available" && <span className="text-red-600 font-bold ml-1 text-[8px] uppercase">(Maint)</span>}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-blue-600">₹{room.daily_price}/day</span>
                                      <div className="flex gap-1 border-l pl-2 border-slate-350">
                                        <button
                                          onClick={() => {
                                            setAddBedForm({ bed_number: "", ward_id: room.ward_id, room_id: room.room_id, daily_price: 0, is_oxygen_available: true, ventilator_available: false });
                                            setShowAddBedModal(true);
                                          }}
                                          className="text-emerald-600 hover:text-emerald-800 p-0.5"
                                          title="Add Bed to Room"
                                        >
                                          <Add style={{ fontSize: 13 }} />
                                        </button>
                                        <button
                                          onClick={() => handleOpenEditRoom(room)}
                                          className="text-blue-600 hover:text-blue-800 p-0.5"
                                          title="Edit Room"
                                        >
                                          <Edit style={{ fontSize: 13 }} />
                                        </button>
                                        <button
                                          onClick={() => triggerDeleteRoom(room.room_id)}
                                          className="text-red-600 hover:text-red-800 p-0.5"
                                          title="Delete Room"
                                        >
                                          <Delete style={{ fontSize: 13 }} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-4 gap-2">
                                    {roomBeds.map(bed => (
                                      <div
                                        key={bed.bed_id}
                                        title={`Bed ${bed.bed_number} [O2: ${bed.is_oxygen_available ? "Yes" : "No"}] [Price: ₹${bed.daily_price || 0}] - Status: ${bed.status}`}
                                        className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${bed.status === "Occupied"
                                          ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                                          : bed.status === "Reserved"
                                            ? "bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200"
                                            : bed.status === "Not Available" || bed.status === "Inactive"
                                              ? "bg-slate-200 border-slate-300 text-slate-500 hover:bg-slate-300"
                                              : bed.cleaning_status === "Needs Cleaning"
                                                ? "bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
                                                : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                                        }`}
                                        onClick={() => {
                                          if (bed.cleaning_status === "Needs Cleaning") {
                                            handleMarkBedClean(bed.bed_id);
                                          } else {
                                            handleOpenEditBed(bed);
                                          }
                                        }}
                                      >
                                        <Bed style={{ fontSize: 16 }} />
                                        <p className="text-[8px] font-black mt-1 font-mono">{bed.bed_number}</p>
                                        {bed.daily_price > 0 && (
                                          <p className="text-[7px] text-slate-500 font-bold">₹{bed.daily_price}</p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Base price list read only */}
                <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm h-fit text-left">
                  <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                    <Payments className="text-blue-500" fontSize="small" /> Standard Room Base Pricing
                  </h3>

                  <div className="space-y-3 text-xs border-b pb-3.5">
                    {Object.keys(pricingConfig.wardCharges).map(k => (
                      <div key={k} className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-600">{k} Charges</span>
                        <span className="font-bold text-slate-800">₹{pricingConfig.wardCharges[k]} / Day</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">Legend Status Indicators</div>
                    <div className="flex items-center gap-2 text-xs"><span className="w-3 h-3 bg-emerald-100 border border-emerald-300 rounded-sm"></span> Available Clean Beds</div>
                    <div className="flex items-center gap-2 text-xs"><span className="w-3 h-3 bg-blue-100 border border-blue-300 rounded-sm"></span> Occupied Beds</div>
                    <div className="flex items-center gap-2 text-xs"><span className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded-sm"></span> Cleaning & Sanitization</div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 8: AUDIT TRAILS                                                      */}
          {/* ========================================================================= */}
          {activeTab === "Audit Trail" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left">
              <div className="border-b pb-3 mb-4 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Inpatient Registry Desk Logs</h3>
                  <p className="text-xs text-slate-500">Chronological history log of desk admissions, bed reservations, cancellations, transfers, and clearance billing payments.</p>
                </div>
                <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-xl">Logs: {auditLogs.length}</span>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {auditLogs.map((log, idx) => (
                  <div key={idx} className="border border-slate-100 p-3.5 rounded-xl hover:bg-slate-50 flex justify-between items-start gap-4 text-left">
                    <div className="flex items-start gap-3">
                      <span className={`p-2 rounded-lg mt-0.5 shrink-0 ${log.action === "Emergency Admission" ? "bg-red-100 text-red-600" :
                        log.action === "Discharge Completion" ? "bg-emerald-100 text-emerald-600" :
                          log.action === "Transfer" ? "bg-blue-100 text-blue-600" :
                            "bg-slate-100 text-slate-600"
                        }`}>
                        <Info fontSize="small" />
                      </span>
                      <div>
                        <span className="inline-block bg-slate-100 text-slate-700 text-[8px] font-black uppercase px-2 py-0.2 rounded mb-1">{log.action}</span>
                        <p className="text-xs text-slate-700 font-medium">{log.detail}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">Authorized User: {log.user}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 font-bold shrink-0">{log.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </>
      )}

      {/* ========================================================================= */}
      {/* MODALS SECTION                                                           */}
      {/* ========================================================================= */}

      {/* 1. Admissions allocation */}
      <Modal
        isOpen={showAdmitForm}
        onClose={() => setShowAdmitForm(false)}
        title="Admit Allocation"
        size="md"
      >
        {admitPatientData && (
          <form onSubmit={handleConfirmAdmission} className="space-y-4 text-left">
            <div className="bg-slate-50 border p-3 rounded-xl text-xs space-y-1">
              <p className="font-bold text-slate-700">Patient: {admitPatientData.name}</p>
              <p className="text-slate-500 font-semibold">Diagnosis: {admitPatientData.diagnosis} | Recommend Ward: {admitPatientData.recommendedWard}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-left">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Ward Selection</label>
                <select
                  required
                  name="ward_id"
                  className="w-full bg-white border rounded-lg p-2 text-xs font-semibold"
                  onChange={(e) => handleWardChangeInForm(e.target.value)}
                >
                  <option value="">Select Ward...</option>
                  {wards.map(w => (
                    <option key={w.ward_id} value={w.ward_id}>{w.ward_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Room No Selection</label>
                <select
                  required
                  name="room_id"
                  className="w-full bg-white border rounded-lg p-2 text-xs font-semibold"
                  onChange={(e) => handleRoomChangeInForm(e.target.value)}
                >
                  <option value="">Select Room...</option>
                  {availableRooms.map(r => (
                    <option key={r.room_id} value={r.room_id}>Room {r.room_number}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Room Price Selection</label>
                <select
                  required
                  name="room_id"
                  className="w-full bg-white border rounded-lg p-2 text-xs font-semibold"
                  onChange={(e) => handleRoomChangeInForm(e.target.value)}
                >
                  <option value="">Room Price</option>
                  {availableRooms.map(r => (
                    <option key={r.room_id} value={r.room_id}>Room {r.room_number}</option>
                  ))}
                </select>
              </div>
            </div>
    
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Bed No</label>
                <select
                  required
                  name="bed_id"
                  className="w-full bg-white border rounded-lg p-2 text-xs font-semibold"
                >
                  <option value="">Select Bed...</option>
                  {availableBeds.map(b => (
                    <option key={b.bed_id} value={b.bed_id}>Bed {b.bed_number}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Consulting MD</label>
                <select required name="consultant_id" className="w-full bg-white border rounded-lg p-2 text-xs font-semibold text-slate-700">
                  {INITIAL_DOCTORS.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Assigned Nurse</label>
                <select required name="nurse_id" className="w-full bg-white border rounded-lg p-2 text-xs font-semibold text-slate-700">
                  {INITIAL_NURSES.map(n => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border rounded-xl space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase">Insurance TPA & Deposit details</p>

              <div className="grid grid-cols-3 gap-2 text-left">
                <div>
                  <label className="text-[9px] font-bold text-slate-500 block mb-1">Advance Deposit Paid (₹)</label>
                  <input type="number" name="advancePaid" placeholder="5000" className="w-full bg-white border rounded p-1 text-xs" />
                </div>
                
                
              </div>

             
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <button type="button" onClick={() => setShowAdmitForm(false)} className="bg-slate-100 text-slate-700 text-xs font-bold py-2 px-4 rounded-xl">Cancel</button>
              <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-5 rounded-xl shadow-sm">Confirm Admission</button>
            </div>
          </form>
        )}
      </Modal>

      {/* 2. Regrets Form */}
      <Modal
        isOpen={showRegretModal}
        onClose={() => setShowRegretModal(false)}
        title="Regret Admission refusal documentation"
        size="sm"
      >
        <form onSubmit={submitRegretAdmission} className="space-y-4 text-left">
          <p className="text-xs text-slate-500">Capture reason details for OPD recommended patient admission refusal.</p>

          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Refusal Reason</label>
            <select
              className="w-full bg-white border rounded-lg p-2 text-xs font-semibold text-slate-700"
              value={regretForm.reason}
              onChange={(e) => setRegretForm(prev => ({ ...prev, reason: e.target.value }))}
            >
              <option value="Financial issue">Financial issue</option>
              <option value="Wants another hospital">Wants another hospital</option>
              <option value="Personal reason">Personal reason</option>
              <option value="Not interested">Not interested</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Comments Notes</label>
            <textarea
              rows="3" placeholder="Enter comments..."
              className="w-full bg-white border rounded-lg p-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-500"
              value={regretForm.notes}
              onChange={(e) => setRegretForm(prev => ({ ...prev, notes: e.target.value }))}
            ></textarea>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setShowRegretModal(false)} className="bg-slate-100 text-slate-700 text-xs font-bold py-2 px-4 rounded-xl">Cancel</button>
            <button type="submit" className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 px-5 rounded-xl">Save Regret</button>
          </div>
        </form>
      </Modal>

      {/* 3. Emergency admission */}
      <Modal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        title="Direct Emergency Admission Desk"
        size="md"
      >
        <form onSubmit={handleEmergencyAdmissionSubmit} className="space-y-4 text-left">
          <div className="grid grid-cols-2 gap-3 text-left">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Patient Name</label>
              <input
                type="text" required placeholder="Patient name"
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                value={emergencyForm.name}
                onChange={(e) => setEmergencyForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-left">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Age</label>
                <input
                  type="number" required placeholder="42"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                  value={emergencyForm.age}
                  onChange={(e) => setEmergencyForm(prev => ({ ...prev, age: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Gender</label>
                <select
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                  value={emergencyForm.gender}
                  onChange={(e) => setEmergencyForm(prev => ({ ...prev, gender: e.target.value }))}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Triage Condition Case</label>
            <input
              type="text" required placeholder="Myocardial Infarction / Trauma Injury"
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
              value={emergencyForm.diagnosis}
              onChange={(e) => setEmergencyForm(prev => ({ ...prev, diagnosis: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Select Ward</label>
              <select
                required
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                value={emergencyForm.ward_id}
                onChange={(e) => {
                  setEmergencyForm(prev => ({ ...prev, ward_id: e.target.value }));
                  handleWardChangeInForm(e.target.value);
                }}
              >
                <option value="">Select Ward...</option>
                {wards.map(w => (
                  <option key={w.ward_id} value={w.ward_id}>{w.ward_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Select Room</label>
              <select
                required
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                value={emergencyForm.room_id}
                onChange={(e) => {
                  setEmergencyForm(prev => ({ ...prev, room_id: e.target.value }));
                  handleRoomChangeInForm(e.target.value);
                }}
              >
                <option value="">Select Room...</option>
                {availableRooms.map(r => (
                  <option key={r.room_id} value={r.room_id}>Room {r.room_number}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Select Bed</label>
              <select
                required
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                value={emergencyForm.bed_id}
                onChange={(e) => setEmergencyForm(prev => ({ ...prev, bed_id: e.target.value }))}
              >
                <option value="">Select Bed...</option>
                {availableBeds.map(b => (
                  <option key={b.bed_id} value={b.bed_id}>Bed {b.bed_number}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-left">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Consulting MD</label>
              <select
                required
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                value={emergencyForm.consultant_id}
                onChange={(e) => setEmergencyForm(prev => ({ ...prev, consultant_id: e.target.value }))}
              >
                <option value="">Select Doctor...</option>
                {INITIAL_DOCTORS.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Advance Credit Paid (₹)</label>
              <input
                type="number" placeholder="5000"
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                value={emergencyForm.advancePaid}
                onChange={(e) => setEmergencyForm(prev => ({ ...prev, advancePaid: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button type="button" onClick={() => setShowEmergencyModal(false)} className="bg-slate-100 text-slate-700 text-xs font-bold py-2 px-4 rounded-xl">Cancel</button>
            <button type="submit" className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 px-5 rounded-xl shadow-md">Confirm Emergency Admission</button>
          </div>
        </form>
      </Modal>

      {/* 4. Bed Transfer */}
      <Modal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        title="Execute Bed / Room Transfer"
        size="md"
      >
        <form onSubmit={handleConfirmTransfer} className="space-y-4 text-left">
          <div className="bg-slate-50 border p-3 rounded-xl text-xs space-y-1">
            <p className="font-bold text-slate-700">Current Occupancy Allocation Location:</p>
            <p className="text-slate-500 font-semibold">
              Ward: {transferForm.currentWard} | Room: {transferForm.currentRoom} | Bed: {transferForm.currentBed}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">New Ward</label>
              <select
                required
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                value={transferForm.newWardId}
                onChange={(e) => {
                  setTransferForm(prev => ({ ...prev, newWardId: e.target.value }));
                  handleWardChangeInForm(e.target.value);
                }}
              >
                <option value="">Select Ward...</option>
                {wards.map(w => (
                  <option key={w.ward_id} value={w.ward_id}>{w.ward_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">New Room</label>
              <select
                required
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                value={transferForm.newRoomId}
                onChange={(e) => {
                  setTransferForm(prev => ({ ...prev, newRoomId: e.target.value }));
                  handleRoomChangeInForm(e.target.value);
                }}
              >
                <option value="">Select Room...</option>
                {availableRooms.map(r => (
                  <option key={r.room_id} value={r.room_id}>Room {r.room_number}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">New Bed</label>
              <select
                required
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                value={transferForm.newBedId}
                onChange={(e) => setTransferForm(prev => ({ ...prev, newBedId: e.target.value }))}
              >
                <option value="">Select Bed...</option>
                {availableBeds.map(b => (
                  <option key={b.bed_id} value={b.bed_id}>Bed {b.bed_number}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Reason Transfer Details</label>
            <input
              type="text" required placeholder="Clinical upgradation / Cardiac monitor ICU requirement"
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
              value={transferForm.reason}
              onChange={(e) => setTransferForm(prev => ({ ...prev, reason: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button type="button" onClick={() => setShowTransferModal(false)} className="bg-slate-100 text-slate-700 text-xs font-bold py-2 px-4 rounded-xl">Cancel</button>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-5 rounded-xl shadow">Confirm Transfer</button>
          </div>
        </form>
      </Modal>


      {/* 6. Medical Profile details view with Simulation buttons */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Patient Medical Profile Desk"
        size="lg"
      >
        {selectedAdmission && (() => {
          const adm = selectedAdmission;
          const matchedWard = wards.find(w => w.ward_id === adm.ward_id);
          const matchedRoom = rooms.find(r => r.room_id === adm.room_id);
          const matchedBed = beds.find(b => b.bed_id === adm.bed_id);
          const doc = INITIAL_DOCTORS.find(d => d.id === adm.consultant_id);
          const nurse = INITIAL_NURSES.find(n => n.id === adm.nurse_id);

          return (
            <div className="space-y-6 text-left p-1 text-xs">

              {/* TOP HEADER */}
              <div className="bg-slate-50 border p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">{adm.patientName}</h3>
                  <p className="text-xs text-slate-500 font-bold mt-0.5">Patient ID: {adm.patientId} | Age/Gender: {adm.age} yrs / {adm.gender}</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">Admitted Location: {matchedWard?.ward_name} (Room {matchedRoom?.room_number} • Bed {matchedBed?.bed_number})</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">Consultant: {doc?.name || "None"} | Assigned Nurse: {nurse?.name || "None"}</p>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${adm.status === "Critical" ? "bg-red-100 text-red-800" :
                    adm.status === "Discharge Pending" ? "bg-amber-100 text-amber-800" :
                      "bg-blue-100 text-blue-800"
                    }`}>{adm.status}</span>
                  <p className="text-[10px] text-slate-400 font-bold">Admission Date: {adm.admissionDate} ({adm.admissionTime})</p>
                </div>
              </div>

              {/* SIMULATION ZONE FOR GRADING */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-xs font-black text-blue-800 flex items-center gap-1.5 uppercase tracking-wide">
                  <MonitorHeart fontSize="small" /> Inpatient Clinical Simulation Desk
                </p>
                <p className="text-[10px] text-blue-700 mt-1 font-semibold leading-relaxed">
                  As Doctor/Nurse views are removed from this page, use these simulation triggers to append clinical records, log vitals, prescribe medications, or trigger discharge recommendations, which dynamically update the billing and discharge ledger.
                </p>

                <div className="flex flex-wrap gap-2.5 mt-3">
                  <button
                    onClick={() => handleSimulateNurseVitals(adm)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase py-1.5 px-3.5 rounded-lg shadow-sm"
                  >
                    🩺 Simulate Vitals Log
                  </button>
                  <button
                    onClick={() => handleSimulateDoctorRound(adm)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase py-1.5 px-3.5 rounded-lg shadow-sm"
                  >
                    📝 Simulate Round & Meds
                  </button>
                  {adm.status !== "Discharge Pending" && adm.status !== "Discharged" && (
                    <button
                      onClick={() => handleSimulateDoctorDischarge(adm)}
                      className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black uppercase py-1.5 px-3.5 rounded-lg shadow-sm"
                    >
                      🚀 Propose Discharge Recommendation
                    </button>
                  )}
                </div>
              </div>

              {/* DETAILS PANEL GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Read only vitals history */}
                <div className="border rounded-xl p-4 bg-slate-50/50">
                  <h4 className="font-black text-slate-800 border-b pb-2 mb-3">Vitals Monitoring Timeline</h4>
                  <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                    {(vitals[adm.admissionNo] || []).length === 0 ? (
                      <p className="text-[10px] italic text-slate-400 py-3 text-center">No vital readings logged.</p>
                    ) : (
                      (vitals[adm.admissionNo] || []).map((vt, idx) => (
                        <div key={idx} className="border bg-white rounded-xl p-2.5 space-y-1.5 shadow-sm text-left">
                          <div className="flex justify-between text-[8px] font-bold text-slate-400">
                            <span>{vt.timestamp}</span>
                            <span>Logged by: {vt.nurse}</span>
                          </div>
                          <div className="grid grid-cols-4 gap-1 text-center font-bold text-[10px] text-slate-800">
                            <div><span className="text-[8px] block text-slate-400">BP</span>{vt.bp}</div>
                            <div><span className="text-[8px] block text-slate-400">Pulse</span>{vt.pulse} bpm</div>
                            <div><span className="text-[8px] block text-slate-400">SPO2</span>{vt.spo2}%</div>
                            <div><span className="text-[8px] block text-slate-400">Temp</span>{vt.temp}°F</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Read only Doctor Rounds Progress Notes */}
                <div className="border rounded-xl p-4 bg-slate-50/50">
                  <h4 className="font-black text-slate-800 border-b pb-2 mb-3">Doctor Rounds Progress Logs</h4>
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                    {(clinicalNotes[adm.admissionNo] || []).length === 0 ? (
                      <p className="text-[10px] italic text-slate-400 py-3 text-center">No round notes logged.</p>
                    ) : (
                      (clinicalNotes[adm.admissionNo] || []).map((note, idx) => (
                        <div key={idx} className="border bg-white rounded-xl p-2.5 space-y-1.5 shadow-sm text-left">
                          <div className="flex justify-between text-[8px] font-bold text-slate-400">
                            <span>{note.timestamp} • {note.type}</span>
                            <span>Author: {note.author}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 font-medium italic">&quot;{note.notes}&quot;</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Medication MAR Record */}
              <div className="border rounded-xl p-4 bg-slate-50/50 text-left">
                <h4 className="font-black text-slate-800 border-b pb-2 mb-3">Active Inpatient Medication MAR Chart</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[160px] overflow-y-auto pr-1">
                  {(medications[adm.admissionNo] || []).length === 0 ? (
                    <p className="text-[10px] italic text-slate-400 py-3 text-center col-span-2">No medications active.</p>
                  ) : (
                    (medications[adm.admissionNo] || []).map(med => (
                      <div key={med.id} className="border bg-white p-2.5 rounded-xl flex items-center justify-between gap-3 shadow-sm">
                        <div>
                          <p className="font-bold text-slate-800 text-[11px]">{med.medicine}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">Frequency: {med.frequency}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${med.status === "Administered" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                          }`}>{med.status}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          );
        })()}
      </Modal>

      {/* 7. Billing Invoice accounts check */}
      <Modal
        isOpen={showBillViewModal}
        onClose={() => setShowBillViewModal(false)}
        title="Patient Billing Ledger Desk"
        size="lg"
      >
        {billingAuditNo && admissions.find(a => a.admissionNo === billingAuditNo) && (() => {
          const patient = admissions.find(a => a.admissionNo === billingAuditNo);
          const bills = billing[billingAuditNo] || [];
          const summary = getBillingSummary(billingAuditNo);
          return (
            <div className="space-y-6 text-left p-1 text-xs">
              <div className="border-b pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{patient.patientName}</h3>
                  <p className="text-xs text-slate-500 font-semibold">ADM ID: {patient.admissionNo} | Status: {patient.status}</p>
                </div>

                <button
                  onClick={() => handlePrintDischarge(patient)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-1.5 px-3 rounded-lg border flex items-center gap-1"
                >
                  <Print fontSize="small" /> Statement Print
                </button>
              </div>

              {/* Items */}
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-black uppercase tracking-wider border-b">
                    <tr>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Category</th>
                      <th className="px-4 py-2">Description</th>
                      <th className="px-4 py-2 text-right">Charges (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-700">
                    {bills.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2">{item.date}</td>
                        <td className="px-4 py-2 font-bold">{item.category}</td>
                        <td className="px-4 py-2 text-slate-500">{item.description}</td>
                        <td className="px-4 py-2 text-right font-bold text-slate-900">₹{item.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary totals */}
              <div className="bg-slate-50 border p-4 rounded-xl space-y-1.5 text-xs text-left">
                <div className="flex justify-between border-b pb-1 text-slate-500">
                  <span>Gross Invoice Total:</span>
                  <span className="font-bold text-slate-900">₹{summary.total}</span>
                </div>
                <div className="flex justify-between border-b pb-1 text-slate-500">
                  <span>Advance Deposits / Credits:</span>
                  <span className="font-bold text-emerald-600">- ₹{summary.advance}</span>
                </div>
                {patient.insurance?.isTpaEnabled && (
                  <div className="flex justify-between border-b pb-1 text-slate-500">
                    <span>Insurance direct direct coverage claim:</span>
                    <span className="font-bold text-blue-600">- ₹{summary.insuranceAmt}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-slate-900 pt-1.5">
                  <span>Total Due Outstanding:</span>
                  <span className="text-red-600">₹{summary.pendingAmt}</span>
                </div>
              </div>

              {/* Forms payment logs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <form onSubmit={handleProcessPayment} className="border p-4 bg-slate-50/50 rounded-xl text-left">
                  <h4 className="text-xs font-black text-slate-700 uppercase mb-3">Clear Outstanding Invoice</h4>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Payment Amount (₹)</label>
                      <input
                        type="number" required placeholder={summary.pendingAmt}
                        className="w-full bg-white border rounded p-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Receipt Mode</label>
                        <select
                          className="w-full bg-white border rounded p-2 text-xs font-semibold text-slate-700 outline-none"
                          value={paymentForm.paymentMode}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentMode: e.target.value }))}
                        >
                          <option value="Cash">Cash</option>
                          <option value="Card (POS)">Card (POS)</option>
                          <option value="UPI / QR">UPI / QR</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Ref No</label>
                        <input
                          type="text" placeholder="e.g. UPI-99127"
                          className="w-full bg-white border rounded p-2 text-xs"
                          value={paymentForm.referenceNo}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, referenceNo: e.target.value }))}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 w-full rounded-lg shadow-sm"
                    >
                      Process Receipt Payment
                    </button>
                  </div>
                </form>

                {/* Advance deposit */}
                <form onSubmit={handleCollectDeposit} className="border p-4 bg-slate-50/50 rounded-xl text-left">
                  <h4 className="text-xs font-black text-slate-700 uppercase mb-3">Add Ledger Deposit credit</h4>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Credit Deposit (₹)</label>
                      <input
                        type="number" required placeholder="5000"
                        className="w-full bg-white border rounded p-2 text-xs outline-none"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                      />
                    </div>

                    <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">Collections credit ledger advances directly, supporting insurance claim clearances and reducing balance requisites during patient discharges.</p>

                    <button
                      type="submit"
                      className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-1.5 w-full rounded-lg"
                    >
                      Append Deposit
                    </button>
                  </div>
                </form>

              </div>
            </div>
          );
        })()}
      </Modal>

      {/* 8. Print Modal Discharge Receipt Summary */}
      <Modal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        title="Inpatient Account Discharge Certificate & invoice Statement"
        size="lg"
      >
        {printSummaryData && (() => {
          const adm = printSummaryData;
          const bill = getBillingSummary(adm.admissionNo);
          const doc = INITIAL_DOCTORS.find(d => d.id === adm.consultant_id);
          const summary = adm.dischargeSummary || { finalDiagnosis: adm.diagnosis, summary: "Discharged in stable condition.", followUpInstructions: "Review OPD consult in 7 days.", medications: "Tab Paracetamol 650mg TDS x 3 days" };

          return (
            <div className="p-4 space-y-6 text-left" id="discharge-printhead">

              <div className="border-b-4 border-slate-900 pb-4 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-wider">LIFELINE MULTI-SPECIALTY HOSPITAL</h2>
                  <p className="text-[10px] font-bold text-slate-500 mt-0.5">24/7 Multi-Specialty Health Care Infrastructure • New Delhi NCR</p>
                  <p className="text-[9px] text-slate-400 font-semibold">Contact: +91 11-45091811 | web: www.lifelinehospital.com</p>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-slate-900 text-white text-[10px] font-black uppercase px-2.5 py-1 tracking-wider rounded">IPD DISCHARGE CERTIFICATE</span>
                  <p className="text-[10px] font-mono font-bold mt-2 text-slate-500">Invoice Ref: INV-{adm.admissionNo}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs bg-slate-50 p-4 border border-slate-200 rounded-xl">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Patient Name</span>
                  <p className="font-bold text-slate-800">{adm.patientName}</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Age / Gender</span>
                  <p className="font-bold text-slate-800">{adm.age} yrs / {adm.gender}</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Admission Date</span>
                  <p className="font-bold text-slate-800">{adm.admissionDate} ({adm.admissionTime})</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Discharge Date</span>
                  <p className="font-bold text-slate-800">{summary.dischargeDate || new Date().toISOString().split("T")[0]}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">

                {/* Clinical Notes Summary */}
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <h4 className="font-black text-slate-800 border-b pb-1">Clinical Diagnoses</h4>
                    <p className="font-semibold text-blue-800 mt-1 italic">&quot;{summary.finalDiagnosis}&quot;</p>
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 border-b pb-1">Treatment Case Summary</h4>
                    <p className="text-slate-600 mt-1 font-medium leading-relaxed">{summary.summary}</p>
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 border-b pb-1">Prescribed Discharge Medication Course</h4>
                    <p className="text-slate-600 mt-1 font-mono text-[11px] leading-relaxed">{summary.medications}</p>
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 border-b pb-1">Follow-up Instructions</h4>
                    <p className="text-slate-600 mt-1 font-medium">{summary.followUpInstructions}</p>
                  </div>
                </div>

                {/* Final Billing Receipt */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3 h-fit">
                  <h4 className="font-black text-slate-800 border-b pb-1.5">Accounts Statement</h4>

                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between text-slate-500">
                      <span>Total Base Rent:</span>
                      <span className="font-bold">₹{billing[adm.admissionNo]?.filter(t => t.category === "Room Charges").reduce((s, t) => s + t.amount, 0)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Consultation Visits:</span>
                      <span className="font-bold">₹{billing[adm.admissionNo]?.filter(t => t.category === "Doctor Visit Charges").reduce((s, t) => s + t.amount, 0)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Investigations Fee:</span>
                      <span className="font-bold">₹{billing[adm.admissionNo]?.filter(t => t.category.includes("Lab") || t.category.includes("Radiology")).reduce((s, t) => s + t.amount, 0)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Procedures & Nursing:</span>
                      <span className="font-bold">₹{billing[adm.admissionNo]?.filter(t => t.category.includes("Procedure") || t.category === "Nursing Charges").reduce((s, t) => s + t.amount, 0)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Pharmacy Meds:</span>
                      <span className="font-bold">₹{billing[adm.admissionNo]?.filter(t => t.category === "Pharmacy Charges").reduce((s, t) => s + t.amount, 0)}</span>
                    </div>

                    <div className="h-px bg-slate-200 my-2"></div>

                    <div className="flex justify-between font-black text-slate-800">
                      <span>Gross Bill Amount:</span>
                      <span>₹{bill.total}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Advance Deposits:</span>
                      <span>- ₹{bill.advance}</span>
                    </div>
                    {adm.insurance?.isTpaEnabled && (
                      <div className="flex justify-between text-blue-600 font-bold">
                        <span>Insurance Claimed:</span>
                        <span>- ₹{bill.insuranceAmt}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-black text-slate-900 border-t pt-1.5">
                      <span>Net Due Paid:</span>
                      <span>₹{bill.pendingAmt}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Signatures */}
              <div className="flex justify-between items-end pt-12 text-xs border-t">
                <div>
                  <p className="font-bold text-slate-500">Discharging Consultant MD</p>
                  <p className="font-black text-slate-800 mt-4">{doc?.name || "Consulting Doctor"}</p>
                  <p className="text-[10px] text-slate-400 font-semibold">Specialty: {doc?.specialty}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-500">Lifeline Clinical Hospital Account Audit</p>
                  <p className="font-black text-slate-800 mt-4">Authorized Signature</p>
                  <p className="text-[10px] text-slate-400 font-semibold">Cleared Date: {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-6 border-t print:hidden">
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-4 rounded-xl"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="bg-slate-950 hover:bg-black text-white text-xs font-bold py-2 px-5 rounded-xl flex items-center gap-1 shadow-md"
                >
                  <Print fontSize="small" /> Print Discharge Receipt PDF
                </button>
              </div>

            </div>
          );
        })()}
      </Modal>

      {/* 9. Add Ward Modal */}
      <Modal
        isOpen={showAddWardModal}
        onClose={() => setShowAddWardModal(false)}
        title="Add New Ward"
        size="sm"
      >
        <form onSubmit={handleCreateWard} className="space-y-4 text-left text-xs">
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Ward Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Ward A, ICU-Floor-3"
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
              value={addWardForm.ward_name}
              onChange={(e) => setAddWardForm(prev => ({ ...prev, ward_name: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Floor</label>
              <select
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                value={addWardForm.floor}
                onChange={(e) => setAddWardForm(prev => ({ ...prev, floor: e.target.value }))}
              >
                <option value="Ground Floor">Ground Floor</option>
                <option value="1st Floor">1st Floor</option>
                <option value="2nd Floor">2nd Floor</option>
                <option value="3rd Floor">3rd Floor</option>
                <option value="4th Floor">4th Floor</option>
                <option value="5th Floor">5th Floor</option>
                <option value="6th Floor">6th Floor</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Rooms Capacity</label>
              <input
                type="number"
                required
                min="1"
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                value={addWardForm.capacity}
                onChange={(e) => setAddWardForm(prev => ({ ...prev, capacity: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Status</label>
            <select
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold"
              value={addWardForm.status}
              onChange={(e) => setAddWardForm(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="Active">Active</option>
              <option value="Not Available">Not Available (Maintenance)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={() => setShowAddWardModal(false)}
              className="bg-slate-100 text-slate-700 text-xs font-bold py-2 px-4 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-5 rounded-xl shadow-sm"
            >
              Add Ward
            </button>
          </div>
        </form>
      </Modal>

      {/* 10. Add Room Modal */}
      <Modal
        isOpen={showAddRoomModal}
        onClose={() => setShowAddRoomModal(false)}
        title="Add New Room"
        size="sm"
      >
        <form onSubmit={handleCreateRoom} className="space-y-4 text-left text-xs">
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Room Number / Name</label>
            <input
              type="text"
              required
              placeholder="e.g. 103, ICU-A"
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
              value={addRoomForm.room_number}
              onChange={(e) => setAddRoomForm(prev => ({ ...prev, room_number: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Assign to Ward</label>
            <select
              required
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold"
              value={addRoomForm.ward_id}
              onChange={(e) => setAddRoomForm(prev => ({ ...prev, ward_id: e.target.value }))}
            >
              <option value="">Select Ward...</option>
              {wards.map(w => (
                <option key={w.ward_id} value={w.ward_id}>{w.ward_name} ({w.floor})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Daily Price / Rent (₹)</label>
              <input
                type="number"
                required
                min="0"
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                value={addRoomForm.daily_price}
                onChange={(e) => setAddRoomForm(prev => ({ ...prev, daily_price: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Status</label>
              <select
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                value={addRoomForm.status}
                onChange={(e) => setAddRoomForm(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="Available">Available</option>
                <option value="Not Available">Not Available (Maintenance)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={() => setShowAddRoomModal(false)}
              className="bg-slate-100 text-slate-700 text-xs font-bold py-2 px-4 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-5 rounded-xl shadow-sm"
            >
              Add Room
            </button>
          </div>
        </form>
      </Modal>

      {/* 11. Add Bed Modal */}
      <Modal
        isOpen={showAddBedModal}
        onClose={() => setShowAddBedModal(false)}
        title="Add New Bed"
        size="sm"
      >
        <form onSubmit={handleCreateBed} className="space-y-4 text-left text-xs">
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Bed Number / Code</label>
            <input
              type="text"
              required
              placeholder="e.g. 101-C, B-10"
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
              value={addBedForm.bed_number}
              onChange={(e) => setAddBedForm(prev => ({ ...prev, bed_number: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Ward Location</label>
            <select
              required
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold"
              value={addBedForm.ward_id}
              onChange={(e) => {
                setAddBedForm(prev => ({ ...prev, ward_id: e.target.value, room_id: "" }));
              }}
            >
              <option value="">Select Ward...</option>
              {wards.map(w => (
                <option key={w.ward_id} value={w.ward_id}>{w.ward_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Room Assignment</label>
            <select
              required
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold"
              value={addBedForm.room_id}
              onChange={(e) => setAddBedForm(prev => ({ ...prev, room_id: e.target.value }))}
              disabled={!addBedForm.ward_id}
            >
              <option value="">Select Room...</option>
              {rooms.filter(r => r.ward_id === addBedForm.ward_id).map(r => (
                <option key={r.room_id} value={r.room_id}>Room {r.room_number}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Daily Price / Rent (₹)</label>
            <input
              type="number"
              required
              min="0"
              placeholder="e.g. 500"
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
              value={addBedForm.daily_price}
              onChange={(e) => setAddBedForm(prev => ({ ...prev, daily_price: e.target.value }))}
            />
          </div>

          <div className="space-y-2 pt-2">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
              <input
                type="checkbox"
                className="rounded text-blue-600 focus:ring-blue-500"
                checked={addBedForm.is_oxygen_available}
                onChange={(e) => setAddBedForm(prev => ({ ...prev, is_oxygen_available: e.target.checked }))}
              />
              Oxygen Facility Available
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
              <input
                type="checkbox"
                className="rounded text-blue-600 focus:ring-blue-500"
                checked={addBedForm.ventilator_available}
                onChange={(e) => setAddBedForm(prev => ({ ...prev, ventilator_available: e.target.checked }))}
              />
              Ventilator Setup Available
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={() => setShowAddBedModal(false)}
              className="bg-slate-100 text-slate-700 text-xs font-bold py-2 px-4 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-5 rounded-xl shadow-sm"
            >
              Add Bed
            </button>
          </div>
        </form>
      </Modal>

      {/* 12. Edit Ward Modal */}
      <Modal
        isOpen={showEditWardModal}
        onClose={() => setShowEditWardModal(false)}
        title="Edit Ward Details"
        size="sm"
      >
        <form onSubmit={handleUpdateWard} className="space-y-4 text-left text-xs">
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Ward Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Ward A, ICU-Floor-3"
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
              value={editWardForm.ward_name}
              onChange={(e) => setEditWardForm(prev => ({ ...prev, ward_name: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Floor</label>
              <select
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                value={editWardForm.floor}
                onChange={(e) => setEditWardForm(prev => ({ ...prev, floor: e.target.value }))}
              >
                <option value="Ground Floor">Ground Floor</option>
                <option value="1st Floor">1st Floor</option>
                <option value="2nd Floor">2nd Floor</option>
                <option value="3rd Floor">3rd Floor</option>
                <option value="4th Floor">4th Floor</option>
                <option value="5th Floor">5th Floor</option>
                <option value="6th Floor">6th Floor</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Rooms Capacity</label>
              <input
                type="number"
                required
                min="1"
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                value={editWardForm.capacity}
                onChange={(e) => setEditWardForm(prev => ({ ...prev, capacity: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Status</label>
            <select
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold"
              value={editWardForm.status}
              onChange={(e) => setEditWardForm(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="Active">Active</option>
              <option value="Not Available">Not Available (Maintenance)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={() => setShowEditWardModal(false)}
              className="bg-slate-100 text-slate-700 text-xs font-bold py-2 px-4 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-5 rounded-xl shadow-sm"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* 13. Edit Room Modal */}
      <Modal
        isOpen={showEditRoomModal}
        onClose={() => setShowEditRoomModal(false)}
        title="Edit Room Details"
        size="sm"
      >
        <form onSubmit={handleUpdateRoom} className="space-y-4 text-left text-xs">
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Room Number / Name</label>
            <input
              type="text"
              required
              placeholder="e.g. 103, ICU-A"
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
              value={editRoomForm.room_number}
              onChange={(e) => setEditRoomForm(prev => ({ ...prev, room_number: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Assign to Ward</label>
            <select
              required
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold"
              value={editRoomForm.ward_id}
              onChange={(e) => setEditRoomForm(prev => ({ ...prev, ward_id: e.target.value }))}
            >
              <option value="">Select Ward...</option>
              {wards.map(w => (
                <option key={w.ward_id} value={w.ward_id}>{w.ward_name} ({w.floor})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Daily Price / Rent (₹)</label>
              <input
                type="number"
                required
                min="0"
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                value={editRoomForm.daily_price}
                onChange={(e) => setEditRoomForm(prev => ({ ...prev, daily_price: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Status</label>
              <select
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                value={editRoomForm.status}
                onChange={(e) => setEditRoomForm(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="Available">Available</option>
                <option value="Not Available">Not Available (Maintenance)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={() => setShowEditRoomModal(false)}
              className="bg-slate-100 text-slate-700 text-xs font-bold py-2 px-4 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-5 rounded-xl shadow-sm"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* 14. Edit Bed Modal */}
      <Modal
        isOpen={showEditBedModal}
        onClose={() => setShowEditBedModal(false)}
        title="Edit Bed Details"
        size="sm"
      >
        <form onSubmit={handleUpdateBed} className="space-y-4 text-left text-xs">
          {editBedForm.status === "Occupied" && (
            <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-[10px] text-amber-800 font-semibold leading-relaxed">
              ⚠️ Note: This bed is currently occupied. Relocating it to a different room/ward or deleting it is disabled to prevent database inconsistency.
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Bed Number / Code</label>
            <input
              type="text"
              required
              placeholder="e.g. 101-C"
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
              value={editBedForm.bed_number}
              onChange={(e) => setEditBedForm(prev => ({ ...prev, bed_number: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Ward Location</label>
            <select
              required
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold"
              value={editBedForm.ward_id}
              onChange={(e) => setEditBedForm(prev => ({ ...prev, ward_id: e.target.value, room_id: "" }))}
              disabled={editBedForm.status === "Occupied"}
            >
              <option value="">Select Ward...</option>
              {wards.map(w => (
                <option key={w.ward_id} value={w.ward_id}>{w.ward_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Room Assignment</label>
            <select
              required
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold"
              value={editBedForm.room_id}
              onChange={(e) => setEditBedForm(prev => ({ ...prev, room_id: e.target.value }))}
              disabled={!editBedForm.ward_id || editBedForm.status === "Occupied"}
            >
              <option value="">Select Room...</option>
              {rooms.filter(r => r.ward_id === editBedForm.ward_id).map(r => (
                <option key={r.room_id} value={r.room_id}>Room {r.room_number}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Daily Price / Rent (₹)</label>
            <input
              type="number"
              required
              min="0"
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
              value={editBedForm.daily_price}
              onChange={(e) => setEditBedForm(prev => ({ ...prev, daily_price: e.target.value }))}
            />
          </div>

          <div className="space-y-2 pt-2">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
              <input
                type="checkbox"
                className="rounded text-blue-600 focus:ring-blue-500"
                checked={editBedForm.is_oxygen_available}
                onChange={(e) => setEditBedForm(prev => ({ ...prev, is_oxygen_available: e.target.checked }))}
              />
              Oxygen Facility Available
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
              <input
                type="checkbox"
                className="rounded text-blue-600 focus:ring-blue-500"
                checked={editBedForm.ventilator_available}
                onChange={(e) => setEditBedForm(prev => ({ ...prev, ventilator_available: e.target.checked }))}
              />
              Ventilator Setup Available
            </label>
          </div>

          <div className="flex justify-between items-center pt-4 border-t gap-2">
            <div>
              <button
                type="button"
                onClick={() => triggerDeleteBed(editBedForm.bed_id)}
                disabled={editBedForm.status === "Occupied"}
                className={`text-xs font-bold py-2 px-4 rounded-xl text-white ${
                  editBedForm.status === "Occupied"
                    ? "bg-slate-300 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700 shadow-sm"
                }`}
              >
                Delete Bed
              </button>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowEditBedModal(false)}
                className="bg-slate-100 text-slate-700 text-xs font-bold py-2 px-4 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-5 rounded-xl shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
        title={deleteConfirm.title}
        size="sm"
      >
        <div className="space-y-4 text-left text-xs">
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5">
            <span className="p-1 bg-red-100 text-white rounded flex items-center justify-center shrink-0 w-5 h-5 font-bold">
              !
            </span>
            <div>
              <p className="font-bold text-red-800">Critical Action Required</p>
              <p className="text-red-700 font-medium mt-1 leading-relaxed">
                {deleteConfirm.message}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={() => setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
              className="bg-slate-100 text-slate-700 text-xs font-bold py-2 px-4 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={executeDelete}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 px-5 rounded-xl shadow-sm"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default IPDManagement;