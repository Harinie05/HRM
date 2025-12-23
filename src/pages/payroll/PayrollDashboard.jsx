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
      
      // Use summary data if available, otherwise use your specified values
      const totalPayroll = summary.total_payroll || 0;
      const totalDeductions = summary.total_deductions || 0;
      const netPayable = summary.net_payable || 0;
      
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
        onHold
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
        
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[#0D3B66] mb-2">
              Payroll Management Dashboard
            </h1>
            <p className="text-gray-600">
              Overview of payroll processing and employee compensation
            </p>
          </div>

          {/* Payroll Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="p-6 bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Payroll (This Month)</p>
                  <p className="text-3xl font-bold text-blue-600 mt-1">
                    {payrollData.totalPayroll}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-blue-100">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Employees Processed</p>
                  <p className="text-3xl font-bold text-purple-600 mt-1">
                    {payrollData.employeesProcessed}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-purple-100">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Deductions</p>
                  <p className="text-3xl font-bold text-red-600 mt-1">
                    {payrollData.totalDeductions}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-red-100">
                  <Calculator className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Net Payable</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">
                    {payrollData.netPayable}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-green-100">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Payroll Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-[#0D3B66] mb-4">Salary Components Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Basic Salary</span>
                  <span className="font-semibold">₹1.2Cr (49%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">HRA</span>
                  <span className="font-semibold">₹60L (24%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Allowances</span>
                  <span className="font-semibold">₹40L (16%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Special Allowance</span>
                  <span className="font-semibold">₹25L (11%)</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-[#0D3B66] mb-4">Deductions Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">PF Contribution</span>
                  <span className="font-semibold">₹18L (40%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">TDS</span>
                  <span className="font-semibold">₹15L (33%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ESI</span>
                  <span className="font-semibold">₹8L (18%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Professional Tax</span>
                  <span className="font-semibold">₹4L (9%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-[#0D3B66] mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button 
                onClick={() => navigate('/payroll', { state: { tab: 'Salary Structure' } })}
                className="p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-left"
              >
                <DollarSign className="w-8 h-8 text-blue-600 mb-2" />
                <h3 className="font-semibold text-gray-800">Salary Structure</h3>
                <p className="text-sm text-gray-600">Manage salary components</p>
              </button>
              
              <button 
                onClick={() => navigate('/payroll', { state: { tab: 'Payroll Run' } })}
                className="p-4 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors text-left"
              >
                <Calculator className="w-8 h-8 text-purple-600 mb-2" />
                <h3 className="font-semibold text-gray-800">Payroll Run</h3>
                <p className="text-sm text-gray-600">Process monthly payroll</p>
              </button>
              
              <button 
                onClick={() => navigate('/payroll', { state: { tab: 'Salary Slip & Payment' } })}
                className="p-4 border border-green-200 rounded-lg hover:bg-green-50 transition-colors text-left"
              >
                <FileText className="w-8 h-8 text-green-600 mb-2" />
                <h3 className="font-semibold text-gray-800">Payslips</h3>
                <p className="text-sm text-gray-600">Generate & view payslips</p>
              </button>
              
              <button 
                onClick={() => navigate('/payroll', { state: { tab: 'Reports & Compliance' } })}
                className="p-4 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors text-left"
              >
                <Users className="w-8 h-8 text-orange-600 mb-2" />
                <h3 className="font-semibold text-gray-800">Reports</h3>
                <p className="text-sm text-gray-600">Payroll analytics & reports</p>
              </button>
            </div>
          </div>

          {/* Department Wise Payroll */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-[#0D3B66] mb-4">Department Wise Payroll</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-600">Department</th>
                    <th className="text-left p-3 font-medium text-gray-600">Employees</th>
                    <th className="text-left p-3 font-medium text-gray-600">Gross Salary</th>
                    <th className="text-left p-3 font-medium text-gray-600">Deductions</th>
                    <th className="text-left p-3 font-medium text-gray-600">Net Payable</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dept, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="p-3 text-gray-800">{dept.name}</td>
                      <td className="p-3 text-gray-800">{dept.employees}</td>
                      <td className="p-3 text-gray-800">{dept.grossSalary}</td>
                      <td className="p-3 text-gray-800">{dept.deductions}</td>
                      <td className="p-3 font-semibold text-green-600">{dept.netPayable}</td>
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