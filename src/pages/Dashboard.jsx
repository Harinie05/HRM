import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { 
  Users, Building2, UserCheck, TrendingUp, TrendingDown, Calendar, AlertTriangle, 
  CheckCircle, Clock, BarChart3, Target, Award, GraduationCap, DollarSign, 
  FileText, UserPlus, Settings, Shield, Activity, Briefcase, PieChart,
  ArrowRight, Star, Zap, Globe, Bell, Eye, Database
} from "lucide-react";
import api from "../api";
import { hasPermission } from "../utils/permissions";

export default function Dashboard() {
  const [holidays, setHolidays] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalEmployees: 0,
    totalDepartments: 0,
    totalRoles: 0
  });
  const [licenseAlerts, setLicenseAlerts] = useState([]);
  const [documentAlerts, setDocumentAlerts] = useState([]);
  const [auditSummary, setAuditSummary] = useState({
    total_logs: 0,
    recent_activity: 0,
    active_users_24h: 0,
    top_actions: []
  });
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  // ========================= FETCH LICENSE ALERTS =========================
  const fetchLicenseAlerts = async () => {
    try {
      const res = await api.get("/employee/medical/license-alerts");
      setLicenseAlerts(res.data?.alerts || []);
    } catch {
      console.error("Failed to load license alerts");
    }
  };

  // ========================= FETCH AUDIT SUMMARY =========================
  const fetchAuditSummary = async () => {
    try {
      const res = await api.get("/dashboard/audit-summary");
      setAuditSummary(res.data || {
        total_logs: 0,
        recent_activity: 0,
        active_users_24h: 0,
        top_actions: []
      });
    } catch (error) {
      console.error("Failed to load audit summary:", error);
      setAuditSummary({
        total_logs: 0,
        recent_activity: 0,
        active_users_24h: 0,
        top_actions: []
      });
    }
  };

  // ========================= VIEW AUDIT LOGS =========================
  const viewAuditLogs = () => {
    // Navigate to audit logs in the same tab
    window.location.href = '/audit-logs';
  };
  const fetchDocumentAlerts = async () => {
    try {
      console.log('🔍 Fetching document alerts...');
      const res = await api.get("/dashboard/id-doc-alerts");
      console.log('📄 Document alerts response:', res.data);
      
      // Set the document alerts from the response
      const alerts = res.data?.alerts || res.data || [];
      console.log('📋 Setting document alerts:', alerts);
      setDocumentAlerts(alerts);
    } catch (error) {
      console.error("❌ Failed to load document alerts:", error);
      // Fallback to empty array on error
      setDocumentAlerts([]);
    }
  };

  // ========================= FETCH HOLIDAYS =========================
  const fetchHolidays = async () => {
    try {
      const res = await api.get("/holidays/list");
      setHolidays(res.data || []);
    } catch {
      console.error("Failed to load holidays");
    }
  };

  // ========================= FETCH DASHBOARD DATA =========================
  const fetchDashboardData = async () => {
    try {
      const res = await api.get("/dashboard/stats");
      const data = res.data;

      setDashboardData({
        totalEmployees: data.totalEmployees || 0,
        totalDepartments: data.totalDepartments || 0,
        totalRoles: data.totalRoles || 0
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);

      // Fallback logic
      try {
        const tenant_db = localStorage.getItem("tenant_db") || "nutryah";

        let totalEmployees = 0;
        try {
          const usersRes = await api.get(`/hospitals/users/${tenant_db}/list`);
          totalEmployees = (usersRes.data?.users || []).length;
        } catch {}

        let totalDepartments = 0;
        try {
          const deptRes = await api.get(`/hospitals/departments/${tenant_db}/list`);
          totalDepartments = (deptRes.data?.departments || []).length;
        } catch {}

        let totalRoles = 0;
        try {
          const rolesRes = await api.get(`/hospitals/roles/${tenant_db}/list`);
          totalRoles = (rolesRes.data?.roles || []).length;
        } catch {}

        setDashboardData({
          totalEmployees,
          totalDepartments,
          totalRoles
        });
      } catch (fallbackError) {
        console.error("Fallback dashboard fetch failed:", fallbackError);
      }
    }
  };

  // ========================= INITIAL LOAD =========================
  useEffect(() => {
    fetchHolidays();
    fetchDashboardData();
    fetchLicenseAlerts();
    fetchDocumentAlerts();
    fetchAuditSummary();
  }, []);

  // ========================= SYNC LISTENER =========================
  useEffect(() => {
    const handleSync = () => {
      fetchHolidays();
      fetchDashboardData();
    };

    window.addEventListener("page-sync", handleSync);
    return () => window.removeEventListener("page-sync", handleSync);
  }, []);

  // ========================= CALENDAR LOGIC =========================
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setMonth((m) => (m === 0 ? 11 : m - 1));
    if (month === 0) setYear((y) => y - 1);
  };

  const nextMonth = () => {
    setMonth((m) => (m === 11 ? 0 : m + 1));
    if (month === 11) setYear((y) => y + 1);
  };

  const getHolidayForDate = (day) => {
    const dateStr = new Date(year, month, day).toISOString().split("T")[0];
    return holidays.find((h) => h.date === dateStr);
  };

  // Mock data for professional dashboard
  const attritionData = {
    currentMonth: 0,
    lastMonth: 0,
    yearToDate: 0,
    trend: "stable"
  };

  const complianceData = {
    totalCompliant: 0,
    pendingDocuments: 0,
    expiringSoon: 0,
    complianceRate: 0
  };

  const upcomingHolidays = holidays
    .filter(h => new Date(h.date) >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  // HRM Modules Data
  const hrmModules = [
    {
      title: "User Management",
      description: "Complete employee lifecycle management with role-based access control",
      icon: Users,
      color: "blue",
      features: ["Employee Profiles", "Department Management", "Role Assignment", "Access Control"],
      status: "Active",
      usage: "98%"
    },
    {
      title: "Recruitment Management",
      description: "End-to-end recruitment process from job posting to onboarding",
      icon: UserPlus,
      color: "green",
      features: ["Job Postings", "Application Tracking", "Interview Scheduling", "Offer Management"],
      status: "Active",
      usage: "85%"
    },
    {
      title: "Attendance & Leave",
      description: "Comprehensive time tracking and leave management system",
      icon: Clock,
      color: "purple",
      features: ["Time Tracking", "Leave Requests", "Attendance Reports", "Policy Management"],
      status: "Active",
      usage: "92%"
    },
    {
      title: "Payroll Management",
      description: "Automated payroll processing with compliance and reporting",
      icon: DollarSign,
      color: "emerald",
      features: ["Salary Processing", "Tax Calculations", "Compliance Reports", "Payment Integration"],
      status: "Active",
      usage: "96%"
    },
    {
      title: "Performance Management",
      description: "Goal setting, performance reviews, and continuous feedback system",
      icon: Target,
      color: "orange",
      features: ["Goal Setting", "Performance Reviews", "360° Feedback", "Appraisal Cycles"],
      status: "Active",
      usage: "78%"
    },
    {
      title: "Training & Development",
      description: "Learning management and skill development tracking",
      icon: GraduationCap,
      color: "indigo",
      features: ["Training Programs", "Skill Assessment", "Certification Tracking", "Learning Paths"],
      status: "Active",
      usage: "73%"
    },
    {
      title: "Exit Management",
      description: "Streamlined employee exit process with compliance tracking",
      icon: FileText,
      color: "red",
      features: ["Resignation Processing", "Clearance Workflow", "Exit Interviews", "Final Settlement"],
      status: "Active",
      usage: "89%"
    },
    {
      title: "Analytics & Reports",
      description: "Comprehensive HR analytics and business intelligence",
      icon: BarChart3,
      color: "cyan",
      features: ["HR Dashboards", "Custom Reports", "Predictive Analytics", "Data Visualization"],
      status: "Active",
      usage: "91%"
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: "from-blue-50 to-blue-100 border-blue-200 text-blue-700",
      green: "from-green-50 to-green-100 border-green-200 text-green-700",
      purple: "from-purple-50 to-purple-100 border-purple-200 text-purple-700",
      emerald: "from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-700",
      orange: "from-orange-50 to-orange-100 border-orange-200 text-orange-700",
      indigo: "from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-700",
      red: "from-red-50 to-red-100 border-red-200 text-red-700",
      cyan: "from-cyan-50 to-cyan-100 border-cyan-200 text-cyan-700"
    };
    return colors[color] || colors.blue;
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Hero Header */}
        <div className="bg-white rounded-3xl border-2 border-black shadow-sm p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                <Building2 className="h-8 w-8 text-gray-700" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Healthcare HRM Suite</h1>
                <p className="text-gray-600 text-lg mb-1">Complete Human Resource Management Solution</p>
                <p className="text-gray-500 text-sm">Empowering Healthcare Organizations with Smart HR Technology</p>
              </div>
            </div>
            <div className="text-right">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-gray-100 rounded-xl p-3 border border-black">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Globe className="h-3 w-3" />
                    <span className="text-xs font-medium">Compliance</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900">NABH Standard</p>
                </div>
                <div className="bg-gray-100 rounded-xl p-3 border border-black">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <span className="text-xs font-medium">Date</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{today.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white rounded-xl p-4 sm:p-6 border border-black shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-600 text-xs sm:text-sm font-semibold uppercase tracking-wide">Total Employees</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{dashboardData.totalEmployees}</p>
                <p className="text-gray-500 text-xs mt-1">Active workforce</p>
              </div>
              <div className="p-2 sm:p-3 bg-gray-100 rounded-xl flex-shrink-0 shadow-sm">
                <Users className="h-5 w-5 sm:h-7 sm:w-7 text-gray-700" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 border border-black shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-600 text-xs sm:text-sm font-semibold uppercase tracking-wide">Departments</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{dashboardData.totalDepartments}</p>
                <p className="text-gray-500 text-xs mt-1">Organizational units</p>
              </div>
              <div className="p-2 sm:p-3 bg-gray-100 rounded-xl flex-shrink-0 shadow-sm">
                <Building2 className="h-5 w-5 sm:h-7 sm:w-7 text-gray-700" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 border border-black shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-600 text-xs sm:text-sm font-semibold uppercase tracking-wide">Active Roles</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{dashboardData.totalRoles}</p>
                <p className="text-gray-500 text-xs mt-1">Defined positions</p>
              </div>
              <div className="p-2 sm:p-3 bg-gray-100 rounded-xl flex-shrink-0 shadow-sm">
                <UserCheck className="h-5 w-5 sm:h-7 sm:w-7 text-gray-700" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 border border-black shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-600 text-xs sm:text-sm font-semibold uppercase tracking-wide">Compliance Rate</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{complianceData.complianceRate}%</p>
                <p className="text-gray-500 text-xs mt-1">NABH compliant</p>
              </div>
              <div className="p-2 sm:p-3 bg-gray-100 rounded-xl flex-shrink-0 shadow-sm">
                <Shield className="h-5 w-5 sm:h-7 sm:w-7 text-gray-700" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center text-xs text-gray-600">
                <span>0 Active Records</span>
                <span>Real-time Updates</span>
              </div>
              <div className="mt-2">
                <span className="text-xs text-gray-600">0 Active Rules</span>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* License & Document Alerts */}
          {hasPermission("view_documents_alerts") && (
          <div className="rounded-xl shadow-lg border border-black p-4 sm:p-6 bg-white hover:shadow-xl transition-all duration-300 cursor-pointer" onClick={() => setShowDocumentModal(true)}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Document Alerts</h3>
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                {(licenseAlerts.length + documentAlerts.length) > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                    {licenseAlerts.length + documentAlerts.length}
                  </span>
                )}
              </div>
            </div>
            
            <div className="text-center py-6">
              {(licenseAlerts.length + documentAlerts.length) > 0 ? (
                <div>
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">
                    {licenseAlerts.length + documentAlerts.length} Document Alerts
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Documents requiring immediate attention
                  </p>
                  <p className="text-sm text-blue-600 font-medium hover:text-blue-800">
                    Click to view all alerts
                  </p>
                </div>
              ) : (
                <div>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">All Documents Current</h4>
                  <p className="text-sm text-gray-600">No alerts at this time</p>
                </div>
              )}
            </div>
          </div>
          )}

          {/* Attrition Analysis */}
          <div className="rounded-xl shadow-lg border border-black p-4 sm:p-6 bg-white hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Attrition Analysis</h3>
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                <div>
                  <p className="text-sm text-gray-700 font-medium">Current Month</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{attritionData.currentMonth}%</p>
                </div>
                <div className="flex items-center text-gray-600">
                  <span className="text-sm">No change</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                  <p className="text-xs text-gray-600">Last Month</p>
                  <p className="text-base sm:text-lg font-semibold text-gray-900">{attritionData.lastMonth}%</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                  <p className="text-xs text-gray-600">Year to Date</p>
                  <p className="text-base sm:text-lg font-semibold text-gray-900">{attritionData.yearToDate}%</p>
                </div>
              </div>
              
              <div className="p-3 bg-gray-100 rounded-lg border border-gray-300 shadow-sm">
                <p className="text-sm text-gray-800 font-medium">Industry Benchmark: 15-20%</p>
                <p className="text-xs text-gray-600 mt-1">No attrition data available for new tenant</p>
              </div>
            </div>
          </div>

          {/* Manpower Compliance */}
          <div className="rounded-xl shadow-lg border border-black p-4 sm:p-6 bg-white hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Manpower Compliance</h3>
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-gray-600 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Compliant Employees</p>
                    <p className="text-xs text-gray-600">{complianceData.complianceRate}% of workforce</p>
                  </div>
                </div>
                <p className="text-lg sm:text-xl font-bold text-gray-900">{complianceData.totalCompliant}</p>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-600 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Pending Documents</p>
                    <p className="text-xs text-gray-600">Require immediate attention</p>
                  </div>
                </div>
                <p className="text-lg sm:text-xl font-bold text-gray-900">{complianceData.pendingDocuments}</p>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-gray-600 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Expiring Soon</p>
                    <p className="text-xs text-gray-600">Within next 30 days</p>
                  </div>
                </div>
                <p className="text-lg sm:text-xl font-bold text-gray-900">{complianceData.expiringSoon}</p>
              </div>
            </div>
          </div>

          {/* Audit Logs Summary */}
          {hasPermission("view_audit_log") && (
          <div className="rounded-xl shadow-lg border border-black p-4 sm:p-6 bg-white hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Audit Logs</h3>
              <Database className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                <div>
                  <p className="text-sm text-gray-700 font-medium">Total Logs</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{auditSummary.total_logs}</p>
                </div>
                <div className="flex items-center text-gray-600">
                  <span className="text-sm">All time</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                  <p className="text-xs text-gray-600">Recent Activity</p>
                  <p className="text-base sm:text-lg font-semibold text-gray-900">{auditSummary.recent_activity}</p>
                  <p className="text-xs text-gray-500">Last 7 days</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                  <p className="text-xs text-gray-600">Active Users</p>
                  <p className="text-base sm:text-lg font-semibold text-gray-900">{auditSummary.active_users_24h}</p>
                  <p className="text-xs text-gray-500">Last 24 hours</p>
                </div>
              </div>
              
              {auditSummary.top_actions.length > 0 && (
                <div className="p-3 bg-gray-100 rounded-lg border border-gray-300 shadow-sm">
                  <p className="text-sm text-gray-800 font-medium mb-2">Top Actions</p>
                  <div className="space-y-1">
                    {auditSummary.top_actions.slice(0, 3).map((action, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">{action.action}</span>
                        <span className="text-xs font-semibold text-gray-900">{action.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <button
                onClick={viewAuditLogs}
                className="w-full text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium border border-black shadow-md flex items-center justify-center gap-2"
                style={{ backgroundColor: 'var(--primary-color, #4575b5)' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--primary-hover, #3a6299)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary-color, #4575b5)'}
              >
                <Eye className="h-4 w-4" />
                View All Audit Logs
              </button>
            </div>
          </div>
          )}
        </div>

        {/* Product Overview */}
        <div className="rounded-2xl shadow-xl border border-black overflow-hidden bg-white">
          <div className="p-8 border-b border-black bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete HRM Module Suite</h2>
                <p className="text-gray-600">Comprehensive human resource management modules designed for healthcare organizations</p>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Activity className="h-5 w-5" />
                <span className="font-semibold">All Systems Operational</span>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {hrmModules.map((module, index) => {
                const IconComponent = module.icon;
                return (
                  <div key={index} className="bg-white rounded-xl p-6 border border-black shadow-lg hover:shadow-xl transition-all duration-300 group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-gray-100 rounded-xl group-hover:bg-gray-200 transition-all duration-300 shadow-sm">
                          <IconComponent className="h-6 w-6 text-gray-700" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{module.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 mb-1">
                          <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                          <span className="text-xs font-medium text-gray-700">{module.status}</span>
                        </div>
                        <div className="text-sm font-bold text-gray-900">{module.usage}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Key Features</p>
                      <div className="grid grid-cols-2 gap-2">
                        {module.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-3 w-3 text-gray-500" />
                            <span className="text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Holiday Gallery Section */}
        <div className="rounded-xl shadow-lg border border-black overflow-hidden bg-white">
          <div className="p-6 border-b border-black bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-200 rounded-xl shadow-sm">
                  <Calendar className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Holiday Gallery</h3>
                  <p className="text-sm text-gray-600">Upcoming holidays and company events</p>
                </div>
              </div>
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="text-white px-4 py-2 rounded-xl transition-colors duration-200 text-sm font-medium border border-black shadow-md"
                style={{ backgroundColor: 'var(--primary-color, #4575b5)' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--primary-hover, #3a6299)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary-color, #4575b5)'}
              >
                {showCalendar ? 'Hide Calendar' : 'View Calendar'}
              </button>
            </div>
          </div>

          {/* Upcoming Holidays Preview */}
          <div className="p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Upcoming Holidays</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {upcomingHolidays.length > 0 ? (
                upcomingHolidays.map((holiday, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border border-black shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{holiday.name}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(holiday.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No upcoming holidays found</p>
                </div>
              )}
            </div>
          </div>

          {/* Calendar View */}
          {showCalendar && (
            <div className="p-6 border-t border-black bg-gray-50">
              <div className="rounded-lg p-6 border border-black bg-white shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <button 
                    onClick={prevMonth} 
                    className="px-4 py-2 text-white rounded-lg transition-colors duration-200 font-medium border border-black shadow-sm"
                    style={{ backgroundColor: 'var(--primary-color, #4575b5)' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--primary-hover, #3a6299)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary-color, #4575b5)'}
                  >
                    ‹ Previous
                  </button>
                  <h2 className="text-xl font-bold text-gray-900">
                    {new Date(year, month).toLocaleString("en-US", { month: "long" })} {year}
                  </h2>
                  <button 
                    onClick={nextMonth} 
                    className="px-4 py-2 text-white rounded-lg transition-colors duration-200 font-medium border border-black shadow-sm"
                    style={{ backgroundColor: 'var(--primary-color, #4575b5)' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--primary-hover, #3a6299)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary-color, #4575b5)'}
                  >
                    Next ›
                  </button>
                </div>

                <div className="grid grid-cols-7 text-center font-semibold text-gray-600 mb-4">
                  <div className="py-2">Sun</div><div className="py-2">Mon</div><div className="py-2">Tue</div><div className="py-2">Wed</div>
                  <div className="py-2">Thu</div><div className="py-2">Fri</div><div className="py-2">Sat</div>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={i} className="h-16"></div>
                  ))}

                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const holiday = getHolidayForDate(day);
                    const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

                    return (
                      <div
                        key={day}
                        className={`h-16 p-2 border border-black rounded-lg relative transition-all duration-200 ${
                          holiday 
                            ? "bg-gray-100 hover:bg-gray-200 shadow-sm" 
                            : isToday
                            ? "bg-gray-200 shadow-md"
                            : "bg-white hover:bg-gray-50"
                        }`}
                      >
                        <span className={`text-sm font-semibold ${
                          isToday ? "text-gray-900" : holiday ? "text-gray-800" : "text-gray-600"
                        }`}>
                          {day}
                        </span>
                        {holiday && (
                          <>
                            <div className="absolute top-1 right-1 w-2 h-2 bg-gray-600 rounded-full"></div>
                            <p className="text-xs text-gray-700 mt-1 font-medium truncate leading-tight">
                              {holiday.name}
                            </p>
                          </>
                        )}
                        {isToday && !holiday && (
                          <div className="absolute top-1 right-1 w-2 h-2 bg-gray-800 rounded-full"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Document Alerts Modal */}
      {showDocumentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-black max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Bell className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Document Alerts</h2>
                  <p className="text-sm text-gray-600">
                    {licenseAlerts.length + documentAlerts.length} alerts requiring attention
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDocumentModal(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Medical License Alerts */}
              {licenseAlerts.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                    <h3 className="text-lg font-bold text-gray-900">Medical Licenses</h3>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                      {licenseAlerts.length} alerts
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {licenseAlerts.map((alert, index) => (
                      <div key={`license-${index}`} className={`p-4 rounded-lg border-2 ${
                        alert.alert_level === 'critical' 
                          ? 'bg-red-50 border-red-300 shadow-red-100' 
                          : 'bg-yellow-50 border-yellow-300 shadow-yellow-100'
                      } shadow-lg`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="text-base font-bold text-gray-900">{alert.license_type}</h4>
                              <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                                alert.alert_level === 'critical' 
                                  ? 'bg-red-200 text-red-800' 
                                  : 'bg-yellow-200 text-yellow-800'
                              }`}>
                                {alert.alert_level === 'critical' ? 'CRITICAL' : 'WARNING'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mb-1">
                              <span className="font-medium">Employee ID:</span> {alert.employee_id}
                            </p>
                            {alert.expiry_date && (
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">Expires:</span> {new Date(alert.expiry_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${
                              alert.alert_level === 'critical' ? 'text-red-700' : 'text-yellow-700'
                            }`}>
                              {alert.days_until_expiry <= 0 ? 'EXPIRED' : `${alert.days_until_expiry} days`}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {alert.days_until_expiry <= 0 ? 'Action Required' : 'Until Expiry'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ID Document Alerts */}
              {documentAlerts.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <h3 className="text-lg font-bold text-gray-900">ID Documents</h3>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                      {documentAlerts.length} alerts
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {documentAlerts.map((alert, index) => (
                      <div key={`doc-${index}`} className={`p-4 rounded-lg border-2 ${
                        alert.alert_level === 'critical' 
                          ? 'bg-red-50 border-red-300 shadow-red-100' 
                          : 'bg-yellow-50 border-yellow-300 shadow-yellow-100'
                      } shadow-lg`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="text-base font-bold text-gray-900">{alert.document_type}</h4>
                              <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                                alert.alert_level === 'critical' 
                                  ? 'bg-red-200 text-red-800' 
                                  : 'bg-yellow-200 text-yellow-800'
                              }`}>
                                {alert.alert_level === 'critical' ? 'CRITICAL' : 'WARNING'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mb-1">
                              <span className="font-medium">Employee:</span> {alert.employee_name}
                              {alert.employee_code && ` - ${alert.employee_code}`}
                            </p>
                            {alert.expiry_date && (
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">Expires:</span> {new Date(alert.expiry_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${
                              alert.alert_level === 'critical' ? 'text-red-700' : 'text-yellow-700'
                            }`}>
                              {alert.days_until_expiry <= 0 ? 'EXPIRED' : `${alert.days_until_expiry} days`}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {alert.days_until_expiry <= 0 ? 'Action Required' : 'Until Expiry'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Alerts State */}
              {licenseAlerts.length === 0 && documentAlerts.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">All Documents Up to Date</h3>
                  <p className="text-gray-600">No document alerts at this time. All licenses and documents are current.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                Last updated: {new Date().toLocaleString()}
              </div>
              <button
                onClick={() => setShowDocumentModal(false)}
                className="text-white px-6 py-2 rounded-lg transition-colors duration-200 font-medium border border-black shadow-md"
                style={{ backgroundColor: 'var(--secondary-color, #474e71)' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--secondary-hover, #3a3f5c)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--secondary-color, #474e71)'}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
