import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ChevronDown,
  ChevronRight,
  Building2,
  UserPlus,
  UserCheck,
  Clock,
  DollarSign,
  Target,
  GraduationCap,
  Shield,
  LogOut,
  ChevronLeft,
  Briefcase,
} from "lucide-react";
import api from "../api";

// Add CSS for hiding scrollbar and preventing scroll reset
const sidebarStyle = `
  .sidebar-scroll::-webkit-scrollbar {
    display: none;
  }
  .sidebar-scroll {
    -ms-overflow-style: none;
    scrollbar-width: none;
    scroll-behavior: auto;
  }
`;

// Inject CSS
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = sidebarStyle;
  document.head.appendChild(styleSheet);
}

export default function Sidebar({ isCollapsed = false, onToggle }) {
  const location = useLocation();
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [openRecruitmentMenu, setOpenRecruitmentMenu] = useState(false);
  const [openAttendanceMenu, setOpenAttendanceMenu] = useState(
    location.pathname.startsWith("/attendance/") || location.pathname === "/shift-roster"
  );
  const [openPayrollMenu, setOpenPayrollMenu] = useState(false);
  const [openAnalyticsMenu, setOpenAnalyticsMenu] = useState(false);
  const [companyInfo, setCompanyInfo] = useState({
    name: "Your Hospital Name",
    tagline: "Smart • Secure • NABH-Standard",
    initials: "YH"
  });

  // Keep dropdown menus open based on current route
  useEffect(() => {
    if (location.pathname.startsWith("/attendance/") || location.pathname === "/shift-roster") {
      setOpenAttendanceMenu(true);
    }
    if (location.pathname.startsWith("/recruitment") || location.pathname === "/job-requisition" || location.pathname === "/ats" || location.pathname === "/offers" || location.pathname === "/onboarding") {
      setOpenRecruitmentMenu(true);
    }
    if (location.pathname.startsWith("/payroll")) {
      setOpenPayrollMenu(true);
    }
    if (location.pathname.startsWith("/analytics")) {
      setOpenAnalyticsMenu(true);
    }
    if (location.pathname === "/departments" || location.pathname === "/roles" || location.pathname === "/users") {
      setOpenUserMenu(true);
    }
  }, [location.pathname]);

  // Preserve scroll position across navigation
  useEffect(() => {
    const sidebar = document.querySelector('.sidebar-scroll');
    if (sidebar) {
      // Restore saved scroll position
      const savedScrollTop = sessionStorage.getItem('sidebar-scroll-position');
      if (savedScrollTop) {
        sidebar.scrollTop = parseInt(savedScrollTop);
      }
      
      // Save scroll position on scroll
      const handleScroll = () => {
        sessionStorage.setItem('sidebar-scroll-position', sidebar.scrollTop.toString());
      };
      
      sidebar.addEventListener('scroll', handleScroll);
      return () => sidebar.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Fetch company info from organization setup and localStorage
  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        // First try to get from localStorage
        const storedName = localStorage.getItem("hospital_name");
        const storedTagline = localStorage.getItem("hospital_tagline");
        
        if (storedName) {
          const initials = storedName.split(' ').map(word => word.charAt(0).toUpperCase()).join('').substring(0, 2);
          setCompanyInfo({
            name: storedName,
            tagline: storedTagline || "Smart • Secure • NABH-Standard",
            initials
          });
        } else {
          // Fallback to API call
          const response = await api.get('/organization/company-profile');
          if (response.data && response.data.company_name) {
            const name = response.data.company_name;
            const tagline = response.data.tagline || "Smart • Secure • NABH-Standard";
            const initials = name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').substring(0, 2);
            
            // Store in localStorage for future use
            localStorage.setItem("hospital_name", name);
            localStorage.setItem("hospital_tagline", tagline);
            
            setCompanyInfo({
              name,
              tagline,
              initials
            });
          }
        }
      } catch (error) {
        console.log('Using default company info');
      }
    };

    fetchCompanyInfo();
    
    // Listen for organization updates
    const handleOrgUpdate = () => {
      fetchCompanyInfo();
    };
    
    window.addEventListener('organization-updated', handleOrgUpdate);
    
    return () => {
      window.removeEventListener('organization-updated', handleOrgUpdate);
    };
  }, []);

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    }
  };

  return (
    <div 
      className={`sidebar-scroll h-screen bg-gradient-to-b from-[#6366F1] to-[#4F46E5] text-white sticky top-0 overflow-y-auto transition-all duration-300 shadow-xl z-40 ${isCollapsed ? 'w-16 p-2' : 'w-60 lg:w-64 p-4'}`}
    >

      {/* Header with Logo, Title and Toggle */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center mb-4' : 'mb-6'}`}>
        {/* Circular Logo */}
        <div className={`bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center text-[#6366F1] font-bold flex-shrink-0 shadow-lg ${isCollapsed ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm mr-3'}`}>
          {companyInfo.initials}
        </div>
        
        {/* Hospital Name and Toggle */}
        {!isCollapsed && (
          <div className="flex items-center justify-between flex-1">
            <div className="flex-1">
              <div className="text-white font-medium text-xs leading-tight tracking-wide">{companyInfo.name}</div>
              <div className="text-white/70 text-xs leading-tight font-light">{companyInfo.tagline}</div>
            </div>
            <button 
              onClick={handleToggle}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors ml-2"
              title="Collapse sidebar"
              type="button"
            >
              <ChevronLeft size={16} className="text-white" />
            </button>
          </div>
        )}
      </div>
      
      {/* Collapsed state toggle */}
      {isCollapsed && (
        <button 
          onClick={handleToggle}
          className="w-full flex justify-center p-1.5 mb-4 hover:bg-white/10 rounded-lg transition-colors"
          title="Expand sidebar"
          type="button"
        >
          <ChevronRight size={16} className="text-white" />
        </button>
      )}

      <nav className={`space-y-2 text-white ${isCollapsed ? 'flex flex-col items-center' : ''}`}>

        {/* Dashboard */}
        <Link
          to="/dashboard"
          className={`flex items-center rounded-xl hover:bg-white/15 transition-all duration-200 backdrop-blur-sm ${
            isCollapsed 
              ? 'justify-center p-3 w-12 h-12' 
              : 'space-x-3 px-4 py-3'
          } ${
            location.pathname === "/dashboard" ? "bg-white/25 font-semibold shadow-lg" : ""
          }`}
          title={isCollapsed ? "Dashboard" : ""}
        >
          <LayoutDashboard size={20} className="flex-shrink-0" />
          {!isCollapsed && <span className="font-medium text-sm tracking-wide">Dashboard</span>}
        </Link>

        {/* User Management */}
        <div className={isCollapsed ? 'w-12' : ''}>
          <button
            onClick={() => !isCollapsed && setOpenUserMenu(!openUserMenu)}
            className={`flex items-center rounded-xl hover:bg-white/10 transition-colors ${
              isCollapsed 
                ? 'justify-center p-3 w-12 h-12' 
                : 'w-full justify-between px-4 py-3'
            }`}
            title={isCollapsed ? "User Management" : ""}
          >
            <span className={`flex items-center ${isCollapsed ? '' : 'space-x-3'}`}>
              <Users size={20} />
              {!isCollapsed && <span className="font-medium text-sm whitespace-nowrap">User Management</span>}
            </span>
            {!isCollapsed && (openUserMenu ? <ChevronDown size={18} /> : <ChevronRight size={18} />)}
          </button>

          {openUserMenu && !isCollapsed && (
            <div className="ml-12 mt-2 space-y-1 transition-all duration-300 ease-in-out">
              <Link
                to="/departments"
                className={`flex items-center px-3 py-2 text-sm rounded hover:text-white/90 hover:bg-white/5 transition-colors ${
                  location.pathname === "/departments"
                    ? "font-medium text-white bg-white/10"
                    : "text-white/80"
                }`}
              >
                <span>Departments</span>
              </Link>

              <Link
                to="/roles"
                className={`flex items-center px-3 py-2 text-sm rounded hover:text-white/90 hover:bg-white/5 transition-colors ${
                  location.pathname === "/roles"
                    ? "font-medium text-white bg-white/10"
                    : "text-white/80"
                }`}
              >
                <span>Roles</span>
              </Link>

              <Link
                to="/users"
                className={`flex items-center px-3 py-2 text-sm rounded hover:text-white/90 hover:bg-white/5 transition-colors ${
                  location.pathname === "/users"
                    ? "font-medium text-white bg-white/10"
                    : "text-white/80"
                }`}
              >
                <span>Users</span>
              </Link>
            </div>
          )}
        </div>

        {/* Organization Setup */}
        <Link
          to="/organization"
          className={`flex items-center rounded-xl hover:bg-white/10 transition-colors ${
            isCollapsed ? 'justify-center p-3 w-12 h-12' : 'space-x-3 px-4 py-3'
          } ${
            location.pathname.startsWith("/organization")
              ? "bg-white/20 font-semibold"
              : ""
          }`}
          title={isCollapsed ? "Organization Setup" : ""}
        >
          <Building2 size={20} />
          {!isCollapsed && <span className="text-sm whitespace-nowrap">Organization Setup</span>}
        </Link>

        {/* Recruitment */}
        <div>
          <button
            onClick={() => !isCollapsed && setOpenRecruitmentMenu(!openRecruitmentMenu)}
            className={`flex items-center w-full ${isCollapsed ? 'justify-center' : 'justify-between'} px-4 py-3 rounded-lg hover:bg-white/10 transition-colors`}
            title={isCollapsed ? "Recruitment" : ""}
          >
            <span className={`flex items-center ${isCollapsed ? '' : 'space-x-3'}`}>
              <UserPlus size={20} />
              {!isCollapsed && <span className="font-medium text-sm whitespace-nowrap">Recruitment</span>}
            </span>
            {!isCollapsed && (openRecruitmentMenu ? <ChevronDown size={18} /> : <ChevronRight size={18} />)}
          </button>

          {openRecruitmentMenu && !isCollapsed && (
            <div className="ml-12 mt-2 space-y-1 transition-all duration-300 ease-in-out">
              <Link
                to="/recruitment-master"
                className={`block px-2 py-2 text-sm rounded hover:text-white/90 hover:bg-white/5 transition-colors ${
                  location.pathname === "/recruitment-master"
                    ? "font-medium text-white bg-white/10"
                    : "text-white/80"
                }`}
              >
                Dashboard
              </Link>

              <Link
                to="/job-requisition"
                className={`block px-2 py-2 text-sm rounded hover:text-white/90 hover:bg-white/5 transition-colors ${
                  location.pathname === "/job-requisition"
                    ? "font-medium text-white bg-white/10"
                    : "text-white/80"
                }`}
              >
                Job Requisition
              </Link>

              <Link
                to="/recruitment-setup"
                className={`block px-2 py-2 text-sm rounded hover:text-white/90 hover:bg-white/5 transition-colors ${
                  location.pathname === "/recruitment-setup"
                    ? "font-medium text-white bg-white/10"
                    : "text-white/80"
                }`}
              >
                Setup & Configuration
              </Link>

              <Link
                to="/ats"
                className={`block px-2 py-2 text-sm rounded hover:text-white/90 hover:bg-white/5 transition-colors ${
                  location.pathname === "/ats"
                    ? "font-medium text-white bg-white/10"
                    : "text-white/80"
                }`}
              >
                Applicant Tracking
              </Link>

              <Link
                to="/offers"
                className={`block px-2 py-2 text-sm rounded hover:text-white/90 hover:bg-white/5 transition-colors ${
                  location.pathname === "/offers"
                    ? "font-medium text-white bg-white/10"
                    : "text-white/80"
                }`}
              >
                Offers & Contracts
              </Link>

              <Link
                to="/onboarding"
                className={`block px-2 py-2 text-sm rounded hover:text-white/90 hover:bg-white/5 transition-colors ${
                  location.pathname === "/onboarding"
                    ? "font-medium text-white bg-white/10"
                    : "text-white/80"
                }`}
              >
                Onboarding
              </Link>
            </div>
          )}
        </div>

        {/* EIS */}
        <Link
          to="/eis"
          className={`flex items-center rounded-xl hover:bg-white/10 transition-colors ${
            isCollapsed ? 'justify-center p-3 w-12 h-12' : 'space-x-3 px-4 py-3'
          } ${
            location.pathname === "/eis"
              ? "bg-white/20 font-semibold"
              : ""
          }`}
          title={isCollapsed ? "EIS" : ""}
        >
          <UserCheck size={20} />
          {!isCollapsed && <span className="text-sm whitespace-nowrap">EIS</span>}
        </Link>

        {/* Attendance */}
        <div>
          <button
            onClick={() => !isCollapsed && setOpenAttendanceMenu(!openAttendanceMenu)}
            className={`flex items-center w-full ${isCollapsed ? 'justify-center' : 'justify-between'} px-4 py-3 rounded-lg hover:bg-white/10 transition-colors`}
            title={isCollapsed ? "Attendance" : ""}
          >
            <span className={`flex items-center ${isCollapsed ? '' : 'space-x-3'}`}>
              <Clock size={20} />
              {!isCollapsed && <span className="font-medium text-sm whitespace-nowrap">Attendance</span>}
            </span>
            {!isCollapsed && (openAttendanceMenu ? <ChevronDown size={18} /> : <ChevronRight size={18} />)}
          </button>

          {openAttendanceMenu && !isCollapsed && (
            <div className="ml-12 mt-2 space-y-1 transition-all duration-300 ease-in-out">
              <Link
                to="/attendance/dashboard"
                className={`block px-2 py-2 text-sm rounded hover:text-white/90 hover:bg-white/5 transition-colors ${
                  location.pathname === "/attendance/dashboard"
                    ? "font-medium text-white bg-white/10"
                    : "text-white/80"
                }`}
              >
                Dashboard
              </Link>

              <Link
                to="/shift-roster"
                className={`block px-2 py-2 text-sm rounded hover:text-white/90 hover:bg-white/5 transition-colors ${
                  location.pathname === "/shift-roster"
                    ? "font-medium text-white bg-white/10"
                    : "text-white/80"
                }`}
              >
                Shift & Roster
              </Link>

              <Link
                to="/attendance/logs"
                className={`block px-2 py-2 text-sm rounded hover:text-white/90 hover:bg-white/5 transition-colors ${
                  location.pathname === "/attendance/logs"
                    ? "font-medium text-white bg-white/10"
                    : "text-white/80"
                }`}
              >
                Logs & Reports
              </Link>

              <Link
                to="/attendance/rules"
                className={`block px-2 py-2 text-sm rounded hover:text-white/90 hover:bg-white/5 transition-colors ${
                  location.pathname === "/attendance/rules"
                    ? "font-medium text-white bg-white/10"
                    : "text-white/80"
                }`}
              >
                Rules & Policies
              </Link>

            </div>
          )}
        </div>

        {/* Leave Management */}
        <Link
          to="/leave"
          className={`flex items-center rounded-xl hover:bg-white/10 transition-colors ${
            isCollapsed ? 'justify-center p-3 w-12 h-12' : 'space-x-3 px-4 py-3'
          } ${
            location.pathname.startsWith("/leave")
              ? "bg-white/20 font-semibold"
              : ""
          }`}
          title={isCollapsed ? "Leave Management" : ""}
        >
          <Clock size={20} />
          {!isCollapsed && <span className="text-sm whitespace-nowrap">Leave Management</span>}
        </Link>

        {/* Payroll Management */}
        <div>
          <button
            onClick={() => !isCollapsed && setOpenPayrollMenu(!openPayrollMenu)}
            className={`flex items-center w-full ${isCollapsed ? 'justify-center' : 'justify-between'} px-4 py-3 rounded-lg hover:bg-white/10 transition-colors`}
            title={isCollapsed ? "Payroll Management" : ""}
          >
            <span className={`flex items-center ${isCollapsed ? '' : 'space-x-4'}`}>
              <DollarSign size={16} />
              {!isCollapsed && <span className="font-medium text-sm whitespace-nowrap">Payroll Management</span>}
            </span>
            {!isCollapsed && (openPayrollMenu ? <ChevronDown size={18} /> : <ChevronRight size={18} />)}
          </button>

          {openPayrollMenu && !isCollapsed && (
            <div className="ml-12 mt-2 space-y-1 transition-all duration-300 ease-in-out">
              <Link
                to="/payroll/dashboard"
                className={`flex items-center px-3 py-2 text-sm rounded hover:text-white/90 hover:bg-white/5 transition-colors ${
                  location.pathname === "/payroll/dashboard"
                    ? "font-medium text-white bg-white/10"
                    : "text-white/80"
                }`}
              >
                <span>Dashboard</span>
              </Link>

              <Link
                to="/payroll"
                className={`flex items-center px-3 py-2 text-sm rounded hover:text-white/90 hover:bg-white/5 transition-colors ${
                  location.pathname === "/payroll"
                    ? "font-medium text-white bg-white/10"
                    : "text-white/80"
                }`}
              >
                <span>Processing & Reports</span>
              </Link>
            </div>
          )}
        </div>

        {/* HR Management */}
        <Link
          to="/hr"
          className={`flex items-center rounded-xl hover:bg-white/10 transition-colors ${
            isCollapsed ? 'justify-center p-3 w-12 h-12' : 'space-x-3 px-4 py-3'
          } ${
            location.pathname.startsWith("/hr")
              ? "bg-white/20 font-semibold"
              : ""
          }`}
          title={isCollapsed ? "HR Management" : ""}
        >
          <Users size={20} />
          {!isCollapsed && <span className="text-sm whitespace-nowrap">HR Management</span>}
        </Link>

        {/* Performance Management (PMS) */}
        <Link
          to="/pms"
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} p-3 rounded-lg hover:bg-white/10 ${
            location.pathname.startsWith("/pms")
              ? "bg-white/20 font-semibold"
              : ""
          }`}
          title={isCollapsed ? "Performance Management (PMS)" : ""}
        >
          <Target size={16} />
          {!isCollapsed && <span className="text-sm whitespace-nowrap">Performance Management</span>}
        </Link>

        {/* Training & Development */}
        <Link
          to="/training"
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} p-3 rounded-lg hover:bg-white/10 ${
            location.pathname.startsWith("/training")
              ? "bg-white/20 font-semibold"
              : ""
          }`}
          title={isCollapsed ? "Training & Development" : ""}
        >
          <GraduationCap size={16} />
          {!isCollapsed && <span className="text-sm whitespace-nowrap">Training & Development</span>}
        </Link>

        {/* Analytics & Reports */}
        {/* REMOVED - Analytics & Reports section */}

        {/* Compliance Module */}
        <Link
          to="/compliance"
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} p-3 rounded-lg hover:bg-white/10 ${
            location.pathname.startsWith("/compliance")
              ? "bg-white/20 font-semibold"
              : ""
          }`}
          title={isCollapsed ? "Compliance Module" : ""}
        >
          <Shield size={16} />
          {!isCollapsed && <span className="text-sm whitespace-nowrap">Compliance Module</span>}
        </Link>

        {/* Exit Management */}
        <Link
          to="/exit"
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} p-3 rounded-lg hover:bg-white/10 ${
            location.pathname.startsWith("/exit")
              ? "bg-white/20 font-semibold"
              : ""
          }`}
          title={isCollapsed ? "Exit Management" : ""}
        >
          <LogOut size={16} />
          {!isCollapsed && <span className="text-sm whitespace-nowrap">Exit Management</span>}
        </Link>

      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="mt-auto pt-4 border-t border-white/10">
          <div className="text-center">
            <div className="text-white/60 text-xs mb-1">© 2024 Nutryah HRM</div>
            <div className="text-white/40 text-xs">Version 1.0.0</div>
          </div>
        </div>
      )}
    </div>
  );
}