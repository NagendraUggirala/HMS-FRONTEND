import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Switch from "react-switch";
import * as pharmacyApi from "../../../../services/pharmacyApi";
import { Loader2, Save, Building, Bell, User as UserIcon, Activity } from "lucide-react";

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [general, setGeneral] = useState({
    pharmacy_name: "",
    pharmacy_address: "",
    phone: "",
    email: "",
  });

  const [notifications, setNotifications] = useState({
    low_stock_alerts: true,
    expiry_alerts: true,
    purchase_order_updates: true,
    sales_reports_email: false,
  });

  const [dashboardData, setDashboardData] = useState(null);
  const [userInfo, setUserInfo] = useState({
    name: "Staff Member",
    role: "Pharmacist",
    email: "",
    phone: ""
  });

  useEffect(() => {
    fetchSettings();
    loadUserInfo();
  }, []);

  const loadUserInfo = () => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const user = JSON.parse(raw);
        setUserInfo({
          name: user.full_name || user.name || "Staff Member",
          role: user.role || "Pharmacist",
          email: user.email || "",
          phone: user.phone || ""
        });
      }
    } catch (err) {
      console.error("Failed to load user info", err);
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      console.log("[Settings] Fetching pharmacy configuration...");
      
      // Fetch settings
      try {
        const settings = await pharmacyApi.getPharmacySettings();
        console.log("[Settings] API Response:", settings);
        if (settings?.general) setGeneral(settings.general);
        if (settings?.notifications) setNotifications(settings.notifications);
      } catch (err) {
        console.error("[Settings] Failed to load settings:", err);
      }

      // Fetch dashboard metrics separately so one failure doesn't block the other
      try {
        const [metricsRes, suppliersRes, medicinesRes, poRes] = await Promise.allSettled([
          pharmacyApi.getDashboardOverview(),
          pharmacyApi.getSuppliers(),
          pharmacyApi.getMedicines(0, 1000),
          pharmacyApi.getPurchaseOrders()
        ]);
        
        let overview = {};
        if (metricsRes.status === 'fulfilled') {
          overview = metricsRes.value?.data || metricsRes.value || {};
        }

        let activeSuppliersCount = 0;
        if (suppliersRes.status === 'fulfilled') {
          const suppliersList = suppliersRes.value?.suppliers || suppliersRes.value?.items || suppliersRes.value?.data || (Array.isArray(suppliersRes.value) ? suppliersRes.value : []) || [];
          activeSuppliersCount = suppliersList.filter(s => 
            s && !s.is_deleted && s.status !== 'Inactive' && s.status !== 'Deleted' && s.status !== 'Archived'
          ).length;
        }

        let totalMedicinesCount = 0;
        if (medicinesRes.status === 'fulfilled') {
          const medList = medicinesRes.value?.medicines || medicinesRes.value?.items || (Array.isArray(medicinesRes.value) ? medicinesRes.value : []) || [];
          totalMedicinesCount = medList.length;
        }

        let pendingPoCount = 0;
        if (poRes.status === 'fulfilled') {
          const poList = poRes.value?.purchase_orders || poRes.value?.items || (Array.isArray(poRes.value) ? poRes.value : []) || [];
          pendingPoCount = poList.filter(po => po.status === 'PENDING' || po.status === 'DRAFT').length;
        }

        setDashboardData({
          ...overview,
          active_suppliers_count: activeSuppliersCount,
          medicines_count: totalMedicinesCount || overview.medicines_count || overview.total_medicines,
          pending_purchase_orders_count: pendingPoCount
        });
      } catch (err) {
        console.error("[Settings] Failed to load dashboard metrics:", err);
      }

    } catch (err) {
      console.error("[Settings] Critical load failure:", err);
      toast.error("Failed to load settings configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneralChange = (e) => {
    const { name, value } = e.target;
    setGeneral(prev => ({ ...prev, [name]: value }));
  };

  const toggleNotification = (key) => {
    setNotifications(prev => {
      const newVal = !prev[key];
      const labels = {
        low_stock_alerts: "Low stock alerts",
        expiry_alerts: "Expiry alerts",
        purchase_order_updates: "Purchase order notifications",
        sales_reports_email: "Sales reports",
      };
      toast.info(`${labels[key]} ${newVal ? "enabled" : "disabled"}`);
      return { ...prev, [key]: newVal };
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await pharmacyApi.updatePharmacySettings({
        general,
        notifications
      });
      toast.success("Settings updated successfully");
    } catch (err) {
      console.error("Failed to save settings", err);
      toast.error(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
        <p className="text-slate-500 animate-pulse">Loading pharmacy configuration...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen space-y-6 px-4 sm:px-8 py-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Pharmacy Settings</h1>
          <p className="text-slate-500 mt-1">
            Manage your pharmacy profile and system preferences
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-md hover:shadow-indigo-200 disabled:opacity-50 font-semibold"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: GENERAL & NOTIFICATIONS */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* GENERAL SETTINGS */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                <Building className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-slate-800 text-lg">General Settings</h2>
            </div>
            <div className="p-6 space-y-5">
              <Input 
                label="Pharmacy Name" 
                name="pharmacy_name"
                value={general.pharmacy_name} 
                onChange={handleGeneralChange}
                placeholder="e.g. Apollo Pharmacy"
              />
              <Textarea
                label="Pharmacy Address"
                name="pharmacy_address"
                value={general.pharmacy_address}
                onChange={handleGeneralChange}
                placeholder="Full operational address"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input 
                  label="Official Phone" 
                  name="phone"
                  value={general.phone} 
                  onChange={handleGeneralChange}
                  placeholder="+91 XXXXX XXXXX"
                />
                <Input
                  label="Official Email"
                  name="email"
                  value={general.email}
                  onChange={handleGeneralChange}
                  placeholder="pharmacy@hospital.com"
                />
              </div>
            </div>
          </div>

          {/* NOTIFICATION SETTINGS */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                <Bell className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-slate-800 text-lg">Notification Preferences</h2>
            </div>
            <div className="p-6 divide-y divide-slate-100">
              <ToggleSwitch
                title="Low Stock Alerts"
                desc="Automated alerts when inventory falls below reorder levels"
                enabled={notifications.low_stock_alerts}
                onChange={() => toggleNotification("low_stock_alerts")}
              />
              <ToggleSwitch
                title="Expiry Alerts"
                desc="Proactive warnings for batches approaching expiration date"
                enabled={notifications.expiry_alerts}
                onChange={() => toggleNotification("expiry_alerts")}
              />
              <ToggleSwitch
                title="Purchase Order Updates"
                desc="Notifications for PO approvals, shipments, and GRN completions"
                enabled={notifications.purchase_order_updates}
                onChange={() => toggleNotification("purchase_order_updates")}
              />
              <ToggleSwitch
                title="Daily Sales Summary"
                desc="Detailed end-of-day revenue reports sent to official email"
                enabled={notifications.sales_reports_email}
                onChange={() => toggleNotification("sales_reports_email")}
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PROFILE & STATS */}
        <div className="space-y-8">
          {/* USER PROFILE */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-indigo-500"></div>
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center mx-auto text-2xl font-bold shadow-lg ring-4 ring-white">
              {userInfo.name.split(" ").map(n => n[0]).join("").toUpperCase()}
            </div>
            <h3 className="font-bold text-slate-800 mt-4 text-xl">{userInfo.name}</h3>
            <div className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-wider mt-1 mb-6">
              {userInfo.role}
            </div>
            
            <div className="space-y-4 text-left">
              <div className="flex items-center gap-3 text-slate-600 text-sm">
                <UserIcon className="w-4 h-4 text-slate-400" />
                <span>{userInfo.name}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 text-sm">
                <Bell className="w-4 h-4 text-slate-400" />
                <span>{userInfo.email || "No email set"}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 text-sm">
                <Activity className="w-4 h-4 text-slate-400" />
                <span>{userInfo.phone || "No phone set"}</span>
              </div>
            </div>
          </div>

          {/* SUPPLY CHAIN STATS (Static for now, but stylized) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" />
              Supply Chain Metrics
            </h2>
            <div className="space-y-3">
              <InfoRow label="Active Suppliers" value={dashboardData?.active_suppliers_count || dashboardData?.active_suppliers || dashboardData?.total_suppliers_count || dashboardData?.total_suppliers || dashboardData?.suppliers_count || "0"} />
              <InfoRow label="Low Stock Items" value={dashboardData?.low_stock_count || dashboardData?.low_stock_items || "0"} />
              <InfoRow label="Total Medicines" value={dashboardData?.medicines_count || dashboardData?.total_medicines || "0"} />
              <InfoRow label="Pending Purchase Orders" value={dashboardData?.pending_purchase_orders_count || "0"} />
            </div>

            <div className="mt-6 pt-4 border-t border-slate-50">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">System Information</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">API Status</span>
                  <span className="text-emerald-500 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    Live
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Last Sync</span>
                  <span className="text-slate-800 font-medium">Just now</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= REUSABLE COMPONENTS ================= */

const Input = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">{label}</label>
    <input
      {...props}
      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 placeholder:text-slate-400"
    />
  </div>
);

const Textarea = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">{label}</label>
    <textarea
      {...props}
      rows={3}
      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 placeholder:text-slate-400"
    />
  </div>
);

const ToggleSwitch = ({ title, desc, enabled, onChange }) => (
  <div className="flex justify-between items-center py-5 group">
    <div className="pr-6">
      <p className="font-bold text-slate-800 text-base group-hover:text-indigo-600 transition-colors">{title}</p>
      <p className="text-sm text-slate-500 mt-0.5">{desc}</p>
    </div>

    <Switch
      onChange={onChange}
      checked={enabled}
      height={26}
      width={52}
      handleDiameter={20}
      uncheckedIcon={false}
      checkedIcon={false}
      onColor="#4f46e5" // indigo-600
      offColor="#e2e8f0" // slate-200
      activeBoxShadow="0 0 2px 3px #c7d2fe" // indigo-200
      className="react-switch"
    />
  </div>
);

const InfoRow = ({ label, value, color = "text-slate-800" }) => (
  <div className="flex justify-between items-center py-2.5 border-b border-slate-50 last:border-none">
    <span className="text-slate-500 text-sm">{label}</span>
    <span className={`font-bold ${color}`}>{value}</span>
  </div>
);