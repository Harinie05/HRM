import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Shield } from "lucide-react";
import Layout from "../../components/Layout";
import { ResponsiveContainer, ResponsiveHeader, ResponsiveTabs, ResponsiveCard } from "../../components/ResponsiveUtils";
import Statutory from "./Statutory";
import LabourRegister from "./LabourRegister";
import LeaveCompliance from "./LeaveCompliance";
import NABHCompliance from "./NABHCompliance";
import { hasPermission, isAdmin } from "../../utils/permissions";

export default function ComplianceLayout() {
  const location = useLocation();
  
  const canViewStatutory = isAdmin() || hasPermission('view_statutory_calculations');
  const canViewLabour = isAdmin() || hasPermission('view_labour_register');
  const canViewLeave = isAdmin() || hasPermission('view_leave_compliance');
  const canViewNABH = isAdmin() || hasPermission('view_nabh_compliance');

  const tabs = [
    canViewStatutory && "Statutory Rules",
    canViewLabour && "Labour Register", 
    canViewLeave && "Leave Compliance",
    canViewNABH && "NABH Compliance"
  ].filter(Boolean);
  
  const initialTab = location.state?.tab || "Statutory Rules";
  const validInitialTab = tabs.includes(initialTab) ? initialTab : tabs[0];
  const [tab, setTab] = useState(validInitialTab);

  return (
    <Layout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <ResponsiveContainer>
          {/* Header */}
          <ResponsiveHeader
            title="Compliance Management"
            subtitle="Manage statutory compliance, labour laws, and regulatory requirements"
            icon={Shield}
            actions={
              <div className="text-left lg:text-right">
                  <div className="bg-gray-100 rounded-xl p-3 border border-black text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-600 mb-1">
                      <span className="text-xs font-medium">Modules</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{tabs.length}</p>
                  </div>
              </div>
            }
          />

          <ResponsiveCard>
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
            <div className="min-h-0">
              {tab === "Statutory Rules" && canViewStatutory && (
                <div>
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base sm:text-lg font-medium text-gray-900">Statutory Rules</h2>
                      <p className="text-xs sm:text-sm text-gray-600">Manage PF, ESI, Professional Tax, and TDS calculations</p>
                    </div>
                  </div>
                  <Statutory />
                </div>
              )}
              {tab === "Labour Register" && canViewLabour && (
                <div>
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base sm:text-lg font-medium text-gray-900">Labour Register</h2>
                      <p className="text-xs sm:text-sm text-gray-600">Maintain employee records and labour law compliance</p>
                    </div>
                  </div>
                  <LabourRegister />
                </div>
              )}
              {tab === "Leave Compliance" && canViewLeave && (
                <div>
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base sm:text-lg font-medium text-gray-900">Leave Compliance</h2>
                      <p className="text-xs sm:text-sm text-gray-600">Monitor leave policies and statutory leave requirements</p>
                    </div>
                  </div>
                  <LeaveCompliance />
                </div>
              )}
              {tab === "NABH Compliance" && canViewNABH && (
                <div>
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base sm:text-lg font-medium text-gray-900">NABH Compliance</h2>
                      <p className="text-xs sm:text-sm text-gray-600">Ensure healthcare accreditation and quality standards</p>
                    </div>
                  </div>
                  <NABHCompliance />
                </div>
              )}
            </div>
          </ResponsiveCard>
        </ResponsiveContainer>
      </div>
    </Layout>
  );
}