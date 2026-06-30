/* eslint-disable react/prop-types */
// src/pages/dashboards/LabDashboard/pages/ResultAccess.jsx
import React, { useState } from 'react'
import DataTable from '../../../../components/ui/Tables/DataTable'
import Button from '../../../../components/common/Button/Button'
import Modal from '../../../../components/common/Modal/Modal'
import Toast from '../../../../components/common/Toast/Toast'

const ResultAccess = () => {
  const [toast, setToast] = useState(null)
  
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showReportViewModal, setShowReportViewModal] = useState(false)
  
  const [selectedUploadTest, setSelectedUploadTest] = useState(null)
  const [selectedReportView, setSelectedReportView] = useState(null)
  
  const [uploadForm, setUploadForm] = useState({
    fileType: 'pdf',
    fileName: '',
    resultSummary: '',
    technicianNotes: ''
  })

  // Mock Completed Lab Tests for Dispatch and Upload
  const [completedTests, setCompletedTests] = useState([
    {
      id: "LAB-REQ-1001",
      patientId: "PAT-1001",
      patientName: "Ramesh Kumar",
      age: 45,
      gender: "Male",
      testType: "Blood Test, Lipid Profile",
      referringDoctor: "Dr. Sharma",
      dateCompleted: new Date().toISOString().split("T")[0],
      status: "PENDING_UPLOAD",
      fileName: "",
      resultSummary: "",
      technicianNotes: "",
      fileType: "pdf"
    },
    {
      id: "LAB-REQ-1002",
      patientId: "PAT-1002",
      patientName: "Sita Devi",
      age: 32,
      gender: "Female",
      testType: "HbA1c Test",
      referringDoctor: "Dr. Priya",
      dateCompleted: new Date().toISOString().split("T")[0],
      status: "READY_TO_SEND",
      fileName: "sita_devi_hba1c_report.pdf",
      resultSummary: "HbA1c: 5.8% (Pre-diabetic range)",
      technicianNotes: "Patient advised dietary control.",
      fileType: "pdf"
    },
    {
      id: "LAB-REQ-1003",
      patientId: "PAT-1003",
      patientName: "Mohan Rao",
      age: 58,
      gender: "Male",
      testType: "Urine Culture",
      referringDoctor: "Dr. Rajesh",
      dateCompleted: new Date().toISOString().split("T")[0],
      status: "PENDING_UPLOAD",
      fileName: "",
      resultSummary: "",
      technicianNotes: "",
      fileType: "pdf"
    }
  ]);

  // Handlers for Uploading / Editing Reports
  const handleOpenUpload = (test) => {
    setSelectedUploadTest(test);
    setUploadForm({
      fileType: test.fileType || 'pdf',
      fileName: test.fileName || `${test.patientName.toLowerCase().replace(/\s+/g, "_")}_report.pdf`,
      resultSummary: test.resultSummary || '',
      technicianNotes: test.technicianNotes || ''
    });
    setShowUploadModal(true);
  };

  const handleUploadSubmit = () => {
    if (!uploadForm.fileName.trim()) {
      setToast({ message: "Please specify a file name", type: "error" });
      return;
    }
    setCompletedTests(prev =>
      prev.map(t =>
        t.id === selectedUploadTest.id
          ? {
              ...t,
              ...uploadForm,
              status: 'READY_TO_SEND'
            }
          : t
      )
    );
    setToast({
      message: `Report for ${selectedUploadTest.patientName} successfully uploaded!`,
      type: "success"
    });
    setShowUploadModal(false);
    setSelectedUploadTest(null);
  };

  // Handler for Viewing Uploaded Reports
  const handleOpenReportView = (test) => {
    setSelectedReportView(test);
    setShowReportViewModal(true);
  };

  // Handler for Dispatching/Sending Reports
  const handleSendReport = (test) => {
    setCompletedTests(prev =>
      prev.map(t =>
        t.id === test.id
          ? { ...t, status: 'SENT' }
          : t
      )
    );

    setToast({
      message: `Report successfully sent to ${test.referringDoctor}!`,
      type: "success"
    });
  };

  // Calculate statistics from local lists
  const pendingUploadCount = completedTests.filter(t => t.status === 'PENDING_UPLOAD').length;
  const readyToSendCount = completedTests.filter(t => t.status === 'READY_TO_SEND').length;
  const dispatchedCount = completedTests.filter(t => t.status === 'SENT').length;
  const totalReportsCount = completedTests.length;

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Result Uploads</h2>
            <p className="text-sm text-gray-500">Manage patient test reports & upload files</p>
          </div>
        </div>

        {/* User Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Completed Tests */}
          <div className="relative bg-gradient-to-br from-white to-blue-50 p-5 rounded-2xl border border-blue-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200 rounded-full -translate-y-8 translate-x-8 opacity-20"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-blue-300 rounded-full translate-y-8 -translate-x-8 opacity-10"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Total Tests</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalReportsCount}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <i className="fas fa-file-medical text-white text-lg"></i>
              </div>
            </div>
            <div className="relative mt-4 pt-3 border-t border-blue-100">
              <p className="text-xs text-blue-700 font-medium">Completed lab tests</p>
            </div>
          </div>

          {/* Pending Upload */}
          <div className="relative bg-gradient-to-br from-white to-yellow-50 p-5 rounded-2xl border border-yellow-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-200 rounded-full -translate-y-8 translate-x-8 opacity-20"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-yellow-300 rounded-full translate-y-8 -translate-x-8 opacity-10"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wider">Pending Upload</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{pendingUploadCount}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-md">
                <i className="fas fa-upload text-white text-lg"></i>
              </div>
            </div>
            <div className="relative mt-4 pt-3 border-t border-yellow-100">
              <p className="text-xs text-yellow-700 font-medium">Awaiting report files</p>
            </div>
          </div>

          {/* Ready to Send */}
          <div className="relative bg-gradient-to-br from-white to-purple-50 p-5 rounded-2xl border border-purple-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200 rounded-full -translate-y-8 translate-x-8 opacity-20"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-purple-300 rounded-full translate-y-8 -translate-x-8 opacity-10"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Ready to Send</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{readyToSendCount}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <i className="fas fa-paper-plane text-white text-lg"></i>
              </div>
            </div>
            <div className="relative mt-4 pt-3 border-t border-purple-100">
              <p className="text-xs text-purple-700 font-medium">Reports ready to dispatch</p>
            </div>
          </div>

          {/* Dispatched */}
          <div className="relative bg-gradient-to-br from-white to-emerald-50 p-5 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-200 rounded-full -translate-y-8 translate-x-8 opacity-20"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-emerald-300 rounded-full translate-y-8 -translate-x-8 opacity-10"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Dispatched</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{dispatchedCount}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                <i className="fas fa-check-circle text-white text-lg"></i>
              </div>
            </div>
            <div className="relative mt-4 pt-3 border-t border-emerald-100">
              <p className="text-xs text-emerald-700 font-medium">Successfully sent reports</p>
            </div>
          </div>
        </div>

        {/* Completed Lab Tests Pending Report Dispatch */}
        {completedTests.length > 0 && (
          <div className="bg-white rounded border card-shadow overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-lg font-semibold text-emerald-800 flex items-center gap-2">
                  <i className="fas fa-file-medical text-emerald-600"></i>
                  Result Uploads
                </h3>
                <p className="text-sm text-gray-500">Upload patient test reports & document files</p>
              </div>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                {completedTests.length} Total Patients
              </span>
            </div>
            <DataTable columns={[
                { key: 'id', title: 'Request ID', sortable: true, className: 'min-w-[100px] text-center font-mono text-xs' },
                { key: 'patientName', title: 'Patient Name', sortable: true, className: 'min-w-[150px] font-semibold' },
                { key: 'testType', title: 'Assigned Test', sortable: true, className: 'min-w-[180px] text-blue-700 font-medium' },
                { key: 'referringDoctor', title: 'Referring Doctor', sortable: true, className: 'min-w-[140px]' },
                { 
                  key: 'fileName', 
                  title: 'Document File Name', 
                  className: 'min-w-[200px]',
                  render: (value, row) => {
                    if (row.status === 'PENDING_UPLOAD') {
                      return <span className="text-xs text-gray-400 italic font-medium">No report file uploaded</span>;
                    }
                    return (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs font-semibold text-gray-700 font-mono">
                        <i className="far fa-file-pdf text-red-500"></i>
                        {value}
                      </span>
                    );
                  }
                },
                { 
                  key: 'status', 
                  title: 'Report Status', 
                  sortable: true, 
                  className: 'min-w-[130px] text-center',
                  render: (value) => {
                    if (value === 'PENDING_UPLOAD') {
                      return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-yellow-200 bg-yellow-50 text-yellow-800">PENDING UPLOAD</span>;
                    }
                    if (value === 'READY_TO_SEND') {
                      return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-blue-200 bg-blue-50 text-blue-800">READY TO SEND</span>;
                    }
                    return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-green-200 bg-green-50 text-green-800">DISPATCHED</span>;
                  }
                },
                { key: 'actions', title: 'Actions', className: 'min-w-[220px] text-center',
                  render: (_, row) => {
                    if (row.status === 'PENDING_UPLOAD') {
                      return (
                        <div className="flex gap-2 justify-center" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => handleOpenUpload(row)}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-semibold text-xs flex items-center gap-1 shadow-sm"
                            title="Upload Document" >
                            <i className="fas fa-upload"></i> Upload Report
                          </button>
                        </div>
                      );
                    }
                    
                    return (
                      <div className="flex gap-2 justify-center" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => handleOpenReportView(row)}
                          className="px-2 py-1.5 bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100 transition-colors font-semibold text-xs flex items-center gap-1"
                          title="View Report" >
                          <i className="fas fa-eye"></i> View
                        </button>
                        <button onClick={() => handleOpenUpload(row)}
                          className="px-2 py-1.5 bg-amber-50 text-amber-700 rounded border border-amber-200 hover:bg-amber-100 transition-colors font-semibold text-xs flex items-center gap-1"
                          title="Edit Details" >
                          <i className="fas fa-edit"></i> Edit
                        </button>
                        <button onClick={() => handleSendReport(row)}
                          disabled={row.status === 'SENT'}
                          className={`px-2 py-1.5 rounded font-semibold text-xs flex items-center gap-1 shadow-sm border transition-all ${
                            row.status === 'SENT' 
                              ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                              : 'bg-green-600 text-white border-green-700 hover:bg-green-700'
                          }`}
                          title="Send Report" >
                          <i className="fas fa-paper-plane"></i> {row.status === 'SENT' ? 'Sent' : 'Send'}
                        </button>
                      </div>
                    );
                  }
                }
              ]}
              data={completedTests}
              emptyMessage="No pending test dispatches."
            />
          </div>
        )}
      </div>

      {/* Upload/Edit Report Modal */}
      <Modal 
        isOpen={showUploadModal} 
        onClose={() => {
          setShowUploadModal(false)
          setSelectedUploadTest(null)
        }} 
        title={selectedUploadTest?.status === 'PENDING_UPLOAD' ? "Upload Lab Result Document" : "Edit Report Document Details"} 
        size="md"
      >
        {selectedUploadTest && (
          <div className="space-y-4">
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <p className="text-sm font-semibold text-blue-900">Patient: {selectedUploadTest.patientName}</p>
              <p className="text-xs text-blue-700 mt-1">Assigned Test: {selectedUploadTest.testType}</p>
              <p className="text-xs text-blue-700">Referring Doctor: {selectedUploadTest.referringDoctor}</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Document File Format
              </label>
              <select 
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                value={uploadForm.fileType}
                onChange={(e) => setUploadForm({...uploadForm, fileType: e.target.value})}
              >
                <option value="pdf">PDF Document (.pdf)</option>
                <option value="docx">Word Document (.docx)</option>
                <option value="xlsx">Excel Spreadsheet (.xlsx)</option>
                <option value="csv">CSV File (.csv)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Report File Name
              </label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-mono text-sm"
                placeholder="report_name.pdf"
                value={uploadForm.fileName}
                onChange={(e) => setUploadForm({...uploadForm, fileName: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Result Summary / Key Parameters
              </label>
              <textarea 
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                rows="3"
                placeholder="e.g. Fasting Blood Glucose: 90 mg/dL, HbA1c: 5.4%..."
                value={uploadForm.resultSummary}
                onChange={(e) => setUploadForm({...uploadForm, resultSummary: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Technician / Pathologist Notes
              </label>
              <textarea 
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                rows="3"
                placeholder="Any special remarks or suggestions..."
                value={uploadForm.technicianNotes}
                onChange={(e) => setUploadForm({...uploadForm, technicianNotes: e.target.value})}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowUploadModal(false)
                  setSelectedUploadTest(null)
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                onClick={handleUploadSubmit}
                disabled={!uploadForm.fileName}
              >
                {selectedUploadTest.status === 'PENDING_UPLOAD' ? "Upload & Save" : "Save Changes"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* View Uploaded Report Modal */}
      <Modal 
        isOpen={showReportViewModal} 
        onClose={() => {
          setShowReportViewModal(false)
          setSelectedReportView(null)
        }} 
        title="Lab Report Document Viewer" 
        size="md"
      >
        {selectedReportView && (
          <div className="space-y-4">
            <div className="flex justify-between items-start pb-3 border-b">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Report for Patient</p>
                <h4 className="text-lg font-bold text-gray-900">{selectedReportView.patientName}</h4>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                selectedReportView.status === 'SENT' 
                  ? 'border-green-200 bg-green-50 text-green-700' 
                  : 'border-blue-200 bg-blue-50 text-blue-700'
              }`}>
                {selectedReportView.status === 'SENT' ? 'DISPATCHED' : 'READY TO SEND'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500">Test ID</p>
                <p className="text-sm font-semibold text-gray-800 font-mono">{selectedReportView.id}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">Date Completed</p>
                <p className="text-sm font-semibold text-gray-800">{selectedReportView.dateCompleted}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">Assigned Test</p>
                <p className="text-sm font-semibold text-blue-700">{selectedReportView.testType}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">Referring Doctor</p>
                <p className="text-sm font-semibold text-gray-800">{selectedReportView.referringDoctor}</p>
              </div>
            </div>

            <div className="p-3 bg-gray-50 border rounded-xl space-y-3">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Attached Document</p>
                <div className="flex items-center justify-between p-2.5 bg-white border rounded-lg">
                  <span className="flex items-center gap-2 font-mono text-xs text-gray-700 font-semibold">
                    <i className="far fa-file-pdf text-red-500 text-base"></i>
                    {selectedReportView.fileName}
                  </span>
                  <button className="text-blue-600 hover:text-blue-700 transition" onClick={() => {
                    setToast({ message: `Downloading ${selectedReportView.fileName}...`, type: 'info' })
                  }}>
                    <i className="fas fa-download"></i>
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Result Summary</p>
                <p className="text-sm text-gray-800 bg-white p-2.5 rounded-lg border leading-relaxed font-medium">
                  {selectedReportView.resultSummary || "No result summary provided."}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Technician Remarks</p>
                <p className="text-sm text-gray-800 bg-white p-2.5 rounded-lg border italic">
                  {selectedReportView.technicianNotes || "No technician notes provided."}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowReportViewModal(false)
                  setSelectedReportView(null)
                }}
              >
                Close
              </Button>
              <Button 
                variant="primary" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                onClick={() => {
                  setShowReportViewModal(false);
                  handleOpenUpload(selectedReportView);
                }}
              >
                <i className="fas fa-edit mr-1"></i> Edit Report Details
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
  )
}

export default ResultAccess