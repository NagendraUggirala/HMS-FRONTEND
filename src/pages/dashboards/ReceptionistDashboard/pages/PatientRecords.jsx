import React, { useState, useEffect } from "react";
import { apiFetch } from "../../../../services/apiClient";
import {
  RECEPTIONIST_PATIENT_PROFILE,
  RECEPTIONIST_PATIENT_SEARCH,
  RECEPTIONIST_PATIENT_UPDATE
} from "../../../../config/api";
import {
  People as PeopleIcon,
  Search as SearchIcon,
  MailOutline as MailOutlineIcon,
  CalendarToday as CalendarTodayIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  WarningAmber as WarningAmberIcon,
} from "@mui/icons-material";
import { CircularProgress } from "@mui/material";
import Modal from "../../../../components/common/Modal/Modal";

const PatientRecords = () => {
  const [patients, setPatients] = useState([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);
  // Auto-fill address based on Pincode
  useEffect(() => {
    const fetchLocation = async () => {
      if (editFormData.pincode?.length === 6) {
        try {
          const res = await fetch(
            `https://api.postalpincode.in/pincode/${editFormData.pincode}`,
          );
          const data = await res.json();
          if (data[0].Status === "Success") {
            const postOffice = data[0].PostOffice[0];
            setEditFormData((prev) => ({
              ...prev,
              city: postOffice.Division,
              district: postOffice.District,
              state: postOffice.State,
              country: "India",
            }));
          }
        } catch (error) {
          console.error("Error fetching pincode data:", error);
        }
      }
    };
    fetchLocation();
  }, [editFormData.pincode]);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await apiFetch(RECEPTIONIST_PATIENT_SEARCH);
        const json = await response.json();
        if (json.success) {
          setPatients(json.data.patients || []);
          setTotalPatients(
            json.data.total_patients || json.data.patients?.length || 0,
          );
        } else {
          setError(json.message || "Failed to fetch data");
        }
      } catch (err) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredPatients = patients.filter((patient) => {
    const search = searchTerm.toLowerCase();
    return (
      (patient.name && patient.name.toLowerCase().includes(search)) ||
      (patient.email && patient.email.toLowerCase().includes(search)) ||
      (patient.patient_id && patient.patient_id.toLowerCase().includes(search))
    );
  });

  const fetchPatientProfile = async (patientRef) => {
    try {
      setIsFetchingProfile(true);
      const response = await apiFetch(RECEPTIONIST_PATIENT_PROFILE(patientRef));
      const json = await response.json();
      if (json.success) {
        return json.data;
      } else {
        alert(json.message || "Failed to fetch patient profile");
        return null;
      }
    } catch (err) {
      alert(err.message || "An error occurred while fetching profile");
      return null;
    } finally {
      setIsFetchingProfile(false);
    }
  };

  const handleEditClick = async (patient) => {
    const ref = patient.patient_id || patient.patient_ref;
    if (!ref) {
      alert("Error: Patient reference (ID) is missing.");
      return;
    }
    const profile = await fetchPatientProfile(ref);
    if (!profile) return;

    setSelectedPatient(profile);
    const patientName = profile.patient_name || profile.name || "";
    const firstName = profile.first_name || patientName.split(" ")[0] || "";
    const lastName = profile.last_name || patientName.split(" ").slice(1).join(" ") || "";
    const standardBloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    const isOtherBloodGroup = profile.blood_group && !standardBloodGroups.includes(profile.blood_group);

    setEditFormData({
      firstName: firstName,
      lastName: lastName,
      email: profile.email || "",
      phone: profile.phone || "",
      gender: profile.gender ? (profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1).toLowerCase()) : "",
      dob: profile.date_of_birth ? profile.date_of_birth.split("T")[0] : "",
      address: profile.address || "",
      bloodGroup: isOtherBloodGroup ? "other" : (profile.blood_group || ""),
      bloodGroupValue: isOtherBloodGroup ? profile.blood_group : "",
      medicalHistory: profile.medical_history || "",
      id: profile.id || profile._id || profile.patient_id || profile.patient_ref || ref,
      patient_id: profile.patient_id || ref,
      idType: profile.id_type || "",
      idNumber: profile.id_number || "",
      idName: profile.id_name || "",
      pincode: profile.pincode || "",
      city: profile.city || "",
      district: profile.district || "",
      state: profile.state || "",
      country: profile.country || "",
      emergencyContactName: profile.emergency_contact_name || profile.emergency_contact?.name || "",
      emergencyContactRelationship: profile.emergency_contact_relationship || profile.emergency_contact?.relationship || "",
      emergencyContact: (typeof profile.emergency_contact === 'string' ? profile.emergency_contact : profile.emergency_contact?.phone) || profile.emergency_contact_number || "",
      password: "",
    });
    setIsEditModalOpen(true);
  };

  const handleViewClick = async (patient) => {
    const ref = patient.patient_id || patient.patient_ref;
    if (!ref) {
      alert("Error: Patient reference (ID) is missing.");
      return;
    }
    const profile = await fetchPatientProfile(ref);
    if (!profile) return;
    setSelectedPatient(profile);
    setIsViewModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setIsViewModalOpen(false);
    setSelectedPatient(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);

      const payload = {
        first_name: editFormData.firstName,
        last_name: editFormData.lastName,
        gender: editFormData.gender,
        date_of_birth: editFormData.dob,
        phone: editFormData.phone,
        email: editFormData.email,
        password: editFormData.password || undefined,
        address: editFormData.address,
        pincode: editFormData.pincode,
        city: editFormData.city,
        state: editFormData.state,
        country: editFormData.country,
        district: editFormData.district,
        id_type: editFormData.idType,
        id_number: editFormData.idNumber,
        id_name: editFormData.idType === "Other" ? editFormData.idName : "",
        emergency_contact: {
          name: editFormData.emergencyContactName,
          relationship: editFormData.emergencyContactRelationship,
          phone: editFormData.emergencyContact,
        },
        blood_group:
          editFormData.bloodGroup === "other"
            ? editFormData.bloodGroupValue
            : editFormData.bloodGroup,
        medical_history: editFormData.medicalHistory,
      };

      const res = await apiFetch(RECEPTIONIST_PATIENT_UPDATE(editFormData.id), {
        method: "PATCH",
        body: payload,
      },
      );

      const data = await res.json();

      if (res.ok) {
        alert(data.message || "Patient records updated successfully!");
        setIsEditModalOpen(false);
        // Refresh the list
        const fetchResponse = await apiFetch(RECEPTIONIST_PATIENT_SEARCH);
        const json = await fetchResponse.json();
        if (json.success) {
          setPatients(json.data.patients || []);
          setTotalPatients(
            json.data.total_patients || json.data.patients?.length || 0,
          );
        }
      } else {
        throw new Error(data.message || "Failed to update patient records");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      {isFetchingProfile && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-[2px] z-[9999] flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4 border border-indigo-100 animate-in fade-in zoom-in duration-300">
            <CircularProgress size={40} className="text-indigo-600" />
            <p className="text-indigo-900 font-bold tracking-wide">Fetching Profile...</p>
          </div>
        </div>
      )}
      {/* ================= HEADER SECTION ================= */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Patient Records
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            View and manage all registered patients
          </p>
        </div>

        {/* Total Patients Stat */}
        <div className="bg-white px-6 py-3 rounded-xl border shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center shadow-inner">
            <PeopleIcon />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium tracking-wide">
              Total Patients
            </p>
            <p className="text-2xl font-bold text-gray-800">
              {loading ? "..." : totalPatients}
            </p>
          </div>
        </div>
      </div>

      {/* ================= PATIENTS TABLE ================= */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
          <h3 className="text-lg font-semibold text-gray-800">
            All Patients List
          </h3>
          <div className="relative">
            <SearchIcon
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              sx={{ fontSize: 20 }}
            />
            <input
              type="text"
              placeholder="Search by name, email or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg text-sm w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-gray-500">
            <CircularProgress size={40} className="mb-4 text-indigo-500" />
            <p className="text-lg font-medium">Loading patient records...</p>
          </div>
        ) : error ? (
          <div className="p-16 text-center text-red-500">
            <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
              <WarningAmberIcon sx={{ fontSize: 40 }} />
            </div>
            <p className="text-lg font-medium">{error}</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="p-16 text-center text-gray-500">
            <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <SearchIcon sx={{ fontSize: 40, color: "gray.400" }} />
            </div>
            <p className="text-lg font-medium">No patient records found.</p>
            {searchTerm && (
              <p className="text-sm mt-2">Try adjusting your search query.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient ID</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created At</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPatients.map((patient, index) => (
                  <tr
                    key={index}
                    className="hover:bg-indigo-50/50 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                        {patient.patient_id || patient.patient_ref || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-9 w-9 rounded-full bg-gradient-to-br from-indigo-100 to-blue-200 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold shadow-sm">
                          {patient.name
                            ? patient.name.charAt(0).toUpperCase()
                            : "P"}
                        </div>
                        <div className="ml-3 text-sm font-semibold text-gray-900">
                          {patient.name || "Unknown"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <MailOutlineIcon
                          sx={{ fontSize: 18, color: "gray.400" }}
                        />
                        {patient.email || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <CalendarTodayIcon
                          sx={{ fontSize: 18, color: "gray.400" }}
                        />
                        {formatDate(patient.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 w-8 h-8 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                          title="View Details"
                          onClick={() => handleViewClick(patient)}
                          disabled={isFetchingProfile}
                        >
                          <VisibilityIcon sx={{ fontSize: 18 }} />
                        </button>
                        <button
                          className="text-emerald-600 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 w-8 h-8 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Edit Patient"
                          onClick={() => handleEditClick(patient)}
                          disabled={isFetchingProfile}
                        >
                          <EditIcon sx={{ fontSize: 18 }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* ================= EDIT PATIENT MODAL ================= */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        title="Edit Patient Details"
        size="lg"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <button
              onClick={handleCloseModal}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="px-6 py-2.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 shadow-md transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <CircularProgress size={18} color="inherit" />
                  Updating...
                </>
              ) : (
                "Update Details"
              )}
            </button>
          </div>
        }
      >
        <div className="space-y-8">
          {/* Section: Personal Info */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h4 className="text-lg font-bold text-gray-800">Personal Information</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-600">First Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="firstName"
                  value={editFormData.firstName || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  placeholder="Enter first name"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-600">Last Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="lastName"
                  value={editFormData.lastName || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  placeholder="Enter last name"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-600">Gender <span className="text-red-500">*</span></label>
                <select
                  name="gender"
                  value={editFormData.gender || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-600">Date of Birth <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  name="dob"
                  value={editFormData.dob || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-600">ID Type <span className="text-red-500">*</span></label>
                <select
                  name="idType"
                  value={editFormData.idType || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  required
                >
                  <option value="">Select ID Type</option>
                  <option value="Aadhaar Card">Aadhaar Card</option>
                  <option value="Passport">Passport</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {editFormData.idType === 'Aadhaar Card' && (
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-600">Aadhaar Number <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="idNumber"
                    value={editFormData.idNumber || ""}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                      setEditFormData({ ...editFormData, idNumber: value });
                    }}
                    placeholder="Enter 12-digit Aadhaar Number"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    required
                  />
                </div>
              )}

              {editFormData.idType === 'Passport' && (
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-600">Passport Number <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="idNumber"
                    value={editFormData.idNumber || ""}
                    onChange={handleInputChange}
                    placeholder="Enter Alphanumeric Passport Number"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    style={{ textTransform: 'uppercase' }}
                    required
                  />
                </div>
              )}

              {editFormData.idType === 'Other' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-600">ID Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="idName"
                      value={editFormData.idName || ""}
                      onChange={handleInputChange}
                      placeholder="e.g. Voter ID, Driving License"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-600">ID Number <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="idNumber"
                      value={editFormData.idNumber || ""}
                      onChange={handleInputChange}
                      placeholder="Enter ID Number"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      required
                    />
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Section: Contact Info */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h4 className="text-lg font-bold text-gray-800">Contact Information</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-600">Email Address <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  name="email"
                  value={editFormData.email || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="example@mail.com"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-600">Phone Number <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  name="phone"
                  value={editFormData.phone || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="+91 XXXXX XXXXX"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-600">Password <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  name="password"
                  value={editFormData.password || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-600">Pincode / Zip Code</label>
                <input
                  type="text"
                  name="pincode"
                  value={editFormData.pincode || ""}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setEditFormData((prev) => ({ ...prev, pincode: value }));
                  }}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="Enter 6-digit Pincode"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-600">City</label>
                <input
                  type="text"
                  name="city"
                  value={editFormData.city || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="City"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-600">District</label>
                <input
                  type="text"
                  name="district"
                  value={editFormData.district || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="District"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-600">State</label>
                <input
                  type="text"
                  name="state"
                  value={editFormData.state || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="State"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-600">Country</label>
                <input
                  type="text"
                  name="country"
                  value={editFormData.country || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="Country"
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="text-sm font-semibold text-gray-600">Address</label>
                <textarea
                  name="address"
                  value={editFormData.address || ""}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                  placeholder="Enter full address..."
                ></textarea>
              </div>
            </div>
          </section>

          {/* Section: Emergency Contact */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h4 className="text-lg font-bold text-gray-800">Emergency Contact</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-600">Emergency Contact Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="emergencyContactName"
                  value={editFormData.emergencyContactName || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                  placeholder="Full name"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-600">Relationship</label>
                <input
                  type="text"
                  name="emergencyContactRelationship"
                  value={editFormData.emergencyContactRelationship || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                  placeholder="e.g. Parent, Spouse"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-600">Emergency Contact Number <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  name="emergencyContact"
                  value={editFormData.emergencyContact || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                  placeholder="+91 XXXXX XXXXX"
                  required
                />
              </div>
            </div>
          </section>

          {/* Section: Medical Info */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h4 className="text-lg font-bold text-gray-800">Medical Information</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-sm font-semibold text-gray-600">Blood Group</label>
                {editFormData.bloodGroup === "other" ? (
                  <input
                    type="text"
                    name="bloodGroup"
                    value={editFormData.bloodGroupValue || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "") {
                        setEditFormData({ ...editFormData, bloodGroup: "", bloodGroupValue: "" });
                      } else {
                        setEditFormData({ ...editFormData, bloodGroupValue: value });
                      }
                    }}
                    placeholder="Enter Blood Group"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                  />
                ) : (
                  <select
                    name="bloodGroup"
                    value={editFormData.bloodGroup || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setEditFormData({ ...editFormData, bloodGroup: value, bloodGroupValue: "" });
                    }}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
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
                    <option value="other">Other</option>
                  </select>
                )}
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-sm font-semibold text-gray-600">Medical History</label>
                <textarea
                  name="medicalHistory"
                  value={editFormData.medicalHistory || ""}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all resize-none"
                  placeholder="List conditions, allergies, or medications..."
                ></textarea>
              </div>
            </div>
          </section>

        </div>
      </Modal>

      {/* ================= VIEW PATIENT MODAL ================= */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={handleCloseModal}
        title="Patient Details Profile"
        size="xl"
        footer={
          <div className="flex justify-end w-full">
            <button
              onClick={handleCloseModal}
              className="px-8 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-gray-900 transition-all active:scale-95 shadow-md"
            >
              Close
            </button>
          </div>
        }
      >
        {selectedPatient && (
          <div className="space-y-8">
            {/* Header Profile Info */}
            <div className="flex items-center gap-5 p-5 bg-blue-50 rounded-2xl border border-blue-100">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-3xl font-bold shadow-lg border-4 border-white">
                {(selectedPatient.first_name || selectedPatient.name || "P").charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">
                  {selectedPatient.patient_name || selectedPatient.name || `${selectedPatient.first_name || ""} ${selectedPatient.last_name || ""}`.trim() || "N/A"}
                </h3>
                <p className="text-indigo-600 font-semibold flex items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-indigo-100 rounded text-xs uppercase tracking-wider">Patient ID</span>
                  {selectedPatient.patient_id}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Personal Information */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  Personal Information
                </h4>
                <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="grid grid-cols-2 gap-3">
                    <DetailItem label="First Name" value={selectedPatient.first_name} />
                    <DetailItem label="Last Name" value={selectedPatient.last_name} />
                  </div>
                  <DetailItem
                    label="Gender"
                    value={selectedPatient.gender ? (selectedPatient.gender.charAt(0).toUpperCase() + selectedPatient.gender.slice(1).toLowerCase()) : "N/A"}
                  />
                  <DetailItem
                    label="Date of Birth"
                    value={selectedPatient.date_of_birth ? new Date(selectedPatient.date_of_birth).toLocaleDateString() : "N/A"}
                  />
                  <DetailItem label="ID Type" value={selectedPatient.id_type} />
                  <DetailItem label="ID Number" value={selectedPatient.id_number} />
                  {selectedPatient.id_name && <DetailItem label="ID Name" value={selectedPatient.id_name} />}
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Contact Information
                </h4>
                <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <DetailItem label="Email" value={selectedPatient.email} />
                  <DetailItem label="Phone" value={selectedPatient.phone} />
                  <DetailItem label="Address" value={selectedPatient.address} isFullWidth />
                  <div className="grid grid-cols-2 gap-3">
                    <DetailItem label="City" value={selectedPatient.city} />
                    <DetailItem label="District" value={selectedPatient.district} />
                    <DetailItem label="State" value={selectedPatient.state} />
                    <DetailItem label="Country" value={selectedPatient.country} />
                    <DetailItem label="Pincode" value={selectedPatient.pincode} />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  Emergency Contact
                </h4>
                <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <DetailItem
                    label="Contact Name"
                    value={selectedPatient.emergency_contact_name || selectedPatient.emergency_contact?.name}
                  />
                  <DetailItem
                    label="Relationship"
                    value={selectedPatient.emergency_contact_relationship || selectedPatient.emergency_contact?.relationship}
                  />
                  <DetailItem
                    label="Contact Phone"
                    value={(typeof selectedPatient.emergency_contact === 'string' ? selectedPatient.emergency_contact : selectedPatient.emergency_contact?.phone) || selectedPatient.emergency_contact_number}
                  />
                </div>
              </div>

              {/* Medical Information */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  Medical Information
                </h4>
                <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <DetailItem label="Blood Group" value={selectedPatient.blood_group} />
                  <div className="pt-2">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Medical History</p>
                    <p className="text-sm text-gray-700 leading-relaxed italic">
                      {selectedPatient.medical_history || "No medical history recorded."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

// Helper component for displaying detail items
const DetailItem = ({ label, value, isFullWidth = false }) => (
  <div className={`${isFullWidth ? "col-span-full" : ""} space-y-0.5`}>
    <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">{label}</p>
    <p className="text-sm font-semibold text-gray-800">{value || "—"}</p>
  </div>
);

export default PatientRecords;
