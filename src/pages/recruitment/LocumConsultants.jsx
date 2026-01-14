import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, DollarSign, User, Phone, Mail, MapPin, FileText, Send } from 'lucide-react';
import Layout from '../../components/Layout';
import Toast from '../../components/Toast';
import useToast from '../../utils/useToast';
import api from '../../api';
import { hasPermission, isAdmin } from '../../utils/permissions';

const LocumConsultants = () => {
  const [consultants, setConsultants] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [editingConsultant, setEditingConsultant] = useState(null);
  const [activeTab, setActiveTab] = useState('list');
  const [filters, setFilters] = useState({
    status: '',
    consultant_type: '',
    search: ''
  });
  const { toast, showToast, hideToast } = useToast();
  
  // Permission checks
  const canViewConsultants = hasPermission('view_consultants');
  const canAddConsultant = hasPermission('add_consultant');
  const canEditConsultant = hasPermission('edit_consultant');
  const canDeleteConsultant = hasPermission('delete_consultant');
  const canViewAvailability = hasPermission('view_availability');
  const canAddAvailability = hasPermission('add_availability');
  const canViewPayouts = hasPermission('view_payouts');
  const canAddPayout = hasPermission('add_payout');
  const canGeneratePayslip = hasPermission('generate_payslip');
  const canSendPayslipEmail = hasPermission('send_payslip_email');
  const canProcessPayroll = hasPermission('process_payroll');
  
  // Debug log
  console.log('Permissions:', {
    canViewConsultants,
    canAddConsultant,
    canEditConsultant,
    canDeleteConsultant,
    canViewAvailability,
    canAddAvailability,
    canViewPayouts,
    canAddPayout
  });
  
  // If user does NOT have view permission → block entire page
  if (!canViewConsultants) {
    return (
      <Layout>
        <div className="p-6 text-center">
          <div className="bg-white rounded-2xl border-0 p-8 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600">You do not have permission to view Consultants.</p>
          </div>
        </div>
      </Layout>
    );
  }
  const [formData, setFormData] = useState({
    name: '',
    specialization: '',
    registration_number: '',
    consultant_type: 'Locum',
    department_id: '',
    contact_details: {
      phone: '',
      email: '',
      address: ''
    },
    status: 'Active'
  });
  const [availabilityData, setAvailabilityData] = useState({
    consultant_id: '',
    date: '',
    from_time: '',
    to_time: '',
    availability_type: 'OPD'
  });
  const [payoutData, setPayoutData] = useState({
    consultant_id: '',
    period_start: '',
    period_end: '',
    total_cases: 0,
    total_revenue: 0,
    consultant_share: 0,
    hospital_share: 0
  });

  useEffect(() => {
    fetchConsultants();
    fetchDepartments();
    fetchAvailability();
    fetchPayouts();
  }, [filters.status, filters.consultant_type]);

  const fetchConsultants = async () => {
    try {
      console.log('Fetching consultants...');
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.consultant_type) params.append('consultant_type', filters.consultant_type);
      
      const response = await api.get(`/recruitment/consultants?${params.toString()}`);
      console.log('Consultants response:', response.data);
      setConsultants(response.data);
    } catch (error) {
      console.error('Error fetching consultants:', error);
      console.error('Error details:', error.response?.data);
      setConsultants([]);
    }
  };

  const fetchDepartments = async () => {
    try {
      console.log('Fetching departments...');
      const tenant_db = localStorage.getItem("tenant_db");
      const response = await api.get(`/hospitals/departments/${tenant_db}/list`);
      console.log('Departments response:', response.data);
      setDepartments(response.data.departments || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      console.error('Error details:', error.response?.data);
      // Set empty array if API fails
      setDepartments([]);
    }
  };

  const fetchAvailability = async () => {
    try {
      const response = await api.get('/recruitment/consultants/availability');
      setAvailability(response.data);
    } catch (error) {
      console.error('Error fetching availability:', error);
      setAvailability([]);
    }
  };

  const fetchPayouts = async () => {
    try {
      const response = await api.get('/recruitment/consultants/payouts');
      setPayouts(response.data);
    } catch (error) {
      console.error('Error fetching payouts:', error);
      setPayouts([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingConsultant) {
        await api.put(`/recruitment/consultants/${editingConsultant.id}`, formData);
      } else {
        await api.post('/recruitment/consultants', formData);
      }
      fetchConsultants();
      resetForm();
    } catch (error) {
      console.error('Error saving consultant:', error);
    }
  };

  const handleEdit = (consultant) => {
    if (!canEditConsultant) {
      showToast("You don't have permission to edit consultants", "error");
      return;
    }
    setEditingConsultant(consultant);
    setFormData({
      ...consultant,
      contact_details: consultant.contact_details || { phone: '', email: '', address: '' }
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!canDeleteConsultant) {
      showToast("You don't have permission to delete consultants", "error");
      return;
    }
    if (window.confirm('Are you sure you want to deactivate this consultant?')) {
      try {
        await api.delete(`/recruitment/consultants/${id}`);
        // Update the consultant status locally to show immediate change
        setConsultants(prev => prev.map(consultant => 
          consultant.id === id ? { ...consultant, status: 'Inactive' } : consultant
        ));
        showToast('Consultant deactivated successfully');
      } catch (error) {
        console.error('Error deactivating consultant:', error);
        showToast('Failed to deactivate consultant', 'error');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      specialization: '',
      registration_number: '',
      consultant_type: 'Locum',
      department_id: '',
      contact_details: { phone: '', email: '', address: '' },
      status: 'Active'
    });
    setEditingConsultant(null);
    setShowModal(false);
  };

  const resetAvailabilityForm = () => {
    setAvailabilityData({
      consultant_id: '',
      date: '',
      from_time: '',
      to_time: '',
      availability_type: 'OPD'
    });
    setShowAvailabilityModal(false);
  };

  const resetPayoutForm = () => {
    setPayoutData({
      consultant_id: '',
      period_start: '',
      period_end: '',
      total_cases: 0,
      total_revenue: 0,
      consultant_share: 0,
      hospital_share: 0
    });
    setShowPayoutModal(false);
  };

  const handleAvailabilitySubmit = async (e) => {
    e.preventDefault();
    if (!canAddAvailability) {
      showToast("You don't have permission to add availability", "error");
      return;
    }
    try {
      await api.post('/recruitment/consultants/availability', availabilityData);
      resetAvailabilityForm();
      fetchAvailability();
      showToast('Availability added successfully');
    } catch (error) {
      console.error('Error saving availability:', error);
      showToast('Failed to save availability', 'error');
    }
  };

  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/recruitment/consultants/payouts', payoutData);
      resetPayoutForm();
      fetchPayouts();
      showToast('Payout added successfully');
    } catch (error) {
      console.error('Error saving payout:', error);
      showToast('Failed to save payout', 'error');
    }
  };

  const handleProcessPayroll = async (payoutId) => {
    if (!canProcessPayroll) {
      showToast("You don't have permission to process payroll", "error");
      return;
    }
    try {
      await api.put(`/recruitment/consultants/payouts/${payoutId}/process`);
      fetchPayouts();
      showToast('Payroll processed successfully');
    } catch (error) {
      console.error('Error processing payroll:', error);
      showToast('Failed to process payroll', 'error');
    }
  };

  const handleGeneratePayslip = async (payoutId) => {
    if (!canGeneratePayslip) {
      showToast("You don't have permission to generate payslips", "error");
      return;
    }
    try {
      const response = await api.get(`/recruitment/consultants/payouts/${payoutId}/payslip`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `consultant-payslip-${payoutId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showToast('Payslip generated successfully');
    } catch (error) {
      console.error('Error generating payslip:', error);
      showToast('Failed to generate payslip', 'error');
    }
  };

  const handleEmailPayslip = async (payoutId) => {
    if (!canSendPayslipEmail) {
      showToast("You don't have permission to send payslip emails", "error");
      return;
    }
    try {
      await api.post(`/recruitment/consultants/payouts/${payoutId}/email-payslip`);
      showToast('Payslip sent via email successfully');
    } catch (error) {
      console.error('Error sending payslip email:', error);
      showToast('Failed to send payslip email', 'error');
    }
  };

  const getConsultantName = (consultantId) => {
    const consultant = consultants.find(c => c.id === consultantId);
    return consultant ? consultant.name : 'N/A';
  };

  const getDepartmentName = (deptId) => {
    const dept = departments.find(d => d.id === deptId);
    return dept ? dept.name : 'N/A';
  };

  // Filter consultants based on search term
  const filteredConsultants = consultants.filter(consultant => {
    const matchesSearch = !filters.search || 
      consultant.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      consultant.specialization.toLowerCase().includes(filters.search.toLowerCase()) ||
      consultant.registration_number.toLowerCase().includes(filters.search.toLowerCase());
    return matchesSearch;
  });

  const tabs = ['list', 'availability', 'payouts'];

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border-0 shadow-sm p-4 sm:p-6 mb-6" style={{
          background: `linear-gradient(to right, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10, ${getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}10)`
        }}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <User className="w-5 h-5 sm:w-6 sm:h-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1">Locum / Visiting Consultants</h1>
                <p className="text-gray-600 text-xs sm:text-sm mb-1">Manage temporary and part-time medical consultants</p>
                <p className="text-gray-500 text-xs">Consultant Management System</p>
              </div>
            </div>
            <div className="text-center lg:text-right">
              <div className="inline-flex items-center gap-2 text-gray-600 px-3 py-1 border-0 rounded-lg">
                <span className="text-xs sm:text-sm font-medium">{consultants.length} Consultants</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border-0 overflow-hidden">
          <div className="p-4 sm:p-6">
            {/* Tab Navigation */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Consultant Management</span>
                <div className="flex items-center bg-gray-100 rounded-full p-1 overflow-x-auto border-0">
                  {(isAdmin() || hasPermission('view_consultants')) && (
                    <button
                      onClick={() => setActiveTab('list')}
                      className={`px-3 sm:px-4 py-1 text-xs sm:text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
                        activeTab === 'list' 
                          ? "bg-white text-gray-900 shadow-sm" 
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                      style={{
                        backgroundColor: activeTab === 'list' ? getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5' : 'transparent',
                        color: activeTab === 'list' ? 'white' : '#6b7280'
                      }}
                      onMouseEnter={(e) => {
                        if (activeTab !== 'list') {
                          e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                          e.target.style.color = 'white';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (activeTab !== 'list') {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.color = '#6b7280';
                        }
                      }}
                    >
                      Consultant List
                    </button>
                  )}
                  {(isAdmin() || hasPermission('view_availability')) && (
                    <button
                      onClick={() => setActiveTab('availability')}
                      className={`px-3 sm:px-4 py-1 text-xs sm:text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
                        activeTab === 'availability' 
                          ? "bg-white text-gray-900 shadow-sm" 
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                      style={{
                        backgroundColor: activeTab === 'availability' ? getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5' : 'transparent',
                        color: activeTab === 'availability' ? 'white' : '#6b7280'
                      }}
                      onMouseEnter={(e) => {
                        if (activeTab !== 'availability') {
                          e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                          e.target.style.color = 'white';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (activeTab !== 'availability') {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.color = '#6b7280';
                        }
                      }}
                    >
                      Availability
                    </button>
                  )}
                  {(isAdmin() || hasPermission('view_payouts')) && (
                    <button
                      onClick={() => setActiveTab('payouts')}
                      className={`px-3 sm:px-4 py-1 text-xs sm:text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
                        activeTab === 'payouts' 
                          ? "bg-white text-gray-900 shadow-sm" 
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                      style={{
                        backgroundColor: activeTab === 'payouts' ? getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5' : 'transparent',
                        color: activeTab === 'payouts' ? 'white' : '#6b7280'
                      }}
                      onMouseEnter={(e) => {
                        if (activeTab !== 'payouts') {
                          e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                          e.target.style.color = 'white';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (activeTab !== 'payouts') {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.color = '#6b7280';
                        }
                      }}
                    >
                      Payouts
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'list' && (isAdmin() || hasPermission('view_consultants')) && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Consultant List</h3>
                  {canAddConsultant && (
                    <button
                      onClick={() => setShowModal(true)}
                      className="text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                      style={{
                        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5';
                      }}
                    >
                      <Plus size={16} />
                      Add Consultant
                    </button>
                  )}
                </div>
                
                {/* Filters */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6 border-0">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                      <input
                        type="text"
                        placeholder="Search by name, specialization..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        <option value="">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={filters.consultant_type}
                        onChange={(e) => setFilters({ ...filters, consultant_type: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        <option value="">All Types</option>
                        <option value="Locum">Locum</option>
                        <option value="Visiting">Visiting</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => setFilters({ status: '', consultant_type: '', search: '' })}
                        className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                </div>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Consultant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {filteredConsultants.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                          <User size={48} className="mx-auto mb-4 text-gray-300" />
                          <p className="text-lg font-medium mb-2">No consultants found</p>
                          <p className="text-sm">Click "Add Consultant" to create your first consultant record</p>
                        </td>
                      </tr>
                    ) : (
                      filteredConsultants.map((consultant) => (
                        <tr key={consultant.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{consultant.name}</div>
                              <div className="text-sm text-gray-500">{consultant.specialization}</div>
                              <div className="text-xs text-gray-400">Reg: {consultant.registration_number}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              consultant.consultant_type === 'Locum' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {consultant.consultant_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getDepartmentName(consultant.department_id)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex flex-col space-y-1">
                              {consultant.contact_details?.phone && (
                                <div className="flex items-center">
                                  <Phone size={12} className="mr-1" />
                                  {consultant.contact_details.phone}
                                </div>
                              )}
                              {consultant.contact_details?.email && (
                                <div className="flex items-center">
                                  <Mail size={12} className="mr-1" />
                                  {consultant.contact_details.email}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              consultant.status === 'Active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {consultant.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              {canEditConsultant && (
                                <button
                                  onClick={() => handleEdit(consultant)}
                                  className="text-yellow-600 hover:text-yellow-700"
                                >
                                  <Edit size={16} />
                                </button>
                              )}
                              {canDeleteConsultant && (
                                <button
                                  onClick={() => handleDelete(consultant.id)}
                                  className="text-red-600 hover:text-red-700"
                                  title="Deactivate Consultant"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden">
                  {filteredConsultants.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <User size={48} className="mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium mb-2">No consultants found</p>
                      <p className="text-sm">Click "Add Consultant" to create your first consultant record</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {filteredConsultants.map((consultant) => (
                        <div key={consultant.id} className="bg-white rounded-xl border border-black p-4 hover:shadow-sm transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-lg font-medium text-gray-900 mb-1">{consultant.name}</h3>
                              <p className="text-sm text-gray-600">{consultant.specialization}</p>
                              <p className="text-xs text-gray-400">Reg: {consultant.registration_number}</p>
                            </div>
                            <div className="flex flex-col gap-2">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                consultant.consultant_type === 'Locum' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {consultant.consultant_type}
                              </span>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                consultant.status === 'Active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {consultant.status}
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium text-gray-900">Department:</span>
                              <span className="text-sm text-gray-600">{getDepartmentName(consultant.department_id)}</span>
                            </div>
                            
                            {consultant.contact_details?.phone && (
                              <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-900">Phone:</span>
                                <span className="text-sm text-gray-600">{consultant.contact_details.phone}</span>
                              </div>
                            )}
                            
                            {consultant.contact_details?.email && (
                              <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-900">Email:</span>
                                <span className="text-sm text-gray-600 truncate max-w-[200px]">{consultant.contact_details.email}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                            {canEditConsultant && (
                              <button
                                onClick={() => handleEdit(consultant)}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                              >
                                <Edit size={14} />
                                Edit
                              </button>
                            )}
                            {canDeleteConsultant && (
                              <button
                                onClick={() => handleDelete(consultant.id)}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                                title="Deactivate Consultant"
                              >
                                <Trash2 size={14} />
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'availability' && (isAdmin() || hasPermission('view_availability')) && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Availability Management</h3>
                  {canAddAvailability && (
                    <button
                      onClick={() => setShowAvailabilityModal(true)}
                      className="text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                      style={{
                        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5';
                      }}
                    >
                      <Plus size={16} />
                      Add Availability
                    </button>
                  )}
                </div>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consultant</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {availability.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                            <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium mb-2">No availability records</p>
                            <p className="text-sm">Click "Add Availability" to create availability schedules</p>
                          </td>
                        </tr>
                      ) : (
                        availability.map((avail) => (
                          <tr key={avail.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {getConsultantName(avail.consultant_id)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(avail.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {avail.from_time} - {avail.to_time}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                avail.availability_type === 'OPD' ? 'bg-blue-100 text-blue-800' :
                                avail.availability_type === 'Surgery' ? 'bg-green-100 text-green-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
                                {avail.availability_type}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden">
                  {availability.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium mb-2">No availability records</p>
                      <p className="text-sm">Click "Add Availability" to create availability schedules</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {availability.map((avail) => (
                        <div key={avail.id} className="bg-white rounded-xl border border-black p-4 hover:shadow-sm transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-lg font-medium text-gray-900 mb-1">{getConsultantName(avail.consultant_id)}</h3>
                              <p className="text-sm text-gray-600">{new Date(avail.date).toLocaleDateString()}</p>
                            </div>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              avail.availability_type === 'OPD' ? 'bg-blue-100 text-blue-800' :
                              avail.availability_type === 'Surgery' ? 'bg-green-100 text-green-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {avail.availability_type}
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium text-gray-900">Time:</span>
                              <span className="text-sm text-gray-600">{avail.from_time} - {avail.to_time}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'payouts' && (isAdmin() || hasPermission('view_payouts')) && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Payout Management</h3>
                  {canAddPayout && (
                    <button
                      onClick={() => setShowPayoutModal(true)}
                      className="text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                      style={{
                        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5';
                      }}
                    >
                      <Plus size={16} />
                      Add Payout
                    </button>
                  )}
                </div>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consultant</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cases</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consultant Share</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {payouts.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                            <DollarSign size={48} className="mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium mb-2">No payout records</p>
                            <p className="text-sm">Click "Add Payout" to create payout records</p>
                          </td>
                        </tr>
                      ) : (
                        payouts.map((payout) => (
                          <tr key={payout.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {getConsultantName(payout.consultant_id)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(payout.period_start).toLocaleDateString()} - {new Date(payout.period_end).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {payout.total_cases}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ₹{payout.total_revenue.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ₹{payout.consultant_share.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                payout.payout_status === 'Paid' ? 'bg-green-100 text-green-800' :
                                payout.payout_status === 'Processed' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {payout.payout_status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                {payout.payout_status === 'Pending' && canProcessPayroll && (
                                  <button
                                    onClick={() => handleProcessPayroll(payout.id)}
                                    className="text-white px-3 py-1 rounded text-xs"
                                    style={{
                                      backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5';
                                    }}
                                  >
                                    Process Payroll
                                  </button>
                                )}
                                {payout.payout_status === 'Processed' && (
                                  <>
                                    {canGeneratePayslip && (
                                      <button
                                        onClick={() => handleGeneratePayslip(payout.id)}
                                        className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                                        title="Generate Payslip"
                                      >
                                        <FileText size={16} />
                                      </button>
                                    )}
                                    {canSendPayslipEmail && (
                                      <button
                                        onClick={() => handleEmailPayslip(payout.id)}
                                        className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                                        title="Email Payslip"
                                      >
                                        <Send size={16} />
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden">
                  {payouts.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <DollarSign size={48} className="mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium mb-2">No payout records</p>
                      <p className="text-sm">Click "Add Payout" to create payout records</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {payouts.map((payout) => (
                        <div key={payout.id} className="bg-white rounded-xl border border-black p-4 hover:shadow-sm transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-lg font-medium text-gray-900 mb-1">{getConsultantName(payout.consultant_id)}</h3>
                              <p className="text-sm text-gray-600">
                                {new Date(payout.period_start).toLocaleDateString()} - {new Date(payout.period_end).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              payout.payout_status === 'Paid' ? 'bg-green-100 text-green-800' :
                              payout.payout_status === 'Processed' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {payout.payout_status}
                            </span>
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium text-gray-900">Cases:</span>
                              <span className="text-sm text-gray-600">{payout.total_cases}</span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className="text-sm font-medium text-gray-900">Revenue:</span>
                              <span className="text-sm text-gray-600">₹{payout.total_revenue.toLocaleString()}</span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className="text-sm font-medium text-gray-900">Consultant Share:</span>
                              <span className="text-sm text-gray-600">₹{payout.consultant_share.toLocaleString()}</span>
                            </div>
                          </div>
                          
                          <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                            {payout.payout_status === 'Pending' && canProcessPayroll && (
                              <button
                                onClick={() => handleProcessPayroll(payout.id)}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm text-white rounded-md transition-colors"
                                style={{
                                  backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5';
                                }}
                              >
                                Process Payroll
                              </button>
                            )}
                            {payout.payout_status === 'Processed' && (
                              <>
                                {canGeneratePayslip && (
                                  <button
                                    onClick={() => handleGeneratePayslip(payout.id)}
                                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors"
                                    title="Generate Payslip"
                                  >
                                    <FileText size={14} />
                                    Generate
                                  </button>
                                )}
                                {canSendPayslipEmail && (
                                  <button
                                    onClick={() => handleEmailPayslip(payout.id)}
                                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-md transition-colors"
                                    title="Email Payslip"
                                  >
                                    <Send size={14} />
                                    Email
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl border border-black shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 border-b border-black pb-3">
                  {editingConsultant ? 'Edit Consultant' : 'Add New Consultant'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full border border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Specialization</label>
                      <input
                        type="text"
                        value={formData.specialization}
                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                        className="w-full border border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Registration Number</label>
                      <input
                        type="text"
                        value={formData.registration_number}
                        onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                        className="w-full border border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Type *</label>
                      <select
                        required
                        value={formData.consultant_type}
                        onChange={(e) => setFormData({ ...formData, consultant_type: e.target.value })}
                        className="w-full border border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                      >
                        <option value="Locum">Locum</option>
                        <option value="Visiting">Visiting</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Department</label>
                      <select
                        value={formData.department_id}
                        onChange={(e) => setFormData({ ...formData, department_id: parseInt(e.target.value) || '' })}
                        className="w-full border border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                      >
                        <option value="">Select Department</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full border border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={formData.contact_details.phone}
                        onChange={(e) => setFormData({
                          ...formData,
                          contact_details: { ...formData.contact_details, phone: e.target.value }
                        })}
                        className="w-full border border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Email</label>
                      <input
                        type="email"
                        value={formData.contact_details.email}
                        onChange={(e) => setFormData({
                          ...formData,
                          contact_details: { ...formData.contact_details, email: e.target.value }
                        })}
                        className="w-full border border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-black">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 border border-black rounded-lg text-gray-900 hover:bg-gray-100 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-white rounded-lg transition-colors border border-black font-semibold"
                      style={{
                        backgroundColor: 'var(--primary-color, #4575b5)'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = 'var(--secondary-color, #6b7280)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'var(--primary-color, #4575b5)';
                      }}
                    >
                      {editingConsultant ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Availability Modal */}
        {showAvailabilityModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl border border-black shadow-lg w-full max-w-md">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 border-b border-black pb-3">Add Availability</h3>
                <form onSubmit={handleAvailabilitySubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Consultant *</label>
                    <select
                      required
                      value={availabilityData.consultant_id}
                      onChange={(e) => setAvailabilityData({ ...availabilityData, consultant_id: parseInt(e.target.value) })}
                      className="w-full border border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                    >
                      <option value="">Select Consultant</option>
                      {consultants.map((consultant) => (
                        <option key={consultant.id} value={consultant.id}>{consultant.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Date *</label>
                    <input
                      type="date"
                      required
                      value={availabilityData.date}
                      onChange={(e) => setAvailabilityData({ ...availabilityData, date: e.target.value })}
                      className="w-full border border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">From Time *</label>
                      <input
                        type="time"
                        required
                        value={availabilityData.from_time}
                        onChange={(e) => setAvailabilityData({ ...availabilityData, from_time: e.target.value })}
                        className="w-full border border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">To Time *</label>
                      <input
                        type="time"
                        required
                        value={availabilityData.to_time}
                        onChange={(e) => setAvailabilityData({ ...availabilityData, to_time: e.target.value })}
                        className="w-full border border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Type *</label>
                    <select
                      required
                      value={availabilityData.availability_type}
                      onChange={(e) => setAvailabilityData({ ...availabilityData, availability_type: e.target.value })}
                      className="w-full border border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                    >
                      <option value="OPD">OPD</option>
                      <option value="Surgery">Surgery</option>
                      <option value="On-call">On-call</option>
                    </select>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-black">
                    <button
                      type="button"
                      onClick={resetAvailabilityForm}
                      className="px-4 py-2 border border-black rounded-lg text-gray-900 hover:bg-gray-100 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-white rounded-lg transition-colors border border-black font-semibold"
                      style={{
                        backgroundColor: 'var(--primary-color, #4575b5)'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = 'var(--secondary-color, #6b7280)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'var(--primary-color, #4575b5)';
                      }}
                    >
                      Add Availability
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Payout Modal */}
        {showPayoutModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl border border-black shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 border-b border-black pb-3">Add Payout</h3>
                <form onSubmit={handlePayoutSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Consultant *</label>
                    <select
                      required
                      value={payoutData.consultant_id}
                      onChange={(e) => setPayoutData({ ...payoutData, consultant_id: parseInt(e.target.value) })}
                      className="w-full border border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                    >
                      <option value="">Select Consultant</option>
                      {consultants.map((consultant) => (
                        <option key={consultant.id} value={consultant.id}>{consultant.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Period Start *</label>
                      <input
                        type="date"
                        required
                        value={payoutData.period_start}
                        onChange={(e) => setPayoutData({ ...payoutData, period_start: e.target.value })}
                        className="w-full border border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Period End *</label>
                      <input
                        type="date"
                        required
                        value={payoutData.period_end}
                        onChange={(e) => setPayoutData({ ...payoutData, period_end: e.target.value })}
                        className="w-full border border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Total Cases</label>
                      <input
                        type="number"
                        value={payoutData.total_cases}
                        onChange={(e) => setPayoutData({ ...payoutData, total_cases: parseInt(e.target.value) || 0 })}
                        className="w-full border border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Total Revenue</label>
                      <input
                        type="number"
                        step="0.01"
                        value={payoutData.total_revenue}
                        onChange={(e) => setPayoutData({ ...payoutData, total_revenue: parseFloat(e.target.value) || 0 })}
                        className="w-full border border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Consultant Share</label>
                      <input
                        type="number"
                        step="0.01"
                        value={payoutData.consultant_share}
                        onChange={(e) => setPayoutData({ ...payoutData, consultant_share: parseFloat(e.target.value) || 0 })}
                        className="w-full border border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Hospital Share</label>
                      <input
                        type="number"
                        step="0.01"
                        value={payoutData.hospital_share}
                        onChange={(e) => setPayoutData({ ...payoutData, hospital_share: parseFloat(e.target.value) || 0 })}
                        className="w-full border border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-black">
                    <button
                      type="button"
                      onClick={resetPayoutForm}
                      className="px-4 py-2 border border-black rounded-lg text-gray-900 hover:bg-gray-100 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-white rounded-lg transition-colors border border-black font-semibold"
                      style={{
                        backgroundColor: 'var(--primary-color, #4575b5)'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = 'var(--secondary-color, #6b7280)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'var(--primary-color, #4575b5)';
                      }}
                    >
                      Add Payout
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <Toast toast={toast} hideToast={hideToast} />
      </div>
    </Layout>
  );
};

export default LocumConsultants;
