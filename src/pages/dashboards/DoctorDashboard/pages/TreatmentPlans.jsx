import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import LoadingSpinner from "../../../../components/common/LoadingSpinner/LoadingSpinner";
import DataTable from "../../../../components/ui/Tables/DataTable";
import Modal from "../../../../components/common/Modal/Modal";
import {
  cleanupDoctorTreatmentPlanDates,
  createDoctorTreatmentPlan,
  createDoctorTreatmentPlanFromTemplate,
  doctorAppointmentErrorMessage,
  getDoctorTreatmentPlanAnalytics,
  getDoctorTreatmentPlanDetails,
  getDoctorTreatmentPlanOutcome,
  getDoctorTreatmentPlanStatus,
  getDoctorTreatmentPlanTemplates,
  getDoctorTreatmentPlans,
  recordDoctorTreatmentPlanOutcome,
  updateDoctorTreatmentPlan,
  updateDoctorTreatmentPlanProgress,
} from "../../../../services/doctorApi";

const PLAN_STATUS_OPTIONS = [
  "",
  "ACTIVE",
  "COMPLETED",
  "DISCONTINUED",
  "DRAFT",
];

function parseJsonArray(value, fieldName) {
  const raw = String(value || "").trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error();
    return parsed;
  } catch {
    throw new Error(`${fieldName} must be a valid JSON array.`);
  }
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString();
}

const TreatmentPlans = () => {
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [filters, setFilters] = useState({
    status: "",
    patient_ref: "",
    limit: 50,
  });
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planDetails, setPlanDetails] = useState(null);
  const [planStatus, setPlanStatus] = useState(null);
  const [planOutcome, setPlanOutcome] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const [createForm, setCreateForm] = useState({
    patient_ref: "",
    plan_name: "",
    primary_diagnosis: "",
    initial_notes: "",
    short_term_goals: "[]",
    long_term_goals: "[]",
    interventions: "[]",
    milestones: "[]",
  });

  const [progressForm, setProgressForm] = useState({
    progress_note: "",
    significant_change: false,
    next_review_date: "",
  });

  const [outcomeForm, setOutcomeForm] = useState({
    outcome_date: "",
    overall_outcome: "GOOD",
    outcome_summary: "",
    goals_achieved: 0,
    goals_partially_achieved: 0,
    goals_not_achieved: 0,
    clinical_effectiveness: "GOOD",
    treatment_adherence: 0,
    patient_satisfaction_score: 0,
    quality_of_life_score: 0,
    complications: "[]",
    future_recommendations: "[]",
    follow_up_plan: "",
    lessons_learned: "",
  });

  const [templateForm, setTemplateForm] = useState({
    diagnosis: "",
    specialty: "",
    template_id: "",
    patient_ref: "",
  });

  const [analyticsFilters, setAnalyticsFilters] = useState({
    date_from: "",
    date_to: "",
  });

  const stats = useMemo(() => {
    return {
      total: plans.length,
      active: plans.filter(
        (plan) => String(plan.status || "").toUpperCase() === "ACTIVE",
      ).length,
      completed: plans.filter(
        (plan) => String(plan.status || "").toUpperCase() === "COMPLETED",
      ).length,
      avgProgress:
        plans.length > 0
          ? Math.round(
              plans.reduce(
                (sum, plan) => sum + Number(plan.progress_percentage || 0),
                0,
              ) / plans.length,
            )
          : 0,
    };
  }, [plans]);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const response = await getDoctorTreatmentPlans(filters);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(doctorAppointmentErrorMessage(payload));
        setPlans([]);
        return;
      }
      setPlans(payload?.plans || payload?.data?.plans || []);
    } catch {
      toast.error("Could not load treatment plans.");
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleOpenPlan = async (plan) => {
    const planId = plan?.plan_id || plan?.id;
    if (!planId) return;
    setSelectedPlan(plan);
    setDetailLoading(true);
    try {
      const [detailRes, statusRes, outcomeRes] = await Promise.all([
        getDoctorTreatmentPlanDetails(planId),
        getDoctorTreatmentPlanStatus(planId),
        getDoctorTreatmentPlanOutcome(planId),
      ]);
      const [detailPayload, statusPayload, outcomePayload] = await Promise.all([
        detailRes.json().catch(() => ({})),
        statusRes.json().catch(() => ({})),
        outcomeRes.json().catch(() => ({})),
      ]);
      if (detailRes.ok) {
        setPlanDetails(detailPayload?.data || detailPayload);
      } else {
        setPlanDetails(null);
      }
      if (statusRes.ok) {
        setPlanStatus(statusPayload?.data || statusPayload);
      } else {
        setPlanStatus(null);
      }
      if (
        outcomeRes.ok &&
        !outcomePayload?.message?.startsWith("No treatment outcome assessment")
      ) {
        setPlanOutcome(outcomePayload?.data || outcomePayload);
      } else {
        setPlanOutcome(null);
      }
    } catch {
      toast.error("Could not load treatment plan details.");
      setPlanDetails(null);
      setPlanStatus(null);
      setPlanOutcome(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    try {
      const body = {
        patient_ref: createForm.patient_ref,
        plan_name: createForm.plan_name,
        primary_diagnosis: createForm.primary_diagnosis,
        initial_notes: createForm.initial_notes || null,
        short_term_goals: parseJsonArray(
          createForm.short_term_goals,
          "Short term goals",
        ),
        long_term_goals: parseJsonArray(
          createForm.long_term_goals,
          "Long term goals",
        ),
        interventions: parseJsonArray(
          createForm.interventions,
          "Interventions",
        ),
        milestones: parseJsonArray(createForm.milestones, "Milestones"),
      };

      if (!body.patient_ref || !body.plan_name || !body.primary_diagnosis) {
        toast.info(
          "Patient ref, plan name and primary diagnosis are required.",
        );
        return;
      }

      setSubmitLoading(true);
      const response = await createDoctorTreatmentPlan(body);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(doctorAppointmentErrorMessage(payload));
        return;
      }
      toast.success(payload?.message || "Treatment plan created successfully.");
      setShowCreateModal(false);
      await loadPlans();
    } catch (error) {
      toast.error(error.message || "Could not create treatment plan.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleMarkCompleted = async (plan) => {
    const planId = plan?.plan_id || plan?.id;
    if (!planId) return;
    setSubmitLoading(true);
    try {
      const response = await updateDoctorTreatmentPlan(planId, {
        status: "COMPLETED",
        completion_notes: "Completed from doctor dashboard",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(doctorAppointmentErrorMessage(payload));
        return;
      }
      toast.success(payload?.message || "Treatment plan updated successfully.");
      await loadPlans();
      if (
        selectedPlan &&
        (selectedPlan.plan_id || selectedPlan.id) === planId
      ) {
        await handleOpenPlan(plan);
      }
    } catch {
      toast.error("Could not update treatment plan.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSaveProgress = async () => {
    const planId = selectedPlan?.plan_id || selectedPlan?.id;
    if (!planId) return;
    if (!progressForm.progress_note.trim()) {
      toast.info("Progress note is required.");
      return;
    }
    setSubmitLoading(true);
    try {
      const response = await updateDoctorTreatmentPlanProgress(planId, {
        milestone_updates: [],
        goal_updates: [],
        intervention_updates: [],
        progress_note: progressForm.progress_note,
        significant_change: progressForm.significant_change,
        next_review_date: progressForm.next_review_date || null,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(doctorAppointmentErrorMessage(payload));
        return;
      }
      toast.success(payload?.message || "Progress updated successfully.");
      setShowProgressModal(false);
      setProgressForm({
        progress_note: "",
        significant_change: false,
        next_review_date: "",
      });
      await loadPlans();
      await handleOpenPlan(selectedPlan);
    } catch {
      toast.error("Could not update treatment progress.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSaveOutcome = async () => {
    const planId = selectedPlan?.plan_id || selectedPlan?.id;
    if (!planId) return;
    if (!outcomeForm.outcome_date || !outcomeForm.outcome_summary.trim()) {
      toast.info("Outcome date and summary are required.");
      return;
    }
    setSubmitLoading(true);
    try {
      const response = await recordDoctorTreatmentPlanOutcome(planId, {
        ...outcomeForm,
        goals_achieved: Number(outcomeForm.goals_achieved) || 0,
        goals_partially_achieved:
          Number(outcomeForm.goals_partially_achieved) || 0,
        goals_not_achieved: Number(outcomeForm.goals_not_achieved) || 0,
        treatment_adherence: Number(outcomeForm.treatment_adherence) || 0,
        patient_satisfaction_score:
          Number(outcomeForm.patient_satisfaction_score) || 0,
        quality_of_life_score: Number(outcomeForm.quality_of_life_score) || 0,
        complications: parseJsonArray(
          outcomeForm.complications,
          "Complications",
        ),
        future_recommendations: parseJsonArray(
          outcomeForm.future_recommendations,
          "Future recommendations",
        ),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(doctorAppointmentErrorMessage(payload));
        return;
      }
      toast.success(payload?.message || "Outcome recorded successfully.");
      setShowOutcomeModal(false);
      await loadPlans();
      await handleOpenPlan(selectedPlan);
    } catch (error) {
      toast.error(error.message || "Could not record treatment outcome.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleLoadTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const response = await getDoctorTreatmentPlanTemplates({
        diagnosis: templateForm.diagnosis,
        specialty: templateForm.specialty,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(doctorAppointmentErrorMessage(payload));
        setTemplates([]);
        return;
      }
      setTemplates(payload?.templates || payload?.data?.templates || []);
    } catch {
      toast.error("Could not load templates.");
      setTemplates([]);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const handleCreateFromTemplate = async () => {
    if (!templateForm.template_id || !templateForm.patient_ref) {
      toast.info("Template ID and patient ref are required.");
      return;
    }
    setSubmitLoading(true);
    try {
      const response = await createDoctorTreatmentPlanFromTemplate({
        template_id: templateForm.template_id,
        patient_ref: templateForm.patient_ref,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(doctorAppointmentErrorMessage(payload));
        return;
      }
      toast.success(
        payload?.message || "Treatment plan created from template.",
      );
      await loadPlans();
    } catch {
      toast.error("Could not create plan from template.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleLoadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const response = await getDoctorTreatmentPlanAnalytics(analyticsFilters);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(doctorAppointmentErrorMessage(payload));
        setAnalytics(null);
        return;
      }
      setAnalytics(payload?.data || payload);
    } catch {
      toast.error("Could not load treatment analytics.");
      setAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleCleanupDates = async () => {
    setSubmitLoading(true);
    try {
      const response = await cleanupDoctorTreatmentPlanDates();
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(doctorAppointmentErrorMessage(payload));
        return;
      }
      toast.success(payload?.message || "Cleanup completed successfully.");
      await loadPlans();
    } catch {
      toast.error("Could not run cleanup.");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading && plans.length === 0) return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
            Treatment Plan Management
          </h2>
          <p className="text-sm text-gray-500">
            Create, monitor, update outcomes, templates and analytics for
            treatment plans
          </p>
        </div>
        <div className="flex flex-wrap gap-2 ">
          <button
            className="btn-secondary"
            onClick={handleCleanupDates}
            disabled={submitLoading}
            style={{
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "10px 20px",
              cursor: "pointer",
            }}
          >
            Cleanup Invalid Dates
          </button>
          <button
            className="btn-primary"
            onClick={() => setShowCreateModal(true)}
            style={{
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "10px 20px",
              cursor: "pointer",
            }}
          >
            <i className="fas fa-plus mr-2"></i> New Treatment Plan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl p-4 text-white bg-gradient-to-br from-blue-500 to-blue-700">
          <p className="text-xs opacity-90">Total Plans</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-xl p-4 text-white bg-gradient-to-br from-emerald-500 to-emerald-700">
          <p className="text-xs opacity-90">Active Plans</p>
          <p className="text-2xl font-bold">{stats.active}</p>
        </div>
        <div className="rounded-xl p-4 text-white bg-gradient-to-br from-indigo-500 to-indigo-700">
          <p className="text-xs opacity-90">Completed Plans</p>
          <p className="text-2xl font-bold">{stats.completed}</p>
        </div>
        <div className="rounded-xl p-4 text-white bg-gradient-to-br from-purple-500 to-purple-700">
          <p className="text-xs opacity-90">Average Progress</p>
          <p className="text-2xl font-bold">{stats.avgProgress}%</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm text-gray-700 mb-1">Status</label>
            <select
              className="form-input"
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
            >
              {PLAN_STATUS_OPTIONS.map((status) => (
                <option key={status || "ALL"} value={status}>
                  {status || "All"}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-700 mb-1">
              Patient Ref
            </label>
            <input
              className="form-input"
              value={filters.patient_ref}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, patient_ref: e.target.value }))
              }
              placeholder="PT-0001"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Limit</label>
            <input
              className="form-input"
              type="number"
              min="1"
              max="200"
              value={filters.limit}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  limit: Number(e.target.value) || 50,
                }))
              }
            />
          </div>
          <button
            className="btn-primary"
            onClick={loadPlans}
            style={{
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "10px 20px",
              cursor: "pointer",
            }}
          >
            Apply Filters
          </button>
        </div>
        <DataTable
          columns={[
            { key: "plan_id", title: "Plan ID", sortable: false },
            { key: "plan_name", title: "Plan Name", sortable: true },
            { key: "patient_name", title: "Patient", sortable: true },
            { key: "patient_ref", title: "Patient Ref", sortable: true },
            { key: "primary_diagnosis", title: "Diagnosis", sortable: false },
            {
              key: "progress_percentage",
              title: "Progress",
              render: (value) => `${Number(value || 0)}%`,
            },
            {
              key: "status",
              title: "Status",
              render: (value) => (
                <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                  {value || "-"}
                </span>
              ),
            },
            {
              key: "created_date",
              title: "Created",
              render: (value) => formatDate(value),
            },
            {
              key: "actions",
              title: "Actions",
              render: (_, row) => (
                <div className="flex items-center gap-2">
                  <button
                    className="icon-btn text-blue-600"
                    title="View details"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenPlan(row);
                    }}
                  >
                    <i className="fas fa-eye"></i>
                  </button>
                  <button
                    className="icon-btn text-green-600 disabled:opacity-50"
                    title="Mark completed"
                    disabled={
                      String(row?.status || "").toUpperCase() === "COMPLETED" ||
                      submitLoading
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkCompleted(row);
                    }}
                  >
                    <i className="fas fa-check"></i>
                  </button>
                </div>
              ),
            },
          ]}
          data={plans}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Plan Templates
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="form-input"
              placeholder="Filter diagnosis"
              value={templateForm.diagnosis}
              onChange={(e) =>
                setTemplateForm((prev) => ({
                  ...prev,
                  diagnosis: e.target.value,
                }))
              }
            />
            <input
              className="form-input"
              placeholder="Filter specialty"
              value={templateForm.specialty}
              onChange={(e) =>
                setTemplateForm((prev) => ({
                  ...prev,
                  specialty: e.target.value,
                }))
              }
            />
            <input
              className="form-input"
              placeholder="Template ID"
              value={templateForm.template_id}
              onChange={(e) =>
                setTemplateForm((prev) => ({
                  ...prev,
                  template_id: e.target.value,
                }))
              }
            />
            <input
              className="form-input"
              placeholder="Patient Ref for template create"
              value={templateForm.patient_ref}
              onChange={(e) =>
                setTemplateForm((prev) => ({
                  ...prev,
                  patient_ref: e.target.value,
                }))
              }
            />
          </div>
          <div className="flex gap-2">
            <button
              className="btn-secondary"
              onClick={handleLoadTemplates}
              style={{
                backgroundColor: "#D3D3D3",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "10px 20px",
                cursor: "pointer",
              }}
            >
              {templatesLoading ? "Loading..." : "Load Templates"}
            </button>
            <button
              className="btn-primary"
              onClick={handleCreateFromTemplate}
              disabled={submitLoading}
              style={{
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "10px 20px",
                cursor: "pointer",
              }}
            >
              Create From Template
            </button>
          </div>
          <div className="max-h-64 overflow-auto border rounded-lg divide-y">
            {templates.length === 0 ? (
              <p className="text-sm text-gray-500 p-3">No templates loaded.</p>
            ) : (
              templates.map((item) => (
                <div key={item.template_id} className="p-3">
                  <p className="font-semibold text-sm">{item.template_name}</p>
                  <p className="text-xs text-gray-500">
                    {item.template_id} | {item.specialty}
                  </p>
                  <p className="text-sm mt-1 text-gray-700">
                    {item.description}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5 space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Treatment Analytics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="form-input"
              type="date"
              value={analyticsFilters.date_from}
              onChange={(e) =>
                setAnalyticsFilters((prev) => ({
                  ...prev,
                  date_from: e.target.value,
                }))
              }
            />
            <input
              className="form-input"
              type="date"
              value={analyticsFilters.date_to}
              onChange={(e) =>
                setAnalyticsFilters((prev) => ({
                  ...prev,
                  date_to: e.target.value,
                }))
              }
            />
          </div>
          <button
            className="btn-primary"
            onClick={handleLoadAnalytics}
            style={{
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "10px 20px",
              cursor: "pointer",
            }}
          >
            {analyticsLoading ? "Loading..." : "Load Analytics"}
          </button>
          <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
            <p>
              <strong>Doctor:</strong> {analytics?.doctor_name || "-"}
            </p>
            <p>
              <strong>Period:</strong> {analytics?.analysis_period || "-"}
            </p>
            <p>
              <strong>Total Plans:</strong>{" "}
              {analytics?.summary_statistics?.total_plans ?? "-"}
            </p>
            <p>
              <strong>Success Rate:</strong>{" "}
              {analytics?.summary_statistics?.success_rate ?? "-"}%
            </p>
            <p>
              <strong>Avg Completion:</strong>{" "}
              {analytics?.summary_statistics?.average_completion_time_days ??
                "-"}{" "}
              days
            </p>
          </div>
        </div>
      </div>

      <Modal
        isOpen={Boolean(selectedPlan)}
        onClose={() => {
          setSelectedPlan(null);
          setPlanDetails(null);
          setPlanStatus(null);
          setPlanOutcome(null);
        }}
        title={`Treatment Plan Details - ${selectedPlan?.plan_name || ""}`}
        size="xl"
      >
        {detailLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-4">
                <p>
                  <strong>Plan ID:</strong>{" "}
                  {planDetails?.plan_id || selectedPlan?.plan_id || "-"}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  {planDetails?.status || selectedPlan?.status || "-"}
                </p>
                <p>
                  <strong>Patient:</strong>{" "}
                  {planDetails?.patient_name ||
                    selectedPlan?.patient_name ||
                    "-"}
                </p>
                <p>
                  <strong>Patient Ref:</strong>{" "}
                  {planDetails?.patient_ref || selectedPlan?.patient_ref || "-"}
                </p>
                <p>
                  <strong>Primary Diagnosis:</strong>{" "}
                  {planDetails?.primary_diagnosis ||
                    selectedPlan?.primary_diagnosis ||
                    "-"}
                </p>
                <p>
                  <strong>Progress:</strong>{" "}
                  {planDetails?.progress_percentage ??
                    selectedPlan?.progress_percentage ??
                    0}
                  %
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p>
                  <strong>Total Goals:</strong> {planStatus?.total_goals ?? "-"}
                </p>
                <p>
                  <strong>Total Milestones:</strong>{" "}
                  {planStatus?.total_milestones ?? "-"}
                </p>
                <p>
                  <strong>Progress Notes:</strong>{" "}
                  {planStatus?.total_progress_notes ?? "-"}
                </p>
                <p>
                  <strong>Has Outcome:</strong>{" "}
                  {planStatus?.has_outcome_assessment ? "Yes" : "No"}
                </p>
                <p>
                  <strong>Outcome Date:</strong>{" "}
                  {planStatus?.outcome_assessment_date || "-"}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-base font-semibold text-gray-800 mb-2">
                Goals & Milestones
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="border rounded-lg p-3">
                  <p className="font-medium mb-2">Short-Term Goals</p>
                  <ul className="list-disc pl-5">
                    {(planDetails?.short_term_goals || [])
                      .slice(0, 5)
                      .map((goal) => (
                        <li key={goal.goal_id || goal.description}>
                          {goal.description || "-"}
                        </li>
                      ))}
                  </ul>
                </div>
                <div className="border rounded-lg p-3">
                  <p className="font-medium mb-2">Milestones</p>
                  <ul className="list-disc pl-5">
                    {(planDetails?.milestones || []).slice(0, 5).map((item) => (
                      <li key={item.milestone_id || item.title}>
                        {item.title || "-"} ({item.status || "PENDING"})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-sm">
              <h4 className="text-base font-semibold text-gray-800 mb-2">
                Outcome Summary
              </h4>
              {planOutcome ? (
                <div className="space-y-1">
                  <p>
                    <strong>Overall Outcome:</strong>{" "}
                    {planOutcome?.overall_outcome || "-"}
                  </p>
                  <p>
                    <strong>Clinical Effectiveness:</strong>{" "}
                    {planOutcome?.clinical_effectiveness || "-"}
                  </p>
                  <p>
                    <strong>Patient Satisfaction:</strong>{" "}
                    {planOutcome?.patient_satisfaction_score ?? "-"}
                  </p>
                  <p>
                    <strong>Summary:</strong>{" "}
                    {planOutcome?.outcome_summary || "-"}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500">
                  No outcome assessment recorded yet.
                </p>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <button
                className="btn-secondary"
                onClick={() => setShowProgressModal(true)}
              >
                Update Progress
              </button>
              <button
                className="btn-secondary"
                onClick={() => setShowOutcomeModal(true)}
              >
                Record Outcome
              </button>
              <button
                className="btn-primary"
                onClick={() => handleMarkCompleted(selectedPlan)}
                disabled={submitLoading}
              >
                Mark Completed
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Treatment Plan"
        size="xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="form-input"
              placeholder="Patient Ref *"
              value={createForm.patient_ref}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  patient_ref: e.target.value,
                }))
              }
            />
            <input
              className="form-input"
              placeholder="Plan Name *"
              value={createForm.plan_name}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  plan_name: e.target.value,
                }))
              }
            />
            <input
              className="form-input md:col-span-2"
              placeholder="Primary Diagnosis *"
              value={createForm.primary_diagnosis}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  primary_diagnosis: e.target.value,
                }))
              }
            />
          </div>
          <textarea
            className="form-input"
            rows={2}
            placeholder="Initial notes"
            value={createForm.initial_notes}
            onChange={(e) =>
              setCreateForm((prev) => ({
                ...prev,
                initial_notes: e.target.value,
              }))
            }
          />
          <textarea
            className="form-input"
            rows={3}
            placeholder='Short term goals JSON array, e.g. [{"description":"Pain control","target_date":"2026-05-01"}]'
            value={createForm.short_term_goals}
            onChange={(e) =>
              setCreateForm((prev) => ({
                ...prev,
                short_term_goals: e.target.value,
              }))
            }
          />
          <textarea
            className="form-input"
            rows={3}
            placeholder="Long term goals JSON array"
            value={createForm.long_term_goals}
            onChange={(e) =>
              setCreateForm((prev) => ({
                ...prev,
                long_term_goals: e.target.value,
              }))
            }
          />
          <textarea
            className="form-input"
            rows={3}
            placeholder="Interventions JSON array"
            value={createForm.interventions}
            onChange={(e) =>
              setCreateForm((prev) => ({
                ...prev,
                interventions: e.target.value,
              }))
            }
          />
          <textarea
            className="form-input"
            rows={3}
            placeholder="Milestones JSON array"
            value={createForm.milestones}
            onChange={(e) =>
              setCreateForm((prev) => ({ ...prev, milestones: e.target.value }))
            }
          />
          <div className="flex justify-end gap-2">
            <button
              className="btn-secondary"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handleCreatePlan}
              disabled={submitLoading}
            >
              {submitLoading ? "Creating..." : "Create Plan"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        title="Update Treatment Progress"
        size="lg"
      >
        <div className="space-y-4">
          <textarea
            className="form-input"
            rows={4}
            placeholder="Progress note"
            value={progressForm.progress_note}
            onChange={(e) =>
              setProgressForm((prev) => ({
                ...prev,
                progress_note: e.target.value,
              }))
            }
          />
          <input
            className="form-input"
            type="date"
            value={progressForm.next_review_date}
            onChange={(e) =>
              setProgressForm((prev) => ({
                ...prev,
                next_review_date: e.target.value,
              }))
            }
          />
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={progressForm.significant_change}
              onChange={(e) =>
                setProgressForm((prev) => ({
                  ...prev,
                  significant_change: e.target.checked,
                }))
              }
            />
            Significant change
          </label>
          <div className="flex justify-end gap-2">
            <button
              className="btn-secondary"
              onClick={() => setShowProgressModal(false)}
            >
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handleSaveProgress}
              disabled={submitLoading}
            >
              {submitLoading ? "Saving..." : "Save Progress"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showOutcomeModal}
        onClose={() => setShowOutcomeModal(false)}
        title="Record Treatment Outcome"
        size="xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="form-input"
              type="date"
              value={outcomeForm.outcome_date}
              onChange={(e) =>
                setOutcomeForm((prev) => ({
                  ...prev,
                  outcome_date: e.target.value,
                }))
              }
            />
            <select
              className="form-input"
              value={outcomeForm.overall_outcome}
              onChange={(e) =>
                setOutcomeForm((prev) => ({
                  ...prev,
                  overall_outcome: e.target.value,
                }))
              }
            >
              <option value="EXCELLENT">EXCELLENT</option>
              <option value="GOOD">GOOD</option>
              <option value="FAIR">FAIR</option>
              <option value="POOR">POOR</option>
              <option value="UNKNOWN">UNKNOWN</option>
            </select>
            <input
              className="form-input"
              type="number"
              min="0"
              placeholder="Goals achieved"
              value={outcomeForm.goals_achieved}
              onChange={(e) =>
                setOutcomeForm((prev) => ({
                  ...prev,
                  goals_achieved: e.target.value,
                }))
              }
            />
            <input
              className="form-input"
              type="number"
              min="0"
              placeholder="Goals partially achieved"
              value={outcomeForm.goals_partially_achieved}
              onChange={(e) =>
                setOutcomeForm((prev) => ({
                  ...prev,
                  goals_partially_achieved: e.target.value,
                }))
              }
            />
            <input
              className="form-input"
              type="number"
              min="0"
              placeholder="Goals not achieved"
              value={outcomeForm.goals_not_achieved}
              onChange={(e) =>
                setOutcomeForm((prev) => ({
                  ...prev,
                  goals_not_achieved: e.target.value,
                }))
              }
            />
            <input
              className="form-input"
              type="number"
              min="0"
              step="0.1"
              placeholder="Treatment adherence"
              value={outcomeForm.treatment_adherence}
              onChange={(e) =>
                setOutcomeForm((prev) => ({
                  ...prev,
                  treatment_adherence: e.target.value,
                }))
              }
            />
          </div>
          <textarea
            className="form-input"
            rows={3}
            placeholder="Outcome summary *"
            value={outcomeForm.outcome_summary}
            onChange={(e) =>
              setOutcomeForm((prev) => ({
                ...prev,
                outcome_summary: e.target.value,
              }))
            }
          />
          <textarea
            className="form-input"
            rows={2}
            placeholder='Complications JSON array, e.g. ["none"]'
            value={outcomeForm.complications}
            onChange={(e) =>
              setOutcomeForm((prev) => ({
                ...prev,
                complications: e.target.value,
              }))
            }
          />
          <textarea
            className="form-input"
            rows={2}
            placeholder="Future recommendations JSON array"
            value={outcomeForm.future_recommendations}
            onChange={(e) =>
              setOutcomeForm((prev) => ({
                ...prev,
                future_recommendations: e.target.value,
              }))
            }
          />
          <input
            className="form-input"
            placeholder="Follow-up plan"
            value={outcomeForm.follow_up_plan}
            onChange={(e) =>
              setOutcomeForm((prev) => ({
                ...prev,
                follow_up_plan: e.target.value,
              }))
            }
          />
          <textarea
            className="form-input"
            rows={2}
            placeholder="Lessons learned"
            value={outcomeForm.lessons_learned}
            onChange={(e) =>
              setOutcomeForm((prev) => ({
                ...prev,
                lessons_learned: e.target.value,
              }))
            }
          />
          <div className="flex justify-end gap-2">
            <button
              className="btn-secondary"
              onClick={() => setShowOutcomeModal(false)}
            >
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handleSaveOutcome}
              disabled={submitLoading}
            >
              {submitLoading ? "Saving..." : "Record Outcome"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TreatmentPlans;
