import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../../hooks/useAuth'
import { apiFetch } from '../../../../services/apiClient'
import { RECEPTIONIST_PROFILE, RECEPTIONIST_PROFILE_UPDATE } from '../../../../config/api'
import {

  ErrorOutline,
  CheckCircle,
  Email,
  Badge,
  LocationOn,
  Close,
  Edit,
  PhotoCamera,
  Save,
  LockOpen,
  Assignment,
  Check,
  FiberManualRecord,
} from '@mui/icons-material'

const ReceptionProfile = () => {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [profile, setProfile] = useState({
    user_id: "",
    first_name: "",
    last_name: "",
    full_name: "",
    email: "",
    phone: "",
    staff_id: "",
    avatar_url: null,
    status: "",
    is_active: true,
    mobile_number: "",
    joining_date: "",
    blood_group: "",
    gender: "",
    shift_timing: "Morning (7AM-3PM)",
    address: "",
    profile_photo: null,
    role: "RECEPTIONIST",
    note: "",
    // Keep internal UI state if needed
    profile_photo_url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9B-uq-hoK_JiRml8oo37F6A0ro-ondfH0cQ&s",
    experience_years: 0,
    work_area: "",
    permissions: {
      can_schedule_appointments: false,
      can_modify_appointments: false,
      can_register_patients: false,
      can_collect_payments: false
    }
  })

  // Fetch profile data from API
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await apiFetch(RECEPTIONIST_PROFILE)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result?.message || result?.detail?.message || 'Failed to fetch profile')
        }

        // Map API response to profile state using the provided schema
        const apiData = result?.data || result
        setProfile(prev => ({
          ...prev,
          user_id: apiData?.user_id || prev.user_id,
          first_name: apiData?.first_name || prev.first_name,
          last_name: apiData?.last_name || prev.last_name,
          full_name: apiData?.full_name || apiData?.name || prev.full_name,
          email: apiData?.email || prev.email,
          phone: apiData?.phone || apiData?.mobile_number || prev.phone,
          staff_id: apiData?.staff_id || apiData?.receptionist_id || apiData?.employee_id || prev.staff_id,
          avatar_url: apiData?.avatar_url || apiData?.profile_photo || prev.avatar_url,
          status: apiData?.status || prev.status,
          is_active: apiData?.is_active !== undefined ? apiData.is_active : prev.is_active,
          mobile_number: apiData?.mobile_number || apiData?.phone || prev.mobile_number,
          joining_date: apiData?.joining_date || apiData?.join_date || apiData?.date_of_joining || prev.joining_date,
          blood_group: apiData?.blood_group || prev.blood_group,
          gender: apiData?.gender || prev.gender,
          shift_timing: apiData?.shift_timing || apiData?.shift_time || prev.shift_timing,
          address: apiData?.address || prev.address,
          role: apiData?.role || apiData?.designation || prev.role,
          note: apiData?.note || prev.note,
          work_area: apiData?.work_area || prev.work_area,
          experience_years: apiData?.experience_years || 0,
          shift_type: apiData?.shift_type || apiData?.shift || prev.shift_type,
          permissions: apiData?.permissions || apiData?.access_permissions || prev.permissions,
          profile_photo_url: apiData?.avatar_url || apiData?.profile_photo || prev.profile_photo_url
        }))
      } catch (err) {
        setError(err?.message || 'Unable to load profile')
        console.error('Profile fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleSave = async () => {
    setError(null)
    setSuccessMessage('')

    try {
      const payload = new FormData()
      payload.append('first_name', profile.first_name)
      payload.append('last_name', profile.last_name)
      payload.append('full_name', profile.full_name)
      payload.append('phone', profile.phone)
      payload.append('mobile_number', profile.mobile_number)
      payload.append('email', profile.email)
      payload.append('address', profile.address)
      payload.append('blood_group', profile.blood_group || '')
      payload.append('gender', profile.gender || '')
      payload.append('shift_timing', profile.shift_timing)
      payload.append('joining_date', profile.joining_date)
      payload.append('note', profile.note)
      payload.append('work_area', profile.work_area || '')
      payload.append('experience_years', profile.experience_years.toString())
      payload.append('shift_type', profile.shift_type || 'DAY')

      if (profile.profile_photo) {
        payload.append('profile_photo', profile.profile_photo)
      }

      const response = await apiFetch(RECEPTIONIST_PROFILE_UPDATE, {
        method: 'PATCH',
        body: payload
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.message || data?.detail?.message || 'Failed to update profile')
      }

      setSuccessMessage('Profile updated successfully!')
      setIsEditing(false)
      // Update local state with potentially updated data from server
      if (data.data) {
          const updated = data.data;
          setProfile(prev => ({
              ...prev,
              ...updated,
              avatar_url: updated.avatar_url || updated.profile_photo || prev.avatar_url
          }));
      }
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError(err?.message || 'Unable to save profile')
      console.error('Profile save error:', err)
    }
  }

  return (
    <div className="animate-fade-in min-h-screen ">
      {/* Header */}

      <h1 className="text-2xl font-semibold text-gray-700">My Profile</h1>
      <p className="text-gray-600 mt-2">Manage your professional information</p>
      {/* Error Message */}
      {error && (
        <div className="mx-4 sm:mx-6 lg:mx-8 mt-6 p-4 rounded-xl bg-white border border-red-600 text-gray-800 flex items-center justify-between shadow-sm">
          <span className="flex items-center"><ErrorOutline className="text-red-600 mr-3" />{error}</span>
          <button
            onClick={() => window.location.reload()}
            className="ml-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="mx-4 sm:mx-6 lg:mx-8 mt-6 p-4 rounded-xl bg-white border-l-4 border-green-600 text-gray-800 flex items-center shadow-sm">
          <CheckCircle className="text-green-600 mr-3" />{successMessage}
        </div>
      )}




      <div className=" px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card - Left Column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-300 hover:border-blue-400 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="bg-gradient-to-b from-blue-50 to-white p-8 border-b border-blue-100">
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <img
                      src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9B-uq-hoK_JiRml8oo37F6A0ro-ondfH0cQ&s"
                      className="w-28 h-28 rounded-2xl border-4 border-blue-600 object-cover shadow-md"
                      alt="Receptionist"
                    />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-1">{profile.full_name || 'N/A'}</h3>
                  <p className="text-blue-600 font-semibold mb-3">{profile.role || 'Receptionist'}</p>
                  <div className="text-md text-gray-500 mb-4 font-mono bg-gray-50 px-3 py-2 rounded-lg w-full">{profile.staff_id || 'ID: N/A'}</div>
                  <div>
                    <span className={`text-xs font-bold px-4 py-2 rounded-full inline-block ${profile.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                      {profile.is_active ? '● Active' : '● Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-start">
                  <Email className="text-blue-600 w-5 mt-1 mr-4 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Email</p>
                    <p className="text-sm text-gray-700 break-all font-medium mt-1">{profile.email || 'N/A'}</p>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-4 flex items-start">
                  <Badge className="text-blue-600 w-5 mt-1 mr-4 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Staff ID</p>
                    <p className="text-sm text-gray-700 font-medium mt-1">{profile.staff_id || 'N/A'}</p>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-4 flex items-start">
                  <LocationOn className="text-blue-600 w-5 mt-1 mr-4 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Work Area</p>
                    <p className="text-sm text-gray-700 font-medium mt-1">{profile.work_area || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 p-6">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${isEditing
                    ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg'
                    }`}
                >
                  {isEditing ? <Close /> : <Edit />}
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>
            </div>

            {/* Your Responsibilities Card - Below Left Sidebar */}
            {(profile.permissions?.can_schedule_appointments || profile.permissions?.can_modify_appointments ||
              profile.permissions?.can_register_patients || profile.permissions?.can_collect_payments) && (
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-300 mt-8">
                  <div className="bg-gradient-to-r from-blue-100 to-blue-100 px-6 sm:px-8 py-4 border-b border-blue-100">
                    <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                      <Assignment className="text-blue-600" />
                      Your Responsibilities
                    </h3>
                  </div>
                  <div className="p-6 sm:p-8">
                    <div className="space-y-2">
                      {profile.permissions?.can_schedule_appointments && (
                        <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100 hover:border-blue-300 transition-all">
                          <Check className="text-green-600 mt-1 flex-shrink-0 font-bold" />
                          <span className="text-gray-700 font-medium text-lg">Schedule and manage appointments</span>
                        </div>
                      )}
                      {profile.permissions?.can_modify_appointments && (
                        <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100 hover:border-blue-300 transition-all">
                          <Check className="text-green-600 mt-1 flex-shrink-0 font-bold" />
                          <span className="text-gray-700 font-medium text-lg">Modify existing appointments</span>
                        </div>
                      )}
                      {profile.permissions?.can_register_patients && (
                        <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100 hover:border-blue-300 transition-all">
                          <Check className="text-green-600 mt-1 flex-shrink-0 font-bold" />
                          <span className="text-gray-700 font-medium text-lg">Register new patients</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
          </div>

          {/* Professional Information - Right Column */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-300">
              <div className="bg-gradient-to-r from-blue-100 to-blue-100 px-6 sm:px-8 py-6 border-b border-blue-100">
                <h3 className="text-2xl font-bold text-gray-800">Professional Information</h3>
                <p className="text-gray-600 text-sm mt-1">View and manage your professional details</p>
              </div>

              <div className="p-6 sm:p-8">
                {isEditing ? (
                  <div className="space-y-6">
                    {/* Profile Photo Upload */}
                    <div className="flex flex-col items-center mb-8">
                      <div className="relative mb-4">
                        <img
                          src={profile.profile_photo ? URL.createObjectURL(profile.profile_photo) : profile.profile_photo_url}
                          className="w-32 h-32 rounded-2xl border-4 border-blue-600 object-cover shadow-md"
                          alt="Profile"
                        />
                        <label className="absolute bottom-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 rounded-xl cursor-pointer hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg">
                          <PhotoCamera />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                setProfile({ ...profile, profile_photo: file })
                              }
                            }}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 text-center">Click camera icon to change photo</p>
                    </div>

                    {/* First and Last Name */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="group">
                        <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">First Name</label>
                        <input
                          type="text"
                          value={profile.first_name}
                          onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-gray-50 focus:bg-white"
                          placeholder="Enter first name"
                        />
                      </div>
                      <div className="group">
                        <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Last Name</label>
                        <input
                          type="text"
                          value={profile.last_name}
                          onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-gray-50 focus:bg-white"
                          placeholder="Enter last name"
                        />
                      </div>
                    </div>

                    {/* Full Name */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Full Name</label>
                      <input
                        type="text"
                        value={profile.full_name}
                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-gray-50 focus:bg-white"
                        placeholder="Enter your full name"
                      />
                    </div>

                    {/* Mobile Number */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                        Mobile Number
                      </label>

                      <div className="flex">
                        {/* Country Code */}
                        <span className="flex items-center px-4 py-3 border-2 border-r-0 border-gray-200 rounded-l-xl bg-gray-100 text-gray-700 font-semibold">
                          +91
                        </span>

                        {/* Mobile Input */}
                        <input
                          type="tel"
                          inputMode="numeric"
                          maxLength={10}
                          value={profile.phone}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, "");
                            setProfile({ ...profile, phone: value });
                          }}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-r-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-gray-50 focus:bg-white"
                          placeholder="Enter mobile number"
                        />
                      </div>
                    </div>

                    {/* Work Area */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Work Area</label>
                      <input
                        type="text"
                        value={profile.work_area}
                        onChange={(e) => setProfile({ ...profile, work_area: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-gray-50 focus:bg-white"
                        placeholder="Enter your work area / department"
                      />
                    </div>

                    {/* Experience */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Years of Experience</label>
                      <input
                        type="number"
                        value={profile.experience_years}
                        onChange={(e) => setProfile({ ...profile, experience_years: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-gray-50 focus:bg-white"
                        min="0"
                        placeholder="Years of experience"
                      />
                    </div>

                    {/* Blood Group */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Blood Group</label>
                      <select
                        value={profile.blood_group}
                        onChange={(e) => setProfile({ ...profile, blood_group: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-gray-50 focus:bg-white"
                      >
                        <option value="">Select Blood Group</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>

                    {/* Gender */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Gender</label>
                      <select
                        value={profile.gender}
                        onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-gray-50 focus:bg-white"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {/* Join Date */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Date of Joining</label>
                      <input
                        type="date"
                        value={profile.joining_date}
                        onChange={(e) => setProfile({ ...profile, joining_date: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-gray-50 focus:bg-white"
                      />
                    </div>

                    {/* Shift Timing and Type */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="group">
                        <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Shift Timing</label>
                        <input
                          type="text"
                          value={profile.shift_timing}
                          onChange={(e) => setProfile({ ...profile, shift_timing: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-gray-50 focus:bg-white"
                          placeholder="e.g., Morning (7AM-3PM)"
                        />
                      </div>
                      <div className="group">
                        <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Shift Type</label>
                        <select
                          value={profile.shift_type}
                          onChange={(e) => setProfile({ ...profile, shift_type: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-gray-50 focus:bg-white"
                        >
                          <option value="DAY">Day Shift</option>
                          <option value="NIGHT">Night Shift</option>
                          <option value="EVENING">Evening Shift</option>
                          <option value="ROTATIONAL">Rotational Shift</option>
                        </select>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Address</label>
                      <textarea
                        value={profile.address}
                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-gray-50 focus:bg-white"
                        placeholder="Enter your address"
                        rows="3"
                      />
                    </div>

                    {/* Note */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Note</label>
                      <textarea
                        value={profile.note}
                        onChange={(e) => setProfile({ ...profile, note: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-gray-50 focus:bg-white"
                        placeholder="Enter any additional notes"
                        rows="2"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={handleSave}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 font-semibold transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                      >
                        <Save />Save Changes
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="flex-1 bg-gray-100 text-gray-800 px-6 py-3 rounded-xl hover:bg-gray-200 font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        <Close />Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border border-blue-100">
                          <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Staff ID</p>
                          <p className="text-lg font-bold text-gray-800 mt-2 font-mono">{profile.staff_id || 'N/A'}</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border border-blue-100">
                          <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Experience</p>
                          <p className="text-lg font-bold text-gray-800 mt-2">{profile.experience_years} <span className="text-sm">yrs</span></p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border border-blue-100">
                          <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">User ID</p>
                          <p className="text-sm font-bold text-gray-800 mt-2">{profile.user_id || 'N/A'}</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border border-blue-100">
                          <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Role</p>
                          <p className="text-sm font-bold text-gray-800 mt-2">{profile.role || 'N/A'}</p>
                        </div>
                      </div>

                      {/* Additional Information Grid */}
                      <div className="border-t border-gray-200 pt-6">
                        <h4 className="text-lg font-bold text-gray-800 mb-5">Personal Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border border-blue-200">
                            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Blood Group</p>
                            <p className="text-lg font-bold text-gray-800 mt-2">{profile.blood_group || 'N/A'}</p>
                          </div>
                          <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border border-blue-200">
                            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Gender</p>
                            <p className="text-lg font-bold text-gray-800 mt-2">{profile.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : 'N/A'}</p>
                          </div>
                          <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border border-blue-200">
                            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Mobile Number</p>
                            <p className="text-lg font-bold text-gray-800 mt-2">{profile.mobile_number || profile.phone || 'N/A'}</p>
                          </div>
                          <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border border-blue-200">
                            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Date of Joining</p>
                            <p className="text-lg font-bold text-gray-800 mt-2">{profile.joining_date ? new Date(profile.joining_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                          <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border border-blue-200">
                            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Work Area</p>
                            <p className="text-lg font-bold text-gray-800 mt-2">{profile.work_area || 'N/A'}</p>
                          </div>
                          <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border border-blue-200">
                            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Shift Type</p>
                            <p className="text-lg font-bold text-gray-800 mt-2">{profile.shift_type || 'N/A'}</p>
                          </div>
                          <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border border-blue-200">
                            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Shift Timing</p>
                            <p className="text-lg font-bold text-gray-800 mt-2">{profile.shift_timing || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Address Section */}
                      <div className="border-t border-gray-200 pt-6">
                        <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                          <LocationOn className="text-blue-600" />
                          Address
                        </h4>
                        <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border border-blue-200">
                          <p className="text-gray-700">{profile.address || 'No address added'}</p>
                        </div>
                      </div>

                      {/* Note Section */}
                      <div className="border-t border-gray-200 pt-6">
                        <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                          <Assignment className="text-blue-600" />
                          Note
                        </h4>
                        <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border border-blue-200">
                          <p className="text-gray-700">{profile.note || 'No notes added'}</p>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-6">
                        <h4 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
                          <LockOpen className="text-blue-600" />
                          Access Permissions
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                          <div className={`p-4 rounded-xl border-2 transition-all ${profile.permissions?.can_schedule_appointments
                            ? 'border-blue-200 bg-blue-50'
                            : 'border-gray-200 bg-gray-50'
                            }`}>
                            <div className="flex items-center gap-3">
                              {profile.permissions?.can_schedule_appointments ? (
                                <CheckCircle className="text-green-600 text-lg" />
                              ) : (
                                <FiberManualRecord className="text-gray-400" />
                              )}
                              <span className={profile.permissions?.can_schedule_appointments ? 'text-gray-800 font-semibold' : 'text-gray-500'}>
                                Schedule Appointments
                              </span>
                            </div>
                          </div>
                          <div className={`p-4 rounded-xl border-2 transition-all ${profile.permissions?.can_modify_appointments
                            ? 'border-blue-200 bg-blue-50'
                            : 'border-gray-200 bg-gray-50'
                            }`}>
                            <div className="flex items-center gap-3">
                              {profile.permissions?.can_modify_appointments ? (
                                <CheckCircle className="text-green-600 text-lg" />
                              ) : (
                                <FiberManualRecord className="text-gray-400" />
                              )}
                              <span className={profile.permissions?.can_modify_appointments ? 'text-gray-800 font-semibold' : 'text-gray-500'}>
                                Modify Appointments
                              </span>
                            </div>
                          </div>
                          <div className={`p-4 rounded-xl border-2 transition-all ${profile.permissions?.can_register_patients
                            ? 'border-blue-200 bg-blue-50'
                            : 'border-gray-200 bg-gray-50'
                            }`}>
                            <div className="flex items-center gap-3">
                              {profile.permissions?.can_register_patients ? (
                                <CheckCircle className="text-green-600 text-lg" />
                              ) : (
                                <FiberManualRecord className="text-gray-400" />
                              )}
                              <span className={profile.permissions?.can_register_patients ? 'text-gray-800 font-semibold' : 'text-gray-500'}>
                                Register Patients
                              </span>
                            </div>
                          </div>
                          <div className={`p-4 rounded-xl border-2 transition-all ${profile.permissions?.can_collect_payments
                            ? 'border-blue-300 bg-blue-50'
                            : 'border-gray-200 bg-gray-50'
                            }`}>
                            <div className="flex items-center gap-3">
                              {profile.permissions?.can_collect_payments ? (
                                <CheckCircle className="text-blue-600 text-lg" />
                              ) : (
                                <FiberManualRecord className="text-gray-400" />
                              )}
                              <span className={profile.permissions?.can_collect_payments ? 'text-gray-800 font-semibold' : 'text-gray-500'}>
                                Collect Payments
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>


                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

export default ReceptionProfile