import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiEye, FiUsers, FiLink, FiPlay, FiPause, FiSearch, FiFilter } from 'react-icons/fi';
import Layout from '../../components/Layout';
import Toast from '../../components/Toast';
import useToast from '../../utils/useToast';
import api from '../../api';
import { hasPermission } from '../../utils/permissions';

export default function Recruitment() {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [generatedLinks, setGeneratedLinks] = useState({});
  const { toast, showToast, hideToast } = useToast();
  const [filters, setFilters] = useState({
    department: "",
    status: "",
    jobType: ""
  });
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState("create"); // create | edit | view
  const [selectedJob, setSelectedJob] = useState(null);
  const [employeeCode, setEmployeeCode] = useState(null);
  const [openLinkMenu, setOpenLinkMenu] = useState(null);

  // Check permissions
  const canViewJobs = hasPermission('view_job_requisition');
  const canViewCandidates = hasPermission('view_candidates');
  const canGenerateLinks = hasPermission('generate_job_link');
  const canPublishJobs = hasPermission('publish_job');

  // Debug permissions
  console.log('Permission Debug:', {
    canViewJobs,
    canViewCandidates,
    canGenerateLinks,
    canPublishJobs,
    isAdmin: localStorage.getItem('login_type') === 'admin' || localStorage.getItem('is_admin') === 'true',
    permissions: JSON.parse(localStorage.getItem('permissions') || '[]')
  });

  if (!canViewJobs) {
    return (
      <Layout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Access Denied</h2>
            <p className="text-red-600">You don't have permission to view job requisitions.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const fetchMyProfile = async () => {
    try {
      // Get tenant_db from localStorage
      const tenantDb = localStorage.getItem("tenant_db");
      if (!tenantDb) {
        console.error("No tenant_db found");
        return;
      }
      
      // Get current user's email from token or localStorage
      const userEmail = localStorage.getItem("user_email") || "";
      
      // Try users table first (system users with employee_code)
      try {
        const res = await api.get(`/hospitals/users/${tenantDb}/list`);
        const currentUser = res.data.users?.find(user => user.email === userEmail);
        
        if (currentUser?.employee_code) {
          setEmployeeCode(currentUser.employee_code);
          return;
        }
      } catch (err) {
        console.log("User not found in users table");
      }
      
      // Try onboarding table for onboarded employees
      try {
        const onboardingRes = await api.get("/recruitment/onboarding/list");
        const onboardedEmployee = onboardingRes.data?.find(emp => 
          emp.candidate_name && emp.employee_id && 
          (emp.email === userEmail || emp.candidate_name.toLowerCase().includes(userEmail.split('@')[0]))
        );
        
        if (onboardedEmployee?.employee_id) {
          setEmployeeCode(onboardedEmployee.employee_id);
          return;
        }
      } catch (err) {
        console.log("Employee not found in onboarding table");
      }
    } catch (err) {
      console.error("Failed to fetch employee code", err);
    }
  };

  // ========================= FETCH JOBS =========================
  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/recruitment/list");
      console.log("Jobs fetched:", res.data);
      res.data?.forEach((job, index) => {
        console.log(`Job ${index}: status = '${job.status}', length = ${job.status?.length}`);
      });
      setJobs(res.data || []);
    } catch (err) {
      console.error("Failed to load jobs", err);
      showToast("Failed to load jobs. Please check your connection.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchMyProfile();
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (!event.target.closest('.link-dropdown')) {
        setOpenLinkMenu(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // ========================= MODALS =========================
  const openCreate = () => {
    setMode("create");
    setSelectedJob(null);
    setShowForm(true);
  };

  const openEdit = (job) => {
    setMode("edit");
    setSelectedJob(job);
    setShowForm(true);
  };

  const openView = (job) => {
    setMode("view");
    setSelectedJob(job);
    setShowForm(true);
  };

  // ========================= PUBLISH / UNPUBLISH =========================
  const togglePublish = async (job) => {
    const currentPublishStatus = job.publish_status?.trim();
    const newPublishStatus = currentPublishStatus === "Published" ? "Draft" : "Published";
    
    try {
      // Use the existing update endpoint with the full job data
      await api.put(`/recruitment/update/${job.id}`, {
        ...job,
        publish_status: newPublishStatus
      });
      
      // Update the job publish_status locally for immediate UI feedback
      setJobs(prevJobs => 
        prevJobs.map(j => 
          j.id === job.id ? { ...j, publish_status: newPublishStatus } : j
        )
      );
      
      showToast(`Job ${newPublishStatus === 'Published' ? 'published' : 'unpublished'} successfully!`);
    } catch (err) {
      console.error("Failed to update job publish status", err);
      showToast(`Failed to update job publish status: ${err.message || 'Unknown error'}`, 'error');
    }
  };

  // ========================= DELETE JOB =========================
  const deleteJob = async (job) => {
    if (!confirm(`Are you sure you want to delete "${job.title}"?`)) return;
    
    try {
      await api.delete(`/recruitment/delete/${job.id}`);
      fetchJobs();
      showToast("Job deleted successfully!");
    } catch (err) {
      console.error("Failed to delete job", err);
      showToast("Failed to delete job", 'error');
    }
  };

  // ========================= FILTER JOBS =========================
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = job.title.toLowerCase().includes(search.toLowerCase()) ||
                         job.department.toLowerCase().includes(search.toLowerCase());
    const matchesDepartment = !filters.department || job.department === filters.department;
    const matchesStatus = !filters.status || job.status === filters.status;
    const matchesJobType = !filters.jobType || job.job_type === filters.jobType;
    
    return matchesSearch && matchesDepartment && matchesStatus && matchesJobType;
  });

  // Get unique values for filters
  const departments = [...new Set(jobs.map(job => job.department).filter(Boolean))];
  const jobTypes = [...new Set(jobs.map(job => job.job_type).filter(Boolean))];

  const clearFilters = () => {
    setFilters({ department: "", status: "", jobType: "" });
    setSearch("");
  };

  // ========================================================================
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
                <FiUsers className="w-6 h-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Recruitment Setup</h1>
                <p className="text-gray-600 text-sm mb-1">Manage job postings and recruitment process</p>
                <p className="text-gray-500 text-xs">{jobs.length} Active Jobs • Real-time Updates</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <FiPlay className="h-3 w-3" />
                  <span className="text-xs font-medium">Published</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{jobs.filter(j => j.publish_status?.trim() === 'Published').length}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <FiPause className="h-3 w-3" />
                  <span className="text-xs font-medium">Drafts</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{jobs.filter(j => j.publish_status?.trim() !== 'Published').length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="relative max-w-md mx-auto">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-1">
              <div className="flex items-center space-x-2 px-3 py-2">
                <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center shadow-sm">
                  <FiSearch className="w-3 h-3 text-gray-600" />
                </div>
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-gray-900 placeholder-gray-500 text-sm focus:outline-none"
                />
                <div className="flex items-center space-x-1">
                  <div className="w-px h-4 bg-gray-300"></div>
                  <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-1 rounded-md transition-colors ${
                      showFilters ? 'bg-white text-gray-600 shadow-sm' : 'hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    <FiFilter className={`w-3 h-3 transition-colors ${
                      showFilters ? 'text-gray-600' : 'text-gray-400 group-hover:text-gray-600'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
                <p className="text-gray-400 text-xs mt-1">Active positions</p>
              </div>
              <div className="p-3 rounded-lg" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <FiUsers className="h-6 w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Published</p>
                <p className="text-2xl font-bold text-gray-900">{jobs.filter(j => j.publish_status?.trim() === 'Published').length}</p>
                <p className="text-gray-400 text-xs mt-1">Live positions</p>
              </div>
              <div className="p-3 rounded-lg" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <FiPlay className="h-6 w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Drafts</p>
                <p className="text-2xl font-bold text-gray-900">{jobs.filter(j => j.publish_status?.trim() !== 'Published').length}</p>
                <p className="text-gray-400 text-xs mt-1">In preparation</p>
              </div>
              <div className="p-3 rounded-lg" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <FiPause className="h-6 w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Closed</p>
                <p className="text-2xl font-bold text-gray-900">{jobs.filter(j => j.status?.trim() === 'Inactive').length}</p>
                <p className="text-gray-400 text-xs mt-1">Completed</p>
              </div>
              <div className="p-3 rounded-lg" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <FiPause className="h-6 w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select
                value={filters.department}
                onChange={(e) => setFilters({...filters, department: e.target.value})}
                className="border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="">All Status</option>
                <option value="Draft">Draft</option>
                <option value="Posted">Published</option>
              </select>
              
              <select
                value={filters.jobType}
                onChange={(e) => setFilters({...filters, jobType: e.target.value})}
                className="border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="">All Job Types</option>
                {jobTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-white border border-gray-200 rounded-xl transition-colors"
                style={{
                  backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5';
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* JOB TABLE */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10`
              }}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{
                  borderColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }}></div>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Loading Jobs</h4>
              <p className="text-gray-600">Please wait while we fetch the latest job postings</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10`
              }}>
                <FiUsers className="w-8 h-8" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No Jobs Found</h4>
              <p className="text-gray-600 mb-4">No jobs match your current search criteria</p>
              <button
                onClick={clearFilters}
                className="text-white px-4 py-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5';
                }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
            <div className="p-6">
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Details</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Openings</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{job.title}</div>
                            <div className="text-sm text-gray-500">{job.experience_years} years experience</div>
                            {job.location && (
                              <div className="text-xs text-gray-500">{job.location}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {job.department}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-medium text-gray-900">{job.openings}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm text-gray-600">{job.job_type || 'Full-time'}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center">
                            {job.publish_status?.trim() === "Published" ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <FiPlay className="mr-1" size={10} />
                                Published
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <FiPause className="mr-1" size={10} />
                                Draft
                              </span>
                            )}
                            {job.status === "Inactive" && (
                              <span className="text-xs text-red-600 font-medium mt-1">closed</span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => openView(job)}
                              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Job"
                            >
                              <FiEye size={16} />
                            </button>

                            {hasPermission('edit_job_requisition') && (
                              <button
                                onClick={() => openEdit(job)}
                                className="p-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg transition-colors"
                                title="Edit Job"
                              >
                                <FiEdit size={16} />
                              </button>
                            )}

                            {canViewCandidates && (
                              <button
                                onClick={() => window.location.href = `/screening?job=${job.id}`}
                                className="p-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
                                title="Screen Candidates"
                              >
                                <FiUsers size={16} />
                              </button>
                            )}

                            {canGenerateLinks && (
                              <div className="relative link-dropdown">
                                <button
                                  onClick={() =>
                                    setOpenLinkMenu(openLinkMenu === job.id ? null : job.id)
                                  }
                                  className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                                  title="Job Links"
                                >
                                  <FiLink size={16} />
                                </button>

                                {openLinkMenu === job.id && (
                                  <div className="absolute right-0 mt-2 w-64 bg-white border border-black rounded-xl shadow-lg z-50">
                                    <button
                                      className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm border-b border-gray-200"
                                      onClick={() => {
                                        const publicLink = `${window.location.origin}/apply/${job.id}`;
                                        setGeneratedLinks(prev => ({
                                          ...prev,
                                          [job.id]: { ...prev[job.id], public: publicLink }
                                        }));
                                        showToast("Public job link generated");
                                      }}
                                    >
                                      🌍 Generate Public Link
                                    </button>

                                    {employeeCode && (
                                      <button
                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm"
                                        onClick={() => {
                                          const referralLink = `${window.location.origin}/apply/${job.id}?ref=${employeeCode}`;
                                          setGeneratedLinks(prev => ({
                                            ...prev,
                                            [job.id]: { ...prev[job.id], referral: referralLink }
                                          }));
                                          showToast("Referral link generated");
                                        }}
                                      >
                                        👤 Generate My Referral Link
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {canPublishJobs && (
                              <button
                                onClick={() => togglePublish(job)}
                                className={`p-2 rounded-lg transition-colors ${
                                  job.publish_status?.trim() === "Published"
                                    ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                                    : "text-green-600 hover:text-green-700 hover:bg-green-50"
                                }`}
                                title={job.publish_status?.trim() === "Published" ? "Unpublish" : "Publish"}
                              >
                                {job.publish_status?.trim() === "Published" ? <FiPause size={16} /> : <FiPlay size={16} />}
                              </button>
                            )}

                            {hasPermission('delete_job_requisition') && (
                              <button
                                onClick={() => deleteJob(job)}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Job"
                              >
                                <FiTrash2 size={16} />
                              </button>
                            )}
                          </div>
                          {generatedLinks[job.id] && (
                            <div className="mt-2 space-y-2">
                              {generatedLinks[job.id]?.public && (
                                <div>
                                  <label className="text-xs text-gray-600 font-medium">Public Link:</label>
                                  <input
                                    type="text"
                                    value={generatedLinks[job.id].public}
                                    readOnly
                                    className="w-full text-xs border p-2 rounded bg-gray-50 focus:outline-none cursor-pointer"
                                    onClick={(e) => {
                                      e.target.select();
                                      navigator.clipboard.writeText(e.target.value);
                                      showToast("Public link copied to clipboard!");
                                    }}
                                    placeholder="Public link will appear here"
                                  />
                                </div>
                              )}
                              {generatedLinks[job.id]?.referral && (
                                <div>
                                  <label className="text-xs text-gray-600 font-medium">Referral Link:</label>
                                  <input
                                    type="text"
                                    value={generatedLinks[job.id].referral}
                                    readOnly
                                    className="w-full text-xs border p-2 rounded bg-gray-50 focus:outline-none cursor-pointer"
                                    onClick={(e) => {
                                      e.target.select();
                                      navigator.clipboard.writeText(e.target.value);
                                      showToast("Referral link copied to clipboard!");
                                    }}
                                    placeholder="Referral link will appear here"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden">
                <div className="p-4 space-y-4">
                  {filteredJobs.map((job) => (
                    <div key={job.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 text-sm">{job.title}</h3>
                          <p className="text-xs text-gray-500 mt-1">{job.experience_years} years experience</p>
                          {job.location && (
                            <p className="text-xs text-gray-500">{job.location}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          {job.publish_status?.trim() === "Published" ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <FiPlay className="mr-1" size={8} />
                              Published
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <FiPause className="mr-1" size={8} />
                              Draft
                            </span>
                          )}
                          {job.status === "Inactive" && (
                            <span className="text-xs text-red-600 font-medium">closed</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                        <div>
                          <span className="text-gray-500">Department:</span>
                          <div className="mt-1">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {job.department}
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Openings:</span>
                          <p className="font-medium text-gray-900 mt-1">{job.openings}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Type:</span>
                          <p className="font-medium text-gray-900 mt-1">{job.job_type || 'Full-time'}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => openView(job)}
                          className="flex items-center px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <FiEye size={12} className="mr-1" />
                          View
                        </button>

                        {hasPermission('edit_job_requisition') && (
                          <button
                            onClick={() => openEdit(job)}
                            className="flex items-center px-3 py-1.5 text-xs bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors"
                          >
                            <FiEdit size={12} className="mr-1" />
                            Edit
                          </button>
                        )}

                        {canViewCandidates && (
                          <button
                            onClick={() => window.location.href = `/screening?job=${job.id}`}
                            className="flex items-center px-3 py-1.5 text-xs bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors"
                          >
                            <FiUsers size={12} className="mr-1" />
                            Candidates
                          </button>
                        )}

                        {canGenerateLinks && (
                          <div className="relative link-dropdown">
                            <button
                              onClick={() =>
                                setOpenLinkMenu(openLinkMenu === job.id ? null : job.id)
                              }
                              className="flex items-center px-3 py-1.5 text-xs bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                            >
                              <FiLink size={12} className="mr-1" />
                              Links
                            </button>

                            {openLinkMenu === job.id && (
                              <div className="absolute left-0 mt-2 w-64 bg-white border border-black rounded-xl shadow-lg z-50">
                                <button
                                  className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm border-b border-gray-200"
                                  onClick={() => {
                                    const publicLink = `${window.location.origin}/apply/${job.id}`;
                                    setGeneratedLinks(prev => ({
                                      ...prev,
                                      [job.id]: { ...prev[job.id], public: publicLink }
                                    }));
                                    showToast("Public job link generated");
                                  }}
                                >
                                  🌍 Generate Public Link
                                </button>

                                {employeeCode && (
                                  <button
                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm"
                                    onClick={() => {
                                      const referralLink = `${window.location.origin}/apply/${job.id}?ref=${employeeCode}`;
                                      setGeneratedLinks(prev => ({
                                        ...prev,
                                        [job.id]: { ...prev[job.id], referral: referralLink }
                                      }));
                                      showToast("Referral link generated");
                                    }}
                                  >
                                    👤 Generate My Referral Link
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {canPublishJobs && (
                          <button
                            onClick={() => togglePublish(job)}
                            className={`flex items-center px-3 py-1.5 text-xs rounded-lg transition-colors ${
                              job.publish_status?.trim() === "Published"
                                ? "bg-red-50 text-red-600 hover:bg-red-100"
                                : "bg-green-50 text-green-600 hover:bg-green-100"
                            }`}
                          >
                            {job.publish_status?.trim() === "Published" ? (
                              <>
                                <FiPause size={12} className="mr-1" />
                                Unpublish
                              </>
                            ) : (
                              <>
                                <FiPlay size={12} className="mr-1" />
                                Publish
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      
                      {generatedLinks[job.id] && (
                        <div className="mt-3 space-y-2 pt-3 border-t border-gray-100">
                          {generatedLinks[job.id]?.public && (
                            <div>
                              <label className="text-xs text-gray-600 font-medium">Public Link:</label>
                              <input
                                type="text"
                                value={generatedLinks[job.id].public}
                                readOnly
                                className="w-full text-xs border p-2 rounded bg-gray-50 focus:outline-none cursor-pointer mt-1"
                                onClick={(e) => {
                                  e.target.select();
                                  navigator.clipboard.writeText(e.target.value);
                                  showToast("Public link copied to clipboard!");
                                }}
                                placeholder="Public link will appear here"
                              />
                            </div>
                          )}
                          {generatedLinks[job.id]?.referral && (
                            <div>
                              <label className="text-xs text-gray-600 font-medium">Referral Link:</label>
                              <input
                                type="text"
                                value={generatedLinks[job.id].referral}
                                readOnly
                                className="w-full text-xs border p-2 rounded bg-gray-50 focus:outline-none cursor-pointer mt-1"
                                onClick={(e) => {
                                  e.target.select();
                                  navigator.clipboard.writeText(e.target.value);
                                  showToast("Referral link copied to clipboard!");
                                }}
                                placeholder="Referral link will appear here"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            </>
          )}
        </div>
        {/* MODAL */}
        {showForm && (
          <JobFormModal
            mode={mode}
            job={selectedJob}
            onClose={() => {
              setShowForm(false);
              fetchJobs();
            }}
          />
        )}
      </div>
      <Toast toast={toast} hideToast={hideToast} />
    </Layout>
  );
}

// JobForm Modal Component
function JobFormModal({ mode, job, onClose }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    title: "",
    department: "",
    hiring_manager: "",
    openings: 1,
    experience_years: 0,
    salary_range: "",
    job_type: "Full-time",
    work_mode: "On-site",
    location: "",
    rounds: 2,
    round_names: [{name: "Technical Round", description: ""}, {name: "HR Round", description: ""}],
    skills: [],
    description: "",
    status: "Draft"
  });
  
  const [activeTab, setActiveTab] = useState('basic');
  
  const [existingJobs, setExistingJobs] = useState([]);
  
  // Fetch existing job titles
  const fetchExistingJobs = async () => {
    try {
      const res = await api.get("/recruitment/list");
      const uniqueTitles = [...new Set(res.data.map(j => j.title))]; // Remove duplicates
      setExistingJobs(uniqueTitles);
    } catch (err) {
      console.error("Failed to load existing jobs");
    }
  };

  useEffect(() => {
    fetchExistingJobs();
    
    if (job && (mode === "edit" || mode === "view")) {
      // Convert round_names from different formats
      const roundNames = job.round_names;
      let convertedRoundNames = [];
      
      if (Array.isArray(roundNames)) {
        // Check if it's already in new format
        if (roundNames[0] && typeof roundNames[0] === 'object' && roundNames[0].name) {
          convertedRoundNames = roundNames;
        } else {
          // Convert from simple array to object array
          convertedRoundNames = roundNames.map(name => ({name, description: ""}));
        }
      } else if (roundNames && typeof roundNames === 'object') {
        // Convert from object format
        convertedRoundNames = Object.values(roundNames).map(name => ({name, description: ""}));
      } else {
        convertedRoundNames = [{name: "Technical Round", description: ""}, {name: "HR Round", description: ""}];
      }
      
      setForm({
        ...job,
        round_names: convertedRoundNames
      });
    }
  }, [job, mode]);

  const handleSubmit = async () => {
    try {
      if (mode === "create") {
        await api.post("/recruitment/create", form);
        showToast("Job created successfully!");
      } else if (mode === "edit") {
        await api.put(`/recruitment/update/${job.id}`, form);
        showToast("Job updated successfully!");
      }
      onClose();
    } catch (err) {
      showToast("Failed to save job", 'error');
    }
  };

  const isView = mode === "view";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white border border-black rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-black">
          <h2 className="text-xl font-semibold text-black">
            {mode === "create" && "Create New Job"}
            {mode === "edit" && "Edit Job"}
            {mode === "view" && "Job Details"}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {mode === "create" && "Fill in the details to create a new job posting"}
            {mode === "edit" && "Update the job information"}
            {mode === "view" && "View job posting details"}
          </p>
        </div>

        {/* Tabs */}
        <div className="px-6 py-3 border-b border-black">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab('basic')}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'basic'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Basic Info
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Job Details
            </button>
            <button
              onClick={() => setActiveTab('rounds')}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'rounds'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Interview Rounds
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">

          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Job Title *</label>
                  <div className="space-y-2">
                    <select
                      value={form.title}
                      onChange={(e) => setForm({...form, title: e.target.value})}
                      disabled={isView}
                      className="w-full bg-white text-black border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select existing job title</option>
                      {existingJobs.map((title, index) => (
                        <option key={index} value={title}>{title}</option>
                      ))}
                    </select>
                    <div className="text-center text-xs text-gray-600">OR</div>
                    <input
                      type="text"
                      placeholder="Enter new job title"
                      value={form.title}
                      onChange={(e) => setForm({...form, title: e.target.value})}
                      disabled={isView}
                      className="w-full bg-white text-black border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Department *</label>
                  <input
                    type="text"
                    placeholder="e.g., Engineering, Marketing"
                    value={form.department}
                    onChange={(e) => setForm({...form, department: e.target.value})}
                    disabled={isView}
                    className="w-full bg-white text-black border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Hiring Manager</label>
                  <input
                    type="text"
                    placeholder="Manager name"
                    value={form.hiring_manager}
                    onChange={(e) => setForm({...form, hiring_manager: e.target.value})}
                    disabled={isView}
                    className="w-full bg-white text-black border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Number of Openings</label>
                  <input
                    type="number"
                    min="1"
                    value={form.openings}
                    onChange={(e) => setForm({...form, openings: parseInt(e.target.value) || 1})}
                    disabled={isView}
                    className="w-full bg-white text-black border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Job Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Experience Years</label>
                  <input
                    type="number"
                    placeholder="e.g., 3"
                    min="0"
                    value={form.experience_years || ''}
                    onChange={(e) => setForm({...form, experience_years: parseInt(e.target.value) || 0})}
                    disabled={isView}
                    className="w-full bg-white text-black border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Salary Range</label>
                  <input
                    type="text"
                    placeholder="e.g., $50,000 - $70,000"
                    value={form.salary_range}
                    onChange={(e) => setForm({...form, salary_range: e.target.value})}
                    disabled={isView}
                    className="w-full bg-white text-black border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Job Type</label>
                  <select
                    value={form.job_type}
                    onChange={(e) => setForm({...form, job_type: e.target.value})}
                    disabled={isView}
                    className="w-full bg-white text-black border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Work Mode</label>
                  <select
                    value={form.work_mode}
                    onChange={(e) => setForm({...form, work_mode: e.target.value})}
                    disabled={isView}
                    className="w-full bg-white text-black border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="On-site">On-site</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-black mb-2">Location</label>
                  <input
                    type="text"
                    placeholder="e.g., New York, NY"
                    value={form.location}
                    onChange={(e) => setForm({...form, location: e.target.value})}
                    disabled={isView}
                    className="w-full bg-white text-black border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-black mb-2">Required Skills</label>
                  <input
                    type="text"
                    placeholder="e.g., React, Node.js, Python (comma-separated)"
                    value={Array.isArray(form.skills) ? form.skills.join(', ') : (form.skills || '')}
                    onChange={(e) => setForm({...form, skills: e.target.value ? e.target.value.split(',').map(s => s.trim()) : []})}
                    disabled={isView}
                    className="w-full bg-white text-black border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black mb-2">Job Description</label>
                <textarea
                  placeholder="Describe the role, responsibilities, and requirements..."
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  disabled={isView}
                  rows={6}
                  className="w-full bg-white text-black border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none placeholder-gray-500"
                />
              </div>
            </div>
          )}

          {/* Interview Rounds Tab */}
          {activeTab === 'rounds' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-black">Interview Rounds</h3>
                  <p className="text-sm text-gray-600">Configure the interview process for this position</p>
                </div>
                {!isView && (
                  <button
                    type="button"
                    onClick={() => {
                      const newRounds = [...(form.round_names || []), {name: "", description: ""}];
                      setForm({...form, round_names: newRounds, rounds: newRounds.length});
                    }}
                    className="px-4 py-2 bg-black text-white border-2 border-black rounded-lg transition-colors flex items-center gap-2 hover:bg-gray-800"
                  >
                    <FiPlus size={16} />
                    Add Round
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                {(form.round_names || []).map((round, index) => (
                  <div key={index} className="border border-black rounded-lg p-4 bg-white">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-black">Round {index + 1}</h4>
                      {!isView && form.round_names.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newRounds = form.round_names.filter((_, i) => i !== index);
                            setForm({...form, round_names: newRounds, rounds: newRounds.length});
                          }}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder={`Round ${index + 1} Name (e.g., Technical Interview)`}
                        value={round.name || ""}
                        onChange={(e) => {
                          const newRounds = [...form.round_names];
                          newRounds[index] = {...newRounds[index], name: e.target.value};
                          setForm({...form, round_names: newRounds});
                        }}
                        disabled={isView}
                        className="w-full bg-white text-black border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                      />
                      <textarea
                        placeholder={`Round ${index + 1} Description (e.g., Technical skills assessment)`}
                        value={round.description || ""}
                        onChange={(e) => {
                          const newRounds = [...form.round_names];
                          newRounds[index] = {...newRounds[index], description: e.target.value};
                          setForm({...form, round_names: newRounds});
                        }}
                        disabled={isView}
                        rows={3}
                        className="w-full bg-white text-black border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none placeholder-gray-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-black flex justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white text-black border border-black rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isView ? 'Close' : 'Cancel'}
          </button>
          {!isView && (
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-black text-white border border-black rounded-lg transition-colors flex items-center gap-2 hover:bg-gray-800"
            >
              {mode === "create" ? (
                <>
                  <FiPlus size={16} />
                  Create Job
                </>
              ) : (
                <>
                  <FiEdit size={16} />
                  Update Job
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}