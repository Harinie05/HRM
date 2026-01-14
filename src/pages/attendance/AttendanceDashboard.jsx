import React, { useState, useEffect } from 'react';
import { FiClock, FiUsers, FiSettings, FiUserCheck, FiUserX, FiTrendingUp, FiCalendar, FiBarChart } from 'react-icons/fi';
import api from '../../api';
import Layout from '../../components/Layout';
import useToast from '../../utils/useToast';
import Toast from '../../components/Toast';
import { hasPermission, isAdmin } from '../../utils/permissions';

const AttendanceDashboard = () => {
  const { toast, showToast, hideToast } = useToast();
  const [colors, setColors] = useState({ primary: '#2862e9', secondary: '#474e71' });
  
  // Permission checks
  const canViewAttendance = isAdmin() || hasPermission('view_attendance');
  const canViewReports = isAdmin() || hasPermission('view_attendance_reports');
  const canViewPunchLogs = isAdmin() || hasPermission('view_punch_logs');
  const canViewShifts = isAdmin() || hasPermission('VIEW_SHIFTS');
  const canViewRules = isAdmin() || hasPermission('view_attendance_rules');
  
  if (!canViewAttendance) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600">You do not have permission to view attendance dashboard.</p>
          </div>
        </div>
      </Layout>
    );
  }
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
    fetchColors();
    fetchAttendanceData();
  }, []);

  const fetchColors = async () => {
    try {
      const tenantCode = localStorage.getItem('tenantCode');
      if (tenantCode) {
        const response = await api.get(`/auth/branding/${tenantCode}`);
        if (response.data.primary_color && response.data.secondary_color) {
          const newColors = {
            primary: response.data.primary_color,
            secondary: response.data.secondary_color
          };
          setColors(newColors);
          document.documentElement.style.setProperty('--primary-color', newColors.primary);
          document.documentElement.style.setProperty('--secondary-color', newColors.secondary);
        }
      }
    } catch (error) {
      console.error('Error fetching colors:', error);
    }
  };

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
      
      // Fetch actual attendance data from punch logs only if user has permission
      let punchLogs = [];
      if (canViewPunchLogs) {
        const punchLogsRes = await api.get('/api/attendance/punches').catch(() => ({ data: [] }));
        punchLogs = punchLogsRes.data || [];
      }
      
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
      showToast('Failed to load attendance data', 'error');
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
      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Hero Header matching Dashboard */}
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border-0 shadow-sm p-6" style={{
          background: `linear-gradient(to right, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10, ${getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}10)`
        }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <FiClock className="h-6 w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Attendance Dashboard</h1>
                <p className="text-gray-600 text-sm mb-1">Real-time attendance tracking, analytics & workforce insights</p>
                <p className="text-gray-500 text-xs">Time & Attendance Management</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="bg-white rounded-lg p-3 border-0 shadow-sm">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <FiTrendingUp className="h-3 w-3" />
                  <span className="text-xs font-medium">Attendance</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{attendanceData.overallAttendance}%</p>
              </div>
            </div>
          </div>
        </div>
        {/* Key Performance Indicators matching Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border-0 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Overall Attendance</p>
                <p className="text-2xl font-bold text-gray-900">{attendanceData.overallAttendance}%</p>
                <p className="text-gray-400 text-xs mt-1">Today's rate</p>
              </div>
              <div className="p-3 rounded-lg" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <FiTrendingUp className="h-6 w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border-0 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Present Today</p>
                <p className="text-2xl font-bold text-gray-900">{attendanceData.presentToday}</p>
                <p className="text-gray-400 text-xs mt-1">Active employees</p>
              </div>
              <div className="p-3 rounded-lg" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <FiUserCheck className="h-6 w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border-0 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Absent Today</p>
                <p className="text-2xl font-bold text-gray-900">{attendanceData.absentToday}</p>
                <p className="text-gray-400 text-xs mt-1">Not present</p>
              </div>
              <div className="p-3 rounded-lg" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <FiUserX className="h-6 w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border-0 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Late Arrivals</p>
                <p className="text-2xl font-bold text-gray-900">{attendanceData.lateArrivals}</p>
                <p className="text-gray-400 text-xs mt-1">Delayed check-in</p>
              </div>
              <div className="p-3 rounded-lg" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <FiClock className="h-6 w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Section matching Dashboard */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border-0 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="p-5 border-b-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{
                    backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
                  }}>
                    <FiBarChart className="h-5 w-5" style={{
                      color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                    }} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Department Wise Attendance</h3>
                </div>
              </div>
            </div>
            
            <div className="p-5 space-y-4">
              {departments.length > 0 ? departments.map((dept, index) => (
                <div key={index} className="rounded-lg p-4" style={{
                  background: `linear-gradient(to right, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10, ${getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}10)`
                }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{dept.name}</p>
                      <p className="text-2xl font-bold text-gray-900">{dept.attendance}%</p>
                      <p className="text-xs text-gray-500">Attendance rate</p>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{
                    backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10`
                  }}>
                    <FiBarChart className="h-8 w-8" style={{
                      color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                    }} />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">No Department Data</h4>
                  <p className="text-gray-600">Department attendance will appear here</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border-0 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="p-5 border-b-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{
                    backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
                  }}>
                    <FiCalendar className="h-5 w-5" style={{
                      color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                    }} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Today's Summary</h3>
                </div>
              </div>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="rounded-lg p-4" style={{
                background: `linear-gradient(to right, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10, ${getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}10)`
              }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Employees</p>
                    <p className="text-2xl font-bold text-gray-900">{attendanceData.totalEmployees}</p>
                    <p className="text-xs text-gray-500">Workforce size</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg p-3 border" style={{
                  backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10`,
                  borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}30`
                }}>
                  <p className="text-xs font-medium mb-1" style={{
                    color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                  }}>On Time</p>
                  <p className="text-lg font-bold" style={{
                    color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                  }}>{attendanceData.presentToday - attendanceData.lateArrivals}</p>
                  <p className="text-xs" style={{
                    color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                  }}>Punctual arrivals</p>
                </div>
                <div className="rounded-lg p-3 border" style={{
                  backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10`,
                  borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}30`
                }}>
                  <p className="text-xs font-medium mb-1" style={{
                    color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                  }}>Late Arrivals</p>
                  <p className="text-lg font-bold" style={{
                    color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                  }}>{attendanceData.lateArrivals}</p>
                  <p className="text-xs" style={{
                    color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                  }}>Delayed check-in</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions matching Dashboard */}
        <div className="bg-white rounded-2xl border-0 shadow-sm overflow-hidden">
          <div className="p-6 border-b-0" style={{
            background: `linear-gradient(135deg, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}05, ${getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}05)`
          }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl" style={{
                  backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
                }}>
                  <FiSettings className="h-6 w-6" style={{
                    color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                  }} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Quick Actions</h2>
                  <p className="text-gray-600">Access attendance management tools and reports</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {canViewPunchLogs && (
                <div className="bg-white rounded-xl p-6 border-0 shadow-sm hover:shadow-md transition-all duration-300 group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl transition-all duration-300" style={{
                        backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}15`
                      }}>
                        <FiClock className="h-6 w-6" style={{
                          color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                        }} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Punch Logs</h3>
                        <p className="text-sm text-gray-600 mt-1">View attendance records</p>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => window.location.href = '/attendance/logs'}
                    className="w-full text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                    }}
                    onMouseEnter={(e) => {
                      const hoverColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                      e.target.style.backgroundColor = hoverColor;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5';
                    }}
                  >
                    <FiClock className="h-4 w-4" />
                    View Logs
                  </button>
                </div>
              )}
              
              {canViewShifts && (
                <div className="bg-white rounded-xl p-6 border-0 shadow-sm hover:shadow-md transition-all duration-300 group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl transition-all duration-300" style={{
                        backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}15`
                      }}>
                        <FiUsers className="h-6 w-6" style={{
                          color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                        }} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Shift Roster</h3>
                        <p className="text-sm text-gray-600 mt-1">Manage employee shifts</p>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => window.location.href = '/shift-roster'}
                    className="w-full text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                    }}
                    onMouseEnter={(e) => {
                      const hoverColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                      e.target.style.backgroundColor = hoverColor;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5';
                    }}
                  >
                    <FiUsers className="h-4 w-4" />
                    Manage Shifts
                  </button>
                </div>
              )}
              
              {canViewRules && (
                <div className="bg-white rounded-xl p-6 border-0 shadow-sm hover:shadow-md transition-all duration-300 group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl transition-all duration-300" style={{
                        backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}15`
                      }}>
                        <FiSettings className="h-6 w-6" style={{
                          color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                        }} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Attendance Rules</h3>
                        <p className="text-sm text-gray-600 mt-1">Configure policies</p>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => window.location.href = '/attendance/rules'}
                    className="w-full text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                    }}
                    onMouseEnter={(e) => {
                      const hoverColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                      e.target.style.backgroundColor = hoverColor;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5';
                    }}
                  >
                    <FiSettings className="h-4 w-4" />
                    Configure Rules
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Toast toast={toast} hideToast={hideToast} />
    </Layout>
  );
};

export default AttendanceDashboard;

