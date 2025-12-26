import { useState } from "react";
import { useLocation } from "react-router-dom";
import Layout from "../../components/Layout";

// Pages
import LeaveTypes from "./LeaveTypes";
import LeaveRules from "./LeaveRules";
import LeaveApplications from "./LeaveApplications";
import LeaveCalendar from "./LeaveCalendar";
import LeaveReports from "./LeaveReports";

export default function LeaveLayout() {
  const location = useLocation();
  
  const initialTab = location.state?.tab || "Leave Types & Policies";
  const [tab, setTab] = useState(initialTab);

  const tabs = [
    "Leave Types & Policies",
    "Leave Rules", 
    "Application & Approvals",
    "Leave Calendar",
    "Leave Reports"
  ];

  return (
    <Layout breadcrumb="Leave Management">
      <div className="w-full overflow-hidden">
        {/* Hero Section */}
        <div className="mb-3 sm:mb-4 px-3 sm:px-4">
          <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-white relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center mb-2">
                  <div className="bg-white/20 rounded-lg p-1 sm:p-1.5 mr-2 flex-shrink-0">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 7V3a1 1 0 012 0v4h4a1 1 0 010 2h-4v4a1 1 0 01-2 0v-4H4a1 1 0 010-2h4z"/>
                    </svg>
                  </div>
                  <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-medium">
                    Employee Leave & Time Off
                  </span>
                </div>
                
                <h1 className="text-lg sm:text-xl font-bold mb-1">
                  Leave Management
                </h1>
                
                <p className="text-white/90 text-xs mb-2 sm:mb-3">
                  Manage leave types, policies, applications and approvals.
                </p>
                
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <button className="bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg text-xs font-medium transition-colors">
                    Leave System
                  </button>
                  <span className="text-white/80 text-xs hidden sm:inline">
                    Used by HR / Employees / Managers
                  </span>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 sm:p-3 text-center min-w-[100px] sm:min-w-[120px] flex-shrink-0">
                <p className="text-white/80 text-xs font-medium uppercase tracking-wide mb-1">
                  MODULES
                </p>
                <p className="text-xl sm:text-2xl font-bold mb-1">
                  {tabs.length}
                </p>
                <p className="text-white/70 text-xs">
                  Leave management tools
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="mb-3 sm:mb-4 px-3 sm:px-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="flex border-b bg-gradient-to-r from-gray-50 to-blue-50 overflow-x-auto scrollbar-hide">
              {tabs.map((tabName) => (
                <button
                  key={tabName}
                  onClick={() => setTab(tabName)}
                  className={`px-3 sm:px-6 py-3 sm:py-5 text-xs sm:text-sm font-semibold border-b-3 transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                    tab === tabName
                      ? 'border-blue-500 text-blue-600 bg-white shadow-lg transform -translate-y-1'
                      : 'border-transparent text-muted hover:text-secondary hover:bg-white/50'
                  }`}
                >
                  {tabName}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-3 sm:px-4">
          {tab === "Leave Types & Policies" && <LeaveTypes />}
          {tab === "Leave Rules" && <LeaveRules />}
          {tab === "Application & Approvals" && <LeaveApplications />}
          {tab === "Leave Calendar" && <LeaveCalendar />}
          {tab === "Leave Reports" && <LeaveReports />}
        </div>
      </div>
    </Layout>
  );
}
