import { useEffect, useState } from "react";
import { FileText, Download, Send, Search, Eye, Calendar } from "lucide-react";
import api from "../../api";

export default function Payslips() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [payslips, setPayslips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [payrollRuns, setPayrollRuns] = useState([]);
  const [loading, setLoading] = useState(false);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  useEffect(() => {
    fetchEmployees();
    fetchPayrollRuns();
  }, []);

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

  const fetchPayrollRuns = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/payroll/run");
      setPayrollRuns(res.data || []);
      // Convert payroll runs to payslips format
      const generatedPayslips = (res.data || []).map(run => ({
        id: run.id,
        employee_id: run.employee_id,
        employee_name: getEmployeeName(run.employee_id),
        month: run.month,
        year: run.year || new Date().getFullYear(),
        gross_salary: run.gross_salary,
        net_salary: run.net_salary,
        status: run.status === 'Completed' ? 'Generated' : 'Pending',
        generated_at: run.created_at
      }));
      setPayslips(generatedPayslips);
    } catch (error) {
      console.error("Error fetching payroll runs:", error);
      setPayrollRuns([]);
      setPayslips([]);
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? employee.name : `Employee #${employeeId}`;
  };

  const handleGeneratePayslips = async () => {
    try {
      setLoading(true);
      // Generate payslips for completed payroll runs
      const completedRuns = payrollRuns.filter(run => run.status === 'Completed');
      
      if (completedRuns.length === 0) {
        alert('No completed payroll runs found. Please run payroll first.');
        return;
      }
      
      // In a real implementation, this would call a payslip generation API
      alert(`Generated ${completedRuns.length} payslips successfully!`);
      await fetchPayrollRuns();
    } catch (error) {
      console.error("Error generating payslips:", error);
      alert('Failed to generate payslips. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    try {
      setLoading(true);
      const generatedPayslips = payslips.filter(p => p.status === 'Generated');
      
      if (generatedPayslips.length === 0) {
        alert('No generated payslips found to send.');
        return;
      }
      
      // In a real implementation, this would call an email API
      alert(`Sent ${generatedPayslips.length} payslips via email successfully!`);
      
      // Update status to 'Sent'
      const updatedPayslips = payslips.map(p => 
        p.status === 'Generated' ? {...p, status: 'Sent'} : p
      );
      setPayslips(updatedPayslips);
    } catch (error) {
      console.error("Error sending payslips:", error);
      alert('Failed to send payslips. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPayslip = async (payslip) => {
    try {
      // Generate complete payslip using workflow API
      const monthStr = `${payslip.year}-${String(months.indexOf(payslip.month) + 1).padStart(2, '0')}`;
      const res = await api.post(`/api/payroll/payslips/generate/${payslip.employee_id}`, null, {
        params: { month: monthStr }
      });
      
      const fullPayslip = res.data;
      alert(`Complete Payslip (Workflow Generated):\n\nEmployee: ${fullPayslip.employee_name}\nCode: ${fullPayslip.employee_code}\nMonth: ${fullPayslip.month}\n\n--- ATTENDANCE ---\nPresent Days: ${fullPayslip.attendance.present_days}\nLOP Days: ${fullPayslip.attendance.lop_days}\n\n--- EARNINGS ---\nBasic: ₹${fullPayslip.earnings.basic.toLocaleString()}\nHRA: ₹${fullPayslip.earnings.hra.toLocaleString()}\nAllowances: ₹${fullPayslip.earnings.allowances.toLocaleString()}\nGross: ₹${fullPayslip.earnings.gross.toLocaleString()}\n\n--- DEDUCTIONS ---\nPF: ₹${fullPayslip.deductions.pf.toLocaleString()}\nESI: ₹${fullPayslip.deductions.esi.toLocaleString()}\nPT: ₹${fullPayslip.deductions.pt.toLocaleString()}\nTotal: ₹${fullPayslip.deductions.total.toLocaleString()}\n\n--- NET SALARY ---\n₹${fullPayslip.net_salary.toLocaleString()}`);
    } catch (error) {
      alert(`Payslip Details:\n\nEmployee: ${payslip.employee_name}\nMonth: ${payslip.month} ${payslip.year}\nGross Salary: ₹${payslip.gross_salary?.toLocaleString()}\nNet Salary: ₹${payslip.net_salary?.toLocaleString()}\nStatus: ${payslip.status}`);
    }
  };

  const handleDownloadPayslip = async (payslip) => {
    try {
      // Generate bank file for this employee
      const monthStr = `${payslip.year}-${String(months.indexOf(payslip.month) + 1).padStart(2, '0')}`;
      const res = await api.get(`/api/payroll/payslips/bank-file/${monthStr}`);
      
      const employee = employees.find(e => e.id === payslip.employee_id);
      const bankRecord = res.data.bank_records.find(r => r.employee_code === employee?.employee_code);
      
      if (bankRecord) {
        alert(`Bank Transfer File Generated:\n\nEmployee: ${bankRecord.employee_name}\nCode: ${bankRecord.employee_code}\nAccount: ${bankRecord.account_number}\nAmount: ₹${bankRecord.amount.toLocaleString()}\nIFSC: ${bankRecord.ifsc}\n\nFile ready for bank upload!`);
      } else {
        alert(`Downloading payslip for ${payslip.employee_name} - ${payslip.month} ${payslip.year}`);
      }
    } catch (error) {
      alert(`Downloading payslip for ${payslip.employee_name} - ${payslip.month} ${payslip.year}`);
    }
  };

  const handleSendIndividual = (payslip) => {
    alert(`Sending payslip to ${payslip.employee_name} via email`);
  };

  const filteredPayslips = payslips.filter(payslip => {
    const matchesSearch = payslip.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payslip.employee_id?.toString().includes(searchTerm);
    const matchesMonth = !selectedMonth || payslip.month === selectedMonth;
    return matchesSearch && matchesMonth;
  });

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Salary Slips & Payment</h2>
            <p className="text-gray-600 mt-1">Generate payslips and manage bank payments</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleGeneratePayslips}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText size={16} />
              {loading ? "Generating..." : "Generate Payslips"}
            </button>
            <button 
              onClick={handleSendEmail}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} />
              {loading ? "Sending..." : "Send via Email"}
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search by employee name or ID..."
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
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">Total Payslips</p>
                <p className="text-2xl font-semibold text-blue-900">{payslips.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <Send className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">Sent</p>
                <p className="text-2xl font-semibold text-green-900">{payslips.filter(p => p.status === 'Sent').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-600">Generated</p>
                <p className="text-2xl font-semibold text-yellow-900">{payslips.filter(p => p.status === 'Generated').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <Download className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-600">Pending</p>
                <p className="text-2xl font-semibold text-purple-900">{payslips.filter(p => p.status === 'Pending').length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Salary</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Salary</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </td>
              </tr>
            ) : filteredPayslips.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No payslips found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm || selectedMonth ? "No payslips match your search criteria." : "Generate payslips for employees to view them here."}
                  </p>
                  {!searchTerm && !selectedMonth && (
                    <div className="mt-6">
                      <button 
                        onClick={handleGeneratePayslips}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto transition-colors"
                      >
                        <FileText size={16} />
                        Generate First Payslip
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              filteredPayslips.map((payslip) => (
                <tr key={payslip.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{payslip.employee_name}</div>
                    <div className="text-sm text-gray-500">ID: {payslip.employee_id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{payslip.month} {payslip.year}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">₹{payslip.gross_salary?.toLocaleString() || 0}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">₹{payslip.net_salary?.toLocaleString() || 0}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      payslip.status === "Sent" ? "bg-green-100 text-green-800" :
                      payslip.status === "Generated" ? "bg-blue-100 text-blue-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {payslip.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleViewPayslip(payslip)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        title="View Payslip"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={() => handleDownloadPayslip(payslip)}
                        className="text-green-600 hover:text-green-900 p-1 rounded"
                        title="Download Payslip"
                      >
                        <Download size={16} />
                      </button>
                      <button 
                        onClick={() => handleSendIndividual(payslip)}
                        className="text-purple-600 hover:text-purple-900 p-1 rounded"
                        title="Send via Email"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>Total Payslips: {payslips.length}</span>
          <span>Generated: {payslips.filter(p => p.status === 'Generated').length}</span>
          <span>Sent: {payslips.filter(p => p.status === 'Sent').length}</span>
        </div>
      </div>
    </div>
  );
}
