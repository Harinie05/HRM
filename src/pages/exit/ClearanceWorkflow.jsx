import { useEffect, useState } from "react";
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
    { department: "HR", status: "Pending" },
    { department: "IT", status: "Pending" },
    { department: "Finance", status: "Pending" },
    { department: "Admin", status: "Pending" }
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Clearance & Exit Process Workflow</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exit List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">Approved Resignations</h3>
          <div className="space-y-3">
            {exits.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <div className="text-sm">No approved resignations found.</div>
                <div className="text-xs mt-1">Resignations will appear here once clearance processes have started.</div>
              </div>
            ) : (
              exits.map((exit) => (
                <div
                  key={exit.id}
                  onClick={() => setSelectedExit(exit)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedExit?.id === exit.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{exit.employee_name || `Employee #${exit.employee_id}`}</div>
                      <div className="text-sm text-gray-500">Code: {exit.employee_code || 'N/A'}</div>
                      <div className="text-sm text-gray-500">Last Working: {exit.last_working_day || 'N/A'}</div>
                      <div className="text-sm text-gray-500">Reason: {exit.reason || 'N/A'}</div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      exit.exit_interview_completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {exit.exit_interview_completed ? 'Interview Done' : 'Pending Interview'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Clearance Details */}
        <div className="bg-white rounded-lg shadow p-6">
          {selectedExit ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Clearance Status - {selectedExit.employee_name || `Employee #${selectedExit.employee_id}`}</h3>
                {!selectedExit.exit_interview_completed && areAllClearancesCompleted(selectedExit.id) && (
                  <button
                    onClick={() => setShowInterviewForm(true)}
                    className="bg-blue-600 px-3 py-1 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Conduct Exit Interview
                  </button>
                )}
                {!areAllClearancesCompleted(selectedExit.id) && (
                  <div className="text-sm text-orange-600">
                    Complete all clearances to conduct interview
                  </div>
                )}
              </div>

              {/* Department Clearance Status */}
              <div className="space-y-3">
                {defaultClearanceItems.map((clearance, index) => {
                  const currentStatus = getDepartmentStatus(selectedExit.id, clearance.department);
                  return (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{clearance.department}</div>
                        <div className="text-sm text-gray-500">
                          {clearance.department === 'HR' && 'Final paperwork, policy compliance'}
                          {clearance.department === 'IT' && 'Return laptop, access cards, accounts'}
                          {clearance.department === 'Finance' && 'Final settlement, expense claims'}
                          {clearance.department === 'Admin' && 'Return ID cards, keys, facility access'}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          currentStatus === 'Completed' ? 'bg-green-100 text-green-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {currentStatus}
                        </span>
                        {currentStatus === 'Pending' && (
                          <button
                            onClick={() => updateDepartmentClearance(selectedExit.id, clearance.department, 'Completed')}
                            className="text-green-600 hover:text-green-800 text-sm px-2 py-1 border border-green-300 rounded hover:bg-green-50"
                          >
                            Mark Completed
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Exit Interview Status */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Exit Interview</h4>
                {selectedExit.exit_interview_completed ? (
                  <div className="text-green-600">
                    ✓ Completed on {selectedExit.exit_interview_date}
                  </div>
                ) : (
                  <div className="text-yellow-600">
                    ⏳ Pending - Click button above to conduct
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Select an employee from the left to view clearance details
            </div>
          )}
        </div>
      </div>

      {/* Exit Interview Form Modal */}
      {showInterviewForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">Exit Interview - {selectedExit.employee_name || `Employee #${selectedExit.employee_id}`}</h3>
            
            <form onSubmit={handleExitInterview} className="space-y-4">
              {/* Rating */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Overall Workplace Experience Rating (1-5)
                </label>
                <select
                  required
                  value={interviewForm.rating}
                  onChange={(e) => setInterviewForm({...interviewForm, rating: e.target.value})}
                  className="w-full border rounded-lg p-2 bg-gray-50"
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
                <label className="block text-sm font-medium mb-1">
                  Feedback & Comments
                </label>
                <textarea
                  required
                  value={interviewForm.feedback}
                  onChange={(e) => setInterviewForm({...interviewForm, feedback: e.target.value})}
                  className="w-full border rounded-lg p-2 bg-gray-50 h-24"
                  placeholder="Please share your feedback about the workplace, management, colleagues, etc."
                />
              </div>

              {/* Suggestions */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Suggestions for Improvement
                </label>
                <textarea
                  value={interviewForm.suggestions}
                  onChange={(e) => setInterviewForm({...interviewForm, suggestions: e.target.value})}
                  className="w-full border rounded-lg p-2 bg-gray-50 h-24"
                  placeholder="Any suggestions to improve the workplace or processes"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowInterviewForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Complete Interview
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}