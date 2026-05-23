import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import LoadingSpinner from '../../../../components/common/LoadingSpinner/LoadingSpinner'
import {
  getMyPatientProfile,
  updateMyPatientProfile
} from '../../../../services/patientApi'

// Map backend payload to frontend state
function normalizeProfile(payload) {
  const rawData = payload?.data || payload;
  // Handle if backend returns an array instead of a single object
  const data = Array.isArray(rawData) ? rawData[0] : (rawData || {});
  
  console.log('[Profile Debug] Final mapped data:', data);
  
  return {
    basicInfo: {
      patientId: data.patient_id || data.id || data.patient_ref || data.reference || data.PatientID || 'PAT-NEW',
      name: data.full_name || data.name || data.first_name || data.fullName || 'Patient',
      age: data.age || '—',
      gender: data.gender || data.Gender || '—',
      dob: data.date_of_birth || data.dob || data.DOB || '—',
      // Dynamic lookup for blood group to handle any case or underscore variations
      bloodGroup: (
        data.blood_group || data.blood_type || data.bloodgroup || data.bloodGroup ||
        Object.entries(data).find(([k]) => k.toLowerCase().includes('blood'))?.[1] || 
        '—'
      ),
      maritalStatus: data.marital_status || data.maritalStatus || '—'
    },
    contactInfo: {
      phone: data.phone_number || data.phone || '—',
      email: data.email || '—',
      address: data.address || data.street_address || '—',
      emergencyContact: {
        name: data.emergency_contact_name || '—',
        relationship: data.emergency_contact_relationship || '—',
        phone: data.emergency_contact_phone || '—'
      }
    },
    medicalInfo: {
      height: data.height || '—',
      weight: data.weight || '—',
      bmi: data.bmi || '—',
      allergies: Array.isArray(data.allergies) ? data.allergies : (data.allergies ? [data.allergies] : []),
      chronicConditions: Array.isArray(data.chronic_conditions) ? data.chronic_conditions : (data.chronic_conditions ? [data.chronic_conditions] : []),
      surgeries: Array.isArray(data.surgeries) ? data.surgeries : [],
      medications: Array.isArray(data.current_medications) ? data.current_medications : []
    },
    insuranceInfo: {
      provider: data.insurance_provider || '—',
      policyNumber: data.insurance_policy_number || '—',
      validity: data.insurance_validity || '—',
      coverage: data.insurance_coverage_type || '—',
      sumInsured: data.insurance_sum_insured || '—'
    },
    familyHistory: {
      father: data.family_history_father || '—',
      mother: data.family_history_mother || '—',
      siblings: data.family_history_siblings || '—'
    }
  }
}

// Convert frontend state back to flat backend payload
function preparePayload(formData) {
  const clean = (val) => (val === '—' || val === undefined || val === null) ? '' : String(val).trim();
  
  const payload = {
    full_name: clean(formData.basicInfo.name),
    gender: clean(formData.basicInfo.gender),
    date_of_birth: clean(formData.basicInfo.dob),
    blood_group: clean(formData.basicInfo.bloodGroup),
    bloodgroup: clean(formData.basicInfo.bloodGroup),
    blood_type: clean(formData.basicInfo.bloodGroup), // Added another common variation
    marital_status: clean(formData.basicInfo.maritalStatus),
    
    phone_number: clean(formData.contactInfo.phone),
    email: clean(formData.contactInfo.email),
    address: clean(formData.contactInfo.address),
    emergency_contact_name: clean(formData.contactInfo.emergencyContact.name),
    emergency_contact_relationship: clean(formData.contactInfo.emergencyContact.relationship),
    emergency_contact_phone: clean(formData.contactInfo.emergencyContact.phone),
    
    // Numeric fields: parse if they contain numbers, else null
    height: clean(formData.medicalInfo.height) ? parseFloat(clean(formData.medicalInfo.height)) : null,
    weight: clean(formData.medicalInfo.weight) ? parseFloat(clean(formData.medicalInfo.weight)) : null,
    
    insurance_provider: clean(formData.insuranceInfo.provider),
    insurance_policy_number: clean(formData.insuranceInfo.policyNumber),
    insurance_validity: clean(formData.insuranceInfo.validity),
    insurance_coverage_type: clean(formData.insuranceInfo.coverage),
    insurance_sum_insured: clean(formData.insuranceInfo.sumInsured) ? parseFloat(clean(formData.insuranceInfo.sumInsured)) : null,
  };

  // Remove null/empty fields to avoid overwriting with empty data if not edited
  Object.keys(payload).forEach(key => {
    if (payload[key] === '' || payload[key] === null) {
      delete payload[key];
    }
  });

  return payload;
}

const Profile = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState(() => normalizeProfile({}))
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState(() => normalizeProfile({}))

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    setLoading(true)
    try {
      const res = await getMyPatientProfile()
      const payload = await res.json().catch(() => ({}))
      console.log('[Profile] fetch payload:', payload)
      
      if (!res.ok) {
        toast.error(payload?.detail || 'Failed to load profile data.')
      }
      
      const normalized = normalizeProfile(payload)
      setProfile(normalized)
      setFormData(normalized)
    } catch (err) {
      console.error('[Profile] fetch error:', err)
      toast.error('Could not load profile. Check connection.')
      const fallback = normalizeProfile({})
      setProfile(fallback)
      setFormData(fallback)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const handleEmergencyContactChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo,
        emergencyContact: {
          ...prev.contactInfo.emergencyContact,
          [field]: value
        }
      }
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const body = preparePayload(formData)
      console.log('[Profile Save Request]', body)
      
      const res = await updateMyPatientProfile(body)
      const payload = await res.json().catch(() => ({}))
      console.log('[Profile Save Response]', payload)
      
      if (!res.ok) {
        // Handle FastAPI validation errors (422) or generic errors
        const errorMsg = payload?.detail 
          ? (Array.isArray(payload.detail) ? payload.detail.map(d => `${d.loc.join('.')}: ${d.msg}`).join(', ') : payload.detail)
          : (payload?.message || 'Failed to update profile.');
        
        toast.error(errorMsg)
        return
      }
      
      toast.success(payload?.message || 'Profile updated successfully!')
      setEditMode(false)
      await loadProfile() // Refresh data
    } catch (err) {
      console.error('[Profile] save error:', err)
      toast.error('Connection error. Could not reach server.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData(profile)
    setEditMode(false)
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-700">My Profile</h2>
          <p className="text-gray-500 text-sm mt-1">Manage your personal and medical information</p>
        </div>
        <div className="flex gap-2">
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center transition-colors"
            >
              <i className="fas fa-edit mr-2"></i> Edit Profile
            </button>
          ) : (
            <>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
              >
                {saving ? <i className="fas fa-circle-notch fa-spin mr-2"></i> : null}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center">
            <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mr-4">
              {(profile.basicInfo?.name || 'P').charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">{profile.basicInfo?.name}</h3>
              <div className="flex flex-wrap gap-3 mt-2">
                <span className="px-3 py-1 bg-white border border-blue-200 text-blue-700 rounded-full text-sm">
                  Patient ID: {profile.basicInfo?.patientId}
                </span>
                <span className="px-3 py-1 bg-white border border-blue-200 text-blue-700 rounded-full text-sm">
                  DOB: {profile.basicInfo?.dob}
                </span>
                <span className="px-3 py-1 bg-white border border-blue-200 text-blue-700 rounded-full text-sm">
                  Blood Group: {profile.basicInfo?.bloodGroup}
                </span>
              </div>
            </div>
          </div>
          <button className="px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors">
            <i className="fas fa-qrcode mr-2"></i> View Digital Health Card
          </button>
        </div>
      </div>

      {/* Profile Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-white rounded-xl card-shadow border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg flex items-center">
              <i className="fas fa-user text-blue-500 mr-2"></i>
              Basic Information
            </h3>
            {editMode && <span className="text-xs text-blue-600 font-medium">Editing</span>}
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Full Name</label>
                {editMode ? (
                  <input
                    type="text"
                    value={formData.basicInfo?.name || ''}
                    onChange={(e) => handleInputChange('basicInfo', 'name', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="font-medium text-gray-800">{profile.basicInfo?.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Date of Birth</label>
                {editMode ? (
                  <input
                    type="date"
                    value={formData.basicInfo?.dob || ''}
                    onChange={(e) => handleInputChange('basicInfo', 'dob', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="font-medium text-gray-800">{profile.basicInfo?.dob}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Gender</label>
                {editMode ? (
                  <select
                    value={formData.basicInfo?.gender || ''}
                    onChange={(e) => handleInputChange('basicInfo', 'gender', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <p className="font-medium text-gray-800">{profile.basicInfo?.gender}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Marital Status</label>
                {editMode ? (
                  <select
                    value={formData.basicInfo?.maritalStatus || ''}
                    onChange={(e) => handleInputChange('basicInfo', 'maritalStatus', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                ) : (
                  <p className="font-medium text-gray-800">{profile.basicInfo?.maritalStatus}</p>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1">Blood Group</label>
              {editMode ? (
                <select
                  value={formData.basicInfo?.bloodGroup || ''}
                  onChange={(e) => handleInputChange('basicInfo', 'bloodGroup', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              ) : (
                <p className="font-medium text-gray-800">{profile.basicInfo?.bloodGroup}</p>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-xl card-shadow border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg flex items-center">
              <i className="fas fa-address-book text-green-500 mr-2"></i>
              Contact Information
            </h3>
            {editMode && <span className="text-xs text-blue-600 font-medium">Editing</span>}
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Phone Number</label>
                {editMode ? (
                  <input
                    type="tel"
                    value={formData.contactInfo?.phone || ''}
                    onChange={(e) => handleInputChange('contactInfo', 'phone', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <p className="font-medium text-gray-800">{profile.contactInfo?.phone}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Email Address</label>
                {editMode ? (
                  <input
                    type="email"
                    value={formData.contactInfo?.email || ''}
                    onChange={(e) => handleInputChange('contactInfo', 'email', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <p className="font-medium text-gray-800">{profile.contactInfo?.email}</p>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1">Address</label>
              {editMode ? (
                <textarea
                  value={formData.contactInfo?.address || ''}
                  onChange={(e) => handleInputChange('contactInfo', 'address', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows="2"
                />
              ) : (
                <p className="font-medium text-gray-800">{profile.contactInfo?.address}</p>
              )}
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-700 mb-3">Emergency Contact</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm text-gray-600 mb-1">Name</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.contactInfo?.emergencyContact?.name || ''}
                      onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="font-medium text-gray-800">{profile.contactInfo?.emergencyContact?.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Relationship</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.contactInfo?.emergencyContact?.relationship || ''}
                      onChange={(e) => handleEmergencyContactChange('relationship', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="font-medium text-gray-800">{profile.contactInfo?.emergencyContact?.relationship}</p>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">Phone Number</label>
                  {editMode ? (
                    <input
                      type="tel"
                      value={formData.contactInfo?.emergencyContact?.phone || ''}
                      onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="font-medium text-gray-800">{profile.contactInfo?.emergencyContact?.phone}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Medical Information */}
        <div className="bg-white rounded-xl card-shadow border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg flex items-center">
              <i className="fas fa-heartbeat text-red-500 mr-2"></i>
              Medical Information
            </h3>
            {editMode && <span className="text-xs text-blue-600 font-medium">Editing</span>}
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Height</label>
                {editMode ? (
                  <input
                    type="text"
                    value={formData.medicalInfo?.height || ''}
                    placeholder="e.g. 175 cm"
                    onChange={(e) => handleInputChange('medicalInfo', 'height', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <p className="font-medium text-gray-800">{profile.medicalInfo?.height}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Weight</label>
                {editMode ? (
                  <input
                    type="text"
                    value={formData.medicalInfo?.weight || ''}
                    placeholder="e.g. 70 kg"
                    onChange={(e) => handleInputChange('medicalInfo', 'weight', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <p className="font-medium text-gray-800">{profile.medicalInfo?.weight}</p>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1">Allergies</label>
              <div className="flex flex-wrap gap-2">
                {profile.medicalInfo?.allergies?.length > 0 ? profile.medicalInfo.allergies.map((allergy, idx) => (
                  <span key={idx} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">{allergy}</span>
                )) : <p className="text-sm text-gray-500">No known allergies</p>}
              </div>
              {editMode && <p className="text-xs text-gray-400 mt-1">To update allergies, please contact your doctor.</p>}
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1">Chronic Conditions</label>
              <div className="flex flex-wrap gap-2">
                {profile.medicalInfo?.chronicConditions?.length > 0 ? profile.medicalInfo.chronicConditions.map((cond, idx) => (
                  <span key={idx} className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">{cond}</span>
                )) : <p className="text-sm text-gray-500">None reported</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Insurance Information */}
        <div className="bg-white rounded-xl card-shadow border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg flex items-center">
              <i className="fas fa-shield-alt text-purple-500 mr-2"></i>
              Insurance Information
            </h3>
            {editMode && <span className="text-xs text-blue-600 font-medium">Editing</span>}
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Provider</label>
                {editMode ? (
                  <input
                    type="text"
                    value={formData.insuranceInfo?.provider || ''}
                    onChange={(e) => handleInputChange('insuranceInfo', 'provider', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <p className="font-medium text-gray-800">{profile.insuranceInfo?.provider}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Policy Number</label>
                {editMode ? (
                  <input
                    type="text"
                    value={formData.insuranceInfo?.policyNumber || ''}
                    onChange={(e) => handleInputChange('insuranceInfo', 'policyNumber', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <p className="font-medium text-gray-800">{profile.insuranceInfo?.policyNumber}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Validity</label>
                {editMode ? (
                  <input
                    type="date"
                    value={formData.insuranceInfo?.validity || ''}
                    onChange={(e) => handleInputChange('insuranceInfo', 'validity', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <p className="font-medium text-gray-800">{profile.insuranceInfo?.validity}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Coverage</label>
                {editMode ? (
                  <select
                    value={formData.insuranceInfo?.coverage || ''}
                    onChange={(e) => handleInputChange('insuranceInfo', 'coverage', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select</option>
                    <option value="Individual">Individual</option>
                    <option value="Family Floater">Family Floater</option>
                    <option value="Senior Citizen">Senior Citizen</option>
                  </select>
                ) : (
                  <p className="font-medium text-gray-800">{profile.insuranceInfo?.coverage}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

export default Profile