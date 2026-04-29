// src/pages/dashboards/LabDashboard/pages/LabProfile.jsx
import React, { useState, useEffect } from "react";
import Button from "../../../../components/common/Button/Button";
import Modal from "../../../../components/common/Modal/Modal";
import LoadingSpinner from "../../../../components/common/LoadingSpinner/LoadingSpinner";

const LabProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [labData, setLabData] = useState({});
  const [editForm, setEditForm] = useState({});
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [settings, setSettings] = useState({});
  useEffect(() => {
    loadLabData();
  }, []);

  const loadLabData = async () => {
    setLoading(true);
    setTimeout(() => {
      const mockData = {
        labInfo: {
          id: "LEV-LAB-001",
          name: "Levitica Healthcare",
          type: "Advanced Diagnostic & Research Center",
          registrationNumber: "LHC/RG/2026/088",
          establishedDate: "2010-04-12",
          accreditation: "NABL Accredited (ISO 15189:2022)",
          accreditationNumber: "MC-202488",
          accreditationValidUntil: "2028-04-11",
        },
        contactInfo: {
          address: "Levitica Towers, 4th Floor, Tech Park West",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400051",
          country: "India",
          phone: "+91 22 8888 7777",
          emergencyPhone: "+91 9999 000 111",
          email: "lab.support@levitica.com",
          website: "www.levitica.com/diagnostics",
        },
        operationalInfo: {
          workingHours: "24/7 Fully Operational",
          weekdays: "Mon-Sat: 24 Hours",
          sunday: "Sun: 8:00 AM - 8:00 PM (Emergency 24/7)",
          emergencyServices: "STAT Laboratory Services Available",
          homeCollection: "Premium Home Sample Collection",
          reportDelivery: "Digital Portal, WhatsApp, Email, Physical",
        },
        personnel: {
          director: "Dr. Senior Consultant",
          labManager: "Dr. Anita Rao",
          qualityManager: "Mr. Vikram Singh",
          totalTechnicians: 32,
          totalStaff: 58,
        },
        facilities: {
          totalArea: "12,500 sq.ft. (Modern Facility)",
          departments: [
            "Molecular Diagnostics",
            "Genomics",
            "Hematology & Coagulation",
            "Biochemistry",
            "Advanced Microbiology",
            "Cytopathology",
          ],
          specialties: [
            "Precision Medicine",
            "Infectious Diseases",
            "Rare Disease Screening",
            "Onco-Pathology",
          ],
          equipmentCount: 142,
          rooms: [
            "Robotic Sample Processing",
            "BSL-3 Testing Bay",
            "Genomics Suite",
            "Cryo-Storage",
            "Client Experience Zone",
          ],
        },
        services: {
          totalTests: 1250,
          sampleTypes: [
            "Blood",
            "Urine",
            "Tissue Biopsy",
            "CSF",
            "Bone Marrow",
            "Genetic Swabs",
          ],
          turnAroundTime: {
            routine: "12-24 hours",
            urgent: "2-4 hours",
            stat: "45-90 minutes",
          },
          branches: 12,
        },
        userProfile: {
          name: "Dr. Senior Consultant",
          email: "director@levitica.com",
          role: "Laboratory Director",
          department: "Executive Management",
          phone: "+91 99887 76655",
          joinedDate: "2010-04-12",
          lastLogin: new Date().toLocaleString(),
          status: "Active",
        },
        settings: {
          autoPrintReports: false,
          emailNotifications: true,
          smsNotifications: true,
          criticalResultAlert: true,
          qcAlertThreshold: "2SD",
          reportTemplate: "Standard",
          language: "English",
          timezone: "IST (UTC+5:30)",
        },
      };

      setLabData(mockData);
      setEditForm(mockData.labInfo);
      setSettings(mockData.settings);
      setLoading(false);
    }, 1000);
  };

  const handleSaveProfile = () => {
    setSaving(true);
    setTimeout(() => {
      setLabData({
        ...labData,
        labInfo: editForm,
      });
      setSaving(false);
      setShowEditModal(false);
      alert("Lab profile updated successfully!");
    }, 1500);
  };

  const handleChangePassword = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("New passwords do not match!");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      alert("Password must be at least 6 characters long!");
      return;
    }

    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setShowPasswordModal(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      alert("Password changed successfully!");
    }, 1500);
  };

  const handleSaveSettings = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setShowSettingsModal(false);
      alert("Settings updated successfully!");
    }, 1500);
  };

  const handleExportData = (type) => {
    alert(`Exporting ${type} data...`);
    // In real app, trigger download
  };

  const handlePrintProfile = () => {
    alert("Printing lab profile...");
    window.print();
  };

  if (loading)
    return <LoadingSpinner fullScreen text="Loading lab profile..." />;

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        {/* Compact Header */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <i className="fas fa-microscope text-xl"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {labData.labInfo?.name}
              </h2>
              <p className="text-xs text-gray-400 font-medium tracking-tight">
                Management & Profile Command Center
              </p>
            </div>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <Button variant="outline" icon="fas fa-print"
              onClick={handlePrintProfile} className="rounded-xl">
              Print Profile
            </Button>
            <Button variant="primary" icon="fas fa-edit"
              onClick={() => setShowEditModal(true)} className="rounded-xl shadow-lg shadow-blue-100">
              Edit Profile
            </Button>
          </div>
        </div>

        {/* Uniform Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Lab Identity */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col">
            <div className="p-4 border-b bg-gray-50/50 flex items-center gap-2">
              <i className="fas fa-id-card text-blue-600"></i>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                Identity
              </h3>
            </div>
            <div className="p-5 space-y-4 flex-grow">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-gray-400 uppercase">
                  Lab ID
                </span>
                <span className="text-xs font-mono font-bold text-gray-800">
                  {labData.labInfo?.id}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-gray-400 uppercase">
                  Registration
                </span>
                <span className="text-xs font-bold text-gray-800">
                  {labData.labInfo?.registrationNumber}
                </span>
              </div>
              <div className="pt-2 border-t">
                <span className="text-[11px] font-bold text-gray-400 uppercase block mb-2">
                  Accreditation
                </span>
                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                  <p className="text-xs font-bold text-blue-700">
                    {labData.labInfo?.accreditation}
                  </p>
                  <p className="text-[10px] text-blue-400 mt-1">
                    Valid Until: {labData.labInfo?.accreditationValidUntil}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: User Access Profile */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col">
            <div className="p-4 border-b bg-gray-50/50 flex items-center gap-2">
              <i className="fas fa-user-shield text-green-600"></i>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                Administrator
              </h3>
            </div>
            <div className="p-5 space-y-4 flex-grow">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 border border-green-100">
                  <i className="fas fa-user-md text-xl"></i>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">
                    {labData.userProfile?.name}
                  </h4>
                  <p className="text-[10px] font-bold text-green-600 uppercase mt-0.5">
                    {labData.userProfile?.role}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Email</span>
                  <span className="font-medium text-gray-700">
                    {labData.userProfile?.email}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Dept</span>
                  <span className="font-medium text-gray-700">
                    {labData.userProfile?.department}
                  </span>
                </div>
              </div>
              <Button variant="outline" size="sm" icon="fas fa-key"
                onClick={() => setShowPasswordModal(true)}
                className="w-full justify-center text-[10px] h-8 mt-2">
                Update Security
              </Button>
            </div>
          </div>

          {/* Card 3: Contact & Support */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col">
            <div className="p-4 border-b bg-gray-50/50 flex items-center gap-2">
              <i className="fas fa-headset text-purple-600"></i>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                Communication
              </h3>
            </div>
            <div className="p-5 space-y-4 flex-grow">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <i className="fas fa-map-marker-alt text-purple-300 mt-1"></i>
                  <p className="text-xs font-bold text-gray-800 leading-tight">
                    {labData.contactInfo?.address}, {labData.contactInfo?.city}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-gray-50 rounded-lg text-center">
                    <span className="text-[9px] font-bold text-gray-400 uppercase block">
                      Phone
                    </span>
                    <span className="text-[11px] font-bold text-gray-800">
                      {labData.contactInfo?.phone}
                    </span>
                  </div>
                  <div className="p-2 bg-red-50 rounded-lg text-center border border-red-100">
                    <span className="text-[9px] font-bold text-red-400 uppercase block">
                      Urgent
                    </span>
                    <span className="text-[11px] font-bold text-red-700">
                      {labData.contactInfo?.emergencyPhone}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-blue-600 font-medium pt-2">
                <i className="fas fa-globe"></i>
                {labData.contactInfo?.website}
              </div>
            </div>
          </div>

          {/* Card 4: Operations & Hours */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col">
            <div className="p-4 border-b bg-gray-50/50 flex items-center gap-2">
              <i className="fas fa-clock text-orange-600"></i>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                Operations
              </h3>
            </div>
            <div className="p-5 space-y-4 flex-grow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600">Hours</span>
                <span className="px-2 py-1 bg-orange-50 text-orange-700 text-[10px] font-bold rounded-full">
                  {labData.operationalInfo?.workingHours}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400 italic">Mon-Sat</span>
                  <span className="font-bold text-gray-700">
                    {labData.operationalInfo?.weekdays}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400 italic">Sunday</span>
                  <span className="font-bold text-gray-700">
                    {labData.operationalInfo?.sunday}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 5: Infrastructure */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col">
            <div className="p-4 border-b bg-gray-50/50 flex items-center gap-2">
              <i className="fas fa-building text-teal-600"></i>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                Facility
              </h3>
            </div>
            <div className="p-5 space-y-4 flex-grow">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-600">Area</span>
                <span className="text-xs font-bold text-gray-800">
                  {labData.facilities?.totalArea}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-2">
                  Departments
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {labData.facilities?.departments
                    ?.slice(0, 4)
                    .map((dept, index) => (
                      <span key={index}
                        className="px-2 py-0.5 bg-teal-50 text-teal-700 text-[9px] font-bold rounded border border-teal-100" >
                        {dept}
                      </span>
                    ))}
                  {labData.facilities?.departments?.length > 4 && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[9px] font-bold rounded">
                      +{labData.facilities?.departments.length - 4} More
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card 6: Service Delivery */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col">
            <div className="p-4 border-b bg-gray-50/50 flex items-center gap-2">
              <i className="fas fa-concierge-bell text-red-600"></i>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                Services
              </h3>
            </div>
            <div className="p-5 space-y-4 flex-grow">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl text-center">
                  <p className="text-lg font-extrabold text-gray-800">
                    {labData.services?.totalTests}
                  </p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">
                    Tests
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl text-center">
                  <p className="text-lg font-extrabold text-gray-800">
                    {labData.services?.branches}
                  </p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">
                    Branches
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-medium italic">
                  STAT Emergency
                </span>
                <span className="px-2 py-0.5 bg-red-600 text-white font-bold rounded text-[10px]">
                  {labData.services?.turnAroundTime?.stat}
                </span>
              </div>
            </div>
          </div>

          {/* Card 7: Lab Configurations */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col lg:col-span-2">
            <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <i className="fas fa-cog text-gray-600"></i>
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                  Configurations
                </h3>
              </div>
              <Button variant="outline" size="sm" icon="fas fa-sliders-h"
                onClick={() => setShowSettingsModal(true)} className="h-7 text-[10px]">
                Configure
              </Button>
            </div>
            <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4 flex-grow">
              {[
                {
                  label: "Auto Print",
                  status: labData.settings?.autoPrintReports,
                  icon: "fas fa-print",
                },
                {
                  label: "Email Alerts",
                  status: labData.settings?.emailNotifications,
                  icon: "fas fa-envelope",
                },
                {
                  label: "SMS Gateway",
                  status: labData.settings?.smsNotifications,
                  icon: "fas fa-sms",
                },
                {
                  label: "Critical Alert",
                  status: labData.settings?.criticalResultAlert,
                  icon: "fas fa-bell",
                },
              ].map((set, i) => (
                <div key={i} className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-xl border border-gray-100 group">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${set.status ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-400"}`}>
                    <i className={set.icon}></i>
                  </div>
                  <span className="text-[10px] font-bold text-gray-600 uppercase text-center mb-1">
                    {set.label}
                  </span>
                  <div className={`w-1.5 h-1.5 rounded-full ${set.status ? "bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" : "bg-gray-300"}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Card 8: Certifications */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col">
            <div className="p-4 border-b bg-gray-50/50 flex items-center gap-2">
              <i className="fas fa-certificate text-yellow-500"></i>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                Certificates
              </h3>
            </div>
            <div className="p-5 space-y-3 flex-grow">
              {[
                { name: "NABL ISO 15189", date: "2028" },
                { name: "CLIA Compliance", date: "2027" },
              ].map((cert, i) => (
                <div key={i} className="flex items-center justify-between p-2 border border-gray-50 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-file-contract text-yellow-600 text-xs"></i>
                    <span className="text-[11px] font-bold text-gray-700">
                      {cert.name}
                    </span>
                  </div>
                  <button className="text-blue-600">
                    <i className="fas fa-download text-[10px]"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex flex-wrap gap-3 justify-center pt-8 border-t">
          <Button variant="outline" size="sm" icon="fas fa-file-export"
            onClick={() => handleExportData("profile")}>
            Export Data
          </Button>
          <Button variant="outline" size="sm" icon="fas fa-history"
            onClick={() => alert("Audit log...")}>
            Audit Log
          </Button>
          <Button variant="outline" size="sm" icon="fas fa-question-circle"
            onClick={() => alert("Help...")}>
            Help
          </Button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Update Lab Profile" size="lg">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Lab Corporate Name
              </label>
              <input type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                value={editForm.name || ""}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Diagnostic Category
              </label>
              <input type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                value={editForm.type || ""}
                onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Government Reg. No.
              </label>
              <input type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                value={editForm.registrationNumber || ""}
                onChange={(e) => setEditForm({ ...editForm, registrationNumber: e.target.value,})}
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Establishment Date
              </label>
              <input type="date" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                value={editForm.establishedDate || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, establishedDate: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Primary Accreditation
              </label>
              <input type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                value={editForm.accreditation || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, accreditation: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Accreditation Ref ID
              </label>
              <input type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                value={editForm.accreditationNumber || ""}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    accreditationNumber: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-50">
            <Button variant="outline" onClick={() => setShowEditModal(false)} className="rounded-xl px-6">
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveProfile} disabled={saving}
              className="rounded-xl px-8 shadow-lg shadow-blue-100">
              {saving ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Syncing...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Change Password Modal */}
      <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Security Update">
        <div className="space-y-6">
          <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 flex items-start gap-3">
            <i className="fas fa-shield-halved text-blue-600 mt-1"></i>
            <div>
              <p className="text-xs font-bold text-blue-700">
                Password Requirements
              </p>
              <p className="text-[10px] text-blue-600/70 mt-0.5 leading-relaxed">
                Ensure your new password is at least 6 characters long and
                includes a mix of alphanumeric characters.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Current Access Pin
              </label>
              <input type="password" placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    currentPassword: e.target.value,
                  })
                }
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                New Security Password
              </label>
              <input type="password" placeholder="New Password"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    newPassword: e.target.value,
                  })
                }
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Verify New Password
              </label>
              <input type="password" placeholder="Confirm Password"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirmPassword: e.target.value,
                  })
                }
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-50">
            <Button variant="outline" onClick={() => setShowPasswordModal(false)} className="rounded-xl px-6">
              Cancel
            </Button>
            <Button variant="primary" onClick={handleChangePassword} disabled={saving} className="rounded-xl px-8 shadow-lg shadow-blue-100">
              {saving ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Updating...
                </>
              ) : (
                "Update Access"
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} title="Lab Settings" size="lg">
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">
              Notification Settings
            </h4>
            <div className="space-y-3">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={settings.emailNotifications}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      emailNotifications: e.target.checked,
                    })
                  }
                />
                <span className="ml-2 text-gray-700">Email Notifications</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={settings.smsNotifications}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      smsNotifications: e.target.checked,
                    })
                  }
                />
                <span className="ml-2 text-gray-700">SMS Notifications</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={settings.criticalResultAlert}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      criticalResultAlert: e.target.checked,
                    })
                  }
                />
                <span className="ml-2 text-gray-700">
                  Critical Result Alerts
                </span>
              </label>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-700 mb-3">
              Report Settings
            </h4>
            <div className="space-y-3">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={settings.autoPrintReports}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      autoPrintReports: e.target.checked,
                    })
                  }
                />
                <span className="ml-2 text-gray-700">Auto Print Reports</span>
              </label>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Report Template
                </label>
                <select className="w-full px-3 py-2 border rounded-lg"
                  value={settings.reportTemplate}
                  onChange={(e) =>
                    setSettings({ ...settings, reportTemplate: e.target.value })
                  } >
                  <option value="Standard">Standard</option>
                  <option value="Comprehensive">Comprehensive</option>
                  <option value="Doctor Summary">Doctor Summary</option>
                  <option value="Patient Friendly">Patient Friendly</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-700 mb-3">QC Settings</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                QC Alert Threshold
              </label>
              <select className="w-full px-3 py-2 border rounded-lg"
                value={settings.qcAlertThreshold}
                onChange={(e) =>
                  setSettings({ ...settings, qcAlertThreshold: e.target.value })
                } >
                <option value="1SD">1 Standard Deviation</option>
                <option value="2SD">2 Standard Deviations</option>
                <option value="3SD">3 Standard Deviations</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowSettingsModal(false)} >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveSettings} disabled={saving} >
              {saving ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default LabProfile;