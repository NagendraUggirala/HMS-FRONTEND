import React, { useState, useEffect } from 'react';
import mammoth from 'mammoth';
import {
  PictureAsPdf as PictureAsPdfIcon,
  Image as ImageIcon,
  Description as DescriptionIcon,
  InsertDriveFile as InsertDriveFileIcon,
  Badge as BadgeIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarTodayIcon,
  AddCircle as AddCircleIcon,
  Visibility as VisibilityIcon,
  FileDownload as FileDownloadIcon,
  CloudUpload as CloudUploadIcon,
  Search as SearchIcon,
  People as PeopleIcon,
  Sick as SickIcon,
  Assignment as AssignmentIcon,
  Science as ScienceIcon,
  Close as CloseIcon,
  Upload as UploadIcon,
  ChevronRight as ChevronRightIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import LoadingSpinner from '../../../../components/common/LoadingSpinner/LoadingSpinner';
import Modal from '../../../../components/common/Modal/Modal';
import { apiFetch } from '../../../../services/apiClient';
import { RECEPTIONIST_PATIENT_SEARCH, RECEPTIONIST_PATIENT_DOCUMENTS, RECEPTIONIST_PATIENT_DOCUMENTS_UPLOAD } from '../../../../config/api';

const DocumentManagement = () => {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [documentType, setDocumentType] = useState('');
  const [category, setCategory] = useState('');
  const [uploadedBy, setUploadedBy] = useState('Receptionist');
  const [searchTerm, setSearchTerm] = useState('');
  const [documentToView, setDocumentToView] = useState(null);
  const [showViewAllModal, setShowViewAllModal] = useState(false);
  const [wordContent, setWordContent] = useState('');
  const [wordLoading, setWordLoading] = useState(false);
  // Remove shared activeTab state

  useEffect(() => {
    loadPatientsData();
  }, []);

  // Debounced search for patients
  useEffect(() => {
    if (searchTerm.trim()) {
      const handler = setTimeout(() => {
        searchPatients(searchTerm);
      }, 500);
      return () => clearTimeout(handler);
    } else if (searchTerm === '') {
      loadPatientsData();
    }
  }, [searchTerm]);

  const searchPatients = async (query) => {
    try {
      const response = await apiFetch(`${RECEPTIONIST_PATIENT_SEARCH}?query=${encodeURIComponent(query)}`);
      const json = await response.json();
      if (json.success) {
        const rawPatients = json.data?.patients || json.data || [];
        
        const mappedPatients = await Promise.all(rawPatients.map(async (p) => {
          const pid = p.patient_id || p.id || p._id;
          let docs = p.documents || [];
          try {
             const docRes = await apiFetch(RECEPTIONIST_PATIENT_DOCUMENTS(pid));
             const docJson = await docRes.json().catch(() => ({}));
             if (docJson.success) docs = docJson.data || [];
          } catch (e) {
             console.error("Failed to fetch docs for", pid);
          }
          return {
            ...p,
            id: pid,
            name: p.name || p.patient_name || 'Unknown',
            age: p.age || 'N/A',
            gender: p.gender || 'N/A',
            phone: p.phone || 'N/A',
            lastVisit: p.last_visit || p.lastVisit || 'N/A',
            documents: docs
          };
        }));
        setPatients(mappedPatients);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  useEffect(() => {
    if (documentToView && documentToView.file && 
       (documentToView.file.type.includes('word') || 
        documentToView.file.name.toLowerCase().endsWith('.docx'))) {
      
      setWordLoading(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target.result;
          const result = await mammoth.convertToHtml({ arrayBuffer });
          setWordContent(result.value);
        } catch (error) {
          console.error('Error converting word document:', error);
          setWordContent('<div class="text-center py-10"><p class="text-red-500">Error: Could not preview this Word document. Please download it to view.</p></div>');
        } finally {
          setWordLoading(false);
        }
      };
      reader.readAsArrayBuffer(documentToView.file);
    } else {
      setWordContent('');
    }
  }, [documentToView]);

  const loadPatientsData = async () => {
    setLoading(true);
    try {
      const response = await apiFetch(RECEPTIONIST_PATIENT_SEARCH);
      const json = await response.json();
      if (json.success) {
        const rawPatients = json.data?.patients || json.data || [];
        const mappedPatients = await Promise.all(rawPatients.map(async (p) => {
          const pid = p.patient_id || p.id || p._id;
          let docs = p.documents || [];
          try {
             const docRes = await apiFetch(RECEPTIONIST_PATIENT_DOCUMENTS(pid));
             const docJson = await docRes.json().catch(() => ({}));
             if (docJson.success) docs = docJson.data || [];
          } catch (e) {
             console.error("Failed to fetch docs for", pid);
          }
          return {
            ...p,
            id: pid,
            name: p.name || p.patient_name || 'Unknown',
            age: p.age || 'N/A',
            gender: p.gender || 'N/A',
            phone: p.phone || 'N/A',
            lastVisit: p.last_visit || p.lastVisit || 'N/A',
            documents: docs
          };
        }));
        setPatients(mappedPatients);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      file: file,
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      type: file.type.split('/')[1]?.toUpperCase() || 'FILE',
      status: 'Ready'
    }));
    setUploadedFiles([...uploadedFiles, ...newFiles]);
  };

  const handleRemoveFile = (id) => {
    setUploadedFiles(uploadedFiles.filter(file => file.id !== id));
  };

  const fetchPatientDocuments = async (patientId) => {
    try {
      const response = await apiFetch(RECEPTIONIST_PATIENT_DOCUMENTS(patientId));
      const json = await response.json();
      if (json.success) {
        const docs = json.data || [];
        setPatients(prev => prev.map(p => p.id === patientId ? { ...p, documents: docs } : p));
        if (selectedPatient && selectedPatient.id === patientId) {
          setSelectedPatient(prev => ({ ...prev, documents: docs }));
        }
      }
    } catch(err) {
      console.error("Error fetching patient documents:", err);
    }
  };

  const handleUpload = async () => {
    if (!selectedPatient || uploadedFiles.length === 0 || !documentType || !category || !uploadedBy) {
      alert('Please select patient, document type, category, uploader, and add files to upload');
      return;
    }

    const patientIndex = patients.findIndex(p => p.id === selectedPatient.id);
    if (patientIndex === -1) return;
    
    try {
      const formData = new FormData();
      formData.append('patient_id', selectedPatient.id);
      formData.append('document_type', documentType);
      formData.append('category', category);
      formData.append('uploaded_by', uploadedBy);
      uploadedFiles.forEach(f => {
        formData.append('files', f.file);
      });

      const response = await apiFetch(RECEPTIONIST_PATIENT_DOCUMENTS_UPLOAD, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json().catch(() => ({}));

      if (!response.ok || (result && result.success === false)) {
        throw new Error(result.message || 'Failed to upload documents');
      }

      await fetchPatientDocuments(selectedPatient.id);

      setShowUploadModal(false);
      setUploadedFiles([]);
      setDocumentType('');
      setCategory('');
      alert('Documents uploaded successfully!');
    } catch (err) {
      console.error("Upload Error:", err);
      alert("Error: " + err.message);
    }
  };

  const handleDownload = (doc) => {
    if (doc.file) {
      const url = URL.createObjectURL(doc.file);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.name);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert(`Downloading ${doc.name} (Simulation)`);
    }
  };

  const documentCategories = [
    { value: 'MEDICAL_REPORT', label: 'Medical Report' },
    { value: 'LAB_RESULT', label: 'Lab Result' },
    { value: 'PRESCRIPTION', label: 'Prescription' },
    { value: 'INSURANCE_CARD', label: 'Insurance Card' },
    { value: 'ID_PROOF', label: 'ID Proof' },
    { value: 'DISCHARGE_SUMMARY', label: 'Discharge Summary' }
  ];

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'pdf': return <PictureAsPdfIcon style={{ fontSize: '1.25rem' }} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'image': return <ImageIcon style={{ fontSize: '1.25rem' }} />;
      case 'doc':
      case 'docx': return <DescriptionIcon style={{ fontSize: '1.25rem' }} />;
      default: return <InsertDriveFileIcon style={{ fontSize: '1.25rem' }} />;
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Registration': 'bg-blue-100 text-blue-800',
      'Medical History': 'bg-purple-100 text-purple-800',
      'Consultation': 'bg-green-100 text-green-800',
      'Uploaded': 'bg-yellow-100 text-yellow-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Patient Card Component - Each card manages its own state
  const PatientCard = ({ patient }) => {
    const [activeTab, setActiveTab] = useState('all'); // Local state for each card

    const getDocumentsByType = (documents, type) => {
      if (type === 'all') return documents;
      if (type === 'medical') return documents.filter(d =>
        ['Previous Medical Reports', 'Prescription', 'Discharge Summary', 'MEDICAL_REPORT', 'PRESCRIPTION', 'DISCHARGE_SUMMARY'].includes(d.type || d.document_type)
      );
      if (type === 'reports') return documents.filter(d =>
        ['Lab Report', 'X-Ray', 'Scan Report', 'Test Report', 'LAB_RESULT'].includes(d.type || d.document_type)
      );
      if (type === 'other') return documents.filter(d =>
        ['ID Proof', 'Insurance', 'ID_PROOF', 'INSURANCE_CARD'].includes(d.type || d.document_type)
      );
      return documents;
    };

    const filteredDocs = getDocumentsByType(patient.documents, activeTab);

    return (
      <div className="bg-white rounded-lg shadow border hover:shadow-md transition-shadow h-full flex flex-col">
        {/* Patient Header */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 border-b">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-lg truncate">{patient.name}</h3>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {patient.documents.length} docs
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <div className="flex items-center">
                  <BadgeIcon className="text-gray-500 mr-1" style={{ fontSize: '1rem' }} />
                  <span className="text-gray-600 truncate">{patient.id}</span>
                </div>
                <div className="flex items-center">
                  <PersonIcon className="text-gray-500 mr-1" style={{ fontSize: '1rem' }} />
                  <span className="text-gray-600">{patient.age}y, {patient.gender}</span>
                </div>
                <div className="flex items-center">
                  <PhoneIcon className="text-gray-500 mr-1" style={{ fontSize: '1rem' }} />
                  <span className="text-gray-600 truncate">{patient.phone}</span>
                </div>
                <div className="flex items-center">
                  <CalendarTodayIcon className="text-gray-500 mr-1" style={{ fontSize: '1rem' }} />
                  <span className="text-gray-600">Last: {patient.lastVisit}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedPatient(patient);
                setShowUploadModal(true);
              }}
              className="ml-3 text-blue-600 hover:text-blue-800 flex-shrink-0"
              title="Upload documents"
            >
              <AddCircleIcon className="text-xl" />
            </button>
          </div>
        </div>

        {/* Document Categories Tabs */}
        <div className="border-b">
          <div className="flex overflow-x-auto">
            {['all', 'medical', 'reports', 'other'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-3 py-2 text-xs font-medium whitespace-nowrap ${activeTab === tab
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {tab === 'all' && 'All Documents'}
                {tab === 'medical' && 'Medical'}
                {tab === 'reports' && 'Reports'}
                {tab === 'other' && 'Other'}
              </button>
            ))}
          </div>
        </div>

        {/* Documents List */}
        <div className="p-4 flex-1 overflow-hidden">
          {filteredDocs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-6">
              <InsertDriveFileIcon className="text-gray-300 mb-2" style={{ fontSize: '3rem' }} />
              <p className="text-gray-500 text-sm">No documents found</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {filteredDocs.map(doc => (
                <div key={doc.id} className="flex items-center p-2 bg-gray-50 rounded hover:bg-gray-100">
                  <div className={`p-2 rounded-lg mr-3 ${doc.fileType === 'pdf' ? 'bg-red-50 text-red-600' :
                    doc.fileType === 'image' ? 'bg-green-50 text-green-600' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                    {getFileIcon(doc.fileType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{doc.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(doc.category)}`}>
                        {doc.type || doc.document_type || doc.category || 'Document'}
                      </span>
                      <span className="text-xs text-gray-500">{doc.size}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="View"
                      onClick={() => setDocumentToView(doc)}
                    >
                      <VisibilityIcon style={{ fontSize: '1.25rem' }} />
                    </button>
                    <button
                      className="text-green-600 hover:text-green-800 p-1"
                      title="Download"
                      onClick={() => handleDownload(doc)}
                    >
                      <FileDownloadIcon style={{ fontSize: '1.25rem' }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {patient.documents.length > 3 && (
          <div className="px-4 py-2 border-t bg-gray-50">
            <button
              onClick={() => {
                setSelectedPatient(patient);
                setShowViewAllModal(true);
              }}
              className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-1"
            >
              View all {patient.documents.length} documents →
            </button>
          </div>
        )}

      </div>
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-gray-700">Patient Document Management</h2>
          <p className="text-gray-600 text-sm mt-1">Manage patient documents, lab reports, and medical records</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPatientModal(true)}
            className="btn btn-primary flex items-center"
          >
            <CloudUploadIcon className="mr-2" /> Upload Documents
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search patients by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-5">
          <div className="flex items-center">
            <div className="p-3 bg-blue-50 rounded-lg mr-4">
              <SickIcon className="text-blue-600 text-lg" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Patients</p>
              <p className="text-xl font-bold text-blue-600 mt-1">{patients.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-5">
          <div className="flex items-center">
            <div className="p-3 bg-green-50 rounded-lg mr-4">
              <AssignmentIcon className="text-green-600 text-lg" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Documents</p>
              <p className="text-xl font-bold text-green-600 mt-1">
                {patients.reduce((sum, patient) => sum + patient.documents.length, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-5">
          <div className="flex items-center">
            <div className="p-3 bg-purple-50 rounded-lg mr-4">
              <ScienceIcon className="text-purple-600 text-lg" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Lab Reports</p>
              <p className="text-xl font-bold text-purple-600 mt-1">
                {patients.reduce((sum, patient) =>
                  sum + patient.documents.filter(d => (d.type || d.document_type || '').includes('Report') || (d.type || d.document_type || '') === 'LAB_RESULT').length, 0
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-5">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-50 rounded-lg mr-4">
              <BadgeIcon className="text-yellow-600 text-lg" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">ID Proofs</p>
              <p className="text-xl font-bold text-yellow-600 mt-1">
                {patients.reduce((sum, patient) =>
                  sum + patient.documents.filter(d => (d.type || d.document_type || '') === 'ID Proof' || (d.type || d.document_type || '') === 'ID_PROOF').length, 0
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Patients Grid */}
      {filteredPatients.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <PeopleIcon className="text-gray-300 mb-3" style={{ fontSize: '4rem' }} />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No patients found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your search criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map(patient => (
            <PatientCard key={patient.id} patient={patient} />
          ))}
        </div>
      )}



      {/* Upload Modal */}
      {selectedPatient && (
        <Modal
          isOpen={showUploadModal}
          onClose={() => {
            setShowUploadModal(false);
            setUploadedFiles([]);
            setDocumentType('');
            setCategory('');
          }}
          title={`Upload Documents to ${selectedPatient.name}`}
          size="lg"
          footer={
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadedFiles([]);
                  setDocumentType('');
                  setCategory('');
                }}
                className="px-5 py-2.5 border rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!documentType || !category || !uploadedBy || uploadedFiles.length === 0}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <UploadIcon className="mr-2" />
                Upload to Patient
              </button>
            </div>
          }
        >
          <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
            {/* Patient Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <PersonIcon className="text-blue-600 text-xl" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">{selectedPatient.name}</h4>
                  <div className="flex flex-wrap gap-3 mt-1">
                    <span className="text-sm text-gray-600">ID: {selectedPatient.id}</span>
                    <span className="text-sm text-gray-600">Age: {selectedPatient.age}</span>
                    <span className="text-sm text-gray-600">Gender: {selectedPatient.gender}</span>
                    <span className="text-sm text-gray-600">Documents: {selectedPatient.documents.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Type *
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select document type</option>
                {documentCategories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Document Category / Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category (Title) *
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Blood Test Results, Aadhar Card"
                className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Stored as document title / UI category
              </p>
            </div>
            
            {/* Uploaded By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Uploaded By *
              </label>
              <input
                type="text"
                value={uploadedBy}
                onChange={(e) => setUploadedBy(e.target.value)}
                className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Display name of uploader 
              </p>
            </div>

            {/* File Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              <label htmlFor="file-upload" className="cursor-pointer block">
                <CloudUploadIcon className="text-blue-500 mb-4" style={{ fontSize: '5rem' }} />
                <p className="text-lg font-medium text-gray-700 mb-1">Click to upload files</p>
                <p className="text-gray-500">or drag and drop here</p>
                <p className="text-sm text-gray-400 mt-3">
                  Supports: PDF, JPG, PNG, DOC (Max 10MB per file)
                </p>
              </label>
            </div>

            {/* Selected Files */}
            {uploadedFiles.length > 0 && (
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">Selected Files ({uploadedFiles.length})</h4>
                  <button
                    onClick={() => setUploadedFiles([])}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Clear All
                  </button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {uploadedFiles.map(file => (
                    <div key={file.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center">
                        <InsertDriveFileIcon className="text-blue-500 mr-3" />
                        <div>
                          <p className="font-medium text-sm">{file.name}</p>
                          <p className="text-xs text-gray-500">{file.size} • {file.type}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveFile(file.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <CloseIcon />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Patient Selection Modal */}
      <Modal
        isOpen={showPatientModal}
        onClose={() => setShowPatientModal(false)}
        title="Select Patient for Document Upload"
        size="lg"
      >
        <div className="space-y-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search patients by name or ID..."
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
            {filteredPatients.map(patient => (
              <div
                key={patient.id}
                className="border rounded-lg p-4 hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => {
                  setSelectedPatient(patient);
                  setShowPatientModal(false);
                  setShowUploadModal(true);
                }}
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <PersonIcon className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold">{patient.name}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-gray-600">ID: {patient.id}</span>
                      <span className="text-sm px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                        {patient.documents.length} docs
                      </span>
                    </div>
                  </div>
                  <ChevronRightIcon className="text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Workflow Info */}
      <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
        <h4 className="font-bold text-gray-800 mb-4 flex items-center">
          <InfoIcon className="text-blue-600 mr-2" />
          Document Management Workflow
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-lg shadow-sm">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="font-bold text-blue-600">1</span>
              </div>
              <h5 className="font-semibold">Registration Documents</h5>
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Upload ID proof during patient registration</li>
              <li>• Add insurance documents</li>
              <li>• Attach previous medical reports</li>
            </ul>
          </div>

          <div className="bg-white p-5 rounded-lg shadow-sm">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <span className="font-bold text-green-600">2</span>
              </div>
              <h5 className="font-semibold">Consultation Documents</h5>
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Prescriptions are automatically added</li>
              <li>• Lab test results are linked to patient</li>
              <li>• Doctor's notes and recommendations</li>
            </ul>
          </div>

          <div className="bg-white p-5 rounded-lg shadow-sm">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                <span className="font-bold text-purple-600">3</span>
              </div>
              <h5 className="font-semibold">Ongoing Management</h5>
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Add discharge summaries</li>
              <li>• Upload follow-up reports</li>
              <li>• Manage all documents in one place</li>
            </ul>
          </div>
        </div>
      </div>

      {/* View Document Modal */}
      {documentToView && (
        <Modal
          isOpen={!!documentToView}
          onClose={() => setDocumentToView(null)}
          title={`Viewing: ${documentToView.name}`}
          size="lg"
        >
          <div className="h-[70vh] flex flex-col items-center justify-center bg-gray-50 rounded-lg overflow-hidden border p-4 relative">
            {documentToView.file ? (
              documentToView.file.type.includes('image') ? (
                <img src={URL.createObjectURL(documentToView.file)} alt={documentToView.name} className="max-w-full max-h-full object-contain shadow-sm" />
              ) : documentToView.file.type.includes('pdf') ? (
                <iframe src={URL.createObjectURL(documentToView.file)} title={documentToView.name} className="w-full h-full border-0 rounded" />
              ) : (documentToView.file.type.includes('word') || documentToView.file.name.toLowerCase().endsWith('.docx') || documentToView.file.name.toLowerCase().endsWith('.doc')) ? (
                documentToView.file.name.toLowerCase().endsWith('.docx') ? (
                  wordLoading ? (
                    <div className="text-center">
                      <LoadingSpinner />
                      <p className="mt-4 text-gray-500 font-medium">Processing document...</p>
                    </div>
                  ) : (
                    <div className="w-full h-full overflow-auto bg-white p-8 shadow-inner border rounded">
                      <div className="docx-preview-content max-w-3xl mx-auto" dangerouslySetInnerHTML={{ __html: wordContent }} />
                    </div>
                  )
                ) : (
                  <div className="text-center p-8 bg-blue-50 rounded-xl border border-blue-100 max-w-md">
                    <DescriptionIcon style={{ fontSize: '5rem', color: '#3B82F6' }} className="mb-4" />
                    <h4 className="text-xl font-bold text-gray-800 mb-2">Legacy Word Document</h4>
                    <p className="text-gray-600 mb-6">Preview is only available for modern <strong>.docx</strong> files. Please download this <strong>.doc</strong> file to view its contents.</p>
                    <button
                      onClick={() => handleDownload(documentToView)}
                      className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <FileDownloadIcon className="mr-2" /> Download Now
                    </button>
                  </div>
                )
              ) : (
                <div className="text-center">
                  <InsertDriveFileIcon style={{ fontSize: '5rem', color: '#9CA3AF' }} />
                  <p className="mt-4 text-gray-500">Preview not available for this file type</p>
                </div>
              )
            ) : (
              <div className="text-center">
                {documentToView.fileType === 'image' || documentToView.fileType === 'jpg' || documentToView.fileType === 'png' || documentToView.fileType === 'jpeg' ? (
                  <ImageIcon style={{ fontSize: '5rem', color: '#9CA3AF' }} />
                ) : documentToView.fileType === 'pdf' ? (
                  <PictureAsPdfIcon style={{ fontSize: '5rem', color: '#9CA3AF' }} />
                ) : documentToView.fileType === 'doc' || documentToView.fileType === 'docx' ? (
                  <DescriptionIcon style={{ fontSize: '5rem', color: '#9CA3AF' }} />
                ) : (
                  <InsertDriveFileIcon style={{ fontSize: '5rem', color: '#9CA3AF' }} />
                )}
                <p className="mt-4 text-gray-500 font-medium text-lg">Document Preview Placeholder</p>
                <p className="text-sm text-gray-400 mt-1">Mock document: {documentToView.name}</p>
                <p className="text-xs text-gray-400 mt-2">In a real app, the file URL would be used here.</p>
              </div>
            )}

            <div className="absolute bottom-6 right-8 flex gap-3">
              <button
                onClick={() => handleDownload(documentToView)}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 font-medium flex items-center transition-all hover:scale-105 active:scale-95"
              >
                <FileDownloadIcon className="mr-2" style={{ fontSize: '1.25rem' }} /> Download Document
              </button>
            </div>
          </div>
          <style dangerouslySetInnerHTML={{ __html: `
            .docx-preview-content h1 { font-size: 1.8rem; font-weight: 800; margin-bottom: 1.25rem; color: #111827; border-bottom: 2px solid #E5E7EB; padding-bottom: 0.5rem; }
            .docx-preview-content h2 { font-size: 1.5rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 1rem; color: #1F2937; }
            .docx-preview-content h3 { font-size: 1.25rem; font-weight: 600; margin-top: 1.25rem; margin-bottom: 0.75rem; color: #374151; }
            .docx-preview-content p { margin-bottom: 1rem; line-height: 1.6; color: #4B5563; font-size: 1rem; }
            .docx-preview-content table { border-collapse: collapse; width: 100%; margin: 1.5rem 0; font-size: 0.9rem; }
            .docx-preview-content table td, .docx-preview-content table th { border: 1px solid #D1D5DB; padding: 0.75rem; text-align: left; }
            .docx-preview-content table th { bg-color: #F9FAFB; font-weight: 600; }
            .docx-preview-content ul, .docx-preview-content ol { margin-left: 2rem; margin-bottom: 1.25rem; }
            .docx-preview-content li { margin-bottom: 0.5rem; color: #4B5563; }
            .docx-preview-content strong { color: #111827; font-weight: 600; }
          ` }} />
        </Modal>
      )}

      {/* View All Documents Modal */}
      {selectedPatient && (
        <Modal
          isOpen={showViewAllModal}
          onClose={() => setShowViewAllModal(false)}
          title={`All Documents: ${selectedPatient.name}`}
          size="lg"
          footer={
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowViewAllModal(false)}
                className="px-5 py-2.5 border rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Close
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500">Patient ID:</span>
                <span className="text-sm font-bold text-gray-700">{selectedPatient.id}</span>
              </div>
              <button
                onClick={() => {
                  setShowViewAllModal(false);
                  setShowUploadModal(true);
                }}
                className="btn btn-primary btn-sm flex items-center"
              >
                <AddCircleIcon className="mr-1" style={{ fontSize: '1rem' }} /> Add Document
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-3">
              {selectedPatient.documents.map(doc => (
                <div key={doc.id} className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 border border-gray-200">
                  <div className={`p-2 rounded-lg mr-4 ${doc.fileType === 'pdf' ? 'bg-red-50 text-red-600' :
                    doc.fileType === 'image' ? 'bg-green-50 text-green-600' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                    {getFileIcon(doc.fileType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 truncate">{doc.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${getCategoryColor(doc.category)}`}>
                        {doc.type}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <CalendarTodayIcon style={{ fontSize: '0.8rem' }} /> {doc.uploadedDate}
                      </span>
                      <span className="text-xs text-gray-400">{doc.size}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      className="text-blue-600 hover:text-blue-800 p-2 bg-blue-50 rounded-lg transition-colors"
                      title="View"
                      onClick={() => setDocumentToView(doc)}
                    >
                      <VisibilityIcon style={{ fontSize: '1.25rem' }} />
                    </button>
                    <button
                      className="text-green-600 hover:text-green-800 p-2 bg-green-50 rounded-lg transition-colors"
                      title="Download"
                      onClick={() => handleDownload(doc)}
                    >
                      <FileDownloadIcon style={{ fontSize: '1.25rem' }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default DocumentManagement;