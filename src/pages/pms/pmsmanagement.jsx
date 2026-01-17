import { useState } from "react";
import { Target, RotateCcw, MessageSquare, Award } from "lucide-react";
import Layout from "../../components/Layout";
import { hasPermission, isAdmin } from "../../utils/permissions";
import { useEffect } from "react";
import WorkAssignments from "./WorkAssignments";
import GoalsKPI from "./GoalsKPI";
import ReviewCycle from "./ReviewCycle";
import Feedback from "./Feedback";
import Appraisal from "./Appraisal";
import QualityIndicators from "./QualityIndicators";

export default function PMSManagement() {
  const allTabs = [
    { name: "Work Assignments", permission: "view_work_assignments" },
    { name: "Goals & KPI", permission: "view_goals_kpi" },
    { name: "Review Cycle", permission: "view_review_cycles" },
    { name: "Feedback", permission: "view_feedback" },
    { name: "Appraisal", permission: "view_appraisals" },
    { name: "Quality Indicators", permission: "view_quality_indicators" }
  ];

  const tabs = allTabs.filter(tab => isAdmin() || hasPermission(tab.permission)).map(tab => tab.name);
  const [tab, setTab] = useState(tabs[0]);

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

  if (tabs.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-500">You don't have permission to access any performance management features.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header with reduced size and proper padding */}
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border shadow-sm p-4 sm:p-6" style={{
          background: `linear-gradient(to right, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'}10, ${getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}10)`,
          border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'}`
        }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'}20`
              }}>
                <svg className="h-5 w-5 sm:h-6 sm:w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'
                }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 truncate">Performance Management System</h1>
                <p className="text-gray-600 text-xs sm:text-sm mb-1">Automated PMS driven by Work Assignments</p>
                <p className="text-gray-500 text-xs hidden sm:block">Performance Management</p>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3 flex-shrink-0">
              <div className="bg-white rounded-lg p-2 sm:p-3 border shadow-sm" style={{
                border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'}`
              }}>
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

        {/* Tab Navigation */}
        <div className="mb-6 px-4">
          <div className="rounded-full p-1.5 inline-flex space-x-1 overflow-x-auto scrollbar-hide w-full sm:w-auto relative overflow-hidden" style={{
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
            {tabs.map((tabName) => (
              <button
                key={tabName}
                onClick={() => setTab(tabName)}
                className={`px-3 sm:px-4 py-1 text-xs sm:text-sm font-semibold rounded-full transition-all duration-300 whitespace-nowrap flex-shrink-0 relative z-10`}
                style={{
                  backgroundColor: tab === tabName ? 'var(--primary-color)' : 'transparent',
                  color: tab === tabName ? 'white' : '#6b7280'
                }}
                onMouseEnter={(e) => {
                  if (tab !== tabName) {
                    e.currentTarget.style.backgroundColor = 'var(--secondary-color)';
                    e.currentTarget.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (tab !== tabName) {
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

          <div className="bg-white rounded-xl shadow-sm overflow-hidden relative border" style={{
            background: `linear-gradient(135deg, white 0%, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'}05 100%)`,
            border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'}`
          }}>
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-30 pointer-events-none" style={{
              background: `radial-gradient(circle, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'}40 0%, transparent 70%)`,
              transform: 'translate(40%, -40%)'
            }}></div>
            {/* Content */}
            <div className="p-4 sm:p-6">
              {/* Tab Content */}
              {tabs.includes("Work Assignments") && tab === "Work Assignments" && <WorkAssignments />}
              {tabs.includes("Goals & KPI") && tab === "Goals & KPI" && <GoalsKPI />}
              {tabs.includes("Review Cycle") && tab === "Review Cycle" && <ReviewCycle />}
              {tabs.includes("Feedback") && tab === "Feedback" && <Feedback />}
              {tabs.includes("Appraisal") && tab === "Appraisal" && <Appraisal />}
              {tabs.includes("Quality Indicators") && tab === "Quality Indicators" && <QualityIndicators />}
            </div>
          </div>
      </div>
    </Layout>
  );
}

