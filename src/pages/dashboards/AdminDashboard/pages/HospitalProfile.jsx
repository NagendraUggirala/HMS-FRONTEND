// src/pages/dashboards/AdminDashboard/pages/HospitalProfile.jsx
import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { updateLogo } from '../../../../redux/slices/hospitalSlice'
import LoadingSpinner from '../../../../components/common/LoadingSpinner/LoadingSpinner'
import html2pdf from 'html2pdf.js'

// Static Hospital Data in JSON format
const HOSPITAL_DATA = {
  name: "City General Hospital",
  logo: "https://images.unsplash.com/photo-1565307528294-f70f3c7094e0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  registrationNumber: "SGH-TX-99201-B",
  address: "123 Medical Center Drive, Healthcare City, Metropolitan City, MC 88201",
  contact: "+1 (555) 123-4567",
  emergencyHotline: "+1 (555) 000-9111",
  email: "info@citygeneral.com",
  contactEmail: "admin@citygeneral.com",
  openingHours: "24/7 Emergency, OPD: 8AM-8PM",
  departments: [
    { id: 1, name: "Cardiology", description: "Heart care and cardiac surgery", icon: "fas fa-heartbeat", iconBg: "bg-red-500", status: "ACTIVE" },
    { id: 2, name: "Orthopedics", description: "Bone and joint treatments", icon: "fas fa-bone", iconBg: "bg-blue-500", status: "ACTIVE" },
    { id: 3, name: "Neurology", description: "Brain and nervous system", icon: "fas fa-brain", iconBg: "bg-purple-500", status: "ACTIVE" },
    { id: 4, name: "Pediatrics", description: "Child healthcare", icon: "fas fa-child", iconBg: "bg-green-500", status: "ACTIVE" },
    { id: 5, name: "ENT", description: "Ear, nose, throat", icon: "fas fa-ear-deaf", iconBg: "bg-orange-500", status: "ACTIVE" },
    { id: 6, name: "ICU Unit", description: "Critical care unit", icon: "fas fa-procedures", iconBg: "bg-indigo-500", status: "HIGH PRIORITY" },
    { id: 7, name: "Diagnostics Lab", description: "Pathology and radiology", icon: "fas fa-flask", iconBg: "bg-teal-500", status: "ACTIVE" }
  ],
  insurancePartners: ["HealthGuard", "MediCare Plus", "SecureLife", "Wellness First"],
  timeZone: "Eastern Standard Time (EST)",
  schedule: {
    'Monday - Friday': '00:00 - 24:00',
    'Saturday': '08:00 - 20:00',
    'Sunday': 'EMERGENCY ONLY'
  },
  branches: [
    {
      id: 1,
      name: 'City Center (Main)',
      description: 'Central Healthcare Hub',
      lat: 40.7128,
      lng: -74.0060,
      address: '1022 Ethereal Plaza, Suite 400, Clinical District'
    }
  ],
  mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d260.8136051777917!2d78.38556423586695!3d17.446886625190324!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x873dde7736fdeff1%3A0x88d3af212bf885bc!2sLevitica%20Technologies%20PVT%20LTD!5e1!3m2!1sen!2sin!4v1778825355810!5m2!1sen!2sin\" width=\"600\" height=\"450\" style=\"border:0;\" allowfullscreen=\"\" loading=\"lazy\" referrerpolicy=\"no-referrer-when-downgrade\">",
  currentPlan: {
    name: "Premium",
    type: "PREMIUM",
    price: "₹2,250",
    frequency: "/month",
    yearlyPrice: "₹27,000/year",
    features: [
      "Up to 5 doctors",
      "Up to 11 patients",
      "30 appointments / month",
      "24/7 Support",
      "Analytics Dashboard"
    ],
    status: "Active",
    renewalDate: "2026-04-30"
  },
  paymentHistory: [
    { id: "TXN001", date: "2026-03-30", description: "Monthly Plan - Premium", amount: "₹2,250", status: "Paid", method: "Credit Card", invoiceId: "INV-2026-003" },
    { id: "TXN002", date: "2026-02-28", description: "Monthly Plan - Premium", amount: "₹2,250", status: "Paid", method: "Bank Transfer", invoiceId: "INV-2026-002" },
    { id: "TXN003", date: "2026-01-30", description: "Monthly Plan - Premium", amount: "₹2,250", status: "Paid", method: "Credit Card", invoiceId: "INV-2026-001" },
    { id: "TXN004", date: "2025-12-30", description: "Monthly Plan - Premium", amount: "₹2,250", status: "Paid", method: "UPI", invoiceId: "INV-2025-012" },
    { id: "TXN005", date: "2025-11-30", description: "Monthly Plan - Premium", amount: "₹2,250", status: "Paid", method: "Credit Card", invoiceId: "INV-2025-011" }
  ]
}

const HospitalProfile = () => {
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(true)
  const [hospital, setHospital] = useState({})
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [activeQuickAction, setActiveQuickAction] = useState(null)
  const [downloadingInvoice, setDownloadingInvoice] = useState(null)
  
  // Modal States for Quick Actions
  const [showInsuranceModal, setShowInsuranceModal] = useState(false)
  const [showHoursModal, setShowHoursModal] = useState(false)
  
  // Plan Modal States
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showPlanDetailsModal, setShowPlanDetailsModal] = useState(false)
  
  // Department Modal States
  const [showDepartmentModal, setShowDepartmentModal] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState(null)
  
  // Form states for modals
  const [newInsurance, setNewInsurance] = useState('')
  const [newHours, setNewHours] = useState('')

  // Settings related states
  const [isEditingPhoto, setIsEditingPhoto] = useState(false)
  const [photoPreview, setPhotoPreview] = useState('')
  const [tempPhotoPreview, setTempPhotoPreview] = useState('')
  const [isEditingSchedule, setIsEditingSchedule] = useState(false)
  const [editScheduleData, setEditScheduleData] = useState({})

  useEffect(() => {
    loadHospitalData()
  }, [])

  const loadHospitalData = async () => {
    setLoading(true)
    setTimeout(() => {
      const hospitalData = HOSPITAL_DATA
      setHospital(hospitalData)
      setFormData(hospitalData)
      setPhotoPreview(hospitalData.logo)
      setTempPhotoPreview(hospitalData.logo)
      setNewHours(hospitalData.openingHours)
      setEditScheduleData(hospitalData.schedule)
      setLoading(false)
    }, 1000)
  }

  const generateInvoiceHTML = (payment, hospitalData) => {
    // Determine checkbox states based on payment method
    const methodUpper = (payment.method || '').toUpperCase();
    const isCash = methodUpper === 'CASH';
    const isCheque = methodUpper.includes('CHEQUE') || methodUpper.includes('CHECK');
    const isCard = methodUpper.includes('CARD');
    const isInsurance = methodUpper.includes('INSURANCE');
    const isOthers = !isCash && !isCheque && !isCard && !isInsurance;
    // Extract currency symbol if present
    const currencyMatch = payment.amount ? payment.amount.match(/^[^\d]+/) : null;
    const currency = currencyMatch ? currencyMatch[0].trim() : '$';

    return `
      <div style="font-family: Arial, sans-serif; width: 100%; max-width: 800px; margin: 0 auto; background: white; color: #333; position: relative;">
        <!-- Blue Header Bar -->
        <div style="background-color: #6096d1; height: 30px; width: 100%;"></div>
        <!-- Top Gray Section -->
        <div style="background-color: #f1f3f4; padding: 30px; display: flex; justify-content: space-between;">
          <!-- Left: Logo & Info -->
          <div style="width: 50%;">
            <div style="width: 120px; height: 100px; border: 2px solid #333; background-color: #d0e1f9; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; overflow: hidden;">
              ${hospitalData.logo ? `<img src="${hospitalData.logo}" alt="Logo" style="max-width: 100%; max-height: 100%; object-fit: contain;" />` : `<div style="font-weight: bold; text-align: center; font-size: 16px;">YOUR<br>LOGO</div>`}
            </div>
            <h2 style="font-size: 16px; margin: 0 0 10px 0; font-weight: bold;">[ ${hospitalData.name || 'Medical Institution Name'} ]</h2>
            <p style="margin: 3px 0; font-size: 11px;">[ ${hospitalData.address || 'Medical Institution Address'} ]</p>
            <p style="margin: 3px 0; font-size: 11px;">[ ${hospitalData.email || 'Medical Institution Email'} ]</p>
            <p style="margin: 3px 0; font-size: 11px;">[ ${hospitalData.contact || 'Medical Institution Contact No.'} ]</p>
          </div>
          
          <!-- Right: Receipt & Date -->
          <div style="width: 40%; text-align: right;">
            <h1 style="font-size: 36px; color: #7f8c8d; margin: 0 0 40px 0; font-weight: normal;">RECEIPT</h1>
            
            <div style="display: flex; justify-content: flex-end; margin-bottom: 10px;">
              <span style="font-weight: bold; font-size: 12px; margin-right: 20px; color: #0d2c54; padding-top: 2px;">DATE</span>
              <div style="border-bottom: 1px solid #ccc; width: 150px; text-align: center; font-size: 12px; padding-bottom: 2px;">${new Date(payment.date).toLocaleDateString()}</div>
            </div>
            
            <div style="display: flex; justify-content: flex-end;">
              <span style="font-weight: bold; font-size: 12px; margin-right: 20px; color: #0d2c54; padding-top: 2px;">RECEIPT NO.</span>
              <div style="border-bottom: 1px solid #ccc; width: 150px; text-align: center; font-size: 12px; padding-bottom: 2px;">${payment.invoiceId || payment.id}</div>
            </div>
          </div>
        </div>
        
        <!-- Info Columns -->
        <div style="display: flex; justify-content: space-between; padding: 30px; padding-bottom: 10px;">
          <!-- Left Column -->
          <div style="width: 45%;">
            <h3 style="font-size: 13px; color: #0d2c54; margin: 0 0 5px 0; border-bottom: 1px solid #a3b8cc; padding-bottom: 5px;">Hospital Information</h3>
            <p style="margin: 8px 0; font-size: 12px; font-weight: bold;">[ ${hospitalData.name || 'Hospital Name'} ]</p>
            <p style="margin: 8px 0; font-size: 12px; font-weight: bold;">[ ${hospitalData.address || 'Hospital Address'} ]</p>
            <p style="margin: 8px 0; font-size: 12px; font-weight: bold;">[ ${hospitalData.email || 'Hospital Email'} ]</p>
            <p style="margin: 8px 0; font-size: 12px; font-weight: bold;">[ ${hospitalData.contact || 'Hospital Contact No.'} ]</p>
          </div>
          
          <!-- Right Column -->
          <div style="width: 45%;">
            <h3 style="font-size: 13px; color: #0d2c54; margin: 0 0 5px 0; border-bottom: 1px solid #a3b8cc; padding-bottom: 5px;">Payment Details</h3>
            <p style="margin: 8px 0; font-size: 12px; font-weight: bold;">[ Transaction ID: ${payment.id} ]</p>
            <p style="margin: 8px 0; font-size: 12px; font-weight: bold;">[ Status: ${payment.status} ]</p>
            <p style="margin: 8px 0; font-size: 12px; font-weight: bold;">[ Method: ${payment.method} ]</p>
          </div>
        </div>
        
        <!-- Table -->
        <div style="padding: 0 30px;">
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #ccc;">
            <thead>
              <tr style="background-color: #0d2c54; color: white;">
                <th style="padding: 8px; font-size: 12px; border: 1px solid #ccc; width: 20%; text-align: center;">Code</th>
                <th style="padding: 8px; font-size: 12px; border: 1px solid #ccc; width: 40%; text-align: left;">Description of Service/Treatment/Medicine</th>
                <th style="padding: 8px; font-size: 12px; border: 1px solid #ccc; width: 20%; text-align: center;">Rate / Charge</th>
                <th style="padding: 8px; font-size: 12px; border: 1px solid #ccc; width: 20%; text-align: center;">Line total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 8px; font-size: 12px; border: 1px solid #ccc; text-align: center;">${payment.id}</td>
                <td style="padding: 8px; font-size: 12px; border: 1px solid #ccc;">${payment.description}</td>
                <td style="padding: 8px; font-size: 12px; border: 1px solid #ccc; text-align: center;">${payment.amount}</td>
                <td style="padding: 8px; font-size: 12px; border: 1px solid #ccc; text-align: center;">${payment.amount}</td>
              </tr>
              <tr style="background-color: #f5f5f5;">
                <td style="padding: 8px; font-size: 12px; border: 1px solid #ccc;">&nbsp;</td>
                <td style="padding: 8px; font-size: 12px; border: 1px solid #ccc;"></td>
                <td style="padding: 8px; font-size: 12px; border: 1px solid #ccc;"></td>
                <td style="padding: 8px; font-size: 12px; border: 1px solid #ccc;"></td>
              </tr>
              <tr>
                <td style="padding: 8px; font-size: 12px; border: 1px solid #ccc;">&nbsp;</td>
                <td style="padding: 8px; font-size: 12px; border: 1px solid #ccc;"></td>
                <td style="padding: 8px; font-size: 12px; border: 1px solid #ccc;"></td>
                <td style="padding: 8px; font-size: 12px; border: 1px solid #ccc;"></td>
              </tr>
              <tr style="background-color: #f5f5f5;">
                <td style="padding: 8px; font-size: 12px; border: 1px solid #ccc;">&nbsp;</td>
                <td style="padding: 8px; font-size: 12px; border: 1px solid #ccc;"></td>
                <td style="padding: 8px; font-size: 12px; border: 1px solid #ccc;"></td>
                <td style="padding: 8px; font-size: 12px; border: 1px solid #ccc;"></td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Bottom Section -->
        <div style="display: flex; justify-content: space-between; padding: 20px 30px 40px 30px;">
          <!-- Left Bottom: Notes & Payment by -->
          <div style="width: 40%;">
            <div style="margin-bottom: 20px;">
              <span style="font-size: 12px; border-bottom: 1px solid #333; padding-bottom: 2px;">Notes</span>
            </div>
            <div>
              <p style="font-size: 12px; margin: 0 0 10px 0;">Payment by:</p>
              <div style="font-size: 11px; margin-bottom: 5px; display: flex; align-items: center;">
                <div style="width: 12px; height: 12px; border: 1px solid #333; margin-right: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                  ${isCash ? '✓' : ''}
                </div> Cash
              </div>
              <div style="font-size: 11px; margin-bottom: 5px; display: flex; align-items: center;">
                <div style="width: 12px; height: 12px; border: 1px solid #333; margin-right: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                  ${isCheque ? '✓' : ''}
                </div> Cheque with number
              </div>
              <div style="font-size: 11px; margin-bottom: 5px; display: flex; align-items: center;">
                <div style="width: 12px; height: 12px; border: 1px solid #333; margin-right: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                  ${isCard ? '✓' : ''}
                </div> Credit card
              </div>
              <div style="font-size: 11px; margin-bottom: 5px; display: flex; align-items: center;">
                <div style="width: 12px; height: 12px; border: 1px solid #333; margin-right: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                  ${isInsurance ? '✓' : ''}
                </div> Insurance [ ${isInsurance ? payment.method : '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'} ]
              </div>
              <div style="font-size: 11px; margin-bottom: 5px; display: flex; align-items: center;">
                <div style="width: 12px; height: 12px; border: 1px solid #333; margin-right: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                  ${isOthers ? '✓' : ''}
                </div> Others [ ${isOthers ? payment.method : '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'} ]
              </div>
            </div>
          </div>
          
          <!-- Right Bottom: Totals -->
          <div style="width: 50%;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="font-size: 11px; font-weight: bold; text-align: right; padding: 5px;">SUBTOTAL</td>
                <td style="border-bottom: 1px solid #ccc; width: 50%; text-align: right; padding: 5px; font-size: 12px;">${payment.amount}</td>
              </tr>
              <tr>
                <td style="font-size: 11px; font-weight: bold; text-align: right; padding: 5px;">DISCOUNT</td>
                <td style="border-bottom: 1px solid #eee; text-align: right; padding: 5px; font-size: 12px;">-</td>
              </tr>
              <tr>
                <td style="font-size: 11px; font-weight: bold; text-align: right; padding: 5px;">SUBTOTAL LESS DISCOUNT</td>
                <td style="border-bottom: 1px solid #eee; text-align: right; padding: 5px; font-size: 12px;">${payment.amount}</td>
              </tr>
              <tr>
                <td style="font-size: 11px; font-weight: bold; text-align: right; padding: 5px;">TAX RATE</td>
                <td style="border-bottom: 1px solid #eee; text-align: right; padding: 5px; font-size: 12px;">0%</td>
              </tr>
              <tr>
                <td style="font-size: 11px; font-weight: bold; text-align: right; padding: 5px;">TOTAL TAX</td>
                <td style="text-align: right; padding: 5px; font-size: 12px;">-</td>
              </tr>
            </table>
            
            <div style="margin-top: 20px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 14px; font-weight: bold; margin-right: 10px;">Balance Due</span>
              <div style="background-color: #d1d5db; border-top: 2px solid #333; border-bottom: 2px solid #333; padding: 10px; flex: 1; display: flex; justify-content: space-between; align-items: center; font-weight: bold; font-size: 14px;">
                <span>${currency}</span>
                <span>-</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Blue Footer Bar -->
        <div style="background-color: #6096d1; height: 30px; width: 100%; margin-top: 20px;"></div>
      </div>
    `;
  }

  const handleDownloadInvoice = (payment) => {
    setDownloadingInvoice(payment.id)
    
    const invoiceHTML = generateInvoiceHTML(payment, hospital)
    
    const opt = {
      margin:       10,
      filename:     `Invoice_${payment.invoiceId || payment.id}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(invoiceHTML).save().then(() => {
      setDownloadingInvoice(null)
    }).catch((error) => {
      console.error('Error generating PDF:', error)
      setDownloadingInvoice(null)
    })
  }

  const handlePrintInvoice = (payment) => {
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Invoice - ${payment.invoiceId || payment.id}</title>
        </head>
        <body style="margin:0; padding:0;">
          ${generateInvoiceHTML(payment, hospital)}
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handleEditProfile = () => {
    setIsEditing(true)
  }

  const handleSaveProfile = () => {
    setHospital(formData)
    setIsEditing(false)
    console.log('Saving hospital data:', formData)
  }

  const handleCancelEdit = () => {
    setFormData(hospital)
    setIsEditing(false)
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleUpdateLogo = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          setHospital(prev => ({ ...prev, logo: event.target.result }))
          setFormData(prev => ({ ...prev, logo: event.target.result }))
          setPhotoPreview(event.target.result)
          dispatch(updateLogo(event.target.result))
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  const handlePhotoEdit = () => {
    setIsEditingPhoto(true)
    setTempPhotoPreview(photoPreview)
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setTempPhotoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSavePhoto = () => {
    setPhotoPreview(tempPhotoPreview)
    setHospital(prev => ({ ...prev, logo: tempPhotoPreview }))
    setFormData(prev => ({ ...prev, logo: tempPhotoPreview }))
    dispatch(updateLogo(tempPhotoPreview))
    setIsEditingPhoto(false)
  }

  const handleCancelPhotoEdit = () => {
    setTempPhotoPreview(photoPreview)
    setIsEditingPhoto(false)
  }

  const handleScheduleChange = (day, value) => {
    setEditScheduleData(prev => ({
      ...prev,
      [day]: value
    }))
  }

  const handleSaveSchedule = () => {
    setHospital(prev => ({
      ...prev,
      schedule: editScheduleData,
      openingHours: Object.values(editScheduleData).join(', ')
    }))
    setFormData(prev => ({
      ...prev,
      schedule: editScheduleData,
      openingHours: Object.values(editScheduleData).join(', ')
    }))
    setNewHours(Object.values(editScheduleData).join(', '))
    setIsEditingSchedule(false)
  }

  const handleCancelScheduleEdit = () => {
    setEditScheduleData(hospital.schedule)
    setIsEditingSchedule(false)
  }

  const handleAddDepartment = () => {
    window.dispatchEvent(
      new CustomEvent('dashboard-navigation', {
        detail: { page: 'departments' }
      })
    )
  }

  const handleManageInsurance = () => {
    if (newInsurance.trim()) {
      const updatedInsurance = [...hospital.insurancePartners, newInsurance.trim()]
      setHospital(prev => ({ ...prev, insurancePartners: updatedInsurance }))
      setFormData(prev => ({ ...prev, insurancePartners: updatedInsurance }))
      setNewInsurance('')
      setShowInsuranceModal(false)
    }
  }

  const handleUpdateHours = () => {
    if (newHours && newHours.trim()) {
      setHospital(prev => ({ ...prev, openingHours: newHours }))
      setFormData(prev => ({ ...prev, openingHours: newHours }))
      setShowHoursModal(false)
    }
  }

  const handleViewAnalytics = () => {
    window.dispatchEvent(
      new CustomEvent('dashboard-navigation', {
        detail: { page: 'reports' }
      })
    )
  }

  const removeDepartment = (deptId) => {
    const updatedDepartments = hospital.departments.filter(dept => dept.id !== deptId)
    setHospital(prev => ({ ...prev, departments: updatedDepartments }))
    setFormData(prev => ({ ...prev, departments: updatedDepartments }))
  }

  const removeInsurance = (insuranceToRemove) => {
    const updatedInsurance = hospital.insurancePartners.filter(insurance => insurance !== insuranceToRemove)
    setHospital(prev => ({ ...prev, insurancePartners: updatedInsurance }))
    setFormData(prev => ({ ...prev, insurancePartners: updatedInsurance }))
  }

  const triggerQuickAction = (actionKey, action) => {
    setActiveQuickAction(actionKey)
    action()
    setTimeout(() => {
      setActiveQuickAction(current => (current === actionKey ? null : current))
    }, 700)
  }

  if (loading) return <LoadingSpinner />
  const quickActions = [
    {
      key: 'department',
      title: 'Add Department',
      description: 'Launch setup for a new specialty unit',
      meta: `${hospital.departments?.length || 0} active departments`,
      icon: 'fas fa-plus',
      iconBg: 'from-cyan-400 to-blue-500',
      iconGlow: 'shadow-cyan-500/30',
      badge: 'Setup',
      onClick: handleAddDepartment
    },
    {
      key: 'insurance',
      title: 'Manage Insurance',
      description: 'Expand supported partners and coverage',
      meta: `${hospital.insurancePartners?.length || 0} insurance partners`,
      icon: 'fas fa-shield-alt',
      iconBg: 'from-emerald-400 to-green-500',
      iconGlow: 'shadow-emerald-500/30',
      badge: 'Coverage',
      onClick: () => setShowInsuranceModal(true)
    },
    {
      key: 'hours',
      title: 'Update Hours',
      description: 'Refresh OPD, emergency, and visit timings',
      meta: 'Keep patient-facing info current',
      icon: 'fas fa-clock',
      iconBg: 'from-violet-400 to-fuchsia-500',
      iconGlow: 'shadow-fuchsia-500/30',
      badge: 'Schedule',
      onClick: () => setShowHoursModal(true)
    },
    {
      key: 'analytics',
      title: 'View Analytics',
      description: 'Open performance insights and trends',
      meta: `${hospital.paymentHistory?.length || 0} recent transactions`,
      icon: 'fas fa-chart-line',
      iconBg: 'from-amber-400 to-orange-500',
      iconGlow: 'shadow-orange-500/30',
      badge: 'Insights',
      onClick: handleViewAnalytics
    }
  ]

  return (
    <div className="animate-fade-in space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
          Hospital Profile
        </h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Hospital Information Card - Main Profile */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100 overflow-hidden">
          {/* Header Section with Gradient and Photo */}
          <div className="bg-gradient-to-r from-blue-50 via-blue-100 to-indigo-50 p-4 sm:p-6 text-gray-800 relative overflow-hidden border-b border-gray-100">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-40 rounded-full -mr-20 -mt-20"></div>
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              {/* Photo Container */}
              <div className="relative group">
                <img src={photoPreview || hospital.logo} alt="Hospital Logo" 
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover shadow-sm ring-4 ring-white" 
                />
                <button className="absolute inset-0 bg-black bg-opacity-40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  onClick={handlePhotoEdit}>
                  <div className="text-center">
                    <i className="fas fa-camera text-white text-lg sm:text-xl mb-1 block"></i>
                    <span className="text-white text-xs font-bold hidden sm:block">EDIT</span>
                  </div>
                </button>
              </div>

              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="text-xl sm:text-2xl font-bold bg-white/50 rounded-lg px-3 py-1 w-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-transparent focus:border-blue-300"
                  />
                ) : (
                  <h3 className="text-xl sm:text-2xl font-bold break-words text-gray-900">{hospital.name}</h3>
                )}
                <p className="text-blue-700 mt-1 flex items-center text-sm font-medium">
                  <i className="fas fa-check-circle text-green-600 mr-2"></i>
                  Registration: {hospital.registrationNumber}
                </p>
              </div>
            </div>
          </div>

          {/* Information Grid */}
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4 hover:bg-blue-50 transition-colors border border-gray-200">
                  <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center">
                    <i className="fas fa-map-marker-alt text-blue-600 mr-2"></i>Address
                  </label>
                  {isEditing ? (
                    <textarea
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full p-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white transition-colors resize-none"
                      rows="2"
                    />
                  ) : (
                    <p className="text-gray-900 text-sm">{hospital.address}</p>
                  )}
                </div>

                <div className="bg-gray-50 rounded-xl p-4 hover:bg-green-50 transition-colors border border-gray-200">
                  <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center">
                    <i className="fas fa-phone text-green-600 mr-2"></i>Contact Numbers
                  </label>
                  {isEditing ? (
                    <div className="space-y-2">
                      <input placeholder="Main Contact" type="text" value={formData.contact}
                        className="w-full p-3 border-2 border-green-300 rounded-lg focus:outline-none focus:border-green-500"
                        onChange={(e) => handleInputChange('contact', e.target.value)}
                      />
                      <input placeholder="Emergency Hotline" type="text" value={formData.emergencyHotline}
                        className="w-full p-3 border-2 border-green-300 rounded-lg focus:outline-none focus:border-green-500"
                        onChange={(e) => handleInputChange('emergencyHotline', e.target.value)}
                      />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-gray-900 text-sm">Main: {hospital.contact}</p>
                      <p className="text-gray-900 text-sm">Emergency: {hospital.emergencyHotline}</p>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 rounded-xl p-4 hover:bg-purple-50 transition-colors border border-gray-200">
                  <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center">
                    <i className="fas fa-envelope text-purple-600 mr-2"></i>Email Addresses
                  </label>
                  {isEditing ? (
                    <div className="space-y-2">
                      <input placeholder="Main Email" type="email" value={formData.email}
                        className="w-full p-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-500"
                        onChange={(e) => handleInputChange('email', e.target.value)}
                      />
                      <input placeholder="Admin Email" type="email" value={formData.contactEmail}
                        className="w-full p-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-500"
                        onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                      />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-gray-900 text-sm">Info: {hospital.email}</p>
                      <p className="text-gray-900 text-sm">Admin: {hospital.contactEmail}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Right Column */}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4 hover:bg-orange-50 transition-colors border border-gray-200">
                  <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center">
                    <i className="fas fa-clock text-orange-600 mr-2"></i>Operating Hours
                  </label>
                  {isEditing ? (
                    <input className="w-full p-3 border-2 border-orange-300 rounded-lg focus:outline-none focus:border-orange-500"
                      type="text" value={formData.openingHours}
                      onChange={(e) => handleInputChange('openingHours', e.target.value)}
                    />
                  ) : (
                    <p className="text-gray-900 text-sm">{hospital.openingHours}</p>
                  )}
                </div>

                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <label className="block text-xs font-semibold text-gray-700 mb-3 flex items-center">
                    <i className="fas fa-building text-blue-600 mr-2"></i>Departments ({hospital.departments.length})
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {hospital.departments.map((dept) => (
                      <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center shadow-sm"
                        key={dept.id}>
                        {dept.name}
                        {isEditing && (
                          <button className="ml-2 hover:bg-red-500 rounded-full p-1 transition-colors"
                            onClick={() => removeDepartment(dept.id)}>
                            <i className="fas fa-times text-xs"></i>
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <label className="block text-xs font-semibold text-gray-700 mb-3 flex items-center">
                    <i className="fas fa-shield-alt text-green-600 mr-2"></i>Insurance Partners ({hospital.insurancePartners.length})
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {hospital.insurancePartners.map((insurance, idx) => (
                      <span className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center shadow-sm" key={idx}>
                        {insurance}
                        {isEditing && (
                          <button className="ml-2 hover:bg-red-500 rounded-full p-1 transition-colors"
                            onClick={() => removeInsurance(insurance)}>
                            <i className="fas fa-times text-xs"></i>
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-2 sm:gap-3">
              {isEditing ? (
                <>
                  <button className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:from-green-600 hover:to-green-700 font-semibold transition-all shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
                    onClick={handleSaveProfile}>
                    <i className="fas fa-save"></i>Save Changes
                  </button>
                  <button className="flex-1 bg-gray-300 text-gray-800 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-gray-400 font-semibold transition-all shadow-md flex items-center justify-center gap-2 text-sm sm:text-base"
                    onClick={handleCancelEdit}>
                    <i className="fas fa-times"></i>Cancel
                  </button>
                </>
              ) : (
                <>
                  <button className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 font-semibold transition-all shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
                    onClick={handleEditProfile}>
                    <i className="fas fa-edit"></i>Edit Profile
                  </button>
                  <button className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:from-green-600 hover:to-green-700 font-semibold transition-all shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
                    onClick={handleUpdateLogo}>
                    <i className="fas fa-image"></i>Update Logo
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Quick Actions Panel */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-800 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.8),_transparent_38%),radial-gradient(circle_at_bottom_left,_rgba(56,189,248,0.1),_transparent_32%)]"></div>
          <div className="absolute -right-10 top-10 h-28 w-28 rounded-full bg-cyan-300/30 blur-3xl"></div>
          <div className="absolute -left-6 bottom-16 h-24 w-24 rounded-full bg-indigo-300/30 blur-3xl"></div>
          <div className="relative p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/60 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-blue-700 backdrop-blur-md">
                  <span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]"></span>
                  Live Shortcuts
                </div>
                <h3 className="mt-4 flex items-center text-lg font-bold sm:text-xl text-gray-900">
                  <i className="fas fa-bolt mr-3 text-amber-500"></i>Quick Actions</h3>
                <p className="mt-2 max-w-xs text-sm leading-6 text-gray-600">
                  High-traffic tasks are grouped here so admins can update settings faster.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {quickActions.map((action) => {
                const isActive = activeQuickAction === action.key
                return (
                  <button key={action.key} onClick={() => triggerQuickAction(action.key, action.onClick)}
                    className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 ${
                      isActive
                        ? 'border-blue-300 bg-blue-50 shadow-md'
                        : 'border-white bg-white hover:-translate-y-1 hover:border-gray-200 hover:bg-gray-50 hover:shadow-md shadow-sm'
                    } backdrop-blur-xl`}>
                    <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.4),transparent)]"></div>
                    <div className="relative flex items-start justify-between gap-3">
                      <div className="flex min-w-0 gap-3">
                        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${action.iconBg} shadow-sm ${action.iconGlow}`}>
                          <i className={`${action.icon} text-sm text-white`}></i>
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base font-semibold text-gray-900">{action.title}</span>
                            <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700">
                              {action.badge}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-4">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-300 ${
                          isActive ? 'translate-x-1 bg-blue-100 border-blue-200' : 'bg-gray-50 border-gray-100 group-hover:translate-x-1 group-hover:bg-gray-100'
                        }`}>
                          <i className={`fas fa-arrow-right text-xs ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}></i>
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Location & Map Section (from Settings) */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-map-marked-alt text-white"></i>
              </div>
              <div>
                <h2 className="font-bold text-xl text-gray-800">Location</h2>
                <p className="text-xs text-gray-500">Main branch location</p>
              </div>
            </div>
          </div>

          <div className="flex-1 p-6">
            <div className="w-full h-80 rounded-xl overflow-hidden border-2 border-gray-200 shadow-md">
              <iframe
                src={hospital.mapEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 'none' }}
                allowFullScreen=""
                loading="lazy"
                title="Hospital Location"
              ></iframe>
            </div>

            <div className="mt-4 space-y-3">
              {hospital.branches?.map((branch) => (
                <div key={branch.id} className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-gray-800">{branch.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{branch.description}</p>
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                        <i className="fas fa-map-marker-alt text-blue-600"></i>
                        {branch.address}
                      </p>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800 transition-colors">
                      <i className="fas fa-map-pin text-lg"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Operating Hours Card (from Settings) */}
        <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl border border-blue-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
          <div className="bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-100 px-6 py-6 text-gray-800 relative overflow-hidden border-b border-gray-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-40 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-1">
                <div className="bg-white bg-opacity-60 text-blue-600 p-2 rounded-xl backdrop-blur-sm shadow-sm border border-blue-100">
                  <i className="fas fa-clock text-2xl"></i>
                </div>
                <h2 className="font-bold text-2xl text-gray-900">Operating Hours</h2>
              </div>
              <p className="text-blue-700 text-sm mt-1 font-medium">Timezone: {hospital.timeZone}</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-3">
              {Object.entries(hospital.schedule || {}).map(([day, time]) => (
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 hover:border-blue-300 transition-all duration-300" key={day}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {time === 'EMERGENCY ONLY' ? (
                        <div className="bg-red-100 p-2.5 rounded-lg">
                          <i className="fas fa-ambulance text-red-600"></i>
                        </div>
                      ) : (
                        <div className="bg-blue-100 p-2.5 rounded-lg">
                          <i className="fas fa-calendar-alt text-blue-600"></i>
                        </div>
                      )}
                      <span className="text-gray-800 font-bold text-base">{day}</span>
                    </div>
                    <span className={`font-bold text-sm px-4 py-2 rounded-lg transition-all ${
                      time === 'EMERGENCY ONLY' 
                        ? 'bg-red-100 text-red-700 font-black tracking-wide' 
                        : 'bg-blue-100 text-blue-700 font-bold'
                    }`}>
                      {time}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-4 px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-lg rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 transform flex items-center justify-center gap-3 group"
              onClick={() => {
                setEditScheduleData(hospital.schedule)
                setIsEditingSchedule(true)
              }}>
              <i className="fas fa-edit text-xl group-hover:rotate-12 transition-transform duration-300"></i>
              <span>Edit Schedule</span>
              <i className="fas fa-arrow-right text-sm ml-1 group-hover:translate-x-1 transition-transform duration-300"></i>
            </button>
          </div>
        </div>

        {/* Departments Full List Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-gray-200">
            <h2 className="font-bold text-2xl text-gray-900 flex items-center gap-3">
              <i className="fas fa-network-wired text-blue-600 text-2xl"></i>
              All Departments
            </h2>
            <p className="text-sm text-gray-600 mt-1">Manage hospital departments and units</p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {hospital.departments?.map((dept) => (
                <div key={dept.id} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-12 h-12 ${dept.iconBg} rounded-xl flex items-center justify-center shadow-md`}>
                      <i className={`${dept.icon} text-white text-lg`}></i>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      dept.status === 'HIGH PRIORITY' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {dept.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{dept.name}</h3>
                  <p className="text-xs text-gray-600 mb-3">{dept.description}</p>
                  <button 
                    onClick={() => { setSelectedDepartment(dept); setShowDepartmentModal(true); }}
                    className="text-blue-600 hover:text-blue-800 font-semibold text-sm transition-colors flex items-center gap-1"
                  >
                    Manage <i className="fas fa-arrow-right text-xs"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Current Plan Card */}
        <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <i className="fas fa-crown text-white font-bold text-sm sm:text-base"></i>
                </div>
                <div>
                  <h3 className="font-bold text-lg sm:text-xl text-gray-800">Current Plan</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Your subscription</p>
                </div>
              </div>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                {hospital.currentPlan?.status || 'Active'}
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-5">
            <div className="text-center pb-4 border-b border-gray-200">
              <h4 className="text-sm sm:text-base font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                {hospital.currentPlan?.type || 'Premium'}
              </h4>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl sm:text-4xl font-bold text-blue-600">{hospital.currentPlan?.price || '₹2,250'}</span>
                <span className="text-gray-600 text-sm">{hospital.currentPlan?.frequency || '/month'}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">{hospital.currentPlan?.yearlyPrice || '₹27,000/year'}</p>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Includes:</p>
              {hospital.currentPlan?.features?.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className="fas fa-check text-green-600 text-xs"></i>
                  </div>
                  <span className="text-sm text-gray-700 leading-relaxed">{feature}</span>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-200">
              <p className="text-xs text-gray-600 mb-1">Renewal Date</p>
              <p className="text-sm sm:text-base font-semibold text-blue-600">
                {new Date(hospital.currentPlan?.renewalDate).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button 
                onClick={() => setShowUpgradeModal(true)}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 sm:py-2.5 rounded-lg hover:from-blue-600 hover:to-blue-700 font-semibold transition-all shadow-md hover:shadow-lg text-sm sm:text-base"
              >
                <i className="fas fa-arrow-up-right mr-2"></i>Upgrade
              </button>
              <button 
                onClick={() => setShowPlanDetailsModal(true)}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 sm:py-2.5 rounded-lg hover:bg-gray-200 font-semibold transition-all text-sm sm:text-base"
              >
                <i className="fas fa-info-circle mr-2"></i>Details
              </button>
            </div>
          </div>
        </div>

        {/* Payment History Section */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <i className="fas fa-receipt text-white font-bold text-sm sm:text-base"></i>
                </div>
                <div>
                  <h3 className="font-bold text-lg sm:text-xl text-gray-800">Payment History</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Recent transactions</p>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200 hidden sm:table-header-group">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Date</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Description</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Amount</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Method</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Status</th>
                  <th className="px-4 sm:px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-gray-200">
                {hospital.paymentHistory?.map((payment, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors sm:table-row flex flex-col gap-3 p-4 sm:p-0">
                    <td className="sm:px-4 sm:py-4">
                      <span className="sm:hidden text-xs font-semibold text-gray-600 block mb-1">Date</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {new Date(payment.date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </td>
                    <td className="sm:px-4 sm:py-4">
                      <span className="sm:hidden text-xs font-semibold text-gray-600 block mb-1">Description</span>
                      <span className="text-sm text-gray-700">{payment.description}</span>
                    </td>
                    <td className="sm:px-4 sm:py-4">
                      <span className="sm:hidden text-xs font-semibold text-gray-600 block mb-1">Amount</span>
                      <span className="text-sm font-bold text-green-600">{payment.amount}</span>
                    </td>
                    <td className="sm:px-4 sm:py-4">
                      <span className="sm:hidden text-xs font-semibold text-gray-600 block mb-1">Method</span>
                      <span className="text-sm text-gray-700 inline-flex items-center gap-1">
                        {payment.method === 'Credit Card' && <i className="fas fa-credit-card text-blue-500"></i>}
                        {payment.method === 'Bank Transfer' && <i className="fas fa-university text-purple-500"></i>}
                        {payment.method === 'UPI' && <i className="fas fa-mobile text-orange-500"></i>}
                        {payment.method}
                      </span>
                    </td>
                    <td className="sm:px-4 sm:py-4">
                      <span className="sm:hidden text-xs font-semibold text-gray-600 block mb-1">Status</span>
                      <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                        <i className="fas fa-check-circle mr-1"></i>{payment.status}
                      </span>
                    </td>
                    <td className="sm:px-4 sm:py-4 sm:text-center">
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <button className="w-full sm:w-auto text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors hover:underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                          onClick={() => handleDownloadInvoice(payment)} disabled={downloadingInvoice === payment.id}>
                          {downloadingInvoice === payment.id ? (
                            <i className="fas fa-spinner fa-spin mr-1"></i>
                          ) : (
                            <i className="fas fa-file-pdf mr-1"></i>
                          )}
                        </button>
                        <button className="w-full sm:w-auto text-gray-600 hover:text-gray-800 text-sm font-semibold transition-colors hover:underline flex items-center justify-center"
                          onClick={() => handlePrintInvoice(payment)}>
                          <i className="fas fa-print mr-1"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-gray-50 px-4 sm:px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-xs sm:text-sm text-gray-600">
              Showing {hospital.paymentHistory?.length || 0} transactions
            </p>
            <button className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-semibold transition-colors">
              View All <i className="fas fa-arrow-right ml-1"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Manage Insurance Modal */}
      {showInsuranceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-40 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-scale max-h-96 sm:max-h-none overflow-y-auto">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 flex items-center gap-3">
              <div className="w-12 h-12 bg-green-400 rounded-full flex items-center justify-center">
                <i className="fas fa-shield-alt text-white text-lg"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Add Insurance Partner</h3>
                <p className="text-green-100 text-sm">Expand coverage options</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Insurance Partner Name</label>
                <input className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 font-medium"
                  type="text"
                  value={newInsurance}
                  onChange={(e) => setNewInsurance(e.target.value)}
                  placeholder="e.g., MediCare Plus"
                />
              </div>
            </div>
            <div className="bg-gray-50 p-6 flex gap-3 border-t">
              <button className="flex-1 px-4 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
                onClick={() => {
                  setShowInsuranceModal(false)
                  setNewInsurance('')
                }}>
                Cancel
              </button>
              <button className="flex-1 px-4 py-3 text-white bg-gradient-to-r from-green-500 to-green-600 rounded-lg hover:from-green-600 hover:to-green-700 font-semibold transition-all shadow-lg hover:shadow-xl"
                onClick={handleManageInsurance}>
                <i className="fas fa-check mr-2"></i>Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Hours Modal */}
      {showHoursModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-scale">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-400 rounded-full flex items-center justify-center">
                <i className="fas fa-clock text-white text-lg"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Update Operating Hours</h3>
                <p className="text-purple-100 text-sm">Set your business hours</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Operating Hours</label>
                <input className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 font-medium"
                  placeholder="e.g., 24/7 Emergency, OPD: 8AM-8PM" type="text" value={newHours}
                  onChange={(e) => setNewHours(e.target.value)}
                />
              </div>
            </div>
            <div className="bg-gray-50 p-6 flex gap-3 border-t">
              <button className="flex-1 px-4 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
                onClick={() => setShowHoursModal(false)}>
                Cancel
              </button>
              <button className="flex-1 px-4 py-3 text-white bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg hover:from-purple-600 hover:to-purple-700 font-semibold transition-all shadow-lg hover:shadow-xl"
                onClick={handleUpdateHours}>
                <i className="fas fa-check mr-2"></i>Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Edit Modal */}
      {isEditingPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <i className="fas fa-camera text-2xl"></i>
                <h3 className="text-2xl font-bold">Edit Hospital Photo</h3>
              </div>
              <button className="text-white hover:text-blue-100 transition-colors text-xl" onClick={handleCancelPhotoEdit}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <img className="w-40 h-40 rounded-2xl object-cover shadow-lg border-4 border-blue-100" 
                    src={tempPhotoPreview} alt="Preview" 
                  />
                </div>
                <p className="text-gray-700 text-sm font-medium text-center text-gray-600">Current hospital photo</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Choose New Photo</label>
                <input className="w-full px-4 py-3 border-2 border-dashed border-blue-300 rounded-lg focus:outline-none focus:border-blue-600 bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  type="file" accept="image/*" onChange={handlePhotoChange}
                />
                <p className="text-xs text-gray-600 mt-2">Supported formats: JPG, PNG. Maximum size: 5MB</p>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 rounded p-3">
                <p className="text-blue-800 text-sm font-medium">
                  <i className="fas fa-info-circle text-blue-600 mr-2"></i>
                  Photo will be updated across all hospital dashboards
                </p>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold transition-colors duration-300"
                onClick={handleCancelPhotoEdit}>
                Cancel
              </button>
              <button className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-semibold transition-all shadow-md hover:shadow-lg"
                onClick={handleSavePhoto}>
                Save Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Schedule Modal */}
      {isEditingSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <i className="fas fa-clock text-2xl"></i>
                <h3 className="text-2xl font-bold">Edit Operating Hours</h3>
              </div>
              <button className="text-white hover:text-orange-100 transition-colors"
                onClick={handleCancelScheduleEdit}>
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Time Zone</label>
                <p className="text-gray-700 font-medium">{hospital.timeZone}</p>
              </div>
              <div className="space-y-4">
                {Object.entries(editScheduleData).map(([day, time]) => (
                  <div key={day} className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">{day}</label>
                    {day === 'Sunday' ? (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <input className="w-4 h-4 text-orange-500 rounded focus:ring-2 focus:ring-orange-500 cursor-pointer"
                          type="checkbox" checked={time === 'EMERGENCY ONLY'}
                          onChange={(e) => {
                            handleScheduleChange(day, e.target.checked ? 'EMERGENCY ONLY' : '24:00 hours')
                          }}
                        />
                        <label className="text-gray-700 font-medium cursor-pointer">Emergency Only</label>
                      </div>
                    ) : (
                      <input className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 transition-colors font-medium"
                        type="text" placeholder="HH:MM - HH:MM" value={time}
                        onChange={(e) => handleScheduleChange(day, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                  onClick={handleCancelScheduleEdit}>
                  Cancel
                </button>
                <button className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 font-semibold transition-all shadow-md hover:shadow-lg"
                  onClick={handleSaveSchedule}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plan Details Modal */}
      {showPlanDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-40 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full transform transition-all animate-scale">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center">
                  <i className="fas fa-info-circle text-white text-lg"></i>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Plan Details</h3>
                  <p className="text-blue-100 text-sm">Your current active subscription</p>
                </div>
              </div>
              <button className="text-white hover:text-gray-200 transition-colors" onClick={() => setShowPlanDetailsModal(false)}>
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <div className="p-6">
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600 font-semibold uppercase tracking-wider text-sm">Plan</span>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">{hospital.currentPlan?.type || 'PREMIUM'}</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600 font-semibold uppercase tracking-wider text-sm">Billing Cycle</span>
                  <span className="text-gray-900 font-bold">{hospital.currentPlan?.frequency === '/month' ? 'Monthly' : 'Yearly'}</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600 font-semibold uppercase tracking-wider text-sm">Amount</span>
                  <span className="text-gray-900 font-bold">{hospital.currentPlan?.price || '₹2,250'}</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600 font-semibold uppercase tracking-wider text-sm">Next Renewal</span>
                  <span className="text-gray-900 font-bold">{new Date(hospital.currentPlan?.renewalDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-semibold uppercase tracking-wider text-sm">Status</span>
                  <span className="text-green-600 font-bold"><i className="fas fa-check-circle mr-1"></i> {hospital.currentPlan?.status || 'Active'}</span>
                </div>
              </div>
              <h4 className="font-bold text-gray-900 mb-3 text-lg">Plan Features Included:</h4>
              <ul className="space-y-3">
                {hospital.currentPlan?.features?.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <i className="fas fa-check text-green-500 mt-1"></i>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gray-50 p-6 flex gap-3 border-t rounded-b-2xl">
              <button className="w-full px-4 py-3 text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg hover:from-blue-600 hover:to-blue-700 font-semibold transition-colors shadow-md" onClick={() => setShowPlanDetailsModal(false)}>
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Plan Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-40 flex items-center justify-center p-3 sm:p-4 animate-fade-in overflow-y-auto" style={{ zIndex: 100 }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full transform transition-all animate-scale my-auto relative">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <i className="fas fa-rocket text-white text-lg"></i>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Upgrade Subscription</h3>
                  <p className="text-indigo-100 text-sm">Choose the plan that fits your hospital's growth</p>
                </div>
              </div>
              <button className="text-white hover:text-gray-200 transition-colors" onClick={() => setShowUpgradeModal(false)}>
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            <div className="p-6 sm:p-8 bg-gray-50 grid grid-cols-1 md:grid-cols-2 gap-6 rounded-b-2xl">
              {/* Current Plan Column */}
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 relative">
                <div className="absolute top-0 right-0 bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">CURRENT</div>
                <h4 className="text-2xl font-bold text-gray-900 mb-2">Premium</h4>
                <div className="flex items-baseline mb-6">
                  <span className="text-4xl font-black text-gray-900">₹2,250</span>
                  <span className="text-gray-500 font-medium ml-2">/month</span>
                </div>
                <button className="w-full py-3 rounded-xl bg-gray-100 text-gray-500 font-bold mb-6 cursor-not-allowed">Active Plan</button>
                <ul className="space-y-4">
                  <li className="flex gap-3 text-gray-600"><i className="fas fa-check text-green-500 mt-1"></i> Up to 5 doctors</li>
                  <li className="flex gap-3 text-gray-600"><i className="fas fa-check text-green-500 mt-1"></i> Up to 11 patients</li>
                  <li className="flex gap-3 text-gray-600"><i className="fas fa-check text-green-500 mt-1"></i> 30 appointments / month</li>
                  <li className="flex gap-3 text-gray-600"><i className="fas fa-check text-green-500 mt-1"></i> Analytics Dashboard</li>
                  <li className="flex gap-3 text-gray-400"><i className="fas fa-times text-red-300 mt-1"></i> No Priority Support</li>
                  <li className="flex gap-3 text-gray-400"><i className="fas fa-times text-red-300 mt-1"></i> No Custom Integrations</li>
                </ul>
              </div>

              {/* Upgrade Column */}
              <div className="bg-white border-2 border-indigo-500 rounded-2xl p-6 relative shadow-lg transform md:-translate-y-2 hover:shadow-xl transition-shadow">
                <div className="absolute top-0 right-0 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl shadow-sm">RECOMMENDED</div>
                <h4 className="text-2xl font-bold text-indigo-700 mb-2">Enterprise</h4>
                <div className="flex items-baseline mb-6">
                  <span className="text-4xl font-black text-gray-900">₹9,999</span>
                  <span className="text-gray-500 font-medium ml-2">/month</span>
                </div>
                <button className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold mb-6 hover:shadow-lg hover:from-indigo-600 hover:to-purple-700 transition-all flex justify-center items-center gap-2" onClick={() => alert("Redirecting to sales portal...")}>
                  <span>Contact Sales to Upgrade</span>
                  <i className="fas fa-arrow-right"></i>
                </button>
                <ul className="space-y-4">
                  <li className="flex gap-3 text-gray-800 font-medium"><i className="fas fa-check text-indigo-500 mt-1"></i> Unlimited doctors</li>
                  <li className="flex gap-3 text-gray-800 font-medium"><i className="fas fa-check text-indigo-500 mt-1"></i> Unlimited patients</li>
                  <li className="flex gap-3 text-gray-800 font-medium"><i className="fas fa-check text-indigo-500 mt-1"></i> Unlimited appointments</li>
                  <li className="flex gap-3 text-gray-800 font-medium"><i className="fas fa-check text-indigo-500 mt-1"></i> Advanced AI Analytics</li>
                  <li className="flex gap-3 text-gray-800 font-medium"><i className="fas fa-check text-indigo-500 mt-1"></i> 24/7 Priority Support</li>
                  <li className="flex gap-3 text-gray-800 font-medium"><i className="fas fa-check text-indigo-500 mt-1"></i> Custom API Integrations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Department Management Modal */}
      {showDepartmentModal && selectedDepartment && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-40 flex items-center justify-center p-3 sm:p-4 animate-fade-in" style={{ zIndex: 100 }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full transform transition-all animate-scale overflow-hidden">
            <div className={`p-6 flex items-center justify-between ${selectedDepartment.iconBg} text-white`}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white border-opacity-30">
                  <i className={`${selectedDepartment.icon} text-2xl text-white`}></i>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedDepartment.name}</h3>
                  <p className="text-white text-opacity-80 text-sm font-medium">{selectedDepartment.status === 'HIGH PRIORITY' ? 'Critical Care Unit' : 'Standard Department'}</p>
                </div>
              </div>
              <button className="text-white hover:text-gray-200 transition-colors bg-black bg-opacity-10 w-8 h-8 rounded-full flex items-center justify-center" onClick={() => setShowDepartmentModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-6">
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 mb-6 shadow-inner">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                  <span className="text-gray-600 font-semibold uppercase tracking-wider text-xs">Department ID</span>
                  <span className="text-gray-900 font-bold bg-gray-200 px-3 py-1 rounded-md text-sm">DEP-{selectedDepartment.id.toString().padStart(3, '0')}</span>
                </div>
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <span className="text-gray-600 font-semibold uppercase tracking-wider text-xs block mb-2">Description</span>
                  <p className="text-gray-800 font-medium text-sm leading-relaxed">{selectedDepartment.description}</p>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-semibold uppercase tracking-wider text-xs">Current Status</span>
                  <span className={`font-bold px-3 py-1.5 rounded-lg text-xs tracking-wide shadow-sm ${
                    selectedDepartment.status === 'HIGH PRIORITY' ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-green-100 text-green-700 border border-green-200'
                  }`}>
                    {selectedDepartment.status === 'HIGH PRIORITY' ? (
                      <><i className="fas fa-exclamation-triangle mr-1.5"></i>HIGH PRIORITY</>
                    ) : (
                      <><i className="fas fa-check-circle mr-1.5"></i>ACTIVE</>
                    )}
                  </span>
                </div>
              </div>
              <h4 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-3">
                <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-gray-700 hover:text-blue-700 group">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <i className="fas fa-user-md"></i>
                  </div>
                  <span className="text-sm font-semibold">Staff</span>
                </button>
                <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all text-gray-700 hover:text-purple-700 group">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <i className="fas fa-chart-line"></i>
                  </div>
                  <span className="text-sm font-semibold">Analytics</span>
                </button>
                <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all text-gray-700 hover:text-indigo-700 group">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <i className="fas fa-cog"></i>
                  </div>
                  <span className="text-sm font-semibold">Settings</span>
                </button>
                <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-red-200 hover:border-red-300 hover:bg-red-50 transition-all text-red-600 group">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                    <i className="fas fa-power-off"></i>
                  </div>
                  <span className="text-sm font-semibold">Deactivate</span>
                </button>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
              <button className="px-6 py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                onClick={() => setShowDepartmentModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HospitalProfile