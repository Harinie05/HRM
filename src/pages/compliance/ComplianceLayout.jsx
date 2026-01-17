import { useState, useEffect } from "react";
import { Shield } from "lucide-react";
import Layout from "../../components/Layout";
import Statutory from "./Statutory";
import LabourRegister from "./LabourRegister";
import LeaveCompliance from "./LeaveCompliance";
import NABHCompliance from "./NABHCompliance";
import { hasPermission, isAdmin } from "../../utils/permissions";
import api from "../../api";

export default function ComplianceLayout() {
  const allTabs = [
    { name: "Statutory Rules", permission: "view_statutory_calculations" },
    { name: "Labour Register", permission: "view_labour_register" },
    { name: "Leave Compliance", permission: "view_leave_compliance" },
    { name: "NABH Compliance", permission: "view_nabh_compliance" }
  ];

  const tabs = allTabs.filter(tab => isAdmin() || hasPermission(tab.permission)).map(tab => tab.name);
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [brandingColors, setBrandingColors] = useState({ primary: '#2862e9', secondary: '#474e71' });

  useEffect(() => {
    const fetchBrandingColors = async () => {
      try {
        const tenantCode = localStorage.getItem('tenant_code');
        if (tenantCode) {
          const response = await api.get(`/auth/branding/${tenantCode}`);
          setBrandingColors({
            primary: response.data.primary_color || '#2862e9',
            secondary: response.data.secondary_color || '#474e71'
          });
          document.documentElement.style.setProperty('--primary-color', response.data.primary_color || '#2862e9');
          document.documentElement.style.setProperty('--secondary-color', response.data.secondary_color || '#474e71');
        }
      } catch (error) {
        console.error('Error fetching branding colors:', error);
      }
    };
    fetchBrandingColors();
  }, []);

  if (tabs.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-500">You don't have permission to access any compliance management features.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const renderTabContent = () => {
    switch(activeTab) {
      case "Statutory Rules":
        return tabs.includes("Statutory Rules") ? <Statutory /> : null;
      case "Labour Register":
        return tabs.includes("Labour Register") ? <LabourRegister /> : null;
      case "Leave Compliance":
        return tabs.includes("Leave Compliance") ? <LeaveCompliance /> : null;
      case "NABH Compliance":
        return tabs.includes("NABH Compliance") ? <NABHCompliance /> : null;
      default:
        return tabs.includes(tabs[0]) ? <Statutory /> : null;
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border-0 shadow-sm p-4 sm:p-6" style={{
          background: `linear-gradient(to right, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10, ${getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}10)`
        }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <Shield className="h-5 w-5 sm:h-6 sm:w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 truncate">Compliance Management</h1>
                <p className="text-gray-600 text-xs sm:text-sm mb-1">Manage statutory compliance, labour laws, and regulatory requirements</p>
                <p className="text-gray-500 text-xs hidden sm:block">Statutory & Regulatory Compliance</p>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3 flex-shrink-0">
              <div className="bg-white rounded-lg p-2 sm:p-3 border-0 shadow-sm">
                <div className="flex items-center gap-1 sm:gap-2 text-gray-600 mb-1">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs font-medium">Modules</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{tabs.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Compliance Management Section */}
        <div className="rounded-xl shadow-sm overflow-hidden relative border" style={{
          background: `linear-gradient(135deg, white 0%, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}05 100%)`,
          borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
        }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
            transform: 'translate(40%, -40%)'
          }}></div>
          <div className="p-5 border-b-0 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{
                  backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
                }}>
                  <Shield className="h-5 w-5" style={{
                    color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                  }} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Compliance Modules</h3>
              </div>
            </div>
          </div>
          
          <div className="p-4 sm:p-5 space-y-4 relative z-10">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <span className="text-sm text-gray-600 whitespace-nowrap">Compliance Management</span>
                <div className="flex items-center bg-gray-100 rounded-full p-1 overflow-x-auto border-0 scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                  {tabs.map((tabName) => (
                    <button
                      key={tabName}
                      onClick={() => setActiveTab(tabName)}
                      className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-full transition-colors whitespace-nowrap flex-shrink-0 ${
                        activeTab === tabName 
                          ? "bg-white text-gray-900 shadow-sm" 
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                      style={{
                        backgroundColor: activeTab === tabName ? getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5' : 'transparent',
                        color: activeTab === tabName ? 'white' : '#6b7280'
                      }}
                      onMouseEnter={(e) => {
                        if (activeTab !== tabName) {
                          e.currentTarget.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                          e.currentTarget.style.color = 'white';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (activeTab !== tabName) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#6b7280';
                        }
                      }}
                    >
                      {tabName}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {renderTabContent()}
      </div>
    </Layout>
  );
}

