import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { BookOpen } from "lucide-react";
import Layout from "../../components/Layout";

export default function TrainingLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  
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
  
  const tabs = [
    { name: "Training Programs", path: "/training/programs" },
    { name: "Training Calendar", path: "/training/calendar" }, 
    { name: "Training Requests", path: "/training/requests" },
    { name: "Attendance & Assessment", path: "/training/attendance" },
    { name: "Certificates", path: "/training/certificates" }
  ];

  const currentTab = tabs.find(tab => location.pathname === tab.path) || tabs[0];

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header with gradient background */}
        <div className="bg-white rounded-3xl border-2 border-black shadow-sm p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center border-2 border-black">
                  <BookOpen className="w-8 h-8 text-gray-700" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Training & Development</h1>
                  <p className="text-gray-600 text-base sm:text-lg mb-1">Manage training programs, schedules, and employee development</p>
                  <p className="text-gray-500 text-sm">Employee Learning & Development</p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <span className="text-sm font-medium">5 Modules</span>
                </div>
                <p className="text-lg font-bold text-gray-900">Training components</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-black overflow-hidden">
            {/* Content */}
            <div className="p-4 sm:p-6">
              {/* Tab Navigation */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-6">
                <div className="flex items-center bg-gray-100 rounded-full p-1 overflow-x-auto border border-black">
                  {tabs.map((tab) => (
                    <button
                      key={tab.name}
                      onClick={() => navigate(tab.path)}
                      className={`px-4 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
                        currentTab.name === tab.name
                          ? "bg-white text-gray-900 shadow-sm border border-gray-300"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {tab.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <Outlet />
            </div>
          </div>
      </div>
    </Layout>
  );
}
