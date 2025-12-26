import { useState } from "react";
import Layout from "../../components/Layout";
import Statutory from "./Statutory";
import LabourRegister from "./LabourRegister";
import LeaveCompliance from "./LeaveCompliance";
import NABHCompliance from "./NABHCompliance";

export default function ComplianceLayout() {
  const [tab, setTab] = useState("statutory");

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-primary">Compliance Management</h2>
              <p className=" mt-1" style={{color: 'var(--text-secondary, #374151)'}}>Manage statutory compliance, labour laws, and regulatory requirements</p>
            </div>
          </div>
        </div>
        
        {/* TABS */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="flex border-b bg-gradient-to-r from-gray-50 to-blue-50 overflow-x-auto">
            {[
              ["statutory", "Statutory Rules"],
              ["labour", "Labour Register"],
              ["leave", "Leave Compliance"],
              ["nabh", "NABH Compliance"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-6 py-5 text-sm font-semibold border-b-3 transition-all duration-300 whitespace-nowrap ${
                  tab === key
                    ? 'border-blue-500 text-blue-600 bg-white shadow-lg transform -translate-y-1'
                    : 'border-transparent text-muted hover:text-secondary hover:bg-white/50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        
        {/* CONTENT */}
        <div className="bg-white p-6">
          {tab === "statutory" && <Statutory />}
          {tab === "labour" && <LabourRegister />}
          {tab === "leave" && <LeaveCompliance />}
          {tab === "nabh" && <NABHCompliance />}
        </div>
      </div>
    </Layout>
  );
}
