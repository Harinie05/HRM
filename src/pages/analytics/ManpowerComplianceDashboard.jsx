import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { Users, Shield, CheckCircle, AlertCircle, FileText, Target } from 'lucide-react';
import api from '../../api';

const ManpowerComplianceDashboard = () => {
  const navigate = useNavigate();
  const [complianceData, setComplianceData] = useState({
    totalEmployees: 0,
    requiredHeadcount: 0,
    vacantPositions: 0,
    complianceScore: 0,
    criticalRoles: 0,
    budgetUtilization: 0
  });
  const [departments, setDepartments] = useState([]);
  const [complianceItems, setComplianceItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComplianceData();
  }, []);

  const fetchComplianceData = async () => {
    try {
      setLoading(true);
      const tenant_db = 'nutryah';
      
      // Fetch users and departments
      const usersRes = await api.get(`/hospitals/users/${tenant_db}/list`).catch(() => ({ data: { users: [] } }));
      const users = usersRes.data?.users || [];
      
      const deptRes = await api.get(`/hospitals/departments/${tenant_db}/list`).catch(() => ({ data: { departments: [] } }));
      const deptData = deptRes.data?.departments || [];
      
      // Mock compliance data
      const totalEmployees = users.length;
      const requiredHeadcount = Math.floor(totalEmployees * 1.2);
      const vacantPositions = requiredHeadcount - totalEmployees;
      const complianceScore = 85;
      const criticalRoles = 3;
      const budgetUtilization = 78;
      
      // Department-wise manpower planning
      const departmentPlanning = deptData.map(dept => {
        const deptEmployees = users.filter(user => 
          user.department_name === dept.name || 
          user.department === dept.name ||
          user.department_id === dept.id
        );
        
        const current = deptEmployees.length;
        const required = Math.floor(current * 1.15);
        const vacant = required - current;
        const utilization = required > 0 ? ((current / required) * 100).toFixed(1) : 100;
        
        return {
          name: dept.name,
          current,
          required,
          vacant,
          utilization: parseFloat(utilization)
        };
      });
      
      // Mock compliance items
      const mockComplianceItems = [
        { item: 'Labour License Compliance', status: 'Compliant', score: 100 },
        { item: 'PF Registration', status: 'Compliant', score: 100 },
        { item: 'ESI Registration', status: 'Compliant', score: 100 },
        { item: 'Contract Labour Act', status: 'Partial', score: 75 },
        { item: 'Minimum Wages Act', status: 'Compliant', score: 100 },
        { item: 'Shops & Establishment Act', status: 'Non-Compliant', score: 40 }
      ];
      
      setComplianceData({
        totalEmployees,
        requiredHeadcount,
        vacantPositions,
        complianceScore,
        criticalRoles,
        budgetUtilization
      });
      
      setDepartments(departmentPlanning);
      setComplianceItems(mockComplianceItems);
      
    } catch (error) {
      console.error('Error fetching compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getComplianceColor = (status) => {
    switch (status) {
      case 'Compliant': return 'text-green-600';
      case 'Partial': return 'text-yellow-600';
      case 'Non-Compliant': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getUtilizationColor = (utilization) => {
    if (utilization >= 90) return 'text-green-600';
    if (utilization >= 70) return 'text-yellow-600';
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
              Manpower Planning & Compliance Dashboard
            </h1>
            <p className="text-gray-600">
              Workforce planning insights and regulatory compliance tracking
            </p>
          </div>

          {/* Compliance Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="p-6 bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Current Headcount</p>
                  <p className="text-3xl font-bold text-blue-600 mt-1">
                    {complianceData.totalEmployees}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-blue-100">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Vacant Positions</p>
                  <p className="text-3xl font-bold text-orange-600 mt-1">
                    {complianceData.vacantPositions}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-orange-100">
                  <Target className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Compliance Score</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">
                    {complianceData.complianceScore}%
                  </p>
                </div>
                <div className="p-3 rounded-full bg-green-100">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Budget Utilization</p>
                  <p className="text-3xl font-bold text-purple-600 mt-1">
                    {complianceData.budgetUtilization}%
                  </p>
                </div>
                <div className="p-3 rounded-full bg-purple-100">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Manpower Planning & Compliance Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-[#0D3B66] mb-4">Workforce Planning Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Required Headcount</span>
                  <span className="font-semibold text-lg">{complianceData.requiredHeadcount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Strength</span>
                  <span className="font-semibold text-lg text-blue-600">{complianceData.totalEmployees}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fulfillment Rate</span>
                  <span className="font-semibold text-lg text-green-600">
                    {((complianceData.totalEmployees / complianceData.requiredHeadcount) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Critical Roles Vacant</span>
                  <span className="font-semibold text-lg text-red-600">{complianceData.criticalRoles}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-[#0D3B66] mb-4">Compliance Status</h3>
              <div className="space-y-3">
                {complianceItems.slice(0, 4).map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">{item.item}</span>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs font-medium ${getComplianceColor(item.status)}`}>
                        {item.status}
                      </span>
                      {item.status === 'Compliant' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Department Wise Manpower Planning */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h3 className="text-lg font-semibold text-[#0D3B66] mb-4">Department Wise Manpower Planning</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-600">Department</th>
                    <th className="text-left p-3 font-medium text-gray-600">Current</th>
                    <th className="text-left p-3 font-medium text-gray-600">Required</th>
                    <th className="text-left p-3 font-medium text-gray-600">Vacant</th>
                    <th className="text-left p-3 font-medium text-gray-600">Utilization</th>
                    <th className="text-left p-3 font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dept, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="p-3 text-gray-800">{dept.name}</td>
                      <td className="p-3 text-gray-800">{dept.current}</td>
                      <td className="p-3 text-gray-800">{dept.required}</td>
                      <td className="p-3 text-gray-800">{dept.vacant}</td>
                      <td className={`p-3 font-semibold ${getUtilizationColor(dept.utilization)}`}>
                        {dept.utilization}%
                      </td>
                      <td className="p-3">
                        {dept.utilization >= 90 ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Optimal</span>
                        ) : dept.utilization >= 70 ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Understaffed</span>
                        ) : (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Critical</span>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button 
                onClick={() => navigate('/compliance/statutory')}
                className="p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-left"
              >
                <Users className="w-8 h-8 text-blue-600 mb-2" />
                <h3 className="font-semibold text-gray-800">Statutory Compliance</h3>
                <p className="text-sm text-gray-600">Manage statutory requirements</p>
              </button>
              
              <button 
                onClick={() => navigate('/compliance/labour')}
                className="p-4 border border-green-200 rounded-lg hover:bg-green-50 transition-colors text-left"
              >
                <Shield className="w-8 h-8 text-green-600 mb-2" />
                <h3 className="font-semibold text-gray-800">Labour Register</h3>
                <p className="text-sm text-gray-600">Review labour compliance</p>
              </button>
              
              <button 
                onClick={() => navigate('/compliance/nabh')}
                className="p-4 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors text-left"
              >
                <FileText className="w-8 h-8 text-purple-600 mb-2" />
                <h3 className="font-semibold text-gray-800">NABH Compliance</h3>
                <p className="text-sm text-gray-600">Healthcare compliance tracking</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManpowerComplianceDashboard;