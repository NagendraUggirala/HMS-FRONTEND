import { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { apiFetch } from '../../../../services/apiClient';
import { NURSE_ADD_VITALS, NURSE_GET_VITALS, NURSE_ASSIGNED_PATIENTS } from '../../../../config/api';
import Modal from '../../../../components/common/Modal/Modal';

const VitalsMonitoring = () => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const [selectedAdmission, setSelectedAdmission] = useState('');
  const [patientsList, setPatientsList] = useState([]);
  const [vitals, setVitals] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const fetchPatients = async () => {
    try {
      const response = await apiFetch(NURSE_ASSIGNED_PATIENTS);
      if (response && response.ok) {
        const data = await response.json();
        const pList = Array.isArray(data?.data) ? data.data : [];
        setPatientsList(pList);
        
        if (pList.length > 0) {
          // If no admission selected yet, pick the first patient
          if (!selectedAdmission) {
            const firstAdmission = pList[0].admission_number || pList[0].admissionNumber || pList[0].id?.toString();
            setSelectedAdmission(firstAdmission);
            setFormData(prev => ({ ...prev, admission_number: firstAdmission }));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const fetchVitals = async (admissionNumber) => {
    if (!admissionNumber) return;
    setIsLoadingData(true);
    try {
      const response = await apiFetch(`${NURSE_GET_VITALS}?admission_number=${admissionNumber}`);
      if (response && response.ok) {
        const data = await response.json();
        setVitals(Array.isArray(data?.data) ? data.data : []);
      } else {
        setVitals([]);
      }
    } catch (error) {
      console.error('Error fetching vitals:', error);
      setVitals([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedAdmission) {
      fetchVitals(selectedAdmission);
    }
  }, [selectedAdmission]);

  const fetchData = () => {
    fetchPatients();
    if (selectedAdmission) {
      fetchVitals(selectedAdmission);
    }
  };

  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');

      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      // Generate chart data from fetched vitals (last 10 readings or fallback)
      const chartVitals = vitals.length > 0 ? [...vitals].reverse().slice(-10) : [];
      const labels = chartVitals.length > 0 ? chartVitals.map(v => v.time || new Date(v.timestamp || v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) : [];
      const tempData = chartVitals.length > 0 ? chartVitals.map(v => v.temperature || v.temp) : [];
      const hrData = chartVitals.length > 0 ? chartVitals.map(v => v.pulse || v.heart_rate) : [];

      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Temperature (°F)',
              data: tempData,
              borderColor: 'rgb(239, 68, 68)',
              tension: 0.1
            },
            {
              label: 'Heart Rate (bpm)',
              data: hrData,
              borderColor: 'rgb(59, 130, 246)',
              tension: 0.1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: false
            }
          }
        }
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [vitals]);

  const getStatus = (vital) => {
    const temp = vital?.temperature || vital?.temp || 98.6;
    if (temp > 100 || temp < 97) return { status: 'Critical', class: 'bg-red-100 text-red-800' };
    return { status: 'Stable', class: 'bg-green-100 text-green-800' };
  };

  const [formData, setFormData] = useState({
    admission_number: '',
    temperature: '',
    pulse: '',
    bp_systolic: '',
    bp_diastolic: '',
    oxygen_saturation: '',
    respiratory_rate: '',
    weight: '',
    height: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showAddVitalsModal, setShowAddVitalsModal] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleVitalsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const payloadData = {
        admission_number: formData.admission_number,
        temperature: parseFloat(formData.temperature),
        pulse: parseInt(formData.pulse),
        bp_systolic: formData.bp_systolic ? parseInt(formData.bp_systolic) : null,
        bp_diastolic: formData.bp_diastolic ? parseInt(formData.bp_diastolic) : null,
        oxygen_saturation: formData.oxygen_saturation ? parseInt(formData.oxygen_saturation) : null,
        respiratory_rate: formData.respiratory_rate ? parseInt(formData.respiratory_rate) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        notes: formData.notes || ''
      };

      const response = await apiFetch(NURSE_ADD_VITALS, {
        method: 'POST',
        body: payloadData
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.detail || payload?.message || 'Failed to record vitals');
      }

      setMessage({ type: 'success', text: 'Vitals recorded successfully' });
      setFormData({
        admission_number: formData.admission_number,
        temperature: '',
        pulse: '',
        bp_systolic: '',
        bp_diastolic: '',
        oxygen_saturation: '',
        respiratory_rate: '',
        weight: '',
        height: '',
        notes: ''
      });
      // Refresh vitals list after submission
      fetchData();
      setShowAddVitalsModal(false);
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: error.message || 'Failed to record vitals' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Vitals Table - Mobile Optimized */}
      <div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-3">
          <h2 className="text-2xl font-semibold text-gray-700">Vitals Monitoring</h2>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <select
                value={selectedAdmission}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedAdmission(val);
                  const patient = patientsList.find(p => (p.admission_number || p.admissionNumber || p.id?.toString()) === val);
                  if (patient) {
                    setFormData(prev => ({ ...prev, admission_number: val }));
                  }
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm appearance-none pr-8"
              >
                <option value="">Select Patient</option>
                {patientsList.map(patient => (
                  <option key={patient.id} value={patient.admission_number || patient.admissionNumber || patient.id}>
                    {patient.name || patient.patient_name} ({patient.admission_number || patient.admissionNumber || patient.id})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <i className="fas fa-chevron-down text-xs"></i>
              </div>
            </div>
            <button
              onClick={() => setShowAddVitalsModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm whitespace-nowrap"
            >
              <i className="fas fa-plus"></i>
              <span>Add Vitals</span>
            </button>
          </div>
        </div>
        <div className="bg-white border rounded card-shadow overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium whitespace-nowrap">Patient</th>
                <th className="px-3 py-2 text-center text-xs font-medium whitespace-nowrap">Temp</th>
                <th className="px-3 py-2 text-center text-xs font-medium whitespace-nowrap">BP</th>
                <th className="px-3 py-2 text-center text-xs font-medium whitespace-nowrap">Pulse</th>
                <th className="px-3 py-2 text-center text-xs font-medium whitespace-nowrap">O₂</th>
                <th className="px-3 py-2 text-center text-xs font-medium whitespace-nowrap">Time</th>
                <th className="px-3 py-2 text-center text-xs font-medium whitespace-nowrap">Status</th>
                <th className="px-3 py-2 text-center text-xs font-medium whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingData ? (
                <tr><td colSpan="8" className="px-3 py-4 text-center text-gray-500">Loading vitals...</td></tr>
              ) : vitals.length === 0 ? (
                <tr><td colSpan="8" className="px-3 py-4 text-center text-gray-500">No vitals recorded yet.</td></tr>
              ) : vitals.map((vital, index) => {
                const statusInfo = getStatus(vital);

                return (
                  <tr key={vital.id || index} className="border-t hover:bg-gray-50 fade-in">
                    {/* Patient Name - Truncated on mobile */}
                    <td className="px-3 py-2 text-left max-w-[100px]">
                      <div className="truncate" title={vital.patient_name || vital.name || 'Unknown Patient'}>
                        {vital.patient_name || vital.name || 'Unknown Patient'}
                      </div>
                    </td>

                    {/* Temperature */}
                    <td className="px-3 py-2 text-center text-red-600 font-semibold whitespace-nowrap">
                      {vital.temperature || vital.temp || 'N/A'}°F
                    </td>

                    {/* Blood Pressure */}
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      {vital.bp_systolic || vital.bpSystolic || '--'}/{vital.bp_diastolic || vital.bpDiastolic || '--'}
                    </td>

                    {/* Pulse */}
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      {vital.pulse || vital.heart_rate || '--'} bpm
                    </td>

                    {/* Oxygen */}
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      {vital.oxygen_saturation || vital.oxygen || '--'}%
                    </td>

                    {/* Time - Compact on mobile */}
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      <span className="hidden sm:inline">
                        {vital.time || (vital.timestamp ? new Date(vital.timestamp).toLocaleTimeString() : new Date(vital.created_at).toLocaleTimeString())}
                      </span>
                      <span className="sm:hidden text-xs">
                        {(vital.time || (vital.timestamp ? new Date(vital.timestamp).toLocaleTimeString() : new Date(vital.created_at).toLocaleTimeString())).split(':').slice(0, 2).join(':')}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${statusInfo.class} whitespace-nowrap`}>
                        {statusInfo.status}
                      </span>
                    </td>

                    {/* Actions - Compact on mobile */}
                    <td className="px-3 py-2 text-center">
                      <div className="flex gap-1 justify-center">
                        <button
                          className="text-blue-500 hover:text-blue-700 p-1 transition-colors"
                          title="Edit Vitals"
                        >
                          <i className="fas fa-edit text-sm"></i>
                        </button>
                        <button
                          className="text-green-500 hover:text-green-700 p-1 transition-colors"
                          title="View Trends"
                        >
                          <i className="fas fa-chart-line text-sm"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Scroll Indicator */}
        <div className="sm:hidden bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
          <div className="flex items-center gap-2 text-blue-700 text-sm">
            <i className="fas fa-info-circle"></i>
            <span>Scroll horizontally to view all columns</span>
          </div>
        </div>
      </div>

      {/* Vitals Trends Section */}
      <div className="bg-white p-4 border rounded card-shadow mt-6">
        <h3 className="text-lg font-semibold mb-3">Vitals Trends</h3>
        <div className="flex flex-wrap gap-4 mb-4">
          <span className="text-sm font-medium flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            Temperature (°F)
          </span>
          <span className="text-sm font-medium flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            Heart Rate (bpm)
          </span>
        </div>
        <div className="h-64">
          <canvas ref={chartRef} id="vitalsChart"></canvas>
        </div>
      </div>

      {/* Add Vitals Modal */}
      <Modal
        isOpen={showAddVitalsModal}
        onClose={() => setShowAddVitalsModal(false)}
        title="Add Vitals Reading"
        size="md"
      >
        {message.text && (
          <div className={`p-3 rounded mb-4 text-sm ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200'}`}>
            {message.text}
          </div>
        )}
        <form id="vitalsForm" className="space-y-4" onSubmit={handleVitalsSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admission Number</label>
            <input
              type="text"
              name="admission_number"
              value={formData.admission_number}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter Admission Number"
              required
            />
            {patientsList.length > 0 && (
               <p className="text-xs text-gray-500 mt-1">
                 Current Selection: {patientsList.find(p => (p.admission_number || p.admissionNumber || p.id?.toString()) === selectedAdmission)?.name || 'None'}
               </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (°F)</label>
            <input
              type="number"
              step="0.1"
              name="temperature"
              value={formData.temperature}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter temperature"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pulse (bpm)</label>
            <input
              type="number"
              name="pulse"
              value={formData.pulse}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter pulse"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">BP Systolic</label>
              <input
                type="number"
                name="bp_systolic"
                value={formData.bp_systolic}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Systolic"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">BP Diastolic</label>
              <input
                type="number"
                name="bp_diastolic"
                value={formData.bp_diastolic}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Diastolic"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Oxygen Saturation (%)</label>
              <input
                type="number"
                name="oxygen_saturation"
                value={formData.oxygen_saturation}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Oxygen %"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resp. Rate (bpm)</label>
              <input
                type="number"
                name="respiratory_rate"
                value={formData.respiratory_rate}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Resp Rate"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                name="weight"
                value={formData.weight}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Weight"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
              <input
                type="number"
                step="0.1"
                name="height"
                value={formData.height}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Height"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Any additional observations..."
              rows="2"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`text-white px-4 py-2 rounded w-full transition-colors text-sm font-medium flex justify-center items-center ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <i className="fas fa-save mr-1"></i>
            )}
            {loading ? 'Saving...' : 'Save Vitals'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default VitalsMonitoring;