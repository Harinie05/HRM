import { useState, useEffect } from "react";
import { TrendingUp, Lock, Calculator } from "lucide-react";
import api from "../../api";
import useToast from "../../utils/useToast";
import Toast from "../../components/Toast";

export default function GoalsKPI() {
  const { toast, showToast, hideToast } = useToast();
  const [employees, setEmployees] = useState([]);
  const [kpiData, setKpiData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
    fetchKPIData();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/pms/goals/employees');
      setEmployees(response.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchKPIData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/pms/goals/kpi-dashboard');
      if (response.data?.data) {
        const kpiData = response.data.data.map(employee => ({
          employee_id: employee.employee_id,
          employee_name: employee.employee_name,
          calculated_score: employee.current_value,
          status: employee.status,
          progress: employee.progress,
          assignments: [],
          total_weightage: 100,
          assignment_count: employee.assignment_count
        }));
        setKpiData(kpiData);
      }
    } catch (error) {
      console.error('Error fetching KPI data:', error);
      showToast('Failed to fetch KPI data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "On Track": return "bg-green-100 text-green-800 border-green-300";
      case "Needs Improvement": return "bg-red-100 text-red-800 border-red-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getProgressColor = (score) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - READ ONLY Notice */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-300">
            <TrendingUp className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900">Goals & KPI (AUTO - READ ONLY)</h2>
            <p className="text-sm text-gray-600">System-calculated KPI scores based on Work Assignments</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
          <Lock className="w-4 h-4 text-yellow-600" />
          <span className="text-sm text-yellow-700 font-medium">Automated System</span>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Calculator className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900">Automated KPI Calculation</h3>
            <p className="text-sm text-blue-700 mt-1">
              KPI scores are automatically calculated from Work Assignments completion status. 
              Target is locked at 100%, and progress is derived from assignment weightage and completion percentages.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Dashboard */}
      <div className="bg-white rounded-2xl shadow-lg border border-black">
        <div className="px-4 sm:px-6 py-4 border-b border-black rounded-t-2xl bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">Employee KPI Dashboard</h3>
          <p className="text-sm text-gray-600">Real-time performance scores based on work assignment completion</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Target Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Current Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Progress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Total Assignments</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {kpiData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No work assignments found. Create work assignments to see KPI data.
                  </td>
                </tr>
              ) : (
                kpiData.map((employee) => (
                  <tr key={employee.employee_id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{employee.employee_name}</div>
                      <div className="text-sm text-gray-500">ID: {employee.employee_id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">100</span>
                        <Lock className="w-3 h-3 text-gray-400" title="Locked at 100%" />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {Math.round(employee.calculated_score || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-24 bg-gray-200 rounded-full h-3 mr-3 border border-black">
                          <div
                            className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(employee.calculated_score || 0)}`}
                            style={{ width: `${Math.min(100, employee.calculated_score || 0)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-600">
                          {Math.round(employee.calculated_score || 0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(employee.status)}`}>
                        {employee.status || "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.assignment_count || employee.assignments.length}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assignment Details */}
      {kpiData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-black">
          <div className="px-4 sm:px-6 py-4 border-b border-black rounded-t-2xl bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Assignment Breakdown</h3>
            <p className="text-sm text-gray-600">Detailed view of work assignments contributing to KPI scores</p>
          </div>
          
          <div className="p-6 space-y-6">
            {kpiData.map((employee) => (
              <div key={employee.employee_id} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">{employee.employee_name}</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2">Assignment</th>
                        <th className="text-left py-2">Category</th>
                        <th className="text-left py-2">Weightage</th>
                        <th className="text-left py-2">Frequency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employee.assignments.map((assignment) => (
                        <tr key={assignment.id} className="border-b border-gray-100">
                          <td className="py-2">{assignment.title}</td>
                          <td className="py-2">{assignment.category}</td>
                          <td className="py-2">{assignment.weightage_percentage}%</td>
                          <td className="py-2">{assignment.frequency}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  Total Weightage: {employee.total_weightage}% | 
                  KPI Score: {Math.round(employee.calculated_score || 0)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <Toast toast={toast} hideToast={hideToast} />
    </div>
  );
}