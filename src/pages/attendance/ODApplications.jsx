import { useEffect, useState } from "react";
import { FiPlus, FiCalendar, FiClock, FiMapPin, FiCheckCircle, FiXCircle, FiFileText } from 'react-icons/fi';
import api from "../../api";
import Layout from "../../components/Layout";
import useToast from "../../utils/useToast";
import Toast from "../../components/Toast";
import { hasPermission, isAdmin } from '../../utils/permissions';

export default function ODApplications() {
  const [applications, setApplications] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const [colors, setColors] = useState({ primary: '#2862e9', secondary: '#474e71' });
  
  // Permission checks
  const canViewOdApplications = isAdmin() || hasPermission('view_od_applications');
  const canApplyOd = isAdmin() || hasPermission('apply_od');
  const canApproveOd = isAdmin() || hasPermission('approve_od');
  const canRejectOd = isAdmin() || hasPermission('reject_od');
  
  if (!canViewOdApplications) {
    return (
      <Layout>
        <div className="p-6 text-center">
          <div className="bg-white rounded-2xl border-0 p-8 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600">You do not have permission to view OD applications.</p>
          </div>
        </div>
      </Layout>
    );
  }
  const [formData, setFormData] = useState({
    employee_id: "",
    od_date: "",
    purpose: "",
    from_time: "09:00",
    to_time: "18:00",
    location: ""
  });
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [currentUserInfo, setCurrentUserInfo] = useState(null);

  useEffect(() => {
    fetchColors();
    fetchCurrentUserInfo();
    fetchApplications();
    fetchEmployees();
  }, []);

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

  const fetchCurrentUserInfo = async () => {
    try {
      const response = await api.get('/api/attendance/od-applications/current-user');
      setCurrentUserInfo(response.data);
    } catch (error) {
      console.error('Error fetching current user info:', error);
    }
  };

  // Auto-populate current user for non-admin users
  useEffect(() => {
    if (employees.length > 0 && !isAdmin()) {
      const currentUserId = localStorage.getItem('user_id');
      if (currentUserId && !formData.employee_id) {
        const currentUserEmployee = employees.find(emp => emp.id == currentUserId);
        if (currentUserEmployee) {
          setFormData(prev => ({ ...prev, employee_id: currentUserId }));
        }
      }
    }
  }, [employees]);

  const fetchApplications = async () => {
    try {
      const res = await api.get("/api/attendance/od/");
      setApplications(res.data || []);
    } catch (error) {
      console.error("Error fetching OD applications:", error);
    }
  };

  const fetchEmployees = async () => {
    try {
      setEmployeesLoading(true);
      const tenant = localStorage.getItem("tenant_db");
      const token = localStorage.getItem("access_token");
      
      const response = await api.get(`/hospitals/users/${tenant}/list`);
      
      if (response.data) {
        const data = response.data;
        setEmployees(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      showToast('Failed to load employees', 'error');
    } finally {
      setEmployeesLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await api.post("/api/attendance/od/", {
        ...formData,
        employee_id: parseInt(formData.employee_id)
      });
      
      setShowModal(false);
      setFormData({
        employee_id: "",
        od_date: "",
        purpose: "",
        from_time: "09:00",
        to_time: "18:00",
        location: ""
      });
      fetchApplications();
      showToast("OD application submitted successfully!");
    } catch (error) {
      console.error("Error submitting OD application:", error);
      showToast("Failed to submit OD application. Please try again.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/api/attendance/od/${id}/approve`);
      fetchApplications();
      showToast("OD application approved!");
    } catch (error) {
      console.error("Error approving OD application:", error);
      showToast("Failed to approve OD application.", 'error');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/api/attendance/od/${id}/reject`);
      fetchApplications();
      showToast("OD application rejected!");
    } catch (error) {
      console.error("Error rejecting OD application:", error);
      showToast("Failed to reject OD application.", 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-gray-100 text-gray-800';
      case 'rejected': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Key Performance Indicators matching Dashboard */}
        <div className="rounded-xl shadow-sm overflow-hidden relative border" style={{
          background: `linear-gradient(135deg, white 0%, ${colors.primary}05 100%)`,
          borderColor: `${colors.primary}20`
        }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20" style={{
            backgroundColor: colors.primary,
            transform: 'translate(30%, -30%)'
          }}></div>
          {/* Header */}
          <div className="p-5 border-b-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <FiFileText className="h-5 w-5" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">OD Applications Overview</h2>
                <p className="text-sm text-gray-600">Manage On Duty applications for employees</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden border" style={{
            background: `linear-gradient(135deg, white 0%, ${colors.primary}03 100%)`,
            borderColor: `${colors.primary}20`
          }}>
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl opacity-10" style={{
              backgroundColor: colors.primary,
              transform: 'translate(25%, -25%)'
            }}></div>
            <div className="flex items-center justify-between relative z-10">
              <div className="min-w-0 flex-1">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
                <p className="text-gray-400 text-xs mt-1">All requests</p>
              </div>
              <div className="p-3 rounded-lg" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <FiFileText className="h-6 w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
            </div>
          </div>

          <div className="rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden border" style={{
            background: `linear-gradient(135deg, white 0%, ${colors.primary}03 100%)`,
            borderColor: `${colors.primary}20`
          }}>
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl opacity-10" style={{
              backgroundColor: colors.primary,
              transform: 'translate(25%, -25%)'
            }}></div>
            <div className="flex items-center justify-between relative z-10">
              <div className="min-w-0 flex-1">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{applications.filter(app => app.status === 'pending').length}</p>
                <p className="text-gray-400 text-xs mt-1">Awaiting approval</p>
              </div>
              <div className="p-3 rounded-lg" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <FiClock className="h-6 w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
            </div>
          </div>

          <div className="rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden border" style={{
            background: `linear-gradient(135deg, white 0%, ${colors.primary}03 100%)`,
            borderColor: `${colors.primary}20`
          }}>
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl opacity-10" style={{
              backgroundColor: colors.primary,
              transform: 'translate(25%, -25%)'
            }}></div>
            <div className="flex items-center justify-between relative z-10">
              <div className="min-w-0 flex-1">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{applications.filter(app => app.status === 'approved').length}</p>
                <p className="text-gray-400 text-xs mt-1">Accepted requests</p>
              </div>
              <div className="p-3 rounded-lg" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <FiCheckCircle className="h-6 w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
            </div>
          </div>

          <div className="rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden border" style={{
            background: `linear-gradient(135deg, white 0%, ${colors.primary}03 100%)`,
            borderColor: `${colors.primary}20`
          }}>
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl opacity-10" style={{
              backgroundColor: colors.primary,
              transform: 'translate(25%, -25%)'
            }}></div>
            <div className="flex items-center justify-between relative z-10">
              <div className="min-w-0 flex-1">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">{applications.filter(app => app.status === 'rejected').length}</p>
                <p className="text-gray-400 text-xs mt-1">Declined requests</p>
              </div>
              <div className="p-3 rounded-lg" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <FiXCircle className="h-6 w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
            </div>
          </div>
            </div>
          </div>
        </div>

        {/* Applications Management */}
        <div className="rounded-xl shadow-sm relative overflow-hidden border" style={{
          background: `linear-gradient(135deg, white 0%, ${colors.primary}05 100%)`,
          borderColor: `${colors.primary}20`
        }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20" style={{
            backgroundColor: colors.primary,
            transform: 'translate(30%, -30%)'
          }}></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full blur-2xl opacity-15" style={{
            backgroundColor: colors.secondary,
            transform: 'translate(-30%, 30%)'
          }}></div>
          <div className="p-5 border-b-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{
                  backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
                }}>
                  <FiFileText className="h-5 w-5" style={{
                    color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                  }} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">OD Applications</h3>
              </div>
              {canApplyOd && (
                <button 
                  onClick={() => setShowModal(true)}
                  className="text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium"
                  style={{
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                  }}
                  onMouseEnter={(e) => {
                    const hoverColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                    e.currentTarget.style.backgroundColor = hoverColor;
                  }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5';
                  }}
                >
                  <FiPlus className="w-4 h-4" />
                  Apply OD
                </button>
              )}
            </div>
          </div>
          <div className="p-5">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Purpose</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {applications.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{
                          backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10`
                        }}>
                          <FiCalendar className="h-8 w-8" style={{
                            color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                          }} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No OD applications</h3>
                        <p className="text-gray-600">Start by applying for an OD.</p>
                      </td>
                    </tr>
                  ) : (
                    applications.map((app) => {
                      const employee = employees.find(emp => emp.id === app.employee_id);
                      return (
                        <tr key={app.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {employee?.name || `Employee ${app.employee_id}`}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {app.employee_id}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-900">
                              <FiCalendar className="mr-2 h-4 w-4 text-gray-400" />
                              {new Date(app.od_date).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-900">
                              <FiClock className="mr-2 h-4 w-4 text-gray-400" />
                              {app.from_time} - {app.to_time}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">
                              {app.purpose}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-900">
                              <FiMapPin className="mr-2 h-4 w-4 text-gray-400" />
                              {app.location || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                              {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {app.status === 'pending' && (canApproveOd || canRejectOd) && (
                              <div className="flex items-center gap-2">
                                {canApproveOd && (
                                  <button 
                                    onClick={() => handleApprove(app.id)}
                                    className="text-white px-2 py-1 rounded text-xs transition-colors"
                                    style={{
                                      backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                                    }}
                                    onMouseEnter={(e) => {
                                      const hoverColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                                      e.currentTarget.style.backgroundColor = hoverColor;
                                    }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5';
                                    }}
                                    title="Approve"
                                  >
                                    Approve
                                  </button>
                                )}
                                {canRejectOd && (
                                  <button 
                                    onClick={() => handleReject(app.id)}
                                    className="bg-white hover:bg-gray-100 text-gray-700 border-0 px-2 py-1 rounded text-xs"
                                    title="Reject"
                                  >
                                    Reject
                                  </button>
                                )}
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

            {/* Mobile Card View */}
            <div className="md:hidden">
              {applications.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{
                    backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10`
                  }}>
                    <FiCalendar className="h-8 w-8" style={{
                      color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                    }} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No OD applications</h3>
                  <p className="text-gray-600">Start by applying for an OD.</p>
                </div>
              ) : (
                applications.map((app) => {
                  const employee = employees.find(emp => emp.id === app.employee_id);
                  return (
                    <div key={app.id} className="p-4 border-b-0 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-medium text-gray-900">
                          {employee?.name || `Employee ${app.employee_id}`}
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-900">Date:</span>
                          <span className="text-sm text-gray-600">{new Date(app.od_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-900">Time:</span>
                          <span className="text-sm text-gray-600">{app.from_time} - {app.to_time}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-900">Purpose:</span>
                          <span className="text-sm text-gray-600 text-right max-w-xs truncate">{app.purpose}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-900">Location:</span>
                          <span className="text-sm text-gray-600">{app.location || 'N/A'}</span>
                        </div>
                      </div>
                      {app.status === 'pending' && (canApproveOd || canRejectOd) && (
                        <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                          {canApproveOd && (
                            <button 
                              onClick={() => handleApprove(app.id)}
                              className="flex items-center gap-1 px-3 py-1 text-sm text-white rounded transition-colors"
                              style={{
                                backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                              }}
                              onMouseEnter={(e) => {
                                const hoverColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                                e.currentTarget.style.backgroundColor = hoverColor;
                              }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5';
                              }}
                            >
                              Approve
                            </button>
                          )}
                          {canRejectOd && (
                            <button 
                              onClick={() => handleReject(app.id)}
                              className="flex items-center gap-1 px-3 py-1 text-sm bg-white hover:bg-gray-100 text-gray-700 border-0 rounded"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      {/* Apply OD Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border" style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            borderColor: `${colors.primary}20`
          }}>
            <h3 className="text-lg font-semibold mb-4">Apply for OD</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Employee</label>
                {isAdmin() ? (
                  <select
                    value={formData.employee_id}
                    onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                    className="w-full rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent text-sm border"
                    style={{
                      backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                      border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                    }}
                    required
                    disabled={employeesLoading}
                  >
                    <option value="">{employeesLoading ? 'Loading employees...' : 'Select Employee'}</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full rounded-lg px-3 py-2 bg-gray-50 text-gray-700 text-sm border" style={{
                    border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                  }}>
                    {employeesLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        Loading...
                      </div>
                    ) : (() => {
                      const currentUserId = localStorage.getItem('user_id');
                      const currentUserEmployee = employees.find(emp => emp.id == currentUserId);
                      
                      if (currentUserEmployee) {
                        return currentUserEmployee.name;
                      } else if (currentUserInfo) {
                        return `${currentUserInfo.employee_code} - ${currentUserInfo.name}`;
                      } else {
                        return 'Current User';
                      }
                    })()}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">OD Date</label>
                <input
                  type="date"
                  value={formData.od_date}
                  onChange={(e) => setFormData({...formData, od_date: e.target.value})}
                  className="w-full rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent text-sm border"
                  style={{
                    backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                    border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                  }}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">From Time</label>
                  <input
                    type="time"
                    value={formData.from_time}
                    onChange={(e) => setFormData({...formData, from_time: e.target.value})}
                    className="w-full rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent text-sm border"
                    style={{
                      backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                      border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">To Time</label>
                  <input
                    type="time"
                    value={formData.to_time}
                    onChange={(e) => setFormData({...formData, to_time: e.target.value})}
                    className="w-full rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent text-sm border"
                    style={{
                      backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                      border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                    }}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Purpose</label>
                <textarea
                  value={formData.purpose}
                  onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                  className="w-full rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent text-sm border"
                  style={{
                    backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                    border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                  }}
                  rows="3"
                  placeholder="Reason for OD..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent text-sm border"
                  style={{
                    backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                    border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                  }}
                  placeholder="OD location (optional)"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-black rounded-lg text-black hover:bg-gray-100 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 text-white rounded-lg text-sm transition-colors"
                  style={{ backgroundColor: loading ? '#9ca3af' : colors.primary }}
                  onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = colors.secondary)}
                  onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = colors.primary)}
                >
                  {loading ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
      <Toast toast={toast} hideToast={hideToast} />
    </Layout>
  );
}

