import React, { useState } from "react";
import { toast } from "react-toastify";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";

import {
  Pill,
  IndianRupee,
  AlertTriangle,
  Truck,
  ShoppingCart,
  CheckCircle,
  AlertCircle,
  RefreshCcw,
  Plus,
  Calendar,
  Package,
  Filter,
  Download,
  Printer,
  X,
  Loader2,
} from "lucide-react";

import Modal from "../../../../components/common/Modal/Modal";
import {
  getDashboardOverview,
  getSuppliers,
  getMedicines,
  getSales,
  getSalesSummary,
  getAlerts,
  createPurchaseOrder,
  getStockBatches
} from "../../../../services/pharmacyApi";



export default function Dashboard({ onPageChange }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [orderItems, setOrderItems] = useState([]);


  const [dashboardData, setDashboardData] = useState(null);
  const [activeSuppliersCount, setActiveSuppliersCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [suppliersListState, setSuppliersListState] = useState([]);
  const [medicinesListState, setMedicinesListState] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);

        const fromDate = sevenDaysAgo.toISOString().split('T')[0];
        const toDate = today.toISOString().split('T')[0];

        const safeFetch = async (promise, name) => {
          try {
            const res = await promise;
            return res;
          } catch (e) {
            console.error(`[Dashboard] ${name} API failed:`, e);
            return null;
          }
        };

        const [response, suppliersRes, medicinesRes, salesRes, salesSummaryRes, alertsRes, lowStockRes] = await Promise.all([
          safeFetch(getDashboardOverview(), "Overview"),
          safeFetch(getSuppliers(), "Suppliers"),
          safeFetch(getMedicines(0, 1000), "Medicines"),
          safeFetch(getSales("", "Completed", "", "", 0, 5), "Sales"),
          safeFetch(getSalesSummary(fromDate, toDate, 'day'), "SalesSummary"),
          safeFetch(getAlerts(0, 5, 'EXPIRY', 'PENDING'), "Alerts"),
          safeFetch(getStockBatches(undefined, true, null, 0, 1000), "LowStock")
        ]);

        // 1. Process Overview Data
        const data = response?.overview || response?.stats || response?.data || response || {};

        // 1.1 Process Low Stock Data from dedicated endpoint
        const rawLowStock = lowStockRes?.batches || lowStockRes?.items || (Array.isArray(lowStockRes) ? lowStockRes : []) || [];
        const medicineList = medicinesRes?.medicines || medicinesRes?.items || (Array.isArray(medicinesRes) ? medicinesRes : []) || [];
        
        const formattedLowStock = rawLowStock
          .filter(item => (item.qty_on_hand ?? item.quantity ?? 0) <= 10) // Strict filter for low stock
          .slice(0, 5)
          .map(item => {
             const medId = item.medicine_id || item.id;
             const masterMed = medicineList.find(m => (m.id || m._id) === medId);
             return {
                name: item.brand_name || item.medicine_name || item.medicine?.brand_name || item.medicine?.name || item.item_name || item.name || masterMed?.name || masterMed?.brand_name || masterMed?.brand_name || `Medicine (${(medId || '').toString().slice(-6)})`,
                category: item.medicine?.category || item.category || masterMed?.category || 'General',
                stock: item.qty_on_hand ?? item.quantity ?? 0,
                status: (item.qty_on_hand ?? item.quantity) <= 5 ? 'Critical' : 'Low'
             };
          });

        // ... previous logic for combined activity ...
        const apiActivity = Array.isArray(data.recent_activity || data.recentActivity) ? (data.recent_activity || data.recentActivity) : [];
        const medicineActivity = (Array.isArray(medicineList) ? medicineList : []).slice(0, 3).map(m => ({
          title: "New Medicine Added",
          desc: `${m?.brand_name || m?.name || 'Unknown medicine'} added`,
          type: "medicine",
          time: "Recently"
        }));
        const salesList = salesRes?.sales || salesRes?.items || (Array.isArray(salesRes) ? salesRes : []) || [];
        const saleActivity = (Array.isArray(salesList) ? salesList : []).slice(0, 3).map(s => ({
          title: "Medicine Sold",
          desc: `Sale #${s?.id?.toString().slice(-6) || 'N/A'} for ₹${s?.total_amount || 0}`,
          type: "sale",
          time: "Recently"
        }));
        const combinedActivity = [...apiActivity, ...medicineActivity, ...saleActivity].slice(0, 8);

        // ... previous logic for chart data ...
        const salesSummary = salesSummaryRes?.summary || (Array.isArray(salesSummaryRes) ? salesSummaryRes : []) || [];
        const chartSalesData = (Array.isArray(salesSummary) ? salesSummary : []).map(item => ({
          day: item?.period || item?.day || item?.date || "N/A",
          sales: Number(item?.total_sales || item?.sales || item?.amount || 0)
        }));

        // 3.5 Process Expiry Alerts
        const rawAlerts = alertsRes?.items || alertsRes?.data || (Array.isArray(alertsRes) ? alertsRes : []) || [];
        // Sort by creation date to show most recent alerts first
        const sortedAlerts = [...rawAlerts].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        
        const formattedAlerts = sortedAlerts.slice(0, 5).map(item => {
          const meta = item.metadata || {};
          const daysLeft = meta.days_left ?? item.days_left ?? item.days_until_expiry ?? 0;
          return {
            name: meta.medicine_name || item.name || item.item_name || 'Unknown',
            batch: meta.batch_number || item.batch_number || item.batch || 'N/A',
            days: `${daysLeft} days`,
            danger: daysLeft <= 15
          };
        });

        const filteredRawLowStock = rawLowStock.filter(item => (item.qty_on_hand ?? item.quantity ?? 0) <= 10);
        const totalLowStock = filteredRawLowStock.length;

        setDashboardData({
          ...data,
          recent_activity: combinedActivity,
          sales_data: chartSalesData,
          low_stock_count: totalLowStock,
          expiry_alerts: formattedAlerts.length > 0 ? formattedAlerts : (data.expiry_alerts || data.expiryAlerts || []),
          low_stock_list: formattedLowStock.length > 0 ? formattedLowStock : (data.low_stock_list || data.lowStockList || [])
        });

        // 4. Process Suppliers Count
        const suppliersList = suppliersRes?.suppliers || suppliersRes?.items || suppliersRes?.data || (Array.isArray(suppliersRes) ? suppliersRes : []) || [];
        setSuppliersListState(suppliersList);
        setMedicinesListState(medicineList);
        const activeCount = (Array.isArray(suppliersList) ? suppliersList : []).filter(s =>
          s &&
          !s.is_deleted &&
          s.status !== 'Inactive' &&
          s.status !== 'Deleted' &&
          s.status !== 'Archived'
        ).length;
        setActiveSuppliersCount(activeCount);

      } catch (err) {
        console.error("[Dashboard] Processing Error:", err);
        // Don't show toast for every minor issue, just log it
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const dData = dashboardData || {};
  const tMedicines = dData.medicines_count ?? dData.total_medicines_count ?? dData.total_medicines ?? dData.totalMedicines ?? "0";
  const tSales = dData.sales_today_count ?? dData.todays_sales ?? dData.todaysSales ?? "0";
  const lStock = dData.low_stock_count ?? dData.low_stock_items ?? dData.lowStockItems ?? "0";
  const aSuppliers = activeSuppliersCount || "0";

  const rawChartData = dData.sales_data || dData.salesData || [];
  const processedChartData = rawChartData.map(item => ({
    ...item,
    sales: Number(item.sales ?? item.amount ?? item.total ?? item.revenue ?? 0),
    day: item.day ?? item.date ?? item.label ?? "N/A"
  }));

  // Show zero-filled week if no data is present
  const displayData = processedChartData.length > 0 ? processedChartData : [
    { day: 'Mon', sales: 0 },
    { day: 'Tue', sales: 0 },
    { day: 'Wed', sales: 0 },
    { day: 'Thu', sales: 0 },
    { day: 'Fri', sales: 0 },
    { day: 'Sat', sales: 0 },
    { day: 'Sun', sales: 0 },
  ];
  const lsItems = dData.low_stock_list || dData.lowStockList || [];
  const eAlerts = dData.expiry_alerts || dData.expiryAlerts || [];
  const rActivity = dData.recent_activity || dData.recentActivity || [];

  const AnalyticsCard = ({
    title,
    value,
    percent,
    icon: Icon,
    iconBg,
    gradient,
    bars,
    linePoints,
    lineColor = "#2563eb",
    danger,
    onClick,
  }) => (
    <div
      onClick={onClick}
      className="relative bg-white rounded-xl p-5 border border-gray-200 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition"
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} to-transparent pointer-events-none`}
      />

      <span
        className={`absolute top-4 right-4 text-white text-xs font-semibold px-2 py-0.5 rounded
          ${danger ? "bg-red-500" : "bg-green-500"}`}
      >
        {percent}
      </span>

      <div className="relative flex justify-between items-end">
        <div>
          <div
            className={`w-10 h-10 flex items-center justify-center rounded-full ${iconBg} mb-3`}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>

          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-400 mt-1">in last 7 Days</p>
        </div>

        {bars && (
          <div className="flex items-end gap-1 h-14">
            {bars.map((h, i) => (
              <div
                key={i}
                style={{ height: `${h * 4}px` }}
                className="w-1.5 bg-indigo-500 rounded"
              />
            ))}
          </div>
        )}

        {linePoints && (
          <svg width="70" height="40" viewBox="0 0 70 40">
            <polyline
              points={linePoints}
              fill="none"
              stroke={lineColor}
              strokeWidth="2"
            />
          </svg>
        )}
      </div>
    </div>
  );

  const handleLowStock = () =>
    toast.info("Opening low stock items");

  const handleSuppliers = () =>
    toast.info("Opening supplier management");

  const handleSales = () =>
    toast.info("Opening today's sales");

  const handleMedicines = () =>
    toast.info("Opening total medicines");

  const handleViewAllStock = () => {
    if (onPageChange) onPageChange("stock");
  };

  const handleViewAllExpiry = () => {
    if (onPageChange) onPageChange("purchaseorders");
  };

  const handleNewOrder = () => {
    setIsModalOpen(true);
    toast.success("Creating new purchase order");
  };

  const handleFilterChange = (e) =>
    toast(`Filter applied: ${e.target.value}`);

  const handleAddItem = () => {
    const newItem = {
      id: Date.now(),
      medicine_id: "",
      name: "",
      price: 0,
      quantity: 1
    };
    setOrderItems([...orderItems, newItem]);
  };

  const updateQuantity = (id, delta) => {
    setOrderItems(items =>
      items.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => total + (item.quantity * item.price), 0);
  };

  const handleSubmitOrder = async () => {
    if (!selectedSupplier || calculateTotal() === 0) return;
    setIsSubmitting(true);
    try {
      const payload = {
        supplier_id: selectedSupplier,
        expected_date: document.getElementById('po-delivery-date').value || new Date().toISOString().split('T')[0],
        notes: document.getElementById('po-notes').value || "",
        items: orderItems.map(item => ({
          medicine_id: item.medicine_id,
          ordered_qty: Number(item.quantity),
          purchase_rate: Number(item.price)
        }))
      };

      await createPurchaseOrder(payload);
      toast.success(`Purchase Order submitted successfully!`);

      setIsModalOpen(false);
      setOrderItems([]);
      setSelectedSupplier("");
    } catch (err) {
      toast.error(err.message || "Failed to create purchase order");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Original StockRow component remains the same
  const StockRow = ({ name, category, stock, status }) => (
    <tr className="hover:bg-slate-50 cursor-pointer">
      <td className="py-3">{name}</td>
      <td>{category}</td>
      <td>{stock}</td>
      <td>
        <span className={`px-3 py-1 text-xs rounded-full ${status === "Critical" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
          }`}>
          {status}
        </span>
      </td>
    </tr>
  );

  return (
    <>
      {/* Modal needs to be at root level, not nested inside relative/overflow containers */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New Purchase Order"
        size="lg"
      >
        <div className="space-y-6">
          {/* Supplier Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Supplier
            </label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">Choose a supplier</option>
              {suppliersListState.map(s => (
                <option key={s.id} value={s.id}>{s.name || s.supplier_name}</option>
              ))}
            </select>
          </div>

          {/* Order Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Order Items</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleAddItem}
                  className="flex items-center gap-1 text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition"
                >
                  <Plus size={16} /> Add Item
                </button>
                <div className="text-lg font-semibold text-blue-600">
                  Total: ₹{calculateTotal()}
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-700">Medicine</th>
                    <th className="text-left p-3 font-medium text-gray-700">Price (₹)</th>
                    <th className="text-left p-3 font-medium text-gray-700">Quantity</th>
                    <th className="text-left p-3 font-medium text-gray-700">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orderItems.map((item) => (
                    <tr key={item.id}>
                      <td className="p-3">
                        <select
                          value={item.medicine_id}
                          onChange={(e) => {
                            const selectedMed = medicinesListState.find(m => String(m.id) === e.target.value);
                            if (selectedMed) {
                              setOrderItems(items => items.map(i => i.id === item.id ? { ...i, medicine_id: selectedMed.id, name: selectedMed.name || selectedMed.brand_name, price: selectedMed.unit_price || selectedMed.price || 0 } : i));
                            }
                          }}
                          className="w-full border border-gray-300 rounded px-2 py-1 outline-none focus:border-blue-500"
                        >
                          <option value="">Select Medicine</option>
                          {medicinesListState.map(m => (
                            <option key={m.id} value={m.id}>{m.name || m.brand_name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center">
                          <span className="mr-1">₹</span>
                          <input
                            type="number"
                            className="w-20 border border-gray-300 rounded px-2 py-1 outline-none focus:border-blue-500"
                            value={item.price}
                            onChange={(e) => setOrderItems(items => items.map(i => i.id === item.id ? { ...i, price: Number(e.target.value) } : i))}
                          />
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50"
                          >
                            -
                          </button>
                          <span className="w-12 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="p-3 font-medium">₹{item.quantity * item.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              id="po-notes"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              rows="3"
              placeholder="Add any special instructions or notes for this order..."
            />
          </div>

          {/* Delivery Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected Delivery Date
            </label>
            <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
              <Calendar size={18} className="text-gray-400" />
              <input
                id="po-delivery-date"
                type="date"
                className="flex-1 outline-none"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitOrder}
              disabled={!selectedSupplier || calculateTotal() === 0 || isSubmitting}
              className={`px-4 py-2 rounded-lg ${!selectedSupplier || calculateTotal() === 0 || isSubmitting
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
                } text-white flex items-center gap-2`}
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
              Submit Order
            </button>
          </div>
        </div>
      </Modal>

      {/* Dashboard Content */}
      <div className="bg-slate-100 min-h-screen w-full text-left space-y-6 px-3 sm:px-6 py-4 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-600" size={48} />
          </div>
        )}
        {/* HEADER */}
        <div className="flex flex-col gap-1">
          <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
          <p className="text-slate-500 text-sm sm:text-base">
            Overview of your pharmacy management system
          </p>
        </div>

        {/* TOP STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnalyticsCard
            title="Total Medicines"
            value={tMedicines}
            percent="+12%"
            icon={Pill}
            iconBg="bg-indigo-600"
            gradient="from-indigo-50"
            bars={[4, 7, 10, 6, 12]}
            onClick={handleMedicines}
          />

          <AnalyticsCard
            title="Today's Sales"
            value={tSales}
            percent="+8%"
            icon={IndianRupee}
            iconBg="bg-green-600"
            gradient="from-green-50"
            lineColor="#22c55e"
            linePoints="0,28 12,24 24,26 36,18 48,20 60,12"
            onClick={handleSales}
          />

          <AnalyticsCard
            title="Low Stock Items"
            value={lStock}
            percent="-5%"
            danger
            icon={AlertTriangle}
            iconBg="bg-yellow-500"
            gradient="from-yellow-50"
            bars={[10, 6, 12, 8, 9]}
            onClick={handleLowStock}
          />

          <AnalyticsCard
            title="Active Suppliers"
            value={aSuppliers}
            percent="+25%"
            icon={Truck}
            iconBg="bg-purple-600"
            gradient="from-purple-50"
            lineColor="#a855f7"
            linePoints="0,30 12,26 24,20 36,22 48,16 60,10"
            onClick={handleSuppliers}
          />
        </div>

        {/* CHART + ACTIVITY */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* SALES CHART */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="font-semibold text-lg">Sales Overview</h2>
              <select className="border rounded px-2 py-1 text-sm" onChange={handleFilterChange}>
                <option>Last 7 days</option>
                <option>Last 30 days</option>
              </select>
            </div>
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="day"
                    axisLine={{ stroke: '#000000', strokeWidth: 1.5 }}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={{ stroke: '#000000', strokeWidth: 1.5 }}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                    tickFormatter={(value) => `₹${value > 999 ? (value / 1000).toFixed(0) + 'K' : value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      padding: '12px'
                    }}
                    formatter={(value) => [`₹${value.toLocaleString()}`, 'Sales']}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                    dot={{ r: 4, fill: '#fff', stroke: '#4f46e5', strokeWidth: 2 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RECENT ACTIVITY */}
          <div className="bg-white rounded-xl shadow p-4 sm:p-6">
            <h2 className="font-semibold text-lg mb-4">Recent Activity</h2>
            <ul className="space-y-3">
              {rActivity.length > 0 ? (
                rActivity.map((act, i) => {
                  let Icon = CheckCircle;
                  let bg = "bg-blue-100 text-blue-600";

                  const title = (act.title || "").toLowerCase();
                  if (title.includes("medicine") || title.includes("pill") || title.includes("drug")) {
                    Icon = Pill;
                    bg = "bg-indigo-100 text-indigo-600";
                  } else if (title.includes("sale") || title.includes("sold") || title.includes("order")) {
                    Icon = ShoppingCart;
                    bg = "bg-green-100 text-green-600";
                  } else if (title.includes("stock") || title.includes("inventory") || title.includes("batch")) {
                    Icon = Package;
                    bg = "bg-orange-100 text-orange-600";
                  } else if (title.includes("supplier") || title.includes("truck") || title.includes("delivery")) {
                    Icon = Truck;
                    bg = "bg-purple-100 text-purple-600";
                  }

                  return (
                    <ActivityItem
                      key={i}
                      title={act.title}
                      desc={act.desc}
                      icon={Icon}
                      bg={bg}
                      time={act.time}
                    />
                  );
                })
              ) : (
                <div className="py-8 text-center text-slate-400 italic text-sm">
                  No recent activity found.
                </div>
              )}
            </ul>
          </div>
        </div>

        {/* TABLE + ALERTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LOW STOCK - EXPANDED WITH ORIGINAL STYLING */}
          <div className="bg-white rounded-xl shadow p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="font-semibold text-lg">Low Stock Items</h2>
              <button onClick={handleViewAllStock} className="text-blue-600 text-sm">
                View all →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead className="text-left text-slate-500">
                  <tr>
                    <th>Medicine</th>
                    <th>Category</th>
                    <th>Stock</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lsItems.map((item, index) => (
                    <StockRow
                      key={index}
                      name={item.name}
                      category={item.category}
                      stock={item.stock}
                      status={item.status}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* EXPIRY ALERTS */}
          <div className="bg-white rounded-xl shadow p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="font-semibold text-lg">Purchase Order</h2>
              <button onClick={handleViewAllExpiry} className="text-blue-600 text-sm">
                View all →
              </button>
            </div>

            <div className="space-y-3">
              {eAlerts.map((alert, index) => (
                <AlertCard key={index} name={alert.name} batch={alert.batch} days={alert.days} danger={alert.danger} />
              ))}
            </div>

            <button onClick={handleNewOrder} className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
              <Plus size={20} />
              New Order
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ================= COMPONENTS ================= */

const ActivityItem = ({ title, desc, icon: Icon, bg, time }) => (
  <li onClick={() => toast.info(title)} className="flex gap-3 items-start hover:bg-slate-50 p-2 sm:p-3 rounded cursor-pointer">
    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${bg} shrink-0`}>
      <Icon size={16} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-start gap-2">
        <p className="font-medium text-sm truncate">{title}</p>
        {time && <span className="text-[10px] text-slate-400 whitespace-nowrap">{time}</span>}
      </div>
      <p className="text-slate-500 text-xs line-clamp-1">{desc}</p>
    </div>
  </li>
);

const AlertCard = ({ name, batch, days, danger }) => (
  <div
    onClick={() =>
      danger
        ? toast.error(`${name} expires in ${days}`)
        : toast.warn(`${name} expires in ${days}`)
    }
    className={`p-4 rounded-lg cursor-pointer ${danger ? "bg-red-50" : "bg-yellow-50"
      }`}
  >
    <div className="flex justify-between">
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-sm text-slate-500">Batch #{batch}</p>
      </div>
      <p className={`font-semibold ${danger ? "text-red-600" : "text-yellow-700"}`}>
        Expires in {days}
      </p>
    </div>
  </div>
);