import React, { useState, useRef, useEffect } from 'react';
import { apiFetch } from '../../../../services/apiClient';
import { getDoctorAppointments } from '../../../../services/doctorApi';
import { DOCTOR_PROFILE, DOCTOR_PROFILE_UPDATE } from '../../../../config/api';

const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1594824436998-d40d9cb115dd?q=80&w=2690&auto=format&fit=crop";

const DoctorProfile = () => {
  // ------------- PROFILE STATE -------------
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    title: "",
    gender: "",
    email: "",
    phone: "",
    address: "",
    experience: "",
    education: "",
    avatar: "",
    // API fields
    user_id: "",
    doctor_profile_id: "",
    hospital_id: "",
    staff_id: "",
    status: "",
    email_verified: false,
    phone_verified: false,
    timezone: "",
    language: "",
    joining_date: "",
    shift_timing: "",
    department_name: "",
    specialization: "",
    consultation_fee: 0,
    emergency_contact: "",
    doctor_experience_years: 0,
    medical_license_number: "",
    designation: "",
    qualifications: [],
    certifications: [],
    medical_associations: [],
    follow_up_fee: null,
    consultation_type: null,
    availability_time: null,
    is_available_for_emergency: false,
    is_accepting_new_patients: true,
    languages_spoken: [],
    bio: null
  });

  const fileInputRef = useRef(null);

  // Statistics state
  const [stats, setStats] = useState({
    totalPatients: 0,
    surgeries: 0,
    reviews: 0
  });

  // Today's Patients state
  const [patients, setPatients] = useState([]);

  // Fetch doctor profile data and related metrics
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Profile info
        const response = await apiFetch(DOCTOR_PROFILE);
        if (response && response.ok) {
          const data = await response.json();
          setProfile(prev => ({
            ...prev,
            name: `${data.first_name || ''} ${data.middle_name || ''} ${data.last_name || ''}`.trim() || 'Not specified',
            title: data.designation || data.specialization || 'Not specified',
            gender: data.gender || 'Not specified',
            email: data.email || 'Not specified',
            phone: data.phone || 'Not specified',
            address: data.user_metadata?.address || 'Not specified',
            experience: data.experience_years || data.doctor_experience_years ? `${data.experience_years || data.doctor_experience_years}+ Years` : 'Not specified',
            avatar: data.avatar_url || '',
            // API fields
            user_id: data.user_id || '',
            doctor_profile_id: data.doctor_profile_id || '',
            hospital_id: data.hospital_id || '',
            staff_id: data.staff_id || '',
            status: data.status || '',
            email_verified: data.email_verified || false,
            phone_verified: data.phone_verified || false,
            timezone: data.timezone || '',
            language: data.language || '',
            joining_date: data.user_metadata?.joining_date || '',
            shift_timing: data.user_metadata?.shift_timing || '',
            department_name: data.department || data.user_metadata?.department_name || '',
            specialization: data.specialization || data.user_metadata?.specialization || '',
            consultation_fee: data.consultation_fee || 0,
            emergency_contact: data.user_metadata?.emergency_contact || '',
            doctor_experience_years: data.doctor_experience_years || data.experience_years || 0,
            medical_license_number: data.medical_license_number || '',
            designation: data.designation || '',
            qualifications: data.qualifications || [],
            certifications: data.certifications || [],
            medical_associations: data.medical_associations || [],
            follow_up_fee: data.follow_up_fee || null,
            consultation_type: data.consultation_type || null,
            availability_time: data.availability_time || null,
            is_available_for_emergency: data.is_available_for_emergency || false,
            is_accepting_new_patients: data.is_accepting_new_patients || true,
            languages_spoken: data.languages_spoken || [],
            bio: data.bio || null
          }));
        }

        // 2. Fetch Dashboard Overview Statistics
        const overviewRes = await apiFetch('/api/v1/doctor-dashboard/overview');
        if (overviewRes && overviewRes.ok) {
          const overviewData = await overviewRes.json();
          const apiData = overviewData.data || overviewData || {};
          const statsObj = apiData.statistics || {};
          setStats({
            totalPatients: statsObj.total_patients_lifetime || 0,
            surgeries: statsObj.surgeries || 0,
            reviews: statsObj.reviews || 0
          });
        }

        // 3. Fetch Today's Appointments/Patients
        const todayDate = new Date().toISOString().split('T')[0];
        const appointmentsRes = await getDoctorAppointments({ date_from: todayDate, date_to: todayDate });
        if (appointmentsRes && appointmentsRes.ok) {
          const apptData = await appointmentsRes.json();
          const appointments = apptData.appointments || apptData.data?.appointments || [];
          const mappedPatients = appointments.map((apt, idx) => ({
            id: apt.id || apt._id || idx,
            time: apt.appointment_time || apt.time || 'N/A',
            status: apt.status || 'Pending',
            reason: apt.reason || apt.appointment_reason || 'Routine check up',
            name: apt.patient_name || apt.patient || 'Unknown Patient',
            visitType: apt.visitType || (apt.status === 'Urgent' || apt.type === 'Urgent' ? 'urgent' : 'check-up')
          }));
          setPatients(mappedPatients);
        }

        // 4. Fetch Weekly Schedule
        const scheduleRes = await apiFetch('/api/v1/doctor-management/schedule/weekly');
        if (scheduleRes && scheduleRes.ok) {
          const schedData = await scheduleRes.json();
          const weeklyData = schedData.data || schedData || {};
          const dailySchedules = weeklyData.daily_schedules || [];
          if (dailySchedules.length > 0) {
            const mappedAvailability = dailySchedules.map(day => {
              const dayName = day.day_name.charAt(0).toUpperCase() + day.day_name.slice(1).toLowerCase();
              let morningVal = '-';
              if (day.has_schedule && day.start_time && day.end_time) {
                morningVal = `${day.start_time} - ${day.end_time}`;
              }
              return {
                day: dayName,
                morning: morningVal,
                afternoon: '-',
                evening: '-'
              };
            });
            setAvailability(mappedAvailability);
          }
        }
      } catch (error) {
        console.error('Error fetching doctor profile dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile((prev) => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const toggleProfileEdit = async () => {
    if (isEditingProfile) {
      // User is saving - send PATCH request
      setLoading(true);
      try {
        // Build payload with only editable fields (exclude_unset behavior)
        const payloadData = {};
        
        // Include fields that can be updated based on DoctorProfileUpdate schema
        if (profile.email) payloadData.email = profile.email;
        if (profile.phone) payloadData.phone = profile.phone;
        if (profile.address) payloadData.address = profile.address;
        if (profile.specialization) payloadData.specialization = profile.specialization;
        if (profile.consultation_fee !== undefined && profile.consultation_fee !== null) payloadData.consultation_fee = profile.consultation_fee;
        if (profile.emergency_contact) payloadData.emergency_contact = profile.emergency_contact;
        if (profile.bio !== undefined && profile.bio !== null) payloadData.bio = profile.bio;
        if (profile.languages_spoken && profile.languages_spoken.length > 0) payloadData.languages_spoken = profile.languages_spoken;
        if (profile.is_available_for_emergency !== undefined) payloadData.is_available_for_emergency = profile.is_available_for_emergency;
        if (profile.is_accepting_new_patients !== undefined) payloadData.is_accepting_new_patients = profile.is_accepting_new_patients;

        const response = await apiFetch(DOCTOR_PROFILE_UPDATE, {
          method: 'PATCH',
          body: payloadData
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(result?.detail || result?.message || 'Failed to update profile');
        }

        // Refresh profile data after successful update
        const profileResponse = await apiFetch(DOCTOR_PROFILE);
        if (profileResponse && profileResponse.ok) {
          const data = await profileResponse.json();
          setProfile(prev => ({
            ...prev,
            name: `${data.first_name || ''} ${data.middle_name || ''} ${data.last_name || ''}`.trim() || 'Not specified',
            title: data.designation || data.specialization || 'Not specified',
            gender: data.gender || 'Not specified',
            email: data.email || 'Not specified',
            phone: data.phone || 'Not specified',
            address: data.user_metadata?.address || 'Not specified',
            experience: data.experience_years || data.doctor_experience_years ? `${data.experience_years || data.doctor_experience_years}+ Years` : 'Not specified',
            avatar: data.avatar_url || '',
            user_id: data.user_id || '',
            doctor_profile_id: data.doctor_profile_id || '',
            hospital_id: data.hospital_id || '',
            staff_id: data.staff_id || '',
            status: data.status || '',
            email_verified: data.email_verified || false,
            phone_verified: data.phone_verified || false,
            timezone: data.timezone || '',
            language: data.language || '',
            joining_date: data.user_metadata?.joining_date || '',
            shift_timing: data.user_metadata?.shift_timing || '',
            department_name: data.department || data.user_metadata?.department_name || '',
            specialization: data.specialization || data.user_metadata?.specialization || '',
            consultation_fee: data.consultation_fee || 0,
            emergency_contact: data.user_metadata?.emergency_contact || '',
            doctor_experience_years: data.doctor_experience_years || data.experience_years || 0,
            medical_license_number: data.medical_license_number || '',
            designation: data.designation || '',
            qualifications: data.qualifications || [],
            certifications: data.certifications || [],
            medical_associations: data.medical_associations || [],
            follow_up_fee: data.follow_up_fee || null,
            consultation_type: data.consultation_type || null,
            availability_time: data.availability_time || null,
            is_available_for_emergency: data.is_available_for_emergency || false,
            is_accepting_new_patients: data.is_accepting_new_patients || true,
            languages_spoken: data.languages_spoken || [],
            bio: data.bio || null
          }));
        }

        alert("Profile updated successfully!");
      } catch (error) {
        console.error('Error updating profile:', error);
        alert(error.message || 'Failed to update profile');
      } finally {
        setLoading(false);
      }
    }
    setIsEditingProfile(!isEditingProfile);
  };


  // ------------- SCHEDULE TABLE STATE -------------
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [availability, setAvailability] = useState([
    { day: 'Monday', morning: '-', afternoon: '-', evening: '-' },
    { day: 'Tuesday', morning: '-', afternoon: '-', evening: '-' },
    { day: 'Wednesday', morning: '-', afternoon: '-', evening: '-' },
    { day: 'Thursday', morning: '-', afternoon: '-', evening: '-' },
    { day: 'Friday', morning: '-', afternoon: '-', evening: '-' },
    { day: 'Saturday', morning: '-', afternoon: '-', evening: '-' },
    { day: 'Sunday', morning: '-', afternoon: '-', evening: '-' }
  ]);

  const handleScheduleChange = (index, field, value) => {
    const newAvailability = [...availability];
    newAvailability[index][field] = value;
    setAvailability(newAvailability);
  };

  const toggleScheduleEdit = () => {
    if (isEditingSchedule) {
      alert("Weekly schedule saved successfully!");
    }
    setIsEditingSchedule(!isEditingSchedule);
  };


  // ------------- PATIENTS STATE & FILTERING -------------
  const [visitType, setVisitType] = useState('check-up');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  
  // Filter patients based on selected visitType
  const filteredPatients = patients.filter(p => p.visitType === visitType);
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage) || 1;
  
  // Reset pagination when changing filters
  useEffect(() => {
    setCurrentPage(1);
  }, [visitType]);

  // Paginated data slice
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleActionClick = (action) => {
    alert(`Connecting to: ${action} module...`);
  };

  // Helper for Status Badge Styling
  const getStatusStyle = (status) => {
    switch(status) {
      case 'Confirm': return 'border-green-200 text-green-500 bg-green-50/50';
      case 'Pending': return 'border-gray-200 text-gray-500 bg-white shadow-sm';
      case 'Canceled': return 'border-[#fca5a5] text-[#ef4444] bg-[#fef2f2]';
      default: return 'border-gray-200 text-gray-500 bg-white';
    }
  };


  return (
    <div className="bg-[#f8f9fa] min-h-screen p-4 md:p-8 font-sans text-gray-800">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => window.history.back()}
          className="bg-white p-2 rounded-full shadow-sm text-gray-600 hover:text-gray-900 transition-colors w-10 h-10 flex items-center justify-center cursor-pointer hover:bg-gray-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
        </button>
        <h1 className="text-[28px] font-bold text-gray-900 tracking-tight">Doctor profile</h1>
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN - PROFILE CARD                                */}
        {/* ========================================================= */}
        <div className="w-full xl:w-[420px] bg-white rounded-[32px] p-8 shadow-sm relative flex flex-col pt-12">
          
          {/* Edit Button */}
          <button 
            onClick={toggleProfileEdit}
            className={`absolute top-6 right-6 ${isEditingProfile ? 'bg-green-500' : 'bg-[#1a1c1e]'} text-white p-2.5 rounded-full hover:opacity-80 transition-all shadow-md z-10`}
            title={isEditingProfile ? "Save changes" : "Edit Profile"}
          >
            {isEditingProfile ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
            )}
          </button>

          {/* Profile Header */}
          <div className="flex flex-col items-center mb-8 relative">
            <div className="relative group w-40 h-40 rounded-[32px] mb-6 mt-4 border-4 border-white shadow-[0_0_15px_rgba(0,0,0,0.05)] bg-blue-50">
              <img
                src={profile.avatar || DEFAULT_AVATAR}
                alt={profile.name}
                className="w-full h-full object-cover object-top rounded-[28px]"
              />
              {/* Image Upload Overlay */}
              <div 
                className={`absolute inset-0 bg-black/40 rounded-[28px] flex flex-col items-center justify-center cursor-pointer transition-opacity ${isEditingProfile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                onClick={() => fileInputRef.current.click()}
              >
                <svg className="w-8 h-8 text-white mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                <span className="text-white text-xs font-medium">Change Logo</span>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>
            
            <div className="absolute top-2 -right-2">
                <span className="bg-[#f0fdf4] text-[#22c55e] border border-[#bbf7d0] px-3 py-1 rounded-full text-xs font-medium tracking-wide">
                  Available
                </span>
            </div>
            
            {isEditingProfile ? (
              <input 
                name="name" value={profile.name} onChange={handleInputChange}
                className="text-[26px] font-bold text-gray-900 mb-1 text-center border-b-2 border-blue-500 focus:outline-none bg-transparent w-full"
              />
            ) : (
              <h2 className="text-[26px] font-bold text-gray-900 mb-1">{profile.name}</h2>
            )}
            
            {isEditingProfile ? (
              <input 
                name="title" value={profile.title} onChange={handleInputChange}
                className="text-gray-500 font-medium text-[15px] text-center border-b border-gray-300 focus:outline-none bg-transparent w-3/4 mt-1"
              />
            ) : (
              <p className="text-gray-500 font-medium text-[15px]">{profile.title}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-3 mb-8 border-b border-gray-100 pb-8">
            <button onClick={() => handleActionClick('Voice Call')} className="w-12 h-12 flex items-center justify-center rounded-[18px] bg-[#f8f9fa] text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-all border border-gray-100 shadow-sm shadow-gray-100/50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
            </button>
            <button onClick={() => handleActionClick('Appointment Booking')} className="flex-[1.5] h-12 flex items-center justify-center gap-2 rounded-[20px] bg-[#2563eb] text-white hover:bg-blue-700 transition-shadow shadow-[0_4px_14px_rgba(37,99,235,0.3)] font-medium tracking-wide">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              Booking
            </button>
            <button onClick={() => handleActionClick('Messages')} className="w-12 h-12 flex items-center justify-center rounded-[18px] bg-[#f8f9fa] text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-all border border-gray-100 shadow-sm shadow-gray-100/50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
            </button>
          </div>

          {/* Details List */}
          <div className="space-y-[22px] flex-1 px-1 mt-2">
            {[ 
              { icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>, label: "Gender", key: "gender" },
              { icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>, label: "Email", key: "email", isSmall: true },
              { icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>, label: "Phone number", key: "phone" },
              { icon: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></>, label: "Address", key: "address", isSmall: true, alignRight: true },
              { icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>, label: "Experience", key: "experience" },
              { icon: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"></path></>, label: "Education", key: "education" },
              { icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"></path>, label: "Staff ID", key: "staff_id" },
              { icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>, label: "Department", key: "department_name" },
              { icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>, label: "License No.", key: "medical_license_number" },
              { icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>, label: "Consultation Fee", key: "consultation_fee", format: (val) => val ? `$${val}` : 'Not set' },
              { icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>, label: "Emergency Contact", key: "emergency_contact" },
              { icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>, label: "Joining Date", key: "joining_date" },
              { icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>, label: "Shift Timing", key: "shift_timing" },
              { icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path>, label: "Languages", key: "languages_spoken", format: (val) => Array.isArray(val) && val.length > 0 ? val.join(', ') : 'Not specified' }
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                <div className="flex items-center gap-3 text-gray-400 shrink-0">
                  <div className="w-[38px] h-[38px] rounded-full bg-white flex items-center justify-center border border-gray-100 text-gray-500 shadow-sm shadow-gray-100/50">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {item.icon}
                    </svg>
                  </div>
                  <span className="font-medium text-[15px]">{item.label}</span>
                </div>
                {isEditingProfile ? (
                  <input 
                    name={item.key} 
                    value={profile[item.key]} 
                    onChange={handleInputChange}
                    className="border border-blue-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-2 py-1 text-sm bg-blue-50/30 text-gray-900 w-full sm:max-w-[180px] sm:text-right"
                  />
                ) : (
                  <span className={`${item.isSmall ? 'font-medium text-gray-800 text-sm' : 'font-semibold text-gray-900 text-[15px]'} ${item.alignRight ? 'max-w-[200px] sm:text-right truncate whitespace-normal' : ''}`}>
                    {item.format ? item.format(profile[item.key]) : (profile[item.key] || 'Not specified')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN - STATS & SECTIONS                           */}
        {/* ========================================================= */}
        <div className="flex-1 flex flex-col gap-6">
          
          {/* Top Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100/50 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <h3 className="text-gray-600 font-medium text-[16px] mb-4">Total patients</h3>
                <div className="flex items-center gap-4">
                  <div className="w-[52px] h-[52px] rounded-[18px] bg-[#eff6ff] text-[#3b82f6] flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                  </div>
                  <span className="text-[34px] font-bold text-gray-900 tracking-tight">{stats.totalPatients}</span>
                </div>
              </div>
              <p className="text-[#9ca3af] text-[13px] mt-6 leading-relaxed">
                Total lifetime patients seen.
              </p>
            </div>
            
            {/* Card 2 */}
            <div className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100/50 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <h3 className="text-gray-600 font-medium text-[16px] mb-4">Surgeries</h3>
                <div className="flex items-center gap-4">
                  <div className="w-[52px] h-[52px] rounded-[18px] bg-[#fef2f2] text-[#ef4444] flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                  </div>
                  <span className="text-[34px] font-bold text-gray-900 tracking-tight">{stats.surgeries || 0}</span>
                </div>
              </div>
              <p className="text-[#9ca3af] text-[13px] mt-6 leading-relaxed pr-4">
                Total surgeries completed.
              </p>
            </div>
            
            {/* Card 3 */}
            <div className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100/50 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <h3 className="text-gray-600 font-medium text-[16px] mb-4">Reviews</h3>
                <div className="flex items-center gap-4">
                  <div className="w-[52px] h-[52px] rounded-[18px] bg-[#fefce8] text-[#facc15] flex items-center justify-center">
                     <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                  </div>
                  <div className="flex items-baseline">
                    <span className="text-[34px] font-bold text-gray-900 tracking-tight">{stats.reviews ? stats.reviews.toFixed(1) : '0.0'}</span>
                    <span className="text-gray-400 text-[16px] ml-1 font-medium">/5.0</span>
                  </div>
                </div>
              </div>
              <p className="text-[#9ca3af] text-[13px] mt-6 leading-relaxed pr-4">
                Average patient feedback rating.
              </p>
            </div>
          </div>

          {/* Today Patient Section */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm flex-1 min-h-[400px]">
             
            {/* Header controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <h2 className="text-[20px] font-bold text-gray-900">Today patient</h2>
              
              <div className="flex flex-wrap items-center gap-6 md:gap-8 text-gray-500 font-medium text-[15px]">
                {/* Radio buttons */}
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-80">
                    <input 
                      type="radio" 
                      name="visitType" 
                      checked={visitType === 'check-up'}
                      onChange={() => setVisitType('check-up')}
                      className="hidden"
                    />
                    <div className={`relative flex items-center justify-center w-5 h-5 rounded-full border-2 ${visitType === 'check-up' ? 'border-blue-500' : 'border-gray-300'}`}>
                      {visitType === 'check-up' && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>}
                    </div>
                    <span className={`${visitType === 'check-up' ? 'text-gray-900' : 'text-gray-500'}`}>Check-up</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-80">
                    <input 
                      type="radio" 
                      name="visitType" 
                      checked={visitType === 'urgent'}
                      onChange={() => setVisitType('urgent')}
                      className="hidden"
                    />
                    <div className={`relative flex items-center justify-center w-5 h-5 rounded-full border-2 ${visitType === 'urgent' ? 'border-blue-500' : 'border-gray-300'}`}>
                      {visitType === 'urgent' && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>}
                    </div>
                    <span className={`${visitType === 'urgent' ? 'text-gray-900' : 'text-gray-500'}`}>Urgent visit</span>
                  </label>
                </div>

                {/* Pagination */}
                <div className="flex items-center gap-1 bg-gray-50/50 rounded-full px-2 py-1 border border-gray-100">
                  <span className="px-3 text-sm text-gray-600 font-medium">{currentPage}/{totalPages}</span>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${currentPage > 1 ? 'hover:bg-white hover:shadow-sm text-gray-700 cursor-pointer' : 'text-gray-300 cursor-not-allowed'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
                  </button>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${currentPage < totalPages ? 'hover:bg-white hover:shadow-sm text-gray-700 cursor-pointer' : 'text-gray-300 cursor-not-allowed'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Patients Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginatedPatients.length > 0 ? (
                paginatedPatients.map((patient) => {
                  const isActive = patient.status === 'Pending' || patient.status === 'Confirm' && patient.visitType === 'urgent';
                  
                  return (
                    <div 
                      key={patient.id} 
                      onClick={() => handleActionClick(`View Patient: ${patient.name}`)}
                      className={`p-[22px] rounded-3xl hover:shadow-md transition-shadow cursor-pointer group relative overflow-hidden border ${isActive ? 'bg-[#f0f6ff] border-blue-100' : 'bg-white border-gray-100'}`}
                    >
                      <div className="flex justify-between items-center mb-5">
                        <span className="font-semibold text-gray-900 tracking-wide text-sm group-hover:text-blue-600 transition-colors">{patient.time}</span>
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border tracking-wide uppercase ${getStatusStyle(patient.status)}`}>
                          {patient.status}
                        </span>
                      </div>
                      <h4 className={`font-semibold text-gray-900 mb-[14px] text-[17px] leading-snug w-4/5 pt-1`}>{patient.reason}</h4>
                      <div className="text-gray-500 font-medium text-[15px] pt-1">{patient.name}</div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-10 text-gray-400">
                  <p>No patients scheduled for {visitType} visits.</p>
                </div>
              )}
            </div>
          </div>

          {/* Weekly Availability Section */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm flex-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[20px] font-bold text-gray-900">Weekly Availability</h2>
              <button 
                onClick={toggleScheduleEdit}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isEditingSchedule ? 'bg-green-500 text-white hover:bg-green-600 shadow-md' : 'bg-[#f8f9fa] text-gray-600 border border-gray-200 hover:bg-gray-100 shadow-sm'}`}
              >
                {isEditingSchedule ? (
                  <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg> Save schedule</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg> Edit schedule</>
                )}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-[#f8fbff] text-[#64748b] text-[13px] font-semibold uppercase tracking-wider relative group">
                    <th className="py-4 px-6 rounded-l-xl">Day</th>
                    <th className="py-4 px-6">Morning</th>
                    <th className="py-4 px-6">Afternoon</th>
                    <th className="py-4 px-6 rounded-r-xl">Evening</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100/60">
                  {availability.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6 font-semibold text-gray-800 text-[14.5px]">{row.day}</td>
                      
                      <td className="py-4 px-4">
                        {isEditingSchedule ? (
                          <input 
                            value={row.morning} 
                            onChange={(e) => handleScheduleChange(idx, 'morning', e.target.value)}
                            className="w-full min-w-[100px] px-3 py-1.5 border border-green-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-[13px] font-medium text-[#059669] bg-white shadow-sm transition-all"
                            placeholder="e.g. 9AM - 12PM or -"
                          />
                        ) : (
                          row.morning !== '-' && row.morning !== '' ? (
                            <span className="inline-block px-3 py-1.5 rounded-md bg-[#ecfdf5] text-[#059669] text-[13px] font-medium tracking-wide">{row.morning}</span>
                          ) : (
                            <span className="inline-block px-3 py-1.5 rounded-md bg-gray-50 text-gray-400 text-[13px] font-medium">-</span>
                          )
                        )}
                      </td>

                      <td className="py-4 px-4">
                        {isEditingSchedule ? (
                          <input 
                            value={row.afternoon} 
                            onChange={(e) => handleScheduleChange(idx, 'afternoon', e.target.value)}
                            className="w-full min-w-[100px] px-3 py-1.5 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-[13px] font-medium text-[#3b82f6] bg-white shadow-sm transition-all"
                            placeholder="e.g. 2PM - 5PM or -"
                          />
                        ) : (
                          row.afternoon !== '-' && row.afternoon !== '' ? (
                            <span className="inline-block px-3 py-1.5 rounded-md bg-[#eff6ff] text-[#3b82f6] text-[13px] font-medium tracking-wide">{row.afternoon}</span>
                          ) : (
                            <span className="inline-block px-3 py-1.5 rounded-md bg-gray-50 text-gray-400 text-[13px] font-medium">-</span>
                          )
                        )}
                      </td>

                      <td className="py-4 px-4">
                        {isEditingSchedule ? (
                          <input 
                            value={row.evening} 
                            onChange={(e) => handleScheduleChange(idx, 'evening', e.target.value)}
                            className="w-full min-w-[100px] px-3 py-1.5 border border-yellow-200 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 text-[13px] font-medium text-[#eab308] bg-white shadow-sm transition-all"
                            placeholder="-"
                          />
                        ) : (
                          row.evening !== '-' && row.evening !== '' ? (
                            <span className="inline-block px-3 py-1.5 rounded-md bg-[#fefce8] text-[#eab308] text-[13px] font-medium tracking-wide">{row.evening}</span>
                          ) : (
                            <span className="inline-block px-3 py-1.5 rounded-md bg-gray-50 text-gray-400 text-[13px] font-medium">-</span>
                          )
                        )}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;