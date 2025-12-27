import { useState } from "react";
import { Target, RotateCcw, MessageSquare, Award } from "lucide-react";
import Layout from "../../components/Layout";
import GoalsKPI from "./GoalsKPI";
import ReviewCycle from "./ReviewCycle";
import Feedback from "./Feedback";
import Appraisal from "./Appraisal";

export default function PMSManagement() {
  const [tab, setTab] = useState("Goals & KPI");

  const tabs = [
    "Goals & KPI",
    "Review Cycle",
    "Feedback",
    "Appraisal"
  ];

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
                  <p className="text-gray-600 text-sm sm:text-base mb-1">Manage employee goals, reviews, feedback, and performance appraisals</p>
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
                <div className="flex items-center bg-gray-100 rounded-full p-1 overflow-x-auto border border-black">
                  {tabs.map((tabName) => (
                    <button
                      key={tabName}
                      onClick={() => setTab(tabName)}
                      className={`px-4 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
                        tab === tabName
                          ? "bg-white text-gray-900 shadow-sm border border-gray-300"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {tabName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              {tab === "Goals & KPI" && <GoalsKPI />}
              {tab === "Review Cycle" && <ReviewCycle />}
              {tab === "Feedback" && <Feedback />}
              {tab === "Appraisal" && <Appraisal />}
            </div>
          </div>
      </div>
    </Layout>
  );
}
