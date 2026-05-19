import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../../hooks/useAuth'

const NurseProfile = () => {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saveLoading, setSaveLoading] = useState(false)
  
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postal_code: "",
    emergency_contact: "",
    emergency_contact_phone: "",
    avatar_url: "",
    
    // Backend Specific fields
    id: "",
    user_id: "",
    hospital_id: "",
    created_at: "",
    updated_at: "",
    nurse_id: "",
    department_id: "",
    designation: "",
    nursing_license_number: "",
    specialization: "",
    experience_years: "",
    shift_type: "DAY",
    employment_type: "FULL_TIME",
    bio: "",
    is_active: true,
    qualifications: "",
    certifications: "",
    clinical_skills: "",
    languages_spoken: "",
    department_name: ""
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const getToken = () => {
    return (
      localStorage.getItem('access_token') ||
      localStorage.getItem('authToken') ||
      localStorage.getItem('token') ||
      ''
    );
  };

  const normalizeProfile = (data) => {
    const profileData = data?.data || data || {};
    return {
      ...profile,
      ...profileData,
      // Fallback to user auth context for personal info if not returned by profile endpoint
      name: profileData.name || user?.full_name || user?.name || profile.name,
      email: profileData.email || user?.email || profile.email,
      phone: profileData.phone || user?.phone_number || user?.phone || profile.phone,
      avatar_url: profileData.avatar_url || user?.avatar_url || profile.avatar_url || '',
      
      is_active: profileData.is_active !== undefined ? profileData.is_active : profile.is_active,
      experience_years: profileData.experience_years !== undefined ? String(profileData.experience_years) : profile.experience_years,
      department_name: profileData.department_name || profile.department_name || '',
      qualifications: Array.isArray(profileData.qualifications) ? profileData.qualifications.join(", ") : (profileData.qualifications || profile.qualifications),
      certifications: Array.isArray(profileData.certifications) ? profileData.certifications.join(", ") : (profileData.certifications || profile.certifications),
      clinical_skills: Array.isArray(profileData.clinical_skills) ? profileData.clinical_skills.join(", ") : (profileData.clinical_skills || profile.clinical_skills),
      languages_spoken: Array.isArray(profileData.languages_spoken) ? profileData.languages_spoken.join(", ") : (profileData.languages_spoken || profile.languages_spoken),
    };
  };

  const fetchProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = getToken()
      const response = await fetch('/api/v1/nurse/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.status}`)
      }
      const data = await response.json()
      setProfile(normalizeProfile(data))
    } catch (err) {
      console.error('Fetch profile error:', err.message, err)
      setError(`Could not load profile: ${err.message}`)
      // No fallback data injection to prevent overwriting with dummy data on fetch error
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaveLoading(true)
      const token = getToken()
      
      const payload = {
        department_id: profile.department_id || "DEPT-001",
        nurse_id: profile.nurse_id || user?.id || "NURSE-001",
        nursing_license_number: profile.nursing_license_number || "PENDING",
        designation: profile.designation || "Staff Nurse",
        specialization: profile.specialization,
        experience_years: parseInt(profile.experience_years) || 0,
        shift_type: profile.shift_type || "DAY",
        employment_type: profile.employment_type || "FULL_TIME",
        bio: profile.bio,
        is_active: profile.is_active,
        qualifications: profile.qualifications ? profile.qualifications.split(",").map(s => s.trim()).filter(Boolean) : [],
        certifications: profile.certifications ? profile.certifications.split(",").map(s => s.trim()).filter(Boolean) : [],
        clinical_skills: profile.clinical_skills ? profile.clinical_skills.split(",").map(s => s.trim()).filter(Boolean) : [],
        languages_spoken: profile.languages_spoken ? profile.languages_spoken.split(",").map(s => s.trim()).filter(Boolean) : [],
        
        // User specific fields
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        date_of_birth: profile.date_of_birth,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        country: profile.country,
        postal_code: profile.postal_code,
        emergency_contact: profile.emergency_contact,
        emergency_contact_phone: profile.emergency_contact_phone
      };

      const response = await fetch('/api/v1/nurse/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) {
        throw new Error(`Failed to update profile: ${response.status}`)
      }
      
      const data = await response.json()
      setProfile(normalizeProfile(data?.data || data))
      setIsEditing(false)
      alert('Profile updated successfully!')
    } catch (err) {
      console.error('Save profile error:', err.message, err)
      alert(`Error updating profile: ${err.message}`)
    } finally {
      setSaveLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-semibold text-gray-700 mb-6">My Profile</h2>
      
      {loading && (
        <div className="text-center text-gray-500 py-8">Loading profile...</div>
      )}
      
      {!loading && error && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mb-4 text-yellow-700">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-4 border rounded card-shadow">
          <div className="flex flex-col items-center mb-4">
            <img 
              src={profile.avatar_url || "https://i.pravatar.cc/100?img=5"} 
              className="w-24 h-24 rounded-full mb-3" 
              alt="Nurse" 
            />
            <h3 className="text-xl font-semibold">{profile.name}</h3>
            <p className="text-gray-600">{profile.designation} - {profile.department_name || profile.department_id}</p>
            <p className="text-xs text-gray-500 mt-1">
              <span className={`inline-block px-2 py-1 rounded-full ${profile.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {profile.is_active ? 'Active' : 'Inactive'}
              </span>
            </p>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-center">
              <i className="fas fa-envelope text-gray-500 w-5 mr-3"></i>
              <span>{profile.email}</span>
            </div>
            <div className="flex items-center">
              <i className="fas fa-phone text-gray-500 w-5 mr-3"></i>
              <span>{profile.phone}</span>
            </div>
            <div className="flex items-center">
              <i className="fas fa-clock text-gray-500 w-5 mr-3"></i>
              <span>Shift: {profile.shift_type}</span>
            </div>
            <div className="flex items-center">
              <i className="fas fa-briefcase text-gray-500 w-5 mr-3"></i>
              <span>Experience: {profile.experience_years} years</span>
            </div>
            {profile.nursing_license_number && (
              <div className="flex items-center">
                <i className="fas fa-certificate text-gray-500 w-5 mr-3"></i>
                <span>License: {profile.nursing_license_number}</span>
              </div>
            )}
            {profile.emergency_contact && (
              <div className="flex items-center">
                <i className="fas fa-phone-volume text-red-500 w-5 mr-3"></i>
                <span title="Emergency contact">{profile.emergency_contact}</span>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="w-full mt-4 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            disabled={saveLoading}
          >
            <i className="fas fa-edit mr-1"></i> {isEditing ? 'Cancel Editing' : 'Edit Profile'}
          </button>
        </div>
        
        <div className="bg-white p-4 border rounded card-shadow lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Professional Information</h3>
          
          {isEditing ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {/* Basic Info */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3 text-sm">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({...profile, name: e.target.value})}
                      className="w-full border rounded p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({...profile, email: e.target.value})}
                      className="w-full border rounded p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({...profile, phone: e.target.value})}
                      className="w-full border rounded p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={profile.date_of_birth}
                      onChange={(e) => setProfile({...profile, date_of_birth: e.target.value})}
                      className="w-full border rounded p-2 text-sm"
                    />
                  </div>
                </div>
              </div>
              
              {/* Professional Details */}
              <div className="border-t pt-3">
                <h4 className="font-medium text-gray-700 mb-3 text-sm">Professional Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
                    <input
                      type="text"
                      value={profile.department_id}
                      onChange={(e) => setProfile({...profile, department_id: e.target.value})}
                      className="w-full border rounded p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Designation</label>
                    <input
                      type="text"
                      value={profile.designation}
                      onChange={(e) => setProfile({...profile, designation: e.target.value})}
                      className="w-full border rounded p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Shift Type</label>
                    <select
                      value={profile.shift_type}
                      onChange={(e) => setProfile({...profile, shift_type: e.target.value})}
                      className="w-full border rounded p-2 text-sm"
                    >
                      <option value="DAY">Day Shift</option>
                      <option value="NIGHT">Night Shift</option>
                      <option value="ROTATING">Rotating</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Employment Type</label>
                    <select
                      value={profile.employment_type}
                      onChange={(e) => setProfile({...profile, employment_type: e.target.value})}
                      className="w-full border rounded p-2 text-sm"
                    >
                      <option value="FULL_TIME">Full Time</option>
                      <option value="PART_TIME">Part Time</option>
                      <option value="CONTRACT">Contract</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Experience (Years)</label>
                    <input
                      type="number"
                      value={profile.experience_years}
                      onChange={(e) => setProfile({...profile, experience_years: e.target.value})}
                      className="w-full border rounded p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Specialization</label>
                    <input
                      type="text"
                      value={profile.specialization}
                      onChange={(e) => setProfile({...profile, specialization: e.target.value})}
                      className="w-full border rounded p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">License Number</label>
                    <input
                      type="text"
                      value={profile.nursing_license_number}
                      onChange={(e) => setProfile({...profile, nursing_license_number: e.target.value})}
                      className="w-full border rounded p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                    <select
                      value={profile.is_active ? "true" : "false"}
                      onChange={(e) => setProfile({...profile, is_active: e.target.value === "true"})}
                      className="w-full border rounded p-2 text-sm"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Qualifications (comma separated)</label>
                    <input
                      type="text"
                      value={profile.qualifications}
                      onChange={(e) => setProfile({...profile, qualifications: e.target.value})}
                      className="w-full border rounded p-2 text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Certifications (comma separated)</label>
                    <input
                      type="text"
                      value={profile.certifications}
                      onChange={(e) => setProfile({...profile, certifications: e.target.value})}
                      className="w-full border rounded p-2 text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Clinical Skills (comma separated)</label>
                    <input
                      type="text"
                      value={profile.clinical_skills}
                      onChange={(e) => setProfile({...profile, clinical_skills: e.target.value})}
                      className="w-full border rounded p-2 text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Languages Spoken (comma separated)</label>
                    <input
                      type="text"
                      value={profile.languages_spoken}
                      onChange={(e) => setProfile({...profile, languages_spoken: e.target.value})}
                      className="w-full border rounded p-2 text-sm"
                    />
                  </div>
                </div>
              </div>
              
              {/* Address */}
              <div className="border-t pt-3">
                <h4 className="font-medium text-gray-700 mb-3 text-sm">Address</h4>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                    <input
                      type="text"
                      value={profile.address}
                      onChange={(e) => setProfile({...profile, address: e.target.value})}
                      className="w-full border rounded p-2 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                      <input
                        type="text"
                        value={profile.city}
                        onChange={(e) => setProfile({...profile, city: e.target.value})}
                        className="w-full border rounded p-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
                      <input
                        type="text"
                        value={profile.state}
                        onChange={(e) => setProfile({...profile, state: e.target.value})}
                        className="w-full border rounded p-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Country</label>
                      <input
                        type="text"
                        value={profile.country}
                        onChange={(e) => setProfile({...profile, country: e.target.value})}
                        className="w-full border rounded p-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Postal Code</label>
                      <input
                        type="text"
                        value={profile.postal_code}
                        onChange={(e) => setProfile({...profile, postal_code: e.target.value})}
                        className="w-full border rounded p-2 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Emergency Contact */}
              <div className="border-t pt-3">
                <h4 className="font-medium text-gray-700 mb-3 text-sm">Emergency Contact</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Contact Name</label>
                    <input
                      type="text"
                      value={profile.emergency_contact}
                      onChange={(e) => setProfile({...profile, emergency_contact: e.target.value})}
                      className="w-full border rounded p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Contact Phone</label>
                    <input
                      type="tel"
                      value={profile.emergency_contact_phone}
                      onChange={(e) => setProfile({...profile, emergency_contact_phone: e.target.value})}
                      className="w-full border rounded p-2 text-sm"
                    />
                  </div>
                </div>
              </div>
              
              {/* Bio */}
              <div className="border-t pt-3">
                <h4 className="font-medium text-gray-700 mb-3 text-sm">Bio</h4>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({...profile, bio: e.target.value})}
                  className="w-full border rounded p-2 text-sm"
                  rows="3"
                  placeholder="Enter your professional bio"
                />
              </div>
              
              <div className="flex gap-2 sticky bottom-0 bg-white pt-3 border-t">
                <button 
                  onClick={handleSave}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
                  disabled={saveLoading}
                >
                  {saveLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Experience</p>
                  <p className="font-medium">{profile.experience_years} years</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Qualifications</p>
                  <p className="font-medium">{profile.qualifications}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">License Number</p>
                  <p className="font-medium">{profile.nursing_license_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Certifications</p>
                  <p className="font-medium">{profile.certifications || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Specialization</p>
                  <p className="font-medium">{profile.specialization}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Department</p>
                  <p className="font-medium">{profile.department_name || profile.department_id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Clinical Skills</p>
                  <p className="font-medium">{profile.clinical_skills || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Languages Spoken</p>
                  <p className="font-medium">{profile.languages_spoken || 'N/A'}</p>
                </div>
              </div>
              
              <h4 className="font-medium mb-2 text-sm">Location</h4>
              <div className="text-sm text-gray-600 mb-6">
                {profile.address && <p>{profile.address}</p>}
                <p>{profile.city}, {profile.state} {profile.postal_code} {profile.country}</p>
              </div>
              
              {profile.emergency_contact && (
                <>
                  <h4 className="font-medium mb-2 text-sm">Emergency Contact</h4>
                  <div className="text-sm text-gray-600 mb-6">
                    <p>{profile.emergency_contact}</p>
                    <p>{profile.emergency_contact_phone}</p>
                  </div>
                </>
              )}
              
              {profile.bio && (
                <>
                  <h4 className="font-medium mb-2 text-sm">Bio</h4>
                  <p className="text-sm text-gray-600 mb-6">{profile.bio}</p>
                </>
              )}
              
              <h4 className="font-medium mb-2 text-sm">Current Responsibilities</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-2"></i>
                  <span>Patient vital signs monitoring</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-2"></i>
                  <span>Medication administration</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-2"></i>
                  <span>Emergency response team</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-2"></i>
                  <span>Patient education and counseling</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default NurseProfile