import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiTrendingUp, FiArrowLeft, FiUsers, FiUser } from "react-icons/fi";
import api from "../../api";
import Layout from "../../components/Layout";
import useToast from "../../utils/useToast";
import Toast from "../../components/Toast";
import { hasPermission, isAdmin } from "../../utils/permissions";

export default function EmployeeReporting() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const [form, setForm] = useState({
    reporting_manager_id: "",
    reporting_start_date: "",
    employee_level_id: "",
    alternative_manager_id: "",
  });
  const [reportingData, setReportingData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [levels, setLevels] = useState([]);
  const [hierarchy, setHierarchy] = useState([]);
  const [hierarchyRules, setHierarchyRules] = useState([]);
  const [availableManagers, setAvailableManagers] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const canView = true;
  const canAdd = true;
  const canEdit = true;

  const fetchEmployees = async () => {
    try {
      const tenant = localStorage.getItem("tenant_db");
      const token = localStorage.getItem("access_token");
      
      const response = await fetch(`${api.defaults.baseURL}/hospitals/users/${tenant}/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const users = data.users || [];
        
        // Fetch onboarded employees to get employee codes
        try {
          const onboardingResponse = await api.get('/recruitment/onboarding/list');
          const onboardedEmployees = onboardingResponse.data || [];
          console.log('Onboarded employees:', onboardedEmployees);
          console.log('Users:', users.map(u => ({id: u.id, name: u.name})));
          
          // Merge user data with onboarded employee codes
          const usersWithCodes = users.map(user => {
            const onboardedEmployee = onboardedEmployees.find(emp => emp.application_id === user.id);
            console.log(`User ${user.id} (${user.name}):`, onboardedEmployee?.employee_id || 'No match');
            return {
              ...user,
              employee_code: onboardedEmployee?.employee_id || user.employee_code || ''
            };
          });
          
          setEmployees(usersWithCodes);
        } catch (onboardingErr) {
          console.error("Failed to fetch onboarding data", onboardingErr);
          setEmployees(users);
        }
      }
    } catch (err) {
      console.error("Failed to fetch employees", err);
    }
  };

  const fetchLevels = async () => {
    try {
      const tenant_db = localStorage.getItem("tenant_db");
      const res = await api.get(`/hospitals/users/${tenant_db}/reporting-levels`);
      setLevels(res.data?.reporting_levels || []);
    } catch (err) {
      console.error("Failed to fetch levels", err);
    }
  };

  const fetchHierarchy = async () => {
    try {
      const tenant_db = localStorage.getItem("tenant_db");
      const res = await api.get(`/hospitals/users/${tenant_db}/hierarchy-rules`);
      setHierarchyRules(res.data?.hierarchy_rules || []);
    } catch (err) {
      console.error("Failed to fetch hierarchy rules", err);
    }
  };

  const fetchManagersByLevel = async (levelId) => {
    if (!levelId) {
      setAvailableManagers([]);
      return;
    }
    
    try {
      const tenant_db = localStorage.getItem("tenant_db");
      const res = await api.get(`/hospitals/users/${tenant_db}/managers-by-level?level_id=${levelId}`);
      setAvailableManagers(res.data?.managers || []);
    } catch (err) {
      console.error("Failed to fetch managers by level", err);
      setAvailableManagers([]);
    }
  };

  const fetchReportingDetails = async () => {
    try {
      const storageKey = `employee_reporting_${id}`;
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        const data = JSON.parse(savedData);
        setForm({
          reporting_manager_id: data.reporting_manager_id || "",
          reporting_start_date: data.reporting_start_date || "",
          employee_level_id: data.employee_level_id || "",
          alternative_manager_id: data.alternative_manager_id || "",
        });
        setReportingData(data);
        setIsEditing(true);
      }
    } catch (err) {
      console.error("Failed to fetch reporting details", err);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchLevels();
    fetchHierarchy();
    fetchReportingDetails();
  }, [id]);

  const handleLevelChange = (levelId) => {
    setForm({ ...form, employee_level_id: levelId, reporting_manager_id: "", alternative_manager_id: "" });
    fetchManagersByLevel(levelId);
  };

  const selectedLevelInfo = levels.find(level => level.id && level.id.toString() === form.employee_level_id);
  
  // Find parent level from hierarchy rules
  const hierarchyRule = hierarchyRules.find(rule => rule.child_level_id && rule.child_level_id.toString() === form.employee_level_id);
  const parentLevelName = hierarchyRule?.parent_level_name;

  const submit = () => {
    console.log('Submit called');
    setLoading(true);
    try {
      const payload = {
        employee_id: id,
        reporting_manager_id: form.reporting_manager_id,
        reporting_start_date: form.reporting_start_date,
        employee_level_id: form.employee_level_id,
        alternative_manager_id: form.alternative_manager_id,
      };

      const storageKey = `employee_reporting_${id}`;
      localStorage.setItem(storageKey, JSON.stringify(payload));
      
      console.log('About to show toast');
      showToast("Reporting structure saved successfully", "success");
      console.log('Toast called, toast state:', toast);
    } catch (err) {
      console.error("Failed to save reporting details", err);
      showToast("Failed to save reporting structure", "error");
    }
    setLoading(false);
  };

  return (
    <Layout>
      {/* Hero Header matching EmployeeEducation */}
      <div className="p-6 space-y-6">
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl shadow-sm p-4 sm:p-6 relative overflow-hidden" style={{
          background: `linear-gradient(to right, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10, ${getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}10)`,
          border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}`
        }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
            transform: 'translate(30%, -30%)'
          }}></div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0 flex-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <FiUsers className="h-5 h-5 sm:h-6 sm:w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
              <div className="text-center sm:text-left min-w-0">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 truncate">Reporting Hierarchy</h1>
                <p className="text-gray-600 text-sm mb-1">Manager hierarchy and reporting relationships</p>
                <p className="text-gray-500 text-xs">Organizational Structure • Chain of Command</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-start mb-4">
          <button 
            onClick={() => navigate(`/eis/${id}`)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm border"
            style={{
              backgroundColor: 'var(--primary-color, #4575b5)',
              color: 'white',
              borderColor: 'var(--primary-color, #4575b5)'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--secondary-color, #6b7280)';
              e.target.style.borderColor = 'var(--secondary-color, #6b7280)';
            }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary-color, #4575b5)';
              e.target.style.borderColor = 'var(--primary-color, #4575b5)';
            }}
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Profile
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden relative" style={{
          background: `linear-gradient(135deg, white 0%, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}03 100%)`,
          border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}`
        }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
            transform: 'translate(30%, -30%)'
          }}></div>
          <div className="p-6">

          <div className="space-y-6">
            {/* Employee Level Selection */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
                  backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
                }}>
                  <FiUsers className="w-5 h-5" style={{
                    color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                  }} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Organizational Level Assignment</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Select Organizational Level *</label>
                  <select
                    className="w-full px-4 py-3 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    style={{
                      backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                      border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                    }}
                    value={form.employee_level_id}
                    onChange={(e) => handleLevelChange(e.target.value)}
                  >
                    <option value="">Choose Employee Level</option>
                    {levels.map((level) => (
                      <option key={level.id} value={level.id}>
                        {level.level_name} (Order: {level.level_order})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Reporting structure will be automatically assigned based on organizational hierarchy</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Assignment Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    style={{
                      backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                      border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                    }}
                    value={form.reporting_start_date}
                    onChange={(e) => setForm({ ...form, reporting_start_date: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Manager Selection */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 border-0 rounded-xl flex items-center justify-center">
                  <FiUser className="w-5 h-5" style={{
                    color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                  }} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Select Reporting Manager</h3>
              </div>
              {form.employee_level_id && hierarchyRule && parentLevelName && (
                <div className="bg-blue-50 rounded-lg p-4 mb-4" style={{
                  border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}`
                }}>
                  <p className="text-sm text-blue-800">
                    <strong>Based on hierarchy:</strong> {selectedLevelInfo?.level_name} reports to {parentLevelName}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Assigned to *</label>
                  <select
                    className="w-full px-4 py-3 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    style={{
                      backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                      border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                    }}
                    value={form.reporting_manager_id}
                    onChange={(e) => setForm({ ...form, reporting_manager_id: e.target.value })}
                  >
                    <option value="">
                      {hierarchyRule && parentLevelName 
                        ? `Select ${parentLevelName}` 
                        : 'Select Manager'}
                    </option>
                    {availableManagers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name} {manager.employee_code ? `(${manager.employee_code})` : ''} - {manager.role_name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {hierarchyRule && parentLevelName 
                      ? `Showing ${parentLevelName} level employees based on hierarchy` 
                      : 'Choose any employee as manager'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    {hierarchyRule && parentLevelName 
                      ? `Alternative ${parentLevelName} (Optional)` 
                      : 'Alternative Manager (Optional)'}
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    style={{
                      backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                      border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                    }}
                    value={form.alternative_manager_id}
                    onChange={(e) => setForm({ ...form, alternative_manager_id: e.target.value })}
                  >
                    <option value="">
                      {hierarchyRule && parentLevelName 
                        ? `Select Alternative ${parentLevelName}` 
                        : 'Select Alternative Manager'}
                    </option>
                    {availableManagers.filter(manager => manager.id && (!form.reporting_manager_id || manager.id.toString() !== form.reporting_manager_id)).map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name} {manager.employee_code ? `(${manager.employee_code})` : ''} - {manager.role_name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {hierarchyRule && parentLevelName 
                      ? `Backup ${parentLevelName.toLowerCase()} when primary is unavailable` 
                      : 'Backup manager when primary is assigned'}
                  </p>
                </div>
              </div>
            </div>

            {/* Simple Reporting Summary */}
            {form.reporting_manager_id && (
              <div className="bg-gray-100 rounded-lg p-6" style={{
                border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}`
              }}>
                <h4 className="font-semibold text-gray-900 mb-4">Reporting Structure</h4>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 border-0 rounded-full flex items-center justify-center">
                    <FiUsers className="text-blue-600 text-sm" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Reports To</p>
                    <p className="text-sm text-gray-600">
                      {availableManagers.find(manager => manager.id && manager.id.toString() === form.reporting_manager_id)?.name || 'Not selected'}
                      {availableManagers.find(manager => manager.id && manager.id.toString() === form.reporting_manager_id)?.employee_code && 
                        ` (${availableManagers.find(manager => manager.id && manager.id.toString() === form.reporting_manager_id)?.employee_code})`
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-8 pt-6 border-t-0">
            {(canAdd || canEdit) && (
              <button
                onClick={submit}
                disabled={loading}
                className="px-6 py-3 text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                style={{
                  backgroundColor: loading ? '#d1d5db' : 'var(--primary-color, #4575b5)'
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = 'var(--secondary-color, #6b7280)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = 'var(--primary-color, #4575b5)';
                  }
                }}
              >
                {loading ? 'Saving...' : (isEditing ? 'Update Reporting Structure' : 'Save Reporting Structure')}
              </button>
            )}
          </div>
          </div>
        </div>
      </div>
      <Toast toast={toast} hideToast={hideToast} />
    </Layout>
  );
}

<style jsx>{`
  * {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  *::-webkit-scrollbar {
    display: none;
  }
`}</style>
