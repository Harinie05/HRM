import { useState } from "react";
import { LogOut } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ResignationTrackingEnhanced from "./ResignationTrackingEnhanced";
import ClearanceWorkflow from "./ClearanceWorkflow";
import SettlementDocuments from "./SettlementDocuments";

export default function ExitLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Resignation Tracking");

  const tabs = [
    "Resignation Tracking",
    "Clearance & Exit Process",
    "F&F Settlement & Documents"
  ];

  const renderTabContent = () => {
    switch(activeTab) {
      case "Resignation Tracking":
        return (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-medium text-gray-900">Resignation Tracking</h2>
                <p className="text-sm text-gray-600">Track and manage employee resignations and exit process</p>
              </div>
            </div>
            <ResignationTrackingEnhanced />
          </div>
        );
      case "Clearance & Exit Process":
        return (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-medium text-gray-900">Clearance & Exit Process</h2>
                <p className="text-sm text-gray-600">Manage clearance workflows and exit procedures</p>
              </div>
            </div>
            <ClearanceWorkflow />
          </div>
        );
      case "F&F Settlement & Documents":
        return (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-medium text-gray-900">F&F Settlement & Documents</h2>
                <p className="text-sm text-gray-600">Handle final settlements and generate exit documents</p>
              </div>
            </div>
            <SettlementDocuments />
          </div>
        );
      default:
        return <ResignationTrackingEnhanced />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 pt-20">
          <div className="container mx-auto px-6 py-4">
            {/* Header with gradient background */}
            <div className="bg-white rounded-3xl border-2 border-black shadow-sm p-4 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center border-2 border-black">
                    <LogOut className="w-6 h-6 text-gray-700" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Exit Management</h1>
                    <p className="text-gray-600 text-sm sm:text-base mb-1">Manage employee resignations, clearance workflows, and final settlements</p>
                    <p className="text-gray-500 text-xs">Employee Exit & Offboarding</p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <span className="text-xs font-medium">{tabs.length} Modules</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900">Exit components</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-black overflow-hidden">
              {/* Content */}
              <div className="p-3 sm:p-4">
                {/* Tab Navigation */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
                  <div className="flex items-center bg-gray-100 rounded-full p-1 overflow-x-auto border border-black">
                    {tabs.map((tabName) => (
                      <button
                        key={tabName}
                        onClick={() => setActiveTab(tabName)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap ${
                          activeTab === tabName
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
                {renderTabContent()}
              </div>
            </div>
            
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
}