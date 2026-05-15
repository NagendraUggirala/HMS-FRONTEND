// src/pages/dashboards/AdminDashboard/pages/InpatientManagement.jsx
import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import LoadingSpinner from "../../../../components/common/LoadingSpinner/LoadingSpinner";
import DataTable from "../../../../components/ui/Tables/DataTable";
import Modal from "../../../../components/common/Modal/Modal";
import {
  HOSPITAL_ADMIN_WARDS,
  HOSPITAL_ADMIN_WARD,
  HOSPITAL_ADMIN_WARD_STATUS,
  HOSPITAL_ADMIN_BEDS,
  HOSPITAL_ADMIN_BED,
  HOSPITAL_ADMIN_BED_STATUS,
  HOSPITAL_ADMIN_ADMISSIONS,
  HOSPITAL_ADMIN_ADMISSION_ASSIGN_BED,
  HOSPITAL_ADMIN_ADMISSION_DISCHARGE,
} from "../../../../config/api";
import { apiFetch } from "../../../../services/apiClient";

const WARD_TYPE_OPTIONS = ["ICU", "GENERAL", "EMERGENCY", "PRIVATE"];
const BED_TYPE_OPTIONS = ["GENERAL", "ICU", "PRIVATE", "EMERGENCY"];
const BED_STATUS_OPTIONS = ["available", "occupied", "maintenance", "reserved"];

function parseApiError(data, res) {
  const detailParts = [];
  const appendFromErrorItems = (items) => {
    if (!Array.isArray(items)) return;
    for (const x of items) {
      if (typeof x === "string") detailParts.push(x);
      else if (x?.msg) {
        const loc = Array.isArray(x.loc)
          ? x.loc.filter((p) => p !== "body").join(" → ")
          : "";
        detailParts.push(loc ? `${loc}: ${x.msg}` : x.msg);
      } else if (x?.message) detailParts.push(x.message);
    }
  };
  appendFromErrorItems(data?.errors);
  const d = data?.detail;
  if (typeof d === "string") detailParts.push(d);
  else if (d && typeof d === "object") {
    if (d.message) detailParts.push(d.message);
    if (Array.isArray(d.errors)) appendFromErrorItems(d.errors);
  } else if (Array.isArray(d)) appendFromErrorItems(d);
  const unique = [...new Set(detailParts.filter(Boolean))];
  if (unique.length) return unique.join("; ");
  return data?.message || `Request failed (${res.status})`;
}

function getPagedList(data) {
  const raw = data?.data ?? data;
  if (Array.isArray(raw?.items))
    return {
      items: raw.items,
      total: raw.total ?? raw.total_count ?? raw.items.length,
      page: raw.page ?? 1,
    };
  if (Array.isArray(raw?.wards))
    return {
      items: raw.wards,
      total: raw.total ?? raw.wards.length,
      page: raw.page ?? 1,
    };
  if (Array.isArray(raw?.beds))
    return {
      items: raw.beds,
      total: raw.total ?? raw.beds.length,
      page: raw.page ?? 1,
    };
  if (Array.isArray(raw?.admissions))
    return {
      items: raw.admissions,
      total: raw.total ?? raw.admissions.length,
      page: raw.page ?? 1,
    };
  if (Array.isArray(raw?.results))
    return {
      items: raw.results,
      total: raw.total ?? raw.results.length,
      page: raw.page ?? 1,
    };
  if (Array.isArray(raw)) return { items: raw, total: raw.length, page: 1 };
  return { items: [], total: 0, page: 1 };
}

function splitToStringArray(text) {
  return String(text || "")
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function wardIdFromRow(w) {
  const id = w?.id ?? w?.ward_id;
  return id != null ? String(id) : "";
}

function bedIdFromRow(b) {
  const id = b?.id ?? b?.bed_id;
  return id != null ? String(id) : "";
}

const ADMISSION_TYPE_OPTIONS = [
  "ELECTIVE",
  "EMERGENCY",
  "URGENT",
  "ROUTINE",
  "OBSERVATION",
];
const ADMISSION_STATUS_FILTER_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "ADMITTED", label: "Admitted" },
  { value: "DISCHARGED", label: "Discharged" },
];

function mapAdmissionToCard(a) {
  const id = a?.id ?? a?.admission_id;
  const pid = id != null ? String(id) : "";
  const statusRaw = (a?.status ?? a?.admission_status ?? "").toString();
  const status = statusRaw.toUpperCase();
  const discharged = status === "DISCHARGED" || Boolean(a?.discharge_date);
  const bed = a?.bed && typeof a.bed === "object" ? a.bed : {};
  const nameFromPatientObj = [a?.patient?.first_name, a?.patient?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  const patientLabel =
    (a?.patient_name && String(a.patient_name).trim()) ||
    nameFromPatientObj ||
    a?.patient_ref ||
    "Unknown patient";
  const admissionDateRaw = a?.admission_date ?? a?.admitted_at ?? "";
  const admissionDate =
    typeof admissionDateRaw === "string"
      ? admissionDateRaw.split("T")[0]
      : admissionDateRaw || "—";
  const dischargeDateRaw = a?.discharge_date;
  const dischargeDate = dischargeDateRaw
    ? String(dischargeDateRaw).split("T")[0]
    : null;
  const bedIdStr =
    bed?.id != null
      ? String(bed.id)
      : a?.bed_id != null
        ? String(a.bed_id)
        : "";

  return {
    id: pid,
    raw: a,
    patient: patientLabel,
    patient_ref: a?.patient_ref ?? "",
    roomNo: a?.ward_name ?? bed?.ward_name ?? a?.room ?? "—",
    bedNo: bed?.bed_number ?? a?.bed_number ?? "—",
    bed_id: bedIdStr,
    admissionDate,
    dischargeDate,
    doctor: a?.admitting_doctor ?? a?.doctor_name ?? "—",
    diagnosis: a?.diagnosis ?? "",
    treatmentPlan: a?.symptoms ?? a?.treatment_plan ?? "",
    emergencyContact: a?.emergency_contact ?? "",
    insurance: a?.insurance_details ?? "",
    insuranceId: "",
    insuranceAmount: "",
    status: status || "—",
    department: a?.department ?? "",
    admission_type: a?.admission_type ?? "",
    medical_history: a?.medical_history ?? "",
    discharged,
    needsBedAssignment: !discharged && !bedIdStr,
  };
}

const defaultAdmissionCreateForm = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return {
    patient_ref: "",
    admission_type: "ELECTIVE",
    admission_date: now.toISOString().slice(0, 10),
    admission_time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
    admitting_doctor: "",
    department: "",
    diagnosis: "",
    symptoms: "",
    medical_history: "",
    emergency_contact: "",
    insurance_details: "",
    estimated_stay_days: 1,
  };
};

const InpatientManagement = () => {
  const [mainTab, setMainTab] = useState("inpatients");
  const [inpatients, setInpatients] = useState([]);
  const [admissionsTotal, setAdmissionsTotal] = useState(0);
  const [admissionsPage, setAdmissionsPage] = useState(1);
  const [admissionsLimit] = useState(50);
  const [listLoading, setListLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [admissionStatusFilter, setAdmissionStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [modalState, setModalState] = useState({
    view: false,
    discharge: false,
    assignBed: false,
    createAdmission: false,
  });
  const [currentPatient, setCurrentPatient] = useState(null);
  const [admissionCreateForm, setAdmissionCreateForm] = useState(() =>
    defaultAdmissionCreateForm(),
  );
  const [admissionSubmitting, setAdmissionSubmitting] = useState(false);
  const [assignBedForm, setAssignBedForm] = useState({
    bed_id: "",
    admission_notes: "",
  });
  const [assignBedSubmitting, setAssignBedSubmitting] = useState(false);
  const [availableBeds, setAvailableBeds] = useState([]);
  const [bedsPickLoading, setBedsPickLoading] = useState(false);
  const [dischargeForm, setDischargeForm] = useState({
    discharge_notes: "",
    discharge_summary: "",
  });
  const [dischargeSubmitting, setDischargeSubmitting] = useState(false);

  const loadAdmissions = useCallback(async () => {
    setListLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(admissionsPage),
        limit: String(admissionsLimit),
      });
      if (admissionStatusFilter) params.set("status", admissionStatusFilter);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);
      const res = await apiFetch(`${HOSPITAL_ADMIN_ADMISSIONS}?${params}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(parseApiError(data, res));
      const { items, total } = getPagedList(data);
      setInpatients(items.map(mapAdmissionToCard));
      setAdmissionsTotal(total);
    } catch (e) {
      toast.error(e?.message || "Could not load admissions");
      setInpatients([]);
      setAdmissionsTotal(0);
    } finally {
      setListLoading(false);
    }
  }, [
    admissionsPage,
    admissionsLimit,
    admissionStatusFilter,
    dateFrom,
    dateTo,
  ]);

  useEffect(() => {
    if (mainTab === "inpatients") loadAdmissions();
  }, [mainTab, loadAdmissions]);

  const loadAvailableBeds = useCallback(async () => {
    setBedsPickLoading(true);
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "100",
        status: "available",
      });
      const res = await apiFetch(`${HOSPITAL_ADMIN_BEDS}?${params}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(parseApiError(data, res));
      const { items } = getPagedList(data);
      setAvailableBeds(items);
    } catch (e) {
      toast.error(e?.message || "Could not load available beds");
      setAvailableBeds([]);
    } finally {
      setBedsPickLoading(false);
    }
  }, []);

  const openModal = (type, patient = null) => {
    setModalState((prev) => ({ ...prev, [type]: true }));
    if (patient) setCurrentPatient(patient);
    if (type === "discharge") {
      setDischargeForm({ discharge_notes: "", discharge_summary: "" });
    }
    if (type === "assignBed" && patient) {
      setAssignBedForm({ bed_id: "", admission_notes: "" });
      loadAvailableBeds();
    }
  };

  const closeModal = (type) => {
    setModalState((prev) => ({ ...prev, [type]: false }));
    if (type === "view" || type === "discharge" || type === "assignBed")
      setCurrentPatient(null);
    if (type === "createAdmission")
      setAdmissionCreateForm(defaultAdmissionCreateForm());
  };

  const openCreateAdmission = () => {
    setAdmissionCreateForm(defaultAdmissionCreateForm());
    setModalState((prev) => ({ ...prev, createAdmission: true }));
  };

  const submitCreateAdmission = async () => {
    if (!admissionCreateForm.patient_ref.trim()) {
      toast.warn("Patient reference is required");
      return;
    }
    const body = {
      patient_ref: admissionCreateForm.patient_ref.trim(),
      admission_type: admissionCreateForm.admission_type,
      admission_date: admissionCreateForm.admission_date,
      admission_time: admissionCreateForm.admission_time,
      admitting_doctor: admissionCreateForm.admitting_doctor || "",
      department: admissionCreateForm.department || "",
      diagnosis: admissionCreateForm.diagnosis || "",
      symptoms: admissionCreateForm.symptoms || "",
      medical_history: admissionCreateForm.medical_history || "",
      emergency_contact: admissionCreateForm.emergency_contact || "",
      insurance_details: admissionCreateForm.insurance_details || "",
      estimated_stay_days: Math.max(
        1,
        Number(admissionCreateForm.estimated_stay_days) || 1,
      ),
    };
    setAdmissionSubmitting(true);
    try {
      const res = await apiFetch(HOSPITAL_ADMIN_ADMISSIONS, {
        method: "POST",
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(parseApiError(data, res));
      toast.success("Admission created");
      closeModal("createAdmission");
      loadAdmissions();
    } catch (e) {
      toast.error(e?.message || "Create admission failed");
    } finally {
      setAdmissionSubmitting(false);
    }
  };

  const submitAssignBed = async () => {
    if (!currentPatient?.id) return;
    if (!assignBedForm.bed_id) {
      toast.warn("Select a bed");
      return;
    }
    setAssignBedSubmitting(true);
    try {
      const body = {
        bed_id: assignBedForm.bed_id,
        ...(assignBedForm.admission_notes.trim()
          ? { admission_notes: assignBedForm.admission_notes.trim() }
          : {}),
      };
      const res = await apiFetch(
        HOSPITAL_ADMIN_ADMISSION_ASSIGN_BED(currentPatient.id),
        {
          method: "PATCH",
          body,
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(parseApiError(data, res));
      toast.success("Bed assigned");
      closeModal("assignBed");
      loadAdmissions();
    } catch (e) {
      toast.error(e?.message || "Assign bed failed");
    } finally {
      setAssignBedSubmitting(false);
    }
  };

  const handleDischargePatient = async () => {
    if (!currentPatient?.id) return;
    setDischargeSubmitting(true);
    try {
      const body = {};
      if (dischargeForm.discharge_notes.trim())
        body.discharge_notes = dischargeForm.discharge_notes.trim();
      if (dischargeForm.discharge_summary.trim())
        body.discharge_summary = dischargeForm.discharge_summary.trim();
      const res = await apiFetch(
        HOSPITAL_ADMIN_ADMISSION_DISCHARGE(currentPatient.id),
        {
          method: "PATCH",
          body,
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(parseApiError(data, res));
      toast.success("Patient discharged");
      closeModal("discharge");
      loadAdmissions();
    } catch (e) {
      toast.error(e?.message || "Discharge failed");
    } finally {
      setDischargeSubmitting(false);
    }
  };

  const filteredInpatients = inpatients.filter((ip) => {
    const matchesSearch =
      !searchTerm ||
      [ip.patient, ip.id, ip.diagnosis, ip.patient_ref, ip.department].some(
        (field) =>
          String(field || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()),
      );
    const isActive = !ip.discharged;
    return matchesSearch && isActive;
  });

  const admittedWithBed = inpatients.filter(
    (ip) => !ip.discharged && ip.bed_id,
  ).length;
  const pendingBed = inpatients.filter(
    (ip) => !ip.discharged && ip.needsBedAssignment,
  ).length;
  const stats = [
    { label: "Admitted (with bed)", value: admittedWithBed, color: "blue" },
    { label: "Pending bed assignment", value: pendingBed, color: "green" },
    { label: "Total (this page)", value: inpatients.length, color: "purple" },
  ];

  const admissionTotalPages = Math.max(
    1,
    Math.ceil(admissionsTotal / admissionsLimit) || 1,
  );

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-700">
          Inpatient Management
        </h2>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div
            className="flex w-full sm:w-auto sm:min-w-[280px] max-w-md rounded-lg border border-gray-200 bg-gray-50 p-1 shadow-sm"
            role="tablist"
            aria-label="Inpatient section"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mainTab === "inpatients"}
              onClick={() => setMainTab("inpatients")}
              className={`flex flex-1 min-w-0 items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors text-center ${
                mainTab === "inpatients"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
              }`}
            >
              <i className="fas fa-procedures shrink-0" aria-hidden />
              <span className="truncate">Inpatients</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mainTab === "wardsBeds"}
              onClick={() => setMainTab("wardsBeds")}
              className={`flex flex-1 min-w-0 items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors text-center ${
                mainTab === "wardsBeds"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
              }`}
            >
              <i className="fas fa-hospital shrink-0" aria-hidden />
              <span className="truncate">Wards &amp; beds</span>
            </button>
          </div>
          {mainTab === "inpatients" && (
            <button
              type="button"
              onClick={openCreateAdmission}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-sm"
            >
              <i className="fas fa-plus" aria-hidden />
              New admission
            </button>
          )}
        </div>
      </div>

      {mainTab === "wardsBeds" && <WardBedManagementSection />}

      {mainTab === "inpatients" && (
        <>
          {/* Search and filters */}
          <div className="bg-white p-4 rounded-lg card-shadow border mb-6 space-y-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs text-gray-500 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Patient, ref, diagnosis, department…"
                  className="w-full p-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Status
                </label>
                <select
                  value={admissionStatusFilter}
                  onChange={(e) => {
                    setAdmissionStatusFilter(e.target.value);
                    setAdmissionsPage(1);
                  }}
                  className="p-2 border rounded-lg min-w-[140px]"
                >
                  {ADMISSION_STATUS_FILTER_OPTIONS.map((o) => (
                    <option key={o.value || "all"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setAdmissionsPage(1);
                  }}
                  className="p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setAdmissionsPage(1);
                  }}
                  className="p-2 border rounded-lg"
                />
              </div>
              <button
                type="button"
                onClick={() => loadAdmissions()}
                className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50"
              >
                <i className="fas fa-sync-alt mr-1" />
                Refresh
              </button>
            </div>
          </div>

          {/* Critical Alerts Banner */}
          {pendingBed > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 cursor-pointer hover:bg-red-100 transition-colors">
              <div className="flex items-center">
                <i className="fas fa-exclamation-triangle text-red-500 text-xl mr-3"></i>
                <div>
                  <h3 className="font-semibold text-red-700">
                    Critical Alerts
                  </h3>
                  <p className="text-red-600 text-sm">
                    {pendingBed} patient{pendingBed > 1 ? "s" : ""} pending bed
                    assignment
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bed Occupancy */}
          {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {stats.map(({ label, value, color }) => (
          <div key={label} className="bg-white p-6 rounded-xl card-shadow border text-center">
            <div className={`text-2xl font-bold text-${color}-600`}>{value}</div>
            <div className="text-sm text-gray-500">{label}</div>
          </div>
        ))}
      </div> */}

          {/* Statistics - Compact 3 Column Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {stats.map(({ label, value, color }) => {
              const colorConfigs = {
                blue: {
                  bg: "bg-blue-500/5",
                  text: "text-blue-600",
                  iconBg: "bg-blue-100",
                  iconColor: "text-blue-500",
                  icon: "fas fa-chart-line",
                },
                green: {
                  bg: "bg-green-500/5",
                  text: "text-green-600",
                  iconBg: "bg-green-100",
                  iconColor: "text-green-500",
                  icon: "fas fa-check-circle",
                },
                purple: {
                  bg: "bg-purple-500/5",
                  text: "text-purple-600",
                  iconBg: "bg-purple-100",
                  iconColor: "text-purple-500",
                  icon: "fas fa-chart-pie",
                },
              };

              const config = colorConfigs[color] || colorConfigs.blue;

              return (
                <div
                  key={label}
                  className={`${config.bg} border border-gray-200 p-5 rounded-xl hover:shadow-md transition-all duration-300`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">{label}</div>
                      <div className={`text-2xl font-bold ${config.text}`}>
                        {value}
                      </div>
                    </div>
                    <div className={`${config.iconBg} p-3 rounded-lg`}>
                      <i
                        className={`${config.icon} ${config.iconColor} text-lg`}
                      ></i>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center text-xs text-gray-500">
                      <i className="fas fa-database mr-1"></i>
                      <span>Admissions API</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Inpatients grid */}
          {listLoading ? (
            <div className="py-16">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInpatients.map((patient) => (
                <InpatientCard
                  key={patient.id}
                  patient={patient}
                  onView={() => openModal("view", patient)}
                  onAssignBed={() => openModal("assignBed", patient)}
                  onDischarge={() => openModal("discharge", patient)}
                />
              ))}
            </div>
          )}

          {!listLoading && filteredInpatients.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-procedures text-blue-500 text-3xl mb-2"></i>
              <p>
                {inpatients.length === 0
                  ? "No admissions match your filters."
                  : "No admissions match your search."}
              </p>
            </div>
          )}

          {!listLoading && (
            <div className="flex flex-wrap items-center justify-between gap-3 mt-6 text-sm text-gray-600">
              <span>
                Page {admissionsPage} of {admissionTotalPages} (
                {admissionsTotal} total)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={admissionsPage <= 1}
                  onClick={() => setAdmissionsPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={admissionsPage >= admissionTotalPages}
                  onClick={() => setAdmissionsPage((p) => p + 1)}
                  className="px-3 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Recent Discharges */}
          <div className="bg-white p-4 border rounded card-shadow mt-6">
            <h3 className="text-lg font-semibold mb-3">Recent Discharges</h3>
            <DataTable
              columns={[
                { key: "patient", title: "Patient", sortable: true },
                { key: "roomNo", title: "Room", sortable: true },
                {
                  key: "admissionDate",
                  title: "Admission Date",
                  sortable: true,
                },
                {
                  key: "dischargeDate",
                  title: "Discharge Date",
                  sortable: true,
                },
                { key: "doctor", title: "Doctor", sortable: true },
              ]}
              data={inpatients.filter((ip) => ip.discharged)}
            />
          </div>
        </>
      )}

      {/* Modals */}
      <ViewPatientModal
        isOpen={modalState.view}
        onClose={() => closeModal("view")}
        patient={currentPatient}
      />

      <CreateAdmissionModal
        isOpen={modalState.createAdmission}
        onClose={() => closeModal("createAdmission")}
        form={admissionCreateForm}
        setForm={setAdmissionCreateForm}
        onSubmit={submitCreateAdmission}
        submitting={admissionSubmitting}
      />

      <AssignBedModal
        isOpen={modalState.assignBed}
        onClose={() => closeModal("assignBed")}
        patient={currentPatient}
        beds={availableBeds}
        bedsLoading={bedsPickLoading}
        form={assignBedForm}
        setForm={setAssignBedForm}
        onSubmit={submitAssignBed}
        submitting={assignBedSubmitting}
      />

      <DischargeModal
        isOpen={modalState.discharge}
        onClose={() => closeModal("discharge")}
        onConfirm={handleDischargePatient}
        patient={currentPatient}
        form={dischargeForm}
        setForm={setDischargeForm}
        submitting={dischargeSubmitting}
      />
    </div>
  );
};

const defaultWardForm = () => ({
  name: "",
  ward_type: "GENERAL",
  floor_number: 0,
  total_beds: 1,
  description: "",
  head_nurse: "",
  phone: "",
  facilitiesText: "",
  visiting_hours: "",
  emergency_access: false,
  isolation_capability: false,
  oxygen_supply: false,
  nurse_station_location: "",
});

const defaultBedForm = () => ({
  ward_name: "",
  bed_number: "",
  bed_type: "GENERAL",
  equipmentText: "",
  daily_rate: 0,
  notes: "",
  is_isolation: false,
  has_oxygen: false,
  has_monitor: false,
});

function WardBedManagementSection() {
  const [subTab, setSubTab] = useState("wards");
  const [wardPage, setWardPage] = useState(1);
  const [wardLimit] = useState(50);
  const [wardTypeFilter, setWardTypeFilter] = useState("");
  const [activeOnlyWards, setActiveOnlyWards] = useState(false);
  const [wards, setWards] = useState([]);
  const [wardsTotal, setWardsTotal] = useState(0);
  const [wardsLoading, setWardsLoading] = useState(false);

  const [bedPage, setBedPage] = useState(1);
  const [bedLimit] = useState(50);
  const [bedWardIdFilter, setBedWardIdFilter] = useState("");
  const [bedStatusFilter, setBedStatusFilter] = useState("");
  const [bedTypeFilter, setBedTypeFilter] = useState("");
  const [beds, setBeds] = useState([]);
  const [bedsTotal, setBedsTotal] = useState(0);
  const [bedsLoading, setBedsLoading] = useState(false);

  const [wardNamesCache, setWardNamesCache] = useState([]);
  /** Wards for bed filters / create-bed datalist (first page, high limit) */
  const [wardSelectList, setWardSelectList] = useState([]);

  const [createWardOpen, setCreateWardOpen] = useState(false);
  const [editWardOpen, setEditWardOpen] = useState(false);
  const [editingWardId, setEditingWardId] = useState("");
  const [wardForm, setWardForm] = useState(defaultWardForm);
  const [wardSubmitting, setWardSubmitting] = useState(false);

  const [createBedOpen, setCreateBedOpen] = useState(false);
  const [bedForm, setBedForm] = useState(defaultBedForm);
  const [bedSubmitting, setBedSubmitting] = useState(false);

  const [bedDetailOpen, setBedDetailOpen] = useState(false);
  const [bedDetailLoading, setBedDetailLoading] = useState(false);
  const [bedDetail, setBedDetail] = useState(null);

  const [bedStatusOpen, setBedStatusOpen] = useState(false);
  const [bedStatusId, setBedStatusId] = useState("");
  const [bedStatusForm, setBedStatusForm] = useState({
    status: "available",
    maintenance_notes: "",
    patient_id: "",
  });
  const [bedStatusSubmitting, setBedStatusSubmitting] = useState(false);

  const loadWards = useCallback(async () => {
    setWardsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(wardPage),
        limit: String(wardLimit),
        active_only: String(activeOnlyWards),
      });
      if (wardTypeFilter) params.set("ward_type", wardTypeFilter);
      const res = await apiFetch(`${HOSPITAL_ADMIN_WARDS}?${params}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(parseApiError(data, res));
      const { items, total } = getPagedList(data);
      setWards(items);
      setWardsTotal(total);
      const names = items.map((w) => w?.name || w?.ward_name).filter(Boolean);
      setWardNamesCache((prev) => {
        const merged = [...new Set([...names, ...prev])];
        return merged;
      });
    } catch (e) {
      toast.error(e?.message || "Could not load wards");
      setWards([]);
      setWardsTotal(0);
    } finally {
      setWardsLoading(false);
    }
  }, [wardPage, wardLimit, wardTypeFilter, activeOnlyWards]);

  const loadBeds = useCallback(async () => {
    setBedsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(bedPage),
        limit: String(bedLimit),
      });
      if (bedWardIdFilter) params.set("ward_id", bedWardIdFilter);
      if (bedStatusFilter) params.set("status", bedStatusFilter);
      if (bedTypeFilter) params.set("bed_type", bedTypeFilter);
      const res = await apiFetch(`${HOSPITAL_ADMIN_BEDS}?${params}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(parseApiError(data, res));
      const { items, total } = getPagedList(data);
      setBeds(items);
      setBedsTotal(total);
    } catch (e) {
      toast.error(e?.message || "Could not load beds");
      setBeds([]);
      setBedsTotal(0);
    } finally {
      setBedsLoading(false);
    }
  }, [bedPage, bedLimit, bedWardIdFilter, bedStatusFilter, bedTypeFilter]);

  const loadWardSelectList = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "100",
        active_only: "false",
      });
      const res = await apiFetch(`${HOSPITAL_ADMIN_WARDS}?${params}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(parseApiError(data, res));
      const { items } = getPagedList(data);
      setWardSelectList(items);
      const names = items.map((w) => w?.name || w?.ward_name).filter(Boolean);
      setWardNamesCache((prev) => [...new Set([...names, ...prev])]);
    } catch (e) {
      toast.error(e?.message || "Could not load wards for filters");
      setWardSelectList([]);
    }
  }, []);

  useEffect(() => {
    if (subTab === "wards") loadWards();
  }, [subTab, loadWards]);

  useEffect(() => {
    if (subTab === "beds") {
      loadBeds();
      loadWardSelectList();
    }
  }, [subTab, loadBeds, loadWardSelectList]);

  const openCreateWard = () => {
    setWardForm(defaultWardForm());
    setCreateWardOpen(true);
  };

  const openEditWard = (row) => {
    const id = wardIdFromRow(row);
    if (!id) {
      toast.error("Ward has no ID; cannot edit.");
      return;
    }
    setEditingWardId(id);
    setWardForm({
      name: row?.name ?? row?.ward_name ?? "",
      ward_type: row?.ward_type ?? "GENERAL",
      floor_number: Number(row?.floor_number ?? 0),
      total_beds: Number(row?.total_beds ?? 1),
      description: row?.description ?? "",
      head_nurse: row?.head_nurse ?? "",
      phone: row?.phone ?? "",
      facilitiesText: Array.isArray(row?.facilities)
        ? row.facilities.join(", ")
        : "",
      visiting_hours: row?.visiting_hours ?? "",
      emergency_access: Boolean(row?.emergency_access),
      isolation_capability: Boolean(row?.isolation_capability),
      oxygen_supply: Boolean(row?.oxygen_supply),
      nurse_station_location: row?.nurse_station_location ?? "",
    });
    setEditWardOpen(true);
  };

  const buildWardPayload = (form) => ({
    name: form.name.trim(),
    ward_type: form.ward_type,
    floor_number: Number(form.floor_number) || 0,
    total_beds: Math.max(1, Number(form.total_beds) || 1),
    description: form.description || "",
    head_nurse: form.head_nurse || "",
    phone: form.phone || "",
    facilities: splitToStringArray(form.facilitiesText),
    visiting_hours: form.visiting_hours || "",
    emergency_access: Boolean(form.emergency_access),
    isolation_capability: Boolean(form.isolation_capability),
    oxygen_supply: Boolean(form.oxygen_supply),
    nurse_station_location: form.nurse_station_location || "",
  });

  const submitCreateWard = async () => {
    if (!wardForm.name.trim()) {
      toast.warn("Ward name is required");
      return;
    }
    setWardSubmitting(true);
    try {
      const res = await apiFetch(HOSPITAL_ADMIN_WARDS, {
        method: "POST",
        body: buildWardPayload(wardForm),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(parseApiError(data, res));
      toast.success("Ward created");
      setCreateWardOpen(false);
      loadWards();
    } catch (e) {
      toast.error(e?.message || "Create ward failed");
    } finally {
      setWardSubmitting(false);
    }
  };

  const submitEditWard = async () => {
    if (!editingWardId) return;
    const payload = buildWardPayload(wardForm);
    const updateBody = { ...payload };
    setWardSubmitting(true);
    try {
      const res = await apiFetch(HOSPITAL_ADMIN_WARD(editingWardId), {
        method: "PUT",
        body: updateBody,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(parseApiError(data, res));
      toast.success("Ward updated");
      setEditWardOpen(false);
      loadWards();
    } catch (e) {
      toast.error(e?.message || "Update ward failed");
    } finally {
      setWardSubmitting(false);
    }
  };

  const toggleWardActive = async (row, nextActive) => {
    const id = wardIdFromRow(row);
    if (!id) return;
    try {
      const res = await apiFetch(HOSPITAL_ADMIN_WARD_STATUS(id), {
        method: "PATCH",
        body: { is_active: nextActive },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(parseApiError(data, res));
      toast.success(nextActive ? "Ward enabled" : "Ward disabled");
      loadWards();
    } catch (e) {
      toast.error(e?.message || "Could not update ward status");
    }
  };

  const openCreateBed = () => {
    setBedForm(defaultBedForm());
    setCreateBedOpen(true);
  };

  const submitCreateBed = async () => {
    if (!bedForm.ward_name.trim() || !bedForm.bed_number.trim()) {
      toast.warn("Ward name and bed number are required");
      return;
    }
    setBedSubmitting(true);
    try {
      const body = {
        ward_name: bedForm.ward_name.trim(),
        bed_number: bedForm.bed_number.trim(),
        bed_type: bedForm.bed_type,
        equipment: splitToStringArray(bedForm.equipmentText),
        daily_rate: Number(bedForm.daily_rate) || 0,
        notes: bedForm.notes || "",
        is_isolation: Boolean(bedForm.is_isolation),
        has_oxygen: Boolean(bedForm.has_oxygen),
        has_monitor: Boolean(bedForm.has_monitor),
      };
      const res = await apiFetch(HOSPITAL_ADMIN_BEDS, { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(parseApiError(data, res));
      toast.success("Bed created");
      setCreateBedOpen(false);
      loadBeds();
    } catch (e) {
      toast.error(e?.message || "Create bed failed");
    } finally {
      setBedSubmitting(false);
    }
  };

  const openBedDetails = async (row) => {
    const id = bedIdFromRow(row);
    if (!id) {
      toast.error("Bed has no ID");
      return;
    }
    setBedDetailOpen(true);
    setBedDetail(null);
    setBedDetailLoading(true);
    try {
      const res = await apiFetch(HOSPITAL_ADMIN_BED(id));
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(parseApiError(data, res));
      setBedDetail(data?.data ?? data);
    } catch (e) {
      toast.error(e?.message || "Could not load bed details");
      setBedDetailOpen(false);
    } finally {
      setBedDetailLoading(false);
    }
  };

  const openBedStatus = (row) => {
    const id = bedIdFromRow(row);
    if (!id) return;
    setBedStatusId(id);
    setBedStatusForm({
      status: row?.status || "available",
      maintenance_notes: row?.maintenance_notes ?? "",
      patient_id: row?.patient_id != null ? String(row.patient_id) : "",
    });
    setBedStatusOpen(true);
  };

  const submitBedStatus = async () => {
    if (!bedStatusId) return;
    setBedStatusSubmitting(true);
    try {
      const body = { status: bedStatusForm.status };
      const mn = bedStatusForm.maintenance_notes?.trim();
      if (mn) body.maintenance_notes = mn;
      const pid = bedStatusForm.patient_id?.trim();
      if (pid) body.patient_id = pid;
      const res = await apiFetch(HOSPITAL_ADMIN_BED_STATUS(bedStatusId), {
        method: "PATCH",
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(parseApiError(data, res));
      toast.success("Bed status updated");
      setBedStatusOpen(false);
      loadBeds();
    } catch (e) {
      toast.error(e?.message || "Update bed status failed");
    } finally {
      setBedStatusSubmitting(false);
    }
  };

  const wardTotalPages = Math.max(1, Math.ceil(wardsTotal / wardLimit) || 1);
  const bedTotalPages = Math.max(1, Math.ceil(bedsTotal / bedLimit) || 1);

  return (
    <div className="space-y-6 mb-10">
      <div
        className="flex w-full max-w-lg rounded-lg border border-gray-200 bg-gray-50 p-1 shadow-sm"
        role="tablist"
        aria-label="Ward or bed list"
      >
        <button
          type="button"
          role="tab"
          aria-selected={subTab === "wards"}
          onClick={() => setSubTab("wards")}
          className={`flex flex-1 min-w-0 items-center justify-center px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${
            subTab === "wards"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
          }`}
        >
          Wards
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={subTab === "beds"}
          onClick={() => setSubTab("beds")}
          className={`flex flex-1 min-w-0 items-center justify-center px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${
            subTab === "beds"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
          }`}
        >
          Beds
        </button>
      </div>

      {subTab === "wards" && (
        <div className="bg-white border rounded-xl card-shadow p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between mb-4">
            <div className="flex flex-wrap gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Ward type
                </label>
                <select
                  value={wardTypeFilter}
                  onChange={(e) => {
                    setWardTypeFilter(e.target.value);
                    setWardPage(1);
                  }}
                  className="p-2 border rounded-lg text-sm"
                >
                  <option value="">All types</option>
                  {WARD_TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 mt-5 lg:mt-0">
                <input
                  type="checkbox"
                  checked={activeOnlyWards}
                  onChange={(e) => {
                    setActiveOnlyWards(e.target.checked);
                    setWardPage(1);
                  }}
                />
                Active only
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => loadWards()}
                className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50"
              >
                <i className="fas fa-sync-alt mr-1"></i>Refresh
              </button>
              <button
                type="button"
                onClick={openCreateWard}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                <i className="fas fa-plus mr-1"></i>Create ward
              </button>
            </div>
          </div>

          {wardsLoading ? (
            <div className="py-12 text-center text-gray-500">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="py-2 pr-4">Name</th>
                      <th className="py-2 pr-4">Type</th>
                      <th className="py-2 pr-4">Floor</th>
                      <th className="py-2 pr-4">Beds</th>
                      <th className="py-2 pr-4">Active</th>
                      <th className="py-2 pr-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wards.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-8 text-center text-gray-500"
                        >
                          No wards found
                        </td>
                      </tr>
                    ) : (
                      wards.map((w) => {
                        const wid = wardIdFromRow(w);
                        const active = w?.is_active !== false;
                        return (
                          <tr
                            key={wid || w.name}
                            className="border-b border-gray-100"
                          >
                            <td className="py-2 pr-4 font-medium text-gray-800">
                              {w.name ?? w.ward_name ?? "—"}
                            </td>
                            <td className="py-2 pr-4">{w.ward_type ?? "—"}</td>
                            <td className="py-2 pr-4">
                              {w.floor_number ?? "—"}
                            </td>
                            <td className="py-2 pr-4">{w.total_beds ?? "—"}</td>
                            <td className="py-2 pr-4">
                              <span
                                className={
                                  active ? "text-green-600" : "text-red-600"
                                }
                              >
                                {active ? "Yes" : "No"}
                              </span>
                            </td>
                            <td className="py-2 pr-4 text-right space-x-1">
                              <button
                                type="button"
                                className="text-blue-600 hover:underline text-xs"
                                onClick={() => openEditWard(w)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="text-gray-700 hover:underline text-xs"
                                onClick={() => toggleWardActive(w, !active)}
                              >
                                {active ? "Disable" : "Enable"}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                <span>
                  Page {wardPage} of {wardTotalPages} ({wardsTotal} total)
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={wardPage <= 1}
                    onClick={() => setWardPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 border rounded disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={wardPage >= wardTotalPages}
                    onClick={() => setWardPage((p) => p + 1)}
                    className="px-3 py-1 border rounded disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {subTab === "beds" && (
        <div className="bg-white border rounded-xl card-shadow p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between mb-4">
            <div className="flex flex-wrap gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Ward</label>
                <select
                  value={bedWardIdFilter}
                  onChange={(e) => {
                    setBedWardIdFilter(e.target.value);
                    setBedPage(1);
                  }}
                  className="p-2 border rounded-lg text-sm min-w-[180px]"
                >
                  <option value="">All wards</option>
                  {wardSelectList.map((w) => {
                    const wid = wardIdFromRow(w);
                    const label = w.name ?? w.ward_name ?? wid;
                    return wid ? (
                      <option key={wid} value={wid}>
                        {label}
                      </option>
                    ) : null;
                  })}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Status
                </label>
                <select
                  value={bedStatusFilter}
                  onChange={(e) => {
                    setBedStatusFilter(e.target.value);
                    setBedPage(1);
                  }}
                  className="p-2 border rounded-lg text-sm"
                >
                  <option value="">All</option>
                  {BED_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Bed type
                </label>
                <select
                  value={bedTypeFilter}
                  onChange={(e) => {
                    setBedTypeFilter(e.target.value);
                    setBedPage(1);
                  }}
                  className="p-2 border rounded-lg text-sm"
                >
                  <option value="">All</option>
                  {BED_TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  loadBeds();
                  loadWardSelectList();
                }}
                className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50"
              >
                <i className="fas fa-sync-alt mr-1"></i>Refresh
              </button>
              <button
                type="button"
                onClick={openCreateBed}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                <i className="fas fa-plus mr-1"></i>Create bed
              </button>
            </div>
          </div>

          {bedsLoading ? (
            <div className="py-12 text-center text-gray-500">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="py-2 pr-4">Bed #</th>
                      <th className="py-2 pr-4">Ward</th>
                      <th className="py-2 pr-4">Type</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {beds.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-8 text-center text-gray-500"
                        >
                          No beds found
                        </td>
                      </tr>
                    ) : (
                      beds.map((b) => {
                        const bid = bedIdFromRow(b);
                        return (
                          <tr
                            key={bid || b.bed_number}
                            className="border-b border-gray-100"
                          >
                            <td className="py-2 pr-4 font-medium">
                              {b.bed_number ?? "—"}
                            </td>
                            <td className="py-2 pr-4">
                              {b.ward_name ?? b.ward?.name ?? "—"}
                            </td>
                            <td className="py-2 pr-4">{b.bed_type ?? "—"}</td>
                            <td className="py-2 pr-4 capitalize">
                              {b.status ?? "—"}
                            </td>
                            <td className="py-2 pr-4 text-right space-x-1">
                              <button
                                type="button"
                                className="text-blue-600 hover:underline text-xs"
                                onClick={() => openBedDetails(b)}
                              >
                                Details
                              </button>
                              <button
                                type="button"
                                className="text-gray-700 hover:underline text-xs"
                                onClick={() => openBedStatus(b)}
                              >
                                Status
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                <span>
                  Page {bedPage} of {bedTotalPages} ({bedsTotal} total)
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={bedPage <= 1}
                    onClick={() => setBedPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 border rounded disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={bedPage >= bedTotalPages}
                    onClick={() => setBedPage((p) => p + 1)}
                    className="px-3 py-1 border rounded disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <Modal
        isOpen={createWardOpen}
        onClose={() => setCreateWardOpen(false)}
        title="Create ward"
        size="lg"
      >
        <WardFormFields form={wardForm} setForm={setWardForm} />
        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <button
            type="button"
            onClick={() => setCreateWardOpen(false)}
            className="px-4 py-2 border rounded-lg"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={wardSubmitting}
            onClick={submitCreateWard}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            {wardSubmitting ? "Saving…" : "Create"}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={editWardOpen}
        onClose={() => setEditWardOpen(false)}
        title="Edit ward"
        size="lg"
      >
        <WardFormFields form={wardForm} setForm={setWardForm} />
        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <button
            type="button"
            onClick={() => setEditWardOpen(false)}
            className="px-4 py-2 border rounded-lg"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={wardSubmitting}
            onClick={submitEditWard}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            {wardSubmitting ? "Saving…" : "Save changes"}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={createBedOpen}
        onClose={() => setCreateBedOpen(false)}
        title="Create bed"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Ward name <span className="text-red-500">*</span>
              </label>
              <input
                list="ward-names-datalist"
                value={bedForm.ward_name}
                onChange={(e) =>
                  setBedForm((f) => ({ ...f, ward_name: e.target.value }))
                }
                className="w-full p-2 border rounded-lg"
                placeholder="Exact ward name"
              />
              <datalist id="ward-names-datalist">
                {wardNamesCache.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Bed number <span className="text-red-500">*</span>
              </label>
              <input
                value={bedForm.bed_number}
                onChange={(e) =>
                  setBedForm((f) => ({ ...f, bed_number: e.target.value }))
                }
                className="w-full p-2 border rounded-lg"
                placeholder="e.g. B-12"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Bed type
              </label>
              <select
                value={bedForm.bed_type}
                onChange={(e) =>
                  setBedForm((f) => ({ ...f, bed_type: e.target.value }))
                }
                className="w-full p-2 border rounded-lg"
              >
                {BED_TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Daily rate
              </label>
              <input
                type="number"
                min={0}
                value={bedForm.daily_rate}
                onChange={(e) =>
                  setBedForm((f) => ({ ...f, daily_rate: e.target.value }))
                }
                className="w-full p-2 border rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Equipment (comma or newline separated)
            </label>
            <textarea
              rows={2}
              value={bedForm.equipmentText}
              onChange={(e) =>
                setBedForm((f) => ({ ...f, equipmentText: e.target.value }))
              }
              className="w-full p-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Notes</label>
            <textarea
              rows={2}
              value={bedForm.notes}
              onChange={(e) =>
                setBedForm((f) => ({ ...f, notes: e.target.value }))
              }
              className="w-full p-2 border rounded-lg"
            />
          </div>
          <div className="flex flex-wrap gap-4">
            {[
              ["is_isolation", "Isolation"],
              ["has_oxygen", "Oxygen"],
              ["has_monitor", "Monitor"],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={bedForm[key]}
                  onChange={(e) =>
                    setBedForm((f) => ({ ...f, [key]: e.target.checked }))
                  }
                />
                {label}
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <button
            type="button"
            onClick={() => setCreateBedOpen(false)}
            className="px-4 py-2 border rounded-lg"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={bedSubmitting}
            onClick={submitCreateBed}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            {bedSubmitting ? "Saving…" : "Create bed"}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={bedDetailOpen}
        onClose={() => setBedDetailOpen(false)}
        title="Bed details"
        size="lg"
      >
        {bedDetailLoading ? (
          <LoadingSpinner />
        ) : bedDetail ? (
          <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">
            {JSON.stringify(bedDetail, null, 2)}
          </pre>
        ) : (
          <p className="text-gray-500">No data</p>
        )}
        <div className="flex justify-end pt-4">
          <button
            type="button"
            onClick={() => setBedDetailOpen(false)}
            className="px-4 py-2 bg-gray-100 rounded-lg"
          >
            Close
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={bedStatusOpen}
        onClose={() => setBedStatusOpen(false)}
        title="Update bed status"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Status</label>
            <select
              value={bedStatusForm.status}
              onChange={(e) =>
                setBedStatusForm((f) => ({ ...f, status: e.target.value }))
              }
              className="w-full p-2 border rounded-lg"
            >
              {BED_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Maintenance notes
            </label>
            <textarea
              rows={3}
              value={bedStatusForm.maintenance_notes}
              onChange={(e) =>
                setBedStatusForm((f) => ({
                  ...f,
                  maintenance_notes: e.target.value,
                }))
              }
              className="w-full p-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Patient ID (UUID, optional)
            </label>
            <input
              value={bedStatusForm.patient_id}
              onChange={(e) =>
                setBedStatusForm((f) => ({ ...f, patient_id: e.target.value }))
              }
              className="w-full p-2 border rounded-lg"
              placeholder="Leave empty if not applicable"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <button
            type="button"
            onClick={() => setBedStatusOpen(false)}
            className="px-4 py-2 border rounded-lg"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={bedStatusSubmitting}
            onClick={submitBedStatus}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            {bedStatusSubmitting ? "Updating…" : "Update"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function WardFormFields({ form, setForm }) {
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="w-full p-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Ward type</label>
          <select
            value={form.ward_type}
            onChange={(e) => set("ward_type", e.target.value)}
            className="w-full p-2 border rounded-lg"
          >
            {WARD_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">
            Floor number
          </label>
          <input
            type="number"
            value={form.floor_number}
            onChange={(e) => set("floor_number", e.target.value)}
            className="w-full p-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Total beds</label>
          <input
            type="number"
            min={1}
            value={form.total_beds}
            onChange={(e) => set("total_beds", e.target.value)}
            className="w-full p-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Head nurse</label>
          <input
            value={form.head_nurse}
            onChange={(e) => set("head_nurse", e.target.value)}
            className="w-full p-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Phone</label>
          <input
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            className="w-full p-2 border rounded-lg"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-700 mb-1">Description</label>
        <textarea
          rows={2}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          className="w-full p-2 border rounded-lg"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-700 mb-1">
          Facilities (comma or newline separated)
        </label>
        <textarea
          rows={2}
          value={form.facilitiesText}
          onChange={(e) => set("facilitiesText", e.target.value)}
          className="w-full p-2 border rounded-lg"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-700 mb-1">
          Visiting hours
        </label>
        <input
          value={form.visiting_hours}
          onChange={(e) => set("visiting_hours", e.target.value)}
          className="w-full p-2 border rounded-lg"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-700 mb-1">
          Nurse station location
        </label>
        <input
          value={form.nurse_station_location}
          onChange={(e) => set("nurse_station_location", e.target.value)}
          className="w-full p-2 border rounded-lg"
        />
      </div>
      <div className="flex flex-wrap gap-4">
        {[
          ["emergency_access", "Emergency access"],
          ["isolation_capability", "Isolation capability"],
          ["oxygen_supply", "Oxygen supply"],
        ].map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form[key]}
              onChange={(e) => set(key, e.target.checked)}
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}

// Sub-components
const InpatientCard = ({ patient, onView, onDischarge, onAssignBed }) => {
  const statusClass =
    patient.status === "DISCHARGED"
      ? "bg-gray-100 text-gray-700"
      : patient.needsBedAssignment
        ? "bg-amber-100 text-amber-900"
        : "bg-blue-100 text-blue-800";
  return (
    <div className="bg-white rounded-xl card-shadow border p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="min-w-0 pr-2">
          <h3 className="font-semibold text-blue-700 truncate">
            {patient.patient}
          </h3>
          <p className="text-xs text-gray-500 truncate">
            {patient.patient_ref || patient.id}
          </p>
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-600 mb-4">
        {[
          {
            label: "Department:",
            value: patient.department || "—",
            className: "font-medium",
          },
          {
            label: "Room / ward:",
            value: patient.roomNo,
            className: "font-medium",
          },
          { label: "Bed:", value: patient.bedNo, className: "font-medium" },
          {
            label: "Admission:",
            value: patient.admissionDate,
            className: "text-gray-500",
          },
          { label: "Doctor:", value: patient.doctor, className: "font-medium" },
          ...(patient.diagnosis
            ? [
                {
                  label: "Diagnosis:",
                  value: patient.diagnosis,
                  className: "text-xs text-gray-500 mt-1",
                },
              ]
            : []),
        ].map(({ label, value, className }) => (
          <div key={label} className="flex justify-between gap-2">
            <span className="shrink-0">{label}</span>
            <span className={`${className} text-right truncate`}>{value}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center pt-4 border-t gap-2">
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${statusClass}`}
        >
          {patient.status}
        </span>
        <div className="flex gap-1 shrink-0">
          <ActionButton
            icon="chart-line"
            color="blue"
            onClick={onView}
            title="View details"
          />
          {patient.needsBedAssignment && (
            <ActionButton
              icon="bed"
              color="purple"
              onClick={onAssignBed}
              title="Assign bed"
            />
          )}
          {!patient.discharged && (
            <ActionButton
              icon="sign-out-alt"
              color="green"
              onClick={onDischarge}
              title="Discharge"
            />
          )}
        </div>
      </div>
    </div>
  );
};

const ActionButton = ({ icon, color, onClick, title }) => (
  <button
    onClick={onClick}
    className={`text-${color}-600 hover:text-${color}-800 p-1 rounded hover:bg-${color}-50 transition-colors`}
    title={title}
  >
    <i className={`fas fa-${icon}`}></i>
  </button>
);

const ViewPatientModal = ({ isOpen, onClose, patient }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Admission details" size="lg">
    {patient && (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <DetailItem label="Admission ID" value={patient.id} />
          <DetailItem label="Status" value={patient.status} />
          <DetailItem label="Patient ref" value={patient.patient_ref || "—"} />
          <DetailItem label="Display name" value={patient.patient} />
          <DetailItem
            label="Admission type"
            value={patient.admission_type || "—"}
          />
          <DetailItem label="Department" value={patient.department || "—"} />
          <DetailItem label="Ward / room" value={patient.roomNo} />
          <DetailItem label="Bed" value={patient.bedNo} />
          <DetailItem label="Admission date" value={patient.admissionDate} />
          <DetailItem label="Admitting doctor" value={patient.doctor} />
        </div>

        {patient.insurance ? (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">Insurance</h4>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {patient.insurance}
            </p>
          </div>
        ) : null}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Diagnosis
          </label>
          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded min-h-[2.5rem]">
            {patient.diagnosis || "—"}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Symptoms / notes
          </label>
          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded whitespace-pre-wrap">
            {patient.treatmentPlan || "—"}
          </p>
        </div>

        {patient.medical_history ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medical history
            </label>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded whitespace-pre-wrap">
              {patient.medical_history}
            </p>
          </div>
        ) : null}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Emergency contact
          </label>
          <p className="text-sm text-gray-600">
            {patient.emergencyContact || "—"}
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    )}
  </Modal>
);

const DischargeModal = ({
  isOpen,
  onClose,
  onConfirm,
  patient,
  form,
  setForm,
  submitting,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Discharge patient" size="md">
    {patient && (
      <div className="space-y-4">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
            <i className="fas fa-sign-out-alt text-green-600 text-lg" />
          </div>
          <p className="text-gray-600 text-sm">
            Discharge{" "}
            <span className="font-semibold text-gray-800">
              {patient.patient}
            </span>
            {patient.bed_id ? ` (bed assigned)` : ""}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Discharge notes
          </label>
          <textarea
            rows={3}
            value={form.discharge_notes}
            onChange={(e) =>
              setForm((f) => ({ ...f, discharge_notes: e.target.value }))
            }
            className="w-full p-3 border border-gray-300 rounded-lg text-sm"
            placeholder="Clinical notes for discharge…"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Discharge summary (optional)
          </label>
          <textarea
            rows={2}
            value={form.discharge_summary}
            onChange={(e) =>
              setForm((f) => ({ ...f, discharge_summary: e.target.value }))
            }
            className="w-full p-3 border border-gray-300 rounded-lg text-sm"
            placeholder="Summary for records…"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={onConfirm}
            className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Confirm discharge"}
          </button>
        </div>
      </div>
    )}
  </Modal>
);

function CreateAdmissionModal({
  isOpen,
  onClose,
  form,
  setForm,
  onSubmit,
  submitting,
}) {
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New patient admission"
      size="lg"
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Patient reference <span className="text-red-500">*</span>
            </label>
            <input
              value={form.patient_ref}
              onChange={(e) => set("patient_ref", e.target.value)}
              className="w-full p-2.5 border rounded-lg"
              placeholder="ID, MRN, or identifier your backend expects"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admission type
            </label>
            <select
              value={form.admission_type}
              onChange={(e) => set("admission_type", e.target.value)}
              className="w-full p-2.5 border rounded-lg"
            >
              {ADMISSION_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimated stay (days)
            </label>
            <input
              type="number"
              min={1}
              value={form.estimated_stay_days}
              onChange={(e) => set("estimated_stay_days", e.target.value)}
              className="w-full p-2.5 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admission date
            </label>
            <input
              type="date"
              value={form.admission_date}
              onChange={(e) => set("admission_date", e.target.value)}
              className="w-full p-2.5 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admission time
            </label>
            <input
              type="time"
              value={form.admission_time}
              onChange={(e) => set("admission_time", e.target.value)}
              className="w-full p-2.5 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admitting doctor
            </label>
            <input
              value={form.admitting_doctor}
              onChange={(e) => set("admitting_doctor", e.target.value)}
              className="w-full p-2.5 border rounded-lg"
              placeholder="Doctor name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <input
              value={form.department}
              onChange={(e) => set("department", e.target.value)}
              className="w-full p-2.5 border rounded-lg"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Diagnosis
            </label>
            <input
              value={form.diagnosis}
              onChange={(e) => set("diagnosis", e.target.value)}
              className="w-full p-2.5 border rounded-lg"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Symptoms
            </label>
            <textarea
              rows={2}
              value={form.symptoms}
              onChange={(e) => set("symptoms", e.target.value)}
              className="w-full p-2.5 border rounded-lg"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medical history
            </label>
            <textarea
              rows={2}
              value={form.medical_history}
              onChange={(e) => set("medical_history", e.target.value)}
              className="w-full p-2.5 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Emergency contact
            </label>
            <input
              value={form.emergency_contact}
              onChange={(e) => set("emergency_contact", e.target.value)}
              className="w-full p-2.5 border rounded-lg"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Insurance details
            </label>
            <textarea
              rows={2}
              value={form.insurance_details}
              onChange={(e) => set("insurance_details", e.target.value)}
              className="w-full p-2.5 border rounded-lg"
              placeholder="Plan, policy number, etc."
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t mt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border rounded-lg"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={onSubmit}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          {submitting ? "Creating…" : "Create admission"}
        </button>
      </div>
    </Modal>
  );
}

function AssignBedModal({
  isOpen,
  onClose,
  patient,
  beds,
  bedsLoading,
  form,
  setForm,
  onSubmit,
  submitting,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign bed" size="md">
      {patient && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Admission{" "}
            <span className="font-medium text-gray-800">{patient.id}</span> —{" "}
            {patient.patient}
          </p>
          {bedsLoading ? (
            <LoadingSpinner size="sm" text="Loading available beds…" />
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Available bed</label>
              <select className="w-full p-2.5 border rounded-lg" value={form.bed_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bed_id: e.target.value }))
                }>
                <option value="">Select bed</option>
                {beds.map((b) => {
                  const bid = bedIdFromRow(b);
                  const label =
                    [b?.ward_name, b?.bed_number].filter(Boolean).join(" · ") ||
                    bid;
                  return bid ? (
                    <option key={bid} value={bid}>
                      {label}
                    </option>
                  ) : null;
                })}
              </select>
              {!beds.length ? (
                <p className="text-xs text-amber-800 mt-2">
                  No available beds in the list. Add beds under Wards &amp; beds or set a bed status to available.
                </p>
              ) : null}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admission notes (optional)</label>
            <textarea className="w-full p-2.5 border rounded-lg text-sm" rows={3} value={form.admission_notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, admission_notes: e.target.value }))
              }
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <button className="px-4 py-2 border rounded-lg" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50" type="button"
              disabled={submitting || !form.bed_id} onClick={onSubmit}>
              {submitting ? "Assigning…" : "Assign bed"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

const DetailItem = ({ label, value }) => (
  <div>
    <span className="font-medium text-gray-700">{label}:</span>
    <p className="text-gray-900 break-words">{value}</p>
  </div>
);

export default InpatientManagement;