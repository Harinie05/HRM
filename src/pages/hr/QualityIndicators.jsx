import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import api from '../../api';
import useToast from '../../utils/useToast';
import Toast from '../../components/Toast';

const QualityIndicators = () => {
  const { toast, showToast, hideToast } = useToast();
  const [activeTab, setActiveTab] = useState('manage');
  const [indicators, setIndicators] = useState([]);
  const [records, setRecords] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [showIndicatorForm, setShowIndicatorForm] = useState(false);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [editingIndicator, setEditingIndicator] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [colors, setColors] = useState({ primary: '#2862e9', secondary: '#474e71' });
  const [showDeleted, setShowDeleted] = useState(false);

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
    fetchColors();
    fetchData();
    // Seed departments on page load
    seedDepartments();
  }, []);

  const fetchColors = async () => {
    try {
      const tenantCode = localStorage.getItem('tenant_code');
      if (tenantCode) {
        const response = await api.get(`/auth/branding/${tenantCode}`);
        if (response.data.primary_color && response.data.secondary_color) {
          setColors({
            primary: response.data.primary_color,
            secondary: response.data.secondary_color
          });
        }
      }
    } catch (error) {
      console.error('Error fetching colors:', error);
    }
  };

  const seedDepartments = async () => {
    try {
      await api.post('/api/hr/quality-indicators/departments/seed');
      console.log('Departments seeded');
    } catch (error) {
      console.log('Seed error (might already exist):', error.message);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('Fetching data...');
      
      const [indicatorsRes, recordsRes, departmentsRes] = await Promise.all([
        api.get('/api/hr/quality-indicators/quality-indicators').catch(err => {
          console.error('Indicators API error:', err);
          return { data: [] };
        }),
        api.get('/api/hr/quality-indicators/kpi-records').catch(err => {
          console.error('Records API error:', err);
          return { data: [] };
        }),
        api.get('/api/hr/quality-indicators/departments').catch(err => {
          console.error('Departments API error:', err);
          return { data: [] };
        })
      ]);
      
      console.log('API Responses:', {
        indicators: indicatorsRes.data,
        records: recordsRes.data,
        departments: departmentsRes.data
      });
      
      // If no departments found, seed some sample departments
      if (!departmentsRes.data || departmentsRes.data.length === 0) {
        console.log('No departments found, seeding sample departments...');
        try {
          await api.post('/api/hr/quality-indicators/departments/seed');
          // Fetch departments again after seeding
          const newDepartmentsRes = await api.get('/api/hr/quality-indicators/departments');
          console.log('Departments after seeding:', newDepartmentsRes.data);
          setDepartments(newDepartmentsRes.data || []);
        } catch (seedError) {
          console.error('Error seeding departments:', seedError);
          showToast('Failed to load departments', 'error');
          setDepartments([]);
        }
      } else {
        setDepartments(departmentsRes.data || []);
      }
      
      setIndicators(indicatorsRes.data || []);
      setRecords(recordsRes.data || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Failed to load quality indicators data', 'error');
      setIndicators([]);
      setRecords([]);
      setDepartments([]);
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
      showToast('Quality indicator saved successfully!', 'success');
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
      showToast('KPI record saved successfully!', 'success');
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

      {/* Department Filter - More Visible */}
      <div className="mb-6 bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Department Filter</h3>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-blue-700">Select Department:</label>
          <select 
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-lg min-w-[200px]"
            style={{
              backgroundColor: `${colors.primary}10`,
              border: `2px solid ${colors.primary}`
            }}
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
          <span className="text-sm text-blue-600">({departments.length} departments loaded)</span>
          <button 
            onClick={async () => {
              try {
                const res = await api.get('/api/hr/quality-indicators/departments');
                console.log('Manual test result:', res.data);
                alert(`Found ${res.data.length} departments`);
              } catch (err) {
                console.error('Manual test error:', err);
                alert('Error: ' + err.message);
              }
            }}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
          >
            Test API
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="-b-0 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('manage')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors`}
            style={{
              borderBottomColor: activeTab === 'manage' ? colors.primary : 'transparent',
              backgroundColor: activeTab === 'manage' ? colors.primary : 'transparent',
              color: activeTab === 'manage' ? 'white' : '#6b7280'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'manage') {
                e.currentTarget.style.backgroundColor = colors.secondary;
                e.currentTarget.style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'manage') {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#6b7280';
              }
            }}
          >
            Manage KPIs
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors`}
            style={{
              borderBottomColor: activeTab === 'records' ? colors.primary : 'transparent',
              backgroundColor: activeTab === 'records' ? colors.primary : 'transparent',
              color: activeTab === 'records' ? 'white' : '#6b7280'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'records') {
                e.currentTarget.style.backgroundColor = colors.secondary;
                e.currentTarget.style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'records') {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#6b7280';
              }
            }}
          >
            KPI Records
          </button>
        </nav>
      </div>

      {/* Manage KPIs Tab */}
      {activeTab === 'manage' && (
        <div>
          <div className="mb-6 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold">Quality Indicators</h2>
              <button
                onClick={() => setShowDeleted(!showDeleted)}
                className="px-3 py-1 rounded-md text-sm transition-colors"
                style={{
                  backgroundColor: showDeleted ? colors.primary : 'transparent',
                  color: showDeleted ? 'white' : colors.primary,
                  border: `1px solid ${colors.primary}`
                }}
                onMouseEnter={(e) => {
                  if (!showDeleted) {
                    e.currentTarget.style.backgroundColor = colors.secondary;
                    e.currentTarget.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!showDeleted) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = colors.primary;
                  }
                }}
              >
                Show Deleted (1)
              </button>
            </div>
            <button
              onClick={() => setShowIndicatorForm(true)}
              className="text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
              style={{
                backgroundColor: colors.primary,
                borderColor: colors.primary
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.secondary}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary}
            >
              <Plus className="w-4 h-4" />
              Add Quality Indicator
            </button>
          </div>

          {/* Quality Indicators Form */}
          {showIndicatorForm && (
            <div className="bg-white p-6 rounded-lg mb-6 relative overflow-hidden" style={{
              background: `linear-gradient(135deg, white 0%, ${colors.primary}05 100%)`,
              border: `1px solid ${colors.primary}20`
            }}>
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-30 pointer-events-none" style={{
                background: `radial-gradient(circle, ${colors.primary}40 0%, transparent 70%)`,
                transform: 'translate(40%, -40%)'
              }}></div>
              <h3 className="text-lg font-medium mb-4 relative z-10">
                {editingIndicator ? 'Edit Quality Indicator' : 'Add Quality Indicator'}
              </h3>
              <form onSubmit={handleIndicatorSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">KPI Name *</label>
                  <input
                    type="text"
                    value={indicatorForm.kpi_name}
                    onChange={(e) => setIndicatorForm({...indicatorForm, kpi_name: e.target.value})}
                    className="w-full p-2 rounded-md"
                    style={{ backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`, border: `1px solid ${colors.primary}` }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={indicatorForm.kpi_category}
                    onChange={(e) => setIndicatorForm({...indicatorForm, kpi_category: e.target.value})}
                    className="w-full p-2 rounded-md"
                    style={{ backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`, border: `1px solid ${colors.primary}` }}
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
                    className="w-full p-2 rounded-md"
                    style={{ backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`, border: `1px solid ${colors.primary}` }}
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
                    className="w-full p-2 rounded-md"
                    style={{ backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`, border: `1px solid ${colors.primary}` }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measure *</label>
                  <select
                    value={indicatorForm.unit_of_measure}
                    onChange={(e) => setIndicatorForm({...indicatorForm, unit_of_measure: e.target.value})}
                    className="w-full p-2 rounded-md"
                    style={{ backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`, border: `1px solid ${colors.primary}` }}
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
                    className="w-full p-2 rounded-md"
                    style={{ backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`, border: `1px solid ${colors.primary}` }}
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
                    className="w-full p-2 rounded-md"
                    style={{ backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`, border: `1px solid ${colors.primary}` }}
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
                    className="text-white px-4 py-2 rounded-md transition-colors"
                    style={{
                      backgroundColor: colors.primary,
                      borderColor: colors.primary
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.secondary}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary}
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
          <div className="bg-white rounded-lg overflow-hidden relative" style={{
            background: `linear-gradient(135deg, white 0%, ${colors.primary}05 100%)`,
            border: `1px solid ${colors.primary}20`
          }}>
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-30 pointer-events-none" style={{
              background: `radial-gradient(circle, ${colors.primary}40 0%, transparent 70%)`,
              transform: 'translate(40%, -40%)'
            }}></div>
            <table className="min-w-full divide-y divide-gray-200 relative z-10">
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
                {indicators
                  .filter(indicator => !selectedDepartment || indicator.department_id == selectedDepartment)
                  .map((indicator) => (
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
              className="text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors border"
              style={{
                backgroundColor: colors.primary,
                borderColor: colors.primary
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.secondary;
                e.target.style.borderColor = colors.secondary;
              }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.primary;
                e.target.style.borderColor = colors.primary;
              }}
            >
              <Plus className="w-4 h-4" />
              Add KPI Record
            </button>
          </div>

          {/* KPI Records Form */}
          {showRecordForm && (
            <div className="bg-white p-6 rounded-lg mb-6 relative overflow-hidden" style={{
              background: `linear-gradient(135deg, white 0%, ${colors.primary}05 100%)`,
              border: `1px solid ${colors.primary}20`
            }}>
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-30 pointer-events-none" style={{
                background: `radial-gradient(circle, ${colors.primary}40 0%, transparent 70%)`,
                transform: 'translate(40%, -40%)'
              }}></div>
              <h3 className="text-lg font-medium mb-4 relative z-10">
                {editingRecord ? 'Edit KPI Record' : 'Add KPI Record'}
              </h3>
              <form onSubmit={handleRecordSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quality Indicator *</label>
                  <select
                    value={recordForm.quality_indicator_id}
                    onChange={(e) => setRecordForm({...recordForm, quality_indicator_id: e.target.value})}
                    className="w-full p-2 rounded-md"
                    style={{ backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`, border: `1px solid ${colors.primary}` }}
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
                    className="w-full p-2 rounded-md"
                    style={{ backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`, border: `1px solid ${colors.primary}` }}
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
                    className="w-full p-2 rounded-md"
                    style={{ backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`, border: `1px solid ${colors.primary}` }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recorded By *</label>
                  <input
                    type="text"
                    value={recordForm.recorded_by}
                    onChange={(e) => setRecordForm({...recordForm, recorded_by: e.target.value})}
                    className="w-full p-2 rounded-md"
                    style={{ backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`, border: `1px solid ${colors.primary}` }}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                  <textarea
                    value={recordForm.remarks}
                    onChange={(e) => setRecordForm({...recordForm, remarks: e.target.value})}
                    className="w-full p-2 rounded-md"
                    style={{ backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`, border: `1px solid ${colors.primary}` }}
                    rows="2"
                  />
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="text-white px-4 py-2 rounded-md transition-colors"
                    style={{
                      backgroundColor: colors.primary,
                      borderColor: colors.primary
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.secondary}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary}
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
          <div className="bg-white rounded-lg overflow-hidden relative" style={{
            background: `linear-gradient(135deg, white 0%, ${colors.primary}05 100%)`,
            border: `1px solid ${colors.primary}20`
          }}>
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-30 pointer-events-none" style={{
              background: `radial-gradient(circle, ${colors.primary}40 0%, transparent 70%)`,
              transform: 'translate(40%, -40%)'
            }}></div>
            <table className="min-w-full divide-y divide-gray-200 relative z-10">
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
                {records
                  .filter(record => {
                    if (!selectedDepartment) return true;
                    const indicator = indicators.find(ind => ind.kpi_name === record.kpi_name);
                    return indicator && indicator.department_id == selectedDepartment;
                  })
                  .map((record) => (
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
