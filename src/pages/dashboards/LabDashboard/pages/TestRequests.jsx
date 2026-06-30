import React, { useState, useEffect } from "react";
import DataTable from "../../../../components/ui/Tables/DataTable";
import Button from "../../../../components/common/Button/Button";
import Modal from "../../../../components/common/Modal/Modal";

import {
  Visibility,
  Edit,
  Print,
  CheckCircle,
  AccessTime,
  ErrorOutline,
  Science,
  CalendarToday,
  Person,
} from "@mui/icons-material";


const DUMMY_TESTS = [
  {
    id: "LAB-1021",
    patientId: "PAT-1001",
    patientName: "Ramesh Kumar",
    age: 45,
    gender: "Male",
    phoneNumber: "9876543210",
    email: "ramesh@example.com",
    registeredDate: new Date().toISOString().split("T")[0],
    testType: "Blood Test",
    sampleType: "Blood",
    status: "PENDING",
    referringDoctor: "Dr. Sharma",
    department: "OPD",
    instructions: "Fasting required for 12 hours before test",
  },
  {
    id: "LAB-1022",
    patientId: "PAT-1002",
    patientName: "Sita Devi",
    age: 32,
    gender: "Female",
    phoneNumber: "9876543211",
    email: "sita@example.com",
    registeredDate: new Date().toISOString().split("T")[0],
    testType: "HbA1c Test",
    sampleType: "Blood",
    status: "IN_PROGRESS",
    referringDoctor: "Dr. Priya",
    department: "OPD",
    instructions: "Routine checkup",
  },
  {
    id: "LAB-1023",
    patientId: "PAT-1003",
    patientName: "Mohan Rao",
    age: 58,
    gender: "Male",
    phoneNumber: "9876543212",
    email: "mohan@example.com",
    registeredDate: new Date().toISOString().split("T")[0],
    testType: "Urine Culture",
    sampleType: "Urine",
    status: "PENDING",
    referringDoctor: "Dr. Rajesh",
    department: "OPD",
    instructions: "Morning sample preferred",
  },
  {
    id: "LAB-1024",
    patientId: "PAT-1004",
    patientName: "Anjali Gupta",
    age: 27,
    gender: "Female",
    phoneNumber: "9876543213",
    email: "anjali@example.com",
    registeredDate: new Date().toISOString().split("T")[0],
    testType: "CBC, Lipid Profile",
    sampleType: "Blood",
    status: "COMPLETED",
    referringDoctor: "Dr. Neha",
    department: "OPD",
    instructions: "None",
  }
];

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

const TestRegistration = () => {
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState([]);
  const [allTests, setAllTests] = useState(DUMMY_TESTS);

  
  const [newTest, setNewTest] = useState({
    patientId: "",
    patientName: "",
    age: "",
    gender: "",
    phoneNumber: "",
    email: "",
    registrationDate: new Date().toISOString().split("T")[0],
    testType: "",
    sampleType: "",
    referringDoctor: "",
    department: "",
    instructions: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingTestId, setEditingTestId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingTestId, setRejectingTestId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");


  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTestData, setSelectedTestData] = useState(null);
  const [filters, setFilters] = useState({
    for_date: "",
    search: "",
    status: "",

  });
  const [summary, setSummary] = useState({
    total_tests_today: 0,
    completed_tests: 0,
    in_progress_tests: 0,
    urgent_tests: 0,
  });

  useEffect(() => {
    loadTestData();
    // eslint-disable-next-line
  }, [allTests]);

  const loadTestData = () => {
    setLoading(true);
    try {
      let finalData = [...allTests];
      if (filters.status) {
        finalData = finalData.filter(t => t.status === filters.status);
      }
      if (filters.priority) {
        finalData = finalData.filter(t => t.priority && t.priority.toUpperCase() === filters.priority);
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        finalData = finalData.filter(t =>
          t.patientName.toLowerCase().includes(searchLower) ||
          t.id.toLowerCase().includes(searchLower) ||
          t.testType.toLowerCase().includes(searchLower)
        );
      }

      setTests(finalData);

      const completedCount = finalData.filter(t => t.status === "COMPLETED" || t.status === "Completed").length;
      const inProgressCount = finalData.filter(t => t.status === "IN_PROGRESS" || t.status === "In Progress").length;
      const urgentCount = finalData.filter(t => t.priority === "urgent" || t.priority === "URGENT").length;

      setSummary({
        total_tests_today: finalData.length,
        completed_tests: completedCount,
        in_progress_tests: inProgressCount,
        urgent_tests: urgentCount,
      });
    } catch (error) {
      console.error("Failed to load test registrations:", error);
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

  const handleStatusChange = (testId, newStatus) => {
    try {
      setAllTests((prevTests) =>
        prevTests.map((t) =>
          t.id === testId ? { ...t, status: newStatus } : t
        )
      );
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleRegisterTest = async () => {
    if (isEditing) {
      setAllTests((prevTests) =>
        prevTests.map((t) =>
          t.id === editingTestId
            ? {
              ...t,
              ...newTest,
              registeredDate: t.registeredDate, // Preserve original date
            }
            : t,
        ),
      );
      alert(`Test updated successfully! ID: ${editingTestId}`);
    } else {
      const newTestEntry = {
        id: newTest.patientId ? `LAB-${newTest.patientId.replace("PAT-", "")}-${(allTests.length + 1021)}` : `LAB-${Math.floor(1000 + Math.random() * 9000)}`,
        patientName: newTest.patientName,
        patientId: newTest.patientId || `PAT-${Math.floor(1000 + Math.random() * 9000)}`,
        age: newTest.age,
        gender: newTest.gender,
        phoneNumber: newTest.phoneNumber,
        email: newTest.email,
        testType: newTest.testType,
        sampleType: newTest.sampleType,
        registeredDate: newTest.registrationDate,
        status: "PENDING",
        priority: newTest.priority || "routine",
        referringDoctor: newTest.referringDoctor,
        department: newTest.department,
        instructions: newTest.instructions,
      };

      setAllTests([newTestEntry, ...allTests]);
      alert(`Test registered successfully! ID: ${newTestEntry.id}`);
    }

    setShowEditModal(false);
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
    });

  };



  const handleRowClick = (test) => {
    console.log("Test clicked:", test);
    alert(
      `Test Details: ${test.id}\nStatus: ${test.status}\nBarcode: ${test.barcode}`,
    );
  };


  const handleRejectClick = (testId) => {
    setRejectingTestId(testId);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const submitRejection = () => {
    if (!rejectReason.trim()) {
      alert("Please enter a reason for rejection.");
      return;
    }
    setAllTests((prevTests) =>
      prevTests.map((t) =>
        t.id === rejectingTestId
          ? {
              ...t,
              status: "REJECTED",
              rejectionReason: rejectReason,
            }
          : t
      )
    );
    setShowRejectModal(false);
    alert("Test request rejected successfully.");
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
    });

    setShowEditModal(true);
  };

  const handleViewTest = (test) => {
    setSelectedTestData(test);
    setShowViewModal(true);
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
              <div class="badge ${(test.priority || "routine").toLowerCase() === "urgent" ? "urgent" : "routine"}">
                ${(test.priority || "routine").toUpperCase()}
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
                <span class="value">${test.priority || "routine"}</span>
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

  const filteredTests = tests;



  return (
    <>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-700">
              Test Requests
            </h2>
            <p className="text-gray-500">
              Manage lab test requests & patient status
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


          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded border card-shadow">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="date"
              value={filters.for_date}
              onChange={(e) => handleFilterChange("for_date", e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="ACCEPT">Accept</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
              disabled={loading}
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                      "PENDING": "Pending",
                      "ACCEPT": "Accept",
                      "IN_PROGRESS": "In Progress",
                      "COMPLETED": "Completed",
                      "REJECTED": "Rejected"
                    };

                    if (value === "PENDING") {
                      return (
                        <div className="flex gap-2 justify-center items-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleStatusChange(row.id, "ACCEPT")}
                            className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-md transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectClick(row.id)}
                            className="px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-bold rounded-md transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      );
                    }

                    const displayValue = statusMap[value] || value;
                    return (
                      <select
                        className={`px-3 py-1 rounded-full text-xs font-semibold appearance-none cursor-pointer outline-none border border-gray-200/50 text-center ${displayValue === "Completed"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : displayValue === "In Progress"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : displayValue === "Accept"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : displayValue === "Rejected"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-gray-50 text-gray-700 border-gray-200"
                          }`}
                        value={value}
                        onChange={(e) => handleStatusChange(row.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="ACCEPT">Accept</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="REJECTED">Reject</option>
                      </select>
                    );
                  },
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
                  className={`px-3 py-1 rounded-full text-xs font-bold ${selectedTestData.status === "COMPLETED" || selectedTestData.status === "Completed"
                    ? "bg-green-100 text-green-700"
                    : selectedTestData.status === "IN_PROGRESS" || selectedTestData.status === "In Progress"
                      ? "bg-blue-100 text-blue-700"
                      : selectedTestData.status === "ACCEPT" || selectedTestData.status === "Accept"
                        ? "bg-emerald-100 text-emerald-700"
                        : selectedTestData.status === "PENDING" || selectedTestData.status === "Pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                    }`}
                >
                  {selectedTestData.status === "PENDING"
                    ? "Pending"
                    : selectedTestData.status === "ACCEPT"
                      ? "Accepted"
                      : selectedTestData.status === "IN_PROGRESS"
                        ? "In Progress"
                        : selectedTestData.status === "COMPLETED"
                          ? "Completed"
                          : selectedTestData.status === "REJECTED"
                            ? "Rejected"
                            : selectedTestData.status}
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
                    <p className="text-sm  font-semibold text-blue-600 truncate max-w-[200px]">
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
                      className={`px-2 py-0.5 rounded text-[10px] font-bold  ${(selectedTestData.priority || "routine") === "urgent"
                        ? "text-red-600 bg-red-50"
                        : "text-blue-600 bg-blue-50"
                        }`}
                    >
                      {selectedTestData.priority || "routine"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Test Details Section */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-bold text-blue-600 tracking-wider flex items-center gap-2">
                <Science sx={{ fontSize: 18 }} /> Test Information
              </h3>
              <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                <div className="flex justify-between items-center py-1 border-b border-gray-100">
                  <p className="text-sm text-gray-500 font-medium">Test Type</p>
                  <p className="text-sm text-gray-900 font-bold">
                    {selectedTestData.testType || "N/A"}
                  </p>
                </div>
                <div className="flex justify-between items-center py-1">
                  <p className="text-sm text-gray-500 font-medium">Sample Type</p>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold uppercase">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    {selectedTestData.sampleType || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {selectedTestData.rejectionReason && (
              <div className="pt-2">
                <div className="p-4 rounded-xl border border-red-100 bg-red-50/50 shadow-sm flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 bg-red-100 rounded-lg">
                    <ErrorOutline className="text-red-600" sx={{ fontSize: 18 }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-red-500 tracking-widest mb-1">
                      Cancellation Reason
                    </p>
                    <p className="text-sm text-red-700 leading-relaxed font-semibold">
                      {selectedTestData.rejectionReason}
                    </p>
                  </div>
                </div>
              </div>
            )}

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

      {/* Edit Test Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Test Registration"
        size="lg"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
              className="border-gray-200 text-gray-600"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={<Edit />}
              onClick={handleRegisterTest}
              disabled={!newTest.patientName || !newTest.testType}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Update Test
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* PATIENT IDENTITY SECTION */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 tracking-wider flex items-center gap-2">
              <Person sx={{ fontSize: 16 }} /> Patient Identity
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Patient Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  placeholder="Patient Name"
                  value={newTest.patientName}
                  onChange={(e) =>
                    setNewTest({ ...newTest, patientName: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Patient ID
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-gray-500 cursor-not-allowed"
                  placeholder="Patient ID"
                  value={newTest.patientId}
                  disabled
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Age
                </label>
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
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Contact number"
                  value={newTest.phoneNumber}
                  onChange={(e) =>
                    setNewTest({ ...newTest, phoneNumber: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="patient@example.com"
                  value={newTest.email}
                  onChange={(e) =>
                    setNewTest({ ...newTest, email: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Registration Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

          <div className="h-px bg-gray-100" />

          {/* TEST & CLINICAL DETAILS SECTION */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 tracking-wider flex items-center gap-2">
              <Science sx={{ fontSize: 16 }} /> Test & Clinical Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
            </div>

            {/* Test Selection Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Test Type
                </label>
                <select
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium"
                  value={newTest.testType}
                  onChange={(e) =>
                    setNewTest({ ...newTest, testType: e.target.value })
                  }
                >
                  <option value="">Select test type</option>
                  {testTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Sample Type
                </label>
                <select
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium"
                  value={newTest.sampleType}
                  onChange={(e) =>
                    setNewTest({ ...newTest, sampleType: e.target.value })
                  }
                >
                  <option value="">Select sample type</option>
                  {sampleTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
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

      {/* Rejection Reason Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Cancel Test Request"
        size="md"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => setShowRejectModal(false)}
              className="border-gray-200 text-gray-600"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="bg-red-600 hover:bg-red-700 text-white font-semibold"
              onClick={submitRejection}
            >
              Submit Cancellation
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            Please provide a reason for rejecting this laboratory test request. This reason will be recorded on the patient slip and lab records.
          </p>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Reason for Cancellation
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
              rows="4"
              placeholder="e.g. Insufficient sample, Patient requested cancellation, Incorrect test selection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              required
            />
          </div>
        </div>
      </Modal>

    </>
  );
};

export default TestRegistration;
