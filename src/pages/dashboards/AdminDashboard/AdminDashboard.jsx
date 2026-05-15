// src/pages/dashboards/AdminDashboard/AdminDashboard.jsx
import React, { useState, useEffect } from 'react'
import Header from '../../../components/common/Header/Header'
import Sidebar from '../../../components/common/Sidebar/Sidebar'
import AdminOverview from './pages/AdminOverview'
import HospitalProfile from './pages/HospitalProfile'
import DoctorManagement from './pages/DoctorManagement'
import StaffManagement from './pages/StaffManagement'
import DepartmentManagement from './pages/DepartmentManagement'
import AssignDepartment from './pages/DepartmentAssignment'
import AppointmentManagement from './pages/AppointmentManagement'
import BillingFinance from './pages/BillingFinance'
import InpatientManagement from './pages/InpatientManagement'
import PharmacyManagement from './pages/PharmacyManagement'
import LabManagement from './pages/LabManagement'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Raiseticket from './pages/Raiseticket'
import AuditLogs from './pages/AuditLogs'

const AdminDashboard = () => {
  const [activePage, setActivePage] = useState('dashboard')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true)

  // Add event listener for header navigation
  useEffect(() => {
    const handleDashboardNavigation = (event) => {
      const { page } = event.detail;
      setActivePage(page);
      // Close mobile sidebar if open
      if (isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener('dashboard-navigation', handleDashboardNavigation);

    return () => {
      window.removeEventListener('dashboard-navigation', handleDashboardNavigation);
    };
  }, [isMobileSidebarOpen]);

  // Handle page changes from Sidebar
  const handlePageChange = (page) => {
    setActivePage(page)
    // Close mobile sidebar if open
    if (isMobileSidebarOpen) {
      setIsMobileSidebarOpen(false)
    }
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <AdminOverview setActivePage={handlePageChange} />
      case 'profile':
        return <HospitalProfile />
      case 'doctors':
        return <DoctorManagement />
      case 'staff':
        return <StaffManagement />
      case 'departments':
        return <DepartmentManagement />
       case 'assign-departments':
         return <AssignDepartment />
      case 'appointments':
        return <AppointmentManagement />
      case 'billing':
        return <BillingFinance />
      case 'inpatient':
        return <InpatientManagement />
      case 'pharmacy':
        return <PharmacyManagement />
      case 'lab':
        return <LabManagement />
      case 'reports':
        return <Reports />
      case 'settings':
        return <Settings />
      case 'audit':
        return <AuditLogs />
      case 'raise-ticket':
        return <Raiseticket />

      default:
        return <AdminOverview setActivePage={handlePageChange} />
    }
  }

  // Update the Sidebar component call to use handlePageChange
  const handleMobileMenuToggle = () => {
    setIsMobileSidebarOpen(true)
  }

  const handleMobileSidebarClose = () => {
    setIsMobileSidebarOpen(false)
  }

  const handleDesktopSidebarToggle = () => {
    setIsDesktopSidebarOpen(!isDesktopSidebarOpen)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Header
          onMenuToggle={handleMobileMenuToggle}
          onSidebarToggle={handleDesktopSidebarToggle}
          isSidebarOpen={isDesktopSidebarOpen}
        />
      </div>

      {/* Main Layout */}
      <div className="flex pt-16 min-h-screen">
        {/* Desktop Sidebar - Fixed position */}
        <div className={`hidden md:block fixed top-16 left-0 bottom-0 z-40 transition-transform duration-300 ${isDesktopSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
          <Sidebar
            activePage={activePage}
            onPageChange={handlePageChange}
            isOpen={isDesktopSidebarOpen}
            onClose={() => setIsDesktopSidebarOpen(false)}
          />
        </div>

        {/* Mobile Sidebar - Fixed position */}
        <div className={`md:hidden fixed top-0 left-0 bottom-0 z-40 transition-transform duration-300 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
          <Sidebar
            activePage={activePage}
            onPageChange={handlePageChange}
            isOpen={isMobileSidebarOpen}
            onClose={handleMobileSidebarClose}
          />
        </div>

        {/* Main Content */}
        <main className={`flex-1 min-h-[calc(100vh-4rem)] overflow-auto transition-all duration-300 ${isDesktopSidebarOpen ? 'md:ml-[270px]' : 'md:ml-0'
          }`}>
          <div className="p-2 pt-5 w-full">
            {renderPage()}
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={handleMobileSidebarClose}
        />
      )}
    </div>
  )
}

export default AdminDashboard