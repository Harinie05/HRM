import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Users } from "lucide-react";
import Layout from "../../components/Layout";
import { hasPermission, isAdmin } from "../../utils/permissions";
import api from "../../api";
import Insurance from "./Insurance";
import Lifecycle from "./Lifecycle";
import Communication from "./Communication";
import Grievances from "./Grievances";
import Assets from "./Assets";
import StaffScheduling from "./StaffScheduling";

export default function HRLayout() {
  const location = useLocation();
  const [colors, setColors] = useState({ primary: '#2862e9', secondary: '#474e71' });
  
  const allTabs = [
    { name: "Lifecycle Actions", permission: "view_lifecycle_actions" },
    { name: "HR Letters", permission: "view_hr_letters" },
    { name: "Grievances Desk", permission: "view_grievances" },
    { name: "Assets", permission: "view_assets" },
    { name: "Insurance & Benefits", permission: "view_insurance_benefits" },
    { name: "Staff Scheduling", permission: "view_staff_scheduling" }
  ];

  const tabs = allTabs.filter(tab => isAdmin() || hasPermission(tab.permission)).map(tab => tab.name);
  
  const initialTab = location.state?.tab && tabs.includes(location.state.tab) ? location.state.tab : tabs[0];
  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    fetchColors();
  }, []);

  const fetchColors = async () => {
    try {
      const tenantCode = localStorage.getItem('tenant_code');
      if (tenantCode) {
        const response = await api.get(`/auth/branding/${tenantCode}`);
        if (response.data.primary_color && response.data.secondary_color) {
          setColors({
            primary: response.data.primary_color,
            secondary: response.data.secondary_color
          });
        }
      }
    } catch (error) {
      console.error('Error fetching colors:', error);
    }
  };

  if (tabs.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-500">You don't have permission to access any HR management features.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header with gradient background */}
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
                <Users className="h-5 w-5 sm:h-6 sm:w-6" style={{
                  color: colors.primary
                }} />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 truncate">HR Operations & Workforce Management</h1>
                <p className="text-gray-600 text-xs sm:text-sm mb-1">Manage employee lifecycle, communications, grievances, assets and benefits</p>
                <p className="text-gray-500 text-xs hidden sm:block">HR & Workforce Management</p>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3 flex-shrink-0">
              <div className="bg-white rounded-lg p-2 sm:p-3 shadow-sm border" style={{
                borderColor: `${colors.primary}20`
              }}>
                <div className="flex items-center gap-1 sm:gap-2 text-gray-600 mb-1">
                  <Users className="h-3 w-3" />
                  <span className="text-xs font-medium">Modules</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{tabs.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden relative" style={{
          background: `linear-gradient(135deg, white 0%, ${colors.primary}05 100%)`,
          border: `1px solid ${colors.primary}20`
        }}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-30 pointer-events-none" style={{
            background: `radial-gradient(circle, ${colors.primary}40 0%, transparent 70%)`,
            transform: 'translate(40%, -40%)'
          }}></div>
          {/* Content */}
          <div className="p-4 sm:p-6">
            {/* Tab Navigation */}
            <div className="mb-6">
              <div className="rounded-full p-1.5 inline-flex space-x-1 overflow-x-auto scrollbar-hide w-full sm:w-auto" style={{
                backgroundColor: `${colors.primary}10`,
                border: `1px solid ${colors.primary}20`
              }}>
                {tabs.map((tabName) => (
                  <button
                    key={tabName}
                    onClick={() => setTab(tabName)}
                    className={`px-3 sm:px-4 py-1 text-xs sm:text-sm font-semibold rounded-full transition-all duration-300 whitespace-nowrap flex-shrink-0`}
                    style={{
                      backgroundColor: tab === tabName ? colors.primary : 'transparent',
                      color: tab === tabName ? 'white' : '#6b7280'
                    }}
                    onMouseEnter={(e) => {
                      if (tab !== tabName) {
                        e.target.style.backgroundColor = colors.secondary;
                        e.target.style.color = 'white';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (tab !== tabName) {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.color = '#6b7280';
                      }
                    }}
                  >
                    {tabName}
                  </button>
                ))}
              </div>
            </div>

              {/* Tab Content */}
              {tab === "Lifecycle Actions" && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
                      backgroundColor: `${colors.primary}20`
                    }}>
                      <svg className="w-5 h-5" style={{ color: colors.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">Lifecycle Actions</h2>
                      <p className="text-sm text-gray-600">Manage employee promotions, transfers, and career changes</p>
                    </div>
                  </div>
                  <Lifecycle />
                </div>
              )}
              {tab === "HR Letters" && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
                      backgroundColor: `${colors.primary}20`
                    }}>
                      <svg className="w-5 h-5" style={{ color: colors.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">HR Letters</h2>
                      <p className="text-sm text-gray-600">Create and manage official HR communications and letters</p>
                    </div>
                  </div>
                  <Communication />
                </div>
              )}
              {tab === "Grievances Desk" && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
                      backgroundColor: `${colors.primary}20`
                    }}>
                      <svg className="w-5 h-5" style={{ color: colors.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">Grievances Desk</h2>
                      <p className="text-sm text-gray-600">Handle employee complaints and grievance resolution</p>
                    </div>
                  </div>
                  <Grievances />
                </div>
              )}
              {tab === "Assets" && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
                      backgroundColor: `${colors.primary}20`
                    }}>
                      <svg className="w-5 h-5" style={{ color: colors.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">Assets</h2>
                      <p className="text-sm text-gray-600">Track and manage company assets assigned to employees</p>
                    </div>
                  </div>
                  <Assets />
                </div>
              )}
              {tab === "Insurance & Benefits" && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
                      backgroundColor: `${colors.primary}20`
                    }}>
                      <svg className="w-5 h-5" style={{ color: colors.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">Insurance & Benefits</h2>
                      <p className="text-sm text-gray-600">Manage employee insurance policies and benefit programs</p>
                    </div>
                  </div>
                  <Insurance />
                </div>
              )}
              {tab === "Staff Scheduling" && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
                      backgroundColor: `${colors.primary}20`
                    }}>
                      <svg className="w-5 h-5" style={{ color: colors.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">Staff Scheduling vs Patient Load</h2>
                      <p className="text-sm text-gray-600">Optimize staff allocation based on patient demand and acuity</p>
                    </div>
                  </div>
                  <StaffScheduling />
                </div>
              )}
            </div>
          </div>
      </div>
    </Layout>
  );
}



