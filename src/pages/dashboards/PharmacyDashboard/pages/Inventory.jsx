import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Pill, Search, Loader2, AlertTriangle } from "lucide-react";
import { getInventory, getMedicines } from "../../../../services/pharmacyApi";

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [medicines, setMedicines] = useState([]);
  const [masterMedicines, setMasterMedicines] = useState([]);

  useEffect(() => {
    const init = async () => {
      await fetchMasterData();
      await fetchInventory();
    };
    init();
  }, [page]);

  const fetchMasterData = async () => {
    try {
      const data = await getMedicines(0, 2000);
      const items = Array.isArray(data) ? data : (data?.medicines || data?.items || data?.data || []);
      setMasterMedicines(items.map(m => ({ 
        ...m, 
        id: m.id || m._id, 
        displayName: m.brand_name || m.name || m.item_name || "Unknown" 
      })));
    } catch (err) {
      console.error("Failed to fetch medicine master data", err);
    }
  };

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const skip = (page - 1) * 100;
      const data = await getInventory(skip, 100);
      const items = Array.isArray(data) ? data : (data?.items || data?.data || []);

      const formattedItems = items.map(item => {
        const mId = item.medicine_id || item.id || item._id;
        const master = masterMedicines.find(m => m.id === mId);
        
        return {
          id: mId,
          name: item.medicine_name || item.brand_name || item.name || item.item_name || master?.displayName || '-',
          code: item.code || item.item_code || master?.sku || (mId ? mId.slice(-8).toUpperCase() : 'N/A'),
          category: item.category || master?.category || 'General',
          stock: item.stock !== undefined ? item.stock : (item.quantity_in_stock !== undefined ? item.quantity_in_stock : 0),
          price: item.price !== undefined ? item.price : (item.unit_price !== undefined ? item.unit_price : 0),
          status: item.stock <= 10 ? (item.stock === 0 ? "Out of Stock" : "Low Stock") : "In Stock"
        };
      });
      setMedicines(formattedItems);
    } catch (error) {
      toast.error(error.message || "Failed to fetch inventory");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMedicines = medicines.filter(
    (m) =>
      (m.name.toLowerCase().includes(search.toLowerCase()) || m.code.toLowerCase().includes(search.toLowerCase())) &&
      (category === "All" || m.category === category)
  );

  return (
    <div className="bg-slate-100 min-h-screen space-y-6 px-3 sm:px-6 py-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Inventory Overview</h1>
          <p className="text-slate-500 text-sm">Real-time stock levels and availability</p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search medicine name or code..."
              className="w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border rounded-xl px-4 py-2.5 text-sm outline-none bg-slate-50 focus:bg-white transition-all"
          >
            <option>All</option>
            <option>Antibiotic</option>
            <option>Analgesic</option>
            <option>Hypertension</option>
            <option>Antihistamine</option>
            <option>Diabetes</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-slate-50/50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b">
              <tr>
                <th className="px-6 py-4 text-left">Medicine</th>
                <th className="px-6 py-4 text-left">Code</th>
                <th className="px-2 py-4 text-left">Category</th>
                <th className="px-2 py-4 text-center">Available Stock</th>
                <th className="px-6 py-4 text-center">Unit Price</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <Loader2 className="animate-spin" size={32} />
                      <p className="font-medium">Fetching real-time stock...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredMedicines.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center text-slate-500 italic">
                    No medicine found in inventory.
                  </td>
                </tr>
              ) : (
                filteredMedicines.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                          <Pill size={20} />
                        </div>
                        <span className="font-bold text-slate-800">{m.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs uppercase">{m.code}</td>
                    <td className="px-2 py-4 text-left">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                        {m.category}
                      </span>
                    </td>
                    <td className="px-2 py-4 text-center">
                      <span className={`font-black ${m.stock <= 10 ? 'text-red-600' : 'text-slate-900'}`}>
                        {m.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-slate-700">₹{m.price}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex items-center justify-center gap-1 w-fit mx-auto ${
                        m.status === 'In Stock' ? 'bg-green-100 text-green-700' :
                        m.status === 'Low Stock' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {m.status === 'Low Stock' && <AlertTriangle size={10} />}
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
