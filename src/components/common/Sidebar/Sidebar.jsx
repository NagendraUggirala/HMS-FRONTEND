// src/components/common/Sidebar/Sidebar.jsx
import React from 'react'
import { useAuth } from '../../../hooks/useAuth'

const Sidebar = ({ activePage, onPageChange, isOpen = false, onClose }) => {
  const { user } = useAuth()
  // Get role-based title
  const getSidebarTitle = () => {
    switch (user?.role) {
      case 'DOCTOR': return 'Doctor Portal'
      case 'ADMIN': return 'Hospital Admin'
      case 'NURSE': return 'Nurse Dashboard'
      case 'RECEPTIONIST': return 'Reception Desk'
      case 'SUPER_ADMIN': return 'Super Admin'
      case 'PATIENT': return 'Patient Portal'
      case 'LAB': return 'Laboratory Portal'
      case 'PHARMACY': return 'Pharmacy Portal'
      case 'TELEMEDICINE': return 'Telemedicine Portal'
      default: return 'Dashboard'
    }
  }

  const sidebarTitle = getSidebarTitle()
  const labMenu = [
    { id: 'lab-dashboard', label: 'Lab Dashboard', icon: 'fas fa-flask' },
    { id: 'test-registration', label: 'Test Requests', icon: 'fas fa-vial' },
    { id: 'result-access', label: 'Result Uploads', icon: 'fas fa-shield-alt' },
    { id: 'test-history', label: 'Test History', icon: 'fas fa-history' },
    //{ id: 'critical-results', label: 'Critical Results', icon: 'fas fa-exclamation-circle' },
    //{ id: 'sample-tracking', label: 'Sample Tracking', icon: 'fas fa-qrcode' },
    //{ id: 'report-generation', label: 'Report Generation', icon: 'fas fa-file-medical' },
    { id: 'test-catalogue', label: 'Test Catalogue', icon: 'fas fa-book-medical' },
    { id: 'equipment-tracking', label: 'Equipment Tracking', icon: 'fas fa-microscope' },
    { id: 'quality-control', label: 'Quality Control', icon: 'fas fa-chart-line' },
    { id: 'profile', label: 'Lab Profile', icon: 'fas fa-user-md' }, { id: 'raise-ticket', label: 'Raise Ticket', icon: 'fa-envelope-open-text' }
  ]

  const doctorMenu = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: 'fa-chart-line' },
    //{ id: 'appointments', label: 'Appointments', icon: 'fa-calendar-alt' },
    { id: 'appointment-tracking', label: 'Appointment Tracking', icon: 'fa-route' },
    { id: 'schedule', label: 'Schedule Management', icon: 'fa-calendar-week' },
    { id: 'patients', label: 'Patient Records', icon: 'fa-user-injured' },
    { id: 'treatment-plans', label: 'Treatment Plans', icon: 'fa-notes-medical' },
    { id: 'prescriptions', label: 'Prescriptions', icon: 'fa-prescription-bottle-medical' },
    { id: 'labs', label: 'Lab Results', icon: 'fa-flask' },
    { id: 'inpatient', label: 'Inpatient Visits', icon: 'fa-procedures' },
    //{ id: 'discharge', label: 'Discharge Summary', icon: 'fa-file-contract' },
    { id: 'messages', label: 'Messaging', icon: 'fa-comments' },
    { id: 'reports-analytics', label: 'Reports & Analytics', icon: 'fa-chart-pie' },
    { id: 'profile', label: 'My Profile', icon: 'fa-user-md' },
    { id: 'raise-ticket', label: 'Raise Ticket', icon: 'fa-envelope-open-text' }
  ]

  const adminMenu = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: 'fa-chart-line' },
    { id: 'profile', label: 'Hospital Profile', icon: 'fa-hospital' },
    { id: 'doctors', label: 'Doctor Management', icon: 'fa-user-md' },
    { id: 'staff', label: 'Staff Management', icon: 'fa-users' },
    { id: 'departments', label: 'Department Management', icon: 'fa-building' },
    { id: 'assign-departments', label: 'Department Assignment', icon: 'fa-briefcase' },
    { id: 'appointments', label: 'Appointment Management', icon: 'fa-clipboard-list' },
    { id: 'billing', label: 'Billing & Finance', icon: 'fa-money-bill-wave' },
    { id: 'inpatient', label: 'Inpatient Management', icon: 'fa-bed' },
    { id: 'pharmacy', label: 'Pharmacy Management', icon: 'fa-prescription-bottle-alt' },
    { id: 'lab', label: 'Lab Management', icon: 'fa-microscope' },
    { id: 'reports', label: 'Reports', icon: 'fa-chart-bar' },
    { id: 'audit', label: 'Audit Logs', icon: 'fa-clipboard-check' },
    { id: 'settings', label: 'Settings', icon: 'fa-cog' }, { id: 'raise-ticket', label: 'Raise Ticket', icon: 'fa-envelope-open-text' }
  ]

  const nurseMenu = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line' },
    { id: 'patients', label: 'Assigned Patients', icon: 'fa-users' },
    { id: 'vitals', label: 'Vitals Monitoring', icon: 'fa-heartbeat' },
    { id: 'medications', label: 'Medication Schedule', icon: 'fa-pills' },
    { id: 'wards', label: 'Bed Management', icon: 'fa-bed' },
    { id: 'labs', label: 'Lab Tests & Upload', icon: 'fa-vial' },
    { id: 'notes', label: 'Nursing Notes', icon: 'fa-notes-medical' },
    { id: 'discharge', label: 'Discharge Summary', icon: 'fa-file-medical' },
    { id: 'profile', label: 'My Profile', icon: 'fa-user-nurse' }, { id: 'raise-ticket', label: 'Raise Ticket', icon: 'fa-envelope-open-text' }
  ]

  const receptionistMenu = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: 'fa-chart-line' },
    { id: 'registration', label: 'Patient Registration', icon: 'fa-user-plus' },
    { id: 'records', label: 'Patient Records', icon: 'fa-folder' },
    { id: 'appointments', label: 'Appointment Scheduling', icon: 'fa-calendar-check' },
    { id: "Doctors", label: "Doctors", icon: "fa-user-md" },
    { id: "Departments", label: "Departments", icon: "fa-building" },
    { id: 'opd', label: 'OPD Management', icon: 'fas fa-stethoscope' },
    { id: 'ipd', label: 'IPD Management', icon: 'fas fa-procedures' },
    { id: 'documents', label: 'Document Management', icon: 'fas fa-file-upload' },
    { id: 'billing', label: 'Billing', icon: 'fa-receipt' },
    { id: 'discharge', label: 'Discharge Summary', icon: 'fas fa-file-contract' },
    { id: 'profile', label: 'My Profile', icon: 'fa-user-tie' },
    { id: 'raise-ticket', label: 'Raise Ticket', icon: 'fa-envelope-open-text' }
  ]

  const superAdminMenu = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: 'fa-chart-line' },
    { id: 'hospitals', label: 'Hospital Management', icon: 'fa-hospital-alt' },
    { id: 'hospital-admins', label: 'Hospital Administrator Management', icon: 'fa-user-shield' },
    { id: 'subscriptions', label: 'Subscriptions & Billing', icon: 'fa-credit-card' },
    { id: 'support', label: 'Support Management', icon: 'fa-headset' },
    { id: 'settings', label: 'Platform Settings', icon: 'fa-sliders-h' },
    { id: 'reports', label: 'Reports & Analytics', icon: 'fa-chart-pie' },
    { id: 'analytics', label: 'Analytics & Monitoring', icon: 'fa-chart-line' },
    { id: 'notifications', label: 'Notifications', icon: 'fa-bell' },
    { id: 'profile', label: 'My Profile', icon: 'fa-user-circle' },
  ]

  // NEW: Patient Menu
  const patientMenu = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: 'fa-chart-line' },
    { id: 'appointments', label: 'My Appointments', icon: 'fa-calendar-check' },
    { id: 'records', label: 'Medical Records', icon: 'fa-file-medical' },
    { id: 'prescriptions', label: 'Prescriptions', icon: 'fa-prescription-bottle-alt' },
    { id: 'tests', label: 'Test Results', icon: 'fa-flask' },
    { id: 'ipd', label: 'IPD Management', icon: 'fas fa-procedures' },
    { id: 'billing', label: 'Billing & Payments', icon: 'fa-credit-card' },
    { id: 'messages', label: 'Messages', icon: 'fa-comments' },
    { id: 'documentstorage', label: 'Document Storage', icon: 'fa-folder-open' },
    { id: 'discharge', label: 'Discharge Summary', icon: 'fa-file-contract' },
    { id: 'profile', label: 'My Profile', icon: 'fa-user' }
  ]

  const pharmacyMenu = [
    { id: "dashboard", label: "Dashboard Overview", icon: "fas fa-tachometer-alt" },
    { id: "patientmedicines", label: "Patient Prescriptions", icon: "fas fa-prescription-bottle-alt" },
    { id: "inventory", label: "Inventory Management", icon: "fas fa-boxes" },
    { id: "purchaseorders", label: "Purchase Orders", icon: "fas fa-shopping-cart" },
    { id: "salestracking", label: "Sales Tracking", icon: "fa-chart-line" },
    { id: "expiryalerts", label: "Expiry Alerts", icon: "fas fa-exclamation-triangle" },
    { id: "suppliermanagement", label: "Supplier Management", icon: "fas fa-truck" },
    { id: "medicinedatabase", label: "Medicine Database", icon: "fas fa-database" },
    { id: "stock", label: "Stock", icon: "fas fa-cubes" },
    { id: "return", label: "Return", icon: "fas fa-undo" },
    { id: "grn", label: "GRN", icon: "fas fa-file-invoice" },
    { id: "report", label: "Report", icon: "fas fa-chart-bar" },
    { id: "settings", label: "Settings", icon: "fas fa-cog" },
    { id: 'raise-ticket', label: 'Raise Ticket', icon: 'fa-envelope-open-text' }
  ];

  const teleMedicineMenu = [
    { id: "dashboard", label: "Dashboard", icon: "fa-solid fa-chart-line" },
    { id: "appointments", label: "My Appointments", icon: "fa-solid fa-calendar-check" },
    { id: "prescriptions", label: "Prescriptions", icon: "fa-solid fa-file-prescription" },
    { id: "remotepatientmonitoring", label: "Remote Patient Monitoring", icon: "fa-solid fa-heart-pulse" },
    { id: "labresults", label: "Lab Results", icon: "fa-flask" },
    { id: "patients", label: "Patient Records", icon: "fa-user-injured" },
    { id: "inpatient", label: "Inpatient Visits", icon: "fa-procedures" },
    { id: "messages", label: "Messaging", icon: "fa-comments" },
    { id: "doctoroverview", label: "Doctor Overview", icon: "fa-solid fa-clipboard-list" },
    { id: "doctorprofile", label: "Doctor Profile", icon: "fa-solid fa-user-doctor" },
    { id: 'raise-ticket', label: 'Raise Ticket', icon: 'fa-envelope-open-text' }
  ];

  const getMenuItems = () => {
    switch (user?.role) {
      case 'ADMIN': return adminMenu
      case 'NURSE': return nurseMenu
      case 'RECEPTIONIST': return receptionistMenu
      case 'SUPER_ADMIN': return superAdminMenu
      case 'PATIENT': return patientMenu
      case 'LAB': return labMenu
      case "PHARMACY":
        return pharmacyMenu;
      case "TELEMEDICINE":
        return teleMedicineMenu;
      default: return doctorMenu
    }
  }

  const menuItems = getMenuItems()
  const handleItemClick = (itemId) => {
    onPageChange(itemId)
    onClose?.()
  }

  return (
    <>
      {/* Mobile Sidebar */}
      <aside className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r transform transition-transform duration-300 z-40 md:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'
        }`} >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 p-4 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-gray-700 font-semibold text-lg">{sidebarTitle}</h2>
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={onClose}
                aria-label="Close menu" >
                <i className="fas fa-times text-gray-600 text-lg"></i>
              </button>
            </div>
          </div>

          {/* Scrollable Navigation */}
          <nav className="flex-1 overflow-y-auto py-2">
            <div className="space-y-1 px-2">
              {menuItems.map(item => (
                <button key={item.id} onClick={() => handleItemClick(item.id)}
                  className={`w-full text-left p-3 rounded-lg flex items-center transition-all duration-200 ${activePage === item.id
                    ? 'bg-blue-100 text-blue-700 font-semibold border-l-4 border-l-blue-500'
                    : 'hover:bg-gray-50 text-gray-700'
                    }`} >
                  <span className={`text-lg mr-3 w-6 text-center ${activePage === item.id ? 'text-blue-600' : 'text-blue-500'
                    }`}>
                    <i className={`fas ${item.icon}`}></i>
                  </span>
                  <span className="text-sm">{item.label}</span>
                </button>
              ))}
            </div>
          </nav>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-[270px] bg-white border-r h-[calc(100vh-4rem)] sticky top-16">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 p-4 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-gray-700 font-semibold text-lg">{sidebarTitle}</h2>
              <button
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Close sidebar"
                onClick={onClose} >
                <i className="fas fa-times text-gray-600 text-lg"></i>
              </button>
            </div>
          </div>

          {/* Scrollable Navigation */}
          <nav className="flex-1 overflow-y-auto py-2">
            <div className="space-y-1 px-2">
              {menuItems.map(item => (
                <button key={item.id} onClick={() => onPageChange(item.id)}
                  className={`w-full text-left p-3 rounded-lg flex items-center transition-all duration-200 ${activePage === item.id
                    ? 'bg-blue-100 text-blue-700 font-semibold border-l-4 border-l-blue-500'
                    : 'hover:bg-gray-50 text-gray-700'
                    }`} >
                  <span className={`text-lg mr-3 w-6 text-center ${activePage === item.id ? 'text-blue-600' : 'text-blue-500'
                    }`}>
                    <i className={`fas ${item.icon}`}></i>
                  </span>
                  <span className="text-sm">{item.label}</span>
                </button>
              ))}
            </div>
          </nav>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" onClick={onClose} />
      )}
    </>
  )
}

export default Sidebar