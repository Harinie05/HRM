import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { 
  Users, Building2, UserCheck, TrendingUp, TrendingDown, Calendar, AlertTriangle, 
  CheckCircle, Clock, BarChart3, Target, Award, GraduationCap, DollarSign, 
  FileText, UserPlus, Settings, Shield, Activity, Briefcase, PieChart,
  ArrowRight, Star, Zap, Globe
} from "lucide-react";
import api from "../api";

export default function Dashboard() {
  const [holidays, setHolidays] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalEmployees: 0,
    totalDepartments: 0,
    totalRoles: 0
  });

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
    currentMonth: 2.3,
    lastMonth: 1.8,
    yearToDate: 12.5,
    trend: "up"
  };

  const complianceData = {
    totalCompliant: Math.floor(dashboardData.totalEmployees * 0.92),
    pendingDocuments: Math.floor(dashboardData.totalEmployees * 0.05),
    expiringSoon: Math.floor(dashboardData.totalEmployees * 0.03),
    complianceRate: 92
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
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-xl sm:rounded-2xl shadow-2xl p-6 sm:p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <div className="p-3 sm:p-4 bg-white/10 rounded-xl sm:rounded-2xl backdrop-blur-sm flex-shrink-0">
                  <Building2 className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">Healthcare HRM Suite</h1>
                  <p className="text-slate-300 text-base sm:text-lg">Complete Human Resource Management Solution</p>
                  <p className="text-slate-400 text-sm mt-1">Empowering Healthcare Organizations with Smart HR Technology</p>
                </div>
              </div>
              <div className="text-left lg:text-right">
                <div className="flex items-center gap-2 text-slate-300 mb-2">
                  <Globe className="h-4 w-4" />
                  <span className="text-sm">NABH-Standard Compliant</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold">{today.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'short', 
                  day: 'numeric' 
                })}</p>
                <p className="text-slate-400 text-sm">{today.getFullYear()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 sm:p-6 border border-blue-200 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-blue-600 text-xs sm:text-sm font-semibold uppercase tracking-wide">Total Employees</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-800 mt-2">{dashboardData.totalEmployees}</p>
                <p className="text-blue-600 text-xs mt-1">Active workforce</p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-200 rounded-xl flex-shrink-0">
                <Users className="h-5 w-5 sm:h-7 sm:w-7 text-blue-700" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 sm:p-6 border border-emerald-200 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-emerald-600 text-xs sm:text-sm font-semibold uppercase tracking-wide">Departments</p>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-800 mt-2">{dashboardData.totalDepartments}</p>
                <p className="text-emerald-600 text-xs mt-1">Organizational units</p>
              </div>
              <div className="p-2 sm:p-3 bg-emerald-200 rounded-xl flex-shrink-0">
                <Building2 className="h-5 w-5 sm:h-7 sm:w-7 text-emerald-700" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 sm:p-6 border border-indigo-200 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-indigo-600 text-xs sm:text-sm font-semibold uppercase tracking-wide">Active Roles</p>
                <p className="text-2xl sm:text-3xl font-bold text-indigo-800 mt-2">{dashboardData.totalRoles}</p>
                <p className="text-indigo-600 text-xs mt-1">Defined positions</p>
              </div>
              <div className="p-2 sm:p-3 bg-indigo-200 rounded-xl flex-shrink-0">
                <UserCheck className="h-5 w-5 sm:h-7 sm:w-7 text-indigo-700" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 sm:p-6 border border-amber-200 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-amber-600 text-xs sm:text-sm font-semibold uppercase tracking-wide">Compliance Rate</p>
                <p className="text-2xl sm:text-3xl font-bold text-amber-800 mt-2">{complianceData.complianceRate}%</p>
                <p className="text-amber-600 text-xs mt-1">NABH compliant</p>
              </div>
              <div className="p-2 sm:p-3 bg-amber-200 rounded-xl flex-shrink-0">
                <Shield className="h-5 w-5 sm:h-7 sm:w-7 text-amber-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Attrition Analysis */}
          <div className="rounded-xl shadow-sm border p-4 sm:p-6" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-bold text-primary">Attrition Analysis</h3>
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-muted" />
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                <div>
                  <p className="text-sm text-red-600 font-medium">Current Month</p>
                  <p className="text-xl sm:text-2xl font-bold text-red-700">{attritionData.currentMonth}%</p>
                </div>
                <div className="flex items-center text-red-600">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span className="text-sm">+0.5%</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-content rounded-lg">
                  <p className="text-xs text-secondary">Last Month</p>
                  <p className="text-base sm:text-lg font-semibold text-primary">{attritionData.lastMonth}%</p>
                </div>
                <div className="p-3 bg-content rounded-lg">
                  <p className="text-xs text-secondary">Year to Date</p>
                  <p className="text-base sm:text-lg font-semibold text-primary">{attritionData.yearToDate}%</p>
                </div>
              </div>
              
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 font-medium">Industry Benchmark: 15-20%</p>
                <p className="text-xs text-blue-600 mt-1">Your organization is performing well below industry average</p>
              </div>
            </div>
          </div>

          {/* Manpower Compliance */}
          <div className="rounded-xl shadow-sm border p-4 sm:p-6" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-bold text-primary">Manpower Compliance</h3>
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-muted" />
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Compliant Employees</p>
                    <p className="text-xs text-green-600">{complianceData.complianceRate}% of workforce</p>
                  </div>
                </div>
                <p className="text-lg sm:text-xl font-bold text-green-700">{complianceData.totalCompliant}</p>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-yellow-600 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Pending Documents</p>
                    <p className="text-xs text-yellow-600">Require immediate attention</p>
                  </div>
                </div>
                <p className="text-lg sm:text-xl font-bold text-yellow-700">{complianceData.pendingDocuments}</p>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Expiring Soon</p>
                    <p className="text-xs text-red-600">Within next 30 days</p>
                  </div>
                </div>
                <p className="text-lg sm:text-xl font-bold text-red-700">{complianceData.expiringSoon}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Product Overview */}
        <div className="rounded-2xl shadow-xl border border-gray-100 overflow-hidden" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
          <div className="p-8 border-b  bg-gradient-to-r from-slate-50 to-blue-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-primary mb-2">Complete HRM Module Suite</h2>
                <p className="" style={{color: 'var(--text-secondary, #374151)'}}>Comprehensive human resource management modules designed for healthcare organizations</p>
              </div>
              <div className="flex items-center gap-2 text-green-600">
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
                  <div key={index} className={`bg-gradient-to-br ${getColorClasses(module.color)} rounded-xl p-6 border hover:shadow-lg transition-all duration-300 group`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 bg-white/80 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold">{module.title}</h3>
                          <p className="text-sm opacity-80 mt-1">{module.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 mb-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs font-medium">{module.status}</span>
                        </div>
                        <div className="text-sm font-bold">{module.usage}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Key Features</p>
                      <div className="grid grid-cols-2 gap-2">
                        {module.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-3 w-3 opacity-60" />
                            <span>{feature}</span>
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
        <div className="rounded-xl shadow-sm border overflow-hidden" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
          <div className="p-6 border-b  bg-gradient-to-r from-gray-50 to-slate-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-200 rounded-xl">
                  <Calendar className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-primary">Holiday Gallery</h3>
                  <p className=" text-sm" style={{color: 'var(--text-secondary, #374151)'}}>Upcoming holidays and company events</p>
                </div>
              </div>
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="bg-slate-600 text-white px-4 py-2 rounded-xl hover:bg-slate-700 transition-colors duration-200 text-sm font-medium"
              >
                {showCalendar ? 'Hide Calendar' : 'View Calendar'}
              </button>
            </div>
          </div>

          {/* Upcoming Holidays Preview */}
          <div className="p-6">
            <h4 className="font-semibold text-primary mb-4">Upcoming Holidays</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {upcomingHolidays.length > 0 ? (
                upcomingHolidays.map((holiday, index) => (
                  <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-blue-900">{holiday.name}</p>
                        <p className="text-sm text-blue-600">
                          {new Date(holiday.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-8 text-muted">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No upcoming holidays found</p>
                </div>
              )}
            </div>
          </div>

          {/* Calendar View */}
          {showCalendar && (
            <div className="p-6 border-t  bg-content">
              <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
                <div className="flex justify-between items-center mb-6">
                  <button 
                    onClick={prevMonth} 
                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
                  >
                    ‹ Previous
                  </button>
                  <h2 className="text-xl font-bold text-primary">
                    {new Date(year, month).toLocaleString("en-US", { month: "long" })} {year}
                  </h2>
                  <button 
                    onClick={nextMonth} 
                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
                  >
                    Next ›
                  </button>
                </div>

                <div className="grid grid-cols-7 text-center font-semibold text-secondary mb-4">
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
                        className={`h-16 p-2 border rounded-lg relative transition-all duration-200 ${
                          holiday 
                            ? "bg-blue-50 border-blue-300 hover:bg-blue-100" 
                            : isToday
                            ? "bg-slate-100 border-slate-300"
                            : "bg-white  hover:bg-content"
                        }`}
                      >
                        <span className={`text-sm font-semibold ${
                          isToday ? "text-slate-700" : holiday ? "text-blue-700" : "text-secondary"
                        }`}>
                          {day}
                        </span>
                        {holiday && (
                          <>
                            <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                            <p className="text-xs text-blue-600 mt-1 font-medium truncate leading-tight">
                              {holiday.name}
                            </p>
                          </>
                        )}
                        {isToday && !holiday && (
                          <div className="absolute top-1 right-1 w-2 h-2 bg-slate-500 rounded-full"></div>
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
    </Layout>
  );
}
