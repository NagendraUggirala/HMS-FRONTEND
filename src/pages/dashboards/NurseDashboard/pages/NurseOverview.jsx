import React, { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { apiFetch } from '../../../../services/apiClient';
import { NURSE_DASHBOARD_OVERVIEW } from '../../../../config/api';

// Register Chart.js components
Chart.register(...registerables);

const NurseOverview = () => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiFetch(NURSE_DASHBOARD_OVERVIEW);
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload?.detail || payload?.message || 'Failed to fetch dashboard data');
        }

        setData(payload?.data || payload);
      } catch (err) {
        console.error("Dashboard error:", err);
        setError(err.message || "Unable to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    // Initialize chart when component mounts and data is loaded
    if (chartRef.current) {
      // Destroy previous chart instance if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const stable = data?.patient_status?.stable ?? 0;
      const improving = data?.patient_status?.improving ?? 0;
      const critical = data?.patient_status?.critical ?? 0;
      const monitoring = data?.patient_status?.monitoring ?? 0;

      // Create new chart instance
      const ctx = chartRef.current.getContext('2d');
      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Stable', 'Improving', 'Critical', 'Monitoring'],
          datasets: [{
            label: 'Patient Count',
            data: [stable, improving, critical, monitoring],
            backgroundColor: [
              'rgb(34, 197, 94)',
              'rgb(245, 158, 11)',
              'rgb(239, 68, 68)',
              'rgb(59, 130, 246)'
            ],
            borderColor: [
              'rgb(34, 197, 94)',
              'rgb(245, 158, 11)',
              'rgb(239, 68, 68)',
              'rgb(59, 130, 246)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              },
              grid: {
                display: true
              }
            },
            x: {
              grid: {
                display: false
              }
            }
          },
          plugins: {
            legend: {
              display: false
            }
          }
        }
      });
    }

    // Cleanup function to destroy chart when component unmounts
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">
        Error loading dashboard: {error}
      </div>
    );
  }

  const vitalsToDisplay = Array.isArray(data?.recent_vitals) ? data.recent_vitals : [];
  const tasksToDisplay = Array.isArray(data?.pending_tasks) ? data.pending_tasks : [];

  const getTaskColorClass = (type) => {
    switch(type) {
      case 'red': return 'border-red-500 bg-red-50 text-red-600 hover:text-red-800';
      case 'yellow': return 'border-yellow-500 bg-yellow-50 text-yellow-600 hover:text-yellow-800';
      case 'blue': 
      default: return 'border-blue-500 bg-blue-50 text-blue-600 hover:text-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-700 mb-6">
        Dashboard Overview
      </h2>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg card-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <i className="fas fa-user-injured text-blue-600 text-xl"></i>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Assigned Patients</p>
              <p className="text-2xl font-bold">{data?.assigned_patients ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg card-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <i className="fas fa-pills text-green-600 text-xl"></i>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Medications Due</p>
              <p className="text-2xl font-bold">{data?.medications_due ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg card-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg mr-4">
              <i className="fas fa-bed text-yellow-600 text-xl"></i>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Available Beds</p>
              <p className="text-2xl font-bold">{data?.available_beds ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg card-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg mr-4">
              <i className="fas fa-exclamation-triangle text-red-600 text-xl"></i>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Critical Patients</p>
              <p className="text-2xl font-bold">{data?.critical_patients ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Vitals */}
        <div className="bg-white p-4 rounded-lg card-shadow">
          <h3 className="text-lg font-semibold mb-4">Recent Vitals</h3>
          <div className="space-y-3">
            {vitalsToDisplay.map((vital, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <div className="flex items-center">
                  <img src={vital?.avatar || `https://i.pravatar.cc/40?img=${vital?.img || (11 + idx)}`} className="w-10 h-10 rounded-full mr-3" alt="Patient" />
                  <div>
                    <p className="font-medium">{vital?.patient_name || vital?.name || 'Unknown Patient'}</p>
                    <p className="text-xs text-gray-500">{vital?.room_number || vital?.bed || 'No Bed Info'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm">{vital?.temperature || vital?.temp || 'N/A'}</p>
                  <p className="text-xs text-gray-500">{vital?.time || (vital?.timestamp ? new Date(vital.timestamp).toLocaleTimeString() : '')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-white p-4 rounded-lg card-shadow">
          <h3 className="text-lg font-semibold mb-4">Pending Tasks</h3>
          <div className="space-y-3">
            {tasksToDisplay.map((task, idx) => {
              const colorClass = getTaskColorClass(task?.type || task?.priority);
              const colorParts = colorClass.split(' ');
              const borderBgClasses = colorParts.slice(0, 2).join(' ');
              const textClasses = colorParts.slice(2).join(' ');

              return (
                <div key={idx} className={`flex items-center justify-between p-2 border-l-4 rounded ${borderBgClasses}`}>
                  <div>
                    <p className="font-medium">{task?.title || 'Unknown Task'}</p>
                    <p className="text-xs text-gray-500">{task?.description || task?.desc || ''}</p>
                  </div>
                  <button className={`${textClasses}`}>
                    <i className="fas fa-arrow-right"></i>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Patient Status Overview Chart */}
      <div className="bg-white p-4 rounded-lg card-shadow mt-6">
        <h3 className="text-lg font-semibold mb-4">Patient Status Overview</h3>
        <div className="h-64">
          <canvas ref={chartRef} id="patientStatusChart"></canvas>
        </div>
      </div>
    </div>
  );
};

export default NurseOverview;