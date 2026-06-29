import React, { useState, useMemo, useEffect } from "react";
import { toast } from "react-toastify";
import { apiFetch } from "../../../../services/apiClient";
import { DOCTOR_PROFILE } from "../../../../config/api";
import {
  Users,
  Activity,
  AlertTriangle,
  User,
  FlaskConical,
  FileText,
  ArrowRightLeft,
  Search,
  Filter,
  Calendar,
  X,
  Stethoscope,
  Plus,
  RefreshCw,
  Edit,
  Trash2
} from "lucide-react";

// ==========================================
// 1. Initial Dummy Patient Records (JSON Format)
// ==========================================
const INITIAL_PATIENTS = [
  {
    id: "PAT-1001",
    name: "Ramesh Kumar",
    age: 45,
    gender: "Male",
    doctor: "Dr. Sharma",
    diagnosis: "Hypertension",
    treatmentStatus: "Active",
    priority: "Medium",
    lastVisit: "2026-06-12",
    labTests: ["Blood Test"],
    prescriptions: [{ medication: "Amlodipine", dosage: "5mg", frequency: "Once daily" }],
    ipdTransfer: null
  },
  {
    id: "PAT-1002",
    name: "Sita Devi",
    age: 32,
    gender: "Female",
    doctor: "Dr. Priya",
    diagnosis: "Diabetes",
    treatmentStatus: "Under Review",
    priority: "High",
    lastVisit: "2026-06-13",
    labTests: ["HbA1c Test"],
    prescriptions: [{ medication: "Metformin", dosage: "500mg", frequency: "Twice daily" }],
    ipdTransfer: null
  },
  {
    id: "PAT-1003",
    name: "Mohan Rao",
    age: 58,
    gender: "Male",
    doctor: "Dr. Rajesh",
    diagnosis: "Asthma",
    treatmentStatus: "Completed",
    priority: "Low",
    lastVisit: "2026-06-10",
    labTests: ["Chest X-Ray"],
    prescriptions: [{ medication: "Albuterol Inhaler", dosage: "2 puffs", frequency: "As needed" }],
    ipdTransfer: null
  },
  {
    id: "PAT-1004",
    name: "Anjali Gupta",
    age: 27,
    gender: "Female",
    doctor: "Dr. Neha",
    diagnosis: "Migraine",
    treatmentStatus: "Active",
    priority: "Medium",
    lastVisit: "2026-06-14",
    labTests: [],
    prescriptions: [],
    ipdTransfer: null
  },
  {
    id: "PAT-1005",
    name: "Rahul Verma",
    age: 39,
    gender: "Male",
    doctor: "Dr. Kumar",
    diagnosis: "Chest Pain",
    treatmentStatus: "Critical",
    priority: "Emergency",
    lastVisit: "2026-06-15",
    labTests: ["ECG"],
    prescriptions: [{ medication: "Aspirin", dosage: "150mg", frequency: "Immediate" }],
    ipdTransfer: { department: "Emergency Department", ward: "Red Zone ICU", reason: "Acute chest pain" }
  }
];

// Available lab tests options for Quick Action
const LAB_TEST_OPTIONS = [
  "Blood Test",
  "Urine Test",
  "X-Ray",
  "CT Scan",
  "MRI",
  "ECG",
  "Lipid Profile",
  "Thyroid Panel"
];

// Badge styling helper for Status
const getStatusBadgeClass = (status) => {
  switch (status) {
    case "Active":
      return "bg-green-50 text-green-700 border border-green-200";
    case "Under Review":
      return "bg-yellow-50 text-yellow-700 border border-yellow-200";
    case "Completed":
      return "bg-blue-50 text-blue-700 border border-blue-200";
    case "Critical":
      return "bg-red-50 text-red-700 border border-red-200";
    default:
      return "bg-gray-50 text-gray-700 border border-gray-200";
  }
};

// Badge styling helper for Priority
const getPriorityBadgeClass = (priority) => {
  switch (priority) {
    case "Low":
      return "bg-gray-100 text-gray-600 border border-gray-200";
    case "Medium":
      return "bg-blue-50 text-blue-700 border border-blue-200";
    case "High":
      return "bg-orange-50 text-orange-700 border border-orange-200";
    case "Emergency":
      return "bg-red-100 text-red-700 border border-red-200 animate-pulse";
    default:
      return "bg-gray-100 text-gray-600 border border-gray-200";
  }
};

const TreatmentPlans = () => {
  // Main local state for patients data
  const [patients, setPatients] = useState(INITIAL_PATIENTS);

  // Dynamic doctor name loaded from profile
  const [doctorName, setDoctorName] = useState("Dr. Sharma");

  // Search and Filter criteria states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  // Quick Action Modal states
  const [activeModal, setActiveModal] = useState(null); // 'lab' | 'prescription' | 'transfer' | 'add_patient' | null
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Fetch doctor profile data on component mount
  useEffect(() => {
    const fetchDoctorProfile = async () => {
      try {
        const response = await apiFetch(DOCTOR_PROFILE);
        if (response && response.ok) {
          const data = await response.json();
          const fullName = `${data.first_name || ""} ${data.middle_name || ""} ${data.last_name || ""}`.trim();
          if (fullName) {
            const formatted = fullName.toLowerCase().startsWith("dr.") 
              ? fullName 
              : `Dr. ${fullName}`;
            setDoctorName(formatted);
          }
        }
      } catch (err) {
        console.error("Error fetching doctor profile in TreatmentPlans:", err);
      }
    };
    fetchDoctorProfile();
  }, []);

  // Forms state
  const [labForm, setLabForm] = useState({
    tests: [],
    notes: ""
  });

  const [prescriptionForm, setPrescriptionForm] = useState({
    medications: [
      { medication: "", dosage: "", frequency: "Once daily", duration: "" }
    ],
    notes: ""
  });

  const [editMedicationForm, setEditMedicationForm] = useState({
    medication: "",
    dosage: "",
    frequency: "Once daily",
    duration: ""
  });
  const [editingIndex, setEditingIndex] = useState(null);

  const [transferForm, setTransferForm] = useState({
    department: "IPD Admission",
    ward: "General Ward",
    reason: ""
  });

  const [newPatientForm, setNewPatientForm] = useState({
    name: "",
    age: "",
    gender: "Male",
    doctor: "Dr. Sharma",
    diagnosis: "",
    treatmentStatus: "Active",
    priority: "Medium"
  });

  // Calculate summary statistics
  const stats = useMemo(() => {
    const total = patients.length;
    const active = patients.filter((p) => p.treatmentStatus === "Active").length;
    const critical = patients.filter(
      (p) => p.treatmentStatus === "Critical" || p.priority === "Emergency"
    ).length;

    return { total, active, critical };
  }, [patients]);

  // Filtered patients list based on search and selected filter dropdowns
  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const matchesSearch =
        patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctorName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "" || patient.treatmentStatus === statusFilter;
      const matchesPriority = priorityFilter === "" || patient.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [patients, searchQuery, statusFilter, priorityFilter, doctorName]);

  // Reset filter inputs
  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setPriorityFilter("");
    toast.info("Filters cleared");
  };

  // Open Lab modal
  const handleOpenLabModal = (patient) => {
    setSelectedPatient(patient);
    setLabForm({ tests: [], notes: "" });
    setActiveModal("lab");
  };

  // Toggle lab test selection in checkboxes
  const handleToggleLabTest = (test) => {
    setLabForm((prev) => {
      const isSelected = prev.tests.includes(test);
      const updatedTests = isSelected
        ? prev.tests.filter((t) => t !== test)
        : [...prev.tests, test];
      return { ...prev, tests: updatedTests };
    });
  };

  // Submit lab tests assignment
  const handleAssignLabTest = (e) => {
    e.preventDefault();
    if (labForm.tests.length === 0) {
      toast.warning("Please select at least one laboratory investigation.");
      return;
    }

    setPatients((prevPatients) =>
      prevPatients.map((p) => {
        if (p.id === selectedPatient.id) {
          return { ...p, labTests: labForm.tests };
        }
        return p;
      })
    );

    toast.success(
      `Updated lab assignments for patient ${selectedPatient.name}`
    );
    setActiveModal(null);
  };

  // Open Edit Lab Assignments modal (pre-fills existing tests)
  const handleOpenEditLabModal = (patient) => {
    setSelectedPatient(patient);
    setLabForm({
      tests: patient.labTests || [],
      notes: ""
    });
    setActiveModal("lab");
  };

  // Delete Single Lab Test from Card
  const handleDeleteLabTest = (patient, test) => {
    setPatients((prevPatients) =>
      prevPatients.map((p) => {
        if (p.id === patient.id) {
          const updatedTests = (p.labTests || []).filter((t) => t !== test);
          return { ...p, labTests: updatedTests };
        }
        return p;
      })
    );
    toast.success(`Removed ${test} assignment for ${patient.name}`);
  };

  // Open Prescription modal
  const handleOpenPrescriptionModal = (patient) => {
    setSelectedPatient(patient);
    setPrescriptionForm({
      medications: [
        { medication: "", dosage: "", frequency: "Once daily", duration: "" }
      ],
      notes: ""
    });
    setActiveModal("prescription");
  };

  // Add another tablet row in modal
  const handleAddMedicationRow = () => {
    setPrescriptionForm((prev) => ({
      ...prev,
      medications: [
        ...prev.medications,
        { medication: "", dosage: "", frequency: "Once daily", duration: "" }
      ]
    }));
  };

  // Remove tablet row in modal
  const handleRemoveMedicationRow = (index) => {
    setPrescriptionForm((prev) => {
      const updated = prev.medications.filter((_, idx) => idx !== index);
      return { ...prev, medications: updated };
    });
  };

  // Handle specific field changes for a medication row in modal
  const handleMedicationFieldChange = (index, field, value) => {
    setPrescriptionForm((prev) => {
      const updatedMeds = prev.medications.map((med, idx) => {
        if (idx === index) {
          return { ...med, [field]: value };
        }
        return med;
      });
      return { ...prev, medications: updatedMeds };
    });
  };

  // Submit prescription send action (adds all medications in the list to the patient)
  const handleSendPrescription = (e) => {
    e.preventDefault();
    const { medications } = prescriptionForm;

    // Validation
    const invalidMeds = medications.some(
      (m) => !m.medication.trim() || !m.dosage.trim() || !m.duration.trim()
    );
    if (invalidMeds) {
      toast.warning("Please fill out the Medication Name, Dosage, and Duration fields for all rows.");
      return;
    }

    setPatients((prevPatients) =>
      prevPatients.map((p) => {
        if (p.id === selectedPatient.id) {
          const existingPrescriptions = p.prescriptions || [];
          return {
            ...p,
            prescriptions: [...existingPrescriptions, ...medications]
          };
        }
        return p;
      })
    );

    // Save to localStorage for integration with Pharmacy Dashboard
    try {
      const localPrescriptionsRaw = localStorage.getItem("hospitalPrescriptions");
      const localPrescriptions = localPrescriptionsRaw ? JSON.parse(localPrescriptionsRaw) : [];
      
      // Generate next sequential prescription ID (e.g. RX-1001, RX-1002...)
      let nextNum = 1001;
      if (localPrescriptions.length > 0) {
        const ids = localPrescriptions.map(p => {
          const match = p.prescriptionId?.match(/RX-(\d+)/);
          return match ? parseInt(match[1], 10) : 1000;
        });
        nextNum = Math.max(...ids) + 1;
      }
      const prescriptionId = `RX-${nextNum}`;

      // Get today's date in YYYY-MM-DD
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const formattedDate = `${yyyy}-${mm}-${dd}`;

      const newPrescriptionObj = {
        prescriptionId,
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        doctorId: "DOC-101", // Mock doctor ID
        doctorName: doctorName || "Dr. Sharma",
        date: formattedDate,
        status: "Pending",
        notes: prescriptionForm.notes || "",
        medications: medications.map(med => ({
          medicineName: med.medication,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration
        }))
      };

      localPrescriptions.push(newPrescriptionObj);
      localStorage.setItem("hospitalPrescriptions", JSON.stringify(localPrescriptions));
    } catch (err) {
      console.error("Error saving prescription to localStorage:", err);
    }

    toast.success(
      `Forwarded ${medications.length} prescription(s) to Pharmacy for ${selectedPatient.name}`
    );
    setActiveModal(null);
  };

  // Open Edit Single Medication modal
  const handleOpenEditPrescription = (patient, index) => {
    setSelectedPatient(patient);
    setEditingIndex(index);
    const presc = patient.prescriptions[index];
    setEditMedicationForm({
      medication: presc.medication,
      dosage: presc.dosage,
      frequency: presc.frequency || "Once daily",
      duration: presc.duration || ""
    });
    setActiveModal("edit_prescription");
  };

  // Submit Edit Medication action
  const handleSaveEditedPrescription = (e) => {
    e.preventDefault();
    const { medication, dosage, frequency, duration } = editMedicationForm;
    if (!medication.trim() || !dosage.trim() || !duration.trim()) {
      toast.warning("Please fill out the Medication Name, Dosage, and Duration fields.");
      return;
    }

    setPatients((prevPatients) =>
      prevPatients.map((p) => {
        if (p.id === selectedPatient.id) {
          const updatedMeds = p.prescriptions.map((m, idx) => {
            if (idx === editingIndex) {
              return { medication, dosage, frequency, duration };
            }
            return m;
          });
          return { ...p, prescriptions: updatedMeds };
        }
        return p;
      })
    );

    toast.success(`Updated medication details for ${medication}`);
    setActiveModal(null);
  };

  // Delete Single Medication from Patient Card
  const handleDeletePrescription = (patient, index) => {
    const medicationName = patient.prescriptions[index].medication;

    setPatients((prevPatients) =>
      prevPatients.map((p) => {
        if (p.id === patient.id) {
          const updated = p.prescriptions.filter((_, idx) => idx !== index);
          return { ...p, prescriptions: updated };
        }
        return p;
      })
    );

    toast.success(`Removed prescription for ${medicationName}`);
  };

  // Open Move to IPD modal
  const handleOpenIpdModal = (patient) => {
    setSelectedPatient(patient);
    setTransferForm({
      department: "IPD Admission",
      ward: "General Ward",
      reason: ""
    });
    setActiveModal("transfer");
  };

  // Submit IPD/Emergency transfer action
  const handleMoveToIPD = (e) => {
    e.preventDefault();
    const { department, ward, reason } = transferForm;
    if (!reason.trim()) {
      toast.warning("Please provide a clinical reasoning for the transfer.");
      return;
    }

    setPatients((prevPatients) =>
      prevPatients.map((p) => {
        if (p.id === selectedPatient.id) {
          // If transferring to Emergency or Critical Care, raise status to Critical and priority to Emergency
          let updatedStatus = p.treatmentStatus;
          let updatedPriority = p.priority;

          if (department === "Emergency Department" || department === "Critical Care") {
            updatedStatus = "Critical";
            updatedPriority = "Emergency";
          } else if (department === "IPD Admission") {
            updatedStatus = "Active";
            if (p.priority === "Low") {
              updatedPriority = "Medium";
            }
          }

          return {
            ...p,
            treatmentStatus: updatedStatus,
            priority: updatedPriority,
            ipdTransfer: { department, ward, reason }
          };
        }
        return p;
      })
    );

    toast.success(
      `Transferred ${selectedPatient.name} to ${department} (${ward}) successfully.`
    );
    setActiveModal(null);
  };

  // Open Edit Transfer modal (pre-fills existing transfer details)
  const handleOpenEditTransferModal = (patient) => {
    setSelectedPatient(patient);
    setTransferForm({
      department: patient.ipdTransfer.department || "IPD Admission",
      ward: patient.ipdTransfer.ward || "General Ward",
      reason: patient.ipdTransfer.reason || ""
    });
    setActiveModal("transfer");
  };

  // Cancel / Delete Department Transfer
  const handleDeleteTransfer = (patient) => {
    setPatients((prevPatients) =>
      prevPatients.map((p) => {
        if (p.id === patient.id) {
          return {
            ...p,
            ipdTransfer: null,
            treatmentStatus: p.treatmentStatus === "Critical" ? "Active" : p.treatmentStatus,
            priority: p.priority === "Emergency" ? "Medium" : p.priority
          };
        }
        return p;
      })
    );
    toast.success(`Cancelled department transfer for ${patient.name}`);
  };

  // Open Add Patient modal
  const handleOpenAddPatientModal = () => {
    setNewPatientForm({
      name: "",
      age: "",
      gender: "Male",
      doctor: doctorName,
      diagnosis: "",
      treatmentStatus: "Active",
      priority: "Medium"
    });
    setActiveModal("add_patient");
  };

  // Submit New Patient form
  const handleAddPatient = (e) => {
    e.preventDefault();
    const { name, age, gender, doctor, diagnosis, treatmentStatus, priority } = newPatientForm;
    if (!name.trim() || !age || !diagnosis.trim() || !doctor.trim()) {
      toast.warning("Please fill in all patient details before submitting.");
      return;
    }

    const nextIdNum = Math.max(...patients.map((p) => parseInt(p.id.split("-")[1]))) + 1;
    const newId = `PAT-${nextIdNum}`;
    const today = new Date().toISOString().split("T")[0];

    const newPatient = {
      id: newId,
      name,
      age: parseInt(age),
      gender,
      doctor,
      diagnosis,
      treatmentStatus,
      priority,
      lastVisit: today,
      labTests: [],
      prescriptions: [],
      ipdTransfer: null
    };

    setPatients((prev) => [newPatient, ...prev]);
    toast.success(`Successfully registered new patient: ${name} (${newId})`);
    setActiveModal(null);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      
      {/* ==========================================
          Header Section
          ========================================== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Stethoscope className="text-blue-600 w-8 h-8" />
            Treatment Plans Management
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Overview clinic and ward admissions, assign laboratory tests, write pharmacy prescriptions, and dispatch transfers.
          </p>
        </div>
        <div>
          <button
            onClick={handleOpenAddPatientModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm hover:shadow-md transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            Add New Patient
          </button>
        </div>
      </div>

      {/* ==========================================
          Statistics Cards Section
          ========================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Patients Card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Patients</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{stats.total}</h3>
            <p className="text-xs text-slate-400 mt-1.5">Registered in dashboard</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Users className="w-8 h-8" />
          </div>
        </div>

        {/* Active Treatments Card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Treatments</p>
            <h3 className="text-3xl font-extrabold text-emerald-600 mt-1">{stats.active}</h3>
            <p className="text-xs text-slate-400 mt-1.5">Ongoing active cycles</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Activity className="w-8 h-8" />
          </div>
        </div>

        {/* Critical Cases Card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Critical / Emergency</p>
            <h3 className="text-3xl font-extrabold text-rose-600 mt-1">{stats.critical}</h3>
            <p className="text-xs text-rose-400 mt-1.5">Require immediate attention</p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <AlertTriangle className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* ==========================================
          Filters Panel Section
          ========================================== */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Filter className="w-4 h-4 text-blue-500" />
          <h4 className="font-semibold text-slate-800 text-sm">Filter & Search Database</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Text Search input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search Name, ID, Diagnosis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Status filter dropdown */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Under Review">Under Review</option>
              <option value="Completed">Completed</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          {/* Priority filter dropdown */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
            >
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Emergency">Emergency</option>
            </select>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleResetFilters}
              disabled={!searchQuery && !statusFilter && !priorityFilter}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent rounded-xl text-sm font-semibold transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* ==========================================
          Patient Cards Grid
          ========================================== */}
      {filteredPatients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center shadow-sm">
          <User className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700 mt-4">No Patients Found</h3>
          <p className="text-sm text-slate-400 mt-1">Try expanding your filter criteria or register a new patient profile.</p>
          {(searchQuery || statusFilter || priorityFilter) && (
            <button
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-semibold transition-all"
            >
              Clear Current Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => (
            <div
              key={patient.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden"
            >
              
              {/* Card Header */}
              <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-blue-600 bg-blue-50/80 border border-blue-100 px-2 py-0.5 rounded-md tracking-wider">
                  {patient.id}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${getStatusBadgeClass(patient.treatmentStatus)}`}>
                    {patient.treatmentStatus}
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${getPriorityBadgeClass(patient.priority)}`}>
                    {patient.priority}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 space-y-4">
                
                {/* Basic Demographics */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{patient.name}</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">
                    {patient.age} Yrs • {patient.gender}
                  </p>
                </div>

                {/* Medical Details */}
                <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-3.5 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block text-[10px] uppercase tracking-wider">Assigned Doctor</span>
                    <span className="text-slate-700 font-bold mt-1 flex items-center gap-1">
                      <Stethoscope className="w-3.5 h-3.5 text-blue-500" />
                      {doctorName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block text-[10px] uppercase tracking-wider">Diagnosis</span>
                    <span className="text-slate-700 font-bold mt-1 block truncate" title={patient.diagnosis}>
                      {patient.diagnosis}
                    </span>
                  </div>
                </div>

                {/* Last Visit */}
                <div className="border-t border-slate-50 pt-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Last Visit Date:</span>
                  </div>
                  <span className="font-bold text-slate-700">{patient.lastVisit}</span>
                </div>

                {/* Dynamic Lab Tests Assigned */}
                {patient.labTests && patient.labTests.length > 0 && (
                  <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100 text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <FlaskConical className="w-3.5 h-3.5 text-emerald-500" /> Lab Assignments
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditLabModal(patient);
                        }}
                        title="Edit Lab Assignments"
                        className="text-slate-400 hover:text-emerald-600 p-0.5 hover:bg-slate-200/50 rounded transition-all"
                      >
                        <Edit className="w-3 h-3 text-slate-400 hover:text-emerald-600" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {patient.labTests.map((test, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md pl-2 pr-1 py-0.5 text-[10px] font-bold"
                        >
                          {test}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteLabTest(patient, test);
                            }}
                            title={`Remove ${test}`}
                            className="p-0.5 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-800 rounded transition-all"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dynamic Pharmacy Prescriptions */}
                {patient.prescriptions && patient.prescriptions.length > 0 && (
                  <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100 text-xs">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-500" /> Pharmacy Prescriptions
                    </p>
                    <div className="space-y-2">
                      {patient.prescriptions.map((presc, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center text-[10px] border-b border-dashed border-slate-200 last:border-0 pb-2 last:pb-0 group"
                        >
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-700">
                              {presc.medication} <span className="font-semibold text-slate-500">({presc.dosage})</span>
                            </span>
                            <span className="text-[9px] text-slate-400 font-semibold mt-0.5">
                              {presc.frequency} {presc.duration ? `• ${presc.duration}` : ""}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditPrescription(patient, index);
                              }}
                              title="Edit Medication"
                              className="p-1 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded transition-all"
                            >
                              <Edit className="w-3 h-3 text-slate-400 hover:text-blue-600" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePrescription(patient, index);
                              }}
                              title="Delete Medication"
                              className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-all"
                            >
                              <Trash2 className="w-3 h-3 text-slate-400 hover:text-red-500" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dynamic IPD / Emergency Transfers */}
                {patient.ipdTransfer && (
                  <div className="bg-rose-50/50 rounded-xl p-3 border border-rose-100 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
                        <ArrowRightLeft className="w-3.5 h-3.5" /> Department Transfer
                      </p>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditTransferModal(patient);
                          }}
                          title="Edit Transfer"
                          className="p-1 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded transition-all"
                        >
                          <Edit className="w-3 h-3 text-slate-400 hover:text-rose-600" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTransfer(patient);
                          }}
                          title="Cancel Transfer"
                          className="p-1 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded transition-all"
                        >
                          <Trash2 className="w-3 h-3 text-slate-400 hover:text-rose-600" />
                        </button>
                      </div>
                    </div>
                    <p className="font-bold text-slate-800 text-[10px]">
                      Destination: <span className="text-rose-700">{patient.ipdTransfer.department}</span>
                    </p>
                    <p className="text-[10px] text-slate-600 font-semibold">
                      Ward: {patient.ipdTransfer.ward}
                    </p>
                    <p className="text-[9px] text-slate-400 italic">
                      Reason: `{patient.ipdTransfer.reason}`
                    </p>
                  </div>
                )}
              </div>

              {/* Card Footer: Quick Actions Section */}
              <div className="bg-slate-50/50 px-5 py-4 border-t border-slate-100 grid grid-cols-3 gap-2">
                
                {/* Button 1: Assign Lab Test */}
                <button
                  onClick={() => handleOpenLabModal(patient)}
                  title="Assign laboratory investigations"
                  className="flex flex-col items-center justify-center gap-1 px-1 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 shadow-sm hover:shadow transition-all duration-200 text-[10px] font-bold"
                >
                  <FlaskConical className="w-4 h-4 text-emerald-500" />
                  <span>Assign Lab</span>
                </button>

                {/* Button 2: Send Prescription */}
                <button
                  onClick={() => handleOpenPrescriptionModal(patient)}
                  title="Forward prescription to Pharmacy"
                  className="flex flex-col items-center justify-center gap-1 px-1 py-2 rounded-xl bg-white hover:bg-blue-50 text-blue-600 hover:text-blue-700 border border-slate-200 hover:border-blue-200 shadow-sm hover:shadow transition-all duration-200 text-[10px] font-bold"
                >
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span>Prescribe</span>
                </button>

                {/* Button 3: Move to IPD / Emergency */}
                <button
                  onClick={() => handleOpenIpdModal(patient)}
                  title="Transfer patient from OPD to IPD/Emergency"
                  className="flex flex-col items-center justify-center gap-1 px-1 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 shadow-sm hover:shadow transition-all duration-200 text-[10px] font-bold"
                >
                  <ArrowRightLeft className="w-4 h-4 text-rose-500" />
                  <span>Transfer</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* ==========================================
          4. Quick Action Modal Dialogs (Overlay)
          ========================================== */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col justify-between animate-in fade-in duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {activeModal === "lab" && "Assign Lab Test"}
                  {activeModal === "prescription" && "Send Prescription"}
                  {activeModal === "transfer" && "Transfer Department"}
                  {activeModal === "add_patient" && "Register New Patient"}
                </h3>
                {selectedPatient && activeModal !== "add_patient" && (
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">
                    Patient: {selectedPatient.name} ({selectedPatient.id})
                  </p>
                )}
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Forms */}
            <div className="p-6">
              
              {/* Form A: Assign Lab Test */}
              {activeModal === "lab" && (
                <form onSubmit={handleAssignLabTest} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Select Laboratory Investigations
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {LAB_TEST_OPTIONS.map((test) => (
                        <label
                          key={test}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                            labForm.tests.includes(test)
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                              : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={labForm.tests.includes(test)}
                            onChange={() => handleToggleLabTest(test)}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500/20 border-slate-300"
                          />
                          {test}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Clinical notes / Instructions
                    </label>
                    <textarea
                      placeholder="Enter special directives, symptoms, or precautions..."
                      value={labForm.notes}
                      onChange={(e) => setLabForm((prev) => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow transition-all"
                    >
                      Assign Lab Test
                    </button>
                  </div>
                </form>
              )}

              {/* Form B: Send Prescription */}
              {activeModal === "prescription" && (
                <form onSubmit={handleSendPrescription} className="space-y-4">
                  <div className="max-h-[45vh] overflow-y-auto pr-1 space-y-4 border-b border-slate-100 pb-4">
                    {prescriptionForm.medications.map((med, index) => (
                      <div key={index} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-3 relative">
                        {prescriptionForm.medications.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMedicationRow(index)}
                            className="absolute top-2.5 right-2.5 text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-slate-200/50 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <h4 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                          Medication #{index + 1}
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                              Medication Name *
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Metformin"
                              value={med.medication}
                              onChange={(e) =>
                                handleMedicationFieldChange(index, "medication", e.target.value)
                              }
                              required
                              className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                              Dosage / Strength *
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 500mg"
                              value={med.dosage}
                              onChange={(e) =>
                                handleMedicationFieldChange(index, "dosage", e.target.value)
                              }
                              required
                              className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                              Frequency
                            </label>
                            <select
                              value={med.frequency}
                              onChange={(e) =>
                                handleMedicationFieldChange(index, "frequency", e.target.value)
                              }
                              className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
                            >
                              <option value="Once daily">Once daily</option>
                              <option value="Twice daily">Twice daily</option>
                              <option value="Three times daily">Three times daily</option>
                              <option value="Four times daily">Four times daily</option>
                              <option value="Every 4 hours">Every 4 hours</option>
                              <option value="Every 8 hours">Every 8 hours</option>
                              <option value="As needed">As needed</option>
                              <option value="At bedtime">At bedtime</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                              Duration *
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 7 days"
                              value={med.duration}
                              onChange={(e) =>
                                handleMedicationFieldChange(index, "duration", e.target.value)
                              }
                              required
                              className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddMedicationRow}
                    className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-blue-200 hover:border-blue-400 text-blue-600 hover:text-blue-700 bg-blue-50/20 hover:bg-blue-50/50 rounded-xl text-xs font-bold transition-all"
                  >
                    <Plus className="w-4 h-4 animate-bounce" />
                    Add Another Tablet / Medication
                  </button>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Pharmacy Notes / Instructions
                    </label>
                    <textarea
                      placeholder="e.g. Take after meals, dissolve in water..."
                      value={prescriptionForm.notes}
                      onChange={(e) =>
                        setPrescriptionForm((prev) => ({ ...prev, notes: e.target.value }))
                      }
                      rows={2}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow transition-all"
                    >
                      Send Prescription
                    </button>
                  </div>
                </form>
              )}

              {/* Form E: Edit Single Prescription */}
              {activeModal === "edit_prescription" && (
                <form onSubmit={handleSaveEditedPrescription} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Medication Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Metformin"
                        value={editMedicationForm.medication}
                        onChange={(e) =>
                          setEditMedicationForm((prev) => ({ ...prev, medication: e.target.value }))
                        }
                        required
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Dosage / Strength *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 500mg"
                        value={editMedicationForm.dosage}
                        onChange={(e) =>
                          setEditMedicationForm((prev) => ({ ...prev, dosage: e.target.value }))
                        }
                        required
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Frequency
                      </label>
                      <select
                        value={editMedicationForm.frequency}
                        onChange={(e) =>
                          setEditMedicationForm((prev) => ({ ...prev, frequency: e.target.value }))
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
                      >
                        <option value="Once daily">Once daily</option>
                        <option value="Twice daily">Twice daily</option>
                        <option value="Three times daily">Three times daily</option>
                        <option value="Four times daily">Four times daily</option>
                        <option value="Every 4 hours">Every 4 hours</option>
                        <option value="Every 8 hours">Every 8 hours</option>
                        <option value="As needed">As needed</option>
                        <option value="At bedtime">At bedtime</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Duration *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 7 days"
                        value={editMedicationForm.duration}
                        onChange={(e) =>
                          setEditMedicationForm((prev) => ({ ...prev, duration: e.target.value }))
                        }
                        required
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow transition-all"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              )}

              {/* Form C: Transfer Ward (IPD/Emergency) */}
              {activeModal === "transfer" && (
                <form onSubmit={handleMoveToIPD} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Target Department
                      </label>
                      <select
                        value={transferForm.department}
                        onChange={(e) =>
                          setTransferForm((prev) => ({ ...prev, department: e.target.value }))
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
                      >
                        <option value="IPD Admission">IPD Admission</option>
                        <option value="Emergency Department">Emergency Department</option>
                        <option value="Critical Care">Critical Care</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Ward Room Type
                      </label>
                      <select
                        value={transferForm.ward}
                        onChange={(e) =>
                          setTransferForm((prev) => ({ ...prev, ward: e.target.value }))
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
                      >
                        <option value="General Ward">General Ward</option>
                        <option value="Semi-Private Room">Semi-Private Room</option>
                        <option value="Private Suite">Private Suite</option>
                        <option value="ICU Bed">ICU Bed</option>
                        <option value="Emergency Bed">Emergency Bed</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Clinical Reason for Transfer *
                    </label>
                    <textarea
                      placeholder="Document justification, status changes, or immediate surgical needs..."
                      value={transferForm.reason}
                      onChange={(e) =>
                        setTransferForm((prev) => ({ ...prev, reason: e.target.value }))
                      }
                      rows={3}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow transition-all"
                    >
                      Confirm Transfer
                    </button>
                  </div>
                </form>
              )}

              {/* Form D: Add New Patient */}
              {activeModal === "add_patient" && (
                <form onSubmit={handleAddPatient} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Patient Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Harish Chandra"
                      value={newPatientForm.name}
                      onChange={(e) =>
                        setNewPatientForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Age *
                      </label>
                      <input
                        type="number"
                        placeholder="Age"
                        value={newPatientForm.age}
                        onChange={(e) =>
                          setNewPatientForm((prev) => ({ ...prev, age: e.target.value }))
                        }
                        required
                        min="1"
                        max="120"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Gender
                      </label>
                      <select
                        value={newPatientForm.gender}
                        onChange={(e) =>
                          setNewPatientForm((prev) => ({ ...prev, gender: e.target.value }))
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Assigned Doctor
                      </label>
                      <input
                        type="text"
                        value={newPatientForm.doctor}
                        disabled
                        className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 cursor-not-allowed font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Diagnosis / Issue *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Pneumonia"
                        value={newPatientForm.diagnosis}
                        onChange={(e) =>
                          setNewPatientForm((prev) => ({ ...prev, diagnosis: e.target.value }))
                        }
                        required
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Status
                      </label>
                      <select
                        value={newPatientForm.treatmentStatus}
                        onChange={(e) =>
                          setNewPatientForm((prev) => ({ ...prev, treatmentStatus: e.target.value }))
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
                      >
                        <option value="Active">Active</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Completed">Completed</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Priority
                      </label>
                      <select
                        value={newPatientForm.priority}
                        onChange={(e) =>
                          setNewPatientForm((prev) => ({ ...prev, priority: e.target.value }))
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Emergency">Emergency</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow transition-all"
                    >
                      Register Patient
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TreatmentPlans;
