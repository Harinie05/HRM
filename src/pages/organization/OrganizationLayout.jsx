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
        {/* Hero Header matching User Management */}
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6" style={{
          background: `linear-gradient(to right, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10, ${getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}10)`
        }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <svg className="h-5 w-5 sm:h-6 sm:w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z"/>
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 truncate">Organization Setup</h1>
                <p className="text-gray-600 text-xs sm:text-sm mb-1">Configure company profile, departments, branches and organizational structure</p>
                <p className="text-gray-500 text-xs hidden sm:block">Company Structure & Setup</p>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3 flex-shrink-0">
              <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-1 sm:gap-2 text-gray-600 mb-1">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z"/>
                  </svg>
                  <span className="text-xs font-medium">Components</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{visibleTabs.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Organization Management Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{
                  backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
                }}>
                  <svg className="h-5 w-5" style={{
                    color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                  }} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Setup Modules</h3>
              </div>
            </div>
          </div>
          
          <div className="p-4 sm:p-5 space-y-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <span className="text-sm text-gray-600 whitespace-nowrap">Setup</span>
                <div className="flex items-center bg-gray-100 rounded-full p-1 overflow-x-auto border border-gray-200 scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                  {visibleTabs.map((tabItem) => {
                    return (
                      <button
                        key={tabItem.name}
                        onClick={() => setTab(tabItem.name)}
                        className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-full transition-colors whitespace-nowrap flex-shrink-0 ${
                          tab === tabItem.name 
                            ? "bg-white text-gray-900 shadow-sm" 
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                        style={{
                          backgroundColor: tab === tabItem.name ? getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5' : 'transparent',
                          color: tab === tabItem.name ? 'white' : '#6b7280'
                        }}
                        onMouseEnter={(e) => {
                          if (tab !== tabItem.name) {
                            e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                            e.target.style.color = 'white';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (tab !== tabItem.name) {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = '#6b7280';
                          }
                        }}
                      >
                        {tabItem.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div>
          {tab === "Company Profile" && <CompanyProfile />}
          {tab === "Branch / Unit" && <Branch />}
          {tab === "Department" && <DepartmentList />}
          {tab === "Designation" && <DesignationList />}
          {tab === "Reporting Structure" && <ReportingStructure />}
          {tab === "Holiday Calendar" && <HolidayCalender />}
        </div>
      </div>
    </Layout>
  );
}