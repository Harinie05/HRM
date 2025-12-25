import { useState } from "react";
import Layout from "../../components/Layout";
import ResignationTracking from "./ResignationTrackingEnhanced";
import ClearanceWorkflow from "./ClearanceWorkflow";
import SettlementDocuments from "./SettlementDocuments";

export default function ExitLayout() {
  const [tab, setTab] = useState("resignation");

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-700 to-gray-800 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white/20 rounded-xl">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Exit Management System</h1>
              <p className="text-slate-200 text-sm mt-1">Manage employee resignations, clearance workflows, and final settlements</p>
            </div>
          </div>
        </div>
        
        {/* TABS */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="flex border-b bg-gradient-to-r from-gray-50 to-slate-50 overflow-x-auto">
            {[
              ["resignation", "Resignation & Notice"],
              ["clearance", "Clearance & Exit Process"],
              ["settlement", "F&F Settlement & Documents"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-6 py-5 text-sm font-semibold border-b-3 transition-all duration-300 whitespace-nowrap ${
                  tab === key
                    ? 'border-slate-500 text-slate-700 bg-white shadow-lg transform -translate-y-1'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        
        {/* CONTENT */}
        <div className="bg-white p-6">
          {tab === "resignation" && <ResignationTracking />}
          {tab === "clearance" && <ClearanceWorkflow />}
          {tab === "settlement" && <SettlementDocuments />}
        </div>
      </div>
    </Layout>
  );
}