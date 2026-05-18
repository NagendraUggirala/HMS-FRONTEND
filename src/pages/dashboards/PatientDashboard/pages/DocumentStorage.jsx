import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { 
  FileText, Search, Filter, Plus, Eye, Download, 
  Trash2, FileUp, Shield, User, Loader2, Calendar, 
  Lock, Unlock, Info, CheckCircle2, AlertCircle
} from "lucide-react";
import Modal from "../../../../components/common/Modal/Modal";
import { 
  getMyDocuments, 
  uploadMyDocument, 
  deleteMyDocument, 
  downloadMyDocument,
  getMyDocumentStatistics 
} from "../../../../services/patientApi";

export default function DocumentStorage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [uploadData, setUploadData] = useState({
    title: "",
    category: "ID_PROOF",
    file: null,
    description: "",
    documentDate: new Date().toISOString().split('T')[0],
    isSensitive: false
  });

  const categories = [
    { label: "ID Proof", value: "ID_PROOF" },
    { label: "Insurance Card", value: "INSURANCE_CARD" },
    { label: "Medical Report", value: "MEDICAL_REPORT" },
    { label: "Prescription", value: "PRESCRIPTION" },
    { label: "Lab Result", value: "LAB_RESULT" },
    { label: "Discharge Summary", value: "DISCHARGE_SUMMARY" }
  ];

  // Fetch documents and stats on mount
  useEffect(() => {
    fetchData();
  }, [category, page]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch documents and stats independently to avoid one failure blocking the other
      const fetchDocs = async () => {
        try {
          const res = await getMyDocuments({ 
            documentType: category === "All" ? undefined : category,
            page,
            limit: 20
          });
          if (res.ok) {
            const docsData = await res.json();
            console.log("Documents API Response:", docsData);
            
            let records = [];
            if (Array.isArray(docsData.data?.records)) records = docsData.data.records;
            else if (Array.isArray(docsData.records)) records = docsData.records;
            else if (Array.isArray(docsData.data)) records = docsData.data;
            else if (Array.isArray(docsData.documents)) records = docsData.documents;
            else if (Array.isArray(docsData)) records = docsData;
            
            const normalizedRecords = records.map(doc => ({
              ...doc,
              document_id: doc.document_id || doc.id || doc._id || Math.random().toString(36).substr(2, 9),
              title: doc.title || doc.file_name || doc.name || "Untitled Document",
              document_type: doc.document_type || doc.category || doc.type || "OTHER"
            }));

            setDocuments(normalizedRecords);
            setTotalPages(docsData.data?.total_pages || docsData.total_pages || docsData.totalPages || 1);
          }
        } catch (e) {
          console.error("Docs fetch error:", e);
        }
      };

      const fetchStats = async () => {
        try {
          const res = await getMyDocumentStatistics();
          if (res.ok) {
            const statsData = await res.json();
            setStats(statsData.data || statsData || { total_documents: 0, total_size: 0, categories: {} });
          }
        } catch (e) {
          console.error("Stats fetch error:", e);
        }
      };

      await Promise.all([fetchDocs(), fetchStats()]);
    } catch (error) {
      console.error("General Fetch error:", error);
      toast.error("Failed to sync with vault");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadData.title || !uploadData.category || !uploadData.file) {
      toast.error("Please fill all required fields and select a file");
      return;
    }
    
    setIsUploading(true);
    const formData = new FormData();
    // Use 'document' as the field name instead of 'file'
    formData.append("document", uploadData.file, uploadData.file.name);
    formData.append("document_type", uploadData.category);
    formData.append("title", uploadData.title);
    formData.append("description", uploadData.description || "");
    formData.append("document_date", uploadData.documentDate);
    formData.append("is_sensitive", uploadData.isSensitive ? "true" : "false");
    
    try {
      const res = await uploadMyDocument(formData);
      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        // Detailed error extraction
        let errMsg = "Upload failed";
        if (data.detail) {
          if (Array.isArray(data.detail)) {
            errMsg = data.detail.map(d => `${d.loc ? d.loc.join('.') + ': ' : ''}${d.msg}`).join(", ");
          } else if (typeof data.detail === 'string') {
            errMsg = data.detail;
          }
        } else if (data.message) {
          errMsg = data.message;
        }
        throw new Error(errMsg);
      }
      
      toast.success("Document vaulted successfully!");
      setIsModalOpen(false);
      setCategory("All"); // Reset filter to show all documents including the new one
      setPage(1); // Reset to first page
      setUploadData({
        title: "",
        category: "ID_PROOF",
        file: null,
        description: "",
        documentDate: new Date().toISOString().split('T')[0],
        isSensitive: false
      });
      fetchData();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this document? This action cannot be undone.")) {
      try {
        const res = await deleteMyDocument(id);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.detail || "Failed to delete document");
        
        toast.success(data.message || "Document deleted successfully");
        fetchData(); // Refresh list
      } catch (error) {
        console.error("Delete error:", error);
        toast.error(error.message || "Failed to delete document");
      }
    }
  };

  const handleDownload = async (id, fileName) => {
    try {
      const response = await downloadMyDocument(id);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Download failed");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      toast.error(error.message || "Failed to download document");
    }
  };

  const getDocIcon = (type) => {
    switch (type) {
      case 'INSURANCE_CARD': return <Shield size={20} className="text-blue-600" />;
      case 'ID_PROOF': return <User size={20} className="text-purple-600" />;
      case 'MEDICAL_REPORT': return <FileText size={20} className="text-emerald-600" />;
      case 'LAB_RESULT': return <AlertCircle size={20} className="text-orange-600" />;
      case 'DISCHARGE_SUMMARY': return <CheckCircle2 size={20} className="text-indigo-600" />;
      default: return <FileText size={20} className="text-slate-600" />;
    }
  };

  const filteredDocs = Array.isArray(documents) ? documents.filter(doc => 
    (doc.title || "").toLowerCase().includes(search.toLowerCase())
  ) : [];

  return (
    <div className="bg-[#f8fafc] min-h-screen p-4 md:p-8 space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Document Vault</h1>
          <p className="text-slate-500 text-sm mt-1">Securely store and manage your personal medical records and IDs</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-95 w-full md:w-auto"
        >
          <Plus size={20} strokeWidth={3} />
          <span>Upload Document</span>
        </button>
      </div>

      {/* STATS CARDS */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <FileText size={24} />
              </div>
              <div>
                <p className="text-slate-500 text-[10px] font-medium uppercase tracking-wider">Total Documents</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total_documents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <Shield size={24} />
              </div>
              <div>
                <p className="text-slate-500 text-[10px] font-medium uppercase tracking-wider">Storage Used</p>
                <p className="text-2xl font-bold text-slate-900">{(stats.total_size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FILTERS & SEARCH */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-4 md:p-6 flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by document title..."
            className="w-full bg-slate-50 border-none rounded-2xl pl-14 pr-6 py-4 focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 transition-all outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="flex-1 lg:flex-none bg-slate-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 outline-none min-w-[200px]"
          >
            <option value="All">All Categories</option>
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>

          <button 
            onClick={fetchData}
            className="p-4 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-100 transition-colors"
            title="Refresh list"
          >
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* DOCUMENT LIST */}
      {isLoading ? (
        <div className="py-32 flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 size={24} className="text-indigo-600 animate-pulse" />
            </div>
          </div>
          <p className="text-slate-500 font-medium text-lg animate-pulse">Syncing with secure vault...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredDocs.map((doc) => (
            <div key={doc.document_id} className="bg-white rounded-[2rem] border border-slate-100 p-6 hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-300 group flex flex-col h-full">
              <div className="flex items-start justify-between mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${
                  doc.is_sensitive ? 'bg-rose-50' : 'bg-slate-50'
                }`}>
                  {doc.is_sensitive ? <Lock size={24} className="text-rose-500" /> : getDocIcon(doc.document_type)}
                </div>
                <div className="flex gap-1">
                  <button 
                    className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" 
                    title="Download"
                    onClick={() => handleDownload(doc.document_id, doc.file_name)}
                  >
                    <Download size={20} />
                  </button>
                  <button 
                    className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" 
                    title="Delete"
                    onClick={() => handleDelete(doc.document_id)}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors" title={doc.title}>
                    {doc.title}
                  </h3>
                  <p className="text-slate-400 text-sm mt-1 line-clamp-2 min-h-[2.5rem]">
                    {doc.description || "No description provided."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-medium uppercase tracking-widest">
                    {doc.document_type.replace(/_/g, ' ')}
                  </span>
                  {doc.is_sensitive && (
                    <span className="px-3 py-1 bg-rose-100 text-rose-600 rounded-lg text-[10px] font-medium uppercase tracking-widest flex items-center gap-1">
                      <Lock size={10} /> Sensitive
                    </span>
                  )}
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-medium uppercase tracking-widest">
                    {(doc.file_size / 1024).toFixed(0)} KB
                  </span>
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-slate-50 flex items-center justify-between text-xs font-bold text-slate-400">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-slate-300" />
                  <span>{new Date(doc.document_date || doc.upload_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Info size={14} className="text-slate-300" />
                  <span>{doc.mime_type?.split('/')[1]?.toUpperCase() || 'FILE'}</span>
                </div>
              </div>
            </div>
          ))}

          {filteredDocs.length === 0 && (
            <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-6 bg-white rounded-[3rem] border border-dashed border-slate-200">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center">
                <FileText size={48} className="text-slate-200" />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-800">Your vault is empty</p>
                <p className="text-slate-400 mt-2">Start by uploading your first medical document or ID</p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 px-8 py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-bold hover:bg-indigo-100 transition-all"
              >
                Upload First File
              </button>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="col-span-full flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-6 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
              >
                Previous
              </button>
              <span className="text-slate-500 font-bold">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-6 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* ENHANCED UPLOAD MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Secure Upload"
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-2">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                Document Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={uploadData.title}
                onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
                placeholder="e.g. Annual Health Checkup 2023"
                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={uploadData.category}
                onChange={(e) => setUploadData({...uploadData, category: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  Document Date
                </label>
                <div className="relative">
                  <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={uploadData.documentDate}
                    onChange={(e) => setUploadData({...uploadData, documentDate: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  Privacy Level
                </label>
                <button
                  type="button"
                  onClick={() => setUploadData({...uploadData, isSensitive: !uploadData.isSensitive})}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-4 rounded-2xl font-semibold transition-all ${
                    uploadData.isSensitive 
                    ? 'bg-rose-50 text-rose-600 border-2 border-rose-100' 
                    : 'bg-slate-50 text-slate-600 border-2 border-transparent'
                  }`}
                >
                  {uploadData.isSensitive ? <Lock size={18} /> : <Unlock size={18} />}
                  {uploadData.isSensitive ? "Sensitive" : "Public"}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <textarea
                value={uploadData.description}
                onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
                placeholder="Add any notes or context..."
                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium resize-none"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">File Attachment</label>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={(e) => setUploadData({...uploadData, file: e.target.files[0]})}
              />
              <label 
                htmlFor="file-upload"
                className={`border-4 border-dashed rounded-[2rem] p-8 flex flex-col items-center justify-center transition-all cursor-pointer group h-40 ${
                  uploadData.file 
                  ? 'bg-indigo-50 border-indigo-200' 
                  : 'bg-slate-50 border-slate-100 hover:border-indigo-200 hover:bg-slate-100'
                }`}
              >
                <div className={`w-14 h-14 rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform ${
                  uploadData.file ? 'bg-white text-indigo-600' : 'bg-white text-slate-400'
                }`}>
                  {uploadData.file ? <CheckCircle2 size={28} /> : <FileUp size={28} />}
                </div>
                <p className={`text-sm font-semibold text-center px-4 line-clamp-1 ${
                  uploadData.file ? 'text-indigo-700' : 'text-slate-500'
                }`}>
                  {uploadData.file ? uploadData.file.name : "Select Document"}
                </p>
                {!uploadData.file && <p className="text-xs text-slate-400 mt-1 font-medium">PDF, Images or Docs (Max 10MB)</p>}
              </label>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-12">
          <button
            onClick={() => setIsModalOpen(false)}
            className="flex-1 px-8 py-4 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-100 transition-colors font-bold active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="flex-[2] px-8 py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all font-bold shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 disabled:opacity-70 active:scale-95"
          >
            {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} strokeWidth={3} />}
            {isUploading ? "Protecting and Uploading..." : "Upload to Secure Vault"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
