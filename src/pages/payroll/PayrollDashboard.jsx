import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { DollarSign, Users, Calculator, FileText } from 'lucide-react';
import api from '../../api';

const PayrollDashboard = () => {
  const navigate = useNavigate();
  const [payrollData, setPayrollData] = useState({
    totalPayroll: 0,
    employeesProcessed: 0,
    totalDeductions: 0,
    netPayable: 0,
    processed: 0,
    pending: 0,
    onHold: 0
  });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayrollData();
  }, []);

  const fetchPayrollData = async () => {
    try {
      setLoading(true);
      const tenant_db = 'nutryah';
      
      // Fetch users for employee count
      const usersRes = await api.get(`/hospitals/users/${tenant_db}/list`).catch(() => ({ data: { users: [] } }));
      const users = usersRes.data?.users || [];
      
      // Fetch departments
      const deptRes = await api.get(`/hospitals/departments/${tenant_db}/list`).catch(() => ({ data: { departments: [] } }));
      const deptData = deptRes.data?.departments || [];
      
      // Fetch payroll runs
      const payrollRunRes = await api.get(`/api/payroll/runs`).catch(() => ({ data: [] }));
      const payrollRuns = payrollRunRes.data || [];
      
      // Fetch payroll summary
      const summaryRes = await api.get(`/api/payroll/reports/summary`).catch(() => ({ data: {} }));
      const summary = summaryRes.data || {};
      
      console.log('Payroll runs:', payrollRuns);
      console.log('Payroll summary:', summary);
      
      // Calculate actual payroll data
      const totalEmployees = users.length;
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      
      // Use summary data if available, otherwise calculate from payroll runs
      const totalPayroll = summary.total_payroll || payrollRuns.reduce((sum, run) => sum + (run.gross_salary || 0), 0);
      const totalDeductions = summary.total_deductions || payrollRuns.reduce((sum, run) => sum + (run.lop_deduction || 0) + (run.basic_salary || 0) * 0.12 + (run.gross_salary || 0) * 0.0175, 0);
      const netPayable = summary.net_payable || payrollRuns.reduce((sum, run) => sum + (run.net_salary || 0), 0);
      
      // Calculate salary components from actual payroll data
      const totalBasic = payrollRuns.reduce((sum, run) => sum + (run.basic_salary || 0), 0);
      const totalHRA = payrollRuns.reduce((sum, run) => sum + (run.hra_salary || 0), 0);
      const totalAllowances = payrollRuns.reduce((sum, run) => sum + (run.allowances || 0), 0);
      const totalGross = payrollRuns.reduce((sum, run) => sum + (run.gross_salary || 0), 0);
      
      // Calculate deduction components
      const totalPF = payrollRuns.reduce((sum, run) => sum + (run.basic_salary || 0) * 0.12, 0);
      const totalESI = payrollRuns.reduce((sum, run) => sum + (run.gross_salary || 0) * 0.0175, 0);
      const totalLOP = payrollRuns.reduce((sum, run) => sum + (run.lop_deduction || 0), 0);
      const totalTDS = payrollRuns.reduce((sum, run) => sum + (run.gross_salary || 0) * 0.10, 0);
      
      // Calculate department-wise payroll from actual payroll runs
      const departmentPayroll = deptData.map(dept => {
        const deptEmployees = users.filter(user => 
          user.department_name === dept.name || 
          user.department === dept.name ||
          user.department_id === dept.id
        );
        
        // Get actual payroll data for this department
        const deptPayrollRuns = payrollRuns.filter(run => {
          const employee = users.find(u => u.id == run.employee_id);
          return employee && (
            employee.department_name === dept.name || 
            employee.department === dept.name ||
            employee.department_id === dept.id
          );
        });
        
        const grossSalary = deptPayrollRuns.reduce((sum, run) => sum + (run.gross_salary || 0), 0);
        const netSalary = deptPayrollRuns.reduce((sum, run) => sum + (run.net_salary || 0), 0);
        const deductions = grossSalary - netSalary;
        
        return {
          name: dept.name,
          employees: deptEmployees.length,
          grossSalary: `₹${(grossSalary / 100000).toFixed(1)}L`,
          deductions: `₹${(deductions / 100000).toFixed(1)}L`,
          netPayable: `₹${(netSalary / 100000).toFixed(1)}L`
        };
      });
      
      // Calculate processing status from payroll runs or use defaults
      const currentMonthRuns = payrollRuns.filter(run => 
        run.month === 'December' && run.year === 2025
      );
      
      const processedCount = currentMonthRuns.filter(run => run.status === 'Completed').length;
      const pendingCount = currentMonthRuns.filter(run => run.status === 'Pending').length;
      const onHoldCount = currentMonthRuns.filter(run => run.status === 'On Hold').length;
      
      // Use actual counts or defaults
      const processed = processedCount;
      const pending = pendingCount;
      const onHold = onHoldCount;
      
      setPayrollData({
        totalPayroll: `₹${(totalPayroll / 10000000).toFixed(2)}Cr`,
        employeesProcessed: processed,
        totalDeductions: `₹${(totalDeductions / 100000).toFixed(0)}L`,
        netPayable: `₹${(netPayable / 10000000).toFixed(1)}Cr`,
        processed,
        pending,
        onHold,
        // Add salary component data
        salaryComponents: {
          basic: { amount: totalBasic, percentage: totalGross > 0 ? Math.round((totalBasic / totalGross) * 100) : 0 },
          hra: { amount: totalHRA, percentage: totalGross > 0 ? Math.round((totalHRA / totalGross) * 100) : 0 },
          allowances: { amount: totalAllowances, percentage: totalGross > 0 ? Math.round((totalAllowances / totalGross) * 100) : 0 },
          special: { amount: 0, percentage: 0 }
        },
        deductionComponents: {
          pf: { amount: totalPF, percentage: totalDeductions > 0 ? Math.round((totalPF / totalDeductions) * 100) : 0 },
          esi: { amount: totalESI, percentage: totalDeductions > 0 ? Math.round((totalESI / totalDeductions) * 100) : 0 },
          lop: { amount: totalLOP, percentage: totalDeductions > 0 ? Math.round((totalLOP / totalDeductions) * 100) : 0 },
          tds: { amount: totalTDS, percentage: totalDeductions > 0 ? Math.round((totalTDS / totalDeductions) * 100) : 0 }
        }
      });
      
      setDepartments(departmentPayroll);
      
    } catch (error) {
      console.error('Error fetching payroll data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex bg-[#F5F7FA] min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <div className="p-6">Loading...</div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex">
      <Sidebar />
      
      <div className="flex-1 bg-[#F7F9FB] min-h-screen">
        <Header />
        
        <div className="p-4 sm:p-6 pt-20 sm:pt-24">
          {/* Enhanced Header */}
          <div className="mb-4 sm:mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-white/20 rounded-xl backdrop-blur-sm flex-shrink-0">
                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-lg sm:text-2xl font-bold text-white">Payroll Management Dashboard</h1>
                    <p className="text-white/80 mt-1 text-sm sm:text-base">Overview of payroll processing and employee compensation</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-white">{payrollData.employeesProcessed}</div>
                    <div className="text-xs sm:text-sm text-white/70">Employees Processed</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payroll Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="p-4 sm:p-6 bg-content border rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className=" text-xs sm:text-sm font-medium" style={{color: 'var(--text-secondary, #374151)'}}>Total Payroll</p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600 mt-1">
                    {payrollData.totalPayroll}
                  </p>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-blue-100 flex-shrink-0">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 bg-content border rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className=" text-xs sm:text-sm font-medium" style={{color: 'var(--text-secondary, #374151)'}}>Employees Processed</p>
                  <p className="text-2xl sm:text-3xl font-bold text-purple-600 mt-1">
                    {payrollData.employeesProcessed}
                  </p>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-purple-100 flex-shrink-0">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 bg-content border rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className=" text-xs sm:text-sm font-medium" style={{color: 'var(--text-secondary, #374151)'}}>Total Deductions</p>
                  <p className="text-2xl sm:text-3xl font-bold text-red-600 mt-1">
                    {payrollData.totalDeductions}
                  </p>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-red-100 flex-shrink-0">
                  <Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                </div>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 bg-content border rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className=" text-xs sm:text-sm font-medium" style={{color: 'var(--text-secondary, #374151)'}}>Net Payable</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-1">
                    {payrollData.netPayable}
                  </p>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-green-100 flex-shrink-0">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Payroll Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-white rounded-xl sm:rounded-2xl border shadow-sm p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-primary mb-4">Salary Components Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="" style={{color: 'var(--text-secondary, #374151)'}}>Basic Salary</span>
                  <span className="font-semibold">
                    ₹{((payrollData.salaryComponents?.basic?.amount || 0) / 100000).toFixed(1)}L ({payrollData.salaryComponents?.basic?.percentage || 0}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="" style={{color: 'var(--text-secondary, #374151)'}}>HRA</span>
                  <span className="font-semibold">
                    ₹{((payrollData.salaryComponents?.hra?.amount || 0) / 100000).toFixed(1)}L ({payrollData.salaryComponents?.hra?.percentage || 0}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="" style={{color: 'var(--text-secondary, #374151)'}}>Allowances</span>
                  <span className="font-semibold">
                    ₹{((payrollData.salaryComponents?.allowances?.amount || 0) / 100000).toFixed(1)}L ({payrollData.salaryComponents?.allowances?.percentage || 0}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="" style={{color: 'var(--text-secondary, #374151)'}}>Special Allowance</span>
                  <span className="font-semibold">
                    ₹{((payrollData.salaryComponents?.special?.amount || 0) / 100000).toFixed(1)}L ({payrollData.salaryComponents?.special?.percentage || 0}%)
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl border shadow-sm p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-primary mb-4">Deductions Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="" style={{color: 'var(--text-secondary, #374151)'}}>PF Contribution</span>
                  <span className="font-semibold">
                    ₹{((payrollData.deductionComponents?.pf?.amount || 0) / 100000).toFixed(1)}L ({payrollData.deductionComponents?.pf?.percentage || 0}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="" style={{color: 'var(--text-secondary, #374151)'}}>TDS</span>
                  <span className="font-semibold">
                    ₹{((payrollData.deductionComponents?.tds?.amount || 0) / 100000).toFixed(1)}L ({payrollData.deductionComponents?.tds?.percentage || 0}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="" style={{color: 'var(--text-secondary, #374151)'}}>ESI</span>
                  <span className="font-semibold">
                    ₹{((payrollData.deductionComponents?.esi?.amount || 0) / 100000).toFixed(1)}L ({payrollData.deductionComponents?.esi?.percentage || 0}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="" style={{color: 'var(--text-secondary, #374151)'}}>LOP Deduction</span>
                  <span className="font-semibold">
                    ₹{((payrollData.deductionComponents?.lop?.amount || 0) / 100000).toFixed(1)}L ({payrollData.deductionComponents?.lop?.percentage || 0}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl sm:rounded-2xl border shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-primary mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <button 
                onClick={() => navigate('/payroll', { state: { tab: 'Salary Structure' } })}
                className="p-3 sm:p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-left min-h-[44px]"
              >
                <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mb-2" />
                <h3 className="font-semibold text-primary text-sm sm:text-base">Salary Structure</h3>
                <p className="text-xs sm:text-sm text-secondary">Manage salary components</p>
              </button>
              
              <button 
                onClick={() => navigate('/payroll', { state: { tab: 'Payroll Run' } })}
                className="p-3 sm:p-4 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors text-left min-h-[44px]"
              >
                <Calculator className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 mb-2" />
                <h3 className="font-semibold text-primary text-sm sm:text-base">Payroll Run</h3>
                <p className="text-xs sm:text-sm text-secondary">Process monthly payroll</p>
              </button>
              
              <button 
                onClick={() => navigate('/payroll', { state: { tab: 'Salary Slip & Payment' } })}
                className="p-3 sm:p-4 border border-green-200 rounded-lg hover:bg-green-50 transition-colors text-left min-h-[44px]"
              >
                <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mb-2" />
                <h3 className="font-semibold text-primary text-sm sm:text-base">Payslips</h3>
                <p className="text-xs sm:text-sm text-secondary">Generate & view payslips</p>
              </button>
              
              <button 
                onClick={() => navigate('/payroll', { state: { tab: 'Reports & Compliance' } })}
                className="p-3 sm:p-4 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors text-left min-h-[44px]"
              >
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 mb-2" />
                <h3 className="font-semibold text-primary text-sm sm:text-base">Reports</h3>
                <p className="text-xs sm:text-sm text-secondary">Payroll analytics & reports</p>
              </button>
            </div>
          </div>

          {/* Department Wise Payroll */}
          <div className="bg-white rounded-xl sm:rounded-2xl border shadow-sm p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-primary mb-4">Department Wise Payroll</h3>
            <div className="overflow-x-auto">
              <table style={{borderColor: 'var(--border-color, #e2e8f0)'}} className="w-full min-w-[600px]">
                <thead style={{borderColor: 'var(--border-color, #e2e8f0)'}} className="bg-content">
                  <tr>
                    <th className="text-left p-2 sm:p-3 font-medium text-secondary text-xs sm:text-sm">Department</th>
                    <th className="text-left p-2 sm:p-3 font-medium text-secondary text-xs sm:text-sm">Employees</th>
                    <th className="text-left p-2 sm:p-3 font-medium text-secondary text-xs sm:text-sm">Gross Salary</th>
                    <th className="text-left p-2 sm:p-3 font-medium text-secondary text-xs sm:text-sm">Deductions</th>
                    <th className="text-left p-2 sm:p-3 font-medium text-secondary text-xs sm:text-sm">Net Payable</th>
                  </tr>
                </thead>
                <tbody style={{borderColor: 'var(--border-color, #e2e8f0)'}}>
                  {departments.map((dept, index) => (
                    <tr key={index} className="border-b border-gray-100" style={{borderColor: 'var(--border-color, #e2e8f0)'}}>
                      <td className="p-2 sm:p-3 text-primary text-sm">{dept.name}</td>
                      <td className="p-2 sm:p-3 text-primary text-sm">{dept.employees}</td>
                      <td className="p-2 sm:p-3 text-primary text-sm">{dept.grossSalary}</td>
                      <td className="p-2 sm:p-3 text-primary text-sm">{dept.deductions}</td>
                      <td className="p-2 sm:p-3 font-semibold text-green-600 text-sm">{dept.netPayable}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollDashboard;
