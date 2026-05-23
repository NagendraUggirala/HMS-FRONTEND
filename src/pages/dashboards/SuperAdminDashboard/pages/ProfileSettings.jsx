// src/pages/dashboards/SuperAdminDashboard/pages/ProfileSettings.jsx
import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../../../hooks/useAuth'
import Button from '../../../../components/common/Button/Button'
import { isValidEmail, PHONE_REGEX } from '../../../../utils/validation'
import { SUPER_ADMIN_PROFILE, SUPER_ADMIN_ME, SUPER_ADMIN_ME_AVATAR, SUPER_ADMIN_ME_SECURITY, SUPER_ADMIN_ME_CHANGE_PASSWORD, API_BASE_URL, PUBLIC_API_BASE_URL, API_HEADERS } from '../../../../config/api'
import { CheckCircle, Error, Person, CloudUpload, Check, Email, Phone, Info, Security, Save, VisibilityOff, Visibility, Lock, VpnKey, Notifications, PhoneIphone, Tablet, DesktopMac, Logout, RocketLaunch, HourglassBottom, Close, ErrorOutline } from '@mui/icons-material'

const ProfileSettings = () => {
  const { user } = useAuth()
  const fileInputRef = useRef(null)

  // Helper function to construct full avatar URL
  const getFullAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null
    // If already a full URL, return as-is
    if (avatarPath.startsWith('http')) return avatarPath
    // In dev mode, PUBLIC_API_BASE_URL is empty, so relative paths work via Vite proxy
    // In prod mode, PUBLIC_API_BASE_URL has the backend domain
    if (PUBLIC_API_BASE_URL === '') {
      return avatarPath // Use relative path for Vite proxy
    }
    return `${PUBLIC_API_BASE_URL}${avatarPath}`
  }

  const [activeTab, setActiveTab] = useState('personal')
  const [profileImage, setProfileImage] = useState(user?.profileImage || null)
  const [imagePreview, setImagePreview] = useState(user?.profileImage || null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Personal Information State
  const [personalInfo, setPersonalInfo] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  })
  const [personalErrors, setPersonalErrors] = useState({})

  // Password State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordErrors, setPasswordErrors] = useState({})
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  // Security Settings State
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: user?.twoFactorEnabled || false,
    loginAlerts: user?.loginAlerts || true,
    suspiciousActivity: user?.suspiciousActivity || true,
    biometricEnabled: user?.biometricEnabled || false,
    sessionTimeout: user?.sessionTimeout || '30',
    accountAutoLock: user?.accountAutoLock || true,
  })
  
  // Track original security settings to detect changes
  const [originalSecuritySettings, setOriginalSecuritySettings] = useState({
    twoFactorEnabled: user?.twoFactorEnabled || false,
    loginAlerts: user?.loginAlerts || true,
    suspiciousActivity: user?.suspiciousActivity || true,
    biometricEnabled: user?.biometricEnabled || false,
    sessionTimeout: user?.sessionTimeout || '30',
    accountAutoLock: user?.accountAutoLock || true,
  })
  
  // Check if security settings have changed
  const hasSecurityChanges = JSON.stringify(securitySettings) !== JSON.stringify(originalSecuritySettings)

 

  // Confirmation Dialog State
  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    title: '',
    message: '',
    action: null,
    actionData: null,
  })

  // Fetch profile data on component mount
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem('access_token') || localStorage.getItem('token')
        if (!token) return

        // Fetch authenticated user data
        const meResponse = await fetch(`${API_BASE_URL}${SUPER_ADMIN_ME}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            ...API_HEADERS,
          },
        })

        if (meResponse.ok) {
          const meData = await meResponse.json()
          const userData = meData?.data || meData
          
          // Handle both camelCase and snake_case field names from API
          const firstName = userData.firstName || userData.first_name
          const lastName = userData.lastName || userData.last_name
          const email = userData.email
          const phone = userData.phone
          
          if (firstName || lastName || email || phone) {
            setPersonalInfo({
              firstName: firstName || personalInfo.firstName,
              lastName: lastName || personalInfo.lastName,
              email: email || personalInfo.email,
              phone: phone || personalInfo.phone,
            })
          }

          if (userData.profileImage || userData.avatar || userData.avatar_url) {
            setImagePreview(getFullAvatarUrl(userData.profileImage || userData.avatar || userData.avatar_url))
          }

          // Extract and set security settings from API response
          if (userData.security) {
            const securityData = userData.security
            const updatedSecuritySettings = {
              twoFactorEnabled: securityData.is_two_factor_enabled || false,
              loginAlerts: securityData.enable_login_alerts !== undefined ? securityData.enable_login_alerts : true,
              suspiciousActivity: securityData.enable_suspicious_activity_alerts !== undefined ? securityData.enable_suspicious_activity_alerts : true,
              sessionTimeout: securityData.inactivity_timeout_minutes || '30',
              accountAutoLock: securityData.enable_account_auto_lock !== undefined ? securityData.enable_account_auto_lock : true,
            }
            setSecuritySettings(updatedSecuritySettings)
            setOriginalSecuritySettings(updatedSecuritySettings)
          }
        }

        // Fetch profile details
        const profileResponse = await fetch(`${API_BASE_URL}${SUPER_ADMIN_PROFILE}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            ...API_HEADERS,
          },
        })

        if (profileResponse.ok) {
          const data = await profileResponse.json()
          const profileData = data?.data || data
          
          // Handle both camelCase and snake_case field names from API
          const firstName = profileData.firstName || profileData.first_name
          const lastName = profileData.lastName || profileData.last_name
          const email = profileData.email
          const phone = profileData.phone
          
          if (firstName || lastName || email || phone) {
            setPersonalInfo({
              firstName: firstName || personalInfo.firstName,
              lastName: lastName || personalInfo.lastName,
              email: email || personalInfo.email,
              phone: phone || personalInfo.phone,
            })
          }

          if (profileData.profileImage || profileData.avatar || profileData.avatar_url) {
            setImagePreview(getFullAvatarUrl(profileData.profileImage || profileData.avatar || profileData.avatar_url))
          }
        }
      } catch (error) {
        console.error('Failed to fetch profile data:', error)
      }
    }

    fetchProfileData()
  }, [])

  // Show message notification
  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 4000)
  }

  // ========== Session & Device Handlers ==========
  const openConfirmation = (title, message, action, actionData = null) => {
    setConfirmation({
      isOpen: true,
      title,
      message,
      action,
      actionData,
    })
  }

  const closeConfirmation = () => {
    setConfirmation({
      isOpen: false,
      title: '',
      message: '',
      action: null,
      actionData: null,
    })
  }

  const handleConfirmAction = async () => {
    setLoading(true)
    try {
      if (confirmation.action === 'signOutAll') {
        // API call to sign out all sessions
        // const response = await fetch('/api/user/sign-out-all', {
        //   method: 'POST',
        //   headers: { Authorization: `Bearer ${token}` },
        // })
        
        await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
        
        // Keep only current device active (in real scenario, user would be logged out)
        setDevices(prevDevices =>
          prevDevices.map(device =>
            device.isCurrent ? device : null
          ).filter(Boolean)
        )
        showMessage('success', 'Successfully signed out from all other sessions!')
      } else if (confirmation.action === 'revokeDevice') {
        const deviceId = confirmation.actionData
        
        // API call to revoke device
        // const response = await fetch(`/api/user/revoke-device/${deviceId}`, {
        //   method: 'DELETE',
        //   headers: { Authorization: `Bearer ${token}` },
        // })
        
        await new Promise(resolve => setTimeout(resolve, 800)) // Simulate API call
        
        // Remove device from list
        setDevices(prevDevices =>
          prevDevices.filter(device => device.id !== deviceId)
        )
        showMessage('success', `Device access has been revoked successfully!`)
      }
      closeConfirmation()
    } catch (error) {
      showMessage('error', error.message || 'Failed to perform action. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ========== Profile Picture Handler ==========
  const handleProfilePictureClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showMessage('error', 'Please select a valid image file')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showMessage('error', 'Image size must be less than 5MB')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
        setProfileImage(file)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUploadProfilePicture = async () => {
    if (!profileImage) {
      showMessage('error', 'Please select an image first')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token')
      const formData = new FormData()
      formData.append('avatar', profileImage)
      
      const response = await fetch(`${API_BASE_URL}${SUPER_ADMIN_ME_AVATAR}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          ...API_HEADERS,
        },
        body: formData,
      })
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error?.message || 'Failed to update profile picture')
      }
      
      const data = await response.json()
      showMessage('success', data?.message || 'Profile picture updated successfully!')
      setProfileImage(null)
    } catch (error) {
      showMessage('error', error.message || 'Failed to update profile picture')
    } finally {
      setLoading(false)
    }
  }

  // ========== Personal Information Handlers ==========
  const validatePersonalInfo = () => {
    const errors = {}
    
    if (!personalInfo.firstName.trim()) errors.firstName = 'First name is required'
    if (!personalInfo.lastName.trim()) errors.lastName = 'Last name is required'
    if (!isValidEmail(personalInfo.email)) errors.email = 'Email is invalid'
    if (!PHONE_REGEX.test(personalInfo.phone)) errors.phone = 'Phone number is invalid'
    
    return errors
  }

  const handlePersonalChange = (e) => {
    const { name, value } = e.target
    setPersonalInfo(prev => ({ ...prev, [name]: value }))
    // Clear error for this field when user starts typing
    if (personalErrors[name]) {
      setPersonalErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleUpdatePersonalInfo = async () => {
    const errors = validatePersonalInfo()
    if (Object.keys(errors).length > 0) {
      setPersonalErrors(errors)
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}${SUPER_ADMIN_PROFILE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...API_HEADERS,
        },
        body: JSON.stringify({
          first_name: personalInfo.firstName,
          last_name: personalInfo.lastName,
          email: personalInfo.email,
          phone: personalInfo.phone,
        }),
      })
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error?.message || 'Failed to update personal information')
      }
      
      const data = await response.json()
      showMessage('success', data?.message || 'Personal information updated successfully!')
      setPersonalErrors({})
    } catch (error) {
      showMessage('error', error.message || 'Failed to update personal information')
    } finally {
      setLoading(false)
    }
  }

  // ========== Password Handlers ==========
  const validatePassword = () => {
    const errors = {}
    
    if (!passwordData.currentPassword) errors.currentPassword = 'Current password is required'
    if (!passwordData.newPassword) errors.newPassword = 'New password is required'
    if (passwordData.newPassword.length < 8) errors.newPassword = 'Password must be at least 8 characters'
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
    
    return errors
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData(prev => ({ ...prev, [name]: value }))
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleUpdatePassword = async () => {
    const errors = validatePassword()
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors)
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token')
      if (!token) {
        showMessage('error', 'Authentication token not found')
        setLoading(false)
        return
      }

      const response = await fetch(`${API_BASE_URL}${SUPER_ADMIN_ME_CHANGE_PASSWORD}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...API_HEADERS,
        },
        body: JSON.stringify({
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword,
          confirm_password: passwordData.confirmPassword,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData?.message || `Failed to change password: ${response.statusText}`)
      }

      const data = await response.json()
      showMessage('success', data?.message || 'Password changed successfully!')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setPasswordErrors({})
    } catch (error) {
      console.error('Password change error:', error)
      showMessage('error', error.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  // ========== Security Settings Handlers ==========
  const handleSecurityChange = (key, value) => {
    setSecuritySettings(prev => ({ ...prev, [key]: value }))
  }

  const handleUpdateSecuritySettings = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token')
      if (!token) {
        showMessage('error', 'Authentication token not found')
        setLoading(false)
        return
      }

      // Convert camelCase to snake_case for API
      const payload = {
        is_two_factor_enabled: securitySettings.twoFactorEnabled,
        enable_login_alerts: securitySettings.loginAlerts,
        enable_suspicious_activity_alerts: securitySettings.suspiciousActivity,
        biometric_enabled: securitySettings.biometricEnabled,
        inactivity_timeout_minutes: parseInt(securitySettings.sessionTimeout),
        enable_account_auto_lock: securitySettings.accountAutoLock,
      }

      const response = await fetch(`${API_BASE_URL}${SUPER_ADMIN_ME}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...API_HEADERS,
        },
        body: JSON.stringify({
          security: payload
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update security settings: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Update original settings after successful update to track changes
      setOriginalSecuritySettings(securitySettings)
      
      showMessage('success', 'Security settings updated successfully!')
    } catch (error) {
      console.error('Security settings update error:', error)
      showMessage('error', error.message || 'Failed to update security settings')
    } finally {
      setLoading(false)
    }
  }

  const handleDiscardSecurityChanges = () => {
    setSecuritySettings(originalSecuritySettings)
    showMessage('error', 'Changes discarded')
  }

  // Calculate security level
  const calculateSecurityLevel = () => {
    let level = 0
    if (securitySettings.twoFactorEnabled) level += 2
    if (securitySettings.loginAlerts) level += 1
    if (securitySettings.suspiciousActivity) level += 1
    if (securitySettings.biometricEnabled) level += 1
    if (securitySettings.accountAutoLock) level += 1
    
    if (level >= 5) return { text: 'Optimal', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' }
    if (level >= 3) return { text: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' }
    return { text: 'Standard', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' }
  }

  const securityLevel = calculateSecurityLevel()

  return (
    <div className="space-y-6">
      <div className="space-y-4 sm:space-y-6 mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2">Manage your account information and security preferences</p>
        </div>

        {/* Message Notification */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.type === 'success' ? <CheckCircle className="flex-shrink-0" /> : <Error className="flex-shrink-0" />}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        {/* Profile Picture Section */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 shadow-md p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 border border-blue-200 rounded-xl sm:rounded-2xl hover:border-blue-400 transition-all duration-300">
          <div className="flex flex-col items-center sm:flex-row sm:items-center gap-4 sm:gap-8">
            {/* Avatar & Upload */}
            <div className="flex flex-col items-center gap-3 sm:gap-4 flex-shrink-0 w-full sm:w-auto">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border-4 border-white shadow-lg ring-4 ring-blue-300">
                {imagePreview ? (
                  <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <Person className="text-white" sx={{ fontSize: '3rem' }} />
                )}
              </div>
              <div className="flex flex-col gap-2 w-full">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <Button
                  variant="primary"
                  onClick={handleProfilePictureClick}
                  icon="upload"
                  size="sm"
                  fullWidth
                >
                  <CloudUpload className="mr-2" sx={{ fontSize: '1.2rem' }} />
                  Choose Image
                </Button>
                {profileImage && (
                  <Button
                    variant="success"
                    onClick={handleUploadProfilePicture}
                    disabled={loading}
                    size="sm"
                    fullWidth
                  >
                    <Check className="mr-2" sx={{ fontSize: '1.2rem' }} />
                    Upload
                  </Button>
                )}
              </div>
            </div>

            {/* Profile Information Display */}
            <div className="flex-1 w-full">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 text-center sm:text-left">
                {personalInfo.firstName && personalInfo.lastName 
                  ? `${personalInfo.firstName} ${personalInfo.lastName}`
                  : 'Your Name'}
              </h3>
              <p className="text-xs sm:text-sm text-blue-600 font-medium mb-3 sm:mb-5 text-center sm:text-left">Profile Information</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
                {/* Email Display */}
                <div className="bg-white rounded-lg p-3 sm:p-4 border border-blue-100 shadow-sm">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Email</p>
                  <p className="text-xs sm:text-sm font-medium text-gray-900 flex items-center gap-2 break-words">
                    <Email className="text-blue-500 flex-shrink-0" sx={{ fontSize: '1.2rem' }} />
                    <span className="truncate">{personalInfo.email || 'Not provided'}</span>
                  </p>
                </div>

                {/* Phone Display */}
                <div className="bg-white rounded-lg p-3 sm:p-4 border border-blue-100 shadow-sm">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Phone</p>
                  <p className="text-xs sm:text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Phone className="text-blue-500 flex-shrink-0" sx={{ fontSize: '1.2rem' }} />
                    <span className="truncate">{personalInfo.phone || 'Not provided'}</span>
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-600 mt-3 sm:mt-4 text-center sm:text-left flex items-center justify-center sm:justify-start gap-2">
                <Info sx={{ fontSize: '1rem' }} />
                <span>Upload a new profile picture. Max size 5MB. Supported formats: JPG, PNG, GIF</span>
              </p>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-xl shadow-md mb-6 border border-gray-200">
          <div className="flex gap-0 overflow-x-auto">
            {['personal', 'password', 'security'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 sm:flex-none px-3 sm:px-6 py-3 sm:py-4 font-medium text-xs sm:text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
                  activeTab === tab
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-600 border-transparent hover:text-gray-900'
                }`}
              >
                <span className="hidden sm:inline mr-2">
                  {tab === 'personal' ? <Person sx={{ fontSize: '1rem' }} /> :
                  tab === 'password' ? <Lock sx={{ fontSize: '1rem' }} /> :
                  <Security sx={{ fontSize: '1rem' }} />}
                </span>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* ========== PERSONAL INFORMATION TAB ========== */}
        {activeTab === 'personal' && (
          <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-4 sm:p-6 border border-gray-300">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Personal Information</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* First Name */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={personalInfo.firstName}
                  onChange={handlePersonalChange}
                  className={`w-full px-3 sm:px-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    personalErrors.firstName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Example: John"
                />
                {personalErrors.firstName && (
                  <p className="text-red-600 text-xs sm:text-sm mt-1 flex items-center gap-1">
                    <ErrorOutline sx={{ fontSize: '1rem' }} />
                    {personalErrors.firstName}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={personalInfo.lastName}
                  onChange={handlePersonalChange}
                  className={`w-full px-3 sm:px-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    personalErrors.lastName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Example: Doe"
                />
                {personalErrors.lastName && (
                  <p className="text-red-600 text-xs sm:text-sm mt-1 flex items-center gap-1">
                    <ErrorOutline sx={{ fontSize: '1rem' }} />
                    {personalErrors.lastName}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={personalInfo.email}
                  onChange={handlePersonalChange}
                  className={`w-full px-3 sm:px-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    personalErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="john.doe@example.com"
                />
                {personalErrors.email && (
                  <p className="text-red-600 text-xs sm:text-sm mt-1 flex items-center gap-1">
                    <ErrorOutline sx={{ fontSize: '1rem' }} />
                    {personalErrors.email}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={personalInfo.phone}
                  onChange={handlePersonalChange}
                  className={`w-full px-3 sm:px-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    personalErrors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="+91 (555) 000-0000"
                />
                {personalErrors.phone && (
                  <p className="text-red-600 text-xs sm:text-sm mt-1 flex items-center gap-1">
                    <ErrorOutline sx={{ fontSize: '1rem' }} />
                    {personalErrors.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3">
              <Button
                variant="primary"
                onClick={handleUpdatePersonalInfo}
                disabled={loading}
              >
                <Save className="mr-2" sx={{ fontSize: '1.2rem' }} />
                Save Changes
              </Button>
              <Button
                variant="outline"
                onClick={() => setPersonalInfo({
                  firstName: user?.firstName || '',
                  lastName: user?.lastName || '',
                  email: user?.email || '',
                  phone: user?.phone || '',
                })}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* ========== CHANGE PASSWORD TAB ========== */}
        {activeTab === 'password' && (
          <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-4 sm:p-6 border border-gray-300">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">Change Password</h2>
            <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
              For your security, please enter a strong password that you don't use elsewhere
            </p>

            <div className="space-y-4 sm:space-y-6 w-full sm:max-w-md">
              {/* Current Password */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className={`w-full px-3 sm:px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 ${
                      passwordErrors.currentPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <ErrorOutline sx={{ fontSize: '1rem' }} />
                    {passwordErrors.currentPassword}
                  </p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className={`w-full px-3 sm:px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 ${
                      passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <p className="text-red-600 text-xs sm:text-sm mt-1 flex items-center gap-1">
                    <ErrorOutline sx={{ fontSize: '1rem' }} />
                    {passwordErrors.newPassword}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className={`w-full px-3 sm:px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 ${
                      passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                  </button>
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="text-red-600 text-xs sm:text-sm mt-1 flex items-center gap-1">
                    <ErrorOutline sx={{ fontSize: '1rem' }} />
                    {passwordErrors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Password Requirements */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm font-medium text-blue-900 mb-2">Password Requirements:</p>
                <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
                  <li className="flex items-center gap-2">
                    <Check className="text-green-600 flex-shrink-0" sx={{ fontSize: '1rem' }} />
                    <span>At least 8 characters long</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="text-green-600 flex-shrink-0" sx={{ fontSize: '1rem' }} />
                    <span>Mix of uppercase and lowercase letters</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="text-green-600 flex-shrink-0" sx={{ fontSize: '1rem' }} />
                    <span>At least one number and special character</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3">
              <Button
                variant="primary"
                onClick={handleUpdatePassword}
                disabled={loading}
              >
                <VpnKey className="mr-2" sx={{ fontSize: '1.2rem' }} />
                Update Password
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  })
                  setPasswordErrors({})
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* ========== SECURITY SETTINGS TAB ========== */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-lg sm:rounded-xl shadow-md border border-gray-300 p-4 sm:p-6 lg:p-8">
            {/* Security Level Header */}
            <div className={`${securityLevel.bgColor} border ${securityLevel.borderColor} rounded-lg sm:rounded-xl p-4 sm:p-6 mb-6 sm:mb-8`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-start gap-3 sm:gap-4 sm:justify-between">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className={`${securityLevel.color} text-2xl sm:text-3xl flex-shrink-0`}>
                    <Security sx={{ fontSize: '2rem' }} />
                  </div>
                  <div>
                    <h3 className={`text-base sm:text-lg font-bold ${securityLevel.color}`}>Security Level: {securityLevel.text}</h3>
                    <p className="text-group-600 text-xs sm:text-sm mt-1">
                      Your account meets all recommended security standards for enterprise-grade protection.
                    </p>
                  </div>
                </div>
                <div className={`flex-shrink-0 px-2 sm:px-3 py-1 rounded-full font-semibold text-xs uppercase tracking-wide ${
                  securityLevel.text === 'Optimal' ? 'bg-green-100 text-green-700' :
                  securityLevel.text === 'Good' ? 'bg-blue-100 text-blue-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {securityLevel.text === 'Optimal' && '✓ Protected'}
                  {securityLevel.text === 'Good' && '⚠ Moderate'}
                  {securityLevel.text === 'Standard' && '◉ Basic'}
                </div>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8 ">
              {/* Authentication Section */}
              <div>
                <div className="flex items-center gap-2 mb-4 sm:mb-6 ">
                  <VpnKey className="text-blue-600" sx={{ fontSize: '1.5rem' }} />
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">Authentication</h3>
                </div>

                <div className="space-y-3 sm:space-y-4 ">
        
                  {/* Two-Factor Authentication */}
                  <div className="bg-gray-50 hover:bg-gray-100 rounded-xl p-4 border border-gray-200 transition-all duration-200">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">Two-Factor Authentication</h4>
                        <p className="text-xs text-gray-600 mt-1">Secure logins via authenticator app</p>
                      </div>
                      <label className="relative inline-flex items-center flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={securitySettings.twoFactorEnabled}
                          onChange={(e) => handleSecurityChange('twoFactorEnabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alerts & Monitoring Section */}
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Notifications className="text-orange-600" sx={{ fontSize: '1.5rem' }} />
                  <h3 className="text-lg font-bold text-gray-900">Alerts & Monitoring</h3>
                </div>

                <div className="space-y-4">
                  {/* Login Alerts */}
                  <div className="bg-gray-50 hover:bg-gray-100 rounded-xl p-4 border border-gray-200 transition-all duration-200">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">Login Alerts</h4>
                        <p className="text-xs text-gray-600 mt-1">
                          Notifications for all new logins from unrecognized browsers or locations.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={securitySettings.loginAlerts}
                          onChange={(e) => handleSecurityChange('loginAlerts', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  {/* Suspicious Activity */}
                  <div className="bg-gray-50 hover:bg-gray-100 rounded-xl p-4 border border-gray-200 transition-all duration-200">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">Suspicious Activity</h4>
                        <p className="text-xs text-gray-600 mt-1">
                          Advanced AI analysis of access patterns to detect potential breaches.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={securitySettings.suspiciousActivity}
                          onChange={(e) => handleSecurityChange('suspiciousActivity', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Protection Section */}
            <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg sm:rounded-xl border border-blue-200">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                <RocketLaunch className="text-blue-600" />
                Advanced Protection
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Inactivity Timeout */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 uppercase tracking-wide flex items-center gap-2">
                    <HourglassBottom className="text-blue-600" sx={{ fontSize: '1rem' }} />
                    <span>Inactivity Timeout</span>
                  </label>
                  <p className="text-xs text-gray-600 mb-2 sm:mb-3">
                    Session will automatically terminate after a period of inactivity.
                  </p>
                  <select
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => handleSecurityChange('sessionTimeout', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-blue-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                    <option value="480">8 hours</option>
                  </select>
                </div>

                {/* Account Auto-Lock */}
                <div className="flex items-start justify-between">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide flex items-center gap-2">
                      <Lock className="text-blue-600" sx={{ fontSize: '1rem' }} />
                      <span>Account Auto-Lock</span>
                    </label>
                    <p className="text-xs text-gray-600">Lock after 5 failed login attempts</p>
                  </div>
                  <label className="relative inline-flex items-center flex-shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={securitySettings.accountAutoLock}
                      onChange={(e) => handleSecurityChange('accountAutoLock', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handleDiscardSecurityChanges}
                disabled={loading || !hasSecurityChanges}
              >
                <Close className="mr-2" sx={{ fontSize: '1.2rem' }} />
                Discard Changes
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdateSecuritySettings}
                disabled={loading || !hasSecurityChanges}
              >
                <Save className="mr-2" sx={{ fontSize: '1.2rem' }} />
                Save Security Profile
              </Button>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {confirmation.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg sm:rounded-xl shadow-2xl max-w-md w-full animate-in fade-in duration-200">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-red-50 to-red-100 px-4 sm:px-6 py-4 sm:py-5 border-b border-red-200 rounded-t-lg sm:rounded-t-xl flex items-start gap-3">
                <div className="text-red-600 text-2xl flex-shrink-0 mt-0.5">
                  <ErrorOutline sx={{ fontSize: '1.5rem' }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                    {confirmation.title}
                  </h3>
                </div>
                <button
                  onClick={closeConfirmation}
                  className="text-gray-400 hover:text-gray-600 text-xl flex-shrink-0 transition-colors"
                  aria-label="Close"
                >
                  <Close sx={{ fontSize: '1.5rem' }} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-4 sm:px-6 py-4 sm:py-5">
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                  {confirmation.message}
                </p>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-4 sm:px-6 py-4 border-t border-gray-200 rounded-b-lg sm:rounded-b-xl flex gap-3 flex-row-reverse">
                <button
                  onClick={handleConfirmAction}
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg sm:rounded-xl transition-all duration-200 text-sm sm:text-base"
                >
                  {loading ? (
                    <>
                      <span className="inline-block animate-spin mr-2"><ErrorOutline sx={{ fontSize: '1rem' }} /></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2" sx={{ fontSize: '1.2rem' }} />
                      Confirm
                    </>
                  )}
                </button>
                <button
                  onClick={closeConfirmation}
                  disabled={loading}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-900 font-semibold py-2 px-4 rounded-lg sm:rounded-xl transition-all duration-200 text-sm sm:text-base flex items-center justify-center gap-2"
                >
                  <Close sx={{ fontSize: '1.2rem' }} />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProfileSettings