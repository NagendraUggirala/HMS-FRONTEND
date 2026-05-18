import React, { useState, useEffect } from "react";
import DataTable from "../../../../components/ui/Tables/DataTable";
import SearchBar from "../../../../components/common/SearchBar/SearchBar";
import Button from "../../../../components/common/Button/Button";
import Modal from "../../../../components/common/Modal/Modal";
import LoadingSpinner from "../../../../components/common/LoadingSpinner/LoadingSpinner";
import { apiFetch } from "../../../../services/apiClient";
import {
  Visibility,
  Edit,
  Print,
  Add,
  CheckCircle,
  AccessTime,
  ErrorOutline,
  Science,
  QrCode,
  Delete,
  CalendarToday,
  Person,
  LocalPhone,
  Email,
  ArrowDropDown,
  PersonAdd,
} from "@mui/icons-material";


const TestRegistration = () => {
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [newTest, setNewTest] = useState({
    patientId: "",
    patientName: "",
    age: "",
    gender: "",
    phoneNumber: "",
    email: "",
    registrationDate: new Date().toISOString().split("T")[0],
    testType: "", // Keep for compatibility if needed, but primary is selectedTests
    priority: "routine",
    sampleType: "",
    referringDoctor: "",
    department: "",
    instructions: "",
    selectedTests: [{ id: Date.now(), testType: "", sampleType: "" }],
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingTestId, setEditingTestId] = useState(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTestData, setSelectedTestData] = useState(null);
  const [filters, setFilters] = useState({
    for_date: "",
    search: "",
    status: "",
    priority: "",
  });
  const [summary, setSummary] = useState({
    total_tests_today: 0,
    completed_tests: 0,
    in_progress_tests: 0,
    urgent_tests: 0,
  });
  const [filteredPatients, setFilteredPatients] = useState([]);

  useEffect(() => {
    if (patientSearch && patientSearch.length >= 2) {
      const fetchPatients = async () => {
        try {
          const res = await apiFetch(`/api/v1/lab/patients?search=${encodeURIComponent(patientSearch)}&query=${encodeURIComponent(patientSearch)}`);
          if (res.ok) {
            const data = await res.json().catch(() => ({}));
            const apiPayload = data?.data ?? data?.patients ?? data?.rows ?? [];
            const mappedPatients = Array.isArray(apiPayload) ? apiPayload.map(p => ({
              id: p.patient_id || p.id,
              name: p.patient_name || p.name,
              age: p.age,
              gender: p.gender,
              phone: p.phone_number || p.phone,
              email: p.email,
              doctor: p.referring_doctor || p.doctor,
              department: p.department,
            })) : [];
            setFilteredPatients(mappedPatients);
          } else {
            setFilteredPatients([]);
          }
        } catch (error) {
          console.error("Failed to fetch patients:", error);
          setFilteredPatients([]);
        }
      };

      const timer = setTimeout(() => fetchPatients(), 300);
      return () => clearTimeout(timer);
    } else {
      setFilteredPatients([]);
    }
  }, [patientSearch]);

  useEffect(() => {
    loadTestData();
  }, []);

  const loadTestData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.for_date) params.append("for_date", filters.for_date);
      if (filters.search) params.append("search", filters.search);
      if (filters.status) params.append("status", filters.status);
      if (filters.priority) params.append("priority", filters.priority);

      const query = params.toString();
      const url = query ? `/api/v1/lab/test-registration?${query}` : "/api/v1/lab/test-registration";

      const res = await apiFetch(url);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.detail?.message || data?.message || `Failed to fetch test registrations (${res.status})`);
      }

      const apiPayload = data?.rows ?? data?.data ?? data?.tests ?? [];
      const mappedData = Array.isArray(apiPayload)
        ? apiPayload.map((test) => ({
          ...test,
          id: test.test_id || test.id,
          patientId: test.patient_id || test.patientId,
          patientName: test.patient_name || test.patientName,
          testType: test.test_type || test.testType,
          sampleType: test.sample_type || test.sampleType,
          registeredDate: test.registered_date || test.registeredDate,
          status: test.status || "SAMPLE_PENDING",
          priority: test.priority ? String(test.priority).toLowerCase() : "routine",
          selectedTests: Array.isArray(test.selectedTests)
            ? test.selectedTests
            : Array.isArray(test.selected_tests)
              ? test.selected_tests
              : [{
                id: Date.now(),
                testType: test.test_type || test.testType,
                sampleType: test.sample_type || test.sampleType,
              }],
        }))
        : [];
      setTests(mappedData);
      setSummary({
        total_tests_today: data?.summary?.total_tests_today ?? 0,
        completed_tests: data?.summary?.completed_tests ?? 0,
        in_progress_tests: data?.summary?.in_progress_tests ?? 0,
        urgent_tests: data?.summary?.urgent_tests ?? 0,
      });
    } catch (error) {
      console.error("Failed to load test registrations:", error);
      setTests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const handleApplyFilters = () => {
    loadTestData();
  };

  const handleStatusChange = async (testId, newStatus) => {
    try {
      let res = await apiFetch(`/api/v1/lab/test-registration/${testId}/status`, {
        method: "PATCH",
        body: { status: newStatus },
      });

      // Fallback for plural endpoint if 404
      if (res.status === 404) {
        res = await apiFetch(`/api/v1/lab/test-registrations/${testId}/status`, {
          method: "PATCH",
          body: { status: newStatus },
        });
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        let errorMsg = `HTTP Error ${res.status}`;
        if (data?.detail) {
          errorMsg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
        } else if (data?.message) {
          errorMsg = data.message;
        }
        throw new Error(errorMsg);
      }

      setTests((prevTests) =>
        prevTests.map((t) =>
          t.id === testId ? { ...t, status: newStatus } : t
        )
      );
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status: " + error.message);
    }
  };

  const handleRegisterTest = async () => {
    const aggregatedTestType =
      newTest.selectedTests
        .map((t) => t.testType)
        .filter(Boolean)
        .join(", ") || "N/A";
    const aggregatedSampleType =
      newTest.selectedTests
        .map((t) => t.sampleType)
        .filter(Boolean)
        .join(", ") || "N/A";

    const payload = {
      patient_id: newTest.patientId || undefined,
      patient_name: newTest.patientName,
      age: newTest.age ? parseInt(newTest.age, 10) : undefined,
      gender: newTest.gender || undefined,
      phone_number: newTest.phoneNumber || undefined,
      email: newTest.email || undefined,
      registered_date: newTest.registrationDate,
      test_type: aggregatedTestType,
      sample_type: aggregatedSampleType,
      priority: newTest.priority ? newTest.priority.toUpperCase() : "ROUTINE",
      referring_doctor: newTest.referringDoctor || undefined,
      department: newTest.department || undefined,
      instructions: newTest.instructions || undefined,
      selected_tests: newTest.selectedTests.map((t) => ({
        test_type: t.testType,
        sample_type: t.sampleType,
      })),
    };

    if (isEditing) {
      setTests(
        tests.map((t) =>
          t.id === editingTestId
            ? {
              ...t,
              ...newTest,
              testType: aggregatedTestType,
              sampleType: aggregatedSampleType,
              registeredDate: t.registeredDate, // Preserve original date
            }
            : t,
        ),
      );
      alert(`Test updated successfully! ID: ${editingTestId}`);
    } else {
      try {
        let res = await apiFetch("/api/v1/lab/test-registration", {
          method: "POST",
          body: payload,
        });

        if (res.status === 404) {
          res = await apiFetch("/api/v1/lab/test-registrations", {
            method: "POST",
            body: payload,
          });
        }

        const responseData = await res.json().catch(() => ({}));

        if (!res.ok) {
          let errorMsg = `HTTP Error ${res.status}`;
          if (responseData?.detail) {
            errorMsg = typeof responseData.detail === 'string' ? responseData.detail : JSON.stringify(responseData.detail);
          } else if (responseData?.message) {
            errorMsg = responseData.message;
          }
          throw new Error(errorMsg);
        }

        const savedTest = responseData?.data ?? responseData?.row ?? responseData;
        const newTestEntry = {
          id: savedTest?.test_id || savedTest?.id || `TEST-${new Date().getFullYear()}-${(tests.length + 1).toString().padStart(3, "0")}`,
          patientName: savedTest?.patient_name || savedTest?.patientName || newTest.patientName,
          patientId: savedTest?.patient_id || savedTest?.patientId || newTest.patientId || `PAT-${Math.floor(Math.random() * 1000)}`,
          age: savedTest?.age || savedTest?.age || newTest.age,
          gender: savedTest?.gender || newTest.gender,
          phoneNumber: savedTest?.phone_number || savedTest?.phoneNumber,
          email: savedTest?.email || newTest.email,
          testType: savedTest?.test_type || savedTest?.testType || aggregatedTestType,
          sampleType: savedTest?.sample_type || savedTest?.sampleType || aggregatedSampleType,
          registeredDate: savedTest?.registered_date || savedTest?.registeredDate || newTest.registrationDate,
          status: savedTest?.status || "SAMPLE_PENDING",
          priority: savedTest?.priority ? String(savedTest.priority).toLowerCase() : newTest.priority,
          referringDoctor: savedTest?.referring_doctor || savedTest?.referringDoctor || newTest.referringDoctor,
          department: savedTest?.department || newTest.department,
          instructions: savedTest?.instructions || newTest.instructions,
          selectedTests: Array.isArray(savedTest?.selected_tests)
            ? savedTest.selected_tests.map((t, index) => ({
              id: Date.now() + index,
              testType: t.test_type || t.testType,
              sampleType: t.sample_type || t.sampleType,
            }))
            : newTest.selectedTests,
        };

        setTests([newTestEntry, ...tests]);
        alert(`Test registered successfully! ID: ${newTestEntry.id}`);
      } catch (error) {
        console.error("Failed to register test:", error);
        alert(`Unable to register test: ${error.message}`);
      }
    }

    setShowRegistrationModal(false);
    setIsEditing(false);
    setEditingTestId(null);
    setNewTest({
      patientId: "",
      patientName: "",
      age: "",
      gender: "",
      phoneNumber: "",
      email: "",
      registrationDate: new Date().toISOString().split("T")[0],
      testType: "",
      priority: "routine",
      sampleType: "",
      referringDoctor: "",
      department: "",
      instructions: "",
      selectedTests: [{ id: Date.now(), testType: "", sampleType: "" }],
    });
    setPatientSearch("");
  };

  const handleSelectPatient = (patient) => {
    setNewTest({
      ...newTest,
      patientId: patient.id,
      patientName: patient.name,
      age: patient.age,
      gender: patient.gender,
      phoneNumber: patient.phone,
      email: patient.email,
      referringDoctor: patient.doctor || "",
      department: patient.department || "",
    });
    setPatientSearch(patient.name);
    setShowPatientDropdown(false);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleRowClick = (test) => {
    console.log("Test clicked:", test);
    alert(
      `Test Details: ${test.id}\nStatus: ${test.status}\nBarcode: ${test.barcode}`,
    );
  };


  const handleViewTest = (test) => {
    setSelectedTestData(test);
    setShowViewModal(true);
  };

  const handleEditTest = (test) => {
    setIsEditing(true);
    setEditingTestId(test.id);
    setNewTest({
      patientId: test.patientId || "",
      patientName: test.patientName || "",
      age: test.age || "",
      gender: test.gender || "",
      phoneNumber: test.phoneNumber || "",
      email: test.email || "",
      registrationDate:
        test.registeredDate || new Date().toISOString().split("T")[0],
      testType: test.testType || "",
      priority: test.priority || "routine",
      sampleType: test.sampleType || "",
      referringDoctor: test.referringDoctor || "",
      department: test.department || "",
      instructions: test.instructions || "",
      selectedTests: test.selectedTests || [
        {
          id: Date.now(),
          testType: test.testType,
          sampleType: test.sampleType,
        },
      ],
    });
    setPatientSearch(test.patientName || "");
    setShowRegistrationModal(true);
  };

  const handlePrintLabels = (testData) => {
    if (!testData) return;

    const printDate = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const printTime = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Registration Slip - ${testData.id}</title>
        <style>
          @page {
            size: A4;
            margin: 0; /* Prevents browser from showing URL and page numbers */
          }
          body {
            font-family: 'Times New Roman', Times, serif;
            margin: 0;
            padding: 15mm 20mm; /* Manual document padding */
            color: #1a202c;
            line-height: 1.4;
            background: #fff;
          }
          .doc-container {
            width: 100%;
          }
          /* --- Clinical Letterhead --- */
          .letterhead {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 3px double #2d3748;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .hospital-identity {
            flex: 1;
          }
          .hospital-name {
            font-size: 20px;
            font-weight: 800;
            color: #1e3a8a;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .hospital-type {
            font-size: 11px;
            color: #4b5563;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-top: 2px;
            font-weight: 600;
          }
          .hospital-address {
            font-size: 9px;
            color: #6b7280;
            margin-top: 10px;
            line-height: 1.4;
          }
          .slip-branding {
            text-align: right;
          }
          .slip-title {
            font-size: 16px;
            font-weight: bold;
            color: #1e3a8a;
            text-transform: uppercase;
            margin-bottom: 8px;
          }
          .verify-id {
            font-size: 10px;
            font-family: monospace;
            color: #4b5563;
            font-weight: bold;
          }

          /* --- Information Blocks --- */
          .section-heading {
            font-size: 12px;
            font-weight: 700;
            background: #f3f4f6;
            padding: 6px 12px;
            border: 1px solid #e5e7eb;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #1f2937;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 25px;
          }
          .data-table {
            width: 100%;
            border-collapse: collapse;
          }
          .data-table td {
            font-size: 13px;
            padding: 5px 0;
            vertical-align: top;
          }
          .data-label {
            width: 130px;
            font-weight: 700;
            color: #4b5563;
          }
          .data-colon {
            width: 15px;
            font-weight: bold;
          }
          .data-value {
            color: #000;
          }

          /* --- Test Details --- */
          .test-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .test-table th {
            border: 1px solid #374151;
            padding: 10px;
            text-align: left;
            background: #f9fafb;
            font-size: 11px;
            text-transform: uppercase;
            font-weight: 800;
          }
          .test-table td {
            border: 1px solid #d1d5db;
            padding: 12px 10px;
            font-size: 13px;
          }
          .priority-tag {
            font-weight: bold;
            color: #1e3a8a;
          }

          /* --- Instructions --- */
          .instructions-box {
            border: 1px solid #e5e7eb;
            background: #fdfdfd;
            padding: 15px;
            font-size: 12px;
            font-style: italic;
            color: #374151;
            line-height: 1.6;
            margin-bottom: 40px;
            border-left: 4px solid #1e3a8a;
          }

          /* --- Signatures --- */
          .signatures {
            margin-top: 100px;
            display: flex;
            justify-content: space-between;
          }
          .sig-block {
            text-align: center;
            width: 200px;
          }
          .sig-line {
            border-top: 1px solid #000;
            margin-bottom: 5px;
          }
          .sig-text {
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
          }

          /* --- Footer Print Meta --- */
          .print-meta {
            margin-top: 60px;
            padding-top: 10px;
            border-top: 1px dotted #e5e7eb;
            display: flex;
            justify-content: space-between;
            font-size: 9px;
            color: #9ca3af;
          }

          @media print {
            body { -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="doc-container">
          <!-- Letterhead Section -->
          <div class="letterhead">
            <div class="hospital-identity">
              <h1 class="hospital-name">City Multispeciality Hospital</h1>
              <div class="hospital-type">Accredited Diagnostic & Research Centre</div>
              <div class="hospital-address">
                Block C-12, Institutional Area, Main Ring Road, New Delhi - 110029<br />
                Emergency: +91 11 9999 8888 | Lab Helpdesk: +91 11 2345 6700<br />
                Website: www.citymultihospital.com
              </div>
            </div>
            <div class="slip-branding">
              <div class="slip-title">Lab Registration Slip</div>
              <div class="verify-id">NO: ${testData.id}</div>
              <div style="font-size: 11px; margin-top: 5px;">Registration Time: ${printDate}, ${printTime}</div>
            </div>
          </div>

          <!-- Patient Information Section -->
          <div class="section-heading">Patient Identity & Profile</div>
          <div class="info-grid">
            <table class="data-table">
              <tr>
                <td class="data-label">Patient Name</td>
                <td class="data-colon">:</td>
                <td class="data-value" style="font-weight: 800; text-transform: uppercase;">${testData.patientName}</td>
              </tr>
              <tr>
                <td class="data-label">Patient Identifier</td>
                <td class="data-colon">:</td>
                <td class="data-value">${testData.patientId || "N/A"}</td>
              </tr>
              <tr>
                <td class="data-label">Demographics</td>
                <td class="data-colon">:</td>
                <td class="data-value">${testData.age || "N/A"} Years / ${testData.gender || "N/A"}</td>
              </tr>
            </table>
            <table class="data-table">
              <tr>
                <td class="data-label">Contact Number</td>
                <td class="data-colon">:</td>
                <td class="data-value">${testData.phoneNumber || "N/A"}</td>
              </tr>
              <tr>
                <td class="data-label">Email Address</td>
                <td class="data-colon">:</td>
                <td class="data-value">${testData.email || "N/A"}</td>
              </tr>
              <tr>
                <td class="data-label">Booking Date</td>
                <td class="data-colon">:</td>
                <td class="data-value">${testData.registeredDate || testData.registrationDate}</td>
              </tr>
            </table>
          </div>

          <!-- Clinical Context Section -->
          <div class="section-heading">Clinical Context & Referral</div>
          <div class="info-grid">
            <table class="data-table">
              <tr>
                <td class="data-label">Referring Medical Officer</td>
                <td class="data-colon">:</td>
                <td class="data-value">${testData.referringDoctor || "N/A"}</td>
              </tr>
              <tr>
                <td class="data-label">Clinical Department</td>
                <td class="data-colon">:</td>
                <td class="data-value">${testData.department || "N/A"}</td>
              </tr>
            </table>
            <table class="data-table">
              <tr>
                <td class="data-label">Priority Status</td>
                <td class="data-colon">:</td>
                <td class="data-value priority-tag" style="color: ${testData.priority?.toLowerCase() === "urgent" ? "#b91c1c" : "#1e3a8a"}">
                  ${(testData.priority || "Routine").toUpperCase()}
                </td>
              </tr>
              <tr>
                <td class="data-label">Specimen Barcode</td>
                <td class="data-colon">:</td>
                <td class="data-value" style="font-family: monospace; font-weight: bold;">${testData.barcode || "N/A"}</td>
              </tr>
            </table>
          </div>

          <!-- Investigation List Section -->
          <div class="section-heading">Investigation / Test Details</div>
          <table class="test-table">
            <thead>
              <tr>
                <th style="width: 50px; text-align: center;">Index</th>
                <th>Investigation / Test Name</th>
                <th>Recommended Specimen</th>
                <th style="width: 120px; text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${testData.selectedTests && testData.selectedTests.length > 0
        ? testData.selectedTests
          .map(
            (t, i) => `
                      <tr>
                        <td style="text-align: center;">${(i + 1).toString().padStart(2, '0')}</td>
                        <td><strong>${t.testType}</strong></td>
                        <td>${t.sampleType}</td>
                        <td style="text-align: center; color: #059669; font-weight: 700;">REGISTERED</td>
                      </tr>
                    `,
          )
          .join("")
        : `<tr>
                      <td style="text-align: center;">01</td>
                      <td><strong>${testData.testType || "N/A"}</strong></td>
                      <td>${testData.sampleType || "N/A"}</td>
                      <td style="text-align: center; color: #059669; font-weight: 700;">REGISTERED</td>
                    </tr>`
      }
            </tbody>
          </table>

          <!-- Clinical Instructions Section -->
          ${testData.instructions && testData.instructions !== "None"
        ? `
            <div class="section-heading">Clinical Instructions / Patient Preparation</div>
            <div class="instructions-box">
              ${testData.instructions}
            </div>
          `
        : ""
      }

 
        </div>
      </body>
    </html>
    `;

    doc.open();
    doc.write(html);
    doc.close();

    iframe.onload = function () {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1500);
    };
  };

  const handleBulkPrint = () => {
    if (!filteredTests || filteredTests.length === 0) return;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;

    const html = `
  <html>
    <head>

      <style>
@page {
  size: A4;
  margin: 0; /* Setting this to 0 removes browser header/footer like the localhost URL */
}

html, body {
  margin: 0;
  padding: 0;
  background: #fff;
}

body {
  font-family: "Segoe UI", Arial, sans-serif;
}

/* Vertical Stacking */
.container {
  display: flex;
  flex-direction: column;
  padding: 15mm; /* Serves as document margin to avoid paper edges */
  gap: 15mm; /* Gap between cards on the same page */
}

.card {
  box-sizing: border-box;
  height: 125mm; /* Fits exactly 2 per page along with container paddings and gaps */
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 10mm;
  background: #fff;
  page-break-inside: avoid;
}

/* Force page break after every 2nd card */
.card:nth-child(2n) {
  page-break-after: always;
}
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .title {
          font-size: 16px;
          font-weight: bold;
          color: #2563eb;
        }

        .badge {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: bold;
        }

        .urgent {
          background: #fee2e2;
          color: #b91c1c;
        }

        .routine {
          background: #e5e7eb;
          color: #374151;
        }

        .section {
          margin-top: 12px;
        }

        .section-title {
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 6px;
          border-bottom: 2px solid #111;
          padding-bottom: 3px;
        }

        .row {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          font-size: 12px;
          border-bottom: 1px solid #f1f1f1;
        }

        .label {
          color: #6b7280;
          font-weight: 500;
        }

        .value {
          font-weight: 600;
          color: #111827;
        }

        table {
          width: 100%;
          margin-top: 10px;
          border-collapse: collapse;
        }

        th, td {
          border: 1px solid #e5e7eb;
          padding: 6px;
          font-size: 11px;
        }

        th {
          background: #f3f4f6;
          font-weight: bold;
        }

   
      </style>
    </head>

    <body>

      <div class="container">
        ${filteredTests.map(test => `
          <div class="card">
            <!-- HEADER -->
            <div class="header">
              <div class="title">${test.id}</div>
              <div class="badge ${test.priority === "urgent" ? "urgent" : "routine"}">
                ${test.priority.toUpperCase()}
              </div>
            </div>

            <!-- PATIENT DETAILS -->
            <div class="section">
              <div class="section-title">Patient Details</div>

              <div class="row">
                <span class="label">Patient Name</span>
                <span class="value">${test.patientName || "N/A"}</span>
              </div>

              <div class="row">
                <span class="label">Patient ID</span>
                <span class="value">${test.patientId || "N/A"}</span>
              </div>

              <div class="row">
                <span class="label">Age / Gender</span>
                <span class="value">${test.age || "N/A"} / ${test.gender || "N/A"}</span>
              </div>

              <div class="row">
                <span class="label">Phone</span>
                <span class="value">${test.phoneNumber || "N/A"}</span>
              </div>

              <div class="row">
                <span class="label">Email</span>
                <span class="value">${test.email || "N/A"}</span>
              </div>

              <div class="row">
                <span class="label">Registration Date</span>
                <span class="value">${test.registeredDate || "N/A"}</span>
              </div>
            </div>

            <!-- CLINICAL DETAILS -->
            <div class="section">
              <div class="section-title">Clinical Details</div>

              <div class="row">
                <span class="label">Referring Doctor</span>
                <span class="value">${test.referringDoctor || "N/A"}</span>
              </div>

              <div class="row">
                <span class="label">Department</span>
                <span class="value">${test.department || "N/A"}</span>
              </div>

              <div class="row">
                <span class="label">Priority</span>
                <span class="value">${test.priority}</span>
              </div>
            </div>

            <!-- TEST TABLE -->
            <div class="section">
              <div class="section-title">Investigation Details</div>

              <table>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Test & Description</th>
                    <th>Required Sample</th>
                  </tr>
                </thead>
                <tbody>
                  ${(test.selectedTests || []).map((t, i) => `
                    <tr>
                      <td>${i + 1}</td>
                      <td>${t.testType || "N/A"}</td>
                      <td>${t.sampleType || "N/A"}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>

          </div>
        `).join("")}
      </div>

    </body>
  </html>
  `;

    doc.open();
    doc.write(html);
    doc.close();

    iframe.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();

      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 500);
    };
  };

  const filteredTests = tests.filter(
    (test) =>
      test.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.testType.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const testTypes = [
    "CBC",
    "Lipid Profile",
    "Liver Function",
    "Kidney Function",
    "Thyroid",
    "Diabetes",
    "Urine Culture",
    "Blood Culture",
    "COVID-19 RT-PCR",
    "Dengue NS1",
  ];
  const sampleTypes = [
    "Blood",
    "Urine",
    "Stool",
    "Sputum",
    "CSF",
    "Swab",
    "Tissue",
  ];

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-700">
              Test Registration
            </h2>
            <p className="text-gray-500">
              Register new lab tests and manage test requests
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              icon={<Print sx={{ fontSize: 18 }} />}
              onClick={handleBulkPrint}
              className="border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              Print Labels
            </Button>

            <Button
              variant="primary"
              icon={<Add />}
              onClick={() => {
                setIsEditing(false);
                setEditingTestId(null);
                setNewTest({
                  patientId: "",
                  patientName: "",
                  age: "",
                  gender: "",
                  phoneNumber: "",
                  email: "",
                  registrationDate: new Date().toISOString().split("T")[0],
                  testType: "",
                  priority: "routine",
                  sampleType: "",
                  referringDoctor: "",
                  department: "",
                  instructions: "",
                  selectedTests: [
                    { id: Date.now(), testType: "", sampleType: "" },
                  ],
                });
                setPatientSearch("");
                setShowRegistrationModal(true);
              }}
            >
              Register New Test
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded border card-shadow">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input
              type="date"
              value={filters.for_date}
              onChange={(e) => handleFilterChange("for_date", e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Filter by date"
            />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search patient/test"
            />
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="SAMPLE_PENDING">Sample Pending</option>
              <option value="SAMPLE_COLLECTED">Sample Collected</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange("priority", e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Priority</option>
              <option value="ROUTINE">Routine</option>
              <option value="URGENT">Urgent</option>
            </select>
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              disabled={loading}
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded border card-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg mr-4">
                <Science
                  className="text-blue-600"
                  style={{ fontSize: "1.25rem" }}
                />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Tests Today</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {summary.total_tests_today || tests.filter(
                    (t) =>
                      t.registeredDate ===
                      new Date().toISOString().split("T")[0],
                  ).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded border card-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg mr-4">
                <CheckCircle className="text-green-600 text-xl" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Completed Tests</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {summary.completed_tests || tests.filter((t) => t.status === "Completed" || t.status === "COMPLETED").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded border card-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg mr-4">
                <AccessTime
                  className="text-yellow-600"
                  style={{ fontSize: "1.25rem" }}
                />
              </div>
              <div>
                <p className="text-gray-500 text-sm">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  {summary.in_progress_tests || tests.filter((t) => t.status === "In Progress" || t.status === "IN_PROGRESS").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded border card-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg mr-4">
                <ErrorOutline className="text-red-600 text-xl" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Urgent Tests</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {summary.urgent_tests || tests.filter((t) => t.priority === "urgent" || t.priority === "URGENT").length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tests Table */}
        <div className="relative bg-white rounded border card-shadow overflow-hidden min-h-[300px]">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-[1px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
          <div className={`transition-opacity duration-200 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            <DataTable
            columns={[
              { key: "id", title: "Test ID", sortable: true },
              { key: "patientName", title: "Patient Name", sortable: true },
              { key: "testType", title: "Test Type", sortable: true },
              { key: "sampleType", title: "Sample Type", sortable: true },
              {
                key: "registeredDate",
                title: "Registered Date",
                sortable: true,
              },
              {
                key: "status",
                title: "Status",
                sortable: true,
                render: (value, row) => {
                  const statusMap = {
                    "SAMPLE_PENDING": "Sample Pending",
                    "SAMPLE_COLLECTED": "Sample Collected",
                    "IN_PROGRESS": "In Progress",
                    "COMPLETED": "Completed",
                  };
                  const displayValue = statusMap[value] || value;
                  return (
                    <select
                      className={`px-2 py-1 rounded-full text-xs font-semibold appearance-none cursor-pointer outline-none border-none text-center ${displayValue === "Completed"
                          ? "bg-green-100 text-green-800"
                          : displayValue === "In Progress"
                            ? "bg-blue-100 text-blue-800"
                            : displayValue === "Sample Collected"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      value={value}
                      onChange={(e) => handleStatusChange(row.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="SAMPLE_PENDING">Sample Pending</option>
                      <option value="SAMPLE_COLLECTED">Sample Collected</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  );
                },
              },
              {
                key: "priority",
                title: "Priority",
                sortable: true,
                render: (value) => (
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${value === "urgent"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                      }`}
                  >
                    {value.charAt(0).toUpperCase() + value.slice(1)}
                  </span>
                ),
              },
              {
                key: "actions",
                title: "Actions",
                render: (_, row) => (
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewTest(row);
                      }}
                      className="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 flex items-center transition-colors"
                      title="View Details"
                    >
                      <Visibility sx={{ fontSize: 16, mr: 0.5 }} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditTest(row);
                      }}
                      className="px-3 py-1 text-xs font-semibold bg-amber-100 text-amber-800 rounded-md hover:bg-amber-200 flex items-center transition-colors"
                      title="Edit Test"
                    >
                      <Edit sx={{ fontSize: 16, mr: 0.5 }} />
                    </button>
                    {/* <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateBarcode(row.id);
                      }}
                      className="px-3 py-1 text-xs font-semibold bg-purple-100 text-purple-800 rounded-md hover:bg-purple-200 flex items-center transition-colors"
                      title="Generate Barcode/QR"
                    >
                      <QrCode sx={{ fontSize: 16, mr: 0.5 }} /> Barcode
                    </button> */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrintLabels(row);
                      }}
                      className="px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-md hover:bg-emerald-200 flex items-center transition-colors"
                      title="Print Labels"
                    >
                      <Print sx={{ fontSize: 16, mr: 0.5 }} />
                    </button>
                  </div>
                ),
              },
            ]}
            data={filteredTests}
            onRowClick={handleRowClick}
            emptyMessage="No tests found. Register a new test to get started."
          />
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      <Modal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        title={isEditing ? "Edit Test Registration" : "Register New Test"}
        size="lg"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => setShowRegistrationModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={isEditing ? <Edit /> : <Science />}
              onClick={handleRegisterTest}
              disabled={
                !newTest.patientName ||
                newTest.selectedTests.some((t) => !t.testType)
              }
            >
              {isEditing ? "Update Test" : "Register Test"}
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* PATIENT IDENTITY SECTION */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400  tracking-wider flex items-center gap-2">
              <Person sx={{ fontSize: 16 }} /> Patient Identity
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Patient Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    placeholder="Search patient name..."
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      setNewTest({ ...newTest, patientName: e.target.value });
                      setShowPatientDropdown(true);
                    }}
                    onFocus={() => setShowPatientDropdown(true)}
                    required
                  />
                  <ArrowDropDown
                    onClick={() => setShowPatientDropdown(!showPatientDropdown)}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer transition-transform ${showPatientDropdown ? "rotate-180" : ""}`}
                  />

                  {showPatientDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
                      {filteredPatients.length > 0 ? (
                        filteredPatients.map((patient) => (
                          <div
                            key={patient.id}
                            className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 transition-colors"
                            onClick={() => handleSelectPatient(patient)}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold text-gray-800">
                                  {patient.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {patient.id} • {patient.gender} •{" "}
                                  {patient.age} yrs
                                </p>
                              </div>
                              <p className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase">
                                Patient
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div
                          className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2 hover:bg-gray-50 cursor-pointer"
                          onClick={() => {
                            setNewTest({
                              ...newTest,
                              patientName: patientSearch,
                            });
                            setShowPatientDropdown(false);
                          }}
                        >
                          <PersonAdd sx={{ fontSize: 18 }} />
                          Add "{patientSearch}" as new patient
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Patient ID
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  placeholder="Enter or auto-filled ID"
                  value={newTest.patientId}
                  onChange={(e) =>
                    setNewTest({ ...newTest, patientId: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Age
                </label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Years"
                    value={newTest.age}
                    onChange={(e) =>
                      setNewTest({ ...newTest, age: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Gender
                </label>
                <select
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={newTest.gender}
                  onChange={(e) =>
                    setNewTest({ ...newTest, gender: e.target.value })
                  }
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <LocalPhone
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    sx={{ fontSize: 16 }}
                  />
                  <input
                    type="text"
                    className="w-full pl-9 pr-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Contact number"
                    value={newTest.phoneNumber}
                    onChange={(e) =>
                      setNewTest({ ...newTest, phoneNumber: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Email
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    sx={{ fontSize: 16 }}
                  />
                  <input
                    type="email"
                    className="w-full pl-9 pr-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="patient@example.com"
                    value={newTest.email}
                    onChange={(e) =>
                      setNewTest({ ...newTest, email: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Registration Date
                </label>
                <div className="relative">
                  <CalendarToday
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    sx={{ fontSize: 16 }}
                  />
                  <input
                    type="date"
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                    value={newTest.registrationDate}
                    onChange={(e) =>
                      setNewTest({
                        ...newTest,
                        registrationDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* TEST & CLINICAL DETAILS SECTION */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400  tracking-wider flex items-center gap-2">
              <Science sx={{ fontSize: 16 }} /> Test & Clinical Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Referring Doctor
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Doctor's name"
                  value={newTest.referringDoctor}
                  onChange={(e) =>
                    setNewTest({ ...newTest, referringDoctor: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. Cardiology"
                  value={newTest.department}
                  onChange={(e) =>
                    setNewTest({ ...newTest, department: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Priority
                </label>
                <select
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={newTest.priority}
                  onChange={(e) =>
                    setNewTest({ ...newTest, priority: e.target.value })
                  }
                >
                  <option value="routine">Routine</option>
                  <option value="urgent">Urgent</option>
                  <option value="stat">STAT</option>
                </select>
              </div>
            </div>

            {/* Dynamic Tests Table */}
            <div className="border rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600 w-12">
                      id
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">
                      Test & Description
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">
                      Required Sample
                    </th>
                    <th className="px-4 py-2 text-center font-semibold text-gray-600 w-16">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {newTest.selectedTests.map((test, index) => (
                    <tr key={test.id}>
                      <td className="px-4 py-3 text-gray-500 font-medium">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className="w-full px-2 py-1.5 border rounded focus:ring-1 focus:ring-blue-500 outline-none"
                          value={test.testType}
                          onChange={(e) => {
                            const updatedTests = [...newTest.selectedTests];
                            updatedTests[index].testType = e.target.value;
                            setNewTest({
                              ...newTest,
                              selectedTests: updatedTests,
                            });
                          }}
                        >
                          <option value="">Select test type</option>
                          {testTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className="w-full px-2 py-1.5 border rounded focus:ring-1 focus:ring-blue-500 outline-none"
                          value={test.sampleType}
                          onChange={(e) => {
                            const updatedTests = [...newTest.selectedTests];
                            updatedTests[index].sampleType = e.target.value;
                            setNewTest({
                              ...newTest,
                              selectedTests: updatedTests,
                            });
                          }}
                        >
                          <option value="">Select sample type</option>
                          {sampleTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          disabled={newTest.selectedTests.length === 1}
                          onClick={() => {
                            const updatedTests = newTest.selectedTests.filter(
                              (_, i) => i !== index,
                            );
                            setNewTest({
                              ...newTest,
                              selectedTests: updatedTests,
                            });
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-30"
                        >
                          <Delete sx={{ fontSize: 18 }} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="bg-gray-50 p-2 border-t">
                <button
                  onClick={() => {
                    setNewTest({
                      ...newTest,
                      selectedTests: [
                        ...newTest.selectedTests,
                        { id: Date.now(), testType: "", sampleType: "" },
                      ],
                    });
                  }}
                  className="px-4 py-1.5 text-sm text-blue-600 font-semibold flex items-center gap-1 hover:bg-blue-50 rounded transition-colors"
                >
                  <Add sx={{ fontSize: 16 }} /> Add Another Test row
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                Special Instructions
              </label>
              <textarea
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                placeholder="Any special instructions..."
                value={newTest.instructions}
                onChange={(e) =>
                  setNewTest({ ...newTest, instructions: e.target.value })
                }
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* View Details Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Test Details"
        size="lg"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => setShowViewModal(false)}
              className="border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Close
            </Button>
            <Button
              variant="primary"
              icon={<Edit className="text-white" sx={{ fontSize: 18 }} />}
              onClick={() => {
                setShowViewModal(false);
                handleEditTest(selectedTestData);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Edit Test
            </Button>
            <Button
              variant="outline"
              icon={<Print className="text-blue-600" sx={{ fontSize: 18 }} />}
              onClick={() => handlePrintLabels(selectedTestData)}
              className="border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              Print Labels
            </Button>
          </div>
        }
      >
        {selectedTestData && (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Science className="text-blue-600" sx={{ fontSize: 24 }} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400  tracking-widest">
                    Test Identifier
                  </p>
                  <h4 className="text-xl font-bold text-gray-900">
                    {selectedTestData.id}
                  </h4>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-400  tracking-widest mb-1">
                  Status
                </p>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${selectedTestData.status === "Completed"
                      ? "bg-green-100 text-green-700"
                      : selectedTestData.status === "In Progress"
                        ? "bg-blue-100 text-blue-700"
                        : selectedTestData.status === "Sample Collected"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                    }`}
                >
                  {selectedTestData.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Patient Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-blue-600  tracking-wider flex items-center gap-2">
                  <Person sx={{ fontSize: 18 }} /> Patient Information
                </h3>
                <div className="space-y-3 px-1">
                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="text-sm text-gray-900 font-semibold">
                      {selectedTestData.patientName}
                    </p>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <p className="text-sm text-gray-500">Patient ID</p>
                    <p className="text-sm text-gray-900 font-mono font-medium">
                      {selectedTestData.patientId || "N/A"}
                    </p>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <p className="text-sm text-gray-500">Age / Gender</p>
                    <p className="text-sm text-gray-900 font-semibold">
                      {selectedTestData.age
                        ? `${selectedTestData.age} yrs`
                        : "N/A"}{" "}
                      / {selectedTestData.gender || "N/A"}
                    </p>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <p className="text-sm text-gray-500">Contact Number</p>
                    <p className="text-sm text-gray-900 font-semibold">
                      {selectedTestData.phoneNumber || "N/A"}
                    </p>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <p className="text-sm text-gray-500">Email Address</p>
                    <p className="text-sm text-gray-900 font-semibold text-blue-600 truncate max-w-[200px]">
                      {selectedTestData.email || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Registration Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-blue-600  tracking-wider flex items-center gap-2">
                  <CalendarToday sx={{ fontSize: 18 }} /> Registration Details
                </h3>
                <div className="space-y-3 px-1">
                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <p className="text-sm text-gray-500">Registration Date</p>
                    <p className="text-sm text-gray-900 font-semibold italic">
                      {selectedTestData.registeredDate ||
                        selectedTestData.registrationDate ||
                        "N/A"}
                    </p>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <p className="text-sm text-gray-500">Referring Doctor</p>
                    <p className="text-sm text-gray-900 font-semibold">
                      {selectedTestData.referringDoctor || "N/A"}
                    </p>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <p className="text-sm text-gray-500">Department</p>
                    <p className="text-sm text-gray-900 font-semibold">
                      {selectedTestData.department || "N/A"}
                    </p>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <p className="text-sm text-gray-500">Priority Level</p>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold  ${selectedTestData.priority === "urgent"
                          ? "text-red-600 bg-red-50"
                          : "text-blue-600 bg-blue-50"
                        }`}
                    >
                      {selectedTestData.priority}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Test Breakdown Section */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-bold text-blue-600  tracking-wider flex items-center gap-2">
                <Science sx={{ fontSize: 18 }} /> Test Breakdown
              </h3>
              <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                        Test & Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                        Required Sample
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 bg-white">
                    {selectedTestData.selectedTests?.length > 0 ? (
                      selectedTestData.selectedTests.map((test, index) => (
                        <tr
                          key={index}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 font-bold text-gray-900">
                            {test.testType}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold uppercase">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                              {test.sampleType}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">
                          {selectedTestData.testType}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold uppercase">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                            {selectedTestData.sampleType}
                          </span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Special Instructions - Moved to bottom */}
            <div className="pt-2">
              <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm flex items-start gap-3">
                <div className="mt-0.5 p-1.5 bg-amber-50 rounded-lg">
                  <ErrorOutline
                    className="text-amber-600"
                    sx={{ fontSize: 18 }}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-400  tracking-widest mb-1">
                    Special Instructions
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed italic">
                    {selectedTestData.instructions ||
                      "No specific instructions provided for this test registration."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

    </>
  );
};

export default TestRegistration;
