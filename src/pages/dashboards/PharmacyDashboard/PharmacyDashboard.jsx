import React, { useState } from 'react'
import Header from '../../../components/common/Header/Header'
import Sidebar from '../../../components/common/Sidebar/Sidebar'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import PurchaseOrders from './pages/PurchaseOrders'
import SalesTracking from './pages/SalesTracking'
import ExpiryAlerts from './pages/ExpiryAlerts'
import SupplierManagement from './pages/SupplierManagement'
import MedicineDatabase from './pages/MedicineDatabase'
import Settings from './pages/Settings'
import Stock from './pages/Stock'
import Return from './pages/Return'
import GRN from './pages/GRN'
import Report from './pages/Report'
import RaiseticketPharma from './pages/RaiseticketPharma'
import PatientMedicines from './pages/PatientMedicines'

const PharmacyDashboard = () => {
  const [activePage, setActivePage] = useState('dashboard')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true)

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard onPageChange={setActivePage} />
      case 'patientmedicines':
        return <PatientMedicines />
      case 'inventory':
        return <Inventory />
      case 'purchaseorders':
        return <PurchaseOrders />
      case 'salestracking':
        return <SalesTracking />
      case 'expiryalerts':
        return <ExpiryAlerts />
      case 'suppliermanagement':
        return <SupplierManagement />
      case 'medicinedatabase':
        return <MedicineDatabase />
      case 'settings':
        return <Settings />
      case 'stock':
        return <Stock />
      case 'return':
        return <Return />
      case 'grn':
        return <GRN />
      case 'report':
        return <Report />
      case 'raise-ticket':
        return <RaiseticketPharma />
      default:
        return <Dashboard />
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
    <div className="min-h-screen bg-gray-50 ">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Header
          onMenuToggle={handleMobileMenuToggle}
          onSidebarToggle={handleDesktopSidebarToggle}
          isSidebarOpen={isDesktopSidebarOpen}
        />
      </div>

      {/* Main Layout */}
      <div className="flex pt-12 min-h-screen mt ">
        {/* Desktop Sidebar - Fixed position */}
        <div className={`hidden md:block fixed top-16 left-0 bottom-0 z-40 transition-transform duration-300 ${isDesktopSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
          <Sidebar
            activePage={activePage}
            onPageChange={setActivePage}
            isOpen={isDesktopSidebarOpen}
            onClose={() => setIsDesktopSidebarOpen(false)}
          />
        </div>

        {/* Mobile Sidebar - Fixed position */}
        <div className={`md:hidden fixed top-0 left-0 bottom-0 z-40 transition-transform duration-300 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
          <Sidebar
            activePage={activePage}
            onPageChange={setActivePage}
            isOpen={isMobileSidebarOpen}
            onClose={handleMobileSidebarClose}
          />
        </div>

        {/* Main Content */}
        <main className={`flex-1 min-h-[calc(100vh-4rem)] overflow-auto transition-all duration-300 ${isDesktopSidebarOpen ? 'md:ml-64' : 'md:ml-0'
          }`}>
          <div className="p-2 w-full">
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

export default PharmacyDashboard