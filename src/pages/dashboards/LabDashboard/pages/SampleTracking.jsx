// src/pages/dashboards/LabDashboard/pages/SampleTracking.jsx
import React, { useState, useEffect, useRef } from "react";
import DataTable from "../../../../components/ui/Tables/DataTable";
import Button from "../../../../components/common/Button/Button";
import Modal from "../../../../components/common/Modal/Modal";
import LoadingSpinner from "../../../../components/common/LoadingSpinner/LoadingSpinner";
import Toast from "../../../../components/common/Toast/Toast";
import { apiFetch } from "../../../../services/apiClient";
import { QRCodeSVG } from "qrcode.react";

const SampleTracking = () => {
  const [loading, setLoading] = useState(true);
  const [samples, setSamples] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrSample, setQRSample] = useState(null);
  const [scannedCode, setScannedCode] = useState("");
  const [currentSample, setCurrentSample] = useState(null);
  const [toast, setToast] = useState(null);

  const statusStageMap = {
    Pending: 0,
    Collected: 1,
    "In Transit": 2,
    "In Lab": 3,
    Processing: 4,
    Processed: 5,
    Storage: 5,
    Disposed: 5,
  };

  const stages = [
    "Awaiting Collection",
    "Sample Collected",
    "In Transit",
    "Received in Lab",
    "Processing",
    "Completed",
  ];

  const statusOptions = {
    Pending: { color: "bg-gray-100 text-gray-800", icon: "fa-clock" },
    Collected: { color: "bg-blue-100 text-blue-800", icon: "fa-syringe" },
    "In Transit": { color: "bg-yellow-100 text-yellow-800", icon: "fa-truck" },
    "In Lab": { color: "bg-purple-100 text-purple-800", icon: "fa-microscope" },
    Processing: { color: "bg-indigo-100 text-indigo-800", icon: "fa-flask" },
    Processed: { color: "bg-green-100 text-green-800", icon: "fa-check-double" },
    Storage: { color: "bg-teal-100 text-teal-800", icon: "fa-archive" },
    Disposed: { color: "bg-red-100 text-red-800", icon: "fa-trash-alt" },
  };

  useEffect(() => {
    loadSampleData();
  }, [searchTerm]);

  const normalizeSampleData = (row) => ({
    id: row.sample_id ?? row.id,
    barcode: row.barcode || "N/A",
    patientName: row.patient_name ?? row.patientName ?? "Unknown Patient",
    patientId: row.patient_id ?? row.patientId ?? "N/A",
    testType: row.test_type ?? row.testType ?? "N/A",
    sampleType: row.sample_type ?? row.sampleType ?? "N/A",
    status: row.status ?? "Pending",
    collectionTime: row.collection_time ?? row.collectionTime ?? row.collected_at ?? "N/A",
    collectedBy: row.collected_by ?? row.collectedBy ?? "N/A",
    location: row.location ?? "N/A",
    temperature: row.temperature ?? "N/A",
    testId: row.test_id ?? row.testId ?? "N/A",
    priority: row.priority ?? "Normal",
    qrCodeData: row.qrCodeData || `${row.sample_id || row.id}\nPATIENT: ${row.patient_name || row.patientName}\nTEST: ${row.test_type || row.testType}`,
    nextAction: row.next_action ?? row.nextAction ?? getNextAction(row.status ?? "Pending"),
  });

  const loadSampleData = async () => {
    setLoading(true);
    try {
      const url = searchTerm
        ? `/api/v1/lab/sample-tracking?search=${encodeURIComponent(searchTerm)}`
        : "/api/v1/lab/sample-tracking";

      const res = await apiFetch(url);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.detail?.message || data?.message || `Failed to fetch samples (${res.status})`);
      }

      const rawRows = data?.samples ?? data?.rows ?? data?.data ?? [];
      const normalizedSamples = Array.isArray(rawRows) ? rawRows.map(normalizeSampleData) : [];
      setSamples(normalizedSamples);
    } catch (error) {
      console.error("Failed to load sample tracking:", error);
      setSamples([]);
      setToast({ message: error.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term) => setSearchTerm(term);

  const handleScanBarcode = () => {
    setScannedCode("");
    setShowScannerModal(true);
  };

  const performBarcodeLookup = async (code, simulate = false) => {
    if (!code.trim()) {
      setToast({ message: "Please enter or scan a barcode", type: "warning" });
      return false;
    }

    try {
      setLoading(true);
      const endpoint = simulate 
        ? `/api/v1/lab/sample-tracking/simulate-scan?barcode=${encodeURIComponent(code.trim())}`
        : `/api/v1/lab/sample-tracking/lookup?barcode=${encodeURIComponent(code.trim())}`;
      
      const options = simulate ? { method: "POST" } : {};
      const res = await apiFetch(endpoint, options);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data?.detail?.message || data?.message || "Barcode not found");

      const foundSample = data?.data ?? data?.sample ?? data;
      if (foundSample) {
        const normalized = normalizeSampleData(foundSample);
        setCurrentSample(normalized);
        setShowScannerModal(false);
        setToast({ message: `Sample found: ${normalized.barcode}`, type: "success" });
        return true;
      }
    } catch (error) {
      console.error("Barcode lookup failed:", error);
      const localSample = samples.find((s) => s.barcode === code.trim());
      if (localSample) {
        setCurrentSample(localSample);
        setShowScannerModal(false);
        setToast({ message: "Found in local list", type: "success" });
        return true;
      }
      setToast({ message: error.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const updateSampleStatus = async (sampleId, action, location) => {
    try {
      const payload = { 
        sample_id: sampleId, 
        action: action, 
        location: location 
      };
      
      const res = await apiFetch("/api/v1/lab/sample-tracking/action", {
        method: "POST",
        body: payload,
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const updatedSample = data?.data ?? data?.sample;
        
        loadSampleData();
        setToast({ message: `Action '${action}' applied successfully`, type: "success" });
        
        if (currentSample && currentSample.id === sampleId) {
          if (updatedSample) {
            setCurrentSample(normalizeSampleData(updatedSample));
          } else {
            const updated = { ...currentSample, status: action, location: location };
            setCurrentSample(normalizeSampleData(updated));
          }
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to apply action");
      }
    } catch (error) {
      setToast({ message: error.message, type: "error" });
    }
  };

  const getNextAction = (status) => {
    const actions = {
      Pending: "Collect Sample",
      Collected: "Transfer to Lab",
      "In Transit": "Receive at Lab",
      "In Lab": "Start Processing",
      Processing: "Complete Analysis",
      Processed: "Move to Storage",
      Storage: "Dispose after retention",
    };
    return actions[status] || "Awaiting update";
  };

  const handleRowClick = (sample) => setCurrentSample(sample);

  const handlePrintLabel = (sample) => {
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) {
      setToast({ message: "Please allow pop-ups to print labels", type: "error" });
      return;
    }
    const htmlContent = `
      <html><body style="font-family:monospace;text-align:center;padding:20px;border:2px solid #000;margin:20px;">
      <h2>LEVITICA HEALTHCARE</h2><hr/>
      <h3>SAMPLE SPECIMEN LABEL</h3>
      <p style="font-size:1.2em;"><b>ID: ${sample.id}</b></p>
      <p><b>Barcode: ${sample.barcode}</b></p>
      <p><b>Patient:</b> ${sample.patientName} (${sample.patientId})</p>
      <p><b>Test:</b> ${sample.testType}</p>
      <p><b>Sample:</b> ${sample.sampleType}</p>
      <p><b>Collected:</b> ${sample.collectionTime}</p>
      <p style="margin-top:20px;">HANDLED BY: ${sample.collectedBy}</p>
      </body></html>`;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
  };

  const handleViewQR = (sample) => { setQRSample(sample); setShowQRModal(true); };
  
  const handlePrintQR = () => {
    if (!qrSample) return;
    const printWindow = window.open("", "_blank", "width=600,height=600");
    printWindow.document.write(`<html><body style="text-align:center;padding:40px;"><h2>QR Code</h2><p>${qrSample.id}</p><div id="qr"></div><p>${qrSample.patientName}</p></body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  const handleMarkReceived = () => currentSample && updateSampleStatus(currentSample.id, "In Lab", "Main Laboratory Reception");
  const handleMarkInTransit = () => currentSample && updateSampleStatus(currentSample.id, "In Transit", "In Transit");
  const handleStartProcessing = () => currentSample && updateSampleStatus(currentSample.id, "Processing", "Laboratory");
  const handleCompleteTest = () => currentSample && updateSampleStatus(currentSample.id, "Processed", "Storage");

  if (loading && samples.length === 0) return <LoadingSpinner />;

  return (
    <>
      <div className="space-y-6 animate-fade-in p-2 sm:p-4 bg-gray-50/30 min-h-screen">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-md sticky top-0 z-20 p-5 border rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Sample Logistics & Tracking</h2>
            <p className="text-sm text-gray-500">Monitor sample chain of custody and processing status</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button variant="outline" icon="fas fa-qrcode" onClick={handleScanBarcode} className="flex-1 md:flex-none py-2.5 rounded-xl border-gray-200">Scan Barcode</Button>
            <Button variant="primary" icon="fas fa-sync-alt" onClick={loadSampleData} className="flex-1 md:flex-none py-2.5 rounded-xl shadow-lg shadow-blue-100">Refresh List</Button>
          </div>
        </div>

        {/* Global Search */}
        <div className="bg-white p-2 rounded-2xl border card-shadow">
          <div className="relative w-full">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              placeholder="Search by Barcode, Patient Name, or Test ID..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50/50 rounded-xl outline-none text-sm border border-transparent focus:border-blue-200"
              onChange={(e) => handleSearch(e.target.value)}
              value={searchTerm}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-2xl border card-shadow overflow-hidden">
              <div className="p-4 border-b bg-gray-50/30 flex justify-between items-center">
                <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider flex items-center gap-2"><i className="fas fa-vials text-blue-500"></i>Recent Samples</h3>
                <span className="text-xs font-medium text-gray-400 bg-white px-2 py-1 rounded-lg border">Showing {samples.length} samples</span>
              </div>
              <div className="overflow-x-auto">
                <DataTable
                  columns={[
                    { key: "barcode", title: "Barcode", render: (val) => <span className="font-mono font-bold text-blue-600">{val}</span> },
                    { key: "patientName", title: "Patient" },
                    { 
                      key: "status", 
                      title: "Status",
                      render: (value) => (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase ${statusOptions[value]?.color || "bg-gray-100"}`}>
                          <i className={`fas ${statusOptions[value]?.icon || 'fa-circle'} text-[9px]`}></i>{value}
                        </span>
                      ),
                    },
                    { key: "collectionTime", title: "Collected", render: (val) => <span className="text-xs text-gray-500">{val}</span> },
                    {
                      key: "actions",
                      title: "",
                      render: (_, row) => (
                        <div className="flex gap-1">
                          <button onClick={(e) => { e.stopPropagation(); handleViewQR(row); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><i className="fas fa-qrcode"></i></button>
                          <button onClick={(e) => { e.stopPropagation(); handlePrintLabel(row); }} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"><i className="fas fa-print"></i></button>
                        </div>
                      ),
                    },
                  ]}
                  data={samples}
                  onRowClick={handleRowClick}
                  emptyMessage="No samples found. Use search or scan a barcode."
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            {!currentSample ? (
              <div className="bg-blue-50/50 border-2 border-dashed border-blue-100 rounded-3xl p-10 text-center">
                <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto text-blue-300 mb-4"><i className="fas fa-fingerprint text-2xl"></i></div>
                <h4 className="font-bold text-blue-800">Select a Sample</h4>
                <p className="text-xs text-blue-600/60 leading-relaxed">Click on any sample or scan a barcode to view its detailed journey.</p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-blue-100 card-shadow p-6 relative overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{currentSample.patientName}</h3>
                    <p className="text-xs text-gray-400 font-mono mt-1">{currentSample.barcode}</p>
                  </div>
                  <button onClick={() => setCurrentSample(null)} className="p-2 text-gray-300 hover:text-gray-500 bg-gray-50 rounded-full"><i className="fas fa-times text-sm"></i></button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-8">
                  <div className="bg-gray-50 p-2.5 rounded-2xl"><p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Temp</p><p className="text-sm font-bold text-gray-700">{currentSample.temperature}</p></div>
                  <div className="bg-gray-50 p-2.5 rounded-2xl"><p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Type</p><p className="text-sm font-bold text-gray-700 truncate">{currentSample.sampleType}</p></div>
                  <div className="bg-gray-50 p-2.5 rounded-2xl"><p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Test ID</p><p className="text-sm font-bold text-gray-700">{currentSample.testId}</p></div>
                  <div className="bg-gray-50 p-2.5 rounded-2xl"><p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Priority</p><p className="text-sm font-bold text-gray-700">{currentSample.priority}</p></div>
                </div>

                <div className="space-y-6 pl-4 border-l-2 border-blue-50 ml-2 mb-8">
                  {stages.map((stage, index) => {
                    const currentStageIndex = statusStageMap[currentSample.status] ?? 0;
                    const isCompleted = index < currentStageIndex;
                    const isCurrent = index === currentStageIndex;
                    return (
                      <div key={stage} className="relative flex items-center gap-4">
                        <div className={`absolute -left-[27px] w-5 h-5 rounded-full border-4 border-white shadow-sm z-10 ${isCompleted ? 'bg-green-500' : isCurrent ? 'bg-blue-600 scale-125 ring-4 ring-blue-50' : 'bg-gray-200'}`}></div>
                        <div className={`flex-1 p-3 rounded-2xl ${isCurrent ? 'bg-blue-50 border border-blue-100' : ''}`}>
                          <p className={`text-xs font-bold ${isCurrent ? 'text-blue-700' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>{stage}</p>
                          {isCurrent && <p className="text-[10px] text-blue-500 mt-1 font-medium">{currentSample.nextAction}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-50">
                  <button 
                    className={`p-3 rounded-2xl flex flex-col items-center gap-2 transition-all ${currentSample.status === "Collected" ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100" : "bg-gray-50 text-gray-300 cursor-not-allowed"}`} 
                    onClick={handleMarkInTransit}
                    disabled={currentSample.status !== "Collected"}
                  >
                    <i className="fas fa-truck"></i>
                    <span className="text-[10px] font-bold uppercase">Transit</span>
                  </button>
                  <button 
                    className={`p-3 rounded-2xl flex flex-col items-center gap-2 transition-all ${currentSample.status === "In Transit" ? "bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-100" : "bg-gray-50 text-gray-300 cursor-not-allowed"}`} 
                    onClick={handleMarkReceived}
                    disabled={currentSample.status !== "In Transit"}
                  >
                    <i className="fas fa-hospital-user"></i>
                    <span className="text-[10px] font-bold uppercase">Receive</span>
                  </button>
                  <button 
                    className={`p-3 rounded-2xl flex flex-col items-center gap-2 transition-all ${currentSample.status === "In Lab" ? "bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-100" : "bg-gray-50 text-gray-300 cursor-not-allowed"}`} 
                    onClick={handleStartProcessing}
                    disabled={currentSample.status !== "In Lab"}
                  >
                    <i className="fas fa-flask"></i>
                    <span className="text-[10px] font-bold uppercase">Process</span>
                  </button>
                  <button 
                    className={`p-3 rounded-2xl flex flex-col items-center gap-2 transition-all ${currentSample.status === "Processing" ? "bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-100" : "bg-gray-50 text-gray-300 cursor-not-allowed"}`} 
                    onClick={handleCompleteTest}
                    disabled={currentSample.status !== "Processing"}
                  >
                    <i className="fas fa-check-double"></i>
                    <span className="text-[10px] font-bold uppercase">Complete</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={showScannerModal} onClose={() => setShowScannerModal(false)} title="Laboratory Scanner Console">
        <div className="space-y-6">
          {/* Scanning Animation Header */}
          <div className="bg-gray-900 rounded-3xl p-8 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-500/10 animate-pulse"></div>
            <div className="relative z-10">
              <div className="w-24 h-24 mx-auto mb-4 border-2 border-blue-500/30 rounded-2xl flex items-center justify-center relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-scan-line"></div>
                <i className="fas fa-barcode text-4xl text-blue-400"></i>
              </div>
              <p className="text-xs font-bold text-blue-400 uppercase tracking-[0.2em]">Ready for Input</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition-opacity"></div>
              <div className="relative">
                <input 
                  type="text" 
                  className="w-full pl-6 pr-32 py-5 bg-white border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-500 font-mono text-xl text-center tracking-[0.3em] text-gray-800 placeholder:tracking-normal placeholder:text-gray-300 transition-all" 
                  placeholder="SCAN OR TYPE ID" 
                  value={scannedCode} 
                  onChange={(e) => setScannedCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && performBarcodeLookup(scannedCode, false)}
                />
                <button 
                  className="absolute right-2 top-2 bottom-2 px-6 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all" 
                  onClick={() => performBarcodeLookup(scannedCode, false)}
                >
                  LOOKUP
                </button>
              </div>
            </div>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-gray-400 bg-white px-4">Development Tools</div>
            </div>

            <button 
              className="w-full py-4 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-2xl font-bold text-xs hover:from-black hover:to-gray-800 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl" 
              onClick={() => performBarcodeLookup(scannedCode, true)}
            >
              <i className="fas fa-bolt text-yellow-400"></i>
              <span>SIMULATE HARDWARE SCAN (POST)</span>
            </button>
            <p className="text-center text-[10px] text-gray-400 leading-relaxed">
              Use simulation to bypass physical hardware requirements and trigger backend sample state transitions directly.
            </p>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showQRModal} onClose={() => setShowQRModal(false)} title="Laboratory QR Code" size="sm">
        {qrSample && (
          <div className="text-center p-2">
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-50 inline-block"><QRCodeSVG value={qrSample.qrCodeData} size={220} level="H" includeMargin={true} /></div>
            <h4 className="text-xl font-bold text-gray-800 mt-6">{qrSample.patientName}</h4>
            <p className="text-xs font-bold text-blue-500 font-mono uppercase tracking-widest">{qrSample.barcode}</p>
            <div className="grid grid-cols-2 gap-3 mt-8">
              <Button variant="outline" icon="fas fa-print" onClick={handlePrintQR} className="flex-1 rounded-xl py-3 text-xs">Print</Button>
              <Button variant="primary" icon="fas fa-download" onClick={() => setToast({ message: `Saved QR for ${qrSample.id}`, type: "success" })} className="flex-1 rounded-xl py-3 text-xs shadow-lg shadow-blue-100">Download</Button>
            </div>
          </div>
        )}
      </Modal>

      {toast && <Toast key={toast.message + Date.now()} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
};

export default SampleTracking;