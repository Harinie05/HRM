import { useEffect, useState } from "react";
import { Calendar, Users, TrendingUp, Clock, CheckCircle } from "lucide-react";
import api from "../../api";
import Toast from "../../components/Toast";
import useToast from "../../utils/useToast";
import { hasPermission, isAdmin } from "../../utils/permissions";

export default function LeaveCompliance() {
  const canView = isAdmin() || hasPermission('view_leave_compliance');
  const canAdd = isAdmin() || hasPermission('add_leave_compliance');
  const canEdit = isAdmin() || hasPermission('edit_leave_compliance');
  const canDelete = isAdmin() || hasPermission('delete_leave_compliance');

  if (!canView) {
    return (
      <div className="p-6 text-center">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md mx-auto">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You do not have permission to view Leave Compliance.</p>
        </div>
      </div>
    );
  }

  const [form, setForm] = useState({
    employee_id: "",
    employee_name: "",
    total_working_days: "",
    actual_working_days: "",
    leaves_taken: "",
    paid_leaves: "",
    unpaid_leaves: "",
    sick_leaves: "",
    casual_leaves: "",
    earned_leaves: "",
    overtime_hours: "",
    weekly_off_days: "",
    public_holidays: "",
    month: "",
    year: "",
    department: "",
    designation: "",
    compliance_status: "Compliant",
    remarks: "",
  });

  const [complianceRecords, setComplianceRecords] = useState([]);
  const [leaveRules, setLeaveRules] = useState(null);
  const [employees, setEmployees] = useState([]);
  const { toast, showToast, hideToast } = useToast();

  // Load leave compliance data
  useEffect(() => {
    async function fetchData() {
      try {
        const tenant = localStorage.getItem("tenant_db");
        const token = localStorage.getItem("access_token");
        
        // Fetch employees from user management only
        const usersRes = await fetch(`http://localhost:8000/hospitals/users/${tenant}/list`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => res.ok ? res.json() : { users: [] }).catch(() => ({ users: [] }));
        
        const userEmployees = usersRes.users || [];
        
        // Process user management employees
        const allEmployees = userEmployees
          .filter(user => user.employee_code)
          .map(user => ({
            id: `user_${user.id}`,
            employee_id: user.employee_code,
            name: user.name,
            department: user.department_name,
            designation: user.designation || 'N/A'
          }));
        
        setEmployees(allEmployees);
        
        try {
          const rulesRes = await api.get("/api/leave/leave-rules");
          setLeaveRules(rulesRes.data);
        } catch (rulesErr) {
          // Leave rules endpoint not available - continue without it
          setLeaveRules(null);
        }
        
        try {
          const complianceRes = await api.get("/api/compliance/leave");
          setComplianceRecords(complianceRes.data || []);
        } catch (complianceErr) {
          // Leave compliance data not available - continue without it
          setComplianceRecords([]);
        }
      } catch (err) {
        console.log("No leave compliance data found", err);
      }
    }
    fetchData();
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const res = await api.post("/api/compliance/leave", form);
      showToast("Leave Compliance Check Completed Successfully");
      
      // Reset form
      setForm({
        employee_id: "",
        employee_name: "",
        total_working_days: "",
        actual_working_days: "",
        leaves_taken: "",
        paid_leaves: "",
        unpaid_leaves: "",
        sick_leaves: "",
        casual_leaves: "",
        earned_leaves: "",
        overtime_hours: "",
        weekly_off_days: "",
        public_holidays: "",
        month: "",
        year: "",
        department: "",
        designation: "",
        compliance_status: "Compliant",
        remarks: "",
      });
      
      try {
        // Refresh compliance records
        const complianceRes = await api.get("/api/compliance/leave");
        setComplianceRecords(complianceRes.data || []);
      } catch (refreshErr) {
        // Compliance records not available - continue without refresh
      }
    } catch (err) {
      console.error('Failed to check leave compliance:', err);
      showToast("Failed to check leave compliance", 'error');
    }
  }

  // Calculate compliance metrics
  const calculateCompliance = () => {
    const totalDays = parseFloat(form.total_working_days) || 0;
    const actualDays = parseFloat(form.actual_working_days) || 0;
    const leavesTaken = parseFloat(form.leaves_taken) || 0;
    const overtimeHours = parseFloat(form.overtime_hours) || 0;
    
    const attendancePercentage = totalDays > 0 ? ((actualDays / totalDays) * 100) : 0;
    const leaveUtilization = totalDays > 0 ? ((leavesTaken / totalDays) * 100) : 0;
    const overtimeDays = overtimeHours / 8; // Assuming 8 hours per day
    
    return {
      attendancePercentage: attendancePercentage.toFixed(2),
      leaveUtilization: leaveUtilization.toFixed(2),
      overtimeDays: overtimeDays.toFixed(2),
      isCompliant: attendancePercentage >= 75 && leaveUtilization <= 30
    };
  };

  const compliance = calculateCompliance();

  return (
    <div className="space-y-6">
      <div className="rounded-xl shadow-sm border border-black p-6" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
        {/* Leave Rules Display */}
        {leaveRules && (
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-medium mb-2">Current Leave Rules</h3>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>Max Casual Leave: {leaveRules.max_casual_leave || 12} days</div>
              <div>Max Sick Leave: {leaveRules.max_sick_leave || 12} days</div>
              <div>Max Earned Leave: {leaveRules.max_earned_leave || 21} days</div>
              <div>Min Attendance: {leaveRules.min_attendance || 75}%</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6 mb-8">
          {canAdd ? (
            <>
          {/* Employee ID */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Employee ID <span className="text-red-500">*</span>
            </label>
            <select
              required
              name="employee_id"
              value={form.employee_id}
              onChange={(e) => {
                const selectedId = e.target.value;
                const selectedEmployee = employees.find(emp => emp.employee_id === selectedId);
                if (selectedEmployee) {
                  setForm({
                    ...form,
                    employee_id: selectedEmployee.employee_id,
                    employee_name: selectedEmployee.name,
                    department: selectedEmployee.department,
                    designation: selectedEmployee.designation
                  });
                } else {
                  setForm({ ...form, employee_id: selectedId });
                }
              }}
              className="w-full border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Employee ID</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.employee_id}>
                  {employee.employee_id}
                </option>
              ))}
            </select>
          </div>

          {/* Employee Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Employee Name <span className="text-red-500">*</span>
            </label>
            <select
              required
              name="employee_name"
              value={form.employee_name}
              onChange={(e) => {
                const selectedName = e.target.value;
                const selectedEmployee = employees.find(emp => emp.name === selectedName);
                if (selectedEmployee) {
                  setForm({
                    ...form,
                    employee_id: selectedEmployee.employee_id,
                    employee_name: selectedEmployee.name,
                    department: selectedEmployee.department,
                    designation: selectedEmployee.designation
                  });
                } else {
                  setForm({ ...form, employee_name: selectedName });
                }
              }}
              className="w-full border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Employee Name</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.name}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>

          {/* Total Working Days */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Total Working Days <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              name="total_working_days"
              value={form.total_working_days}
              onChange={handleChange}
              className="w-full border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter Total Working Days"
              min="0"
              max="31"
            />
          </div>

          {/* Actual Working Days */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Actual Working Days <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              name="actual_working_days"
              value={form.actual_working_days}
              onChange={handleChange}
              className="w-full border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter Actual Working Days"
              min="0"
              max="31"
            />
          </div>

          {/* Total Leaves Taken */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Total Leaves Taken <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              name="leaves_taken"
              value={form.leaves_taken}
              onChange={handleChange}
              className="w-full border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter Total Leaves Taken"
              min="0"
            />
          </div>

          {/* Paid Leaves */}
          <div>
            <label className="block text-sm font-medium mb-1">Paid Leaves</label>
            <input
              type="number"
              name="paid_leaves"
              value={form.paid_leaves}
              onChange={handleChange}
              className="w-full border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter Paid Leaves"
              min="0"
            />
          </div>

          {/* Unpaid Leaves */}
          <div>
            <label className="block text-sm font-medium mb-1">Unpaid Leaves</label>
            <input
              type="number"
              name="unpaid_leaves"
              value={form.unpaid_leaves}
              onChange={handleChange}
              className="w-full border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter Unpaid Leaves"
              min="0"
            />
          </div>

          {/* Sick Leaves */}
          <div>
            <label className="block text-sm font-medium mb-1">Sick Leaves</label>
            <input
              type="number"
              name="sick_leaves"
              value={form.sick_leaves}
              onChange={handleChange}
              className="w-full border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter Sick Leaves"
              min="0"
            />
          </div>

          {/* Casual Leaves */}
          <div>
            <label className="block text-sm font-medium mb-1">Casual Leaves</label>
            <input
              type="number"
              name="casual_leaves"
              value={form.casual_leaves}
              onChange={handleChange}
              className="w-full border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter Casual Leaves"
              min="0"
            />
          </div>

          {/* Earned Leaves */}
          <div>
            <label className="block text-sm font-medium mb-1">Earned Leaves</label>
            <input
              type="number"
              name="earned_leaves"
              value={form.earned_leaves}
              onChange={handleChange}
              className="w-full border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter Earned Leaves"
              min="0"
            />
          </div>

          {/* Overtime Hours */}
          <div>
            <label className="block text-sm font-medium mb-1">Overtime Hours</label>
            <input
              type="number"
              name="overtime_hours"
              value={form.overtime_hours}
              onChange={handleChange}
              className="w-full border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter Overtime Hours"
              min="0"
              step="0.5"
            />
          </div>

          {/* Month */}
          <div>
            <label className="block text-sm font-medium mb-1">Month</label>
            <select
              name="month"
              value={form.month}
              onChange={handleChange}
              className="w-full border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Month</option>
              <option value="01">January</option>
              <option value="02">February</option>
              <option value="03">March</option>
              <option value="04">April</option>
              <option value="05">May</option>
              <option value="06">June</option>
              <option value="07">July</option>
              <option value="08">August</option>
              <option value="09">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="block text-sm font-medium mb-1">Year</label>
            <input
              type="number"
              name="year"
              value={form.year}
              onChange={handleChange}
              className="w-full border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter Year"
              min="2020"
              max="2030"
            />
          </div>

          {/* Remarks */}
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Remarks</label>
            <textarea
              name="remarks"
              value={form.remarks}
              onChange={handleChange}
              className="w-full border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24"
              placeholder="Enter any compliance notes or remarks"
            />
          </div>

          {/* Real-time Compliance Display */}
          {(form.total_working_days && form.actual_working_days) && (
            <div className={`col-span-2 p-4 rounded-lg ${
              compliance.isCompliant ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <h4 className="font-medium mb-2">Compliance Metrics</h4>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>Attendance: {compliance.attendancePercentage}%</div>
                <div>Leave Utilization: {compliance.leaveUtilization}%</div>
                <div>Overtime Days: {compliance.overtimeDays}</div>
                <div className={`font-semibold ${
                  compliance.isCompliant ? 'text-green-600' : 'text-red-600'
                }`}>
                  Status: {compliance.isCompliant ? 'Compliant' : 'Non-Compliant'}
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="col-span-2">
            <button
              type="submit"
              className="bg-gray-800 px-6 py-2 text-white rounded-lg border border-black hover:bg-gray-900 transition-colors"
            >
              Check Leave Compliance
            </button>
          </div>
            </>
          ) : (
            <div className="col-span-2 text-center text-gray-500">
              You do not have permission to add leave compliance records.
            </div>
          )}
        </form>

        {/* Display compliance records */}
        {complianceRecords.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Leave Compliance Records</h3>
            <div className="overflow-x-auto">
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <table className="w-full border border-black">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-black">Employee</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-black">Working Days</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-black">Leaves Taken</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-black">Attendance %</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-black">OT Hours</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-black">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-black">Period</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-black">
                    {complianceRecords.map((record, index) => (
                      <tr key={index} className="hover:bg-gray-50 border-b border-black">
                        <td className="px-4 py-2 text-sm border-r border-black">
                          <div>
                            <div className="font-medium">{record.employee_name}</div>
                            <div className="text-gray-500 text-xs">{record.employee_id}</div>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm border-r border-black">{record.actual_working_days}/{record.total_working_days}</td>
                        <td className="px-4 py-2 text-sm border-r border-black">{record.leaves_taken}</td>
                        <td className="px-4 py-2 text-sm border-r border-black">
                          {((record.actual_working_days / record.total_working_days) * 100).toFixed(1)}%
                        </td>
                        <td className="px-4 py-2 text-sm border-r border-black">{record.overtime_hours}</td>
                        <td className="px-4 py-2 text-sm border-r border-black">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            record.compliance_status === 'Compliant' ? 'bg-green-100 text-green-800' :
                            record.compliance_status === 'Non-Compliant' ? 'bg-red-100 text-red-800' :
                            record.compliance_status === 'Under Review' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-900'
                          }`}>
                            {record.compliance_status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">{record.month}/{record.year}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden">
                {complianceRecords.map((record, index) => (
                  <div key={index} className="p-4 border-b border-gray-200 last:border-b-0">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{record.employee_name}</h4>
                        <p className="text-sm text-gray-600">{record.employee_id}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        record.compliance_status === 'Compliant' ? 'bg-green-100 text-green-800' :
                        record.compliance_status === 'Non-Compliant' ? 'bg-red-100 text-red-800' :
                        record.compliance_status === 'Under Review' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-900'
                      }`}>
                        {record.compliance_status}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Working Days:</span>
                        <span className="text-gray-900">{record.actual_working_days}/{record.total_working_days}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Leaves Taken:</span>
                        <span className="text-gray-900">{record.leaves_taken}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Attendance:</span>
                        <span className="text-gray-900">{((record.actual_working_days / record.total_working_days) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">OT Hours:</span>
                        <span className="text-gray-900">{record.overtime_hours}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Period:</span>
                        <span className="text-gray-900">{record.month}/{record.year}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <Toast toast={toast} hideToast={hideToast} />
    </div>
  );
}
