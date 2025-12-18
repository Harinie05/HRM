import { useState } from "react";
import { useLocation } from "react-router-dom";

import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

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
    <div className="flex bg-[#F5F7FA] min-h-screen">
      {/* SIDEBAR */}
      <Sidebar />
      
      {/* CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col">
        {/* HEADER */}
        <Header />
        
        {/* TOP TABS */}
        <div className="bg-white border-b border-gray-200 px-6 pt-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Leave Management</h1>
          <div className="flex space-x-8">
            {tabs.map((tabName) => (
              <button
                key={tabName}
                onClick={() => setTab(tabName)}
                className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                  tab === tabName
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tabName}
              </button>
            ))}
          </div>
        </div>

        {/* INNER PAGE CONTENT */}
        <div className="p-6">
          {tab === "Leave Types & Policies" && <LeaveTypes />}
          {tab === "Leave Rules" && <LeaveRules />}
          {tab === "Application & Approvals" && <LeaveApplications />}
          {tab === "Leave Calendar" && <LeaveCalendar />}
          {tab === "Leave Reports" && <LeaveReports />}
        </div>
      </div>
    </div>
  );
}