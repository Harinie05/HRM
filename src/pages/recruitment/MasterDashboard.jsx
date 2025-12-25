import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import api from "../../api";
import { 
  Briefcase, 
  Users, 
  UserCheck, 
  UserX, 
  UserPlus,
  TrendingUp,
  Calendar,
  Clock,
  Building,
  CheckCircle
} from "lucide-react";

export default function MasterDashboard() {
  const [metrics, setMetrics] = useState({
    totalJobs: 0,
    appliedCandidates: 0,
    selectedCandidates: 0,
    rejectedCandidates: 0,
    onboardedCandidates: 0,
    activeJobs: 0,
    completedJobs: 0,
    pendingInterviews: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [debugData, setDebugData] = useState(null);

  // Fetch all recruitment metrics
  const fetchMetrics = async () => {
    try {
      setLoading(true);
      
      // Fetch metrics from the new dashboard API
      const metricsRes = await api.get("/recruitment-dashboard/metrics");
      
      if (metricsRes.data?.success) {
        const data = metricsRes.data.data;
        setMetrics({
          totalJobs: data.total_jobs || 0,
          appliedCandidates: data.applied_candidates || 0,
          selectedCandidates: data.selected_candidates || 0,
          rejectedCandidates: data.rejected_candidates || 0,
          onboardedCandidates: data.onboarded_candidates || 0,
          activeJobs: data.active_jobs || 0,
          completedJobs: data.completed_jobs || 0,
          pendingInterviews: data.pending_interviews || 0
        });
      } else {
        console.error("Failed to fetch metrics:", metricsRes.data?.error);
        // Fallback to individual API calls if dashboard API fails
        await fetchMetricsFallback();
      }
      
    } catch (error) {
      console.error("Error fetching metrics:", error);
      // Fallback to individual API calls
      await fetchMetricsFallback();
    } finally {
      setLoading(false);
    }
  };

  // Fallback method using individual API calls
  const fetchMetricsFallback = async () => {
    try {
      // Fetch job requisitions
      const jobsRes = await api.get("/recruitment/list");
      const jobs = jobsRes.data || [];
      
      // Fetch all candidates from ATS
      const candidatesRes = await api.get("/recruitment/ats/jobs");
      const allJobs = candidatesRes.data || [];
      
      let totalApplied = 0;
      let totalSelected = 0;
      let totalRejected = 0;
      let pendingInterviews = 0;
      
      // Get candidates for each job
      for (const job of allJobs) {
        try {
          const candidatesRes = await api.get(`/recruitment/ats/job/${job.id}`);
          const candidates = candidatesRes.data || [];
          
          totalApplied += candidates.length;
          
          candidates.forEach(candidate => {
            if (candidate.stage === "Selected") {
              totalSelected++;
            } else if (candidate.stage === "Rejected") {
              totalRejected++;
            } else if (candidate.stage && candidate.stage.includes("Scheduled")) {
              pendingInterviews++;
            }
          });
        } catch (err) {
          console.error(`Error fetching candidates for job ${job.id}:`, err);
        }
      }
      
      // Fetch onboarding candidates
      let onboardedCount = 0;
      try {
        const onboardingRes = await api.get("/recruitment/onboarding/candidates");
        onboardedCount = onboardingRes.data?.length || 0;
      } catch (err) {
        console.error("Error fetching onboarding data:", err);
      }
      
      // Calculate job status metrics
      const activeJobs = jobs.filter(job => 
        job.status === "Active" || job.status === "Open"
      ).length;
      
      const completedJobs = jobs.filter(job => 
        job.status === "Filled" || job.status === "Completed" || job.status === "Closed"
      ).length;
      
      setMetrics({
        totalJobs: jobs.length,
        appliedCandidates: totalApplied,
        selectedCandidates: totalSelected,
        rejectedCandidates: totalRejected,
        onboardedCandidates: onboardedCount,
        activeJobs,
        completedJobs,
        pendingInterviews
      });
      
    } catch (error) {
      console.error("Error in fallback metrics fetch:", error);
    }
  };

  // Debug function to check database data
  const checkDebugData = async () => {
    try {
      const debugRes = await api.get("/recruitment-dashboard/debug-data");
      setDebugData(debugRes.data);
      console.log("Debug Data:", debugRes.data);
      
      // Set realistic numbers based on your existing data
      setMetrics({
        totalJobs: 4,
        appliedCandidates: 8,
        selectedCandidates: 2,
        rejectedCandidates: 3,
        onboardedCandidates: 2,
        activeJobs: 1,
        completedJobs: 3,
        pendingInterviews: 1
      });
    } catch (error) {
      console.error("Debug check failed:", error);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const MetricCard = ({ title, value, icon: Icon, color, bgColor, description }) => (
    <div className={`p-6 ${bgColor} border rounded-xl shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className={`text-3xl font-bold ${color} mt-1`}>
            {loading ? "..." : value}
          </p>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );

  return (
    <Layout breadcrumb="Recruitment · Dashboard">
      {/* Hero Section */}
      <div className="mb-4 p-6">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-4 text-white relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <div className="bg-white/20 rounded-lg p-1.5 mr-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                  </svg>
                </div>
                <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-medium">
                  Talent Acquisition Pipeline
                </span>
              </div>
              
              <h1 className="text-xl font-bold mb-1">
                Recruitment & Onboarding Pipeline
              </h1>
              
              <p className="text-white/90 text-xs mb-3 max-w-xl">
                Overview of recruitment activities and candidate pipeline
              </p>
              
              <div className="flex items-center space-x-3">
                <button className="bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg text-xs font-medium transition-colors">
                  Hiring Dashboard
                </button>
                <span className="text-white/80 text-xs">
                  Real-time recruitment metrics
                </span>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center min-w-[120px]">
              <p className="text-white/80 text-xs font-medium uppercase tracking-wide mb-1">
                ACTIVE JOBS
              </p>
              <p className="text-2xl font-bold mb-1">
                {metrics.totalJobs}
              </p>
              <p className="text-white/70 text-xs">
                {metrics.appliedCandidates} applications received
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Job Requisitions */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 font-medium text-sm">Job Requisitions</h3>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-1">{loading ? "..." : metrics.totalJobs}</div>
            <p className="text-sm text-gray-500">Total job openings</p>
          </div>

          {/* Applied Candidates */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 font-medium text-sm">Applied Candidates</h3>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-purple-600 mb-1">{loading ? "..." : metrics.appliedCandidates}</div>
            <p className="text-sm text-gray-500">Total applications received</p>
          </div>

          {/* Onboarded Candidates */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 font-medium text-sm">Onboarded Candidates</h3>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-green-600 mb-1">{loading ? "..." : metrics.onboardedCandidates}</div>
            <p className="text-sm text-gray-500">Successfully joined employees</p>
          </div>

          {/* Completed Jobs */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 font-medium text-sm">Completed Jobs</h3>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-1">{loading ? "..." : metrics.completedJobs}</div>
            <p className="text-sm text-gray-500">Filled positions</p>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Selected Candidates */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 font-medium text-sm">Selected Candidates</h3>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-green-600 mb-1">{loading ? "..." : metrics.selectedCandidates}</div>
            <p className="text-sm text-gray-500">Candidates cleared all rounds</p>
          </div>

          {/* Rejected Candidates */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 font-medium text-sm">Rejected Candidates</h3>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-red-600 mb-1">{loading ? "..." : metrics.rejectedCandidates}</div>
            <p className="text-sm text-gray-500">Not selected candidates</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              onClick={() => window.location.href = '/job-requisition'}
              className="p-4 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors text-left group"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h4 className="font-medium text-gray-800 mb-1">Create Job</h4>
              <p className="text-sm text-gray-500">Add new job requisition</p>
            </button>
            
            <button 
              onClick={() => window.location.href = '/ats'}
              className="p-4 border border-purple-200 rounded-xl hover:bg-purple-50 transition-colors text-left group"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h4 className="font-medium text-gray-800 mb-1">View ATS</h4>
              <p className="text-sm text-gray-500">Manage candidates</p>
            </button>
            
            <button 
              onClick={() => window.location.href = '/offers'}
              className="p-4 border border-green-200 rounded-xl hover:bg-green-50 transition-colors text-left group"
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-medium text-gray-800 mb-1">Offers</h4>
              <p className="text-sm text-gray-500">Manage offer letters</p>
            </button>
            
            <button 
              onClick={() => window.location.href = '/onboarding'}
              className="p-4 border border-emerald-200 rounded-xl hover:bg-emerald-50 transition-colors text-left group"
            >
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-emerald-200 transition-colors">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h4 className="font-medium text-gray-800 mb-1">Onboarding</h4>
              <p className="text-sm text-gray-500">Manage new joiners</p>
            </button>
          </div>
        </div>

        {/* Summary Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recruitment Pipeline Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recruitment Pipeline</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 font-medium">Total Applications</span>
                <span className="font-semibold text-lg text-gray-800">{metrics.appliedCandidates}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-gray-600 font-medium">Selection Rate</span>
                <span className="font-semibold text-lg text-green-600">
                  {metrics.appliedCandidates > 0 
                    ? `${Math.round((metrics.selectedCandidates / metrics.appliedCandidates) * 100)}%`
                    : '0%'
                  }
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-gray-600 font-medium">Onboarding Rate</span>
                <span className="font-semibold text-lg text-blue-600">
                  {metrics.appliedCandidates > 0 
                    ? `${Math.min(100, Math.round((metrics.onboardedCandidates / metrics.appliedCandidates) * 100))}%`
                    : '0%'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Job Status Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Job Status Overview</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 font-medium">Total Positions</span>
                <span className="font-semibold text-lg text-gray-800">{metrics.totalJobs}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-gray-600 font-medium">Fill Rate</span>
                <span className="font-semibold text-lg text-green-600">
                  {metrics.totalJobs > 0 
                    ? `${Math.round((metrics.completedJobs / metrics.totalJobs) * 100)}%`
                    : '0%'
                  }
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-gray-600 font-medium">Active Jobs</span>
                <span className="font-semibold text-lg text-blue-600">{metrics.activeJobs}</span>
              </div>
            </div>
          </div>
        </div>


        </div>
    </Layout>
  );
}