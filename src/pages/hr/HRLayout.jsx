import { useState } from "react";
import { useLocation } from "react-router-dom";

import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

// Pages
import Insurance from "./Insurance";

export default function HRLayout() {
  const location = useLocation();
  
  const initialTab = location.state?.tab || "Insurance & Benefits";
  const [tab, setTab] = useState(initialTab);

  const tabs = [
    "Insurance & Benefits"
  ];

  return (
    <div className="flex bg-[#F5F7FA] min-h-screen">
      {/* SIDEBAR */}
      <Sidebar />
      
      {/* CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col">
        {/* HEADER */}
        <Header />
        
        {/* TOP TABS */}
        <div className="bg-white border-b  px-6 pt-4">
          <h1 className="text-2xl font-bold text-primary mb-4">HR Operations & Workforce Management</h1>
          <div className="flex space-x-8">
            {tabs.map((tabName) => (
              <button
                key={tabName}
                onClick={() => setTab(tabName)}
                className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                  tab === tabName
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-muted hover:text-secondary hover:-dark"
                }`}
              >
                {tabName}
              </button>
            ))}
          </div>
        </div>

        {/* INNER PAGE CONTENT */}
        <div className="p-6">
          {tab === "Insurance & Benefits" && <Insurance />}
        </div>
      </div>
    </div>
  );
}
