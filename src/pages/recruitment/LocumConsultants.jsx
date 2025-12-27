import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, DollarSign, User, Phone, Mail, MapPin } from 'lucide-react';
import Layout from '../../components/Layout';
import api from '../../api';

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
  }, []);

  const fetchConsultants = async () => {
    try {
      console.log('Fetching consultants...');
      const response = await api.get('/recruitment/consultants');
      console.log('Consultants response:', response.data);
      setConsultants(response.data);
    } catch (error) {
      console.error('Error fetching consultants:', error);
      console.error('Error details:', error.response?.data);
      // Set empty array if API fails
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
    setEditingConsultant(consultant);
    setFormData({
      ...consultant,
      contact_details: consultant.contact_details || { phone: '', email: '', address: '' }
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this consultant?')) {
      try {
        await api.delete(`/recruitment/consultants/${id}`);
        fetchConsultants();
      } catch (error) {
        console.error('Error deleting consultant:', error);
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
    try {
      await api.post('/recruitment/consultants/availability', availabilityData);
      resetAvailabilityForm();
      fetchAvailability();
      alert('Availability added successfully');
    } catch (error) {
      console.error('Error saving availability:', error);
      alert('Failed to save availability');
    }
  };

  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/recruitment/consultants/payouts', payoutData);
      resetPayoutForm();
      fetchPayouts();
      alert('Payout added successfully');
    } catch (error) {
      console.error('Error saving payout:', error);
      alert('Failed to save payout');
    }
  };

  const handleProcessPayroll = async (payoutId) => {
    try {
      await api.put(`/recruitment/consultants/payouts/${payoutId}/process`);
      fetchPayouts();
      alert('Payroll processed successfully');
    } catch (error) {
      console.error('Error processing payroll:', error);
      alert('Failed to process payroll');
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

  const tabs = ['list', 'availability', 'payouts'];

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-3xl border-2 border-black shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center border-2 border-black">
                <User className="w-8 h-8 text-gray-700" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Locum / Visiting Consultants</h1>
                <p className="text-gray-600 text-base sm:text-lg mb-1">Manage temporary and part-time medical consultants</p>
                <p className="text-gray-500 text-sm">Consultant Management System</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className="inline-flex items-center gap-2 text-gray-600 px-3 py-1 border border-black rounded-lg">
                <span className="text-sm font-medium">{consultants.length} Consultants</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-black overflow-hidden">
          <div className="p-4 sm:p-6">
            {/* Tab Navigation */}
            <div className="flex items-center bg-gray-100 rounded-full p-1 overflow-x-auto border border-black mb-6">
              <button
                onClick={() => setActiveTab('list')}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
                  activeTab === 'list'
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-300'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <User className="inline mr-2" size={16} />
                Consultant List
              </button>
              <button
                onClick={() => setActiveTab('availability')}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
                  activeTab === 'availability'
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-300'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Calendar className="inline mr-2" size={16} />
                Availability
              </button>
              <button
                onClick={() => setActiveTab('payouts')}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
                  activeTab === 'payouts'
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-300'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <DollarSign className="inline mr-2" size={16} />
                Payouts
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'list' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Consultant List</h3>
                  <button
                    onClick={() => setShowModal(true)}
                    className="bg-gray-900 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors border border-black"
                  >
                    <Plus size={16} />
                    Add Consultant
                  </button>
                </div>
                <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
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
                  <tbody className="bg-white divide-y divide-gray-200">
                    {consultants.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                          <User size={48} className="mx-auto mb-4 text-gray-300" />
                          <p className="text-lg font-medium mb-2">No consultants found</p>
                          <p className="text-sm">Click "Add Consultant" to create your first consultant record</p>
                        </td>
                      </tr>
                    ) : (
                      consultants.map((consultant) => (
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
                              <button
                                onClick={() => handleEdit(consultant)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(consultant.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                </div>
              </div>
            )}

            {activeTab === 'availability' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Availability Management</h3>
                  <button
                    onClick={() => setShowAvailabilityModal(true)}
                    className="bg-gray-900 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors border border-black"
                  >
                    <Plus size={16} />
                    Add Availability
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consultant</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
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
              </div>
            )}

            {activeTab === 'payouts' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Payout Management</h3>
                  <button
                    onClick={() => setShowPayoutModal(true)}
                    className="bg-gray-900 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors border border-black"
                  >
                    <Plus size={16} />
                    Add Payout
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
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
                    <tbody className="bg-white divide-y divide-gray-200">
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
                              {payout.payout_status === 'Pending' && (
                                <button
                                  onClick={() => handleProcessPayroll(payout.id)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                                >
                                  Process Payroll
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl border-2 border-black shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 border-b-2 border-black pb-3">
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
                        className="w-full border-2 border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Specialization</label>
                      <input
                        type="text"
                        value={formData.specialization}
                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                        className="w-full border-2 border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
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
                        className="w-full border-2 border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Type *</label>
                      <select
                        required
                        value={formData.consultant_type}
                        onChange={(e) => setFormData({ ...formData, consultant_type: e.target.value })}
                        className="w-full border-2 border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
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
                        className="w-full border-2 border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
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
                        className="w-full border-2 border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
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
                        className="w-full border-2 border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
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
                        className="w-full border-2 border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t-2 border-black">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 border-2 border-black rounded-lg text-gray-900 hover:bg-gray-100 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 border-2 border-black font-semibold"
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
            <div className="bg-white rounded-2xl border-2 border-black shadow-lg w-full max-w-md">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 border-b-2 border-black pb-3">Add Availability</h3>
                <form onSubmit={handleAvailabilitySubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Consultant *</label>
                    <select
                      required
                      value={availabilityData.consultant_id}
                      onChange={(e) => setAvailabilityData({ ...availabilityData, consultant_id: parseInt(e.target.value) })}
                      className="w-full border-2 border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
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
                      className="w-full border-2 border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
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
                        className="w-full border-2 border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">To Time *</label>
                      <input
                        type="time"
                        required
                        value={availabilityData.to_time}
                        onChange={(e) => setAvailabilityData({ ...availabilityData, to_time: e.target.value })}
                        className="w-full border-2 border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Type *</label>
                    <select
                      required
                      value={availabilityData.availability_type}
                      onChange={(e) => setAvailabilityData({ ...availabilityData, availability_type: e.target.value })}
                      className="w-full border-2 border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                    >
                      <option value="OPD">OPD</option>
                      <option value="Surgery">Surgery</option>
                      <option value="On-call">On-call</option>
                    </select>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t-2 border-black">
                    <button
                      type="button"
                      onClick={resetAvailabilityForm}
                      className="px-4 py-2 border-2 border-black rounded-lg text-gray-900 hover:bg-gray-100 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 border-2 border-black font-semibold"
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
            <div className="bg-white rounded-2xl border-2 border-black shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 border-b-2 border-black pb-3">Add Payout</h3>
                <form onSubmit={handlePayoutSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Consultant *</label>
                    <select
                      required
                      value={payoutData.consultant_id}
                      onChange={(e) => setPayoutData({ ...payoutData, consultant_id: parseInt(e.target.value) })}
                      className="w-full border-2 border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
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
                        className="w-full border-2 border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Period End *</label>
                      <input
                        type="date"
                        required
                        value={payoutData.period_end}
                        onChange={(e) => setPayoutData({ ...payoutData, period_end: e.target.value })}
                        className="w-full border-2 border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
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
                        className="w-full border-2 border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Total Revenue</label>
                      <input
                        type="number"
                        step="0.01"
                        value={payoutData.total_revenue}
                        onChange={(e) => setPayoutData({ ...payoutData, total_revenue: parseFloat(e.target.value) || 0 })}
                        className="w-full border-2 border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
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
                        className="w-full border-2 border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Hospital Share</label>
                      <input
                        type="number"
                        step="0.01"
                        value={payoutData.hospital_share}
                        onChange={(e) => setPayoutData({ ...payoutData, hospital_share: parseFloat(e.target.value) || 0 })}
                        className="w-full border-2 border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t-2 border-black">
                    <button
                      type="button"
                      onClick={resetPayoutForm}
                      className="px-4 py-2 border-2 border-black rounded-lg text-gray-900 hover:bg-gray-100 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 border-2 border-black font-semibold"
                    >
                      Add Payout
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default LocumConsultants;