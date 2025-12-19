import { useEffect, useState } from "react";
import { Play, Search, Eye, Download, Calendar, Users } from "lucide-react";
import api from "../../api";

export default function PayrollRun() {
  const [runs, setRuns] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [showRunModal, setShowRunModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [runData, setRunData] = useState({
    month: "",
    year: new Date().getFullYear()
  });

  useEffect(() => {
    fetchRuns();
    fetchEmployees();
    fetchAttendanceData();
  }, []);

  const fetchRuns = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/payroll/run");
      setRuns(res.data || []);
    } catch (error) {
      console.error("Error fetching payroll runs:", error);
      setRuns([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      // Fetch from Employee Directory first
      const empRes = await api.get('/api/employees/list');
      let employeeList = empRes.data || [];
      
      // If no employees in directory, fallback to users
      if (employeeList.length === 0) {
        const tenantDb = localStorage.getItem('tenant_db');
        const userRes = await api.get(`/api/users/${tenantDb}/list`);
        employeeList = userRes.data?.users?.filter(u => u.is_employee) || [];
      }
      
      setEmployees(employeeList);
    } catch (error) {
      console.error("Error fetching employees:", error);
      setEmployees([]);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      const res = await api.get("/api/attendance/punches");
      setAttendanceData(res.data || []);
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      setAttendanceData([]);
    }
  };

  const handleRunPayroll = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const activeEmployees = employees.filter(emp => emp.status === 'Active');
      
      if (activeEmployees.length === 0) {
        alert('No active employees found to process payroll.');
        return;
      }
      
      // Complete workflow integration
      for (const employee of activeEmployees) {
        // Step 1-7: Full payroll workflow
        const payslipRes = await api.post(`/api/payroll/payslips/generate/${employee.id}`, null, {
          params: { month: `${runData.year}-${String(months.indexOf(runData.month) + 1).padStart(2, '0')}` }
        });
        
        // Create payroll run record
        const payrollData = {
          employee_id: employee.id,
          month: runData.month,
          year: runData.year,
          present_days: payslipRes.data.attendance.present_days,
          lop_days: payslipRes.data.attendance.lop_days,
          gross_salary: payslipRes.data.earnings.gross,
          net_salary: payslipRes.data.net_salary
        };
        
        await api.post("/api/payroll/run", payrollData);
      }
      
      await fetchRuns();
      setShowRunModal(false);
      setRunData({ month: "", year: new Date().getFullYear() });
      alert(`Complete payroll workflow processed for ${activeEmployees.length} employees.`);
    } catch (error) {
      console.error("Error running payroll:", error);
      alert('Failed to process payroll. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculatePresentDays = (employeeId, month, year) => {
    const employeeAttendance = attendanceData.filter(att => 
      att.employee_id === employeeId && 
      att.date && 
      new Date(att.date).getMonth() === months.indexOf(month) &&
      new Date(att.date).getFullYear() === year &&
      (att.status === 'Present' || att.status === 'Late')
    );
    return employeeAttendance.length;
  };

  const calculateLOPDays = (employeeId, month, year) => {
    const daysInMonth = new Date(year, months.indexOf(month) + 1, 0).getDate();
    const presentDays = calculatePresentDays(employeeId, month, year);
    return Math.max(0, daysInMonth - presentDays);
  };

  const filteredRuns = runs.filter(run => {
    const employee = employees.find(emp => emp.id === run.employee_id);
    const employeeName = employee ? employee.name : `Employee #${run.employee_id}`;
    
    const matchesSearch = run.employee_id?.toString().includes(searchTerm) || 
                         run.month?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMonth = !selectedMonth || run.month === selectedMonth;
    return matchesSearch && matchesMonth;
  });

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? employee.name : `Employee #${employeeId}`;
  };

  const handleViewPayroll = async (run) => {
    try {
      // Generate detailed payslip view
      const res = await api.post(`/api/payroll/payslips/generate/${run.employee_id}`, null, {
        params: { month: `${run.year || new Date().getFullYear()}-${String(months.indexOf(run.month) + 1).padStart(2, '0')}` }
      });
      
      const payslip = res.data;
      alert(`Complete Payslip:\n\nEmployee: ${payslip.employee_name}\nCode: ${payslip.employee_code}\n\nEarnings:\nBasic: ₹${payslip.earnings.basic.toLocaleString()}\nHRA: ₹${payslip.earnings.hra.toLocaleString()}\nAllowances: ₹${payslip.earnings.allowances.toLocaleString()}\nGross: ₹${payslip.earnings.gross.toLocaleString()}\n\nDeductions:\nPF: ₹${payslip.deductions.pf.toLocaleString()}\nESI: ₹${payslip.deductions.esi.toLocaleString()}\nPT: ₹${payslip.deductions.pt.toLocaleString()}\n\nNet Salary: ₹${payslip.net_salary.toLocaleString()}`);
    } catch (error) {
      const employee = employees.find(emp => emp.id === run.employee_id);
      alert(`Payroll Details:\n\nEmployee: ${employee?.name || 'Unknown'}\nMonth: ${run.month}\nPresent Days: ${run.present_days || 0}\nLOP Days: ${run.lop_days || 0}\nGross: ₹${run.gross_salary?.toLocaleString() || 0}\nNet: ₹${run.net_salary?.toLocaleString() || 0}`);
    }
  };
  
  const handleDownloadPayslip = async (run) => {
    try {
      // Generate bank file for this employee
      const monthStr = `${run.year || new Date().getFullYear()}-${String(months.indexOf(run.month) + 1).padStart(2, '0')}`;
      const res = await api.get(`/api/payroll/payslips/bank-file/${monthStr}`);
      
      const employeeRecord = res.data.bank_records.find(r => r.employee_code === employees.find(e => e.id === run.employee_id)?.employee_code);
      
      if (employeeRecord) {
        alert(`Bank Transfer Details:\n\nEmployee: ${employeeRecord.employee_name}\nCode: ${employeeRecord.employee_code}\nAccount: ${employeeRecord.account_number}\nAmount: ₹${employeeRecord.amount.toLocaleString()}\nIFSC: ${employeeRecord.ifsc}`);
      } else {
        alert('Bank file generated. Download functionality will be implemented.');
      }
    } catch (error) {
      alert('Bank file generation failed.');
    }
  };

  const syncAttendanceToPayroll = async (employeeId, month, year) => {
    try {
      // This would trigger the backend sync function
      const monthDate = new Date(year, months.indexOf(month), 1);
      await api.post('/api/attendance/sync-payroll', {
        employee_id: employeeId,
        date: monthDate.toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Sync error:', error);
    }
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Payroll Run</h2>
            <p className="text-gray-600 mt-1">Process monthly payroll using attendance & leave data</p>
          </div>
          <button 
            onClick={() => setShowRunModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Play size={16} />
            Run Payroll
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search by employee or month..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
            />
          </div>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Months</option>
            {months.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-6 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">Active Employees</p>
                <p className="text-2xl font-semibold text-blue-900">{employees.filter(e => e.status === 'Active').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <Play className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">Completed Runs</p>
                <p className="text-2xl font-semibold text-green-900">{runs.filter(r => r.status === 'Completed').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-600">This Month</p>
                <p className="text-2xl font-semibold text-yellow-900">{runs.filter(r => r.month === months[new Date().getMonth()]).length}</p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <Download className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-600">Total Runs</p>
                <p className="text-2xl font-semibold text-purple-900">{runs.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Present Days</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LOP Days</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Salary</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Salary</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRuns.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <Play className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No payroll runs yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm || selectedMonth ? "No payroll runs found matching your filters." : "Start by running payroll for your employees."}
                    </p>
                    {!searchTerm && !selectedMonth && (
                      <div className="mt-6">
                        <button 
                          onClick={() => setShowRunModal(true)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto transition-colors"
                        >
                          <Play size={16} />
                          Run First Payroll
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredRuns.map((run) => (
                  <tr key={run.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{getEmployeeName(run.employee_id)}</div>
                      <div className="text-sm text-gray-500">ID: {run.employee_id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{run.month} {run.year || new Date().getFullYear()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{run.present_days || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{run.lop_days || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">₹{run.gross_salary?.toLocaleString() || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">₹{run.net_salary?.toLocaleString() || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        run.status === "Completed" ? "bg-green-100 text-green-800" :
                        run.status === "Processing" ? "bg-yellow-100 text-yellow-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {run.status || "Completed"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleViewPayroll(run)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => handleDownloadPayslip(run)}
                          className="text-green-600 hover:text-green-900 p-1 rounded"
                          title="Download Payslip"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Stats Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>Total Runs: {runs.length}</span>
          <span>Completed: {runs.filter(r => r.status === "Completed").length}</span>
          <span>Active Employees: {employees.filter(e => e.status === 'Active').length}</span>
        </div>
      </div>

      {/* Run Payroll Modal */}
      {showRunModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Run Payroll</h3>
            <form onSubmit={handleRunPayroll} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <select
                  value={runData.month}
                  onChange={(e) => setRunData({...runData, month: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Month</option>
                  {months.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <input
                  type="number"
                  value={runData.year}
                  onChange={(e) => setRunData({...runData, year: parseInt(e.target.value)})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRunModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Processing..." : "Run Payroll"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
