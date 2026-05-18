import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Search,
  Filter,
  Plus,
  Package,
  MapPin,
  History,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  X,
  Check
} from "lucide-react";
import Modal from "../../../../components/common/Modal/Modal";
import {
  getStockBatches,
  createStockAdjustment,
  getStockLedger,
  getMedicines,
  getSuppliers,
  createGRN,
  finalizeGRN
} from "../../../../services/pharmacyApi";

export default function Stock() {
  const [activeTab, setActiveTab] = useState("inventory"); 
  const [batches, setBatches] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Modals
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Modal-specific batches fetched per selected medicine
  const [modalBatches, setModalBatches] = useState([]);
  const [isBatchLoading, setIsBatchLoading] = useState(false);

  // Suppliers for new stock GRN
  const [suppliers, setSuppliers] = useState([]);

  // New stock form (used when medicine has no batches)
  const [newStock, setNewStock] = useState({
    supplier_id: "",
    batch_no: "",
    expiry_date: "",
    received_qty: 1,
    purchase_rate: 0,
    mrp: 0,
    selling_price: 0
  });

  // Adjustment Form State
  const [adjustment, setAdjustment] = useState({
    medicine_id: "",
    batch_id: "",
    qty_change: 1,
    type: "ADD",
    reason: "MANUAL_CORRECTION",
    notes: ""
  });

  useEffect(() => {
    fetchData();
    fetchMedicines();
    fetchSuppliers();
  }, [activeTab, lowStockOnly]);

  const fetchSuppliers = async () => {
    try {
      const data = await getSuppliers();
      let items = [];
      if (Array.isArray(data)) items = data;
      else if (data) items = data.suppliers || data.items || data.data || [];
      setSuppliers(items);
    } catch (e) {
      console.error('[Stock] fetchSuppliers error:', e);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === "inventory") {
        const data = await getStockBatches('', lowStockOnly);
        console.log("[Stock] getStockBatches response:", data);
        const rawBatches = data.batches || data.items || data.data || (Array.isArray(data) ? data : []);
        setBatches(rawBatches.map(b => ({ ...b, id: b.id || b._id })));
      } else {
        const data = await getStockLedger();
        console.log("[Stock] getStockLedger response:", data);
        const rawLedger = data.ledger || data.items || data.data || (Array.isArray(data) ? data : []);
        setLedger(rawLedger.map(l => ({ ...l, id: l.id || l._id })));
      }
    } catch (error) {
      console.error("[Stock] fetchData error:", error);
      toast.error("Failed to fetch stock data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMedicines = async () => {
    try {
      const data = await getMedicines(); // Use default limit
      const items = Array.isArray(data) ? data : (data?.medicines || data?.items || data?.data || []);
      setMedicines(items.map(m => ({
        ...m,
        id: m.id || m._id,
        name: m.brand_name || m.name || m.item_name || m.generic_name || "Unknown Medicine"
      })));
    } catch (error) {
      console.error("Failed to fetch medicines", error);
    }
  };

  const displayBatches = lowStockOnly
    ? batches.filter(b => Number(b.qty_on_hand) <= 10)
    : batches;

  /**
   * Fetch batches for the selected medicine directly from API.
   * Called every time user picks a medicine in the adjustment modal.
   */
  const fetchModalBatches = async (medicineId) => {
    if (!medicineId) {
      setModalBatches([]);
      return;
    }
    setIsBatchLoading(true);
    try {
      const data = await getStockBatches(medicineId, false);
      const raw = data?.batches || data?.items || data?.data || (Array.isArray(data) ? data : []);
      const mapped = raw.map(b => ({ ...b, id: b.id || b._id }));
      console.log(`[Stock] Batches for medicine ${medicineId}:`, mapped);
      setModalBatches(mapped);
      // Auto-select first batch
      const first = mapped[0];
      const firstId = first ? (first.batch_id || first.id || first._id || '') : '';
      setAdjustment(prev => ({ ...prev, batch_id: firstId }));
    } catch (err) {
      console.error('[Stock] fetchModalBatches error:', err);
      setModalBatches([]);
    } finally {
      setIsBatchLoading(false);
    }
  };

  const handleCreateAdjustment = async () => {
    if (!adjustment.medicine_id) {
      toast.error("Please select a Medicine");
      return;
    }
    if (adjustment.qty_change === "" || adjustment.qty_change === null || isNaN(adjustment.qty_change) || Number(adjustment.qty_change) <= 0) {
      toast.error("Please enter a valid Quantity (must be greater than 0)");
      return;
    }
    if (adjustment.reason === "") {
      toast.error("Please select an Adjustment Reason");
      return;
    }
    // Block adjustment if medicine has no batches — needs initial stock via GRN
    if (adjustment.medicine_id && !isBatchLoading && modalBatches.length === 0) {
      toast.error("This medicine has no stock batches. Use the 'Add Initial Stock' form below.");
      return;
    }
    setIsActionLoading(true);
    try {
      await createStockAdjustment({
        medicine_id: adjustment.medicine_id,
        batch_id: adjustment.batch_id || null,
        qty_change: adjustment.type === 'ADD' ? Math.abs(adjustment.qty_change) : -Math.abs(adjustment.qty_change),
        reason: adjustment.reason,
        notes: adjustment.notes || null
      });
      toast.success("Stock adjusted successfully");
      setIsAdjustModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.message || "Adjustment failed");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAddInitialStock = async () => {
    if (!adjustment.medicine_id) { toast.error("Select a medicine"); return; }
    if (!newStock.supplier_id) { toast.error("Select a supplier"); return; }
    if (!newStock.batch_no.trim()) { toast.error("Enter batch number"); return; }
    if (!newStock.expiry_date) { toast.error("Enter expiry date"); return; }
    if (!newStock.received_qty || newStock.received_qty <= 0) { toast.error("Enter valid quantity"); return; }
    if (!newStock.purchase_rate || newStock.purchase_rate <= 0) { toast.error("Enter purchase rate"); return; }
    if (!newStock.mrp || newStock.mrp <= 0) { toast.error("Enter MRP"); return; }
    if (!newStock.selling_price || newStock.selling_price <= 0) { toast.error("Enter selling price"); return; }

    setIsActionLoading(true);
    try {
      // createGRN with inline items (single API call)
      const grnData = await createGRN({
        supplier_id: newStock.supplier_id,
        received_at: new Date().toISOString(),
        notes: `Initial stock entry via Stock Management`,
        items: [{
          medicine_id: adjustment.medicine_id,
          batch_no: newStock.batch_no,
          expiry_date: newStock.expiry_date,
          received_qty: Number(newStock.received_qty),
          purchase_rate: Number(newStock.purchase_rate),
          mrp: Number(newStock.mrp),
          selling_price: Number(newStock.selling_price)
        }]
      });
      // Finalize to push stock into inventory
      const grnId = grnData?.id || grnData?._id || grnData?.grn_id;
      if (grnId) await finalizeGRN(grnId);
      toast.success("Initial stock added successfully!");
      setIsAdjustModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to add initial stock");
    } finally {
      setIsActionLoading(false);
    }
  };

  const getMedicineName = (id, batch = {}) => {
    // 1. Try direct fields from the batch object first
    if (batch.medicine_name) return batch.medicine_name;
    if (batch.medicine?.name) return batch.medicine.name;
    if (batch.item_name) return batch.item_name;

    // 2. Fallback to lookup in the medicines master list
    const med = medicines.find(m => (m.id || m._id) === id);
    if (med) return med.name;

    // 3. Last resort: Return a placeholder or the ID if absolutely nothing is found
    return "Medicine-" + (id ? id.slice(0, 5) : "???");
  };

  return (
    <div className="bg-slate-100 min-h-screen space-y-6 px-3 sm:px-6 py-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Stock Management</h1>
          <p className="text-slate-500 text-sm">Real-time inventory levels and batch tracking</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab(activeTab === "inventory" ? "ledger" : "inventory")}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${activeTab === "ledger"
              ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
          >
            <History size={18} />
            {activeTab === "inventory" ? "Audit Ledger" : "Back to Stock"}
          </button>
          <button
            onClick={async () => {
              // Fetch all batches and medicines for the modal to ensure dropdowns work
              setIsActionLoading(true);
              try {
                const [bData, mData] = await Promise.all([
                  getStockBatches("", false),
                  getMedicines() // Use default limit for better stability
                ]);

                const rawBatches = bData?.batches || bData?.items || bData?.data || (Array.isArray(bData) ? bData : []) || [];
                setBatches(rawBatches.map(b => ({ ...b, id: b.id || b._id })));

                const rawMeds = mData?.medicines || mData?.items || mData?.data || (Array.isArray(mData) ? mData : []) || [];
                setMedicines(rawMeds.map(m => ({
                  ...m,
                  id: m.id || m._id,
                  name: m.brand_name || m.name || m.item_name || "Unknown Medicine"
                })));
              } catch (err) {
                console.error("[Stock] Modal pre-fetch failed:", err);
              } finally {
                setIsActionLoading(false);
              }

              setModalBatches([]);
              setAdjustment({
                medicine_id: "",
                batch_id: "",
                qty_change: 1,
                type: "ADD",
                reason: "MANUAL_CORRECTION",
                notes: ""
              });
              setIsAdjustModalOpen(true);  
            }}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50"
            disabled={isActionLoading}
          >
            {isActionLoading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            Manual Adjustment
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
            placeholder="Filter by medicine or batch number..."
            className="w-full border rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
          />
        </div>

        {activeTab === "inventory" && (
          <div className="flex items-center gap-3 w-full md:w-auto">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
              />
              <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">Low Stock Alerts</span>
            </label>
          </div>
        )}

        <button onClick={fetchData} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
          <Filter size={18} />
        </button>
      </div>

      {/* CONTENT */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
              <Loader2 className="animate-spin" size={32} />
              <p className="font-medium">Syncing warehouse data...</p>
            </div>
          ) : activeTab === "inventory" ? (
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-slate-50/50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b">
                <tr>
                  <th className="px-6 py-4 text-left">Medicine / Batch</th>
                  <th className="px-6 py-4 text-left">Location</th>
                  <th className="px-6 py-4 text-center">Expiry</th>
                  <th className="px-6 py-4 text-right">Qty on Hand</th>
                  <th className="px-6 py-4 text-right">Reserved</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayBatches.length === 0 ? (
                  <tr><td colSpan="6" className="py-12 text-center text-slate-400 italic">No inventory records found</td></tr>
                ) : (
                  displayBatches.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                            <Package size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">
                              {getMedicineName(b.medicine_id, b)}
                            </p>
                            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">{b.batch_no}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <MapPin size={14} className="text-slate-300" />
                          <span className="text-xs">Main Warehouse</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-medium">
                        {new Date(b.expiry_date).toLocaleDateString([], { month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-slate-900">{b.qty_on_hand}</td>
                      <td className="px-6 py-4 text-right text-slate-400">{b.qty_reserved || 0}</td>
                      <td className="px-6 py-4 text-center">
                        {b.qty_on_hand <= 10 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-[10px] font-black uppercase">
                            <AlertTriangle size={10} /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-100 text-green-700 text-[10px] font-black uppercase">
                            Good
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-slate-50/50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b">
                <tr>
                  <th className="px-6 py-4 text-left">Transaction Details</th>
                  <th className="px-6 py-4 text-center">Date</th>
                  <th className="px-6 py-4 text-center">Type</th>
                  <th className="px-6 py-4 text-right">Change</th>
                  <th className="px-6 py-4 text-right">After Qty</th>
                  <th className="px-6 py-4 text-left">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledger.length === 0 ? (
                  <tr><td colSpan="6" className="py-12 text-center text-slate-400 italic">No ledger entries found</td></tr>
                ) : (
                  ledger.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {getMedicineName(l.medicine_id, l)}
                      </td>
                      <td className="px-6 py-4 text-center text-slate-500">
                        {new Date(l.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${l.txn_type === 'SALE' ? 'bg-blue-100 text-blue-700' :
                          l.txn_type === 'ADJUSTMENT' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                          {l.txn_type}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-right font-bold ${l.qty_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <div className="flex items-center justify-end gap-1">
                          {l.qty_change > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                          {Math.abs(l.qty_change)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-slate-900">{l.qty_after}</td>
                      <td className="px-6 py-4 text-slate-400 italic text-xs">{l.reference_id || 'N/A'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ADJUSTMENT MODAL */}
      <Modal isOpen={isAdjustModalOpen} onClose={() => setIsAdjustModalOpen(false)} title="Manual Stock Adjustment" maxWidth="max-w-xl">
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Select Medicine</label>
              <select
                className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 mb-2 disabled:bg-slate-50"
                value={adjustment.medicine_id}
                disabled={isActionLoading}
                onChange={e => {
                  const mId = e.target.value;
                  setAdjustment(prev => ({ ...prev, medicine_id: mId, batch_id: '' }));
                  setModalBatches([]);
                  fetchModalBatches(mId);
                }}
              >
                {isActionLoading ? (
                  <option>Loading medicines...</option>
                ) : (
                  <>
                    <option value="">Select Medicine</option>
                    {medicines.length > 0 ? (
                      medicines.map(m => (
                        <option key={m.id || m._id} value={m.id || m._id}>
                          {m.brand_name || m.name || m.item_name || 'Medicine ' + (m.id || m._id)?.slice(-4)}
                        </option>
                      ))
                    ) : (
                      <option disabled>No medicines found in database</option>
                    )}
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">
                Target Batch
                <span className="ml-2 text-slate-300 font-normal normal-case">(optional)</span>
              </label>
              {isBatchLoading ? (
                <div className="flex items-center gap-2 px-4 py-3 border rounded-xl text-sm text-slate-400">
                  <Loader2 size={14} className="animate-spin" /> Loading batches...
                </div>
              ) : (
                <select
                  className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 mb-2 disabled:bg-slate-50"
                  value={adjustment.batch_id}
                  disabled={!adjustment.medicine_id}
                  onChange={e => setAdjustment(prev => ({ ...prev, batch_id: e.target.value }))}
                >
                  <option value="">Auto-select (FIFO)</option>
                  {modalBatches.map(b => (
                    <option key={b.id || b.batch_id || b._id} value={b.batch_id || b.id || b._id}>
                      Batch: {b.batch_no} | Stock: {b.qty_on_hand} | Exp: {b.expiry_date ? new Date(b.expiry_date).toLocaleDateString() : 'N/A'}
                    </option>
                  ))}
                </select>
              )}
              {adjustment.medicine_id && !isBatchLoading && modalBatches.length === 0 && (
                <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
                  <p className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                    <Plus size={13} /> Add Initial Stock (New Batch)
                  </p>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Supplier</label>
                    <select className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={newStock.supplier_id} onChange={e => setNewStock(p => ({...p, supplier_id: e.target.value}))}>
                      <option value="">Select Supplier</option>
                      {suppliers.map(s => <option key={s.id||s._id} value={s.id||s._id}>{s.name||s.supplier_name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Batch No</label>
                      <input className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                        placeholder="e.g. BT-001" value={newStock.batch_no}
                        onChange={e => setNewStock(p => ({...p, batch_no: e.target.value}))} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Expiry Date</label>
                      <input type="date" className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                        value={newStock.expiry_date}
                        onChange={e => setNewStock(p => ({...p, expiry_date: e.target.value}))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Quantity</label>
                      <input type="number" min="1" className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                        value={newStock.received_qty}
                        onChange={e => setNewStock(p => ({...p, received_qty: e.target.value}))} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Purchase Rate (₹)</label>
                      <input type="number" min="0" step="0.01" className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                        value={newStock.purchase_rate}
                        onChange={e => setNewStock(p => ({...p, purchase_rate: e.target.value}))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">MRP (₹)</label>
                      <input type="number" min="0" step="0.01" className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                        value={newStock.mrp}
                        onChange={e => setNewStock(p => ({...p, mrp: e.target.value}))} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Selling Price (₹)</label>
                      <input type="number" min="0" step="0.01" className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                        value={newStock.selling_price}
                        onChange={e => setNewStock(p => ({...p, selling_price: e.target.value}))} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Adjustment Type</label>
                <div className="flex p-1 bg-slate-100 rounded-xl gap-1">
                  <button
                    onClick={() => setAdjustment({ ...adjustment, type: 'ADD' })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${adjustment.type === 'ADD' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                  >Increase</button>
                  <button
                    onClick={() => setAdjustment({ ...adjustment, type: 'SUBTRACT' })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${adjustment.type === 'SUBTRACT' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'}`}
                  >Decrease</button>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Quantity</label>
                <input
                  type="number"
                  className="w-full border rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={adjustment.qty_change}
                  onChange={e => setAdjustment({ ...adjustment, qty_change: Number(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Adjustment Reason</label>
              <select
                className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 mb-4"
                value={adjustment.reason}
                onChange={e => setAdjustment({ ...adjustment, reason: e.target.value })}
              >
                <option value="MANUAL_CORRECTION">Inventory Correction</option>
                <option value="STOCK_TAKE">Stock Take</option>
                <option value="DAMAGED">Damaged</option>
                <option value="EXPIRED">Expired</option>
                <option value="RETURN">Customer Return</option>
                <option value="THEFT">Lost / Stolen</option>
              </select>

              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Internal Notes</label>
              <textarea
                className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                rows={3}
                placeholder="Explain why this adjustment is being made..."
                value={adjustment.notes}
                onChange={e => setAdjustment({ ...adjustment, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <button onClick={() => setIsAdjustModalOpen(false)} className="px-6 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-all">Cancel</button>
            {adjustment.medicine_id && !isBatchLoading && modalBatches.length === 0 ? (
              <button
                onClick={handleAddInitialStock}
                disabled={isActionLoading}
                className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {isActionLoading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                Add Initial Stock
              </button>
            ) : (
              <button
                onClick={handleCreateAdjustment}
                disabled={isActionLoading}
                className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {isActionLoading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                Apply Adjustment
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
