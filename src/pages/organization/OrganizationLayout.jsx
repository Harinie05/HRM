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
    <Layout breadcrumb="Organization Setup">
      <div className="-m-4 sm:-m-6">
        {/* Hero Section */}
        <div className="mb-3 sm:mb-4 mt-4 sm:mt-6 px-4 sm:px-8">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-white relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center mb-2">
                  <div className="bg-white/20 rounded-lg p-1 sm:p-1.5 mr-2 flex-shrink-0">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z"/>
                    </svg>
                  </div>
                  <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-medium">
                    Company Structure & Setup
                  </span>
                </div>
                
                <h1 className="text-lg sm:text-xl font-bold mb-1">
                  Organization Setup
                </h1>
                
                <p className="text-white/90 text-xs mb-2 sm:mb-3">
                  Configure company profile, departments, branches and organizational structure.
                </p>
                
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <button className="bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg text-xs font-medium transition-colors">
                    Organization Config
                  </button>
                  <span className="text-white/80 text-xs hidden sm:inline">
                    Used by Admin / HR / Management
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
                  Setup components
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="mb-3 sm:mb-4 px-4 sm:px-8">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="flex border-b bg-gradient-to-r from-gray-50 to-blue-50 overflow-x-auto scrollbar-hide">
              {tabs.map((tabName) => (
                <button
                  key={tabName}
                  onClick={() => setTab(tabName)}
                  className={`px-2 sm:px-3 py-3 sm:py-4 text-xs font-semibold border-b-3 transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                    tab === tabName
                      ? 'border-blue-500 text-blue-600 bg-white shadow-lg transform -translate-y-1'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/50'
                  }`}
                >
                  {tabName}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-8">
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
