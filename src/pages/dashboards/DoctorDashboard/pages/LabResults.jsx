/* eslint-disable react/prop-types */
// src/pages/dashboards/DoctorDashboard/pages/LabResults.jsx
import React, { useState } from 'react';
import DataTable from '../../../../components/ui/Tables/DataTable';
import Button from '../../../../components/common/Button/Button';
import Modal from '../../../../components/common/Modal/Modal';
import Toast from '../../../../components/common/Toast/Toast';
import {
  Visibility,
  CheckCircle,
  AccessTime,
  Science,
  Download,
  RateReview
} from "@mui/icons-material";

const INITIAL_LAB_RESULTS = [
  // Ramesh Kumar (PAT-1001) - 4 records (yearly 2 to 4 visits)
  {
    id: "LAB-REQ-1001",
    patientId: "PAT-1001",
    patientName: "Ramesh Kumar",
    age: 45,
    gender: "Male",
    testType: "Blood Test, Lipid Profile",
    referringDoctor: "Dr. Sharma",
    labTechnician: "Anand Verma",
    status: 'Pending Review',
    fileName: 'ramesh_kumar_lipid_profile_today.pdf',
    resultSummary: 'Cholesterol: 210 mg/dL (Elevated), Triglycerides: 185 mg/dL (Elevated), HDL: 42 mg/dL, LDL: 131 mg/dL',
    technicianNotes: 'Slightly elevated lipids. Patient was fasting. Suggest clinical correlation.',
    dateCompleted: new Date().toISOString().split("T")[0],
    doctorNotes: '',
    severity: 'Mild'
  },
  {
    id: "LAB-REQ-1003",
    patientId: "PAT-1001",
    patientName: "Ramesh Kumar",
    age: 45,
    gender: "Male",
    testType: "Basic Metabolic Panel (BMP)",
    referringDoctor: "Dr. Sharma",
    labTechnician: "Anand Verma",
    status: 'Reviewed',
    fileName: 'ramesh_kumar_bmp_3months.pdf',
    resultSummary: 'Glucose: 98 mg/dL, Calcium: 9.4 mg/dL, Sodium: 139 mEq/L, Potassium: 4.1 mEq/L',
    technicianNotes: 'All electrolyte levels and kidney function metrics are within the standard reference range.',
    dateCompleted: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    doctorNotes: 'Kidney markers normal. Patient metabolic parameters are stable.',
    severity: 'Normal'
  },
  {
    id: "LAB-REQ-1005",
    patientId: "PAT-1001",
    patientName: "Ramesh Kumar",
    age: 45,
    gender: "Male",
    testType: "Lipid Profile (Past Check)",
    referringDoctor: "Dr. Sharma",
    labTechnician: "Anand Verma",
    status: 'Reviewed',
    fileName: 'ramesh_kumar_lipid_profile_6months.pdf',
    resultSummary: 'Cholesterol: 235 mg/dL (Elevated), Triglycerides: 210 mg/dL (Elevated), HDL: 39 mg/dL, LDL: 154 mg/dL',
    technicianNotes: 'High lipid values detected. Recommended starting medication trial and diet tracking.',
    dateCompleted: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    doctorNotes: 'BP is elevated and lipid panel is high. Prescribed trial Amlodipine 2.5mg.',
    severity: 'Moderate'
  },
  {
    id: "LAB-REQ-1007",
    patientId: "PAT-1001",
    patientName: "Ramesh Kumar",
    age: 45,
    gender: "Male",
    testType: "Complete Blood Count (CBC)",
    referringDoctor: "Dr. Sharma",
    labTechnician: "Anand Verma",
    status: 'Reviewed',
    fileName: 'ramesh_kumar_cbc_12months.pdf',
    resultSummary: 'WBC: 6.2 x10^3/uL, RBC: 4.8 x10^6/uL, Hemoglobin: 15.2 g/dL, Platelets: 240 x10^3/uL',
    technicianNotes: 'Hematology parameters indicate normal cellular counts and indices.',
    dateCompleted: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    doctorNotes: 'Annual general blood count check is fully normal.',
    severity: 'Normal'
  },

  // Sita Devi (PAT-1002) - 3 records (yearly 2 to 4 visits)
  {
    id: "LAB-REQ-1002",
    patientId: "PAT-1002",
    patientName: "Sita Devi",
    age: 32,
    gender: "Female",
    testType: "HbA1c Test",
    referringDoctor: "Dr. Priya",
    labTechnician: "Anand Verma",
    status: 'Reviewed',
    fileName: 'sita_devi_hba1c_report_recent.pdf',
    resultSummary: 'Fasting Blood Glucose: 112 mg/dL, HbA1c: 6.2%',
    technicianNotes: 'Borderline elevated HbA1c, recommend lifestyle adjustments and follow-up in 3 months.',
    dateCompleted: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    doctorNotes: 'Advised morning walks and low carbohydrate diet. Recheck HbA1c after 90 days.',
    severity: 'Normal'
  },
  {
    id: "LAB-REQ-1004",
    patientId: "PAT-1002",
    patientName: "Sita Devi",
    age: 32,
    gender: "Female",
    testType: "Fasting Blood Glucose (BMP)",
    referringDoctor: "Dr. Priya",
    labTechnician: "Anand Verma",
    status: 'Reviewed',
    fileName: 'sita_devi_glucose_4months.pdf',
    resultSummary: 'Fasting Blood Glucose: 135 mg/dL (Elevated), Serum Creatinine: 0.8 mg/dL',
    technicianNotes: 'High fasting sugar readings. Advised clinical correlation and starting Metformin.',
    dateCompleted: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    doctorNotes: 'Confirmed impaired glucose tolerance. Started Metformin 500mg Once Daily.',
    severity: 'Mild'
  },
  {
    id: "LAB-REQ-1006",
    patientId: "PAT-1002",
    patientName: "Sita Devi",
    age: 32,
    gender: "Female",
    testType: "Oral Glucose Tolerance Test (OGTT)",
    referringDoctor: "Dr. Priya",
    labTechnician: "Anand Verma",
    status: 'Reviewed',
    fileName: 'sita_devi_ogtt_8months.pdf',
    resultSummary: 'Fasting: 95 mg/dL, 1-Hour: 185 mg/dL, 2-Hour: 148 mg/dL',
    technicianNotes: 'Elevated post-prandial levels. Patient exhibits insulin resistance signs.',
    dateCompleted: new Date(Date.now() - 240 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    doctorNotes: 'Discussed exercise regimen and weight management advice.',
    severity: 'Mild'
  },

  // Mohan Rao (PAT-1003) - 2 records
  {
    id: "LAB-REQ-1008",
    patientId: "PAT-1003",
    patientName: "Mohan Rao",
    age: 58,
    gender: "Male",
    testType: "Urine Culture",
    referringDoctor: "Dr. Rajesh",
    labTechnician: "Anand Verma",
    status: 'Pending Review',
    fileName: 'mohan_rao_urine_culture.pdf',
    resultSummary: 'No significant bacterial growth detected after 48 hours of incubation.',
    technicianNotes: 'Sample volume was adequate. Cultured on MacConkey and Blood Agar.',
    dateCompleted: new Date().toISOString().split("T")[0],
    doctorNotes: '',
    severity: 'Normal'
  },
  {
    id: "LAB-REQ-1009",
    patientId: "PAT-1003",
    patientName: "Mohan Rao",
    age: 58,
    gender: "Male",
    testType: "Renal Function Panel",
    referringDoctor: "Dr. Rajesh",
    labTechnician: "Anand Verma",
    status: 'Reviewed',
    fileName: 'mohan_rao_renal_panel_6months.pdf',
    resultSummary: 'BUN: 18 mg/dL, Creatinine: 1.1 mg/dL, eGFR: 78 mL/min/1.73m2',
    technicianNotes: 'Kidney profile is normal. BUN-to-creatinine ratio is optimal.',
    dateCompleted: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    doctorNotes: 'Renal panel is steady. Safe to continue asthma therapeutic inhaler regimen.',
    severity: 'Normal'
  }
];

const LabResults = () => {
  const [results, setResults] = useState(INITIAL_LAB_RESULTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [severity, setSeverity] = useState('Normal');
  const [toast, setToast] = useState(null);

  // Statistics calculation
  const totalCount = results.length;
  const pendingCount = results.filter(r => r.status === 'Pending Review').length;
  const reviewedCount = results.filter(r => r.status === 'Reviewed').length;

  const handleOpenReview = (report) => {
    setSelectedReport(report);
    setDoctorNotes(report.doctorNotes || '');
    setSeverity(report.severity || 'Normal');
    setShowReviewModal(true);
  };

  const handleOpenView = (report) => {
    setSelectedReport(report);
    setShowViewModal(true);
  };

  const handleCompleteReview = (report) => {
    setResults(prev => prev.map(r => 
      r.id === report.id 
        ? { 
            ...r, 
            status: 'Reviewed',
            reviewDate: new Date().toISOString().split("T")[0]
          } 
        : r
    ));
    setToast({
      message: `Review completed successfully for ${report.patientName}. Report moved to completed section.`,
      type: 'success'
    });
  };

  const handleResign = (report) => {
    setResults(prev => prev.map(r => 
      r.id === report.id 
        ? { 
            ...r, 
            status: 'Pending Review',
            doctorNotes: '',
            reviewDate: ''
          } 
        : r
    ));
    setToast({
      message: `Lab report for ${report.patientName} has been resigned back to pending review list.`,
      type: 'info'
    });
  };

  const submitReview = () => {
    if (!selectedReport) return;
    
    setResults(prev => prev.map(r => 
      r.id === selectedReport.id 
        ? { 
            ...r, 
            status: 'Reviewed', 
            doctorNotes: doctorNotes, 
            severity: severity,
            reviewDate: new Date().toISOString().split("T")[0]
          } 
        : r
    ));

    setToast({
      message: `Successfully reviewed and completed lab report for ${selectedReport.patientName}!`,
      type: 'success'
    });

    setShowReviewModal(false);
    setSelectedReport(null);
  };

  // Filter pending results
  const pendingResults = results.filter(r => 
    r.status === 'Pending Review' && (
      r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.testType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.referringDoctor.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Filter completed results
  const completedResults = results.filter(r => 
    r.status === 'Reviewed' && (
      r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.testType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.referringDoctor.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <>
      <div className="animate-fade-in p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Laboratory Results</h2>
            <p className="text-sm text-gray-500">Review patient test results, pathology reports, and clinical sign-off</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Results */}
          <div className="relative bg-gradient-to-br from-white to-blue-50 p-5 rounded-2xl border border-blue-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200 rounded-full -translate-y-8 translate-x-8 opacity-20"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalCount}</p>
              </div>
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
                <Science className="text-white text-base" />
              </div>
            </div>
            <div className="relative mt-4 pt-3 border-t border-blue-100">
              <p className="text-xs text-blue-700 font-medium">All diagnostic lab uploads</p>
            </div>
          </div>

          {/* Pending Review */}
          <div className="relative bg-gradient-to-br from-white to-yellow-50 p-5 rounded-2xl border border-yellow-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-200 rounded-full -translate-y-8 translate-x-8 opacity-20"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wider">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{pendingCount}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center shadow-md">
                <AccessTime className="text-white text-base" />
              </div>
            </div>
            <div className="relative mt-4 pt-3 border-t border-yellow-100">
              <p className="text-xs text-yellow-700 font-medium">Awaiting clinical approval</p>
            </div>
          </div>

          {/* Reviewed & Approved */}
          <div className="relative bg-gradient-to-br from-white to-emerald-50 p-5 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-200 rounded-full -translate-y-8 translate-x-8 opacity-20"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Reviewed</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{reviewedCount}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center shadow-md">
                <CheckCircle className="text-white text-base" />
              </div>
            </div>
            <div className="relative mt-4 pt-3 border-t border-emerald-100">
              <p className="text-xs text-emerald-700 font-medium">Completed and validated records</p>
            </div>
          </div>
        </div>

        {/* Search Toolbar */}
        <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm">
          <div className="max-w-md">
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              placeholder="Search patient, ID, test type or referring doctor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Section 1: Pending Reviews */}
        <div className="bg-white rounded border card-shadow overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <AccessTime className="text-yellow-600" />
                Pending Reviews
              </h3>
              <p className="text-sm text-gray-500 font-medium">Results requiring clinical sign-off</p>
            </div>
            <span className="px-2.5 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">
              {pendingResults.length} Pending
            </span>
          </div>

          <DataTable 
            columns={[
              { key: 'id', title: 'Request ID', sortable: true, className: 'min-w-[100px] text-center font-mono text-xs' },
              { key: 'patientName', title: 'Patient Name', sortable: true, className: 'min-w-[150px] font-semibold text-gray-800' },
              { key: 'testType', title: 'Assigned Test', sortable: true, className: 'min-w-[180px] text-blue-700 font-medium' },
              { key: 'referringDoctor', title: 'Referring Doctor', sortable: true, className: 'min-w-[140px]' },
              { key: 'labTechnician', title: 'Technician', sortable: true, className: 'min-w-[140px]' },
              { 
                key: 'fileName', 
                title: 'Attached Report', 
                className: 'min-w-[180px]',
                render: (value) => (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 border border-gray-200 rounded text-xs font-semibold text-gray-600 font-mono">
                    <i className="far fa-file-pdf text-red-500"></i>
                    {value}
                  </span>
                )
              },
              { 
                key: 'actions', 
                title: 'Actions', 
                className: 'min-w-[240px] text-center',
                render: (_, row) => (
                  <div className="flex gap-2 justify-center" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => handleOpenView(row)}
                      className="px-2.5 py-1.5 bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100 transition-colors font-semibold text-xs flex items-center gap-1"
                    >
                      <Visibility sx={{ fontSize: 14 }} /> View
                    </button>
                    <button 
                      onClick={() => handleCompleteReview(row)}
                      className="px-2.5 py-1.5 bg-green-600 text-white rounded border border-green-700 hover:bg-green-700 transition-colors font-semibold text-xs flex items-center gap-1 shadow-sm font-bold"
                    >
                      <CheckCircle sx={{ fontSize: 14 }} /> Completed
                    </button>
                    <button 
                      onClick={() => handleOpenReview(row)}
                      className="px-2.5 py-1.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-200 hover:bg-indigo-100 transition-colors font-semibold text-xs flex items-center gap-1"
                    >
                      <RateReview sx={{ fontSize: 14 }} /> Resign
                    </button>
                  </div>
                )
              }
            ]}
            data={pendingResults}
            emptyMessage="No reports pending clinical sign-off."
          />
        </div>

        {/* Section 2: Completed Patients Reports */}
        <div className="bg-white rounded border card-shadow overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="text-lg font-semibold text-emerald-800 flex items-center gap-2">
                <CheckCircle className="text-emerald-600" />
                Completed Patients Reports
              </h3>
              <p className="text-sm text-gray-500 font-medium">Successfully completed and validated diagnostic records</p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-850 text-xs font-bold rounded-full">
              {completedResults.length} Completed
            </span>
          </div>

          <DataTable 
            columns={[
              { key: 'id', title: 'Request ID', sortable: true, className: 'min-w-[100px] text-center font-mono text-xs' },
              { key: 'patientName', title: 'Patient Name', sortable: true, className: 'min-w-[150px] font-semibold text-gray-800' },
              { key: 'testType', title: 'Assigned Test', sortable: true, className: 'min-w-[180px] text-blue-700 font-medium' },
              { key: 'referringDoctor', title: 'Referring Doctor', sortable: true, className: 'min-w-[140px]' },
              { key: 'labTechnician', title: 'Technician', sortable: true, className: 'min-w-[140px]' },
              { 
                key: 'fileName', 
                title: 'Attached Report', 
                className: 'min-w-[180px]',
                render: (value) => (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 border border-gray-200 rounded text-xs font-semibold text-gray-600 font-mono">
                    <i className="far fa-file-pdf text-red-500"></i>
                    {value}
                  </span>
                )
              },
              { 
                key: 'actions', 
                title: 'Actions', 
                className: 'min-w-[240px] text-center',
                render: (_, row) => (
                  <div className="flex gap-2 justify-center" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => handleOpenView(row)}
                      className="px-2.5 py-1.5 bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100 transition-colors font-semibold text-xs flex items-center gap-1"
                    >
                      <Visibility sx={{ fontSize: 14 }} /> View
                    </button>
                    <span className="px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-250 rounded flex items-center gap-1">
                      <CheckCircle sx={{ fontSize: 14 }} /> Completed
                    </span>
                    <button 
                      onClick={() => handleResign(row)}
                      className="px-2.5 py-1.5 bg-amber-50 text-amber-700 rounded border border-amber-200 hover:bg-amber-100 transition-colors font-semibold text-xs flex items-center gap-1 font-bold"
                    >
                      <RateReview sx={{ fontSize: 14 }} /> Resign
                    </button>
                  </div>
                )
              }
            ]}
            data={completedResults}
            emptyMessage="No completed clinical reviews found."
          />
        </div>
      </div>

      {/* Details View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedReport(null);
        }}
        title="Lab Test Report Audit View"
        size="md"
      >
        {selectedReport && (
          <div className="space-y-4">
            <div className="flex justify-between items-start pb-3 border-b">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider font-semibold">Patient Name</p>
                <h4 className="text-lg font-bold text-gray-900">{selectedReport.patientName}</h4>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                selectedReport.status === 'Reviewed' 
                  ? 'border-green-200 bg-green-50 text-green-700' 
                  : 'border-yellow-200 bg-yellow-50 text-yellow-700'
              }`}>
                {selectedReport.status === 'Reviewed' ? 'REVIEW COMPLETED' : 'PENDING CLINICAL VALIDATION'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <p className="text-xs font-semibold text-gray-500">Request ID</p>
                <p className="text-sm font-semibold text-gray-800 font-mono">{selectedReport.id}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">Lab Completion Date</p>
                <p className="text-sm font-semibold text-gray-800">{selectedReport.dateCompleted}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">Assigned Test</p>
                <p className="text-sm font-semibold text-blue-750">{selectedReport.testType}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">Lab Technician</p>
                <p className="text-sm font-semibold text-gray-800">{selectedReport.labTechnician}</p>
              </div>
            </div>

            <div className="p-3 bg-gray-50 border rounded-xl space-y-3">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Uploaded PDF Document</p>
                <div className="flex items-center justify-between p-2 bg-white border rounded-lg">
                  <span className="flex items-center gap-2 font-mono text-xs text-gray-700 font-semibold truncate max-w-[220px]">
                    <i className="far fa-file-pdf text-red-500 text-base"></i>
                    {selectedReport.fileName}
                  </span>
                  <button className="text-blue-600 hover:text-blue-750 transition" onClick={() => {
                    setToast({ message: `Downloading report file: ${selectedReport.fileName}...`, type: 'info' })
                  }}>
                    <Download sx={{ fontSize: 18 }} />
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Result Summary Metrics</p>
                <p className="text-sm text-gray-850 bg-white p-2.5 rounded-lg border leading-relaxed font-semibold">
                  {selectedReport.resultSummary || "No metrics uploaded."}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Technician Notes</p>
                <p className="text-sm text-gray-800 bg-white p-2.5 rounded-lg border italic">
                  {selectedReport.technicianNotes || "No remarks logged."}
                </p>
              </div>

              {selectedReport.doctorNotes && (
                <div>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Doctor&apos;s Recommendations &amp; Prescription</p>
                  <p className="text-sm text-blue-900 bg-blue-50/50 p-2.5 rounded-lg border border-blue-200 font-semibold">
                    {selectedReport.doctorNotes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedReport(null);
                }}
              >
                Close
              </Button>
              {selectedReport.status === 'Pending Review' && (
                <Button 
                  variant="primary" 
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold flex items-center gap-1"
                  onClick={() => {
                    handleCompleteReview(selectedReport);
                    setShowViewModal(false);
                  }}
                >
                  <CheckCircle sx={{ fontSize: 16 }} /> Mark Completed
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Review / Resign Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setSelectedReport(null);
        }}
        title="Lab Report Clinical Sign-off & Notes"
        size="md"
      >
        {selectedReport && (
          <div className="space-y-4">
            <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg text-indigo-900 text-xs sm:text-sm">
              <p className="font-bold">Patient Name: {selectedReport.patientName} ({selectedReport.age} Yrs / {selectedReport.gender})</p>
              <p className="mt-1">Test Type: {selectedReport.testType}</p>
            </div>

            {/* Severity selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Clinical Severity Assessment
              </label>
              <select 
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
              >
                <option value="Normal">Normal Range</option>
                <option value="Mild">Mild Deviation</option>
                <option value="Moderate">Moderate Abnormality</option>
                <option value="Critical">Critical Alert (Requires Intervention)</option>
              </select>
            </div>

            {/* Doctor recommendation text */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Clinical Recommendations & Notes *
              </label>
              <textarea 
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm"
                rows="4"
                placeholder="Type clinical recommendations, prescription additions, or sign-off remarks..."
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedReport(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                className="bg-indigo-650 hover:bg-indigo-700 text-white font-semibold"
                onClick={submitReview}
                disabled={!doctorNotes.trim()}
              >
                Apply Sign-off & Notes
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

export default LabResults;
