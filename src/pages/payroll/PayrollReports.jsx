import { useEffect, useState } from "react";
import { BarChart3, Download, FileText, TrendingUp, Users, DollarSign, Calendar } from "lucide-react";
import api from "../../api";

export default function PayrollReports() {
  const [employees, setEmployees] = useState([]);
  const [payrollRuns, setPayrollRuns] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("current-month");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalPayroll: 0,
    avgSalary: 0,
    pfContribution: 0,
    esiContribution: 0,
    tdsDeducted: 0
  });

  useEffect(() => {
    fetchData();
  }, [selectedPeriod]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const tenantDb = localStorage.getItem('tenant_db');
      const empRes = await api.get(`/api/users/${tenantDb}/list`);
      const activeEmployees = empRes.data?.users?.filter(u => u.is_employee && u.status === 'Active') || [];
      setEmployees(activeEmployees);
      
      const payrollRes = await api.get("/api/payroll/run");
      const runs = payrollRes.data || [];
      setPayrollRuns(runs);
      
      calculateStats(activeEmployees, runs);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (employees, runs) => {
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const currentRuns = runs.filter(run => run.month === currentMonth);
    
    const totalPayroll = currentRuns.reduce((sum, run) => sum + (run.gross_salary || 0), 0);
    const avgSalary = currentRuns.length > 0 ? totalPayroll / currentRuns.length : 0;
    const pfContribution = totalPayroll * 0.12;
    const esiContribution = totalPayroll * 0.0175;
    const tdsDeducted = totalPayroll * 0.10;
    
    setStats({
      totalEmployees: employees.length,
      totalPayroll,
      avgSalary,
      pfContribution,
      esiContribution,
      tdsDeducted
    });
  };

  const handleExportReport = () => {
    const reportData = {
      period: selectedPeriod,
      stats,
      employees: employees.length,
      payrollRuns: payrollRuns.length,
      generatedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payroll-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadReport = (reportType) => {
    alert(`Downloading ${reportType} report. This feature will be implemented with actual report generation.`);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Reports & Compliance</h2>
            <p className="text-gray-600 mt-1">View payroll summary, PF/ESI/TDS and compliance reports</p>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="current-month">Current Month</option>
              <option value="last-month">Last Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            <button 
              onClick={handleExportReport}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={16} />
              {loading ? "Loading..." : "Export Report"}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="p-6 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">Employees</p>
                <p className="text-2xl font-semibold text-blue-900">{stats.totalEmployees}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">Total Payroll</p>
                <p className="text-2xl font-semibold text-green-900">₹{(stats.totalPayroll / 100000).toFixed(1)}L</p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-600">Avg Salary</p>
                <p className="text-2xl font-semibold text-purple-900">₹{(stats.avgSalary / 1000).toFixed(0)}K</p>
              </div>
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-orange-600">PF Contribution</p>
                <p className="text-2xl font-semibold text-orange-900">₹{(stats.pfContribution / 1000).toFixed(0)}K</p>
              </div>
            </div>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-600">ESI Contribution</p>
                <p className="text-2xl font-semibold text-red-900">₹{(stats.esiContribution / 1000).toFixed(0)}K</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-600">TDS Deducted</p>
                <p className="text-2xl font-semibold text-yellow-900">₹{(stats.tdsDeducted / 1000).toFixed(0)}K</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Sections */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Compliance Reports */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={20} />
              Compliance Reports
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-white rounded border">
                <div>
                  <p className="font-medium text-gray-900">PF Challan Report</p>
                  <p className="text-sm text-gray-500">Monthly PF contribution summary</p>
                </div>
                <button className="text-blue-600 hover:text-blue-800">
                  <Download size={16} />
                </button>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded border">
                <div>
                  <p className="font-medium text-gray-900">ESI Challan Report</p>
                  <p className="text-sm text-gray-500">Monthly ESI contribution summary</p>
                </div>
                <button className="text-blue-600 hover:text-blue-800">
                  <Download size={16} />
                </button>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded border">
                <div>
                  <p className="font-medium text-gray-900">TDS Report</p>
                  <p className="text-sm text-gray-500">Tax deduction summary</p>
                </div>
                <button className="text-blue-600 hover:text-blue-800">
                  <Download size={16} />
                </button>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded border">
                <div>
                  <p className="font-medium text-gray-900">Form 16 Generation</p>
                  <p className="text-sm text-gray-500">Annual tax certificate</p>
                </div>
                <button className="text-blue-600 hover:text-blue-800">
                  <Download size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Payroll Summary */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 size={20} />
              Payroll Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-white rounded border">
                <div>
                  <p className="font-medium text-gray-900">Department-wise Report</p>
                  <p className="text-sm text-gray-500">Payroll breakdown by department</p>
                </div>
                <button className="text-blue-600 hover:text-blue-800">
                  <Download size={16} />
                </button>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded border">
                <div>
                  <p className="font-medium text-gray-900">Grade-wise Report</p>
                  <p className="text-sm text-gray-500">Salary distribution by grade</p>
                </div>
                <button className="text-blue-600 hover:text-blue-800">
                  <Download size={16} />
                </button>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded border">
                <div>
                  <p className="font-medium text-gray-900">Bank Transfer Report</p>
                  <p className="text-sm text-gray-500">Salary transfer summary</p>
                </div>
                <button className="text-blue-600 hover:text-blue-800">
                  <Download size={16} />
                </button>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded border">
                <div>
                  <p className="font-medium text-gray-900">Attendance vs Payroll</p>
                  <p className="text-sm text-gray-500">Attendance impact analysis</p>
                </div>
                <button className="text-blue-600 hover:text-blue-800">
                  <Download size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Data */}
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Current Period Summary</h3>
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Active Employees:</strong> {stats.totalEmployees}</p>
                <p><strong>Payroll Runs:</strong> {payrollRuns.length}</p>
                <p><strong>Period:</strong> {selectedPeriod.replace('-', ' ').toUpperCase()}</p>
              </div>
              <div>
                <p><strong>Total Gross:</strong> ₹{stats.totalPayroll.toLocaleString()}</p>
                <p><strong>Total Deductions:</strong> ₹{(stats.pfContribution + stats.esiContribution + stats.tdsDeducted).toLocaleString()}</p>
                <p><strong>Net Payable:</strong> ₹{(stats.totalPayroll - stats.pfContribution - stats.esiContribution - stats.tdsDeducted).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          <p>All reports are generated based on processed payroll data. Ensure payroll is processed before generating compliance reports.</p>
        </div>
      </div>
    </div>
  );
}
