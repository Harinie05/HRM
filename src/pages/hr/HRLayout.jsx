import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Users } from "lucide-react";
import Layout from "../../components/Layout";
import Insurance from "./Insurance";
import Lifecycle from "./Lifecycle";
import Communication from "./Communication";
import Grievances from "./Grievances";
import Assets from "./Assets";
import ResignationTrackingEnhanced from "../exit/ResignationTrackingEnhanced";

export default function HRLayout() {
  const location = useLocation();
  
  const initialTab = location.state?.tab || "Lifecycle Actions";
  const [tab, setTab] = useState(initialTab);

  const tabs = [
    "Lifecycle Actions",
    "Exit Management",
    "HR Letters", 
    "Grievances Desk",
    "Assets",
    "Insurance & Benefits"
  ];

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header with gradient background */}
        <div className="bg-white rounded-3xl border-2 border-black shadow-sm p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center border-2 border-black">
                  <Users className="w-8 h-8 text-gray-700" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">HR Operations & Workforce Management</h1>
                  <p className="text-gray-600 text-base sm:text-lg mb-1">Manage employee lifecycle, communications, grievances, assets and benefits</p>
                  <p className="text-gray-500 text-sm">HR & Workforce Management</p>
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
              {tab === "Lifecycle Actions" && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              {tab === "Exit Management" && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">Exit Management</h2>
                      <p className="text-sm text-gray-600">Manage employee resignations, clearance workflows, and final settlements</p>
                    </div>
                  </div>
                  <ResignationTrackingEnhanced />
                </div>
              )}
              {tab === "HR Letters" && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            </div>
          </div>
      </div>
    </Layout>
  );
}
