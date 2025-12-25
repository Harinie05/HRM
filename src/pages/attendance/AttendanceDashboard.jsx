import React, { useState, useEffect } from 'react';
import { FiClock, FiUsers, FiSettings, FiUserCheck, FiUserX, FiTrendingUp, FiCalendar, FiBarChart } from 'react-icons/fi';
import api from '../../api';
import Layout from '../../components/Layout';

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
      <Layout title="Attendance Dashboard" subtitle="Loading attendance data...">
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-6 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-sm p-4 sm:p-6 mb-6 sm:mb-8 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 bg-white/20 rounded-xl flex-shrink-0">
                <FiClock className="text-white" size={20} />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-medium mb-1">Attendance Management Pipeline</div>
                <h1 className="text-lg sm:text-2xl font-bold mb-1">Employee Time & Attendance</h1>
                <p className="text-blue-100 text-xs sm:text-sm">Overview of employee attendance and time tracking</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="text-right">
                <div className="text-xs sm:text-sm text-blue-100 mb-1">Attendance Dashboard</div>
                <div className="text-xs text-blue-200">Real-time attendance metrics</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-blue-100 mb-1">OVERALL RATE</div>
                <div className="text-2xl sm:text-3xl font-bold">{attendanceData.overallAttendance}%</div>
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-sm text-blue-100">{attendanceData.presentToday} employees present</div>
              </div>
            </div>
          </div>
        </div>
        {/* Attendance Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-600 text-xs sm:text-sm font-medium">Overall Attendance</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-1">
                  {attendanceData.overallAttendance}%
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-green-100 flex-shrink-0">
                <FiTrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-600 text-xs sm:text-sm font-medium">Present Today</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-600 mt-1">
                  {attendanceData.presentToday}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-blue-100 flex-shrink-0">
                <FiUserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-600 text-xs sm:text-sm font-medium">Absent Today</p>
                <p className="text-2xl sm:text-3xl font-bold text-red-600 mt-1">
                  {attendanceData.absentToday}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-red-100 flex-shrink-0">
                <FiUserX className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-600 text-xs sm:text-sm font-medium">Late Arrivals</p>
                <p className="text-2xl sm:text-3xl font-bold text-yellow-600 mt-1">
                  {attendanceData.lateArrivals}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-yellow-100 flex-shrink-0">
                <FiClock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Department Wise Attendance & Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <FiBarChart className="text-blue-600" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Department Wise Attendance</h3>
            </div>
            <div className="space-y-4">
              {departments.length > 0 ? departments.map((dept, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">{dept.name}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div className={`${getAttendanceColor(dept.attendance)} h-2 rounded-full transition-all duration-300`} style={{width: `${dept.attendance}%`}}></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-10 text-right">{dept.attendance}%</span>
                  </div>
                </div>
              )) : (
                <div className="text-center text-gray-500 py-8">
                  <FiBarChart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p>No department data available</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <FiCalendar className="text-green-600" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Today's Summary</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Total Employees</span>
                <span className="font-semibold text-lg text-gray-900">{attendanceData.totalEmployees}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Attendance Rate</span>
                <span className="font-semibold text-lg text-green-600">{attendanceData.overallAttendance}%</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">On Time Arrivals</span>
                <span className="font-semibold text-lg text-blue-600">{attendanceData.presentToday - attendanceData.lateArrivals}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Late Arrivals</span>
                <span className="font-semibold text-lg text-yellow-600">{attendanceData.lateArrivals}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <button 
              onClick={() => window.location.href = '/attendance/logs'}
              className="group p-4 sm:p-6 border border-blue-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 text-left bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 min-h-[44px]"
            >
              <FiClock className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mb-2 sm:mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Punch Logs</h3>
              <p className="text-xs sm:text-sm text-gray-600">View attendance records</p>
            </button>
            
            <button 
              onClick={() => window.location.href = '/shift-roster'}
              className="group p-4 sm:p-6 border border-purple-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all duration-200 text-left bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 min-h-[44px]"
            >
              <FiUsers className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 mb-2 sm:mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Shift Roster</h3>
              <p className="text-xs sm:text-sm text-gray-600">Manage employee shifts</p>
            </button>
            
            <button 
              onClick={() => window.location.href = '/attendance/rules'}
              className="group p-4 sm:p-6 border border-green-200 rounded-xl hover:border-green-300 hover:shadow-md transition-all duration-200 text-left bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 min-h-[44px]"
            >
              <FiSettings className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mb-2 sm:mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Attendance Rules</h3>
              <p className="text-xs sm:text-sm text-gray-600">Configure policies</p>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AttendanceDashboard;