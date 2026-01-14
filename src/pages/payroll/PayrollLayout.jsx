import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Layout from "../../components/Layout";
import { DollarSign } from "lucide-react";
import useToast from "../../utils/useToast";
import Toast from "../../components/Toast";
import { hasPermission, isAdmin } from "../../utils/permissions";
import api from "../../api";

// Pages
import SalaryStructure from "./SalaryStructure";
import StatutoryRules from "./StatutoryRules";
import PayrollRun from "./PayrollRun";
import PayrollAdjustments from "./PayrollAdjustments";
import Payslips from "./Payslips";
import PayrollReports from "./PayrollReports";

export default function PayrollLayout() {
  const { toast, showToast, hideToast } = useToast();
  const location = useLocation();
  const [colors, setColors] = useState({ primary: '#2862e9', secondary: '#474e71' });
  
  const allTabs = [
    { name: "Salary Structure", permission: "view_salary_structure" },
    { name: "Statutory Rules", permission: "view_statutory_rules" },
    { name: "Payroll Run", permission: "view_payroll_run" },
    { name: "Adjustments", permission: "view_payroll_adjustments" },
    { name: "Salary Slip & Payment", permission: ["view_payslips", "view_salary_slips", "view_self"] },
    { name: "Reports & Compliance", permission: "view_payroll_reports" }
  ];

  const tabs = allTabs.filter(tab => {
    if (isAdmin()) return true;
    
    const permissions = Array.isArray(tab.permission) ? tab.permission : [tab.permission];
    return permissions.some(perm => hasPermission(perm));
  }).map(tab => tab.name);
  
  const initialTab = location.state?.tab && tabs.includes(location.state.tab) ? location.state.tab : tabs[0];
  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    fetchColors();
  }, []);

  const fetchColors = async () => {
    try {
      const tenantCode = localStorage.getItem('tenantCode');
      if (tenantCode) {
        const response = await api.get(`/auth/branding/${tenantCode}`);
        if (response.data.primary_color && response.data.secondary_color) {
          const newColors = {
            primary: response.data.primary_color,
            secondary: response.data.secondary_color
          };
          setColors(newColors);
          document.documentElement.style.setProperty('--primary-color', newColors.primary);
          document.documentElement.style.setProperty('--secondary-color', newColors.secondary);
        }
      }
    } catch (error) {
      console.error('Error fetching colors:', error);
    }
  };

  if (tabs.length === 0) {
    return (
      <Layout breadcrumb="Payroll Management">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-500">You don't have permission to access any payroll management features.</p>
          </div>
        </div>
      </Layout>
    );
  }

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
                <div className="bg-gray-100 rounded-xl p-3 border border-black text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-600 mb-1">
                    <span className="text-xs font-medium">Modules</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{tabs.length}</p>
                </div>
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
                className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold rounded-full transition-all duration-300 whitespace-nowrap flex-shrink-0`}
                style={{
                  backgroundColor: tab === tabName ? colors.primary : 'transparent',
                  color: tab === tabName ? 'white' : '#6b7280'
                }}
                onMouseEnter={(e) => {
                  if (tab !== tabName) {
                    e.target.style.backgroundColor = colors.secondary;
                    e.target.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (tab !== tabName) {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = '#6b7280';
                  }
                }}
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
      <Toast toast={toast} hideToast={hideToast} />
    </Layout>
  );
}

