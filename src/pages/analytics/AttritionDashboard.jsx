import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { TrendingDown, Users, UserMinus, AlertTriangle, BarChart3, Calendar, FileText, Clock, CheckCircle } from 'lucide-react';
import api from '../../api';

const AttritionDashboard = () => {
  const navigate = useNavigate();
  const [attritionData, setAttritionData] = useState({
    totalAttrition: 0,
    monthlyAttrition: 0,
    voluntaryAttrition: 0,
    involuntaryAttrition: 0,
    avgTenure: 0,
    attritionRate: 0
  });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttritionData();
  }, []);

  const fetchAttritionData = async () => {
    try {
      setLoading(true);
      const tenant_db = 'nutryah';
      
      // Fetch users and exit data
      const usersRes = await api.get(`/hospitals/users/${tenant_db}/list`).catch(() => ({ data: { users: [] } }));
      const users = usersRes.data?.users || [];
      
      const deptRes = await api.get(`/hospitals/departments/${tenant_db}/list`).catch(() => ({ data: { departments: [] } }));
      const deptData = deptRes.data?.departments || [];
      
      // Fetch actual exit data
      const exitRes = await api.get('/api/exit/resignations').catch(() => ({ data: [] }));
      const exitData = exitRes.data || [];
      
      // Calculate real attrition metrics
      const totalEmployees = users.length;
      const totalExits = exitData.length;
      
      // Calculate monthly exits (current month)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyExits = exitData.filter(exit => {
        if (exit.resignation_date) {
          const exitDate = new Date(exit.resignation_date);
          return exitDate.getMonth() === currentMonth && exitDate.getFullYear() === currentYear;
        }
        return false;
      }).length;
      
      // Calculate voluntary vs involuntary exits
      const voluntaryExits = exitData.filter(exit => 
        exit.reason && (exit.reason.toLowerCase().includes('resignation') || 
                       exit.reason.toLowerCase().includes('voluntary') ||
                       exit.reason.toLowerCase().includes('personal'))
      ).length;
      const involuntaryExits = totalExits - voluntaryExits;
      
      // Calculate attrition rate
      const attritionRate = totalEmployees > 0 ? ((totalExits / totalEmployees) * 100).toFixed(1) : 0;
      
      // Calculate average tenure (mock calculation based on joining dates)
      let totalTenure = 0;
      let employeesWithTenure = 0;
      users.forEach(user => {
        if (user.joining_date) {
          const joinDate = new Date(user.joining_date);
          const tenure = (new Date() - joinDate) / (1000 * 60 * 60 * 24 * 365); // years
          totalTenure += tenure;
          employeesWithTenure++;
        }
      });
      const avgTenure = employeesWithTenure > 0 ? (totalTenure / employeesWithTenure).toFixed(1) : 0;
      
      // Department-wise attrition
      const departmentAttrition = deptData.map(dept => {
        const deptEmployees = users.filter(user => 
          user.department_name === dept.name || 
          user.department === dept.name ||
          user.department_id === dept.id
        );
        
        // Find exits from this department
        const deptExits = exitData.filter(exit => {
          const employee = users.find(u => u.id === exit.employee_id);
          return employee && (
            employee.department_name === dept.name || 
            employee.department === dept.name ||
            employee.department_id === dept.id
          );
        });
        
        const deptAttrition = deptExits.length;
        const attritionRate = deptEmployees.length > 0 ? ((deptAttrition / deptEmployees.length) * 100).toFixed(1) : 0;
        
        return {
          name: dept.name,
          employees: deptEmployees.length,
          attrition: deptAttrition,
          rate: parseFloat(attritionRate)
        };
      });
      
      setAttritionData({
        totalAttrition: totalExits,
        monthlyAttrition: monthlyExits,
        voluntaryAttrition: voluntaryExits,
        involuntaryAttrition: involuntaryExits,
        avgTenure: parseFloat(avgTenure),
        attritionRate: parseFloat(attritionRate)
      });
      
      setDepartments(departmentAttrition);
      
    } catch (error) {
      console.error('Error fetching attrition data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAttritionColor = (rate) => {
    if (rate <= 10) return 'text-green-600';
    if (rate <= 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 bg-[#F7F9FB] min-h-screen">
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
              Attrition Analysis Dashboard
            </h1>
            <p className="text-gray-600">
              Employee turnover insights and retention analytics
            </p>
          </div>

          {/* Attrition Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="p-6 bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Attrition Rate</p>
                  <p className="text-3xl font-bold text-red-600 mt-1">
                    {attritionData.attritionRate}%
                  </p>
                </div>
                <div className="p-3 rounded-full bg-red-100">
                  <TrendingDown className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Exits</p>
                  <p className="text-3xl font-bold text-orange-600 mt-1">
                    {attritionData.totalAttrition}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-orange-100">
                  <UserMinus className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Monthly Exits</p>
                  <p className="text-3xl font-bold text-purple-600 mt-1">
                    {attritionData.monthlyAttrition}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-purple-100">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Avg Tenure</p>
                  <p className="text-3xl font-bold text-blue-600 mt-1">
                    {attritionData.avgTenure}y
                  </p>
                </div>
                <div className="p-3 rounded-full bg-blue-100">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Attrition Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-[#0D3B66] mb-4">Exit Type Analysis</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Voluntary Exits</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{width: `${attritionData.totalAttrition > 0 ? (attritionData.voluntaryAttrition / attritionData.totalAttrition) * 100 : 0}%`}}></div>
                    </div>
                    <span className="text-sm font-semibold">{attritionData.voluntaryAttrition}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Involuntary Exits</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{width: `${attritionData.totalAttrition > 0 ? (attritionData.involuntaryAttrition / attritionData.totalAttrition) * 100 : 0}%`}}></div>
                    </div>
                    <span className="text-sm font-semibold">{attritionData.involuntaryAttrition}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-[#0D3B66] mb-4">Retention Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Retention Rate</span>
                  <span className="font-semibold text-lg text-green-600">{(100 - attritionData.attritionRate).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Tenure</span>
                  <span className="font-semibold text-lg text-blue-600">{attritionData.avgTenure} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Exit Trend</span>
                  <span className="font-semibold text-lg text-red-600">↑ 5%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Department Wise Attrition */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h3 className="text-lg font-semibold text-[#0D3B66] mb-4">Department Wise Attrition</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-600">Department</th>
                    <th className="text-left p-3 font-medium text-gray-600">Total Employees</th>
                    <th className="text-left p-3 font-medium text-gray-600">Exits</th>
                    <th className="text-left p-3 font-medium text-gray-600">Attrition Rate</th>
                    <th className="text-left p-3 font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dept, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="p-3 text-gray-800">{dept.name}</td>
                      <td className="p-3 text-gray-800">{dept.employees}</td>
                      <td className="p-3 text-gray-800">{dept.attrition}</td>
                      <td className={`p-3 font-semibold ${getAttritionColor(dept.rate)}`}>{dept.rate}%</td>
                      <td className="p-3">
                        {dept.rate <= 10 ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Low</span>
                        ) : dept.rate <= 20 ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Medium</span>
                        ) : (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">High</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-[#0D3B66] mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => navigate('/exit', { state: { tab: 'Resignation & Notice' } })}
                className="p-4 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-left"
              >
                <FileText className="w-8 h-8 text-red-600 mb-2" />
                <h3 className="font-semibold text-gray-800">Resignation</h3>
                <p className="text-sm text-gray-600">Manage resignation requests</p>
              </button>
              
              <button 
                onClick={() => navigate('/exit', { state: { tab: 'Clearance & Exit Process' } })}
                className="p-4 border border-green-200 rounded-lg hover:bg-green-50 transition-colors text-left"
              >
                <CheckCircle className="w-8 h-8 text-green-600 mb-2" />
                <h3 className="font-semibold text-gray-800">Clearance</h3>
                <p className="text-sm text-gray-600">Process exit clearance</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttritionDashboard;