import React, { useState, useEffect } from "react";
import LoadingSpinner from "../../../../components/common/LoadingSpinner/LoadingSpinner";
import DataTable from "../../../../components/ui/Tables/DataTable";
import Modal from "../../../../components/common/Modal/Modal";
import * as XLSX from "xlsx";
import {
  getDoctorLabResults,
  reviewDoctorLabResult,
  doctorAppointmentErrorMessage,
} from "../../../../services/doctorApi";

const LabResults = () => {
  const [loading, setLoading] = useState(true);
  const [labResults, setLabResults] = useState([]);
  const [selectedLab, setSelectedLab] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [severity, setSeverity] = useState("normal");
  const [reviewStatus, setReviewStatus] = useState("reviewed");

  // Bulk review states
  const [selectedReports, setSelectedReports] = useState([]);
  const [isBulkReviewModalOpen, setIsBulkReviewModalOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState("");
  const [bulkReviewNotes, setBulkReviewNotes] = useState("");
  const [isSelectAll, setIsSelectAll] = useState(false);

  useEffect(() => {
    loadLabResults();
  }, []);

  const loadLabResults = async () => {
    try {
      setLoading(true);
      const data = await getDoctorLabResults();
      setLabResults(data);
    } catch (error) {
      console.error("Error loading lab results:", error);
      alert("Failed to load lab results");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (lab, action) => {
    setSelectedLab(lab);
    setModalType(action);
    setReviewNotes(lab.notes || "");
    setSeverity(lab.status === "Critical" ? "critical" : "normal");
    setReviewStatus("reviewed");
  };

  const closeModal = () => {
    setSelectedLab(null);
    setModalType(null);
    setReviewNotes("");
    setSeverity("normal");
    setReviewStatus("reviewed");
  };

  const handleDownload = () => {
    console.log(`Downloading ${selectedLab.test} for ${selectedLab.patient}`);
    alert(`Downloading ${selectedLab.test} report for ${selectedLab.patient}`);
    closeModal();
  };

  const handleReviewSubmit = async () => {
    if (!reviewNotes.trim()) {
      alert("Please add review notes before submitting");
      return;
    }

    try {
      const response = await reviewDoctorLabResult(selectedLab.id, {
        review_status:
          reviewStatus === "reviewed" ? "REVIEWED" : reviewStatus.toUpperCase(),
        review_notes: reviewNotes,
        severity_assessment: severity.toUpperCase(),
      });

      if (response.error) {
        throw new Error(doctorAppointmentErrorMessage(response));
      }

      alert(`✅ Lab report reviewed successfully!`);
      loadLabResults();
      closeModal();
    } catch (error) {
      console.error("Error submitting review:", error);
      alert(`Failed to submit review: ${error.message}`);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  // ==================== BULK REVIEW FUNCTIONALITY ====================

  const toggleSelectReport = (reportId) => {
    setSelectedReports((prev) => {
      if (prev.includes(reportId)) {
        return prev.filter((id) => id !== reportId);
      } else {
        return [...prev, reportId];
      }
    });
  };

  const handleSelectAll = () => {
    const pendingReports = labResults.filter(
      (lab) => lab.status !== "Reviewed",
    );
    if (isSelectAll) {
      setSelectedReports([]);
    } else {
      setSelectedReports(pendingReports.map((report) => report.id));
    }
    setIsSelectAll(!isSelectAll);
  };

  const openBulkReviewModal = (action) => {
    if (selectedReports.length === 0) {
      alert("Please select at least one report for bulk action");
      return;
    }
    setBulkAction(action);
    setBulkReviewNotes("");
    setIsBulkReviewModalOpen(true);
  };

  const closeBulkReviewModal = () => {
    setIsBulkReviewModalOpen(false);
    setBulkAction("");
    setBulkReviewNotes("");
  };

  const handleBulkAction = () => {
    if (!bulkAction) return;

    const selectedCount = selectedReports.length;

    setLabResults((prev) =>
      prev.map((lab) => {
        if (selectedReports.includes(lab.id)) {
          let newStatus = lab.status;
          let notes = lab.notes;

          if (bulkAction === "markReviewed") {
            newStatus = "Reviewed";
            notes = bulkReviewNotes || "Bulk reviewed by Dr. Current User";
          } else if (bulkAction === "markCritical") {
            newStatus = "Critical";
            notes = bulkReviewNotes || "Marked as critical in bulk review";
          } else if (bulkAction === "assignToSpecialist") {
            notes =
              bulkReviewNotes ||
              "Referred to specialist for further evaluation";
          }

          return {
            ...lab,
            status: newStatus,
            reviewedBy: "Dr. Current User",
            reviewDate: new Date().toISOString().split("T")[0],
            notes: notes,
          };
        }
        return lab;
      }),
    );

    alert(
      `✅ ${selectedCount} report(s) ${getBulkActionText(bulkAction)} successfully!`,
    );
    setSelectedReports([]);
    setIsSelectAll(false);
    closeBulkReviewModal();
  };

  const getBulkActionText = (action) => {
    switch (action) {
      case "markReviewed":
        return "marked as reviewed";
      case "markCritical":
        return "marked as critical";
      case "assignToSpecialist":
        return "assigned to specialist";
      default:
        return "updated";
    }
  };

  // ==================== EXPORT FUNCTIONALITY ====================

  const handleExportList = (format) => {
    const pendingReports = labResults.filter(
      (lab) => lab.status !== "Reviewed",
    );

    if (pendingReports.length === 0) {
      alert("No pending reports to export");
      return;
    }

    switch (format) {
      case "excel":
        exportToExcel(pendingReports);
        break;
      case "csv":
        exportToCSV(pendingReports);
        break;
      case "pdf":
        exportToPDF(pendingReports);
        break;
      default:
        alert("Export format not supported");
    }
  };

  const exportToExcel = (reports) => {
    const data = reports.map((report) => ({
      "Patient ID": report.patientId,
      "Patient Name": report.patient,
      "Age/Gender": `${report.age} / ${report.gender}`,
      "Test Name": report.test,
      "Test Code": report.testCode,
      Date: report.date,
      Time: report.time,
      Lab: report.lab,
      Status: report.status,
      "Result Summary":
        typeof report.result === "object"
          ? Object.values(report.result)[0]
          : report.result,
      Technician: report.technician,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pending Lab Reports");

    const fileName = `Pending_Lab_Reports_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    alert(`✅ Exported ${reports.length} reports to Excel`);
  };

  const exportToCSV = (reports) => {
    const csvData = reports
      .map(
        (report) =>
          `${report.patientId},${report.patient},${report.test},${report.date},${report.status}`,
      )
      .join("\n");

    const headers = "Patient ID,Patient Name,Test,Date,Status\n";
    const csvContent = headers + csvData;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Pending_Lab_Reports_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert(`✅ Exported ${reports.length} reports to CSV`);
  };

  const exportToPDF = (reports) => {
    // Simulate PDF export (in real app, you'd use a library like jsPDF)
    const reportData = reports
      .map(
        (report) =>
          `${report.patient} (${report.patientId}) - ${report.test} - ${report.date} - ${report.status}`,
      )
      .join("\n\n");

    const pdfContent = `
      PENDING LAB REPORTS - ${new Date().toLocaleDateString()}
      ===================================================
      
      Total Reports: ${reports.length}
      Generated: ${new Date().toLocaleString()}
      
      ${reportData}
      
      Generated by: DCMS Hospital System
    `;

    alert(
      `PDF Export Preview:\n\n${pdfContent}\n\n✅ In production, this would generate a PDF file with ${reports.length} reports.`,
    );
  };

  // ==================== RENDER MODAL CONTENT ====================

  const renderModalContent = () => {
    if (!selectedLab) return null;

    switch (modalType) {
      case "download":
        return (
          <div>
            <h3 className="text-lg font-semibold mb-4">Download Lab Report</h3>
            <p className="mb-4">
              Are you sure you want to download the {selectedLab.test} report
              for {selectedLab.patient}?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Download
              </button>
            </div>
          </div>
        );

      case "review":
        return (
          <div className="space-y-6 px-1 sm:px-0">
            {/* Header */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-blue-800">
                    🔬 Lab Report Review
                  </h3>
                  <p className="text-blue-600 text-sm">
                    Review and validate laboratory results
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    selectedLab.status === "Critical"
                      ? "bg-red-100 text-red-800 border border-red-200"
                      : selectedLab.status === "Reviewed"
                        ? "bg-green-100 text-green-800 border border-green-200"
                        : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                  }`}
                >
                  {selectedLab.status}
                </span>
              </div>
            </div>

            {/* Patient & Test Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Patient */}
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h4 className="font-semibold text-gray-700 mb-3">
                  Patient Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Name:</span>
                    <span className="font-medium">{selectedLab.patient}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ID:</span>
                    <span className="font-mono">{selectedLab.patientId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Age/Gender:</span>
                    <span>
                      {selectedLab.age}, {selectedLab.gender}
                    </span>
                  </div>
                </div>
              </div>

              {/* Test */}
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h4 className="font-semibold text-gray-700 mb-3">
                  Test Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Test:</span>
                    <span className="font-medium">{selectedLab.test}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Code:</span>
                    <span className="font-mono">{selectedLab.testCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>
                      {selectedLab.date} • {selectedLab.time}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Table */}
            <div className="border rounded-lg overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left">Parameter</th>
                    <th className="px-3 py-2 text-left">Result</th>
                    <th className="px-3 py-2 text-left">Range</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {Object.entries(selectedLab.result).map(([key, value], i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 capitalize">
                        {key.replace(/([A-Z])/g, " $1")}
                      </td>
                      <td className="px-3 py-2 font-medium text-blue-600">
                        {value}
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {selectedLab.referenceRange?.[key] || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Severity */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <label className="block text-sm font-medium mb-2">
                Severity Assessment
              </label>
              <div className="grid grid-cols-2 sm:flex gap-2">
                {["normal", "mild", "moderate", "critical", "urgent"].map(
                  (level) => (
                    <label
                      key={level}
                      className={`px-3 py-2 rounded-lg border cursor-pointer text-sm text-center ${
                        severity === level
                          ? "bg-blue-100 border-blue-400"
                          : "bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="severity"
                        className="hidden"
                        checked={severity === level}
                        onChange={() => setSeverity(level)}
                      />
                      {level}
                    </label>
                  ),
                )}
              </div>
            </div>

            {/* Review Notes */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Review Notes *
              </label>
              <textarea
                rows={4}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t">
              <button
                onClick={closeModal}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleReviewSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                Submit Review
              </button>
            </div>
          </div>
        );

      case "markReviewed":
        return (
          <div>
            <h3 className="text-lg font-semibold mb-4">Mark as Reviewed</h3>
            <p className="mb-4">
              Mark {selectedLab.test} for {selectedLab.patient} as reviewed?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await reviewDoctorLabResult(selectedLab.id, {
                      review_status: "REVIEWED",
                      review_notes: "Marked as reviewed via quick action",
                      severity_assessment: (
                        selectedLab.severity || "normal"
                      ).toUpperCase(),
                    });
                    alert(`✅ Marked ${selectedLab.test} as reviewed`);
                    loadLabResults();
                    closeModal();
                  } catch (error) {
                    console.error("Error marking as reviewed:", error);
                    alert(`Failed to mark as reviewed: ${error.message}`);
                  }
                }}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                Mark Reviewed
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in p-4 md:p-6">
      <div className="mb-6">
        <h5 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 flex items-center">
          Laboratory Results Management
        </h5>
        <p className="text-gray-600">
          Review, validate, and manage patient laboratory test results
        </p>
      </div>

      {/* ================= STATS OVERVIEW ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Total Reports */}
        <div
          className="group rounded-xl p-4 text-white
  bg-gradient-to-br from-blue-500 to-blue-700
  hover:-translate-y-1 hover:shadow-xl transition-all"
        >
          <div className="flex items-center">
            <div
              className="p-3 bg-white/20 rounded-lg mr-4
      group-hover:scale-110 transition"
            >
              <i className="fas fa-file-medical text-xl"></i>
            </div>
            <div>
              <div className="text-2xl font-bold">{labResults.length}</div>
              <div className="text-sm opacity-90">Total Reports</div>
            </div>
          </div>
        </div>

        {/* Pending Review */}
        <div
          className="group rounded-xl p-4 text-white
  bg-gradient-to-br from-yellow-400 to-yellow-600
  hover:-translate-y-1 hover:shadow-xl transition-all"
        >
          <div className="flex items-center">
            <div
              className="p-3 bg-white/20 rounded-lg mr-4
      group-hover:scale-110 transition"
            >
              <i className="fas fa-clock text-xl"></i>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {
                  labResults.filter((lab) => lab.status === "Pending Review")
                    .length
                }
              </div>
              <div className="text-sm opacity-90">Pending Review</div>
            </div>
          </div>
        </div>

        {/* Critical Results */}
        <div
          className="group rounded-xl p-4 text-white
  bg-gradient-to-br from-red-500 to-red-700
  hover:-translate-y-1 hover:shadow-xl transition-all"
        >
          <div className="flex items-center">
            <div
              className="p-3 bg-white/20 rounded-lg mr-4
      group-hover:scale-110 transition"
            >
              <i className="fas fa-exclamation-triangle text-xl"></i>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {labResults.filter((lab) => lab.status === "Critical").length}
              </div>
              <div className="text-sm opacity-90">Critical Results</div>
            </div>
          </div>
        </div>

        {/* Reviewed */}
        <div
          className="group rounded-xl p-4 text-white
  bg-gradient-to-br from-green-500 to-emerald-600
  hover:-translate-y-1 hover:shadow-xl transition-all"
        >
          <div className="flex items-center">
            <div
              className="p-3 bg-white/20 rounded-lg mr-4
      group-hover:scale-110 transition"
            >
              <i className="fas fa-check-circle text-xl"></i>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {labResults.filter((lab) => lab.status === "Reviewed").length}
              </div>
              <div className="text-sm opacity-90">Reviewed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Lab Results Cards */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">
            Recent Lab Results
          </h3>
          <button
            onClick={loadLabResults}
            className="px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors flex items-center"
          >
            <i className="fas fa-sync-alt mr-2"></i>
            Refresh
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {labResults.map((lab) => (
            <div
              key={lab.id}
              className="bg-white p-4 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-blue-700 text-lg">
                    {lab.test}
                  </h3>
                  <p className="text-sm text-gray-500">{lab.testCode}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    lab.status === "Reviewed"
                      ? "bg-green-100 text-green-800 border border-green-200"
                      : lab.status === "Critical"
                        ? "bg-red-100 text-red-800 border border-red-200"
                        : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                  }`}
                >
                  {lab.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm">
                  <i className="fas fa-user text-gray-400 mr-2 w-4"></i>
                  <span className="font-medium">{lab.patient}</span>
                  <span className="text-gray-500 ml-2">({lab.patientId})</span>
                </div>
                <div className="flex items-center text-sm">
                  <i className="fas fa-calendar text-gray-400 mr-2 w-4"></i>
                  <span>
                    {lab.date} • {lab.time}
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <i className="fas fa-hospital text-gray-400 mr-2 w-4"></i>
                  <span>{lab.lab}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleAction(lab, "review")}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-2 text-sm rounded-lg hover:from-blue-600 hover:to-blue-700 flex items-center justify-center"
                >
                  <i className="fas fa-eye mr-2"></i> Review
                </button>
                <button
                  onClick={() => handleAction(lab, "download")}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm flex items-center"
                >
                  <i className="fas fa-download"></i>
                </button>
                {lab.status !== "Reviewed" && (
                  <button
                    onClick={() => handleAction(lab, "markReviewed")}
                    className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm flex items-center"
                  >
                    <i className="fas fa-check"></i>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Reviews Table with Bulk Actions */}
      <div className="bg-white p-4 md:p-6 border border-gray-200 rounded-xl shadow-sm mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">
              Pending Reviews
            </h3>
            <p className="text-gray-600 text-sm">
              {selectedReports.length > 0
                ? `${selectedReports.length} report(s) selected`
                : "Results requiring medical review"}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {/* Selection Controls */}
            {selectedReports.length > 0 ? (
              <div className="flex items-center gap-2 mb-2 sm:mb-0">
                <button
                  onClick={() => setSelectedReports([])}
                  className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Clear Selection
                </button>
                <div className="flex gap-1">
                  <button
                    onClick={() => openBulkReviewModal("markReviewed")}
                    className="px-3 py-1.5 bg-green-100 text-green-700 text-sm rounded hover:bg-green-200 flex items-center"
                  >
                    <i className="fas fa-check mr-1"></i> Mark Reviewed
                  </button>
                  <button
                    onClick={() => openBulkReviewModal("markCritical")}
                    className="px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200 flex items-center"
                  >
                    <i className="fas fa-exclamation-triangle mr-1"></i> Mark
                    Critical
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-2 sm:mb-0">
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-1.5 text-sm text-blue-600 border border-blue-200 rounded hover:bg-blue-50 flex items-center"
                >
                  <span
                    style={{
                      width: "16px",
                      height: "16px",
                      border: "1px solid #2563eb",
                      borderRadius: "4px",
                      backgroundColor: isSelectAll ? "#2563eb" : "#fff",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: "8px",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  >
                    {isSelectAll ? "✓" : ""}
                  </span>

                  {isSelectAll ? "Deselect All" : "Select All"}
                </button>
              </div>
            )}

            {/* Export Dropdown */}
            <div className="relative inline-block text-left">
              <button
                onClick={() => {
                  const pendingReports = labResults.filter(
                    (lab) => lab.status !== "Reviewed",
                  );
                  if (pendingReports.length === 0) {
                    alert("No pending reports to export");
                    return;
                  }
                  document
                    .getElementById("exportDropdown")
                    .classList.toggle("hidden");
                }}
                className="px-4 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 text-sm flex items-center w-full sm:w-auto justify-center"
              >
                <i className="fas fa-download mr-2"></i>
                Export List
              </button>
              <div
                id="exportDropdown"
                className="hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10"
              >
                <div className="py-1">
                  <button
                    onClick={() => {
                      document
                        .getElementById("exportDropdown")
                        .classList.add("hidden");
                      handleExportList("excel");
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <i className="fas fa-file-excel text-green-500 mr-2"></i>
                    Export to Excel
                  </button>
                  <button
                    onClick={() => {
                      document
                        .getElementById("exportDropdown")
                        .classList.add("hidden");
                      handleExportList("csv");
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <i className="fas fa-file-csv text-blue-500 mr-2"></i>
                    Export to CSV
                  </button>
                  <button
                    onClick={() => {
                      document
                        .getElementById("exportDropdown")
                        .classList.add("hidden");
                      handleExportList("pdf");
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <i className="fas fa-file-pdf text-red-500 mr-2"></i>
                    Export to PDF
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => openBulkReviewModal("assignToSpecialist")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center justify-center"
            >
              <i className="fas fa-users mr-2"></i>
              Bulk Review
            </button>
          </div>
        </div>

        <DataTable
          columns={[
            {
              key: "selection",
              title: "",
              render: (_, row) =>
                row.status !== "Reviewed" && (
                  <input
                    type="checkbox"
                    checked={selectedReports.includes(row.id)}
                    onChange={() => toggleSelectReport(row.id)}
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                ),
            },
            { key: "test", title: "Test", sortable: true },
            { key: "patient", title: "Patient", sortable: true },
            { key: "date", title: "Date", sortable: true },
            {
              key: "result",
              title: "Result Summary",
              sortable: true,
              render: (value, row) => (
                <div className="max-w-xs">
                  {typeof value === "object" ? (
                    <div className="text-sm text-gray-600 truncate">
                      {Object.values(value)[0]}
                    </div>
                  ) : (
                    <div
                      className={`text-sm font-medium ${
                        value.includes("Normal")
                          ? "text-green-600"
                          : value.includes("Mild")
                            ? "text-yellow-600"
                            : value.includes("Elevated")
                              ? "text-red-600"
                              : "text-blue-600"
                      }`}
                    >
                      {value}
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: "status",
              title: "Status",
              sortable: true,
              render: (value) => (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    value === "Reviewed"
                      ? "bg-green-100 text-green-800 border border-green-200"
                      : value === "Critical"
                        ? "bg-red-100 text-red-800 border border-red-200"
                        : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                  }`}
                >
                  {value}
                </span>
              ),
            },
            {
              key: "actions",
              title: "Actions",
              render: (_, row) => (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(row, "review")}
                    className="px-3 py-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 text-sm flex items-center"
                    title="Review Report"
                  >
                    <i className="fas fa-eye mr-1"></i> Review
                  </button>
                  <button
                    onClick={() => handleAction(row, "download")}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                    title="Download"
                  >
                    <i className="fas fa-download"></i>
                  </button>
                </div>
              ),
            },
          ]}
          data={labResults.filter((lab) => lab.status !== "Reviewed")}
        />
      </div>

      {/* Single Report Review Modal */}
      <Modal
        isOpen={!!modalType}
        onClose={closeModal}
        title={modalType === "review" ? "Lab Report Review" : selectedLab?.test}
        size={modalType === "review" ? "2xl" : "md"}
      >
        {renderModalContent()}
      </Modal>

      {/* Bulk Review Modal */}
      <Modal
        isOpen={isBulkReviewModalOpen}
        onClose={closeBulkReviewModal}
        title="Bulk Review Action"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <i className="fas fa-users text-blue-500 text-xl mr-3"></i>
              <div>
                <h4 className="font-semibold text-blue-800">
                  Bulk Action: {getBulkActionText(bulkAction)}
                </h4>
                <p className="text-blue-600 text-sm">
                  Applying to {selectedReports.length} selected report(s)
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bulk Notes (Optional)
            </label>
            <textarea
              value={bulkReviewNotes}
              onChange={(e) => setBulkReviewNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Add notes that will apply to all selected reports..."
            />
            <p className="text-xs text-gray-500 mt-1">
              These notes will be added to each selected report
            </p>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <button
              onClick={closeBulkReviewModal}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkAction}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800"
            >
              Apply to {selectedReports.length} Report(s)
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LabResults;
