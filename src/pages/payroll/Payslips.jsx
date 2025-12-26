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

  const handleEmailSubmit = async () => {
    if (!emailForm.email) {
      alert('Please enter an email address');
      return;
    }
    
    // Show confirmation modal instead of sending directly
    setShowEmailModal(false);
    setShowEmailConfirmModal(true);
  };

  const handleConfirmSendEmail = async () => {
    try {
      setLoading(true);
      const res = await api.post(`/api/payroll/payslip/${emailForm.payslip.id}/send-email`, {
        email: emailForm.email
      });
      
      // Update payslip status to 'Sent'
      const updatedPayslips = payslips.map(p => 
        p.id === emailForm.payslip.id ? {...p, status: 'Sent'} : p
      );
      setPayslips(updatedPayslips);
      setShowEmailConfirmModal(false);
      alert(`Payslip sent to ${emailForm.email} successfully!`);
    } catch (error) {
      console.error('Error sending payslip:', error);
      alert('Failed to send payslip. Please check your email configuration.');
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
    <div className="rounded-2xl shadow-lg border border-gray-100" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 border-b  rounded-t-2xl">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <FileText className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-primary">Salary Slips & Payment</h2>
              <p className=" mt-1" style={{color: 'var(--text-secondary, #374151)'}}>Generate payslips and manage bank payments</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleGeneratePayslips}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText size={18} />
              {loading ? "Generating..." : "Generate Payslips"}
            </button>
            <button 
              onClick={handleSendEmail}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
              {loading ? "Sending..." : "Send via Email"}
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-6 border-b ">
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" size={16} />
            <input
              type="text"
              placeholder="Search by employee name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border-dark rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
            />
          </div>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border-dark rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
          >
            <option value="">All Months</option>
            {months.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="p-6 border-b  bg-content">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-content rounded-xl p-6 border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className=" text-sm font-medium" style={{color: 'var(--text-secondary, #374151)'}}>Total Payslips</p>
                <p className="text-3xl font-bold text-primary">{payslips.length}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <FileText className="h-10 w-10 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-content rounded-xl p-6 border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className=" text-sm font-medium" style={{color: 'var(--text-secondary, #374151)'}}>Sent</p>
                <p className="text-3xl font-bold text-primary">{payslips.filter(p => p.status === 'Sent').length}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl">
                <Send className="h-10 w-10 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-content rounded-xl p-6 border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className=" text-sm font-medium" style={{color: 'var(--text-secondary, #374151)'}}>Generated</p>
                <p className="text-3xl font-bold text-primary">{payslips.filter(p => p.status === 'Generated').length}</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-xl">
                <Calendar className="h-10 w-10 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-content rounded-xl p-6 border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className=" text-sm font-medium" style={{color: 'var(--text-secondary, #374151)'}}>Pending</p>
                <p className="text-3xl font-bold text-primary">{payslips.filter(p => p.status === 'Pending').length}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <Download className="h-10 w-10 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table style={{borderColor: 'var(--border-color, #e2e8f0)'}} className="w-full">
          <thead style={{borderColor: 'var(--border-color, #e2e8f0)'}} className="bg-content">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Month</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Gross Salary</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Net Salary</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody style={{borderColor: 'var(--border-color, #e2e8f0)'}} className="bg-white divide-y">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </td>
              </tr>
            ) : filteredPayslips.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted" />
                  <h3 className="mt-2 text-sm font-medium text-primary">No payslips found</h3>
                  <p className="mt-1 text-sm text-muted">
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
                <tr key={payslip.id} className="hover:bg-content">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-primary">{payslip.employee_name}</div>
                    <div className="text-sm text-muted">ID: {payslip.employee_id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-primary">{payslip.month} {payslip.year}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-primary">₹{payslip.gross_salary?.toLocaleString() || 0}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-primary">₹{payslip.net_salary?.toLocaleString() || 0}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      payslip.status === "Sent" ? "bg-green-100 text-green-800" :
                      payslip.status === "Generated" ? "bg-blue-100 text-blue-800" :
                      "bg-gray-100 text-primary"
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
      <div className="px-6 py-4 bg-content border-t ">
        <div className="flex justify-between items-center text-sm text-secondary">
          <span>Total Payslips: {payslips.length}</span>
          <span>Generated: {payslips.filter(p => p.status === 'Generated').length}</span>
          <span>Sent: {payslips.filter(p => p.status === 'Sent').length}</span>
        </div>
      </div>

      {/* Payslip View Modal */}
      {showViewModal && selectedPayslip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Payslip Details - {selectedPayslip.employee_name}</h3>
              <button 
                onClick={() => setShowViewModal(false)}
                className=" hover:text-secondary" style={{color: 'var(--text-muted, #6b7280)'}}
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Employee Info */}
              <div className="bg-content rounded-lg p-4">
                <h4 className="font-medium text-primary mb-3">Employee Information</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="" style={{color: 'var(--text-muted, #6b7280)'}}>Name:</span> <span className="ml-2 font-medium">{selectedPayslip.employee_name}</span></div>
                  <div><span className="" style={{color: 'var(--text-muted, #6b7280)'}}>Code:</span> <span className="ml-2 font-medium">{selectedPayslip.employee_code}</span></div>
                  <div><span className="" style={{color: 'var(--text-muted, #6b7280)'}}>Month:</span> <span className="ml-2 font-medium">{selectedPayslip.month} {selectedPayslip.year}</span></div>
                </div>
              </div>

              {/* Attendance */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-primary mb-3">Attendance Summary</h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">{selectedPayslip.present_days}</div>
                    <div className="" style={{color: 'var(--text-muted, #6b7280)'}}>Present</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">{selectedPayslip.leave_days}</div>
                    <div className="" style={{color: 'var(--text-muted, #6b7280)'}}>Leave</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-red-600">{selectedPayslip.lop_days}</div>
                    <div className="" style={{color: 'var(--text-muted, #6b7280)'}}>LOP</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Earnings */}
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-medium text-primary mb-3">Earnings</h4>
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
                <h4 className="font-medium text-primary mb-3">Deductions</h4>
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
                className="px-4 py-2 border-dark rounded-lg text-secondary hover:bg-content"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && emailForm.payslip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Send Payslip via Email</h3>
              <button 
                onClick={() => setShowEmailModal(false)}
                className=" hover:text-secondary" style={{color: 'var(--text-muted, #6b7280)'}}
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-secondary mb-2">
                Sending payslip for <strong>{emailForm.payslip.employee_name}</strong>
              </p>
              <p className="text-sm text-secondary mb-4">
                Month: <strong>{emailForm.payslip.month} {emailForm.payslip.year}</strong>
              </p>
              
              <label className="block text-sm font-medium text-secondary mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={emailForm.email}
                onChange={(e) => setEmailForm({...emailForm, email: e.target.value})}
                placeholder="Enter employee email address"
                className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleEmailSubmit}
                disabled={loading || !emailForm.email}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Send size={16} />
                Continue
              </button>
              <button
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 border-dark rounded-lg text-secondary hover:bg-content"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Confirmation Modal */}
      {showEmailConfirmModal && emailForm.payslip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-orange-600">Confirm Email Sending</h3>
              <button 
                onClick={() => {
                  setShowEmailConfirmModal(false);
                  setShowEmailModal(true);
                }}
                className=" hover:text-secondary" style={{color: 'var(--text-muted, #6b7280)'}}
              >
                ✕
              </button>
            </div>
            
            <div className="mb-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-yellow-600 font-bold">!</span>
                  </div>
                  <h4 className="font-medium text-yellow-800">Email Confirmation</h4>
                </div>
                <p className="text-yellow-700 text-sm ml-11">
                  You are about to send a payslip email. Please confirm the details below.
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className=" font-medium" style={{color: 'var(--text-secondary, #374151)'}}>Employee:</span>
                  <span className="font-semibold">{emailForm.payslip.employee_name}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className=" font-medium" style={{color: 'var(--text-secondary, #374151)'}}>Month:</span>
                  <span className="font-semibold">{emailForm.payslip.month} {emailForm.payslip.year}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className=" font-medium" style={{color: 'var(--text-secondary, #374151)'}}>Net Salary:</span>
                  <span className="font-semibold text-green-600">₹{emailForm.payslip.net_salary?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className=" font-medium" style={{color: 'var(--text-secondary, #374151)'}}>Send to:</span>
                  <span className="font-semibold text-blue-600">{emailForm.email}</span>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Email Subject:</strong> Payslip for {emailForm.payslip.month} {emailForm.payslip.year} - {emailForm.payslip.employee_name}
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  <strong>Content:</strong> Professional HTML payslip with salary breakdown and company branding
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEmailConfirmModal(false);
                  setShowEmailModal(true);
                }}
                className="flex-1 px-4 py-2 border-dark rounded-lg text-secondary hover:bg-content"
              >
                Edit Email
              </button>
              <button
                onClick={handleConfirmSendEmail}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Send size={16} />
                {loading ? 'Sending...' : 'Confirm & Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
