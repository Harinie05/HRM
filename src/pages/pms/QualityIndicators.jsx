import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Toast from '../../components/Toast';
import useToast from '../../utils/useToast';
import api from '../../api';

const QualityIndicators = () => {
  const [activeTab, setActiveTab] = useState('manage');
  const [indicators, setIndicators] = useState([]);
  const [records, setRecords] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showIndicatorForm, setShowIndicatorForm] = useState(false);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [editingIndicator, setEditingIndicator] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const [indicatorForm, setIndicatorForm] = useState({
    kpi_name: '',
    kpi_category: 'Clinical',
    description: '',
    target_value: '',
    unit_of_measure: 'Percentage',
    frequency: 'Monthly',
    department_id: ''
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
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [indicatorsRes, recordsRes, deptRes] = await Promise.all([
        api.get('/api/hr/quality-indicators/quality-indicators'),
        api.get('/api/hr/quality-indicators/kpi-records'),
        api.get('/hospitals/departments/list')
      ]);
      
      setIndicators(indicatorsRes.data || []);
      setRecords(recordsRes.data || []);
      setDepartments(deptRes.data || []);
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
        department_id: indicatorForm.department_id ? parseInt(indicatorForm.department_id) : null
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
      department_id: ''
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
      department_id: indicator.department_id ? indicator.department_id.toString() : ''
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
    if (window.confirm('Are you sure you want to delete this quality indicator?')) {
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

  const deleteRecord = async (id) => {
    if (window.confirm('Are you sure you want to delete this KPI record?')) {
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
            <h2 className="text-lg font-semibold">Quality Indicators</h2>
            <button
              onClick={() => setShowIndicatorForm(true)}
              className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 border border-black flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Quality Indicator
            </button>
          </div>

          {/* Quality Indicators Form */}
          {showIndicatorForm && (
            <div className="bg-white p-6 rounded-lg border border-black mb-6">
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
                    className="w-full p-2 border border-black rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={indicatorForm.kpi_category}
                    onChange={(e) => setIndicatorForm({...indicatorForm, kpi_category: e.target.value})}
                    className="w-full p-2 border border-black rounded-md"
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
                    className="w-full p-2 border border-black rounded-md"
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
                    className="w-full p-2 border border-black rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measure *</label>
                  <select
                    value={indicatorForm.unit_of_measure}
                    onChange={(e) => setIndicatorForm({...indicatorForm, unit_of_measure: e.target.value})}
                    className="w-full p-2 border border-black rounded-md"
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
                    className="w-full p-2 border border-black rounded-md"
                    required
                  >
                    {frequencies.map(freq => (
                      <option key={freq} value={freq}>{freq}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    value={indicatorForm.department_id}
                    onChange={(e) => setIndicatorForm({...indicatorForm, department_id: e.target.value})}
                    className="w-full p-2 border border-black rounded-md"
                  >
                    <option value="">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 border border-black"
                  >
                    {loading ? 'Saving...' : editingIndicator ? 'Update' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={resetIndicatorForm}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 border border-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Quality Indicators Table */}
          <div className="bg-white rounded-lg border border-black overflow-hidden">
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
                  <tr key={indicator.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {indicator.kpi_name}
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
                        <button
                          onClick={() => editIndicator(indicator)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteIndicator(indicator.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KPI Records Tab */}
      {activeTab === 'records' && (
        <div>
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-lg font-semibold">KPI Records</h2>
            <button
              onClick={() => setShowRecordForm(true)}
              className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 border border-black flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add KPI Record
            </button>
          </div>

          {/* KPI Records Form */}
          {showRecordForm && (
            <div className="bg-white p-6 rounded-lg border border-black mb-6">
              <h3 className="text-lg font-medium mb-4">
                {editingRecord ? 'Edit KPI Record' : 'Add KPI Record'}
              </h3>
              <form onSubmit={handleRecordSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quality Indicator *</label>
                  <select
                    value={recordForm.quality_indicator_id}
                    onChange={(e) => setRecordForm({...recordForm, quality_indicator_id: e.target.value})}
                    className="w-full p-2 border border-black rounded-md"
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
                    className="w-full p-2 border border-black rounded-md"
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
                    className="w-full p-2 border border-black rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recorded By *</label>
                  <input
                    type="text"
                    value={recordForm.recorded_by}
                    onChange={(e) => setRecordForm({...recordForm, recorded_by: e.target.value})}
                    className="w-full p-2 border border-black rounded-md"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                  <textarea
                    value={recordForm.remarks}
                    onChange={(e) => setRecordForm({...recordForm, remarks: e.target.value})}
                    className="w-full p-2 border border-black rounded-md"
                    rows="2"
                  />
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 border border-black"
                  >
                    {loading ? 'Saving...' : editingRecord ? 'Update' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={resetRecordForm}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 border border-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* KPI Records Table */}
          <div className="bg-white rounded-lg border border-black overflow-hidden">
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
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.kpi_name}
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
                        <button
                          onClick={() => editRecord(record)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteRecord(record.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <Toast toast={toast} hideToast={hideToast} />
    </div>
  );
};

export default QualityIndicators;