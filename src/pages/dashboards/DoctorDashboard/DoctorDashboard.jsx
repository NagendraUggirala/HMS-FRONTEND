
import React, { useState, useEffect } from 'react'
import Header from '../../../components/common/Header/Header'
import Sidebar from '../../../components/common/Sidebar/Sidebar'
import DoctorOverview from './pages/DoctorOverview'
import Appointments from './pages/Appointments'
import PatientRecords from './pages/PatientRecords'
import Prescriptions from './pages/Prescriptions'
import LabResults from './pages/LabResults'
import InpatientVisits from './pages/InpatientVisits'
import Messaging from './pages/Messaging'
import DoctorProfile from './pages/DoctorProfile'
import RaiseticketDoctor from './pages/RaiseticketDoctor'
import ScheduleManagement from './pages/ScheduleManagement'
import AppointmentTracking from './pages/AppointmentTracking'
import ReportsAndAnalytics from './pages/ReportsAndAnalytics'
import TreatmentPlans from './pages/TreatmentPlans'

const DoctorDashboard = () => {
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

  // In DoctorDashboard component, modify the renderPage function:
  const renderPage = () => {
    const pageProps = {
      onPageChange: handlePageChange
    }

    switch (activePage) {
      case 'dashboard':
        return <DoctorOverview {...pageProps} />
      case 'appointments':
        return <Appointments {...pageProps} />
      case 'appointment-tracking':
        return <AppointmentTracking {...pageProps} />
      case 'schedule':
        return <ScheduleManagement {...pageProps} />
      case 'patients':
        return <PatientRecords {...pageProps} />
      case 'treatment-plans':
        return <TreatmentPlans {...pageProps} />
      case 'prescriptions':
        return <Prescriptions {...pageProps} />
      case 'labs':
        return <LabResults {...pageProps} />
      case 'inpatient':
        return <InpatientVisits {...pageProps} />
      case 'messages':
        return <Messaging {...pageProps} />
      case 'raise-ticket':
        return <RaiseticketDoctor {...pageProps} />
      case 'profile':
        return <DoctorProfile {...pageProps} />
      case 'reports-analytics':
        return <ReportsAndAnalytics {...pageProps} />

      default:
        return <DoctorOverview {...pageProps} />
    }
  }

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

export default DoctorDashboard