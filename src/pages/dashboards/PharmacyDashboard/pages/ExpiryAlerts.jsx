import React from "react";
import { toast } from "react-toastify";

import {
  AlertTriangle,
  Clock,
  Ban,
  Download,
  Trash2,
  ArrowRightCircle,
  Loader2,
} from "lucide-react";
import {
  getAlerts,
  acknowledgeAlert,
  runExpiryScan
} from "../../../../services/pharmacyApi";

export default function ExpiryAlerts() {
  const [alerts, setAlerts] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    fetchExpiryReport();
  }, []);

  const fetchExpiryReport = async () => {
    setIsLoading(true);
    try {
      // Use getAlerts with EXPIRY type as requested by the documentation link
      const data = await getAlerts(0, 100, 'EXPIRY', 'PENDING');
      const items = Array.isArray(data) ? data : (data?.items || data?.data || []);
      
      const formatted = items.map(item => {
        // Handle metadata structure if present (typical for the new alerts system)
        const meta = item.metadata || {};
        const daysLeft = meta.days_left ?? item.days_left ?? item.days_until_expiry;
        
        return {
          id: item.id,
          name: meta.medicine_name || item.name || item.item_name || item.message || 'Unknown',
          code: meta.item_code || item.code || item.item_code || 'N/A',
          batch: meta.batch_number || item.batch_number || item.batch || 'N/A',
          qty: meta.stock || item.stock || item.quantity || 0,
          expiry: (meta.expiry_date || item.expiry_date) 
            ? new Date(meta.expiry_date || item.expiry_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) 
            : 'N/A',
          days: daysLeft !== undefined ? `${daysLeft} days` : 'N/A',
          level: item.priority || meta.expiry_status || item.level || getLevel(daysLeft),
          status: item.status,
          _original: item
        };
      });
      setAlerts(formatted);
    } catch (error) {
      console.error("Fetch alerts error:", error);
      toast.error("Failed to load expiry alerts");
    } finally {
      setIsLoading(false);
    }
  };

  const getLevel = (days) => {
    if (days <= 0) return "Expired";
    if (days <= 15) return "Critical";
    if (days <= 30) return "Warning";
    return "Monitor";
  };

  const handleExport = () =>
    toast.success("Expiry report exported successfully");

  const handleRunScan = async () => {
    setIsLoading(true);
    try {
      await runExpiryScan();
      toast.success("Expiry scan completed");
      fetchExpiryReport();
    } catch (error) {
      if (error.message?.includes("Access denied") || error.message?.includes("HOSPITAL_ADMIN")) {
         toast.error("Only Hospital Admins have permission to run manual scans.");
      } else {
         toast.error(error.message || "Failed to run expiry scan");
      }
      setIsLoading(false);
    }
  };

  const handleDiscard = async (alert) => {
    try {
      await acknowledgeAlert(alert.id);
      toast.success(`${alert.name} alert acknowledged`);
      fetchExpiryReport();
    } catch (error) {
      toast.error("Failed to acknowledge alert");
    }
  };

  const handleTakeAction = async (alert) => {
    try {
      await acknowledgeAlert(alert.id);
      toast.info(`Action initiated for ${alert.name}`);
      fetchExpiryReport();
    } catch (error) {
      toast.error("Failed to process action");
    }
  };

  const badgeStyle = (level) => {
    if (level === "Critical") return "bg-red-100 text-red-700";
    if (level === "Warning") return "bg-yellow-100 text-yellow-700";
    if (level === "Monitor") return "bg-green-100 text-green-700";
    if (level === "Expired") return "bg-gray-200 text-gray-700";
    return "bg-gray-200 text-gray-700";
  };

  const daysStyle = (days) => {
    if (!days || days.includes("Expired") || days.startsWith("0") || days.startsWith("-")) return "text-gray-600 font-semibold";
    const d = parseInt(days);
    if (d <= 7) return "text-red-600 font-semibold";
    if (d <= 30) return "text-yellow-600 font-semibold";
    return "text-green-600 font-semibold";
  };

  const criticalCount = alerts.filter(a => a.level === "Critical").length;
  const warningCount = alerts.filter(a => a.level === "Warning").length;
  const expiredCount = alerts.filter(a => a.level === "Expired").length;

  return (
    <div className="bg-slate-100 min-h-screen space-y-6 px-3 sm:px-6 py-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Expiry Alerts</h1>
          <p className="text-slate-500 text-sm sm:text-base">
            Monitor medicines nearing expiry date
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={handleRunScan}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 w-full sm:w-auto disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
            Run Scan
          </button>
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 w-full sm:w-auto"
          >
            <Download size={16} />
            Export Report
          </button>
        </div>
      </div>

      {/* SUMMARY (Modern Analytics Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

        <ExpiryStat
          title="Expiring in 15 days"
          value={criticalCount}
          percent="Critical"
          icon={AlertTriangle}
          iconBg="bg-red-600"
          gradient="from-red-50"
          bars={[12, 10, 14, 16, 18]}
        />

        <ExpiryStat
          title="Expiring in 30 days"
          value={warningCount}
          percent="Warning"
          icon={Clock}
          iconBg="bg-yellow-500"
          gradient="from-yellow-50"
          lineColor="#f59e0b"
          linePoints="0,28 12,24 24,26 36,20 48,18 60,14"
        />

        <ExpiryStat
          title="Already Expired"
          value={expiredCount}
          percent="Expired"
          danger
          icon={Ban}
          iconBg="bg-gray-600"
          gradient="from-gray-100"
          bars={[6, 5, 4, 3, 2]}
        />

      </div>


      {/* TABLE */}
      <div className="bg-white rounded-xl shadow">
        {/* 🔑 RESPONSIVE FIX */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-6 py-4 text-left">Medicine</th>
                <th className="px-6 py-4 text-left">Batch</th>
                <th className="px-6 py-4 text-center">Qty</th>
                <th className="px-6 py-4 text-center">Expiry</th>
                <th className="px-6 py-4 text-center">Days Left</th>
                <th className="px-6 py-4 text-center">Level</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <Loader2 className="animate-spin mb-2" size={24} />
                      Loading report...
                    </div>
                  </td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-500">
                    No expiry alerts found.
                  </td>
                </tr>
              ) : (
                alerts.map((a, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-medium">{a.name}</p>
                      <p className="text-xs text-slate-500">{a.code}</p>
                    </td>
                    <td className="px-6 py-4">{a.batch}</td>
                    <td className="px-6 py-4 text-center">{a.qty}</td>
                    <td className="px-6 py-4 text-center">{a.expiry}</td>
                    <td className={`px-6 py-4 text-center ${daysStyle(a.days)}`}>
                      {a.days}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-3 py-1 text-xs rounded-full ${badgeStyle(
                          a.level
                        )}`}
                      >
                        {a.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {a.level === "Expired" ? (
                        <Trash2
                          size={16}
                          className="text-red-600 cursor-pointer"
                          onClick={() => handleDiscard(a)}
                        />
                      ) : (
                        <ArrowRightCircle
                          size={16}
                          className="text-blue-600 cursor-pointer"
                          onClick={() => handleTakeAction(a)}
                        />
                      )}
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

/* SUMMARY CARD */

const ExpiryStat = ({
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
}) => (
  <div
    onClick={() => toast.info(`Viewing ${title}`)}
    className="relative bg-white rounded-xl p-5 border border-gray-200 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition"
  >
    {/* gradient bg */}
    <div
      className={`absolute inset-0 bg-gradient-to-br ${gradient} to-transparent pointer-events-none`}
    />

    {/* badge */}
    <span
      className={`absolute top-4 right-4 text-white text-xs font-semibold px-2 py-0.5 rounded
        ${danger ? "bg-gray-700" : "bg-red-500"}`}
    >
      {percent}
    </span>

    <div className="relative flex justify-between items-end">
      {/* left */}
      <div>
        <div
          className={`w-10 h-10 flex items-center justify-center rounded-full ${iconBg} mb-3`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>

        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-400 mt-1">requires attention</p>
      </div>

      {/* mini bars */}
      {bars && (
        <div className="flex items-end gap-1 h-14">
          {bars.map((h, i) => (
            <div
              key={i}
              style={{ height: `${h * 3}px` }}
              className="w-1.5 bg-red-500 rounded"
            />
          ))}
        </div>
      )}

      {/* mini line */}
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

