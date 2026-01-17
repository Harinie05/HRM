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
  UserMinus,
  ChevronLeft,
  Briefcase,
  Settings,
  Palette,
} from "lucide-react";
import api from "../api";
import { hasPermission, isAdmin } from "../utils/permissions";

// Helper function to check if user has any permission from a list
const hasAnyPermission = (permissions) => {
  if (isAdmin()) return true;
  return permissions.some(permission => hasPermission(permission));
};

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

export default function Sidebar({ isCollapsed = false, onToggle, isMobile = false, onMobileClose }) {
  const location = useLocation();
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [openRecruitmentMenu, setOpenRecruitmentMenu] = useState(false);
  const [openAttendanceMenu, setOpenAttendanceMenu] = useState(
    location.pathname.startsWith("/attendance/") || location.pathname === "/shift-roster"
  );
  const [openPayrollMenu, setOpenPayrollMenu] = useState(false);
  const [openAnalyticsMenu, setOpenAnalyticsMenu] = useState(false);
  
  // Get tenant name immediately for initial display
  const tenantDb = localStorage.getItem("tenant_db") || "hospital";
  const defaultName = tenantDb.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  
  const [companyInfo, setCompanyInfo] = useState({
    name: defaultName,
    tagline: "Smart • Secure • NABH-Standard",
    initials: defaultName.split(' ').map(word => word.charAt(0).toUpperCase()).join('').substring(0, 2)
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

  // Fetch company info from organization branding API first, then localStorage
  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        // Try to get from backend API first
        const response = await api.get('/api/organization/branding');
        if (response.data && response.data.organization_name) {
          const name = response.data.organization_name;
          const tagline = response.data.tagline || "";
          const initials = name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').substring(0, 2);
          
          setCompanyInfo({
            name,
            tagline,
            initials
          });
          
          // Store in localStorage for future use
          localStorage.setItem("hospital_name", name);
          localStorage.setItem("hospital_tagline", tagline);
        } else {
          // Fallback to localStorage
          const storedName = localStorage.getItem("hospital_name");
          const storedTagline = localStorage.getItem("hospital_tagline");
          const tenantDb = localStorage.getItem("tenant_db");
          
          if (storedName) {
            const initials = storedName.split(' ').map(word => word.charAt(0).toUpperCase()).join('').substring(0, 2);
            setCompanyInfo({
              name: storedName,
              tagline: storedTagline || "Smart • Secure • NABH-Standard",
              initials
            });
          } else if (tenantDb) {
            // Use tenant DB name as fallback - handle underscores and capitalize properly
            const displayName = tenantDb.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            const initials = displayName.split(' ').map(word => word.charAt(0).toUpperCase()).join('').substring(0, 2);
            setCompanyInfo({
              name: displayName,
              tagline: "Smart • Secure • NABH-Standard",
              initials
            });
          } else {
            // Final fallback to company profile API if user has permission
            if (isAdmin() || hasPermission("view_company_profile")) {
              try {
                const profileResponse = await api.get('/organization/company-profile');
                if (profileResponse.data && profileResponse.data.company_name) {
                  const name = profileResponse.data.company_name;
                  const tagline = profileResponse.data.tagline || "";
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
              } catch (err) {
                console.log('Company profile API failed:', err);
              }
            }
          }
        }
      } catch (error) {
        console.log('Failed to load from backend, using localStorage or defaults');
        // Fallback to localStorage on error
        const storedName = localStorage.getItem("hospital_name");
        const storedTagline = localStorage.getItem("hospital_tagline");
        const tenantDb = localStorage.getItem("tenant_db");
        
        if (storedName) {
          const initials = storedName.split(' ').map(word => word.charAt(0).toUpperCase()).join('').substring(0, 2);
          setCompanyInfo({
            name: storedName,
            tagline: storedTagline || "Smart • Secure • NABH-Standard",
            initials
          });
        } else if (tenantDb) {
          // Use tenant DB name as fallback - handle underscores and capitalize properly
          const displayName = tenantDb.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
          const initials = displayName.split(' ').map(word => word.charAt(0).toUpperCase()).join('').substring(0, 2);
          setCompanyInfo({
            name: displayName,
            tagline: "Smart • Secure • NABH-Standard",
            initials
          });
        }
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
    if (isMobile && onMobileClose) {
      onMobileClose();
    } else if (onToggle) {
      onToggle();
    }
  };

  const handleLinkClick = () => {
    if (isMobile && onMobileClose) {
      onMobileClose();
    }
  };

  return (
    <div 
      className={`sidebar-scroll h-screen sticky top-0 overflow-y-auto transition-all duration-300 shadow-xl z-40 border-r border-gray-200 ${isCollapsed ? 'w-16 p-2' : 'w-60 lg:w-64 p-3 sm:p-4'}`}
      style={{ 
        background: 'var(--sidebar-bg, #ffffff)',
        color: 'var(--sidebar-text-color, #1f2937)'
      }}
    >

      {/* Header with Logo, Title and Toggle */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center mb-4' : 'mb-6'} relative`}>
        {/* Blur circle effect */}
        <div className="absolute w-20 h-20 rounded-full blur-2xl opacity-30" style={{
          backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
          transform: 'translate(-20%, -20%)'
        }}></div>
        
        {/* Circular Logo */}
        <div className={`rounded-full flex items-center justify-center font-bold flex-shrink-0 shadow-lg relative z-10 ${isCollapsed ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm mr-3'}`} style={{
          backgroundColor: 'white',
          color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
          border: `2px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}`
        }}>
          {companyInfo.initials}
        </div>
        
        {/* Hospital Name and Toggle */}
        {!isCollapsed && (
          <div className="flex items-center justify-between flex-1">
            <div className="flex-1">
              <div className="font-medium text-xs leading-tight tracking-wide" style={{ color: 'var(--sidebar-text-color, #1f2937)' }}>{companyInfo.name}</div>
            </div>
            <button 
              onClick={handleToggle}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors ml-2"
              title="Collapse sidebar"
              type="button"
            >
              <ChevronLeft size={16} style={{ color: 'var(--sidebar-text-color, #1f2937)' }} />
            </button>
          </div>
        )}
      </div>
      
      {/* Collapsed state toggle */}
      {isCollapsed && (
        <button 
          onClick={handleToggle}
          className="w-full flex justify-center p-1.5 mb-4 hover:bg-gray-100 rounded-lg transition-colors"
          title="Expand sidebar"
          type="button"
        >
          <ChevronRight size={16} style={{ color: 'var(--sidebar-text-color, #1f2937)' }} />
        </button>
      )}

      <nav className={`space-y-2 ${isCollapsed ? 'flex flex-col items-center' : ''}`} style={{ color: 'var(--sidebar-text-color, #ffffff)' }}>

        {/* Dashboard */}
        <Link
          to="/dashboard"
          onClick={handleLinkClick}
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
        {hasAnyPermission(["view_users", "add_user", "edit_user", "delete_user", "view_user_departments", "add_user_department", "edit_user_department", "delete_user_department", "view_user_roles", "add_user_role", "edit_user_role", "delete_user_role"]) && (
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
                {(isAdmin() || hasPermission("view_user_departments")) && (
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
                )}

                {(isAdmin() || hasPermission("view_user_roles")) && (
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
                )}

                {(isAdmin() || hasPermission("view_users")) && (
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
                )}
              </div>
            )}
          </div>
        )}

        {/* Organization Setup */}
        {hasAnyPermission(["view_company_profile", "add_company_profile", "view_branch", "add_branch", "view_department", "view_designation", "view_reporting_levels", "add_reporting_level", "edit_reporting_level", "delete_reporting_level", "view_hierarchy_rules", "add_hierarchy_rule", "edit_hierarchy_rule", "delete_hierarchy_rule", "view_holiday", "add_holiday", "edit_holiday", "delete_holiday"]) && (
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
        )}

        {/* Recruitment */}
        {hasAnyPermission(["view_job_requisition", "add_job_requisition", "edit_job_requisition", "delete_job_requisition", "view_candidates", "edit_candidates", "screen_candidates", "generate_job_link", "publish_job", "delete_candidates", "view_candidate", "select_candidates", "schedule_interviews", "view_resumes", "view_ats_pipeline", "move_candidates", "view_active_jobs", "view_ats_candidates", "generate_offer_link", "verify_documents", "view_documents", "manage_bgv", "start_onboarding", "mark_onboarded", "view_offers_sent", "view_selected_candidates", "view_onboarding_documents", "view_onboarding_candidates", "view_document_collected", "add_document_collected", "view_consultants", "add_consultant", "edit_consultant", "delete_consultant", "view_availability", "add_availability", "view_payouts", "generate_payslip", "send_payslip_email", "process_payroll"]) && (
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

                {(isAdmin() || hasPermission("view_job_requisition")) && (
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
                )}

                {(isAdmin() || hasPermission("view_candidates")) && (
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
                )}

                {(isAdmin() || hasPermission("view_ats_candidates")) && (
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
                )}

                {(isAdmin() || hasPermission("view_offers_sent")) && (
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
                )}

                {(isAdmin() || hasPermission("view_onboarding_candidates")) && (
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
                )}

                {(isAdmin() || hasPermission("view_consultants")) && (
                  <Link
                    to="/locum-consultants"
                    className={`block px-2 py-2 text-sm rounded hover:text-white/90 hover:bg-white/5 transition-colors ${
                      location.pathname === "/locum-consultants"
                        ? "font-medium text-white bg-white/10"
                        : "text-white/80"
                    }`}
                  >
                    Locum / Visiting Consultants
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* EIS */}
        {hasAnyPermission(["view_self", "view_employees", "create_employee_code", "view_employee_profile", "delete_employee", "edit_employee", "view_employee_documents", "upload_employee_documents", "verify_employee_documents", "verify_bank_details", "delete_employee_documents", "view_employment_details", "edit_employment_details", "manage_work_location", "manage_reporting_manager", "manage_work_shift", "view_probation_details", "manage_probation_period", "add_probation", "extend_probation", "end_probation", "edit_probation_remarks", "edit_profile", "view_documents"]) && (
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
        )}

        {/* Attendance */}
        {hasAnyPermission(["view_self", "view_attendance", "mark_attendance", "approve_attendance", "view_attendance_reports", "generate_attendance_reports", "export_attendance_data", "view_punch_logs", "punch_in", "punch_out", "view_regularization", "apply_regularization", "approve_regularization", "reject_regularization", "view_od_applications", "apply_od", "approve_od", "reject_od", "edit_od_applications", "view_attendance_rules", "add_attendance_rule", "edit_attendance_rule", "delete_attendance_rule", "view_attendance_locations", "add_attendance_location", "edit_attendance_location", "delete_attendance_location", "view_daily_updates", "add_daily_update", "edit_daily_update", "delete_daily_update", "view_shifts", "create_shifts", "delete_shifts", "view_roster", "manage_roster", "manage_night_shift_rules", "manage_on_call_duty", "view_weekly_roster", "manage_weekly_roster"]) && (
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
                {(isAdmin() || hasPermission("view_attendance")) && (
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
                )}

                {(isAdmin() || hasPermission("view_shifts") || hasPermission("view_roster")) && (
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
                )}

                {(isAdmin() || hasPermission("view_attendance") || hasPermission("view_punch_logs")) && (
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
                )}

                {(isAdmin() || hasPermission("view_attendance_rules")) && (
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
                )}
              </div>
            )}
          </div>
        )}

        {/* Leave Management */}
        {hasAnyPermission(["view_self", "view_leave_types", "add_leave_type", "edit_leave_type", "delete_leave_type", "view_leave_policies", "add_leave_policy", "edit_leave_policy", "delete_leave_policy", "assign_leave_policy", "view_leave_rules", "add_leave_rule", "edit_leave_rule", "delete_leave_rule", "view_leave_applications", "apply_leave", "edit_leave_application", "cancel_leave_application", "approve_leave", "reject_leave", "view_leave_calendar", "export_leave_calendar", "view_leave_reports", "generate_leave_reports", "export_leave_reports", "view_leave_balance", "view_leave_trends"]) && (
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
        )}

        {/* Payroll Management */}
        {hasAnyPermission(["view_self", "view_salary_structure", "add_salary_structure", "edit_salary_structure", "delete_salary_structure", "view_salary_structure_details", "link_employees_salary_structure", "view_statutory_rules", "add_statutory_rule", "edit_statutory_rule", "delete_statutory_rule", "view_payroll_run", "create_payroll_run", "process_payroll_run", "approve_payroll_run", "delete_payroll_run", "view_payroll_adjustments", "add_payroll_adjustment", "edit_payroll_adjustment", "delete_payroll_adjustment", "approve_payroll_adjustment", "view_salary_slips", "generate_salary_slips", "download_salary_slips", "email_salary_slips", "process_payments", "view_payment_status", "view_payroll_reports", "generate_payroll_reports", "export_payroll_data", "view_compliance_reports", "generate_compliance_reports"]) && (
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
        )}

        {/* HR Management */}
        {hasAnyPermission(["view_lifecycle_actions", "add_lifecycle_action", "edit_lifecycle_action", "delete_lifecycle_action", "approve_lifecycle_action", "restore_lifecycle_action", "show_deleted_lifecycle_actions", "view_hr_letters", "add_hr_letter", "edit_hr_letter", "delete_hr_letter", "print_hr_letter", "generate_hr_letter", "send_hr_letter", "restore_hr_letter", "show_deleted_hr_letters", "view_grievances", "add_grievance", "edit_grievance", "delete_grievance", "assign_grievance", "resolve_grievance", "escalate_grievance", "restore_grievance", "show_deleted_grievances", "view_assets", "add_asset", "edit_asset", "delete_asset", "assign_asset", "return_asset", "track_asset", "approve_asset", "reject_asset", "restore_asset", "show_deleted_assets", "view_insurance_benefits", "add_insurance_benefit", "edit_insurance_benefit", "delete_insurance_benefit", "enroll_employee_benefits", "process_claims", "manage_beneficiaries", "add_insurance_policy", "delete_insurance_policy", "restore_insurance_benefit", "show_deleted_insurance_benefits", "view_staff_schedules", "add_staff_schedule", "edit_staff_schedule", "delete_staff_schedule", "assign_shifts", "manage_shift_swaps", "approve_schedule_changes", "restore_staff_schedule", "show_deleted_staff_schedules"]) && (
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
        )}

        {/* Performance Management (PMS) */}
        {hasAnyPermission(["view_self", "view_work_assignments", "add_work_assignment", "edit_work_assignment", "delete_work_assignment", "restore_work_assignment", "assign_to_employees", "view_goals_kpi", "view_review_cycles", "create_review_cycle", "edit_review_cycle", "delete_review_cycle", "view_deleted_review_cycles", "restore_review_cycle", "start_review_cycle", "close_review_cycle", "show_deleted_review_cycles", "view_feedback", "give_feedback", "request_feedback", "view_360_feedback", "manage_feedback_forms", "edit_feedback", "delete_feedback", "restore_feedback", "show_deleted_feedback", "view_appraisals", "conduct_appraisal", "submit_self_appraisal", "approve_appraisal", "view_appraisal_reports", "edit_appraisal", "delete_appraisal", "restore_appraisal", "show_deleted_appraisals", "view_quality_indicators", "add_quality_indicator", "edit_quality_indicator", "delete_quality_indicator", "measure_quality_metrics", "restore_quality_indicator", "show_deleted_quality_indicators"]) && (
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
        )}

        {/* Training & Development */}
        {hasAnyPermission(["view_self", "view_training_programs", "add_training_program", "edit_training_program", "delete_training_program", "view_enrolled_trainees", "generate_training_link", "approve_training_applications", "select_send_training_emails", "view_training_calendar", "view_training_requests", "add_training_request", "approve_training_request", "reject_training_request", "view_training_attendance", "mark_training_attendance", "view_training_assessments", "conduct_training_assessment", "grade_training_assessment", "view_training_certificates", "generate_training_certificate", "download_training_certificate", "email_training_certificate"]) && (
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
        )}

        {/* Analytics & Reports */}
        {/* REMOVED - Analytics & Reports section */}

        {/* Compliance Module */}
        {hasAnyPermission(["view_statutory_calculations", "add_statutory_calculation", "edit_statutory_calculation", "delete_statutory_calculation", "view_deleted_statutory", "restore_statutory_calculation", "view_labour_register", "add_labour_register", "edit_labour_register", "delete_labour_register", "view_deleted_labour_register", "restore_labour_register", "view_leave_compliance", "add_leave_compliance", "edit_leave_compliance", "delete_leave_compliance", "view_deleted_leave_compliance", "restore_leave_compliance", "view_nabh_compliance", "add_nabh_compliance", "edit_nabh_compliance", "delete_nabh_compliance", "view_deleted_nabh_compliance", "restore_nabh_compliance"]) && (
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
        )}

        {/* Exit Management */}
        {hasAnyPermission(["view_self", "apply_resignation", "view_resignations", "approve_resignation", "manage_handover", "manage_clearance", "manage_assets", "manage_settlement", "hr_clearance", "it_clearance", "finance_clearance", "admin_clearance", "conduct_exit_interview", "view_exit_interviews", "view_kt_plans", "add_kt_plan", "create_kt_plan", "complete_kt_items", "hr_approve_kt", "manager_approve_kt", "view_settlements", "calculate_settlements", "approve_settlements", "generate_experience_letter", "edit_experience_letter", "download_settlement_pdf", "email_settlement_docs", "edit_settlements"]) && (
          <Link
            to="/exit"
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} p-3 rounded-lg hover:bg-white/10 ${
              location.pathname.startsWith("/exit")
                ? "bg-white/20 font-semibold"
                : ""
            }`}
            title={isCollapsed ? "Exit Management" : ""}
          >
            <UserMinus size={16} />
            {!isCollapsed && <span className="text-sm whitespace-nowrap">Exit Management</span>}
          </Link>
        )}

        {/* Customization & Templates */}
        <Link
          to="/customization"
          className={`flex items-center rounded-xl hover:bg-white/10 transition-colors ${
            isCollapsed ? 'justify-center p-3 w-12 h-12' : 'space-x-3 px-4 py-3'
          } ${
            location.pathname.startsWith("/customization")
              ? "bg-white/20 font-semibold"
              : ""
          }`}
          title={isCollapsed ? "Customization & Templates" : ""}
        >
          <Palette size={20} />
          {!isCollapsed && <span className="text-sm whitespace-nowrap">Customization & Templates</span>}
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
