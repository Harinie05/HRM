import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Shield } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Statutory from "./Statutory";
import LabourRegister from "./LabourRegister";
import LeaveCompliance from "./LeaveCompliance";
import NABHCompliance from "./NABHCompliance";

export default function ComplianceLayout() {
  const location = useLocation();
  
  const initialTab = location.state?.tab || "Statutory Rules";
  const [tab, setTab] = useState(initialTab);

  const tabs = [
    "Statutory Rules",
    "Labour Register", 
    "Leave Compliance",
    "NABH Compliance"
  ];

  return (
    <div className="flex bg-gradient-to-br from-gray-50 via-white to-blue-50 min-h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <Header />
        
        <div className="p-6 pt-24">
          {/* Header with gradient background */}
          <div className="bg-white rounded-3xl border-2 border-black shadow-sm p-8 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                  <Shield className="w-8 h-8 text-gray-700" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Compliance Management</h1>
                  <p className="text-gray-600 text-lg mb-1">Manage statutory compliance, labour laws, and regulatory requirements</p>
                  <p className="text-gray-500 text-sm">Regulatory & Legal Compliance</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <span className="text-sm font-medium">Modules {tabs.length}</span>
                </div>
                <p className="text-lg font-bold text-gray-900">Compliance areas</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-black overflow-hidden">
            {/* Content */}
            <div className="p-6">
              {/* Tab Navigation */}
              <div className="flex items-center gap-2 mb-6">
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
              {tab === "Statutory Rules" && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">Statutory Rules</h2>
                      <p className="text-sm text-gray-600">Manage PF, ESI, Professional Tax, and TDS calculations</p>
                    </div>
                  </div>
                  <Statutory />
                </div>
              )}
              {tab === "Labour Register" && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">Labour Register</h2>
                      <p className="text-sm text-gray-600">Maintain employee records and labour law compliance</p>
                    </div>
                  </div>
                  <LabourRegister />
                </div>
              )}
              {tab === "Leave Compliance" && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">Leave Compliance</h2>
                      <p className="text-sm text-gray-600">Monitor leave policies and statutory leave requirements</p>
                    </div>
                  </div>
                  <LeaveCompliance />
                </div>
              )}
              {tab === "NABH Compliance" && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">NABH Compliance</h2>
                      <p className="text-sm text-gray-600">Ensure healthcare accreditation and quality standards</p>
                    </div>
                  </div>
                  <NABHCompliance />
                </div>
              )}
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
    </div>
  );
}
