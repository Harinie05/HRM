import React, { useState, useEffect } from 'react';
import { Plus, Clock, CheckCircle, AlertTriangle, Users } from 'lucide-react';
import Layout from '../../components/Layout';
import api from '../../api';

const ProbationTracking = () => {
  const [probations, setProbations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({
    pending_actions: 0,
    confirmed: 0,
    total_probations: 0
  });
  const [showModal, setShowModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [selectedProbation, setSelectedProbation] = useState(null);
  const [extensionMonths, setExtensionMonths] = useState(3);
  const [activeTab, setActiveTab] = useState('all');
  const [formData, setFormData] = useState({
    employee_id: '',
    date_of_joining: '',
    probation_months: 6,
    remarks: ''
  });

  useEffect(() => {
    fetchProbations();
    fetchStats();
    fetchEmployeesWithoutProbation();
  }, []);

  const fetchProbations = async () => {
    try {
      const response = await api.get('/recruitment/probations');
      setProbations(response.data);
    } catch (error) {
      console.error('Error fetching probations:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/recruitment/probations/dashboard-stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchEmployeesWithoutProbation = async () => {
    try {
      const response = await api.get('/recruitment/employees-without-probation');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const joiningDate = new Date(formData.date_of_joining);
      const probationEndDate = new Date(joiningDate);
      probationEndDate.setMonth(probationEndDate.getMonth() + formData.probation_months);

      const probationData = {
        employee_id: parseInt(formData.employee_id),
        date_of_joining: formData.date_of_joining,
        probation_end_date: probationEndDate.toISOString().split('T')[0],
        remarks: formData.remarks
      };

      await api.post('/recruitment/probations', probationData);
      resetForm();
      fetchProbations();
      fetchStats();
      fetchEmployeesWithoutProbation();
      alert('Probation period added successfully');
    } catch (error) {
      console.error('Error saving probation:', error);
      alert('Failed to save probation');
    }
  };

  const handleAction = async (probationId, action, data = {}) => {
    try {
      let endpoint = `/recruitment/probations/${probationId}/${action}`;
      let payload = {};

      if (action === 'extend') {
        payload = { months: extensionMonths };
        await api.post(endpoint, payload);
        setShowExtendModal(false);
        setSelectedProbation(null);
        setExtensionMonths(3);
      } else if (action === 'end') {
        const confirmEnd = window.confirm('Are you sure you want to end this probation and confirm the employee?');
        if (!confirmEnd) return;
        await api.post(endpoint);
      } else {
        await api.post(endpoint);
      }

      fetchProbations();
      fetchStats();
      alert(`Probation ${action === 'end' ? 'ended' : action + 'ed'} successfully`);
    } catch (error) {
      console.error(`Error ${action}ing probation:`, error);
      alert(`Failed to ${action} probation`);
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      date_of_joining: '',
      probation_months: 6,
      remarks: ''
    });
    setShowModal(false);
  };

  const getStatusBadge = (status) => {
    const colors = {
      'In Progress': 'bg-yellow-100 text-yellow-800',
      'Confirmed': 'bg-green-100 text-green-800',
      'Extended': 'bg-blue-100 text-blue-800',
      'Terminated': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getDaysRemaining = (probation) => {
    const today = new Date();
    let endDate;
    
    // Use extension date if probation is extended, otherwise use original end date
    if (probation.probation_status === 'Extended' && probation.extension_end_date) {
      endDate = new Date(probation.extension_end_date);
    } else {
      endDate = new Date(probation.probation_end_date);
    }
    
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getEmployeeName = (probation) => {
    return probation.employee_name || `Employee ${probation.employee_id}`;
  };

  const filteredProbations = probations;

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-3xl border-2 border-black shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center border-2 border-black">
                <Clock className="w-8 h-8 text-gray-700" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Probation Period Tracking</h1>
                <p className="text-gray-600 text-base sm:text-lg mb-1">Monitor and manage employee probation periods</p>
                <p className="text-gray-500 text-sm">Track and manage employee probation periods</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <button
                onClick={() => setShowModal(true)}
                className="bg-gray-900 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors border border-black"
              >
                <Plus size={16} />
                Add Probation
              </button>
            </div>
          </div>
        </div>



        {/* Tabs and Table */}
        <div className="bg-white rounded-2xl border border-black overflow-hidden">
          <div className="p-4 sm:p-6">


            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joining Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Probation End</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Remaining</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProbations.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                        <Clock size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium mb-2">No probation records found</p>
                        <p className="text-sm">Click "Add Probation" to create probation records</p>
                      </td>
                    </tr>
                  ) : (
                    filteredProbations.map((probation) => {
                      const daysRemaining = getDaysRemaining(probation);
                      const endDate = probation.probation_status === 'Extended' && probation.extension_end_date 
                        ? probation.extension_end_date 
                        : probation.probation_end_date;
                      
                      return (
                        <tr key={probation.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {getEmployeeName(probation)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(probation.date_of_joining).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(endDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {probation.probation_status === 'Confirmed' ? (
                              <span className="text-gray-500">Completed</span>
                            ) : (
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                daysRemaining < 0 ? 'bg-red-100 text-red-800' :
                                daysRemaining <= 7 ? 'bg-orange-100 text-orange-800' :
                                daysRemaining <= 30 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days`}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(probation.probation_status)}`}>
                              {probation.probation_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {(probation.probation_status === 'In Progress' || probation.probation_status === 'Extended') && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    setSelectedProbation(probation);
                                    setShowExtendModal(true);
                                  }}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                                >
                                  Extend
                                </button>
                                <button
                                  onClick={() => handleAction(probation.id, 'end')}
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
                                >
                                  End
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Add Probation Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl border-2 border-black shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 border-b-2 border-black pb-3">Add Probation Period</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Employee *</label>
                    <select
                      required
                      value={formData.employee_id}
                      onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                      className="w-full border-2 border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                    >
                      <option value="">Select Employee</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>{employee.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Date of Joining *</label>
                    <input
                      type="date"
                      required
                      value={formData.date_of_joining}
                      onChange={(e) => setFormData({ ...formData, date_of_joining: e.target.value })}
                      className="w-full border-2 border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Probation Period *</label>
                    <select
                      required
                      value={formData.probation_months}
                      onChange={(e) => setFormData({ ...formData, probation_months: parseInt(e.target.value) })}
                      className="w-full border-2 border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                    >
                      <option value={3}>3 Months</option>
                      <option value={6}>6 Months</option>
                      <option value={12}>12 Months</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Remarks</label>
                    <textarea
                      value={formData.remarks}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                      rows={3}
                      className="w-full border-2 border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
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
                      Add Probation
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        {/* Extend Probation Modal */}
        {showExtendModal && selectedProbation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl border-2 border-black shadow-lg w-full max-w-md">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-black pb-3">Extend Probation Period</h3>
                <p className="text-sm text-gray-700 mb-6 font-medium">
                  Employee: {getEmployeeName(selectedProbation)}
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Extension Period *</label>
                    <select
                      value={extensionMonths}
                      onChange={(e) => setExtensionMonths(parseInt(e.target.value))}
                      className="w-full border-2 border-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                    >
                      <option value={1}>1 Month</option>
                      <option value={2}>2 Months</option>
                      <option value={3}>3 Months</option>
                      <option value={6}>6 Months</option>
                    </select>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4 border-t-2 border-black">
                    <button
                      onClick={() => {
                        setShowExtendModal(false);
                        setSelectedProbation(null);
                        setExtensionMonths(3);
                      }}
                      className="px-4 py-2 border-2 border-black rounded-lg text-gray-900 hover:bg-gray-100 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleAction(selectedProbation.id, 'extend')}
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 border-2 border-black font-semibold"
                    >
                      Extend Probation
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProbationTracking;