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
      const tenantCode = localStorage.getItem('tenant_code');
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
        {/* Hero Header matching User Management */}
        <div className="mb-6 px-4">
          <div className="rounded-2xl shadow-sm p-4 sm:p-6 relative overflow-hidden border" style={{
            background: `linear-gradient(to right, ${colors.primary}10, ${colors.secondary}10)`,
            borderColor: `${colors.primary}20`
          }}>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20" style={{
              backgroundColor: colors.primary,
              transform: 'translate(40%, -40%)'
            }}></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-3xl opacity-20" style={{
              backgroundColor: colors.secondary,
              transform: 'translate(-40%, 40%)'
            }}></div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{
                  backgroundColor: `${colors.primary}20`
                }}>
                  <DollarSign className="h-5 w-5 sm:h-6 sm:w-6" style={{
                    color: colors.primary
                  }} />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 truncate">Payroll Management</h1>
                  <p className="text-gray-600 text-xs sm:text-sm mb-1">Manage salary structures, statutory rules, payroll processing, payslips, and compliance reports</p>
                  <p className="text-gray-500 text-xs hidden sm:block">Employee Compensation</p>
                </div>
              </div>
              <div className="flex gap-2 sm:gap-3 flex-shrink-0">
                <div className="bg-white rounded-lg p-2 sm:p-3 shadow-sm border" style={{
                  borderColor: `${colors.primary}20`
                }}>
                  <div className="flex items-center gap-1 sm:gap-2 text-gray-600 mb-1">
                    <DollarSign className="h-3 w-3" />
                    <span className="text-xs font-medium">Modules</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{tabs.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="mb-6 px-4">
          <div className="rounded-full p-1.5 inline-flex space-x-1 overflow-x-auto scrollbar-hide w-full sm:w-auto relative overflow-hidden" style={{
            backgroundColor: `${colors.primary}10`,
            border: `1px solid ${colors.primary}20`
          }}>
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl opacity-15" style={{
              backgroundColor: colors.primary,
              transform: 'translate(30%, -30%)'
            }}></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full blur-2xl opacity-15" style={{
              backgroundColor: colors.secondary,
              transform: 'translate(-30%, 30%)'
            }}></div>
            {tabs.map((tabName) => (
              <button
                key={tabName}
                onClick={() => setTab(tabName)}
                className={`px-3 sm:px-4 py-1 text-xs sm:text-sm font-semibold rounded-full transition-all duration-300 whitespace-nowrap flex-shrink-0 relative z-10`}
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
          <div className="rounded-3xl shadow-xl overflow-hidden" style={{
            border: `1px solid ${colors.primary}20`
          }}>
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

