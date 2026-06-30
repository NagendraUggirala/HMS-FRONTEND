/* eslint-disable react/prop-types */
// src/pages/dashboards/LabDashboard/pages/TestHistory.jsx
import React, { useState } from 'react';
import DataTable from '../../../../components/ui/Tables/DataTable';
import Button from '../../../../components/common/Button/Button';
import Modal from '../../../../components/common/Modal/Modal';
import Toast from '../../../../components/common/Toast/Toast';
import SearchBar from '../../../../components/common/SearchBar/SearchBar';
import {
  Visibility,
  Print,
  CheckCircle,
  AccessTime,
  Science,
  CalendarToday,
  Download,
  History
} from "@mui/icons-material";

const DUMMY_HISTORY = [
  {
    id: "LAB-REQ-1002",
    patientId: "PAT-1002",
    patientName: "Sita Devi",
    age: 32,
    gender: "Female",
    testType: "HbA1c Test",
    referringDoctor: "Dr. Priya",
    department: "OPD",
    dateCompleted: new Date().toISOString().split("T")[0],
    dispatchedDateTime: new Date().toISOString().replace('T', ' ').slice(0, 16),
    status: "SENT",
    fileName: "sita_devi_hba1c_report.pdf",
    resultSummary: "HbA1c: 5.8% (Pre-diabetic range)",
    technicianNotes: "Patient advised dietary control. Advised repeat checkup in 3 months.",
    fileType: "pdf"
  },
  {
    id: "LAB-REQ-998",
    patientId: "PAT-1005",
    patientName: "Rohan Varma",
    age: 29,
    gender: "Male",
    testType: "CBC",
    referringDoctor: "Dr. Sharma",
    department: "Pediatrics",
    dateCompleted: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    dispatchedDateTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 16),
    status: "SENT",
    fileName: "rohan_varma_cbc_report.pdf",
    resultSummary: "Hemoglobin: 14.5 g/dL, Platelets: 250,000 /mcL, WBC: 7,500 /mcL",
    technicianNotes: "All cell counts are normal.",
    fileType: "pdf"
  },
  {
    id: "LAB-REQ-995",
    patientId: "PAT-1006",
    patientName: "Kalyani Sen",
    age: 64,
    gender: "Female",
    testType: "Lipid Profile",
    referringDoctor: "Dr. Neha",
    department: "Cardiology",
    dateCompleted: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    dispatchedDateTime: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 16),
    status: "SENT",
    fileName: "kalyani_sen_lipid_profile.pdf",
    resultSummary: "Total Cholesterol: 240 mg/dL, HDL: 45 mg/dL, LDL: 160 mg/dL, Triglycerides: 175 mg/dL",
    technicianNotes: "Borderline high cholesterol level. Advised fat-restricted diet.",
    fileType: "pdf"
  },
  {
    id: "LAB-REQ-990",
    patientId: "PAT-1007",
    patientName: "Vikram Malhotra",
    age: 41,
    gender: "Male",
    testType: "Thyroid (T3 T4 TSH)",
    referringDoctor: "Dr. Priya",
    department: "OPD",
    dateCompleted: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    dispatchedDateTime: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 16),
    status: "SENT",
    fileName: "vikram_malhotra_thyroid_report.pdf",
    resultSummary: "TSH: 2.4 mIU/L, Free T3: 3.1 pg/mL, Free T4: 1.2 ng/dL",
    technicianNotes: "Euthyroid state. Normal thyroid parameters.",
    fileType: "pdf"
  },
  {
    id: "LAB-REQ-985",
    patientId: "PAT-1008",
    patientName: "Sanjay Dutta",
    age: 52,
    gender: "Male",
    testType: "Liver Function Test",
    referringDoctor: "Dr. Rajesh",
    department: "Gastroenterology",
    dateCompleted: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    dispatchedDateTime: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 16),
    status: "SENT",
    fileName: "sanjay_dutta_lft_report.pdf",
    resultSummary: "SGOT: 35 U/L, SGPT: 42 U/L, Bilirubin: 0.9 mg/dL",
    technicianNotes: "Liver enzymes are within reference intervals.",
    fileType: "pdf"
  }
];

const TestHistory = () => {
  const [historyData] = useState(DUMMY_HISTORY);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [toast, setToast] = useState(null);

  // Filter history list
  const filteredHistory = historyData.filter(item => {
    // 1. Search filter
    const matchesSearch = 
      item.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.testType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.referringDoctor.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // 2. Date Period Filter
    const itemDate = new Date(item.dispatchedDateTime);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateRange === 'today') {
      const itemDay = new Date(itemDate);
      itemDay.setHours(0, 0, 0, 0);
      return itemDay.getTime() === today.getTime();
    }

    if (dateRange === 'weekly') {
      const oneWeekAgo = new Date(today);
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return itemDate >= oneWeekAgo;
    }

    if (dateRange === 'monthly') {
      const oneMonthAgo = new Date(today);
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      return itemDate >= oneMonthAgo;
    }

    if (dateRange === 'custom') {
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

  // Calculate dynamic stats
  const totalSent = historyData.length;
  const sentToday = historyData.filter(item => {
    const itemDay = new Date(item.dispatchedDateTime);
    itemDay.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return itemDay.getTime() === today.getTime();
  }).length;

  const sentThisWeek = historyData.filter(item => {
    const itemDate = new Date(item.dispatchedDateTime);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return itemDate >= oneWeekAgo;
  }).length;

  const sentThisMonth = historyData.filter(item => {
    const itemDate = new Date(item.dispatchedDateTime);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return itemDate >= oneMonthAgo;
  }).length;

  const handleOpenDetail = (item) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handlePrint = (item) => {
    setToast({
      message: `Sending print task for report ${item.fileName} to local server...`,
      type: "info"
    });
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <History className="text-blue-600" />
              Test History
            </h2>
            <p className="text-sm text-gray-500">View and audit dispatched diagnostic test reports & logs</p>
          </div>
        </div>

        {/* User Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Dispatched Today */}
          <div className="relative bg-gradient-to-br from-white to-blue-50 p-5 rounded-2xl border border-blue-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200 rounded-full -translate-y-8 translate-x-8 opacity-20"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Dispatched Today</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{sentToday}</p>
              </div>
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
                <CheckCircle className="text-white text-base" />
              </div>
            </div>
            <div className="relative mt-4 pt-3 border-t border-blue-100">
              <p className="text-xs text-blue-700 font-medium">Sent reports today</p>
            </div>
          </div>

          {/* Dispatched This Week */}
          <div className="relative bg-gradient-to-br from-white to-purple-50 p-5 rounded-2xl border border-purple-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200 rounded-full -translate-y-8 translate-x-8 opacity-20"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">This Week</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{sentThisWeek}</p>
              </div>
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center shadow-md">
                <CalendarToday className="text-white text-base" />
              </div>
            </div>
            <div className="relative mt-4 pt-3 border-t border-purple-100">
              <p className="text-xs text-purple-700 font-medium">Sent reports this week</p>
            </div>
          </div>

          {/* Dispatched This Month */}
          <div className="relative bg-gradient-to-br from-white to-yellow-50 p-5 rounded-2xl border border-yellow-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-200 rounded-full -translate-y-8 translate-x-8 opacity-20"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wider">This Month</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{sentThisMonth}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center shadow-md">
                <AccessTime className="text-white text-base" />
              </div>
            </div>
            <div className="relative mt-4 pt-3 border-t border-yellow-100">
              <p className="text-xs text-yellow-700 font-medium">Sent reports this month</p>
            </div>
          </div>

          {/* Total Dispatched */}
          <div className="relative bg-gradient-to-br from-white to-emerald-50 p-5 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-200 rounded-full -translate-y-8 translate-x-8 opacity-20"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Total Dispatched</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalSent}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center shadow-md">
                <Science className="text-white text-base" />
              </div>
            </div>
            <div className="relative mt-4 pt-3 border-t border-emerald-100">
              <p className="text-xs text-emerald-700 font-medium">All archived files</p>
            </div>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="bg-white p-4 rounded border card-shadow">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            {/* Search Term */}
            <div>
              <SearchBar 
                placeholder="Search patient, doctor, or test..." 
                onSearch={(term) => setSearchTerm(term)} 
                className="w-full" 
              />
            </div>

            {/* Quick Period Selector */}
            <div>
              <select
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="all">All Dispatches</option>
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
                  dateRange === 'custom' ? 'opacity-100' : 'opacity-40 cursor-not-allowed'
                }`}
                disabled={dateRange !== 'custom'}
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                placeholder="Start Date"
              />
            </div>

            {/* End Date */}
            <div>
              <input
                type="date"
                className={`w-full px-3 py-2 border rounded-lg text-sm bg-white ${
                  dateRange === 'custom' ? 'opacity-100' : 'opacity-40 cursor-not-allowed'
                }`}
                disabled={dateRange !== 'custom'}
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                placeholder="End Date"
              />
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="bg-white rounded border card-shadow overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <History className="text-blue-600" />
                Archived Dispatches
              </h3>
              <p className="text-sm text-gray-500">History record of sent diagnostic reports</p>
            </div>
            <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
              {filteredHistory.length} Record(s)
            </span>
          </div>

          <DataTable 
            columns={[
              { key: 'id', title: 'Request ID', sortable: true, className: 'min-w-[100px] text-center font-mono text-xs' },
              { key: 'patientName', title: 'Patient Name', sortable: true, className: 'min-w-[150px] font-semibold text-gray-800' },
              { key: 'testType', title: 'Test Details', sortable: true, className: 'min-w-[180px] text-blue-700 font-medium' },
              { key: 'referringDoctor', title: 'Referring Doctor', sortable: true, className: 'min-w-[140px]' },
              { key: 'dispatchedDateTime', title: 'Dispatched Date & Time', sortable: true, className: 'min-w-[160px] text-center text-xs text-gray-500' },
              { 
                key: 'fileName', 
                title: 'File Dispatched', 
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
                className: 'min-w-[140px] text-center',
                render: (_, row) => (
                  <div className="flex gap-2 justify-center" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => handleOpenDetail(row)}
                      className="p-1 bg-blue-50 text-blue-600 rounded border border-blue-200 hover:bg-blue-100 transition-colors"
                      title="View Report Details"
                    >
                      <Visibility sx={{ fontSize: 16 }} />
                    </button>
                    <button 
                      onClick={() => handlePrint(row)}
                      className="p-1 bg-emerald-50 text-emerald-600 rounded border border-emerald-200 hover:bg-emerald-100 transition-colors"
                      title="Print Report"
                    >
                      <Print sx={{ fontSize: 16 }} />
                    </button>
                  </div>
                )
              }
            ]}
            data={filteredHistory}
            emptyMessage="No dispatch records match your search criteria."
          />
        </div>
      </div>

      {/* Details View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedItem(null);
        }}
        title="Archived Lab Report Details"
        size="md"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="flex justify-between items-start pb-3 border-b">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Patient Name</p>
                <h4 className="text-lg font-bold text-gray-900">{selectedItem.patientName}</h4>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-green-200 bg-green-50 text-green-700 flex items-center gap-1">
                <CheckCircle sx={{ fontSize: 12 }} /> DISPATCHED
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500">Request ID</p>
                <p className="text-sm font-semibold text-gray-800 font-mono">{selectedItem.id}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">Dispatched Time</p>
                <p className="text-sm font-semibold text-gray-800">{selectedItem.dispatchedDateTime}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">Assigned Test</p>
                <p className="text-sm font-semibold text-blue-700">{selectedItem.testType}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">Referring Doctor</p>
                <p className="text-sm font-semibold text-gray-800">{selectedItem.referringDoctor}</p>
              </div>
            </div>

            <div className="p-3 bg-gray-50 border rounded-xl space-y-3">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Uploaded Report Document</p>
                <div className="flex items-center justify-between p-2.5 bg-white border rounded-lg">
                  <span className="flex items-center gap-2 font-mono text-xs text-gray-700 font-semibold">
                    <i className="far fa-file-pdf text-red-500 text-base"></i>
                    {selectedItem.fileName}
                  </span>
                  <button className="text-blue-600 hover:text-blue-700 transition" onClick={() => {
                    setToast({ message: `Downloading archived report ${selectedItem.fileName}...`, type: 'info' })
                  }}>
                    <Download sx={{ fontSize: 18 }} />
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Result Summary</p>
                <p className="text-sm text-gray-800 bg-white p-2.5 rounded-lg border leading-relaxed font-medium">
                  {selectedItem.resultSummary || "No result summary available."}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Technician Remarks</p>
                <p className="text-sm text-gray-800 bg-white p-2.5 rounded-lg border italic">
                  {selectedItem.technicianNotes || "No notes provided."}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedItem(null);
                }}
              >
                Close
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

export default TestHistory;
