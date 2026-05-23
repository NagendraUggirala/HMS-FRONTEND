// src/pages/dashboards/AdminDashboard/pages/Settings.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateLogo, updateHospitalInfo } from '../../../../redux/slices/hospitalSlice';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import SecurityIcon from '@mui/icons-material/Security';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import InfoIcon from '@mui/icons-material/Info';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';

import { apiFetch } from '../../../../services/apiClient';
import { 
  HOSPITAL_ADMIN_ME, 
  HOSPITAL_ADMIN_ME_AVATAR, 
  HOSPITAL_ADMIN_ME_CHANGE_PASSWORD, 
  HOSPITAL_ADMIN_PLATFORM_FEATURES,
  HOSPITAL_ADMIN_PLATFORM_SUBSCRIPTION,
  HOSPITAL_ADMIN_PLATFORM_PLAN,
  HOSPITAL_ADMIN_PLATFORM_HOSPITAL,
  HOSPITAL_ADMIN_PLATFORM_MODULES,
  HOSPITAL_ADMIN_PLATFORM_USAGE,
  HOSPITAL_ADMIN_PLATFORM_COMBINED,
  PUBLIC_API_BASE_URL 
} from '../../../../config/api';

const Settings = () => {
  const dispatch = useDispatch();
  const { logo: hospitalLogo, name: hospitalName } = useSelector(state => state.hospital);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  
  // Profile Data
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    email: '',
    phone_number: '',
    profile_picture_url: '',
    timezone: '',
    language: '',
    security: {
      is_two_factor_enabled: false,
      enable_login_alerts: true,
      enable_suspicious_activity_alerts: true,
      inactivity_timeout_minutes: 30,
      enable_account_auto_lock: true,
      active_sessions: []
    }
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);
  
  // Platform Data
  const [platformFeatures, setPlatformFeatures] = useState({
    plan_name: '',
    plan_display_name: '',
    features: {}
  });
  const [subscription, setSubscription] = useState(null);
  const [plan, setPlan] = useState(null);
  const [hospitalRegistry, setHospitalRegistry] = useState(null);
  const [modules, setModules] = useState([]);
  const [usage, setUsage] = useState(null);
  const [platformLoading, setPlatformLoading] = useState(false);
  
  const fileInputRef = useRef(null);
  
  useEffect(() => {
    fetchProfile();
    fetchPlatformSettings();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch(HOSPITAL_ADMIN_ME);
      const data = await res.json();
      if (res.ok && data.success) {
        setProfile(data.data);
      }
      else {
        setError(data.message || 'Failed to fetch profile.');
      }
    }
    catch (err) {
      setError('An error occurred while fetching the profile.');
    }
    finally {
      setLoading(false);
    }
  };
  
  const fetchPlatformSettings = async () => {
    try {
      setPlatformLoading(true);
      const [featRes, subRes, planRes, hospRes, modRes, usageRes] = await Promise.all([
        apiFetch(HOSPITAL_ADMIN_PLATFORM_FEATURES),
        apiFetch(HOSPITAL_ADMIN_PLATFORM_SUBSCRIPTION),
        apiFetch(HOSPITAL_ADMIN_PLATFORM_PLAN),
        apiFetch(HOSPITAL_ADMIN_PLATFORM_HOSPITAL),
        apiFetch(HOSPITAL_ADMIN_PLATFORM_MODULES),
        apiFetch(HOSPITAL_ADMIN_PLATFORM_USAGE)
      ]);

      const [feat, sub, plan, hosp, mod, use] = await Promise.all([
        featRes.json(),
        subRes.json(),
        planRes.json(),
        hospRes.json(),
        modRes.json(),
        usageRes.json()
      ]);

      if (featRes.ok) setPlatformFeatures(feat);
      if (subRes.ok) setSubscription(sub);
      if (planRes.ok) setPlan(plan);
      if (hospRes.ok) setHospitalRegistry(hosp);
      if (modRes.ok) setModules(mod.modules || []);
      if (usageRes.ok) setUsage(use);

    }catch (err) {
      console.error('Failed to fetch platform settings:', err);
    } finally {
      setPlatformLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSecurityChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      security: { ...prev.security, [field]: value }
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);
      const payload = {
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        phone_number: profile.phone_number,
        middle_name: profile.middle_name,
        timezone: profile.timezone,
        language: profile.language,
        security: {
          enable_login_alerts: profile.security.enable_login_alerts,
          enable_suspicious_activity_alerts: profile.security.enable_suspicious_activity_alerts,
          inactivity_timeout_minutes: parseInt(profile.security.inactivity_timeout_minutes) || 30,
          enable_account_auto_lock: profile.security.enable_account_auto_lock
        }
      };

      const res = await apiFetch(HOSPITAL_ADMIN_ME, {
        method: 'PATCH',
        body: payload
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProfile(data.data);
        setSuccessMsg('Profile updated successfully!');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
      else {
        setError(data.message || 'Failed to update profile.');
      }
    }
    catch (err) {
      setError('An error occurred while updating the profile.');
    }
    finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('New passwords do not match.');
      return;
    }
    try {
      setPasswordSaving(true);
      setPasswordError(null);
      setPasswordSuccess(null);
      const res = await apiFetch(HOSPITAL_ADMIN_ME_CHANGE_PASSWORD, {
        method: 'POST',
        body: passwordForm
      });
      let data = {};
      try {
        data = await res.json();
      }
      catch (e) {
        // sometimes 200 response may just be a string or empty
      }
      
      if (res.ok) {
        setPasswordSuccess('Password changed successfully!');
        setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
        setTimeout(() => setPasswordSuccess(null), 3000);
      }
      else {
        setPasswordError(data.message || data.detail?.[0]?.msg || 'Failed to change password.');
      }
    }
    catch (err) {
      setPasswordError('An error occurred while changing password.');
    }
    finally {
      setPasswordSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setSaving(true);
      setError(null);
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiFetch(HOSPITAL_ADMIN_ME_AVATAR, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProfile(data.data);
        setSuccessMsg('Avatar updated successfully!');
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setError(data.message || 'Failed to upload avatar.');
      }
    }
    catch (err) {
      setError('An error occurred while uploading the avatar.');
    }
    finally {
      setSaving(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleHospitalLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const logoData = event.target.result;
      dispatch(updateLogo(logoData));
      setSuccessMsg('Hospital logo updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 animate-fade-in">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Loading settings...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: <AccountCircleIcon /> },
    { id: 'hospital', label: 'Hospital Registry', icon: <BusinessIcon /> },
    { id: 'subscription', label: 'Subscription & Plan', icon: <CreditCardIcon /> },
    { id: 'modules', label: 'Platform Modules', icon: <ViewModuleIcon /> },
  ];

  return (
    <div className="animate-fade-in space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings & Configuration</h1>
          <p className="text-gray-600 mt-1">
            Manage your account, hospital profile, and platform subscription.
          </p>
        </div>
        {/* {activeTab === 'profile' && (
          <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            onClick={handleSaveProfile} disabled={saving}>
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <SaveIcon />
            )}
            <span>{saving ? 'Saving...' : 'Save Profile'}</span>
          </button>
        )} */}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto pb-px">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all whitespace-nowrap font-medium ${
              activeTab === tab.id 
                ? 'border-blue-600 text-blue-600 bg-blue-50/50' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}>
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 flex items-center gap-3">
          <i className="fas fa-exclamation-circle text-lg"></i>
          <p className="font-medium">{error}</p>
        </div>
      )}

      {successMsg && (
        <div className="bg-green-50 text-green-600 p-4 rounded-xl border border-green-200 flex items-center gap-3">
          <CheckCircleIcon className="text-lg" />
          <p className="font-medium">{successMsg}</p>
        </div>
      )}

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden lg:col-span-1">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 h-24"></div>
                <div className="px-6 pb-6 relative">
                  <div className="absolute -top-12 left-6">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <img 
                        src={profile.profile_picture_url ? (profile.profile_picture_url.startsWith('http') ? profile.profile_picture_url : `${PUBLIC_API_BASE_URL}${profile.profile_picture_url.startsWith('/') ? '' : '/'}${profile.profile_picture_url}`) : 'https://via.placeholder.com/150'} 
                        alt="Profile"
                        className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-md bg-white"
                        onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=' + (profile.first_name || 'Admin') + '&background=0D8ABC&color=fff'; }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <PhotoCameraIcon className="text-white text-xl" />
                      </div>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                    </div>
                  </div>
                  <div className="pt-14">
                    <h3 className="text-xl font-bold text-gray-900">{profile.first_name} {profile.last_name}</h3>
                    <p className="text-gray-500 text-sm">{profile.email}</p>
                    <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <SecurityIcon className="text-green-500" />
                      <span>Hospital Admin</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Overview */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden lg:col-span-2">
                <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <LockIcon className="text-blue-600" />
                    Security & Access
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">2FA Status:</span>
                    {profile.security?.is_two_factor_enabled ? (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase">Enabled</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded uppercase">Disabled</span>
                    )}
                  </div>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div>
                        <p className="text-sm font-bold text-gray-900">Login Alerts</p>
                        <p className="text-xs text-gray-500">Notify on new device login</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input className="sr-only peer" type="checkbox" checked={profile.security?.enable_login_alerts || false}
                          onChange={(e) => handleSecurityChange('enable_login_alerts', e.target.checked)} />
                        <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div>
                        <p className="text-sm font-bold text-gray-900">Auto-Lock</p>
                        <p className="text-xs text-gray-500">Lock after inactivity</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input className="sr-only peer" type="checkbox" checked={profile.security?.enable_account_auto_lock || false}
                          onChange={(e) => handleSecurityChange('enable_account_auto_lock', e.target.checked)} />
                        <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-sm font-bold text-gray-900 mb-1">Timezone</p>
                      <select className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        value={profile.timezone || ''} onChange={(e) => handleInputChange('timezone', e.target.value)}>
                        <option value="UTC">UTC</option>
                        <option value="EST">EST</option>
                        <option value="PST">PST</option>
                        <option value="IST">IST</option>
                      </select>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-sm font-bold text-gray-900 mb-1">Language</p>
                      <select className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        value={profile.language || 'en'} onChange={(e) => handleInputChange('language', e.target.value)}>
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                        <option value="es">Spanish</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Forms Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Information Form */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <PersonIcon className="text-blue-600" />
                    Personal Information
                  </h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">First Name</label>
                    <input className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      type="text" value={profile.first_name || ''}
                      onChange={(e) => handleInputChange('first_name', e.target.value)} />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Last Name</label>
                    <input className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      type="text" value={profile.last_name || ''}
                      onChange={(e) => handleInputChange('last_name', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address</label>
                    <input className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      type="email" value={profile.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone Number</label>
                    <input className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      type="tel" value={profile.phone_number || ''}
                      onChange={(e) => handleInputChange('phone_number', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Change Password Form */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <LockIcon className="text-blue-600" />
                    Change Password
                  </h3>
                </div>
                <div className="p-6">
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    {passwordError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs">{passwordError}</div>}
                    {passwordSuccess && <div className="bg-green-50 text-green-600 p-3 rounded-lg text-xs">{passwordSuccess}</div>}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Current Password</label>
                      <input type="password" required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        value={passwordForm.current_password} onChange={(e) => setPasswordForm({...passwordForm, current_password: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">New Password</label>
                        <input type="password" required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                          value={passwordForm.new_password} onChange={(e) => setPasswordForm({...passwordForm, new_password: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirm New</label>
                        <input type="password" required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                          value={passwordForm.confirm_password} onChange={(e) => setPasswordForm({...passwordForm, confirm_password: e.target.value})} />
                      </div>
                    </div>
                    <button type="submit" disabled={passwordSaving} className="w-full py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl transition-all disabled:opacity-50 mt-2">
                      {passwordSaving ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hospital' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Logo Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col items-center gap-6">
                <div className="relative group">
                  <div className="w-40 h-40 rounded-3xl bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                    {hospitalLogo ? (
                      <img src={hospitalLogo} alt="Hospital Logo" className="w-full h-full object-contain p-4" />
                    ) : (
                      <div className="text-center text-gray-400">
                        <BusinessIcon style={{ fontSize: 64 }} className="mb-2" />
                        <p className="text-xs font-bold">NO LOGO</p>
                      </div>
                    )}
                  </div>
                  <button className="absolute inset-0 bg-black/40 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => document.getElementById('hosp-logo-up').click()}>
                    <PhotoCameraIcon className="text-white" />
                  </button>
                  <input id="hosp-logo-up" type="file" className="hidden" accept="image/*" onChange={handleHospitalLogoUpload} />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900">{hospitalName}</h3>
                  <p className="text-gray-500 text-sm">Main Identity & Branding</p>
                </div>
              </div>

              {/* Registry Details */}
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <InfoIcon className="text-blue-600" />
                    Platform Registry Information
                  </h3>
                </div>
                <div className="p-6">
                  {platformLoading ? (
                    <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
                  ) : hospitalRegistry ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Registration Number</p>
                        <p className="font-semibold text-gray-900">{hospitalRegistry.registration_number || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Status</p>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${hospitalRegistry.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {hospitalRegistry.status || (hospitalRegistry.is_active ? 'ACTIVE' : 'INACTIVE')}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Primary Email</p>
                        <p className="font-semibold text-gray-900">{hospitalRegistry.email || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Phone</p>
                        <p className="font-semibold text-gray-900">{hospitalRegistry.phone || 'N/A'}</p>
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Address</p>
                        <p className="font-semibold text-gray-900">{hospitalRegistry.address}, {hospitalRegistry.city}, {hospitalRegistry.state}, {hospitalRegistry.pincode}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">License Number</p>
                        <p className="font-semibold text-gray-900">{hospitalRegistry.license_number || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Established Date</p>
                        <p className="font-semibold text-gray-900">{hospitalRegistry.established_date ? new Date(hospitalRegistry.established_date).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                  ) : <p className="text-gray-500 text-center py-12">No registry data found.</p>}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'subscription' && (
          <div className="space-y-6">
            {/* Subscription Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                  <CreditCardIcon />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Current Plan</p>
                  <p className="text-lg font-bold text-gray-900">{subscription?.plan_id || 'Free Tier'}</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                  <CalendarTodayIcon />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Renewal Date</p>
                  <p className="text-lg font-bold text-gray-900">{subscription?.end_date ? new Date(subscription.end_date).toLocaleDateString() : 'Never'}</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                  <SignalCellularAltIcon />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Status</p>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${subscription?.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {subscription?.status || 'UNKNOWN'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Plan Quotas */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <SignalCellularAltIcon className="text-blue-600" />
                    Plan Quotas & Limits
                  </h3>
                </div>
                <div className="p-6 space-y-6">
                  {plan ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <p className="text-xs font-bold text-gray-400 uppercase mb-1">Max Doctors</p>
                          <p className="text-xl font-bold text-gray-900">{plan.unlimited_doctors ? 'Unlimited' : plan.max_doctors}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <p className="text-xs font-bold text-gray-400 uppercase mb-1">Max Patients</p>
                          <p className="text-xl font-bold text-gray-900">{plan.unlimited_patients ? 'Unlimited' : plan.max_patients}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <p className="text-xs font-bold text-gray-400 uppercase mb-1">Monthly Appointments</p>
                          <p className="text-xl font-bold text-gray-900">{plan.max_appointments_per_month || '∞'}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <p className="text-xs font-bold text-gray-400 uppercase mb-1">Storage Limit</p>
                          <p className="text-xl font-bold text-gray-900">{plan.max_storage_gb} GB</p>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-gray-100">
                        <p className="text-sm text-gray-500 mb-2">{plan.description}</p>
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-gray-900">₹{plan.monthly_price}/mo</p>
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-sm">Change Plan</button>
                        </div>
                      </div>
                    </>
                  ) : <p className="text-gray-500 text-center py-12">No plan information available.</p>}
                </div>
              </div>

              {/* Usage Comparison */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <SignalCellularAltIcon className="text-blue-600" />
                    Resource Usage
                  </h3>
                </div>
                <div className="p-6 space-y-6">
                  {usage ? (
                    <>
                      {Object.entries(usage.current_usage || {}).map(([key, value]) => {
                        const limit = usage.limits?.[key] || 0;
                        const percentage = limit > 0 ? Math.min(100, (value / limit) * 100) : 0;
                        const colorClass = percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-yellow-500' : 'bg-blue-600';
                        
                        return (
                          <div key={key}>
                            <div className="flex justify-between mb-2">
                              <span className="text-sm font-bold text-gray-700 capitalize">{key.replace(/_/g, ' ')}</span>
                              <span className="text-sm text-gray-500 font-medium">{value} / {limit || '∞'}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div className={`${colorClass} h-2 rounded-full transition-all duration-500`} style={{ width: `${limit > 0 ? percentage : 0}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  ) : <p className="text-gray-500 text-center py-12">Usage data not available.</p>}
                  
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex items-start gap-3">
                    <InfoIcon className="text-blue-600 mt-0.5" />
                    <p className="text-xs text-blue-800 leading-relaxed">
                      Usage metrics are updated every hour. If you exceed your plan limits, some features may be temporarily restricted.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'modules' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <ViewModuleIcon className="text-blue-600" />
                  Available Platform Modules
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {modules.length > 0 ? modules.map((module) => (
                    <div key={module.key} className={`p-5 rounded-2xl border transition-all ${module.enabled ? 'bg-white border-blue-100 shadow-sm' : 'bg-gray-50 border-gray-200 grayscale opacity-60'}`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${module.enabled ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-300 text-gray-500'}`}>
                          <i className={`fas ${module.key === 'lab_tests' ? 'fa-vial' : module.key === 'video_consultation' ? 'fa-video' : module.key === 'pharmacy' ? 'fa-pills' : 'fa-cube'}`}></i>
                        </div>
                        {module.enabled ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase">Active</span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-200 text-gray-500 text-[10px] font-bold rounded uppercase">Locked</span>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-gray-900 mb-1">{module.label}</h4>
                      <p className="text-xs text-gray-500 leading-relaxed mb-4">{module.description || 'Enhance your hospital operations with this integrated module.'}</p>
                      
                      {!module.enabled && (
                        <button className="w-full py-2 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-black transition-colors">
                          Unlock Module
                        </button>
                      )}
                    </div>
                  )) : (
                    <div className="col-span-full py-12 text-center text-gray-500">
                      No modules information available.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold mb-2">Ready to expand your capabilities?</h3>
                <p className="text-blue-100 max-w-xl">
                  Unlock advanced modules like Video Consultations, Pharmacy Inventory, and Lab Management with our Enterprise plan.
                </p>
              </div>
              <button className="px-8 py-4 bg-white text-blue-600 font-bold rounded-2xl hover:bg-blue-50 transition-all shadow-lg whitespace-nowrap">
                Upgrade Now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;