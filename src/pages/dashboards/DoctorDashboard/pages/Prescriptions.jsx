/* eslint-disable react/prop-types */
// src/pages/dashboards/DoctorDashboard/pages/Prescriptions.jsx
import React, { useState } from 'react';
import DataTable from '../../../../components/ui/Tables/DataTable';
import Button from '../../../../components/common/Button/Button';
import Modal from '../../../../components/common/Modal/Modal';
import Toast from '../../../../components/common/Toast/Toast';
import {
  Visibility,
  Download,
  LocalHospital,
  History,
  CheckCircle,
  AccessTime
} from "@mui/icons-material";

const INITIAL_PRESCRIPTIONS = [
  {
    prescription_id: "PR-2026-0001",
    prescription_number: "PR-2026-0001",
    prescription_date: new Date().toISOString().split("T")[0],
    patient_ref: "PAT-1001",
    patient_name: "Ramesh Kumar",
    age: 45,
    gender: "Male",
    diagnosis: "Hypertension (Chronic Phase)",
    doctor_name: "Dr. Sharma",
    symptoms: "Dizziness under control. Blood pressure stabilized at 128/82 mmHg.",
    is_dispensed: true,
    medicines: [
      {
        medicine_name: "Amlodipine",
        dosage_text: "5mg",
        frequency: "Once daily",
        duration_days: 90,
        route: "ORAL",
        before_food: false,
        after_food: true,
        instructions: "Continue morning dose."
      },
      {
        medicine_name: "Telmisartan",
        dosage_text: "40mg",
        frequency: "Once daily",
        duration_days: 90,
        route: "ORAL",
        before_food: false,
        after_food: true,
        instructions: "Take in the morning along with Amlodipine."
      },
      {
        medicine_name: "Atorvastatin",
        dosage_text: "10mg",
        frequency: "At bedtime",
        duration_days: 90,
        route: "ORAL",
        before_food: false,
        after_food: false,
        instructions: "Take before sleeping."
      }
    ],
    general_instructions: "Continue dynamic cardiovascular monitoring daily.",
    diet_instructions: "Low sodium DASH diet.",
    follow_up_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  },
  {
    prescription_id: "PR-2026-0002",
    prescription_number: "PR-2026-0002",
    prescription_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    patient_ref: "PAT-1002",
    patient_name: "Sita Devi",
    age: 32,
    gender: "Female",
    diagnosis: "Diabetes (Type 2)",
    doctor_name: "Dr. Priya",
    symptoms: "HbA1c slightly elevated at 7.4%. Polydipsia persistent.",
    is_dispensed: true,
    medicines: [
      {
        medicine_name: "Metformin",
        dosage_text: "500mg",
        frequency: "Twice daily",
        duration_days: 60,
        route: "ORAL",
        before_food: false,
        after_food: true,
        instructions: "Increased dose from 500mg OD to BD."
      },
      {
        medicine_name: "Glipizide",
        dosage_text: "5mg",
        frequency: "Once daily",
        duration_days: 60,
        route: "ORAL",
        before_food: true,
        after_food: false,
        instructions: "Added new tablet. Take 30 minutes before breakfast."
      }
    ],
    general_instructions: "Monitor blood sugar levels twice daily.",
    diet_instructions: "Strict sugar and refined carbs restriction.",
    follow_up_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  },
  {
    prescription_id: "PR-2026-0003",
    prescription_number: "PR-2026-0003",
    prescription_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    patient_ref: "PAT-1001",
    patient_name: "Ramesh Kumar",
    age: 45,
    gender: "Male",
    diagnosis: "Hypertension (Dose Titration)",
    doctor_name: "Dr. Sharma",
    symptoms: "Dizziness reported. Blood pressure elevated at 145/95 mmHg.",
    is_dispensed: true,
    medicines: [
      {
        medicine_name: "Amlodipine",
        dosage_text: "5mg",
        frequency: "Once daily",
        duration_days: 60,
        route: "ORAL",
        before_food: false,
        after_food: true,
        instructions: "Dose increased from 2.5mg to 5mg."
      },
      {
        medicine_name: "Hydrochlorothiazide",
        dosage_text: "12.5mg",
        frequency: "Once daily",
        duration_days: 60,
        route: "ORAL",
        before_food: false,
        after_food: true,
        instructions: "Take in the morning. Replaces Telmisartan temporarily."
      }
    ],
    general_instructions: "Keep daily track of BP readings.",
    diet_instructions: "Strict low salt intake.",
    follow_up_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  },
  {
    prescription_id: "PR-2026-0004",
    prescription_number: "PR-2026-0004",
    prescription_date: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    patient_ref: "PAT-1002",
    patient_name: "Sita Devi",
    age: 32,
    gender: "Female",
    diagnosis: "Diabetes (Glycemic Check)",
    doctor_name: "Dr. Priya",
    symptoms: "Fasting blood sugar 140 mg/dL. Checking response to Metformin.",
    is_dispensed: true,
    medicines: [
      {
        medicine_name: "Metformin",
        dosage_text: "500mg",
        frequency: "Once daily",
        duration_days: 90,
        route: "ORAL",
        before_food: false,
        after_food: true,
        instructions: "Take with breakfast."
      }
    ],
    general_instructions: "Follow diet plan strictly.",
    diet_instructions: "Low glycemic index foods only.",
    follow_up_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  },
  {
    prescription_id: "PR-2026-0005",
    prescription_number: "PR-2026-0005",
    prescription_date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    patient_ref: "PAT-1001",
    patient_name: "Ramesh Kumar",
    age: 45,
    gender: "Male",
    diagnosis: "Hypertension (Diagnosis)",
    doctor_name: "Dr. Sharma",
    symptoms: "Complaining of headache and chest heaviness.",
    is_dispensed: true,
    medicines: [
      {
        medicine_name: "Amlodipine",
        dosage_text: "2.5mg",
        frequency: "Once daily",
        duration_days: 90,
        route: "ORAL",
        before_food: false,
        after_food: true,
        instructions: "Initial trial dosage."
      }
    ],
    general_instructions: "Start regular blood pressure charting.",
    diet_instructions: "Avoid pickles, canned food, and high-sodium snacks.",
    follow_up_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  },
  {
    prescription_id: "PR-2026-0006",
    prescription_number: "PR-2026-0006",
    prescription_date: new Date(Date.now() - 240 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    patient_ref: "PAT-1002",
    patient_name: "Sita Devi",
    age: 32,
    gender: "Female",
    diagnosis: "Diabetes (First Visit)",
    doctor_name: "Dr. Priya",
    symptoms: "Polydipsia, polyuria, unexplained fatigue.",
    is_dispensed: true,
    medicines: [
      {
        medicine_name: "Metformin",
        dosage_text: "500mg",
        frequency: "Once daily",
        duration_days: 90,
        route: "ORAL",
        before_food: false,
        after_food: true,
        instructions: "Initial start to oral hypoglycemic medication."
      }
    ],
    general_instructions: "Regular morning walks (30 mins). Check blood sugar weekly.",
    diet_instructions: "Strict sugar and high starch exclusion.",
    follow_up_date: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  },
  {
    prescription_id: "PR-2026-0007",
    prescription_number: "PR-2026-0007",
    prescription_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    patient_ref: "PAT-1001",
    patient_name: "Ramesh Kumar",
    age: 45,
    gender: "Male",
    diagnosis: "Borderline Hypertension",
    doctor_name: "Dr. Sharma",
    symptoms: "Slight headache during work stress.",
    is_dispensed: true,
    medicines: [],
    general_instructions: "No medications prescribed yet. Focus on lifestyle changes.",
    diet_instructions: "DASH diet guidelines provided.",
    follow_up_date: new Date(Date.now() - 270 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  },
  {
    prescription_id: "PR-2026-0008",
    prescription_number: "PR-2026-0008",
    prescription_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    patient_ref: "PAT-1003",
    patient_name: "Mohan Rao",
    age: 58,
    gender: "Male",
    diagnosis: "Chronic Asthma (Exacerbation)",
    doctor_name: "Dr. Rajesh",
    symptoms: "Wheezing during winter cold.",
    is_dispensed: false,
    medicines: [
      {
        medicine_name: "Albuterol Inhaler",
        dosage_text: "100mcg",
        frequency: "As needed",
        duration_days: 90,
        route: "INHALATION",
        before_food: false,
        after_food: false,
        instructions: "2 puffs every 4-6 hours when experiencing wheezing."
      },
      {
        medicine_name: "Fluticasone propionate",
        dosage_text: "110mcg",
        frequency: "Twice daily",
        duration_days: 90,
        route: "INHALATION",
        before_food: false,
        after_food: false,
        instructions: "Rinse mouth thoroughly with water after inhalation."
      }
    ],
    general_instructions: "Avoid cold exposures and allergen triggers.",
    diet_instructions: "Warm beverages preferred.",
    follow_up_date: ""
  },
  {
    prescription_id: "PR-2026-0009",
    prescription_number: "PR-2026-0009",
    prescription_date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    patient_ref: "PAT-1003",
    patient_name: "Mohan Rao",
    age: 58,
    gender: "Male",
    diagnosis: "Chronic Asthma (Check-up)",
    doctor_name: "Dr. Rajesh",
    symptoms: "Mild persistent dry cough in cold weather.",
    is_dispensed: true,
    medicines: [
      {
        medicine_name: "Albuterol Inhaler",
        dosage_text: "100mcg",
        frequency: "As needed",
        duration_days: 90,
        route: "INHALATION",
        before_food: false,
        after_food: false,
        instructions: "Carry inhaler everywhere."
      }
    ],
    general_instructions: "Avoid dust and smoke environments.",
    diet_instructions: "Increase intake of vitamin C rich fruits.",
    follow_up_date: ""
  }
];

const Prescriptions = () => {
  const [prescriptions] = useState(INITIAL_PRESCRIPTIONS);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [toast, setToast] = useState(null);

  const handleDownloadPDF = (prescription) => {
    setToast({
      message: `Downloading PDF copy of prescription ${prescription.prescription_number}...`,
      type: 'info'
    });
  };

  const handleViewPrescription = (prescription) => {
    setSelectedPrescription(prescription);
    setIsViewModalOpen(true);
  };

  // Filter list by search query & time range
  const filteredPrescriptions = prescriptions.filter(item => {
    // 1. Search filter
    const matchesSearch = 
      item.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.prescription_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.diagnosis.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    // 2. Date ranges
    const itemDate = new Date(item.prescription_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateFilter === 'today') {
      const itemDay = new Date(itemDate);
      itemDay.setHours(0, 0, 0, 0);
      return itemDay.getTime() === today.getTime();
    }

    if (dateFilter === 'weekly') {
      const oneWeekAgo = new Date(today);
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return itemDate >= oneWeekAgo;
    }

    if (dateFilter === 'monthly') {
      const oneMonthAgo = new Date(today);
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      return itemDate >= oneMonthAgo;
    }

    if (dateFilter === 'custom') {
      if (customStartDate) {
        const start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        if (itemDate < start) return false;
      }
      if (customEndDate) {
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        if (itemDate > end) return false;
      }
    }

    return true;
  });

  const totalCount = prescriptions.length;
  const dispensedCount = prescriptions.filter(p => p.is_dispensed).length;
  const pendingCount = prescriptions.filter(p => !p.is_dispensed).length;

  return (
    <>
      <div className="animate-fade-in p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <History className="text-blue-600" />
              Prescription History
            </h2>
            <p className="text-sm text-gray-500">Track and review previous prescriptions assigned to patients from treatment plans</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Prescriptions */}
          <div className="relative bg-gradient-to-br from-white to-blue-50 p-5 rounded-2xl border border-blue-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200 rounded-full -translate-y-8 translate-x-8 opacity-20"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Total Prescribed</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalCount}</p>
              </div>
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
                <LocalHospital className="text-white text-base" />
              </div>
            </div>
            <div className="relative mt-4 pt-3 border-t border-blue-100">
              <p className="text-xs text-blue-700 font-medium">All archived prescriptions</p>
            </div>
          </div>

          {/* Pending Dispense */}
          <div className="relative bg-gradient-to-br from-white to-yellow-50 p-5 rounded-2xl border border-yellow-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-200 rounded-full -translate-y-8 translate-x-8 opacity-20"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wider">Pending Dispense</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{pendingCount}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center shadow-md">
                <AccessTime className="text-white text-base" />
              </div>
            </div>
            <div className="relative mt-4 pt-3 border-t border-yellow-100">
              <p className="text-xs text-yellow-700 font-medium">Awaiting pharmacy fulfillment</p>
            </div>
          </div>

          {/* Dispensed */}
          <div className="relative bg-gradient-to-br from-white to-emerald-50 p-5 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-200 rounded-full -translate-y-8 translate-x-8 opacity-20"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Dispensed</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{dispensedCount}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center shadow-md">
                <CheckCircle className="text-white text-base" />
              </div>
            </div>
            <div className="relative mt-4 pt-3 border-t border-emerald-100">
              <p className="text-xs text-emerald-700 font-medium">Fitted by pharmacy log</p>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white p-4 rounded-xl border card-shadow">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                placeholder="Search patient, ID, or diagnosis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Time period filter */}
            <div>
              <select
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">All Prescriptions</option>
                <option value="today">Today</option>
                <option value="weekly">This Week (7 Days)</option>
                <option value="monthly">This Month (30 Days)</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <input
                type="date"
                className={`w-full px-3 py-2 border rounded-lg text-sm bg-white ${
                  dateFilter === 'custom' ? 'opacity-100' : 'opacity-40 cursor-not-allowed'
                }`}
                disabled={dateFilter !== 'custom'}
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
            </div>

            {/* End Date */}
            <div>
              <input
                type="date"
                className={`w-full px-3 py-2 border rounded-lg text-sm bg-white ${
                  dateFilter === 'custom' ? 'opacity-100' : 'opacity-40 cursor-not-allowed'
                }`}
                disabled={dateFilter !== 'custom'}
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="bg-white rounded border card-shadow overflow-hidden">
          <DataTable
            columns={[
              { key: 'prescription_number', title: 'Prescription ID', sortable: true, className: 'min-w-[120px] text-center font-mono text-xs' },
              { key: 'patient_name', title: 'Patient Name', sortable: true, className: 'min-w-[150px] font-semibold text-gray-805' },
              { key: 'diagnosis', title: 'Diagnosis', sortable: true, className: 'min-w-[160px] text-blue-700 font-medium' },
              { key: 'prescription_date', title: 'Prescribed Date', sortable: true, className: 'min-w-[120px] text-center text-xs' },
              {
                key: 'medicines',
                title: 'Medications',
                className: 'min-w-[200px]',
                render: (val) => (
                  <div className="space-y-1">
                    {val.map((m, idx) => (
                      <span key={idx} className="inline-block px-2 py-0.5 bg-gray-50 border border-gray-200 rounded text-xs text-gray-700 mr-1 font-medium">
                        {m.medicine_name} ({m.dosage_text})
                      </span>
                    ))}
                  </div>
                )
              },
              {
                key: 'is_dispensed',
                title: 'Status',
                sortable: true,
                className: 'min-w-[120px] text-center',
                render: (val) => (
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    val 
                      ? 'border-green-250 bg-green-50 text-green-700' 
                      : 'border-yellow-250 bg-yellow-50 text-yellow-700'
                  }`}>
                    {val ? 'DISPENSED' : 'PENDING'}
                  </span>
                )
              },
              {
                key: 'actions',
                title: 'Actions',
                className: 'min-w-[150px] text-center',
                render: (_, row) => (
                  <div className="flex gap-2 justify-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleViewPrescription(row)}
                      className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 transition-colors font-semibold text-xs flex items-center gap-1"
                      title="View Details"
                    >
                      <Visibility sx={{ fontSize: 14 }} /> View
                    </button>
                    <button
                      onClick={() => handleDownloadPDF(row)}
                      className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors font-semibold text-xs flex items-center gap-1"
                      title="Download Prescription Copy"
                    >
                      <Download sx={{ fontSize: 14 }} /> PDF
                    </button>
                  </div>
                )
              }
            ]}
            data={filteredPrescriptions}
            emptyMessage="No prescription records found."
          />
        </div>
      </div>


      {/* View Prescription Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedPrescription(null);
        }}
        title="Archived Patient Prescription Copy"
        size="md"
      >
        {selectedPrescription && (
          <div className="space-y-4">
            <div className="flex justify-between items-start pb-3 border-b">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Patient Name</p>
                <h4 className="text-lg font-bold text-gray-900">{selectedPrescription.patient_name}</h4>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                selectedPrescription.is_dispensed 
                  ? 'border-green-200 bg-green-50 text-green-700' 
                  : 'border-yellow-200 bg-yellow-50 text-yellow-700'
              }`}>
                {selectedPrescription.is_dispensed ? 'DISPENSED' : 'PENDING FULFILLMENT'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <p className="text-xs font-semibold text-gray-500">Prescription ID</p>
                <p className="text-sm font-semibold text-gray-800 font-mono">{selectedPrescription.prescription_id}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">Prescribed Date</p>
                <p className="text-sm font-semibold text-gray-800">{selectedPrescription.prescription_date}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">Clinical Diagnosis</p>
                <p className="text-sm font-semibold text-blue-755">{selectedPrescription.diagnosis}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">Consulting Doctor</p>
                <p className="text-sm font-semibold text-gray-800">{selectedPrescription.doctor_name}</p>
              </div>
            </div>

            {selectedPrescription.symptoms && (
              <div className="p-2.5 bg-gray-50 border rounded-lg">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">Symptoms</p>
                <p className="text-xs text-gray-800 italic">{selectedPrescription.symptoms}</p>
              </div>
            )}

            {/* Meds List */}
            <div className="p-3 bg-gray-50 border rounded-xl space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Prescribed Medicines</p>
              <div className="space-y-2">
                {selectedPrescription.medicines.map((m, idx) => (
                  <div key={idx} className="p-2.5 bg-white border rounded-lg text-xs space-y-1">
                    <p className="font-bold text-gray-800">{idx + 1}. {m.medicine_name} ({m.dosage_text})</p>
                    <p className="text-gray-600">Route: {m.route} | Frequency: {m.frequency} | Duration: {m.duration_days} days</p>
                    {(m.before_food || m.after_food) && (
                      <p className="text-blue-700 font-semibold">
                        Food Guidance: {m.before_food ? 'Take before meals.' : ''} {m.after_food ? 'Take after meals.' : ''}
                      </p>
                    )}
                    {m.instructions && (
                      <p className="text-gray-500 italic">Instruction: {m.instructions}</p>
                    )}
                  </div>
                ))}
              </div>

              {(selectedPrescription.general_instructions || selectedPrescription.diet_instructions) && (
                <div className="border-t pt-2 space-y-2">
                  {selectedPrescription.general_instructions && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-450 uppercase tracking-widest">General Advice</p>
                      <p className="text-xs text-gray-800 leading-relaxed font-semibold">{selectedPrescription.general_instructions}</p>
                    </div>
                  )}
                  {selectedPrescription.diet_instructions && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-450 uppercase tracking-widest">Diet Instructions</p>
                      <p className="text-xs text-gray-800 leading-relaxed font-semibold">{selectedPrescription.diet_instructions}</p>
                    </div>
                  )}
                </div>
              )}

              {selectedPrescription.follow_up_date && (
                <div className="border-t pt-2">
                  <p className="text-[10px] font-bold text-gray-450 uppercase tracking-widest">Next Follow-up Date</p>
                  <p className="text-xs text-indigo-700 font-bold">{selectedPrescription.follow_up_date}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedPrescription(null);
                }}
              >
                Close
              </Button>
              <Button 
                variant="primary" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1"
                onClick={() => {
                  handleDownloadPDF(selectedPrescription);
                }}
              >
                <Download sx={{ fontSize: 16 }} /> Download Copy
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Toast Notifications */}
      {toast && (
        <Toast key={toast.message + Date.now()} message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  );
};

export default Prescriptions;