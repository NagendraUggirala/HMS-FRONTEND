import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend
} from "recharts";
import {
  IndianRupee,
  TrendingUp,
  Calendar,
  ShoppingCart,
  Download,
  CreditCard,
  Plus,
  Loader2,
  Package,
  User,
  Search,
  Check,
  X,
  FileText,
  Trash2,
  Printer
} from "lucide-react";
import Modal from "../../../../components/common/Modal/Modal";
import {
  getSales,
  getSale,
  createSale,
  addSaleItem,
  completeSale,
  getDashboardOverview,
  getMedicines,
  getSaleReceipt
} from "../../../../services/pharmacyApi";

const COLORS = ["#0ea5e9", "#22c55e", "#8b5cf6", "#f59e0b", "#ef4444", "#64748b"];

export default function SalesTracking() {
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [medicines, setMedicines] = useState([]);

  // Modals
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // New Sale State
  const [newSale, setNewSale] = useState({
    sale_type: "OTC",
    patient_ref: "",
    prescription_id: "",
    billed_via: "PHARMACY_COUNTER",
    payment_method: "CASH",
    notes: "",
    items: [{ medicine_id: "", qty: 1, unit_price: 0, discount: 0 }],
    idempotency_key: ""
  });

  useEffect(() => {
    fetchSales();
    fetchDashboardStats();
    fetchMedicines();
  }, []);

  const fetchSales = async () => {
    setIsLoading(true);
    try {
      const data = await getSales();
      setSales(data.sales || data.items || []);
    } catch (error) {
      toast.error("Failed to fetch sales history");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const data = await getDashboardOverview();
      setDashboardData(data);
    } catch (error) {
      console.error("Failed to fetch dashboard stats", error);
    }
  };

  const fetchMedicines = async () => {
    try {
      const data = await getMedicines(0, 1000);
      const items = Array.isArray(data) ? data : (data?.medicines || data?.items || data?.data || []);
      setMedicines(items.map(m => ({ 
        ...m, 
        id: m.id || m._id, 
        name: m.brand_name || m.name, 
        price: m.sale_price || 0,
        stock: m.stock_level ?? m.qty_on_hand ?? m.quantity ?? m.stock ?? 0
      })));
    } catch (error) {
      console.error("Failed to fetch medicines", error);
    }
  };

  const formatError = (message) => {
    if (!message || typeof message !== "string") return message;
    const stockErrorMatch = message.match(/Insufficient stock for medicine ([\w-]+)/i);
    if (stockErrorMatch) {
      const medId = stockErrorMatch[1];
      const med = medicines.find(m => m.id === medId);
      return `Insufficient stock for ${med ? med.name : `Medicine (${medId.slice(0, 8)})`}. Please check inventory.`;
    }
    return message;
  };

  const handleCreateSale = async () => {
    if (!newSale.items || newSale.items.length === 0) {
      toast.error("Please add at least one medicine to the cart");
      return;
    }
    if (newSale.items.some(it => !it.medicine_id)) {
      toast.error("Please select a medicine for all cart items");
      return;
    }
    setIsActionLoading(true);
    try {
      // Use the single-endpoint createSale with full payload as requested
      const payload = {
        ...newSale,
        patient_ref: newSale.patient_ref || null,
        prescription_id: newSale.prescription_id || null,
        idempotency_key: `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        items: newSale.items.map(it => ({
          medicine_id: it.medicine_id,
          qty: Number(it.qty),
          unit_price: Number(it.unit_price),
          discount: Number(it.discount) || 0
        }))
      };

      const response = await createSale(payload);

      // Auto-complete the sale if possible
      const saleId = response?.id || response?._id || response?.sale_id || response?.sale?.id;
      if (saleId) {
        await completeSale(saleId);
      }

      toast.success("Sale completed successfully!");
      setIsNewSaleModalOpen(false);
      fetchSales();
      fetchDashboardStats();
    } catch (error) {
      toast.error(formatError(error.message) || "Failed to complete sale");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCompleteSaleAction = async (id) => {
    try {
      await completeSale(id);
      toast.success("Sale marked as completed");
      fetchSales();
    } catch (error) {
      toast.error(formatError(error.message) || "Failed to complete sale");
    }
  };

  const handleViewReceipt = async (id) => {
    setIsActionLoading(true);
    try {
      let data;
      try {
        data = await getSaleReceipt(id);
        setSelectedReceipt(data.receipt || data);
      } catch (err) {
        console.warn("Receipt endpoint failed, falling back to getSale:", err);
        data = await getSale(id);
        setSelectedReceipt(data.sale || data.item || data);
      }
    } catch (error) {
      toast.error(error.message || "Failed to generate receipt");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAddItem = () => {
    setNewSale({
      ...newSale,
      items: [...newSale.items, { medicine_id: "", qty: 1, unit_price: 0, discount: 0 }]
    });
  };

  const handleRemoveItem = (idx) => {
    const items = [...newSale.items];
    items.splice(idx, 1);
    setNewSale({ ...newSale, items });
  };

  const handleItemChange = (idx, field, value) => {
    const items = [...newSale.items];

    if (field === 'medicine_id') {
      const med = medicines.find(m => m.id === value);
      items[idx].unit_price = med ? med.price : 0;
    }
    
    if (field === 'qty') {
      const med = medicines.find(m => m.id === items[idx].medicine_id);
      if (med && value > med.stock) {
        toast.warn(`Only ${med.stock} units available for ${med.name}`);
      }
    }

    items[idx][field] = value;
    setNewSale({ ...newSale, items });
  };

  const computedStats = React.useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let todaySales = 0;
    let weekSales = 0;
    let totalSales = 0;
    let validCount = 0;

    sales.forEach(s => {
      if (s.status !== 'COMPLETED') return; // Only count completed sales

      validCount++;
      const amt = Number(s.grand_total || s.total_amount || 0);
      totalSales += amt;

      if (!s.created_at) return;

      if (s.created_at.startsWith(todayStr)) {
        todaySales += amt;
      }

      const saleDate = new Date(s.created_at);
      if (saleDate >= sevenDaysAgo) {
        weekSales += amt;
      }
    });

    return {
      today_sales: `₹${todaySales.toLocaleString()}`,
      week_sales: `₹${weekSales.toLocaleString()}`,
      total_count: validCount,
      avg_sale: `₹${validCount > 0 ? Math.round(totalSales / validCount).toLocaleString() : 0}`
    };
  }, [sales]);

  const computedChartData = React.useMemo(() => {
    // 1. Daily Revenue Trend (last 7 days)
    const trendMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const displayStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      trendMap[dateStr] = { date: displayStr, amount: 0 };
    }

    // 2. Categories mapping (Using sale_type as proxy for category)
    const catMap = {};

    sales.forEach(s => {
      if (s.status !== 'COMPLETED') return; // Only count completed sales in charts

      const dateStr = s.created_at ? s.created_at.split('T')[0] : null;
      const amt = Number(s.grand_total || s.total_amount || s.total || 0);

      if (dateStr && trendMap[dateStr]) {
        trendMap[dateStr].amount += amt;
      }

      const saleItems = s.items || s.sale_items || s.items_sold || [];
      if (Array.isArray(saleItems) && saleItems.length > 0) {
        saleItems.forEach(item => {
          const category = item.medicine?.category || item.category || item.medicine_category || s.sale_type || 'Uncategorized';
          const qty = Number(item.qty ?? item.quantity ?? 0);
          const price = Number(item.unit_price ?? item.price ?? item.sale_price ?? item.amount ?? 0);
          const discount = Number(item.discount ?? 0);
          const itemTotal = Math.max(0, qty * price - discount);
          if (!catMap[category]) catMap[category] = { category, amount: 0, count: 0 };
          catMap[category].amount += itemTotal;
          catMap[category].count += qty || 1;
        });
      } else {
        const category = s.sale_type || 'OTC';
        if (!catMap[category]) catMap[category] = { category, amount: 0, count: 0 };
        catMap[category].amount += amt;
        catMap[category].count += 1;
      }
    });

    const category_sales = Object.values(catMap)
      .sort((a, b) => b.amount - a.amount)
      .map(item => ({
        ...item,
        amount: Number(item.amount)
      }));

    return {
      sales_trend: Object.values(trendMap),
      category_sales: category_sales.length > 0 ? category_sales : [{ category: "No Data", count: 1 }]
    };
  }, [sales]);

  const dData = dashboardData || {};
  const stats = computedStats;

  return (
    <div className="bg-slate-100 min-h-screen space-y-6 px-3 sm:px-6 py-4">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Sales Tracking</h1>
          <p className="text-slate-500 text-sm sm:text-base">
            Manage pharmacy dispensing and revenue history
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setNewSale({
                sale_type: "OTC",
                patient_ref: "",
                prescription_id: "",
                billed_via: "PHARMACY_COUNTER",
                payment_method: "CASH",
                notes: "",
                items: [{ medicine_id: "", qty: 1, unit_price: 0, discount: 0 }],
                idempotency_key: ""
              });
              setIsNewSaleModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
          >
            <Plus size={18} />
            New Dispense
          </button>
          <button
            onClick={() => toast.success("Exporting report...")}
            className="flex items-center justify-center gap-2 bg-white text-slate-700 px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 shadow-sm transition-all"
          >
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      {/* ANALYTICS STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsStat
          title="Today's Sales"
          value={stats.today_sales || "₹0"}
          percent="+8%"
          icon={IndianRupee}
          iconBg="bg-green-600"
          gradient="from-green-50"
          lineColor="#22c55e"
          linePoints="0,30 12,26 24,22 36,24 48,18 60,12"
        />

        <AnalyticsStat
          title="This Week"
          value={stats.week_sales || "₹0"}
          percent="+12%"
          icon={TrendingUp}
          iconBg="bg-blue-600"
          gradient="from-blue-50"
          bars={[8, 10, 12, 9, 14]}
        />

        <AnalyticsStat
          title="Total Transactions"
          value={stats.total_count || "0"}
          percent="+15%"
          icon={ShoppingCart}
          iconBg="bg-purple-600"
          gradient="from-purple-50"
          lineColor="#8b5cf6"
          linePoints="0,28 12,24 24,20 36,22 48,16 60,10"
        />

        <AnalyticsStat
          title="Avg. Transaction"
          value={stats.avg_sale || "₹0"}
          percent="+5%"
          icon={Package}
          iconBg="bg-yellow-500"
          gradient="from-yellow-50"
          bars={[6, 7, 8, 7, 9]}
        />
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-500" /> Daily Revenue Trend
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={computedChartData.sales_trend} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} tick={{ fill: '#64748b' }} />
                <YAxis fontSize={12} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} tick={{ fill: '#64748b' }} tickFormatter={(value) => `₹${value}`} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  cursor={{ fill: '#f1f5f9' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#64748b', paddingTop: '10px' }} />
                <Bar name="Revenue" dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Package size={18} className="text-purple-500" /> Top Categories
          </h2>
          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={computedChartData.category_sales}
                  dataKey="amount"
                  nameKey="category"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                >
                  {computedChartData.category_sales.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-slate-800">{computedChartData.category_sales.length}</span>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Groups</span>
            </div>
          </div>
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">Recent Transactions</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by ID or Patient..."
              className="pl-10 pr-4 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-slate-50/50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4 text-left">Sale Number</th>
                <th className="px-6 py-4 text-left">Patient Ref</th>
                <th className="px-6 py-4 text-center">Date & Time</th>
                <th className="px-6 py-4 text-right">Grand Total</th>
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
                      <p className="font-medium">Fetching transactions...</p>
                    </div>
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center text-slate-500">
                    No sales recorded yet.
                  </td>
                </tr>
              ) : (
                sales.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-indigo-600">
                      {t.sale_number || `#${t.id.slice(0, 8)}`}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                          <User size={14} />
                        </div>
                        <span className="font-medium text-slate-700">{t.patient_ref || "OTC Customer"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-slate-500">
                      {new Date(t.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">
                      ₹{Number(t.grand_total).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${t.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : t.status === 'VOIDED' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-1">
                        {t.status === 'DRAFT' && (
                          <button
                            onClick={() => handleCompleteSaleAction(t.id)}
                            title="Complete Sale"
                            className="p-2 hover:bg-green-50 text-slate-400 hover:text-green-600 rounded-lg transition-all"
                          >
                            <Check size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleViewReceipt(t.id)}
                          title="View Receipt"
                          className="p-2 hover:bg-white hover:shadow-sm text-slate-400 hover:text-indigo-600 rounded-lg transition-all"
                        >
                          <FileText size={18} />
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

      {/* NEW DISPENSE MODAL */}
      <Modal isOpen={isNewSaleModalOpen} onClose={() => setIsNewSaleModalOpen(false)} title="New Pharmacy Dispense (POS)" maxWidth="max-w-4xl">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sale Type</label>
              <select
                className="w-full border rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={newSale.sale_type}
                onChange={e => setNewSale({ ...newSale, sale_type: e.target.value })}
              >
                <option value="OTC">OTC (Over the Counter)</option>
                <option value="PRESCRIPTION">Prescription</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Patient ID / Ref</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="e.g. PAT-1001"
                  className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={newSale.patient_ref}
                  onChange={e => setNewSale({ ...newSale, patient_ref: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Prescription ID</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="RX-2001 (Optional)"
                  className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={newSale.prescription_id}
                  onChange={e => setNewSale({ ...newSale, prescription_id: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Billed Via</label>
              <select
                className="w-full border rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={newSale.billed_via}
                onChange={e => setNewSale({ ...newSale, billed_via: e.target.value })}
              >
                <option value="PHARMACY_COUNTER">Pharmacy Counter</option>
                <option value="IPD_WARD">IPD Ward Billing</option>
                <option value="ONLINE">Online Order</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Payment Method</label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select
                  className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={newSale.payment_method}
                  onChange={e => setNewSale({ ...newSale, payment_method: e.target.value })}
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI / QR Scan</option>
                  <option value="CARD">Debit/Credit Card</option>
                  <option value="CREDIT">Credit / Insurance</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2 border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                <ShoppingCart size={16} className="text-indigo-600" /> Cart Items
              </h3>
              <button onClick={handleAddItem} className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-lg transition-all">
                <Plus size={12} /> Add Medicine
              </button>
            </div>

            <div className="max-h-[250px] overflow-y-auto pr-2 space-y-2">
              {newSale.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 group">
                  <div className="flex-1 min-w-[200px]">
                    <select
                      className="w-full bg-white border rounded-lg p-2 text-sm outline-none"
                      value={item.medicine_id}
                      onChange={e => handleItemChange(idx, 'medicine_id', e.target.value)}
                    >
                      <option value="">Select Medicine</option>
                      {medicines.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} - ₹{m.price}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-20">
                    <input
                      type="number"
                      min="1"
                      className="w-full border border-slate-200 rounded-lg p-2 text-sm text-center outline-none"
                      value={item.qty}
                      onChange={e => handleItemChange(idx, 'qty', Number(e.target.value))}
                    />
                  </div>
                  <div className="w-24 text-right">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Total</p>
                    <p className="text-sm font-black text-slate-700">₹{(item.qty * item.unit_price).toLocaleString()}</p>
                  </div>
                  <button onClick={() => handleRemoveItem(idx)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Internal Notes</label>
            <textarea
              className="w-full border rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
              rows={2}
              placeholder="Add any specific instructions or notes..."
              value={newSale.notes}
              onChange={e => setNewSale({ ...newSale, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button onClick={() => setIsNewSaleModalOpen(false)} className="px-6 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-all">
              Cancel
            </button>
            <button
              onClick={handleCreateSale}
              disabled={isActionLoading}
              className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {isActionLoading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              Complete Sale & Print
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!selectedReceipt} onClose={() => setSelectedReceipt(null)} title="Sale Receipt" maxWidth="max-w-2xl">
        {selectedReceipt && (
          <div id="receipt-print-area" className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-slate-800">Hospital Pharmacy</h2>
              <p className="text-slate-500">Sale Receipt</p>
              <p className="font-bold text-indigo-600 mt-2">{selectedReceipt.sale_number}</p>
            </div>

            <div className="flex justify-between border-b pb-4 mb-4 text-sm text-slate-600">
              <div>
                <p><span className="font-bold text-slate-700">Date:</span> {new Date(selectedReceipt.created_at).toLocaleString()}</p>
                <p><span className="font-bold text-slate-700">Patient:</span> {selectedReceipt.patient_ref || 'OTC'}</p>
              </div>
              <div className="text-right">
                <p><span className="font-bold text-slate-700">Payment:</span> {selectedReceipt.payment_method}</p>
                <p><span className="font-bold text-slate-700">Status:</span> {selectedReceipt.status}</p>
              </div>
            </div>

            <table className="w-full text-sm mb-6">
              <thead className="bg-slate-50 text-slate-500 text-left border-b">
                <tr>
                  <th className="py-2 px-2">Item</th>
                  <th className="py-2 px-2 text-center">Qty</th>
                  <th className="py-2 px-2 text-center">Stock</th>
                  <th className="py-2 px-2 text-right">Price</th>
                  <th className="py-2 px-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(selectedReceipt.sale_items || selectedReceipt.items || []).map((it, idx) => {
                   const medId = it.medicine?.id || it.medicine_id || it.id;
                   const med = medicines.find(m => m.id === medId);
                   const isShort = med && med.stock < Number(it.qty || it.quantity);
                   return (
                    <tr key={idx}>
                      <td className="py-2 px-2 font-medium">{it.medicine?.brand_name || it.medicine?.name || it.medicine_name || 'Unknown Medicine'}</td>
                      <td className="py-2 px-2 text-center font-bold">{Number(it.qty || it.quantity)}</td>
                      <td className={`py-2 px-2 text-center ${isShort ? 'text-red-600 font-bold' : 'text-slate-400'}`}>{med ? med.stock : '-'}</td>
                      <td className="py-2 px-2 text-right">₹{Number(it.unit_price).toLocaleString()}</td>
                      <td className="py-2 px-2 text-right font-bold text-slate-800">₹{(Number(it.qty || it.quantity) * Number(it.unit_price)).toLocaleString()}</td>
                    </tr>
                   );
                })}
              </tbody>
            </table>

            <div className="flex justify-end pt-4 border-t border-slate-200">
              <div className="text-right">
                <p className="text-slate-500 text-sm">Grand Total</p>
                <p className="text-2xl font-black text-indigo-600">₹{Number(selectedReceipt.grand_total).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
        <div className="flex justify-end mt-4 gap-2">
          <button onClick={() => setSelectedReceipt(null)} className="px-4 py-2 border rounded-lg font-bold text-slate-600 hover:bg-slate-50">Close</button>
          <button onClick={() => {
            const printContent = document.getElementById('receipt-print-area').innerHTML;
            const printWindow = window.open('', '', 'width=800,height=600');
            printWindow.document.write(`
              <html>
                <head>
                  <title>Print Receipt</title>
                  <script src="https://cdn.tailwindcss.com"></script>
                </head>
                <body class="p-8" onload="setTimeout(function(){ window.print(); window.close(); }, 1000)">
                  ${printContent}
                </body>
              </html>
            `);
            printWindow.document.close();
          }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2"><Printer size={16} /> Print</button>
        </div>
      </Modal>

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
  bars,
  linePoints,
  lineColor = "#2563eb",
}) => (
  <div
    className="relative bg-white rounded-xl p-5 border border-gray-200 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition"
  >
    <div
      className={`absolute inset-0 bg-gradient-to-br ${gradient} to-transparent pointer-events-none`}
    />
    <span className="absolute top-4 right-4 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm shadow-green-100">
      {percent}
    </span>

    <div className="relative flex justify-between items-end">
      <div>
        <div
          className={`w-10 h-10 flex items-center justify-center rounded-xl ${iconBg} mb-3 shadow-lg shadow-slate-100`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-black text-slate-800 mt-1">{value}</p>
      </div>

      {bars && (
        <div className="flex items-end gap-1 h-12">
          {bars.map((h, i) => (
            <div
              key={i}
              style={{ height: `${h * 3}px` }}
              className="w-1.5 bg-indigo-500/20 rounded-full"
            />
          ))}
        </div>
      )}

      {linePoints && (
        <svg width="60" height="30" viewBox="0 0 60 30" className="mb-1">
          <polyline
            points={linePoints}
            fill="none"
            stroke={lineColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  </div>
);
