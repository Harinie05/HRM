import { useState } from "react";
import Layout from "../../components/Layout";
import GoalsKPI from "./GoalsKPI";
import ReviewCycle from "./ReviewCycle";
import Feedback from "./Feedback";
import Appraisal from "./Appraisal";

export default function PMSManagement() {
  const [tab, setTab] = useState("goals");

  return (
    <Layout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-sm p-4 sm:p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="p-2 bg-white/20 rounded-xl flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold">Performance Management System</h1>
              <p className="text-purple-100 text-sm mt-1">Manage employee goals, reviews, and performance tracking</p>
            </div>
          </div>
        </div>
        
        {/* TABS */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="flex border-b bg-gradient-to-r from-gray-50 to-blue-50 overflow-x-auto scrollbar-hide">
            {[
              ["goals", "Goals & KPI"],
              ["reviews", "Review Cycle"],
              ["feedback", "Feedback"],
              ["appraisal", "Appraisal"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-4 sm:px-6 py-4 sm:py-5 text-xs sm:text-sm font-semibold border-b-3 transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                  tab === key
                    ? 'border-blue-500 text-blue-600 bg-white shadow-lg transform -translate-y-1'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        
        {/* CONTENT */}
        <div className="bg-white p-4 sm:p-6 rounded-xl">
          {tab === "goals" && <GoalsKPI />}
          {tab === "reviews" && <ReviewCycle />}
          {tab === "feedback" && <Feedback />}
          {tab === "appraisal" && <Appraisal />}
        </div>
      </div>
    </Layout>
  );
}