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
      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border shadow-sm p-4 sm:p-6" style={{
          background: `linear-gradient(to right, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'}10, ${getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}10)`,
          border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'}`
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
              <div className="bg-white rounded-lg p-2 sm:p-3 border shadow-sm" style={{
                border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'}`
              }}>
                <div className="flex items-center gap-1 sm:gap-2 text-gray-600 mb-1">
                  <BookOpen className="h-3 w-3" />
                  <span className="text-xs font-medium">Modules</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{tabs.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-20 px-4">
          <div className="rounded-full p-1.5 inline-flex space-x-1 overflow-x-auto scrollbar-hide w-full sm:w-auto relative overflow-hidden border" style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'}10`,
            border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'}`
          }}>
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl opacity-15" style={{
              backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9',
              transform: 'translate(30%, -30%)'
            }}></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full blur-2xl opacity-15" style={{
              backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71',
              transform: 'translate(-30%, 30%)'
            }}></div>
            {tabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => navigate(tab.path)}
                className={`px-3 sm:px-4 py-1 text-xs sm:text-sm font-semibold rounded-full transition-all duration-300 whitespace-nowrap flex-shrink-0 relative z-10`}
                style={{
                  backgroundColor: currentTab.name === tab.name ? 'var(--primary-color)' : 'transparent',
                  color: currentTab.name === tab.name ? 'white' : '#6b7280'
                }}
                onMouseEnter={(e) => {
                  if (currentTab.name !== tab.name) {
                    e.currentTarget.style.backgroundColor = 'var(--secondary-color)';
                    e.currentTarget.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentTab.name !== tab.name) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#6b7280';
                  }
                }}
              >
                {tab.name}
              </button>
            ))}
        </div>

        {/* Content */}
        <div className="rounded-3xl shadow-xl overflow-hidden border mt-8" style={{
          border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'}`
        }}>
          <div className="p-4 sm:p-6">
              {/* Tab Content */}
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}


