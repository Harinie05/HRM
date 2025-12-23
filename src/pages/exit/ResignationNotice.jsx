import { useEffect, useState } from "react";
import api from "../../api";

export default function ResignationNotice() {
  const [resignations, setResignations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [form, setForm] = useState({
    employee_id: "",
    resignation_date: "",
    last_working_day: "",
    reason: "",
    notice_period: "30",
    notes: ""
  });

  // Load resignations and employees
  useEffect(() => {
    async function fetchData() {
      try {
        const [resignationsRes, employeesRes] = await Promise.all([
          api.get("/api/exit/resignations"),
          api.get("/eis/employees")
        ]);
        setResignations(resignationsRes.data);
        setEmployees(employeesRes.data);
      } catch (err) {
        console.log("Error loading data", err);
      }
    }
    fetchData();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    
    // Auto-fill employee details when selected
    if (name === 'employee_id' && value) {
      const selectedEmployee = employees.find(emp => emp.id.toString() === value);
      if (selectedEmployee) {
        setForm({ 
          ...form, 
          [name]: value
        });
        return;
      }
    }
    
    setForm({ ...form, [name]: value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.post("/api/exit/resignation/apply", form);
      alert("Resignation application submitted successfully");
      setShowApplyForm(false);
      setForm({
        employee_id: "",
        resignation_date: "",
        last_working_day: "",
        reason: "",
        notice_period: "30",
        notes: ""
      });
      
      // Refresh resignations
      const res = await api.get("/api/exit/resignations");
      setResignations(res.data);
    } catch (err) {
      console.error('Failed to submit resignation:', err);
      alert("Failed to submit resignation application");
    }
  }

  async function handleApprove(exitId) {
    try {
      await api.put(`/api/exit/resignation/${exitId}/approve`);
      alert("Resignation approved successfully");
      
      // Refresh resignations
      const res = await api.get("/api/exit/resignations");
      setResignations(res.data);
    } catch (err) {
      alert("Failed to approve resignation");
    }
  }

  async function handleReject(exitId) {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;
    
    try {
      await api.put(`/api/exit/resignation/${exitId}/reject?reason=${encodeURIComponent(reason)}`);
      alert("Resignation rejected");
      
      // Refresh resignations
      const res = await api.get("/api/exit/resignations");
      setResignations(res.data);
    } catch (err) {
      alert("Failed to reject resignation");
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Resignation & Notice Tracking</h2>
        <button
          onClick={() => setShowApplyForm(true)}
          className="bg-blue-600 px-4 py-2 text-white rounded-lg hover:bg-blue-700"
        >
          Apply Resignation
        </button>
      </div>

      {/* Apply Resignation Form Modal */}
      {showApplyForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Apply for Resignation</h3>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              {/* Employee Selection */}
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Employee <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  name="employee_id"
                  value={form.employee_id}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2 bg-gray-50"
                >
                  <option value="">Select Employee</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.employee_code || employee.id} - {employee.name || employee.first_name + ' ' + (employee.last_name || '')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Resignation Date */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Resignation Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  name="resignation_date"
                  value={form.resignation_date}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2 bg-gray-50"
                />
              </div>

              {/* Last Working Day */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Last Working Day <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  name="last_working_day"
                  value={form.last_working_day}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2 bg-gray-50"
                />
              </div>

              {/* Notice Period */}
              <div>
                <label className="block text-sm font-medium mb-1">Notice Period (Days)</label>
                <select
                  name="notice_period"
                  value={form.notice_period}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2 bg-gray-50"
                >
                  <option value="15">15 Days</option>
                  <option value="30">30 Days</option>
                  <option value="60">60 Days</option>
                  <option value="90">90 Days</option>
                </select>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium mb-1">Reason for Leaving</label>
                <select
                  name="reason"
                  value={form.reason}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2 bg-gray-50"
                >
                  <option value="">Select Reason</option>
                  <option value="Better Opportunity">Better Opportunity</option>
                  <option value="Personal Reasons">Personal Reasons</option>
                  <option value="Relocation">Relocation</option>
                  <option value="Higher Studies">Higher Studies</option>
                  <option value="Health Issues">Health Issues</option>
                  <option value="Retirement">Retirement</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Notes */}
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Additional Notes</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2 bg-gray-50 h-24"
                  placeholder="Enter any additional notes or comments"
                />
              </div>

              {/* Buttons */}
              <div className="col-span-2 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowApplyForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Submit Resignation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resignations Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Working Day</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notice Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {resignations.map((resignation) => (
                <tr key={resignation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">Employee #{resignation.employee_id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {resignation.last_working_day}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {resignation.notice_period} Days
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      resignation.overall_status === 'Initiated' ? 'bg-yellow-100 text-yellow-800' :
                      resignation.overall_status === 'Approved' ? 'bg-green-100 text-green-800' :
                      resignation.overall_status === 'Rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {resignation.overall_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {resignation.reason || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {resignation.overall_status === 'Initiated' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApprove(resignation.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => handleReject(resignation.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          ✗ Reject
                        </button>
                      </div>
                    )}
                    {resignation.overall_status !== 'Initiated' && (
                      <span className="text-gray-400">No actions</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}