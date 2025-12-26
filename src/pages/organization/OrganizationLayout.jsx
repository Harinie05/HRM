import { useState } from "react";
import { useLocation } from "react-router-dom";
import Layout from "../../components/Layout";

// Pages
import CompanyProfile from "./CompanyProfile";
import Branch from "./Branch";
import DepartmentList from "./DepartmentList";
import DesignationList from "./Designation";
import ReportingStructure from "./ReportingStructure";
import Shifts from "./Shifts";
import GradePayStructure from "./GradePayStructure";
import HolidayCalender from "./HolidayCalender";
import PolicySetup from "./PolicySetup";
import RulesPolicies from "./RulesPolicies";

export default function OrganizationLayout() {
  const location = useLocation();
  const initialTab = location.state?.tab || "Company Profile";
  const [tab, setTab] = useState(initialTab);

  const tabs = [
    "Company Profile",
    "Branch / Unit",
    "Department",
    "Designation",
    "Reporting Structure",
    "Shifts & Roster",
    "Grades / Pay Structure",
    "Holiday Calendar",
    "Rules & Policies"
  ];

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header with gradient background matching Department/Roles page */}
        <div className="bg-white rounded-3xl border-2 border-black shadow-sm p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Organization Setup</h1>
                <p className="text-gray-600 text-lg mb-1">Configure company profile, departments, branches and organizational structure</p>
                <p className="text-gray-500 text-sm">Company Structure & Setup</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <span className="text-sm font-medium">{tabs.length} Components</span>
              </div>
              <p className="text-lg font-bold text-gray-900">Setup components</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation matching Department/Roles style */}
        <div className="bg-white rounded-2xl border border-black p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-6">
            <span className="text-sm text-gray-600">Setup</span>
            <div className="flex items-center bg-gray-100 rounded-full p-1 overflow-x-auto scrollbar-hide border border-black" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
              {tabs.map((tabName) => (
                <button
                  key={tabName}
                  onClick={() => setTab(tabName)}
                  className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-full transition-colors whitespace-nowrap flex-shrink-0 ${
                    tab === tabName 
                      ? "bg-white text-gray-900 shadow-sm" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tabName}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div>
          {tab === "Company Profile" && <CompanyProfile />}
          {tab === "Branch / Unit" && <Branch />}
          {tab === "Department" && <DepartmentList />}
          {tab === "Designation" && <DesignationList />}
          {tab === "Shifts & Roster" && <Shifts />}
          {tab === "Reporting Structure" && <ReportingStructure />}
          {tab === "Grades / Pay Structure" && <GradePayStructure />}
          {tab === "Holiday Calendar" && <HolidayCalender />}
          {tab === "Rules & Policies" && <RulesPolicies />}
        </div>
      </div>
    </Layout>
  );
}