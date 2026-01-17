import { useEffect, useState } from "react";
import {
  RefreshCcw,
  ChevronDown,
  LogOut,
  Menu,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { hasPermission, isAdmin } from "../utils/permissions";

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

  // Get tenant name immediately for initial display
  const tenantDb = localStorage.getItem("tenant_db") || "hospital";
  const defaultName = tenantDb.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  
  // 🔹 Dynamic hospital info - load from backend first
  const [hospitalInfo, setHospitalInfo] = useState({
    name: defaultName,
    tagline: "Smart • Secure • NABH-Standard"
  });

  // Load organization info from backend
  useEffect(() => {
    const loadOrganizationInfo = async () => {
      try {
        const response = await api.get('/api/organization/branding');
        if (response.data && response.data.organization_name) {
          setHospitalInfo({
            name: response.data.organization_name,
            tagline: response.data.tagline || "Smart • Secure • NABH-Standard"
          });
          // Update localStorage
          localStorage.setItem("hospital_name", response.data.organization_name);
          localStorage.setItem("hospital_tagline", response.data.tagline || "");
        } else {
          // Fallback to localStorage
          const storedName = localStorage.getItem("hospital_name");
          const storedTagline = localStorage.getItem("hospital_tagline");
          const tenantDb = localStorage.getItem("tenant_db");
          
          if (storedName) {
            setHospitalInfo({
              name: storedName,
              tagline: storedTagline || "Smart • Secure • NABH-Standard"
            });
          } else if (tenantDb) {
            // Use tenant DB name as fallback - handle underscores and capitalize properly
            const displayName = tenantDb.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            setHospitalInfo({
              name: displayName,
              tagline: "Smart • Secure • NABH-Standard"
            });
          }
        }
      } catch (error) {
        // Fallback to localStorage on error
        const storedName = localStorage.getItem("hospital_name");
        const storedTagline = localStorage.getItem("hospital_tagline");
        const tenantDb = localStorage.getItem("tenant_db");
        
        if (storedName) {
          setHospitalInfo({
            name: storedName,
            tagline: storedTagline || "Smart • Secure • NABH-Standard"
          });
        } else if (tenantDb) {
          // Use tenant DB name as fallback - handle underscores and capitalize properly
          const displayName = tenantDb.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
          setHospitalInfo({
            name: displayName,
            tagline: "Smart • Secure • NABH-Standard"
          });
        }
      }
    };

    loadOrganizationInfo();
    
    // Listen for organization updates
    const handleOrgUpdate = () => {
      loadOrganizationInfo();
    };
    
    window.addEventListener('organization-updated', handleOrgUpdate);
    
    return () => {
      window.removeEventListener('organization-updated', handleOrgUpdate);
    };
  }, []);

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

      // Try the new dedicated endpoint first
      try {
        const response = await api.get(`/hospitals/users/${tenant}/me`);
        console.log('🎯 Current user info from /me endpoint:', response.data);
        console.log('🔍 Employee code from /me:', response.data.employee_code);
        
        setUserInfo({
          id: response.data.id,
          name: response.data.name,
          email: response.data.email,
          role: response.data.role_name || response.data.role || 'Employee',
          employee_code: response.data.employee_code
        });
        console.log('✅ User info set from /me endpoint:', {
          id: response.data.id,
          name: response.data.name,
          email: response.data.email,
          role: response.data.role_name || response.data.role || 'Employee',
          employee_code: response.data.employee_code
        });
        return;
      } catch (meError) {
        console.log('❌ /me endpoint failed, falling back to list endpoint:', meError);
      }

      // Fallback to the original list endpoint
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

  // Check today's attendance status - on page load and when status changes
  useEffect(() => {
    if (userInfo.id) {
      checkTodayAttendance();
    }
  }, [userInfo.id]);

  // Listen for attendance status updates
  useEffect(() => {
    const handleAttendanceUpdate = () => {
      checkTodayAttendance();
    };
    
    window.addEventListener('attendance-updated', handleAttendanceUpdate);
    
    return () => {
      window.removeEventListener('attendance-updated', handleAttendanceUpdate);
    };
  }, [userInfo.id]);

  const checkTodayAttendance = async () => {
    try {
      if (!userInfo.id) {
        setAttendanceStatus('not_checked_in');
        return;
      }
      
      // Always check API for current status
      const statusRes = await api.get(`/api/attendance/punches/check-status/${userInfo.id}`);
      const status = statusRes.data;
      
      console.log('Header: API status response:', status);
      
      if (status.checked_in && !status.checked_out) {
        console.log('Header: User is checked in, setting status to checked_in');
        setAttendanceStatus('checked_in');
      } else if (status.checked_out) {
        console.log('Header: User is checked out, setting status to checked_out');
        setAttendanceStatus('checked_out');
      } else {
        console.log('Header: User not checked in, setting status to not_checked_in');
        setAttendanceStatus('not_checked_in');
      }
    } catch (err) {
      console.error('Failed to check attendance:', err);
      setAttendanceStatus('not_checked_in');
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

    if (!(isAdmin() || hasPermission("punch_in"))) {
      alert('You do not have permission to punch in');
      return;
    }

    // Check for missed checkout first
    try {
      const statusRes = await api.get(`/api/attendance/punches/check-status/${userInfo.id}`);
      const status = statusRes.data;
      
      if (status.missed_checkout_yesterday) {
        const userConfirmed = window.confirm(
          `You missed yesterday's checkout (${status.yesterday_date}). Do you want to continue with today's check-in? Click OK to proceed, or Cancel to add regularization first.`
        );
        
        if (!userConfirmed) {
          // User wants to add regularization - show message and stop
          alert('Please contact HR to add regularization for the missed checkout before checking in.');
          return;
        }
        // If user clicks OK, continue with normal check-in
      }
    } catch (err) {
      console.error('Status check failed:', err);
      // Continue with punch-in attempt even if status check fails
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
      
      // Immediately check status from API to ensure sync
      await checkTodayAttendance();
      
      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      notification.innerHTML = `<div class="text-sm font-semibold">Swipe In Successful!</div>`;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
      
    } catch (err) {
      console.error('Swipe in failed:', err);
      console.error('Error details:', err.response?.data);
      
      // Handle specific error messages and update status accordingly
      if (err.response?.data?.detail?.includes('Already checked in today')) {
        setAttendanceStatus('checked_in');
        return;
      }
      
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

    if (!(isAdmin() || hasPermission("punch_out"))) {
      alert('You do not have permission to punch out');
      return;
    }

    setLoading(true);
    try {
      const currentDate = new Date().toISOString().split('T')[0];
      const currentTime = new Date().toTimeString().split(' ')[0];
      const ipAddress = await getClientIP();
      
      // First check current status
      const statusRes = await api.get(`/api/attendance/punches/check-status/${userInfo.id}`);
      const status = statusRes.data;
      
      if (!status.checked_in) {
        alert('You need to check in first before checking out.');
        setAttendanceStatus('not_checked_in');
        return;
      }
      
      if (status.checked_out) {
        alert('You have already checked out for today.');
        setAttendanceStatus('checked_out');
        return;
      }
      
      // Get today's punch record - try multiple search methods
      const res = await api.get('/api/attendance/punches/');
      let todayLog = res.data.find(log => 
        log.employee_id == userInfo.id && log.date === currentDate && !log.out_time
      );
      
      // If not found, try searching by employee_code
      if (!todayLog && userInfo.employee_code) {
        todayLog = res.data.find(log => 
          log.employee_code === userInfo.employee_code && log.date === currentDate && !log.out_time
        );
      }
      
      // If still not found, try searching with string comparison
      if (!todayLog) {
        todayLog = res.data.find(log => 
          String(log.employee_id) === String(userInfo.id) && log.date === currentDate && !log.out_time
        );
      }
      
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
        
        console.log('Sending update data:', updateData);
        
        await api.put(`/api/attendance/punches/${todayLog.id}/`, updateData);
        
        setAttendanceStatus('checked_out');
        
        const notification = document.createElement('div');
        notification.className = 'fixed top-20 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        notification.innerHTML = `<div class="text-sm font-semibold">Swipe Out Successful!</div>`;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
        
      } else {
        // If no record found, check if user is actually checked in
        if (status.checked_in) {
          alert('Unable to find your check-in record. Please contact HR.');
        } else {
          alert('You need to check in first before checking out.');
          setAttendanceStatus('not_checked_in');
        }
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
      className="fixed top-0 left-0 right-0 z-30 h-12 sm:h-14
      flex items-center justify-between
      shadow-md transition-all duration-300 px-3 sm:px-6"
      style={{ 
        backgroundColor: 'var(--header-bg, #3B5BDB)',
        color: 'var(--header-text-color, #ffffff)',
        paddingLeft: window.innerWidth >= 1024 ? (isSidebarCollapsed ? "88px" : "280px") : "16px",
        paddingRight: window.innerWidth >= 768 ? "24px" : "16px"
      }}
    >
      {/* 🔵 Left: Mobile Menu Button + Hospital name */}
      <div className="flex items-center gap-3 leading-tight min-w-0 flex-1">
        {/* Mobile Menu Button */}
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden flex items-center justify-center
          bg-white/10 hover:bg-white/20
          w-10 h-10 rounded-full transition min-h-[44px]"
        >
          <Menu size={18} />
        </button>
        
        <div className="min-w-0 flex-1">
          <h1 className="text-sm sm:text-lg font-semibold tracking-wide truncate" style={{ color: 'var(--header-text-color, #ffffff)' }}>
            {hospitalInfo.name}
          </h1>
          <p className="text-xs sm:text-sm font-medium hidden sm:block" style={{ color: 'var(--header-text-color, #ffffff)', opacity: 0.8 }}>
            {hospitalInfo.tagline}
          </p>
        </div>
      </div>

      {/* 🔵 Right controls */}
      <div className="flex items-center gap-1 sm:gap-3">

        {/* Date + Time */}
        <div className="hidden md:flex items-center gap-2 bg-white/10 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm">
          <span className="h-2 w-2 bg-green-400 rounded-full"></span>
          <span>{formattedDate}</span>
          <span className="opacity-60">•</span>
          <span>{formattedTime}</span>
        </div>

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
              className="h-7 w-7 sm:h-9 sm:w-9 rounded-full
              flex items-center justify-center
              font-bold text-xs sm:text-sm flex-shrink-0 shadow-sm"
              style={{
                backgroundColor: 'white',
                color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
                border: `2px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}`
              }}
            >
              {userInitial}
            </div>

            <div className="text-left hidden lg:block min-w-0">
              <p className="text-sm font-semibold leading-none truncate">
                {userInfo.name}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--header-text-color, #ffffff)', opacity: 0.8 }}>
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
              style={{
                border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}`
              }}
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
              {(isAdmin() || hasPermission("punch_in") || hasPermission("punch_out")) && (
                <div className="px-3 sm:px-4 py-2 border-b">
                  {attendanceStatus === 'not_checked_in' && (isAdmin() || hasPermission("punch_in")) && (
                    <button
                      onClick={handleSwipeIn}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition min-h-[40px]"
                    >
                      <Clock size={16} />
                      {loading ? 'Swiping...' : 'Swipe In'}
                    </button>
                  )}
                  {attendanceStatus === 'checked_in' && (isAdmin() || hasPermission("punch_out")) && (
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
              )}

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
