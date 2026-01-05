import { useState } from "react";
import { useLocation } from "react-router-dom";
import Layout from "../../components/Layout";
import { hasPermission, isAdmin } from "../../utils/permissions";

// Pages
import LeaveTypes from "./LeaveTypes";
import LeaveRules from "./LeaveRules";
import LeaveApplications from "./LeaveApplications";
import LeaveCalendar from "./LeaveCalendar";
import LeaveReports from "./LeaveReports";

export default function LeaveLayout() {
  const location = useLocation();
  
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
          <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600">You do not have permission to access Leave Management.</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  const initialTab = location.state?.tab || visibleTabs[0].name;
  const [tab, setTab] = useState(initialTab);

  return (
    <Layout breadcrumb="Leave Management">
      <div className="w-full overflow-hidden">
        {/* Hero Section */}
        <div className="mb-3 sm:mb-4 px-3 sm:px-4">
          <div className="bg-white rounded-3xl border-2 border-black shadow-sm p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto sm:mx-0">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 7V3a1 1 0 012 0v4h4a1 1 0 010 2h-4v4a1 1 0 01-2 0v-4H4a1 1 0 010-2h4z"/>
                  </svg>
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Leave Management</h1>
                  <p className="text-gray-600 text-base sm:text-lg mb-1">Manage leave types, policies, applications and approvals</p>
                  <p className="text-gray-500 text-sm">Employee Leave & Time Off</p>
                </div>
              </div>
              <div className="text-center sm:text-right">
                <div className="bg-gray-100 rounded-xl p-3 border border-black text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-600 mb-1">
                    <span className="text-xs font-medium">Modules</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{visibleTabs.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="mb-6 px-4">
          <div className="bg-gray-100 border border-black rounded-full p-1.5 inline-flex space-x-1 overflow-x-auto scrollbar-hide w-full sm:w-auto">
            {visibleTabs.map((tabItem) => (
              <button
                key={tabItem.name}
                onClick={() => setTab(tabItem.name)}
                className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold rounded-full transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                  tab === tabItem.name
                    ? 'bg-white text-gray-900 shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                {tabItem.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-4">
          <div className="bg-white rounded-3xl shadow-xl border border-black overflow-hidden">
            {tab === "Leave Types" && <LeaveTypes activeView="types" />}
            {tab === "Leave Policies" && <LeaveTypes activeView="policies" />}
            {tab === "Leave Rules" && <LeaveRules />}
            {tab === "Application & Approvals" && <LeaveApplications />}
            {tab === "Leave Calendar" && <LeaveCalendar />}
            {tab === "Leave Reports" && <LeaveReports />}
          </div>
        </div>
      </div>
    </Layout>
  );
}
