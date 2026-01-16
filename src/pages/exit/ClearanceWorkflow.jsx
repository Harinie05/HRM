import { useEffect, useState } from "react";
import { CheckCircle, Clock, User, AlertCircle } from "lucide-react";
import api from "../../api";
import useToast from "../../utils/useToast";
import Toast from "../../components/Toast";
import { hasPermission, isAdmin } from "../../utils/permissions";

export default function ClearanceWorkflow() {
  const { toast, showToast, hideToast } = useToast();
  
  // Permission checks
  const canView = isAdmin() || hasPermission('view_resignations');
  const canManageHR = isAdmin() || hasPermission('hr_clearance');
  const canManageIT = isAdmin() || hasPermission('it_clearance');
  const canManageFinance = isAdmin() || hasPermission('finance_clearance');
  const canManageAdmin = isAdmin() || hasPermission('admin_clearance');
  const canConductInterview = isAdmin() || hasPermission('conduct_exit_interview');
  
  // Fetch branding colors
  useEffect(() => {
    const fetchBrandingColors = async () => {
      try {
        const tenantCode = localStorage.getItem('tenant_code');
        if (tenantCode) {
          const response = await api.get(`/auth/branding/${tenantCode}`);
          document.documentElement.style.setProperty('--primary-color', response.data.primary_color || '#2862e9');
          document.documentElement.style.setProperty('--secondary-color', response.data.secondary_color || '#474e71');
        }
      } catch (error) {
        console.error('Error fetching branding colors:', error);
      }
    };
    fetchBrandingColors();
  }, []);
  
  if (!canView) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You do not have permission to view exit clearances.</p>
        </div>
      </div>
    );
  }
  const [exits, setExits] = useState([]);
  const [selectedExit, setSelectedExit] = useState(null);
  const [clearances, setClearances] = useState([]);
  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const [departmentClearances, setDepartmentClearances] = useState({});
  const [interviewForm, setInterviewForm] = useState({
    rating: "",
    feedback: "",
    suggestions: ""
  });

  // Load exits
  useEffect(() => {
    async function fetchExits() {
      try {
        const res = await api.get("/api/resignation/list");
        // Filter for resignations that are not in 'Initiated' status (approved/in-progress)
        const approvedResignations = res.data.resignations?.filter(resignation => {
          const handover = resignation.handover_status || 'Pending';
          const clearance = resignation.clearance_status || 'Pending';
          const assets = resignation.asset_return_status || 'Pending';
          const settlement = resignation.final_settlement_status || 'Pending';
          
          // Show resignations that have at least one process started
          return handover !== 'Pending' || clearance !== 'Pending' || assets !== 'Pending' || settlement !== 'Pending';
        }) || [];
        
        setExits(approvedResignations);
      } catch (err) {
        console.log("Error loading exits", err);
        setExits([]);
      }
    }
    fetchExits();
  }, []);

  // Load clearances for selected exit
  useEffect(() => {
    if (selectedExit) {
      async function fetchClearances() {
        try {
          const res = await api.get(`/api/exit/clearance/${selectedExit.id}`);
          setClearances(res.data);
          
          // If no clearances exist, create them
          if (res.data.length === 0) {
            await api.post(`/api/exit/clearance/${selectedExit.id}/create`);
            const newRes = await api.get(`/api/exit/clearance/${selectedExit.id}`);
            setClearances(newRes.data);
          }
        } catch (err) {
          console.log("Error loading clearances", err);
          setClearances([]);
        }
      }
      fetchClearances();
    }
  }, [selectedExit]);

  async function handleApproveClearance(clearanceId) {
    try {
      await api.put(`/api/exit/clearance/${clearanceId}/approve`);
      showToast("Clearance approved successfully", "success");
      
      // Refresh clearances
      const res = await api.get(`/api/exit/clearance/${selectedExit.id}`);
      setClearances(res.data);
    } catch (err) {
      showToast("Failed to approve clearance", "error");
    }
  }

  async function handleExitInterview(e) {
    e.preventDefault();
    try {
      await api.put(`/api/resignation/interview/${selectedExit.id}`, interviewForm);
      showToast("Exit interview completed successfully", "success");
      setShowInterviewForm(false);
      setInterviewForm({ rating: "", feedback: "", suggestions: "" });
      
      // Refresh exits
      const res = await api.get("/api/resignation/list");
      const approvedResignations = res.data.resignations?.filter(resignation => {
        const handover = resignation.handover_status || 'Pending';
        const clearance = resignation.clearance_status || 'Pending';
        const assets = resignation.asset_return_status || 'Pending';
        const settlement = resignation.final_settlement_status || 'Pending';
        
        return handover !== 'Pending' || clearance !== 'Pending' || assets !== 'Pending' || settlement !== 'Pending';
      }) || [];
      
      setExits(approvedResignations);
    } catch (err) {
      showToast("Failed to complete exit interview", "error");
    }
  }

  const updateDepartmentClearance = (resignationId, department, status) => {
    setDepartmentClearances(prev => ({
      ...prev,
      [resignationId]: {
        ...prev[resignationId],
        [department]: status
      }
    }));
  };

  const getDepartmentStatus = (resignationId, department) => {
    return departmentClearances[resignationId]?.[department] || 'Pending';
  };

  const areAllClearancesCompleted = () => {
    if (clearances.length === 0) return false;
    return clearances.every(clearance => clearance.status === 'Completed');
  };

  const defaultClearanceItems = [
    { 
      department: "HR", 
      status: "Pending",
      description: "Final paperwork, policy compliance, handover documentation",
      icon: User,
      color: "blue"
    },
    { 
      department: "IT", 
      status: "Pending",
      description: "Return laptop, access cards, disable accounts, data backup",
      icon: AlertCircle,
      color: "purple"
    },
    { 
      department: "Finance", 
      status: "Pending",
      description: "Final settlement calculation, expense claims, tax clearance",
      icon: CheckCircle,
      color: "green"
    },
    { 
      department: "Admin", 
      status: "Pending",
      description: "Return ID cards, keys, facility access, locker clearance",
      icon: Clock,
      color: "orange"
    }
  ];

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Completed': 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[status] || 'bg-gray-100 text-primary ';
  };

  const getDepartmentColor = (color) => {
    const colors = {
      'blue': 'from-blue-500 to-blue-600',
      'purple': 'from-purple-500 to-purple-600',
      'green': 'from-green-500 to-green-600',
      'orange': 'from-orange-500 to-orange-600'
    };
    return colors[color] || 'from-gray-500 to-gray-600';
  };

  return (
    <div className="p-6 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border-0 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden" style={{
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
          <div className="flex items-center justify-between relative z-10">
            <div className="min-w-0 flex-1">
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Approved Resignations</p>
              <p className="text-2xl font-bold text-gray-900">{exits.length}</p>
              <p className="text-gray-400 text-xs mt-1">Ready for clearance</p>
            </div>
            <div className="p-3 rounded-lg" style={{
              backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
            }}>
              <User className="h-6 w-6" style={{
                color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
              }} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 border-0 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden" style={{
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
          <div className="flex items-center justify-between relative z-10">
            <div className="min-w-0 flex-1">
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Pending Clearance</p>
              <p className="text-2xl font-bold text-gray-900">{exits.length}</p>
              <p className="text-gray-400 text-xs mt-1">In progress</p>
            </div>
            <div className="p-3 rounded-lg" style={{
              backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
            }}>
              <Clock className="h-6 w-6" style={{
                color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
              }} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 border-0 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden" style={{
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
          <div className="flex items-center justify-between relative z-10">
            <div className="min-w-0 flex-1">
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Clearance Completed</p>
              <p className="text-2xl font-bold text-gray-900">{exits.filter(e => e.clearance_status === 'Completed').length}</p>
              <p className="text-gray-400 text-xs mt-1">Fully cleared</p>
            </div>
            <div className="p-3 rounded-lg" style={{
              backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
            }}>
              <CheckCircle className="h-6 w-6" style={{
                color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
              }} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 border-0 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden" style={{
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
          <div className="flex items-center justify-between relative z-10">
            <div className="min-w-0 flex-1">
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Interviews Done</p>
              <p className="text-2xl font-bold text-gray-900">{exits.filter(e => e.exit_interview_completed).length}</p>
              <p className="text-gray-400 text-xs mt-1">Completed</p>
            </div>
            <div className="p-3 rounded-lg" style={{
              backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
            }}>
              <AlertCircle className="h-6 w-6" style={{
                color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
              }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exit List */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden relative" style={{
          background: `linear-gradient(135deg, white 0%, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}03 100%)`,
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
          <div className="p-5 border-b-0 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <User className="h-5 w-5" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Approved Resignations</h3>
                <p className="text-gray-600 text-sm">Select an employee to manage clearance process</p>
              </div>
            </div>
          </div>
          
          <div className="p-5 relative z-10">
            <div className="space-y-3">
              {exits.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No approved resignations found</h4>
                  <p className="text-gray-600 text-sm">Resignations will appear here once clearance processes have started.</p>
                </div>
              ) : (
                exits.map((exit) => {
                  const isSelected = selectedExit?.id === exit.id;
                  const clearanceCompleted = selectedExit && clearances.length > 0 && clearances.every(c => c.status === 'Completed');
                  
                  return (
                    <div
                      key={exit.id}
                      onClick={() => setSelectedExit(exit)}
                      className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                        isSelected 
                          ? 'border-gray-900 bg-blue-50 shadow-md' 
                          : 'border-gray-200 hover:border-gray-400 bg-white'
                      }`}
                      style={{
                        backgroundColor: isSelected ? `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10` : 'white',
                        borderColor: isSelected ? getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5' : '#e5e7eb'
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 text-sm sm:text-base truncate">{exit.employee_name || `Employee #${exit.employee_id}`}</div>
                          <div className="text-xs sm:text-sm text-gray-600 mt-1">Code: {exit.employee_code || 'N/A'}</div>
                          <div className="text-xs sm:text-sm text-gray-600">Last Working: {exit.last_working_day || 'N/A'}</div>
                          <div className="text-xs sm:text-sm text-gray-600">Reason: {exit.reason || 'N/A'}</div>
                        </div>
                        <div className="flex flex-col items-end gap-2 ml-3">
                          <span className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-full border ${
                            exit.exit_interview_completed 
                              ? 'bg-gray-100 text-gray-800 border-gray-300' 
                              : 'bg-gray-100 text-gray-800 border-gray-300'
                          }`}>
                            {exit.exit_interview_completed ? 'Interview Done' : 'Pending Interview'}
                          </span>
                          <span className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-full border ${
                            clearanceCompleted
                              ? 'bg-gray-100 text-gray-800 border-gray-300'
                              : 'bg-gray-100 text-gray-800 border-gray-300'
                          }`}>
                            {clearanceCompleted ? 'Clearance Done' : 'Clearance Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Clearance Details */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden relative" style={{
          background: `linear-gradient(135deg, white 0%, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}03 100%)`,
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
          {selectedExit ? (
            <>
              <div className="p-5 border-b-0 relative z-10">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 rounded-lg" style={{
                      backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
                    }}>
                      <CheckCircle className="h-5 w-5" style={{
                        color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                      }} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">Clearance Status</h3>
                      <p className="text-gray-600 text-sm truncate">{selectedExit.employee_name || `Employee #${selectedExit.employee_id}`}</p>
                    </div>
                  </div>
                  {!selectedExit.exit_interview_completed && areAllClearancesCompleted() && canConductInterview && (
                    <button
                      onClick={() => setShowInterviewForm(true)}
                      style={{ backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5' }}
                      className="px-4 py-2 text-white text-sm rounded-xl font-medium transition-all duration-200 whitespace-nowrap"
                      onMouseEnter={(e) => e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}
                    >
                      Conduct Exit Interview
                    </button>
                  )}
                  {!areAllClearancesCompleted() && (
                    <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
                      Complete all clearances first
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5 relative z-10">
                <div className="grid grid-cols-1 gap-4">
                  {clearances.length > 0 ? (
                    clearances.filter(clearance => {
                      // Only show clearances for departments the user has permission for
                      return (
                        (clearance.department === 'HR' && canManageHR) ||
                        (clearance.department === 'IT' && canManageIT) ||
                        (clearance.department === 'Finance' && canManageFinance) ||
                        (clearance.department === 'Admin' && canManageAdmin)
                      );
                    }).map((clearance, index) => {
                      const IconComponent = defaultClearanceItems.find(item => item.department === clearance.department)?.icon || User;
                      const canManage = (
                        (clearance.department === 'HR' && canManageHR) ||
                        (clearance.department === 'IT' && canManageIT) ||
                        (clearance.department === 'Finance' && canManageFinance) ||
                        (clearance.department === 'Admin' && canManageAdmin)
                      );
                      
                      return (
                        <div key={clearance.id} className=" rounded-xl p-4 hover:shadow-md transition-all duration-200">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className="p-3 rounded-xl" style={{
                                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}15`
                              }}>
                                <IconComponent className="h-5 w-5" style={{
                                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                                }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-900 text-base">{clearance.department}</div>
                                <div className="text-sm text-gray-600 mt-1">{clearance.description}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                clearance.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {clearance.status}
                              </span>
                              {clearance.status === 'Pending' && canManage && (
                                <button
                                  onClick={() => handleApproveClearance(clearance.id)}
                                  style={{ backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5' }}
                                  className="text-white text-sm px-4 py-2 rounded-xl font-medium transition-all duration-200 whitespace-nowrap"
                                  onMouseEnter={(e) => e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}
                                  onMouseLeave={(e) => e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}
                                >
                                  Mark Completed
                                </button>
                              )}
                              {clearance.status === 'Completed' && (
                                <div className="text-green-600">
                                  <CheckCircle className="h-5 w-5" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    defaultClearanceItems.filter(clearance => {
                      // Only show clearances for departments the user has permission for
                      return (
                        (clearance.department === 'HR' && canManageHR) ||
                        (clearance.department === 'IT' && canManageIT) ||
                        (clearance.department === 'Finance' && canManageFinance) ||
                        (clearance.department === 'Admin' && canManageAdmin)
                      );
                    }).map((clearance, index) => {
                      const currentStatus = getDepartmentStatus(selectedExit.id, clearance.department);
                      const IconComponent = clearance.icon;
                      const canManage = (
                        (clearance.department === 'HR' && canManageHR) ||
                        (clearance.department === 'IT' && canManageIT) ||
                        (clearance.department === 'Finance' && canManageFinance) ||
                        (clearance.department === 'Admin' && canManageAdmin)
                      );
                      
                      return (
                        <div key={index} className=" border-black rounded-xl p-3 sm:p-4 hover:shadow-md transition-all duration-200">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                              <div className="p-2 sm:p-3 rounded-xl bg-gray-100 border border-black flex-shrink-0">
                                <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-900 text-sm sm:text-base">{clearance.department}</div>
                                <div className="text-xs sm:text-sm text-gray-600 mt-1">{clearance.description}</div>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                              <span className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-full border ${
                                currentStatus === 'Pending' ? 'bg-gray-100 text-gray-800 border-gray-300' :
                                'bg-gray-100 text-gray-800 border-gray-300'
                              }`}>
                                {currentStatus}
                              </span>
                              {currentStatus === 'Pending' && canManage && (
                                <button
                                  onClick={() => updateDepartmentClearance(selectedExit.id, clearance.department, 'Completed')}
                                  style={{ backgroundColor: 'var(--primary-color, #2862e9)', borderColor: 'var(--primary-color, #2862e9)' }}
                                  className="text-white text-xs sm:text-sm px-3 sm:px-4 py-2 border rounded-xl font-medium transition-all duration-200 whitespace-nowrap"
                                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--secondary-color, #474e71)'}
                                  onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary-color, #2862e9)'}
                                >
                                  Mark Completed
                                </button>
                              )}
                              {currentStatus === 'Completed' && (
                                <div className="text-gray-600">
                                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Exit Interview Status */}
                <div className="mt-6 p-4 bg-gray-50 rounded-xl border-0">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-base">
                    <AlertCircle className="h-5 w-5" style={{
                      color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                    }} />
                    Exit Interview Status
                  </h4>
                  {selectedExit.exit_interview_completed ? (
                    <div className="flex items-center gap-2 text-gray-800">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="font-medium text-xs sm:text-sm">Completed on {selectedExit.exit_interview_date}</span>
                    </div>
                  ) : areAllClearancesCompleted() ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="font-medium text-xs sm:text-sm">Ready for Exit Interview</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="font-medium text-xs sm:text-sm">Pending - Complete all clearances first</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Select an Employee</h4>
              <p className="text-gray-600 text-sm">Choose an employee from the left to view and manage their clearance details</p>
            </div>
          )}
        </div>
      </div>

      {/* Exit Interview Form Modal */}
      {showInterviewForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Exit Interview</h3>
              <button
                onClick={() => setShowInterviewForm(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-xl border-0">
              <p className="text-gray-900 font-medium">{selectedExit.employee_name || `Employee #${selectedExit.employee_id}`}</p>
              <p className="text-gray-600 text-sm">Code: {selectedExit.employee_code || 'N/A'}</p>
            </div>
            
            <form onSubmit={handleExitInterview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overall Workplace Experience Rating (1-5)
                </label>
                <select
                  required
                  value={interviewForm.rating}
                  onChange={(e) => setInterviewForm({...interviewForm, rating: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:border-transparent transition-all duration-200"
                  style={{
                    backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                    focusRingColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                  }}
                >
                  <option value="">Select Rating</option>
                  <option value="1">1 - Very Poor</option>
                  <option value="2">2 - Poor</option>
                  <option value="3">3 - Average</option>
                  <option value="4">4 - Good</option>
                  <option value="5">5 - Excellent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback & Comments
                </label>
                <textarea style={{backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`}} 
                  required
                  value={interviewForm.feedback}
                  onChange={(e) => setInterviewForm({...interviewForm, feedback: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-3 h-24 focus:ring-2 focus:border-transparent transition-all duration-200"
                  placeholder="Please share your feedback about the workplace, management, colleagues, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suggestions for Improvement
                </label>
                <textarea style={{backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`}} 
                  value={interviewForm.suggestions}
                  onChange={(e) => setInterviewForm({...interviewForm, suggestions: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-3 h-24 focus:ring-2 focus:border-transparent transition-all duration-200"
                  placeholder="Any suggestions to improve the workplace or processes"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInterviewForm(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 font-medium transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5' }}
                  className="flex-1 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200"
                  onMouseEnter={(e) => e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}
                >
                  Complete Interview
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <Toast toast={toast} hideToast={hideToast} />
    </div>
  );
}


