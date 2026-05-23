import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import Modal from '../../../../components/common/Modal/Modal';
import { apiFetch } from '../../../../services/apiClient';
import { NURSE_BEDS, NURSE_UPDATE_BED } from '../../../../config/api';

const BedManagement = () => {
  const [selectedWard, setSelectedWard] = useState('all');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showAddBedModal, setShowAddBedModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingBedId, setEditingBedId] = useState(null);
  const [newBedData, setNewBedData] = useState({
    bed_number: '',
    bed_code: '',
    ward_id: '',
    status: 'AVAILABLE',
    bed_type: 'STANDARD',
    floor: '',
    room_number: '',
    bed_position: '',
    has_oxygen: false,
    has_suction: false,
    has_cardiac_monitor: false,
    has_ventilator: false,
    has_iv_pole: false,
    daily_rate: ''
  });
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const [beds, setBeds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBeds = async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch(NURSE_BEDS);
      if (response && response.ok) {
        const data = await response.json();
        const rawBeds = Array.isArray(data?.data) ? data.data : [];
        const normalizedBeds = rawBeds.map(bed => ({
          ...bed,
          id: bed.id || bed.bed_id,
          number: bed.bed_number || bed.number || 'Unknown',
          status: (bed.status || bed.bed_status || 'available').toLowerCase(),
          patient: bed.patient_name || bed.patient || null,
          condition: bed.patient_condition || bed.condition || null,
          doctor: bed.doctor_name || bed.doctor || null,
          admitted: bed.admission_date ? new Date(bed.admission_date).toLocaleDateString() : bed.admitted || null,
          ward: bed.ward || bed.department || 'general'
        }));
        setBeds(normalizedBeds);
      } else {
        setBeds([]);
      }
    } catch (error) {
      console.error('Error fetching beds:', error);
      setBeds([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBeds();
  }, []);

  useEffect(() => {
    if (chartRef.current && beds.length > 0) {
      const ctx = chartRef.current.getContext('2d');
      
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const occupiedCount = beds.filter(b => b.status === 'occupied').length;
      const availableCount = beds.filter(b => b.status === 'available').length;
      const cleaningCount = beds.filter(b => b.status === 'cleaning').length;
      const reservedCount = beds.filter(b => b.status === 'reserved').length;

      chartInstance.current = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Occupied', 'Available', 'Cleaning/Maintenance', 'Reserved'],
          datasets: [{
            data: [occupiedCount, availableCount, cleaningCount, reservedCount],
            backgroundColor: [
              'rgb(239, 68, 68)',
              'rgb(34, 197, 94)',
              'rgb(245, 158, 11)',
              'rgb(168, 85, 247)'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
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
  }, [beds]);

  const wardFilters = [
    { id: 'all', name: 'All Wards' },
    { id: 'icu', name: 'ICU' },
    { id: 'general', name: 'General Ward' },
    { id: 'pediatrics', name: 'Pediatrics' },
    { id: 'maternity', name: 'Maternity' },
  ];

  const filteredBeds = selectedWard === 'all' 
    ? beds 
    : beds.filter(bed => {
        const bedWard = (bed.ward || '').toLowerCase();
        if (selectedWard === 'icu') return bedWard.includes('icu') || bedWard.includes('intensive');
        if (selectedWard === 'general') return bedWard.includes('general');
        if (selectedWard === 'pediatrics') return bedWard.includes('pediatric');
        if (selectedWard === 'maternity') return bedWard.includes('maternity');
        return bedWard === selectedWard;
      });

  const getStatusClass = (status) => {
    switch (status) {
      case 'available': return 'status-available';
      case 'occupied': return 'status-occupied';
      case 'cleaning': return 'status-cleaning';
      case 'reserved': return 'status-critical';
      default: return 'status-available';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'available': return 'Available';
      case 'occupied': return 'Occupied';
      case 'cleaning': return 'Cleaning';
      case 'reserved': return 'Reserved';
      default: return 'Available';
    }
  };

  const handleAddBed = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const payload = {
        ...newBedData,
        daily_rate: newBedData.daily_rate ? parseFloat(newBedData.daily_rate) : 0
      };

      const response = await apiFetch(isEditing ? NURSE_UPDATE_BED(editingBedId) : NURSE_BEDS, {
        method: isEditing ? 'PATCH' : 'POST',
        body: payload
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `Failed to ${isEditing ? 'update' : 'add'} bed`);
      }

      setIsEditing(false);
      setEditingBedId(null);

      setNewBedData({
        bed_number: '',
        bed_code: '',
        ward_id: '',
        status: 'AVAILABLE',
        bed_type: 'STANDARD',
        floor: '',
        room_number: '',
        bed_position: '',
        has_oxygen: false,
        has_suction: false,
        has_cardiac_monitor: false,
        has_ventilator: false,
        has_iv_pole: false,
        daily_rate: ''
      });
      setShowAddBedModal(false);
      fetchBeds();
    } catch (error) {
      console.error('Error adding bed:', error);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewBedData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEditClick = (bed) => {
    setIsEditing(true);
    setEditingBedId(bed.id);
    setNewBedData({
      bed_number: bed.bed_number || bed.number || '',
      bed_code: bed.bed_code || '',
      ward_id: bed.ward_id || bed.ward || '',
      status: (bed.status || 'AVAILABLE').toUpperCase(),
      bed_type: bed.bed_type || 'STANDARD',
      floor: bed.floor || '',
      room_number: bed.room_number || '',
      bed_position: bed.bed_position || '',
      has_oxygen: bed.has_oxygen || false,
      has_suction: bed.has_suction || false,
      has_cardiac_monitor: bed.has_cardiac_monitor || false,
      has_ventilator: bed.has_ventilator || false,
      has_iv_pole: bed.has_iv_pole || false,
      daily_rate: bed.daily_rate || ''
    });
    setShowAddBedModal(true);
  };

  const handleAddNewClick = () => {
    setIsEditing(false);
    setEditingBedId(null);
    setNewBedData({
      bed_number: '',
      bed_code: '',
      ward_id: '',
      status: 'AVAILABLE',
      bed_type: 'STANDARD',
      floor: '',
      room_number: '',
      bed_position: '',
      has_oxygen: false,
      has_suction: false,
      has_cardiac_monitor: false,
      has_ventilator: false,
      has_iv_pole: false,
      daily_rate: ''
    });
    setShowAddBedModal(true);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-700">Bed/Room Management</h2>
        <div className="flex gap-2">
          {/* Mobile Filter Toggle */}
          <button 
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="sm:hidden bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 flex items-center text-sm"
          >
            <i className="fas fa-filter mr-1"></i>Filters
          </button>
          <button 
            onClick={handleAddNewClick}
            className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 flex items-center text-sm sm:text-base sm:px-4"
          >
            <i className="fas fa-plus mr-1 sm:mr-2"></i>
            <span className="hidden sm:inline">Add Bed</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Desktop Filter Buttons */}
      <div className="hidden sm:block bg-white p-4 border rounded card-shadow">
        <div className="flex flex-wrap gap-2">
          {wardFilters.map(ward => (
            <button
              key={ward.id}
              onClick={() => setSelectedWard(ward.id)}
              className={`px-4 py-2 rounded-lg border ${
                selectedWard === ward.id 
                  ? 'bg-blue-100 text-blue-700 border-blue-300' 
                  : 'bg-gray-100 text-gray-700 border-gray-300'
              } hover:bg-blue-50 hover:border-blue-200 transition-colors`}
            >
              {ward.name}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Filter Dropdown */}
      {showMobileFilters && (
        <div className="sm:hidden bg-white p-4 border rounded card-shadow">
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-gray-700">Filter by Ward</h3>
              <button 
                onClick={() => setShowMobileFilters(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            {wardFilters.map(ward => (
              <button
                key={ward.id}
                onClick={() => {
                  setSelectedWard(ward.id);
                  setShowMobileFilters(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg border ${
                  selectedWard === ward.id 
                    ? 'bg-blue-100 text-blue-700 border-blue-300' 
                    : 'bg-gray-100 text-gray-700 border-gray-300'
                } hover:bg-blue-50 hover:border-blue-200 transition-colors`}
              >
                {ward.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Active Filter Display */}
      <div className="sm:hidden bg-blue-50 p-3 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-blue-700">
            Showing: <strong>{wardFilters.find(w => w.id === selectedWard)?.name}</strong>
          </span>
          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
            {filteredBeds.length} beds
          </span>
        </div>
      </div>

      {/* Beds Grid - Mobile Optimized */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {filteredBeds.map(bed => (
          <div key={bed.id} className="bg-white border rounded p-3 sm:p-4 card-shadow">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-blue-700 text-sm sm:text-base">Bed {bed.number}</h3>
                <button onClick={() => handleEditClick(bed)} className="text-gray-400 hover:text-blue-600 transition-colors" title="Edit Bed Details">
                  <i className="fas fa-edit"></i>
                </button>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(bed.status)}`}>
                {getStatusText(bed.status)}
              </span>
            </div>
            
            <div className="text-xs sm:text-sm text-gray-600 space-y-1">
              {bed.status === 'occupied' ? (
                <>
                  <p><strong>Patient:</strong> {bed.patient}</p>
                  <p><strong>Admitted:</strong> {new Date(bed.admitted).toLocaleDateString()}</p>
                  <p><strong>Condition:</strong> {bed.condition}</p>
                  <p><strong>Doctor:</strong> {bed.doctor}</p>
                </>
              ) : bed.status === 'reserved' ? (
                <>
                  <p><strong>Reserved For:</strong> Emergency</p>
                  <p><strong>Expected:</strong> {new Date(Date.now() + 2*60*60*1000).toLocaleTimeString()}</p>
                </>
              ) : (
                <>
                  <p><strong>Status:</strong> {bed.status === 'available' ? 'Ready for admission' : 'Under maintenance'}</p>
                  <p><strong>Last Occupied:</strong> {new Date(Date.now() - Math.random()*14*24*60*60*1000).toLocaleDateString()}</p>
                </>
              )}
            </div>
            
            <div className="mt-3 flex gap-1 sm:gap-2 flex-wrap">
              {bed.status === 'occupied' ? (
                <>
                  <button className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 flex-1 sm:flex-none">
                    Transfer
                  </button>
                  <button className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 flex-1 sm:flex-none">
                    Discharge
                  </button>
                </>
              ) : bed.status === 'reserved' ? (
                <button className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-200 w-full">
                  Cancel Reserve
                </button>
              ) : (
                <>
                  <button className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 flex-1 sm:flex-none">
                    Assign
                  </button>
                  {bed.status === 'cleaning' && (
                    <button className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 flex-1 sm:flex-none">
                      Mark Clean
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section - Mobile Stacked */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white p-3 sm:p-4 border rounded card-shadow">
          <h3 className="text-lg font-semibold mb-3">Bed Status Summary</h3>
          <div className="h-48 sm:h-64">
            <canvas ref={chartRef} id="bedChart"></canvas>
          </div>
        </div>
        
        <div className="bg-white p-3 sm:p-4 border rounded card-shadow">
          <h3 className="text-lg font-semibold mb-3">Bed Utilization</h3>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <div className="flex justify-between mb-1 text-sm">
                <span className="font-medium">General Ward</span>
                <span className="font-medium">85%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1 text-sm">
                <span className="font-medium">ICU</span>
                <span className="font-medium">92%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-red-600 h-2 rounded-full" style={{ width: '92%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1 text-sm">
                <span className="font-medium">Pediatrics</span>
                <span className="font-medium">65%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1 text-sm">
                <span className="font-medium">Maternity</span>
                <span className="font-medium">78%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: '78%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Bed Modal */}
      <Modal
        isOpen={showAddBedModal}
        onClose={() => setShowAddBedModal(false)}
        title={isEditing ? "Edit Bed Details" : "Add New Bed"}
        size="md"
      >
        <form onSubmit={handleAddBed} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bed Number
              </label>
              <input
                type="text"
                name="bed_number"
                value={newBedData.bed_number}
                onChange={handleInputChange}
                className="w-full border rounded p-2"
                placeholder="e.g., B-101"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bed Code
              </label>
              <input
                type="text"
                name="bed_code"
                value={newBedData.bed_code}
                onChange={handleInputChange}
                className="w-full border rounded p-2"
                placeholder="e.g., BED-ICU-101"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ward ID (or Name)
              </label>
              <input
                type="text"
                name="ward_id"
                value={newBedData.ward_id}
                onChange={handleInputChange}
                className="w-full border rounded p-2"
                placeholder="UUID or Name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={newBedData.status}
                onChange={handleInputChange}
                className="w-full border rounded p-2"
              >
                <option value="AVAILABLE">Available</option>
                <option value="CLEANING">Cleaning/Maintenance</option>
                <option value="RESERVED">Reserved</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bed Type
              </label>
              <select
                name="bed_type"
                value={newBedData.bed_type}
                onChange={handleInputChange}
                className="w-full border rounded p-2"
              >
                <option value="STANDARD">Standard</option>
                <option value="ICU">ICU</option>
                <option value="PEDIATRIC">Pediatric</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Daily Rate</label>
              <input type="number" name="daily_rate" value={newBedData.daily_rate} onChange={handleInputChange} className="w-full border rounded p-2" placeholder="e.g. 2500" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
              <input type="text" name="floor" value={newBedData.floor} onChange={handleInputChange} className="w-full border rounded p-2" placeholder="1st Floor" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
              <input type="text" name="room_number" value={newBedData.room_number} onChange={handleInputChange} className="w-full border rounded p-2" placeholder="R-12" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
              <input type="text" name="bed_position" value={newBedData.bed_position} onChange={handleInputChange} className="w-full border rounded p-2" placeholder="Window Side" />
            </div>
          </div>

          <div className="space-y-2 border-t pt-3">
            <p className="text-sm font-medium text-gray-700">Equipments</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="has_oxygen" checked={newBedData.has_oxygen} onChange={handleInputChange} /> Oxygen
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="has_suction" checked={newBedData.has_suction} onChange={handleInputChange} /> Suction
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="has_cardiac_monitor" checked={newBedData.has_cardiac_monitor} onChange={handleInputChange} /> Cardiac Monitor
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="has_ventilator" checked={newBedData.has_ventilator} onChange={handleInputChange} /> Ventilator
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="has_iv_pole" checked={newBedData.has_iv_pole} onChange={handleInputChange} /> IV Pole
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={() => setShowAddBedModal(false)}
              className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add Bed
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BedManagement;