// src/pages/dashboards/AdminDashboard/pages/DepartmentManagement.jsx
import React, { useMemo, useState, useEffect } from "react";
import { toast } from "react-toastify";
import LoadingSpinner from "../../../../components/common/LoadingSpinner/LoadingSpinner";
import Modal from "../../../../components/common/Modal/Modal";
import {
  HOSPITAL_ADMIN_DEPARTMENTS,
  HOSPITAL_ADMIN_DEPARTMENT_DETAILS,
  HOSPITAL_ADMIN_DEPARTMENT_UPDATE,
  HOSPITAL_ADMIN_DEPARTMENT_DELETE,
  HOSPITAL_ADMIN_DEPARTMENT_CREATE,
  HOSPITAL_ADMIN_DEPARTMENT_STATUS,
  HOSPITAL_ADMIN_STAFF,
} from "../../../../config/api";
import { apiFetch } from "../../../../services/apiClient";

const EMPTY_FORM = {
  name: "",
  code: "",
  description: "",
  head_of_department: "",
  location: "",
  phone: "",
  email: "",
  operating_hours: "",
  bed_capacity: "",
  specializations: "",
  equipment_list: "",
  emergency_services: false,
};

const getDepartmentItems = (data) => {
  const raw = data?.data ?? data;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.departments)) return raw.departments;
  if (Array.isArray(raw)) return raw;
  return [];
};

const mapDepartment = (item) => ({
  id: item?.id ?? item?.department_id ?? "",
  name: item?.name ?? "",
  code: item?.code ?? "",
  description: item?.description ?? "",
  head_of_department: item?.head_of_department ?? "",
  location: item?.location ?? "",
  phone: item?.phone ?? "",
  email: item?.email ?? "",
  operating_hours: item?.operating_hours ?? "",
  bed_capacity: item?.bed_capacity ?? 0,
  specializations: Array.isArray(item?.specializations)
    ? item.specializations
    : [],
  equipment_list: Array.isArray(item?.equipment_list)
    ? item.equipment_list
    : [],
  emergency_services: Boolean(item?.emergency_services),
  is_active: item?.is_active !== false,
});

const toTextArray = (value) =>
  String(value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
const parseError = (data, defaultMsg = "An error occurred") => {
  if (!data) return defaultMsg;
  const detail = data.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => {
      const locStr = Array.isArray(item?.loc) ? item.loc.filter(l => l !== 'body' && l !== 'query').join('.') : '';
      const prefix = locStr ? `"${locStr}": ` : '';
      return `${prefix}${item?.msg || JSON.stringify(item)}`;
    }).join('; ');
  }
  if (detail && typeof detail === "object" && detail.message) return detail.message;
  return data.message || defaultMsg;
};

const DepartmentManagement = () => {
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);
  const [listError, setListError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [details, setDetails] = useState(null);
  const [modalState, setModalState] = useState({
    add: false,
    edit: false,
  });
  const [currentDepartment, setCurrentDepartment] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});

  const fetchDoctors = async () => {
    try {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "150");
      params.set("role", "DOCTOR");
      const res = await apiFetch(`${HOSPITAL_ADMIN_STAFF}?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const raw = data?.data ?? data;
        const items = Array.isArray(raw?.items) ? raw.items : 
                      Array.isArray(raw?.staff) ? raw.staff : 
                      Array.isArray(raw) ? raw : [];
        setDoctors(items.map(item => {
          const firstName = item?.first_name || '';
          const lastName = item?.last_name || '';
          const generatedName = `${firstName} ${lastName}`.trim();
          const name = item?.staff_name || generatedName || 'Unnamed Doctor';
          return {
            id: item?.staff_id || item?.id || item?.user_id || '',
            name: name,
            specialization: item?.specialization || 'General Physician'
          };
        }));
      }
    } catch (e) {
      console.error("Failed to fetch doctors list", e);
    }
  };

  const fetchDepartments = async () => {
    setLoading(true);
    setListError("");
    try {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "100");
      params.set("active_only", String(activeOnly));
      const res = await apiFetch(
        `${HOSPITAL_ADMIN_DEPARTMENTS}?${params.toString()}`,
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setListError(
          data?.message ||
            data?.detail?.message ||
            `Failed to load departments (${res.status})`,
        );
        setDepartments([]);
        return;
      }
      setDepartments(getDepartmentItems(data).map(mapDepartment));
    }
    catch (error) {
      setListError(error?.message || "Unable to load departments.");
      setDepartments([]);
    }
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchDoctors();
      await fetchDepartments();
    };
    init();
  }, [activeOnly]);

  const openAddModal = () => {
    setCurrentDepartment(null);
    setFormData(EMPTY_FORM);
    setFieldErrors({});
    setModalState({ add: true, edit: false });
  };

  const openEditModal = (department) => {
    setCurrentDepartment(department);
    setFormData({
      name: department.name || "",
      code: department.code || "",
      description: department.description || "",
      head_of_department: department.head_of_department || "",
      location: department.location || "",
      phone: department.phone || "",
      email: department.email || "",
      operating_hours: department.operating_hours || "",
      bed_capacity: String(department.bed_capacity ?? ""),
      specializations: (department.specializations || []).join(", "),
      equipment_list: (department.equipment_list || []).join(", "),
      emergency_services: Boolean(department.emergency_services),
    });
    setFieldErrors({});
    setModalState({ add: false, edit: true });
  };

  const closeModals = () => {
    setModalState({ add: false, edit: false });
    setCurrentDepartment(null);
    setFormData(EMPTY_FORM);
    setFieldErrors({});
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (isUpdate = false) => {
    const errors = {};
    const required = [
      "name",
      "description",
      "head_of_department",
      "location",
      "phone",
      "email",
      "operating_hours",
      "bed_capacity",
    ];
    
    // Code is only required on creation (POST), schema omits it on update (PUT)
    if (!isUpdate) {
      required.push("code");
    }

    required.forEach((field) => {
      if (!String(formData[field] ?? "").trim()) {
        errors[field] = "This field is required.";
      }
    });

    if (formData.bed_capacity !== "" && Number(formData.bed_capacity) < 0) {
      errors.bed_capacity = "Bed capacity must be 0 or greater.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Excludes "code" on update payload to perfectly align with Swagger schema and prevent 422 errors
  const buildPayload = (isUpdate = false) => {
    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      head_of_department: formData.head_of_department.trim(),
      location: formData.location.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      operating_hours: formData.operating_hours.trim(),
      bed_capacity: Number(formData.bed_capacity || 0),
      specializations: toTextArray(formData.specializations),
      equipment_list: toTextArray(formData.equipment_list),
      emergency_services: Boolean(formData.emergency_services),
    };
    if (!isUpdate) {
      payload.code = formData.code.trim();
    }
    return payload;
  };

  // Create Department (POST)
  const handleCreateDepartment = async () => {
    if (!validateForm(false)) return;
    setSubmitLoading(true);
    try {
      const res = await apiFetch(HOSPITAL_ADMIN_DEPARTMENT_CREATE, {
        method: "POST",
        body: buildPayload(false),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(`Failed to create department: ${parseError(data)}`);
        return;
      }
      toast.success("Successfully Created Department");
      closeModals();
      fetchDepartments();
    }
    catch (error) {
      toast.error(error?.message || "Unable to create department.");
    }
    finally {
      setSubmitLoading(false);
    }
  };

  // Update Department (PUT)
  const handleUpdateDepartment = async () => {
    if (!validateForm(true) || !currentDepartment?.id) return;
    setSubmitLoading(true);
    try {
      const res = await apiFetch(
        HOSPITAL_ADMIN_DEPARTMENT_UPDATE(currentDepartment.id),
        {
          method: "PUT",
          body: buildPayload(true),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(`Failed to update department: ${parseError(data)}`);
        return;
      }
      toast.success("Successfully Updated Department");
      closeModals();
      fetchDepartments();
    }
    catch (error) {
      toast.error(error?.message || "Unable to update department.");
    }
    finally {
      setSubmitLoading(false);
    }
  };

  // ✅ Direct Delete Department with sweet toast feedback
  const handleDirectDelete = async (department) => {
    if (!department?.id) return;
    
    const isConfirmed = window.confirm(
      `Are you sure you want to delete the department "${department.name}"? This action cannot be undone.`
    );
    if (!isConfirmed) return;

    const actionKey = `delete-${department.id}`;
    setActionLoading((prev) => ({ ...prev, [actionKey]: true }));

    try {
      const res = await apiFetch(
        HOSPITAL_ADMIN_DEPARTMENT_DELETE(department.id),
        {
          method: "DELETE",
        }
      );
      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        const errorMsg = data?.message || data?.detail?.message || "Failed to delete department";
        toast.error(`Failed: ${errorMsg}`);
        return;
      }
      
      toast.success("Successfully Delete Department");
      fetchDepartments();
    } catch (error) {
      toast.error(`Failed: ${error?.message || "Connection error"}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  // Patch Status (PATCH)
  const handleToggleStatus = async (department) => {
    const nextActive = !department.is_active;
    const loadingKey = `status-${department.id}`;
    setActionLoading((prev) => ({ ...prev, [loadingKey]: true }));
    try {
      const res = await apiFetch(
        HOSPITAL_ADMIN_DEPARTMENT_STATUS(department.id),
        {
          method: "PATCH",
          body: { is_active: nextActive },
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(`Failed to update status: ${parseError(data)}`);
        return;
      }
      toast.success(`Successfully ${nextActive ? "Enabled" : "Disabled"} Department`);
      fetchDepartments();
    }
    catch (error) {
      toast.error(error?.message || "Unable to update department status.");
    }
    finally {
      setActionLoading((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  // Get Details (GET by ID)
  const handleGetDetails = async (department) => {
    try {
      const res = await apiFetch(
        HOSPITAL_ADMIN_DEPARTMENT_DETAILS(department.id),
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(`Failed to fetch details: ${parseError(data)}`);
        return;
      }
      const detail = mapDepartment(data?.data ?? data);
      setDetails(detail);
    }
    catch (error) {
      toast.error(error?.message || "Unable to load department details.");
    }
  };

  const filteredDepartments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return departments.filter((department) => {
      if (!query) return true;
      return [
        department.name,
        department.code,
        department.head_of_department,
        department.location,
        department.email,
      ].some((field) =>
        String(field || "")
          .toLowerCase()
          .includes(query),
      );
    });
  }, [departments, searchTerm]);

  // Helper to resolve doctor full name from doctor list for premium visualization
  const getDoctorName = (idOrName) => {
    if (!idOrName) return "-";
    const found = doctors.find((d) => d.id === idOrName);
    return found ? `Dr. ${found.name}` : (idOrName.startsWith("Dr.") ? idOrName : `Dr. ${idOrName}`);
  };

  // Dashboard Stat Cards
  const stats = useMemo(() => {
    const total = departments.length;
    const active = departments.filter((d) => d.is_active).length;
    const emergency = departments.filter((d) => d.emergency_services).length;
    const beds = departments.reduce((acc, d) => acc + (d.bed_capacity || 0), 0);
    return { total, active, emergency, beds };
  }, [departments]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Department Management
          </h2>
          <p className="text-gray-500 mt-1">Configure and manage clinical and operational units</p>
        </div>
        <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-medium self-start md:self-auto"
          onClick={openAddModal}>
          <i className="fas fa-plus-circle text-lg"></i>
          <span>Add Department</span>
        </button>
      </div>

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Depts */}
        <div className="bg-white rounded-2xl p-6 border border-gray-150 shadow-sm hover:shadow-md transition-shadow duration-300 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 text-xl font-bold flex-shrink-0">
            <i className="fas fa-sitemap"></i>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Units</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</h3>
          </div>
        </div>

        {/* Active Depts */}
        <div className="bg-white rounded-2xl p-6 border border-gray-150 shadow-sm hover:shadow-md transition-shadow duration-300 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600 text-xl font-bold flex-shrink-0">
            <i className="fas fa-check-circle"></i>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Units</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.active}</h3>
          </div>
        </div>

        {/* Emergency Services */}
        <div className="bg-white rounded-2xl p-6 border border-gray-150 shadow-sm hover:shadow-md transition-shadow duration-300 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600 text-xl font-bold flex-shrink-0">
            <i className="fas fa-ambulance"></i>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Emergency Ready</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.emergency}</h3>
          </div>
        </div>

        {/* Bed Capacity */}
        <div className="bg-white rounded-2xl p-6 border border-gray-150 shadow-sm hover:shadow-md transition-shadow duration-300 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 text-xl font-bold flex-shrink-0">
            <i className="fas fa-bed"></i>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Beds</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.beds}</h3>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative w-full">
            <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input className="pl-12 pr-4 py-3 w-full border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={searchTerm} type="text" placeholder="Search by name, code, head, location..."
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <label className="inline-flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl bg-white text-sm text-gray-700 cursor-pointer select-none hover:bg-gray-50 transition-colors w-full md:w-auto justify-center md:justify-start">
            <input className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" type="checkbox" checked={activeOnly} onChange={(event) => setActiveOnly(event.target.checked)}/>
            <span>Active only</span>
          </label>
        </div>
      </div>

      {listError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-between gap-3 shadow-sm">
          <span className="font-medium">
            <i className="fas fa-exclamation-circle mr-2 text-lg"></i>
            {listError}
          </span>
          <button className="px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-sm font-semibold transition-colors"
            onClick={fetchDepartments}>
            Retry
          </button>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Department</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Code</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Head of Dept</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Phone / Ext</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Beds</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Emergency</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDepartments.map((department) => (
                <tr className="hover:bg-blue-50/30 transition-colors" key={department.id}>
                  <td className="px-6 py-4">
                    <div className="max-w-[200px] sm:max-w-[300px]">
                      <div className="text-sm font-semibold text-gray-900">{department.name}</div>
                      <div className="text-xs text-gray-500 truncate mt-0.5" title={department.description}>
                        {department.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-605 bg-blue-50/50 rounded px-2.5 py-1 inline-block mt-3 mb-3">{department.code || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{getDoctorName(department.head_of_department)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{department.location || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">{department.phone || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">{department.bed_capacity ?? 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-full ${
                        department.emergency_services
                          ? "bg-red-100 text-red-800 border border-red-200"
                          : "bg-gray-150 text-gray-800"
                      }`}>
                      {department.emergency_services ? "YES" : "NO"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-full ${
                        department.is_active
                          ? "bg-green-100 text-green-800 border border-green-200"
                          : "bg-red-100 text-red-800 border border-red-200"
                      }`}>
                      {department.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                        onClick={() => handleGetDetails(department)} title="View Details">
                        <i className="fas fa-eye text-base"></i>
                      </button>
                      <button className="text-purple-600 hover:text-purple-900 p-2 rounded-lg hover:bg-purple-50 transition-colors"
                        onClick={() => openEditModal(department)} title="Edit Department">
                        <i className="fas fa-edit text-base"></i>
                      </button>
                      <button onClick={() => handleToggleStatus(department)}
                        disabled={actionLoading?.[`status-${department.id}`]}
                        className={`p-2 rounded-lg transition-colors ${
                          department.is_active
                            ? "text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50"
                            : "text-green-600 hover:text-green-900 hover:bg-green-50"
                        } disabled:opacity-50`}
                        title={
                          department.is_active
                            ? "Disable Department"
                            : "Enable Department"
                        }>
                        <i className={`fas fa-${department.is_active ? "pause" : "play"} text-base`}></i>
                      </button>
                      {/* ✅ Direct deletion with spinner support */}
                      <button 
                        disabled={actionLoading?.[`delete-${department.id}`]}
                        className="text-red-600 hover:text-red-950 p-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                        onClick={() => handleDirectDelete(department)} 
                        title="Delete Department"
                      >
                        {actionLoading?.[`delete-${department.id}`] ? (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <i className="fas fa-trash-alt text-base"></i>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDepartments.length === 0 && (
          <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-white">
            <div className="w-20 h-20 mx-auto mb-6 bg-blue-50 rounded-full flex items-center justify-center">
              <i className="fas fa-sitemap text-blue-500 text-3xl animate-pulse"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No departments found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your search query or filters.</p>
          </div>
        )}
      </div>

      <DepartmentFormModal
        isOpen={modalState.add}
        onClose={closeModals}
        title="Add New Department"
        onSubmit={handleCreateDepartment}
        formData={formData}
        onInputChange={handleInputChange}
        submitText="Create Department"
        submitIcon="plus-circle"
        onCancel={closeModals}
        fieldErrors={fieldErrors}
        submitLoading={submitLoading}
        endpoint={HOSPITAL_ADMIN_DEPARTMENT_CREATE}
        isUpdate={false}
        doctors={doctors}
      />

      <DepartmentFormModal
        isOpen={modalState.edit}
        onClose={closeModals}
        title="Edit Department"
        onSubmit={handleUpdateDepartment}
        formData={formData}
        onInputChange={handleInputChange}
        submitText="Save Changes"
        submitIcon="save"
        onCancel={closeModals}
        fieldErrors={fieldErrors}
        submitLoading={submitLoading}
        endpoint={currentDepartment ? HOSPITAL_ADMIN_DEPARTMENT_UPDATE(currentDepartment.id) : ''}
        isUpdate={true}
        doctors={doctors}
      />

      <DepartmentDetailsModal
        isOpen={Boolean(details)}
        details={details}
        onClose={() => setDetails(null)}
        getDoctorName={getDoctorName}
      />
    </div>
  );
};

const DepartmentFormModal = ({
  isOpen, onClose, title, onSubmit, formData, onInputChange, submitText, submitIcon,
  onCancel, fieldErrors, submitLoading, endpoint, isUpdate, doctors}) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
    <DepartmentForm
      formData={formData}
      onInputChange={onInputChange}
      onCancel={onCancel}
      onSubmit={onSubmit}
      submitText={submitText}
      submitIcon={submitIcon}
      fieldErrors={fieldErrors}
      submitLoading={submitLoading}
      isUpdate={isUpdate}
      doctors={doctors}
    />
    {endpoint && (
      <div className="mt-4 px-1">
        <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200">
          <p className="text-[11px] text-gray-500 font-mono flex items-center gap-2">
            <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-semibold uppercase tracking-wider">ENDPOINT</span>
            <span className="text-gray-600 break-all">{endpoint}</span>
          </p>
        </div>
      </div>
    )}
  </Modal>
);

const DepartmentForm = ({
  formData, onInputChange, onCancel, onSubmit,
  submitText, submitIcon, fieldErrors, submitLoading, isUpdate, doctors = []}) => {
  
  const [docSearch, setDocSearch] = useState("");
  const [showDocDropdown, setShowDocDropdown] = useState(false);

  const selectedDoctorObj = useMemo(() => {
    return doctors.find((d) => d.id === formData.head_of_department);
  }, [doctors, formData.head_of_department]);

  const filteredDoctors = useMemo(() => {
    const q = docSearch.toLowerCase().trim();
    if (!q) return doctors;
    return doctors.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q) ||
        d.specialization.toLowerCase().includes(q)
    );
  }, [doctors, docSearch]);

  const formFields = [
    { type: "text", name: "name", label: "Department Name *", placeholder: "e.g., Cardiology", icon: "fas fa-building",},
    { type: "text", name: "code", label: "Department Code *", placeholder: "e.g., CARD", icon: "fas fa-hashtag", disabled: isUpdate },
    { type: "text", name: "location", label: "Location *", placeholder: "e.g., Floor 2, Wing A", icon: "fas fa-map-marker-alt",},
    { type: "tel", name: "phone", label: "Phone *", placeholder: "+40)159()873363()1776", icon: "fas fa-phone",},
    { type: "email", name: "email", label: "Email *", placeholder: "user@example.com", icon: "fas fa-envelope",},
    { type: "text", name: "operating_hours", label: "Operating Hours *", placeholder: "e.g., 08:00-20:00", icon: "fas fa-clock",},
    { type: "number", name: "bed_capacity", label: "Bed Capacity *", placeholder: "0", icon: "fas fa-bed", min: 0,},
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Render Name & Code fields first */}
        {formFields.slice(0, 2).map((field) => (
          <div key={field.name} className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-2">{field.label}</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"><i className={field.icon}></i></div>
              <input className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${fieldErrors[field.name] ? "border-red-400" : "border-gray-300"} ${field.disabled ? "bg-gray-100 cursor-not-allowed text-gray-500" : ""}`}
                type={field.type} min={field.type === "number" ? "0" : undefined} value={formData[field.name]} placeholder={field.placeholder}
                onChange={(event) =>
                  onInputChange(field.name, event.target.value)
                }
                disabled={field.disabled}
              />
            </div>
            {fieldErrors[field.name] && (
              <p className="text-xs text-red-650 mt-1">{fieldErrors[field.name]}</p>
            )}
          </div>
        ))}

        {/* Searchable Head of Department Selector */}
        <div className="relative">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Head of Department *</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <i className="fas fa-user-md"></i>
            </div>
            <input 
              className={`w-full pl-12 pr-10 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                fieldErrors.head_of_department ? "border-red-400" : "border-gray-300"
              }`}
              type="text"
              placeholder="Search & select doctor from list..."
              value={showDocDropdown ? docSearch : (selectedDoctorObj ? `Dr. ${selectedDoctorObj.name}` : formData.head_of_department)}
              onChange={(e) => {
                setDocSearch(e.target.value);
                setShowDocDropdown(true);
                onInputChange("head_of_department", e.target.value); // support manual entry if desired
              }}
              onFocus={() => {
                setShowDocDropdown(true);
                setDocSearch("");
              }}
              onBlur={() => {
                // Delay blur to allow item click
                setTimeout(() => setShowDocDropdown(false), 200);
              }}
            />
            {formData.head_of_department && (
              <button 
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-650"
                onClick={() => {
                  onInputChange("head_of_department", "");
                  setDocSearch("");
                }}
              >
                <i className="fas fa-times-circle"></i>
              </button>
            )}
          </div>

          {/* Search Dropdown Panel */}
          {showDocDropdown && (
            <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto">
              {filteredDoctors.length > 0 ? (
                filteredDoctors.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center justify-between"
                    onClick={() => {
                      onInputChange("head_of_department", doc.id);
                      setDocSearch("");
                      setShowDocDropdown(false);
                    }}
                  >
                    <div>
                      <p className="text-sm font-bold text-gray-800">Dr. {doc.name}</p>
                      <p className="text-xs text-blue-600 font-semibold">{doc.specialization}</p>
                    </div>
                    <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-semibold">{doc.id}</span>
                  </button>
                ))
              ) : (
                <div className="p-3 text-center text-xs text-gray-500 italic">No doctors found matching search</div>
              )}
            </div>
          )}

          {fieldErrors.head_of_department && (
            <p className="text-xs text-red-650 mt-1">{fieldErrors.head_of_department}</p>
          )}
        </div>

        {/* Render Remaining Form Fields */}
        {formFields.slice(2).map((field) => (
          <div key={field.name} className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-2">{field.label}</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"><i className={field.icon}></i></div>
              <input className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${fieldErrors[field.name] ? "border-red-400" : "border-gray-300"} ${field.disabled ? "bg-gray-100 cursor-not-allowed text-gray-500" : ""}`}
                type={field.type} min={field.type === "number" ? "0" : undefined} value={formData[field.name]} placeholder={field.placeholder}
                onChange={(event) =>
                  onInputChange(field.name, event.target.value)
                }
                disabled={field.disabled}
              />
            </div>
            {fieldErrors[field.name] && (
              <p className="text-xs text-red-650 mt-1">{fieldErrors[field.name]}</p>
            )}
          </div>
        ))}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
        <textarea className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.description ? "border-red-400" : "border-gray-300"}`}
          rows="3" value={formData.description} onChange={(event) => onInputChange("description", event.target.value)} placeholder="Provide high-level description of department services..."/>
        {fieldErrors.description && (
          <p className="text-xs text-red-650 mt-1">{fieldErrors.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Specializations (comma separated)</label>
          <input className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
            type="text" value={formData.specializations} placeholder="e.g., Angioplasty, Echo, ICU"
            onChange={(event) =>
              onInputChange("specializations", event.target.value)
            }
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Equipment List (comma separated)</label>
          <input className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
            placeholder="e.g., MRI, Ventilator" type="text" value={formData.equipment_list}
            onChange={(event) =>
              onInputChange("equipment_list", event.target.value)
            }
          />
        </div>
      </div>

      <label className="inline-flex items-center gap-3 text-sm font-semibold text-gray-700 cursor-pointer select-none">
        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4.5 w-4.5" checked={formData.emergency_services}
          onChange={(event) =>
            onInputChange("emergency_services", event.target.checked)
          }
        />
        <span>Emergency services available</span>
      </label>

      <div className="flex justify-end gap-3 pt-6 border-t border-gray-150">
        <button className="px-6 py-3 border border-gray-300 rounded-xl text-gray-750 hover:bg-gray-50 transition-all duration-200 font-bold"
          type="button" onClick={onCancel}>
          Cancel
        </button>
        <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-bold shadow-md hover:shadow-lg flex items-center gap-2"
          type="button" onClick={onSubmit} disabled={submitLoading}>
          <i className={`fas fa-${submitIcon}`}></i>
          <span>{submitLoading ? "Saving..." : submitText}</span>
        </button>
      </div>
    </div>
  );
};

const DepartmentDetailsModal = ({ isOpen, details, onClose, getDoctorName }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Department Details" size="md">
    <div className="space-y-6">
      {/* Detail Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-2xl text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h4 className="text-xl font-bold">{details?.name || "-"}</h4>
            <p className="text-sm text-blue-100 mt-1 font-mono tracking-wide">CODE: {details?.code || "-"}</p>
          </div>
          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border ${
            details?.is_active 
              ? "bg-green-500/20 text-green-200 border-green-400/30" 
              : "bg-red-500/20 text-red-200 border-red-400/30"
          }`}>
            {details?.is_active ? "ACTIVE" : "INACTIVE"}
          </span>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Head of Dept */}
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-150 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-lg flex-shrink-0">
            <i className="fas fa-user-md"></i>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Head of Department</p>
            <p className="text-sm font-bold text-gray-800 mt-0.5">{getDoctorName(details?.head_of_department)}</p>
          </div>
        </div>

        {/* Location */}
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-150 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-lg flex-shrink-0">
            <i className="fas fa-map-marker-alt"></i>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Location</p>
            <p className="text-sm font-bold text-gray-800 mt-0.5">{details?.location || "-"}</p>
          </div>
        </div>

        {/* Phone */}
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-150 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center text-lg flex-shrink-0">
            <i className="fas fa-phone"></i>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Contact Phone</p>
            <p className="text-sm font-bold font-mono text-gray-800 mt-0.5">{details?.phone || "-"}</p>
          </div>
        </div>

        {/* Email */}
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-150 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-lg flex-shrink-0">
            <i className="fas fa-envelope"></i>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Email Address</p>
            <p className="text-sm font-bold text-gray-800 mt-0.5 break-all">{details?.email || "-"}</p>
          </div>
        </div>

        {/* Operating Hours */}
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-150 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-lg flex-shrink-0">
            <i className="fas fa-clock"></i>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Operating Hours</p>
            <p className="text-sm font-bold text-gray-800 mt-0.5">{details?.operating_hours || "-"}</p>
          </div>
        </div>

        {/* Bed Capacity */}
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-150 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center text-lg flex-shrink-0">
            <i className="fas fa-bed"></i>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Bed Capacity</p>
            <p className="text-sm font-bold text-gray-800 mt-0.5">{details?.bed_capacity ?? 0} Beds</p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-gray-650 uppercase tracking-wider flex items-center gap-1.5">
          <i className="fas fa-align-left text-blue-500"></i>
          <span>Description</span>
        </p>
        <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-4 border border-gray-150 leading-relaxed font-medium">
          {details?.description || "No description provided."}
        </p>
      </div>

      {/* Specializations & Equipment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Specializations list */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-650 uppercase tracking-wider flex items-center gap-1.5">
            <i className="fas fa-award text-green-500"></i>
            <span>Specializations</span>
          </p>
          <div className="flex flex-wrap gap-1.5 p-3 bg-gray-50 rounded-xl border border-gray-150 min-h-24">
            {(details?.specializations || []).length > 0 ? (
              (details?.specializations || []).map((spec, idx) => (
                <span className="bg-green-50 border border-green-200 text-green-700 text-xs px-2.5 py-1 rounded-full font-semibold shadow-sm inline-block" key={idx}>
                  {spec}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-400 italic">None registered</span>
            )}
          </div>
        </div>

        {/* Equipment list */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-650 uppercase tracking-wider flex items-center gap-1.5">
            <i className="fas fa-laptop-medical text-purple-500"></i>
            <span>Equipment List</span>
          </p>
          <div className="flex flex-wrap gap-1.5 p-3 bg-gray-50 rounded-xl border border-gray-150 min-h-24">
            {(details?.equipment_list || []).length > 0 ? (
              (details?.equipment_list || []).map((equip, idx) => (
                <span className="bg-purple-50 border border-purple-200 text-purple-700 text-xs px-2.5 py-1 rounded-full font-semibold shadow-sm inline-block" key={idx}>
                  {equip}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-400 italic">None registered</span>
            )}
          </div>
        </div>
      </div>

      {/* Emergency services tag */}
      <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-xl flex items-center justify-between">
        <span className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <i className="fas fa-ambulance text-red-500 text-base"></i>
          Emergency Critical Services
        </span>
        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${
          details?.emergency_services 
            ? "bg-red-500 text-white border-red-650" 
            : "bg-gray-150 text-gray-500 border-gray-300"
        }`}>
          {details?.emergency_services ? "SUPPORTED" : "UNSUPPORTED"}
        </span>
      </div>

      {/* Footer Actions */}
      <div className="flex justify-end pt-2 border-t border-gray-200">
        <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-bold shadow-md hover:shadow-lg flex items-center gap-2"
          type="button" onClick={onClose}>
          <i className="fas fa-check-circle"></i>
          <span>Acknowledge</span>
        </button>
      </div>
    </div>
  </Modal>
);

export default DepartmentManagement;