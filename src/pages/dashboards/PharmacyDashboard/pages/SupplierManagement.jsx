import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Users,
  Clock,
  IndianRupee,
  Truck,
  Plus,
  Pencil,
  Eye,
  Trash2,
  Loader2,
  Check,
  Building2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Star,
  FileText
} from "lucide-react";
import Modal from "../../../../components/common/Modal/Modal";
import { 
  getSuppliers, 
  createSupplier, 
  updateSupplier, 
  deleteSupplier, 
  getDashboardOverview 
} from "../../../../services/pharmacyApi";

const emptyForm = {
  name: "",
  contact_person: "",
  phone: "",
  email: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
  gstin: "",
  drug_license_no: "",
  payment_terms: "NET_30",
  credit_limit: 0,
  rating: 0,
  notes: ""
};

const PAYMENT_TERMS = [
  { value: "IMMEDIATE", label: "Immediate" },
  { value: "NET_15", label: "Net 15 Days" },
  { value: "NET_30", label: "Net 30 Days" },
  { value: "NET_60", label: "Net 60 Days" }
];

export default function SupplierManagement() {
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState("add"); // add | view | edit
  const [selectedId, setSelectedId] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const [formData, setFormData] = useState(emptyForm);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    fetchSuppliers();
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const data = await getDashboardOverview();
      setDashboardData(data);
    } catch (error) {
      console.error("Failed to fetch dashboard stats", error);
    }
  };

  const fetchSuppliers = async () => {
    setIsLoading(true);
    try {
      const data = await getSuppliers();
      console.log("[SupplierManagement] Raw API response:", data);
      
      // Robust array extraction
      let items = [];
      if (Array.isArray(data)) {
        items = data;
      } else if (data) {
        items = data.suppliers || data.items || data.data || [];
      }
      
      // Normalize data if necessary (e.g. backend using supplier_name instead of name)
      const normalized = items.map(s => ({
        ...s,
        id: s.id || s._id,
        name: s.name || s.supplier_name || "Unknown Vendor",
        contact_person: s.contact_person || s.contact || "N/A"
      }));
      
      const filtered = normalized.filter(s => 
        !s.is_deleted && 
        s.status !== 'Deleted' && 
        s.status !== 'Archived'
      );
      
      setSuppliers(filtered);
    } catch (error) {
      console.error("[SupplierManagement] Fetch error:", error);
      toast.error(error.message || "Failed to fetch suppliers");
    } finally {
      setIsLoading(false);
    }
  };

  const buildPayload = (data) => {
    const s = (v) => (v && String(v).trim() !== "" ? String(v).trim() : null);
    const n = (v, def = 0) => {
      const val = parseFloat(v);
      return isNaN(val) ? def : val;
    };

    return {
      name: (data.name || "").trim(),
      contact_person: (data.contact_person || "").trim(),
      phone: (data.phone || "").trim(),
      email: (data.email || "").trim(),
      address_line1: s(data.address_line1),
      address_line2: s(data.address_line2),
      city: s(data.city),
      state: s(data.state),
      pincode: s(data.pincode),
      country: data.country || "India",
      gstin: s(data.gstin),
      drug_license_no: s(data.drug_license_no),
      payment_terms: data.payment_terms || "NET_30",
      credit_limit: n(data.credit_limit),
      rating: n(data.rating),
      notes: s(data.notes)
    };
  };

  const handleOpenModal = (mode, sup = null) => {
    setMode(mode);
    if (sup) {
      setSelectedId(sup.id || sup._id);
      setFormData({
        name: sup.name || "",
        contact_person: sup.contact_person || "",
        phone: sup.phone || "",
        email: sup.email || "",
        address_line1: sup.address_line1 || "",
        address_line2: sup.address_line2 || "",
        city: sup.city || "",
        state: sup.state || "",
        pincode: sup.pincode || "",
        country: sup.country || "India",
        gstin: sup.gstin || "",
        drug_license_no: sup.drug_license_no || "",
        payment_terms: sup.payment_terms || "NET_30",
        credit_limit: sup.credit_limit || 0,
        rating: sup.rating || 0,
        notes: sup.notes || ""
      });
    } else {
      setSelectedId(null);
      setFormData(emptyForm);
    }
    setIsModalOpen(true);
  };

  const handleSaveSupplier = async () => {
    if (!formData.name || !formData.contact_person || !formData.phone || !formData.email) {
      toast.error("Name, Contact Person, Phone, and Email are required");
      return;
    }

    const payload = buildPayload(formData);
    console.log("[SupplierManagement] Action:", mode, "ID:", selectedId, "Payload:", payload);
    
    if (mode === "edit" && !selectedId) {
      toast.error("No supplier selected for update");
      return;
    }

    setIsActionLoading(true);
    try {
      if (mode === "edit") {
        await updateSupplier(selectedId, payload);
        toast.success("Supplier updated");
      } else {
        await createSupplier(payload);
        toast.success("Supplier added successfully");
      }
      setIsModalOpen(false);
      fetchSuppliers();
    } catch (error) {
      toast.error(error.message || "Failed to save supplier");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteSupplier = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await deleteSupplier(id);
      toast.success("Supplier deleted");
      fetchSuppliers();
    } catch (error) {
      toast.error(error.message || "Failed to delete supplier");
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
  };

  const inputCls = "w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50 transition-all";
  const labelCls = "text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5";

  return (
    <div className="bg-slate-50 min-h-screen space-y-6 px-3 sm:px-6 py-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Supplier Management</h1>
          <p className="text-slate-500 text-sm">Manage pharmacy vendors and procurement channels</p>
        </div>

        <button
          onClick={() => handleOpenModal("add")}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95 font-bold"
        >
          <Plus size={20} />
          Add New Supplier
        </button>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SupplierStat
          title="Total Suppliers"
          value={suppliers.length}
          percent="+12%"
          icon={Users}
          iconBg="bg-indigo-500"
          gradient="from-indigo-50"
        />
        <SupplierStat
          title="Active Contracts"
          value={suppliers.filter(s => !s.is_deleted && s.status !== 'Inactive' && s.status !== 'Deleted' && s.status !== 'Archived').length}
          percent="+5%"
          icon={Check}
          iconBg="bg-green-500"
          gradient="from-green-50"
        />
        <SupplierStat
          title="Pending Deliveries"
          value={dashboardData?.pending_deliveries || "0"}
          percent="-2%"
          icon={Truck}
          iconBg="bg-orange-500"
          gradient="from-orange-50"
          danger
        />
        <SupplierStat
          title="Total Payables"
          value={`₹${dashboardData?.total_payables || "0"}`}
          percent="+8%"
          icon={IndianRupee}
          iconBg="bg-blue-500"
          gradient="from-blue-50"
        />
      </div>

      {/* SUPPLIERS TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b">
              <tr>
                <th className="px-6 py-4">Supplier & Contact</th>
                <th className="px-6 py-4">Phone & Email</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Financials</th>
                <th className="px-6 py-4 text-center">Rating</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <Loader2 className="animate-spin" size={32} />
                      <p className="font-medium">Loading suppliers...</p>
                    </div>
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center text-slate-500 italic">
                    No suppliers found.
                  </td>
                </tr>
              ) : (
                suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                          <Building2 size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{s.name}</p>
                          <p className="text-xs text-slate-500">{s.contact_person}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone size={12} className="text-slate-400" />
                          <span>{s.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Mail size={12} className="text-slate-400" />
                          <span className="text-xs">{s.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-slate-400" />
                        <span>{s.city || 'N/A'}, {s.state || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-700">Limit: ₹{s.credit_limit || 0}</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">{s.payment_terms}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1 text-amber-500 font-bold">
                        <Star size={14} fill="currentColor" />
                        <span>{s.rating || '0'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => handleOpenModal("view", s)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Eye size={16} /></button>
                        <button onClick={() => handleOpenModal("edit", s)} className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-all"><Pencil size={16} /></button>
                        <button onClick={() => handleDeleteSupplier(s.id, s.name)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MULTI-SECTION MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={mode === "view" ? "Supplier Overview" : mode === "edit" ? "Modify Supplier" : "Register New Supplier"}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-8 max-h-[70vh] overflow-y-auto px-1 pr-3 custom-scrollbar">
          {/* Section 1: Basic Info */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><Building2 size={16} /></div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">General Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className={labelCls}>Supplier Name *</label>
                <input name="name" value={formData.name} onChange={handleFormChange} disabled={mode === "view"} placeholder="Company Name" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Contact Person *</label>
                <input name="contact_person" value={formData.contact_person} onChange={handleFormChange} disabled={mode === "view"} placeholder="Person Name" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Phone Number *</label>
                <input name="phone" value={formData.phone} onChange={handleFormChange} disabled={mode === "view"} placeholder="+91 XXXXX XXXXX" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Email Address *</label>
                <input name="email" value={formData.email} onChange={handleFormChange} disabled={mode === "view"} placeholder="vendor@example.com" className={inputCls} />
              </div>
            </div>
          </section>

          {/* Section 2: Address */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><MapPin size={16} /></div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Address Details</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2 space-y-1.5">
                <label className={labelCls}>Address Line 1</label>
                <input name="address_line1" value={formData.address_line1} onChange={handleFormChange} disabled={mode === "view"} className={inputCls} />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className={labelCls}>Address Line 2</label>
                <input name="address_line2" value={formData.address_line2} onChange={handleFormChange} disabled={mode === "view"} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-5 md:col-span-2">
                <div className="space-y-1.5">
                  <label className={labelCls}>City</label>
                  <input name="city" value={formData.city} onChange={handleFormChange} disabled={mode === "view"} className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>State</label>
                  <input name="state" value={formData.state} onChange={handleFormChange} disabled={mode === "view"} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5 md:col-span-2">
                <div className="space-y-1.5">
                  <label className={labelCls}>Pincode</label>
                  <input name="pincode" value={formData.pincode} onChange={handleFormChange} disabled={mode === "view"} className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Country</label>
                  <input name="country" value={formData.country} onChange={handleFormChange} disabled={mode === "view"} className={inputCls} />
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Legal & Financial */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><CreditCard size={16} /></div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Legal & Financials</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className={labelCls}>GSTIN</label>
                <input name="gstin" value={formData.gstin} onChange={handleFormChange} disabled={mode === "view"} placeholder="GST Number" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Drug License No</label>
                <input name="drug_license_no" value={formData.drug_license_no} onChange={handleFormChange} disabled={mode === "view"} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Payment Terms</label>
                <select name="payment_terms" value={formData.payment_terms} onChange={handleFormChange} disabled={mode === "view"} className={inputCls + " bg-white"}>
                  {PAYMENT_TERMS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Credit Limit (₹)</label>
                <input type="number" name="credit_limit" value={formData.credit_limit} onChange={handleFormChange} disabled={mode === "view"} className={inputCls} />
              </div>
            </div>
          </section>

          {/* Section 4: Notes & Rating */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><FileText size={16} /></div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Additional Details</h3>
            </div>
            <div className="grid grid-cols-1 gap-5">
              <div className="space-y-1.5">
                <label className={labelCls}>Vendor Rating (0-5)</label>
                <div className="flex items-center gap-4">
                  <input type="range" name="rating" min="0" max="5" step="0.5" value={formData.rating} onChange={handleFormChange} disabled={mode === "view"} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                  <span className="text-sm font-bold text-slate-700 w-8">{formData.rating}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Internal Notes</label>
                <textarea name="notes" rows={3} value={formData.notes} onChange={handleFormChange} disabled={mode === "view"} placeholder="Internal comments or history..." className={inputCls} />
              </div>
            </div>
          </section>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-3 pt-6 mt-6 border-t">
          <button
            onClick={() => setIsModalOpen(false)}
            className="px-6 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-all"
          >
            Cancel
          </button>
          {mode !== "view" && (
            <button
              onClick={handleSaveSupplier}
              disabled={isActionLoading}
              className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {isActionLoading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              {mode === "add" ? "Register Supplier" : "Update Records"}
            </button>
          )}
        </div>
      </Modal>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}} />
    </div>
  );
}

const SupplierStat = ({
  title,
  value,
  percent,
  icon: Icon,
  iconBg,
  gradient,
  danger,
}) => (
  <div className="relative bg-white rounded-2xl p-6 border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all">
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} to-transparent opacity-40 pointer-events-none`} />
    <div className="relative flex justify-between items-start">
      <div>
        <div className={`w-12 h-12 flex items-center justify-center rounded-2xl ${iconBg} text-white shadow-lg mb-4`}>
          <Icon size={24} />
        </div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <p className="text-2xl font-black text-slate-800">{value}</p>
      </div>
      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${danger ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
        {percent}
      </span>
    </div>
  </div>
);
