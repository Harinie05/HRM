import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Layout from "../../components/Layout";
import useToast from "../../utils/useToast";
import Toast from "../../components/Toast";
import { hasPermission, isAdmin } from "../../utils/permissions";
import api from "../../api";

// Pages
import LeaveTypes from "./LeaveTypes";
import LeaveRules from "./LeaveRules";
import LeaveApplications from "./LeaveApplications";
import LeaveCalendar from "./LeaveCalendar";
import LeaveReports from "./LeaveReports";

export default function LeaveLayout() {
  const { toast, showToast, hideToast } = useToast();
  const location = useLocation();
  const [colors, setColors] = useState({
    primary: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
    secondary: getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'
  });
  
  // Define all tabs with their permission requirements
  const allTabs = [
    { name: "Leave Types", permission: "view_leave_types" },
    { name: "Leave Policies", permission: "view_leave_policies" },
    { name: "Leave Rules", permission: "view_leave_rules" },
    { name: "Application & Approvals", permission: "view_leave_applications" },
    { name: "Leave Calendar", permission: "view_leave_calendar" },
    { name: "Leave Reports", permission: "view_leave_reports" }
  ];

  // Filter tabs based on permissions
  const visibleTabs = allTabs.filter(tabItem => {
    return isAdmin() || hasPermission(tabItem.permission);
  });

  // If no tabs are visible, show access denied
  if (visibleTabs.length === 0) {
    return (
      <Layout>
        <div className="p-6 text-center">
          <div className="bg-white rounded-2xl border-0 p-8 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600">You do not have permission to access Leave Management.</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  const initialTab = location.state?.tab || visibleTabs[0].name;
  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    fetchColors();
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

  return (
    <Layout breadcrumb="Leave Management">
      <div className="w-full overflow-hidden">
        {/* Hero Header matching User Management */}
        <div className="mb-6 px-4">
          <div className="rounded-2xl shadow-sm p-4 sm:p-6 relative overflow-hidden border" style={{
            background: `linear-gradient(to right, ${colors.primary}10, ${colors.secondary}10)`,
            borderColor: `${colors.primary}20`
          }}>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20" style={{
              backgroundColor: colors.primary,
              transform: 'translate(40%, -40%)'
            }}></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-3xl opacity-20" style={{
              backgroundColor: colors.secondary,
              transform: 'translate(-40%, 40%)'
            }}></div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{
                  backgroundColor: `${colors.primary}20`
                }}>
                  <svg className="h-5 w-5 sm:h-6 sm:w-6" style={{
                    color: colors.primary
                  }} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 7V3a1 1 0 012 0v4h4a1 1 0 010 2h-4v4a1 1 0 01-2 0v-4H4a1 1 0 010-2h4z"/>
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 truncate">Leave Management</h1>
                  <p className="text-gray-600 text-xs sm:text-sm mb-1">Manage leave types, policies, applications and approvals</p>
                  <p className="text-gray-500 text-xs hidden sm:block">Employee Leave & Time Off</p>
                </div>
              </div>
              <div className="flex gap-2 sm:gap-3 flex-shrink-0">
                <div className="bg-white rounded-lg p-2 sm:p-3 shadow-sm border" style={{
                  borderColor: `${colors.primary}20`
                }}>
                  <div className="flex items-center gap-1 sm:gap-2 text-gray-600 mb-1">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 7V3a1 1 0 012 0v4h4a1 1 0 010 2h-4v4a1 1 0 01-2 0v-4H4a1 1 0 010-2h4z"/>
                    </svg>
                    <span className="text-xs font-medium">Modules</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{visibleTabs.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="mb-6 px-4">
          <div className="rounded-full p-1.5 inline-flex space-x-1 overflow-x-auto scrollbar-hide w-full sm:w-auto" style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            backgroundColor: `${colors.primary}10`,
            border: `1px solid ${colors.primary}20`
          }}>
            {visibleTabs.map((tabItem) => (
              <button
                key={tabItem.name}
                onClick={() => setTab(tabItem.name)}
                className={`px-3 sm:px-4 py-1 text-xs sm:text-sm font-semibold rounded-full transition-all duration-300 whitespace-nowrap flex-shrink-0`}
                style={{
                  backgroundColor: tab === tabItem.name ? colors.primary : 'transparent',
                  color: tab === tabItem.name ? 'white' : '#6b7280'
                }}
                onMouseEnter={(e) => {
                  if (tab !== tabItem.name) {
                    e.currentTarget.style.backgroundColor = colors.secondary;
                    e.currentTarget.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (tab !== tabItem.name) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#6b7280';
                  }
                }}
              >
                {tabItem.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-4">
          <div className="rounded-3xl shadow-xl overflow-hidden" style={{
            border: `1px solid ${colors.primary}20`
          }}>
            {tab === "Leave Types" && <LeaveTypes activeView="types" />}
            {tab === "Leave Policies" && <LeaveTypes activeView="policies" />}
            {tab === "Leave Rules" && <LeaveRules />}
            {tab === "Application & Approvals" && <LeaveApplications />}
            {tab === "Leave Calendar" && <LeaveCalendar />}
            {tab === "Leave Reports" && <LeaveReports />}
          </div>
        </div>
      </div>
      <Toast toast={toast} />
    </Layout>
  );
}

