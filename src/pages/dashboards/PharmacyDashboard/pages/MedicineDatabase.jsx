import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  Search,
  Pill,
  Loader2,
  X,
  Check,
  AlertCircle
} from "lucide-react";
import Modal from "../../../../components/common/Modal/Modal";
import {
  getMedicines,
  getMedicine,
  createMedicine,
  updateMedicine,
  deleteMedicine
} from "../../../../services/pharmacyApi";

export default function MedicineDatabase() {
  const [medicines, setMedicines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState("view"); // add | view | edit
  const [selectedId, setSelectedId] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    generic_name: "",
    brand_name: "",
    dosage_form: "Tablet",
    strength: "",
    manufacturer: "",
    category: "",
    drug_class: "",
    route: "",
    composition: "",
    pack_size: "",
    reorder_level: 10,
    barcode: "",
    hsn_code: "",
    sku: "",
    requires_prescription: false,
    is_controlled_substance: false,
    description: "",
    storage_instructions: ""
  });

  useEffect(() => {
    fetchMedicines();
  }, [category]);

  const fetchMedicines = async () => {
    setIsLoading(true);
    try {
      const data = await getMedicines(0, 100, search, category);
      const items = data.medicines || data.items || data.data || [];
      const normalized = items.map(m => ({
        ...m,
        id: m.id || m._id
      }));
      setMedicines(normalized);
    } catch (error) {
      toast.error("Failed to load medicine database");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      fetchMedicines();
    }
  };

  const handleOpenModal = async (mode, id = null) => {
    setMode(mode);
    setSelectedId(id);
    if (id && (mode === 'view' || mode === 'edit')) {
      setIsActionLoading(true);
      try {
        const data = await getMedicine(id);
        const med = data.medicine || data;
        setFormData({
          generic_name: med.generic_name || "",
          brand_name: med.brand_name || "",
          dosage_form: med.dosage_form || "Tablet",
          strength: med.strength || "",
          manufacturer: med.manufacturer || "",
          category: med.category || "",
          drug_class: med.drug_class || "",
          route: med.route || "",
          composition: med.composition || "",
          pack_size: med.pack_size ?? "",
          reorder_level: med.reorder_level ?? 10,
          barcode: med.barcode || "",
          hsn_code: med.hsn_code || "",
          sku: med.sku || "",
          requires_prescription: med.requires_prescription || false,
          is_controlled_substance: med.is_controlled_substance || false,
          description: med.description || "",
          storage_instructions: med.storage_instructions || ""
        });
      } catch (error) {
        toast.error("Failed to load details");
        return;
      } finally {
        setIsActionLoading(false);
      }
    } else {
      setFormData({
        generic_name: "",
        brand_name: "",
        dosage_form: "Tablet",
        strength: "",
        manufacturer: "",
        category: "",
        drug_class: "",
        route: "",
        composition: "",
        pack_size: "",
        reorder_level: 10,
        barcode: "",
        hsn_code: "",
        sku: "",
        requires_prescription: false,
        is_controlled_substance: false,
        description: "",
        storage_instructions: ""
      });
    }
    setIsModalOpen(true);
  };

  const buildPayload = (data) => {
    const s = (v) => (v && String(v).trim() !== '' ? String(v).trim() : null);
    const i = (v, def = null) => {
      const n = parseInt(v, 10);
      return isNaN(n) ? def : n;
    };
    const payload = {
      generic_name: data.generic_name.trim(),
      brand_name: data.brand_name.trim(),
      dosage_form: data.dosage_form,
      composition: s(data.composition),
      strength: s(data.strength),
      manufacturer: s(data.manufacturer),
      category: s(data.category),
      drug_class: s(data.drug_class),
      route: s(data.route),
      pack_size: i(data.pack_size, null),
      reorder_level: i(data.reorder_level, 10),
      barcode: s(data.barcode),
      hsn_code: s(data.hsn_code),
      sku: s(data.sku),
      requires_prescription: Boolean(data.requires_prescription),
      is_controlled_substance: Boolean(data.is_controlled_substance),
      description: s(data.description),
      storage_instructions: s(data.storage_instructions),
    };
    return payload;
  };

  const handleSave = async () => {
    if (!formData.generic_name || !formData.brand_name) {
      toast.error("Generic and Brand names are required");
      return;
    }
    const payload = buildPayload(formData);
    setIsActionLoading(true);
    try {
      if (mode === 'add') {
        await createMedicine(payload);
        toast.success("Medicine added to database");
      } else {
        await updateMedicine(selectedId, payload);
        toast.success("Medicine updated");
      }
      setIsModalOpen(false);
      fetchMedicines();
    } catch (error) {
      toast.error(error.message || "Operation failed");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name}?`)) return;
    try {
      await deleteMedicine(id);
      toast.success("Removed from database");
      fetchMedicines();
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen space-y-6 px-3 sm:px-6 py-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Medicine Database</h1>
          <p className="text-slate-500 text-sm">
            Central repository for hospital medicine standards
          </p>
        </div>

        <button
          onClick={() => handleOpenModal('add')}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95"
        >
          <Plus size={18} />
          Add to Medicine
        </button>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Search generic/brand name or manufacturer... (Press Enter)"
              className="w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border rounded-xl px-4 py-2.5 text-sm outline-none bg-slate-50 focus:bg-white transition-all"
          >
            <option value="">All Categories</option>
            <option>Antibiotic</option>
            <option>Analgesic</option>
            <option>Hypertension</option>
            <option>Antihistamine</option>
            <option>Diabetes</option>
          </select>

          <button
            onClick={fetchMedicines}
            className="bg-slate-800 text-white rounded-xl px-6 py-2.5 font-bold hover:bg-slate-900 transition-all text-sm"
          >
            Refresh Database
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-slate-50/50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b">
              <tr>
                <th className="px-6 py-4 text-left">Medicine & Code</th>
                <th className="px-6 py-4 text-left">Generic Name</th>
                <th className="px-6 py-4 text-left">Manufacturer</th>
                <th className="px-6 py-4 text-left">Category</th>
                <th className="px-6 py-4 text-center">RX Required</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <Loader2 className="animate-spin" size={32} />
                      <p className="font-medium">Querying database...</p>
                    </div>
                  </td>
                </tr>
              ) : medicines.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center text-slate-500 italic">
                    No matching medicines found.
                  </td>
                </tr>
              ) : (
                medicines.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                          <Pill size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{m.brand_name}</p>
                          <p className="text-[10px] font-mono text-slate-400 uppercase">{m.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium italic">{m.generic_name}</td>
                    <td className="px-6 py-4 text-slate-500">{m.manufacturer || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                        {m.category || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {m.requires_prescription ? (
                        <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-black rounded uppercase">Yes (RX)</span>
                      ) : (
                        <span className="text-slate-300 text-[10px] font-bold uppercase tracking-widest">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-1 transition-opacity">
                        <button
                          onClick={() => handleOpenModal('view', m.id)}
                          className="p-2 hover:bg-white hover:shadow-sm text-blue-500 rounded-lg transition-all"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenModal('edit', m.id)}
                          className="p-2 hover:bg-white hover:shadow-sm text-green-500 rounded-lg transition-all"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id, m.brand_name)}
                          className="p-2 hover:bg-white hover:shadow-sm text-red-500 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT / VIEW MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={mode === 'add' ? 'Add New Medicine' : mode === 'edit' ? 'Edit Medicine' : 'Medicine Insights'}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-6">
          {isActionLoading ? (
            <div className="py-12 flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
              <p className="text-sm text-slate-500">Loading data...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Brand Name</label>
                  <input
                    disabled={mode === 'view'}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50"
                    value={formData.brand_name}
                    onChange={e => setFormData({ ...formData, brand_name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generic Name</label>
                  <input
                    disabled={mode === 'view'}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50"
                    value={formData.generic_name}
                    onChange={e => setFormData({ ...formData, generic_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manufacturer</label>
                  <input
                    disabled={mode === 'view'}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50"
                    value={formData.manufacturer}
                    onChange={e => setFormData({ ...formData, manufacturer: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</label>
                  <input
                    disabled={mode === 'view'}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Strength</label>
                  <input
                    disabled={mode === 'view'}
                    placeholder="e.g. 500mg"
                    className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50"
                    value={formData.strength}
                    onChange={e => setFormData({ ...formData, strength: e.target.value })}
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-indigo-500" />
                    <span className="text-xs font-bold text-slate-700">Safety & Controls</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={formData.requires_prescription}
                      disabled={mode === 'view'}
                      onChange={e => setFormData({ ...formData, requires_prescription: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    <span className="ml-3 text-xs font-medium text-slate-900">Requires Prescription</span>
                  </label>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Composition / Salt</label>
                  <textarea
                    disabled={mode === 'view'}
                    rows={2}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50"
                    value={formData.composition}
                    onChange={e => setFormData({ ...formData, composition: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-all"
                >
                  Close
                </button>
                {mode !== 'view' && (
                  <button
                    onClick={handleSave}
                    disabled={isActionLoading}
                    className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isActionLoading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                    {mode === 'add' ? 'Save Medicine' : 'Update Changes'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
