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
    <div className="bg-white rounded-2xl border border-black overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-black">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900">Reports & Compliance</h2>
            <p className="text-sm text-gray-600">View payroll summary, PF/ESI/TDS and compliance reports</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Period Selection and Export */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <span className="text-sm text-gray-600">Period & Export</span>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-gray-100 rounded-full p-1 overflow-x-auto scrollbar-hide border border-black gap-2 sm:gap-0" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border-0 bg-transparent px-4 py-2 text-sm focus:outline-none rounded-full w-full sm:w-auto"
            >
              <option value="current-month">Current Month</option>
              <option value="last-month">Last Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            <button 
              onClick={handleExportReport}
              disabled={loading}
              className="bg-white text-black border border-black px-4 py-2 rounded-full flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium hover:bg-gray-100 justify-center"
            >
              <Download size={16} />
              {loading ? "Loading..." : "Export"}
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white rounded-2xl border border-black p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Employees</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</p>
                </div>
                <div className="p-2 bg-gray-100 rounded-2xl">
                  <Users className="h-8 w-8 text-gray-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-black p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Payroll</p>
                  <p className="text-2xl font-bold text-gray-900">₹{(stats.totalPayroll / 100000).toFixed(1)}L</p>
                </div>
                <div className="p-2 bg-gray-100 rounded-2xl">
                  <DollarSign className="h-8 w-8 text-gray-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-black p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Avg Salary</p>
                  <p className="text-2xl font-bold text-gray-900">₹{(stats.avgSalary / 1000).toFixed(0)}K</p>
                </div>
                <div className="p-2 bg-gray-100 rounded-2xl">
                  <TrendingUp className="h-8 w-8 text-gray-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-black p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">PF Contribution</p>
                  <p className="text-2xl font-bold text-gray-900">₹{(stats.pfContribution / 1000).toFixed(0)}K</p>
                </div>
                <div className="p-2 bg-gray-100 rounded-2xl">
                  <BarChart3 className="h-8 w-8 text-gray-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-black p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">ESI Contribution</p>
                  <p className="text-2xl font-bold text-gray-900">₹{(stats.esiContribution / 1000).toFixed(0)}K</p>
                </div>
                <div className="p-2 bg-gray-100 rounded-2xl">
                  <FileText className="h-8 w-8 text-gray-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-black p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">TDS Deducted</p>
                  <p className="text-2xl font-bold text-gray-900">₹{(stats.tdsDeducted / 1000).toFixed(0)}K</p>
                </div>
                <div className="p-2 bg-gray-100 rounded-2xl">
                  <Calendar className="h-8 w-8 text-gray-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Report Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Compliance Reports */}
          <div className="bg-white rounded-2xl border border-black p-6 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={20} />
              Compliance Reports
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-black">
                <div>
                  <p className="font-medium text-gray-900">PF Challan Report</p>
                  <p className="text-sm text-gray-600">Monthly PF contribution summary</p>
                </div>
                <button 
                  onClick={() => handleDownloadReport('pf-challan')}
                  className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Download size={16} />
                </button>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-black">
                <div>
                  <p className="font-medium text-gray-900">ESI Challan Report</p>
                  <p className="text-sm text-gray-600">Monthly ESI contribution summary</p>
                </div>
                <button 
                  onClick={() => handleDownloadReport('esi-challan')}
                  className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Download size={16} />
                </button>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-black">
                <div>
                  <p className="font-medium text-gray-900">TDS Report</p>
                  <p className="text-sm text-gray-600">Tax deduction summary</p>
                </div>
                <button 
                  onClick={() => handleDownloadReport('tds')}
                  className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Download size={16} />
                </button>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-black">
                <div>
                  <p className="font-medium text-gray-900">Form 16 Generation</p>
                  <p className="text-sm text-gray-600">Annual tax certificate</p>
                </div>
                <button 
                  onClick={() => handleDownloadReport('form16')}
                  className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Payroll Summary */}
          <div className="bg-white rounded-2xl border border-black p-6 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 size={20} />
              Payroll Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-black">
                <div>
                  <p className="font-medium text-gray-900">Department-wise Report</p>
                  <p className="text-sm text-gray-600">Payroll breakdown by department</p>
                </div>
                <button 
                  onClick={() => handleDownloadReport('department-wise')}
                  className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Download size={16} />
                </button>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-black">
                <div>
                  <p className="font-medium text-gray-900">Grade-wise Report</p>
                  <p className="text-sm text-gray-600">Salary distribution by grade</p>
                </div>
                <button 
                  onClick={() => handleDownloadReport('grade-wise')}
                  className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Download size={16} />
                </button>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-black">
                <div>
                  <p className="font-medium text-gray-900">Bank Transfer Report</p>
                  <p className="text-sm text-gray-600">Salary transfer summary</p>
                </div>
                <button 
                  onClick={() => handleDownloadReport('bank-transfer')}
                  className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Download size={16} />
                </button>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-black">
                <div>
                  <p className="font-medium text-gray-900">Attendance vs Payroll</p>
                  <p className="text-sm text-gray-600">Attendance impact analysis</p>
                </div>
                <button 
                  onClick={() => handleDownloadReport('attendance-payroll')}
                  className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Data */}
        <div className="bg-white rounded-2xl border border-black shadow-sm overflow-hidden">
          <div className="p-6 border-b border-black bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900">Current Period Summary</h3>
          </div>
          <div className="p-6">
            <div className="bg-gray-50 rounded-2xl border border-black p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
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
        <div className="bg-gray-50 rounded-2xl border border-black p-6">
          <div className="text-sm text-gray-600">
            <p>All reports are generated based on processed payroll data. Ensure payroll is processed before generating compliance reports.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
