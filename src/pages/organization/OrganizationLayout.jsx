import { useState } from "react";
import { useLocation } from "react-router-dom";
import Layout from "../../components/Layout";
import { hasPermission, isAdmin } from "../../utils/permissions";

// Pages
import CompanyProfile from "./CompanyProfile";
import Branch from "./Branch";
import DepartmentList from "./DepartmentList";
import DesignationList from "./Designation";
import ReportingStructure from "./ReportingStructure";

import HolidayCalender from "./HolidayCalender";



export default function OrganizationLayout() {
  const location = useLocation();
  
  // Function to determine if a color is light or dark
  const isLightColor = (color) => {
    if (!color) return false;
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return brightness > 128;
  };
  
  // Get colors from CSS variables
  const getPrimaryColor = () => {
    return getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim() || '#4575b5';
  };
  
  const getSecondaryColor = () => {
    return getComputedStyle(document.documentElement).getPropertyValue('--secondary-color').trim() || '#474e71';
  };
  
  // Define all tabs with their permission requirements
  const allTabs = [
    { name: "Company Profile", permission: "view_company_profile" },
    { name: "Branch / Unit", permission: "view_branch" },
    { name: "Department", permission: "view_department" },
    { name: "Designation", permission: "view_designation" },
    { name: "Reporting Structure", permission: "view_reporting_levels" },
    { name: "Holiday Calendar", permission: "view_holiday" }
  ];

  // Filter tabs based on permissions
  const visibleTabs = allTabs.filter(tabItem => {
    if (!tabItem.permission) return true;
    return isAdmin() || hasPermission(tabItem.permission);
  });

  const initialTab = location.state?.tab || (visibleTabs.length > 0 ? visibleTabs[0].name : "");
  const [tab, setTab] = useState(initialTab);

  // If no tabs are visible, show access denied
  if (visibleTabs.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-500">You don't have permission to access any organization setup modules.</p>
          </div>
        </div>
      </Layout>
    );
  }

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
              <div className="bg-gray-100 rounded-xl p-3 border border-black text-center">
                <div className="flex items-center justify-center gap-2 text-gray-600 mb-1">
                  <span className="text-xs font-medium">Components</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{visibleTabs.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation matching Department/Roles style */}
        <div className="bg-white rounded-2xl border border-black p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-6">
            <span className="text-sm text-gray-600">Setup</span>
            <div className="flex items-center bg-gray-100 rounded-full p-1 overflow-x-auto scrollbar-hide border border-black" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
              {visibleTabs.map((tabItem) => {
                const primaryColor = getPrimaryColor();
                const secondaryColor = getSecondaryColor();
                const primaryTextColor = isLightColor(primaryColor) ? 'black' : 'white';
                const secondaryTextColor = isLightColor(secondaryColor) ? 'black' : 'white';
                
                return (
                  <button
                    key={tabItem.name}
                    onClick={() => setTab(tabItem.name)}
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-full transition-colors whitespace-nowrap flex-shrink-0 ${
                      tab === tabItem.name 
                        ? "shadow-sm" 
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                    style={tab === tabItem.name ? {
                      backgroundColor: primaryColor,
                      color: primaryTextColor
                    } : {}}
                    onMouseEnter={(e) => {
                      if (tab !== tabItem.name) {
                        e.target.style.backgroundColor = secondaryColor;
                        e.target.style.color = secondaryTextColor;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (tab !== tabItem.name) {
                        e.target.style.backgroundColor = '';
                        e.target.style.color = '';
                      }
                    }}
                  >
                    {tabItem.name}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Scroll indicator */}
          <div className="flex justify-center">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div>
          {tab === "Company Profile" && <CompanyProfile />}
          {tab === "Branch / Unit" && <Branch />}
          {tab === "Department" && <DepartmentList />}
          {tab === "Designation" && <DesignationList />}
          {tab === "Reporting Structure" && <ReportingStructure />}
          {tab === "Grades / Pay Structure" && <GradePayStructure />}
          {tab === "Grades / Pay Structure" && <GradePayStructure />}
          {tab === "Holiday Calendar" && <HolidayCalender />}
          {tab === "Rules & Policies" && <RulesPolicies />}
          {tab === "Rules & Policies" && <RulesPolicies />}
        </div>
      </div>
    </Layout>
  );
}