import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertTriangle, Plus, Calendar } from 'lucide-react';
import api from '../../api';
import Toast from '../../components/Toast';
import useToast from '../../utils/useToast';
import { hasPermission, isAdmin } from '../../utils/permissions';

const EmployeeProbation = ({ employeeId, employee }) => {
  const [probation, setProbation] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [extensionMonths, setExtensionMonths] = useState(3);
  const [formData, setFormData] = useState({
    date_of_joining: '',
    probation_months: 6,
    remarks: ''
  });
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    if (employeeId) {
      fetchProbation();
    }
    // Pre-fill joining date from employee data
    if (employee?.joining_date) {
      setFormData(prev => ({
        ...prev,
        date_of_joining: employee.joining_date
      }));
    }
  }, [employeeId, employee]);

  const fetchProbation = async () => {
    try {
      const response = await api.get(`/recruitment/probations/employee/${employeeId}`);
      setProbation(response.data);
    } catch (error) {
      console.error('Error fetching probation:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const joiningDate = new Date(formData.date_of_joining);
      const probationEndDate = new Date(joiningDate);
      probationEndDate.setMonth(probationEndDate.getMonth() + formData.probation_months);

      const probationData = {
        employee_id: employeeId,
        date_of_joining: formData.date_of_joining,
        probation_end_date: probationEndDate.toISOString().split('T')[0],
        remarks: formData.remarks
      };

      await api.post('/recruitment/probations', probationData);
      setShowForm(false);
      resetForm();
      fetchProbation();
      showToast('Probation period added successfully');
    } catch (error) {
      console.error('Error saving probation:', error);
      showToast('Failed to save probation', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExtend = async () => {
    try {
      await api.post(`/recruitment/probations/${probation.id}/extend`, { months: extensionMonths });
      setShowExtendModal(false);
      setExtensionMonths(3);
      fetchProbation();
      showToast(`Probation extended by ${extensionMonths} months`);
    } catch (error) {
      console.error('Error extending probation:', error);
      showToast('Failed to extend probation', 'error');
    }
  };

  const handleEnd = async () => {
    const confirmEnd = window.confirm('Are you sure you want to end this probation and confirm the employee?');
    if (!confirmEnd) return;
    
    try {
      await api.post(`/recruitment/probations/${probation.id}/end`);
      fetchProbation();
      showToast('Probation ended and employee confirmed successfully');
    } catch (error) {
      console.error('Error ending probation:', error);
      showToast('Failed to end probation', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      date_of_joining: employee?.joining_date || '',
      probation_months: 6,
      remarks: ''
    });
  };

  const getDaysRemaining = () => {
    if (!probation) return 0;
    
    const today = new Date();
    const endDate = probation.probation_status === 'Extended' && probation.extension_end_date 
      ? new Date(probation.extension_end_date)
      : new Date(probation.probation_end_date);
    
    const diffTime = endDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (status) => {
    const colors = {
      'In Progress': 'bg-yellow-100 text-yellow-800',
      'Confirmed': 'bg-green-100 text-green-800',
      'Extended': 'bg-blue-100 text-blue-800',
      'Terminated': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const daysRemaining = getDaysRemaining();

  return (
    <div className="bg-white p-4 rounded-xl border-0 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-base font-semibold text-gray-900">Probation Period</h3>
        {!probation && (isAdmin() || hasPermission("add_probation")) && (
          <button
            onClick={() => setShowForm(true)}
            className="text-white px-3 py-1 rounded-md transition-colors border-0 flex items-center gap-2 text-sm"
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
            <Plus className="w-4 h-4" />
            Add Probation
          </button>
        )}
      </div>

      {probation ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium text-gray-700">Joining Date</span>
              <p className="text-gray-900">{new Date(probation.date_of_joining).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Probation End Date</span>
              <p className="text-gray-900">
                {new Date(probation.probation_status === 'Extended' && probation.extension_end_date 
                  ? probation.extension_end_date 
                  : probation.probation_end_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Status</span>
              <div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(probation.probation_status)}`}>
                  {probation.probation_status}
                </span>
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-700">Days Remaining</span>
              {probation.probation_status === 'Confirmed' ? (
                <p className="text-gray-500">Completed</p>
              ) : (
                <p className={`font-medium ${daysRemaining < 0 ? 'text-red-600' :
                  daysRemaining <= 7 ? 'text-orange-600' :
                  daysRemaining <= 30 ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days`}
                </p>
              )}
            </div>
          </div>

          {probation.remarks && (
            <div className="text-sm">
              <span className="font-medium text-gray-700">Remarks</span>
              <p className="text-gray-900">{probation.remarks}</p>
            </div>
          )}

          {(probation.probation_status === 'In Progress' || probation.probation_status === 'Extended') && (
            <div className="flex space-x-2 pt-1">
              {(isAdmin() || hasPermission("extend_probation")) && (
                <button
                  onClick={() => setShowExtendModal(true)}
                  className="px-3 py-1.5 text-white text-sm rounded-md transition-colors border border-black"
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
                  Extend Probation
                </button>
              )}
              {(isAdmin() || hasPermission("end_probation")) && (
                <button
                  onClick={handleEnd}
                  className="px-3 py-1.5 text-white text-sm rounded-md transition-colors border border-black"
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
                  End Probation
                </button>
              )}
            </div>
          )}
        </div>
      ) : showForm ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Joining *</label>
              <input style={{backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`}} 
                type="date"
                required
                value={formData.date_of_joining}
                onChange={(e) => setFormData({ ...formData, date_of_joining: e.target.value })}
                className="w-full p-2 border border-black rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Probation Period *</label>
              <select style={{backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`}} 
                required
                value={formData.probation_months}
                onChange={(e) => setFormData({ ...formData, probation_months: parseInt(e.target.value) })}
                className="w-full p-2 border border-black rounded-md"
              >
                <option value={3}>3 Months</option>
                <option value={6}>6 Months</option>
                <option value={12}>12 Months</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
            <textarea style={{backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`}} 
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              rows={3}
              className="w-full p-2 border border-black rounded-md"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="text-white px-4 py-2 rounded-md transition-colors border border-black"
              style={{
                backgroundColor: loading ? '#d1d5db' : 'var(--primary-color, #4575b5)'
              }}
              onMouseEnter={(e) => {
                if (!e.target.disabled) {
                  e.target.style.backgroundColor = 'var(--secondary-color, #6b7280)';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.target.disabled) {
                  e.target.style.backgroundColor = 'var(--primary-color, #4575b5)';
                }
              }}
            >
              {loading ? 'Saving...' : 'Save Probation'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 border border-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No probation period set</p>
          <p className="text-sm text-gray-400">Click "Add Probation" to set probation period</p>
        </div>
      )}

      {/* Extend Probation Modal */}
      {showExtendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border-0 shadow-sm w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-black pb-3">Extend Probation Period</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Extension Period *</label>
                  <select style={{backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`}} 
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
                      setExtensionMonths(3);
                    }}
                    className="px-4 py-2 border-2 border-black rounded-lg text-gray-900 hover:bg-gray-100 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExtend}
                    className="px-4 py-2 text-white rounded-lg transition-colors border-2 border-black font-semibold"
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
                    Extend Probation
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <Toast toast={toast} hideToast={hideToast} />
    </div>
  );
};

export default EmployeeProbation;
