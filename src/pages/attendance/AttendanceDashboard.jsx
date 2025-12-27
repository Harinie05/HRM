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
        {/* Header with gradient background matching User page */}
        <div className="bg-white rounded-3xl border-2 border-black shadow-sm p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 border border-black rounded-2xl flex items-center justify-center mx-auto sm:mx-0">
                <FiClock className="w-6 h-6 sm:w-8 sm:h-8 text-gray-700" />
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Attendance Dashboard</h1>
                <p className="text-gray-600 text-base sm:text-lg mb-1">Real-time attendance tracking, analytics & workforce insights</p>
                <p className="text-gray-500 text-sm">Time & Attendance Management</p>
              </div>
            </div>
            <div className="text-center sm:text-right">
              <div className="bg-gray-100 rounded-xl p-3 border border-black text-center">
                <div className="flex items-center justify-center gap-2 text-gray-600 mb-1">
                  <span className="text-xs font-medium">Attendance</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{attendanceData.overallAttendance}%</p>
              </div>
            </div>
          </div>
        </div>
        {/* Attendance Metrics Grid */}
        <div className="bg-white rounded-2xl border border-black p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-6">
            <div className="inline-flex items-center bg-gray-100 border border-black rounded-full px-3 py-1 text-sm text-gray-600">
              Present: {attendanceData.presentToday}
            </div>
            <div className="inline-flex items-center bg-gray-100 border border-black rounded-full px-3 py-1 text-sm text-gray-600">
              Absent: {attendanceData.absentToday}
            </div>
            <div className="inline-flex items-center bg-gray-100 border border-black rounded-full px-3 py-1 text-sm text-gray-600">
              Late: {attendanceData.lateArrivals}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-black">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-700">Overall Attendance</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                    {attendanceData.overallAttendance}%
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 border border-black rounded-xl flex items-center justify-center">
                  <FiTrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-black">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-700">Present Today</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                    {attendanceData.presentToday}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 border border-black rounded-xl flex items-center justify-center">
                  <FiUserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-black">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-700">Absent Today</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                    {attendanceData.absentToday}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 border border-black rounded-xl flex items-center justify-center">
                  <FiUserX className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-black">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-700">Late Arrivals</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                    {attendanceData.lateArrivals}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 border border-black rounded-xl flex items-center justify-center">
                  <FiClock className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Department Wise Attendance & Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-black p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 border border-black rounded-xl flex items-center justify-center">
                <FiBarChart className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Department Wise Attendance</h3>
            </div>
            <div className="space-y-4">
              {departments.length > 0 ? departments.map((dept, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="font-medium text-gray-700 text-sm sm:text-base">{dept.name}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-20 sm:w-24 bg-gray-200 border border-black rounded-full h-2">
                      <div className="bg-gray-600 h-2 rounded-full transition-all duration-300" style={{width: `${dept.attendance}%`}}></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-8 sm:w-10 text-right">{dept.attendance}%</span>
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

          <div className="bg-white rounded-2xl shadow-sm border border-black p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 border border-black rounded-xl flex items-center justify-center">
                <FiCalendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Today's Summary</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 text-sm sm:text-base">Total Employees</span>
                <span className="font-semibold text-lg text-gray-900">{attendanceData.totalEmployees}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 text-sm sm:text-base">Attendance Rate</span>
                <span className="font-semibold text-lg text-gray-900">{attendanceData.overallAttendance}%</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 text-sm sm:text-base">On Time Arrivals</span>
                <span className="font-semibold text-lg text-gray-900">{attendanceData.presentToday - attendanceData.lateArrivals}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 text-sm sm:text-base">Late Arrivals</span>
                <span className="font-semibold text-lg text-gray-900">{attendanceData.lateArrivals}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-black p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button 
              onClick={() => window.location.href = '/attendance/logs'}
              className="group p-4 sm:p-6 border border-black rounded-2xl hover:bg-gray-50 transition-all duration-200 text-left"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 border border-black rounded-xl flex items-center justify-center mb-4">
                <FiClock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Punch Logs</h3>
              <p className="text-xs sm:text-sm text-gray-600">View attendance records</p>
            </button>
            
            <button 
              onClick={() => window.location.href = '/shift-roster'}
              className="group p-4 sm:p-6 border border-black rounded-2xl hover:bg-gray-50 transition-all duration-200 text-left"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 border border-black rounded-xl flex items-center justify-center mb-4">
                <FiUsers className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Shift Roster</h3>
              <p className="text-xs sm:text-sm text-gray-600">Manage employee shifts</p>
            </button>
            
            <button 
              onClick={() => window.location.href = '/attendance/rules'}
              className="group p-4 sm:p-6 border border-black rounded-2xl hover:bg-gray-50 transition-all duration-200 text-left"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 border border-black rounded-xl flex items-center justify-center mb-4">
                <FiSettings className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Attendance Rules</h3>
              <p className="text-xs sm:text-sm text-gray-600">Configure policies</p>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AttendanceDashboard;
