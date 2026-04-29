// src/pages/dashboards/LabDashboard/LabDashboard.jsx
import React, { useState, useEffect } from 'react'
import Header from '../../../components/common/Header/Header'
import Sidebar from '../../../components/common/Sidebar/Sidebar'
// Import Lab Components
import TestRegistration from './pages/TestRegistration'
import SampleTracking from './pages/SampleTracking'
import ReportGeneration from './pages/ReportGeneration'
import ResultAccess from './pages/ResultAccess'
import TestCatalogue from './pages/TestCatalogue'
import EquipmentTracking from './pages/EquipmentTracking'
import QualityControl from './pages/QualityControl'
import LabOverview from './pages/LabOverview'
import CriticalResults from './pages/CriticalResults'
import LabProfile from './pages/LabProfile'
import RaiseticketLab from './pages/RaiseticketLab'

const LabDashboard = () => {
  const [activePage, setActivePage] = useState('lab-dashboard')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true)
  const [navigationData, setNavigationData] = useState(null)

  // Add event listener for header navigation
  useEffect(() => {
    const handleDashboardNavigation = (event) => {
      const { page, ...data } = event.detail;
      setActivePage(page);
      setNavigationData(data);
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
      case 'lab-dashboard':
        return <LabOverview />
      case 'test-registration':
        return <TestRegistration />
      case 'sample-tracking':
        return <SampleTracking />
      case 'report-generation':
        return <ReportGeneration />
      case 'result-access':
        return <ResultAccess initialSearch={navigationData?.searchTerm} />
      case 'test-catalogue':
        return <TestCatalogue />
      case 'equipment-tracking':
        return <EquipmentTracking />
      case 'quality-control':
        return <QualityControl />
      case 'critical-results':
        return <CriticalResults />
      case 'raise-ticket':
        return <RaiseticketLab />
      case 'profile':
        return <LabProfile />
      default:
        return <LabOverview />
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
        <div className={`hidden md:block fixed top-16 left-0 bottom-0 z-40 transition-transform duration-300 ${
          isDesktopSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <Sidebar activePage={activePage} onPageChange={handlePageChange}
            isOpen={isDesktopSidebarOpen} onClose={() => setIsDesktopSidebarOpen(false)} />
        </div>
        
        {/* Mobile Sidebar - Fixed position */}
        <div className={`md:hidden fixed top-0 left-0 bottom-0 z-40 transition-transform duration-300 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <Sidebar activePage={activePage} onPageChange={handlePageChange}
            isOpen={isMobileSidebarOpen} onClose={handleMobileSidebarClose} />
        </div>
       
        {/* Main Content */}
        <main className={`flex-1 min-h-[calc(100vh-4rem)] overflow-auto transition-all duration-300 ${
          isDesktopSidebarOpen ? 'md:ml-[270px]' : 'md:ml-0'
        }`}>
          <div className="p-2 pt-7 w-full">
            {renderPage()}
          </div>
        </main>
      </div>
     
      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={handleMobileSidebarClose} />
      )}
    </div>
  )
}

export default LabDashboard