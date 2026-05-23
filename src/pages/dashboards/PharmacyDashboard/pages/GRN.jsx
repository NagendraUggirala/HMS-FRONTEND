import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Search,
  FileCheck,
  Plus,
  Truck,
  Loader2,
  Calendar,
  Package,
  ArrowRight,
  Check,
  X,
  FileText,
  AlertCircle,
  Eye
} from "lucide-react";
import Modal from "../../../../components/common/Modal/Modal";
import {
  getGRNs,
  getGRN,
  createGRN,
  addGRNItem,
  finalizeGRN,
  getSuppliers,
  getMedicines,
  getPurchaseOrders
} from "../../../../services/pharmacyApi";

export default function GRN() {
  const [grns, setGrns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [selectedGrn, setSelectedGrn] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    supplier_id: "",
    po_id: "",
    notes: "",
    items: [{ medicine_id: "", medicine_name: "", batch_no: "", expiry_date: "", received_qty: 1, free_qty: 0, purchase_rate: 0, mrp: 0, selling_price: 0, tax_percent: 0 }]
  });

  // Supporting Data
  const [suppliers, setSuppliers] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);

  useEffect(() => {
    fetchGrns();
    fetchSupportData();
  }, [supplierFilter]);

  const fetchGrns = async () => {
    setIsLoading(true);
    try {
      const data = await getGRNs(supplierFilter);
      console.log("[GRN] fetchGrns response:", data);
      const items = Array.isArray(data) ? data : (data?.grns || data?.items || data?.data || []);
      const normalized = items.map(g => ({
        ...g,
        id: g.id || g._id
      }));
      setGrns(normalized);
    } catch (error) {
      console.error("[GRN] fetchGrns error:", error);
      toast.error("Failed to fetch GRN list");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSupportData = async () => {
    try {
      const [supData, medData, poData] = await Promise.all([
        getSuppliers(0, 1000),
        getMedicines(0, 1000),
        getPurchaseOrders('APPROVED') // Only show approved POs for GRN
      ]);
      console.log("[GRN] Support Data Raw:", { supData, medData, poData });

      const sItems = Array.isArray(supData) ? supData : (supData?.suppliers || supData?.items || supData?.data || []);
      const mItems = Array.isArray(medData) ? medData : (medData?.medicines || medData?.items || medData?.data || []);
      const poItems = Array.isArray(poData) ? poData : (poData?.purchase_orders || poData?.items || poData?.data || []);

      console.log("[GRN] Support Data Normalized:", { sItems, mItems, poItems });

      setSuppliers(sItems.map(s => ({ ...s, id: s.id || s._id, name: s.name || s.supplier_name })));
      setMedicines(mItems.map(m => ({ ...m, id: m.id || m._id, name: m.brand_name || m.name })));
      setPurchaseOrders(poItems.map(po => ({ ...po, id: po.id || po._id })));
    } catch (error) {
      console.error("Failed to fetch support data", error);
    }
  };

  const handleOpenNewGrn = () => {
    setFormData({
      supplier_id: "",
      po_id: "",
      notes: "",
      items: [{ medicine_id: "", medicine_name: "", batch_no: "", expiry_date: "", received_qty: 1, free_qty: 0, purchase_rate: 0, mrp: 0, selling_price: 0, tax_percent: 0 }]
    });
    setIsModalOpen(true);
  };

  const handleViewGrn = async (id) => {
    setIsActionLoading(true);
    try {
      const data = await getGRN(id);
      setSelectedGrn(data.grn || data.data || data);
      setIsViewModalOpen(true);
    } catch (error) {
      toast.error("Failed to load GRN details");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { medicine_id: "", medicine_name: "", batch_no: "", expiry_date: "", received_qty: 1, free_qty: 0, purchase_rate: 0, mrp: 0, selling_price: 0, tax_percent: 0 }]
    });
  };

  const handleRemoveItem = (idx) => {
    const items = [...formData.items];
    items.splice(idx, 1);
    setFormData({ ...formData, items });
  };

  const handleItemChange = (idx, field, value) => {
    setFormData(prev => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [field]: value };
      return { ...prev, items };
    });
  };

  const handleCreateGrn = async () => {
    if (!formData.supplier_id) {
      toast.error("Please select a supplier first");
      return;
    }
    
    // Validate and clean items
    console.log("[GRN] Validating items:", formData.items);
    const validItems = formData.items.filter(it => it.medicine_id && it.batch_no && it.expiry_date);
    
    if (validItems.length === 0) {
      const first = formData.items[0];
      if (!first.medicine_id) toast.error("Please select a Medicine");
      else if (!first.batch_no) toast.error("Please enter a Batch Number");
      else if (!first.expiry_date) toast.error("Please select an Expiry Date");
      else toast.error("Please add at least one complete item");
      return;
    }

    setIsActionLoading(true);
    try {
      const payload = {
        supplier_id: formData.supplier_id,
        po_id: formData.po_id || null,
        received_at: new Date().toISOString(),
        notes: formData.notes,
        items: validItems.map(it => ({
          medicine_id: it.medicine_id,
          batch_no: it.batch_no,
          expiry_date: it.expiry_date,
          received_qty: Number(it.received_qty || 0),
          free_qty: Number(it.free_qty || 0),
          purchase_rate: Number(it.purchase_rate || 0),
          mrp: Number(it.mrp || 0),
          selling_price: Number(it.selling_price || 0),
          tax_percent: Number(it.tax_percent || 0)
        }))
      };

      console.log("[GRN] Submitting payload:", payload);
      const res = await createGRN(payload);
      console.log("[GRN] Success response:", res);

      const grnId = res.id || res.grn_id || res.data?.id || res.data?.grn_id;
      if (grnId) {
        console.log("[GRN] Finalizing ID:", grnId);
        await finalizeGRN(grnId).catch(err => console.warn("Finalization warning:", err));
      }

      toast.success("GRN created and stock updated successfully");
      setIsModalOpen(false);
      fetchGrns();
      
      // Reset form
      setFormData({
        supplier_id: "",
        po_id: "",
        notes: "",
        items: [{ medicine_id: "", medicine_name: "", batch_no: "", expiry_date: "", received_qty: 1, free_qty: 0, purchase_rate: 0, mrp: 0, selling_price: 0, tax_percent: 0 }]
      });
    } catch (error) {
      console.error("[GRN] Creation failed. Full error:", error);
      let errMsg = "Failed to process GRN";
      if (error.response?.data?.detail) {
        errMsg = JSON.stringify(error.response.data.detail);
      } else if (error.message) {
        errMsg = error.message;
      }
      toast.error(errMsg);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleFinalize = async (id) => {
    setIsActionLoading(true);
    try {
      await finalizeGRN(id);
      toast.success("GRN finalized and stock updated");
      fetchGrns();
    } catch (error) {
      console.error("[GRN] Finalize error:", error);
      toast.error(error.message || "Failed to finalize GRN");
    } finally {
      setIsActionLoading(false);
    }
  };

  const getSupplierName = (id) => {
    const s = suppliers.find(sup => (sup.id || sup._id) === id);
    return s ? (s.name || s.supplier_name || "Unknown Supplier") : "Unknown Supplier";
  };
  const getMedicineName = (id) => {
    if (!id) return "Unknown Medicine";
    const m = medicines.find(med => String(med.id || med._id) === String(id));
    return m ? (m.name || m.brand_name || "Unknown Medicine") : "Unknown Medicine";
  };

  return (
    <div className="bg-slate-100 min-h-screen space-y-6 px-3 sm:px-6 py-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Goods Receipt Notes (GRN)</h1>
          <p className="text-slate-500 text-sm">Acknowledge incoming stock and update inventory</p>
        </div>
        <button
          onClick={handleOpenNewGrn}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95"
        >
          <Plus size={18} />
          Create New GRN
        </button>
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search GRN number or notes..."
            className="w-full border rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
          />
        </div>

        <select
          value={supplierFilter}
          onChange={(e) => setSupplierFilter(e.target.value)}
          className="border rounded-xl px-4 py-2.5 text-sm outline-none bg-slate-50 focus:bg-white transition-all w-full md:w-64"
        >
          <option value="">All Suppliers</option>
          {suppliers.map(s => <option key={s.id || s._id} value={s.id || s._id}>{s.name || s.supplier_name}</option>)}
        </select>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-slate-50/50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b">
              <tr>
                <th className="px-6 py-4 text-left">GRN Number</th>
                <th className="px-6 py-4 text-left">Supplier</th>
                <th className="px-6 py-4 text-center">Received Date</th>
                <th className="px-6 py-4 text-left">Ref PO</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <Loader2 className="animate-spin" size={32} />
                      <p className="font-medium">Loading inventory records...</p>
                    </div>
                  </td>
                </tr>
              ) : grns.length === 0 ? (
                <tr><td colSpan="6" className="py-20 text-center text-slate-500 italic">No GRN records found</td></tr>
              ) : (
                grns.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-slate-800 uppercase tracking-tighter">
                      {g.grn_number}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Truck size={14} className="text-slate-400" />
                        <span className="font-medium text-slate-700">{getSupplierName(g.supplier_id)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-slate-500 font-medium">
                      {new Date(g.received_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {g.po_id ? (
                        <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-2 py-1 rounded">PO-{g.po_id.slice(0, 8)}</span>
                      ) : (
                        <span className="text-slate-300 italic text-[10px]">Direct Receipt</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {g.is_finalized ? (
                        <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase flex items-center justify-center gap-1 w-fit mx-auto">
                          <Check size={10} /> Finalized
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase w-fit mx-auto">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => handleViewGrn(g.id)}
                          className="p-2 hover:bg-white hover:shadow-sm text-indigo-500 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        {!g.is_finalized && (
                          <button 
                            onClick={() => handleFinalize(g.id)}
                            disabled={isActionLoading}
                            className="p-2 hover:bg-white hover:shadow-sm text-green-500 rounded-lg transition-all"
                            title="Finalize GRN"
                          >
                            {isActionLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW GRN MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Goods Receipt Note" maxWidth="max-w-5xl">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Select Supplier</label>
              <select
                className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={formData.supplier_id}
                onChange={e => setFormData({ ...formData, supplier_id: e.target.value })}
              >
                <option value="">Choose Supplier</option>
                {suppliers.map(s => <option key={s.id || s._id} value={s.id || s._id}>{s.name || s.supplier_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Reference PO (Optional)</label>
              <select
                className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={formData.po_id}
                onChange={e => setFormData({ ...formData, po_id: e.target.value })}
              >
                <option value="">No PO Linked</option>
                {purchaseOrders.filter(po => !formData.supplier_id || po.supplier_id === formData.supplier_id).map(po => (
                  <option key={po.id} value={po.id}>PO-{po.id.slice(0, 8)} (Total: ₹{po.total_amount})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Remarks / Notes</label>
              <input
                placeholder="Bill number, delivery note, etc."
                className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2 border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Package size={18} className="text-indigo-600" /> Incoming Items & Batching
              </h3>
              <button onClick={handleAddItem} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-all">
                + Add Line Item
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {formData.items.map((item, idx) => (
                <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative group transition-all hover:border-indigo-200">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4">
                    <div className="md:col-span-4">
                      <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Medicine</label>
                      <select
                        className="w-full bg-white border rounded-lg p-2 text-xs outline-none"
                        value={item.medicine_id}
                        onChange={e => {
                          const selectedMedicine = medicines.find(m => (m.id || m._id) === e.target.value);
                          handleItemChange(idx, 'medicine_id', e.target.value);
                          handleItemChange(idx, 'medicine_name', selectedMedicine?.name || selectedMedicine?.brand_name || "");
                        }}
                      >
                        <option value="">{medicines.length === 0 ? "No Medicines Available" : "Select Medicine"}</option>
                        {medicines.map(m => <option key={m.id} value={m.id}>{m.name || m.brand_name}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-3">
                      <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Batch No.</label>
                      <input
                        placeholder="e.g. BTC-101"
                        className="w-full bg-white border rounded-lg p-2 text-xs outline-none"
                        value={item.batch_no}
                        onChange={e => handleItemChange(idx, 'batch_no', e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Expiry Date</label>
                      <input
                        type="date"
                        className="w-full bg-white border rounded-lg p-2 text-xs outline-none"
                        value={item.expiry_date}
                        onChange={e => handleItemChange(idx, 'expiry_date', e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Qty</label>
                      <input
                        type="number"
                        className="w-full bg-white border rounded-lg p-2 text-xs text-center outline-none"
                        value={item.received_qty}
                        onChange={e => handleItemChange(idx, 'received_qty', Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">P. Rate</label>
                      <input
                        type="number"
                        className="w-full bg-white border rounded-lg p-2 text-xs outline-none"
                        value={item.purchase_rate}
                        onChange={e => handleItemChange(idx, 'purchase_rate', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">MRP</label>
                      <input
                        type="number"
                        className="w-full bg-white border rounded-lg p-2 text-xs outline-none"
                        value={item.mrp}
                        onChange={e => handleItemChange(idx, 'mrp', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">S. Price</label>
                      <input
                        type="number"
                        className="w-full bg-white border rounded-lg p-2 text-xs outline-none"
                        value={item.selling_price}
                        onChange={e => handleItemChange(idx, 'selling_price', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Tax %</label>
                      <input
                        type="number"
                        className="w-full bg-white border rounded-lg p-2 text-xs outline-none"
                        value={item.tax_percent}
                        onChange={e => handleItemChange(idx, 'tax_percent', Number(e.target.value))}
                      />
                    </div>
                    <div className="flex items-end justify-end pb-1">
                      <span className="text-[10px] font-black text-slate-600 bg-slate-200 px-2 py-1 rounded">Total: ₹{(item.received_qty * item.purchase_rate).toFixed(2)}</span>
                    </div>
                  </div>

                  {formData.items.length > 1 && (
                    <button
                      onClick={() => handleRemoveItem(idx)}
                      className="absolute -right-2 -top-2 w-6 h-6 bg-white border border-red-100 text-red-500 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-all">Cancel</button>
            <button
              onClick={handleCreateGrn}
              disabled={isActionLoading}
              className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {isActionLoading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              Finalize & Add to Stock
            </button>
          </div>
        </div>
      </Modal>

      {/* VIEW GRN MODAL */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="GRN Details" maxWidth="max-w-4xl">
        {selectedGrn && (
          <div className="space-y-6">
            <div className="flex justify-between items-start bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Receipt Identity</p>
                <h2 className="text-2xl font-black text-slate-800">{selectedGrn.grn_number}</h2>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(selectedGrn.received_at).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><Truck size={14} /> {getSupplierName(selectedGrn.supplier_id)}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-widest">Verified & Finalized</span>
                <p className="mt-2 text-xs text-slate-400">PO Ref: {selectedGrn.po_id ? `PO-${selectedGrn.po_id.slice(0, 8)}` : 'N/A'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 px-2">
                <FileText size={18} className="text-indigo-600" /> Itemized Breakdown
              </h3>
              <div className="border border-slate-100 rounded-2xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b">
                    <tr>
                      <th className="px-4 py-3 text-left">Medicine</th>
                      <th className="px-4 py-3 text-left">Batch/Expiry</th>
                      <th className="px-4 py-3 text-right">Received Qty</th>
                      <th className="px-4 py-3 text-right">Purchase Rate</th>
                      <th className="px-4 py-3 text-right">MRP</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedGrn.items?.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-800 min-h-[20px]">
                            {it.medicine?.brand_name || it.medicine?.name || it.medicine_name || it.batch_no || "Medicine"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-mono text-[10px] text-slate-500">{it.batch_no}</p>
                          <p className="text-[9px] text-slate-400">Exp: {new Date(it.expiry_date).toLocaleDateString()}</p>
                        </td>
                        <td className="px-4 py-3 text-right font-black">{it.received_qty}</td>
                        <td className="px-4 py-3 text-right text-slate-600">₹{it.purchase_rate.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-slate-600">₹{it.mrp.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-black text-indigo-600">₹{(it.received_qty * it.purchase_rate).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-indigo-50/50">
                    <tr>
                      <td colSpan="5" className="px-4 py-3 text-right font-bold text-slate-600">Grand Total</td>
                      <td className="px-4 py-3 text-right font-black text-indigo-600 text-base">
                        ₹{selectedGrn.items?.reduce((sum, it) => sum + (it.received_qty * it.purchase_rate), 0).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button onClick={() => setIsViewModalOpen(false)} className="px-8 py-2.5 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all">Close Details</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
