import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Search,
  RotateCcw,
  FileText,
  Plus,
  Loader2,
  Package,
  Check,
  X,
  Trash2,
  Truck,
  History,
  Undo
} from "lucide-react";
import Modal from "../../../../components/common/Modal/Modal";
import {
  getReturns,
  createPatientReturn,
  createSupplierReturn,
  getMedicines,
  getStockBatches,
  getSuppliers,
  getGRNs,
  getSale
} from "../../../../services/pharmacyApi";

export default function Return() {
  const [returns, setReturns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [returnType, setReturnType] = useState(""); // PATIENT | SUPPLIER | ""

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("PATIENT"); // PATIENT | SUPPLIER
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    sale_id: "",
    supplier_id: "",
    grn_id: "",
    return_reason: "",
    items: [{ medicine_id: "", batch_id: "", qty: 1, unit_price: 0 }]
  });

  // Supporting Data
  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [grns, setGrns] = useState([]);
  const [batches, setBatches] = useState({}); // { medicine_id: [batches] }

  useEffect(() => {
    fetchReturns();
    fetchSupportData();
  }, [returnType]);

  const fetchReturns = async () => {
    setIsLoading(true);
    try {
      const resp = await getReturns(returnType);
      console.log("[Return] Fetched history:", resp);
      const data = resp.data || resp;
      const list = Array.isArray(data) ? data : (data.returns || data.items || []);
      setReturns(list);
    } catch (error) {
      console.error("[Return] Fetch history error:", error);
      toast.error("Failed to fetch returns history");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSupportData = async () => {
    try {
      const [medData, supData, grnData] = await Promise.all([
        getMedicines(0, 1000),
        getSuppliers(0, 1000),
        getGRNs()
      ]);
      const mItems = Array.isArray(medData) ? medData : (medData?.medicines || medData?.items || medData?.data || []);
      const sItems = Array.isArray(supData) ? supData : (supData?.suppliers || supData?.items || supData?.data || []);
      const gItems = Array.isArray(grnData) ? grnData : (grnData?.grns || grnData?.items || grnData?.data || []);

      setMedicines(mItems.map(m => ({ ...m, id: m.id || m._id, name: m.brand_name || m.name, price: m.sale_price || 0 })));
      setSuppliers(sItems.map(s => ({ ...s, id: s.id || s._id, name: s.name || s.supplier_name })));
      setGrns(gItems.map(g => ({ ...g, id: g.id || g._id })));
    } catch (error) {
      console.error("Failed to fetch support data", error);
    }
  };

  const fetchBatches = async (medicineId) => {
    if (batches[medicineId]) return;
    try {
      const data = await getStockBatches(medicineId);
      setBatches(prev => ({ ...prev, [medicineId]: data.batches || [] }));
    } catch (error) {
      console.error("Failed to fetch batches", error);
    }
  };

  const handleOpenModal = (type) => {
    setModalType(type);
    setFormData({
      sale_id: "",
      supplier_id: "",
      grn_id: "",
      return_reason: "",
      items: [{ medicine_id: "", batch_id: "", qty: 1, unit_price: 0 }]
    });
    setIsModalOpen(true);
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { medicine_id: "", batch_id: "", qty: 1, unit_price: 0 }]
    });
  };

  const handleRemoveItem = (idx) => {
    const items = [...formData.items];
    items.splice(idx, 1);
    setFormData({ ...formData, items });
  };

  const handleItemChange = (idx, field, value) => {
    const items = [...formData.items];
    
    if (field === 'medicine_id') {
      const med = medicines.find(m => m.id === value);
      items[idx].unit_price = med ? med.price : 0;
      items[idx].batch_id = "";
      fetchBatches(value);
    }
    
    items[idx][field] = value;
    setFormData({ ...formData, items });
  };

  const handleSaveReturn = async () => {
    const saleId = formData.sale_id?.trim();
    if (modalType === 'PATIENT' && !saleId) {
      toast.error("Please provide a Sale ID");
      return;
    }
    if (modalType === 'SUPPLIER' && !formData.supplier_id) {
      toast.error("Please select a supplier");
      return;
    }
    if (!formData.return_reason?.trim()) {
      toast.error("Please provide a return reason");
      return;
    }

    // Clean and validate items
    const validItems = formData.items.filter(it => it.medicine_id && it.batch_id && it.qty > 0);
    if (validItems.length === 0) {
      toast.error("Please add at least one valid item with a selected batch and quantity");
      return;
    }

    const payload = {
      return_reason: formData.return_reason.trim(),
      items: validItems.map(it => ({
        medicine_id: it.medicine_id,
        batch_id: it.batch_id,
        qty: Number(it.qty),
        unit_price: Number(it.unit_price)
      }))
    };

    setIsActionLoading(true);
    try {
      if (modalType === 'PATIENT') {
        await createPatientReturn({
          ...payload,
          sale_id: saleId
        });
      } else {
        await createSupplierReturn({
          ...payload,
          supplier_id: formData.supplier_id,
          grn_id: formData.grn_id || null
        });
      }

      toast.success(`${modalType === 'PATIENT' ? 'Patient' : 'Supplier'} return processed successfully`);
      setIsModalOpen(false);
      fetchReturns();
    } catch (error) {
      console.error("[Return] Process error:", error);
      toast.error(error.message || "Failed to process return. Check if items match the sale.");
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen space-y-6 px-3 sm:px-6 py-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Returns & Refunds</h1>
          <p className="text-slate-500 text-sm">Track patient returns and supplier credit history</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleOpenModal("PATIENT")}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95"
          >
            <RotateCcw size={18} />
            Patient Return
          </button>
          <button
            onClick={() => handleOpenModal("SUPPLIER")}
            className="flex items-center justify-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-xl hover:bg-slate-900 shadow-lg shadow-slate-100 transition-all active:scale-95"
          >
            <Truck size={18} />
            Return to Supplier
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search return ID, sale ID, or medicine..."
            className="w-full border rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
          />
        </div>

        <select
          value={returnType}
          onChange={(e) => setReturnType(e.target.value)}
          className="border rounded-xl px-4 py-2.5 text-sm outline-none bg-slate-50 focus:bg-white transition-all w-full md:w-48"
        >
          <option value="">All Return Types</option>
          <option value="PATIENT">Patient Returns</option>
          <option value="SUPPLIER">Supplier Returns</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-slate-50/50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b">
              <tr>
                <th className="px-6 py-4 text-left">Return ID</th>
                <th className="px-6 py-4 text-left">Entity (Sale/Supplier)</th>
                <th className="px-6 py-4 text-center">Date</th>
                <th className="px-6 py-4 text-left">Reason / Items</th>
                <th className="px-6 py-4 text-center">Type</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <Loader2 className="animate-spin" size={32} />
                      <p className="font-medium">Fetching records...</p>
                    </div>
                  </td>
                </tr>
              ) : returns.length === 0 ? (
                <tr><td colSpan="6" className="py-20 text-center text-slate-500 italic">No return records found</td></tr>
              ) : (
                returns.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-indigo-600">
                      {r.id.slice(0, 13).toUpperCase()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {r.sale_id ? <FileText size={14} className="text-slate-400" /> : <Truck size={14} className="text-slate-400" />}
                        <span className="font-medium text-slate-700">
                          {r.sale_id || (suppliers.find(s => s.id === r.supplier_id)?.name) || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-slate-500">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-slate-800 font-medium truncate">{r.return_reason || r.reason || 'No reason'}</p>
                      <p className="text-[10px] text-slate-400 truncate">Items: {r.items?.length || 0} unique lines</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${r.sale_id ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                        {r.sale_id ? 'Patient' : 'Supplier'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase">
                        PROCESSED
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RETURN MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`New ${modalType === 'PATIENT' ? 'Patient' : 'Supplier'} Return Request`}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modalType === 'PATIENT' ? (
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Sale ID / Reference</label>
                <input 
                  placeholder="e.g. SALE-1001"
                  className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={formData.sale_id}
                  onChange={e => setFormData({ ...formData, sale_id: e.target.value })}
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Select Supplier</label>
                  <select
                    className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={formData.supplier_id}
                    onChange={e => setFormData({ ...formData, supplier_id: e.target.value })}
                  >
                    <option value="">Choose Supplier</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Reference GRN (Optional)</label>
                  <select
                    className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={formData.grn_id}
                    onChange={e => setFormData({ ...formData, grn_id: e.target.value })}
                  >
                    <option value="">No GRN Linked</option>
                    {grns.filter(g => !formData.supplier_id || g.supplier_id === formData.supplier_id).map(g => (
                      <option key={g.id} value={g.id}>{g.grn_number} (Ref: {g.id.slice(0, 8)})</option>
                    ))}
                  </select>
                </div>
              </>
            )}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Reason for Return</label>
              <input
                placeholder="Medicine not required / Wrong item / Damaged"
                className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={formData.return_reason}
                onChange={e => setFormData({ ...formData, return_reason: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2 border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Package size={18} className="text-indigo-600" /> Return Items
              </h3>
              <button onClick={handleAddItem} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-all">
                + Add Item
              </button>
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2">
              {formData.items.map((item, idx) => (
                <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-end gap-3 relative group">
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Medicine</label>
                    <select 
                      className="w-full bg-white border rounded-lg p-2 text-xs outline-none"
                      value={item.medicine_id}
                      onChange={e => handleItemChange(idx, 'medicine_id', e.target.value)}
                    >
                      <option value="">Select Medicine</option>
                      {medicines.map(m => <option key={m.id} value={m.id}>{m.name} - ₹{m.price}</option>)}
                    </select>
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Batch No.</label>
                    <select
                      className="w-full bg-white border rounded-lg p-2 text-xs outline-none disabled:bg-slate-100"
                      disabled={!item.medicine_id}
                      value={item.batch_id}
                      onChange={e => handleItemChange(idx, 'batch_id', e.target.value)}
                    >
                      <option value="">Select Batch</option>
                      {(batches[item.medicine_id] || []).map(b => (
                        <option key={b.id} value={b.id}>{b.batch_no} (Stock: {b.qty_on_hand})</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-20">
                    <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Qty</label>
                    <input
                      type="number"
                      className="w-full bg-white border rounded-lg p-2 text-xs text-center outline-none"
                      value={item.qty}
                      onChange={e => handleItemChange(idx, 'qty', Number(e.target.value))}
                    />
                  </div>
                  <div className="w-24 text-right">
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Refund</p>
                    <p className="text-sm font-black text-slate-700">₹{(item.qty * item.unit_price).toLocaleString()}</p>
                  </div>
                  {formData.items.length > 1 && (
                    <button
                      onClick={() => handleRemoveItem(idx)}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-all">Cancel</button>
            <button
              onClick={handleSaveReturn}
              disabled={isActionLoading}
              className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {isActionLoading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              Process Return
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
