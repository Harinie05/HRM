import { useState } from "react";
import { useLocation } from "react-router-dom";

import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

// Pages
import SalaryStructure from "./SalaryStructure";
import StatutoryRules from "./StatutoryRules";
import PayrollRun from "./PayrollRun";
import PayrollAdjustments from "./PayrollAdjustments";
import Payslips from "./Payslips";
import PayrollReports from "./PayrollReports";

export default function PayrollLayout() {
  const location = useLocation();
  
  const initialTab = location.state?.tab || "Salary Structure";
  const [tab, setTab] = useState(initialTab);

  const tabs = [
    "Salary Structure",
    "Statutory Rules",
    "Payroll Run",
    "Adjustments",
    "Salary Slip & Payment",
    "Reports & Compliance"
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
        <div className="bg-white border-b border-gray-200 px-6 pt-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Payroll Management</h1>
          <div className="flex space-x-8">
            {tabs.map((tabName) => (
              <button
                key={tabName}
                onClick={() => setTab(tabName)}
                className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                  tab === tabName
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tabName}
              </button>
            ))}
          </div>
        </div>

        {/* INNER PAGE CONTENT */}
        <div className="p-6">
          {tab === "Salary Structure" && <SalaryStructure />}
          {tab === "Statutory Rules" && <StatutoryRules />}
          {tab === "Payroll Run" && <PayrollRun />}
          {tab === "Adjustments" && <PayrollAdjustments />}
          {tab === "Salary Slip & Payment" && <Payslips />}
          {tab === "Reports & Compliance" && <PayrollReports />}
        </div>
      </div>
    </div>
  );
}