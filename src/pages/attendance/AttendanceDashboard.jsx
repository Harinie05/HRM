import React, { useState, useEffect } from 'react';
import api from '../../api';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { Clock, Users, Settings, UserCheck, UserX, TrendingUp } from 'lucide-react';

const AttendanceDashboard = () => {
  const [attendanceData, setAttendanceData] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    lateArrivals: 0,
    overallAttendance: 0
  });
  const [departments, setDepartments] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const tenant_db = 'nutryah';
      
      // Fetch users for total employees
      const usersRes = await api.get(`/hospitals/users/${tenant_db}/list`).catch(() => ({ data: { users: [] } }));
      const users = usersRes.data?.users || [];
      const totalEmployees = users.length;
      
      // Fetch departments
      const deptRes = await api.get(`/hospitals/departments/${tenant_db}/list`).catch(() => ({ data: { departments: [] } }));
      const deptData = deptRes.data?.departments || [];
      
      // Fetch actual attendance data from punch logs
      const punchLogsRes = await api.get('/api/attendance/punches').catch(() => ({ data: [] }));
      const punchLogs = punchLogsRes.data || [];
      
      const today = new Date().toISOString().split('T')[0];
      const todayLogs = punchLogs.filter(log => log.date === today);
      
      console.log('Today logs:', todayLogs); // Debug log
      
      const presentToday = todayLogs.filter(log => 
        log.status === 'Present' || log.in_time
      ).length;
      
      const lateArrivals = todayLogs.filter(log => 
        log.status === 'Late'
      ).length;
      
      console.log('Late arrivals count:', lateArrivals); // Debug log
      console.log('Present today count:', presentToday); // Debug log
      
      const absentToday = totalEmployees - presentToday;
      const overallAttendance = totalEmployees > 0 ? ((presentToday / totalEmployees) * 100).toFixed(1) : 0;
      
      // Calculate department-wise attendance from punch logs
      console.log('Users sample:', users.slice(0, 2)); // Debug log
      console.log('Departments:', deptData); // Debug log
      console.log('Today logs sample:', todayLogs.slice(0, 2)); // Debug log
      
      const departmentAttendance = deptData.map(dept => {
        // Find employees in this department (try multiple field names)
        const deptEmployees = users.filter(user => 
          user.department_name === dept.name || 
          user.department === dept.name ||
          user.department_id === dept.id
        );
        
        console.log(`Department ${dept.name}: ${deptEmployees.length} employees`);
        
        // Find present employees in this department
        const deptPresent = todayLogs.filter(log => {
          // Try to match by employee_code or employee_id
          const employee = users.find(u => 
            u.employee_code === log.employee_code || 
            u.employee_code === log.emp_code ||
            u.id === log.employee_id
          );
          
          if (employee) {
            const isInDept = employee.department_name === dept.name || 
                           employee.department === dept.name ||
                           employee.department_id === dept.id;
            const isPresent = log.status === 'Present' || log.in_time;
            return isInDept && isPresent;
          }
          return false;
        }).length;
        
        console.log(`Department ${dept.name}: ${deptPresent} present out of ${deptEmployees.length}`);
        
        const attendance = deptEmployees.length > 0 ? ((deptPresent / deptEmployees.length) * 100).toFixed(0) : 0;
        
        return {
          name: dept.name,
          attendance: parseInt(attendance)
        };
      });
      
      setAttendanceData({
        totalEmployees,
        presentToday,
        absentToday,
        lateArrivals,
        overallAttendance
      });
      
      setDepartments(departmentAttendance);
      
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'late': return 'bg-red-500';
      case 'regularization': return 'bg-yellow-500';
      default: return 'bg-green-500';
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
              Attendance Management Dashboard
            </h1>
            <p className="text-gray-600">
              Overview of employee attendance and time tracking
            </p>
          </div>

          {/* Attendance Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="p-6 bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Overall Attendance</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">
                    {attendanceData.overallAttendance}%
                  </p>
                </div>
                <div className="p-3 rounded-full bg-green-100">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Present Today</p>
                  <p className="text-3xl font-bold text-blue-600 mt-1">
                    {attendanceData.presentToday}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-blue-100">
                  <UserCheck className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Absent Today</p>
                  <p className="text-3xl font-bold text-red-600 mt-1">
                    {attendanceData.absentToday}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-red-100">
                  <UserX className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Late Arrivals</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-1">
                    {attendanceData.lateArrivals}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-yellow-100">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Department Wise Attendance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-[#0D3B66] mb-4">Department Wise Attendance</h3>
              <div className="space-y-3">
                {departments.length > 0 ? departments.map((dept, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-gray-600">{dept.name}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className={`${getAttendanceColor(dept.attendance)} h-2 rounded-full`} style={{width: `${dept.attendance}%`}}></div>
                      </div>
                      <span className="text-sm font-semibold">{dept.attendance}%</span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center text-gray-500 py-4">No department data available</div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-[#0D3B66] mb-4">Attendance Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Employees</span>
                  <span className="font-semibold text-lg">{attendanceData.totalEmployees}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Attendance Rate</span>
                  <span className="font-semibold text-lg text-green-600">{attendanceData.overallAttendance}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">On Time Arrivals</span>
                  <span className="font-semibold text-lg text-blue-600">{attendanceData.presentToday - attendanceData.lateArrivals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Late Arrivals</span>
                  <span className="font-semibold text-lg text-yellow-600">{attendanceData.lateArrivals}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-[#0D3B66] mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button 
                onClick={() => window.location.href = '/attendance/logs'}
                className="p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-left"
              >
                <Clock className="w-8 h-8 text-blue-600 mb-2" />
                <h3 className="font-semibold text-gray-800">Punch Logs</h3>
                <p className="text-sm text-gray-600">View attendance records</p>
              </button>
              
              <button 
                onClick={() => window.location.href = '/shift-roster'}
                className="p-4 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors text-left"
              >
                <Users className="w-8 h-8 text-purple-600 mb-2" />
                <h3 className="font-semibold text-gray-800">Roster</h3>
                <p className="text-sm text-gray-600">Manage employee shifts</p>
              </button>
              
              <button 
                onClick={() => window.location.href = '/attendance/rules'}
                className="p-4 border border-green-200 rounded-lg hover:bg-green-50 transition-colors text-left"
              >
                <Settings className="w-8 h-8 text-green-600 mb-2" />
                <h3 className="font-semibold text-gray-800">Attendance Rules</h3>
                <p className="text-sm text-gray-600">Configure attendance rules & policies</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceDashboard;