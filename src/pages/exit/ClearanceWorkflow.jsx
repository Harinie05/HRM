import { useEffect, useState } from "react";
import { CheckCircle, Clock, User, AlertCircle } from "lucide-react";
import api from "../../api";

export default function ClearanceWorkflow() {
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
      // For now, we'll use the default clearance items since the clearance API doesn't exist
      // In a real implementation, this would fetch from `/api/exit/clearance/${selectedExit.id}`
      setClearances([]);
    }
  }, [selectedExit]);

  async function handleApproveClearance(clearanceId) {
    try {
      await api.put(`/api/exit/clearance/${clearanceId}/approve`);
      alert("Clearance approved successfully");
      
      // Refresh clearances
      const res = await api.get(`/api/exit/clearance/${selectedExit.id}`);
      setClearances(res.data);
    } catch (err) {
      alert("Failed to approve clearance");
    }
  }

  async function handleExitInterview(e) {
    e.preventDefault();
    try {
      await api.put(`/api/resignation/interview/${selectedExit.id}`, interviewForm);
      alert("Exit interview completed successfully");
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
      alert("Failed to complete exit interview");
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

  const areAllClearancesCompleted = (resignationId) => {
    const departments = ['HR', 'IT', 'Finance', 'Admin'];
    return departments.every(dept => getDepartmentStatus(resignationId, dept) === 'Completed');
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
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-black">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Approved Resignations</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{exits.length}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-xl border border-black">
              <User className="h-6 w-6 text-gray-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 border border-black">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Pending Clearance</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {exits.filter(e => !areAllClearancesCompleted(e.id)).length}
              </p>
            </div>
            <div className="p-3 bg-gray-100 rounded-xl border border-black">
              <Clock className="h-6 w-6 text-gray-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 border border-black">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Clearance Completed</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {exits.filter(e => areAllClearancesCompleted(e.id)).length}
              </p>
            </div>
            <div className="p-3 bg-gray-100 rounded-xl border border-black">
              <CheckCircle className="h-6 w-6 text-gray-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 border border-black">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Interviews Done</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {exits.filter(e => e.exit_interview_completed).length}
              </p>
            </div>
            <div className="p-3 bg-gray-100 rounded-xl border border-black">
              <AlertCircle className="h-6 w-6 text-gray-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exit List */}
        <div className="bg-white rounded-xl shadow-sm border border-black overflow-hidden">
          <div className="p-6 border-b border-black bg-gray-50">
            <h3 className="text-xl font-bold text-gray-900">Approved Resignations</h3>
            <p className="text-gray-600 text-sm mt-1">Select an employee to manage clearance process</p>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {exits.length === 0 ? (
                <div className="text-center py-12">
                  <div className=" mb-4" style={{color: 'var(--text-muted, #6b7280)'}}>
                    <User className="w-12 h-12 mx-auto text-gray-500" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No approved resignations found</h4>
                  <p className="text-gray-600 text-sm">Resignations will appear here once clearance processes have started.</p>
                </div>
              ) : (
                exits.map((exit) => {
                  const isSelected = selectedExit?.id === exit.id;
                  const clearanceCompleted = areAllClearancesCompleted(exit.id);
                  
                  return (
                    <div
                      key={exit.id}
                      onClick={() => setSelectedExit(exit)}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                        isSelected 
                          ? 'border-gray-900 bg-gray-50 shadow-md' 
                          : 'border-gray-300 hover:border-gray-400 bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{exit.employee_name || `Employee #${exit.employee_id}`}</div>
                          <div className="text-sm text-gray-600 mt-1">Code: {exit.employee_code || 'N/A'}</div>
                          <div className="text-sm text-gray-600">Last Working: {exit.last_working_day || 'N/A'}</div>
                          <div className="text-sm text-gray-600">Reason: {exit.reason || 'N/A'}</div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full border ${
                            exit.exit_interview_completed 
                              ? 'bg-gray-100 text-gray-800 border-gray-300' 
                              : 'bg-gray-100 text-gray-800 border-gray-300'
                          }`}>
                            {exit.exit_interview_completed ? 'Interview Done' : 'Pending Interview'}
                          </span>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full border ${
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
        <div className="bg-white rounded-xl shadow-sm border border-black overflow-hidden">
          {selectedExit ? (
            <>
              <div className="p-6 border-b border-black bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Clearance Status</h3>
                    <p className="text-gray-600 text-sm mt-1">{selectedExit.employee_name || `Employee #${selectedExit.employee_id}`}</p>
                  </div>
                  {!selectedExit.exit_interview_completed && areAllClearancesCompleted(selectedExit.id) && (
                    <button
                      onClick={() => setShowInterviewForm(true)}
                      className="bg-gray-800 px-4 py-2 text-white text-sm rounded-xl border border-black hover:bg-gray-900 font-semibold transition-all duration-200"
                    >
                      Conduct Exit Interview
                    </button>
                  )}
                  {!areAllClearancesCompleted(selectedExit.id) && (
                    <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg border border-black">
                      Complete all clearances to conduct interview
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6">
                {/* Department Clearance Status */}
                <div className="grid grid-cols-1 gap-4">
                  {defaultClearanceItems.map((clearance, index) => {
                    const currentStatus = getDepartmentStatus(selectedExit.id, clearance.department);
                    const IconComponent = clearance.icon;
                    
                    return (
                      <div key={index} className="border border-black rounded-xl p-4 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="p-3 rounded-xl bg-gray-100 border border-black">
                              <IconComponent className="h-5 w-5 text-gray-500" />
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900">{clearance.department}</div>
                              <div className="text-sm text-gray-600 mt-1">{clearance.description}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full border ${
                              currentStatus === 'Pending' ? 'bg-gray-100 text-gray-800 border-gray-300' :
                              'bg-gray-100 text-gray-800 border-gray-300'
                            }`}>
                              {currentStatus}
                            </span>
                            {currentStatus === 'Pending' && (
                              <button
                                onClick={() => updateDepartmentClearance(selectedExit.id, clearance.department, 'Completed')}
                                className="text-gray-800 hover:text-gray-900 text-sm px-4 py-2 border border-black rounded-xl hover:bg-gray-100 font-medium transition-all duration-200"
                              >
                                Mark Completed
                              </button>
                            )}
                            {currentStatus === 'Completed' && (
                              <div className="text-gray-600">
                                <CheckCircle className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Exit Interview Status */}
                <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-black">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-gray-500" />
                    Exit Interview Status
                  </h4>
                  {selectedExit.exit_interview_completed ? (
                    <div className="flex items-center gap-2 text-gray-800">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Completed on {selectedExit.exit_interview_date}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-5 w-5" />
                      <span className="font-medium">Pending - Complete all clearances first</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center">
              <div className=" mb-4" style={{color: 'var(--text-muted, #6b7280)'}}>
                <CheckCircle className="w-12 h-12 mx-auto text-gray-500" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Select an Employee</h4>
              <p className="text-gray-600">Choose an employee from the left to view and manage their clearance details</p>
            </div>
          )}
        </div>
      </div>

      {/* Exit Interview Form Modal */}
      {showInterviewForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl w-full max-w-3xl mx-4 shadow-2xl border border-black">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Exit Interview</h3>
              <button
                onClick={() => setShowInterviewForm(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-black">
              <p className="text-gray-900 font-medium">{selectedExit.employee_name || `Employee #${selectedExit.employee_id}`}</p>
              <p className="text-gray-600 text-sm">Code: {selectedExit.employee_code || 'N/A'}</p>
            </div>
            
            <form onSubmit={handleExitInterview} className="space-y-6">
              {/* Rating */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Overall Workplace Experience Rating (1-5)
                </label>
                <select
                  required
                  value={interviewForm.rating}
                  onChange={(e) => setInterviewForm({...interviewForm, rating: e.target.value})}
                  className="w-full border border-black rounded-xl p-3 focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">Select Rating</option>
                  <option value="1">1 - Very Poor</option>
                  <option value="2">2 - Poor</option>
                  <option value="3">3 - Average</option>
                  <option value="4">4 - Good</option>
                  <option value="5">5 - Excellent</option>
                </select>
              </div>

              {/* Feedback */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Feedback & Comments
                </label>
                <textarea
                  required
                  value={interviewForm.feedback}
                  onChange={(e) => setInterviewForm({...interviewForm, feedback: e.target.value})}
                  className="w-full border border-black rounded-xl p-3 h-32 focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200"
                  placeholder="Please share your feedback about the workplace, management, colleagues, etc."
                />
              </div>

              {/* Suggestions */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Suggestions for Improvement
                </label>
                <textarea
                  value={interviewForm.suggestions}
                  onChange={(e) => setInterviewForm({...interviewForm, suggestions: e.target.value})}
                  className="w-full border border-black rounded-xl p-3 h-32 focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200"
                  placeholder="Any suggestions to improve the workplace or processes"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gray-800 text-white px-6 py-3 rounded-xl border border-black hover:bg-gray-900 font-semibold transition-all duration-200"
                >
                  Complete Interview
                </button>
                <button
                  type="button"
                  onClick={() => setShowInterviewForm(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl border border-black hover:bg-gray-200 font-semibold transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
