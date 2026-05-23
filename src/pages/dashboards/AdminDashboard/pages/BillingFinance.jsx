// 
import React, { useState, useEffect } from 'react'
import LoadingSpinner from '../../../../components/common/LoadingSpinner/LoadingSpinner'
import DataTable from '../../../../components/ui/Tables/DataTable'
import Modal from '../../../../components/common/Modal/Modal'

const BillingFinance = () => {
  const [loading, setLoading] = useState(true)
  const [bills, setBills] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [periodFilter, setPeriodFilter] = useState('7days')
  const [modalState, setModalState] = useState({ view: false, generate: false, payment: false, edit: false })
  const [currentBill, setCurrentBill] = useState(null)
  const [editBill, setEditBill] = useState(null)
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, month: '', value: 0 })
  const [newBill, setNewBill] = useState({
    patient: '',
    doctorName: '',
    admissionDate: '',
    dischargeDate: '',
    services: [],
    amount: '',
    discount: '',
    paymentMethod: 'Cash',
    notes: '',
    treatments: [],
    tests: []
  })

  // Data constants
  const PATIENTS = ['Ravi Kumar', 'Anita Sharma', 'Suresh Patel', 'Priya Singh', 'Rajesh Kumar', 'Meena Gupta']
  const SERVICES = ['Consultation', 'X-Ray', 'Blood Test', 'MRI Scan', 'CT Scan', 'Medication', 'Surgery', 'Lab Test']
  const PAYMENT_METHODS = ['Cash', 'Card', 'UPI', 'Insurance', 'Bank Transfer']

  useEffect(() => { loadBills() }, [])

  const loadBills = async () => {
    setLoading(true)
    setTimeout(() => {
      // Added bills with different dates to show real growth calculation
      setBills([
        // Current month bills (November 2023)
        { id: 'INV-4001', patient: 'Ravi Kumar', doctorName: 'Dr. Rajesh Singh', services: ['Consultation', 'X-Ray'], amount: 1200, discount: 0, paymentMethod: 'Cash', status: 'Paid', date: '2023-11-15', admissionDate: '2023-11-10', dischargeDate: '2023-11-15', treatments: ['General Check-up', 'X-Ray Imaging'], tests: ['Chest X-Ray', 'BMI Check'], notes: 'Routine checkup' },
        { id: 'INV-4002', patient: 'Anita Sharma', doctorName: 'Dr. Priya Patel', services: ['Blood Test'], amount: 300, discount: 50, paymentMethod: 'Card', status: 'Paid', date: '2023-11-16', admissionDate: '2023-11-16', dischargeDate: '2023-11-16', treatments: ['Blood Examination'], tests: ['CBC', 'Diabetes Test'], notes: 'Diabetes screening' },
        { id: 'INV-4003', patient: 'Suresh Patel', doctorName: 'Dr. Vikram Kumar', services: ['MRI Scan'], amount: 2500, discount: 0, paymentMethod: 'Insurance', status: 'Pending', date: '2023-11-17', admissionDate: '2023-11-12', dischargeDate: '2023-11-17', treatments: ['MRI Scan', 'Neurology Consultation'], tests: ['Brain MRI', 'Neurological Assessment'], notes: 'Neurology referral' },
        { id: 'INV-4004', patient: 'Priya Singh', doctorName: 'Dr. Neha Gupta', services: ['Consultation', 'Medication'], amount: 650, discount: 0, paymentMethod: 'UPI', status: 'Paid', date: '2023-11-18', admissionDate: '2023-11-18', dischargeDate: '2023-11-18', treatments: ['Consultation', 'Medication Provision'], tests: ['Blood Pressure', 'Headache Assessment'], notes: 'Migraine treatment' },
        { id: 'INV-4005', patient: 'Rajesh Kumar', doctorName: 'Dr. Amit Verma', services: ['CT Scan'], amount: 1800, discount: 100, paymentMethod: 'Card', status: 'Overdue', date: '2023-11-14', admissionDate: '2023-11-08', dischargeDate: '2023-11-14', treatments: ['CT Scan', 'Injury Assessment'], tests: ['CT Abdomen', 'Trauma Evaluation'], notes: 'Accident follow-up' },
        { id: 'INV-4006', patient: 'Meena Gupta', doctorName: 'Dr. Sanjay Nair', services: ['Surgery', 'Medication'], amount: 5000, discount: 200, paymentMethod: 'Insurance', status: 'Pending', date: '2023-11-20', admissionDate: '2023-11-18', dischargeDate: '2023-11-20', treatments: ['Knee Surgery', 'Post-Op Care'], tests: ['X-Ray Pre-Op', 'Blood Test', 'ECG'], notes: 'Knee surgery' },
        
        // Last month bills (October 2023) - for comparison
        { id: 'INV-3001', patient: 'Ravi Kumar', doctorName: 'Dr. Rajesh Singh', services: ['Consultation'], amount: 800, discount: 0, paymentMethod: 'Cash', status: 'Paid', date: '2023-10-10', admissionDate: '2023-10-10', dischargeDate: '2023-10-10', treatments: ['Follow-up Consultation'], tests: ['Vitals Check'], notes: 'Follow-up' },
        { id: 'INV-3002', patient: 'Anita Sharma', doctorName: 'Dr. Priya Patel', services: ['Blood Test'], amount: 300, discount: 0, paymentMethod: 'Card', status: 'Paid', date: '2023-10-12', admissionDate: '2023-10-12', dischargeDate: '2023-10-12', treatments: ['Blood Examination'], tests: ['CBC', 'General Blood Work'], notes: 'Regular checkup' },
        { id: 'INV-3003', patient: 'Suresh Patel', doctorName: 'Dr. Vikram Kumar', services: ['X-Ray'], amount: 400, discount: 0, paymentMethod: 'Cash', status: 'Paid', date: '2023-10-15', admissionDate: '2023-10-15', dischargeDate: '2023-10-15', treatments: ['Chest Imaging'], tests: ['Chest X-Ray'], notes: 'Chest X-Ray' },
        { id: 'INV-3004', patient: 'Priya Singh', doctorName: 'Dr. Neha Gupta', services: ['Consultation'], amount: 500, discount: 0, paymentMethod: 'UPI', status: 'Paid', date: '2023-10-18', admissionDate: '2023-10-18', dischargeDate: '2023-10-18', treatments: ['Consultation'], tests: ['Vitals Check'], notes: 'Headache' },
        { id: 'INV-3005', patient: 'Rajesh Kumar', doctorName: 'Dr. Amit Verma', services: ['Lab Test'], amount: 600, discount: 50, paymentMethod: 'Card', status: 'Pending', date: '2023-10-20', admissionDate: '2023-10-20', dischargeDate: '2023-10-20', treatments: ['Blood Work'], tests: ['Complete Blood Test'], notes: 'Blood test' },
        
        // Previous month bills (September 2023)
        { id: 'INV-2001', patient: 'Ravi Kumar', doctorName: 'Dr. Rajesh Singh', services: ['Consultation'], amount: 500, discount: 0, paymentMethod: 'Cash', status: 'Paid', date: '2023-09-05', admissionDate: '2023-09-05', dischargeDate: '2023-09-05', treatments: ['General Consultation'], tests: ['Vitals Check'], notes: 'Checkup' },
        { id: 'INV-2002', patient: 'Suresh Patel', doctorName: 'Dr. Vikram Kumar', services: ['Medication'], amount: 200, discount: 0, paymentMethod: 'Cash', status: 'Paid', date: '2023-09-10', admissionDate: '2023-09-10', dischargeDate: '2023-09-10', treatments: ['Medication Provision'], tests: [], notes: 'Medicine' }
      ])
      setLoading(false)
    }, 1000)
  }

  // Helper function to get date range
  const getDateRange = (monthsAgo = 0) => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1)
    const end = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0)
    return { start, end }
  }

  // Calculate stats for a specific month
  const calculateStatsForMonth = (monthsAgo = 0) => {
    const { start, end } = getDateRange(monthsAgo)
    const filteredBills = bills.filter(bill => {
      const billDate = new Date(bill.date)
      return billDate >= start && billDate <= end
    })
    
    const totalBills = filteredBills.length
    const totalRevenue = filteredBills
      .filter(b => b.status === 'Paid')
      .reduce((sum, bill) => sum + (bill.amount - bill.discount), 0)
    const pendingAmount = filteredBills
      .filter(b => b.status === 'Pending')
      .reduce((sum, bill) => sum + (bill.amount - bill.discount), 0)
    const overdueAmount = filteredBills
      .filter(b => b.status === 'Overdue')
      .reduce((sum, bill) => sum + (bill.amount - bill.discount), 0)
    
    return { totalBills, totalRevenue, pendingAmount, overdueAmount }
  }

  // Calculate percentage change between current and previous month
  const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return '+0%'
    const change = ((current - previous) / previous) * 100
    const sign = change > 0 ? '+' : ''
    return `${sign}${change.toFixed(1)}%`
  }

  // Get current month stats
  const currentMonthStats = calculateStatsForMonth(0)
  // Get last month stats
  const lastMonthStats = calculateStatsForMonth(1)

  // Calculate percentage changes with real data
  const stats = [
    {
      label: 'Total Bills',
      value: currentMonthStats.totalBills,
      icon: 'fa-receipt',
      change: calculatePercentageChange(currentMonthStats.totalBills, lastMonthStats.totalBills),
      iconColor: '#3B82F6',
      textColor: '#1F2937',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Total Revenue',
      value: `₹${currentMonthStats.totalRevenue.toLocaleString()}`,
      icon: 'fa-wallet',
      change: calculatePercentageChange(currentMonthStats.totalRevenue, lastMonthStats.totalRevenue),
      iconColor: '#10B981',
      textColor: '#1F2937',
      bgColor: 'bg-green-50'
    },
    {
      label: 'Pending Amount',
      value: `₹${currentMonthStats.pendingAmount.toLocaleString()}`,
      icon: 'fa-hourglass-half',
      change: calculatePercentageChange(currentMonthStats.pendingAmount, lastMonthStats.pendingAmount),
      iconColor: '#F59E0B',
      textColor: '#1F2937',
      bgColor: 'bg-yellow-50'
    },
    {
      label: 'Overdue Amount',
      value: `₹${currentMonthStats.overdueAmount.toLocaleString()}`,
      icon: 'fa-exclamation-triangle',
      change: calculatePercentageChange(currentMonthStats.overdueAmount, lastMonthStats.overdueAmount),
      iconColor: '#EF4444',
      textColor: '#1F2937',
      bgColor: 'bg-red-50'
    }
  ]

  // Modal handlers
  const openModal = (type, bill = null) => {
    setModalState(prev => ({ ...prev, [type]: true }))
    if (type === 'view' && bill) {
      setCurrentBill(bill)
    } else if (type === 'payment' && bill) {
      setCurrentBill(bill)
    } else if (type === 'generate') {
      resetForm()
    } else if (type === 'edit' && bill) {
      setEditBill({ ...bill })
    }
  }

  const closeModal = (type) => {
    setModalState(prev => ({ ...prev, [type]: false }))
    setCurrentBill(null)
    if (type === 'edit') {
      setEditBill(null)
    }
  }

  // Core functions
  const handleGenerateBill = () => {
    if (!validateForm()) return
    const bill = {
      id: `INV-${Math.floor(4000 + Math.random() * 9000)}`,
      patient: newBill.patient,
      doctorName: newBill.doctorName,
      admissionDate: newBill.admissionDate,
      dischargeDate: newBill.dischargeDate,
      services: newBill.services,
      amount: parseInt(newBill.amount, 10),
      discount: parseInt(newBill.discount || 0, 10),
      paymentMethod: newBill.paymentMethod,
      notes: newBill.notes,
      treatments: newBill.treatments || [],
      tests: newBill.tests || [],
      status: 'Pending',
      date: new Date().toISOString().split('T')[0]
    }
    setBills(prev => [bill, ...prev])
    closeModal('generate')
  }

  const handleMarkAsPaid = (billId) => {
    setBills(prev => prev.map(bill => 
      bill.id === billId ? { ...bill, status: 'Paid' } : bill
    ))
  }

  const handleProcessPayment = () => {
    if (currentBill) {
      handleMarkAsPaid(currentBill.id)
      closeModal('payment')
    }
  }

  const handleEditInputChange = (field, value) => {
    setEditBill(prev => ({ ...prev, [field]: value }))
  }

  const handleEditServiceToggle = (service) => {
    setEditBill(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }))
  }

  const handleUpdateBill = () => {
    if (!editBill || !editBill.patient || editBill.services.length === 0 || !editBill.amount) {
      alert('Please fill all required fields before updating the bill.')
      return
    }

    setBills(prev => prev.map(bill => bill.id === editBill.id ? { ...editBill } : bill))
    closeModal('edit')
  }

  const handleServiceToggle = (service) => {
    setNewBill(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }))
  }

  const resetForm = () => {
    setNewBill({
      patient: '',
      doctorName: '',
      admissionDate: '',
      dischargeDate: '',
      services: [],
      amount: '',
      discount: '',
      paymentMethod: 'Cash',
      notes: '',
      treatments: [],
      tests: []
    })
  }

  const handleInputChange = (field, value) => {
    setNewBill(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    if (!newBill.patient) {
      return false
    }
    if (newBill.services.length === 0) {
      return false
    }
    if (!newBill.amount || newBill.amount <= 0) {
      return false
    }
    return true
  }

  // Filter bills
  const filteredBills = bills.filter(bill => {
    const matchesSearch = !searchTerm || 
      [bill.patient, bill.id].some(field => 
        field.toLowerCase().includes(searchTerm.toLowerCase())
      )
    const matchesStatus = !statusFilter || bill.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Get exactly 3 recent bills (sorted by date descending)
  const recentBills = [...filteredBills]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3)

  const handleExportPDF = () => {
    const printWindow = window.open('', '', 'height=900,width=1200')
    const htmlContent = `
      <html>
        <head>
          <title>Billing Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #3B82F6; color: white; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .summary { margin-bottom: 20px; }
            .summary-item { display: inline-block; margin-right: 30px; }
            .summary-label { font-weight: bold; color: #666; }
            .summary-value { font-size: 18px; color: #333; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Billing Finance Report</h1>
          <div class="summary">
            <div class="summary-item">
              <div class="summary-label">Total Revenue</div>
              <div class="summary-value">₹${currentMonthStats.totalRevenue.toLocaleString()}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Total Bills</div>
              <div class="summary-value">${currentMonthStats.totalBills}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Pending Payments</div>
              <div class="summary-value">₹${currentMonthStats.pendingAmount.toLocaleString()}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Patient</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Payment Method</th>
              </tr>
            </thead>
            <tbody>
              ${bills.map(bill => `
                <tr>
                  <td>${bill.id}</td>
                  <td>${bill.patient}</td>
                  <td>₹${bill.amount}</td>
                  <td>${bill.status}</td>
                  <td>${bill.paymentMethod}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `
    
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  const chartData = {
    '7days': [
      { month: 'Mon', value: 35 },
      { month: 'Tue', value: 42 },
      { month: 'Wed', value: 38 },
      { month: 'Thu', value: 48 },
      { month: 'Fri', value: 55 },
      { month: 'Sat', value: 52 },
      { month: 'Sun', value: 58 }
    ],
    '30days': [
      { month: 'Week 1', value: 38 },
      { month: 'Week 2', value: 45 },
      { month: 'Week 3', value: 42 },
      { month: 'Week 4', value: 52 }
    ],
    '3months': [
      { month: 'Jan', value: 45 },
      { month: 'Feb', value: 52 },
      { month: 'Mar', value: 48 }
    ],
    '12months': [
      { month: 'Jan', value: 45 },
      { month: 'Feb', value: 52 },
      { month: 'Mar', value: 48 },
      { month: 'Apr', value: 61 },
      { month: 'May', value: 55 },
      { month: 'Jun', value: 67 },
      { month: 'Jul', value: 70 },
      { month: 'Aug', value: 65 },
      { month: 'Sep', value: 72 },
      { month: 'Oct', value: 68 },
      { month: 'Nov', value: 75 },
      { month: 'Dec', value: 80 }
    ]
  }

  const currentChartData = chartData[periodFilter] || chartData['7days']

  // Generate SVG line chart with proper spacing
  const generateSmoothPath = () => {
    const width = 800
    const height = 260
    const leftPadding = 60
    const rightPadding = 20
    const topPadding = 20
    const bottomPadding = 40
    
    const dataPoints = currentChartData
    const maxValue = 100
    const minValue = 0
    
    const chartWidth = width - leftPadding - rightPadding
    const chartHeight = height - topPadding - bottomPadding
    const xStep = chartWidth / (dataPoints.length - 1 || 1)
    const yScale = chartHeight / (maxValue - minValue)

    let path = ''
    let points = []

    dataPoints.forEach((data, index) => {
      const x = leftPadding + index * xStep
      const y = height - bottomPadding - (data.value - minValue) * yScale
      points.push({ x, y, value: data.value, month: data.month })
    })

    // Generate smooth curve using cubic bezier
    if (points.length > 0) {
      path = `M ${points[0].x} ${points[0].y}`
      
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1]
        const curr = points[i]
        const next = points[i + 1]

        const cp1x = prev.x + (curr.x - prev.x) / 3
        const cp1y = prev.y + (curr.y - prev.y) / 3
        const cp2x = curr.x - (next ? (next.x - curr.x) / 3 : 0)
        const cp2y = curr.y - (next ? (next.y - curr.y) / 3 : 0)

        if (next) {
          path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`
        } else {
          path += ` L ${curr.x} ${curr.y}`
        }
      }
    }

    return { path, points, width, height, leftPadding, rightPadding, topPadding, bottomPadding, chartHeight, chartWidth }
  }

  const { path, points, width, height, leftPadding, rightPadding, topPadding, bottomPadding, chartHeight, chartWidth } = generateSmoothPath()

  if (loading) return <LoadingSpinner />

  return (
    <div className="animate-fade-in">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Billing Dashboard</h2>
          <p className="text-gray-500 text-sm">Track and manage all billing transactions</p>
        </div>
        <button 
          onClick={() => openModal('generate')}
          className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-300 font-semibold flex items-center gap-2 hover:scale-105"
        >
          <i className="fas fa-plus"></i>Generate Bill
        </button>
      </div>

      {/* Stats Cards with Real Percentage Changes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map(({ label, value, icon, change, iconColor, textColor, bgColor }) => (
          <div
            key={label}
            className={`${bgColor} rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-300`}
          >
            <div className="flex justify-between items-start mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center bg-white shadow-sm"
              >
                <i className={`fas ${icon} text-2xl`} style={{ color: iconColor }}></i>
              </div>
              <div className={`text-xs font-bold flex items-center px-2 py-1 rounded-lg ${
                change.startsWith('+') ? 'bg-green-100 text-green-600' : 
                change.startsWith('-') ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
              }`}>
                <i className={`fas fa-arrow-${change.startsWith('+') ? 'up' : change.startsWith('-') ? 'down' : 'right'} text-xs mr-1`}></i>
                {change}
              </div>
            </div>
            <div className="w-full">
              <p className="text-gray-600 text-xs font-semibold uppercase tracking-wide mb-2">{label}</p>
              <p className="text-3xl font-bold" style={{ color: textColor }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Add CSS for animated buttons and tooltip */}
      <style jsx>{`
        .buttons {
          display: flex;
          justify-content: space-around;
          gap: 12px;
        }

        .buttons button, .export-btn {
          width: 120px;
          height: 50px;
          background-color: white;
          margin: 0;
          color: #568fa6;
          position: relative;
          overflow: hidden;
          font-size: 14px;
          letter-spacing: 1px;
          font-weight: 500;
          text-transform: uppercase;
          transition: all 0.3s ease;
          cursor: pointer;
          border: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
        }

        .export-btn {
          width: 100px;
          height: 40px;
          background-color: white;
          color: #568fa6;
        }

        .buttons button:before, .buttons button:after,
        .export-btn:before, .export-btn:after {
          content: "";
          position: absolute;
          width: 0;
          height: 2px;
          background-color: #44d8a4;
          transition: all 0.3s cubic-bezier(0.35, 0.1, 0.25, 1);
        }

        .buttons button:before, .export-btn:before {
          right: 0;
          top: 0;
          transition: all 0.5s cubic-bezier(0.35, 0.1, 0.25, 1);
        }

        .buttons button:after, .export-btn:after {
          left: 0;
          bottom: 0;
        }

        .buttons button span, .export-btn span {
          width: 100%;
          height: 100%;
          position: absolute;
          left: 0;
          top: 0;
          margin: 0;
          padding: 0;
          z-index: 1;
        }

        .buttons button span:before, .buttons button span:after,
        .export-btn span:before, .export-btn span:after {
          content: "";
          position: absolute;
          width: 2px;
          height: 0;
          background-color: #44d8a4;
          transition: all 0.3s cubic-bezier(0.35, 0.1, 0.25, 1);
        }

        .buttons button span:before, .export-btn span:before {
          right: 0;
          top: 0;
          transition: all 0.5s cubic-bezier(0.35, 0.1, 0.25, 1);
        }

        .buttons button span:after, .export-btn span:after {
          left: 0;
          bottom: 0;
        }

        .buttons button p, .export-btn p {
          padding: 0;
          margin: 0;
          transition: all 0.4s cubic-bezier(0.35, 0.1, 0.25, 1);
          position: absolute;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .buttons button p:before, .buttons button p:after,
        .export-btn p:before, .export-btn p:after {
          position: absolute;
          width: 100%;
          transition: all 0.4s cubic-bezier(0.35, 0.1, 0.25, 1);
          z-index: 1;
          left: 0;
          text-align: center;
        }

        .buttons button p:before, .export-btn p:before {
          content: attr(data-title);
          top: 50%;
          transform: translateY(-50%);
        }

        .buttons button p:after, .export-btn p:after {
          content: attr(data-text);
          top: 150%;
          color: #44d8a4;
        }

        .buttons button:hover:before, .buttons button:hover:after,
        .export-btn:hover:before, .export-btn:hover:after {
          width: 100%;
        }

        .buttons button:hover span, .export-btn:hover span {
          z-index: 1;
        }

        .buttons button:hover span:before, .buttons button:hover span:after,
        .export-btn:hover span:before, .export-btn:hover span:after {
          height: 100%;
        }

        .buttons button:hover p:before, .export-btn:hover p:before {
          top: -50%;
          transform: rotate(5deg);
        }

        .buttons button:hover p:after, .export-btn:hover p:after {
          top: 50%;
          transform: translateY(-50%);
        }

        .buttons button.start, .export-btn.active {
          background-color: #44d8a4;
          box-shadow: 0px 5px 10px -10px rgba(0, 0, 0, 0.2);
          transition: all 0.2s ease;
          border: none;
          color: white;
        }

        .buttons button.start p:before, .export-btn.active p:before {
          top: -50%;
          transform: rotate(5deg);
        }

        .buttons button.start p:after, .export-btn.active p:after {
          color: white;
          transition: all 0s ease;
          content: attr(data-text);
          top: 50%;
          transform: translateY(-50%);
          animation: start 0.3s ease;
          animation-fill-mode: forwards;
        }

        @keyframes start {
          from {
            top: -50%;
          }
        }

        .buttons button.start:hover:before, .buttons button.start:hover:after,
        .export-btn.active:hover:before, .export-btn.active:hover:after {
          display: none;
        }

        .buttons button.start:hover span, .export-btn.active:hover span {
          display: none;
        }

        .buttons button:active, .export-btn:active {
          outline: none;
          border: none;
        }

        .buttons button:focus, .export-btn:focus {
          outline: 0;
        }

        /* Tooltip styles */
        .chart-tooltip {
          position: fixed;
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          color: white;
          padding: 8px 16px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          pointer-events: none;
          z-index: 1000;
          white-space: nowrap;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          transition: opacity 0.2s ease, transform 0.2s ease;
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .chart-tooltip::before {
          content: '';
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 12px;
          height: 12px;
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          transform: translateX(-50%) rotate(45deg);
        }
        
        .chart-tooltip .tooltip-value {
          font-size: 18px;
          font-weight: bold;
          color: #60a5fa;
        }
        
        .chart-tooltip .tooltip-label {
          font-size: 11px;
          opacity: 0.8;
          margin-right: 8px;
        }
      `}</style>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Chart Section - Full Chart with Proper Spacing */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">Revenue Trends</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <i className="fas fa-rupee-sign"></i>
              <span>Amount in ₹ (Thousands)</span>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row justify-between items-center gap-3 mb-6">
            <div className="buttons flex gap-3 flex-wrap">
              {[
                { id: '7days', label: '7 Days', title: '7 Days', text: 'Week' },
                { id: '30days', label: '30 Days', title: '30 Days', text: 'Month' },
                { id: '3months', label: '3 Months', title: '3 Months', text: 'Quarter' },
                { id: '12months', label: '12 Months', title: '12 Months', text: 'Year' }
              ].map(period => (
                <button
                  key={period.id}
                  onClick={() => setPeriodFilter(period.id)}
                  className={periodFilter === period.id ? 'start' : ''}
                >
                  <span></span>
                  <p data-title={period.label} data-text={period.text}></p>
                </button>
              ))}
            </div>
          </div>

          {/* SVG Chart with Money on Left and Gap in Middle */}
          <div className="relative w-full overflow-x-auto">
            <svg width="100%" height="280" viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
              {/* Grid lines */}
              <defs>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                </linearGradient>
              </defs>
              
              {/* Horizontal grid lines with money labels */}
              {[0, 25, 50, 75, 100].map((value, i) => {
                const y = height - bottomPadding - (value / 100) * chartHeight
                return (
                  <g key={`grid-${i}`}>
                    <line
                      x1={leftPadding}
                      y1={y}
                      x2={width - rightPadding}
                      y2={y}
                      stroke="#E5E7EB"
                      strokeWidth="1"
                      strokeDasharray="5,5"
                    />
                    {/* Money labels on left */}
                    <text
                      x={leftPadding - 12}
                      y={y + 4}
                      textAnchor="end"
                      fontSize="11"
                      fill="#6B7280"
                      fontWeight="500"
                    >
                      ₹{value}K
                    </text>
                  </g>
                )
              })}

              {/* Secondary line (lighter) */}
              <path
                d={path}
                fill="none"
                stroke="#BFDBFE"
                strokeWidth="2"
                opacity="0.5"
              />

              {/* Main line with gradient */}
              <path
                d={path}
                fill="none"
                stroke="#3B82F6"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Filled area under curve */}
              <path
                d={`${path} L ${width - rightPadding} ${height - bottomPadding} L ${leftPadding} ${height - bottomPadding} Z`}
                fill="url(#areaGradient)"
              />

              {/* Data points and month labels */}
              {points.map((point, index) => (
                <g key={`point-${index}`}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="6"
                    fill="white"
                    stroke="#3B82F6"
                    strokeWidth="2.5"
                    className="cursor-pointer transition-all duration-200 hover:r-8"
                    style={{ transition: 'r 0.2s ease' }}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      const svgRect = e.currentTarget.ownerSVGElement.getBoundingClientRect()
                      setTooltip({
                        visible: true,
                        x: rect.left + rect.width / 2,
                        y: rect.top - 15,
                        month: point.month,
                        value: point.value
                      })
                    }}
                    onMouseLeave={() => setTooltip({ visible: false, x: 0, y: 0, month: '', value: 0 })}
                  />
                  {/* Month labels with gap from bottom */}
                  <text
                    x={point.x}
                    y={height - bottomPadding + 20}
                    textAnchor="middle"
                    fontSize="11"
                    fill="#6B7280"
                    fontWeight="500"
                  >
                    {point.month}
                  </text>
                </g>
              ))}

              {/* Additional vertical grid lines with gap */}
              {points.map((point, index) => (
                <line
                  key={`vline-${index}`}
                  x1={point.x}
                  y1={topPadding}
                  x2={point.x}
                  y2={height - bottomPadding}
                  stroke="#F3F4F6"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
              ))}
            </svg>
          </div>
        </div>

        {/* Recent Bills - Exactly 3 items */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Recent Bills</h3>
            <button
              onClick={handleExportPDF}
              className="export-btn"
              style={{ width: '100px', height: '40px' }}
            >
              <span></span>
              <p data-title="Export" data-text="PDF"></p>
            </button>
          </div>

          <div className="space-y-3">
            {recentBills.length > 0 ? (
              recentBills.map((bill) => (
                <div 
                  key={bill.id} 
                  className="flex items-center justify-between p-4 hover:bg-blue-50 rounded-lg cursor-pointer transition-all duration-200 border border-transparent hover:border-blue-200"
                  onClick={() => openModal('view', bill)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                      {bill.patient.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">{bill.patient}</p>
                      <p className="text-gray-500 text-xs">{bill.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">₹{bill.amount}</p>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      bill.status === 'Paid' ? 'bg-green-100 text-green-700' :
                      bill.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {bill.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <i className="fas fa-receipt text-gray-300 text-4xl mb-3"></i>
                <p className="text-sm">No recent bills found</p>
              </div>
            )}
          </div>

          {recentBills.length > 0 && (
            <button 
              onClick={() => document.querySelector('.bills-table')?.scrollIntoView({ behavior: 'smooth' })}
              className="mt-6 w-full text-center py-3 text-blue-600 hover:text-blue-700 font-semibold border-t border-gray-200 pt-6 hover:bg-blue-50 rounded transition-all"
            >
              View All Bills ({filteredBills.length}) →
            </button>
          )}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip.visible && (
        <div 
          className="chart-tooltip"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <span className="tooltip-label">{tooltip.month}</span>
          <span className="tooltip-value">₹{tooltip.value}K</span>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Search & Filter Bills</h3>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <input 
              type="text" 
              placeholder="Search by invoice ID or patient name..." 
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all pl-11"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="fas fa-search absolute left-3 top-3.5 text-gray-400"></i>
          </div>
          <div className="w-full lg:w-48 relative">
            <select className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all appearance-none pr-10"
              value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
            </select>
            <i className="fas fa-chevron-down absolute right-3 top-3.5 text-gray-400 pointer-events-none"></i>
          </div>
        </div>
      </div>

      {/* Bills Table */}
      <div className="bills-table bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">All Bills</h3>
            <span className="text-sm font-semibold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
              {filteredBills.length} Bills
            </span>
          </div>
        </div>
        <DataTable
          columns={[
            { key: 'id', title: 'Invoice ID', sortable: true },
            { key: 'patient', title: 'Patient', sortable: true },
            { key: 'services', title: 'Services',
              render: (value) => (
                <div className="flex flex-wrap gap-1">
                  {value.map(service => (
                    <span key={service} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {service}
                    </span>
                  ))}
                </div>
              )
            },
            { key: 'amount', title: 'Amount', sortable: true, render: (value) => <span className="font-semibold">₹{value}</span> },
            { key: 'discount', title: 'Discount', sortable: true, render: (value) => `₹${value}` },
            { key: 'paymentMethod', title: 'Payment Method', sortable: true },
            { key: 'status', title: 'Status', sortable: true,
              render: (value) => (
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  value === 'Paid' ? 'bg-green-100 text-green-800' :
                  value === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {value}
                </span>
              )
            },
            { key: 'actions', title: 'Actions',
              render: (_, row) => (
                <div className="flex gap-2">
                  <button className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-all duration-200" title="View Bill" onClick={() => openModal('view', row)}>
                    <i className="fas fa-eye"></i>
                  </button>
                  <button className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 p-2 rounded-lg transition-all duration-200" title="Edit Bill" onClick={() => openModal('edit', row)}>
                    <i className="fas fa-edit"></i>
                  </button>
                  <button className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all duration-200" title="Delete Bill"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this bill?')) {
                        setBills(prev => prev.filter(b => b.id !== row.id))
                      }
                    }}>
                    <i className="fas fa-trash"></i>
                  </button>
                  {row.status !== 'Paid' && (
                    <button className="text-green-600 hover:text-green-700 hover:bg-green-50 p-2 rounded-lg transition-all duration-200"
                      title="Mark as Paid" onClick={() => openModal('payment', row)}>
                      <i className="fas fa-check"></i>
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      const printWindow = window.open('', '', 'height=900,width=1200')
                      const htmlContent = `
                        <html>
                          <head>
                            <title>Invoice ${row.id}</title>
                            <style>
                              * { margin: 0; padding: 0; }
                              body { font-family: 'Arial', sans-serif; color: #333; line-height: 1.6; }
                              .container { max-width: 900px; margin: 0 auto; padding: 40px; }
                              .hospital-header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #3B82F6; padding-bottom: 20px; }
                              .hospital-logo { font-size: 28px; font-weight: bold; color: #3B82F6; margin-bottom: 8px; }
                              .hospital-name { font-size: 20px; font-weight: bold; color: #333; }
                              .hospital-details { font-size: 12px; color: #666; margin-top: 8px; }
                              .invoice-title { font-size: 24px; font-weight: bold; color: #333; text-align: center; margin: 30px 0; }
                              .invoice-header { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
                              .header-section { background: #f5f5f5; padding: 15px; border-radius: 5px; }
                              .section-title { font-weight: bold; font-size: 14px; color: #3B82F6; margin-bottom: 10px; border-bottom: 2px solid #3B82F6; padding-bottom: 5px; }
                              .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
                              .label { font-weight: bold; color: #666; font-size: 12px; }
                              .value { font-size: 13px; color: #333; }
                              .treatment-section { margin: 20px 0; }
                              .treatment-item { background: #fafafa; padding: 10px; margin: 8px 0; border-left: 4px solid #10B981; border-radius: 3px; }
                              .treatment-label { font-weight: bold; color: #333; font-size: 13px; }
                              .tags-container { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0; }
                              .tag { display: inline-block; background: #E3F2FD; color: #1976D2; padding: 5px 10px; border-radius: 4px; font-size: 11px; }
                              .summary-section { margin-top: 30px; padding-top: 20px; border-top: 2px solid #3B82F6; background: #f9f9f9; padding: 15px; border-radius: 5px; }
                              .summary-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 13px; }
                              .summary-label { font-weight: bold; }
                              .summary-value { font-weight: bold; }
                              .total-row { display: flex; justify-content: space-between; padding: 15px 0; font-size: 16px; font-weight: bold; color: #3B82F6; border-top: 2px solid #3B82F6; }
                              .footer { text-align: center; margin-top: 40px; font-size: 11px; color: #999; border-top: 1px solid #ddd; padding-top: 20px; }
                            </style>
                          </head>
                          <body>
                            <div class="container">
                              <div class="hospital-header">
                                <div class="hospital-logo">🏥</div>
                                <div class="hospital-name">Allina Health Hospital</div>
                                <div class="hospital-details">
                                  2525 Chicago Avenue, Minneapolis, MN 55407-1321<br>
                                  Phone: (612) 262-9000 | Email: contact@allinahealth.org
                                </div>
                              </div>
                              
                              <div class="invoice-title">PATIENT INVOICE</div>
                              
                              <div class="invoice-header">
                                <div class="header-section">
                                  <div class="section-title">Patient Information</div>
                                  <div class="detail-row">
                                    <span class="label">Invoice ID:</span>
                                    <span class="value">${row.id}</span>
                                  </div>
                                  <div class="detail-row">
                                    <span class="label">Patient Name:</span>
                                    <span class="value">${row.patient}</span>
                                  </div>
                                  <div class="detail-row">
                                    <span class="label">Invoice Date:</span>
                                    <span class="value">${row.date}</span>
                                  </div>
                                  <div class="detail-row">
                                    <span class="label">Status:</span>
                                    <span class="value">${row.status}</span>
                                  </div>
                                </div>
                                
                                <div class="header-section">
                                  <div class="section-title">Treatment Duration</div>
                                  <div class="detail-row">
                                    <span class="label">Admission Date:</span>
                                    <span class="value">${row.admissionDate}</span>
                                  </div>
                                  <div class="detail-row">
                                    <span class="label">Discharge Date:</span>
                                    <span class="value">${row.dischargeDate}</span>
                                  </div>
                                  <div class="detail-row">
                                    <span class="label">Treating Doctor:</span>
                                    <span class="value">${row.doctorName}</span>
                                  </div>
                                  <div class="detail-row">
                                    <span class="label">Payment Method:</span>
                                    <span class="value">${row.paymentMethod}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div class="treatment-section">
                                <div class="section-title">Treatments Provided</div>
                                <div class="tags-container">
                                  ${row.treatments.map(t => `<div class="tag">${t}</div>`).join('')}
                                </div>
                              </div>
                              
                              <div class="treatment-section">
                                <div class="section-title">Tests & Examinations</div>
                                <div class="tags-container">
                                  ${row.tests.length > 0 ? row.tests.map(t => `<div class="tag">${t}</div>`).join('') : '<span style="color: #999; font-size: 12px;">No tests conducted</span>'}
                                </div>
                              </div>
                              
                              <div class="treatment-section">
                                <div class="section-title">Services</div>
                                <div class="tags-container">
                                  ${row.services.map(s => `<div class="tag">${s}</div>`).join('')}
                                </div>
                              </div>
                              
                              <div class="summary-section">
                                <div class="section-title">Payment Summary</div>
                                <div class="summary-row">
                                  <span class="summary-label">Amount:</span>
                                  <span class="summary-value">₹${row.amount}</span>
                                </div>
                                <div class="summary-row">
                                  <span class="summary-label">Discount:</span>
                                  <span class="summary-value">- ₹${row.discount}</span>
                                </div>
                                <div class="total-row">
                                  <span>Net Amount Due:</span>
                                  <span>₹${row.amount - row.discount}</span>
                                </div>
                              </div>
                              
                              <div class="footer">
                                <p>Thank you for choosing Allina Health Hospital</p>
                                <p>This is an electronically generated document and is valid without a signature.</p>
                              </div>
                            </div>
                          </body>
                        </html>
                      `
                      printWindow.document.write(htmlContent)
                      printWindow.document.close()
                      setTimeout(() => {
                        printWindow.print()
                      }, 250)
                    }} 
                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 p-2 rounded-lg transition-all duration-200"
                    title="Download Invoice">
                    <i className="fas fa-download"></i>
                  </button>
                </div>
              )
            }
          ]}
          data={filteredBills}
        />
      </div>

      {filteredBills.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <i className="fas fa-file-invoice text-blue-300 text-5xl mb-4 opacity-40"></i>
          <p className="text-lg font-medium text-gray-600">No bills found matching your criteria</p>
          <p className="text-sm text-gray-400 mt-2">Try adjusting your search or filter settings</p>
        </div>
      )}

      {/* Modals */}
      <ViewBillModal
        isOpen={modalState.view}
        onClose={() => closeModal('view')}
        bill={currentBill}
        onMarkAsPaid={handleMarkAsPaid}
      />

      <GenerateBillModal
        isOpen={modalState.generate}
        onClose={() => closeModal('generate')}
        onSubmit={handleGenerateBill}
        formData={newBill}
        onInputChange={handleInputChange}
        onServiceToggle={handleServiceToggle}
      />

      <PaymentModal
        isOpen={modalState.payment}
        onClose={() => closeModal('payment')}
        onConfirm={handleProcessPayment}
        bill={currentBill}
      />

      <EditBillModal
        isOpen={modalState.edit}
        onClose={() => closeModal('edit')}
        onSubmit={handleUpdateBill}
        formData={editBill || { patient: '', doctorName: '', services: [], amount: '', discount: '', paymentMethod: 'Cash', status: 'Pending', admissionDate: '', dischargeDate: '', notes: '' }}
        onInputChange={handleEditInputChange}
        onServiceToggle={handleEditServiceToggle}
        services={SERVICES}
        paymentMethods={PAYMENT_METHODS}
      />
    </div>
  )
}

// Sub-components
const ViewBillModal = ({ isOpen, onClose, bill, onMarkAsPaid }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Bill Details" size="lg">
    {bill && (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <DetailItem label="Invoice ID" value={bill.id} />
          <DetailItem label="Date" value={bill.date} />
          <DetailItem label="Patient" value={bill.patient} />
          <DetailItem label="Status" value={bill.status} />
          <DetailItem label="Amount" value={`₹${bill.amount}`} />
          <DetailItem label="Discount" value={`₹${bill.discount}`} />
          <DetailItem label="Payment Method" value={bill.paymentMethod} />
          <DetailItem label="Net Amount" value={`₹${bill.amount - bill.discount}`} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Services</label>
          <div className="flex flex-wrap gap-2">
            {bill.services.map(service => (
              <span key={service} className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded">{service}</span>
            ))}
          </div>
        </div>

        {bill.notes && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{bill.notes}</p>
          </div>
        )}

        <div className="flex justify-between gap-3 pt-4 border-t">
          {bill.status !== 'Paid' && (
            <button className="flex-1 bg-gradient-to-r from-green-600 to-green-500 text-white py-3 rounded-lg hover:shadow-lg transition-all duration-200 font-semibold flex items-center justify-center gap-2"
              onClick={() => { onMarkAsPaid(bill.id); onClose(); }}>
              <i className="fas fa-check"></i>Mark as Paid
            </button>
          )}
          <button className={`${bill.status !== 'Paid' ? 'flex-1' : 'w-full'} bg-gradient-to-r from-gray-300 to-gray-200 text-gray-800 py-3 rounded-lg hover:shadow-lg transition-all duration-200 font-semibold`}
            onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    )}
  </Modal>
)

const GenerateBillModal = ({ isOpen, onClose, onSubmit, formData, onInputChange, onServiceToggle }) => (
 <Modal isOpen={isOpen} onClose={onClose} title="Generate New Bill" size="lg">
    <div className="space-y-6">
      {/* Patient Details Preview */}
      {formData.patient && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">Patient Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Name:</span>
              <p className="text-gray-900">{formData.patient}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Patient ID:</span>
              <p className="text-gray-900">{formData.patient.split(' ').map(n => n[0]).join('') + Math.floor(Math.random() * 1000)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="input-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Patient <span className="text-red-500">*</span></label>
          <div className="relative">
            <select className="w-full px-4 py-3 pl-11 pr-11 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all appearance-none bg-white cursor-pointer"
              required value={formData.patient} onChange={(e) => onInputChange('patient', e.target.value)} >
              <option value="">Select Patient</option>
              {['Ravi Kumar', 'Anita Sharma', 'Suresh Patel', 'Priya Singh', 'Rajesh Kumar', 'Meena Gupta'].map(patient => (
                <option key={patient} value={patient}>{patient}</option>
              ))}
            </select>
            <i className="fas fa-user absolute left-3 top-3.5 text-gray-400"></i>
            <i className="fas fa-chevron-down absolute right-3 top-3.5 text-gray-400 pointer-events-none"></i>
          </div>
        </div>

        <div className="input-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Name <span className="text-red-500">*</span></label>
          <div className="relative">
            <input
              className="w-full px-4 py-3 pl-11 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              placeholder="Treating Doctor" type="text" required value={formData.doctorName} onChange={(e) => onInputChange('doctorName', e.target.value)}
            />
            <i className="fas fa-user-md absolute left-3 top-3.5 text-gray-400"></i>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="input-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">Admission Date <span className="text-red-500">*</span></label>
          <div className="relative">
            <input className="w-full px-4 py-3 pl-11 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              type="date" value={formData.admissionDate} onChange={(e) => onInputChange('admissionDate', e.target.value)}
            />
            <i className="fas fa-calendar-alt absolute left-3 top-3.5 text-gray-400"></i>
          </div>
        </div>

        <div className="input-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">Discharge Date <span className="text-red-500">*</span></label>
          <div className="relative">
            <input className="w-full px-4 py-3 pl-11 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              type="date" required value={formData.dischargeDate} onChange={(e) => onInputChange('dischargeDate', e.target.value)}
            />
            <i className="fas fa-calendar-check absolute left-3 top-3.5 text-gray-400"></i>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="input-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
          <div className="relative">
            <select className="w-full px-4 py-3 pl-11 pr-11 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all appearance-none bg-white cursor-pointer"
              value={formData.paymentMethod} onChange={(e) => onInputChange('paymentMethod', e.target.value)}>
              {['Cash', 'Card', 'UPI', 'Insurance', 'Bank Transfer'].map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
            <i className="fas fa-credit-card absolute left-3 top-3.5 text-gray-400"></i>
            <i className="fas fa-chevron-down absolute right-3 top-3.5 text-gray-400 pointer-events-none"></i>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Services <span className="text-red-500">*</span></label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {['Consultation', 'X-Ray', 'Blood Test', 'MRI Scan', 'CT Scan', 'Medication', 'Surgery', 'Lab Test'].map(service => (
            <button key={service} type="button" onClick={() => onServiceToggle(service)}
              className={`p-2 border-2 rounded-lg text-sm transition-all ${
                formData.services.includes(service)
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 text-gray-700 hover:border-blue-300'
              }`}>
              {service}
            </button>
          ))}
        </div>
        {formData.services.length > 0 && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-800 mb-1">Selected Services:</p>
            <div className="flex flex-wrap gap-2">
              {formData.services.map(service => (
                <span key={service} className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">{service}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="input-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) <span className="text-red-500">*</span></label>
          <div className="relative">
            <input className="w-full px-4 py-3 pl-11 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              placeholder="0" type="number" required min="0" value={formData.amount} onChange={(e) => onInputChange('amount', e.target.value)}
            />
            <i className="fas fa-rupee-sign absolute left-3 top-3.5 text-gray-400"></i>
          </div>
        </div>

        <div className="input-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">Discount (₹)</label>
          <div className="relative">
            <input className="w-full px-4 py-3 pl-11 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              placeholder="0" type="number" min="0" value={formData.discount} onChange={(e) => onInputChange('discount', e.target.value)}
            />
            <i className="fas fa-percent absolute left-3 top-3.5 text-gray-400"></i>
          </div>
        </div>
      </div>

      <div className="input-group">
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <div className="relative">
          <textarea className="w-full px-4 py-3 pl-11 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            placeholder="Additional notes..." style={{ resize: 'vertical' }} rows="3" value={formData.notes} onChange={(e) => onInputChange('notes', e.target.value)}
          />
          <i className="fas fa-sticky-note absolute left-3 top-3.5 text-gray-400"></i>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t">
        <button className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200 font-semibold"
          onClick={onClose}>
          Cancel
        </button>
        <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onSubmit} disabled={!formData.patient || !formData.doctorName || !formData.admissionDate || !formData.dischargeDate || formData.services.length === 0 || !formData.amount}>
          <i className="fas fa-file-invoice"></i> Generate Bill
        </button>
      </div>
    </div>
  </Modal>
)

const PaymentModal = ({ isOpen, onClose, onConfirm, bill }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Process Payment" size="md">
    {bill && (
      <div className="text-center p-8">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-100 to-green-50 rounded-full flex items-center justify-center shadow-lg">
          <i className="fas fa-check text-green-600 text-3xl"></i>
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-3">Confirm Payment</h3>
        <p className="text-gray-600 mb-6">Mark invoice <span className="font-bold text-gray-900">{bill.id}</span> as paid?</p>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl mb-8 border border-blue-200">
          <div className="text-4xl font-bold text-blue-600 mb-2">₹{bill.amount - bill.discount}</div>
          <div className="text-sm text-gray-600 font-semibold">Net Amount</div>
        </div>
        <div className="flex justify-center gap-4">
          <button onClick={onClose} className="px-8 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200 font-semibold">
            Cancel
          </button>
          <button className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-semibold flex items-center gap-2"
            onClick={onConfirm}>
            <i className="fas fa-check"></i>Confirm Payment
          </button>
        </div>
      </div>
    )}
  </Modal>
)

const EditBillModal = ({ isOpen, onClose, onSubmit, formData, onInputChange, onServiceToggle, services, paymentMethods }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Edit Bill" size="lg">
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="input-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name *</label>
          <div className="relative">
            <input className="w-full px-4 py-3 pl-11 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              placeholder="Patient Name" type="text" value={formData.patient} onChange={(e) => onInputChange('patient', e.target.value)}
            />
            <i className="fas fa-user absolute left-3 top-3.5 text-gray-400"></i>
          </div>
        </div>

        <div className="input-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Name</label>
          <div className="relative">
            <input className="w-full px-4 py-3 pl-11 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              placeholder="Treating Doctor" type="text" value={formData.doctorName}
              onChange={(e) => onInputChange('doctorName', e.target.value)}
            />
            <i className="fas fa-user-md absolute left-3 top-3.5 text-gray-400"></i>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="input-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">Admission Date</label>
          <div className="relative">
            <input className="w-full px-4 py-3 pl-11 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              type="date" value={formData.admissionDate} onChange={(e) => onInputChange('admissionDate', e.target.value)}
            />
            <i className="fas fa-calendar-alt absolute left-3 top-3.5 text-gray-400"></i>
          </div>
        </div>

        <div className="input-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">Discharge Date</label>
          <div className="relative">
            <input
              type="date"
              value={formData.dischargeDate}
              onChange={(e) => onInputChange('dischargeDate', e.target.value)}
              className="w-full px-4 py-3 pl-11 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
            <i className="fas fa-calendar-check absolute left-3 top-3.5 text-gray-400"></i>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Services *</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {services.map(service => (
            <button key={service} type="button" onClick={() => onServiceToggle(service)}
              className={`p-2 border-2 rounded-lg text-sm transition-all ${
                formData.services.includes(service)
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 text-gray-700 hover:border-blue-300'
              }`}>
              {service}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="input-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
          <div className="relative">
            <input className="w-full px-4 py-3 pl-11 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              type="number" min="0" placeholder="0" value={formData.amount} onChange={(e) => onInputChange('amount', Number(e.target.value))}
            />
            <i className="fas fa-rupee-sign absolute left-3 top-3.5 text-gray-400"></i>
          </div>
        </div>

        <div className="input-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">Discount (₹)</label>
          <div className="relative">
            <input className="w-full px-4 py-3 pl-11 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              type="number" min="0" placeholder="0" value={formData.discount}
              onChange={(e) => onInputChange('discount', Number(e.target.value))}
            />
            <i className="fas fa-percent absolute left-3 top-3.5 text-gray-400"></i>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="input-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
          <div className="relative">
            <select className="w-full px-4 py-3 pl-11 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all appearance-none"
              value={formData.paymentMethod} onChange={(e) => onInputChange('paymentMethod', e.target.value)}>
              {paymentMethods.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
            <i className="fas fa-credit-card absolute left-3 top-3.5 text-gray-400"></i>
          </div>
        </div>

        <div className="input-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <div className="relative">
            <select className="w-full px-4 py-3 pl-11 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all appearance-none"
              value={formData.status} onChange={(e) => onInputChange('status', e.target.value)}>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
            </select>
            <i className="fas fa-info-circle absolute left-3 top-3.5 text-gray-400"></i>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t">
        <button className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200 font-semibold"
          onClick={onClose}>
          Cancel
        </button>
        <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-semibold flex items-center gap-2"
          onClick={onSubmit}>
          <i className="fas fa-save"></i> Update Bill
        </button>
      </div>
    </div>
  </Modal>
)

const DetailItem = ({ label, value }) => (
  <div>
    <span className="font-medium text-gray-700">{label}:</span>
    <p className="text-gray-900">{value}</p>
  </div>
)

export default BillingFinance