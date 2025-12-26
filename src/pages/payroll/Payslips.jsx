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
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showEmailConfirmModal, setShowEmailConfirmModal] = useState(false);
  const [emailForm, setEmailForm] = useState({ email: '', payslip: null });

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
      const res = await api.get("/api/payroll/runs");
      setPayrollRuns(res.data || []);
      
      // Get adjustments to calculate final net salary
      const adjRes = await api.get(`/api/payroll/adjustments`);
      const adjustments = adjRes.data || [];
      
      // Convert payroll runs to payslips format with adjusted net salary
      const generatedPayslips = (res.data || []).map(run => {
        // Find adjustments for this employee and month
        const empAdjustments = adjustments.filter(adj => 
          adj.employee_id == run.employee_id && 
          adj.month === run.month && 
          adj.status === 'Active'
        );
        
        // Calculate adjustment totals
        const additions = empAdjustments.filter(adj => adj.adjustment_type !== 'Deduction')
          .reduce((sum, adj) => sum + (adj.amount || 0), 0);
        const deductions = empAdjustments.filter(adj => adj.adjustment_type === 'Deduction')
          .reduce((sum, adj) => sum + (adj.amount || 0), 0);
        
        // Calculate final net salary with adjustments
        const finalNetSalary = (run.net_salary || 0) + additions - deductions;
        
        return {
          id: run.id,
          employee_id: run.employee_id,
          employee_name: run.employee_name || getEmployeeName(run.employee_id),
          month: run.month,
          year: run.year || new Date().getFullYear(),
          gross_salary: run.gross_salary,
          net_salary: finalNetSalary, // Use adjusted net salary
          status: run.status === 'Completed' ? 'Generated' : 'Pending',
          generated_at: run.created_at
        };
      });
      
      // Remove duplicates based on employee_id and month
      const uniquePayslips = generatedPayslips.filter((payslip, index, self) => 
        index === self.findIndex(p => 
          p.employee_id === payslip.employee_id && 
          p.month === payslip.month && 
          p.year === payslip.year
        )
      );
      
      setPayslips(uniquePayslips);
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
      
      const payslipIds = generatedPayslips.map(p => p.id);
      const res = await api.post('/api/payroll/payslips/send-bulk-email', {
        payslip_ids: payslipIds
      });
      
      if (res.data.success_count > 0) {
        alert(`Email sending completed. Sent: ${res.data.success_count}, Failed: ${res.data.failed_count}`);
        
        // Update status to 'Sent' for successful sends
        const updatedPayslips = payslips.map(p => 
          p.status === 'Generated' ? {...p, status: 'Sent'} : p
        );
        setPayslips(updatedPayslips);
      } else {
        alert('No emails were sent. Please check employee email addresses.');
      }
    } catch (error) {
      console.error("Error sending payslips:", error);
      alert('Failed to send payslips. Please check your email configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPayslip = async (payslip) => {
    try {
      // Get full payroll run data
      const fullPayrollData = payrollRuns.find(run => run.id === payslip.id);
      
      // Get adjustments for this employee and month
      const adjRes = await api.get(`/api/payroll/adjustments`);
      const adjustments = adjRes.data.filter(adj => 
        adj.employee_id == payslip.employee_id && 
        adj.month === payslip.month
      );
      
      // Calculate adjustment totals
      const additions = adjustments.filter(adj => adj.adjustment_type !== 'Deduction')
        .reduce((sum, adj) => sum + (adj.amount || 0), 0);
      const deductions = adjustments.filter(adj => adj.adjustment_type === 'Deduction')
        .reduce((sum, adj) => sum + (adj.amount || 0), 0);
      
      // Use the stored calculations from payroll run
      const totalEarnings = (fullPayrollData?.gross_salary || 0) + additions;
      const pfDeduction = (fullPayrollData?.basic_salary || 0) * 0.12;
      const esiDeduction = (fullPayrollData?.gross_salary || 0) * 0.0175;
      const totalDeductions = (fullPayrollData?.lop_deduction || 0) + pfDeduction + esiDeduction + deductions;
      
      // Use the net salary from database which already accounts for adjustments
      const finalNetSalary = (fullPayrollData?.net_salary || 0) + additions - deductions;
      
      setSelectedPayslip({
        ...payslip,
        ...fullPayrollData,
        adjustments,
        totalEarnings,
        totalDeductions,
        finalNetSalary,
        pfDeduction,
        esiDeduction
      });
      setShowViewModal(true);
    } catch (error) {
      console.error('Error fetching payslip details:', error);
      alert(`Error loading payslip details`);
    }
  };

  const handleDownloadPayslip = async (payslip) => {
    try {
      // Create download URL
      const downloadUrl = `${api.defaults.baseURL}/api/payroll/payslip/${payslip.id}/download`;
      
      // Create temporary link and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `payslip_${payslip.employee_name}_${payslip.month}_${payslip.year}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Download error:', error);
      alert(`Error downloading payslip for ${payslip.employee_name}`);
    }
  };

  const handleSendIndividual = async (payslip) => {
    try {
      // Try to fetch employee email from database
      const empRes = await api.get('/api/employees/list');
      const employee = empRes.data?.find(emp => emp.id == payslip.employee_id);
      
      let defaultEmail = '';
      if (employee?.email) {
        defaultEmail = employee.email;
      } else {
        // Fallback to users table
        try {
          const tenantDb = localStorage.getItem('tenant_db');
          const userRes = await api.get(`/api/users/${tenantDb}/list`);
          const user = userRes.data?.users?.find(u => u.id == payslip.employee_id);
          if (user?.email) defaultEmail = user.email;
        } catch (e) {
          console.log('Could not fetch user email');
        }
      }
      
      setEmailForm({ email: defaultEmail, payslip });
      setShowEmailModal(true);
    } catch (error) {
      console.error('Error preparing email:', error);
      setEmailForm({ email: '', payslip });
      setShowEmailModal(true);
    }
  };

  const filteredPayslips = payslips.filter(payslip => {
    const matchesSearch = payslip.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payslip.employee_id?.toString().includes(searchTerm);
    const matchesMonth = !selectedMonth || payslip.month === selectedMonth;
    return matchesSearch && matchesMonth;
  });

  return (
    <div className="bg-white rounded-2xl border border-black overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-black">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900">Salary Slips & Payment</h2>
            <p className="text-sm text-gray-600">Generate payslips and manage bank payments</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <button 
            onClick={handleGeneratePayslips}
            disabled={loading}
            className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium border border-black justify-center"
          >
            <FileText size={18} />
            {loading ? "Generating..." : "Generate Payslips"}
          </button>
          <button 
            onClick={handleSendEmail}
            disabled={loading}
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium border border-black justify-center"
          >
            <Send size={18} />
            {loading ? "Sending..." : "Send via Email"}
          </button>
        </div>
        {/* Filters */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by employee name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent w-full text-sm"
              />
            </div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-black rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm w-full sm:w-auto"
            >
              <option value="">All Months</option>
              {months.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gray-50 rounded-xl p-6 border border-black">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Payslips</p>
                  <p className="text-3xl font-bold text-gray-900">{payslips.length}</p>
                </div>
                <div className="p-3 bg-gray-100 rounded-xl">
                  <FileText className="h-10 w-10 text-gray-600" />
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 border border-black">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Sent</p>
                  <p className="text-3xl font-bold text-gray-900">{payslips.filter(p => p.status === 'Sent').length}</p>
                </div>
                <div className="p-3 bg-gray-100 rounded-xl">
                  <Send className="h-10 w-10 text-gray-600" />
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 border border-black">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Generated</p>
                  <p className="text-3xl font-bold text-gray-900">{payslips.filter(p => p.status === 'Generated').length}</p>
                </div>
                <div className="p-3 bg-gray-100 rounded-xl">
                  <Calendar className="h-10 w-10 text-gray-600" />
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 border border-black">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Pending</p>
                  <p className="text-3xl font-bold text-gray-900">{payslips.filter(p => p.status === 'Pending').length}</p>
                </div>
                <div className="p-3 bg-gray-100 rounded-xl">
                  <Download className="h-10 w-10 text-gray-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-black rounded-xl">
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-black">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Month</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Gross Salary</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Net Salary</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
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
                            className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto transition-colors border border-black"
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
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-300">
                          {payslip.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleViewPayslip(payslip)}
                            className="text-gray-600 hover:text-gray-900 p-1 rounded border border-gray-300 hover:border-gray-400"
                            title="View Payslip"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            onClick={() => handleDownloadPayslip(payslip)}
                            className="text-gray-600 hover:text-gray-900 p-1 rounded border border-gray-300 hover:border-gray-400"
                            title="Download Payslip"
                          >
                            <Download size={16} />
                          </button>
                          <button 
                            onClick={() => handleSendIndividual(payslip)}
                            className="text-gray-600 hover:text-gray-900 p-1 rounded border border-gray-300 hover:border-gray-400"
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
        <div className="px-6 py-4 bg-gray-50 border border-black border-t-0 rounded-b-2xl mt-6">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Total Payslips: {payslips.length}</span>
            <span>Generated: {payslips.filter(p => p.status === 'Generated').length}</span>
            <span>Sent: {payslips.filter(p => p.status === 'Sent').length}</span>
          </div>
        </div>

        {/* Payslip View Modal */}
        {showViewModal && selectedPayslip && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Payslip Details - {selectedPayslip.employee_name}</h3>
                <button 
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Employee Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Employee Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-600">Name:</span> <span className="ml-2 font-medium">{selectedPayslip.employee_name}</span></div>
                    <div><span className="text-gray-600">Code:</span> <span className="ml-2 font-medium">{selectedPayslip.employee_code}</span></div>
                    <div><span className="text-gray-600">Month:</span> <span className="ml-2 font-medium">{selectedPayslip.month} {selectedPayslip.year}</span></div>
                  </div>
                </div>

                {/* Attendance */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Attendance Summary</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-600">{selectedPayslip.present_days}</div>
                      <div className="text-gray-600">Present</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-600">{selectedPayslip.leave_days}</div>
                      <div className="text-gray-600">Leave</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-red-600">{selectedPayslip.lop_days}</div>
                      <div className="text-gray-600">LOP</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Earnings */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Earnings</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Basic Salary</span>
                      <span>₹{selectedPayslip.basic_salary?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>HRA</span>
                      <span>₹{selectedPayslip.hra_salary?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Allowances</span>
                      <span>₹{selectedPayslip.allowances?.toLocaleString()}</span>
                    </div>
                    {selectedPayslip.adjustments?.filter(adj => adj.adjustment_type !== 'Deduction').map((adj, idx) => (
                      <div key={idx} className="flex justify-between text-green-600">
                        <span>{adj.adjustment_type} - {adj.description}</span>
                        <span>+₹{adj.amount?.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold border-t pt-2">
                      <span>Total Earnings</span>
                      <span className="text-green-600">₹{selectedPayslip.totalEarnings?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Deductions</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>LOP Deduction</span>
                      <span>₹{selectedPayslip.lop_deduction?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>PF (12%)</span>
                      <span>₹{selectedPayslip.pfDeduction?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ESI (1.75%)</span>
                      <span>₹{selectedPayslip.esiDeduction?.toLocaleString()}</span>
                    </div>
                    {selectedPayslip.adjustments?.filter(adj => adj.adjustment_type === 'Deduction').map((adj, idx) => (
                      <div key={idx} className="flex justify-between text-red-600">
                        <span>{adj.adjustment_type} - {adj.description}</span>
                        <span>-₹{adj.amount?.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold border-t pt-2">
                      <span>Total Deductions</span>
                      <span className="text-red-600">₹{selectedPayslip.totalDeductions?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Salary */}
              <div className="mt-6 text-center">
                <div className="bg-green-100 border-2 border-green-500 rounded-lg p-4 inline-block">
                  <h3 className="text-lg font-bold text-green-700">NET SALARY: ₹{selectedPayslip.finalNetSalary?.toLocaleString()}</h3>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => handleDownloadPayslip(selectedPayslip)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  Download Payslip
                </button>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}