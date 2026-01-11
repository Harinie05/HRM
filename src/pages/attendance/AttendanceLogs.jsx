import { useEffect, useState } from "react";
import api from "../../api";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import useToast from "../../utils/useToast";
import Toast from "../../components/Toast";
import DailyUpdates from "./DailyUpdates";
import AttendancePermission from "./AttendancePermission";

import * as XLSX from 'xlsx';
import { hasPermission, isAdmin } from '../../utils/permissions';

export default function AttendanceLogs() {
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('logs');
  const [colors, setColors] = useState({ primary: '#2862e9', secondary: '#474e71' });
  
  // Permission checks
  const canViewPunchLogs = isAdmin() || hasPermission('view_punch_logs');
  const canMarkAttendance = isAdmin() || hasPermission('mark_attendance');
  const canViewRegularization = isAdmin() || hasPermission('view_regularization');
  const canApplyRegularization = isAdmin() || hasPermission('apply_regularization');
  const canApproveRegularization = isAdmin() || hasPermission('approve_regularization');
  const canViewOdApplications = isAdmin() || hasPermission('view_od_applications');
  const canApplyOd = isAdmin() || hasPermission('apply_od');
  const canApproveOd = isAdmin() || hasPermission('approve_od');
  const canViewReports = isAdmin() || hasPermission('view_attendance_reports');
  
  if (!canViewPunchLogs) {
    return (
      <div className="flex bg-gradient-to-br from-gray-50 via-white to-blue-50 min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <div className="flex justify-center items-center h-64 pt-24">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
              <p className="text-gray-600">You do not have permission to view attendance logs.</p>
            </div>
          </div>
          <Footer />
        </div>
      </div>
    );
  }
  const [currentStatus, setCurrentStatus] = useState(null);
  const [checkInSource, setCheckInSource] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [currentUserInfo, setCurrentUserInfo] = useState(null);

  // Get current user info from localStorage
  const getCurrentUserId = () => {
    return localStorage.getItem('user_id');
  };

  const getCurrentUserInfo = () => {
    const userId = getCurrentUserId();
    if (!userId) return null;
    
    const employee = employees.find(emp => {
      if (emp.source === 'user_management') {
        return emp.original_user_id == userId;
      }
      return emp.id == userId;
    });
    
    return employee;
  };
  const [attendanceMode, setAttendanceMode] = useState("");
  const [gpsPermissionGranted, setGpsPermissionGranted] = useState(false);
  const [officeLocations, setOfficeLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const { toast, showToast, hideToast } = useToast();
  const [regularizationForm, setRegularizationForm] = useState({
    employee_id: "",
    date: "",
    issue_type: "Missed IN",
    reason: ""
  });
  const [regularizationRequests, setRegularizationRequests] = useState([]);
  const [reportFilters, setReportFilters] = useState({
    reportType: 'daily',
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    employeeId: ''
  });
  const [reportData, setReportData] = useState([]);
  const [odApplications, setOdApplications] = useState([]);
  const [odForm, setOdForm] = useState({
    employee_id: "",
    od_date: "",
    purpose: "",
    from_time: "",
    to_time: "",
    location: ""
  });

  // Auto-populate current user in forms when employees are loaded
  useEffect(() => {
    if (employees.length > 0) {
      const currentUserId = localStorage.getItem('user_id');
      if (currentUserId) {
        const currentUserEmployee = employees.find(emp => {
          if (emp.source === 'user_management') {
            return emp.original_user_id == currentUserId;
          }
          return emp.id == currentUserId;
        });
        
        if (currentUserEmployee) {
          if (!regularizationForm.employee_id) {
            setRegularizationForm(prev => ({
              ...prev,
              employee_id: currentUserEmployee.id
            }));
          }
          
          if (!odForm.employee_id) {
            setOdForm(prev => ({
              ...prev,
              employee_id: currentUserEmployee.id
            }));
          }
        }
      }
    }
  }, [employees]);

  useEffect(() => {
    fetchColors();
    fetchCurrentUserInfo();
    fetchEmployees();
    fetchLogs();
    fetchOfficeLocations();
    fetchRegularizationRequests();
    fetchOdApplications();
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

  const fetchCurrentUserInfo = async () => {
    try {
      const response = await api.get('/api/attendance/punches/current-user');
      setCurrentUserInfo(response.data);
    } catch (error) {
      console.error('Error fetching current user info:', error);
    }
  };

  // Auto-select current user and check status when both employees and logs are loaded
  useEffect(() => {
    if (employees.length > 0 && logs.length > 0 && !selectedEmployee) {
      const currentUserId = localStorage.getItem('user_id');
      if (currentUserId) {
        const currentUserEmployee = employees.find(emp => {
          if (emp.source === 'user_management') {
            return emp.original_user_id == currentUserId;
          }
          return emp.id == currentUserId;
        });
        if (currentUserEmployee) {
          setSelectedEmployee(currentUserEmployee.id);
        }
      }
    }
  }, [employees, logs]);

  // Check status when employee is selected and logs are available
  useEffect(() => {
    if (selectedEmployee && logs.length > 0) {
      checkTodayStatus();
    }
  }, [selectedEmployee, logs]);

  const fetchEmployees = async () => {
    try {
      setEmployeesLoading(true);
      const tenant = localStorage.getItem("tenant_db");
      const token = localStorage.getItem("access_token");
      
      if (!tenant || !token) {
        setEmployeesLoading(false);
        return;
      }
      
      const [onboardingRes, usersRes] = await Promise.all([
        api.get('/recruitment/onboarding/list').catch(() => ({ data: [] })),
        fetch(`http://localhost:8000/hospitals/users/${tenant}/list`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => res.ok ? res.json() : { users: [] }).catch(() => ({ users: [] }))
      ]);
      
      const onboardedEmployees = onboardingRes.data || [];
      const userEmployees = usersRes.users || [];
      
      const validOnboardedEmployees = onboardedEmployees.filter(emp => {
        if (!emp.employee_id || emp.employee_id.trim() === '') return false;
        const isAutoGenerated = /^[A-Z]{3}\d{6}$/.test(emp.employee_id);
        return !isAutoGenerated;
      });
      
      const onboardedData = validOnboardedEmployees.map(emp => ({
        id: emp.application_id,
        name: emp.candidate_name,
        employee_code: emp.employee_id,
        source: 'onboarding'
      }));
      
      const userEmployeeData = userEmployees
        .filter(user => user.employee_code)
        .map(user => ({
          id: `user_${user.id}`,
          original_user_id: user.id,
          name: user.name,
          employee_code: user.employee_code,
          source: 'user_management'
        }));
      
      const allEmployees = [...onboardedData];
      userEmployeeData.forEach(userEmp => {
        const existingIndex = allEmployees.findIndex(emp => emp.employee_code === userEmp.employee_code);
        if (existingIndex === -1) {
          allEmployees.push(userEmp);
        } else {
          allEmployees[existingIndex] = userEmp;
        }
      });
      
      setEmployees(allEmployees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      showToast('Failed to load employees', 'error');
    } finally {
      setEmployeesLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await api.get("/api/attendance/punches/");
      setLogs(res.data);
      return res.data;
    } catch (err) {
      console.error("Failed to fetch logs:", err);
      return [];
    }
  };

  const fetchOfficeLocations = async () => {
    try {
      const res = await api.get("/api/attendance/locations/");
      setOfficeLocations(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedLocation(res.data[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch locations:", err);
      setOfficeLocations([{ id: 1, name: "Office - Main Building" }]);
      setSelectedLocation(1);
    }
  };

  const checkTodayStatus = async () => {
    if (!selectedEmployee) {
      setCurrentStatus('not_checked_in');
      setCheckInSource(null);
      setAttendanceMode('');
      return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    const actualEmployeeId = selectedEmployee.startsWith('user_') ? selectedEmployee.replace('user_', '') : selectedEmployee;
    
    console.log('Checking status for employee:', actualEmployeeId, 'on date:', today);
    
    // First check local logs
    const todayLog = logs.find(log => 
      log.employee_id == actualEmployeeId && log.date === today
    );
    
    console.log('Found local log:', todayLog);
    
    if (todayLog) {
      if (todayLog.out_time) {
        console.log('Setting status to checked_out');
        setCurrentStatus('checked_out');
        setCheckInSource(null);
        setAttendanceMode('');
      } else {
        console.log('Setting status to checked_in with source:', todayLog.source);
        setCurrentStatus('checked_in');
        setCheckInSource(todayLog.source);
        setAttendanceMode(todayLog.source);
      }
      return;
    }
    
    // If no local log found, check API
    try {
      const statusRes = await api.get(`/api/attendance/punches/check-status/${actualEmployeeId}`);
      const status = statusRes.data;
      
      console.log('API status response:', status);
      
      if (status.checked_in && !status.checked_out) {
        console.log('API: Setting status to checked_in with source:', status.source);
        setCurrentStatus('checked_in');
        setCheckInSource(status.source);
        setAttendanceMode(status.source);
      } else if (status.checked_out) {
        console.log('API: Setting status to checked_out');
        setCurrentStatus('checked_out');
        setCheckInSource(null);
        setAttendanceMode('');
      } else {
        console.log('API: Setting status to not_checked_in');
        setCurrentStatus('not_checked_in');
        setCheckInSource(null);
        setAttendanceMode('');
      }
    } catch (err) {
      console.error('Failed to check status:', err);
      setCurrentStatus('not_checked_in');
      setCheckInSource(null);
      setAttendanceMode('');
    }
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          resolve(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        },
        (error) => {
          console.warn('GPS error:', error);
          resolve('Location unavailable');
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    });
  };

  const handlePunchIn = async (source) => {
    // Check status first
    const currentUserId = selectedEmployee.startsWith('user_') ? selectedEmployee.replace('user_', '') : selectedEmployee;
    try {
      const statusRes = await api.get(`/api/attendance/punches/check-status/${currentUserId}`);
      const status = statusRes.data;
      
      // Handle missed checkout alert - Show alert but allow check-in
      if (status.missed_checkout_yesterday) {
        const userConfirmed = window.confirm(
          `You have missed yesterday's punch out (${status.yesterday_date}). Add regularization?`
        );
        
        if (userConfirmed) {
          // Auto-fill regularization form and switch to regularization tab
          setRegularizationForm({
            employee_id: selectedEmployee,
            date: status.yesterday_date,
            issue_type: "Missed OUT",
            reason: "Forgot to check out yesterday"
          });
          setActiveTab('regularization');
          return;
        }
        // If user clicks "No", continue with normal check-in
      }
      
      if (status.checked_in && !status.checked_out) {
        showToast('You are already checked in today!', 'error');
        setCurrentStatus('checked_in');
        setCheckInSource(status.source);
        return;
      }
      
      if (status.checked_out) {
        showToast('You have already completed attendance for today!', 'error');
        setCurrentStatus('checked_out');
        return;
      }
    } catch (err) {
      console.error('Status check failed:', err);
      // Continue with punch-in attempt even if status check fails
    }
    
    setLoading(true);
    try {
      const currentDate = new Date().toISOString().split('T')[0];
      const currentTime = new Date().toTimeString().split(' ')[0];
      
      const selectedLocationObj = officeLocations.find(loc => loc.id == selectedLocation);
      let locationStr = selectedLocationObj ? (selectedLocationObj.location_name || selectedLocationObj.name) : 'Office Location';
      
      if (source === 'MOBILE') {
        try {
          locationStr = await getCurrentLocation();
          locationStr = `GPS: ${locationStr}`;
        } catch (err) {
          showToast('Failed to get GPS location. Please try again.', 'error');
          setLoading(false);
          return;
        }
      }
      
      const actualEmployeeId = selectedEmployee.startsWith('user_') ? parseInt(selectedEmployee.replace('user_', '')) : parseInt(selectedEmployee);
      
      const punchData = {
        employee_id: actualEmployeeId,
        date: currentDate,
        in_time: currentTime,
        location: locationStr,
        source: source,
        status: 'Present'
      };
      
      const response = await api.post("/api/attendance/punches/", punchData);
      
      // Handle missed checkout alert from response
      if (response.data.alert === 'missed_checkout') {
        const confirmRegularization = window.confirm(response.data.message + ' Do you want to apply for regularization?');
        
        if (confirmRegularization) {
          setRegularizationForm({
            employee_id: selectedEmployee,
            date: response.data.yesterday_date,
            issue_type: "Missed OUT",
            reason: "Forgot to check out yesterday"
          });
          setActiveTab('regularization');
          setLoading(false);
          return;
        }
      }
      
      setCurrentStatus('checked_in');
      setCheckInSource(source);
      fetchLogs();
      checkTodayStatus(); // Refresh status after successful check-in
      
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      notification.innerHTML = `
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
          </svg>
          <div>
            <div class="font-semibold">Check-In Successful!</div>
            <div class="text-sm opacity-90">Time: ${new Date().toLocaleTimeString()}</div>
          </div>
        </div>
      `;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 4000);
      
    } catch (err) {
      console.error("Punch-in failed:", err);
      const errorDetail = err.response?.data?.detail || err.message;
      
      // Handle specific error messages
      if (errorDetail.includes('Already checked in today')) {
        setCurrentStatus('checked_in');
        checkTodayStatus(); // Refresh status
      } else if (errorDetail.includes('Attendance already completed')) {
        setCurrentStatus('checked_out');
        checkTodayStatus(); // Refresh status
      }
      
      showToast(`Check-in failed: ${errorDetail}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePunchOut = async (source) => {
    if (currentStatus !== 'checked_in') {
      showToast('You need to check in first!', 'error');
      return;
    }
    
    if (checkInSource !== source) {
      showToast(`You checked in via ${checkInSource}. Please use ${checkInSource} check-out.`, 'error');
      return;
    }
    
    setLoading(true);
    try {
      const currentDate = new Date().toISOString().split('T')[0];
      const currentTime = new Date().toTimeString().split(' ')[0];
      
      const actualEmployeeId = selectedEmployee.startsWith('user_') ? selectedEmployee.replace('user_', '') : selectedEmployee;
      const todayLog = logs.find(log => 
        log.employee_id == actualEmployeeId && log.date === currentDate && !log.out_time
      );
      
      if (todayLog) {
        let locationStr = todayLog.location;
        
        if (source === 'MOBILE') {
          try {
            const gpsLocation = await getCurrentLocation();
            locationStr = `${todayLog.location} | Out: GPS ${gpsLocation}`;
          } catch (err) {
            locationStr = `${todayLog.location} | Out: Mobile`;
          }
        }
        
        const updateData = {
          employee_id: parseInt(todayLog.employee_id),
          date: todayLog.date,
          in_time: todayLog.in_time,
          out_time: currentTime,
          location: locationStr,
          source: todayLog.source,
          status: todayLog.status || 'Present'
        };
        
        await api.put(`/api/attendance/punches/${todayLog.id}/`, updateData);
        
        setCurrentStatus('checked_out');
        setCheckInSource(null);
        fetchLogs();
        
        const inTime = new Date(`2000-01-01 ${todayLog.in_time}`);
        const outTime = new Date(`2000-01-01 ${currentTime}`);
        const workHours = ((outTime - inTime) / (1000 * 60 * 60)).toFixed(1);
        
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        notification.innerHTML = `
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
            </svg>
            <div>
              <div class="font-semibold">Check-Out Successful!</div>
              <div class="text-sm opacity-90">Work Hours: ${workHours}h | Time: ${new Date().toLocaleTimeString()}</div>
            </div>
          </div>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
        
      } else {
        showToast("No active check-in found for today.", 'error');
      }
    } catch (err) {
      console.error("Check-out failed:", err);
      showToast("Check-out failed. Please try again.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegularizationRequests = async () => {
    try {
      const res = await api.get('/api/attendance/regularizations/');
      const requests = res.data.map(req => {
        const employee = employees.find(e => e.id == req.employee_id || `user_${e.original_user_id}` == `user_${req.employee_id}`);
        return {
          ...req,
          employee: employee ? `${employee.employee_code} - ${employee.name}` : `Employee ${req.employee_id}`,
          date: req.punch_date,
          type: req.issue_type
        };
      });
      setRegularizationRequests(requests);
    } catch (err) {
      console.error('Failed to fetch regularization requests:', err);
    }
  };

  const handleRegularizationSubmit = async () => {
    if (!regularizationForm.employee_id || !regularizationForm.date || !regularizationForm.reason.trim()) {
      showToast('Please fill all fields', 'error');
      return;
    }
    
    try {
      const actualEmployeeId = regularizationForm.employee_id.startsWith('user_') 
        ? parseInt(regularizationForm.employee_id.replace('user_', '')) 
        : parseInt(regularizationForm.employee_id);
      
      await api.post('/api/attendance/regularizations/', {
        employee_id: actualEmployeeId,
        punch_date: regularizationForm.date,
        issue_type: regularizationForm.issue_type,
        reason: regularizationForm.reason
      });
      
      setRegularizationForm({ employee_id: "", date: "", issue_type: "Missed IN", reason: "" });
      fetchRegularizationRequests();
      showToast('Regularization request submitted successfully!');
    } catch (err) {
      console.error('Failed to submit regularization:', err);
      showToast('Failed to submit request. Please try again.', 'error');
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.patch(`/api/attendance/regularizations/${id}/approve`);
      fetchRegularizationRequests();
      showToast('Request approved successfully!');
    } catch (err) {
      console.error('Failed to approve:', err);
      showToast('Failed to approve request.', 'error');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.patch(`/api/attendance/regularizations/${id}/reject`);
      fetchRegularizationRequests();
      showToast('Request rejected!');
    } catch (err) {
      console.error('Failed to reject:', err);
      showToast('Failed to reject request.', 'error');
    }
  };

  const fetchOdApplications = async () => {
    try {
      const res = await api.get('/api/attendance/od-applications/');
      const applications = res.data.map(app => {
        const employee = employees.find(e => e.id == app.employee_id || `user_${e.original_user_id}` == `user_${app.employee_id}`);
        return {
          ...app,
          employee: employee ? `${employee.employee_code} - ${employee.name}` : `Employee ${app.employee_id}`
        };
      });
      setOdApplications(applications);
    } catch (err) {
      console.error('Failed to fetch OD applications:', err);
    }
  };

  const handleOdSubmit = async () => {
    if (!odForm.employee_id || !odForm.od_date || !odForm.purpose.trim()) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    
    try {
      const actualEmployeeId = odForm.employee_id.startsWith('user_') 
        ? parseInt(odForm.employee_id.replace('user_', '')) 
        : parseInt(odForm.employee_id);
      
      await api.post('/api/attendance/od-applications/', {
        employee_id: actualEmployeeId,
        od_date: odForm.od_date,
        purpose: odForm.purpose,
        from_time: odForm.from_time,
        to_time: odForm.to_time,
        location: odForm.location
      });
      
      setOdForm({ employee_id: "", od_date: "", purpose: "", from_time: "", to_time: "", location: "" });
      fetchOdApplications();
      showToast('OD application submitted successfully!');
    } catch (err) {
      console.error('Failed to submit OD application:', err);
      showToast('Failed to submit application. Please try again.', 'error');
    }
  };

  const handleOdApprove = async (id) => {
    try {
      await api.patch(`/api/attendance/od-applications/${id}/approve`);
      fetchOdApplications();
      showToast('OD application approved successfully!');
    } catch (err) {
      console.error('Failed to approve OD application:', err);
      showToast('Failed to approve application.', 'error');
    }
  };

  const handleOdReject = async (id) => {
    try {
      await api.patch(`/api/attendance/od-applications/${id}/reject`);
      fetchOdApplications();
      showToast('OD application rejected!');
    } catch (err) {
      console.error('Failed to reject OD application:', err);
      showToast('Failed to reject application.', 'error');
    }
  };

  useEffect(() => {
    if (employees.length > 0) {
      fetchRegularizationRequests();
      fetchOdApplications();
    }
  }, [employees]);

  const exportToExcel = () => {
    if (reportData.length === 0) {
      showToast('Please generate a report first', 'error');
      return;
    }

    const excelData = reportData.map(log => {
      const employee = employees.find(emp => emp.id == log.employee_id);
      return {
        'Employee Code': employee?.employee_code || log.employee_id,
        'Employee Name': employee?.name || '',
        'Date': log.date,
        'In Time': log.in_time || '-',
        'Out Time': log.out_time || '-',
        'Location': log.location || '-',
        'Status': log.status,
        'Source': log.source
      };
    });

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance Report');
    XLSX.writeFile(wb, `attendance-report-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const tabs = [
    ...(canViewPunchLogs ? [{ id: 'logs', label: 'Punch Logs' }] : []),
    ...(isAdmin() || hasPermission('view_daily_updates') ? [{ id: 'daily-updates', label: 'Daily Updates' }] : []),
    ...(canViewRegularization ? [{ id: 'regularization', label: 'Regularization' }] : []),
    ...(canViewOdApplications ? [{ id: 'od', label: 'OD Applications' }] : []),
    ...(isAdmin() || hasPermission('apply_attendance_permission') ? [{ id: 'attendance-permission', label: 'Attendance Permission' }] : []),
    ...(canViewReports ? [{ id: 'reports', label: 'Reports' }] : []),
  ];

  return (
    <div className="flex bg-gradient-to-br from-gray-50 via-white to-blue-50 min-h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <Header />
        
        <div className="p-4 sm:p-6 pt-24 space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg border-2 border-black mb-6 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg border border-black flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1">Attendance Management</h1>
                  <p className="text-sm sm:text-base text-gray-600">Advanced tracking with Web & Mobile GPS, smart regularization, and comprehensive reporting</p>
                  <div className="flex items-center space-x-3 mt-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                      <span className="text-xs text-gray-500">{logs.length} Active Records</span>
                    </div>
                    <div className="w-px h-3 bg-gray-300"></div>
                    <span className="text-xs text-gray-600">Real-time Attendance Tracking</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-lg border border-black p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 sm:mb-6">
              <span className="text-sm text-gray-600">Attendance</span>
              <div className="flex items-center bg-gray-100 rounded-full border border-black p-1 overflow-x-auto scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      // Reset all button styles
                      setTimeout(() => {
                        const buttons = document.querySelectorAll('[data-tab-button]');
                        buttons.forEach(btn => {
                          if (btn.getAttribute('data-tab-id') !== tab.id) {
                            btn.style.backgroundColor = 'transparent';
                            btn.style.color = '#6b7280';
                          }
                        });
                      }, 0);
                    }}
                    data-tab-button
                    data-tab-id={tab.id}
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-full transition-colors whitespace-nowrap flex-shrink-0 ${
                      activeTab === tab.id
                        ? "text-white" 
                        : "text-gray-500"
                    }`}
                    style={{
                      backgroundColor: activeTab === tab.id ? colors.primary : 'transparent',
                      color: activeTab === tab.id ? 'white' : '#6b7280'
                    }}
                    onMouseEnter={(e) => {
                      if (activeTab !== tab.id) {
                        e.target.style.backgroundColor = colors.secondary;
                        e.target.style.color = 'white';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== tab.id) {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.color = '#6b7280';
                      }
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            
            {activeTab === 'logs' && (
              <div className="p-4 sm:p-6">
                {/* Employee Selection */}
                <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gray-50 rounded-lg border border-black">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Select Employee
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Employee</label>
                      {isAdmin() ? (
                        <select
                          value={selectedEmployee}
                          onChange={(e) => setSelectedEmployee(e.target.value)}
                          className="w-full px-3 sm:px-4 py-2 bg-white border border-black rounded-lg focus:ring-1 focus:ring-gray-500 focus:border-gray-500 text-sm sm:text-base"
                        >
                          <option value="">Select Employee</option>
                          {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>
                              {emp.employee_code || `EMP${emp.id}`} - {emp.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="w-full px-3 sm:px-4 py-2 bg-gray-50 border border-black rounded-lg text-gray-700">
                          {employeesLoading ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                              Loading...
                            </div>
                          ) : (() => {
                            const currentUserId = localStorage.getItem('user_id');
                            const currentUserEmployee = employees.find(emp => {
                              if (emp.source === 'user_management') {
                                return emp.original_user_id == currentUserId;
                              }
                              return emp.id == currentUserId;
                            });
                            
                            if (currentUserEmployee) {
                              return `${currentUserEmployee.employee_code} - ${currentUserEmployee.name}`;
                            } else if (currentUserInfo) {
                              return `${currentUserInfo.employee_code} - ${currentUserInfo.name}`;
                            } else {
                              return `EMP${currentUserId} - Current User`;
                            }
                          })()}
                        </div>
                      )}
                    </div>
                  
                    {attendanceMode === 'WEB' && (
                      <div className="mt-4 sm:mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Office Location</label>
                        {!showAddLocation ? (
                          <select
                            value={selectedLocation}
                            onChange={(e) => {
                              if (e.target.value === 'add_new') {
                                setShowAddLocation(true);
                              } else {
                                setSelectedLocation(e.target.value);
                              }
                            }}
                            className="w-full px-3 sm:px-4 py-2 bg-white border border-black rounded-lg focus:ring-1 focus:ring-gray-500 focus:border-gray-500 text-sm sm:text-base"
                          >
                            {officeLocations.map((location) => (
                              <option key={location.id} value={location.id}>
                                {location.location_name || location.name}
                              </option>
                            ))}
                            <option value="add_new">+ Add New Location</option>
                          </select>
                        ) : (
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                            <input
                              type="text"
                              value={newLocationName}
                              onChange={(e) => setNewLocationName(e.target.value)}
                              placeholder="Enter location name"
                              className="flex-1 px-3 sm:px-4 py-2 bg-white border border-black rounded-lg focus:ring-1 focus:ring-gray-500 focus:border-gray-500 text-sm sm:text-base"
                            />
                            <div className="flex gap-2 sm:gap-4">
                              <button
                                onClick={async () => {
                                  if (newLocationName.trim()) {
                                    try {
                                      const res = await api.post('/api/attendance/locations/', {
                                        location_name: newLocationName.trim()
                                      });
                                      const newLocation = res.data;
                                      setOfficeLocations([...officeLocations, newLocation]);
                                      setSelectedLocation(newLocation.id);
                                      setNewLocationName('');
                                      setShowAddLocation(false);
                                    } catch (err) {
                                      showToast('Failed to add location. Please try again.', 'error');
                                    }
                                  }
                                }}
                                className="px-3 sm:px-4 py-2 bg-white text-black border border-black rounded-lg hover:bg-gray-100 font-medium text-sm transition-colors"
                              >
                                Add
                              </button>
                              <button
                                onClick={() => {
                                  setShowAddLocation(false);
                                  setNewLocationName('');
                                }}
                                className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 border border-black rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {selectedEmployee && !attendanceMode && currentStatus === 'not_checked_in' && canMarkAttendance && (
                  <div className="mb-6 sm:mb-8 p-4 sm:p-6 lg:p-8 bg-white rounded-3xl border border-black shadow-xl">
                    <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-4 sm:mb-6 text-gray-900">Choose Attendance Mode</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <button
                        onClick={() => setAttendanceMode('WEB')}
                        className="group p-4 sm:p-6 lg:p-8 border border-black rounded-3xl hover:bg-gray-50 transition-all duration-300 text-left shadow-lg hover:shadow-xl"
                      >
                        <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gray-100 border border-black rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path>
                            </svg>
                          </div>
                          <h4 className="text-sm sm:text-base lg:text-lg font-bold text-gray-800">Web Check-In</h4>
                        </div>
                        <p className="text-gray-600 mb-2 sm:mb-3 text-xs sm:text-sm lg:text-base">Check in from office computer</p>
                        <div className="space-y-1">
                          <p className="text-xs sm:text-sm text-gray-500">• Select office location</p>
                          <p className="text-xs sm:text-sm text-gray-500">• No GPS required</p>
                        </div>
                      </button>
                      
                      <button
                        onClick={async () => {
                          if (!navigator.geolocation) {
                            showToast('Geolocation is not supported by this browser.', 'error');
                            return;
                          }
                          
                          setAttendanceMode('MOBILE');
                          setLoading(true);
                          
                          navigator.geolocation.getCurrentPosition(
                            (position) => {
                              setGpsPermissionGranted(true);
                              setLoading(false);
                              showToast('GPS permission granted! You can now check in.');
                            },
                            (error) => {
                              console.error('GPS error:', error);
                              setGpsPermissionGranted(false);
                              setAttendanceMode("");
                              setLoading(false);
                              
                              let errorMsg = 'GPS permission denied. ';
                              if (error.code === 1) {
                                errorMsg += 'Please allow location access in your browser settings and try again.';
                              } else if (error.code === 2) {
                                errorMsg += 'Location unavailable. Please check your GPS settings.';
                              } else {
                                errorMsg += 'Location request timed out. Please try again.';
                              }
                              showToast(errorMsg, 'error');
                            },
                            { 
                              timeout: 15000, 
                              enableHighAccuracy: true,
                              maximumAge: 0
                            }
                          );
                        }}
                        className="group p-4 sm:p-6 lg:p-8 border border-black rounded-3xl hover:bg-gray-50 transition-all duration-300 text-left shadow-lg hover:shadow-xl"
                      >
                        <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gray-100 border border-black rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
                            </svg>
                          </div>
                          <h4 className="text-sm sm:text-base lg:text-lg font-bold text-gray-800">Mobile GPS Check-In</h4>
                        </div>
                        <p className="text-gray-600 mb-2 sm:mb-3 text-xs sm:text-sm lg:text-base">Check in from mobile device</p>
                        <div className="space-y-1">
                          <p className="text-xs sm:text-sm text-gray-500">• GPS location tracking</p>
                          <p className="text-xs sm:text-sm text-gray-500">• Location permission required</p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {selectedEmployee && attendanceMode && (
                  <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-white rounded-lg border border-black">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          currentStatus === 'checked_in' ? 'bg-green-500' :
                          currentStatus === 'checked_out' ? 'bg-gray-500' :
                          'bg-gray-400'
                        }`}></div>
                        <div>
                          <div className="text-xs sm:text-sm font-semibold text-gray-900">
                            {currentStatus === 'checked_in' ? 'Currently Checked In' :
                             currentStatus === 'checked_out' ? 'Checked Out for Today' :
                             'Ready to Check In'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="text-xs text-gray-500">Employee</div>
                        <div className="font-medium text-gray-900 text-xs sm:text-sm">
                          {employees.find(e => e.id == selectedEmployee)?.name}
                          {(() => {
                            const employee = employees.find(e => e.id == selectedEmployee);
                            return employee?.employee_code ? (
                              <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded font-medium">
                                {employee.employee_code}
                              </span>
                            ) : null;
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedEmployee && (
                  <div>
                    {currentStatus === 'not_checked_in' && attendanceMode && (
                      <div className="text-center mb-6 sm:mb-8">
                        <div className="inline-block p-4 sm:p-6 lg:p-8 bg-white rounded-3xl border border-black shadow-2xl">
                          <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base lg:text-lg">
                            Ready to check in using <span className="font-bold text-gray-900">{attendanceMode}</span> mode
                            {attendanceMode === 'MOBILE' && gpsPermissionGranted && (
                              <span className="block sm:inline sm:ml-3 text-gray-600 font-semibold mt-1 sm:mt-0">✓ GPS Permission Granted</span>
                            )}
                          </p>
                          <button 
                            onClick={() => currentStatus === 'checked_in' ? handlePunchOut(attendanceMode) : handlePunchIn(attendanceMode)}
                            disabled={loading}
                            className="py-2 sm:py-3 lg:py-4 px-4 sm:px-6 lg:px-8 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 mx-auto shadow-xl hover:shadow-2xl bg-white text-black border border-black hover:bg-gray-100"
                          >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" fill="currentColor" viewBox="0 0 20 20">
                              {attendanceMode === 'WEB' ? (
                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path>
                              ) : (
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
                              )}
                            </svg>
                            <span className="text-xs sm:text-sm lg:text-base">
                              {currentStatus === 'checked_in' ? `${attendanceMode} Check-Out` : `${attendanceMode} Check-In`}
                            </span>
                          </button>
                          <button 
                            onClick={() => {
                              setAttendanceMode("");
                              setGpsPermissionGranted(false);
                            }}
                            className="mt-3 sm:mt-4 text-gray-600 hover:text-gray-800 font-semibold transition-colors text-xs sm:text-sm lg:text-base"
                          >
                            Change Mode
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {currentStatus === 'checked_in' && (
                      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-white rounded-lg border border-black">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1">Check Out</h3>
                            <p className="text-xs text-gray-600">
                              You checked in via <span className="font-medium text-gray-900">{checkInSource}</span>. Please use the same method to check out.
                            </p>
                          </div>
                          <button 
                            onClick={() => handlePunchOut(checkInSource)}
                            disabled={loading}
                            className="py-2 px-3 sm:px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl bg-white text-black border border-black hover:bg-gray-100"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path>
                            </svg>
                            <span className="text-xs sm:text-sm">{checkInSource} Check-Out</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {loading && (
                  <div className="text-center py-6 sm:py-8">
                    <div className="inline-flex items-center gap-2 sm:gap-3 text-gray-600 bg-white px-4 sm:px-6 py-2 sm:py-3 rounded-2xl shadow-lg border border-black">
                      <svg className="animate-spin w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="font-semibold text-sm sm:text-base">Processing...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border border-black overflow-hidden">
            {activeTab === 'logs' && (
              <div className="overflow-x-auto">
                <div className="px-4 py-3 bg-gray-50 border-b border-black">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                    Punch Logs - {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 sm:px-6 py-4 text-left font-semibold text-gray-700 text-xs sm:text-sm">Emp Code</th>
                        <th className="px-4 sm:px-6 py-4 text-left font-semibold text-gray-700 text-xs sm:text-sm">Date</th>
                        <th className="px-4 sm:px-6 py-4 text-left font-semibold text-gray-700 text-xs sm:text-sm">In</th>
                        <th className="px-4 sm:px-6 py-4 text-left font-semibold text-gray-700 text-xs sm:text-sm">Out</th>
                        <th className="px-4 sm:px-6 py-4 text-left font-semibold text-gray-700 text-xs sm:text-sm">Location</th>
                        <th className="px-4 sm:px-6 py-4 text-left font-semibold text-gray-700 text-xs sm:text-sm">Status</th>
                        <th className="px-4 sm:px-6 py-4 text-left font-semibold text-gray-700 text-xs sm:text-sm">Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const today = new Date().toISOString().split('T')[0];
                        const todayLogs = logs.filter(log => log.date === today);
                        
                        if (todayLogs.length === 0) {
                          return (
                            <tr>
                              <td colSpan="7" className="px-8 py-12 text-center text-gray-500">
                                <div className="flex flex-col items-center gap-3">
                                  <svg className="w-12 h-12 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
                                  </svg>
                                  <p className="text-lg font-medium">No attendance records for today</p>
                                  <p className="text-sm">Records will appear here once employees check in</p>
                                </div>
                              </td>
                            </tr>
                          );
                        }
                        
                        return todayLogs.map((log, index) => (
                          <tr key={log.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                              {(() => {
                                const employee = employees.find(emp => {
                                  if (emp.source === 'user_management') {
                                    return emp.original_user_id == log.employee_id;
                                  }
                                  return emp.id == log.employee_id;
                                });
                                return employee?.employee_code || log.employee_id;
                              })()}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">{log.date}</td>
                            <td className="px-6 py-4 text-sm text-gray-700 font-medium">{log.in_time || "-"}</td>
                            <td className="px-6 py-4 text-sm text-gray-700 font-medium">{log.out_time || "-"}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{log.location || "-"}</td>
                            <td className="px-6 py-4 text-sm">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                log.status === 'Present' ? 'bg-green-100 text-green-800' :
                                log.status === 'Late' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {log.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-700">{log.source}</td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'daily-updates' && (
              <div className="p-0">
                <DailyUpdates />
              </div>
            )}

            {activeTab === 'regularization' && (
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                  <div className="bg-gray-50 rounded-lg border border-black p-4 sm:p-6 lg:p-8">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Submit Regularization Request</h3>
                    <div className="space-y-4 sm:space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Employee</label>
                        {isAdmin() ? (
                          <select
                            value={regularizationForm.employee_id}
                            onChange={(e) => setRegularizationForm({...regularizationForm, employee_id: e.target.value})}
                            className="w-full px-3 sm:px-4 py-2 bg-white border border-black rounded-lg focus:ring-1 focus:ring-gray-500 focus:border-gray-500 text-sm sm:text-base"
                          >
                            <option value="">Select Employee</option>
                            {employees.map(emp => (
                              <option key={emp.id} value={emp.id}>
                                {emp.employee_code || `EMP${emp.id}`} - {emp.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="w-full px-3 sm:px-4 py-2 bg-gray-50 border border-black rounded-lg text-gray-700 text-sm sm:text-base">
                            {employeesLoading ? (
                              <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                Loading...
                              </div>
                            ) : (() => {
                              const currentUserId = localStorage.getItem('user_id');
                              const currentUserEmployee = employees.find(emp => {
                                if (emp.source === 'user_management') {
                                  return emp.original_user_id == currentUserId;
                                }
                                return emp.id == currentUserId;
                              });
                              
                              if (currentUserEmployee) {
                                return `${currentUserEmployee.employee_code} - ${currentUserEmployee.name}`;
                              } else if (currentUserInfo) {
                                return `${currentUserInfo.employee_code} - ${currentUserInfo.name}`;
                              } else {
                                return `EMP${currentUserId} - Current User`;
                              }
                            })()}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                        <input
                          type="date"
                          value={regularizationForm.date}
                          onChange={(e) => setRegularizationForm({...regularizationForm, date: e.target.value})}
                          className="w-full px-3 sm:px-4 py-2 bg-white border border-black rounded-lg focus:ring-1 focus:ring-gray-500 focus:border-gray-500 text-sm sm:text-base"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Issue Type</label>
                        <select
                          value={regularizationForm.issue_type}
                          onChange={(e) => setRegularizationForm({...regularizationForm, issue_type: e.target.value})}
                          className="w-full px-3 sm:px-4 py-2 bg-white border border-black rounded-lg focus:ring-1 focus:ring-gray-500 focus:border-gray-500 text-sm sm:text-base"
                        >
                          <option value="Missed IN">Missed IN</option>
                          <option value="Missed OUT">Missed OUT</option>
                          <option value="Both">Both</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                        <textarea
                          value={regularizationForm.reason}
                          onChange={(e) => setRegularizationForm({...regularizationForm, reason: e.target.value})}
                          rows="4"
                          className="w-full px-3 sm:px-4 py-2 bg-white border border-black rounded-lg focus:ring-1 focus:ring-gray-500 focus:border-gray-500 text-sm sm:text-base"
                          placeholder="Explain the reason for regularization..."
                        ></textarea>
                      </div>
                      <button
                        onClick={handleRegularizationSubmit}
                        className="w-full py-2 sm:py-3 text-white border border-black rounded-lg font-medium transition-colors text-sm sm:text-base"
                        style={{ backgroundColor: colors.primary }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = colors.secondary}
                        onMouseLeave={(e) => e.target.style.backgroundColor = colors.primary}
                      >
                        Submit Request
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-black p-4 sm:p-6 lg:p-8">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Pending Requests</h3>
                    <div className="space-y-3 sm:space-y-4 max-h-80 sm:max-h-96 overflow-y-auto">
                      {regularizationRequests.map((request) => (
                        <div key={request.id} className="p-3 sm:p-4 border border-black rounded-lg">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                            <div>
                              <p className="font-semibold text-gray-900 text-sm sm:text-base">{request.employee}</p>
                              <p className="text-xs sm:text-sm text-gray-600">{request.date} - {request.type}</p>
                            </div>
                            <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold border border-black self-start ${
                              request.status === 'Pending' ? 'bg-gray-100 text-gray-800' :
                              request.status === 'Approved' ? 'bg-gray-100 text-gray-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {request.status}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-700 mb-3">{request.reason}</p>
                          {canApproveRegularization && request.status === 'Pending' && (
                            <div className="flex flex-col sm:flex-row gap-2">
                              <button
                                onClick={() => handleApprove(request.id)}
                                className="px-3 sm:px-4 py-2 text-white border border-black rounded-lg text-xs sm:text-sm font-medium transition-colors"
                                style={{ backgroundColor: colors.primary }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = colors.secondary}
                                onMouseLeave={(e) => e.target.style.backgroundColor = colors.primary}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(request.id)}
                                className="px-3 sm:px-4 py-2 bg-white text-black border border-black rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-100 transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'od' && (
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                  <div className="bg-gray-50 rounded-lg border border-black p-4 sm:p-6 lg:p-8">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Submit OD Application</h3>
                    <div className="space-y-4 sm:space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Employee</label>
                        {isAdmin() ? (
                          <select
                            value={odForm.employee_id}
                            onChange={(e) => setOdForm({...odForm, employee_id: e.target.value})}
                            className="w-full px-3 sm:px-4 py-2 bg-white border border-black rounded-lg focus:ring-1 focus:ring-black focus:border-black text-sm sm:text-base"
                          >
                            <option value="">Select Employee</option>
                            {employees.map(emp => (
                              <option key={emp.id} value={emp.id}>
                                {emp.employee_code || `EMP${emp.id}`} - {emp.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="w-full px-3 sm:px-4 py-2 bg-gray-50 border border-black rounded-lg text-gray-700 text-sm sm:text-base">
                            {employeesLoading ? (
                              <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                Loading...
                              </div>
                            ) : (() => {
                              const currentUserId = localStorage.getItem('user_id');
                              const currentUserEmployee = employees.find(emp => {
                                if (emp.source === 'user_management') {
                                  return emp.original_user_id == currentUserId;
                                }
                                return emp.id == currentUserId;
                              });
                              
                              if (currentUserEmployee) {
                                return `${currentUserEmployee.employee_code} - ${currentUserEmployee.name}`;
                              } else if (currentUserInfo) {
                                return `${currentUserInfo.employee_code} - ${currentUserInfo.name}`;
                              } else {
                                return `EMP${currentUserId} - Current User`;
                              }
                            })()}
                          </div>
                      )}
                    </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">OD Date</label>
                        <input
                          type="date"
                          value={odForm.od_date}
                          onChange={(e) => setOdForm({...odForm, od_date: e.target.value})}
                          className="w-full px-3 sm:px-4 py-2 bg-white border border-black rounded-lg focus:ring-1 focus:ring-black focus:border-black text-sm sm:text-base"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">From Time</label>
                          <input
                            type="time"
                            value={odForm.from_time}
                            onChange={(e) => setOdForm({...odForm, from_time: e.target.value})}
                            className="w-full px-3 sm:px-4 py-2 bg-white border border-black rounded-lg focus:ring-1 focus:ring-black focus:border-black text-sm sm:text-base"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">To Time</label>
                          <input
                            type="time"
                            value={odForm.to_time}
                            onChange={(e) => setOdForm({...odForm, to_time: e.target.value})}
                            className="w-full px-3 sm:px-4 py-2 bg-white border border-black rounded-lg focus:ring-1 focus:ring-black focus:border-black text-sm sm:text-base"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                        <input
                          type="text"
                          value={odForm.location}
                          onChange={(e) => setOdForm({...odForm, location: e.target.value})}
                          className="w-full px-3 sm:px-4 py-2 bg-white border border-black rounded-lg focus:ring-1 focus:ring-black focus:border-black text-sm sm:text-base"
                          placeholder="Enter OD location"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Purpose</label>
                        <textarea
                          value={odForm.purpose}
                          onChange={(e) => setOdForm({...odForm, purpose: e.target.value})}
                          rows="4"
                          className="w-full px-3 sm:px-4 py-2 bg-white border border-black rounded-lg focus:ring-1 focus:ring-black focus:border-black text-sm sm:text-base"
                          placeholder="Explain the purpose of OD..."
                        ></textarea>
                      </div>
                      <button
                        onClick={handleOdSubmit}
                        className="w-full py-2 sm:py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors text-sm sm:text-base"
                      >
                        Submit Application
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-black p-4 sm:p-6 lg:p-8">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">OD Applications</h3>
                    <div className="space-y-3 sm:space-y-4 max-h-80 sm:max-h-96 overflow-y-auto">
                      {odApplications.map((application) => (
                        <div key={application.id} className="p-3 sm:p-4 border border-black rounded-lg">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                            <div>
                              <p className="font-semibold text-gray-900 text-sm sm:text-base">{application.employee}</p>
                              <p className="text-xs sm:text-sm text-gray-600">{application.od_date}</p>
                              <p className="text-xs sm:text-sm text-gray-600">{application.from_time} - {application.to_time}</p>
                            </div>
                            <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 self-start">
                              {application.status}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-700 mb-2"><strong>Location:</strong> {application.location}</p>
                          <p className="text-xs sm:text-sm text-gray-700 mb-3"><strong>Purpose:</strong> {application.purpose}</p>
                          {canApproveOd && (application.status === 'Pending' || application.status === 'pending') && (
                            <div className="flex flex-col sm:flex-row gap-2">
                              <button
                                onClick={() => handleOdApprove(application.id)}
                                className="px-3 sm:px-4 py-2 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors"
                                style={{ backgroundColor: 'var(--primary-color, #2862e9)' }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--secondary-color, #6b7280)'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary-color, #2862e9)'}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleOdReject(application.id)}
                                className="px-3 sm:px-4 py-2 bg-white text-black border border-black rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-100"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'attendance-permission' && (
              <div className="p-0">
                <AttendancePermission />
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="bg-gray-50 rounded-lg border border-black p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Generate Reports</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                      <select
                        value={reportFilters.reportType}
                        onChange={(e) => setReportFilters({...reportFilters, reportType: e.target.value})}
                        className="w-full px-3 sm:px-4 py-2 bg-white border border-black rounded-lg focus:ring-1 focus:ring-black focus:border-black text-sm sm:text-base"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                      <input
                        type="date"
                        value={reportFilters.fromDate}
                        onChange={(e) => setReportFilters({...reportFilters, fromDate: e.target.value})}
                        className="w-full px-3 sm:px-4 py-2 bg-white border border-black rounded-lg focus:ring-1 focus:ring-black focus:border-black text-sm sm:text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                      <input
                        type="date"
                        value={reportFilters.toDate}
                        onChange={(e) => setReportFilters({...reportFilters, toDate: e.target.value})}
                        className="w-full px-3 sm:px-4 py-2 bg-white border border-black rounded-lg focus:ring-1 focus:ring-black focus:border-black text-sm sm:text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Employee</label>
                      <select
                        value={reportFilters.employeeId}
                        onChange={(e) => setReportFilters({...reportFilters, employeeId: e.target.value})}
                        className="w-full px-3 sm:px-4 py-2 bg-white border border-black rounded-lg focus:ring-1 focus:ring-black focus:border-black text-sm sm:text-base"
                      >
                        <option value="">All Employees</option>
                        {employees.map((employee) => (
                          <option key={employee.id} value={employee.id}>
                            {employee.employee_code} - {employee.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 sm:mt-6">
                    <button
                      onClick={() => {
                        const filteredLogs = logs.filter(log => {
                          const logDate = new Date(log.date);
                          const fromDate = new Date(reportFilters.fromDate);
                          const toDate = new Date(reportFilters.toDate);
                          const dateInRange = logDate >= fromDate && logDate <= toDate;
                          
                          if (reportFilters.employeeId) {
                            const actualEmployeeId = reportFilters.employeeId.startsWith('user_') 
                              ? reportFilters.employeeId.replace('user_', '') 
                              : reportFilters.employeeId;
                            return dateInRange && log.employee_id == actualEmployeeId;
                          }
                          
                          return dateInRange;
                        });
                        setReportData(filteredLogs);
                      }}
                      className="px-4 sm:px-6 py-2 sm:py-3 text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
                      style={{ backgroundColor: 'var(--primary-color, #2862e9)' }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--secondary-color, #6b7280)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary-color, #2862e9)'}
                    >
                      Generate Report
                    </button>
                    <button onClick={exportToExcel}
                      className="px-4 sm:px-6 py-2 sm:py-3 text-white text-black border border-black rounded-lg font-medium hover:bg-gray-100 transition-colors text-sm sm:text-base" style={{ backgroundColor: 'var(--primary-color, #4575b5)' }} onMouseEnter={(e) => { e.target.style.backgroundColor = 'var(--secondary-color, #6b7280)'; }} onMouseLeave={(e) => { e.target.style.backgroundColor = 'var(--primary-color, #4575b5)'; }}
                    >
                      Export to Excel
                    </button>
                  </div>
                </div>

                {reportData.length > 0 && (
                  <div className="bg-white rounded-lg border border-black overflow-hidden">
                    <div className="px-3 sm:px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                      <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Report Results ({reportData.length} records)</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 sm:px-6 py-3 sm:py-4 text-left font-semibold text-gray-700 text-xs sm:text-sm">Employee</th>
                            <th className="px-3 sm:px-6 py-3 sm:py-4 text-left font-semibold text-gray-700 text-xs sm:text-sm">Date</th>
                            <th className="px-3 sm:px-6 py-3 sm:py-4 text-left font-semibold text-gray-700 text-xs sm:text-sm">In Time</th>
                            <th className="px-3 sm:px-6 py-3 sm:py-4 text-left font-semibold text-gray-700 text-xs sm:text-sm">Out Time</th>
                            <th className="px-3 sm:px-6 py-3 sm:py-4 text-left font-semibold text-gray-700 text-xs sm:text-sm">Location</th>
                            <th className="px-3 sm:px-6 py-3 sm:py-4 text-left font-semibold text-gray-700 text-xs sm:text-sm">Status</th>
                            <th className="px-3 sm:px-6 py-3 sm:py-4 text-left font-semibold text-gray-700 text-xs sm:text-sm">Source</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.map((log, index) => (
                            <tr key={log.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                              <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                                {(() => {
                                  const employee = employees.find(emp => {
                                    if (emp.source === 'user_management') {
                                      return emp.original_user_id == log.employee_id;
                                    }
                                    return emp.id == log.employee_id;
                                  });
                                  return employee ? `${employee.employee_code} - ${employee.name}` : log.employee_id;
                                })()}
                              </td>
                              <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{log.date}</td>
                              <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{log.in_time || "-"}</td>
                              <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{log.out_time || "-"}</td>
                              <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{log.location || "-"}</td>
                              <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold ${
                                  log.status === 'Present' ? 'bg-green-100 text-green-800' :
                                  log.status === 'Late' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {log.status}
                                </span>
                              </td>
                              <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{log.source}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <Footer />
        <Toast toast={toast} hideToast={hideToast} />
      </div>
    </div>
  );
}