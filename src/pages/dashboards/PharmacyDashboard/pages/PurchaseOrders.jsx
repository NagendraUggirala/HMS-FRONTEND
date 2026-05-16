import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Clock,
  CheckCircle,
  Truck,
  IndianRupee,
  Plus,
  Eye,
  Loader2,
  Package,
  Calendar,
  X,
  Send,
  Check,
  Ban,
  ArrowRight,
  Trash2,
  AlertCircle,
  Building2,
  ChevronRight,
  FileText,
  Search,
  ShoppingCart
} from "lucide-react";
import Modal from "../../../../components/common/Modal/Modal";
import {
  getPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  updatePurchaseOrder,
  submitPurchaseOrder,
  approvePurchaseOrder,
  sendPurchaseOrder,
  cancelPurchaseOrder,
  deletePurchaseOrder,
  getSuppliers,
  getMedicines,
  getDashboardOverview
} from "../../../../services/pharmacyApi";

const PO_STATUSES = [
  { value: "DRAFT", label: "Draft", color: "bg-slate-100 text-slate-700 border-slate-200" },
  { value: "PENDING", label: "Submitted", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "APPROVED", label: "Approved", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { value: "SENT", label: "Sent", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "RECEIVED", label: "Received", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { value: "CANCELLED", label: "Cancelled", color: "bg-rose-100 text-rose-700 border-rose-200" }
];

export default function PurchaseOrders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [mode, setMode] = useState("create"); // create | edit
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Data for creation
  const [suppliers, setSuppliers] = useState([]);
  const [medicines, setMedicines] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    supplier_id: "",
    expected_date: "",
    notes: "",
    items: [{ medicine_id: "", ordered_qty: 1, purchase_rate: 0 }]
  });

  useEffect(() => {
    fetchOrders();
    fetchSuppliersAndMedicines();
  }, []);


  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const data = await getPurchaseOrders();
      const items = Array.isArray(data) ? data : (data?.purchase_orders || data?.items || data?.data || []);
      setOrders(items);
    } catch (error) {
      toast.error(error.message || "Failed to fetch purchase orders");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuppliersAndMedicines = async () => {
    try {
      const [supData, medData] = await Promise.all([
        getSuppliers(0, 1000),
        getMedicines(0, 1000)
      ]);
      
      console.log("[PurchaseOrders] Suppliers Raw:", supData);
      console.log("[PurchaseOrders] Medicines Raw:", medData);

      const sItems = Array.isArray(supData) ? supData : (supData?.suppliers || supData?.items || supData?.data || []);
      const mItems = Array.isArray(medData) ? medData : (medData?.medicines || medData?.items || medData?.data || []);
      
      setSuppliers(sItems);
      setMedicines(mItems);
    } catch (error) {
      console.error("Failed to fetch supporting data", error);
      toast.error("Failed to load suppliers/medicines list");
    }
  };

  const getSupplierName = (id) => {
    const sup = suppliers.find(s => (s.id || s._id) === id);
    return sup ? (sup.name || sup.supplier_name) : null;
  };

  const handleOpenCreateModal = () => {
    setMode("create");
    setFormData({
      supplier_id: "",
      expected_date: "",
      notes: "",
      items: [{ medicine_id: "", ordered_qty: 1, purchase_rate: 0 }]
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (order) => {
    console.log("[PurchaseOrders] Opening Edit Modal for:", order);
    setMode("edit");
    
    let fullOrder = order;
    // If the list view doesn't have items, fetch the full order
    if (!order.items || order.items.length === 0) {
      setIsActionLoading(true);
      try {
        const data = await getPurchaseOrder(order.id || order._id);
        fullOrder = data.purchase_order || data;
      } catch (error) {
        toast.error("Failed to fetch full order details for editing");
        setIsActionLoading(false);
        return;
      }
      setIsActionLoading(false);
    }

    setSelectedOrder(fullOrder);
    setFormData({
      supplier_id: fullOrder.supplier_id || "",
      expected_date: fullOrder.expected_date ? fullOrder.expected_date.split('T')[0] : "",
      notes: fullOrder.notes || "",
      items: (fullOrder.items || []).map(it => ({
        medicine_id: it.medicine_id,
        ordered_qty: it.ordered_qty,
        purchase_rate: it.purchase_rate
      }))
    });
    setIsModalOpen(true);
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { medicine_id: "", ordered_qty: 1, purchase_rate: 0 }]
    });
  };

  const handleRemoveItem = (index) => {
    const items = [...formData.items];
    items.splice(index, 1);
    setFormData({ ...formData, items });
  };

  const handleItemChange = (index, field, value) => {
    const items = [...formData.items];
    if (field === 'medicine_id') {
      const med = medicines.find(m => (m.id || m._id) === value);
      items[index] = { 
        ...items[index], 
        [field]: value, 
        purchase_rate: med?.unit_price || med?.price || 0 
      };
    } else {
      items[index] = { ...items[index], [field]: value };
    }
    setFormData({ ...formData, items });
  };

  const handleSaveOrder = async () => {
    console.log("[PurchaseOrders] Saving Order. Data:", formData);
    if (!formData.supplier_id || formData.items.some(it => !it.medicine_id)) {
      toast.error("Please select a supplier and medicines");
      return;
    }
    
    const payload = {
      ...formData,
      items: formData.items.map(it => ({
        ...it,
        ordered_qty: parseInt(it.ordered_qty),
        purchase_rate: parseFloat(it.purchase_rate)
      }))
    };

    setIsActionLoading(true);
    try {
      if (mode === "edit") {
        await updatePurchaseOrder(selectedOrder.id || selectedOrder._id, payload);
        toast.success("Purchase order updated");
      } else {
        await createPurchaseOrder(payload);
        toast.success("Purchase order created as DRAFT");
      }
      setIsModalOpen(false);
      fetchOrders();
    } catch (error) {
      toast.error(error.message || "Failed to save order");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleViewOrder = async (id) => {
    setIsActionLoading(true);
    try {
      const data = await getPurchaseOrder(id);
      setSelectedOrder(data.purchase_order || data);
      setIsViewModalOpen(true);
    } catch (error) {
      toast.error("Failed to fetch order details");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handlePOAction = async (action, id) => {
    console.log("[PurchaseOrders] Executing Action:", action, "ID:", id);
    setIsActionLoading(true);
    try {
      if (action === 'submit') await submitPurchaseOrder(id);
      else if (action === 'approve') await approvePurchaseOrder(id);
      else if (action === 'send') await sendPurchaseOrder(id);
      else if (action === 'cancel') {
        const reason = prompt("Enter cancellation reason:");
        if (!reason) return;
        await cancelPurchaseOrder(id, reason);
      } else if (action === 'delete') {
        if (!window.confirm("Are you sure? This action cannot be undone.")) return;
        await deletePurchaseOrder(id);
      }
      toast.success(`Order ${action}ed successfully`);
      setIsViewModalOpen(false);
      fetchOrders();
    } catch (error) {
      toast.error(error.message || `Failed to ${action} order`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const getStatusDisplay = (status) => {
    return PO_STATUSES.find(s => s.value === status) || { label: status, color: "bg-gray-100 text-gray-700" };
  };

  const stats = React.useMemo(() => {
    return {
      totalOrders: orders.length,
      pendingApproval: orders.filter(o => o.status === "PENDING").length,
      expectedDeliveries: orders.filter(o => o.status === "SENT").length,
      totalValue: orders.reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0)
    };
  }, [orders]);

  return (
    <div className="bg-slate-50 min-h-screen space-y-6 px-3 sm:px-6 py-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Purchase Orders</h1>
          <p className="text-slate-500 text-sm">Create and track procurement orders from suppliers</p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95 font-bold"
        >
          <Plus size={20} />
          Create New Order
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsStat
          title="Total Orders"
          value={stats.totalOrders}
          percent="+12%"
          icon={ShoppingCart}
          iconBg="bg-blue-500"
          gradient="from-blue-50"
        />
        <AnalyticsStat
          title="Pending Approval"
          value={stats.pendingApproval}
          percent="+5%"
          icon={Clock}
          iconBg="bg-amber-500"
          gradient="from-amber-50"
        />
        <AnalyticsStat
          title="Expected Deliveries"
          value={stats.expectedDeliveries}
          percent="+8%"
          icon={Truck}
          iconBg="bg-emerald-500"
          gradient="from-emerald-50"
        />
        <AnalyticsStat
          title="Total PO Value"
          value={`₹${stats.totalValue.toLocaleString()}`}
          percent="+15%"
          icon={IndianRupee}
          iconBg="bg-indigo-500"
          gradient="from-indigo-50"
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b">
              <tr>
                <th className="px-6 py-4">PO Number</th>
                <th className="px-6 py-4">Supplier</th>
                <th className="px-6 py-4">Expected Date</th>
                <th className="px-6 py-4 text-right">Amount</th>
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
                      <p className="font-medium">Loading orders...</p>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center text-slate-500 italic">
                    No purchase orders found.
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const status = getStatusDisplay(o.status);
                  return (
                    <tr key={o.id || o._id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="px-6 py-4">
                        <span className="font-black text-indigo-600 font-mono tracking-tighter">
                          {o.po_number || `#${(o.id || o._id).slice(-6).toUpperCase()}`}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-700">
                        {o.supplier_name || getSupplierName(o.supplier_id) || "Unknown Supplier"}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {o.expected_date ? new Date(o.expected_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-slate-800">
                        ₹{(o.total_amount || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => handleViewOrder(o.id || o._id)}
                            className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          {o.status === 'DRAFT' && (
                            <>
                              <button
                                onClick={() => handleOpenEditModal(o)}
                                className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                                title="Edit"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={() => handlePOAction('delete', o.id || o._id)}
                                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={mode === 'edit' ? 'Modify Purchase Order' : 'Create New Purchase Order'}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-8 max-h-[70vh] overflow-y-auto px-1 pr-3 custom-scrollbar">
          {/* Header Info */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Select Supplier</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select
                  value={formData.supplier_id}
                  onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm bg-white"
                >
                  <option value="">Choose a supplier...</option>
                  {suppliers.map(s => <option key={s.id || s._id} value={s.id || s._id}>{s.name || s.supplier_name}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Expected Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="date"
                  value={formData.expected_date}
                  onChange={(e) => setFormData({ ...formData, expected_date: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                />
              </div>
            </div>
          </section>

          {/* Items Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <ShoppingCart className="text-indigo-600" size={18} />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Order Items</h3>
              </div>
              <button
                onClick={handleAddItem}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <Plus size={14} /> Add Item
              </button>
            </div>

            <div className="space-y-3">
              {formData.items.map((item, idx) => (
                <div key={idx} className="flex flex-col md:flex-row gap-3 items-end bg-slate-50 p-4 rounded-2xl border border-slate-100 group relative">
                  <div className="flex-1 space-y-1.5 w-full">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Medicine</label>
                    <select
                      value={item.medicine_id}
                      onChange={(e) => handleItemChange(idx, 'medicine_id', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm outline-none bg-white focus:ring-2 focus:ring-indigo-500/10"
                    >
                      <option value="">Select Medicine</option>
                      {medicines.map(m => (
                        <option key={m.id || m._id} value={m.id || m._id}>
                          {m.brand_name || m.name} ({m.strength || 'N/A'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-full md:w-32 space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={item.ordered_qty}
                      onChange={(e) => handleItemChange(idx, 'ordered_qty', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/10"
                    />
                  </div>

                  <div className="w-full md:w-32 space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Rate (₹)</label>
                    <input
                      type="number"
                      value={item.purchase_rate}
                      onChange={(e) => handleItemChange(idx, 'purchase_rate', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/10"
                    />
                  </div>

                  <div className="w-full md:w-24 space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Total</label>
                    <div className="px-3 py-2 bg-white border rounded-lg text-sm font-bold text-slate-700">
                      ₹{(item.ordered_qty * item.purchase_rate).toLocaleString()}
                    </div>
                  </div>

                  {formData.items.length > 1 && (
                    <button
                      onClick={() => handleRemoveItem(idx)}
                      className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex justify-end pt-2">
               <div className="bg-indigo-50 px-6 py-3 rounded-2xl border border-indigo-100 flex items-center gap-4">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Grand Total</span>
                  <span className="text-xl font-black text-indigo-900 font-mono">
                    ₹{formData.items.reduce((sum, it) => sum + (it.ordered_qty * it.purchase_rate), 0).toLocaleString()}
                  </span>
               </div>
            </div>
          </section>

          {/* Notes */}
          <section className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Additional Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Instructions for supplier, terms, etc."
              rows={3}
              className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
            />
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
          <button
            onClick={handleSaveOrder}
            disabled={isActionLoading}
            className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {isActionLoading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            {mode === 'edit' ? 'Update Order' : 'Create Draft'}
          </button>
        </div>
      </Modal>

      {/* VIEW / ACTION MODAL */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Purchase Order: ${selectedOrder?.po_number || 'Details'}`}
        maxWidth="max-w-4xl"
      >
        {selectedOrder && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Supplier</label>
                  <p className="text-lg font-black text-slate-800">{selectedOrder.supplier_name}</p>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Status</label>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border mt-1 ${getStatusDisplay(selectedOrder.status).color}`}>
                      {getStatusDisplay(selectedOrder.status).label}
                    </span>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Expected Date</label>
                    <p className="font-bold text-slate-700">{new Date(selectedOrder.expected_date).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="text-right flex flex-col justify-between items-end">
                <div>
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total PO Value</label>
                   <p className="text-3xl font-black text-indigo-600 font-mono">₹{selectedOrder.total_amount?.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                   <Calendar size={14} />
                   <span className="text-[10px] font-bold uppercase tracking-tighter">Created: {new Date(selectedOrder.created_at || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
               <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b pb-2">Line Items</h3>
               <div className="bg-white rounded-xl border overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase">
                      <tr>
                        <th className="px-4 py-3">Item</th>
                        <th className="px-4 py-3 text-center">Qty</th>
                        <th className="px-4 py-3 text-right">Rate</th>
                        <th className="px-4 py-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedOrder.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 font-bold text-slate-700">{it.medicine_name || it.medicine_id}</td>
                          <td className="px-4 py-3 text-center">{it.ordered_qty}</td>
                          <td className="px-4 py-3 text-right">₹{it.purchase_rate?.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-bold">₹{(it.ordered_qty * it.purchase_rate).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>

            {selectedOrder.notes && (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                <FileText className="text-amber-600 shrink-0" size={18} />
                <div>
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">Order Notes</p>
                  <p className="text-sm text-amber-800">{selectedOrder.notes}</p>
                </div>
              </div>
            )}

            {/* ACTION FOOTER */}
            <div className="flex flex-wrap justify-end gap-3 pt-6 border-t">
              {selectedOrder.status === 'DRAFT' && (
                <button
                  onClick={() => handlePOAction('submit', selectedOrder.id || selectedOrder._id)}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-100 transition-all active:scale-95"
                >
                  <Send size={18} /> Submit for Approval
                </button>
              )}
              {selectedOrder.status === 'PENDING' && (
                <button
                  onClick={() => handlePOAction('approve', selectedOrder.id || selectedOrder._id)}
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 flex items-center gap-2 shadow-lg shadow-emerald-100 transition-all active:scale-95"
                >
                  <Check size={18} /> Approve PO
                </button>
              )}
              {selectedOrder.status === 'APPROVED' && (
                <button
                  onClick={() => handlePOAction('send', selectedOrder.id || selectedOrder._id)}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-100 transition-all active:scale-95"
                >
                  <Package size={18} /> Send to Supplier
                </button>
              )}
              {['DRAFT', 'PENDING', 'APPROVED'].includes(selectedOrder.status) && (
              <button
  onClick={() => handlePOAction('cancel', selectedOrder.id || selectedOrder._id)}
  className="px-6 py-2.5 bg-rose-50 text-rose-600 rounded-xl font-bold hover:bg-rose-100 transition-all flex items-center gap-2"
>
  <Ban size={18} />
  <span>Cancel Order</span>
</button>
              )}
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        )}
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

const AnalyticsStat = ({
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

const Pencil = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
  </svg>
);
