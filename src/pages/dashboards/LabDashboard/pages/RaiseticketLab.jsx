// SupportManagement.jsx - Staff Ticket Management (Only Priority Cards)
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Modal from '../../../../components/common/Modal/Modal';
import { apiFetch } from '../../../../services/apiClient';

const SupportManagement = () => {
  // Get auth state from Redux
  const token = useSelector((state) => state.auth?.token);
  const user = useSelector((state) => state.auth?.user);
  
  // State Management
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form Data States for Create Ticket
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'NORMAL'
  });
  
  // Error States
  const [formErrors, setFormErrors] = useState({});
  
  // Filter and Pagination States
  const [filters, setFilters] = useState({
    status: '',
    skip: 0,
    limit: 50
  });
  
  const [pagination, setPagination] = useState({
    total: 0,
    skip: 0,
    limit: 50
  });

  // Stats for priority cards only
  const [stats, setStats] = useState({
    critical: 0,
    urgent: 0,
    high: 0,
    normal: 0,
    low: 0
  });

  // Helper function to format ticket ID (first 8 chars of UUID)
  const formatTicketId = (ticketId) => {
    if (!ticketId) return 'N/A';
    return ticketId.substring(0, 8);
  };

  // Update priority stats only
  const updateStats = (ticketsList) => {
    const critical = ticketsList.filter(t => t.priority === 'CRITICAL').length;
    const urgent = ticketsList.filter(t => t.priority === 'URGENT').length;
    const high = ticketsList.filter(t => t.priority === 'HIGH').length;
    const normal = ticketsList.filter(t => t.priority === 'NORMAL').length;
    const low = ticketsList.filter(t => t.priority === 'LOW').length;
    
    setStats({
      critical,
      urgent,
      high,
      normal,
      low
    });
  };

  // Fetch tickets
  useEffect(() => {
    if (!connectionError && token) {
      fetchTickets();
    }
  }, [filters.skip, filters.limit, filters.status, token]);

  const fetchTickets = async () => {
    setLoading(true);
    setConnectionError(false);
    try {
      if (!token) {
        toast.warning('Please login to view tickets');
        setLoading(false);
        return;
      }
      const queryParams = new URLSearchParams({
        skip: filters.skip,
        limit: filters.limit,
        completed_only: false
      });
      if (filters.status) {
        queryParams.append('status', filters.status);
      }
      const endpoint = `/api/v1/support/staff/tickets?${queryParams.toString()}`;
      console.log('Fetching tickets from:', endpoint);
      const response = await apiFetch(endpoint, { method: "GET" });
      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Authentication failed. Please login again.');
          setLoading(false);
          return;
        }
        if (response.status === 403) {
          toast.error('You do not have permission to view tickets');
          setTickets([]);
          updateStats([]);
          setLoading(false);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Tickets API Response:', data);
      let ticketsData = data?.tickets || [];
      // Sort by priority
      const priorityOrder = { 'CRITICAL': 1, 'URGENT': 2, 'HIGH': 3, 'NORMAL': 4, 'LOW': 5 };
      ticketsData = [...ticketsData].sort((a, b) => {
        const orderA = priorityOrder[a.priority] || 99;
        const orderB = priorityOrder[b.priority] || 99;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(b.created_at) - new Date(a.created_at);
      });
      setTickets(ticketsData);
      updateStats(ticketsData);
      setPagination({
        total: data?.total || ticketsData.length,
        skip: data?.skip || filters.skip,
        limit: data?.limit || filters.limit
      });
      setConnectionError(false);
    }
    catch (error) {
      console.error("Fetch error:", error);
      if (error.message.includes('Failed to fetch')) {
        setConnectionError(true);
        toast.error('Cannot connect to server');
      }
      else {
        toast.error(error.message || 'Failed to fetch tickets');
      }
      setTickets([]);
      updateStats([]);
    }
    finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.subject.trim()) {
      errors.subject = "Subject is required";
    }
    else if (formData.subject.trim().length < 3) {
      errors.subject = "Subject must be at least 3 characters";
    }
    else if (formData.subject.trim().length > 200) {
      errors.subject = "Subject must not exceed 200 characters";
    }
    if (!formData.description.trim()) {
      errors.description = "Description is required";
    }
    else if (formData.description.trim().length < 5) {
      errors.description = "Description must be at least 5 characters";
    }
    else if (formData.description.trim().length > 1000) {
      errors.description = "Description must not exceed 1000 characters";
    }
    if (!formData.priority) {
      errors.priority = "Priority is required";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      if (!token) {
        toast.error('Please login to create a ticket');
        setSubmitting(false);
        return;
      }
      const payload = {
        subject: formData.subject.trim(),
        description: formData.description.trim(),
        priority: formData.priority
      };
      console.log('Creating ticket with payload:', payload);
      const response = await apiFetch('/api/v1/support/staff/tickets', {
        method: "POST",
        body: payload,
      });
      const responseData = await response.json();
      if (!response.ok) {
        if (response.status === 422 && responseData.detail) {
          const validationErrors = responseData.detail;
          const fieldErrors = {};
          validationErrors.forEach(err => {
            if (err.loc && err.loc.length > 1) {
              const fieldName = err.loc[err.loc.length - 1];
              fieldErrors[fieldName] = err.msg;
            }
          });
          if (Object.keys(fieldErrors).length > 0) {
            setFormErrors(fieldErrors);
            throw new Error('Please fix the validation errors');
          }
        }
        throw new Error(responseData.message || responseData.detail || `Failed to create ticket: ${response.statusText}`);
      }
      toast.success(`✅ ${responseData.message || 'Ticket created successfully!'}`);
      setFormData({
        subject: '',
        description: '',
        priority: 'NORMAL'
      });
      setFormErrors({});
      setShowCreateModal(false);
      await fetchTickets();
    }
    catch (error) {
      console.error("Create ticket error:", error);
      toast.error(error.message || "Failed to create ticket. Please try again.");
    }
    finally {
      setSubmitting(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      skip: 0
    }));
  };

  const handleNextPage = () => {
    if (filters.skip + filters.limit < pagination.total) {
      setFilters(prev => ({
        ...prev,
        skip: prev.skip + prev.limit
      }));
    }
  };

  const handlePrevPage = () => {
    if (filters.skip > 0) {
      setFilters(prev => ({
        ...prev,
        skip: Math.max(0, prev.skip - prev.limit)
      }));
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      'OPEN': 'bg-yellow-100 text-yellow-800',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800',
      'RESOLVED': 'bg-green-100 text-green-800',
      'CLOSED': 'bg-gray-100 text-gray-800'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityBadgeClass = (priority) => {
    const priorityMap = {
      'CRITICAL': 'bg-red-700 text-white',
      'URGENT': 'bg-red-100 text-red-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'NORMAL': 'bg-blue-100 text-blue-800',
      'LOW': 'bg-gray-100 text-gray-800'
    };
    return priorityMap[priority] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFilteredTickets = () => {
    if (!searchTerm) return tickets;
    
    const searchLower = searchTerm.toLowerCase();
    return tickets.filter(ticket => {
      return (
        ticket.id?.toLowerCase().includes(searchLower) ||
        ticket.subject?.toLowerCase().includes(searchLower) ||
        ticket.status?.toLowerCase().includes(searchLower) ||
        ticket.priority?.toLowerCase().includes(searchLower) ||
        ticket.description?.toLowerCase().includes(searchLower)
      );
    });
  };

  const filteredTickets = getFilteredTickets();

  if (connectionError) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <ToastContainer position="top-right" autoClose={5000} />
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-red-800">Cannot Connect to Server</h3>
          <p className="mt-1 text-sm text-red-600">Please ensure the backend server is running</p>
          <button onClick={() => fetchTickets()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700" >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <ToastContainer position="top-right" autoClose={5000} />
      
      {/* Header - Changed to "Raise Ticket" */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
          Raise Ticket
        </h1>
        <p className="text-gray-600 mt-2">
          Create and track your support requests
        </p>
      </div>

      {/* ONLY 5 Priority Cards - Enhanced Design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 mb-8">
        {/* CRITICAL */}
        <div className="group relative bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-5 border border-red-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-red-200 rounded-full -mr-10 -mt-10 opacity-20 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-red-600 mb-3 shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-red-700 uppercase tracking-wider">CRITICAL</p>
            <p className="text-3xl font-bold text-red-800 mt-1">{stats.critical}</p>
            <p className="text-xs text-red-600 mt-1">Immediate attention</p>
          </div>
        </div>

        {/* URGENT */}
        <div className="group relative bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-5 border border-orange-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-orange-200 rounded-full -mr-10 -mt-10 opacity-20 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-orange-500 mb-3 shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-orange-700 uppercase tracking-wider">URGENT</p>
            <p className="text-3xl font-bold text-orange-800 mt-1">{stats.urgent}</p>
            <p className="text-xs text-orange-600 mt-1">Address soon</p>
          </div>
        </div>

        {/* HIGH */}
        <div className="group relative bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-5 border border-yellow-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-200 rounded-full -mr-10 -mt-10 opacity-20 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-yellow-600 mb-3 shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wider">HIGH</p>
            <p className="text-3xl font-bold text-yellow-800 mt-1">{stats.high}</p>
            <p className="text-xs text-yellow-600 mt-1">Needs quick action</p>
          </div>
        </div>

        {/* NORMAL */}
        <div className="group relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5 border border-blue-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200 rounded-full -mr-10 -mt-10 opacity-20 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-600 mb-3 shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">NORMAL</p>
            <p className="text-3xl font-bold text-blue-800 mt-1">{stats.normal}</p>
            <p className="text-xs text-blue-600 mt-1">Standard priority</p>
          </div>
        </div>

        {/* LOW */}
        <div className="group relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gray-200 rounded-full -mr-10 -mt-10 opacity-20 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-500 mb-3 shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">LOW</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{stats.low}</p>
            <p className="text-xs text-gray-600 mt-1">Can wait</p>
          </div>
        </div>
      </div>

      {/* Search and Actions Bar */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input type="text" placeholder="Search tickets by ID, subject, status, or priority..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <select className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} >
              <option value="">All Status</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>

            <button onClick={() => setShowCreateModal(true)}
              className="px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium flex items-center gap-2" >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Ticket
            </button>
          </div>
        </div>
      </div>

      {/* Tickets Table (unchanged functionality) */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Loading tickets...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No tickets found</h3>
            <p className="text-gray-500 mb-6">Create your first support ticket</p>
            <button onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all" >
              Create First Ticket
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <th className="py-4 px-6 text-center text-sm font-semibold text-gray-700">Ticket ID</th>
                    <th className="py-4 px-6 text-center text-sm font-semibold text-gray-700">Subject</th>
                    <th className="py-4 px-6 text-center text-sm font-semibold text-gray-700">Status</th>
                    <th className="py-4 px-6 text-center text-sm font-semibold text-gray-700">Priority</th>
                    <th className="py-4 px-6 text-center text-sm font-semibold text-gray-700">Created</th>
                    <th className="py-4 px-6 text-center text-sm font-semibold text-gray-700">Last Updated</th>
                    <th className="py-4 px-6 text-center text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="border-b border-gray-100 hover:bg-blue-50/30 transition-all duration-300">
                      <td className="py-4 px-6 text-center">
                        <p className="font-mono font-semibold text-blue-600 text-sm">
                          {formatTicketId(ticket.id)}
                        </p>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <p className="text-gray-700 max-w-md mx-auto truncate" title={ticket.subject}>
                          {ticket.subject}
                        </p>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityBadgeClass(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-gray-500">
                        {formatDate(ticket.created_at)}
                       </td>
                      <td className="py-4 px-6 text-center text-sm text-gray-500">
                        {formatDate(ticket.updated_at)}
                       </td>
                      <td className="py-4 px-6 text-center">
                        <button onClick={() => {
                            setSelectedTicket(ticket);
                            setShowViewModal(true);
                          }}
                          className="w-8 h-8 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg flex items-center justify-center transition-colors"
                          title="View Details" >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                       </td>
                     </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 bg-white border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{pagination.skip + 1}</span> to
                <span className="font-medium">
                  {Math.min(pagination.skip + pagination.limit, pagination.total)}
                </span>
                of <span className="font-medium">{pagination.total}</span> results
              </div>
              <div className="flex space-x-2">
                <button onClick={handlePrevPage} disabled={pagination.skip === 0}
                  className={`px-3 py-1 rounded border ${
                    pagination.skip === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`} >
                  Previous
                </button>
                <button disabled={pagination.skip + pagination.limit >= pagination.total} onClick={handleNextPage}
                  className={`px-3 py-1 rounded border ${
                    pagination.skip + pagination.limit >= pagination.total
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`} >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create Ticket Modal (unchanged) */}
      <Modal isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setFormErrors({});
        }}
        title="Create Support Ticket" size="lg" >
        <form onSubmit={handleCreateTicket} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Subject *</label>
              <input type="text" value={formData.subject}
                onChange={(e) => {
                  setFormData({...formData, subject: e.target.value});
                  setFormErrors({...formErrors, subject: ''});
                }}
                className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${formErrors.subject ? 'border-red-400' : 'border-gray-200'}`}
                placeholder="Enter ticket subject"
              />
              {formErrors.subject && <p className="mt-1 text-sm text-red-600">{formErrors.subject}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Description *</label>
              <textarea value={formData.description}
                onChange={(e) => {
                  setFormData({...formData, description: e.target.value});
                  setFormErrors({...formErrors, description: ''});
                }}
                rows="5" placeholder="Enter detailed description"
                className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all ${formErrors.description ? 'border-red-400' : 'border-gray-200'}`}
              />
              {formErrors.description && <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Priority *</label>
              <select value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" >
                <option value="CRITICAL">🔴 CRITICAL</option>
                <option value="URGENT">🟠 URGENT</option>
                <option value="HIGH">🟡 HIGH</option>
                <option value="NORMAL">🔵 NORMAL</option>
                <option value="LOW">⚪ LOW</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button type="button"
              onClick={() => {
                setShowCreateModal(false);
                setFormErrors({});
              }}
              className="px-5 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200 font-medium" >
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium flex items-center gap-2 disabled:opacity-60" >
              {submitting ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Creating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Ticket
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Ticket Modal (unchanged) */}
      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Ticket Details" size="lg" >
        {selectedTicket && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Ticket ID</label>
                <p className="font-mono font-semibold text-blue-600">{selectedTicket.id}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Status</label>
                <div>
                  <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusBadgeClass(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Priority</label>
                <div>
                  <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getPriorityBadgeClass(selectedTicket.priority)}`}>
                    {selectedTicket.priority}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Hospital ID</label>
                <p className="font-medium text-gray-900 text-sm">
                  {selectedTicket.hospital_id?.substring(0, 8)}...
                </p>
              </div>
            </div>
            
            <div>
              <label className="text-sm text-gray-500 font-semibold">Subject</label>
              <p className="font-medium text-gray-900 bg-gray-50 p-4 rounded-xl mt-1 border border-gray-200">
                {selectedTicket.subject}
              </p>
            </div>
            
            <div>
              <label className="text-sm text-gray-500 font-semibold block mb-2">Description</label>
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 min-h-[150px] whitespace-pre-wrap break-words">
                {selectedTicket.description || 'No description provided'}
              </div>
            </div>
            
            {selectedTicket.resolution_notes && selectedTicket.resolution_notes.trim() && (
              <div>
                <label className="text-sm text-gray-500 font-semibold">Resolution Notes</label>
                <div className="bg-green-50 p-4 rounded-xl mt-1 border border-green-200">
                  <p className="whitespace-pre-wrap text-gray-800 break-words">{selectedTicket.resolution_notes}</p>
                </div>
              </div>
            )}
            
            {selectedTicket.resolved_at && (
              <div>
                <label className="text-sm text-gray-500 font-semibold">Resolved At</label>
                <p className="font-medium text-gray-900">{formatDate(selectedTicket.resolved_at)}</p>
              </div>
            )}
            
            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-gray-500">Created Date</label>
                  <p className="font-medium text-gray-900">{formatDate(selectedTicket.created_at)}</p>
                </div>
                {selectedTicket.updated_at && selectedTicket.updated_at !== selectedTicket.created_at && (
                  <div>
                    <label className="text-gray-500">Last Updated</label>
                    <p className="font-medium text-gray-900">{formatDate(selectedTicket.updated_at)}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end">
              <button onClick={() => setShowViewModal(false)}
                className="px-5 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all duration-200 font-medium" >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SupportManagement;