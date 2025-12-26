import { useEffect, useState } from "react";
import { BarChart3, Download, FileText, TrendingUp, Users, DollarSign, Calendar } from "lucide-react";
import api from "../../api";

export default function PayrollReports() {
  const [employees, setEmployees] = useState([]);
  const [payrollRuns, setPayrollRuns] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("current-month");
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState({
    totalGross: 0,
    totalDeductions: 0,
    netPayable: 0,
    payrollRuns: 0,
    period: 'CURRENT MONTH'
  });
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
      
      // Fetch payroll summary from new endpoint
      const summaryRes = await api.get("/api/payroll/reports/summary");
      const summaryData = summaryRes.data;
      
      setStats({
        totalEmployees: summaryData.employee_count,
        totalPayroll: summaryData.total_payroll,
        avgSalary: summaryData.avg_salary,
        pfContribution: summaryData.pf_contribution,
        esiContribution: summaryData.esi_contribution,
        tdsDeducted: summaryData.tds_deducted
      });
      
      // Set additional summary data
      setSummaryData({
        totalGross: summaryData.total_gross,
        totalDeductions: summaryData.total_deductions,
        netPayable: summaryData.net_payable,
        payrollRuns: summaryData.payroll_runs,
        period: summaryData.period
      });
      
    } catch (error) {
      console.error("Error fetching data:", error);
      // Fallback to existing logic if API fails
      const tenantDb = localStorage.getItem('tenant_db');
      const empRes = await api.get(`/api/users/${tenantDb}/list`);
      const activeEmployees = empRes.data?.users?.filter(u => u.is_employee && u.status === 'Active') || [];
      setEmployees(activeEmployees);
      
      const payrollRes = await api.get("/api/payroll/runs");
      const runs = payrollRes.data || [];
      setPayrollRuns(runs);
      
      calculateStats(activeEmployees, runs);
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

  const handleDownloadReport = async (reportType) => {
    try {
      let endpoint = '';
      let filename = '';
      
      switch(reportType) {
        case 'pf-challan':
          endpoint = '/api/payroll/reports/pf-challan/pdf';
          filename = 'pf-challan-report.html';
          break;
        case 'esi-challan':
          endpoint = '/api/payroll/reports/esi-challan/pdf';
          filename = 'esi-challan-report.html';
          break;
        case 'tds':
          endpoint = '/api/payroll/reports/tds/pdf';
          filename = 'tds-report.html';
          break;
        case 'bank-transfer':
          endpoint = '/api/payroll/reports/bank-transfer/pdf';
          filename = 'bank-transfer-report.html';
          break;
        case 'department-wise':
          endpoint = '/api/payroll/reports/department-wise/pdf';
          filename = 'department-wise-report.html';
          break;
        case 'grade-wise':
          endpoint = '/api/payroll/reports/grade-wise/pdf';
          filename = 'grade-wise-report.html';
          break;
        case 'attendance-payroll':
          endpoint = '/api/payroll/reports/attendance-payroll/pdf';
          filename = 'attendance-payroll-report.html';
          break;
        default:
          alert(`${reportType} report generation is under development.`);
          return;
      }
      
      // Download HTML report
      const downloadUrl = `${api.defaults.baseURL}${endpoint}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download report. Please try again.');
    }
  };

  return (
    <div className="rounded-2xl shadow-lg border border-gray-100" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 border-b  rounded-t-2xl">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <BarChart3 className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-primary">Reports & Compliance</h2>
              <p className=" mt-1" style={{color: 'var(--text-secondary, #374151)'}}>View payroll summary, PF/ESI/TDS and compliance reports</p>
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border-dark rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
            >
              <option value="current-month">Current Month</option>
              <option value="last-month">Last Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            <button 
              onClick={handleExportReport}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={18} />
              {loading ? "Loading..." : "Export Report"}
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Overview */}
      <div className="p-6 border-b  bg-content">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-content rounded-xl p-4 border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className=" text-sm font-medium" style={{color: 'var(--text-secondary, #374151)'}}>Employees</p>
                <p className="text-2xl font-bold text-primary">{stats.totalEmployees}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-content rounded-xl p-4 border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className=" text-sm font-medium" style={{color: 'var(--text-secondary, #374151)'}}>Total Payroll</p>
                <p className="text-2xl font-bold text-primary">₹{(stats.totalPayroll / 100000).toFixed(1)}L</p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-content rounded-xl p-4 border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className=" text-sm font-medium" style={{color: 'var(--text-secondary, #374151)'}}>Avg Salary</p>
                <p className="text-2xl font-bold text-primary">₹{(stats.avgSalary / 1000).toFixed(0)}K</p>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-content rounded-xl p-4 border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className=" text-sm font-medium" style={{color: 'var(--text-secondary, #374151)'}}>PF Contribution</p>
                <p className="text-2xl font-bold text-primary">₹{(stats.pfContribution / 1000).toFixed(0)}K</p>
              </div>
              <div className="p-2 bg-orange-50 rounded-lg">
                <BarChart3 className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>
          <div className="bg-content rounded-xl p-4 border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className=" text-sm font-medium" style={{color: 'var(--text-secondary, #374151)'}}>ESI Contribution</p>
                <p className="text-2xl font-bold text-primary">₹{(stats.esiContribution / 1000).toFixed(0)}K</p>
              </div>
              <div className="p-2 bg-red-50 rounded-lg">
                <FileText className="h-8 w-8 text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-content rounded-xl p-4 border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className=" text-sm font-medium" style={{color: 'var(--text-secondary, #374151)'}}>TDS Deducted</p>
                <p className="text-2xl font-bold text-primary">₹{(stats.tdsDeducted / 1000).toFixed(0)}K</p>
              </div>
              <div className="p-2 bg-yellow-50 rounded-lg">
                <Calendar className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Sections */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Compliance Reports */}
          <div className="bg-content rounded-lg p-6">
            <h3 className="text-lg font-medium text-primary mb-4 flex items-center gap-2">
              <FileText size={20} />
              Compliance Reports
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-white rounded border">
                <div>
                  <p className="font-medium text-primary">PF Challan Report</p>
                  <p className="text-sm text-muted">Monthly PF contribution summary</p>
                </div>
                <button 
                  onClick={() => handleDownloadReport('pf-challan')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Download size={16} />
                </button>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded border">
                <div>
                  <p className="font-medium text-primary">ESI Challan Report</p>
                  <p className="text-sm text-muted">Monthly ESI contribution summary</p>
                </div>
                <button 
                  onClick={() => handleDownloadReport('esi-challan')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Download size={16} />
                </button>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded border">
                <div>
                  <p className="font-medium text-primary">TDS Report</p>
                  <p className="text-sm text-muted">Tax deduction summary</p>
                </div>
                <button 
                  onClick={() => handleDownloadReport('tds')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Download size={16} />
                </button>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded border">
                <div>
                  <p className="font-medium text-primary">Form 16 Generation</p>
                  <p className="text-sm text-muted">Annual tax certificate</p>
                </div>
                <button 
                  onClick={() => handleDownloadReport('form16')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Payroll Summary */}
          <div className="bg-content rounded-lg p-6">
            <h3 className="text-lg font-medium text-primary mb-4 flex items-center gap-2">
              <BarChart3 size={20} />
              Payroll Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-white rounded border">
                <div>
                  <p className="font-medium text-primary">Department-wise Report</p>
                  <p className="text-sm text-muted">Payroll breakdown by department</p>
                </div>
                <button 
                  onClick={() => handleDownloadReport('department-wise')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Download size={16} />
                </button>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded border">
                <div>
                  <p className="font-medium text-primary">Grade-wise Report</p>
                  <p className="text-sm text-muted">Salary distribution by grade</p>
                </div>
                <button 
                  onClick={() => handleDownloadReport('grade-wise')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Download size={16} />
                </button>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded border">
                <div>
                  <p className="font-medium text-primary">Bank Transfer Report</p>
                  <p className="text-sm text-muted">Salary transfer summary</p>
                </div>
                <button 
                  onClick={() => handleDownloadReport('bank-transfer')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Download size={16} />
                </button>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded border">
                <div>
                  <p className="font-medium text-primary">Attendance vs Payroll</p>
                  <p className="text-sm text-muted">Attendance impact analysis</p>
                </div>
                <button 
                  onClick={() => handleDownloadReport('attendance-payroll')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Data */}
        <div className="mt-6">
          <h3 className="text-lg font-medium text-primary mb-4">Current Period Summary</h3>
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Active Employees:</strong> {stats.totalEmployees}</p>
                <p><strong>Payroll Runs:</strong> {summaryData.payrollRuns}</p>
                <p><strong>Period:</strong> {summaryData.period}</p>
              </div>
              <div>
                <p><strong>Total Gross:</strong> ₹{summaryData.totalGross.toLocaleString()}</p>
                <p><strong>Total Deductions:</strong> ₹{summaryData.totalDeductions.toLocaleString()}</p>
                <p><strong>Net Payable:</strong> ₹{summaryData.netPayable.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-content border-t ">
        <div className="text-sm text-secondary">
          <p>All reports are generated based on processed payroll data. Ensure payroll is processed before generating compliance reports.</p>
        </div>
      </div>
    </div>
  );
}
