import { useState } from "react";
import { Target, RotateCcw, MessageSquare, Award } from "lucide-react";
import Layout from "../../components/Layout";
import { hasPermission, isAdmin } from "../../utils/permissions";
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
        <div className="bg-white rounded-3xl border-2 border-black shadow-sm p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center border-2 border-black">
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Performance Management System</h1>
                  <p className="text-gray-600 text-sm sm:text-base mb-1">Automated PMS driven by Work Assignments</p>
                  <p className="text-gray-500 text-xs">Performance Management</p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <div className="bg-gray-100 rounded-xl p-3 border border-black text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-600 mb-1">
                    <span className="text-xs font-medium">Modules</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{tabs.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-black overflow-hidden">
            {/* Content */}
            <div className="p-4 sm:p-6">
              {/* Tab Navigation */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-6">
                <span className="text-sm text-gray-600">Modules</span>
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
              {/* Scroll indicator */}
              <div className="flex justify-center mb-6">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>

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
