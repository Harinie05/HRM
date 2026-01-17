import { useState, useEffect } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import Toast from '../../components/Toast';
import useToast from '../../utils/useToast';
import api from '../../api';
import { hasPermission } from '../../utils/permissions';

export default function StaffScheduling() {
  // Permission checks
  const canView = hasPermission('view_staff_schedules');
  const canAdd = hasPermission('add_staff_schedule');
  const canEdit = hasPermission('edit_staff_schedule');
  const canDelete = hasPermission('delete_staff_schedule');
  const [colors, setColors] = useState({ primary: '#2862e9', secondary: '#474e71' });
  
  if (!canView) {
    return (
      <div className="p-6 text-center">
        <div className="bg-white rounded-2xl border-0 p-8 max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to view staff schedules.</p>
        </div>
      </div>
    );
  }
  
  const [activeTab, setActiveTab] = useState('manage');
  const [patientLoads, setPatientLoads] = useState([]);
  const [staffAllocations, setStaffAllocations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [editingLoad, setEditingLoad] = useState(null);
  const [editingAllocation, setEditingAllocation] = useState(null);
  const { toast, showToast, hideToast } = useToast();

  const [patientLoadForm, setPatientLoadForm] = useState({
    department_id: '',
    custom_department: '',
    date: new Date().toISOString().split('T')[0],
    shift: 'Morning',
    total_patients: 0,
    critical_patients: 0,
    icu_patients: 0,
    opd_patients: 0,
    emergency_patients: 0
  });

  const [allocationForm, setAllocationForm] = useState({
    department_id: '',
    custom_department: '',
    date: new Date().toISOString().split('T')[0],
    shift: 'Morning',
    required_nurses: 0,
    required_doctors: 0,
    required_support_staff: 0,
    allocated_nurses: 0,
    allocated_doctors: 0,
    allocated_support_staff: 0
  });

  useEffect(() => {
    fetchColors();
    fetchPatientLoads();
    fetchStaffAllocations();
    fetchDepartments();
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

  const fetchPatientLoads = async () => {
    try {
      const response = await api.get('/api/hr/staff-scheduling/patient-loads');
      setPatientLoads(response.data.patient_loads || []);
    } catch (error) {
      console.error('Error fetching patient loads:', error);
    }
  };

  const fetchStaffAllocations = async () => {
    try {
      const response = await api.get('/api/hr/staff-scheduling/staff-allocations');
      setStaffAllocations(response.data.staff_allocations || []);
    } catch (error) {
      console.error('Error fetching staff allocations:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const tenantDb = localStorage.getItem('tenant_db');
      const response = await api.get(`/hospitals/departments/${tenantDb}/list`);
      
      if (response.data.departments && response.data.departments.length > 0) {
        setDepartments(response.data.departments);
      } else {
        setDepartments([]);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([]);
    }
  };

  const handlePatientLoadSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLoad) {
        // Update existing patient load
        const response = await api.put(`/api/hr/staff-scheduling/patient-loads/${editingLoad.id}`, patientLoadForm);
        if (response.data) {
          showToast('Patient load updated successfully!');
          setEditingLoad(null);
        }
      } else {
        // Create new patient load
        const response = await api.post('/api/hr/staff-scheduling/patient-loads', patientLoadForm);
        if (response.data) {
          showToast('Patient load recorded successfully!');
        }
      }
      
      fetchPatientLoads();
      setPatientLoadForm({
        department_id: '',
        custom_department: '',
        date: new Date().toISOString().split('T')[0],
        shift: 'Morning',
        total_patients: 0,
        critical_patients: 0,
        icu_patients: 0,
        opd_patients: 0,
        emergency_patients: 0
      });
    } catch (error) {
      console.error('Error with patient load:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to process patient load';
      showToast(`Error: ${errorMessage}`, 'error');
    }
  };

  const handleAllocationSubmit = async (e) => {
    e.preventDefault();
    try {
      const allocationData = { ...allocationForm, created_by: 1 };
      
      if (editingAllocation) {
        // Update existing allocation
        const response = await api.put(`/api/hr/staff-scheduling/staff-allocations/${editingAllocation.id}`, allocationData);
        if (response.data) {
          showToast('Staff allocation updated successfully!');
          setEditingAllocation(null);
        }
      } else {
        // Create new allocation
        const response = await api.post('/api/hr/staff-scheduling/staff-allocations', allocationData);
        if (response.data) {
          showToast('Staff allocation created successfully!');
        }
      }
      
      fetchStaffAllocations();
      setAllocationForm({
        department_id: '',
        custom_department: '',
        date: new Date().toISOString().split('T')[0],
        shift: 'Morning',
        required_nurses: 0,
        required_doctors: 0,
        required_support_staff: 0,
        allocated_nurses: 0,
        allocated_doctors: 0,
        allocated_support_staff: 0
      });
    } catch (error) {
      console.error('Error with staff allocation:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to process staff allocation';
      showToast(`Error: ${errorMessage}`, 'error');
    }
  };

  const handleDeleteLoad = async (id) => {
    if (!window.confirm('Are you sure you want to delete this patient load?')) return;
    
    try {
      await api.delete(`/api/hr/staff-scheduling/patient-loads/${id}`);
      showToast('Patient load deleted successfully!');
      fetchPatientLoads();
    } catch (error) {
      console.error('Error deleting patient load:', error);
      showToast('Error deleting patient load', 'error');
    }
  };

  const handleDeleteAllocation = async (id) => {
    if (!window.confirm('Are you sure you want to delete this staff allocation?')) return;
    
    try {
      await api.delete(`/api/hr/staff-scheduling/staff-allocations/${id}`);
      showToast('Staff allocation deleted successfully!');
      fetchStaffAllocations();
    } catch (error) {
      console.error('Error deleting staff allocation:', error);
      showToast('Error deleting staff allocation', 'error');
    }
  };

  const handleEditLoad = (load) => {
    setPatientLoadForm({
      department_id: load.department_id,
      custom_department: '',
      date: load.date,
      shift: load.shift,
      total_patients: load.total_patients,
      critical_patients: load.critical_patients,
      icu_patients: load.icu_patients,
      opd_patients: load.opd_patients,
      emergency_patients: load.emergency_patients
    });
    setEditingLoad(load);
    setActiveTab('manage');
  };

  const handleEditAllocation = (allocation) => {
    setAllocationForm({
      department_id: allocation.department_id,
      custom_department: '',
      date: allocation.date,
      shift: allocation.shift,
      required_nurses: allocation.required_nurses,
      required_doctors: allocation.required_doctors,
      required_support_staff: allocation.required_support_staff,
      allocated_nurses: allocation.allocated_nurses,
      allocated_doctors: allocation.allocated_doctors,
      allocated_support_staff: allocation.allocated_support_staff
    });
    setEditingAllocation(allocation);
    setActiveTab('manage');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Adequate': return 'text-green-600 bg-green-100';
      case 'Understaffed': return 'text-red-600 bg-red-100';
      case 'Overstaffed': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 ">
        {['manage', 'records'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors`}
            style={{
              backgroundColor: activeTab === tab ? colors.primary : 'transparent',
              color: activeTab === tab ? 'white' : '#6b7280'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab) {
                e.currentTarget.style.backgroundColor = colors.secondary;
                e.currentTarget.style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#6b7280';
              }
            }}
          >
            {tab === 'manage' ? 'Patient Load & Staff Allocation' : 
             tab === 'records' ? 'View & Manage Records' : 
             tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'manage' && (
        <div className="space-y-6">
          {!canAdd ? (
            <div className="bg-white rounded-lg p-6 text-center relative overflow-hidden" style={{
              background: `linear-gradient(135deg, white 0%, ${colors.primary}05 100%)`,
              border: `1px solid ${colors.primary}`
            }}>
              <p className="text-gray-500">You don't have permission to manage staff schedules.</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg p-6 relative overflow-hidden" style={{
                background: `linear-gradient(135deg, white 0%, ${colors.primary}05 100%)`,
                border: `1px solid ${colors.primary}`
              }}>
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-30 pointer-events-none" style={{
                  background: `radial-gradient(circle, ${colors.primary}40 0%, transparent 70%)`,
                  transform: 'translate(40%, -40%)'
                }}></div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 relative z-10">
                  {editingLoad ? 'Edit Patient Load' : 'Record Patient Load'}
                </h3>
            <form onSubmit={handlePatientLoadSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select 
                  value={patientLoadForm.department_id}
                  onChange={(e) => setPatientLoadForm({...patientLoadForm, department_id: e.target.value, custom_department: ''})}
                  className="rounded-md px-3 py-2 w-full"
                  required
                  style={{
                    backgroundColor: `${colors.primary}10`,
                    border: `1px solid ${colors.primary}`
                  }}
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                  <option value="other">Other</option>
                </select>
                {patientLoadForm.department_id === 'other' && (
                  <input 
                    type="text"
                    placeholder="Enter department name"
                    value={patientLoadForm.custom_department}
                    onChange={(e) => setPatientLoadForm({...patientLoadForm, custom_department: e.target.value})}
                    className="rounded-md px-3 py-2 w-full mt-2"
                    required
                    style={{
                      backgroundColor: `${colors.primary}10`,
                      border: `1px solid ${colors.primary}`
                    }}
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input 
                  type="date"
                  value={patientLoadForm.date}
                  onChange={(e) => setPatientLoadForm({...patientLoadForm, date: e.target.value})}
                  className="rounded-md px-3 py-2 w-full"
                  required
                  style={{
                    backgroundColor: `${colors.primary}10`,
                    border: `1px solid ${colors.primary}`
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
                <select 
                  value={patientLoadForm.shift}
                  onChange={(e) => setPatientLoadForm({...patientLoadForm, shift: e.target.value})}
                  className="rounded-md px-3 py-2 w-full"
                  style={{
                    backgroundColor: `${colors.primary}10`,
                    border: `1px solid ${colors.primary}`
                  }}
                >
                  <option value="Morning">Morning</option>
                  <option value="Evening">Evening</option>
                  <option value="Night">Night</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Patients</label>
                <input 
                  type="number"
                  placeholder="Enter total patient count"
                  value={patientLoadForm.total_patients}
                  onChange={(e) => setPatientLoadForm({...patientLoadForm, total_patients: parseInt(e.target.value) || 0})}
                  className="rounded-md px-3 py-2 w-full"
                  min="0"
                  style={{
                    backgroundColor: `${colors.primary}10`,
                    border: `1px solid ${colors.primary}`
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Critical Patients</label>
                <input 
                  type="number"
                  placeholder="Enter critical patient count"
                  value={patientLoadForm.critical_patients}
                  onChange={(e) => setPatientLoadForm({...patientLoadForm, critical_patients: parseInt(e.target.value) || 0})}
                  className="rounded-md px-3 py-2 w-full"
                  min="0"
                  style={{
                    backgroundColor: `${colors.primary}10`,
                    border: `1px solid ${colors.primary}`
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ICU Patients</label>
                <input 
                  type="number"
                  placeholder="Enter ICU patient count"
                  value={patientLoadForm.icu_patients}
                  onChange={(e) => setPatientLoadForm({...patientLoadForm, icu_patients: parseInt(e.target.value) || 0})}
                  className="rounded-md px-3 py-2 w-full"
                  min="0"
                  style={{
                    backgroundColor: `${colors.primary}10`,
                    border: `1px solid ${colors.primary}`
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">OPD Patients</label>
                <input 
                  type="number"
                  placeholder="Enter OPD patient count"
                  value={patientLoadForm.opd_patients}
                  onChange={(e) => setPatientLoadForm({...patientLoadForm, opd_patients: parseInt(e.target.value) || 0})}
                  className="rounded-md px-3 py-2 w-full"
                  min="0"
                  style={{
                    backgroundColor: `${colors.primary}10`,
                    border: `1px solid ${colors.primary}`
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Patients</label>
                <input 
                  type="number"
                  placeholder="Enter emergency patient count"
                  value={patientLoadForm.emergency_patients}
                  onChange={(e) => setPatientLoadForm({...patientLoadForm, emergency_patients: parseInt(e.target.value) || 0})}
                  className="rounded-md px-3 py-2 w-full"
                  min="0"
                  style={{
                    backgroundColor: `${colors.primary}10`,
                    border: `1px solid ${colors.primary}`
                  }}
                />
              </div>
              <div className="md:col-span-3">
                <button
                  type="submit"
                  className="text-white px-6 py-2 rounded-md w-full md:w-auto transition-colors"
                  style={{
                    backgroundColor: colors.primary,
                    borderColor: colors.primary
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.secondary}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary}
                >
                  {editingLoad ? 'Update Patient Load' : 'Record Patient Load'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-lg p-6 relative overflow-hidden" style={{
            background: `linear-gradient(135deg, white 0%, ${colors.primary}05 100%)`,
            border: `1px solid ${colors.primary}`
          }}>
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-30 pointer-events-none" style={{
              background: `radial-gradient(circle, ${colors.primary}40 0%, transparent 70%)`,
              transform: 'translate(40%, -40%)'
            }}></div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 relative z-10">
              {editingAllocation ? 'Edit Staff Allocation' : 'Create Staff Allocation'}
            </h3>
            <form onSubmit={handleAllocationSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select 
                  value={allocationForm.department_id}
                  onChange={(e) => setAllocationForm({...allocationForm, department_id: e.target.value, custom_department: ''})}
                  className="rounded-md px-3 py-2 w-full"
                  required
                  style={{
                    backgroundColor: `${colors.primary}10`,
                    border: `1px solid ${colors.primary}`
                  }}
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                  <option value="other">Other</option>
                </select>
                {allocationForm.department_id === 'other' && (
                  <input 
                    type="text"
                    placeholder="Enter department name"
                    value={allocationForm.custom_department}
                    onChange={(e) => setAllocationForm({...allocationForm, custom_department: e.target.value})}
                    className="rounded-md px-3 py-2 w-full mt-2"
                    required
                    style={{
                      backgroundColor: `${colors.primary}10`,
                      border: `1px solid ${colors.primary}`
                    }}
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input 
                  type="date"
                  value={allocationForm.date}
                  onChange={(e) => setAllocationForm({...allocationForm, date: e.target.value})}
                  className="rounded-md px-3 py-2 w-full"
                  required
                  style={{
                    backgroundColor: `${colors.primary}10`,
                    border: `1px solid ${colors.primary}`
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
                <select 
                  value={allocationForm.shift}
                  onChange={(e) => setAllocationForm({...allocationForm, shift: e.target.value})}
                  className="rounded-md px-3 py-2 w-full"
                  style={{
                    backgroundColor: `${colors.primary}10`,
                    border: `1px solid ${colors.primary}`
                  }}
                >
                  <option value="Morning">Morning</option>
                  <option value="Evening">Evening</option>
                  <option value="Night">Night</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Required Nurses</label>
                <input 
                  type="number"
                  placeholder="How many nurses needed?"
                  value={allocationForm.required_nurses}
                  onChange={(e) => setAllocationForm({...allocationForm, required_nurses: parseInt(e.target.value) || 0})}
                  className="rounded-md px-3 py-2 w-full"
                  min="0"
                  style={{
                    backgroundColor: `${colors.primary}10`,
                    border: `1px solid ${colors.primary}`
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allocated Nurses</label>
                <input 
                  type="number"
                  placeholder="How many nurses assigned?"
                  value={allocationForm.allocated_nurses}
                  onChange={(e) => setAllocationForm({...allocationForm, allocated_nurses: parseInt(e.target.value) || 0})}
                  className="rounded-md px-3 py-2 w-full"
                  min="0"
                  style={{
                    backgroundColor: `${colors.primary}10`,
                    border: `1px solid ${colors.primary}`
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Required Doctors</label>
                <input 
                  type="number"
                  placeholder="How many doctors needed?"
                  value={allocationForm.required_doctors}
                  onChange={(e) => setAllocationForm({...allocationForm, required_doctors: parseInt(e.target.value) || 0})}
                  className="rounded-md px-3 py-2 w-full"
                  min="0"
                  style={{
                    backgroundColor: `${colors.primary}10`,
                    border: `1px solid ${colors.primary}`
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allocated Doctors</label>
                <input 
                  type="number"
                  placeholder="How many doctors assigned?"
                  value={allocationForm.allocated_doctors}
                  onChange={(e) => setAllocationForm({...allocationForm, allocated_doctors: parseInt(e.target.value) || 0})}
                  className="rounded-md px-3 py-2 w-full"
                  min="0"
                  style={{
                    backgroundColor: `${colors.primary}10`,
                    border: `1px solid ${colors.primary}`
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Required Support Staff</label>
                <input 
                  type="number"
                  placeholder="How many support staff needed?"
                  value={allocationForm.required_support_staff}
                  onChange={(e) => setAllocationForm({...allocationForm, required_support_staff: parseInt(e.target.value) || 0})}
                  className="rounded-md px-3 py-2 w-full"
                  min="0"
                  style={{
                    backgroundColor: `${colors.primary}10`,
                    border: `1px solid ${colors.primary}`
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allocated Support Staff</label>
                <input 
                  type="number"
                  placeholder="How many support staff assigned?"
                  value={allocationForm.allocated_support_staff}
                  onChange={(e) => setAllocationForm({...allocationForm, allocated_support_staff: parseInt(e.target.value) || 0})}
                  className="rounded-md px-3 py-2 w-full"
                  min="0"
                  style={{
                    backgroundColor: `${colors.primary}10`,
                    border: `1px solid ${colors.primary}`
                  }}
                />
              </div>
              <div className="md:col-span-3">
                <button
                  type="submit"
                  className="text-white px-6 py-2 rounded-md w-full md:w-auto transition-colors"
                  style={{
                    backgroundColor: colors.primary,
                    borderColor: colors.primary
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.secondary}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary}
                >
                  {editingAllocation ? 'Update Staff Allocation' : 'Create Staff Allocation'}
                </button>
              </div>
            </form>
          </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'records' && (
        <div className="space-y-6">
          {/* Patient Loads Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border" style={{
            background: `linear-gradient(135deg, white 0%, ${colors.primary}03 100%)`,
            border: `1px solid ${colors.primary}`
          }}>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{
              backgroundColor: colors.primary,
              transform: 'translate(30%, -30%)'
            }}></div>
            <div className="px-6 py-4 border-b border-gray-200 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{
                  backgroundColor: `${colors.primary}20`
                }}>
                  <svg className="h-5 w-5" style={{
                    color: colors.primary
                  }} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Patient Loads</h3>
              </div>
            </div>
            <div className="overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shift</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Critical</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {patientLoads.map((load) => {
                    const dept = departments.find(d => d.id === load.department_id);
                    return (
                      <tr key={load.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {dept ? dept.name : `Dept ${load.department_id}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{load.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{load.shift}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{load.total_patients}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{load.critical_patients}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          {canEdit && (
                            <button
                              onClick={() => handleEditLoad(load)}
                              className="text-green-600 hover:text-green-900 p-1"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteLoad(load.id)}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Staff Allocations Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border" style={{
            background: `linear-gradient(135deg, white 0%, ${colors.primary}03 100%)`,
            border: `1px solid ${colors.primary}`
          }}>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{
              backgroundColor: colors.primary,
              transform: 'translate(30%, -30%)'
            }}></div>
            <div className="px-6 py-4 border-b border-gray-200 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{
                  backgroundColor: `${colors.primary}20`
                }}>
                  <svg className="h-5 w-5" style={{
                    color: colors.primary
                  }} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Staff Allocations</h3>
              </div>
            </div>
            <div className="overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shift</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nurses</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctors</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {staffAllocations.map((allocation) => {
                    const dept = departments.find(d => d.id === allocation.department_id);
                    return (
                      <tr key={allocation.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {dept ? dept.name : `Dept ${allocation.department_id}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{allocation.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{allocation.shift}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {allocation.allocated_nurses}/{allocation.required_nurses}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {allocation.allocated_doctors}/{allocation.required_doctors}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(allocation.allocation_status)}`}>
                            {allocation.allocation_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          {canEdit && (
                            <button
                              onClick={() => handleEditAllocation(allocation)}
                              className="text-green-600 hover:text-green-900 p-1"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteAllocation(allocation.id)}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      <Toast toast={toast} hideToast={hideToast} />
    </div>
  );
}
