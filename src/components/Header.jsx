import { useEffect, useState } from "react";
import {
  RotateCcw,
  RefreshCcw,
  ChevronDown,
  LogOut,
  Menu,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function Header({ isSidebarCollapsed, onMobileMenuToggle }) {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const [showDropdown, setShowDropdown] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState('not_checked_in');
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState({
    id: null,
    name: 'Loading...',
    email: 'loading@mail.com',
    role: 'Employee',
    employee_code: null
  });

  // 🔹 Dynamic hospital info
  const hospitalName = localStorage.getItem("hospital_name") || "Your Hospital Name";
  const hospitalTagline = localStorage.getItem("hospital_tagline") || "Smart • Secure • NABH-Standard";

  const userInitial = userInfo.name.charAt(0).toUpperCase();

  // 🔹 Live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch user info from database
  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const tenant = localStorage.getItem('tenant_db');
      const currentEmail = localStorage.getItem('email');
      
      if (!token || !tenant || !currentEmail) {
        setUserInfo({
          id: localStorage.getItem('user_id'),
          name: localStorage.getItem('user_name') || currentEmail?.split('@')[0] || 'User',
          email: currentEmail || 'user@mail.com',
          role: localStorage.getItem('role_name') || 'Employee',
          employee_code: null
        });
        return;
      }

      const response = await api.get(`/hospitals/users/${tenant}/list`);
      console.log('🔍 Full API response:', response.data);
      const users = response.data.users || [];
      console.log('🔍 All users from API:', users);
      users.forEach((user, index) => {
        console.log(`User ${index}:`, user.name, user.email, user.employee_code);
      });
      const currentUser = users.find(user => user.email === currentEmail);
      console.log('🎯 Found current user:', currentUser);
      console.log('🔍 Looking for email:', currentEmail);
      
      let displayId = null;
      
      if (currentUser) {
        // Check employee_code from users table first
        if (currentUser.employee_code) {
          displayId = currentUser.employee_code;
          console.log('Found employee_code:', displayId);
        } else {
          // Check employee_id from onboarding table
          try {
            const onboardedResponse = await api.get(`/recruitment/onboarding/list`);
            console.log('Onboarded data:', onboardedResponse.data);
            console.log('Looking for email:', currentEmail, 'name:', currentUser.name);
            
            const onboardedUser = onboardedResponse.data.find(emp => 
              emp.candidate_email === currentEmail && emp.candidate_name === currentUser.name && emp.employee_id
            );
            console.log('Found onboarded user:', onboardedUser);
            
            if (onboardedUser?.employee_id) {
              displayId = onboardedUser.employee_id;
              console.log('Found employee_id:', displayId);
            } else {
              console.log('No employee_id found for onboarded user');
            }
          } catch (err) {
            console.log('No onboarded record found:', err);
          }
        }
        
        setUserInfo({
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role_name || currentUser.role || 'Employee',
          employee_code: displayId
        });
        console.log('Final userInfo set:', {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role_name || currentUser.role || 'Employee',
          employee_code: displayId
        });
      } else {
        setUserInfo({
          id: localStorage.getItem('user_id'),
          name: localStorage.getItem('user_name') || currentEmail.split('@')[0],
          email: currentEmail,
          role: localStorage.getItem('role_name') || 'Employee',
          employee_code: null
        });
      }
    } catch (err) {
      console.error('Failed to fetch user info:', err);
      const currentEmail = localStorage.getItem('email');
      setUserInfo({
        id: localStorage.getItem('user_id'),
        name: localStorage.getItem('user_name') || currentEmail?.split('@')[0] || 'User',
        email: currentEmail || 'user@mail.com',
        role: localStorage.getItem('role_name') || 'Employee',
        employee_code: null
      });
    }
  };

  // Check today's attendance status
  useEffect(() => {
    if (userInfo.id) {
      checkTodayAttendance();
    }
  }, [userInfo.id]);

  const checkTodayAttendance = async () => {
    try {
      if (!userInfo.id) return;
      
      const today = new Date().toISOString().split('T')[0];
      const res = await api.get('/api/attendance/punches/');
      const todayLog = res.data.find(log => 
        log.employee_id == userInfo.id && log.date === today
      );
      
      if (todayLog) {
        setAttendanceStatus(todayLog.out_time ? 'checked_out' : 'checked_in');
      } else {
        setAttendanceStatus('not_checked_in');
      }
    } catch (err) {
      console.error('Failed to check attendance:', err);
    }
  };

  const getClientIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (err) {
      return 'Unknown';
    }
  };

  const handleSwipeIn = async () => {
    if (!userInfo.id) {
      alert('User information not loaded');
      return;
    }

    setLoading(true);
    try {
      const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const currentTime = new Date().toTimeString().split(' ')[0]; // HH:MM:SS format
      const ipAddress = await getClientIP();
      
      const punchData = {
        employee_id: parseInt(userInfo.id),
        date: currentDate,
        in_time: currentTime,
        location: `${userInfo.employee_code || userInfo.id} - IP: ${ipAddress}`,
        source: 'SWIPE',
        status: 'Present',
        ip_address: ipAddress
      };
      
      console.log('Sending punch data:', punchData); // Debug log
      
      await api.post('/api/attendance/punches/', punchData);
      setAttendanceStatus('checked_in');
      
      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      notification.innerHTML = `<div class="text-sm font-semibold">Swipe In Successful!</div>`;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
      
    } catch (err) {
      console.error('Swipe in failed:', err);
      console.error('Error details:', err.response?.data);
      alert(`Swipe in failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipeOut = async () => {
    if (!userInfo.id) {
      alert('User information not loaded');
      return;
    }

    setLoading(true);
    try {
      const currentDate = new Date().toISOString().split('T')[0];
      const currentTime = new Date().toTimeString().split(' ')[0];
      const ipAddress = await getClientIP();
      
      const res = await api.get('/api/attendance/punches/');
      const todayLog = res.data.find(log => 
        log.employee_id == userInfo.id && log.date === currentDate && !log.out_time
      );
      
      if (todayLog) {
        const updateData = {
          employee_id: parseInt(todayLog.employee_id),
          date: todayLog.date,
          in_time: todayLog.in_time,
          out_time: currentTime,
          location: `${userInfo.employee_code || userInfo.id} - IP: ${ipAddress}`,
          source: todayLog.source,
          status: todayLog.status,
          ip_address: ipAddress
        };
        
        console.log('Sending update data:', updateData); // Debug log
        
        await api.put(`/api/attendance/punches/${todayLog.id}/`, updateData);
        setAttendanceStatus('checked_out');
        
        // Show success notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-20 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        notification.innerHTML = `<div class="text-sm font-semibold">Swipe Out Successful!</div>`;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
        
      } else {
        alert('No active check-in found for today.');
      }
    } catch (err) {
      console.error('Swipe out failed:', err);
      console.error('Error details:', err.response?.data);
      alert(`Swipe out failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = time.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });

  const formattedTime = time.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // 🔄 Sync → reload ONLY current page data
  const handleSync = () => {
    window.dispatchEvent(new Event("page-sync"));
  };

  // 🔁 Refresh → reload entire app
  const handleRefresh = () => {
    window.location.reload();
  };

  // 🔓 Logout
  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      console.error("Logout failed", e);
    }
    localStorage.clear();
    navigate("/login");
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-30 h-14 sm:h-16
      text-white
      flex items-center justify-between
      shadow-md transition-all duration-300 px-3 sm:px-6"
      style={{ 
        backgroundColor: 'var(--header-bg, #3B5BDB)',
        paddingLeft: window.innerWidth >= 1024 ? (isSidebarCollapsed ? "88px" : "280px") : "16px",
        paddingRight: window.innerWidth >= 768 ? "24px" : "16px"
      }}
    >
      {/* 🔵 Left: Hospital name */}
      <div className="leading-tight min-w-0 flex-1">
        <h1 className="text-sm sm:text-lg font-semibold tracking-wide truncate">
          {hospitalName}
        </h1>
        <p className="text-xs sm:text-sm text-blue-200 font-medium hidden sm:block">
          {hospitalTagline}
        </p>
      </div>

      {/* 🔵 Right controls */}
      <div className="flex items-center gap-1 sm:gap-3">
        {/* Mobile Menu Button */}
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden flex items-center justify-center
          bg-white/10 hover:bg-white/20
          w-10 h-10 rounded-full transition min-h-[44px]"
        >
          <Menu size={18} />
        </button>

        {/* Date + Time */}
        <div className="hidden md:flex items-center gap-2 bg-white/10 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm">
          <span className="h-2 w-2 bg-green-400 rounded-full"></span>
          <span>{formattedDate}</span>
          <span className="opacity-60">•</span>
          <span>{formattedTime}</span>
        </div>

        {/* Sync */}
        <button
          onClick={handleSync}
          className="flex items-center gap-1 sm:gap-2
          bg-white/10 hover:bg-white/20
          px-2 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm transition min-h-[44px]"
        >
          <RotateCcw size={14} className="sm:w-4 sm:h-4" />
          <span className="hidden lg:inline">Sync</span>
        </button>

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1 sm:gap-2
          bg-white/10 hover:bg-white/20
          px-2 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm transition min-h-[44px]"
        >
          <RefreshCcw size={14} className="sm:w-4 sm:h-4" />
          <span className="hidden lg:inline">Refresh</span>
        </button>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 sm:gap-3
            bg-white/10 hover:bg-white/20
            px-2 sm:px-3 py-1.5 rounded-full transition min-h-[44px]"
          >
            <div
              className="h-7 w-7 sm:h-9 sm:w-9 rounded-full bg-blue-200
              text-[#3B5BDB] flex items-center justify-center
              font-bold text-xs sm:text-sm flex-shrink-0"
            >
              {userInitial}
            </div>

            <div className="text-left hidden lg:block min-w-0">
              <p className="text-sm font-semibold leading-none truncate">
                {userInfo.name}
              </p>
              <p className="text-xs text-blue-200 truncate">
                {userInfo.employee_code ? `${userInfo.employee_code} • ${userInfo.role}` : userInfo.role}
              </p>
            </div>

            <ChevronDown
              size={14}
              className={`transition-transform sm:w-4 sm:h-4 ${
                showDropdown ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown */}
          {showDropdown && (
            <div
              className="absolute right-0 mt-2 w-48 sm:w-56
              bg-white text-primary
              rounded-xl shadow-lg overflow-hidden z-50"
            >
              <div className="px-3 sm:px-4 py-3 border-b">
                <p className="font-semibold text-sm truncate text-gray-900">{userInfo.name}</p>
                <p className="text-xs text-gray-600 truncate">{userInfo.email}</p>
                <p className="text-xs text-blue-600">{userInfo.role}</p>
                {userInfo.employee_code && (
                  <p className="text-xs text-gray-500">Employee ID: {userInfo.employee_code}</p>
                )}
              </div>

              {/* Swipe In/Out Buttons */}
              <div className="px-3 sm:px-4 py-2 border-b">
                {attendanceStatus === 'not_checked_in' && (
                  <button
                    onClick={handleSwipeIn}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition min-h-[40px]"
                  >
                    <Clock size={16} />
                    {loading ? 'Swiping...' : 'Swipe In'}
                  </button>
                )}
                {attendanceStatus === 'checked_in' && (
                  <button
                    onClick={handleSwipeOut}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition min-h-[40px]"
                  >
                    <Clock size={16} />
                    {loading ? 'Swiping...' : 'Swipe Out'}
                  </button>
                )}
                {attendanceStatus === 'checked_out' && (
                  <div className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg min-h-[40px]">
                    <Clock size={16} />
                    Checked Out
                  </div>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2
                px-3 sm:px-4 py-2 text-sm text-red-600
                hover:bg-red-50 transition min-h-[44px]"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
