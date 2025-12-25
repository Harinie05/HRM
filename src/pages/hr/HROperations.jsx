import { useState } from "react";
import Layout from "../../components/Layout";
import { Briefcase } from "lucide-react";
import Lifecycle from "./Lifecycle";
import Communication from "./Communication";
import Grievances from "./Grievances";
import Assets from "./Assets";
import Insurance from "./Insurance";

export default function HROperations() {
  const [tab, setTab] = useState("lifecycle");

  const tabs = [
    { key: "lifecycle", label: "Lifecycle Actions" },
    { key: "communication", label: "HR Letters" },
    { key: "grievances", label: "Grievances Desk" },
    { key: "assets", label: "Assets" },
    { key: "insurance", label: "Insurance & Benefits" }
  ];

  return (
    <Layout breadcrumb="HR & Workforce Management">
      <div className="w-full overflow-hidden">
        {/* Hero Section */}
        <div className="mb-4 px-4">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-4 text-white relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <div className="bg-white/20 rounded-lg p-1.5 mr-2">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-medium">
                    Human Resources
                  </span>
                </div>
                
                <h1 className="text-xl font-bold mb-1">
                  HR Operations & Workforce Management
                </h1>
                
                <p className="text-white/90 text-xs mb-3">
                  Manage employee lifecycle, communications, grievances, assets and benefits.
                </p>
                
                <div className="flex items-center space-x-3">
                  <button className="bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg text-xs font-medium transition-colors">
                    HR Operations
                  </button>
                  <span className="text-white/80 text-xs">
                    Used by HR / Management / Employees
                  </span>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center min-w-[120px]">
                <p className="text-white/80 text-xs font-medium uppercase tracking-wide mb-1">
                  MODULES
                </p>
                <p className="text-2xl font-bold mb-1">
                  {tabs.length}
                </p>
                <p className="text-white/70 text-xs">
                  HR management tools
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="mb-4 px-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="flex border-b bg-gradient-to-r from-gray-50 to-indigo-50 overflow-x-auto">
              {tabs.map((tabItem) => (
                <button
                  key={tabItem.key}
                  onClick={() => setTab(tabItem.key)}
                  className={`px-6 py-5 text-sm font-semibold border-b-3 transition-all duration-300 whitespace-nowrap ${
                    tab === tabItem.key
                      ? 'border-indigo-500 text-indigo-600 bg-white shadow-lg transform -translate-y-1'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/50'
                  }`}
                >
                  {tabItem.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4">
          {tab === "lifecycle" && <Lifecycle />}
          {tab === "communication" && <Communication />}
          {tab === "grievances" && <Grievances />}
          {tab === "assets" && <Assets />}
          {tab === "insurance" && <Insurance />}
        </div>
      </div>
    </Layout>
  );
}
