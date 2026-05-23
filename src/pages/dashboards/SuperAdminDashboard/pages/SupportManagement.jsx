// SupportManagement.jsx - Complete Frontend with Email Integration
import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const SupportManagement = () => {
  // State Management
  const [tickets, setTickets] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showClosedOnly, setShowClosedOnly] = useState(false); // New state for showing only closed tickets
  
  // Form Data States
  const [formData, setFormData] = useState({
    hospital_id: '',
    subject: '',
    description: '',
    priority: 'NORMAL',
    send_email: true,
    additional_emails: ''
  });
  
  const [statusUpdateData, setStatusUpdateData] = useState({
    status: '',
    resolution_notes: ''
  });
  
  // Error States
  const [formErrors, setFormErrors] = useState({});
  const [statusErrors, setStatusErrors] = useState({});
  
  // Filter and Pagination States
  const [filters, setFilters] = useState({
    hospital_id: '',
    status: '',
    skip: 0,
    limit: 50
  });
  
  const [pagination, setPagination] = useState({
    total: 0,
    skip: 0,
    limit: 50
  });

  const getAuthToken = () => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    return token || '';
  };

  // Helper function to extract ONLY numeric ID
  const getPureNumericTicketId = (ticketId) => {
    if (!ticketId) return '000000000000';
    const numbersOnly = ticketId.toString().replace(/\D/g, '');
    if (!numbersOnly) return '000000000000';
    const cleanedNumber = numbersOnly.replace(/^0+/, '') || '0';
    return cleanedNumber;
  };

  // Format ticket ID to 12 digits
  const formatEqualNumericId = (ticketId) => {
    const numericId = getPureNumericTicketId(ticketId);
    return numericId.padStart(12, '0').slice(0, 12);
  };

  // Function to get description from ticket - IMPROVED VERSION
  const getTicketDescription = (ticket) => {
    if (!ticket) return '';
    
    // Check all possible description fields
    if (ticket.description && ticket.description.trim()) {
      return ticket.description;
    }
    if (ticket.desc && ticket.desc.trim()) {
      return ticket.desc;
    }
    if (ticket.ticket_description && ticket.ticket_description.trim()) {
      return ticket.ticket_description;
    }
    if (ticket.content && ticket.content.trim()) {
      return ticket.content;
    }
    if (ticket.details && ticket.details.trim()) {
      return ticket.details;
    }
    
    return '';
  };

  // Priority order mapping
  const getPriorityOrder = (priority) => {
    const order = {
      'URGENT': 1,
      'HIGH': 2,
      'NORMAL': 3,
      'LOW': 4
    };
    return order[priority] || 5;
  };

  // Fetch hospitals
  useEffect(() => {
    fetchHospitals();
  }, []);

  // Fetch tickets
  useEffect(() => {
    if (!connectionError) {
      fetchTickets();
    }
  }, [filters.skip, filters.limit, filters.status, filters.hospital_id]);

  const fetchHospitals = async () => {
    setLoadingHospitals(true);
    try {
      const token = getAuthToken();
      
      if (!token) {
        toast.warning('Please login to load hospitals');
        setLoadingHospitals(false);
        return;
      }
      
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      };

      const res = await fetch('/api/v1/super-admin/hospitals', {
        method: "GET",
        headers: headers
      });
      
      if (res.ok) {
        const data = await res.json();
        let hospitalsList = [];
        if (Array.isArray(data)) {
          hospitalsList = data;
        } else if (data.data && Array.isArray(data.data)) {
          hospitalsList = data.data;
        } else if (data.hospitals && Array.isArray(data.hospitals)) {
          hospitalsList = data.hospitals;
        }
        setHospitals(hospitalsList);
      } else {
        toast.error('Failed to load hospitals');
      }
    } catch (error) {
      console.error("Error fetching hospitals:", error);
      toast.error("Failed to load hospitals list");
    } finally {
      setLoadingHospitals(false);
    }
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      
      const params = {
        skip: filters.skip,
        limit: filters.limit
      };
      if (filters.status) params.status = filters.status;
      if (filters.hospital_id) params.hospital_id = filters.hospital_id;

      const query = new URLSearchParams(params);

      const headers = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(
        `/api/v1/super-admin/support/tickets?${query}`,
        {
          method: "GET",
          headers: headers
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      
      let ticketsData = Array.isArray(data) ? data : (data?.tickets || data?.data || []);
      if (!Array.isArray(ticketsData)) ticketsData = [];
      
      // Log the first ticket to see its structure
      if (ticketsData.length > 0) {
        console.log('Ticket data structure:', ticketsData[0]);
        console.log('Description field:', ticketsData[0].description);
      }
      
      // Sort tickets by priority
      ticketsData = [...ticketsData].sort((a, b) => {
        const priorityOrderA = getPriorityOrder(a.priority);
        const priorityOrderB = getPriorityOrder(b.priority);
        if (priorityOrderA !== priorityOrderB) {
          return priorityOrderA - priorityOrderB;
        }
        return new Date(b.created_at) - new Date(a.created_at);
      });
      
      setTickets(ticketsData);
      setPagination({
        total: data?.total || ticketsData.length,
        skip: data?.skip || 0,
        limit: data?.limit || 50
      });
      setConnectionError(false);

    } catch (error) {
      console.error("Fetch error:", error);
      if (error.message.includes('Failed to fetch')) {
        setConnectionError(true);
        toast.error('Cannot connect to server');
      } else {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to send email using your existing email API endpoint
  const sendEmailViaAPI = async (toEmail, subject, htmlContent, textContent = '') => {
    try {
      const token = getAuthToken();
      
      // Try different possible email endpoints based on your backend
      const emailEndpoints = [
        '/api/v1/email/send',
        '/api/v1/email/send-email',
        '/api/v1/notifications/email',
        '/api/v1/send-email'
      ];
      
      let response = null;
      let success = false;
      
      // Try each endpoint until one works
      for (const endpoint of emailEndpoints) {
        try {
          response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              to_email: toEmail,
              subject: subject,
              html_content: htmlContent,
              text_content: textContent || htmlContent.replace(/<[^>]*>/g, ''),
              // Include other fields your API might expect
              email: toEmail,
              message: htmlContent,
              body: htmlContent
            })
          });
          
          if (response.ok) {
            success = true;
            console.log(`Email sent successfully using endpoint: ${endpoint}`);
            break;
          }
        } catch (err) {
          console.log(`Endpoint ${endpoint} failed:`, err.message);
          continue;
        }
      }
      
      if (!success) {
        // If all endpoints fail, try the OTP/Verification pattern
        response = await fetch('/api/v1/email/send-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            email: toEmail,
            subject: subject,
            message: htmlContent,
            html_content: htmlContent
          })
        });
        
        if (!response.ok) {
          throw new Error('All email endpoints failed');
        }
      }
      
      return await response.json();
      
    } catch (error) {
      console.error('Email send error:', error);
      throw error;
    }
  };

  // Create email HTML for ticket creation
  const createTicketEmailHTML = (ticket, hospital, createdBy) => {
    const formattedId = formatEqualNumericId(ticket.id);
    const createdDate = new Date().toLocaleDateString('en-US', {
      dateStyle: 'full'
    });
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .email-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .email-header h1 {
            margin: 0;
            font-size: 28px;
          }
          .email-content {
            padding: 30px 25px;
            background: #f9fafb;
          }
          .ticket-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            border-left: 4px solid #667eea;
          }
          .ticket-id {
            font-size: 20px;
            font-weight: bold;
            color: #667eea;
            font-family: monospace;
            margin-bottom: 15px;
          }
          .info-row {
            margin: 12px 0;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .info-label {
            font-weight: 600;
            color: #4b5563;
            display: inline-block;
            width: 100px;
          }
          .info-value {
            color: #1f2937;
            display: inline-block;
          }
          .priority-badge {
            display: inline-block;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
          }
          .priority-URGENT { background-color: #fee2e2; color: #dc2626; }
          .priority-HIGH { background-color: #ffedd5; color: #ea580c; }
          .priority-NORMAL { background-color: #dbeafe; color: #2563eb; }
          .priority-LOW { background-color: #f3f4f6; color: #6b7280; }
          .status-badge {
            display: inline-block;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            background-color: #fef3c7;
            color: #d97706;
          }
          .description-box {
            background-color: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            margin-top: 15px;
            border: 1px solid #e5e7eb;
          }
          .email-footer {
            background-color: #f3f4f6;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            margin: 20px 0;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <h1>🎫 New Support Ticket Created</h1>
          </div>
          <div class="email-content">
            <p>Dear Team,</p>
            <p>A new support ticket has been created and requires your attention.</p>
            
            <div class="ticket-card">
              <div class="ticket-id">Ticket #${formattedId}</div>
              
              <div class="info-row">
                <span class="info-label">Subject:</span>
                <span class="info-value">${ticket.subject}</span>
              </div>
              
              <div class="info-row">
                <span class="info-label">Priority:</span>
                <span class="info-value">
                  <span class="priority-badge priority-${ticket.priority}">${ticket.priority}</span>
                </span>
              </div>
              
              <div class="info-row">
                <span class="info-label">Status:</span>
                <span class="info-value">
                  <span class="status-badge">${ticket.status || 'OPEN'}</span>
                </span>
              </div>
              
              <div class="info-row">
                <span class="info-label">Hospital:</span>
                <span class="info-value">${hospital?.name || ticket.hospital_name || 'N/A'}</span>
              </div>
              
              <div class="info-row">
                <span class="info-label">Created By:</span>
                <span class="info-value">${createdBy}</span>
              </div>
              
              <div class="info-row">
                <span class="info-label">Created Date:</span>
                <span class="info-value">${createdDate}</span>
              </div>
              
              <div class="description-box">
                <strong>Description:</strong><br>
                ${(ticket.description || getTicketDescription(ticket) || 'No description provided').replace(/\n/g, '<br>')}
              </div>
            </div>
            
            <p style="text-align: center;">
              <a href="${window.location.origin}/support/tickets/${ticket.id}" class="button">
                View Ticket Details
              </a>
            </p>
            
            <p>Please log in to the support system to manage this ticket.</p>
          </div>
          <div class="email-footer">
            <p>This is an automated message from the Support Management System.</p>
            <p>© ${new Date().getFullYear()} Hospital Management System</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Create email HTML for status update
  const createStatusUpdateEmailHTML = (ticket, hospital, oldStatus, newStatus, updatedBy, additionalMessage) => {
    const formattedId = formatEqualNumericId(ticket.id);
    const updatedDate = new Date().toLocaleDateString('en-US', {
      dateStyle: 'full'
    });
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .email-header {
            background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .email-header h1 {
            margin: 0;
            font-size: 28px;
          }
          .email-content {
            padding: 30px 25px;
            background: #f9fafb;
          }
          .ticket-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            border-left: 4px solid #48bb78;
          }
          .ticket-id {
            font-size: 20px;
            font-weight: bold;
            color: #48bb78;
            font-family: monospace;
            margin-bottom: 15px;
          }
          .status-change {
            background-color: #fef3c7;
            padding: 12px;
            border-radius: 8px;
            margin: 15px 0;
            text-align: center;
          }
          .old-status {
            color: #d97706;
            text-decoration: line-through;
          }
          .new-status {
            color: #059669;
            font-weight: bold;
            font-size: 18px;
          }
          .info-row {
            margin: 12px 0;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .info-label {
            font-weight: 600;
            color: #4b5563;
            display: inline-block;
            width: 120px;
          }
          .info-value {
            color: #1f2937;
          }
          .resolution-box {
            background-color: #f0fdf4;
            padding: 15px;
            border-radius: 8px;
            margin-top: 15px;
            border: 1px solid #86efac;
          }
          .email-footer {
            background-color: #f3f4f6;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #48bb78;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            margin: 20px 0;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <h1>🔄 Ticket Status Updated</h1>
          </div>
          <div class="email-content">
            <p>Dear Team,</p>
            <p>The status of support ticket has been updated.</p>
            
            <div class="ticket-card">
              <div class="ticket-id">Ticket #${formattedId}</div>
              
              <div class="status-change">
                Status changed from <span class="old-status">${oldStatus}</span> 
                to <span class="new-status">${newStatus}</span>
              </div>
              
              <div class="info-row">
                <span class="info-label">Subject:</span>
                <span class="info-value">${ticket.subject}</span>
              </div>
              
              <div class="info-row">
                <span class="info-label">Priority:</span>
                <span class="info-value">${ticket.priority}</span>
              </div>
              
              <div class="info-row">
                <span class="info-label">Hospital:</span>
                <span class="info-value">${hospital?.name || ticket.hospital_name || 'N/A'}</span>
              </div>
              
              <div class="info-row">
                <span class="info-label">Updated By:</span>
                <span class="info-value">${updatedBy}</span>
              </div>
              
              <div class="info-row">
                <span class="info-label">Updated Date:</span>
                <span class="info-value">${updatedDate}</span>
              </div>
              
              ${ticket.resolution_notes ? `
              <div class="resolution-box">
                <strong>Resolution Notes:</strong><br>
                ${ticket.resolution_notes.replace(/\n/g, '<br>')}
              </div>
              ` : ''}
              
              ${additionalMessage ? `
              <div class="resolution-box">
                <strong>Additional Notes:</strong><br>
                ${additionalMessage.replace(/\n/g, '<br>')}
              </div>
              ` : ''}
            </div>
            
            <p style="text-align: center;">
              <a href="${window.location.origin}/support/tickets/${ticket.id}" class="button">
                View Ticket Details
              </a>
            </p>
          </div>
          <div class="email-footer">
            <p>This is an automated message from the Support Management System.</p>
            <p>© ${new Date().getFullYear()} Hospital Management System</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.hospital_id) {
      errors.hospital_id = "Please select a hospital";
    }
    
    if (!formData.subject.trim()) {
      errors.subject = "Subject is required";
    } else if (formData.subject.trim().length < 10) {
      errors.subject = "Subject must be at least 10 characters";
    } else if (formData.subject.trim().length > 100) {
      errors.subject = "Subject must not exceed 100 characters";
    }
    
    if (!formData.description.trim()) {
      errors.description = "Description is required";
    } else if (formData.description.trim().length < 20) {
      errors.description = "Description must be at least 20 characters";
    } else if (formData.description.trim().length > 500) {
      errors.description = "Description must not exceed 500 characters";
    }
    
    // Validate additional emails if provided
    if (formData.additional_emails) {
      const emails = formData.additional_emails.split(',').map(e => e.trim());
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = emails.filter(email => email && !emailRegex.test(email));
      if (invalidEmails.length > 0) {
        errors.additional_emails = `Invalid email(s): ${invalidEmails.join(', ')}`;
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    setSendingEmail(true);
    
    try {
      const token = getAuthToken();
      const selectedHospital = hospitals.find(h => h.id === formData.hospital_id);
      
      const payload = {
        hospital_name: selectedHospital?.name || formData.hospital_id,
        subject: formData.subject,
        description: formData.description,
        priority: formData.priority
      };
      
      // Create ticket
      const res = await fetch(`/api/v1/super-admin/support/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });
      
      const responseData = await res.json();
      
      if (!res.ok) {
        throw new Error(responseData.detail || "Failed to create ticket");
      }
      
      const newTicket = responseData;
      
      // Send email notifications if enabled
      if (formData.send_email) {
        try {
          // Prepare email recipients
          const recipients = [];
          
          // Add hospital email if available
          if (selectedHospital?.email) {
            recipients.push(selectedHospital.email);
          }
          
          // Add additional emails
          if (formData.additional_emails) {
            const additionalEmails = formData.additional_emails.split(',').map(e => e.trim());
            recipients.push(...additionalEmails);
          }
          
          // Add support email (you can configure this)
          const supportEmail = 'support@yourdomain.com';
          recipients.push(supportEmail);
          
          // Remove duplicates
          const uniqueRecipients = [...new Set(recipients)];
          
          // Create email content
          const emailHTML = createTicketEmailHTML(
            newTicket, 
            selectedHospital, 
            'System Administrator'
          );
          
          // Send email to each recipient
          const emailPromises = uniqueRecipients.map(recipient => 
            sendEmailViaAPI(
              recipient,
              `[Ticket #${formatEqualNumericId(newTicket.id)}] New Support Ticket: ${newTicket.subject}`,
              emailHTML
            )
          );
          
          await Promise.allSettled(emailPromises);
          toast.success(`Ticket created and email sent to ${uniqueRecipients.length} recipient(s)!`);
          
        } catch (emailError) {
          console.error('Email sending failed:', emailError);
          toast.warning('Ticket created but email notification failed. Please check email configuration.');
        }
      } else {
        toast.success("Ticket created successfully!");
      }
      
      // Reset form
      setFormData({
        hospital_id: '',
        subject: '',
        description: '',
        priority: 'NORMAL',
        send_email: true,
        additional_emails: ''
      });
      setFormErrors({});
      setShowCreateModal(false);
      
      // Refresh ticket list
      await fetchTickets();
      
    } catch (error) {
      console.error("Create ticket error:", error);
      toast.error(error.message || "Failed to create ticket. Please try again.");
    } finally {
      setSubmitting(false);
      setSendingEmail(false);
    }
  };
  
  const handleUpdateStatus = async (ticketId, e) => {
    e.preventDefault();
    
    const errors = {};
    if (!statusUpdateData.status) {
      errors.status = "Status is required";
    }
    
    if (statusUpdateData.status === "RESOLVED" && !statusUpdateData.resolution_notes?.trim()) {
      errors.resolution_notes = "Resolution notes are required when status is RESOLVED";
    }
    
    if (Object.keys(errors).length > 0) {
      setStatusErrors(errors);
      return;
    }
    
    setSubmitting(true);
    
    try {
      const token = getAuthToken();
      
      const payload = {
        status: statusUpdateData.status,
        resolution_notes: statusUpdateData.resolution_notes
      };
      
      const res = await fetch(`/api/v1/super-admin/support/tickets/${ticketId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || "Failed to update status");
      }
      
      toast.success("Status updated successfully!");
      
      setShowEditModal(false);
      setSelectedTicket(null);
      setStatusErrors({});
      setStatusUpdateData({
        status: '',
        resolution_notes: ''
      });
      
      fetchTickets();
      
    } catch (error) {
      toast.error(error.message || "Update failed");
      console.error(error);
    } finally {
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

  // Function to handle showing only closed tickets
  const handleShowClosedTickets = () => {
    setShowClosedOnly(true);
    setSearchTerm(''); // Clear search term when showing closed tickets
  };

  // Function to handle showing all tickets (reset to normal view)
  const handleShowAllTickets = () => {
    setShowClosedOnly(false);
    setSearchTerm('');
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
      'LOW': 'bg-gray-100 text-gray-800',
      'NORMAL': 'bg-blue-100 text-blue-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'URGENT': 'bg-red-100 text-red-800'
    };
    return priorityMap[priority] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getHospitalName = (hospitalId) => {
    const hospital = hospitals.find(h => h.id === hospitalId);
    return hospital ? hospital.name : hospitalId;
  };

  // Filter tickets based on search term and closed status filter
  const filteredTickets = tickets.filter(ticket => {
    // First filter by closed status if showClosedOnly is true
    if (showClosedOnly && ticket.status !== 'CLOSED') {
      return false;
    }
    
    // Then filter by search term
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const pureNumericId = getPureNumericTicketId(ticket.id);
    const equalFormattedId = formatEqualNumericId(ticket.id);
    return (
      pureNumericId.toLowerCase().includes(searchLower) ||
      equalFormattedId.toLowerCase().includes(searchLower) ||
      ticket.id?.toString().toLowerCase().includes(searchLower) ||
      ticket.subject?.toString().toLowerCase().includes(searchLower) ||
      ticket.status?.toString().toLowerCase().includes(searchLower) ||
      getHospitalName(ticket.hospital_id)?.toString().toLowerCase().includes(searchLower)
    );
  });

  if (connectionError) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <ToastContainer position="top-right" autoClose={5000} />
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-red-800">Cannot Connect to Server</h3>
          <p className="mt-1 text-sm text-red-600">
            Please ensure the backend server is running
          </p>
          <button
            onClick={() => {
              fetchTickets();
              fetchHospitals();
            }}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <ToastContainer position="top-right" autoClose={5000} />
      


      {/* Status Banner - Shows when viewing closed tickets */}
      {showClosedOnly && (
        <div className="bg-gray-100 border-l-4 border-gray-500 p-4 mb-6 rounded-r-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-700">
                Showing only <span className="font-semibold">CLOSED</span> tickets. 
                <button 
                  onClick={handleShowAllTickets}
                  className="ml-2 text-blue-600 hover:text-blue-800 underline font-medium"
                >
                  Click here to view all tickets
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder={showClosedOnly ? "Search closed tickets by ID, subject, or hospital..." : "Search tickets by ID (12-digit format), subject, status, or hospital..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hospital</label>
            <select
              value={filters.hospital_id}
              onChange={(e) => handleFilterChange('hospital_id', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Hospitals</option>
              {hospitals.map((hospital) => (
                <option key={hospital.id} value={hospital.id}>
                  {hospital.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Per Page</label>
            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={75}>75</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>



{/* Header with Buttons on Right Side */}
<div className="flex justify-between items-center mb-6">
  <h1 className="text-2xl font-bold text-gray-800">Support Management</h1>
  <div className="flex items-center gap-3">
    <button
      onClick={handleShowClosedTickets}
      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
      title="Show only closed tickets"
    >
    
      Closed Tickets
    </button>
    {/* Show All Tickets button - appears when showing closed tickets */}
    {showClosedOnly && (
      <button
        onClick={handleShowAllTickets}
        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        title="Show all tickets"
      >
        
        Show All Tickets
      </button>
    )}
    
  </div>
</div>
      {/* Tickets Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {showClosedOnly 
                ? "No closed tickets found" 
                : "No support tickets found"}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ticket ID (12-digit)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hospital
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="font-mono text-blue-600 font-bold">
                          {formatEqualNumericId(ticket.id)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getHospitalName(ticket.hospital_id)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-md">
                        <div className="truncate max-w-md" title={ticket.subject}>
                          {ticket.subject}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(ticket.status)}`}>
                          {ticket.status?.replace('_', ' ') || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadgeClass(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(ticket.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setShowViewModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                          title="View Ticket"
                        >
                          <i className="fas fa-eye text-lg"></i>
                        </button>
                        {ticket.status !== 'CLOSED' && (
                          <button
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setStatusUpdateData({
                                status: ticket.status || '',
                                resolution_notes: ticket.resolution_notes || ''
                              });
                              setShowEditModal(true);
                            }}
                            className="text-green-600 hover:text-green-900"
                            title="Update Status"
                          >
                            <i className="fas fa-edit text-lg"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 bg-white border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{pagination.skip + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(pagination.skip + pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handlePrevPage}
                  disabled={filters.skip === 0}
                  className={`px-3 py-1 rounded border ${
                    filters.skip === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={filters.skip + filters.limit >= pagination.total}
                  className={`px-3 py-1 rounded border ${
                    filters.skip + filters.limit >= pagination.total
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowCreateModal(false)}></div>
            <div className="relative bg-white rounded-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Create Support Ticket</h2>
              
              <form onSubmit={handleCreateTicket}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hospital *
                  </label>
                  <select
                    value={formData.hospital_id}
                    onChange={(e) => {
                      setFormData({...formData, hospital_id: e.target.value});
                      setFormErrors({...formErrors, hospital_id: ''});
                    }}
                    className={`w-full border ${formErrors.hospital_id ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="">Select a hospital</option>
                    {loadingHospitals ? (
                      <option disabled>Loading hospitals...</option>
                    ) : (
                      hospitals.map((hospital) => (
                        <option key={hospital.id} value={hospital.id}>
                          {hospital.name}
                        </option>
                      ))
                    )}
                  </select>
                  {formErrors.hospital_id && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.hospital_id}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject * (Min 10, Max 100 characters)
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= 100) {
                        setFormData({...formData, subject: value});
                        setFormErrors({...formErrors, subject: ''});
                      }
                    }}
                    maxLength="100"
                    className={`w-full border ${formErrors.subject ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="Enter subject (10-100 characters)"
                  />
                  <div className="flex justify-between mt-1">
                    {formErrors.subject && (
                      <p className="text-xs text-red-500">{formErrors.subject}</p>
                    )}
                    <p className={`text-xs ${formData.subject.length >= 10 && formData.subject.length <= 100 ? 'text-green-600' : 'text-gray-500'} ml-auto`}>
                      {formData.subject.length}/100 characters (min 10)
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description * (Min 20, Max 500 characters)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= 500) {
                        setFormData({...formData, description: value});
                        setFormErrors({...formErrors, description: ''});
                      }
                    }}
                    rows="4"
                    maxLength="500"
                    className={`w-full border ${formErrors.description ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="Describe the issue in detail (20-500 characters)"
                  />
                  <div className="flex justify-between mt-1">
                    {formErrors.description && (
                      <p className="text-xs text-red-500">{formErrors.description}</p>
                    )}
                    <p className={`text-xs ${formData.description.length >= 20 && formData.description.length <= 500 ? 'text-green-600' : 'text-gray-500'} ml-auto`}>
                      {formData.description.length}/500 characters (min 20)
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="URGENT">Urgent</option>
                    <option value="HIGH">High</option>
                    <option value="NORMAL">Normal</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                {/* Email Notification Section */}
                <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                  <label className="flex items-center space-x-2 mb-3">
                    <input
                      type="checkbox"
                      checked={formData.send_email}
                      onChange={(e) => setFormData({...formData, send_email: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Send email notifications</span>
                  </label>
                  
                  {formData.send_email && (
                    <>
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Additional Email Recipients (Optional)
                        </label>
                        <input
                          type="text"
                          value={formData.additional_emails}
                          onChange={(e) => setFormData({...formData, additional_emails: e.target.value})}
                          className={`w-full border ${formErrors.additional_emails ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          placeholder="Enter email addresses separated by commas"
                        />
                        {formErrors.additional_emails && (
                          <p className="mt-1 text-xs text-red-500">{formErrors.additional_emails}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                          Email will be sent to: Hospital email, Support team, and additional recipients
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormErrors({});
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                  >
                    {submitting ? (sendingEmail ? 'Creating & Sending Email...' : 'Creating...') : 'Create Ticket'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Ticket Modal */}
      {showViewModal && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Ticket Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm text-gray-500">Ticket ID (12-digit)</label>
                <p className="font-semibold text-lg text-blue-600 font-mono">
                  {formatEqualNumericId(selectedTicket.id)}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Hospital</label>
                <p className="font-semibold">{getHospitalName(selectedTicket.hospital_id)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Status</label>
                <div>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Priority</label>
                <div>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadgeClass(selectedTicket.priority)}`}>
                    {selectedTicket.priority}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="text-sm text-gray-500 font-semibold">Subject</label>
              <p className="font-medium text-gray-900 bg-gray-50 p-3 rounded-lg mt-1 border border-gray-200">
                {selectedTicket.subject}
              </p>
            </div>
            
            <div className="mb-4">
              <label className="text-sm text-gray-500 font-semibold block mb-2">Description</label>
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 min-h-[150px] whitespace-pre-wrap break-words">
                {(() => {
                  const description = getTicketDescription(selectedTicket);
                  if (description && description.trim()) {
                    return description;
                  }
                  return 'No description provided';
                })()}
              </div>
            </div>
            
            {selectedTicket.resolution_notes && selectedTicket.resolution_notes.trim() && (
              <div className="mb-4">
                <label className="text-sm text-gray-500 font-semibold">Resolution Notes</label>
                <div className="bg-green-50 p-3 rounded-lg mt-1 border border-green-200">
                  <p className="whitespace-pre-wrap text-gray-800 break-words">{selectedTicket.resolution_notes}</p>
                </div>
              </div>
            )}
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-gray-500">Created Date</label>
                  <p className="font-medium">{formatDate(selectedTicket.created_at)}</p>
                </div>
                {selectedTicket.updated_at && selectedTicket.updated_at !== selectedTicket.created_at && (
                  <div>
                    <label className="text-gray-500">Last Updated</label>
                    <p className="font-medium">{formatDate(selectedTicket.updated_at)}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showEditModal && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Update Ticket Status</h2>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Ticket ID: <span className="font-mono font-bold text-blue-600">{formatEqualNumericId(selectedTicket.id)}</span>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Subject: <span className="font-medium">{selectedTicket.subject}</span>
              </p>
            </div>
            <form onSubmit={(e) => handleUpdateStatus(selectedTicket.id, e)}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                <select
                  value={statusUpdateData.status}
                  onChange={(e) => setStatusUpdateData({...statusUpdateData, status: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Status</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
                {statusErrors.status && (
                  <p className="mt-1 text-xs text-red-500">{statusErrors.status}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Resolution Notes</label>
                <textarea
                  value={statusUpdateData.resolution_notes}
                  onChange={(e) => setStatusUpdateData({...statusUpdateData, resolution_notes: e.target.value})}
                  rows="4"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add resolution notes (required when status is RESOLVED)..."
                />
                {statusErrors.resolution_notes && (
                  <p className="mt-1 text-xs text-red-500">{statusErrors.resolution_notes}</p>
                )}
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setStatusErrors({});
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-300"
                >
                  {submitting ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportManagement;