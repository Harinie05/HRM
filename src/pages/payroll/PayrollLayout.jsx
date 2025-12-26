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
        <div className="mb-3 sm:mb-4 px-3 sm:px-4">
          <div className="bg-white rounded-3xl border-2 border-black shadow-sm p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto sm:mx-0">
                  <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-gray-700" />
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Payroll Management</h1>
                  <p className="text-gray-600 text-base sm:text-lg mb-1">Manage salary structures, statutory rules, payroll processing, payslips, and compliance reports</p>
                  <p className="text-gray-500 text-sm">Employee Compensation</p>
                </div>
              </div>
              <div className="text-center sm:text-right">
                <div className="flex items-center justify-center sm:justify-end gap-2 text-gray-600 mb-2">
                  <span className="text-sm font-medium">Modules {tabs.length}</span>
                </div>
                <p className="text-base sm:text-lg font-bold text-gray-900">Payroll management tools</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="mb-6 px-4">
          <div className="bg-gray-100 border border-black rounded-full p-1.5 inline-flex space-x-1 overflow-x-auto scrollbar-hide w-full sm:w-auto">
            {tabs.map((tabName) => (
              <button
                key={tabName}
                onClick={() => setTab(tabName)}
                className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold rounded-full transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                  tab === tabName
                    ? 'bg-white text-gray-900 shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                {tabName}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-4">
          <div className="bg-white rounded-3xl shadow-xl border border-black overflow-hidden">
            {tab === "Salary Structure" && <SalaryStructure />}
            {tab === "Statutory Rules" && <StatutoryRules />}
            {tab === "Payroll Run" && <PayrollRun />}
            {tab === "Adjustments" && <PayrollAdjustments />}
            {tab === "Salary Slip & Payment" && <Payslips />}
            {tab === "Reports & Compliance" && <PayrollReports />}
          </div>
        </div>
      </div>
    </Layout>
  );
}
