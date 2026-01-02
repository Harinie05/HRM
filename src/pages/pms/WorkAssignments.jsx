import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, CheckCircle, Clock, XCircle } from "lucide-react";
import api from "../../api";

export default function WorkAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [myAssignments, setMyAssignments] = useState([]);
  const [reviewCycles, setReviewCycles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    category: "Operational",
    weightage_percentage: "",
    frequency: "Monthly",
    review_cycle_id: "",
    assigned_employee_id: ""
  });
  const [currentCycle, setCurrentCycle] = useState(null);
  const [employeePMSData, setEmployeePMSData] = useState(null);

  useEffect(() => {
    createSampleData();
    fetchData();
  }, []);

  const createSampleData = async () => {
    try {
      await api.post("/api/pms/work-assignments/create-sample-data");
    } catch (error) {
      console.error("Error creating sample data:", error);
    }
  };

  const [statusData, setStatusData] = useState({
    completion_status: "Not Completed",
    remarks: ""
  });

  const fetchEmployeeReviewCycle = async (employeeId) => {
    try {
      const response = await api.get(`/api/pms/goals/employee-review-cycle/${employeeId}`);
      setCurrentCycle(response.data.data);
    } catch (error) {
      console.error("Error fetching employee review cycle:", error);
    }
  };

  const fetchEmployeePMSData = async (employeeId) => {
    try {
      const response = await api.get(`/api/pms/goals/employee-pms-data/${employeeId}`);
      setEmployeePMSData(response.data.data);
    } catch (error) {
      console.error("Error fetching employee PMS data:", error);
    }
  };
  
  const fetchData = async () => {
    try {
      console.log("Fetching data...");
      
      // Fetch data with individual error handling
      const results = await Promise.allSettled([
        api.get("/api/pms/work-assignments/assignments"),
        api.get("/api/pms/work-assignments/my-assignments"),
        api.get("/api/pms/work-assignments/review-cycles"),
        api.get("/hospitals/users/test/list") // Changed from /api/pms/goals/employees
      ]);

      // Handle assignments
      if (results[0].status === 'fulfilled') {
        setAssignments(results[0].value.data.data || []);
      } else {
        console.error("Error fetching assignments:", results[0].reason);
      }

      // Handle my assignments
      if (results[1].status === 'fulfilled') {
        setMyAssignments(results[1].value.data.data || []);
        if (results[1].value.data.data && results[1].value.data.data.length > 0) {
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
          if (currentUser.id) {
            fetchEmployeeReviewCycle(currentUser.id);
            fetchEmployeePMSData(currentUser.id);
          }
        }
      } else {
        console.error("Error fetching my assignments:", results[1].reason);
        setMyAssignments([]);
      }

      // Handle review cycles
      if (results[2].status === 'fulfilled') {
        setReviewCycles(results[2].value.data.data || []);
      } else {
        console.error("Error fetching review cycles:", results[2].reason);
      }

      // Handle employees
      if (results[3].status === 'fulfilled') {
        const response = results[3].value;
        console.log("Employees API response:", response);
        // Handle different possible response structures
        let employeesData = response.data;
        if (!Array.isArray(employeesData) && employeesData && employeesData.users) {
          employeesData = employeesData.users;
        }
        if (!employeesData && Array.isArray(response)) {
          employeesData = response;
        }
        console.log("Processed employees data:", employeesData);
        // Ensure it's always an array
        setEmployees(Array.isArray(employeesData) ? employeesData : []);
      } else {
        console.error("Error fetching employees:", results[3].reason);
        setEmployees([]);
      }
      
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/pms/work-assignments/assignments", formData);
      setShowModal(false);
      setFormData({
        title: "",
        category: "Operational",
        weightage_percentage: "",
        frequency: "Monthly",
        review_cycle_id: "",
        assigned_employee_id: ""
      });
      fetchData();
    } catch (error) {
      console.error("Error creating assignment:", error);
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/pms/work-assignments/assignments/${selectedAssignment.id}/status`, statusData);
      setShowStatusModal(false);
      setSelectedAssignment(null);
      setStatusData({ completion_status: "Not Completed", remarks: "" });
      fetchData();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Completed": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "Partially Completed": return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Work Assignments</h2>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              try {
                const response = await api.get("/api/pms/debug/user-info");
                console.log("Debug info:", response.data);
                alert("Check console for debug info");
              } catch (error) {
                console.error("Debug error:", error);
              }
            }}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Debug
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            New Assignment
          </button>
        </div>
      </div>

      {/* Current Review Cycle Info */}
      {currentCycle && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">Current Review Cycle: {currentCycle.cycle_name}</h3>
              <p className="text-sm text-blue-700">
                {currentCycle.start_date} to {currentCycle.end_date} | Status: {currentCycle.status}
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-blue-900">{currentCycle.kpi_score}%</div>
              <div className={`text-sm px-2 py-1 rounded ${currentCycle.performance_status === 'On Track' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {currentCycle.performance_status}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* My Assignments */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">My Assignments</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Title</th>
                <th className="text-left p-2">Category</th>
                <th className="text-left p-2">Weightage</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Score Impact</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {myAssignments.map((assignment) => (
                <tr key={assignment.id} className="border-b">
                  <td className="p-2">{assignment.title}</td>
                  <td className="p-2">{assignment.category}</td>
                  <td className="p-2">{assignment.weightage_percentage}%</td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(assignment.completion_status)}
                      {assignment.completion_status}
                    </div>
                  </td>
                  <td className="p-2">
                    <span className="text-sm font-medium">
                      +{((assignment.weightage_percentage * assignment.completion_percentage) / 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="p-2">
                    <button
                      onClick={() => {
                        setSelectedAssignment(assignment);
                        setStatusData({
                          completion_status: assignment.completion_status,
                          remarks: assignment.remarks
                        });
                        setShowStatusModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 border border-blue-600 rounded hover:bg-blue-50"
                    >
                      Update Status
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Assignments */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">All Assignments</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Title</th>
                <th className="text-left p-2">Employee</th>
                <th className="text-left p-2">Category</th>
                <th className="text-left p-2">Weightage</th>
                <th className="text-left p-2">Frequency</th>
                <th className="text-left p-2">Cycle</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment) => (
                <tr key={assignment.id} className="border-b">
                  <td className="p-2">{assignment.title}</td>
                  <td className="p-2">{assignment.employee_name}</td>
                  <td className="p-2">{assignment.category}</td>
                  <td className="p-2">{assignment.weightage_percentage}%</td>
                  <td className="p-2">{assignment.frequency}</td>
                  <td className="p-2">{assignment.cycle_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Assignment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create Assignment</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Assignment Title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full p-2 border rounded"
                required
              />
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full p-2 border rounded"
              >
                <option value="Operational">Operational</option>
                <option value="Admin">Admin</option>
                <option value="Compliance">Compliance</option>
                <option value="Support">Support</option>
              </select>
              <input
                type="number"
                placeholder="Weightage %"
                value={formData.weightage_percentage}
                onChange={(e) => setFormData({...formData, weightage_percentage: e.target.value})}
                className="w-full p-2 border rounded"
                required
              />
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                className="w-full p-2 border rounded"
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="One-time">One-time</option>
              </select>
              <select
                value={formData.review_cycle_id}
                onChange={(e) => setFormData({...formData, review_cycle_id: e.target.value})}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select Review Cycle</option>
                {reviewCycles.map(cycle => (
                  <option key={cycle.id} value={cycle.id}>{cycle.cycle_name}</option>
                ))}
              </select>
              <select
                value={formData.assigned_employee_id}
                onChange={(e) => setFormData({...formData, assigned_employee_id: e.target.value})}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select Employee</option>
                {Array.isArray(employees) && employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Update Status</h3>
            <form onSubmit={handleStatusUpdate} className="space-y-4">
              <select
                value={statusData.completion_status}
                onChange={(e) => setStatusData({...statusData, completion_status: e.target.value})}
                className="w-full p-2 border rounded"
              >
                <option value="Not Completed">Not Completed</option>
                <option value="Partially Completed">Partially Completed</option>
                <option value="Completed">Completed</option>
              </select>
              <textarea
                placeholder="Remarks (optional)"
                value={statusData.remarks}
                onChange={(e) => setStatusData({...statusData, remarks: e.target.value})}
                className="w-full p-2 border rounded h-20"
              />
              <div className="flex gap-2">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
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