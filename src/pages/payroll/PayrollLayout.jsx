import { useState } from "react";
import { useLocation } from "react-router-dom";
import Layout from "../../components/Layout";
import { DollarSign } from "lucide-react";

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
    <Layout breadcrumb="Payroll Management">
      <div className="w-full overflow-hidden">
        {/* Hero Section */}
        <div className="mb-4 px-4">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-4 text-white relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <div className="bg-white/20 rounded-lg p-1.5 mr-2">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-medium">
                    Employee Compensation
                  </span>
                </div>
                
                <h1 className="text-xl font-bold mb-1">
                  Payroll Management
                </h1>
                
                <p className="text-white/90 text-xs mb-3">
                  Manage salary structures, statutory rules, payroll processing, payslips, and compliance reports.
                </p>
                
                <div className="flex items-center space-x-3">
                  <button className="bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg text-xs font-medium transition-colors">
                    Payroll System
                  </button>
                  <span className="text-white/80 text-xs">
                    Used by HR / Finance / Payroll Team
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
                  Payroll management tools
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="mb-4 px-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="flex border-b bg-gradient-to-r from-gray-50 to-blue-50 overflow-x-auto">
              {tabs.map((tabName) => (
                <button
                  key={tabName}
                  onClick={() => setTab(tabName)}
                  className={`px-6 py-5 text-sm font-semibold border-b-3 transition-all duration-300 whitespace-nowrap ${
                    tab === tabName
                      ? 'border-blue-500 text-blue-600 bg-white shadow-lg transform -translate-y-1'
                      : 'border-transparent text-muted hover:text-secondary hover:bg-white/50'
                  }`}
                >
                  {tabName}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4">
          {tab === "Salary Structure" && <SalaryStructure />}
          {tab === "Statutory Rules" && <StatutoryRules />}
          {tab === "Payroll Run" && <PayrollRun />}
          {tab === "Adjustments" && <PayrollAdjustments />}
          {tab === "Salary Slip & Payment" && <Payslips />}
          {tab === "Reports & Compliance" && <PayrollReports />}
        </div>
      </div>
    </Layout>
  );
}
