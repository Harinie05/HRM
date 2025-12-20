import { useState } from "react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import Lifecycle from "./Lifecycle";
import Communication from "./Communication";
import Grievances from "./Grievances";
import Assets from "./Assets";
import Insurance from "./Insurance";

export default function HROperations() {
  const [tab, setTab] = useState("lifecycle");

  return (
    <div className="flex bg-[#F5F7FA] min-h-screen">
      
      {/* SIDEBAR */}
      <Sidebar />
      
      {/* CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col">
        
        {/* HEADER */}
        <Header />
        
        {/* PAGE TITLE */}
        <div className="bg-white border-b px-6 py-4">
          <h1 className="text-2xl font-semibold text-gray-800">HR Operations & Workforce Management</h1>
        </div>
        
        {/* TABS */}
        <div className="bg-white border-b px-6 py-3">
          <div className="flex gap-1">
            {[
              ["lifecycle", "Lifecycle Actions"],
              ["communication", "HR Letters"],
              ["grievances", "Grievances Desk"],
              ["assets", "Assets"],
              ["insurance", "Insurance & Benefits"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  tab === key 
                    ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600" 
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        
        {/* CONTENT */}
        <div className="flex-1 p-6">
          {tab === "lifecycle" && <Lifecycle />}
          {tab === "communication" && <Communication />}
          {tab === "grievances" && <Grievances />}
          {tab === "assets" && <Assets />}
          {tab === "insurance" && <Insurance />}
        </div>
      </div>
    </div>
  );
}
