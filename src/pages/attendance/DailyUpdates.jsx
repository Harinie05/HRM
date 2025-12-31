import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiCalendar, FiClock } from 'react-icons/fi';
import api from '../../api';
import useToast from '../../utils/useToast';
import Toast from '../../components/Toast';

const DailyUpdates = () => {
  const { toast, showToast, hideToast } = useToast();
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState(null);
  const [formData, setFormData] = useState({
    employee_id: localStorage.getItem('user_id') || 1,
    date: new Date().toISOString().split('T')[0],
    work_done: '',
    blockers: '',
    plan_for_tomorrow: '',
    hours_spent: '',
    status: 'Draft'
  });

  useEffect(() => {
    fetchMyUpdates();
  }, []);

  const fetchMyUpdates = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('user_id') || 1;
      const response = await api.get(`/api/daily-updates/my-updates?employee_id=${userId}`);
      setUpdates(response.data);
    } catch (error) {
      console.error('Error fetching updates:', error);
      showToast('Failed to load daily updates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.work_done.trim()) {
      showToast('Work done is required', 'error');
      return;
    }

    try {
      if (editingUpdate) {
        await api.put(`/api/daily-updates/${editingUpdate.id}`, formData);
        showToast('Update saved successfully', 'success');
      } else {
        await api.post('/api/daily-updates/', formData);
        showToast('Update created successfully', 'success');
      }
      
      setShowForm(false);
      setEditingUpdate(null);
      resetForm();
      fetchMyUpdates();
    } catch (error) {
      console.error('Error saving update:', error);
      showToast(error.response?.data?.detail || 'Failed to save update', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: localStorage.getItem('user_id') || 1,
      date: new Date().toISOString().split('T')[0],
      work_done: '',
      blockers: '',
      plan_for_tomorrow: '',
      hours_spent: '',
      status: 'Draft'
    });
  };

  const handleEdit = (update) => {
    setEditingUpdate(update);
    setFormData({
      employee_id: update.employee_id,
      date: update.date,
      work_done: update.work_done,
      blockers: update.blockers || '',
      plan_for_tomorrow: update.plan_for_tomorrow || '',
      hours_spent: update.hours_spent || '',
      status: update.status
    });
    setShowForm(true);
  };

  const handleNewUpdate = () => {
    setEditingUpdate(null);
    resetForm();
    setShowForm(true);
  };

  const canEdit = (update) => {
    const today = new Date().toISOString().split('T')[0];
    return update.date === today;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 border border-black">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-20 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl border border-black shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 border border-black rounded-xl flex items-center justify-center">
                <FiEdit className="w-6 h-6 text-gray-700" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Daily Updates</h1>
                <p className="text-gray-600 text-sm">Track your daily work progress</p>
              </div>
            </div>
            <button
              onClick={handleNewUpdate}
              className="bg-black text-white px-4 py-2 rounded-lg border border-black hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <FiPlus size={16} />
              New Update
            </button>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl border-2 border-black max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-black">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingUpdate ? 'Edit Daily Update' : 'New Daily Update'}
                </h2>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full bg-white text-black border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Work Done Today *</label>
                  <textarea
                    value={formData.work_done}
                    onChange={(e) => setFormData({...formData, work_done: e.target.value})}
                    placeholder="Describe what you accomplished today..."
                    rows={4}
                    className="w-full bg-white text-black border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Blockers (Optional)</label>
                  <textarea
                    value={formData.blockers}
                    onChange={(e) => setFormData({...formData, blockers: e.target.value})}
                    placeholder="Any challenges or blockers you faced..."
                    rows={3}
                    className="w-full bg-white text-black border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Plan for Tomorrow (Optional)</label>
                  <textarea
                    value={formData.plan_for_tomorrow}
                    onChange={(e) => setFormData({...formData, plan_for_tomorrow: e.target.value})}
                    placeholder="What do you plan to work on tomorrow..."
                    rows={3}
                    className="w-full bg-white text-black border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hours Spent (Optional)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      value={formData.hours_spent}
                      onChange={(e) => setFormData({...formData, hours_spent: e.target.value})}
                      placeholder="8.0"
                      className="w-full bg-white text-black border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full bg-white text-black border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Submitted">Submitted</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-2 bg-white text-black border border-black rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-black text-white border border-black rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    {editingUpdate ? 'Update' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Updates List */}
        <div className="bg-white rounded-2xl border border-black p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">My Daily Updates</h2>
          
          {updates.length === 0 ? (
            <div className="text-center py-12">
              <FiEdit className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No updates yet</h3>
              <p className="text-gray-600 mb-4">Start tracking your daily work progress</p>
              <button
                onClick={handleNewUpdate}
                className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Create First Update
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {updates.map((update) => (
                <div key={update.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FiCalendar size={16} />
                        {new Date(update.date).toLocaleDateString()}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        update.status === 'Submitted' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {update.status}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {canEdit(update) && (
                        <button
                          onClick={() => handleEdit(update)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <FiEdit size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Work Done</h4>
                      <p className="text-gray-700 text-sm">{update.work_done}</p>
                    </div>
                    
                    {update.blockers && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Blockers</h4>
                        <p className="text-gray-700 text-sm">{update.blockers}</p>
                      </div>
                    )}
                    
                    {update.plan_for_tomorrow && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Plan for Tomorrow</h4>
                        <p className="text-gray-700 text-sm">{update.plan_for_tomorrow}</p>
                      </div>
                    )}
                    
                    {update.hours_spent && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FiClock size={16} />
                        {update.hours_spent} hours
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Toast toast={toast} hideToast={hideToast} />
    </>
  );
};

export default DailyUpdates;