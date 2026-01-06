import { useState } from "react";
import { LogOut } from "lucide-react";
import Layout from "../../components/Layout";
import { ResponsiveContainer, ResponsiveHeader, ResponsiveTabs, ResponsiveCard } from "../../components/ResponsiveUtils";
import { hasPermission, isAdmin } from "../../utils/permissions";
import ResignationTrackingEnhanced from "./ResignationTrackingEnhanced";
import ClearanceWorkflow from "./ClearanceWorkflow";
import SettlementDocuments from "./SettlementDocuments";
import KnowledgeTransfer from "./KnowledgeTransfer";

export default function ExitLayout() {
  const allTabs = [
    { name: "Resignation Tracking", permission: "view_resignation_tracking" },
    { name: "Clearance & Exit Process", permission: "view_clearance_process" },
    { name: "Knowledge Transfer", permission: "view_knowledge_transfer" },
    { name: "F&F Settlement & Documents", permission: "view_settlement_documents" }
  ];

  const tabs = allTabs.filter(tab => isAdmin() || hasPermission(tab.permission)).map(tab => tab.name);
  const [activeTab, setActiveTab] = useState(tabs[0]);

  if (tabs.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-500">You don't have permission to access any exit management features.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const renderTabContent = () => {
    switch(activeTab) {
      case "Resignation Tracking":
        return tabs.includes("Resignation Tracking") ? (
          <div>
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-medium text-gray-900">Resignation Tracking</h2>
                <p className="text-xs sm:text-sm text-gray-600">Track and manage employee resignations and exit process</p>
              </div>
            </div>
            <ResignationTrackingEnhanced />
          </div>
        ) : null;
      case "Clearance & Exit Process":
        return tabs.includes("Clearance & Exit Process") ? (
          <div>
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-medium text-gray-900">Clearance & Exit Process</h2>
                <p className="text-xs sm:text-sm text-gray-600">Manage clearance workflows and exit procedures</p>
              </div>
            </div>
            <ClearanceWorkflow />
          </div>
        ) : null;
      case "Knowledge Transfer":
        return tabs.includes("Knowledge Transfer") ? (
          <div>
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-medium text-gray-900">Knowledge Transfer</h2>
                <p className="text-xs sm:text-sm text-gray-600">Manage knowledge transfer process for exiting employees</p>
              </div>
            </div>
            <KnowledgeTransfer />
          </div>
        ) : null;
      case "F&F Settlement & Documents":
        return tabs.includes("F&F Settlement & Documents") ? (
          <div>
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-medium text-gray-900">F&F Settlement & Documents</h2>
                <p className="text-xs sm:text-sm text-gray-600">Handle final settlements and generate exit documents</p>
              </div>
            </div>
            <SettlementDocuments />
          </div>
        ) : null;
      default:
        return tabs.includes(tabs[0]) ? <ResignationTrackingEnhanced /> : null;
    }
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <ResponsiveContainer>
          {/* Header */}
          <ResponsiveHeader
            title="Exit Management"
            subtitle="Manage employee resignations, clearance workflows, and final settlements"
            icon={LogOut}
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
                    onClick={() => setActiveTab(tabName)}
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-full transition-colors whitespace-nowrap flex-shrink-0 ${
                      activeTab === tabName 
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
              {renderTabContent()}
            </div>
          </ResponsiveCard>
        </ResponsiveContainer>
      </div>
    </Layout>
  );
}