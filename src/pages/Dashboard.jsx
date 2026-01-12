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
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border border-gray-200 shadow-sm p-6" style={{
          background: `linear-gradient(to right, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10, ${getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}10)`
        }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <Building2 className="h-6 w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Healthcare HRM Suite</h1>
                <p className="text-gray-600 text-sm mb-1">Complete Human Resource Management Solution</p>
                <p className="text-gray-500 text-xs">Empowering Healthcare Organizations with Smart HR Technology</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Globe className="h-3 w-3" />
                  <span className="text-xs font-medium">Compliance</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">NABH Standard</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Calendar className="h-3 w-3" />
                  <span className="text-xs font-medium">Date</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{today.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.totalEmployees}</p>
                <p className="text-gray-400 text-xs mt-1">Active workforce</p>
              </div>
              <div className="p-3 rounded-lg" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <Users className="h-6 w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Departments</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.totalDepartments}</p>
                <p className="text-gray-400 text-xs mt-1">Organizational units</p>
              </div>
              <div className="p-3 rounded-lg" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <Building2 className="h-6 w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Active Roles</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.totalRoles}</p>
                <p className="text-gray-400 text-xs mt-1">Defined positions</p>
              </div>
              <div className="p-3 rounded-lg" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <UserCheck className="h-6 w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">System Status</p>
                <p className="text-2xl font-bold text-green-600">Operational</p>
                <p className="text-gray-400 text-xs mt-1">All systems running</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <Shield className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Audit Logs Summary */}
          {hasPermission("view_audit_log") && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{
                    backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
                  }}>
                    <Database className="h-5 w-5" style={{
                      color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                    }} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Audit Logs</h3>
                </div>
              </div>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="rounded-lg p-4" style={{
                background: `linear-gradient(to right, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10, ${getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}10)`
              }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Logs</p>
                    <p className="text-2xl font-bold text-gray-900">{auditSummary.total_logs}</p>
                    <p className="text-xs text-gray-500">All time</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg p-3 border" style={{
                  backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10`,
                  borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}30`
                }}>
                  <p className="text-xs font-medium mb-1" style={{
                    color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                  }}>Recent Activity</p>
                  <p className="text-lg font-bold" style={{
                    color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                  }}>{auditSummary.recent_activity}</p>
                  <p className="text-xs" style={{
                    color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                  }}>Last 7 days</p>
                </div>
                <div className="rounded-lg p-3 border" style={{
                  backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10`,
                  borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}30`
                }}>
                  <p className="text-xs font-medium mb-1" style={{
                    color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                  }}>Active Users</p>
                  <p className="text-lg font-bold" style={{
                    color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                  }}>{auditSummary.active_users_24h}</p>
                  <p className="text-xs" style={{
                    color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                  }}>Last 24 hours</p>
                </div>
              </div>
              
              {auditSummary.top_actions.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-sm text-gray-700 font-medium mb-2">Top Actions</p>
                  <div className="space-y-2">
                    {auditSummary.top_actions.slice(0, 3).map((action, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">{action.action}</span>
                        <span className="text-xs font-semibold text-gray-900 bg-white px-2 py-1 rounded">{action.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <button
                onClick={viewAuditLogs}
                className="w-full text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }}
                onMouseEnter={(e) => {
                  const hoverColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                  e.target.style.backgroundColor = hoverColor;
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5';
                }}
              >
                <Eye className="h-4 w-4" />
                View All Audit Logs
              </button>
            </div>
          </div>
          )}

          {/* Document Alerts */}
          {hasPermission("view_documents_alerts") && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Bell className="h-5 w-5 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Document Alerts</h3>
                </div>
                {(licenseAlerts.length + documentAlerts.length) > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2.5 py-1 rounded-full font-semibold">
                    {licenseAlerts.length + documentAlerts.length}
                  </span>
                )}
              </div>
            </div>
            
            <div className="p-5">
              {(licenseAlerts.length + documentAlerts.length) > 0 ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    {[...licenseAlerts, ...documentAlerts].slice(0, 5).map((alert, index) => (
                      <div key={index} className={`p-3 rounded-lg border-l-4 ${
                        alert.alert_level === 'critical' 
                          ? 'bg-red-50 border-l-red-500 border-red-100' 
                          : 'bg-yellow-50 border-l-yellow-500 border-yellow-100'
                      }`}>
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {alert.document_type || alert.license_type}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {alert.employee_name || `Employee ${alert.employee_id}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${
                              alert.alert_level === 'critical' ? 'text-red-700' : 'text-yellow-700'
                            }`}>
                              {alert.days_until_expiry <= 0 ? 'EXPIRED' : `${alert.days_until_expiry}d`}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {(licenseAlerts.length + documentAlerts.length) > 5 && (
                    <p className="text-sm text-gray-600 text-center py-2">
                      +{(licenseAlerts.length + documentAlerts.length) - 5} more alerts
                    </p>
                  )}
                  
                  <button
                    onClick={() => setShowDocumentModal(true)}
                    className="w-full text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                    }}
                    onMouseEnter={(e) => {
                      const hoverColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                      e.target.style.backgroundColor = hoverColor;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5';
                    }}
                  >
                    <Bell className="h-4 w-4" />
                    View All Alerts
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">All Documents Current</h4>
                  <p className="text-sm text-gray-600">No alerts at this time</p>
                </div>
              )}
            </div>
          </div>
          )}
        </div>

        {/* Product Overview */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100" style={{
            background: `linear-gradient(135deg, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}05, ${getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}05)`
          }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl" style={{
                  backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
                }}>
                  <Activity className="h-6 w-6" style={{
                    color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                  }} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete HRM Module Suite</h2>
                  <p className="text-gray-600">Comprehensive human resource management modules designed for healthcare organizations</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10`,
                color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
              }}>
                <div className="w-2 h-2 rounded-full" style={{
                  backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }}></div>
                <span className="font-semibold text-sm">All Systems Operational</span>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {hrmModules.map((module, index) => {
                const IconComponent = module.icon;
                const isEven = index % 2 === 0;
                return (
                  <div key={index} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl transition-all duration-300" style={{
                          backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}15`
                        }}>
                          <IconComponent className="h-6 w-6" style={{
                            color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                          }} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{module.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full" style={{
                            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                          }}></div>
                          <span className="text-xs font-medium text-gray-700">{module.status}</span>
                        </div>
                        <div className="text-sm font-bold" style={{
                          color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                        }}>{module.usage}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Key Features</p>
                      <div className="grid grid-cols-2 gap-2">
                        {module.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-3 w-3" style={{
                              color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                            }} />
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
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100" style={{
            background: `linear-gradient(135deg, ${getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}05, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}05)`
          }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl" style={{
                  backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
                }}>
                  <Calendar className="h-6 w-6" style={{
                    color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                  }} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Holiday Gallery</h3>
                  <p className="text-sm text-gray-600">Upcoming holidays and company events</p>
                </div>
              </div>
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium flex items-center gap-2"
                style={{
                  backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }}
                onMouseEnter={(e) => {
                  const hoverColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                  e.target.style.backgroundColor = hoverColor;
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5';
                }}
              >
                <Calendar className="h-4 w-4" />
                {showCalendar ? 'Hide Calendar' : 'View Calendar'}
              </button>
            </div>
          </div>

          {/* Upcoming Holidays Preview */}
          <div className="p-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-1 h-5 rounded" style={{
                backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
              }}></div>
              Upcoming Holidays
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {upcomingHolidays.length > 0 ? (
                upcomingHolidays.map((holiday, index) => (
                  <div key={index} className="p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200" style={{
                    background: `linear-gradient(135deg, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}05, ${getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}05)`
                  }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{holiday.name}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(holiday.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="w-3 h-3 rounded-full" style={{
                        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                      }}></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{
                    backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10`
                  }}>
                    <Calendar className="h-8 w-8" style={{
                      color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                    }} />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">No Upcoming Holidays</h4>
                  <p className="text-gray-600">Check back later for holiday updates</p>
                </div>
              )}
            </div>
          </div>

          {/* Calendar View */}
          {showCalendar && (
            <div className="p-6 border-t border-gray-100" style={{
              background: `linear-gradient(135deg, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}02, ${getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}02)`
            }}>
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <button 
                    onClick={prevMonth} 
                    className="px-4 py-2 text-white rounded-lg transition-colors duration-200 font-medium flex items-center gap-2"
                    style={{
                      backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                    }}
                    onMouseEnter={(e) => {
                      const hoverColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                      e.target.style.backgroundColor = hoverColor;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5';
                    }}
                  >
                    ‹ Previous
                  </button>
                  <h2 className="text-xl font-bold text-gray-900">
                    {new Date(year, month).toLocaleString("en-US", { month: "long" })} {year}
                  </h2>
                  <button 
                    onClick={nextMonth} 
                    className="px-4 py-2 text-white rounded-lg transition-colors duration-200 font-medium flex items-center gap-2"
                    style={{
                      backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                    }}
                    onMouseEnter={(e) => {
                      const hoverColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                      e.target.style.backgroundColor = hoverColor;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5';
                    }}
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
                        className={`h-16 p-2 border border-gray-200 rounded-lg relative transition-all duration-200 ${
                          holiday 
                            ? "hover:shadow-md" 
                            : isToday
                            ? "shadow-md"
                            : "bg-white hover:bg-gray-50"
                        }`}
                        style={{
                          backgroundColor: holiday 
                            ? `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10`
                            : isToday
                            ? `${getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}15`
                            : 'white'
                        }}
                      >
                        <span className={`text-sm font-semibold ${
                          isToday ? "text-gray-900" : holiday ? "text-gray-800" : "text-gray-600"
                        }`}>
                          {day}
                        </span>
                        {holiday && (
                          <>
                            <div className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{
                              backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                            }}></div>
                            <p className="text-xs text-gray-700 mt-1 font-medium truncate leading-tight">
                              {holiday.name}
                            </p>
                          </>
                        )}
                        {isToday && !holiday && (
                          <div className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{
                            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                          }}></div>
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
