import { useEffect, useState } from "react";
import { Plus, Search, Check, X, Eye, Filter, Calendar } from "lucide-react";
import api from "../../api";
import useToast from "../../utils/useToast";
import Toast from "../../components/Toast";
import { hasPermission, isAdmin } from "../../utils/permissions";

export default function LeaveApplications() {
  const { toast, showToast, hideToast } = useToast();
  const [colors, setColors] = useState({
    primary: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
    secondary: getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'
  });

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
  
  // Check if user has permission to view leave applications
  if (!hasPermission("view_leave_applications")) {
    return (
      <div >
        {/* Hero Header matching User Management */}
        <div className="rounded-2xl shadow-sm p-4 sm:p-6 relative overflow-hidden border" style={{
          background: `linear-gradient(to right, ${colors.primary}10, ${colors.secondary}10)`,
          borderColor: `${colors.primary}20`
        }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20" style={{
            backgroundColor: colors.primary,
            transform: 'translate(40%, -40%)'
          }}></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-3xl opacity-20" style={{
            backgroundColor: colors.secondary,
            transform: 'translate(-40%, 40%)'
          }}></div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mx-auto sm:mx-0" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Leave Applications & Approvals</h2>
                <p className="text-gray-600 text-sm sm:text-base">Review and manage employee leave requests</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Access Denied */}
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600">You do not have permission to view leave applications.</p>
          </div>
        </div>
      </div>
    );
  }
  const [applications, setApplications] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [leavePolicies, setLeavePolicies] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewingApplication, setReviewingApplication] = useState(null);
  const [reviewBalances, setReviewBalances] = useState([]);
  const [formData, setFormData] = useState({
    employee_id: "",
    leave_type_id: "",
    policy_id: "",
    from_date: "",
    to_date: "",
    reason: ""
  });

  // Auto-populate current user when employees are loaded (only for non-admin users)
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

  useEffect(() => {
    fetchColors();
    fetchApplications();
    fetchEmployees();
    fetchLeaveTypes();
    fetchLeavePolicies();
  }, []);

  const fetchLeaveBalances = async (employeeId) => {
    try {
      const res = await api.get(`/api/leave/applications/balances/${employeeId}`);
      setLeaveBalances(res.data);
      setSelectedEmployeeId(employeeId);
      setShowBalanceModal(true);
    } catch (error) {
      console.error("Error fetching leave balances:", error);
      showToast("Error fetching leave balances", "error");
    }
  };

  const initializeBalances = async (employeeId, policyId) => {
    try {
      const res = await api.post(`/api/leave/balances/initialize/${employeeId}/${policyId}`);
      showToast(res.data.message, "success");
      // Refresh the balances after initialization
      await fetchLeaveBalances(employeeId);
    } catch (error) {
      console.error("Error initializing balances:", error);
      showToast("Error initializing leave balances", "error");
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await api.get("/api/leave/applications/");
      setApplications(res.data);
    } catch (error) {
      console.error("Error fetching applications:", error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const tenant = localStorage.getItem("tenant_db");
      const token = localStorage.getItem("access_token");
      
      // Fetch from both onboarding and user management like EIS does
      const [onboardingRes, usersRes] = await Promise.all([
        api.get('/recruitment/onboarding/list').catch(() => ({ data: [] })),
        fetch(`${api.defaults.baseURL}/hospitals/users/${tenant}/list`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => res.ok ? res.json() : { users: [] }).catch(() => ({ users: [] }))
      ]);
      
      const onboardedEmployees = onboardingRes.data || [];
      const userEmployees = usersRes.users || [];
      
      // Process onboarded employees (filter out auto-generated codes)
      const validOnboardedEmployees = onboardedEmployees.filter(emp => {
        if (!emp.employee_id || emp.employee_id.trim() === '') return false;
        const isAutoGenerated = /^[A-Z]{3}\d{6}$/.test(emp.employee_id);
        return !isAutoGenerated;
      });
      
      const onboardedData = validOnboardedEmployees.map(emp => ({
        id: emp.application_id,
        name: emp.candidate_name,
        employee_code: emp.employee_id
      }));
      
      // Process user management employees (users with employee codes)
      const userEmployeeData = userEmployees
        .filter(user => user.employee_code)
        .map(user => ({
          id: user.id,
          name: user.name,
          employee_code: user.employee_code
        }));
      
      // Combine and remove duplicates (prefer user management data)
      const allEmployees = [...onboardedData];
      userEmployeeData.forEach(userEmp => {
        const existingIndex = allEmployees.findIndex(emp => emp.employee_code === userEmp.employee_code);
        if (existingIndex === -1) {
          allEmployees.push(userEmp);
        } else {
          allEmployees[existingIndex] = userEmp;
        }
      });
      
      console.log("Employees from directory:", allEmployees);
      setEmployees(allEmployees);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchLeaveTypes = async () => {
    if (!hasPermission("view_leave_types")) {
      setLeaveTypes([]);
      return;
    }
    try {
      const res = await api.get("/api/leave/types/");
      setLeaveTypes(res.data.filter(type => type.status === "Active"));
    } catch (error) {
      console.error("Error fetching leave types:", error);
      setLeaveTypes([]);
    }
  };

  const fetchLeavePolicies = async () => {
    try {
      const res = await api.get("/api/leave/applications/policies");
      setLeavePolicies(res.data);
    } catch (error) {
      console.error("Error fetching leave policies:", error);
    }
  };

  const getEmployeeInfo = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? {
      code: employee.employee_code || `EMP${employeeId}`,
      name: employee.name || `Employee ${employeeId}`
    } : {
      code: `EMP${employeeId}`,
      name: `Employee ${employeeId}`
    };
  };

  const getLeaveTypeName = (leaveTypeId) => {
    const leaveType = leaveTypes.find(type => type.id === leaveTypeId);
    return leaveType ? leaveType.name : `Leave Type #${leaveTypeId}`;
  };

  const openReviewModal = async (application) => {
    try {
      const res = await api.get(`/api/leave/applications/balances/${application.employee_id}`);
      setReviewBalances(res.data);
      setReviewingApplication(application);
      setShowReviewModal(true);
    } catch (error) {
      console.error("Error fetching balances for review:", error);
    }
  };

  const approve = async (id, comment = "Approved") => {
    try {
      await api.post(`/api/leave/applications/${id}/approve?approver_id=1`, {
        status: "Approved",
        approver_comment: comment
      });
      fetchApplications();
      setShowReviewModal(false);
    } catch (error) {
      console.error("Error approving application:", error);
    }
  };

  const reject = async (id, comment = "Rejected") => {
    try {
      await api.post(`/api/leave/applications/${id}/approve?approver_id=1`, {
        status: "Rejected",
        approver_comment: comment
      });
      fetchApplications();
      setShowReviewModal(false);
    } catch (error) {
      console.error("Error rejecting application:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Calculate total days
      const fromDate = new Date(formData.from_date);
      const toDate = new Date(formData.to_date);
      const timeDiff = toDate.getTime() - fromDate.getTime();
      const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
      
      const submitData = {
        leave_type_id: parseInt(formData.leave_type_id),
        from_date: formData.from_date,
        to_date: formData.to_date,
        total_days: totalDays,
        reason: formData.reason,
        ...(formData.policy_id && { policy_id: parseInt(formData.policy_id) })
      };
      
      await api.post(`/api/leave/applications/?employee_id=${formData.employee_id}`, submitData);
      fetchApplications();
      handleCloseModal();
      showToast("Leave application submitted successfully! Balance updated.", "success");
    } catch (error) {
      console.error("Error creating application:", error);
      let errorMessage = "Failed to submit leave application.";
      
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (detail.includes("Insufficient leave balance")) {
          errorMessage = `${detail}`;
        } else if (detail.includes("Exceeds annual limit")) {
          errorMessage = `${detail}`;
        } else {
          errorMessage = `${detail}`;
        }
      }
      
      showToast(errorMessage, "error");
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    const currentUserId = localStorage.getItem('user_id');
    setFormData({
      employee_id: currentUserId || "",
      leave_type_id: "",
      policy_id: "",
      from_date: "",
      to_date: "",
      reason: ""
    });
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.employee_id?.toString().includes(searchTerm) ||
                         app.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved": return "bg-green-100 text-green-800";
      case "Rejected": return "bg-red-100 text-red-800";
      case "Pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-primary";
    }
  };

  return (
    <div >
      {/* Header */}
      <div className="p-4 sm:p-8 border-b-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mx-auto sm:mx-0" style={{
              backgroundColor: `${colors.primary}20`
            }}>
              <svg className="w-4 h-4 sm:w-5 sm:h-5" style={{
                color: colors.primary
              }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">Leave Applications & Approvals</h2>
              <p className="text-gray-600 text-sm sm:text-base">Review and manage employee leave requests</p>
            </div>
          </div>
          <div className="flex justify-center sm:justify-end gap-3 relative">
            <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full blur-3xl opacity-30" style={{
              backgroundColor: colors.primary
            }}></div>
            {hasPermission("apply_leave") && (
              <button 
                onClick={() => {
                  const currentUserId = localStorage.getItem('user_id');
                  setFormData({
                    employee_id: currentUserId || "",
                    leave_type_id: "",
                    policy_id: "",
                    from_date: "",
                    to_date: "",
                    reason: ""
                  });
                  setShowModal(true);
                }}
                style={{ backgroundColor: 'var(--primary-color, #4575b5)' }}
                className="text-white px-4 sm:px-6 py-2 sm:py-3 rounded-2xl flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm sm:text-base relative z-20"
                onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--secondary-color, #474e71)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary-color, #4575b5)'}
              >
                <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
                New Application
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      {hasPermission("view_leave_applications") && (
        <div className="bg-white rounded-xl shadow-sm relative overflow-hidden border" style={{
          background: `linear-gradient(135deg, white 0%, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}05 100%)`,
          borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
        }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
            transform: 'translate(40%, -40%)'
          }}></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
            transform: 'translate(-40%, 40%)'
          }}></div>
          <div className="p-4 sm:p-8 relative z-10">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-full sm:max-w-md">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text"
                  placeholder="Search applications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 sm:pl-12 pr-4 py-2 sm:py-3 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full hover:bg-white transition-colors text-sm sm:text-base border"
                  style={{
                    backgroundColor: `${colors.primary}10`,
                    borderColor: `${colors.primary}20`
                  }}
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 sm:pl-12 pr-8 py-2 sm:py-3 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:bg-white transition-colors text-sm sm:text-base w-full sm:w-auto border"
                  style={{
                    backgroundColor: `${colors.primary}10`,
                    borderColor: `${colors.primary}20`
                  }}
                >
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {hasPermission("view_leave_applications") && (
        <div className="rounded-2xl shadow-sm overflow-hidden relative border" style={{
          background: `linear-gradient(135deg, white 0%, ${colors.primary}05 100%)`,
          borderColor: `${colors.primary}20`
        }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{
            backgroundColor: colors.primary,
            transform: 'translate(40%, -40%)'
          }}></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{
            backgroundColor: colors.primary,
            transform: 'translate(-40%, 40%)'
          }}></div>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <div className="min-w-[800px]">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Employee</th>
                    <th className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Leave Details</th>
                    <th className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Duration</th>
                    <th className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Reason</th>
                    <th className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    {(hasPermission("view_leave_balance") || hasPermission("view_self") || hasPermission("approve_leave")) && (
                      <th className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredApplications.length === 0 ? (
                    <tr>
                      <td colSpan={hasPermission("view_leave_balance") || hasPermission("view_self") || hasPermission("approve_leave") ? "6" : "5"} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center space-y-3">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                            <Calendar className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-lg font-medium text-gray-900">
                            {searchTerm || statusFilter !== "All" ? "No applications found matching your criteria." : "No leave applications yet."}
                          </p>
                          <p className="text-sm text-gray-500">Submit your first leave application to get started</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredApplications.map((app, index) => (
                      <tr key={app.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-xs sm:text-sm font-semibold text-gray-900">{getEmployeeInfo(app.employee_id).code}</div>
                          <div className="text-xs sm:text-sm text-gray-600">{getEmployeeInfo(app.employee_id).name}</div>
                          <div className="text-xs text-gray-500">Applied: {new Date(app.applied_at).toLocaleDateString()}</div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-xs sm:text-sm text-gray-900">{getLeaveTypeName(app.leave_type_id)}</div>
                          <div className="flex items-center text-xs sm:text-sm text-gray-500">
                            <Calendar size={12} className="mr-1 sm:w-[14px] sm:h-[14px]" />
                            {app.from_date} to {app.to_date}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            {app.total_days} days
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4">
                          <div className="text-xs sm:text-sm text-gray-900 max-w-xs truncate">
                            {app.reason || "No reason provided"}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(app.status)}`}>
                            {app.status}
                          </span>
                          {app.approver_comment && (
                            <div className="text-xs text-gray-500 mt-1">{app.approver_comment}</div>
                          )}
                        </td>
                        {(hasPermission("view_leave_balance") || hasPermission("view_self") || hasPermission("approve_leave")) && (
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                            <div className="flex items-center gap-2">
                              {(hasPermission("view_leave_balance") || hasPermission("view_self")) && (
                                <button 
                                  onClick={() => fetchLeaveBalances(app.employee_id)}
                                  className="text-blue-600 hover:text-blue-900 p-2 rounded-lg transition-colors"
                                  title="View Leave Balances"
                                >
                                  <Eye size={14} />
                                </button>
                              )}
                              {app.status === "Pending" && hasPermission("approve_leave") && (
                                <>
                                  <button 
                                    onClick={() => openReviewModal(app)}
                                    className="text-green-600 hover:text-green-900 p-2 rounded-lg transition-colors"
                                    title="Review & Approve"
                                  >
                                    <Check size={14} />
                                  </button>
                                  <button 
                                    onClick={() => reject(app.id, "Rejected")}
                                    className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                    title="Reject"
                                  >
                                    <X size={14} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden">
            {filteredApplications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-medium text-gray-900">
                    {searchTerm || statusFilter !== "All" ? "No applications found matching your criteria." : "No leave applications yet."}
                  </p>
                  <p className="text-sm text-gray-500">Submit your first leave application to get started</p>
                </div>
              </div>
            ) : (
              filteredApplications.map((app, index) => (
                <div key={app.id} className="p-4 border-b-0 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{getEmployeeInfo(app.employee_id).code}</div>
                      <div className="text-sm text-gray-600">{getEmployeeInfo(app.employee_id).name}</div>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(app.status)}`}>
                      {app.status}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-900">Leave Type:</span>
                      <span className="text-sm text-gray-600">{getLeaveTypeName(app.leave_type_id)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-900">Duration:</span>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">{app.from_date} to {app.to_date}</div>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                          {app.total_days} days
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-900">Applied:</span>
                      <span className="text-sm text-gray-600">{new Date(app.applied_at).toLocaleDateString()}</span>
                    </div>
                    {app.reason && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-900">Reason:</span>
                        <span className="text-sm text-gray-600 text-right max-w-xs truncate">{app.reason}</span>
                      </div>
                    )}
                    {app.approver_comment && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-900">Comment:</span>
                        <span className="text-sm text-gray-600 text-right max-w-xs truncate">{app.approver_comment}</span>
                      </div>
                    )}
                  </div>
                  {(hasPermission("view_leave_balance") || hasPermission("view_self") || hasPermission("approve_leave")) && (
                    <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                      {(hasPermission("view_leave_balance") || hasPermission("view_self")) && (
                        <button 
                          onClick={() => fetchLeaveBalances(app.employee_id)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-900 px-3 py-1 rounded-lg transition-colors text-sm"
                        >
                          <Eye size={14} />
                          Balance
                        </button>
                      )}
                      {app.status === "Pending" && hasPermission("approve_leave") && (
                        <>
                          <button 
                            onClick={() => openReviewModal(app)}
                            className="flex items-center gap-1 text-green-600 hover:text-green-900 px-3 py-1 rounded-lg transition-colors text-sm"
                          >
                            <Check size={14} />
                            Review
                          </button>
                          <button 
                            onClick={() => reject(app.id, "Rejected")}
                            className="flex items-center gap-1 text-red-600 hover:text-red-900 px-3 py-1 rounded-lg hover:bg-red-50 transition-colors text-sm"
                          >
                            <X size={14} />
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Stats Footer */}
      {(hasPermission("view_leave_applications") || hasPermission("view_self")) && (
        <div className="px-4 sm:px-8 py-4 sm:py-6 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs sm:text-sm text-gray-600">
            <span className="font-medium text-center sm:text-left">Total: {applications.length} applications</span>
            <div className="flex flex-wrap justify-center sm:justify-end gap-2 sm:gap-4">
              <span className="font-medium">Pending: {applications.filter(a => a.status === "Pending").length}</span>
              <span className="font-medium">Approved: {applications.filter(a => a.status === "Approved").length}</span>
              <span className="font-medium">Rejected: {applications.filter(a => a.status === "Rejected").length}</span>
            </div>
          </div>
        </div>
      )}

      {/* New Application Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border" style={{
            borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
          }}>
            <h3 className="text-lg font-semibold mb-4">New Leave Application</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Employee</label>
                {isAdmin() ? (
                  <select 
                    value={formData.employee_id}
                    onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                    className="w-full border-0 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    style={{
                      backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                      border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                    }}
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.employee_code || `EMP${emp.id}`} - {emp.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full border-0 rounded-lg px-3 py-2 bg-gray-50 text-gray-700" style={{
                    border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                  }}>
                    {(() => {
                      const currentUserId = localStorage.getItem('user_id');
                      const currentUserEmployee = employees.find(emp => emp.id == currentUserId);
                      return currentUserEmployee ? 
                        `${currentUserEmployee.employee_code || `EMP${currentUserEmployee.id}`} - ${currentUserEmployee.name}` : 
                        'Loading...';
                    })()}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Leave Policy</label>
                <select 
                  value={formData.policy_id}
                  onChange={(e) => setFormData({...formData, policy_id: e.target.value})}
                  className="w-full border-0 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  style={{
                    backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                    border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                  }}
                  required
                >
                  <option value="">Select Leave Policy</option>
                  {leavePolicies.map(policy => (
                    <option key={policy.id} value={policy.id}>
                      {policy.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Leave Type</label>
                <select 
                  value={formData.leave_type_id}
                  onChange={(e) => setFormData({...formData, leave_type_id: e.target.value})}
                  className="w-full border-0 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  style={{
                    backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                    border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                  }}
                  required
                >
                  <option value="">Select Leave Type</option>
                  {leaveTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name} ({type.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">From Date</label>
                  <input 
                    type="date"
                    value={formData.from_date}
                    onChange={(e) => setFormData({...formData, from_date: e.target.value})}
                    className="w-full border-0 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    style={{
                      backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                      border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                    }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">To Date</label>
                  <input 
                    type="date"
                    value={formData.to_date}
                    onChange={(e) => setFormData({...formData, to_date: e.target.value})}
                    className="w-full border-0 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    style={{
                      backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                      border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                    }}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Reason</label>
                <textarea 
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  className="w-full border-0 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  style={{
                    backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                    border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                  }}
                  rows="3"
                  placeholder="Enter reason for leave..."
                  required
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-3 py-2 border-0 rounded-lg text-secondary hover:bg-gray-50 text-sm"
                  style={{
                    border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (formData.employee_id && formData.policy_id) {
                      initializeBalances(formData.employee_id, formData.policy_id);
                      showToast('Initializing leave balances...', 'success');
                    } else {
                      showToast('Please select both employee and leave policy first', 'error');
                    }
                  }}
                  className="px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
                >
                  Initialize
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: 'var(--primary-color, #4575b5)' }}
                  className="px-3 py-2 text-white rounded-lg transition-colors text-sm"
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--primary-hover, #1e4bb8)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary-color, #2862e9)'}
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave Balance Modal */}
      {showBalanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto" style={{
          borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
        }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Leave Balances</h3>
              <button 
                onClick={() => setShowBalanceModal(false)}
                className=" hover:text-secondary" style={{color: 'var(--text-muted, #6b7280)'}}
              >
                <X size={20} />
              </button>
            </div>
            
            {leaveBalances.length === 0 ? (
              <div className="text-center py-8">
                <p className=" mb-4" style={{color: 'var(--text-muted, #6b7280)'}}>No leave balances found for this employee.</p>
                <button 
                  onClick={() => initializeBalances(selectedEmployeeId, "undefined")}
                  className="text-white hover:text-white text-white px-4 py-2 rounded-lg"
                  style={{ backgroundColor: 'var(--primary-color, #4575b5)' }}
                  onMouseEnter={(e) => { e.target.style.backgroundColor = 'var(--secondary-color, #6b7280)'; }}
                  onMouseLeave={(e) => { e.target.style.backgroundColor = 'var(--primary-color, #4575b5)'; }}
                >
                  Initialize Leave Balances
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {leaveBalances.map((balance) => (
                  <div key={balance.leave_type_id} className=" rounded-lg p-4" style={{borderColor: 'var(--border-color, #e2e8f0)'}}>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-primary">
                        {balance.leave_type_name} ({balance.leave_type_code})
                      </h4>
                      <span className={`px-2 py-1 rounded text-sm ${
                        balance.is_overused ? 'bg-red-100 text-red-800' :
                        balance.balance > 5 ? 'bg-green-100 text-green-800' :
                        balance.balance > 0 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {balance.is_overused ? `Overused by ${balance.overused_days} days` : `${balance.balance} days left`}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span  style={{color: 'var(--text-muted, #6b7280)'}}>Allocated:</span>
                        <div className="font-medium">{balance.total_allocated} days</div>
                      </div>
                      <div>
                        <span  style={{color: 'var(--text-muted, #6b7280)'}}>Used:</span>
                        <div className="font-medium">{balance.used} days</div>
                      </div>
                      <div>
                        <span  style={{color: 'var(--text-muted, #6b7280)'}}>Balance:</span>
                        <div className="font-medium">{balance.balance} days</div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            balance.is_overused ? 'bg-red-500' : 'bg-blue-600'
                          }`}
                          style={{ width: `${Math.min((balance.used / balance.total_allocated) * 100, 100)}%` }}
                        ></div>
                        {balance.is_overused && (
                          <div className="text-xs text-red-600 mt-1">
                            ⚠️ Exceeded limit by {balance.overused_days} days
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="mt-4 pt-4 border-t">
                  <button 
                    onClick={() => initializeBalances(selectedEmployeeId, "undefined")}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-secondary px-4 py-2 rounded-lg text-sm"
                  >
                    Refresh Balances
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && reviewingApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg border p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{
          borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
        }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Review Leave Application</h3>
              <button 
                onClick={() => setShowReviewModal(false)}
                className=" hover:text-secondary" style={{color: 'var(--text-muted, #6b7280)'}}
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Application Details */}
            <div className="bg-content rounded-lg p-4 mb-4">
              <h4 className="font-medium mb-2">Application Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span  style={{color: 'var(--text-muted, #6b7280)'}}>Employee:</span>
                  <div className="font-medium">{getEmployeeInfo(reviewingApplication.employee_id).name}</div>
                  <div  style={{color: 'var(--text-secondary, #374151)'}}>{getEmployeeInfo(reviewingApplication.employee_id).code}</div>
                </div>
                <div>
                  <span  style={{color: 'var(--text-muted, #6b7280)'}}>Leave Type:</span>
                  <div className="font-medium">{getLeaveTypeName(reviewingApplication.leave_type_id)}</div>
                </div>
                <div>
                  <span  style={{color: 'var(--text-muted, #6b7280)'}}>Duration:</span>
                  <div className="font-medium">{reviewingApplication.from_date} to {reviewingApplication.to_date}</div>
                  <div className="text-blue-600">{reviewingApplication.total_days} days</div>
                </div>
                <div>
                  <span  style={{color: 'var(--text-muted, #6b7280)'}}>Applied:</span>
                  <div className="font-medium">{new Date(reviewingApplication.applied_at).toLocaleDateString()}</div>
                </div>
              </div>
              {reviewingApplication.reason && (
                <div className="mt-3">
                  <span  style={{color: 'var(--text-muted, #6b7280)'}}>Reason:</span>
                  <div className="font-medium">{reviewingApplication.reason}</div>
                </div>
              )}
            </div>

            {/* Leave Balances */}
            <div className="mb-4">
              <h4 className="font-medium mb-2">Current Leave Balances</h4>
              <div className="space-y-3">
                {reviewBalances.map((balance) => (
                  <div key={balance.leave_type_id} className=" rounded-lg p-3" style={{borderColor: 'var(--border-color, #e2e8f0)'}}>
                    <div className="flex justify-between items-center mb-2">
                      <h5 className="font-medium text-primary">
                        {balance.leave_type_name} ({balance.leave_type_code})
                      </h5>
                      <span className={`px-2 py-1 rounded text-sm ${
                        balance.is_overused ? 'bg-red-100 text-red-800' :
                        balance.balance > 5 ? 'bg-green-100 text-green-800' :
                        balance.balance > 0 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {balance.is_overused ? `Overused by ${balance.overused_days} days` : `${balance.balance} days left`}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span  style={{color: 'var(--text-muted, #6b7280)'}}>Allocated:</span>
                        <div className="font-medium">{balance.total_allocated} days</div>
                      </div>
                      <div>
                        <span  style={{color: 'var(--text-muted, #6b7280)'}}>Used:</span>
                        <div className="font-medium">{balance.used} days</div>
                      </div>
                      <div>
                        <span  style={{color: 'var(--text-muted, #6b7280)'}}>Balance:</span>
                        <div className="font-medium">{balance.balance} days</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4 border-t">
              <button
                onClick={() => setShowReviewModal(false)}
                className="flex-1 px-4 py-2 border-0 rounded-lg text-secondary hover:bg-content"
                style={{
                  border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => reject(reviewingApplication.id, "Rejected after review")}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
              >
                <X size={16} />
                Reject
              </button>
              <button
                onClick={() => approve(reviewingApplication.id, "Approved after review")}
                style={{ backgroundColor: 'var(--primary-color, #4575b5)' }}
                className="flex-1 px-4 py-2 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--primary-hover, #1e4bb8)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary-color, #2862e9)'}
              >
                <Check size={16} />
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
      <Toast toast={toast} />
    </div>
  );
}