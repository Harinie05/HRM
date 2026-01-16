import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { BookOpen } from "lucide-react";
import Layout from "../../components/Layout";
import { hasPermission, isAdmin } from "../../utils/permissions";
import { useEffect } from "react";
import api from "../../api";

export default function TrainingLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchColors = async () => {
      try {
        const tenantCode = localStorage.getItem('tenant_code');
        if (tenantCode) {
          const response = await api.get(`/auth/branding/${tenantCode}`);
          document.documentElement.style.setProperty('--primary-color', response.data.primary_color || '#2862e9');
          document.documentElement.style.setProperty('--secondary-color', response.data.secondary_color || '#474e71');
        }
      } catch (error) {
        console.error('Failed to fetch branding colors:', error);
      }
    };
    fetchColors();
  }, []);
  
  // Check if we're on a nested route (like applications)
  const isNestedRoute = location.pathname.includes('/applications');
  
  // If on nested route, just render the outlet
  if (isNestedRoute) {
    return (
      <Layout>
        <Outlet />
      </Layout>
    );
  }
  
  const allTabs = [
    { name: "Training Programs", path: "/training/programs", permission: "view_training_programs" },
    { name: "Training Calendar", path: "/training/calendar", permission: "view_training_calendar" }, 
    { name: "Training Requests", path: "/training/requests", permission: "view_training_requests" },
    { name: "Attendance & Assessment", path: "/training/attendance", permission: "view_training_attendance" },
    { name: "Certificates", path: "/training/certificates", permission: "view_training_certificates" }
  ];

  const tabs = allTabs.filter(tab => isAdmin() || hasPermission(tab.permission));

  if (tabs.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-500">You don't have permission to access any training management features.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const currentTab = tabs.find(tab => location.pathname === tab.path) || tabs[0];

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border-0 shadow-sm p-4 sm:p-6" style={{
          background: `linear-gradient(to right, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'}10, ${getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}10)`
        }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'}20`
              }}>
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'
                }} />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 truncate">Training & Development</h1>
                <p className="text-gray-600 text-xs sm:text-sm mb-1">Manage training programs, schedules, and employee development</p>
                <p className="text-gray-500 text-xs hidden sm:block">Employee Learning & Development</p>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3 flex-shrink-0">
              <div className="bg-white rounded-lg p-2 sm:p-3 border-0 shadow-sm">
                <div className="flex items-center gap-1 sm:gap-2 text-gray-600 mb-1">
                  <BookOpen className="h-3 w-3" />
                  <span className="text-xs font-medium">Modules</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{tabs.length}</p>
              </div>
            </div>
          </div>
        </div>

          <div className="rounded-xl shadow-sm overflow-hidden relative" style={{
            background: `linear-gradient(135deg, white 0%, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'}05 100%)`,
            border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'}20`
          }}>
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none" style={{
              background: `radial-gradient(circle, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'} 0%, transparent 70%)`,
              transform: 'translate(40%, -40%)'
            }}></div>
            {/* Content */}
            <div className="p-4 sm:p-6 relative z-10">
              {/* Tab Navigation */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-6">
                <span className="text-sm text-gray-600">Modules</span>
                <div className="flex items-center bg-gray-100 rounded-full p-1 overflow-x-auto scrollbar-hide border-0" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                  {tabs.map((tab) => (
                    <button
                      key={tab.name}
                      onClick={() => navigate(tab.path)}
                      className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-full transition-colors whitespace-nowrap flex-shrink-0 ${
                        currentTab.name === tab.name
                          ? "text-white"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                      style={{
                        backgroundColor: currentTab.name === tab.name ? 'var(--primary-color)' : 'transparent',
                        color: currentTab.name === tab.name ? 'white' : '#6b7280'
                      }}
                      onMouseEnter={(e) => {
                        if (currentTab.name !== tab.name) {
                          e.target.style.backgroundColor = 'var(--secondary-color)';
                          e.target.style.color = 'white';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentTab.name !== tab.name) {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.color = '#6b7280';
                        }
                      }}
                    >
                      {tab.name}
                    </button>
                  ))}
                </div>
              </div>
              {/* Scroll indicator */}
              <div className="flex justify-center mb-6">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>

              {/* Tab Content */}
              <Outlet />
            </div>
          </div>
      </div>
    </Layout>
  );
}


