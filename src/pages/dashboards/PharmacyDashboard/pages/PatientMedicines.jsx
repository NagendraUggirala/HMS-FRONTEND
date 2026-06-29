import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  InputAdornment,
  IconButton,
  CircularProgress,
  Divider
} from "@mui/material";
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  PlayArrow as PlayArrowIcon,
  Check as CheckIcon,
  LocalShipping as LocalShippingIcon,
  Close as CloseIcon,
  ReceiptLong as ReceiptLongIcon,
  HourglassEmpty as HourglassIcon,
  Sync as SyncIcon,
  CheckCircleOutline as CheckCircleIcon,
  LocalPharmacy as PharmacyIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  PictureAsPdf as PdfIcon,
  Save as SaveIcon,
  CreditCard as CreditCardIcon,
  QrCodeScanner as QrCodeIcon,
  CheckCircle as SuccessIcon
} from "@mui/icons-material";

// 1. Initial Dummy Prescriptions with Prices, Quantities, and Payments
const DUMMY_PRESCRIPTIONS = [
  {
    prescriptionId: "RX-1001",
    patientId: "PAT-1001",
    patientName: "Ramesh Kumar",
    doctorId: "DOC-101",
    doctorName: "Dr. Rajesh",
    date: "2026-06-24",
    status: "Pending",
    notes: "Take after meals. Avoid cold drinks.",
    totalPrice: 161.0,
    paymentMode: null,
    onlineMethod: null,
    upiId: null,
    paymentStatus: "Pending",
    medications: [
      {
        medicineName: "Metformin",
        dosage: "500mg",
        frequency: "Once Daily",
        duration: "7 Days",
        quantity: 14,
        price: 8.5
      },
      {
        medicineName: "Paracetamol",
        dosage: "650mg",
        frequency: "Twice Daily",
        duration: "5 Days",
        quantity: 10,
        price: 4.2
      }
    ]
  },
  {
    prescriptionId: "RX-1002",
    patientId: "PAT-1002",
    patientName: "Suresh Kumar",
    doctorId: "DOC-102",
    doctorName: "Dr. Priya",
    date: "2026-06-24",
    status: "Pending",
    notes: "Take before breakfast.",
    totalPrice: 1004.5,
    paymentMode: null,
    onlineMethod: null,
    upiId: null,
    paymentStatus: "Pending",
    medications: [
      {
        medicineName: "Pantoprazole",
        dosage: "40mg",
        frequency: "Once Daily",
        duration: "14 Days",
        quantity: 14,
        price: 12.0
      },
      {
        medicineName: "Amoxicillin",
        dosage: "500mg",
        frequency: "Three times daily",
        duration: "7 Days",
        quantity: 21,
        price: 18.5
      },
      {
        medicineName: "Clarithromycin",
        dosage: "250mg",
        frequency: "Twice Daily",
        duration: "7 Days",
        quantity: 14,
        price: 32.0
      }
    ]
  },
  {
    prescriptionId: "RX-1003",
    patientId: "PAT-1003",
    patientName: "Lakshmi Devi",
    doctorId: "DOC-103",
    doctorName: "Dr. Arun",
    date: "2026-06-24",
    status: "Processing",
    notes: "Take with plenty of water.",
    totalPrice: 555.0,
    paymentMode: null,
    onlineMethod: null,
    upiId: null,
    paymentStatus: "Pending",
    medications: [
      {
        medicineName: "Atorvastatin",
        dosage: "20mg",
        frequency: "At bedtime",
        duration: "30 Days",
        quantity: 30,
        price: 15.0
      },
      {
        medicineName: "Aspirin",
        dosage: "75mg",
        frequency: "Once Daily",
        duration: "30 Days",
        quantity: 30,
        price: 3.5
      }
    ]
  },
  {
    prescriptionId: "RX-1004",
    patientId: "PAT-1004",
    patientName: "Anitha Reddy",
    doctorId: "DOC-104",
    doctorName: "Dr. Neha",
    date: "2026-06-23",
    status: "Pending",
    notes: "Monitor blood pressure daily.",
    totalPrice: 708.0,
    paymentMode: null,
    onlineMethod: null,
    upiId: null,
    paymentStatus: "Pending",
    medications: [
      {
        medicineName: "Amlodipine",
        dosage: "5mg",
        frequency: "Once Daily",
        duration: "30 Days",
        quantity: 30,
        price: 6.5
      },
      {
        medicineName: "Telmisartan",
        dosage: "40mg",
        frequency: "Once Daily",
        duration: "30 Days",
        quantity: 30,
        price: 14.2
      },
      {
        medicineName: "Hydrochlorothiazide",
        dosage: "12.5mg",
        frequency: "Once Daily",
        duration: "15 Days",
        quantity: 15,
        price: 5.8
      }
    ]
  },
  {
    prescriptionId: "RX-1005",
    patientId: "PAT-1005",
    patientName: "Vijay Kumar",
    doctorId: "DOC-105",
    doctorName: "Dr. Rajesh",
    date: "2026-06-23",
    status: "Processing",
    notes: "Inhale properly as instructed.",
    totalPrice: 855.0,
    paymentMode: null,
    onlineMethod: null,
    upiId: null,
    paymentStatus: "Pending",
    medications: [
      {
        medicineName: "Fluticasone Salmeterol",
        dosage: "250mcg",
        frequency: "Twice Daily",
        duration: "30 Days",
        quantity: 1,
        price: 450.0
      },
      {
        medicineName: "Montelukast",
        dosage: "10mg",
        frequency: "At bedtime",
        duration: "15 Days",
        quantity: 15,
        price: 22.0
      },
      {
        medicineName: "Levocetirizine",
        dosage: "5mg",
        frequency: "Once Daily",
        duration: "10 Days",
        quantity: 10,
        price: 7.5
      }
    ]
  },
  {
    prescriptionId: "RX-1006",
    patientId: "PAT-1006",
    patientName: "Pavan Kumar",
    doctorId: "DOC-106",
    doctorName: "Dr. Priya",
    date: "2026-06-23",
    status: "Ready",
    notes: "Do not skip doses.",
    totalPrice: 115.0,
    paymentMode: null,
    onlineMethod: null,
    upiId: null,
    paymentStatus: "Pending",
    medications: [
      {
        medicineName: "Ibuprofen",
        dosage: "400mg",
        frequency: "As needed",
        duration: "5 Days",
        quantity: 10,
        price: 5.5
      },
      {
        medicineName: "Pantoprazole",
        dosage: "40mg",
        frequency: "Once Daily",
        duration: "5 Days",
        quantity: 5,
        price: 12.0
      }
    ]
  },
  {
    prescriptionId: "RX-1007",
    patientId: "PAT-1007",
    patientName: "Keerthi Rao",
    doctorId: "DOC-107",
    doctorName: "Dr. Sharma",
    date: "2026-06-22",
    status: "Ready",
    totalPrice: 1500.0,
    paymentMode: null,
    onlineMethod: null,
    upiId: null,
    paymentStatus: "Pending",
    medications: [
      {
        medicineName: "Glimepiride",
        dosage: "2mg",
        frequency: "Once Daily",
        duration: "30 Days",
        quantity: 30,
        price: 11.0
      },
      {
        medicineName: "Metformin",
        dosage: "1000mg",
        frequency: "Twice Daily",
        duration: "30 Days",
        quantity: 30,
        price: 19.5
      },
      {
        medicineName: "Methylcobalamin",
        dosage: "1500mcg",
        frequency: "Once Daily",
        duration: "30 Days",
        quantity: 30,
        price: 19.5
      }
    ]
  },
  {
    prescriptionId: "RX-1008",
    patientId: "PAT-1008",
    patientName: "Sai Teja",
    doctorId: "DOC-108",
    doctorName: "Dr. Arun",
    date: "2026-06-22",
    status: "Completed",
    totalPrice: 289.0,
    paymentMode: "Online",
    onlineMethod: "UPI",
    upiId: "saiteja@okaxis",
    paymentStatus: "Paid",
    medications: [
      {
        medicineName: "Azithromycin",
        dosage: "500mg",
        frequency: "Once Daily",
        duration: "3 Days",
        quantity: 3,
        price: 45.0
      },
      {
        medicineName: "Paracetamol",
        dosage: "650mg",
        frequency: "Three times daily",
        duration: "5 Days",
        quantity: 15,
        price: 4.2
      },
      {
        medicineName: "Cetirizine",
        dosage: "10mg",
        frequency: "At bedtime",
        duration: "5 Days",
        quantity: 5,
        price: 6.0
      },
      {
        medicineName: "Cough Syrup",
        dosage: "10ml",
        frequency: "Three times daily",
        duration: "5 Days",
        quantity: 1,
        price: 95.0
      }
    ]
  },
  {
    prescriptionId: "RX-1009",
    patientId: "PAT-1009",
    patientName: "Ravi Kiran",
    doctorId: "DOC-109",
    doctorName: "Dr. Neha",
    date: "2026-06-21",
    status: "Pending",
    notes: "Avoid fatty food items.",
    totalPrice: 360.0,
    paymentMode: null,
    onlineMethod: null,
    upiId: null,
    paymentStatus: "Pending",
    medications: [
      {
        medicineName: "Ranitidine",
        dosage: "150mg",
        frequency: "Twice Daily",
        duration: "10 Days",
        quantity: 20,
        price: 4.5
      },
      {
        medicineName: "Domperidone",
        dosage: "10mg",
        frequency: "Three times daily",
        duration: "10 Days",
        quantity: 30,
        price: 9.0
      }
    ]
  },
  {
    prescriptionId: "RX-1010",
    patientId: "PAT-1010",
    patientName: "Bhavani Devi",
    doctorId: "DOC-110",
    doctorName: "Dr. Sharma",
    date: "2026-06-21",
    status: "Processing",
    totalPrice: 885.0,
    paymentMode: null,
    onlineMethod: null,
    upiId: null,
    paymentStatus: "Pending",
    medications: [
      {
        medicineName: "Calcium Carbonate",
        dosage: "500mg",
        frequency: "Once Daily",
        duration: "30 Days",
        quantity: 30,
        price: 13.5
      },
      {
        medicineName: "Vitamin D3",
        dosage: "60000 IU",
        frequency: "Once Weekly",
        duration: "4 Weeks",
        quantity: 4,
        price: 120.0
      }
    ]
  }
];

export default function PatientMedicines() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("All");
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Editable fields inside Billing Table
  const [editingMedications, setEditingMedications] = useState([]);
  const [notes, setNotes] = useState("");

  // Payment checkout state fields
  const [paymentMode, setPaymentMode] = useState("Cash"); // "Cash" | "Online"
  const [onlineMethod, setOnlineMethod] = useState("UPI"); // "UPI" | "QR" | "Card"
  const [upiId, setUpiId] = useState("");
  const [cardDetails, setCardDetails] = useState({ number: "", name: "", expiry: "", cvv: "" });

  // Interactive QR Simulation State
  const [qrState, setQrState] = useState("idle"); // "idle" | "scanning" | "success"

  // Dispense Processing Loader Overlay
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [processingPhase, setProcessingPhase] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    const loadPrescriptions = () => {
      try {
        const localData = localStorage.getItem("hospitalPrescriptions");
        if (!localData) {
          localStorage.setItem("hospitalPrescriptions", JSON.stringify(DUMMY_PRESCRIPTIONS));
          setPrescriptions(DUMMY_PRESCRIPTIONS);
        } else {
          setPrescriptions(JSON.parse(localData));
        }
      } catch (err) {
        console.error("Failed to load prescriptions:", err);
        setPrescriptions(DUMMY_PRESCRIPTIONS);
      }
    };

    loadPrescriptions();

    // Listen to localStorage changes in the same window
    const handleStorageChange = () => {
      const localData = localStorage.getItem("hospitalPrescriptions");
      if (localData) {
        setPrescriptions(JSON.parse(localData));
      }
    };
    window.addEventListener("storage", handleStorageChange);
    const interval = setInterval(handleStorageChange, 2000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Initialize editable state when prescription dialog is opened
  useEffect(() => {
    if (selectedPrescription) {
      const meds = (selectedPrescription.medications || []).map((m) => ({
        medicineName: m.medicineName || m.medication || "",
        dosage: m.dosage || "",
        frequency: m.frequency || "",
        duration: m.duration || "",
        quantity: m.quantity !== undefined ? m.quantity : 10,
        price: m.price !== undefined ? m.price : 15.0,
        isManual: m.isManual || false
      }));
      setEditingMedications(meds);
      setNotes(selectedPrescription.notes || "");
      
      // Seed payment mode states if already completed
      setPaymentMode(selectedPrescription.paymentMode || "Cash");
      setOnlineMethod(selectedPrescription.onlineMethod || "UPI");
      setUpiId(selectedPrescription.upiId || "");
      setCardDetails({
        number: selectedPrescription.cardDetails?.number || "",
        name: selectedPrescription.cardDetails?.name || "",
        expiry: selectedPrescription.cardDetails?.expiry || "",
        cvv: ""
      });
      setQrState(selectedPrescription.paymentMode === "Online" && selectedPrescription.onlineMethod === "QR" ? "success" : "idle");
    } else {
      setEditingMedications([]);
      setNotes("");
      setPaymentMode("Cash");
      setOnlineMethod("UPI");
      setUpiId("");
      setCardDetails({ number: "", name: "", expiry: "", cvv: "" });
      setQrState("idle");
    }
  }, [selectedPrescription]);

  // Compute dynamic stats
  const stats = React.useMemo(() => {
    const total = prescriptions.length;
    const pending = prescriptions.filter((p) => p.status === "Pending").length;
    const processing = prescriptions.filter((p) => p.status === "Processing").length;
    const ready = prescriptions.filter((p) => p.status === "Ready").length;
    const completed = prescriptions.filter((p) => p.status === "Completed").length;
    return { total, pending, processing, ready, completed };
  }, [prescriptions]);

  // Filtered list based on Search & Status Filters
  const filteredPrescriptions = React.useMemo(() => {
    return prescriptions.filter((p) => {
      const matchesSearch =
        p.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.prescriptionId?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = selectedStatusFilter === "All" || p.status === selectedStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [prescriptions, searchQuery, selectedStatusFilter]);

  // Dynamic Total Price Calculation
  const calculatedTotal = React.useMemo(() => {
    return editingMedications.reduce((sum, med) => {
      return sum + (Number(med.quantity || 0) * Number(med.price || 0));
    }, 0);
  }, [editingMedications]);

  // Add custom manual medicine row
  const handleAddManualMedication = () => {
    setEditingMedications([
      ...editingMedications,
      {
        medicineName: "",
        dosage: "500mg",
        frequency: "Once Daily",
        duration: "7 Days",
        quantity: 10,
        price: 15.0,
        isManual: true
      }
    ]);
  };

  // Delete medicine row
  const handleDeleteRow = (index) => {
    const updated = editingMedications.filter((_, idx) => idx !== index);
    setEditingMedications(updated);
  };

  // Modify field values in billing table
  const handleFieldChange = (index, field, value) => {
    const updated = [...editingMedications];
    updated[index] = { ...updated[index], [field]: value };
    setEditingMedications(updated);
  };

  // Save changes locally without changing status
  const handleSaveChanges = () => {
    try {
      const emptyNames = editingMedications.some((m) => !m.medicineName?.trim());
      if (emptyNames) {
        toast.warning("Please fill out the Medicine Name for all custom medications.");
        return;
      }

      const updated = prescriptions.map((p) => {
        if (p.prescriptionId === selectedPrescription.prescriptionId) {
          return {
            ...p,
            medications: editingMedications,
            totalPrice: calculatedTotal,
            notes: notes
          };
        }
        return p;
      });

      setPrescriptions(updated);
      localStorage.setItem("hospitalPrescriptions", JSON.stringify(updated));
      toast.success("Prescription details and billing saved.");

      setSelectedPrescription({
        ...selectedPrescription,
        medications: editingMedications,
        totalPrice: calculatedTotal,
        notes: notes
      });
    } catch (err) {
      console.error("Failed to save changes:", err);
      toast.error("Failed to save billing details");
    }
  };

  // UPI Handle Auto-Append helper
  const handleUpiShortcut = (handle) => {
    const base = upiId.split("@")[0] || "";
    setUpiId(base + handle);
  };

  // QR Scanning Simulation Helper
  const handleSimulateQrScan = () => {
    setQrState("scanning");
    setTimeout(() => {
      setQrState("success");
      setUpiId(`TXN-QR-${Math.floor(100000 + Math.random() * 900000)}`);
      toast.success("Payment Received Successfully via QR Code Scan!");
    }, 2000);
  };

  // Dispense confirmation with simulated multi-step payment gateway loading screen
  const handleDispenseCheckout = (prescriptionId) => {
    const emptyNames = editingMedications.some((m) => !m.medicineName?.trim());
    if (emptyNames) {
      toast.warning("Please fill out the Medicine Name for all custom medications.");
      return;
    }

    // Validation checks
    if (paymentMode === "Online") {
      if (onlineMethod === "UPI" && !upiId.trim()) {
        toast.warning("Please enter patient UPI ID.");
        return;
      }
      if (onlineMethod === "Card" && (!cardDetails.number.trim() || !cardDetails.name.trim() || !cardDetails.expiry.trim())) {
        toast.warning("Please fill out Credit/Debit Card Details.");
        return;
      }
      if (onlineMethod === "QR" && qrState !== "success") {
        toast.warning("Please scan and simulate success for the QR Code first.");
        return;
      }
    }

    // Start checkout processing animation steps
    setPaymentProcessing(true);
    setProcessingPhase("Validating Account Settlement Details...");

    setTimeout(() => {
      setProcessingPhase("Connecting to secure hospital billing gateway...");
      setTimeout(() => {
        setProcessingPhase("Verifying Transaction Funds Approval...");
        setTimeout(() => {
          setProcessingPhase("Payment Successful! Recording dispensation...");
          setTimeout(() => {
            // Apply and persist state
            setPaymentProcessing(false);
            handleUpdateStatusAndSave(prescriptionId, "Completed");
          }, 800);
        }, 1000);
      }, 1000);
    }, 1000);
  };

  // Update status & save billing details simultaneously (Internal database update)
  const handleUpdateStatusAndSave = (prescriptionId, nextStatus) => {
    try {
      const updated = prescriptions.map((p) => {
        if (p.prescriptionId === prescriptionId) {
          const updatedObj = {
            ...p,
            status: nextStatus,
            medications: editingMedications,
            totalPrice: calculatedTotal,
            notes: notes
          };

          // Append payment configuration if dispensing
          if (nextStatus === "Completed") {
            updatedObj.paymentMode = paymentMode;
            updatedObj.onlineMethod = paymentMode === "Online" ? onlineMethod : null;
            updatedObj.upiId = (paymentMode === "Online" && (onlineMethod === "UPI" || onlineMethod === "QR")) ? upiId : null;
            updatedObj.cardDetails = (paymentMode === "Online" && onlineMethod === "Card") ? {
              number: cardDetails.number ? `****-****-****-${cardDetails.number.replace(/\s+/g, "").slice(-4)}` : "",
              name: cardDetails.name,
              expiry: cardDetails.expiry
            } : null;
            updatedObj.paymentStatus = "Paid";
          }
          return updatedObj;
        }
        return p;
      });

      setPrescriptions(updated);
      localStorage.setItem("hospitalPrescriptions", JSON.stringify(updated));

      if (nextStatus === "Processing") {
        toast.info(`Prescription ${prescriptionId} is now in processing.`);
      } else if (nextStatus === "Ready") {
        toast.success(`Prescription ${prescriptionId} marked as Ready!`);
      } else if (nextStatus === "Completed") {
        toast.success(`Prescription ${prescriptionId} Completed & Dispensed.`);
      }

      // Sync active state
      setSelectedPrescription({
        ...selectedPrescription,
        status: nextStatus,
        medications: editingMedications,
        totalPrice: calculatedTotal,
        notes: notes,
        paymentMode: nextStatus === "Completed" ? paymentMode : selectedPrescription.paymentMode,
        onlineMethod: nextStatus === "Completed" && paymentMode === "Online" ? onlineMethod : selectedPrescription.onlineMethod,
        upiId: nextStatus === "Completed" && paymentMode === "Online" && (onlineMethod === "UPI" || onlineMethod === "QR") ? upiId : selectedPrescription.upiId,
        cardDetails: nextStatus === "Completed" && paymentMode === "Online" && onlineMethod === "Card" ? {
          number: cardDetails.number ? `****-****-****-${cardDetails.number.replace(/\s+/g, "").slice(-4)}` : "",
          name: cardDetails.name,
          expiry: cardDetails.expiry
        } : selectedPrescription.cardDetails,
        paymentStatus: nextStatus === "Completed" ? "Paid" : (selectedPrescription.paymentStatus || "Pending")
      });
    } catch (err) {
      console.error("Failed to update status and save:", err);
      toast.error("Failed to update status");
    }
  };

  // PDF Bill / Invoice Download Handler
  const handleDownloadPDF = () => {
    if (!selectedPrescription) return;

    try {
      const doc = new jsPDF();

      // Professional Invoice Header
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(13, 71, 161); // deep blue
      doc.text("CITY HOSPITAL PHARMACY", 14, 20);

      doc.setFontSize(9);
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(100, 116, 139); // slate gray
      doc.text("123 Healthcare Ave, Medical City", 14, 26);
      doc.text("Phone: +1 234 567 890 | Email: pharmacy@cityhospital.com", 14, 31);

      doc.setFontSize(16);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(30, 41, 59); // dark slate
      doc.text("INVOICE / DISPENSATION BILL", 14, 45);

      // Horizontal separator line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(14, 49, 196, 49);

      // Patient & Bill details
      doc.setFontSize(10);
      doc.setFont("Helvetica", "bold");
      doc.text("Patient Details:", 14, 56);
      doc.setFont("Helvetica", "normal");
      doc.text(`Name: ${selectedPrescription.patientName}`, 14, 62);
      doc.text(`Patient ID: ${selectedPrescription.patientId}`, 14, 67);

      doc.setFont("Helvetica", "bold");
      doc.text("Billing details:", 120, 56);
      doc.setFont("Helvetica", "normal");
      doc.text(`Prescription ID: ${selectedPrescription.prescriptionId}`, 120, 62);
      doc.text(`Invoice Date: ${selectedPrescription.date}`, 120, 67);
      doc.text(`Prescribed By: ${selectedPrescription.doctorName}`, 120, 72);

      const pStatus = selectedPrescription.status === "Completed" ? "PAID" : "PENDING";
      let pMethodStr = "Pending Settlement";
      if (selectedPrescription.status === "Completed") {
        if (selectedPrescription.paymentMode === "Cash") {
          pMethodStr = "Cash / COD";
        } else {
          pMethodStr = `Online - ${selectedPrescription.onlineMethod}`;
        }
      }
      doc.text(`Payment Status: ${pStatus}`, 120, 77);
      doc.text(`Payment Method: ${pMethodStr}`, 120, 82);

      // Construct table body from current editingMedications state
      const tableData = editingMedications.map((med, index) => [
        index + 1,
        med.medicineName || "N/A",
        `${med.dosage} (${med.frequency}, ${med.duration})`,
        med.quantity,
        `INR ${Number(med.price).toFixed(2)}`,
        `INR ${Number(med.quantity * med.price).toFixed(2)}`
      ]);

      // Generate items table
      autoTable(doc, {
        startY: 88,
        head: [["S.No", "Medicine Name", "Dosage & Instructions", "Qty", "Unit Price", "Subtotal"]],
        body: tableData,
        theme: "grid",
        headStyles: {
          fillColor: [13, 71, 161], // Deep blue header
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: "bold"
        },
        styles: {
          fontSize: 9,
          cellPadding: 4
        },
        columnStyles: {
          0: { cellWidth: 12 },
          1: { cellWidth: 50 },
          2: { cellWidth: 60 },
          3: { cellWidth: 15, halign: "center" },
          4: { cellWidth: 25, halign: "right" },
          5: { cellWidth: 25, halign: "right" }
        }
      });

      const finalY = doc.lastAutoTable.finalY || 120;

      // Grand Total
      doc.setFontSize(12);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(13, 71, 161);
      doc.text(`GRAND TOTAL: INR ${Number(calculatedTotal).toFixed(2)}`, 130, finalY + 12);

      // Notes
      if (notes) {
        doc.setFontSize(9);
        doc.setFont("Helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text("Pharmacy Special Notes:", 14, finalY + 12);
        doc.setFont("Helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        const splitNotes = doc.splitTextToSize(notes, 110);
        doc.text(splitNotes, 14, finalY + 18);
      }

      // Hospital terms/seal
      doc.setFontSize(9);
      doc.setFont("Helvetica", "italic");
      doc.setTextColor(148, 163, 184);
      doc.text("Thank you for choosing City Hospital. Get well soon!", 105, finalY + 35, { align: "center" });

      // Save PDF output
      doc.save(`invoice_${selectedPrescription.prescriptionId}_${selectedPrescription.patientName.replace(/\s+/g, "_")}.pdf`);
      toast.success("Billing Invoice PDF downloaded successfully!");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF Bill");
    }
  };

  // Dialog open action
  const handleOpenDetails = (prescription) => {
    setSelectedPrescription(prescription);
    setIsDialogOpen(true);
  };

  // Dialog close action
  const handleCloseDetails = () => {
    setIsDialogOpen(false);
    setSelectedPrescription(null);
  };

  // Helper for Status colors
  const getStatusConfig = (status) => {
    switch (status) {
      case "Pending":
        return { bg: "#FFF3E0", text: "#E65100", border: "#FFE0B2", label: "Pending" };
      case "Processing":
        return { bg: "#E3F2FD", text: "#0D47A1", border: "#BBDEFB", label: "Processing" };
      case "Ready":
        return { bg: "#F3E5F5", text: "#4A148C", border: "#E1BEE7", label: "Ready" };
      case "Completed":
        return { bg: "#E8F5E9", text: "#1B5E20", border: "#C8E6C9", label: "Completed" };
      default:
        return { bg: "#F5F5F5", text: "#616161", border: "#E0E0E0", label: "Unknown" };
    }
  };

  // Card details space formatting helper
  const getFormattedCardNumber = () => {
    const raw = cardDetails.number.replace(/\s?/g, "");
    const parts = [];
    for (let i = 0; i < raw.length; i += 4) {
      parts.push(raw.substring(i, i + 4));
    }
    return parts.length > 0 ? parts.join(" ") : "•••• •••• •••• ••••";
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, backgroundColor: "#f8fafc", minHeight: "100%" }}>
      {/* Page Title Header */}
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", justifyItems: "center", gap: 1.5 }}>
        <PharmacyIcon sx={{ color: "#0d47a1", fontSize: "2rem" }} />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#1e293b" }}>
            Patient Prescription Integration
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 500 }}>
            Process doctor-forwarded prescriptions, edit quantities/prices, add manual medications, and generate bills.
          </Typography>
        </Box>
      </Box>

      {/* Summary Cards Row */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[
          { label: "Total Prescriptions", count: stats.total, color: "#475569", bg: "#f1f5f9", icon: <ReceiptLongIcon /> },
          { label: "Pending", count: stats.pending, color: "#e65100", bg: "#fff3e0", icon: <HourglassIcon /> },
          { label: "Processing", count: stats.processing, color: "#0d47a1", bg: "#e3f2fd", icon: <SyncIcon /> },
          { label: "Ready", count: stats.ready, color: "#4a148c", bg: "#f3e5f5", icon: <PharmacyIcon /> },
          { label: "Completed", count: stats.completed, color: "#1b5e20", bg: "#e8f5e9", icon: <CheckCircleIcon /> }
        ].map((card, idx) => (
          <Grid item xs={12} sm={6} md={2.4} key={idx}>
            <Card
              sx={{
                borderRadius: "16px",
                border: `1px solid rgba(0, 0, 0, 0.05)`,
                boxShadow: "0px 2px 4px rgba(0,0,0,0.02)",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-3px)",
                  boxShadow: "0px 8px 16px rgba(0, 0, 0, 0.06)"
                }
              }}
            >
              <CardContent sx={{ display: "flex", alignItems: "center", p: 2, "&:last-child": { pb: 2 } }}>
                <Box
                  sx={{
                    p: 1.2,
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: card.bg,
                    color: card.color,
                    mr: 2
                  }}
                >
                  {card.icon}
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: card.color }}>
                    {card.count}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700 }}>
                    {card.label}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Table Card */}
      <Card sx={{ borderRadius: "16px", border: "1px solid rgba(0,0,0,0.05)", boxShadow: "0px 4px 20px rgba(0,0,0,0.03)" }}>
        {/* Table Filters & Toolbar */}
        <Box sx={{ p: 3, display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2, justifyContent: "space-between", alignItems: { xs: "stretch", md: "center" } }}>
          
          {/* Status Tabs/Chips Row */}
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {["All", "Pending", "Processing", "Ready", "Completed"].map((status) => {
              const isActive = selectedStatusFilter === status;
              const count = status === "All" ? stats.total : stats[status.toLowerCase()];
              return (
                <Chip
                  key={status}
                  label={`${status} (${count})`}
                  onClick={() => setSelectedStatusFilter(status)}
                  sx={{
                    fontWeight: 700,
                    px: 1,
                    fontSize: "0.8rem",
                    backgroundColor: isActive ? "#0d47a1" : "#f1f5f9",
                    color: isActive ? "#ffffff" : "#475569",
                    border: "1px solid rgba(0,0,0,0.05)",
                    "&:hover": {
                      backgroundColor: isActive ? "#0b3c8c" : "#e2e8f0"
                    }
                  }}
                />
              );
            })}
          </Box>

          {/* Search Box */}
          <TextField
            placeholder="Search by patient name or RX ID..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: { xs: "100%", md: 320 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "#94a3b8" }} />
                </InputAdornment>
              ),
              sx: { borderRadius: "10px", backgroundColor: "#fff" }
            }}
          />
        </Box>

        {/* Prescription List Table */}
        <TableContainer component={Paper} sx={{ boxShadow: "none", borderTop: "1px solid rgba(0,0,0,0.05)", width: "100%", overflowX: "auto" }}>
          <Table>
            <TableHead sx={{ backgroundColor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Prescription ID</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Patient Name</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Doctor</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Medicines Count</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Total Price</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#475569" }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPrescriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography variant="body1" sx={{ color: "#94a3b8", fontWeight: 600 }}>
                      No prescriptions found matching the filters.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPrescriptions.map((row) => {
                  const statusConf = getStatusConfig(row.status);
                  return (
                    <TableRow
                      key={row.prescriptionId}
                      sx={{
                        "&:hover": { backgroundColor: "#f8fafc" },
                        transition: "background-color 0.1s ease"
                      }}
                    >
                      <TableCell sx={{ fontWeight: 700, color: "#0d47a1" }}>{row.prescriptionId}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#1e293b" }}>{row.patientName}</TableCell>
                      <TableCell sx={{ color: "#64748b", fontWeight: 600 }}>{row.doctorName}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        <Chip
                          label={`${row.medications?.length || 0} Medicines`}
                          size="small"
                          sx={{ backgroundColor: "#f1f5f9", fontWeight: 600, color: "#475569" }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: "#64748b", fontWeight: 600 }}>{row.date}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        {row.totalPrice ? (
                          <Box>
                            <Typography sx={{ fontWeight: 700, color: "#2e7d32", fontSize: "0.875rem" }}>
                              INR {Number(row.totalPrice).toFixed(2)}
                            </Typography>
                            {row.status === "Completed" && (
                              <Typography variant="caption" sx={{ color: "#64748b", display: "block", fontSize: "0.7rem", fontWeight: 600 }}>
                                via {row.paymentMode === "Cash" ? "Cash" : `Online (${row.onlineMethod})`}
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={statusConf.label}
                          size="small"
                          sx={{
                            backgroundColor: statusConf.bg,
                            color: statusConf.text,
                            border: `1px solid ${statusConf.border}`,
                            fontWeight: 700,
                            fontSize: "0.75rem"
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => handleOpenDetails(row)}
                          sx={{
                            borderRadius: "8px",
                            fontWeight: 700,
                            textTransform: "none",
                            borderColor: "#3b82f6",
                            color: "#3b82f6",
                            "&:hover": {
                              backgroundColor: "rgba(59, 130, 246, 0.04)",
                              borderColor: "#2563eb"
                            }
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Prescription Detail Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: "18px", p: 1 }
        }}
      >
        {selectedPrescription && (
          <>
            {/* Header */}
            <DialogTitle sx={{ m: 0, p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#1e293b" }}>
                  Dispensation Billing Details
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                  ID: {selectedPrescription.prescriptionId} | Date: {selectedPrescription.date}
                </Typography>
              </Box>
              <IconButton onClick={handleCloseDetails} sx={{ color: "#94a3b8" }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 2 }}>
              {/* Patient & Doctor metadata grid */}
              <Grid container spacing={2} sx={{ mb: 3, backgroundColor: "#f8fafc", p: 2, borderRadius: "12px", border: "1px solid #f1f5f9" }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>
                    Patient Info
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#1e293b" }}>
                    {selectedPrescription.patientName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                    ID: {selectedPrescription.patientId}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>
                    Prescribing Doctor
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#1e293b" }}>
                    {selectedPrescription.doctorName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                    ID: {selectedPrescription.doctorId || "DOC-101"}
                  </Typography>
                </Grid>
              </Grid>

              {/* Billing Title and Add Manual Button */}
              <Box sx={{ display: "flex", justifyItems: "center", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#475569", px: 0.5 }}>
                  Billing & Medication Summary
                </Typography>
                {selectedPrescription.status !== "Completed" && (
                  <Button
                    variant="outlined"
                    size="small"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleAddManualMedication}
                    sx={{
                      borderRadius: "8px",
                      fontWeight: 700,
                      textTransform: "none"
                    }}
                  >
                    Add Custom Medication
                  </Button>
                )}
              </Box>

              {/* Editable Billing Table */}
              <TableContainer component={Paper} sx={{ boxShadow: "none", border: "1px solid #e2e8f0", borderRadius: "10px", mb: 3 }}>
                <Table size="small">
                  <TableHead sx={{ backgroundColor: "#f8fafc" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, color: "#64748b" }}>Medicine Name</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#64748b" }}>Instructions / Specs</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#64748b" }} align="center">Quantity</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#64748b" }} align="center">Unit Price (INR)</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#64748b" }} align="right">Subtotal</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#64748b" }} align="center">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {editingMedications.map((med, idx) => (
                      <TableRow key={idx}>
                        {/* Medicine Name */}
                        <TableCell>
                          {med.isManual && selectedPrescription.status !== "Completed" ? (
                            <TextField
                              size="small"
                              placeholder="e.g. Aspirin"
                              value={med.medicineName}
                              onChange={(e) => handleFieldChange(idx, "medicineName", e.target.value)}
                              sx={{ input: { fontWeight: 700, py: 0.5 }, width: 140 }}
                            />
                          ) : (
                            <Typography sx={{ fontWeight: 700, color: "#1e293b" }}>{med.medicineName}</Typography>
                          )}
                        </TableCell>

                        {/* Instructions */}
                        <TableCell>
                          {med.isManual && selectedPrescription.status !== "Completed" ? (
                            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                              <TextField
                                size="small"
                                placeholder="Dosage"
                                value={med.dosage}
                                onChange={(e) => handleFieldChange(idx, "dosage", e.target.value)}
                                sx={{ input: { fontSize: "0.8rem", py: 0.5 }, width: 70 }}
                              />
                              <TextField
                                size="small"
                                placeholder="Freq"
                                value={med.frequency}
                                onChange={(e) => handleFieldChange(idx, "frequency", e.target.value)}
                                sx={{ input: { fontSize: "0.8rem", py: 0.5 }, width: 90 }}
                              />
                              <TextField
                                size="small"
                                placeholder="Dur"
                                value={med.duration}
                                onChange={(e) => handleFieldChange(idx, "duration", e.target.value)}
                                sx={{ input: { fontSize: "0.8rem", py: 0.5 }, width: 70 }}
                              />
                            </Box>
                          ) : (
                            <Typography sx={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>
                              {med.dosage} | {med.frequency} | {med.duration}
                            </Typography>
                          )}
                        </TableCell>

                        {/* Quantity */}
                        <TableCell align="center">
                          {selectedPrescription.status !== "Completed" ? (
                            <TextField
                              type="number"
                              size="small"
                              value={med.quantity}
                              onChange={(e) => handleFieldChange(idx, "quantity", Math.max(0, parseInt(e.target.value, 10) || 0))}
                              inputProps={{ min: 0 }}
                              sx={{ input: { py: 0.5, textAlign: "center" }, width: 70 }}
                            />
                          ) : (
                            <Typography sx={{ fontWeight: 600 }}>{med.quantity}</Typography>
                          )}
                        </TableCell>

                        {/* Price */}
                        <TableCell align="center">
                          {selectedPrescription.status !== "Completed" ? (
                            <TextField
                              type="number"
                              size="small"
                              value={med.price}
                              onChange={(e) => handleFieldChange(idx, "price", Math.max(0, parseFloat(e.target.value) || 0))}
                              inputProps={{ min: 0, step: 0.5 }}
                              sx={{ input: { py: 0.5, textAlign: "center" }, width: 85 }}
                            />
                          ) : (
                            <Typography sx={{ fontWeight: 600 }}>{med.price.toFixed(2)}</Typography>
                          )}
                        </TableCell>

                        {/* Subtotal */}
                        <TableCell align="right" sx={{ fontWeight: 700, color: "#1e293b" }}>
                          INR {Number(med.quantity * med.price).toFixed(2)}
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="center">
                          {med.isManual && selectedPrescription.status !== "Completed" ? (
                            <IconButton onClick={() => handleDeleteRow(idx)} color="error" size="small">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          ) : (
                            <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 600 }}>
                              {med.isManual ? "Custom" : "Doctor Rx"}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Total Calculation Display */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, p: 2, backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <Typography sx={{ fontWeight: 800, color: "#475569" }}>Total Items Amount Due:</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#2e7d32" }}>
                  INR {Number(calculatedTotal).toFixed(2)}
                </Typography>
              </Box>

              {/* Pharmacy Custom Notes */}
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 800, textTransform: "uppercase", display: "block", mb: 0.5 }}>
                Internal Pharmacy / Billing Instructions
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={2}
                disabled={selectedPrescription.status === "Completed"}
                placeholder="Enter internal pharmacy notes, e.g. Payment details, substitutes provided, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                sx={{
                  backgroundColor: "#fffbeb",
                  borderRadius: "10px",
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "#fde68a" },
                    "&:hover fieldset": { borderColor: "#fcd34d" }
                  },
                  mb: 3
                }}
              />

              {/* HIGH FIDELITY CHECKOUT PANEL */}
              {selectedPrescription.status === "Ready" && (
                <Box sx={{ mt: 3, mb: 3, p: 3, border: "2px solid #cbd5e1", borderRadius: "16px", backgroundColor: "#f8fafc", boxShadow: "inset 0px 2px 4px rgba(0,0,0,0.02)" }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#1e293b", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                    <PharmacyIcon sx={{ color: "#0284c7" }} /> Payment Settlement Gateway
                  </Typography>
                  
                  {/* Settlement Mode Selection Buttons */}
                  <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                    <Button
                      variant={paymentMode === "Cash" ? "contained" : "outlined"}
                      onClick={() => setPaymentMode("Cash")}
                      sx={{
                        flex: 1,
                        py: 1.5,
                        fontWeight: 800,
                        textTransform: "none",
                        borderRadius: "10px",
                        backgroundColor: paymentMode === "Cash" ? "#0f172a" : "transparent",
                        color: paymentMode === "Cash" ? "#ffffff" : "#475569",
                        borderColor: "#cbd5e1",
                        boxShadow: paymentMode === "Cash" ? "0 4px 12px rgba(15,23,42,0.15)" : "none",
                        "&:hover": {
                          backgroundColor: paymentMode === "Cash" ? "#1e293b" : "rgba(0,0,0,0.02)",
                          borderColor: "#cbd5e1"
                        }
                      }}
                    >
                      💵 Cash / Counter Settlement
                    </Button>
                    <Button
                      variant={paymentMode === "Online" ? "contained" : "outlined"}
                      onClick={() => setPaymentMode("Online")}
                      sx={{
                        flex: 1,
                        py: 1.5,
                        fontWeight: 800,
                        textTransform: "none",
                        borderRadius: "10px",
                        backgroundColor: paymentMode === "Online" ? "#0284c7" : "transparent",
                        color: paymentMode === "Online" ? "#ffffff" : "#475569",
                        borderColor: "#cbd5e1",
                        boxShadow: paymentMode === "Online" ? "0 4px 12px rgba(2,132,199,0.15)" : "none",
                        "&:hover": {
                          backgroundColor: paymentMode === "Online" ? "#0369a1" : "rgba(0,0,0,0.02)",
                          borderColor: "#cbd5e1"
                        }
                      }}
                    >
                      💳 Secure Online Billing
                    </Button>
                  </Box>

                  {/* Cash Settlement layout */}
                  {paymentMode === "Cash" && (
                    <Box sx={{ p: 2, backgroundColor: "#f1f5f9", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                      <Typography variant="body2" sx={{ color: "#334155", fontWeight: 700, mb: 1 }}>
                        Cash Settlement Instructions:
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#475569", fontWeight: 500, lineHeight: 1.5 }}>
                        1. Collect <strong>INR {Number(calculatedTotal).toFixed(2)}</strong> from patient counter.
                        <br />
                        2. Verify physical bills and counting.
                        <br />
                        3. Click <strong>&quot;Dispense Medicines&quot;</strong> to generate dispensation receipt records.
                      </Typography>
                    </Box>
                  )}

                  {/* Online payment layout with interactive visualizers */}
                  {paymentMode === "Online" && (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      
                      {/* Interactive method selector chips */}
                      <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center" }}>
                        {[
                          { key: "UPI", label: "UPI Transfer", icon: <PharmacyIcon fontSize="small" /> },
                          { key: "QR", label: "Dynamic QR Code", icon: <QrCodeIcon fontSize="small" /> },
                          { key: "Card", label: "Debit/Credit Card", icon: <CreditCardIcon fontSize="small" /> }
                        ].map((method) => {
                          const active = onlineMethod === method.key;
                          return (
                            <Chip
                              key={method.key}
                              label={method.label}
                              icon={method.icon}
                              onClick={() => setOnlineMethod(method.key)}
                              sx={{
                                py: 2.2,
                                px: 1,
                                fontWeight: 800,
                                fontSize: "0.85rem",
                                borderRadius: "10px",
                                cursor: "pointer",
                                border: active ? "1px solid #0284c7" : "1px solid #cbd5e1",
                                backgroundColor: active ? "#e0f2fe" : "#ffffff",
                                color: active ? "#0369a1" : "#475569",
                                "& .MuiChip-icon": { color: active ? "#0284c7" : "#64748b" },
                                "&:hover": { backgroundColor: active ? "#bae6fd" : "#f1f5f9" }
                              }}
                            />
                          );
                        })}
                      </Box>

                      {/* UPI Billing Section */}
                      {onlineMethod === "UPI" && (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                            UPI ID Configuration
                          </Typography>
                          <TextField
                            fullWidth
                            size="small"
                            label="Virtual Payment Address (VPA)"
                            placeholder="e.g. name@okhdfcbank"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            InputProps={{
                              sx: { borderRadius: "10px", backgroundColor: "#ffffff" }
                            }}
                          />
                          {/* Quick shortcuts handles */}
                          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 0.5 }}>
                            {["@okaxis", "@okicici", "@paytm", "@ybl"].map((ext) => (
                              <Chip
                                key={ext}
                                label={ext}
                                size="small"
                                onClick={() => handleUpiShortcut(ext)}
                                sx={{
                                  fontWeight: 700,
                                  fontSize: "0.75rem",
                                  backgroundColor: "#f1f5f9",
                                  color: "#334155",
                                  cursor: "pointer",
                                  "&:hover": { backgroundColor: "#cbd5e1" }
                                }}
                              />
                            ))}
                          </Box>
                        </Box>
                      )}

                      {/* Interactive Credit Card Form & Mock Card Image */}
                      {onlineMethod === "Card" && (
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2.5 }}>
                          
                          {/* Real-time Virtual credit card preview */}
                          <Box
                            sx={{
                              width: "100%",
                              maxWidth: 320,
                              height: 180,
                              borderRadius: "16px",
                              background: "linear-gradient(135deg, #0d47a1 0%, #1976d2 50%, #8e24aa 100%)",
                              color: "#ffffff",
                              p: 2.5,
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between",
                              boxShadow: "0px 8px 24px rgba(13, 71, 161, 0.3)",
                              position: "relative",
                              overflow: "hidden"
                            }}
                          >
                            {/* Card Chip & Network Logo */}
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              {/* Chip */}
                              <Box sx={{ width: 40, height: 30, borderRadius: "6px", backgroundColor: "#fcd34d", border: "1px solid #d97706", position: "relative" }}>
                                <Box sx={{ width: "100%", height: "0.5px", backgroundColor: "#d97706", position: "absolute", top: "50%" }} />
                                <Box sx={{ width: "0.5px", height: "100%", backgroundColor: "#d97706", position: "absolute", left: "50%" }} />
                              </Box>
                              {/* Logo */}
                              <Typography variant="h6" sx={{ fontStyle: "italic", fontWeight: 900, letterSpacing: 1.5 }}>
                                VISA
                              </Typography>
                            </Box>

                            {/* Card Number */}
                            <Typography variant="h6" sx={{ letterSpacing: 3, fontWeight: 700, textAlign: "center", my: 1.5, textShadow: "1px 1px 2px rgba(0,0,0,0.3)" }}>
                              {getFormattedCardNumber()}
                            </Typography>

                            {/* Holder Name and Expiry */}
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                              <Box sx={{ maxWidth: "70%" }}>
                                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.6rem", display: "block", textTransform: "uppercase" }}>
                                  Cardholder Name
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {cardDetails.name.toUpperCase() || "CARDHOLDER NAME"}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.6rem", display: "block", textTransform: "uppercase" }}>
                                  Expires
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                  {cardDetails.expiry || "MM/YY"}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>

                          {/* Inputs Panel */}
                          <Grid container spacing={1.5}>
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Card Number"
                                placeholder="4111 2222 3333 4444"
                                value={cardDetails.number}
                                onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value.replace(/\D/g, "").slice(0, 16) })}
                                InputProps={{
                                  sx: { borderRadius: "10px", backgroundColor: "#ffffff" }
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Cardholder Name"
                                placeholder="Enter Full Name"
                                value={cardDetails.name}
                                onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                                InputProps={{
                                  sx: { borderRadius: "10px", backgroundColor: "#ffffff" }
                                }}
                              />
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Expiry (MM/YY)"
                                placeholder="12/28"
                                value={cardDetails.expiry}
                                onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value.slice(0, 5) })}
                                InputProps={{
                                  sx: { borderRadius: "10px", backgroundColor: "#ffffff" }
                                }}
                              />
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <TextField
                                fullWidth
                                type="password"
                                size="small"
                                label="CVV"
                                placeholder="***"
                                value={cardDetails.cvv}
                                onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value.replace(/\D/g, "").slice(0, 3) })}
                                InputProps={{
                                  sx: { borderRadius: "10px", backgroundColor: "#ffffff" }
                                }}
                              />
                            </Grid>
                          </Grid>
                        </Box>
                      )}

                      {/* Interactive QR scanning simulation */}
                      {onlineMethod === "QR" && (
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", p: 2.5, backgroundColor: "#ffffff", borderRadius: "14px", border: "1px dashed #cbd5e1" }}>
                          
                          {qrState === "idle" && (
                            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
                              <Typography variant="body2" sx={{ fontWeight: 800, color: "#475569" }}>
                                Generate Scanner QR Code
                              </Typography>
                              <Button
                                variant="contained"
                                color="primary"
                                startIcon={<QrCodeIcon />}
                                onClick={handleSimulateQrScan}
                                sx={{ textTransform: "none", borderRadius: "8px", fontWeight: 700 }}
                              >
                                Display Scan QR Code
                              </Button>
                            </Box>
                          )}

                          {qrState === "scanning" && (
                            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 2, gap: 1.5 }}>
                              <CircularProgress size={30} color="primary" />
                              <Typography variant="body2" sx={{ color: "#0284c7", fontWeight: 700, animate: "pulse 1.5s infinite" }}>
                                Waiting for customer to scan and pay...
                              </Typography>
                            </Box>
                          )}

                          {qrState === "success" && (
                            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                              {/* QR SVG */}
                              <Box
                                component="svg"
                                viewBox="0 0 100 100"
                                sx={{ width: 110, height: 110, p: 0.5, border: "1px solid #cbd5e1", borderRadius: "8px", opacity: 0.4 }}
                              >
                                <rect x="5" y="5" width="20" height="20" fill="none" stroke="#000" strokeWidth="6" />
                                <rect x="75" y="5" width="20" height="20" fill="none" stroke="#000" strokeWidth="6" />
                                <rect x="5" y="75" width="20" height="20" fill="none" stroke="#000" strokeWidth="6" />
                                <rect x="11" y="11" width="8" height="8" fill="#000" />
                                <rect x="81" y="11" width="8" height="8" fill="#000" />
                                <rect x="11" y="81" width="8" height="8" fill="#000" />
                                <path d="M 35 10 h 5 v 5 h -5 z M 45 10 h 10 v 5 h -10 z M 60 10 h 5 v 10 h -5 z M 30 20 h 15 v 5 h -15 z M 50 25 h 5 v 5 h -5 z M 65 25 h 10 v 5 h -10 z M 35 35 h 10 v 5 h -10 z M 55 35 h 5 v 10 h -5 z M 70 35 h 5 v 5 h -5 z M 40 45 h 10 v 5 h -10 z M 65 45 h 10 v 5 h -10 z M 30 55 h 5 v 5 h -5 z M 45 55 h 5 v 10 h -5 z M 60 55 h 15 v 5 h -15 z M 35 65 h 5 v 5 h -5 z M 50 65 h 5 v 5 h -5 z M 65 65 h 5 v 5 h -5 z M 30 75 h 10 v 5 h -10 z M 55 75 h 10 v 5 h -10 z M 45 85 h 15 v 5 h -15 z M 70 85 h 5 v 5 h -5 z" fill="#000" />
                                <circle cx="50" cy="50" r="8" fill="#0d47a1" />
                                <path d="M 48 48 h 4 v 4 h -4 z" fill="#fff" />
                              </Box>
                              <SuccessIcon color="success" sx={{ fontSize: "2rem" }} />
                              <Typography variant="body2" sx={{ color: "#2e7d32", fontWeight: 800 }}>
                                Payment Received Successfully!
                              </Typography>
                              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                                Ref No: {upiId}
                              </Typography>
                            </Box>
                          )}
                          
                        </Box>
                      )}

                    </Box>
                  )}

                </Box>
              )}

              {/* READ-ONLY COMPLETED PAYMENT DETAILS DISPLAY */}
              {selectedPrescription.status === "Completed" && (
                <Box sx={{ mt: 3, mb: 3, p: 2.5, border: "2px solid #a7f3d0", borderRadius: "16px", backgroundColor: "#ecfdf5", boxShadow: "0px 4px 12px rgba(16,185,129,0.06)" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#065f46", mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                    <SuccessIcon sx={{ color: "#10b981" }} /> Disp dispensation payment receipt
                  </Typography>
                  <Divider sx={{ my: 1, backgroundColor: "rgba(16,185,129,0.15)" }} />
                  <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" sx={{ color: "#047857", fontWeight: 700, textTransform: "uppercase", display: "block" }}>
                        Payment Settlement Mode
                      </Typography>
                      <Typography variant="body1" sx={{ color: "#065f46", fontWeight: 800 }}>
                        {selectedPrescription.paymentMode === "Cash" ? "💵 Cash Counter Settlement" : `💳 Secure Online Payment (${selectedPrescription.onlineMethod})`}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" sx={{ color: "#047857", fontWeight: 700, textTransform: "uppercase", display: "block" }}>
                        Payment Reference Detail
                      </Typography>
                      <Typography variant="body1" sx={{ color: "#065f46", fontWeight: 800 }}>
                        {selectedPrescription.paymentMode === "Cash" ? (
                          "Counter Paid"
                        ) : (
                          selectedPrescription.upiId || selectedPrescription.cardDetails?.number || "Approved"
                        )}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Status Tracker */}
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 700 }}>
                  Billing State Status:
                </Typography>
                <Chip
                  label={selectedPrescription.status}
                  size="small"
                  sx={{
                    backgroundColor: getStatusConfig(selectedPrescription.status).bg,
                    color: getStatusConfig(selectedPrescription.status).text,
                    border: `1px solid ${getStatusConfig(selectedPrescription.status).border}`,
                    fontWeight: 800,
                    textTransform: "uppercase"
                  }}
                />
              </Box>
            </DialogContent>

            {/* Actions Footer */}
            <DialogActions sx={{ p: 2, display: "flex", justifyContent: "space-between", borderTop: "1px solid #f1f5f9" }}>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  onClick={handleCloseDetails}
                  disabled={paymentProcessing}
                  sx={{ color: "#64748b", fontWeight: 700, textTransform: "none" }}
                >
                  Close
                </Button>
                {selectedPrescription.status !== "Completed" && (
                  <Button
                    variant="outlined"
                    color="primary"
                    disabled={paymentProcessing}
                    startIcon={<SaveIcon />}
                    onClick={handleSaveChanges}
                    sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 700 }}
                  >
                    Save Changes
                  </Button>
                )}
              </Box>

              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                {/* Print PDF Button */}
                <Button
                  variant="outlined"
                  color="secondary"
                  disabled={paymentProcessing}
                  startIcon={<PdfIcon />}
                  onClick={handleDownloadPDF}
                  sx={{
                    borderRadius: "8px",
                    fontWeight: 700,
                    textTransform: "none",
                    borderColor: "#7c3aed",
                    color: "#7c3aed",
                    "&:hover": { borderColor: "#6d28d9", backgroundColor: "rgba(124, 58, 237, 0.04)" }
                  }}
                >
                  Download PDF Bill
                </Button>

                {/* Status Transitions */}
                {selectedPrescription.status === "Pending" && (
                  <Button
                    variant="contained"
                    startIcon={<PlayArrowIcon />}
                    onClick={() => handleUpdateStatusAndSave(selectedPrescription.prescriptionId, "Processing")}
                    sx={{
                      textTransform: "none",
                      fontWeight: 800,
                      borderRadius: "10px",
                      backgroundColor: "#3b82f6",
                      "&:hover": { backgroundColor: "#1d4ed8" }
                    }}
                  >
                    Mark as Processing
                  </Button>
                )}

                {selectedPrescription.status === "Processing" && (
                  <Button
                    variant="contained"
                    startIcon={<LocalShippingIcon />}
                    onClick={() => handleUpdateStatusAndSave(selectedPrescription.prescriptionId, "Ready")}
                    sx={{
                      textTransform: "none",
                      fontWeight: 800,
                      borderRadius: "10px",
                      backgroundColor: "#9c27b0",
                      color: "#ffffff",
                      "&:hover": { backgroundColor: "#7b1fa2" }
                    }}
                  >
                    Mark as Ready
                  </Button>
                )}

                {selectedPrescription.status === "Ready" && (
                  <Button
                    variant="contained"
                    startIcon={<CheckIcon />}
                    onClick={() => handleDispenseCheckout(selectedPrescription.prescriptionId)}
                    sx={{
                      textTransform: "none",
                      fontWeight: 800,
                      borderRadius: "10px",
                      backgroundColor: "#10b981",
                      "&:hover": { backgroundColor: "#047857" }
                    }}
                  >
                    Dispense Medicines
                  </Button>
                )}

                {selectedPrescription.status === "Completed" && (
                  <Typography variant="body2" sx={{ color: "#10b981", fontWeight: 800, display: "flex", alignItems: "center", gap: 0.5, px: 1 }}>
                    <CheckIcon fontSize="small" /> Medicines Dispensed
                  </Typography>
                )}
              </Box>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* FULL-SCREEN PAYMENT PROCESSING OVERLAY DIALOG */}
      <Dialog
        open={paymentProcessing}
        PaperProps={{
          sx: {
            borderRadius: "16px",
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            maxWidth: 360,
            textAlign: "center"
          }
        }}
      >
        <CircularProgress size={50} color="primary" sx={{ mb: 3 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#1e293b", mb: 1 }}>
          Settling Billing Transaction
        </Typography>
        <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>
          {processingPhase}
        </Typography>
        <Box sx={{ width: "100%", height: 3, backgroundColor: "#e2e8f0", borderRadius: 2, overflow: "hidden", mt: 3, position: "relative" }}>
          <Box
            sx={{
              position: "absolute",
              height: "100%",
              width: "40%",
              backgroundColor: "#0284c7",
              borderRadius: 2,
              animation: "moving-loader 1s linear infinite",
              "@keyframes moving-loader": {
                "0%": { left: "-40%" },
                "100%": { left: "100%" }
              }
            }}
          />
        </Box>
      </Dialog>
    </Box>
  );
}
