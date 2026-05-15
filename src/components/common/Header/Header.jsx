// src/components/common/Header/Header.jsx
import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { useSelector } from 'react-redux'
import { getInitials } from '../../../utils/helpers'
import { useNavigate } from 'react-router-dom'

const Header = ({ onMenuToggle = () => {}, onSidebarToggle = () => {}, isSidebarOpen = true }) => {
  const { user, logout } = useAuth()
  const { logo: hospitalLogo, name: hospitalName } = useSelector(state => state.hospital)
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'super_admin'
  const navigate = useNavigate()

  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const notifRef = useRef(null)
  const profileRef = useRef(null)

  const notifications = [
    { id: 1, message: 'New lab results available', time: '2 mins ago', unread: true },
    { id: 2, message: 'Appointment reminder at 11:30 AM', time: '1 hour ago', unread: true },
    { id: 3, message: 'New message from Nurse Kavya', time: '3 hours ago', unread: false }
  ]
  const unreadCount = notifications.filter(n => n.unread).length

  // Logout
  const handleLogout = () => {
    logout()
    navigate('/login')
    setShowProfileMenu(false)
  }

  // Go to profile page
  const handleProfile = () => {
    setShowProfileMenu(false)
    
    // Dispatch event for AdminDashboard to handle
    const event = new CustomEvent('dashboard-navigation', { 
      detail: { page: 'profile' }
    });
    window.dispatchEvent(event);
  }

  // Go to settings page
  const handleSettings = () => {
    setShowProfileMenu(false)
    
    // Dispatch event for AdminDashboard to handle
    const event = new CustomEvent('dashboard-navigation', { 
      detail: { page: 'settings' }
    });
    window.dispatchEvent(event);
  }

  // Smooth sidebar toggle with animation
  const handleSidebarToggle = (e) => {
    e.stopPropagation()
    setIsAnimating(true)
    onSidebarToggle?.()
    
    // Reset animation state after transition
    setTimeout(() => {
      setIsAnimating(false)
    }, 300)
  }

  // Smooth mobile menu toggle
  const handleMobileMenuToggle = (e) => {
    e.stopPropagation()
    setIsAnimating(true)
    onMenuToggle?.()
    
    setTimeout(() => {
      setIsAnimating(false)
    }, 300)
  }

  // Close dropdowns on outside click or ESC
  useEffect(() => {
    const onDocClick = (e) => {
      const inNotif = notifRef.current?.contains(e.target)
      const inProfile = profileRef.current?.contains(e.target)
      if (!inNotif && !inProfile) {
        setShowNotifications(false)
        setShowProfileMenu(false)
      }
    }
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setShowNotifications(false)
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <header className="bg-white border-b shadow-sm fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300 ease-in-out">
      <div className="flex items-center justify-between px-4 h-full">
        {/* Left: hamburger + logo */}
        <div className="flex items-center gap-3 flex-1">
          {/* Mobile hamburger - Always show on mobile with smooth animation */}
          <button onClick={handleMobileMenuToggle}
            className={`lg:hidden md:hidden p-2 rounded-lg hover:bg-gray-100 transition-all duration-300 ease-in-out touch-target ${
              isAnimating ? 'transform scale-95' : ''
            }`}
            aria-label="Toggle menu"
          >
            <i className="fas fa-bars text-gray-600 text-lg transition-transform duration-300 ease-in-out"></i>
          </button>

          {/* Desktop sidebar toggle - Smooth slide-in animation */}
          <div className={`hidden md:block transition-all duration-500 ease-in-out overflow-hidden ${
            isSidebarOpen ? 'w-0 opacity-0' : 'w-auto opacity-100'
          }`}>
            <button
              onClick={handleSidebarToggle}
              className={`p-2 rounded-lg hover:bg-gray-100 transition-all duration-500 ease-in-out touch-target ${
                isAnimating ? 'transform scale-95' : 'hover:scale-105'
              }`}
              aria-label="Open sidebar"
            >
              <i className="fas fa-bars text-gray-600 text-lg transition-all duration-300 ease-in-out"></i>
            </button>
          </div>

          {/* Logo with hospital name - Updated with better mobile view */}
          <div className="flex items-center gap-3 transition-all duration-300 ease-in-out">
            {/* Logo Icon */}
            {!isSuperAdmin && hospitalLogo ? (
              <img src={hospitalLogo} alt="Logo" className="w-10 h-10 rounded-xl object-contain shadow-md transition-all duration-300 hover:scale-105 cursor-pointer" />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold transition-all duration-300 hover:scale-105 cursor-pointer shadow-md flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            )}
            
            {/* Hospital Name for Desktop and Tablet */}
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent transition-all duration-300">
               {!isSuperAdmin ? hospitalName : 'Super Admin'}
              </h1>
              <p className="text-xs text-gray-500 font-medium transition-all duration-300">
                {!isSuperAdmin ? 'Hospital Management System' : 'Platform Administration'}
              </p>
            </div>

            {/* Hospital Name for Mobile - Compact version */}
            <div className="sm:hidden max-w-[120px]">
              <h1 className="text-sm font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent transition-all duration-300 truncate">
                {!isSuperAdmin ? hospitalName : 'Admin'}
              </h1>
              <p className="text-[10px] text-gray-500 font-medium transition-all duration-300 truncate">
                {!isSuperAdmin ? 'HMS' : 'Portal'}
              </p>
            </div>
          </div>
        </div>

        {/* Right: notifications + profile */}
        <div className="flex items-center gap-2">
          {/* Notifications with smooth dropdown - Only mobile fixed */}
          {/* <div className="relative" ref={notifRef}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowNotifications((s) => !s)
                setShowProfileMenu(false)
              }}
              className={`text-gray-600 hover:text-blue-600 relative p-2 rounded-lg hover:bg-gray-100 transition-all duration-300 ease-in-out touch-target ${
                showNotifications ? 'bg-blue-50 text-blue-600' : ''
              } ${isAnimating ? 'transform scale-95' : 'hover:scale-105'}`}
              aria-label="Notifications"
              aria-expanded={showNotifications}
              aria-haspopup="menu"
            >
              <i className={`fas fa-bell text-yellow-500 text-lg transition-transform duration-300 ${
                showNotifications ? 'animate-bounce' : ''
              }`}></i>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse transition-all duration-300">
                  {unreadCount}
                </span>
              )}
            </button>

            
            <div
              className={`hidden md:block absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-50 transition-all duration-300 ease-in-out transform origin-top-right ${
                showNotifications 
                  ? 'opacity-100 scale-100 translate-y-0' 
                  : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
              }`}
              role="menu"
              aria-label="Notifications"
            >
              <div className="p-3 border-b bg-gray-50 rounded-t-lg">
                <h3 className="font-semibold text-gray-800">Notifications</h3>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b hover:bg-gray-50 cursor-pointer transition-all duration-200 ${
                      notification.unread ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => setShowNotifications(false)}
                    role="menuitem"
                  >
                    <p className="text-sm text-gray-800">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1 transition-all duration-200">{notification.time}</p>
                  </div>
                ))}
              </div>
              <div className="p-2 text-center border-t bg-gray-50 rounded-b-lg">
                <button className="text-blue-600 text-sm hover:text-blue-700 transition-colors duration-200 font-medium">
                  View All Notifications
                </button>
              </div>
            </div>

           
            {showNotifications && (
              <>
               
                <div 
                  className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" 
                  onClick={() => setShowNotifications(false)}
                />
                
               
                <div
                  className={`fixed md:hidden mt-2 w-[calc(100vw-2rem)] max-w-md bg-white border rounded-lg shadow-lg z-50 transition-all duration-300 ease-in-out transform origin-center ${
                    showNotifications 
                      ? 'opacity-100 scale-100 translate-y-0' 
                      : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                  }`}
                  style={{
                    top: '4.5rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    maxWidth: 'calc(100vw - 2rem)'
                  }}
                  role="menu"
                  aria-label="Notifications"
                >
                  <div className="p-3 border-b bg-gray-50 rounded-t-lg flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800">Notifications</h3>
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="text-gray-500 hover:text-gray-700 p-1"
                      aria-label="Close notifications"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {notifications.map(notification => (
                      <div
                        key={notification.id}
                        className={`p-3 border-b hover:bg-gray-50 cursor-pointer transition-all duration-200 ${
                          notification.unread ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                        onClick={() => setShowNotifications(false)}
                        role="menuitem"
                      >
                        <p className="text-sm text-gray-800">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1 transition-all duration-200">{notification.time}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 text-center border-t bg-gray-50 rounded-b-lg">
                    <button className="text-blue-600 text-sm hover:text-blue-700 transition-colors duration-200 font-medium">
                      View All Notifications
                    </button>
                  </div>
                </div>
              </>
            )}
          </div> */}

          {/* Profile with smooth dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowProfileMenu((s) => !s)
                setShowNotifications(false)
              }}
              className={`flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-all duration-300 ease-in-out touch-target ${
                showProfileMenu ? 'bg-blue-50' : ''
              } ${isAnimating ? 'transform scale-95' : 'hover:scale-105'}`}
              aria-label="User menu"
              aria-expanded={showProfileMenu}
              aria-haspopup="menu"
            >
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold transition-all duration-300 hover:scale-110">
                {getInitials(user?.name || 'U')}
              </div>
              <span className="text-sm text-gray-700 hidden md:block transition-all duration-300">
                {user?.name}
              </span>
              <i className={`fas fa-chevron-down text-gray-500 text-xs hidden sm:block transition-transform duration-300 ${
                showProfileMenu ? 'rotate-180' : ''
              }`}></i>
            </button>

            {/* Profile dropdown with smooth animation */}
            <div
              className={`absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50 transition-all duration-300 ease-in-out transform origin-top-right ${
                showProfileMenu 
                  ? 'opacity-100 scale-100 translate-y-0' 
                  : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
              }`}
              role="menu"
              aria-label="Profile menu"
            >
              <div className="p-3 border-b bg-gray-50 rounded-t-lg">
                <p className="font-medium text-sm text-gray-800">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize transition-all duration-200">
                  {user?.role?.toLowerCase().replace('_', ' ')}
                </p>
              </div>
              <div className="p-1">
                <button
                  onClick={handleProfile}
                  className="w-full text-left px-3 py-3 text-sm text-gray-700 hover:bg-blue-50 rounded flex items-center touch-target transition-all duration-200 hover:translate-x-1 hover:text-blue-600"
                  role="menuitem"
                >
                  <i className="fas fa-user mr-2 text-gray-400 transition-colors duration-200"></i>
                  My Profile
                </button>
                <button
                  onClick={handleSettings}
                  className="w-full text-left px-3 py-3 text-sm text-gray-700 hover:bg-blue-50 rounded flex items-center touch-target transition-all duration-200 hover:translate-x-1 hover:text-blue-600"
                  role="menuitem"
                >
                  <i className="fas fa-cog mr-2 text-gray-400 transition-colors duration-200"></i>
                  Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-3 text-sm text-red-600 hover:bg-red-50 rounded flex items-center touch-target transition-all duration-200 hover:translate-x-1 hover:text-red-700"
                  role="menuitem"
                >
                  <i className="fas fa-sign-out-alt mr-2 transition-colors duration-200"></i>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header