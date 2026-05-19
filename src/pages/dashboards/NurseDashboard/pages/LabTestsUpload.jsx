import React, { useState, useEffect } from 'react';
import Modal from '../../../../components/common/Modal/Modal';
import { apiFetch } from '../../../../services/apiClient';
import { NURSE_LAB_TESTS, NURSE_ASSIGNED_PATIENTS, NURSE_UPDATE_LAB_TEST } from '../../../../config/api';

const LabTestsUpload = () => {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [formData, setFormData] = useState({
    patient: '',
    testType: '',
    reason: '',
    priority: 'Routine',
    doctor: 'Dr. Meena Rao'
  });

  const fetchLabTests = async () => {
    setLoading(true);
    try {
      const response = await apiFetch(NURSE_LAB_TESTS);
      if (response && response.ok) {
        const data = await response.json();
        console.log('Raw Lab Tests data:', data);
        const rawLabs = Array.isArray(data?.data) ? data.data : [];
        
        const mappedLabs = rawLabs.flatMap(record => {
          // If the record has lab_orders, map each order to a row
          const orders = Array.isArray(record.lab_orders) && record.lab_orders.length > 0 
            ? record.lab_orders 
            : [record]; // fallback if it's a flat structure
            
          return orders.map((order, idx) => ({
            ...record,
            id: record.id,
            patient: record.patient_name || record.patient || record.patient_id || 'N/A',
            testType: order.test_type || order.test_name || record.test_type || 'N/A',
            doctor: order.requesting_doctor || record.doctor_name || record.doctor_id || 'N/A',
            orderedDate: order.requested_at ? new Date(order.requested_at).toLocaleDateString() : (record.created_at ? new Date(record.created_at).toLocaleDateString() : 'N/A'),
            status: (record.status || 'pending').toLowerCase(),
            result: record.result || null,
            reason: order.reason_for_test || record.reason || '',
            priority: order.priority || record.priority || 'Routine'
          }));
        });
        
        setLabs(mappedLabs);
      }
    } catch (error) {
      console.error('Error fetching lab data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await apiFetch(NURSE_ASSIGNED_PATIENTS);
      if (response && response.ok) {
        const data = await response.json();
        setPatients(data?.data || []);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  useEffect(() => {
    fetchLabTests();
    fetchPatients();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        admission_number: formData.patient,
        test_type: formData.testType,
        reason: formData.reason,
        priority: formData.priority,
        requesting_doctor: formData.doctor
      };

      const response = await apiFetch(isEditing ? NURSE_UPDATE_LAB_TEST(editingRecordId) : NURSE_LAB_TESTS, {
        method: isEditing ? 'PATCH' : 'POST',
        body: payload
      });

      if (response && response.ok) {
        alert(`Lab test request ${isEditing ? 'updated' : 'saved'} successfully`);
        fetchLabTests(); // Refresh the list
        setFormData({
          patient: '',
          testType: '',
          reason: '',
          priority: 'Routine',
          doctor: 'Dr. Meena Rao'
        });
        setIsEditing(false);
        setEditingRecordId(null);
        setIsModalOpen(false);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.message || 'Failed to save lab test request');
      }
    } catch (error) {
      console.error('Error requesting lab test:', error);
      alert('Error requesting lab test');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (lab) => {
    setIsEditing(true);
    setEditingRecordId(lab.id);
    setFormData({
      patient: lab.admission_number || lab.patient_id || lab.patient || '',
      testType: lab.testType || lab.test_type || '',
      reason: lab.reason || '',
      priority: lab.priority || 'Routine',
      doctor: lab.doctor || lab.requesting_doctor || 'Dr. Meena Rao'
    });
    setIsModalOpen(true);
  };

  const handleAddNewClick = () => {
    setIsEditing(false);
    setEditingRecordId(null);
    setFormData({
      patient: '',
      testType: '',
      reason: '',
      priority: 'Routine',
      doctor: 'Dr. Meena Rao'
    });
    setIsModalOpen(true);
  };

  const handleFileUpload = (patientId, testType) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf';
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        console.log(`Lab report uploaded for Patient ${patientId}`);

        const updatedLabs = labs.map(lab =>
          lab.id === patientId ? { ...lab, status: 'completed', result: 'Uploaded' } : lab
        );
        setLabs(updatedLabs);
      }
    };
    fileInput.click();
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'urgent': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'pending': return 'Pending';
      case 'urgent': return 'Urgent';
      default: return 'Pending';
    }
  };

  const getResultClass = (result) => {
    switch (result) {
      case 'Normal': return 'bg-green-100 text-green-800 border border-green-200';
      case 'Abnormal': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'Inconclusive': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="w-full mx-auto max-w-7xl px-3 sm:px-0 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center sticky top-0 z-10 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/40 py-2 sm:py-0 border-b mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg sm:text-2xl font-semibold text-gray-700">Lab Tests & Reports</h2>
            {loading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchLabTests}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              title="Refresh Data"
            >
              <i className={`fas fa-sync-alt ${loading ? 'animate-spin' : ''}`}></i>
            </button>
            <button 
              onClick={handleAddNewClick}
              className="bg-blue-600 text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg hover:bg-blue-700 flex items-center shadow-sm text-sm"
            >
              <i className="fas fa-plus mr-1.5 sm:mr-2"></i>
              <span className="hidden sm:inline">Request Test</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>

        {/* Modal for new/edit request */}
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          title={isEditing ? "Edit Lab Request" : "Request Lab Test"}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                <input
                  type="text"
                  name="patient"
                  value={formData.patient}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  placeholder="Enter Patient ID or Name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Test Type</label>
                <select
                  name="testType"
                  value={formData.testType}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg p-2.5 text-sm"
                  required
                >
                  <option value="">Select Test Type</option>
                  <option>Blood Test</option>
                  <option>Urine Test</option>
                  <option>X-Ray</option>
                  <option>CT Scan</option>
                  <option>MRI</option>
                  <option>Ultrasound</option>
                  <option>ECG</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Test</label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg p-2.5 text-sm"
                  placeholder="Describe the reason for this test"
                  rows="3"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg p-2.5 text-sm"
                  >
                    <option>Routine</option>
                    <option>Urgent</option>
                    <option>Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Requesting Doctor</label>
                  <input
                    type="text"
                    name="doctor"
                    value={formData.doctor}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    placeholder="Enter doctor's name"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-4 border-t">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 border rounded-lg text-gray-700 hover:bg-gray-100 text-sm font-medium transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-all shadow-md active:transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <i className="fas fa-spinner animate-spin"></i>}
                <span>{loading ? 'Processing...' : 'Request Test'}</span>
              </button>
            </div>
          </form>
        </Modal>

        {/* Lab Tests Grid - tighter gaps on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {loading && labs.length === 0 ? (
            <div className="col-span-full py-20 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading lab tests...</p>
            </div>
          ) : labs.length > 0 ? (
            labs.map((lab) => (
              <div key={lab.id} className="bg-white border rounded-xl p-3 sm:p-4 card-shadow fade-in w-full">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-blue-700 text-base sm:text-lg leading-snug">{lab.testType}</h3>
                    <button onClick={() => handleEditClick(lab)} className="text-gray-400 hover:text-blue-600 transition-colors" title="Edit Request">
                      <i className="fas fa-edit"></i>
                    </button>
                  </div>
                  <span className={`px-2.5 py-1.5 rounded-full text-[11px] sm:text-xs font-medium w-fit self-start sm:self-auto ${getStatusClass(lab.status)}`}>
                    {getStatusText(lab.status)}
                  </span>
                </div>

                {/* Patient Info - compact rows on mobile */}
                <div className="space-y-2.5 mb-3">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-user text-gray-400 text-sm w-4 shrink-0"></i>
                    <span className="text-sm text-gray-700 truncate">{lab.patient}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="fas fa-user-md text-gray-400 text-sm w-4 shrink-0"></i>
                    <span className="text-sm text-gray-700 truncate">{lab.doctor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="fas fa-calendar text-gray-400 text-sm w-4 shrink-0"></i>
                    <span className="text-sm text-gray-700">{lab.orderedDate}</span>
                  </div>
                </div>

                {/* Result or Upload Section */}
                {lab.status === 'completed' || lab.status === 'ready' ? (
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">Result:</span>
                      <span className={`px-2 py-1 rounded text-[11px] sm:text-xs font-medium ${getResultClass(lab.result)}`}>
                        {lab.result || 'Available'}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button className="w-full sm:flex-1 bg-blue-50 text-blue-700 px-3 py-2.5 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-1 text-sm font-medium">
                        <i className="fas fa-eye text-xs"></i>
                        <span>View</span>
                      </button>
                      <button className="w-full sm:flex-1 bg-green-50 text-green-700 px-3 py-2.5 rounded-lg hover:bg-green-100 flex items-center justify-center gap-1 text-sm font-medium">
                        <i className="fas fa-print text-xs"></i>
                        <span>Print</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-t pt-3">
                    <label className="w-full bg-blue-50 text-blue-700 px-3 py-3 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-2 text-sm font-medium cursor-pointer border border-blue-200">
                      <i className="fas fa-upload text-sm"></i>
                      <span className="truncate">Upload Report (PDF)</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={() => handleFileUpload(lab.id, lab.testType)}
                        accept=".pdf"
                      />
                    </label>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-white border rounded-xl border-dashed">
              <i className="fas fa-flask text-4xl text-gray-300 mb-3"></i>
              <p className="text-gray-500 font-medium">No lab tests found</p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="mt-2 text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                Request New Test
              </button>
            </div>
          )}
        </div>

        {/* Recent Lab Results Table */}
        <div className="bg-white p-3 sm:p-4 border rounded-xl card-shadow overflow-x-auto">
          <h3 className="text-lg font-semibold mb-3">Recent Lab Results</h3>
          <div className="min-w-[720px]">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-600">
                <tr className="text-left">
                  <th className="px-3 py-2 sm:px-4 sm:py-2 text-xs sticky left-0 bg-gray-100">Test</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-2 text-xs">Patient</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-2 text-xs">Date</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-2 text-xs">Result</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-2 text-xs">Status</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-2 text-xs">Actions</th>
                </tr>
              </thead>
              <tbody>
                {labs.map((lab) => (
                  <tr key={lab.id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm whitespace-nowrap">{lab.testType}</td>
                    <td className="px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm whitespace-nowrap">{lab.patient}</td>
                    <td className="px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm whitespace-nowrap">{lab.orderedDate}</td>
                    <td className="px-3 py-2 sm:px-4 sm:py-2">
                      <span className={`px-2 py-1 rounded-full text-[11px] sm:text-xs ${getResultClass(lab.result)}`}>
                        {lab.result || 'Pending'}
                      </span>
                    </td>
                    <td className="px-3 py-2 sm:px-4 sm:py-2">
                      <span className={`px-2 py-1 rounded-full text-[11px] sm:text-xs ${getStatusClass(lab.status)}`}>
                        {getStatusText(lab.status)}
                      </span>
                    </td>
                    <td className="px-3 py-2 sm:px-4 sm:py-2">
                      <div className="flex gap-2">
                        <button onClick={() => handleEditClick(lab)} className="p-2 rounded hover:bg-blue-50 text-blue-600" aria-label="Edit">
                          <i className="fas fa-edit text-sm"></i>
                        </button>
                        <button className="p-2 rounded hover:bg-green-50 text-green-600" aria-label="Download">
                          <i className="fas fa-download text-sm"></i>
                        </button>
                        <button className="p-2 rounded hover:bg-purple-50 text-purple-600" aria-label="Share">
                          <i className="fas fa-share text-sm"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LabTestsUpload;
