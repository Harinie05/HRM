import { useEffect, useState } from "react";
import api from "../../api";
import useToast from "../../utils/useToast";
import Toast from "../../components/Toast";
import Layout from "../../components/Layout";
import { hasPermission, isAdmin } from "../../utils/permissions";

export default function AttendanceRules() {
  const { toast, showToast } = useToast();
  const [rules, setRules] = useState([]);
  const [locations, setLocations] = useState([]);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [ruleForm, setRuleForm] = useState({ rule_name: '', rule_type: 'Late', value: 10 });
  const [locationForm, setLocationForm] = useState({ location_name: '', grace_time: 10, ot_rule: '' });
  const [statusFilter, setStatusFilter] = useState("active");
  const [colors, setColors] = useState({ primary: '#2862e9', secondary: '#474e71' });

  const fetchColors = async () => {
    try {
      const tenantCode = localStorage.getItem('tenantCode');
      if (tenantCode) {
        const response = await api.get(`/auth/branding/${tenantCode}`);
        if (response.data.primary_color && response.data.secondary_color) {
          const newColors = {
            primary: response.data.primary_color,
            secondary: response.data.secondary_color
          };
          setColors(newColors);
          document.documentElement.style.setProperty('--primary-color', newColors.primary);
          document.documentElement.style.setProperty('--secondary-color', newColors.secondary);
        }
      }
    } catch (error) {
      console.error('Error fetching colors:', error);
    }
  };

  const loadRules = async (status = statusFilter) => {
    try {
      const res = await api.get(`/api/attendance/rules/?status=${status}`);
      setRules(res.data);
    } catch (err) {
      console.error("Failed to load rules:", err);
    }
  };

  const loadLocations = async (status = statusFilter) => {
    try {
      const res = await api.get(`/api/attendance/locations/?status=${status}`);
      setLocations(res.data);
    } catch (err) {
      console.error("Failed to load locations:", err);
    }
  };

  useEffect(() => {
    fetchColors();
    loadRules();
    loadLocations();
  }, [statusFilter]);

  // Check if user has permission to view this page
  const hasViewPermission = isAdmin() || hasPermission("view_attendance_rules");

  if (!hasViewPermission) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to view attendance rules.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const handleAddRule = async () => {
    try {
      await api.post('/api/attendance/rules/', ruleForm);
      setShowRuleModal(false);
      setRuleForm({ rule_name: '', rule_type: 'Late', value: 10 });
      loadRules();
      showToast('Rule added successfully!', "success");
    } catch (err) {
      showToast('Failed to add rule', "error");
    }
  };

  const handleToggleRule = async (id, currentStatus) => {
    try {
      await api.patch(`/api/attendance/rules/${id}/toggle`);
      loadRules();
    } catch (err) {
      showToast('Failed to toggle rule status', "error");
    }
  };

  const handleDeleteRule = async (id) => {
    const rule = rules.find(r => r.id === id);
    const action = rule.is_active ? 'deactivate' : 'activate';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} this rule?`)) return;
    try {
      await api.patch(`/api/attendance/rules/${id}/toggle`);
      loadRules();
      showToast(`Rule ${action}d!`, "success");
    } catch (err) {
      showToast(`Failed to ${action} rule`, "error");
    }
  };

  const handleAddLocation = async () => {
    try {
      await api.post('/api/attendance/locations/', locationForm);
      setShowLocationModal(false);
      setLocationForm({ location_name: '', grace_time: 10, ot_rule: '' });
      loadLocations();
      showToast('Location added successfully!', "success");
    } catch (err) {
      showToast('Failed to add location', "error");
    }
  };

  const handleToggleLocation = async (id) => {
    try {
      await api.patch(`/api/attendance/locations/${id}/toggle`);
      loadLocations();
    } catch (err) {
      showToast('Failed to toggle location status', "error");
    }
  };

  const handleDeleteLocation = async (id) => {
    const location = locations.find(l => l.id === id);
    const action = location.is_active ? 'deactivate' : 'activate';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} this location?`)) return;
    try {
      await api.patch(`/api/attendance/locations/${id}/toggle`);
      loadLocations();
      showToast(`Location ${action}d!`, "success");
    } catch (err) {
      showToast(`Failed to ${action} location`, "error");
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg border-2 border-black mb-6 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg border border-black flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"></path>
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1">Attendance Rules & Policies</h1>
                  <p className="text-sm sm:text-base text-gray-600">Advanced rule engine for attendance policies, location management, and compliance settings</p>
                  <div className="flex items-center space-x-3 mt-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                      <span className="text-xs text-gray-500">{rules.length + locations.length} Active Rules</span>
                    </div>
                    <div className="w-px h-3 bg-gray-300"></div>
                    <span className="text-xs text-gray-600">Attendance Management System</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Status Filter */}
            <div className="lg:col-span-2 bg-white rounded-lg border border-black p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <span className="text-sm font-medium text-gray-700">Status Filter:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="all">All</option>
                </select>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 sm:ml-auto">
                  <div className="inline-flex items-center bg-gray-100 rounded-lg px-3 py-1 text-sm text-gray-600 border border-black">
                    Rules: {rules.length}
                  </div>
                  <div className="inline-flex items-center bg-gray-100 rounded-lg px-3 py-1 text-sm text-gray-600 border border-black">
                    Locations: {locations.length}
                  </div>
                </div>
              </div>
            </div>

            {/* ATTENDANCE RULES */}
            <div className="bg-white rounded-lg border border-black shadow-sm overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-black bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Attendance Rules</h3>
                    <p className="text-gray-600 text-xs sm:text-sm">Configure late, early, and overtime policies</p>
                  </div>
                  {(isAdmin() || hasPermission("add_attendance_rule")) && (
                    <button 
                      onClick={() => setShowRuleModal(true)}
                      className="text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm shadow-sm flex items-center gap-2"
                      style={{ backgroundColor: colors.primary }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = colors.secondary}
                      onMouseLeave={(e) => e.target.style.backgroundColor = colors.primary}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"></path>
                      </svg>
                      Add Rule
                    </button>
                  )}
                </div>
              </div>
              <div className="p-4 sm:p-6">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rule</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Value</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rules.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="p-8 sm:p-12 text-center text-gray-500">
                            <div className="flex flex-col items-center gap-3 sm:gap-4">
                              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-lg border border-black flex items-center justify-center">
                                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"></path>
                                </svg>
                              </div>
                              <div>
                                <p className="text-base sm:text-lg font-semibold text-gray-600">No rules configured</p>
                                <p className="text-xs sm:text-sm text-gray-400">Add your first attendance rule to get started</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        rules.map((r, index) => (
                          <tr key={r.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors`}>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">{r.rule_name}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-3 py-1 rounded-lg text-xs font-medium border border-black ${
                                r.rule_type === 'Late' ? 'bg-white text-gray-800' :
                                r.rule_type === 'Early' ? 'bg-gray-100 text-gray-800' :
                                'bg-gray-200 text-gray-800'
                              }`}>
                                {r.rule_type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 font-medium">{r.value} mins</td>
                            <td className="px-4 py-3 text-sm">
                              <button
                                onClick={() => handleToggleRule(r.id, r.is_active)}
                                className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all border border-black ${
                                  r.is_active ? 'bg-white text-gray-800 hover:bg-gray-50' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                              >
                                {r.is_active ? "Active" : "Inactive"}
                              </button>
                            </td>
                            <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm">
                              {(isAdmin() || hasPermission("delete_attendance_rule")) && (
                                <button
                                  onClick={() => handleDeleteRule(r.id)}
                                  className="text-white font-medium transition-colors px-2 py-1 rounded text-xs"
                                  style={{ backgroundColor: colors.primary }}
                                  onMouseEnter={(e) => e.target.style.backgroundColor = colors.secondary}
                                  onMouseLeave={(e) => e.target.style.backgroundColor = colors.primary}
                                >
                                  {r.is_active ? 'Deactivate' : 'Activate'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden">
                  {rules.length === 0 ? (
                    <div className="p-8 sm:p-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-3 sm:gap-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-lg border border-black flex items-center justify-center">
                          <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"></path>
                          </svg>
                        </div>
                        <div>
                          <p className="text-base sm:text-lg font-semibold text-gray-600">No rules configured</p>
                          <p className="text-xs sm:text-sm text-gray-400">Add your first attendance rule to get started</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    rules.map((r) => (
                      <div key={r.id} className="p-3 sm:p-4 border-b border-gray-200 hover:bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="font-semibold text-gray-900 text-sm sm:text-base">{r.rule_name}</div>
                          <button
                            onClick={() => handleToggleRule(r.id, r.is_active)}
                            className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all border border-black ${
                              r.is_active ? 'bg-white text-gray-800 hover:bg-gray-50' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {r.is_active ? "Active" : "Inactive"}
                          </button>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-xs sm:text-sm font-medium text-gray-900">Type:</span>
                            <span className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-medium border border-black ${
                              r.rule_type === 'Late' ? 'bg-white text-gray-800' :
                              r.rule_type === 'Early' ? 'bg-gray-100 text-gray-800' :
                              'bg-gray-200 text-gray-800'
                            }`}>
                              {r.rule_type}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs sm:text-sm font-medium text-gray-900">Value:</span>
                            <span className="text-xs sm:text-sm text-gray-600 font-medium">{r.value} mins</span>
                          </div>
                        </div>
                        {(isAdmin() || hasPermission("delete_attendance_rule")) && (
                          <div className="flex justify-end mt-3 pt-3 border-t border-gray-100">
                            <button
                              onClick={() => handleDeleteRule(r.id)}
                              className="text-white font-medium transition-colors px-3 py-1 rounded text-xs sm:text-sm"
                              style={{ backgroundColor: colors.primary }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = colors.secondary}
                              onMouseLeave={(e) => e.target.style.backgroundColor = colors.primary}
                            >
                              {r.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* ATTENDANCE LOCATIONS */}
            <div className="bg-white rounded-lg border border-black shadow-sm overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-black bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Attendance Locations</h3>
                    <p className="text-gray-600 text-xs sm:text-sm">Manage office locations and settings</p>
                  </div>
                  {(isAdmin() || hasPermission("add_attendance_location")) && (
                    <button 
                      onClick={() => setShowLocationModal(true)}
                      className="text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm shadow-sm flex items-center gap-2"
                      style={{ backgroundColor: colors.primary }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = colors.secondary}
                      onMouseLeave={(e) => e.target.style.backgroundColor = colors.primary}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"></path>
                      </svg>
                      Add Location
                    </button>
                  )}
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Location</th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Grace Time</th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">OT Rule</th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Status</th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {locations.map((l, index) => (
                        <tr key={l.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors`}>
                          <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold text-gray-900">{l.location_name}</td>
                          <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-700 font-medium">{l.grace_time} mins</td>
                          <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-700">{l.ot_rule || 'None'}</td>
                          <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm">
                            <span className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-medium border border-black ${
                              l.is_active ? 'bg-white text-gray-800' : 'bg-gray-200 text-gray-700'
                            }`}>
                              {l.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm">
                            <button
                              onClick={() => handleDeleteLocation(l.id)}
                              className="text-white font-medium transition-colors px-2 py-1 rounded text-xs"
                              style={{ backgroundColor: colors.primary }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = colors.secondary}
                              onMouseLeave={(e) => e.target.style.backgroundColor = colors.primary}
                            >
                              {l.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Mobile Card View for Locations */}
                <div className="md:hidden">
                  {locations.length === 0 ? (
                    <div className="p-8 sm:p-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-3 sm:gap-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-lg border border-black flex items-center justify-center">
                          <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
                          </svg>
                        </div>
                        <div>
                          <p className="text-base sm:text-lg font-semibold text-gray-600">No locations configured</p>
                          <p className="text-xs sm:text-sm text-gray-400">Add your first attendance location to get started</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    locations.map((l) => (
                      <div key={l.id} className="p-3 sm:p-4 border-b border-gray-200 hover:bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="font-semibold text-gray-900 text-sm sm:text-base">{l.location_name}</div>
                          <span className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-medium border border-black ${
                            l.is_active ? 'bg-white text-gray-800' : 'bg-gray-200 text-gray-700'
                          }`}>
                            {l.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-xs sm:text-sm font-medium text-gray-900">Grace Time:</span>
                            <span className="text-xs sm:text-sm text-gray-600 font-medium">{l.grace_time} mins</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs sm:text-sm font-medium text-gray-900">OT Rule:</span>
                            <span className="text-xs sm:text-sm text-gray-600 font-medium">{l.ot_rule || 'None'}</span>
                          </div>
                        </div>
                        <div className="flex justify-end mt-3 pt-3 border-t border-gray-100">
                          <button
                            onClick={() => handleDeleteLocation(l.id)}
                            className="text-white font-medium transition-colors px-3 py-1 rounded text-xs sm:text-sm"
                            style={{ backgroundColor: colors.primary }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = colors.secondary}
                            onMouseLeave={(e) => e.target.style.backgroundColor = colors.primary}
                          >
                            {l.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Rule Modal */}
        {showRuleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg border border-black shadow-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Add Attendance Rule</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Rule Name</label>
                  <input
                    type="text"
                    value={ruleForm.rule_name}
                    onChange={(e) => setRuleForm({...ruleForm, rule_name: e.target.value})}
                    className="w-full border border-black rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                    placeholder="e.g., Late Entry Default"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Rule Type</label>
                  <select
                    value={ruleForm.rule_type}
                    onChange={(e) => setRuleForm({...ruleForm, rule_type: e.target.value})}
                    className="w-full border border-black rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                  >
                    <option value="Late">Late</option>
                    <option value="Early">Early</option>
                    <option value="OT">OT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Value (minutes)</label>
                  <input
                    type="number"
                    value={ruleForm.value}
                    onChange={(e) => setRuleForm({...ruleForm, value: parseInt(e.target.value)})}
                    className="w-full border border-black rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAddRule}
                  className="flex-1 text-white py-3 rounded-lg font-medium transition-colors"
                  style={{ backgroundColor: colors.primary }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = colors.secondary}
                  onMouseLeave={(e) => e.target.style.backgroundColor = colors.primary}
                >
                  Add Rule
                </button>
                <button
                  onClick={() => setShowRuleModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 border border-black py-3 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Location Modal */}
        {showLocationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg border border-black shadow-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Add Attendance Location</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Location Name</label>
                  <input
                    type="text"
                    value={locationForm.location_name}
                    onChange={(e) => setLocationForm({...locationForm, location_name: e.target.value})}
                    className="w-full border border-black rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                    placeholder="e.g., Main Office"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Grace Time (minutes)</label>
                  <input
                    type="number"
                    value={locationForm.grace_time}
                    onChange={(e) => setLocationForm({...locationForm, grace_time: parseInt(e.target.value)})}
                    className="w-full border border-black rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">OT Rule (optional)</label>
                  <input
                    type="text"
                    value={locationForm.ot_rule}
                    onChange={(e) => setLocationForm({...locationForm, ot_rule: e.target.value})}
                    className="w-full border border-black rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                    placeholder="e.g., OT > 30 mins"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAddLocation}
                  className="flex-1 text-white py-3 rounded-lg font-medium transition-colors"
                  style={{ backgroundColor: colors.primary }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = colors.secondary}
                  onMouseLeave={(e) => e.target.style.backgroundColor = colors.primary}
                >
                  Add Location
                </button>
                <button
                  onClick={() => setShowLocationModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 border border-black py-3 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        <Toast toast={toast} />
      </div>
    </Layout>
  );
}