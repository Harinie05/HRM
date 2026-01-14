import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Toast from '../../components/Toast';
import useToast from '../../utils/useToast';
import api from '../../api';
import { hasPermission, isAdmin } from '../../utils/permissions';

const QualityIndicators = () => {
  // Check permissions
  if (!hasPermission('view_quality_indicators') && !isAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to view quality indicators.</p>
        </div>
      </div>
    );
  }
  const [activeTab, setActiveTab] = useState('manage');
  const [indicators, setIndicators] = useState([]);
  const [records, setRecords] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showIndicatorForm, setShowIndicatorForm] = useState(false);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [editingIndicator, setEditingIndicator] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [deletedCount, setDeletedCount] = useState(0);
  const [deletedRecordsCount, setDeletedRecordsCount] = useState(0);
  const { toast, showToast, hideToast } = useToast();

  const [indicatorForm, setIndicatorForm] = useState({
    kpi_name: '',
    kpi_category: 'Clinical',
    description: '',
    target_value: '',
    unit_of_measure: 'Percentage',
    frequency: 'Monthly',
    department: ''
  });

  const [recordForm, setRecordForm] = useState({
    quality_indicator_id: '',
    recorded_date: new Date().toISOString().split('T')[0],
    actual_value: '',
    remarks: '',
    recorded_by: 'HR Admin'
  });

  const categories = ['Clinical', 'Operational', 'Financial', 'Patient Safety'];
  const units = ['Percentage', 'Count', 'Days', 'Hours', 'Minutes', 'Ratio'];
  const frequencies = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'];

  useEffect(() => {
    fetchData();
  }, [showDeleted]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [indicatorsRes, recordsRes, deptRes] = await Promise.all([
        api.get(`/api/hr/quality-indicators/quality-indicators${showDeleted ? '?include_deleted=true' : ''}`),
        api.get(`/api/hr/quality-indicators/kpi-records${showDeleted ? '?include_deleted=true' : ''}`),
        api.get('/api/hr/quality-indicators/departments')
      ]);
      
      setIndicators(indicatorsRes.data || []);
      setRecords(recordsRes.data || []);
      setDepartments(deptRes.data || []);
      
      // Fetch deleted counts
      if (!showDeleted) {
        try {
          const [deletedIndicatorsRes, deletedRecordsRes] = await Promise.all([
            api.get('/api/hr/quality-indicators/quality-indicators/deleted-count'),
            api.get('/api/hr/quality-indicators/kpi-records/deleted-count')
          ]);
          setDeletedCount(deletedIndicatorsRes.data?.count || 0);
          setDeletedRecordsCount(deletedRecordsRes.data?.count || 0);
        } catch (error) {
          console.error('Error fetching deleted counts:', error);
          setDeletedCount(0);
          setDeletedRecordsCount(0);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIndicatorSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload = {
        ...indicatorForm,
        target_value: parseFloat(indicatorForm.target_value),
        department_id: null
      };

      if (editingIndicator) {
        await api.put(`/api/hr/quality-indicators/quality-indicators/${editingIndicator.id}`, payload);
      } else {
        await api.post('/api/hr/quality-indicators/quality-indicators', payload);
      }
      
      resetIndicatorForm();
      fetchData();
      showToast(editingIndicator ? 'Quality indicator updated successfully!' : 'Quality indicator created successfully!');
    } catch (error) {
      console.error('Error saving indicator:', error);
      showToast('Error saving quality indicator', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload = {
        ...recordForm,
        quality_indicator_id: parseInt(recordForm.quality_indicator_id),
        actual_value: parseFloat(recordForm.actual_value)
      };

      if (editingRecord) {
        await api.put(`/api/hr/quality-indicators/kpi-records/${editingRecord.id}`, payload);
      } else {
        await api.post('/api/hr/quality-indicators/kpi-records', payload);
      }
      
      resetRecordForm();
      fetchData();
      showToast(editingRecord ? 'KPI record updated successfully!' : 'KPI record created successfully!');
    } catch (error) {
      console.error('Error saving record:', error);
      showToast('Error saving KPI record', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetIndicatorForm = () => {
    setIndicatorForm({
      kpi_name: '',
      kpi_category: 'Clinical',
      description: '',
      target_value: '',
      unit_of_measure: 'Percentage',
      frequency: 'Monthly',
      department: ''
    });
    setEditingIndicator(null);
    setShowIndicatorForm(false);
  };

  const resetRecordForm = () => {
    setRecordForm({
      quality_indicator_id: '',
      recorded_date: new Date().toISOString().split('T')[0],
      actual_value: '',
      remarks: '',
      recorded_by: 'HR Admin'
    });
    setEditingRecord(null);
    setShowRecordForm(false);
  };

  const editIndicator = (indicator) => {
    setIndicatorForm({
      kpi_name: indicator.kpi_name,
      kpi_category: indicator.kpi_category,
      description: indicator.description || '',
      target_value: indicator.target_value.toString(),
      unit_of_measure: indicator.unit_of_measure,
      frequency: indicator.frequency,
      department: indicator.department || ''
    });
    setEditingIndicator(indicator);
    setShowIndicatorForm(true);
  };

  const editRecord = (record) => {
    const indicator = indicators.find(i => i.kpi_name === record.kpi_name);
    setRecordForm({
      quality_indicator_id: indicator ? indicator.id.toString() : '',
      recorded_date: record.recorded_date,
      actual_value: record.actual_value.toString(),
      remarks: record.remarks || '',
      recorded_by: record.recorded_by
    });
    setEditingRecord(record);
    setShowRecordForm(true);
  };

  const deleteIndicator = async (id) => {
    if (window.confirm('Are you sure you want to delete this quality indicator? It will be moved to deleted items.')) {
      try {
        await api.delete(`/api/hr/quality-indicators/quality-indicators/${id}`);
        fetchData();
        showToast('Quality indicator deleted successfully!');
      } catch (error) {
        console.error('Error deleting indicator:', error);
        showToast('Error deleting quality indicator', 'error');
      }
    }
  };

  const restoreIndicator = async (id) => {
    if (window.confirm('Are you sure you want to restore this quality indicator?')) {
      try {
        await api.put(`/api/hr/quality-indicators/quality-indicators/${id}/restore`);
        fetchData();
        showToast('Quality indicator restored successfully!');
      } catch (error) {
        console.error('Error restoring indicator:', error);
        showToast('Error restoring quality indicator', 'error');
      }
    }
  };

  const deleteRecord = async (id) => {
    if (window.confirm('Are you sure you want to delete this KPI record? It will be moved to deleted items.')) {
      try {
        await api.delete(`/api/hr/quality-indicators/kpi-records/${id}`);
        fetchData();
        showToast('KPI record deleted successfully!');
      } catch (error) {
        console.error('Error deleting record:', error);
        showToast('Error deleting KPI record', 'error');
      }
    }
  };

  const restoreRecord = async (id) => {
    if (window.confirm('Are you sure you want to restore this KPI record?')) {
      try {
        await api.put(`/api/hr/quality-indicators/kpi-records/${id}/restore`);
        fetchData();
        showToast('KPI record restored successfully!');
      } catch (error) {
        console.error('Error restoring record:', error);
        showToast('Error restoring KPI record', 'error');
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Above Target':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'Below Target':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Above Target':
        return 'text-green-600 bg-green-50';
      case 'Below Target':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Quality Indicators (Hospital KPIs)</h1>
        <p className="text-gray-600">Track and monitor hospital performance metrics and quality indicators</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('manage')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'manage'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Manage KPIs
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'records'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            KPI Records
          </button>
        </nav>
      </div>

      {/* Manage KPIs Tab */}
      {activeTab === 'manage' && (
        <div>
          <div className="mb-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'}20`
              }}>
                <TrendingUp className="w-5 h-5" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'
                }} />
              </div>
              <div>
                <h2 className="text-lg font-medium text-gray-900">Quality Indicators</h2>
                <p className="text-sm text-gray-600">Define and track quality performance metrics</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!showDeleted && deletedCount > 0 && (hasPermission('show_deleted_quality_indicators') || isAdmin()) && (
                <button
                  onClick={() => setShowDeleted(true)}
                  className="text-white px-3 py-1 rounded-md text-sm whitespace-nowrap transition-colors"
                  style={{ backgroundColor: 'var(--primary-color)' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--secondary-color)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary-color)'}
                >
                  Show Deleted ({deletedCount})
                </button>
              )}
              {showDeleted && (hasPermission('show_deleted_quality_indicators') || isAdmin()) && (
                <button
                  onClick={() => setShowDeleted(false)}
                  className="text-white px-3 py-1 rounded-md text-sm whitespace-nowrap transition-colors"
                  style={{ backgroundColor: 'var(--primary-color)' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--secondary-color)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary-color)'}
                >
                  Hide Deleted
                </button>
              )}
            </div>
            <button
              onClick={() => setShowIndicatorForm(true)}
              className="text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
              style={{
                backgroundColor: 'var(--primary-color)',
                display: (hasPermission('add_quality_indicator') || isAdmin()) ? 'flex' : 'none'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--secondary-color)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary-color)'}
            >
              <Plus className="w-4 h-4" />
              Add Quality Indicator
            </button>
          </div>

          {/* Quality Indicators Form */}
          {showIndicatorForm && (
            <div className="bg-white p-6 rounded-lg  mb-6">
              <h3 className="text-lg font-medium mb-4">
                {editingIndicator ? 'Edit Quality Indicator' : 'Add Quality Indicator'}
              </h3>
              <form onSubmit={handleIndicatorSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">KPI Name *</label>
                  <input
                    type="text"
                    value={indicatorForm.kpi_name}
                    onChange={(e) => setIndicatorForm({...indicatorForm, kpi_name: e.target.value})}
                    className="w-full p-2  rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={indicatorForm.kpi_category}
                    onChange={(e) => setIndicatorForm({...indicatorForm, kpi_category: e.target.value})}
                    className="w-full p-2  rounded-md"
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={indicatorForm.description}
                    onChange={(e) => setIndicatorForm({...indicatorForm, description: e.target.value})}
                    className="w-full p-2  rounded-md"
                    rows="2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Value *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={indicatorForm.target_value}
                    onChange={(e) => setIndicatorForm({...indicatorForm, target_value: e.target.value})}
                    className="w-full p-2  rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measure *</label>
                  <select
                    value={indicatorForm.unit_of_measure}
                    onChange={(e) => setIndicatorForm({...indicatorForm, unit_of_measure: e.target.value})}
                    className="w-full p-2  rounded-md"
                    required
                  >
                    {units.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frequency *</label>
                  <select
                    value={indicatorForm.frequency}
                    onChange={(e) => setIndicatorForm({...indicatorForm, frequency: e.target.value})}
                    className="w-full p-2  rounded-md"
                    required
                  >
                    {frequencies.map(freq => (
                      <option key={freq} value={freq}>{freq}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={indicatorForm.department}
                    onChange={(e) => setIndicatorForm({...indicatorForm, department: e.target.value})}
                    className="w-full p-2  rounded-md"
                    placeholder="Enter department name"
                  />
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="text-white px-4 py-2 rounded-md transition-colors"
                    style={{ backgroundColor: 'var(--primary-color)' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--secondary-color)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary-color)'}
                  >
                    {loading ? 'Saving...' : editingIndicator ? 'Update' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={resetIndicatorForm}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 "
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Quality Indicators Table */}
          <div className="bg-white rounded-lg  overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KPI Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {indicators.map((indicator) => (
                    <tr key={indicator.id} className={indicator.is_active === false ? 'bg-red-50 opacity-75' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {indicator.kpi_name}
                        {indicator.is_active === false && <span className="ml-2 text-xs text-red-600 font-semibold">(DELETED)</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {indicator.kpi_category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {indicator.target_value}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {indicator.unit_of_measure}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {indicator.frequency}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {indicator.department_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {indicator.is_active === false ? (
                            (hasPermission('restore_quality_indicator') || isAdmin()) && (
                            <button
                              onClick={() => restoreIndicator(indicator.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Restore Indicator"
                            >
                              <TrendingUp className="w-4 h-4" />
                            </button>
                            )
                          ) : (
                            <>
                              {(hasPermission('edit_quality_indicator') || isAdmin()) && (
                              <button
                                onClick={() => editIndicator(indicator)}
                                className="text-green-600 hover:text-green-900"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              )}
                              {(hasPermission('delete_quality_indicator') || isAdmin()) && (
                              <button
                                onClick={() => deleteIndicator(indicator.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden">
              {indicators.map((indicator) => (
                <div key={indicator.id} className={`p-4 border-b border-gray-200 last:border-b-0 ${indicator.is_active === false ? 'bg-red-50 opacity-75' : ''}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {indicator.kpi_name}
                        {indicator.is_active === false && <span className="ml-2 text-xs text-red-600 font-semibold">(DELETED)</span>}
                      </h4>
                      <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {indicator.kpi_category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Target:</span>
                      <span className="text-gray-900">{indicator.target_value}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Unit:</span>
                      <span className="text-gray-900">{indicator.unit_of_measure}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Frequency:</span>
                      <span className="text-gray-900">{indicator.frequency}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Department:</span>
                      <span className="text-gray-900">{indicator.department_name}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {indicator.is_active === false ? (
                      (hasPermission('restore_quality_indicator') || isAdmin()) && (
                        <button
                          onClick={() => restoreIndicator(indicator.id)}
                          className="flex items-center gap-1 px-3 py-1 text-xs bg-green-50 text-green-700 rounded-md  hover:bg-green-100"
                        >
                          <TrendingUp className="w-3 h-3" />
                          Restore
                        </button>
                      )
                    ) : (
                      <>
                        {(hasPermission('edit_quality_indicator') || isAdmin()) && (
                          <button
                            onClick={() => editIndicator(indicator)}
                            className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-50 text-gray-700 rounded-md  hover:bg-gray-100"
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </button>
                        )}
                        {(hasPermission('delete_quality_indicator') || isAdmin()) && (
                          <button
                            onClick={() => deleteIndicator(indicator.id)}
                            className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-50 text-gray-700 rounded-md  hover:bg-gray-100"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* KPI Records Tab */}
      {activeTab === 'records' && (
        <div>
          <div className="mb-6 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold">KPI Records</h2>
              {!showDeleted && deletedRecordsCount > 0 && (hasPermission('show_deleted_quality_indicators') || isAdmin()) && (
                <button
                  onClick={() => setShowDeleted(true)}
                  className="text-white px-3 py-1 rounded-md text-sm whitespace-nowrap transition-colors"
                  style={{ backgroundColor: 'var(--primary-color)' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--secondary-color)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary-color)'}
                >
                  Show Deleted ({deletedRecordsCount})
                </button>
              )}
              {showDeleted && (hasPermission('show_deleted_quality_indicators') || isAdmin()) && (
                <button
                  onClick={() => setShowDeleted(false)}
                  className="text-white px-3 py-1 rounded-md text-sm whitespace-nowrap transition-colors"
                  style={{ backgroundColor: 'var(--primary-color)' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--secondary-color)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary-color)'}
                >
                  Hide Deleted
                </button>
              )}
            </div>
            <button
              onClick={() => setShowRecordForm(true)}
              className="text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
              style={{
                backgroundColor: 'var(--primary-color)',
                display: (hasPermission('measure_quality_metrics') || isAdmin()) ? 'flex' : 'none'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--secondary-color)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary-color)'}
            >
              <Plus className="w-4 h-4" />
              Add KPI Record
            </button>
          </div>

          {/* KPI Records Form */}
          {showRecordForm && (
            <div className="bg-white p-6 rounded-lg  mb-6">
              <h3 className="text-lg font-medium mb-4">
                {editingRecord ? 'Edit KPI Record' : 'Add KPI Record'}
              </h3>
              <form onSubmit={handleRecordSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quality Indicator *</label>
                  <select
                    value={recordForm.quality_indicator_id}
                    onChange={(e) => setRecordForm({...recordForm, quality_indicator_id: e.target.value})}
                    className="w-full p-2  rounded-md"
                    required
                  >
                    <option value="">Select KPI</option>
                    {indicators.map(indicator => (
                      <option key={indicator.id} value={indicator.id}>
                        {indicator.kpi_name} ({indicator.unit_of_measure})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recorded Date *</label>
                  <input
                    type="date"
                    value={recordForm.recorded_date}
                    onChange={(e) => setRecordForm({...recordForm, recorded_date: e.target.value})}
                    className="w-full p-2  rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Actual Value *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={recordForm.actual_value}
                    onChange={(e) => setRecordForm({...recordForm, actual_value: e.target.value})}
                    className="w-full p-2  rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recorded By *</label>
                  <input
                    type="text"
                    value={recordForm.recorded_by}
                    onChange={(e) => setRecordForm({...recordForm, recorded_by: e.target.value})}
                    className="w-full p-2  rounded-md"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                  <textarea
                    value={recordForm.remarks}
                    onChange={(e) => setRecordForm({...recordForm, remarks: e.target.value})}
                    className="w-full p-2  rounded-md"
                    rows="2"
                  />
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="text-white px-4 py-2 rounded-md hover:bg-gray-800 "
                  >
                    {loading ? 'Saving...' : editingRecord ? 'Update' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={resetRecordForm}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 "
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* KPI Records Table */}
          <div className="bg-white rounded-lg  overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KPI Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {records.map((record) => (
                    <tr key={record.id} className={record.is_active === false ? 'bg-red-50 opacity-75' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.kpi_name}
                        {record.is_active === false && <span className="ml-2 text-xs text-red-600 font-semibold">(DELETED)</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {record.kpi_category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.recorded_date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.actual_value} {record.unit_of_measure}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.target_value} {record.unit_of_measure}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.variance_percentage}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                          {getStatusIcon(record.status)}
                          <span className="ml-1">{record.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {record.is_active === false ? (
                            (hasPermission('measure_quality_metrics') || isAdmin()) && (
                            <button
                              onClick={() => restoreRecord(record.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Restore Record"
                            >
                              <TrendingUp className="w-4 h-4" />
                            </button>
                            )
                          ) : (
                            <>
                              {(hasPermission('measure_quality_metrics') || isAdmin()) && (
                              <button
                                onClick={() => editRecord(record)}
                                className="text-green-600 hover:text-green-900"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              )}
                              {(hasPermission('measure_quality_metrics') || isAdmin()) && (
                              <button
                                onClick={() => deleteRecord(record.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden">
              {records.map((record) => (
                <div key={record.id} className={`p-4 border-b border-gray-200 last:border-b-0 ${record.is_active === false ? 'bg-red-50 opacity-75' : ''}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {record.kpi_name}
                        {record.is_active === false && <span className="ml-2 text-xs text-red-600 font-semibold">(DELETED)</span>}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {record.kpi_category}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                          {getStatusIcon(record.status)}
                          <span className="ml-1">{record.status}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Date:</span>
                      <span className="text-gray-900">{record.recorded_date}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Actual:</span>
                      <span className="text-gray-900">{record.actual_value} {record.unit_of_measure}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Target:</span>
                      <span className="text-gray-900">{record.target_value} {record.unit_of_measure}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Variance:</span>
                      <span className="text-gray-900">{record.variance_percentage}%</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {record.is_active === false ? (
                      (hasPermission('measure_quality_metrics') || isAdmin()) && (
                        <button
                          onClick={() => restoreRecord(record.id)}
                          className="flex items-center gap-1 px-3 py-1 text-xs bg-green-50 text-green-700 rounded-md  hover:bg-green-100"
                        >
                          <TrendingUp className="w-3 h-3" />
                          Restore
                        </button>
                      )
                    ) : (
                      <>
                        {(hasPermission('measure_quality_metrics') || isAdmin()) && (
                          <button
                            onClick={() => editRecord(record)}
                            className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-50 text-gray-700 rounded-md  hover:bg-gray-100"
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </button>
                        )}
                        {(hasPermission('measure_quality_metrics') || isAdmin()) && (
                          <button
                            onClick={() => deleteRecord(record.id)}
                            className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-50 text-gray-700 rounded-md  hover:bg-gray-100"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <Toast toast={toast} hideToast={hideToast} />
    </div>
  );
};

export default QualityIndicators;
